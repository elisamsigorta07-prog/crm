// Administrative setup. Never copies legacy passwords or sends emails.
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
process.loadEnvFile('.env.local');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = 'policy-documents';
const { data: existing, error: listingError } = await admin.storage.listBuckets();
if (listingError) throw new Error('Supabase dosya deposu kontrol edilemedi.');
const found = existing.find(item => item.id === bucket);
if (found?.public) throw new Error('PDF deposu herkese açık. Önce erişim durumu incelenmeli.');
if (!found) {
  const { error } = await admin.storage.createBucket(bucket, { public: false, fileSizeLimit: 20 * 1024 * 1024, allowedMimeTypes: ['application/pdf', 'application/json'] });
  if (error) throw new Error('Özel PDF deposu oluşturulamadı: ' + error.message);
}
console.log('Supabase özel PDF deposu hazır; anonim erişim izni eklenmedi.');

const ownerIndex = process.argv.indexOf('--owner-email');
const staffIndex = process.argv.indexOf('--staff-email');
const email = process.argv[ownerIndex >= 0 ? ownerIndex + 1 : staffIndex >= 0 ? staffIndex + 1 : -1];
if (email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Geçerli bir personel e-postası gerekli.');
  const { data: legacy, error } = await admin.from('app_users').select('id,username,role').eq('username', email).single();
  if (error || !legacy || (ownerIndex >= 0 && legacy.role !== 'Yönetici')) throw new Error('Bu e-posta uygun mevcut CRM kullanıcısıyla eşleşmiyor.');
  const role = ownerIndex >= 0 ? 'admin' : 'staff';
  const { data: users, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) throw new Error('Auth hesapları kontrol edilemedi.');
  let user = users.users.find(user => user.email?.toLowerCase() === email.toLowerCase());
  if (user && (user.app_metadata.crm_workspace !== 'elisam' || user.app_metadata.crm_staff !== true || user.app_metadata.crm_role !== role)) throw new Error('Mevcut Auth hesabının yetkileri farklı; otomatik değiştirilmedi.');
  if (!user) {
    const created = await admin.auth.admin.createUser({ email, password: randomBytes(40).toString('base64url'), email_confirm: true, app_metadata: { crm_workspace: 'elisam', crm_staff: true, crm_role: role, legacy_user_id: String(legacy.id) } });
    if (created.error || !created.data.user) throw new Error('Güvenli Auth hesabı oluşturulamadı.');
    user = created.data.user;
  }
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'recovery', email });
  if (linkError || !link.properties?.hashed_token) throw new Error('Hesap kurulum izni oluşturulamadı.');
  const outputIndex = process.argv.indexOf('--output-dir');
  const outputDir = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.join(tmpdir(), 'elisam-crm-private');
  await mkdir(outputDir, { recursive: true });
  const filename = role === 'admin' ? 'CRM-HESAP-KURULUM.md' : 'CRM-PERSONEL-KURULUM.md';
  const fragment = '#token_hash=' + encodeURIComponent(link.properties.hashed_token);
  const outputPath = path.join(outputDir, filename);
  await writeFile(outputPath, `# Güvenli CRM hesabı\n\nHesap: ${email}\n\nProjenin geliştirme sunucusu açık olmalı (npm run dev). Terminalde yazan porta uygun bağlantıyı açın ve en az 14 karakterli, size özel yeni bir şifre belirleyin.\n\n- [3000 portunda hesabı etkinleştir](http://localhost:3000/crm/sigorta/hesap-kurulum${fragment})\n- [3001 portunda hesabı etkinleştir](http://localhost:3001/crm/sigorta/hesap-kurulum${fragment})\n\nBu bağlantı tek kullanımlık ve sürelidir; paylaşmayın. Geçersizleşirse aynı kurulum komutu yeni bağlantı üretir. E-posta gönderilmedi. Eski panel şifresi kopyalanmadı.\n`, { encoding: 'utf8', mode: 0o600 });
  console.log(`Güvenli hesap hazır. Özel kurulum dosyası: ${outputPath}. Şifre konsola veya kaynak koduna yazılmadı.`);
}
