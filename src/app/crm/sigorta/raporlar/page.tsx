"use client";

import { useState } from 'react';
import { BarChart3, Shield, Download, Calendar, Users, FileSpreadsheet } from 'lucide-react';
import { initialCustomersData, initialPoliciesData } from '@/data/crmData';
import styles from '../layout.module.css';

type ReportType = 'musteriler' | 'aktif_policeler' | 'yaklasan_policeler' | 'sirket_bazli';

export default function SigortaRaporlarPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickRange, setQuickRange] = useState('');

  const setRange = (range: string) => {
    setQuickRange(range);
    const now = new Date();
    let start = new Date();
    if (range === 'bu_hafta') { start.setDate(now.getDate() - 7); }
    else if (range === 'bu_ay') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (range === 'bu_yil') { start = new Date(now.getFullYear(), 0, 1); }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const downloadCSV = (filename: string, rows: string[][]) => {
    const bom = '\uFEFF';
    const csv = bom + rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = (type: ReportType) => {
    const today = new Date().toLocaleDateString('tr-TR');
    if (type === 'musteriler') {
      const rows = [
        ['Musteri ID', 'Ad Soyad', 'Tip', 'TC Kimlik No', 'Telefon', 'E-posta', 'Kayit Tarihi'],
        ...initialCustomersData.map(c => [c.id, c.name, c.type, c.identityNo, c.phone, c.email, c.createdAt])
      ];
      if (rows.length === 1) rows.push(['(Kayitli musteri yok)', '', '', '', '', '', '']);
      downloadCSV(`musteri-listesi-${today}.csv`, rows);
    } else if (type === 'aktif_policeler') {
      const rows = [
        ['Police No', 'Musteri', 'Tur', 'Sirket', 'Baslangic', 'Bitis', 'Prim (TL)', 'Durum'],
        ...initialPoliciesData.map(p => [p.id, p.customerName, p.type, p.company, p.startDate, p.endDate, String(p.premium), p.status])
      ];
      if (rows.length === 1) rows.push(['(Kayitli police yok)', '', '', '', '', '', '', '']);
      downloadCSV(`aktif-policeler-${today}.csv`, rows);
    } else if (type === 'yaklasan_policeler') {
      const upcoming = initialPoliciesData.filter(p => p.status === 'Yaklaşıyor' || p.status === 'Biten');
      const rows = [
        ['Police No', 'Musteri', 'Tur', 'Bitis Tarihi', 'Durum'],
        ...upcoming.map(p => [p.id, p.customerName, p.type, p.endDate, p.status])
      ];
      if (rows.length === 1) rows.push(['(Yaklasan police yok)', '', '', '', '']);
      downloadCSV(`yaklasan-policeler-${today}.csv`, rows);
    } else if (type === 'sirket_bazli') {
      const map: Record<string, { count: number; total: number }> = {};
      initialPoliciesData.forEach(p => {
        if (!map[p.company]) map[p.company] = { count: 0, total: 0 };
        map[p.company].count++;
        map[p.company].total += p.premium;
      });
      const rows = [
        ['Sirket', 'Police Adedi', 'Toplam Prim (TL)'],
        ...Object.entries(map).map(([k, v]) => [k, String(v.count), String(v.total)])
      ];
      if (rows.length === 1) rows.push(['(Veri yok)', '', '']);
      downloadCSV(`sirket-bazli-uretim-${today}.csv`, rows);
    }
  };

  const reports: { type: ReportType; title: string; desc: string; icon: string; color: string }[] = [
    { type: 'musteriler', title: 'Musteri Listesi', desc: 'Tum musteriler — isim, TC, telefon, e-posta', icon: '👥', color: '#ebf8ff' },
    { type: 'aktif_policeler', title: 'Aktif Policeler', desc: 'Police no, musteri, sirket, prim, bitis tarihi', icon: '🛡️', color: '#f0fff4' },
    { type: 'yaklasan_policeler', title: 'Suresi Yaklasan Policeler', desc: 'Yakinlasmayanlar ve biten durumdaki policeler', icon: '⚠️', color: '#fffbeb' },
    { type: 'sirket_bazli', title: 'Sirket Bazli Uretim', desc: 'Her sigorta sirketine gore prim ve police adedi', icon: '📈', color: '#faf5ff' },
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Finansal Raporlar & Uretim Analizi</h1>
      </div>

      {/* Date Range Filter */}
      <div className={styles.card} style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#2d3748', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#3498db" /> Tarih Araligi Filtresi
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#718096', marginBottom: '6px' }}>Baslangic</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setQuickRange(''); }} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#718096', marginBottom: '6px' }}>Bitis</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setQuickRange(''); }} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[{ key: 'bu_hafta', label: 'Bu Hafta' }, { key: 'bu_ay', label: 'Bu Ay' }, { key: 'bu_yil', label: 'Bu Yil' }].map(r => (
              <button key={r.key} onClick={() => setRange(r.key)} style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: quickRange === r.key ? '#031924' : '#edf2f7', color: quickRange === r.key ? 'white' : '#4a5568', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {(startDate || endDate) && (
          <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#718096' }}>
            Secili aralik: <strong>{startDate || '...'}</strong> — <strong>{endDate || '...'}</strong>
            {' '}<button onClick={() => { setStartDate(''); setEndDate(''); setQuickRange(''); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Temizle</button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'TOPLAM MUSTERI', value: initialCustomersData.length + ' Kisi', color: '#3498db' },
          { label: 'TOPLAM POLICE', value: initialPoliciesData.length + ' Adet', color: '#2ecc71' },
          { label: 'TOPLAM URETIM', value: initialPoliciesData.reduce((s, p) => s + p.premium, 0).toLocaleString('tr-TR') + ' TL', color: '#f1c40f' },
          { label: 'AKTIF POLICE', value: initialPoliciesData.filter(p => p.status === 'Aktif').length + ' Adet', color: '#27ae60' },
        ].map(({ label, value, color }) => (
          <div key={label} className={styles.card} style={{ borderLeft: '4px solid ' + color }}>
            <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d3748', marginTop: '4px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Report Download Cards */}
      <div className={styles.card}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#2d3748', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet size={18} color="#3498db" /> Indirilebilir Raporlar
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {reports.map(r => (
            <div key={r.type} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: r.color, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '1.6rem' }}>{r.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '0.95rem' }}>{r.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#718096', marginTop: '4px' }}>{r.desc}</div>
              </div>
              <button
                onClick={() => handleDownload(r.type)}
                style={{ marginTop: 'auto', padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e0', background: 'white', color: '#2d3748', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={15} /> CSV Indir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
