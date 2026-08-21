"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function SigortaCrmLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', email)
        .eq('password', password)
        .single();
        
      if (data) {
        // Oturum açıldı
        router.push('/crm/sigorta/dashboard');
      } else {
        // Fallback admin (eğer Supabase tablo yoksa)
        if (email === 'admin@elisamsigorta07.com' && password === 'elisam2026.1') {
          router.push('/crm/sigorta/dashboard');
        } else {
          alert("Hatalı e-posta veya şifre!");
        }
      }
    } catch (err) {
      if (email === 'admin@elisamsigorta07.com' && password === 'elisam2026.1') {
        router.push('/crm/sigorta/dashboard');
      } else {
        alert("Sisteme bağlanılamadı veya hatalı giriş.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#031924', color: 'white', marginBottom: '15px' }}>
            <ShieldCheck size={40} />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#031924', marginBottom: '5px' }}>Sigorta CRM</h1>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>Personel giriş paneli</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>E-Posta Adresi</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="personel@elisamsigorta.com" style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' }} />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>Şifre</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' }} />
          </div>

          <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#031924', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            Giriş Yap <LogIn size={18} />
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </main>
  );
}
