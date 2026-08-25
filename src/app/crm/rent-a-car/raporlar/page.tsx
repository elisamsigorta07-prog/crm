"use client";

import { useState } from 'react';
import { Download, Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import { initialRentCustomersData, initialBookingsData, initialVehiclesData } from '@/data/rentCrmData';
import { generateModernPDF } from '@/lib/pdfReportGenerator';
import styles from '../layout.module.css';

type RentReportType = 'kiralamalar' | 'arac_kullanim' | 'musteriler' | 'gelir_ozeti';

export default function RentRaporlarPage() {
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

  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const bom = '\uFEFF';
    const csv = bom + rows.map(r => r.map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = (type: RentReportType) => {
    const today = new Date().toLocaleDateString('tr-TR');
    if (type === 'kiralamalar') {
      const rows = [
        ['Sözleşme No', 'Araç', 'Plaka', 'Müşteri', 'Teslim Tarihi', 'İade Tarihi', 'Gün', 'Toplam Tutar (TL)', 'Ödeme Yöntemi', 'Durum'],
        ...initialBookingsData.map(b => [b.id, b.vehicleName, b.vehiclePlate, b.customerName, b.pickupDate, b.returnDate, String(b.days), String(b.totalAmount), b.paymentMethod, b.status])
      ];
      if (rows.length === 1) rows.push(['(Kayıtlı kiralama bulunamadı)', '', '', '', '', '', '', '', '', '']);
      downloadCSV(`elisam-rent-kiralamalar-${today}.csv`, rows);
    } else if (type === 'arac_kullanim') {
      const map: Record<string, { name: string; plate: string; bookings: number; totalDays: number; totalRevenue: number }> = {};
      initialBookingsData.forEach(b => {
        if (!map[b.vehicleId]) map[b.vehicleId] = { name: b.vehicleName, plate: b.vehiclePlate, bookings: 0, totalDays: 0, totalRevenue: 0 };
        map[b.vehicleId].bookings++;
        map[b.vehicleId].totalDays += b.days;
        map[b.vehicleId].totalRevenue += b.totalAmount;
      });
      const rows = [
        ['Araç Modeli', 'Plaka', 'Kiralama Adedi', 'Toplam Kiralanan Gün', 'Toplam Gelir (TL)'],
        ...Object.values(map).map(v => [v.name, v.plate, String(v.bookings), String(v.totalDays), String(v.totalRevenue)])
      ];
      if (rows.length === 1) rows.push(['(Veri yok)', '', '', '', '']);
      downloadCSV(`elisam-rent-arac-kullanim-${today}.csv`, rows);
    } else if (type === 'musteriler') {
      const rows = [
        ['Müşteri ID', 'Ad Soyad', 'Ülke', 'Kimlik / Pasaport', 'Telefon', 'E-Posta', 'Toplam Kiralama'],
        ...initialRentCustomersData.map(c => [c.id, c.name, c.country, c.identityOrPassport, c.phone, c.email, String(c.totalRentals)])
      ];
      if (rows.length === 1) rows.push(['(Kayıtlı müşteri bulunamadı)', '', '', '', '', '', '']);
      downloadCSV(`elisam-rent-musteri-listesi-${today}.csv`, rows);
    } else if (type === 'gelir_ozeti') {
      const totalRevenue = initialBookingsData.reduce((s, b) => s + b.totalAmount, 0);
      const byPayment: Record<string, number> = {};
      initialBookingsData.forEach(b => {
        byPayment[b.paymentMethod] = (byPayment[b.paymentMethod] || 0) + b.totalAmount;
      });
      const rows = [
        ['Ödeme Yöntemi', 'Toplam Gelir (TL)', 'İşlem Adedi'],
        ...Object.entries(byPayment).map(([k, v]) => [k, String(v), String(initialBookingsData.filter(b => b.paymentMethod === k).length)]),
        ['GENEL TOPLAM', String(totalRevenue), String(initialBookingsData.length)]
      ];
      downloadCSV(`elisam-rent-gelir-ozeti-${today}.csv`, rows);
    }
  };

  const handleDownloadPDF = (type: RentReportType) => {
    const totalRev = initialBookingsData.reduce((s, b) => s + b.totalAmount, 0);
    const dateRangeStr = (startDate && endDate) ? `${startDate} - ${endDate}` : undefined;

    if (type === 'kiralamalar') {
      generateModernPDF({
        title: 'RENT A CAR KİRALAMA VE SÖZLEŞME RAPORU',
        subtitle: 'Filomuzdaki tüm araçların kiralama sözleşmeleri, teslim-iade tarihleri ve gelir dökümü',
        category: 'RENT A CAR FİLO',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'TOPLAM KİRALAMA', value: `${initialBookingsData.length} İşlem`, color: '#e67e22' },
          { label: 'TOPLAM CİRO', value: `${totalRev.toLocaleString('tr-TR')} ₺`, color: '#16a34a' },
          { label: 'AKTİF KİRADA', value: `${initialBookingsData.filter(b => b.status === 'Aktif').length} Araç`, color: '#2563eb' }
        ],
        headers: ['Sözleşme No', 'Araç / Plaka', 'Müşteri / Sürücü', 'Teslim', 'İade', 'Gün', 'Tutar (₺)', 'Durum'],
        rows: initialBookingsData.length > 0 ? initialBookingsData.map(b => [
          b.id,
          `${b.vehicleName} (${b.vehiclePlate})`,
          b.customerName,
          b.pickupDate,
          b.returnDate,
          `${b.days} Gün`,
          `${b.totalAmount.toLocaleString('tr-TR')} ₺`,
          b.status
        ]) : [['-', 'Kayıtlı kiralama bulunamadı', '-', '-', '-', '-', '-', '-']]
      });
    } else if (type === 'arac_kullanim') {
      const map: Record<string, { name: string; plate: string; bookings: number; totalDays: number; totalRevenue: number }> = {};
      initialBookingsData.forEach(b => {
        if (!map[b.vehicleId]) map[b.vehicleId] = { name: b.vehicleName, plate: b.vehiclePlate, bookings: 0, totalDays: 0, totalRevenue: 0 };
        map[b.vehicleId].bookings++;
        map[b.vehicleId].totalDays += b.days;
        map[b.vehicleId].totalRevenue += b.totalAmount;
      });

      generateModernPDF({
        title: 'ARAÇ KULLANIM VE VERİMLİLİK ANALİZİ',
        subtitle: 'Araç bazında toplam kiralanma gün sayısı, talep adedi ve üretilen hasılat',
        category: 'RENT A CAR FİLO',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'FİLO ADEDİ', value: `${initialVehiclesData.length} Araç`, color: '#2563eb' },
          { label: 'TOPLAM HASILAT', value: `${totalRev.toLocaleString('tr-TR')} ₺`, color: '#16a34a' }
        ],
        headers: ['Araç Modeli', 'Plaka', 'Kiralama Adedi', 'Toplam Kiralanan Gün', 'Üretilen Gelir (₺)'],
        rows: Object.values(map).map(v => [
          v.name,
          v.plate,
          `${v.bookings} Kez`,
          `${v.totalDays} Gün`,
          `${v.totalRevenue.toLocaleString('tr-TR')} ₺`
        ])
      });
    } else if (type === 'musteriler') {
      generateModernPDF({
        title: 'RENT A CAR MÜŞTERİ VE SÜRÜCÜ LİSTESİ',
        subtitle: 'Kayıtlı yerli ve yabancı müşteri/sürücü portföyü ve kiralama sayıları',
        category: 'RENT A CAR FİLO',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'TOPLAM MÜŞTERİ', value: `${initialRentCustomersData.length} Sürücü`, color: '#e67e22' }
        ],
        headers: ['Müşteri No', 'Ad Soyad', 'Ülke', 'Kimlik / Pasaport', 'Telefon', 'Toplam Kiralama'],
        rows: initialRentCustomersData.length > 0 ? initialRentCustomersData.map(c => [
          c.id,
          c.name,
          c.country,
          c.identityOrPassport,
          c.phone,
          `${c.totalRentals} İşlem`
        ]) : [['-', 'Kayıtlı müşteri bulunamadı', '-', '-', '-', '-']]
      });
    } else if (type === 'gelir_ozeti') {
      const byPayment: Record<string, number> = {};
      initialBookingsData.forEach(b => {
        byPayment[b.paymentMethod] = (byPayment[b.paymentMethod] || 0) + b.totalAmount;
      });

      generateModernPDF({
        title: 'ÖDEME YÖNTEMLERİNE GÖRE GELİR VE KASA ÖZETİ',
        subtitle: 'Nakit, Kredi Kartı ve Havale kanallarından tahsil edilen kiralama gelirleri dağılımı',
        category: 'RENT A CAR FİLO',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'TOPLAM GELİR', value: `${totalRev.toLocaleString('tr-TR')} ₺`, color: '#16a34a' },
          { label: 'İŞLEM SAYISI', value: `${initialBookingsData.length} Adet`, color: '#2563eb' }
        ],
        headers: ['Ödeme Kanalı', 'Toplam Tahsil Edilen Gelir (₺)', 'Kiralama Adedi', 'Pay (%)'],
        rows: Object.entries(byPayment).map(([k, v]) => [
          k,
          `${v.toLocaleString('tr-TR')} ₺`,
          `${initialBookingsData.filter(b => b.paymentMethod === k).length} İşlem`,
          `%${totalRev > 0 ? Math.round((v / totalRev) * 100) : 0}`
        ])
      });
    }
  };

  const reports: { type: RentReportType; title: string; desc: string; icon: string; color: string }[] = [
    { type: 'kiralamalar', title: 'Kiralama & Sözleşme Listesi', desc: 'Tüm kiralamalar — araç, müşteri, tarihler, tutar, durum', icon: '🚗', color: '#fff7ed' },
    { type: 'arac_kullanim', title: 'Araç Kullanım & Verimlilik', desc: 'Araç bazlı toplam gün, kiralama adedi ve gelir analizi', icon: '🏎️', color: '#f0fdf4' },
    { type: 'musteriler', title: 'Rent Müşteri & Sürücü Listesi', desc: 'Müşteri bilgileri — TC/Pasaport, telefon, kiralama sayısı', icon: '👥', color: '#eff6ff' },
    { type: 'gelir_ozeti', title: 'Gelir & Kasa Dağılımı', desc: 'Ödeme yöntemine göre toplam gelir ve tahsilat dökümü', icon: '💵', color: '#fdf4ff' },
  ];

  const totalRevenue = initialBookingsData.reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Rent A Car Filo & Gelir Raporları</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '2px' }}>
            Kurumsal logolu modern PDF veya Excel (CSV) formatında tek tıkla resmi raporlar üretin ve indirin.
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className={styles.card} style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2d3748', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#e67e22" /> Tarih Aralığı Filtresi
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
              <button key={r.key} onClick={() => setRange(r.key)} style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: quickRange === r.key ? '#e67e22' : '#edf2f7', color: quickRange === r.key ? 'white' : '#4a5568', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
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
          { label: 'TOPLAM MÜŞTERİ', value: initialRentCustomersData.length + ' Sürücü', color: '#e67e22' },
          { label: 'TOPLAM ARAÇ', value: initialVehiclesData.length + ' Araç', color: '#3498db' },
          { label: 'TOPLAM KİRALAMA', value: initialBookingsData.length + ' İşlem', color: '#2ecc71' },
          { label: 'TOPLAM GELİR', value: totalRevenue.toLocaleString('tr-TR') + ' ₺', color: '#27ae60' },
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
          <FileSpreadsheet size={18} color="#e67e22" /> İndirilebilir Kurumsal Raporlar
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
                  <FileText size={15} color="#fb923c" /> PDF İndir
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
