"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  X, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar,
  CreditCard,
  Banknote,
  Send,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  Building2,
  Trash2,
  Edit2,
  Receipt
} from 'lucide-react';
import { 
  Customer, 
  initialCustomersData, 
  Policy, 
  initialPoliciesData 
} from '@/data/crmData';
import { generateModernPDF } from '@/lib/pdfReportGenerator';
import styles from '../layout.module.css';

// Cari Hesap Hareketi Modeli (Görsellerdeki Birebir Yapı)
export interface CariMovement {
  id: string;
  date: string;               // Tarih (DD.MM.YYYY)
  dueDate?: string;           // Vade Tarihi (opsiyonel)
  receiptNo?: string;         // Fiş / Dekont / Belge No (örn: 7339, 27)
  customerId: string;         // Müşteri ID
  customerName: string;       // Müşteri Adı / Ünvanı
  description: string;        // Açıklama (Poliçe No, Şirket, Plaka, Banka Bilgisi vb.)
  movementType: 
    | 'Poliçe Tahakkuku' 
    | 'Banka Giden Havale' 
    | 'Banka Gelen Havale' 
    | 'Kredi Kartı Tahsilat' 
    | 'Hizmet Alım Faturası' 
    | 'Cari Mahsup Çıkışı' 
    | 'Cari Hareket Girişi' 
    | 'Poliçe İptal / İade' 
    | 'Tarih Öncesi Devir Bakiye';
  debitAmount: number;        // Borç (Poliçe Bedeli / Fatura vb.)
  creditAmount: number;       // Alacak / Alınan (Ödeme / Havale / İade)
  notes?: string;
}

// Cari Hareket Verileri (Boş Başlangıç)
const initialCariMovements: CariMovement[] = [];

