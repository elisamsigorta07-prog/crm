import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

export const TELEGRAM_STATE_BUCKET = 'telegram-bot-state';
export type TelegramGrant = { telegramId: string; label: string; enabled: boolean; generation: string; codeHash: string; expiresAt: number; updatedAt: string; updatedBy: string };
export type TelegramSession = { generation: string; pairedAt: string; revoked?: boolean };
export type PolicySummary = { id: string; policy_no: string | null; customer_name: string | null; type: string | null; company: string | null; end_date: string | null; [key: string]: unknown };
export type BotQuery = { kind: 'search' | 'expiring'; term: string; offset: number };
export type BotAction = { telegramId: string; generation: string; expiresAt: number } & ({ kind: 'pdf'; policyId: string } | { kind: 'page'; query: BotQuery });
export function telegramId(value: unknown): string {
  const text = typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : value;
  if (typeof text !== 'string' || !/^[1-9]\d{0,15}$/.test(text) || !Number.isSafeInteger(Number(text))) throw new Error('Geçerli bir Telegram kullanıcı kimliği girin.');
  return text;
}
export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function codeHash(code: string) { return createHash('sha256').update(code).digest('hex'); }
export function makeGrant(id: unknown, label: unknown, adminId: string, now = Date.now()) {
  if (typeof label !== 'string' || !label.trim() || label.length > 80 || /[\u0000-\u001f]/.test(label)) throw new Error('Kişi adı 1–80 karakter olmalı.');
  const code = randomBytes(24).toString('base64url');
  const grant: TelegramGrant = { telegramId: telegramId(id), label: label.trim(), enabled: true, generation: randomUUID(), codeHash: codeHash(code), expiresAt: now + 10 * 60_000, updatedAt: new Date(now).toISOString(), updatedBy: adminId };
  return { grant, code };
}
export function validPairing(grant: TelegramGrant | null, id: string, code: string, now = Date.now()) {
  return !!grant && grant.telegramId === id && grant.enabled && grant.expiresAt > now && /^[A-Za-z0-9_-]{32}$/.test(code) && safeEqual(codeHash(code), grant.codeHash);
}
export function isPaired(grant: TelegramGrant | null, session: TelegramSession | null) {
  return !!grant?.enabled && !!session && !session.revoked && session.generation === grant.generation;
}
export function privateMessage(update: unknown): { updateId: string; id: string; text: string; callbackId?: string } | null {
  if (!update || typeof update !== 'object') return null;
  const u = update as { update_id?: unknown; callback_query?: { id?: unknown; data?: unknown; from?: { id?: unknown; is_bot?: unknown }; message?: { chat?: { id?: unknown; type?: unknown } } }; message?: { text?: unknown; from?: { id?: unknown; is_bot?: unknown }; chat?: { id?: unknown; type?: unknown }; date?: unknown; forward_origin?: unknown; via_bot?: unknown } };
  const cb = u.callback_query;
  if (Number.isSafeInteger(u.update_id) && Number(u.update_id) >= 0 && cb?.message?.chat?.type === 'private' && cb.from?.is_bot === false && typeof cb.id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(cb.id) && typeof cb.data === 'string' && /^act:[A-Za-z0-9_-]{32}$/.test(cb.data)) {
    try { const id = telegramId(cb.from.id); if (telegramId(cb.message.chat.id) === id) return { id, updateId: String(u.update_id), text: cb.data, callbackId: cb.id }; } catch { return null; }
  }
  const m = u.message;
  if (!Number.isSafeInteger(u.update_id) || Number(u.update_id) < 0 || !m || m.chat?.type !== 'private' || m.from?.is_bot !== false || m.forward_origin || m.via_bot || typeof m.text !== 'string' || m.text.length > 300) return null;
  try {
    const id = telegramId(m.from.id);
    if (telegramId(m.chat.id) !== id) return null;
    return { updateId: String(u.update_id), id, text: m.text.trim() };
  } catch { return null; }
}
export function command(text: string) {
  const match = /^(\/[a-z_]+)(?:@[A-Za-z0-9_]+)?(?:\s+([\s\S]*))?$/i.exec(text);
  return { name: match?.[1].toLowerCase() || '', argument: match?.[2]?.trim() || '' };
}
export function searchTerm(value: string) {
  // No PostgREST filter operators or SQL wildcards from chat input.
  if (value.length < 3 || value.length > 60 || !/^[\p{L}\p{N} './-]+$/u.test(value)) throw new Error('En az 3 karakterli bir TC, ad veya poliçe numarası yazın.');
  return value;
}
export function istanbulDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function expiryRange(now = new Date()) {
  const first = istanbulDate(now);
  const end = new Date(first + 'T12:00:00Z');
  const day = end.getUTCDate(); end.setUTCDate(1); end.setUTCMonth(end.getUTCMonth() + 3);
  const max = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, max));
  return { first, last: end.toISOString().slice(0, 10) };
}
function clean(value: unknown) { return String(value ?? '—').replace(/[\u0000-\u0008\u000b-\u001f\u202a-\u202e\u2066-\u2069]/g, ' '); }
const policyLabels: Record<string, string> = { policy_no: 'Poliçe no', customer_name: 'Ad soyad / unvan', customer_tc: 'TC / VKN', customer_phone: 'Telefon', type: 'Sigorta türü', company: 'Sigorta şirketi', start_date: 'Başlangıç', end_date: 'Bitiş', premium: 'Brüt prim', net_premium: 'Net prim', paid_amount: 'Ödenen', remaining_amount: 'Kalan', payment_type: 'Ödeme tipi', installment_count: 'Taksit sayısı', commission_rate: 'Komisyon oranı', payment_status: 'Ödeme durumu', status: 'Poliçe durumu', plate: 'Plaka', document_serial: 'Belge seri', vehicle_usage: 'Araç kullanımı', vehicle_brand: 'Marka', vehicle_type: 'Model', vehicle_model_year: 'Model yılı', reference: 'Referans', notes: 'Notlar' };
export function formatPolicy(row: PolicySummary) {
  const lines = Object.entries(row).filter(([key, value]) => !['id', 'customer_id', 'created_at', 'updated_at', 'customer'].includes(key) && value !== null && value !== '').map(([key, value]) => `${policyLabels[key] || key}: ${clean(typeof value === 'object' ? JSON.stringify(value) : value)}`);
  const customer = row.customer;
  if (customer && typeof customer === 'object') {
    const labels: Record<string, string> = { name: 'Ad soyad', identity_no: 'TC / VKN', phone: 'Telefon', email: 'E-posta', address: 'Adres', birth_date: 'Doğum tarihi', reference: 'Referans', notes: 'Müşteri notları' };
    lines.push('\nMüşteri kartı');
    for (const [key, value] of Object.entries(customer)) if (!['id', 'created_at', 'updated_at'].includes(key) && value !== null && value !== '') lines.push(`${labels[key] || key}: ${clean(typeof value === 'object' ? JSON.stringify(value) : value)}`);
  }
  // Stay below Telegram's message limit, preserving every chunk rather than truncating.
  const text = lines.join('\n'); const chunks: string[] = []; let chunk = '';
  for (const char of text) { if (chunk.length + char.length > 3400) { chunks.push(chunk); chunk = ''; } chunk += char; }
  if (chunk) chunks.push(chunk);
  return chunks.length ? chunks : ['Poliçe ayrıntısı bulunamadı.'];
}

