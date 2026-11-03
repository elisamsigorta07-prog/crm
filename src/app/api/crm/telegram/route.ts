import { isCrmAdmin } from '@/lib/crmAccess';
import { apiError, CrmApiError, requireCrmStaff } from '@/lib/server/supabaseAdmin';
import { makeGrant, telegramId } from '@/lib/server/telegramCore';
import { telegramApi, telegramConfigured, telegramState } from '@/lib/server/telegramBot';
import { readJson } from '@/lib/server/securityCore';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store' };
async function context(request: Request) {
  const result = await requireCrmStaff(request);
  if (!isCrmAdmin(result.user)) throw new CrmApiError(403, 'Bot yetkilerini yalnızca yönetici değiştirebilir.');
  return { ...result, state: telegramState(result.admin) };
}
export async function GET(request: Request) {
  try {
    const { state } = await context(request);
    const members = await state.list();
    let bot: { username?: string; webhookSet: boolean } | null = null;
    let connectionError = '';
    if (telegramConfigured()) {
      try {
        const [me, hook] = await Promise.all([telegramApi('getMe'), telegramApi('getWebhookInfo')]);
        const expected = process.env.TELEGRAM_WEBHOOK_URL;
        bot = { username: me.username, webhookSet: !!expected && hook.url === expected };
      } catch { connectionError = 'Telegram bağlantısı doğrulanamadı.'; }
    }
    return Response.json({ configured: telegramConfigured(), bot, connectionError, members }, { headers });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const { state, user } = await context(request);
    const body = await readJson(request, 2048);
    let id: string;
    try { id = telegramId(body.telegramId); } catch { throw new CrmApiError(400, 'Geçerli bir Telegram kullanıcı kimliği girin.'); }
    if (body.action === 'revoke') {
      await state.revoke(id, user.id);
      return Response.json({ revoked: true }, { headers });
    }
    if (body.action !== 'invite') throw new CrmApiError(400, 'Geçersiz işlem.');
    let invitation;
    try { invitation = makeGrant(id, body.label, user.id); } catch { throw new CrmApiError(400, 'Geçerli bir kişi adı girin.'); }
    await state.write(`members/${id}/config.json`, invitation.grant);
    return Response.json({ code: invitation.code, expiresAt: invitation.grant.expiresAt }, { headers });
  } catch (error) { return apiError(error); }
}
