import { createHmac } from 'node:crypto';

export function rateLimitKey(value: string, secret: string) { return createHmac('sha256', secret).update('crm-rate-v1:' + value).digest('hex'); }
export function jwtAssurance(token: string): string | null {
  // Only call AFTER auth.getUser(token) verified the signature and live account.
  try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).aal ?? null; } catch { return null; }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return request.headers.get('sec-fetch-site') !== 'cross-site' && (!origin || origin === new URL(request.url).origin);
}
export async function readJson(request: Request, maximum = 8192): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length') || 0) > maximum) throw new RangeError('İstek çok büyük.');
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('Geçersiz istek.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new RangeError('İstek çok büyük.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const result = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new SyntaxError('Geçersiz istek.');
  return result;
}
