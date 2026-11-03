import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { getSupabaseAdmin, CrmApiError } from './supabaseAdmin';
import { expiryRange, formatPolicy, isPaired, TELEGRAM_STATE_BUCKET, type TelegramGrant, type TelegramSession, type BotDependencies, type BotAction, type PolicySummary, type BotQuery } from './telegramCore';
import { originalFilename, policyFolder, POLICY_BUCKET } from './policyStorageCore';
import { validatePolicyPdf } from '../policyPdfValidation';
import { expiringLookup, searchLookup, type LookupRow, type LookupSelection } from './telegramLookupCore';

type Admin = ReturnType<typeof getSupabaseAdmin>;
export function telegramState(admin: Admin) {
  const storage = admin.storage.from(TELEGRAM_STATE_BUCKET);
  async function read<T>(path: string): Promise<T | null> {
    const { data, error } = await storage.download(path);
    if (error) {
      if (error.message === 'Object not found' || ('statusCode' in error && String(error.statusCode) === '404')) return null;
      throw new CrmApiError(503, 'Bot erişim deposuna ulaşılamıyor.');
    }
    try { return JSON.parse(await data.text()) as T; } catch { throw new CrmApiError(503, 'Bot erişim kaydı okunamadı.'); }
  }
  async function write(path: string, value: unknown, upsert = true) {
    const { error } = await storage.upload(path, JSON.stringify(value), { contentType: 'application/json', upsert, cacheControl: '0' });
    if (error) throw new CrmApiError(503, 'Bot erişim kaydı kaydedilemedi.');
  }
  const grant = (id: string) => read<TelegramGrant>(`members/${id}/config.json`);
  async function session(id: string, generation: string) {
    const result = await read<TelegramSession>(`members/${id}/sessions/${generation}.json`);
    if (!result) return null;
    return { ...result, revoked: !!await read(`members/${id}/sessions/${generation}.logout.json`) };
  }
  async function revoke(id: string, by: string) {
    const old = await grant(id);
    if (old) await write(`members/${id}/config.json`, { ...old, enabled: false, generation: randomUUID(), codeHash: '', expiresAt: 0, updatedAt: new Date().toISOString(), updatedBy: by });
  }
  return {
    read, write, grant, session, revoke,
    async pair(id: string, generation: string) {
      // Immutable generation record: even a logged-out session cannot reuse its code.
      const { error } = await storage.upload(`members/${id}/sessions/${generation}.json`, JSON.stringify({ generation, pairedAt: new Date().toISOString() }), { contentType: 'application/json', upsert: false, cacheControl: '0' });
      if (error && !('statusCode' in error && String(error.statusCode) === '409')) throw new CrmApiError(503, 'Eşleştirme kaydedilemedi.');
    },
    async logout(id: string, generation: string) { await write(`members/${id}/sessions/${generation}.logout.json`, { at: new Date().toISOString() }); },
    async list() {
      const { data, error } = await storage.list('members', { limit: 201, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw new CrmApiError(503, 'Bot kullanıcıları listelenemedi. Önce bot deposunu kurun.');
      if (data.length > 200) throw new CrmApiError(503, 'Bot kullanıcı listesi yönetim sınırına ulaştı.');
      return (await Promise.all(data.filter(entry => /^[1-9]\d{0,15}$/.test(entry.name)).map(async entry => {
        const item = await grant(entry.name);
        if (!item) return null;
        const paired = item.enabled ? await session(item.telegramId, item.generation) : null;
        return { telegramId: item.telegramId, label: item.label, enabled: item.enabled, paired: !!paired && !paired.revoked, expired: item.expiresAt <= Date.now(), expiresAt: item.expiresAt, updatedAt: item.updatedAt };
      }))).filter(item => item !== null);
    },
  };
}

export function telegramConfigured() {
  return !!process.env.TELEGRAM_BOT_TOKEN && /^[A-Za-z0-9_-]{32,256}$/.test(process.env.TELEGRAM_WEBHOOK_SECRET || '');
}
export async function telegramApi(method: 'sendMessage' | 'sendDocument' | 'answerCallbackQuery' | 'getMe' | 'getWebhookInfo', body: Record<string, unknown> | FormData = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new CrmApiError(503, 'Bot anahtarı sunucuda tanımlanmamış.');
  // Never expose the token-bearing URL or Telegram's raw response errors.
  try {
    const form = body instanceof FormData;
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: form ? undefined : { 'Content-Type': 'application/json' }, body: form ? body : JSON.stringify(body), signal: AbortSignal.timeout(method === 'sendDocument' ? 25000 : 8000), cache: 'no-store' });
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error();
    return result.result;
  } catch { throw new CrmApiError(502, 'Telegram bağlantısı tamamlanamadı.'); }
}
export function botDependencies(admin: Admin): BotDependencies {
  const state = telegramState(admin);
  const keyboard = { keyboard: [[{ text: 'Poliçe sorgula' }], [{ text: 'Bitişi yaklaşan poliçeler' }], [{ text: 'Yardım' }, { text: 'Erişimi kapat' }]], resize_keyboard: true, is_persistent: true };
  async function allowed(id: string, generation: string) { return isPaired(await state.grant(id), await state.session(id, generation)); }
  async function send(id: string, text: string, replyMarkup: unknown = keyboard) {
    await telegramApi('sendMessage', { chat_id: id, text, protect_content: true, link_preview_options: { is_disabled: true }, reply_markup: replyMarkup });
  }
  async function actionButton(action: BotAction, text: string) {
    const key = randomBytes(24).toString('base64url');
    await state.write(`actions/${key}.json`, action, false);
    return { text, callback_data: `act:${key}` };
  }
  async function indexTable(table: 'policies' | 'customers', columns: string) {
    const rows: LookupRow[] = [];
    for (let offset = 0; offset <= 50000; offset += 1000) {
      const result = await admin.from(table).select(columns).order('id', { ascending: true }).range(offset, offset + 999);
      if (result.error) throw new CrmApiError(503, 'Sorgu kayıtları okunamadı.');
      if (offset === 50000 && result.data.length) throw new CrmApiError(503, 'Sorgu dizini kapasitesi aşıldı. Yöneticiyle görüşün.');
      rows.push(...result.data as unknown as LookupRow[]);
      if (result.data.length < 1000) return rows;
    }
    throw new CrmApiError(503, 'Sorgu tamamlanamadı.');
  }
  async function loadIndex() {
    const [policies, customers] = await Promise.all([
      indexTable('policies', 'id,policy_no,customer_id,customer_name,customer_tc,end_date'),
      indexTable('customers', 'id,name,identity_no'),
    ]);
    return { policies, customers };
  }
  async function materialize(selections: LookupSelection[]) {
    const ids = selections.filter(s => s.kind === 'policy').map(s => s.id);
    const customerIds = [...new Set(selections.map(s => s.customerId).filter((id): id is string => !!id))];
    const [policies, customers] = await Promise.all([
      ids.length ? admin.from('policies').select('*').in('id', ids) : Promise.resolve({ data: [], error: null }),
      customerIds.length ? admin.from('customers').select('*').in('id', customerIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (policies.error || customers.error) throw new CrmApiError(503, 'Kayıt ayrıntıları okunamadı.');
    const policyMap = new Map((policies.data as LookupRow[]).map(p => [String(p.id), p]));
    const customerMap = new Map((customers.data as LookupRow[]).map(c => [String(c.id), c]));
    const rows: PolicySummary[] = [];
    for (const selected of selections) {
      const customer = selected.customerId ? customerMap.get(selected.customerId) || null : null;
      if (selected.kind === 'customer') {
        if (customer) rows.push({ id: 'customer:' + selected.id, record_kind: 'customer', policy_no: null, customer_name: String(customer.name || ''), type: null, company: null, end_date: null, customer });
      } else {
        const policy = policyMap.get(selected.id);
        if (policy) rows.push({ ...policy, id: String(policy.id), policy_no: policy.policy_no == null ? null : String(policy.policy_no), customer_name: policy.customer_name == null ? null : String(policy.customer_name), type: policy.type == null ? null : String(policy.type), company: policy.company == null ? null : String(policy.company), end_date: policy.end_date == null ? null : String(policy.end_date), customer });
      }
    }
    return rows;
  }
  return {
    ...state,
    action: (key: string) => state.read<BotAction>(`actions/${key}.json`),
    async ack(callbackId) { await telegramApi('answerCallbackQuery', { callback_query_id: callbackId }); },
    async search(term, offset) {
      const index = await loadIndex();
      return materialize(searchLookup(index.policies, index.customers, term).slice(offset, offset + 6));
    },
    async expiring(offset) {
      const { first, last } = expiryRange();
      const index = await loadIndex();
      return materialize(expiringLookup(index.policies, index.customers, first, last).slice(offset, offset + 6));
    },
    send,
    async results(id: string, rows: PolicySummary[], query: BotQuery, generation: string) {
      if (!await allowed(id, generation)) return;
      if (!rows.length) { await send(id, 'Eşleşen müşteri veya poliçe bulunamadı. TC/VKN, ad soyad veya poliçe numarasını kontrol et.'); return; }
      const expiresAt = Date.now() + 30 * 60_000;
      for (const policy of rows.slice(0, 5)) {
        if (!await allowed(id, generation)) return;
        const chunks = formatPolicy(policy);
        const pdf = policy.record_kind === 'customer' ? null : await actionButton({ kind: 'pdf', telegramId: id, generation, expiresAt, policyId: String(policy.id) }, 'PDF gönder');
        for (let i = 0; i < chunks.length; i++) {
          if (!await allowed(id, generation)) return;
          await send(id, chunks[i], pdf && i === chunks.length - 1 ? { inline_keyboard: [[pdf]] } : keyboard);
        }
      }
      if (rows.length > 5 && await allowed(id, generation)) {
        const next = await actionButton({ kind: 'page', telegramId: id, generation, expiresAt, query: { ...query, offset: query.offset + 5 } }, 'Sonraki 5 poliçe');
        await send(id, 'Diğer kayıtlar için devam et.', { inline_keyboard: [[next]] });
      }
    },
    async pdf(id, policyId, generation) {
      if (!await allowed(id, generation)) return;
      const { data: policy, error: policyError } = await admin.from('policies').select('id').eq('id', policyId).maybeSingle();
      if (policyError) throw new CrmApiError(503, 'Poliçe doğrulanamadı.');
      if (!policy) { await send(id, 'Poliçe kaydı artık bulunmuyor.'); return; }
      const folder = policyFolder(policyId);
      const { data: files, error } = await admin.storage.from(POLICY_BUCKET).list(folder, { limit: 1, sortBy: { column: 'name', order: 'desc' } });
      if (error) throw new CrmApiError(503, 'PDF deposuna ulaşılamıyor.');
      const file = files?.[0]; const name = file && originalFilename(file.name);
      if (!file || !name || file.name.endsWith('.deleted.json')) { await send(id, 'Bu poliçeye ait kayıtlı bulut PDF’si yok. Önce CRM’de poliçeye PDF yükleyin.'); return; }
      const downloaded = await admin.storage.from(POLICY_BUCKET).download(`${folder}/${file.name}`);
      if (downloaded.error) throw new CrmApiError(503, 'PDF okunamadı.');
      const document = new File([downloaded.data], name, { type: 'application/pdf' });
      await validatePolicyPdf(document);
      if (!await allowed(id, generation)) return;
      const form = new FormData(); form.set('chat_id', id); form.set('protect_content', 'true'); form.set('document', document, name);
      await telegramApi('sendDocument', form);
    },
  };
}
