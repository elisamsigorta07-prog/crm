'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { crmAuth } from '@/lib/supabaseClient';
import { isCrmStaff, type CrmScope } from '@/lib/crmAccess';

const CrmUser = createContext<User | null>(null);
export default function CrmSessionGate({ children, scope = 'insurance' }: { children: React.ReactNode; scope?: CrmScope }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const login = scope === 'rent' ? '/crm/rent-a-car/login' : '/crm/sigorta/login';
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const { data, error } = await crmAuth.auth.getUser();
        if (!active) return;
        if (error || !isCrmStaff(data.user, scope)) { setUser(null); router.replace(login); return; }
        setUser(data.user); setError('');
      } catch { if (active) setError('Oturum kontrol edilemedi. İnternet bağlantınızı kontrol edin.'); }
    }
    void check();
    const { data: subscription } = crmAuth.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) { setUser(null); router.replace(login); }
      else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') setAttempt(value => value + 1);
    });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [router, pathname, attempt, scope, login]);
  if (!user) return <div style={{ padding: 32 }} role="status">{error || 'Güvenli CRM oturumu kontrol ediliyor…'}{error && <button onClick={() => setAttempt(value => value + 1)}>Tekrar dene</button>}</div>;
  return <CrmUser.Provider value={user}>{children}</CrmUser.Provider>;
}

export function CrmIdentity({ nameClass, roleClass }: { nameClass: string; roleClass: string }) {
  const user = useContext(CrmUser);
  return <><span className={nameClass}>{user?.email || 'CRM personeli'}</span><span className={roleClass}>{user?.app_metadata.crm_role === 'admin' ? 'Yönetici' : 'Personel'}</span></>;
}
export function CrmLogout({ className, children, scope = 'insurance' }: { className: string; children: React.ReactNode; scope?: CrmScope }) {
  const router = useRouter();
  return <button className={className} type="button" style={{ border: 0, cursor: 'pointer', font: 'inherit' }} onClick={async () => {
    await crmAuth.auth.signOut({ scope: 'local' }); router.replace(scope === 'rent' ? '/crm/rent-a-car/login' : '/crm/sigorta/login');
  }}>{children}</button>;
}
