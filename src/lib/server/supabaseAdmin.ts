import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { isCrmStaff, type CrmScope } from '../crmAccess.ts';
import { rateLimitKey, sameOrigin } from './securityCore.ts';
import { claimStorageRateSlot } from './storageRateLimitCore.ts';

export class CrmApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new CrmApiError(503, 'Sunucu Supabase bağlantısı yapılandırılmamış.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function consumeRateLimit(admin: ReturnType<typeof getSupabaseAdmin>, identity: string, limit = 120, seconds = 60) {
  const key = rateLimitKey(identity, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await admin.rpc('crm_consume_rate_limit', { p_key: key, p_limit: limit, p_seconds: seconds });
  if (error?.code === 'PGRST202') {
    let allowed: boolean;
    try { allowed = await claimStorageRateSlot(admin.storage.from('telegram-bot-state'), key, limit, seconds); }
    catch { throw new CrmApiError(503, 'İstek sınırı kontrol edilemedi. Daha sonra tekrar deneyin.'); }
    if (!allowed) throw new CrmApiError(429, 'Çok fazla istek gönderildi. Bir dakika sonra tekrar deneyin.');
    return;
  }
  if (error) throw new CrmApiError(503, 'Sunucu güvenlik kurulumu tamamlanmamış veya geçici olarak erişilemiyor.');
  if (data !== true) throw new CrmApiError(429, 'Çok fazla istek gönderildi. Bir dakika sonra tekrar deneyin.');
}
export async function requireCrmStaff(request: Request, scope: CrmScope = 'insurance') {
  if (!sameOrigin(request)) throw new CrmApiError(403, 'Bu kaynaktan işlem yapılamaz.');
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new CrmApiError(401, 'PDF deposu için gerçek CRM oturumu açın.');
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new CrmApiError(401, 'Oturumunuz bitmiş; yeniden giriş yapın.');
  if (!isCrmStaff(data.user, scope)) throw new CrmApiError(403, 'Bu hesabın CRM erişim yetkisi yok.');
  await consumeRateLimit(admin, 'crm:' + data.user.id);
  return { admin, user: data.user };
}
export function apiError(error: unknown) {
  const status = error instanceof CrmApiError ? error.status : error instanceof RangeError ? 413 : error instanceof SyntaxError ? 400 : 500;
  return Response.json({ error: error instanceof CrmApiError ? error.message : status === 413 ? 'İstek çok büyük.' : status === 400 ? 'Geçersiz istek.' : 'İşlem tamamlanamadı. Lütfen tekrar deneyin.' }, { status, headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '60' } : {}) } });
}
