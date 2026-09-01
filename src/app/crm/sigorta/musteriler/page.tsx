"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function MusterilerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Müşteriler ve Poliçeler sayfası tek bir merkezde birleştirildi.
    router.replace('/crm/sigorta/policeler');
  }, [router]);

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <ShieldCheck size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
        Poliçeler Sayfasına Yönlendiriliyorsunuz...
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.5 }}>
        Müşteri ve poliçe kayıtları tek ekrandan daha hızlı işlem yapılabilmesi için birleştirildi.
      </p>
      <Link 
        href="/crm/sigorta/policeler"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          borderRadius: '10px',
          fontWeight: 700,
          textDecoration: 'none'
        }}
      >
        Poliçeler Sayfasına Git <ArrowRight size={18} />
      </Link>
    </div>
  );
}
