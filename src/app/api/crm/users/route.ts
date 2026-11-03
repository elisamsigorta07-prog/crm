import { isCrmAdmin } from '@/lib/crmAccess';
import { apiError, consumeRateLimit, CrmApiError, requireCrmStaff } from '@/lib/server/supabaseAdmin';
import { readJson } from '@/lib/server/securityCore';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store' };
async function context(request: Request) {
  const result = await requireCrmStaff(request);
  if (!isCrmAdmin(result.user)) throw new CrmApiError(403, 'Kullanıcıları yalnızca yönetici yönetebilir.');
  return result;
}
export async function GET(request: Request) {
  try {
    const { admin } = await context(request);
    const page = Number(new URL(request.url).searchParams.get('page') || 1);
    if (!Number.isInteger(page) || page < 1 || page > 10000) throw new CrmApiError(400, 'Geçersiz sayfa.');
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new CrmApiError(503, 'Kullanıcılar listelenemedi.');
    return Response.json({ users: data.users.filter(u => u.app_metadata.crm_workspace === 'elisam').map(u => ({ id: u.id, email: u.email, role: u.app_metadata.crm_role, scopes: u.app_metadata.crm_role === 'admin' ? ['insurance', 'rent'] : u.app_metadata.crm_scopes || ['insurance'], disabled: u.app_metadata.crm_disabled === true, mfa: u.factors?.some(f => f.status === 'verified') || false })), nextPage: data.users.length === 100 ? page + 1 : null }, { headers });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const { admin, user } = await context(request);
    await consumeRateLimit(admin, 'user-management:' + user.id, 10);
    const body = await readJson(request, 4096);
    if (body.action === 'disable') {
      if (typeof body.userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.userId) || body.userId === user.id) throw new CrmApiError(400, 'Kendi hesabınızı bu ekrandan kapatamazsınız.');
      const target = await admin.auth.admin.getUserById(body.userId);
      if (target.error || target.data.user.app_metadata.crm_workspace !== 'elisam') throw new CrmApiError(404, 'CRM hesabı bulunamadı.');
      const result = await admin.auth.admin.updateUserById(body.userId, { app_metadata: { ...target.data.user.app_metadata, crm_disabled: true, crm_staff: false }, ban_duration: '876000h' });
      if (result.error) throw new CrmApiError(503, 'Hesap kapatılamadı.');
      return Response.json({ disabled: true }, { headers });
    }
    if (body.action !== 'create' || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254) throw new CrmApiError(400, 'Geçerli bir e-posta adresi girin.');
    if (typeof body.password !== 'string' || body.password.length < 14 || body.password.length > 128) throw new CrmApiError(400, 'Şifre 14–128 karakter olmalı.');
    if (!Array.isArray(body.scopes) || body.scopes.length < 1 || body.scopes.length > 2 || !body.scopes.every(s => s === 'insurance' || s === 'rent')) throw new CrmApiError(400, 'En az bir panel yetkisi seçin.');
    const result = await admin.auth.admin.createUser({ email: body.email.trim().toLowerCase(), password: body.password, email_confirm: true, app_metadata: { crm_workspace: 'elisam', crm_staff: true, crm_role: 'staff', crm_scopes: [...new Set(body.scopes)], crm_disabled: false } });
    if (result.error) throw new CrmApiError(400, 'Hesap oluşturulamadı. E-posta kayıtlı olabilir veya şifre kabul edilmemiş olabilir.');
    return Response.json({ created: true }, { status: 201, headers });
  } catch (error) { return apiError(error); }
}
