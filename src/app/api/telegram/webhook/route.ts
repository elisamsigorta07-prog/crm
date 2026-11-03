import { apiError, consumeRateLimit, CrmApiError, getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { readJson } from '@/lib/server/securityCore';
import { handleBotUpdate, privateMessage, safeEqual } from '@/lib/server/telegramCore';
import { botDependencies, telegramConfigured } from '@/lib/server/telegramBot';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!telegramConfigured()) return Response.json({ error: 'Bot henüz yapılandırılmamış.' }, { status: 503 });
  const supplied = request.headers.get('x-telegram-bot-api-secret-token') || '';
  if (!safeEqual(supplied, process.env.TELEGRAM_WEBHOOK_SECRET!)) return Response.json({ error: 'Yetkisiz istek.' }, { status: 401 });
  try {
    const update = await readJson(request, 16384);
    // Groups, forwarded messages, bot senders and malformed identities never reach CRM data.
    const message = privateMessage(update);
    if (message) {
      const admin = getSupabaseAdmin();
      await consumeRateLimit(admin, 'telegram:' + message.id, 30);
      const deps = botDependencies(admin);
      try { await handleBotUpdate(update, deps); }
      catch (error) {
        // Return useful feedback without sending raw DB/Telegram errors or retrying
        // a successful earlier result as an endless Telegram delivery loop.
        if (error instanceof CrmApiError && error.status === 400) await deps.send(message.id, 'Çok fazla kişi eşleşti. Tam ad soyad, TC veya tam poliçe numarasıyla yeniden dene.');
        else if (error instanceof CrmApiError && error.status === 503) await deps.send(message.id, 'Kayıtlara şu an ulaşılamıyor. Biraz sonra yeniden dene.');
        else throw error;
      }
    }
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
