'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { crmAuth } from '@/lib/supabaseClient';
import { isCrmStaff } from '@/lib/crmAccess';

export default function CrmAccountSetup() {
  const router = useRouter();
  const started = useRef(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [message, setMessage] = useState('Hesap kurulum izni kontrol ediliyor…');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get('token_hash');
    window.history.replaceState(null, '', window.location.pathname);
    void (async () => {
      const result = token ? await crmAuth.auth.verifyOtp({ token_hash: token, type: 'recovery' }) : await crmAuth.auth.getUser();
      if (result.error || (!isCrmStaff(result.data.user) && !isCrmStaff(result.data.user, 'rent'))) { setMessage('Kurulum bağlantısı geçersiz veya süresi dolmuş. Yeni bağlantı oluşturulmalı.'); return; }
      setReady(true); setMessage('PDF deposuna erişim için eski panel şifresinden farklı, size özel bir şifre belirleyin.');
    })().catch(() => setMessage('Hesap bağlantısı kontrol edilemedi. İnternet bağlantısını kontrol edin.'));
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 14 || password !== repeat) { setMessage('En az 14 karakterli iki şifre aynı olmalıdır.'); return; }
    setBusy(true);
    try {
      const { error } = await crmAuth.auth.updateUser({ password });
      if (error) { setMessage('Şifre kaydedilemedi. Farklı ve güçlü bir şifre deneyin.'); return; }
      const current = await crmAuth.auth.getUser();
      router.replace(isCrmStaff(current.data.user) ? '/crm/sigorta/dashboard' : '/crm/rent-a-car/dashboard');
    } catch { setMessage('Şifre kaydedilemedi. İnternet bağlantısını kontrol edip tekrar deneyin.'); }
    finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 520, margin: '60px auto', padding: 28 }}>
    <h1>Güvenli CRM hesabını etkinleştir</h1><p role="status">{message}</p>
    {ready && <form onSubmit={save}>
      <label style={{ display: 'block', marginBottom: 16 }}>Yeni şifre<input type="password" autoComplete="new-password" minLength={14} required value={password} onChange={event => setPassword(event.target.value)} style={{ display: 'block', width: '100%', padding: 12 }} /></label>
      <label style={{ display: 'block', marginBottom: 16 }}>Şifreyi tekrar gir<input type="password" autoComplete="new-password" minLength={14} required value={repeat} onChange={event => setRepeat(event.target.value)} style={{ display: 'block', width: '100%', padding: 12 }} /></label>
      <button disabled={busy} type="submit">{busy ? 'Kaydediliyor…' : 'Şifreyi belirle ve CRM’ye gir'}</button>
    </form>}
  </main>;
}