export type BotDependencies = {
  grant(id: string): Promise<TelegramGrant | null>;
  session(id: string, generation: string): Promise<TelegramSession | null>;
  pair(id: string, generation: string): Promise<void>;
  logout(id: string, generation: string): Promise<void>;
  search(term: string, offset: number): Promise<PolicySummary[]>;
  expiring(offset: number): Promise<PolicySummary[]>;
  results(id: string, rows: PolicySummary[], query: BotQuery, generation: string): Promise<void>;
  action(key: string): Promise<BotAction | null>;
  pdf(id: string, policyId: string, generation: string): Promise<void>;
  ack(callbackId: string): Promise<void>;
  send(id: string, text: string): Promise<void>;
};
export const BOT_HELP = 'Poliçe sorgula: TC, ad soyad veya poliçe numarası yaz.\nBitişi yaklaşan poliçeler: bugünden itibaren 3 takvim ayı.\nSonuçlarda PDF gönder butonuyla kayıtlı belgeyi al.\n/cikis — erişimi kapat\n/kimlik — Telegram kimliğin';
export async function handleBotUpdate(update: unknown, deps: BotDependencies) {
  const message = privateMessage(update);
  if (!message) return;
  const { id, text } = message; const { name, argument } = command(text);
  if (message.callbackId) await deps.ack(message.callbackId);
  if (name === '/kimlik') { await deps.send(id, `Telegram kullanıcı kimliğin: ${id}\nBu kimliği CRM yöneticine ilet. Kimlik tek başına erişim vermez.`); return; }
  const grant = await deps.grant(id);
  if (name === '/eslestir' && validPairing(grant, id, argument)) {
    const session = await deps.session(id, grant!.generation);
    if (session) { await deps.send(id, 'Bu eşleştirme kodu daha önce kullanıldı. Yeni kod için yöneticiyle görüş.'); return; }
    await deps.pair(id, grant!.generation);
    // Re-read after pairing: a concurrent revoke or new code must win.
    const current = await deps.grant(id);
    if (!isPaired(current, { generation: grant!.generation, pairedAt: '' })) { await deps.send(id, 'Eşleştirme iptal edilmiş. Yöneticiyle görüş.'); return; }
    await deps.send(id, 'Hesabın eşleştirildi.\n' + BOT_HELP); return;
  }
  const session = grant?.enabled ? await deps.session(id, grant.generation) : null;
  if (!isPaired(grant, session)) { await deps.send(id, 'Erişim yetkin yok veya eşleştirme kodun geçersiz. /kimlik ile kimliğini öğren; yöneticinden kişisel kod iste. Ardından /eslestir KOD yaz. CRM şifreni bu sohbete yazma.'); return; }
  if (name === '/cikis' || text === 'Erişimi kapat') { await deps.logout(id, grant!.generation); await deps.send(id, 'Bot erişimin kapatıldı. Tekrar erişmek için yöneticinden yeni eşleştirme kodu iste.'); return; }
  let query: BotQuery | null = null;
  if (message.callbackId) {
    const action = await deps.action(text.slice(4));
    if (!action || action.telegramId !== id || action.generation !== grant!.generation || action.expiresAt <= Date.now()) { await deps.send(id, 'Butonun süresi dolmuş veya bu hesaba ait değil. Yeniden sorgulama yap.'); return; }
    if (action.kind === 'pdf') { await deps.pdf(id, action.policyId, grant!.generation); return; }
    query = action.query;
  } else if (text === 'Poliçe sorgula' || (name === '/ara' && !argument)) {
    await deps.send(id, 'TC kimlik numarası, ad soyad veya poliçe numarasını yaz. Eşleşen kişilerin sistemdeki poliçelerini ve müşteri bilgilerini getireceğim.'); return;
  } else if (name === '/bitenler' || text === 'Bitişi yaklaşan poliçeler') {
    query = { kind: 'expiring', term: '', offset: 0 };
  } else if (name === '/ara' || !name) {
    let term: string;
    if (text === 'Yardım') { await deps.send(id, BOT_HELP); return; }
    try { term = searchTerm(name === '/ara' ? argument : text); } catch { await deps.send(id, 'TC, ad soyad veya poliçe numarası yaz (3–60 karakter).'); return; }
    query = { kind: 'search', term, offset: 0 };
  }
  if (query) {
    const rows = query.kind === 'search' ? await deps.search(query.term, query.offset) : await deps.expiring(query.offset);
    if (!isPaired(await deps.grant(id), await deps.session(id, grant!.generation))) return;
    await deps.results(id, rows, query, grant!.generation); return;
  }
  await deps.send(id, BOT_HELP);
}
