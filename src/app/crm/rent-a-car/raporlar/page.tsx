"use client";

import { useState, useEffect } from 'react';
import { 
  Download, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Archive, 
  Database, 
  Car
} from 'lucide-react';
import { RentCustomer, RentalBooking, RentVehicle } from '@/data/rentCrmData';
import { 
  fetchRentBookingsFromCloud, 
  fetchRentCustomersFromCloud, 
  fetchRentVehiclesFromCloud 
} from '@/lib/supabaseService';
import { generateModernPDF } from '@/lib/pdfReportGenerator';
import styles from '../layout.module.css';

type RentReportType = 'kiralamalar' | 'arac_kullanim' | 'musteriler' | 'gelir_ozeti';

export default function RentRaporlarPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [customers, setCustomers] = useState<RentCustomer[]>([]);
  const [vehicles, setVehicles] = useState<RentVehicle[]>([]);

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [backupPeriod, setBackupPeriod] = useState<string>(currentYearMonth);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickRange, setQuickRange] = useState('');

  useEffect(() => {
    setIsMounted(true);
    async function loadCloudData() {
      try {
        const [cloudBookings, cloudCusts, cloudVehs] = await Promise.all([
          fetchRentBookingsFromCloud(),
          fetchRentCustomersFromCloud(),
          fetchRentVehiclesFromCloud()
        ]);
        if (cloudBookings) setBookings(cloudBookings);
        if (cloudCusts) setCustomers(cloudCusts);
        if (cloudVehs) setVehicles(cloudVehs);
      } catch (err) {
        console.error('Supabase rent load error:', err);
      }
    }
    loadCloudData();
  }, []);

  const isDateInPeriod = (dateStr?: string, period?: string): boolean => {
    if (!dateStr || !period || period === 'ALL') return true;
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const ym = `${parts[2]}-${parts[1].padStart(2, '0')}`;
        return ym === period;
      }
    }
    if (dateStr.includes('-')) {
      return dateStr.startsWith(period);
    }
    return true;
  };

  const monthlyBookings = bookings.filter(b => isDateInPeriod(b.pickupDate, backupPeriod));
  const monthlyTotalRevenue = monthlyBookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
  const monthlyTotalDays = monthlyBookings.reduce((s, b) => s + (Number(b.days) || 0), 0);

  const getPeriodLabel = (period: string) => {
    if (period === 'ALL') return 'TÜM ZAMANLAR (KONSOLİDE YILLIK)';
    const [year, month] = period.split('-');
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const mIdx = parseInt(month, 10) - 1;
    return `${months[mIdx] || month} ${year}`;
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

  const downloadCSV = (filename: string, contentString: string) => {
    const bom = '\uFEFF';
    const blob = new Blob([bom + contentString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMonthlyExcelBackup = () => {
    const periodName = getPeriodLabel(backupPeriod);
    const dateStamp = new Date().toLocaleDateString('tr-TR');
    let csv = `ELİSAM RENT A CAR - AYLIK TAM SİSTEM YEDEĞİ & FAALİYET DÖKÜMÜ\nDönem:;${periodName}\nYedek Alma Tarihi:;${dateStamp}\n\n=== 1. DÖNEM ÖZETİ ===\nToplam Kiralama Sözleşmesi;${monthlyBookings.length} Adet\nToplam Kiralanan Gün Sayısı;${monthlyTotalDays} Gün\nToplam Kiralama Geliri;${monthlyTotalRevenue.toFixed(2)} TL\n\n=== 2. KİRALAMA SÖZLEŞMELERİ (${monthlyBookings.length} ADET) ===\nSözleşme No;Araç Modeli;Plaka;Müşteri / Sürücü;Teslim Tarihi;İade Tarihi;Gün;Tutar (TL);Ödeme Yöntemi;Durum\n`;
    if (monthlyBookings.length > 0) {
      monthlyBookings.forEach(b => { csv += `"${b.id}";"${b.vehicleName}";"${b.vehiclePlate}";"${b.customerName}";"${b.pickupDate}";"${b.returnDate}";"${b.days}";"${b.totalAmount}";"${b.paymentMethod}";"${b.status}"\n`; });
    } else { csv += `"(Bu dönemde kiralama kaydı bulunmamaktadır)";"";"";"";"";"";"";"";"";""\n`; }
    csv += `\n=== 3. SÜRÜCÜ & MÜŞTERİ PORTFÖYÜ (${customers.length} KİŞİ) ===\nMüşteri No;Ad Soyad;Ülke;TCKN / Pasaport;Telefon;E-Posta\n`;
    customers.forEach(c => { csv += `"${c.id}";"${c.name}";"${c.country}";"${c.identityOrPassport}";"${c.phone}";"${c.email}"\n`; });
    downloadCSV(`Elisam_RentACar_Aylik_Tam_Yedek_${backupPeriod.replace('-', '_')}.csv`, csv);
  };

  const handleDownloadMonthlyPDFReport = () => {
    const periodName = getPeriodLabel(backupPeriod);
    const dateStamp = new Date().toLocaleDateString('tr-TR');
    const headers = ['Sözleşme No', 'Araç / Plaka', 'Müşteri / Sürücü', 'Teslim', 'İade', 'Gün', 'Tutar (₺)', 'Durum'];
    const rows = monthlyBookings.length > 0 ? monthlyBookings.map(b => [b.id, `${b.vehicleName} (${b.vehiclePlate})`, b.customerName, b.pickupDate, b.returnDate, `${b.days} Gün`, `${b.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, b.status]) : [['-', '-', 'Bu dönem için kayıtlı kiralama bulunamadı', '-', '-', '-', '-', '-']];
    generateModernPDF({
      title: `${periodName.toUpperCase()} RENT A CAR FAALİYET VE YEDEK RAPORU`,
      subtitle: `Elisam Rent A Car Filo Yönetimi • ${periodName} Dönemi Kiralama ve Hasılat Dökümü`,
      category: 'RENT A CAR FİLO',
      dateRange: `Seçili Dönem: ${periodName} (Rapor Tarihi: ${dateStamp})`,
      kpis: [
        { label: 'TOPLAM KİRALAMA', value: `${monthlyBookings.length} İşlem`, color: '#e67e22' },
        { label: 'KİRALANAN GÜN', value: `${monthlyTotalDays} Gün`, color: '#0284c7' },
        { label: 'TOPLAM CİRO', value: `${monthlyTotalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, color: '#16a34a' }
      ],
      headers,
      rows,
      summaryNotes: [`DÖNEM TOPLAMLARI: Kiralama: ${monthlyBookings.length} İşlem | Toplam Gün: ${monthlyTotalDays} Gün | Toplam Ciro: ${monthlyTotalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`]
    });
  };

  const handleDownloadJSONBackup = () => {
    const backupData = { backupTitle: 'Elisam Rent A Car Tam Sistem Veritabanı Yedeği', backupCreatedAt: new Date().toISOString(), backupPeriod, totalBookings: bookings.length, totalCustomers: customers.length, totalVehicles: vehicles.length, bookings, customers, vehicles };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Elisam_RentACar_Veritabani_Yedegi_${backupPeriod.replace('-', '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCSV = (type: RentReportType) => {
    const today = new Date().toLocaleDateString('tr-TR');
    if (type === 'kiralamalar') {
      const rows = [['Sözleşme No', 'Araç', 'Plaka', 'Müşteri', 'Teslim Tarihi', 'İade Tarihi', 'Gün', 'Toplam Tutar (TL)', 'Ödeme Yöntemi', 'Durum'], ...bookings.map(b => [b.id, b.vehicleName, b.vehiclePlate, b.customerName, b.pickupDate, b.returnDate, String(b.days), String(b.totalAmount), b.paymentMethod, b.status])];
      downloadCSV(`elisam-rent-kiralamalar-${today}.csv`, rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    } else if (type === 'arac_kullanim') {
      const map: Record<string, any> = {};
      bookings.forEach(b => { if (!map[b.vehicleId]) map[b.vehicleId] = { name: b.vehicleName, plate: b.vehiclePlate, bookings: 0, totalDays: 0, totalRevenue: 0 }; map[b.vehicleId].bookings++; map[b.vehicleId].totalDays += b.days; map[b.vehicleId].totalRevenue += b.totalAmount; });
      const rows = [['Araç Modeli', 'Plaka', 'Kiralama Adedi', 'Toplam Kiralanan Gün', 'Toplam Gelir (TL)'], ...Object.values(map).map((v: any) => [v.name, v.plate, String(v.bookings), String(v.totalDays), String(v.totalRevenue)])];
      downloadCSV(`elisam-rent-arac-kullanim-${today}.csv`, rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    } else if (type === 'musteriler') {
      const rows = [['Müşteri ID', 'Ad Soyad', 'Ülke', 'Kimlik / Pasaport', 'Telefon', 'E-Posta', 'Toplam Kiralama'], ...customers.map(c => [c.id, c.name, c.country, c.identityOrPassport, c.phone, c.email, String(c.totalRentals)])];
      downloadCSV(`elisam-rent-musteri-listesi-${today}.csv`, rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    } else if (type === 'gelir_ozeti') {
      const totalRevenue = bookings.reduce((s, b) => s + b.totalAmount, 0);
      const byPayment: Record<string, number> = {};
      bookings.forEach(b => { byPayment[b.paymentMethod] = (byPayment[b.paymentMethod] || 0) + b.totalAmount; });
      const rows = [['Ödeme Yöntemi', 'Toplam Gelir (TL)', 'İşlem Adedi'], ...Object.entries(byPayment).map(([k, v]) => [k, String(v), String(bookings.filter(b => b.paymentMethod === k).length)]), ['GENEL TOPLAM', String(totalRevenue), String(bookings.length)]];
      downloadCSV(`elisam-rent-gelir-ozeti-${today}.csv`, rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    }
  };

  const handleDownloadPDF = (type: RentReportType) => {
    const totalRev = bookings.reduce((s, b) => s + b.totalAmount, 0);
    const dateRangeStr = (startDate && endDate) ? `${startDate} - ${endDate}` : undefined;
    if (type === 'kiralamalar') {
      generateModernPDF({ title: 'RENT A CAR KİRALAMA VE SÖZLEŞME RAPORU', category: 'RENT A CAR FİLO', dateRange: dateRangeStr, kpis: [{ label: 'TOPLAM KİRALAMA', value: `${bookings.length} İşlem`, color: '#e67e22' }, { label: 'TOPLAM CİRO', value: `${totalRev.toLocaleString('tr-TR')} ₺`, color: '#16a34a' }], headers: ['Sözleşme No', 'Araç / Plaka', 'Müşteri / Sürücü', 'Teslim', 'İade', 'Gün', 'Tutar (₺)', 'Durum'], rows: bookings.map(b => [b.id, `${b.vehicleName} (${b.vehiclePlate})`, b.customerName, b.pickupDate, b.returnDate, `${b.days} Gün`, `${b.totalAmount.toLocaleString('tr-TR')} ₺`, b.status]) });
    } else if (type === 'arac_kullanim') {
      const map: Record<string, any> = {};
      bookings.forEach(b => { if (!map[b.vehicleId]) map[b.vehicleId] = { name: b.vehicleName, plate: b.vehiclePlate, bookings: 0, totalDays: 0, totalRevenue: 0 }; map[b.vehicleId].bookings++; map[b.vehicleId].totalDays += b.days; map[b.vehicleId].totalRevenue += b.totalAmount; });
      generateModernPDF({ title: 'ARAÇ KULLANIM VE VERİMLİLİK ANALİZİ', category: 'RENT A CAR FİLO', dateRange: dateRangeStr, kpis: [{ label: 'TOPLAM FİLO', value: `${vehicles.length} Araç`, color: '#3498db' }, { label: 'TOPLAM GELİR', value: `${totalRev.toLocaleString('tr-TR')} ₺`, color: '#16a34a' }], headers: ['Araç Modeli', 'Plaka', 'Kiralama Sayısı', 'Toplam Gün', 'Toplam Gelir (₺)'], rows: Object.values(map).map((v: any) => [v.name, v.plate, `${v.bookings} Kez`, `${v.totalDays} Gün`, `${v.totalRevenue.toLocaleString('tr-TR')} ₺`]) });
    } else if (type === 'musteriler') {
      generateModernPDF({ title: 'RENT A CAR MÜŞTERİ & SÜRÜCÜ LİSTESİ', category: 'RENT A CAR FİLO', dateRange: dateRangeStr, kpis: [{ label: 'TOPLAM SÜRÜCÜ', value: `${customers.length} Kişi`, color: '#e67e22' }], headers: ['Müşteri No', 'Ad Soyad', 'Ülke', 'Kimlik / Pasaport No', 'Telefon', 'Toplam Kiralama'], rows: customers.map(c => [c.id, c.name, c.country, c.identityOrPassport, c.phone, `${c.totalRentals} İşlem`]) });
    } else if (type === 'gelir_ozeti') {
      const byPayment: Record<string, number> = {};
      bookings.forEach(b => { byPayment[b.paymentMethod] = (byPayment[b.paymentMethod] || 0) + b.totalAmount; });
      generateModernPDF({ title: 'FİLO GELİR VE ÖDEME YÖNTEMLERİ ANALİZİ', category: 'RENT A CAR FİLO', dateRange: dateRangeStr, kpis: [{ label: 'TOPLAM GELİR', value: `${totalRev.toLocaleString('tr-TR')} ₺`, color: '#16a34a' }, { label: 'İŞLEM ADEDİ', value: `${bookings.length} Adet`, color: '#3498db' }], headers: ['Ödeme Yöntemi / Kanal', 'Toplam Hasılat (₺)', 'İşlem Adedi', 'Pay (%)'], rows: Object.entries(byPayment).map(([k, v]) => [k, `${v.toLocaleString('tr-TR')} ₺`, `${bookings.filter(b => b.paymentMethod === k).length} İşlem`, `%${totalRev > 0 ? Math.round((v / totalRev) * 100) : 0}`]) });
    }
  };

  const reports = [
    { type: 'kiralamalar', title: 'Tüm Kiralama Sözleşmeleri', desc: 'Sözleşme no, araç, müşteri, teslim-iade tarihleri, tutar', icon: '📋', color: '#fffaf0' },
    { type: 'arac_kullanim', title: 'Araç Kullanım & Verimlilik', desc: 'Hangi araç kaç gün kiralandı, ne kadar gelir getirdi', icon: '🚗', color: '#ebf8ff' },
    { type: 'gelir_ozeti', title: 'Gelir & Ödeme Dağılımı', desc: 'Nakit, kredi kartı, havale/EFT gelir toplamları', icon: '💰', color: '#f0fff4' },
    { type: 'musteriler', title: 'Müşteri & Sürücü Portföyü', desc: 'Tüm kayıtlı sürücüler, pasaport/TC, telefon ve kiralama sayısı', icon: '👤', color: '#faf5ff' },
  ];

  const periodOptions = [
    { value: currentYearMonth, label: `🗓️ ${getPeriodLabel(currentYearMonth)} (Bu Ay)` },
    { value: 'ALL', label: '🌐 TÜM ZAMANLAR (Tüm Yıllık Konsolide Yedek)' }
  ];

  if (!isMounted) return null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Car size={28} color="#e67e22" /> Rent A Car Raporlama & Yedekleme
          </h1>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: '26px', padding: '24px', border: '2px solid #e67e22', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: '#0f172a' }}>📦 Aylık Filo Kiralama Yedeği</div>
            <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Tüm verileri arşivleyin.</div>
          </div>
          <select value={backupPeriod} onChange={(e) => setBackupPeriod(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: '2px solid #e67e22', cursor: 'pointer' }}>
            {periodOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderLeft: '4px solid #e67e22' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Kiralama</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{monthlyBookings.length} İşlem</div>
          </div>
          <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Hasılat</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{monthlyTotalRevenue.toLocaleString('tr-TR')} ₺</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <button onClick={handleDownloadMonthlyExcelBackup} style={{ padding: '12px', backgroundColor: '#047857', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Excel Yedeği</button>
          <button onClick={handleDownloadMonthlyPDFReport} style={{ padding: '12px', backgroundColor: '#e67e22', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>PDF Rapor</button>
          <button onClick={handleDownloadJSONBackup} style={{ padding: '12px', backgroundColor: '#334155', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>JSON Veritabanı</button>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}><Calendar size={18} /> Tarih Aralığı Filtresi</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }} />
          <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ padding: '8px 12px', background: '#eee', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Sıfırla</button>
        </div>
      </div>

      <div className={styles.card}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}><FileSpreadsheet size={18} /> Modül Bazlı Raporlar</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {reports.map(r => (
            <div key={r.type} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: r.color }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{r.icon}</div>
              <div style={{ fontWeight: 800, marginBottom: '5px' }}>{r.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>{r.desc}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleDownloadPDF(r.type as RentReportType)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer' }}>PDF</button>
                <button onClick={() => handleDownloadCSV(r.type as RentReportType)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>CSV</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
