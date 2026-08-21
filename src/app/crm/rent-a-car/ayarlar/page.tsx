"use client";

import { useState } from 'react';
import { CarFront, Save, ShieldAlert, FileText } from 'lucide-react';
import styles from '../layout.module.css';

export default function RentAyarlarPage() {
  const [companyName, setCompanyName] = useState('Elisam Rent A Car Alanya');
  const [minAge, setMinAge] = useState('21');
  const [deposit, setDeposit] = useState('3000');
  const [terms, setTerms] = useState('Araç tesliminde geçerli ehliyet ve pasaport/TC ibrazı zorunludur. KM sınırı günlük 250 km’dir.');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Rent A Car kiralama ayarları başarıyla kaydedildi!');
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Rent A Car Sistem Ayarları</h1>
      </div>

      <div className={styles.card} style={{ maxWidth: '700px' }}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Kiralama Şirketi Ünvanı</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Minimum Sürücü Yaşı</label>
              <input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Varsayılan Provizyon / Depozito (₺)</label>
              <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Standart Kiralama Şartları ve Sözleşme Notu</label>
            <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}></textarea>
          </div>

          <button type="submit" className={styles.btnCrm}>
            <Save size={18} /> Ayarları Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}
