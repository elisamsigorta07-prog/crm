'use client';
import { useEffect, useState } from 'react';
import { crmAuth } from '@/lib/supabaseClient';

type Member = { id: string; email: string; role: string; scopes: string[]; disabled: boolean; mfa: boolean };
async function request(body?: object, page = 1) {
  const { data } = await crmAuth.auth.getSession();
  if (!data.session) throw new Error('Önce giriş yapın.');
  const response = await fetch('/api/crm/users?page=' + page, { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + data.session.access_token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'İşlem tamamlanamadı.');
  return result;
}
export default function CrmUsersSettings() {
  const [users, setUsers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [message, setMessage] = useState('Hesaplar yükleniyor…');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [insurance, setInsurance] = useState(true);
  const [rent, setRent] = useState(false);
  useEffect(() => {
    let active = true;
    void request(undefined, page).then(result => { if (active) { setUsers(result.users); setNextPage(result.nextPage); setMessage(''); } }).catch(e => { if (active) setMessage(e instanceof Error ? e.message : 'Hesaplar alınamadı.'); });
    return () => { active = false; };
  }, [page]);
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await request({ action: 'create', email, password, scopes: [...(insurance ? ['insurance'] : []), ...(rent ? ['rent'] : [])] });
      setPassword(''); setEmail('');
      const result = await request(undefined, page); setUsers(result.users); setNextPage(result.nextPage);
      setMessage('Hesap oluşturuldu. Kişi e-posta ve şifresiyle giriş yapabilir.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Hesap oluşturulamadı.'); } finally { setBusy(false); }
  }
  async function disable(userId: string) {
    setBusy(true);
    try { await request({ action: 'disable', userId }); const result = await request(undefined, page); setUsers(result.users); setMessage('Hesabın erişimi kapatıldı.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Erişim kapatılamadı.'); } finally { setBusy(false); }
  }
  return <section><h3>CRM kullanıcıları</h3>
    <p>Şifreler listelenmez. Yeni hesaplara yalnızca seçtiğin panel yetkisi verilir. E-posta ve şifreyle giriş yapılır; telefon kodu istenmez. Yeni yönetici yetkisi bu ekrandan verilmez.</p>
    <form onSubmit={create} style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
      <label>E-posta<input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" style={{ display: 'block', width: '100%', padding: 10 }} /></label>
      <label>Başlangıç şifresi<input type="password" required minLength={14} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" style={{ display: 'block', width: '100%', padding: 10 }} /></label>
      <label><input type="checkbox" checked={insurance} onChange={e => setInsurance(e.target.checked)} /> Sigorta paneli</label>
      <label><input type="checkbox" checked={rent} onChange={e => setRent(e.target.checked)} /> Rent A Car paneli</label>
      <button type="submit" disabled={busy || (!insurance && !rent)}>Personel hesabı oluştur</button>
    </form>
    <p role="status">{message}</p>
    {users.map(user => <div key={user.id} style={{ padding: '14px 0', borderBottom: '1px solid #ddd', overflowWrap: 'anywhere' }}>
      {user.email} · {user.role === 'admin' ? 'Yönetici' : 'Personel'} · {user.scopes.map(s => s === 'insurance' ? 'Sigorta' : 'Rent A Car').join(', ')} · {user.disabled ? 'Kapalı' : 'Aktif'} · Şifreyle giriş
      {!user.disabled && <button type="button" disabled={busy} onClick={() => void disable(user.id)} style={{ marginLeft: 12 }}>Erişimi kapat</button>}
    </div>)}
    <div style={{ marginTop: 16 }}><button type="button" disabled={busy || page === 1} onClick={() => setPage(p => p - 1)}>Önceki</button> <button type="button" disabled={busy || !nextPage} onClick={() => nextPage && setPage(nextPage)}>Sonraki</button></div>
  </section>;
}
