"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Shield, 
  Download, 
  Calendar, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Archive, 
  Database, 
  FolderDown, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { Customer, Policy } from '@/data/crmData';
import { 
  CariMovement, 
  fetchPoliciesFromCloud, 
  fetchCustomersFromCloud, 
  fetchCariMovementsFromCloud 
} from '@/lib/supabaseService';
import { generateModernPDF } from '@/lib/pdfReportGenerator';
import styles from '../layout.module.css';

type ReportType = 'musteriler' | 'aktif_policeler' | 'yaklasan_policeler' | 'sirket_bazli' | 'finans_taksit';

export default function SigortaRaporlarPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [movements, setMovements] = useState<CariMovement[]>([]);

  // Aylık Yedekleme Dönemi (Varsayılan: İçinde bulunulan Yıl-Ay)
  const currentYearMonth = new Date().toISOString().slice(0, 7); // "2026-09"
  const [backupPeriod, setBackupPeriod] = useState<string>(currentYearMonth);

  // Tarih Aralığı Filtresi
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickRange, setQuickRange] = useState('');

  // Hydration-safe initial load from Supabase Cloud (with Local fallback)
  useEffect(() => {
    setIsMounted(true);
    async function loadCloudData() {
      try {
        const [cloudPols, cloudCusts, cloudMovs] = await Promise.all([
          fetchPoliciesFromCloud(),
          fetchCustomersFromCloud(),
          fetchCariMovementsFromCloud()
        ]);
        if (cloudCusts) setCustomers(cloudCusts);
        if (cloudPols) setPolicies(cloudPols);
        if (cloudMovs) setMovements(cloudMovs);
      } catch (err) {
        console.error('Supabase reports load error:', err);
      }
    }
    loadCloudData();
  }, []);

  // Tarihe göre dönem filtreleme fonksiyonları
  const isDateInPeriod = (dateStr?: string, period?: string): boolean => {
    if (!dateStr || !period || period === 'ALL') return true;
    // Format 1: "DD.MM.YYYY"
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const ym = `${parts[2]}-${parts[1].padStart(2, '0')}`;
        return ym === period;
      }
    }
    // Format 2: "YYYY-MM-DD"
    if (dateStr.includes('-')) {
      return dateStr.startsWith(period);
    }
    return true;
  };

  // Seçili Aylık Yedekleme Dönemine göre filtrelenmiş veriler
  const monthlyPolicies = policies.filter(p => isDateInPeriod(p.startDate, backupPeriod));
  const monthlyMovements = movements.filter(m => isDateInPeriod(m.date, backupPeriod));

  // Aylık Finansal Özet Hesaplamaları
  const monthlyTotalPremium = monthlyPolicies.reduce((s, p) => s + (Number(p.premium) || 0), 0);
  const monthlyDebitTotal = monthlyMovements.reduce((s, m) => s + (Number(m.debitAmount) || 0), 0);
  const monthlyCreditTotal = monthlyMovements.reduce((s, m) => s + (Number(m.creditAmount) || 0), 0);
  const monthlyNetBalance = monthlyDebitTotal - monthlyCreditTotal;

  // Dönem Başlık Formatı (Örn: "Eylül 2026")
  const getPeriodLabel = (period: string) => {
    if (period === 'ALL') return 'TÜM ZAMANLAR (KONSOLİDE YILLIK)';
    const [year, month] = period.split('-');
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
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
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // 1. AYLIK TOPLU EXCEL (CSV) YEDEĞİ İNDİR
  // ==========================================
  const handleDownloadMonthlyExcelBackup = () => {
    const periodName = getPeriodLabel(backupPeriod);
    const dateStamp = new Date().toLocaleDateString('tr-TR');

    let csv = `ELİSAM SİGORTA - AYLIK TAM SİSTEM YEDEĞİ & FAALİYET DÖKÜMÜ\n`;
    csv += `Dönem:;${periodName}\n`;
    csv += `Yedek Alma Tarihi:;${dateStamp}\n\n`;

    // BÖLÜM 1: AYLIK ÖZET METRİKLERİ
    csv += `=== 1. DÖNEM ÖZETİ VE FİNANSAL METRİKLER ===\n`;
    csv += `Metrik;Değer\n`;
    csv += `Toplam Kesilen Poliçe Adedi;${monthlyPolicies.length} Adet\n`;
    csv += `Toplam Üretilen Brüt Prim;${monthlyTotalPremium.toFixed(2)} TL\n`;
    csv += `Toplam Borç Hareketleri (Poliçe/Gider);${monthlyDebitTotal.toFixed(2)} TL\n`;
    csv += `Toplam Alınan (Tahsilat / Gelen Havale);${monthlyCreditTotal.toFixed(2)} TL\n`;
    csv += `Net Cari Bakiye;${monthlyNetBalance.toFixed(2)} TL (${monthlyNetBalance > 0 ? 'Borçlu' : 'Alacaklı'})\n\n`;

    // BÖLÜM 2: SEÇİLİ AYIN POLİÇELERİ
    csv += `=== 2. POLİÇE ÜRETİM KAYITLARI (${monthlyPolicies.length} ADET) ===\n`;
    csv += `Poliçe No;Müşteri Adı;Poliçe Türü;Sigorta Şirketi;Başlangıç Tarihi;Bitiş Tarihi;Brüt Prim (TL);Durum;Plaka\n`;
    if (monthlyPolicies.length > 0) {
      monthlyPolicies.forEach(p => {
        csv += `"${p.policyNo || p.id}";"${p.customerName}";"${p.type}";"${p.company}";"${p.startDate}";"${p.endDate}";"${p.premium}";"${p.status}";"${p.plate || '-'}"\n`;
      });
    } else {
      csv += `"(Bu dönemde kesilen poliçe bulunmamaktadır)";"";"";"";"";"";"";"";""\n`;
    }
    csv += `\n`;

    // BÖLÜM 3: CARİ HESAP & FİNANS HAREKETLERİ
    csv += `=== 3. CARİ HESAP & FİNANSAL HAREKETLER DEFTERİ (${monthlyMovements.length} İŞLEM) ===\n`;
    csv += `Tarih;Vade Tarihi;Fiş No;Müşteri / Cari Adı;Açıklama;İşlem Türü;Borç (TL);Alacak (TL)\n`;
    if (monthlyMovements.length > 0) {
      monthlyMovements.forEach(m => {
        csv += `"${m.date}";"${m.dueDate || '-'}";"${m.receiptNo || '-'}";"${m.customerName}";"${m.description.replace(/"/g, '""')}";"${m.movementType}";"${m.debitAmount.toFixed(2)}";"${m.creditAmount.toFixed(2)}"\n`;
      });
    } else {
      csv += `"(Bu dönemde kaydedilmiş cari hareket bulunmamaktadır)";"";"";"";"";"";"";""\n`;
    }
    csv += `\n`;

    // BÖLÜM 4: MÜŞTERİ PORTFÖYÜ
    csv += `=== 4. KAYITLI MÜŞTERİ LİSTESİ (${customers.length} KİŞİ/KURUM) ===\n`;
    csv += `Müşteri No;Ad Soyad / Firma Ünvanı;Müşteri Türü;TCKN / VKN;Telefon;E-Posta;Kayıt Tarihi\n`;
    customers.forEach(c => {
      csv += `"${c.id}";"${c.name}";"${c.type}";"${c.identityNo || '-'}";"${c.phone}";"${c.email || '-'}";"${c.createdAt}"\n`;
    });

    const filePeriodSlug = backupPeriod.replace('-', '_');
    downloadCSV(`Elisam_Sigorta_Aylik_Tam_Yedek_${filePeriodSlug}.csv`, csv);
  };

  // ==========================================
  // 2. AYLIK RESMİ PDF RAPORU ÜRET & YAZDIR
  // ==========================================
  const handleDownloadMonthlyPDFReport = () => {
    const periodName = getPeriodLabel(backupPeriod);
    const dateStamp = new Date().toLocaleDateString('tr-TR');

    const headers = ['Tarih', 'Fiş/Poliçe No', 'Müşteri / Cari', 'Açıklama & İşlem Türü', 'Borç / Prim (₺)', 'Tahsilat (₺)'];
    const rows: (string | number)[][] = [];

    // Önce o ayki poliçeleri ekle
    monthlyPolicies.forEach(p => {
      rows.push([
        p.startDate,
        p.policyNo || p.id,
        p.customerName,
        `🛡️ Poliçe: ${p.type} (${p.company})`,
        `${p.premium.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
        '-'
      ]);
    });

    // Sonra o ayki cari hareketleri ekle
    monthlyMovements.forEach(m => {
      rows.push([
        m.date,
        m.receiptNo || '-',
        m.customerName,
        `📑 ${m.movementType}: ${m.description}`,
        m.debitAmount > 0 ? `${m.debitAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-',
        m.creditAmount > 0 ? `${m.creditAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-'
      ]);
    });

    if (rows.length === 0) {
      rows.push(['-', '-', 'Bu dönem için kayıtlı veri bulunamadı', '-', '-', '-']);
    }

    generateModernPDF({
      title: `${periodName.toUpperCase()} AYLIK FAALİYET VE YEDEK RAPORU`,
      subtitle: `Elisam Sigorta Aracılık Hizmetleri • ${periodName} Dönemi Konsolide Üretim ve Finans Dökümü`,
      category: 'SİGORTA ACENTELİĞİ',
      dateRange: `Seçili Dönem: ${periodName} (Rapor Tarihi: ${dateStamp})`,
      kpis: [
        { label: 'TOPLAM POLİÇE', value: `${monthlyPolicies.length} Adet`, color: '#1e3a8a' },
        { label: 'ÜRETİLEN BRÜT PRİM', value: `${monthlyTotalPremium.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, color: '#0284c7' },
        { label: 'TOPLAM TAHSİLAT', value: `${monthlyCreditTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, color: '#16a34a' },
        { 
          label: 'NET CARİ BAKİYE', 
          value: `${Math.abs(monthlyNetBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ${monthlyNetBalance > 0 ? '(B)' : (monthlyNetBalance < 0 ? '(A)' : '')}`, 
          color: monthlyNetBalance > 0 ? '#dc2626' : (monthlyNetBalance < 0 ? '#2563eb' : '#16a34a') 
        }
      ],
      headers,
      rows,
      summaryNotes: [
        `DÖNEM TOPLAMLARI: Kesilen Poliçe: ${monthlyPolicies.length} Adet | Toplam Prim: ${monthlyTotalPremium.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ | Toplam Tahsilat: ${monthlyCreditTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ | Giden Ödemeler: ${monthlyDebitTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
        `İşbu rapor ${periodName} dönemine ait tüm sigorta faaliyetlerini, müşteri borçlandırmalarını ve tahsilatlarını içeren resmi Elisam Sigorta dökümüdür.`
      ]
    });
  };

  // ==========================================
  // 3. RAW JSON VERİTABANI YEDEĞİ İNDİR (.json)
  // ==========================================
  const handleDownloadJSONBackup = () => {
    const backupData = {
      backupTitle: 'Elisam Sigorta Tam Sistem Veritabanı Yedeği',
      backupCreatedAt: new Date().toISOString(),
      backupPeriod: backupPeriod,
      totalCustomers: customers.length,
      totalPolicies: policies.length,
      totalCariMovements: movements.length,
      customers: customers,
      policies: policies,
      cariMovements: movements
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Elisam_Sigorta_Veritabani_Yedegi_${backupPeriod.replace('-', '_')}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Standart Tekli Rapor İndirmeleri
  const handleDownloadSingleCSV = (type: ReportType) => {
    const today = new Date().toLocaleDateString('tr-TR');

    if (type === 'musteriler') {
      const rows = [
        ['Müşteri ID', 'Ad Soyad', 'Müşteri Türü', 'TC Kimlik / VKN', 'Telefon', 'E-Posta', 'Kayıt Tarihi'],
        ...customers.map(c => [c.id, c.name, c.type, c.identityNo, c.phone, c.email, c.createdAt])
      ];
      if (rows.length === 1) rows.push(['(Kayıtlı müşteri bulunamadı)', '', '', '', '', '', '']);
      downloadCSV(`elisam-musteri-listesi-${today}.csv`, rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    } else if (type === 'aktif_policeler') {
      const rows = [
        ['Poliçe No', 'Müşteri Adı', 'Poliçe Türü', 'Sigorta Şirketi', 'Başlangıç', 'Bitiş', 'Brüt Prim (TL)', 'Durum'],
        ...policies.map(p => [p.policyNo || p.id, p.customerName, p.type, p.company, p.startDate, p.endDate, String(p.premium), p.status])
      ];
      if (rows.length === 1) rows.push(['(Kayıtlı poliçe bulunamadı)', '', '', '', '', '', '', '']);
      downloadCSV(`elisam-aktif-policeler-${today}.csv`, rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    } else if (type === 'yaklasan_policeler') {
      const upcoming = policies.filter(p => p.status === 'Yaklaşıyor' || p.status === 'Biten');
      const rows = [
        ['Poliçe No', 'Müşteri Adı', 'Poliçe Türü', 'Bitiş Tarihi', 'Durum'],
        ...upcoming.map(p => [p.policyNo || p.id, p.customerName, p.type, p.endDate, p.status])
      ];
      if (rows.length === 1) rows.push(['(Yaklaşan poliçe bulunamadı)', '', '', '', '']);
      downloadCSV(`elisam-yaklasan-policeler-${today}.csv`, rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
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
      downloadCSV(`elisam-sirket-bazli-uretim-${today}.csv`, rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    } else if (type === 'finans_taksit') {
      const rows = [
        ['Tarih', 'Fiş No', 'Müşteri Adı', 'Açıklama', 'Hareket Türü', 'Borç (TL)', 'Alacak (TL)'],
        ...movements.map(m => [m.date, m.receiptNo || '-', m.customerName, m.description, m.movementType, String(m.debitAmount), String(m.creditAmount)])
      ];
      if (rows.length === 1) rows.push(['(Kayıtlı cari hareket bulunamadı)', '', '', '', '', '', '']);
      downloadCSV(`elisam-cari-finans-raporu-${today}.csv`, rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    }
  };

  const handleDownloadSinglePDF = (type: ReportType) => {
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
      const totalDebit = movements.reduce((s, m) => s + m.debitAmount, 0);
      const totalCredit = movements.reduce((s, m) => s + m.creditAmount, 0);
      const netBal = totalDebit - totalCredit;

      generateModernPDF({
        title: 'CARİ HESAP EKSTRESİ & FİNANSAL HAREKETLER RAPORU',
        subtitle: 'Müşteri borçlandırmaları, gelen tahsilatlar ve acente giden ödemeleri dökümü',
        category: 'SİGORTA ACENTELİĞİ',
        dateRange: dateRangeStr,
        kpis: [
          { label: 'TOPLAM BORÇ (POLİÇE/GİDER)', value: `${totalDebit.toLocaleString('tr-TR')} ₺`, color: '#1e3a8a' },
          { label: 'TOPLAM TAHSİLAT', value: `${totalCredit.toLocaleString('tr-TR')} ₺`, color: '#16a34a' },
          { label: 'NET BAKİYE', value: `${Math.abs(netBal).toLocaleString('tr-TR')} ₺`, color: netBal > 0 ? '#dc2626' : '#2563eb' }
        ],
        headers: ['Tarih', 'Fiş No', 'Müşteri Adı', 'Açıklama', 'İşlem Türü', 'Borç (₺)', 'Alacak (₺)'],
        rows: movements.length > 0 ? movements.map(m => [
          m.date,
          m.receiptNo || '-',
          m.customerName,
          m.description,
          m.movementType,
          m.debitAmount > 0 ? `${m.debitAmount.toLocaleString('tr-TR')} ₺` : '-',
          m.creditAmount > 0 ? `${m.creditAmount.toLocaleString('tr-TR')} ₺` : '-'
        ]) : [['-', '-', 'Kayıtlı cari hareket bulunamadı', '-', '-', '-', '-']]
      });
    }
  };

  const reports: { type: ReportType; title: string; desc: string; icon: string; color: string }[] = [
    { type: 'musteriler', title: 'Müşteri Portföy Listesi', desc: 'Tüm müşteriler — isim, TC, telefon, e-posta, kayıt tarihi', icon: '👥', color: '#ebf8ff' },
    { type: 'aktif_policeler', title: 'Aktif Poliçe & Üretim Raporu', desc: 'Poliçe no, müşteri, şirket, prim, bitiş tarihi', icon: '🛡️', color: '#f0fff4' },
    { type: 'finans_taksit', title: 'Cari Hesap & Borç-Alacak Raporu', desc: 'Kimin ne borcu var, yapılan tahsilatlar, ödemeler', icon: '💳', color: '#fef2f2' },
    { type: 'yaklasan_policeler', title: 'Yaklaşan Yenileme & Bitenler', desc: 'Yenilemesi yaklaşan ve biten durumdaki poliçeler', icon: '⚠️', color: '#fffbeb' },
    { type: 'sirket_bazli', title: 'Şirket Bazlı Üretim Analizi', desc: 'Her sigorta şirketine göre prim ve poliçe adedi dağılımı', icon: '📈', color: '#faf5ff' },
  ];

  // Dönem Seçenekleri (Son 12 ay + Tüm Zamanlar)
  const periodOptions = [
    { value: currentYearMonth, label: `🗓️ ${getPeriodLabel(currentYearMonth)} (Bu Ay / Güncel)` },
    { value: '2026-08', label: '🗓️ Ağustos 2026' },
    { value: '2026-07', label: '🗓️ Temmuz 2026' },
    { value: '2026-06', label: '🗓️ Haziran 2026' },
    { value: '2026-05', label: '🗓️ Mayıs 2026' },
    { value: '2026-04', label: '🗓️ Nisan 2026' },
    { value: '2026-03', label: '🗓️ Mart 2026' },
    { value: '2026-02', label: '🗓️ Şubat 2026' },
    { value: '2026-01', label: '🗓️ Ocak 2026' },
    { value: '2025-12', label: '🗓️ Aralık 2025' },
    { value: 'ALL', label: '🌐 TÜM ZAMANLAR (Tüm Yıllık Konsolide Yedek)' }
  ];

  return (
    <div>
      {/* Top Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={28} color="#2563eb" /> Raporlama & Aylık Toplu Yedekleme Merkezi
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px' }}>
            Aylık tüm poliçelerinizi, müşterilerinizi ve cari finans hareketlerinizi tek tıkla Excel, PDF veya JSON veritabanı yedeği olarak dışa aktarın.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VİTRİN KUTUSU: AYLIK TAM SİSTEM YEDEĞİ & KONSOLİDE FAALİYET RAPORU */}
      {/* ========================================================================= */}
      <div className={styles.card} style={{ 
        marginBottom: '26px', 
        padding: '24px', 
        border: '2px solid #2563eb', 
        borderRadius: '16px',
        backgroundColor: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.12)'
      }}>
        
        {/* Başlık ve Ay Seçici */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
              <Archive size={26} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 850, color: '#0f172a' }}>
                📦 Aylık Tam Sistem Yedeği & Faaliyet Raporu
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
                1 aylık bütün poliçe, müşteri ve cari hesap hareketlerinizi tek dosyada arşivleyin ve depolayın.
              </div>
            </div>
          </div>

          {/* Ay & Dönem Seçici Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.86rem', fontWeight: 800, color: '#334155' }}>
              Yedekleme Dönemi:
            </label>
            <select
              value={backupPeriod}
              onChange={(e) => setBackupPeriod(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '2px solid #2563eb',
                backgroundColor: '#f8fafc',
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {periodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Seçili Ayın Canlı İstatistik Özet Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #1e3a8a' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 750, color: '#64748b', textTransform: 'uppercase' }}>O Ay Kesilen Poliçeler</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 850, color: '#1e3a8a', marginTop: '4px' }}>
              {monthlyPolicies.length} Adet
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
              Prim: <strong>{monthlyTotalPremium.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong>
            </div>
          </div>

          <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 750, color: '#64748b', textTransform: 'uppercase' }}>O Ay Yapılan Tahsilat</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 850, color: '#16a34a', marginTop: '4px' }}>
              {monthlyCreditTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <div style={{ fontSize: '0.76rem', color: '#16a34a', marginTop: '2px', fontWeight: 600 }}>
              Gelen Havale / KK / Nakit
            </div>
          </div>

          <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #d97706' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 750, color: '#64748b', textTransform: 'uppercase' }}>O Ay Acenteden Çıkan</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 850, color: '#d97706', marginTop: '4px' }}>
              {monthlyDebitTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
              Poliçe Borçları & Giderler
            </div>
          </div>

          <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${monthlyNetBalance > 0 ? '#dc2626' : '#2563eb'}` }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 750, color: '#64748b', textTransform: 'uppercase' }}>O Ayki Net Bakiye</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 850, color: monthlyNetBalance > 0 ? '#dc2626' : '#2563eb', marginTop: '4px' }}>
              {Math.abs(monthlyNetBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <div style={{ fontSize: '0.76rem', color: monthlyNetBalance > 0 ? '#dc2626' : '#2563eb', marginTop: '2px', fontWeight: 700 }}>
              {monthlyNetBalance > 0 ? '🔴 Borçlu Bakiye (Alacak)' : '🔵 Alacaklı / Kapanmış'}
            </div>
          </div>
        </div>

        {/* 3 BÜYÜK YEDEKLEME VE DIŞA AKTARMA BUTONU */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          
          {/* BUTON 1: EXCEL / CSV TOPLU YEDEK */}
          <button
            onClick={handleDownloadMonthlyExcelBackup}
            style={{
              padding: '14px 18px',
              backgroundColor: '#047857',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#065f46'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#047857'}
          >
            <FileSpreadsheet size={20} />
            <div style={{ textAlign: 'left' }}>
              <div>Excel (CSV) Olarak Aylık Yedeği İndir</div>
              <div style={{ fontSize: '0.74rem', opacity: 0.85, fontWeight: 500 }}>Tüm Poliçeler + Müşteriler + Cari Defter</div>
            </div>
          </button>

          {/* BUTON 2: RESMİ PDF AYLIK FAALİYET RAPORU */}
          <button
            onClick={handleDownloadMonthlyPDFReport}
            style={{
              padding: '14px 18px',
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#172554'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a8a'}
          >
            <Printer size={20} />
            <div style={{ textAlign: 'left' }}>
              <div>PDF Aylık Faaliyet Raporunu Yazdır / İndir</div>
              <div style={{ fontSize: '0.74rem', opacity: 0.85, fontWeight: 500 }}>Logolu Resmi Rapor ve Hesap Dökümü</div>
            </div>
          </button>

          {/* BUTON 3: HAM VERİTABANI YEDEĞİ (.JSON) */}
          <button
            onClick={handleDownloadJSONBackup}
            style={{
              padding: '14px 18px',
              backgroundColor: '#334155',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(51, 65, 85, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}
          >
            <Database size={20} />
            <div style={{ textAlign: 'left' }}>
              <div>Veritabanı Ham Yedeği İndir (.json)</div>
              <div style={{ fontSize: '0.74rem', opacity: 0.85, fontWeight: 500 }}>Flash Bellek / Offline Tam Depolama</div>
            </div>
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* TARİH ARALIĞI FİLTRESİ */}
      {/* ========================================================================= */}
      <div className={styles.card} style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2d3748', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#3498db" /> Özel Tarih Aralığı Filtresi
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

      {/* ========================================================================= */}
      {/* ÖZEL TEKLİ RAPOR KARTLARI */}
      {/* ========================================================================= */}
      <div className={styles.card}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2d3748', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet size={18} color="#3498db" /> Modül Bazlı Rapor İndirmeleri
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
                  onClick={() => handleDownloadSinglePDF(r.type)}
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
                  onClick={() => handleDownloadSingleCSV(r.type)}
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

