import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { appendFile } from 'node:fs/promises';
process.loadEnvFile('.env.local');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = 'telegram-bot-state';
const { data: buckets, error } = await admin.storage.listBuckets();
if (error) throw new Error('Bot deposu kontrol edilemedi.');
const existing = buckets.find(b => b.id === bucket);
if (existing?.public) throw new Error('Bot deposu herkese açık; işlem durduruldu.');
if (!existing) {
  const created = await admin.storage.createBucket(bucket, { public: false, fileSizeLimit: 256 * 1024, allowedMimeTypes: ['application/json'] });
  if (created.error) throw new Error('Özel bot deposu oluşturulamadı.');
}
if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
  await appendFile('.env.local', `\n# Telegram webhook: server only\nTELEGRAM_WEBHOOK_SECRET=${randomBytes(32).toString('base64url')}\n`);
  console.log('Webhook doğrulama anahtarı yalnızca yerel sunucu ayarına kaydedildi.');
}
console.log('Özel bot erişim deposu hazır. Yeni tablo veya anonim Storage izni oluşturulmadı.');
if (!process.env.TELEGRAM_BOT_TOKEN) console.log('BotFather tokenını .env.local içine TELEGRAM_BOT_TOKEN olarak ekleyin. Anahtarı sohbet veya kaynak koduyla paylaşmayın.');
if (process.argv.includes('--register-webhook')) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // Reload the newly generated secret without dumping any environment values.
  if (!process.env.TELEGRAM_WEBHOOK_SECRET) process.loadEnvFile('.env.local');
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const address = process.env.TELEGRAM_WEBHOOK_URL;
  if (!token || !secret || !address) throw new Error('TELEGRAM_BOT_TOKEN ve yayındaki TELEGRAM_WEBHOOK_URL gerekli.');
  const url = new URL(address);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/api/telegram/webhook') throw new Error('Webhook, HTTPS uygulama adresi + /api/telegram/webhook olmalı.');
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: address, secret_token: secret, allowed_updates: ['message', 'callback_query'], max_connections: 1, drop_pending_updates: false }), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error();
    console.log('Telegram webhook kaydedildi; mevcut bekleyen mesajlar silinmedi.');
  } catch { throw new Error('Webhook kaydedilemedi. Sunucu ayarlarını kontrol edin; gizli anahtar çıktıya yazılmadı.'); }
}