export default function SigortaFinansPage() {
  const [movements, setMovements] = useState<CariMovement[]>(initialCariMovements);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomersData);
  const [isMounted, setIsMounted] = useState(false);
  
  // Selected Customer Filter (Default: ALL or specific customer)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');
  const [activeMovementTypeFilter, setActiveMovementTypeFilter] = useState<string>('Tümü');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState<'BORC' | 'TAHSILAT' | 'IADE' | 'DEVIR'>('BORC');
  const [editingMovement, setEditingMovement] = useState<CariMovement | null>(null);

  // Form States
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formReceiptNo, setFormReceiptNo] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMovementType, setFormMovementType] = useState<CariMovement['movementType']>('Poliçe Tahakkuku');
  const [formDebitAmount, setFormDebitAmount] = useState('');
  const [formCreditAmount, setFormCreditAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Hydration-safe initial load from localStorage & purge old mock data
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedMov = localStorage.getItem('elisam_cari_movements');
      if (savedMov) {
        const parsed: CariMovement[] = JSON.parse(savedMov);
        // Filter out any mock/sample items that were previously seeded
        const cleanMovs = parsed.filter(m => 
          !m.customerName.toUpperCase().includes('KAYSERİ ÇOK YAŞAR') && 
          !m.id.startsWith('CAR-00')
        );
        setMovements(cleanMovs);
        localStorage.setItem('elisam_cari_movements', JSON.stringify(cleanMovs));
      } else {
        setMovements([]);
      }

      const savedCust = localStorage.getItem('elisam_customers');
      if (savedCust) {
        const parsedCust: Customer[] = JSON.parse(savedCust);
        const cleanCust = parsedCust.filter(c => !c.name.toUpperCase().includes('KAYSERİ ÇOK YAŞAR'));
        setCustomers(cleanCust);
        localStorage.setItem('elisam_customers', JSON.stringify(cleanCust));
      }
    } catch (err) {
      console.error('LocalStorage load error:', err);
    }
  }, []);

  // Persist movements to localStorage after mount
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('elisam_cari_movements', JSON.stringify(movements));
    }
  }, [movements, isMounted]);

  const [modalCustomerSearch, setModalCustomerSearch] = useState('');

  // Open Add Movement Modal
  const handleOpenAddModal = (type: 'BORC' | 'TAHSILAT' | 'IADE' | 'DEVIR') => {
    setEditingMovement(null);
    setModalActionType(type);
    setModalCustomerSearch('');
    setFormDate(new Date().toLocaleDateString('tr-TR'));
    setFormDueDate('');
    setFormReceiptNo(String(Math.floor(1000 + Math.random() * 9000)));
    
    // Set default customer if filtered, otherwise leave empty for user selection
    if (selectedCustomerId !== 'ALL') {
      const matched = customers.find(c => c.id === selectedCustomerId);
      setFormCustomerId(selectedCustomerId);
      setFormCustomerName(matched?.name || selectedCustomerId);
    } else {
      setFormCustomerId('');
      setFormCustomerName('');
    }

    if (type === 'BORC') {
      setFormMovementType('Poliçe Tahakkuku');
      setFormDescription('');
      setFormDebitAmount('');
      setFormCreditAmount('0');
    } else if (type === 'TAHSILAT') {
      setFormMovementType('Banka Gelen Havale');
      setFormDescription('İŞ BANKASI HAVALE / TAHSİLAT');
      setFormDebitAmount('0');
      setFormCreditAmount('');
    } else if (type === 'IADE') {
      setFormMovementType('Poliçe İptal / İade');
      setFormDescription('İPTAL / ZEYİL İADE BEDELİ');
      setFormDebitAmount('0');
      setFormCreditAmount('');
    } else if (type === 'DEVIR') {
      setFormMovementType('Tarih Öncesi Devir Bakiye');
      setFormDescription('TARİH ÖNCESİ BAKİYE TL (DEVİR)');
      setFormDebitAmount('');
      setFormCreditAmount('0');
    }

    setFormNotes('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (mov: CariMovement) => {
    setEditingMovement(mov);
    setModalCustomerSearch('');
    setFormDate(mov.date);
    setFormDueDate(mov.dueDate || '');
    setFormReceiptNo(mov.receiptNo || '');
    setFormCustomerId(mov.customerId);
    setFormCustomerName(mov.customerName);
    setFormDescription(mov.description);
    setFormMovementType(mov.movementType);
    setFormDebitAmount(String(mov.debitAmount));
    setFormCreditAmount(String(mov.creditAmount));
    setFormNotes(mov.notes || '');
    setIsAddModalOpen(true);
  };

  // Save Movement
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || (!formDebitAmount && !formCreditAmount)) {
      alert('Lütfen müşteri adını ve tutar bilgilerini girin.');
      return;
    }

    const dAmount = Number(formDebitAmount) || 0;
    const cAmount = Number(formCreditAmount) || 0;

    // Convert date string if from datepicker
    let formattedDate = formDate;
    if (formDate.includes('-')) {
      const p = formDate.split('-');
      if (p.length === 3) formattedDate = `${p[2]}.${p[1]}.${p[0]}`;
    }

    let formattedDueDate = formDueDate;
    if (formDueDate.includes('-')) {
      const p = formDueDate.split('-');
      if (p.length === 3) formattedDueDate = `${p[2]}.${p[1]}.${p[0]}`;
    }

    // Auto create customer in customer list if new
    let custId = formCustomerId;
    const existingCust = customers.find(c => c.id === custId || c.name.toLowerCase() === formCustomerName.trim().toLowerCase());
    if (!existingCust) {
      custId = `CUST-${Math.floor(100 + Math.random() * 900)}`;
      const isCorp = /(?:ŞİRKETİ|LİMİTED|LTD|A\.Ş|SANAYİ|TİCARET|AŞ|HOLDİNG)/i.test(formCustomerName);
      const newCust: Customer = {
        id: custId,
        name: formCustomerName.trim(),
        type: isCorp ? 'Kurumsal' : 'Bireysel',
        phone: '-',
        email: '-',
        identityNo: '-',
        address: 'Alanya / Antalya',
        createdAt: new Date().toLocaleDateString('tr-TR'),
        notes: 'Cari hareket ile otomatik tanımlandı.'
      };
      const updatedCustList = [newCust, ...customers];
      setCustomers(updatedCustList);
      try {
        localStorage.setItem('elisam_customers', JSON.stringify(updatedCustList));
      } catch (err) {
        console.error(err);
      }
    } else {
      custId = existingCust.id;
    }

    const newMov: CariMovement = {
      id: editingMovement ? editingMovement.id : `CAR-${Math.floor(1000 + Math.random() * 9000)}`,
      date: formattedDate,
      dueDate: formattedDueDate || undefined,
      receiptNo: formReceiptNo || '-',
      customerId: custId,
      customerName: formCustomerName.trim(),
      description: formDescription,
      movementType: formMovementType,
      debitAmount: dAmount,
      creditAmount: cAmount,
      notes: formNotes || undefined
    };

    if (editingMovement) {
      setMovements(movements.map(m => m.id === editingMovement.id ? newMov : m));
    } else {
      setMovements([...movements, newMov]);
    }

    setIsAddModalOpen(false);
  };

  // Delete Movement
  const handleDeleteMovement = (id: string, desc: string) => {
    if (confirm(`"${desc}" hareketini silmek istediğinize emin misiniz?`)) {
      setMovements(movements.filter(m => m.id !== id));
    }
  };

  // Filtered movements based on selected customer & search
  const filteredMovements = movements.filter(m => {
    const matchesCustomer = selectedCustomerId === 'ALL' || m.customerId === selectedCustomerId || m.customerName.toLowerCase() === selectedCustomerId.toLowerCase();
    const matchesSearch = 
      m.description.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
      (m.receiptNo && m.receiptNo.toLowerCase().includes(tableSearchTerm.toLowerCase())) ||
      m.movementType.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
      m.customerName.toLowerCase().includes(tableSearchTerm.toLowerCase());
    
    const matchesType = activeMovementTypeFilter === 'Tümü' || m.movementType === activeMovementTypeFilter;
    return matchesCustomer && matchesSearch && matchesType;
  });

  // Calculate Cumulative Running Balances for each row
  let runningBalance = 0;
  const movementsWithBalance = filteredMovements.map(m => {
    // In Turkish Cari: Borç increases customer debt (+), Alacak / Tahsilat decreases customer debt (-)
    runningBalance += (m.debitAmount - m.creditAmount);
    return {
      ...m,
      currentBalance: runningBalance
    };
  });

  // Totals
  const totalDebit = filteredMovements.reduce((sum, m) => sum + m.debitAmount, 0);
  const totalCredit = filteredMovements.reduce((sum, m) => sum + m.creditAmount, 0);
  const netRemainingBalance = totalDebit - totalCredit;

  // Selected customer name for title
  const currentCustomerObj = customers.find(c => c.id === selectedCustomerId);
  const headerCustomerTitle = selectedCustomerId === 'ALL' 
    ? 'GENEL CARİ HESAP EKSTRESİ (TÜM MÜŞTERİLER)' 
    : (currentCustomerObj ? `${currentCustomerObj.name.toUpperCase()} - HESAP ÖZETİ` : `${selectedCustomerId.toUpperCase()} - HESAP ÖZETİ`);

  // Export to Branded PDF (Görsellerdeki Birebir Format)
  const handleExportPDF = () => {
    generateModernPDF({
      title: headerCustomerTitle,
      subtitle: 'Elisam Sigorta • Müşteri Borç / Alacak ve Cari Hareket Ekstresi',
      category: 'SİGORTA ACENTELİĞİ',
      dateRange: `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
      kpis: [
        { label: 'TOPLAM BORÇ (POLİÇELER)', value: `${totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, color: '#1e3a8a' },
        { label: 'TOPLAM ALINAN (TAHSİLAT)', value: `${totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, color: '#16a34a' },
        { label: 'KALAN BAKİYE (BORÇ)', value: `${netRemainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, color: netRemainingBalance > 0 ? '#dc2626' : '#16a34a' }
      ],
      headers: ['Tarih', 'Vade T.', 'Fiş No', 'Açıklama', 'Hareket Türü', 'Borç (₺)', 'Alacak (₺)', 'Kalan Bakiye (₺)'],
      rows: movementsWithBalance.map(m => [
        m.date,
        m.dueDate || '-',
        m.receiptNo || '-',
        m.description,
        m.movementType,
        m.debitAmount > 0 ? m.debitAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-',
        m.creditAmount > 0 ? m.creditAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-',
        m.currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
      ]),
      summaryNotes: [
        `DİP TOPLAMLAR: Toplam Borç: ${totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ | Toplam Alacak/Tahsilat: ${totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ | Net Bakiye: ${netRemainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
        'İşbu cari hesap ekstresi Elisam Sigorta acente otomasyonu tarafından üretilmiş resmi hesap özetidir.'
      ]
    });
  };

  // Export to CSV / Excel
  const handleExportCSV = () => {
    const headers = ['Tarih', 'Vade Tarihi', 'Fiş No', 'Müşteri', 'Açıklama', 'Hareket Türü', 'Borç (TL)', 'Alacak / Alınan (TL)', 'Kalan Bakiye (TL)'];
    const rows = movementsWithBalance.map(m => [
      `"${m.date}"`,
      `"${m.dueDate || '-'}"`,
      `"${m.receiptNo || '-'}"`,
      `"${m.customerName}"`,
      `"${m.description.replace(/"/g, '""')}"`,
      `"${m.movementType}"`,
      `"${m.debitAmount.toFixed(2)}"`,
      `"${m.creditAmount.toFixed(2)}"`,
      `"${m.currentBalance.toFixed(2)}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Elisam_Cari_Hesap_Ekstresi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Clear all movements
  const handleClearAllMovements = () => {
    if (confirm('Tüm cari ekstre hareketlerini temizlemek ve sıfırlamak istediğinize emin misiniz?')) {
      setMovements([]);
      try {
        localStorage.removeItem('elisam_cari_movements');
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={28} color="#2563eb" /> Cari Hesap Ekstresi & Borç-Alacak Defteri
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px', margin: 0 }}>
            Müşterilerinizin tüm poliçe borçlandırmaları, havale/tahsilatları, iadeleri ve anlık yürüyen bakiyeleri.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} /> PDF Ekstre Al / Yazdır
          </button>

          <button 
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              backgroundColor: '#059669',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <Download size={16} /> Excel (CSV)
          </button>

          {movements.length > 0 && (
            <button 
              onClick={handleClearAllMovements}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                borderRadius: '10px',
                border: '1px solid #fecaca',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
              title="Tüm ekstre hareketlerini temizle"
            >
              <Trash2 size={16} /> Ekstreyi Sıfırla
            </button>
          )}
        </div>
      </div>

      {/* MÜŞTERİ SEÇİM & FİLTRELEME ÇUBUĞU */}
      <div className={styles.card} style={{ marginBottom: '20px', padding: '16px 20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
            <Building2 size={22} color="#2563eb" />
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                HESAP ÖZETİ GÖRÜNTÜLENECEK MÜŞTERİ:
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '2px solid #2563eb',
                  backgroundColor: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">📋 TÜM MÜŞTERİLERİN GENEL CARİ HESAP EKSTRESİ</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>👤 {c.name} ({c.type} - {c.phone})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hızlı Hareket Ekleme Butonları */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleOpenAddModal('BORC')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontWeight: 750,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> ➕ Poliçe / Borç Kaydı
            </button>

            <button
              onClick={() => handleOpenAddModal('TAHSILAT')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                fontWeight: 750,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> 💳 Tahsilat / Havale Ekle
            </button>

            <button
              onClick={() => handleOpenAddModal('IADE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                backgroundColor: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                fontWeight: 750,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> ↩️ İptal / İade Girişi
            </button>

            <button
              onClick={() => handleOpenAddModal('DEVIR')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                backgroundColor: '#f8fafc',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontWeight: 750,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> 📜 Devir Bakiye
            </button>
          </div>

        </div>
      </div>

      {/* KPI ÖZET KUTULARI (Görsel 2'deki Birebir Özet) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        
        <div className={styles.card} style={{ borderLeft: '5px solid #1e3a8a', padding: '18px 22px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Toplam Borç (Poliçeler)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 850, color: '#1e3a8a', marginTop: '6px' }}>
            {totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Kesilen poliçelerin ve hizmetlerin toplamı
          </div>
        </div>

        <div className={styles.card} style={{ borderLeft: '5px solid #16a34a', padding: '18px 22px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Toplam Alınan (Tahsilat / Havale)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 850, color: '#16a34a', marginTop: '6px' }}>
            {totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '4px', fontWeight: 600 }}>
            Müşteriden yapılan tüm tahsilat & iadeler
          </div>
        </div>

        <div className={styles.card} style={{ borderLeft: '5px solid #dc2626', padding: '18px 22px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Kalan Net Bakiye (Müşteri Borcu)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 850, color: netRemainingBalance > 0 ? '#dc2626' : '#16a34a', marginTop: '6px' }}>
            {netRemainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </div>
          <div style={{ fontSize: '0.78rem', color: netRemainingBalance > 0 ? '#dc2626' : '#16a34a', marginTop: '4px', fontWeight: 700 }}>
            {netRemainingBalance > 0 ? '🔴 Müşteri Borç Bakiyesi (Tahsil Edilecek)' : '🟢 Hesap Kapanmış / Alacaklı'}
          </div>
        </div>

      </div>

      {/* CARİ HESAP EKSTRESİ TABLOSU (Görsel 1 & 2 Birebir Tablo Tasarımı) */}
      <div className={styles.card} style={{ padding: '24px' }}>
        
        {/* Tablo Üst Başlığı (Görsel 2'deki Başlık Tasarımı) */}
        <div style={{ backgroundColor: '#e2e8f0', padding: '12px 18px', borderRadius: '8px 8px 0 0', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontWeight: 850, fontSize: '1.05rem', color: '#1e293b', letterSpacing: '0.5px' }}>
            {headerCustomerTitle}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
            Para Birimi: <strong style={{ color: '#0f172a' }}>TRY (₺)</strong>
          </div>
        </div>

        {/* Tablo İçi Filtre & Arama */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text"
              placeholder="Ekstrede ara (Poliçe no, plaka, fiş no, havale açıklaması...)"
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {['Tümü', 'Poliçe Tahakkuku', 'Banka Gelen Havale', 'Poliçe İptal / İade', 'Tarih Öncesi Devir Bakiye'].map(t => (
              <button
                key={t}
                onClick={() => setActiveMovementTypeFilter(t)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: activeMovementTypeFilter === t ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: activeMovementTypeFilter === t ? '#eff6ff' : '#ffffff',
                  color: activeMovementTypeFilter === t ? '#1d4ed8' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ANA CARİ EKSTRE TABLOSU */}
        <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '0 0 8px 8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 800, color: '#334155', width: '95px' }}>Tarih</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 800, color: '#334155', width: '95px' }}>Vade T.</th>
                <th style={{ textAlign: 'center', padding: '12px 10px', fontWeight: 800, color: '#334155', width: '75px' }}>Fiş No</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 800, color: '#334155' }}>Açıklama</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 800, color: '#334155', width: '150px' }}>Hareket Türü</th>
                <th style={{ textAlign: 'right', padding: '12px 14px', fontWeight: 800, color: '#334155', width: '125px' }}>Borç (₺)</th>
                <th style={{ textAlign: 'right', padding: '12px 14px', fontWeight: 800, color: '#334155', width: '125px' }}>Alacak / Alınan (₺)</th>
                <th style={{ textAlign: 'right', padding: '12px 14px', fontWeight: 800, color: '#334155', width: '135px' }}>Kalan Bakiye (₺)</th>
                <th style={{ textAlign: 'center', padding: '12px 10px', fontWeight: 800, color: '#334155', width: '80px' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {movementsWithBalance.length > 0 ? (
                movementsWithBalance.map((m, index) => {
                  const isDebit = m.debitAmount > 0;
                  const isCredit = m.creditAmount > 0;
                  return (
                    <tr 
                      key={m.id} 
                      style={{ 
                        borderBottom: '1px solid #e2e8f0', 
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' 
                      }}
                    >
                      {/* Tarih */}
                      <td style={{ padding: '10px 14px', color: '#1e293b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {m.date}
                      </td>

                      {/* Vade Tarihi */}
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                        {m.dueDate || '-'}
                      </td>

                      {/* Fiş No */}
                      <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', color: '#475569' }}>
                        {m.receiptNo || '-'}
                      </td>

                      {/* Açıklama */}
                      <td style={{ padding: '10px 14px', fontWeight: 650, color: '#0f172a' }}>
                        <div>{m.description}</div>
                        {selectedCustomerId === 'ALL' && (
                          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>👤 {m.customerName}</div>
                        )}
                      </td>

                      {/* Hareket Türü */}
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: '0.82rem', fontWeight: 600 }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: m.movementType.includes('Poliçe') ? '#eff6ff' : (m.movementType.includes('Havale') || m.movementType.includes('Kart') ? '#ecfdf5' : '#f1f5f9'),
                          color: m.movementType.includes('Poliçe') ? '#1d4ed8' : (m.movementType.includes('Havale') || m.movementType.includes('Kart') ? '#047857' : '#475569'),
                          display: 'inline-block'
                        }}>
                          {m.movementType}
                        </span>
                      </td>

                      {/* Borç */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 750, color: isDebit ? '#0f172a' : '#94a3b8' }}>
                        {isDebit ? m.debitAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Alacak / Alınan */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 750, color: isCredit ? '#16a34a' : '#94a3b8' }}>
                        {isCredit ? m.creditAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Kalan Yürüyen Bakiye */}
                      <td style={{ 
                        padding: '10px 14px', 
                        textAlign: 'right', 
                        fontWeight: 800, 
                        color: m.currentBalance > 0 ? '#b91c1c' : (m.currentBalance < 0 ? '#047857' : '#475569') 
                      }}>
                        {m.currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span style={{ fontSize: '0.74rem', marginLeft: '4px', color: '#64748b' }}>
                          {m.currentBalance > 0 ? 'B' : (m.currentBalance < 0 ? 'A' : '')}
                        </span>
                      </td>

                      {/* İşlemler */}
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            title="Hareketi Düzenle"
                            style={{ padding: '4px 6px', background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMovement(m.id, m.description)}
                            title="Hareketi Sil"
                            style={{ padding: '4px 6px', background: 'none', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                    Bu müşteri için henüz cari hesap hareketi kaydedilmedi. Yukarıdaki butonlardan poliçe borcu veya tahsilat ekleyebilirsiniz.
                  </td>
                </tr>
              )}
            </tbody>

            {/* DİP TOPLAM SATIRI (Görsel 1 & 2'deki Birebir Kalın Alt Çubuk) */}
            <tfoot>
              <tr style={{ backgroundColor: '#e2e8f0', borderTop: '2px solid #94a3b8', fontWeight: 850 }}>
                <td colSpan={5} style={{ padding: '14px', textAlign: 'right', fontSize: '0.92rem', color: '#1e293b' }}>
                  GENEL TOPLAMLAR:
                </td>
                <td style={{ padding: '14px', textAlign: 'right', fontSize: '0.95rem', color: '#0f172a' }}>
                  {totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '14px', textAlign: 'right', fontSize: '0.95rem', color: '#16a34a' }}>
                  {totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '14px', textAlign: 'right', fontSize: '1rem', color: netRemainingBalance > 0 ? '#b91c1c' : '#047857' }}>
                  {netRemainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>
                    {netRemainingBalance > 0 ? 'B' : 'A'}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      {/* HAREKET EKLEME & DÜZENLEME MODALI */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={22} color="#2563eb" /> 
                  {editingMovement ? 'Cari Hareketi Düzenle' : (
                    modalActionType === 'BORC' ? 'Yeni Poliçe / Borç Kaydı' :
                    modalActionType === 'TAHSILAT' ? 'Yeni Tahsilat / Havale Girişi' :
                    modalActionType === 'IADE' ? 'Poliçe İptal / İade Girişi' : 'Devir Bakiye Girişi'
                  )}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  Cari ekstreye anında yansıyacak borç veya tahsilat hareketini girin.
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveMovement}>
              
              {/* Müşteri Seçimi & Arama & Manuel Ekleme */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                
                {/* Arama Kutusu */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '4px' }}>
                    🔍 Kayıtlı Müşterilerden Ara & Seç:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text"
                      placeholder="Müşteri adı, TC, telefon veya plaka yazarak arayın..."
                      value={modalCustomerSearch}
                      onChange={(e) => setModalCustomerSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    {modalCustomerSearch && (
                      <button
                        type="button"
                        onClick={() => setModalCustomerSearch('')}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Arama Sonuçları */}
                  {modalCustomerSearch.trim() && (
                    <div style={{
                      marginTop: '6px',
                      maxHeight: '170px',
                      overflowY: 'auto',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #93c5fd',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                      zIndex: 50
                    }}>
                      {customers.filter(c => {
                        const q = modalCustomerSearch.toLowerCase();
                        return c.name.toLowerCase().includes(q) ||
                               (c.identityNo && c.identityNo.includes(q)) ||
                               (c.phone && c.phone.includes(q)) ||
                               (c.plate && c.plate.toLowerCase().includes(q)) ||
                               (c.policyNo && c.policyNo.toLowerCase().includes(q));
                      }).length > 0 ? (
                        customers.filter(c => {
                          const q = modalCustomerSearch.toLowerCase();
                          return c.name.toLowerCase().includes(q) ||
                                 (c.identityNo && c.identityNo.includes(q)) ||
                                 (c.phone && c.phone.includes(q)) ||
                                 (c.plate && c.plate.toLowerCase().includes(q)) ||
                                 (c.policyNo && c.policyNo.toLowerCase().includes(q));
                        }).map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setFormCustomerId(c.id);
                              setFormCustomerName(c.name);
                              setModalCustomerSearch('');
                            }}
                            style={{
                              padding: '9px 12px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div>
                              <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '0.9rem' }}>
                                {c.name} <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>{c.type}</span>
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                                📞 {c.phone} {c.identityNo && c.identityNo !== '-' ? `• TC: ${c.identityNo}` : ''} {c.plate ? `• 🚗 ${c.plate}` : ''}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 750, color: '#2563eb' }}>Seç ➔</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
                          Eşleşen müşteri bulunamadı. Aşağıya direkt yeni müşteri adı yazabilirsiniz.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hızlı Dropdown Listesi */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>
                    veya Listeden Müşteri Seçin:
                  </label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setFormCustomerId(cid);
                      if (cid === 'NEW') {
                        setFormCustomerName('');
                      } else {
                        const matched = customers.find(c => c.id === cid);
                        if (matched) setFormCustomerName(matched.name);
                      }
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#ffffff', fontSize: '0.86rem', fontWeight: 600 }}
                  >
                    <option value="NEW">-- Yeni / Farklı Müşteri Tanımlayacağım --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>👤 {c.name} ({c.type} - {c.phone})</option>
                    ))}
                  </select>
                </div>

                {/* Doğrudan İsim Girişi & Düzenleme */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                    Müşteri Ad Soyad / Şirket Ünvanı * (İstediğiniz gibi yazabilir veya değiştirebilirsiniz)
                  </label>
                  <input 
                    type="text"
                    required
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="Örn: EZEL GİYİM LTD. ŞTİ. veya Mehmet Demir"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '2px solid #2563eb', outline: 'none', fontWeight: 800, fontSize: '0.95rem', backgroundColor: '#ffffff' }}
                  />
                  {formCustomerName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                      <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700 }}>
                        ✓ Bu hareket &quot;{formCustomerName}&quot; cari hesabına işlenecek.
                      </span>
                      <button
                        type="button"
                        onClick={() => { setFormCustomerId('NEW'); setFormCustomerName(''); }}
                        style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                      >
                        Temizle / Yeni Yaz
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Tarih, Vade Tarihi, Fiş No */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Tarih *</label>
                  <input 
                    type="text" 
                    required 
                    value={formDate} 
                    onChange={(e) => setFormDate(e.target.value)} 
                    placeholder="DD.MM.YYYY" 
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Vade Tarihi</label>
                  <input 
                    type="text" 
                    value={formDueDate} 
                    onChange={(e) => setFormDueDate(e.target.value)} 
                    placeholder="DD.MM.YYYY" 
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Fiş / Dekont No</label>
                  <input 
                    type="text" 
                    value={formReceiptNo} 
                    onChange={(e) => setFormReceiptNo(e.target.value)} 
                    placeholder="Örn: 7339" 
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'monospace', fontWeight: 700 }} 
                  />
                </div>
              </div>

              {/* Hareket Türü */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>İşlem / Hareket Türü</label>
                <select
                  value={formMovementType}
                  onChange={(e) => setFormMovementType(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 600 }}
                >
                  <option value="Poliçe Tahakkuku">Poliçe Tahakkuku (Borçlandırma)</option>
                  <option value="Banka Gelen Havale">Banka Gelen Havale (Tahsilat)</option>
                  <option value="Banka Giden Havale">Banka Giden Havale (Ödeme)</option>
                  <option value="Kredi Kartı Tahsilat">Kredi Kartı Tahsilat</option>
                  <option value="Hizmet Alım Faturası">Hizmet Alım Faturası</option>
                  <option value="Cari Mahsup Çıkışı">Cari Mahsup Çıkışı</option>
                  <option value="Cari Hareket Girişi">Cari Hareket Girişi</option>
                  <option value="Poliçe İptal / İade">Poliçe İptal / İade</option>
                  <option value="Tarih Öncesi Devir Bakiye">Tarih Öncesi Devir Bakiye</option>
                </select>
              </div>

              {/* Açıklama (Poliçe No, Plaka, Şirket vb.) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '4px' }}>
                  Açıklama (Poliçe No, Plaka, Şirket vb.) *
                </label>
                <input 
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Örn: 2000270031266 / 0 HDI KASKO 34MNP977 KAYSERİ ÇOK YAŞAR"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 650 }}
                />
              </div>

              {/* Borç & Alacak Tutarları */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>
                    Borç Tutarı (₺) [Poliçe Bedeli]
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formDebitAmount}
                    onChange={(e) => setFormDebitAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #f87171', outline: 'none', fontWeight: 800, fontSize: '1rem', color: '#991b1b' }}
                  />
                </div>

                <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#065f46', marginBottom: '4px' }}>
                    Alacak / Alınan Tutar (₺) [Tahsilat]
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formCreditAmount}
                    onChange={(e) => setFormCreditAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #34d399', outline: 'none', fontWeight: 800, fontSize: '1rem', color: '#065f46' }}
                  />
                </div>
              </div>

              {/* Notlar */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Ek Not (Opsiyonel)</label>
                <input 
                  type="text" 
                  value={formNotes} 
                  onChange={(e) => setFormNotes(e.target.value)} 
                  placeholder="Zeyil, banka dekont ref no vb." 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                />
              </div>

              {/* Butonlar */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className={styles.btnCrm} 
                  style={{ padding: '10px 24px', fontSize: '0.92rem', fontWeight: 750 }}
                >
                  ✓ Cari Hareketi Kaydet
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
