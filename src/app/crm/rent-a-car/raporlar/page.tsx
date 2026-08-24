"use client";

import { useState } from 'react';
import { Download, Calendar, FileSpreadsheet } from 'lucide-react';
import { initialRentCustomersData, initialBookingsData, initialVehiclesData } from '@/data/rentCrmData';
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

  const downloadCSV = (filename: string, rows: string[][]) => {
    const bom = '\uFEFF';
    const csv = bom + rows.map(r => r.map(v => '"' + (v || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = (type: RentReportType) => {
    const today = new Date().toLocaleDateString('tr-TR');
    if (type === 'kiralamalar') {
      const rows = [
        ['Sozlesme No', 'Arac', 'Plaka', 'Musteri', 'Teslim Tarihi', 'Iade Tarihi', 'Gun', 'Toplam (TL)', 'Odeme', 'Durum'],
        ...initialBookingsData.map(b => [b.id, b.vehicleName, b.vehiclePlate, b.customerName, b.pickupDate, b.returnDate, String(b.days), String(b.totalAmount), b.paymentMethod, b.status])
      ];
      if (rows.length === 1) rows.push(['(Kayitli kiralama yok)', '', '', '', '', '', '', '', '', '']);
      downloadCSV('kiralama-listesi-' + today + '.csv', rows);
    } else if (type === 'arac_kullanim') {
      const map: Record<string, { name: string; plate: string; bookings: number; totalDays: number; totalRevenue: number }> = {};
      initialBookingsData.forEach(b => {
        if (!map[b.vehicleId]) map[b.vehicleId] = { name: b.vehicleName, plate: b.vehiclePlate, bookings: 0, totalDays: 0, totalRevenue: 0 };
        map[b.vehicleId].bookings++;
        map[b.vehicleId].totalDays += b.days;
        map[b.vehicleId].totalRevenue += b.totalAmount;
      });
      const rows = [
        ['Arac', 'Plaka', 'Kiralama Adedi', 'Toplam Gun', 'Toplam Gelir (TL)'],
        ...Object.values(map).map(v => [v.name, v.plate, String(v.bookings), String(v.totalDays), String(v.totalRevenue)])
      ];
      if (rows.length === 1) rows.push(['(Veri yok)', '', '', '', '']);
      downloadCSV('arac-kullanim-raporu-' + today + '.csv', rows);
    } else if (type === 'musteriler') {
      const rows = [
        ['Musteri ID', 'Ad Soyad', 'Ulke', 'Kimlik/Pasaport', 'Telefon', 'E-posta', 'Toplam Kiralama'],
        ...initialRentCustomersData.map(c => [c.id, c.name, c.country, c.identityOrPassport, c.phone, c.email, String(c.totalRentals)])
      ];
      if (rows.length === 1) rows.push(['(Kayitli musteri yok)', '', '', '', '', '', '']);
      downloadCSV('rent-musteri-listesi-' + today + '.csv', rows);
    } else if (type === 'gelir_ozeti') {
      const totalRevenue = initialBookingsData.reduce((s, b) => s + b.totalAmount, 0);
      const byPayment: Record<string, number> = {};
      initialBookingsData.forEach(b => {
        byPayment[b.paymentMethod] = (byPayment[b.paymentMethod] || 0) + b.totalAmount;
      });
      const rows = [
        ['Odeme Yontemi', 'Toplam Gelir (TL)', 'Kiralama Adedi'],
        ...Object.entries(byPayment).map(([k, v]) => [k, String(v), String(initialBookingsData.filter(b => b.paymentMethod === k).length)]),
        ['GENEL TOPLAM', String(totalRevenue), String(initialBookingsData.length)]
      ];
      downloadCSV('gelir-ozeti-' + today + '.csv', rows);
    }
  };

  const reports: { type: RentReportType; title: string; desc: string; icon: string; color: string }[] = [
    { type: 'kiralamalar', title: 'Kiralama Listesi', desc: 'Tum kiralamalar — arac, musteri, tarihler, tutar', icon: '🚗', color: '#fff7ed' },
    { type: 'arac_kullanim', title: 'Arac Kullanim Raporu', desc: 'Arac bazli toplam gun, kiralama adedi ve gelir', icon: '🏎️', color: '#f0fdf4' },
    { type: 'musteriler', title: 'Rent Musteri Listesi', desc: 'Musteri bilgileri — TC/Pasaport, telefon, kiralama sayisi', icon: '👥', color: '#eff6ff' },
    { type: 'gelir_ozeti', title: 'Gelir Ozeti', desc: 'Odeme yontemine gore toplam gelir ve kiralama dagilimi', icon: '💵', color: '#fdf4ff' },
  ];

  const totalRevenue = initialBookingsData.reduce((s, b) => s + b.totalAmount, 0);
  const activeRentals = initialBookingsData.filter(b => b.status === 'Aktif').length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Rent A Car Filo & Gelir Raporlari</h1>
      </div>

      {/* Date Range Filter */}
      <div className={styles.card} style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#2d3748', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#e67e22" /> Tarih Araligi Filtresi
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
              <button key={r.key} onClick={() => setRange(r.key)} style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: quickRange === r.key ? '#e67e22' : '#edf2f7', color: quickRange === r.key ? 'white' : '#4a5568', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
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
          { label: 'TOPLAM MUSTERI', value: initialRentCustomersData.length + ' Surucü', color: '#e67e22' },
          { label: 'TOPLAM ARAC', value: initialVehiclesData.length + ' Arac', color: '#3498db' },
          { label: 'TOPLAM KIRALAMA', value: initialBookingsData.length + ' Islem', color: '#2ecc71' },
          { label: 'TOPLAM GELIR', value: totalRevenue.toLocaleString('tr-TR') + ' TL', color: '#27ae60' },
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
          <FileSpreadsheet size={18} color="#e67e22" /> Indirilebilir Raporlar
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
