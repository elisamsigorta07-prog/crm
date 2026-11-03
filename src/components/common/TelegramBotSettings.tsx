'use client';

import { useCallback, useEffect, useState } from 'react';
import { crmAuth } from '@/lib/supabaseClient';

type Member = { telegramId: string; label: string; enabled: boolean; paired: boolean; expired: boolean; expiresAt: number };
type Status = { configured: boolean; bot: { username?: string; webhookSet: boolean } | null; connectionError: string; members: Member[] };
async function request(body?: object) {
  const { data } = await crmAuth.auth.getSession();
  if (!data.session) throw new Error('Önce CRM hesabınla giriş yap.');
  const response = await fetch('/api/crm/telegram', { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${data.session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'İşlem tamamlanamadı.');
  return result;
}
export default function TelegramBotSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [invitation, setInvitation] = useState<{ code: string; expiresAt: number; telegramId: string } | null>(null);
  const reload = useCallback(async () => {
    try { setStatus(await request()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Bot durumu alınamadı.'); }
  }, []);
  useEffect(() => {
    // Retire the previous browser-only token form. Tokens now belong to the server.
    localStorage.removeItem('elisam_telegram_config');
    let active = true;
    void request().then(result => { if (active) { setStatus(result); setError(''); } }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Bot durumu alınamadı.'); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!invitation) return;
    const timer = setTimeout(() => setInvitation(null), Math.max(0, invitation.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [invitation]);
  async function invite() {
    setBusy(true); setError(''); setInvitation(null);
    try {
      const result = await request({ action: 'invite', telegramId: id.trim(), label: label.trim() });
      setInvitation({ ...result, telegramId: id.trim() }); await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Kod oluşturulamadı.'); } finally { setBusy(false); }
  }
  async function revoke(telegramId: string) {
    setBusy(true); setError('');
    try {
      await request({ action: 'revoke', telegramId });
      if (invitation?.telegramId === telegramId) setInvitation(null);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Erişim kapatılamadı.'); } finally { setBusy(false); }
  }
  const input = { padding: 10, borderRadius: 8, border: '1px solid #94a3b8', maxWidth: '100%' };
  return <section aria-label="Telegram botu ve kullanıcı yetkileri" style={{ margin: '24px 0', padding: 20, border: '1px solid #cbd5e1', borderRadius: 12 }}>
    <h3>Telegram poliçe botu</h3>
    <p>Poliçe sorgula butonuyla TC, ad soyad veya poliçe numarasına göre kayıtlı bilgiler gelir. PDF olması gerekmez. Belge varsa ayrıca PDF gönderilebilir. Yaklaşan bitişler üç takvim ayını kapsar.</p>
    <p role="status">{status ? !status.configured ? 'Bot kurulumu bekleniyor: sunucu anahtarları henüz tanımlı değil.' : status.bot?.webhookSet ? `@${status.bot.username} — bağlantı doğrulandı.` : status.connectionError || 'Bot anahtarları tanımlı; yayındaki mesaj bağlantısı henüz doğrulanmadı.' : 'Bot durumu kontrol ediliyor…'}</p>
    <button type="button" onClick={() => void reload()} disabled={busy}>Durumu yenile</button>
    {status?.bot?.username && <p><a href={`https://t.me/${encodeURIComponent(status.bot.username)}`} target="_blank" rel="noreferrer">Botu Telegram’da aç</a></p>}
    <p>Kişi önce bota <code>/kimlik</code> yazar. Bildirdiği sayısal kimliği doğrulayıp aşağıya gir. Üretilen kod yalnızca o Telegram hesabında, 10 dakika içinde ve tek eşleştirme için geçerlidir. Aynı kişiye yeni kod üretmek eski bağlantısını kapatır.</p>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
      <label>Kişi adı<br /><input style={input} value={label} maxLength={80} onChange={e => setLabel(e.target.value)} placeholder="Personelin adı" /></label>
      <label>Telegram kullanıcı kimliği<br /><input style={input} value={id} inputMode="numeric" maxLength={16} onChange={e => setId(e.target.value)} placeholder="Sayısal kullanıcı kimliği" /></label>
      <button type="button" disabled={busy || !id.trim() || !label.trim()} onClick={() => void invite()}>Kişisel eşleştirme kodu oluştur</button>
    </div>
    {invitation && <div style={{ marginTop: 16, padding: 14, background: '#eff6ff', overflowWrap: 'anywhere' }}>
      <p>Yalnızca {invitation.telegramId} kimlikli kişiye ilet. Telegram’da şu komutu yazmalı:</p>
      <code>/eslestir {invitation.code}</code>
      <p>Son kullanım: {new Date(invitation.expiresAt).toLocaleTimeString('tr-TR')}. Kod bu ekrandan ayrılınca tekrar gösterilmez.</p>
      <button type="button" onClick={() => setInvitation(null)}>Kodu gizle</button>
    </div>}
    {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
    <h4>Yetkilendirdiğin kişiler</h4>
    {status && !status.members.length && <p>Henüz kimseye bot erişimi verilmedi.</p>}
    {status?.members.map(member => <div key={member.telegramId} style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
      <span>{member.label} · {member.telegramId} · {!member.enabled ? 'Erişimi kapalı' : member.paired ? 'Eşleştirildi' : member.expired ? 'Yeni kod gerekiyor' : 'Eşleştirme bekliyor'}</span>
      {member.enabled && <button type="button" disabled={busy} onClick={() => void revoke(member.telegramId)}>Erişimi kapat</button>}
    </div>)}
    <p>Yalnızca özel sohbetlerde çalışır. Yetkili kişiler acentedeki tüm poliçe ve müşteri bilgilerini görebilir. Erişimi kapatmak, daha önce Telegram’a gönderilmiş mesaj ve dosyaları geri silmez.</p>
  </section>;
}
