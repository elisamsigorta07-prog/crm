export const MAX_POLICY_PDF_BYTES = 20 * 1024 * 1024;
export async function validatePolicyPdf(file: File) {
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) throw new Error('Lütfen PDF dosyası seçin.');
  if (!file.size || file.size > MAX_POLICY_PDF_BYTES) throw new Error('PDF boş olmamalı ve en fazla 20 MB olmalıdır.');
  const header = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (header !== '%PDF-') throw new Error('Dosya geçerli bir PDF değil.');
}
