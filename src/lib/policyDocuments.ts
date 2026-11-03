import { crmAuth, supabase } from './supabaseClient';
import { validatePolicyPdf } from './policyPdfValidation';

const BUCKET = 'policy-documents';
type StoredDocument = { policyId: string; name: string; size: number; file?: Blob; path?: string; updatedAt: string };
export type PolicyDocument = Omit<StoredDocument, 'file'> & { storage: 'local' | 'cloud'; revision?: string };

// Read the previous browser store only to recover/migrate existing attachments.
// New uploads are always saved in the authenticated private cloud bucket.
async function localDocument(policyId: string, remove = false): Promise<StoredDocument | undefined> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('elisam-policy-documents', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('documents', { keyPath: 'policyId' });
    request.onerror = () => reject(new Error('Eski tarayıcı dosya deposu okunamadı.'));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('documents', remove ? 'readwrite' : 'readonly');
      const store = transaction.objectStore('documents');
      const query = remove ? store.delete(policyId) : store.get(policyId);
      transaction.oncomplete = () => { db.close(); resolve(remove ? undefined : query.result); };
      transaction.onerror = () => { db.close(); reject(new Error('Eski tarayıcı dosyası okunamadı.')); };
    };
  });
}

async function cloudRequest<T>(query: string, method = 'GET', body?: unknown): Promise<T> {
  const { data: { session }, error } = await crmAuth.auth.getSession();
  if (error || !session) throw new Error('PDF deposuna erişmek için güvenli CRM hesabınızla yeniden giriş yapın.');
  const response = await fetch(`/api/crm/policy-documents${query}`, {
    method, cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('PDF deposu yanıt vermedi. Sunucu bağlantısını kontrol edin.'); }
  if (!response.ok) throw new Error(data.error || 'PDF deposu işlemi tamamlanamadı.');
  return data as T;
}
const queryFor = (id: string) => `?policyId=${encodeURIComponent(id)}`;

export async function getPolicyDocument(policyId: string): Promise<PolicyDocument | null> {
  const { document } = await cloudRequest<{ document: PolicyDocument | null }>(queryFor(policyId));
  if (document) return document;
  const legacy = await localDocument(policyId);
  return legacy?.file ? { policyId, name: legacy.name, size: legacy.size, updatedAt: legacy.updatedAt, storage: 'local' } : null;
}

export async function savePolicyDocument(policyId: string, file: File): Promise<PolicyDocument> {
  await validatePolicyPdf(file);
  const prepared = await cloudRequest<{ path: string; token: string; ticket: string }>('', 'POST', { policyId, filename: file.name, size: file.size });
  const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: 'application/pdf', cacheControl: '0' });
  if (error) throw new Error('PDF Supabase’e yüklenemedi. Eski dosya korundu; tekrar deneyin.');
  const { document } = await cloudRequest<{ document: PolicyDocument }>('', 'PUT', { ticket: prepared.ticket });
  if (!document?.path || document.storage !== 'cloud') throw new Error('Bulut kaydı doğrulanamadı. PDF kaydedildi olarak işaretlenmedi.');
  return document;
}

export async function migrateLocalPolicyDocument(policyId: string) {
  const legacy = await localDocument(policyId);
  if (!legacy?.file) throw new Error('Bu tarayıcıda taşınacak eski PDF bulunamadı.');
  return savePolicyDocument(policyId, new File([legacy.file], legacy.name, { type: 'application/pdf' }));
}

export async function removePolicyDocument(policyId: string) {
  const current = await cloudRequest<{ document: PolicyDocument | null; revision: string | null }>(queryFor(policyId));
  await cloudRequest('', 'DELETE', { policyId, revision: current.revision });
  await localDocument(policyId, true);
}

export async function openPolicyDocument(policyId: string, download = false) {
  const document = await getPolicyDocument(policyId);
  if (!document) throw new Error('Poliçenin PDF eki bulunamadı.');
  const link = window.document.createElement('a');
  if (document.storage === 'cloud') {
    const { url } = await cloudRequest<{ url: string }>(`${queryFor(policyId)}&action=download&attachment=${download ? '1' : '0'}`);
    link.href = url;
  } else {
    const blob = (await localDocument(policyId))?.file;
    if (!blob) throw new Error('Eski tarayıcı dosyası bulunamadı.');
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    link.href = url;
    if (download) link.download = document.name;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  if (!download) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  link.click();
}
