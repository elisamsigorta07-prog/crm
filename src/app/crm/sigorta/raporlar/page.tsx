"use client";

import { useState } from 'react';
import { BarChart3, Shield, Download, Calendar, Users, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { initialCustomersData, initialPoliciesData, Customer, Policy } from '@/data/crmData';
import { generateModernPDF } from '@/lib/pdfReportGenerator';
import styles from '../layout.module.css';

type ReportType = 'musteriler' | 'aktif_policeler' | 'yaklasan_policeler' | 'sirket_bazli' | 'finans_taksit';

export default function SigortaRaporlarPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickRange, setQuickRange] = useState('');

  // Read data from localStorage if available, fallback to initial
  const getLiveCustomers = (): Customer[] => {
    if (typeof window === 'undefined') return initialCustomersData;
    try {
      const saved = localStorage.getItem('elisam_customers');
      return saved ? JSON.parse(saved) : initialCustomersData;
    } catch {
      return initialCustomersData;
    }
  };

  const getLivePolicies = (): Policy[] => {
    if (typeof window === 'undefined') return initialPoliciesData;
    try {
      const saved = localStorage.getItem('elisam_policies');
      return saved ? JSON.parse(saved) : initialPoliciesData;
    } catch {
      return initialPoliciesData;
    }
  };

  const getLiveDebtRecords = () => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('elisam_debt_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

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

  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const bom = '\uFEFF';
    const csv = bom + rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = (type: ReportType) => {
    const today = new Date().toLocaleDateString('tr-TR');
    const customers = getLiveCustomers();
    const policies = getLivePolicies();
    const debtRecords = getLiveDebtRecords();

    if (type === 'musteriler') {
      const rows = [
        ['Müşteri ID', 'Ad Soyad', 'Müşteri Türü', 'TC Kimlik / VKN', 'Telefon', 'E-Posta', 'Kayıt Tarihi'],
        ...customers.map(c => [c.id, c.name, c.type, c.identityNo, c.phone, c.email, c.createdAt])
      ];
      if (rows.length === 1) rows.push(['(Kayıtlı müşteri bulunamadı)', '', '', '', '', '', '']);
      downloadCSV(`elisam-musteri-listesi-${today}.csv`, rows);
    } else if (type === 'aktif_policeler') {
      const rows = [
        ['Poliçe No', 'Müşteri Adı', 'Poliçe Türü', 'Sigorta Şirketi', 'Başlangıç', 'Bitiş', 'Brüt Prim (TL)', 'Durum'],
        ...policies.map(p => [p.policyNo || p.id, p.customerName, p.type, p.company, p.startDate, p.endDate, String(p.premium), p.status])
      ];
      if (rows.length === 1) rows.push(['(Kayıtlı poliçe bulunamadı)', '', '', '', '', '', '', '']);
      downloadCSV(`elisam-aktif-policeler-${today}.csv`, rows);
    } else if (type === 'yaklasan_policeler') {
      const upcoming = policies.filter(p => p.status === 'Yaklaşıyor' || p.status === 'Biten');
      const rows = [
        ['Poliçe No', 'Müşteri Adı', 'Poliçe Türü', 'Bitiş Tarihi', 'Durum'],
        ...upcoming.map(p => [p.policyNo || p.id, p.customerName, p.type, p.endDate, p.status])
      ];
      if (rows.length === 1) rows.push(['(Yaklaşan poliçe bulunamadı)', '', '', '', '']);
      downloadCSV(`elisam-yaklasan-policeler-${today}.csv`, rows);
    } else if (type === 'sirket_bazli') {
      const map: Record<string, { count: number; total: number }> = {};
      policies.forEach(p => {
        if (!map[p.company]) map[p.company] = { count: 0, total: 0 };
        map[p.company].count++;
        map[p.company].total += p.premium;
      });
      const rows = [
        ['Sigorta Şirketi', 'Poliçe Adedi', 'Toplam Prim (TL)'],
        ...Object.entries(map).map(([k, v]) => [k, String(v.count), String(v.total)])
      ];
      if (rows.length === 1) rows.push(['(Veri yok)', '', '']);
      downloadCSV(`elisam-sirket-bazli-uretim-${today}.csv`, rows);
    } else if (type === 'finans_taksit') {
      const rows = [
        ['Poliçe No', 'Müşteri Adı', 'Telefon', 'Poliçe Türü', 'Toplam Tutar (TL)', 'Ödenen Tutar (TL)', 'Kalan Borç (TL)', 'Ödeme Planı', 'Durum'],
        ...debtRecords.map((r: any) => [r.policyNo, r.customerName, r.customerPhone, r.insuranceType, r.totalAmount, r.paidAmount, r.remainingAmount, r.paymentType, r.status])
      ];
      if (rows.length === 1) rows.push(['(Kayıtlı finans/borç kaydı bulunamadı)', '', '', '', '', '', '', '', '']);
      downloadCSV(`elisam-finans-taksit-raporu-${today}.csv`, rows);
    }
  };

  const handleDownloadPDF = (type: ReportType) => {
    const customers = getLiveCustomers();
    const policies = getLivePolicies();
    const debtRecords = getLiveDebtRecords();
    const dateRangeStr = (startDate && endDate) ? `${startDate} - ${endDate}` : undefined;

    if (type === 'musteriler') {
      generateModernPDF({
        title: 'MÜŞTERİ PORTFÖYÜ & İLETİŞİM LİSTESİ',
        subtitle: 'Elisam Sigorta bünyesinde kayıtlı bireysel ve kurumsal tüm müşteri dökümü',
        category: 'SİGORTA ACENTELİĞİ',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'TOPLAM MÜŞTERİ', value: `${customers.length} Kişi`, color: '#0284c7' },
          { label: 'BİREYSEL', value: `${customers.filter(c => c.type === 'Bireysel').length}`, color: '#16a34a' },
          { label: 'KURUMSAL', value: `${customers.filter(c => c.type === 'Kurumsal').length}`, color: '#9333ea' },
        ],
        headers: ['Müşteri No', 'Ad Soyad / Firma Ünvanı', 'Tür', 'TC / Vergi No', 'Telefon', 'Kayıt Tarihi'],
        rows: customers.length > 0 ? customers.map(c => [
          c.id,
          c.name,
          c.type,
          c.identityNo || '-',
          c.phone,
          c.createdAt
        ]) : [['-', 'Kayıtlı müşteri bulunamadı', '-', '-', '-', '-']]
      });
    } else if (type === 'aktif_policeler') {
      const totalPrem = policies.reduce((s, p) => s + p.premium, 0);
      generateModernPDF({
        title: 'AKTİF POLİÇE PORTFÖYÜ VE ÜRETİM ANALİZİ',
        subtitle: 'Acentemiz tarafından kesilen ve yürürlükte olan tüm poliçelerin detay dökümü',
        category: 'SİGORTA ACENTELİĞİ',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'TOPLAM POLİÇE', value: `${policies.length} Adet`, color: '#0284c7' },
          { label: 'TOPLAM BRÜT PRİM', value: `${totalPrem.toLocaleString('tr-TR')} ₺`, color: '#16a34a' },
          { label: 'AKTİF POLİÇELER', value: `${policies.filter(p => p.status === 'Aktif').length} Adet`, color: '#059669' },
          { label: 'YAKLAŞAN POLİÇELER', value: `${policies.filter(p => p.status === 'Yaklaşıyor').length} Adet`, color: '#d97706' },
        ],
        headers: ['Poliçe No', 'Müşteri Adı', 'Sigorta Türü', 'Şirket', 'Başlangıç', 'Bitiş', 'Brüt Prim (₺)', 'Durum'],
        rows: policies.length > 0 ? policies.map(p => [
          p.policyNo || p.id,
          p.customerName,
          p.type,
          p.company,
          p.startDate,
          p.endDate,
          `${p.premium.toLocaleString('tr-TR')} ₺`,
          p.status
        ]) : [['-', 'Kayıtlı poliçe bulunamadı', '-', '-', '-', '-', '-', '-']]
      });
    } else if (type === 'yaklasan_policeler') {
      const upcoming = policies.filter(p => p.status === 'Yaklaşıyor' || p.status === 'Biten');
      generateModernPDF({
        title: 'YAKLAŞAN YENİLEME VE BİTEN POLİÇELER LİSTESİ',
        subtitle: 'Süresi yaklaşan ve müşteriyle iletişime geçilmesi gereken poliçelerin listesi',
        category: 'SİGORTA ACENTELİĞİ',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'YAKLAŞAN POLİÇELER', value: `${upcoming.length} Adet`, color: '#d97706' },
          { label: 'BİTEN POLİÇELER', value: `${policies.filter(p => p.status === 'Biten').length} Adet`, color: '#dc2626' }
        ],
        headers: ['Poliçe No', 'Müşteri Adı', 'Sigorta Türü', 'Bitiş Tarihi', 'Durum'],
        rows: upcoming.length > 0 ? upcoming.map(p => [
          p.policyNo || p.id,
          p.customerName,
          p.type,
          p.endDate,
          p.status
        ]) : [['-', 'Yaklaşan poliçe bulunamadı', '-', '-', '-']]
      });
    } else if (type === 'sirket_bazli') {
      const map: Record<string, { count: number; total: number }> = {};
      policies.forEach(p => {
        if (!map[p.company]) map[p.company] = { count: 0, total: 0 };
        map[p.company].count++;
        map[p.company].total += p.premium;
      });
      const totalAll = policies.reduce((s, p) => s + p.premium, 0);

      generateModernPDF({
        title: 'ANLAŞMALI SİGORTA ŞİRKETLERİ ÜRETİM DAĞILIMI',
        subtitle: 'Şirket bazında üretilen poliçe adedi ve toplam prim cirosu',
        category: 'SİGORTA ACENTELİĞİ',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'TOPLAM CİRO', value: `${totalAll.toLocaleString('tr-TR')} ₺`, color: '#16a34a' },
          { label: 'ŞİRKET SAYISI', value: `${Object.keys(map).length}`, color: '#0284c7' },
          { label: 'TOPLAM POLİÇE', value: `${policies.length} Adet`, color: '#9333ea' }
        ],
        headers: ['Sigorta Şirketi', 'Kesilen Poliçe Adedi', 'Üretilen Toplam Prim (₺)', 'Ciro Payı (%)'],
        rows: Object.entries(map).map(([comp, val]) => [
          comp,
          `${val.count} Adet`,
          `${val.total.toLocaleString('tr-TR')} ₺`,
          `%${totalAll > 0 ? Math.round((val.total / totalAll) * 100) : 0}`
        ])
      });
    } else if (type === 'finans_taksit') {
      const totalVolume = debtRecords.reduce((s: number, r: any) => s + r.totalAmount, 0);
      const totalPaid = debtRecords.reduce((s: number, r: any) => s + r.paidAmount, 0);
      const totalDebt = debtRecords.reduce((s: number, r: any) => s + r.remainingAmount, 0);

      generateModernPDF({
        title: 'MÜŞTERİ ÖDEME, BORÇ & TAKSİT TAKİP RAPORU',
        subtitle: 'Kimin ne kadar ödemesi var, kimin ne kadar borcu kalmış resmi finans dökümü',
        category: 'SİGORTA ACENTELİĞİ',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'TOPLAM SATIŞ', value: `${totalVolume.toLocaleString('tr-TR')} ₺`, color: '#0284c7' },
          { label: 'TAHSİL EDİLEN', value: `${totalPaid.toLocaleString('tr-TR')} ₺`, color: '#16a34a' },
          { label: 'KALAN AÇIK BORÇ', value: `${totalDebt.toLocaleString('tr-TR')} ₺`, color: '#dc2626' },
          { label: 'BORÇLU MÜŞTERİ', value: `${debtRecords.filter((r: any) => r.remainingAmount > 0).length} Kişi`, color: '#d97706' }
        ],
        headers: ['Poliçe No', 'Müşteri Adı', 'Telefon', 'Poliçe Türü', 'Toplam Tutar', 'Ödenen', 'Kalan Borç', 'Plan', 'Durum'],
        rows: debtRecords.length > 0 ? debtRecords.map((r: any) => [
          r.policyNo,
          r.customerName,
          r.customerPhone,
          r.insuranceType,
          `${r.totalAmount.toLocaleString('tr-TR')} ₺`,
          `${r.paidAmount.toLocaleString('tr-TR')} ₺`,
          `${r.remainingAmount.toLocaleString('tr-TR')} ₺`,
          r.paymentType,
          r.status
        ]) : [['-', 'Kayıtlı finans/borç kaydı bulunamadı', '-', '-', '-', '-', '-', '-', '-']]
      });
    }
  };

  const reports: { type: ReportType; title: string; desc: string; icon: string; color: string }[] = [
    { type: 'musteriler', title: 'Müşteri Portföy Listesi', desc: 'Tüm müşteriler — isim, TC, telefon, e-posta, kayıt tarihi', icon: '👥', color: '#ebf8ff' },
    { type: 'aktif_policeler', title: 'Aktif Poliçe & Üretim Raporu', desc: 'Poliçe no, müşteri, şirket, prim, bitiş tarihi', icon: '🛡️', color: '#f0fff4' },
    { type: 'finans_taksit', title: 'Müşteri Borç & Taksit Raporu', desc: 'Kimin ne borcu kalmış, taksit durumları, tahsilatlar', icon: '💳', color: '#fef2f2' },
    { type: 'yaklasan_policeler', title: 'Yaklaşan Yenileme & Bitenler', desc: 'Yenilemesi yaklaşan ve biten durumdaki poliçeler', icon: '⚠️', color: '#fffbeb' },
    { type: 'sirket_bazli', title: 'Şirket Bazlı Üretim Analizi', desc: 'Her sigorta şirketine göre prim ve poliçe adedi dağılımı', icon: '📈', color: '#faf5ff' },
  ];

  const liveCustomers = getLiveCustomers();
  const livePolicies = getLivePolicies();

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Finansal Raporlar & Üretim Analizi</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '2px' }}>
            Kurumsal logolu modern PDF veya Excel (CSV) formatında tek tıkla resmi raporlar üretin ve indirin.
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className={styles.card} style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2d3748', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#3498db" /> Tarih Aralığı Filtresi
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#718096', marginBottom: '6px' }}>Başlangıç</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setQuickRange(''); }} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#718096', marginBottom: '6px' }}>Bitiş</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setQuickRange(''); }} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[{ key: 'bu_hafta', label: 'Bu Hafta' }, { key: 'bu_ay', label: 'Bu Ay' }, { key: 'bu_yil', label: 'Bu Yıl' }].map(r => (
              <button key={r.key} onClick={() => setRange(r.key)} style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: quickRange === r.key ? '#031924' : '#edf2f7', color: quickRange === r.key ? 'white' : '#4a5568', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {(startDate || endDate) && (
          <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#718096' }}>
            Seçili aralık: <strong>{startDate || '...'}</strong> — <strong>{endDate || '...'}</strong>
            {' '}<button onClick={() => { setStartDate(''); setEndDate(''); setQuickRange(''); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Temizle</button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'TOPLAM MÜŞTERİ', value: liveCustomers.length + ' Kişi', color: '#3498db' },
          { label: 'TOPLAM POLİÇE', value: livePolicies.length + ' Adet', color: '#2ecc71' },
          { label: 'TOPLAM ÜRETİM', value: livePolicies.reduce((s, p) => s + p.premium, 0).toLocaleString('tr-TR') + ' ₺', color: '#f1c40f' },
          { label: 'AKTİF POLİÇE', value: livePolicies.filter(p => p.status === 'Aktif').length + ' Adet', color: '#27ae60' },
        ].map(({ label, value, color }) => (
          <div key={label} className={styles.card} style={{ borderLeft: '4px solid ' + color }}>
            <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d3748', marginTop: '4px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Report Download Cards */}
      <div className={styles.card}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2d3748', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet size={18} color="#3498db" /> İndirilebilir Kurumsal Raporlar
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {reports.map(r => (
            <div key={r.type} style={{ padding: '22px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: r.color, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '1.8rem' }}>{r.icon}</div>
              <div>
                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{r.title}</div>
                <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>{r.desc}</div>
              </div>

              {/* Dual Download Buttons */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleDownloadPDF(r.type)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0f172a',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)'
                  }}
                >
                  <FileText size={15} color="#38bdf8" /> PDF İndir
                </button>

                <button
                  onClick={() => handleDownloadCSV(r.type)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Download size={14} /> Excel (CSV)
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
