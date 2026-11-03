import { randomUUID } from 'node:crypto';
import { apiError, CrmApiError, requireCrmStaff } from '@/lib/server/supabaseAdmin';
import { POLICY_BUCKET, originalFilename, policyFolder, signUploadTicket, validatePolicyId, validateUploadInfo, verifyUploadTicket, versionName } from '@/lib/server/policyStorageCore';
import { validatePolicyPdf } from '@/lib/policyPdfValidation';
import { readJson } from '@/lib/server/securityCore';

export const runtime = 'nodejs';
const noStore = { 'Cache-Control': 'no-store' };
type Admin = ReturnType<typeof import('@/lib/server/supabaseAdmin').getSupabaseAdmin>;
function requestPolicyId(value: unknown) {
  try { return validatePolicyId(value); } catch { throw new CrmApiError(400, 'Geçersiz poliçe kimliği.'); }
}

async function requirePolicy(admin: Admin, policyId: string) {
  const { data, error } = await admin.from('policies').select('id').eq('id', policyId).maybeSingle();
  if (error) throw new CrmApiError(503, 'Poliçe kaydı kontrol edilemedi.');
  if (!data) throw new CrmApiError(404, 'Önce poliçe kaydını kaydedin.');
}
async function currentDocument(admin: Admin, policyId: string) {
  const folder = policyFolder(policyId);
  const { data, error } = await admin.storage.from(POLICY_BUCKET).list(folder, { limit: 1, sortBy: { column: 'name', order: 'desc' } });
  if (error) throw new CrmApiError(503, 'Özel PDF deposuna erişilemiyor.');
  const entry = data?.[0];
  if (!entry) return { document: null, revision: null };
  if (entry.name.endsWith('.deleted.json')) return { document: null, revision: entry.name };
  const filename = originalFilename(entry.name);
  if (!filename) throw new CrmApiError(500, 'PDF kaydının biçimi tanınamadı.');
  return { document: { policyId, name: filename, size: Number(entry.metadata?.size || 0), path: `${folder}/${entry.name}`, updatedAt: entry.created_at || '', storage: 'cloud' as const, revision: entry.name }, revision: entry.name };
}
async function jsonBody(request: Request) {
  return readJson(request);
}

export async function GET(request: Request) {
  try {
    const { admin } = await requireCrmStaff(request);
    const url = new URL(request.url);
    const policyId = requestPolicyId(url.searchParams.get('policyId'));
    await requirePolicy(admin, policyId);
    const current = await currentDocument(admin, policyId);
    if (url.searchParams.get('action') === 'download') {
      if (!current.document) throw new CrmApiError(404, 'Poliçenin bulut PDF eki bulunamadı.');
      const { data, error } = await admin.storage.from(POLICY_BUCKET).createSignedUrl(current.document.path, 60, url.searchParams.get('attachment') === '1' ? { download: current.document.name } : undefined);
      if (error) throw new CrmApiError(503, 'PDF indirme izni oluşturulamadı.');
      return Response.json({ url: data.signedUrl }, { headers: noStore });
    }
    return Response.json(current, { headers: noStore });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { admin, user } = await requireCrmStaff(request);
    const body = await jsonBody(request);
    const policyId = requestPolicyId(body.policyId);
    let info;
    try { info = validateUploadInfo(body.filename, body.size); } catch { throw new CrmApiError(400, 'Geçerli bir PDF adı ve en fazla 20 MB dosya boyutu gerekli.'); }
    const { filename, size } = info;
    await requirePolicy(admin, policyId);
    const current = await currentDocument(admin, policyId);
    const temporaryPath = `incoming/${user.id}/${randomUUID()}.pdf`;
    const { data, error } = await admin.storage.from(POLICY_BUCKET).createSignedUploadUrl(temporaryPath);
    if (error) throw new CrmApiError(503, 'PDF yükleme izni oluşturulamadı.');
    const ticket = signUploadTicket({ purpose: 'policy-upload-v1', userId: user.id, policyId, filename, size, temporaryPath, revision: current.revision, expires: Date.now() + 15 * 60_000 }, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    return Response.json({ path: temporaryPath, token: data.token, ticket }, { headers: noStore });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  let cleanup: { admin: Admin; path: string } | undefined;
  try {
    const { admin, user } = await requireCrmStaff(request);
    const body = await jsonBody(request);
    let ticket;
    try { ticket = verifyUploadTicket(body.ticket, user.id, process.env.SUPABASE_SERVICE_ROLE_KEY!); }
    catch { throw new CrmApiError(400, 'Yükleme izni geçersiz veya süresi dolmuş. PDF’yi yeniden seçin.'); }
    cleanup = { admin, path: ticket.temporaryPath };
    await requirePolicy(admin, ticket.policyId);
    const current = await currentDocument(admin, ticket.policyId);
    if (current.revision !== ticket.revision) throw new CrmApiError(409, 'Bu PDF başka bir işlemde değiştirildi. Sayfayı yenileyip tekrar deneyin.');
    const { data, error } = await admin.storage.from(POLICY_BUCKET).download(ticket.temporaryPath);
    if (error || !data) throw new CrmApiError(400, 'Yüklenen PDF bulunamadı; tekrar deneyin.');
    if (data.size !== ticket.size) throw new CrmApiError(400, 'Yüklenen dosyanın boyutu beklenenle eşleşmiyor.');
    try { await validatePolicyPdf(new File([data], ticket.filename, { type: 'application/pdf' })); }
    catch { throw new CrmApiError(400, 'Yüklenen içerik geçerli bir PDF değil.'); }
    if ((await currentDocument(admin, ticket.policyId)).revision !== ticket.revision) throw new CrmApiError(409, 'Doğrulama sırasında PDF değişti. Yenileyip tekrar deneyin.');
    const finalPath = `${policyFolder(ticket.policyId)}/${versionName(ticket.filename, randomUUID())}`;
    const { error: moveError } = await admin.storage.from(POLICY_BUCKET).move(ticket.temporaryPath, finalPath);
    if (moveError) throw new CrmApiError(503, 'PDF kaydı tamamlanamadı; eski dosya korundu.');
    const revision = finalPath.slice(finalPath.lastIndexOf('/') + 1);
    return Response.json({ document: { policyId: ticket.policyId, name: ticket.filename, size: data.size, path: finalPath, updatedAt: new Date().toISOString(), storage: 'cloud', revision } }, { headers: noStore });
  } catch (error) {
    if (cleanup) await cleanup.admin.storage.from(POLICY_BUCKET).remove([cleanup.path]).catch(() => {});
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { admin, user } = await requireCrmStaff(request);
    const body = await jsonBody(request);
    const policyId = requestPolicyId(body.policyId);
    await requirePolicy(admin, policyId);
    const current = await currentDocument(admin, policyId);
    if (body.revision !== current.revision) throw new CrmApiError(409, 'PDF bu sırada değişti. Yenileyip tekrar deneyin.');
    if (!current.document) return Response.json({ removed: true }, { headers: noStore });
    // Hide the attachment through a versioned marker; retain its previous bytes.
    const marker = `${policyFolder(policyId)}/${String(Date.now()).padStart(13, '0')}-${randomUUID()}.deleted.json`;
    const { error } = await admin.storage.from(POLICY_BUCKET).upload(marker, JSON.stringify({ removedBy: user.id, previousRevision: current.revision }), { contentType: 'application/json', upsert: false });
    if (error) throw new CrmApiError(503, 'PDF eki kaldırılamadı.');
    return Response.json({ removed: true, revision: marker.slice(marker.lastIndexOf('/') + 1) }, { headers: noStore });
  } catch (error) { return apiError(error); }
}
