import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { MAX_POLICY_PDF_BYTES } from '../policyPdfValidation.ts';

export const POLICY_BUCKET = 'policy-documents';
export type UploadTicket = { purpose: 'policy-upload-v1'; userId: string; policyId: string; filename: string; size: number; temporaryPath: string; revision: string | null; expires: number };

export function validatePolicyId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 200 || /[\u0000-\u001f]/.test(value)) throw new Error('Geçersiz poliçe kimliği.');
  return value;
}
export function validateUploadInfo(filename: unknown, size: unknown) {
  if (typeof filename !== 'string' || filename.length > 180 || !/\.pdf$/i.test(filename) || /[\u0000-\u001f/\\]/.test(filename)) throw new Error('Geçerli bir PDF dosya adı gerekli.');
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size < 5 || size > MAX_POLICY_PDF_BYTES) throw new Error('PDF en fazla 20 MB olabilir.');
  return { filename, size };
}
export function policyFolder(policyId: string) { return `policies/${createHash('sha256').update(policyId).digest('hex')}`; }
export function versionName(filename: string, nonce: string, now = Date.now()) { return `${String(now).padStart(13, '0')}-${nonce}--${Buffer.from(filename).toString('base64url')}.pdf`; }
export function originalFilename(name: string): string | null {
  const match = /^\d{13}-[a-f0-9-]{36}--([A-Za-z0-9_-]+)\.pdf$/.exec(name);
  if (!match) return null;
  const decoded = Buffer.from(match[1], 'base64url').toString('utf8');
  try { return validateUploadInfo(decoded, 5).filename; } catch { return null; }
}
export function signUploadTicket(ticket: UploadTicket, secret: string): string {
  const payload = Buffer.from(JSON.stringify(ticket)).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update('policy-upload-v1:' + payload).digest('base64url')}`;
}
export function verifyUploadTicket(token: unknown, userId: string, secret: string, now = Date.now()): UploadTicket {
  if (typeof token !== 'string' || token.length > 4096) throw new Error('Yükleme izni geçersiz.');
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) throw new Error('Yükleme izni geçersiz.');
  const expected = createHmac('sha256', secret).update('policy-upload-v1:' + payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Yükleme izni geçersiz.');
  const ticket: UploadTicket = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  validatePolicyId(ticket.policyId); validateUploadInfo(ticket.filename, ticket.size);
  if (ticket.purpose !== 'policy-upload-v1' || ticket.userId !== userId || !Number.isFinite(ticket.expires) || ticket.expires < now || ticket.expires > now + 16 * 60_000 || !new RegExp(`^incoming/${userId}/[a-f0-9-]{36}\\.pdf$`).test(ticket.temporaryPath)) throw new Error('Yükleme izni bitmiş veya başka bir hesaba ait.');
  return ticket;
}
