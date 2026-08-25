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
  ShieldCheck
} from 'lucide-react';
import { 
  Customer, 
  initialCustomersData, 
  Policy, 
  initialPoliciesData,
  Installment
} from '@/data/crmData';
import styles from '../layout.module.css';

// Müşteri Borç / Taksit Kaydı
export interface CustomerDebtRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerTc?: string;
  policyNo: string;
  insuranceType: string;
  company: string;
  totalAmount: number;      // Toplam Prim / Borç Tutarı
  paidAmount: number;       // Ödenen Tutar
  remainingAmount: number;  // Kalan Bakiye
  paymentType: 'Peşin / Tek Çekim' | 'Taksitli';
  installmentCount: number;
  installments: Installment[];
  status: 'Ödendi' | 'Kısmi Ödendi' | 'Gecikmede' | 'Bekliyor';
  startDate: string;
  notes?: string;
}

// Kasa İşlem Kaydı
export interface CashLog {
  id: string;
  date: string;
  customerName: string;
  policyNo: string;
  amount: number;
  paymentMethod: 'Kredi Kartı' | 'Banka Havalesi / EFT' | 'Nakit' | 'Çek / Senet';
  type: 'Tahsilat' | 'Gider / İade';
  description: string;
}

export default function SigortaFinansPage() {
  // Local storage state for persistent records
  const loadDebtRecords = (): CustomerDebtRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('elisam_debt_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const loadCashLogs = (): CashLog[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('elisam_cash_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [records, setRecords] = useState<CustomerDebtRecord[]>(loadDebtRecords);
  const [cashLogs, setCashLogs] = useState<CashLog[]>(loadCashLogs);
  const [customers] = useState<Customer[]>(initialCustomersData);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'tumu' | 'kalan' | 'geciken' | 'odendi' | 'kasa'>('tumu');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CustomerDebtRecord | null>(null);

  // New Record Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [customCustomerTc, setCustomCustomerTc] = useState('');
  const [policyNo, setPolicyNo] = useState('');
  const [insuranceType, setInsuranceType] = useState('Kasko');
  const [customInsuranceType, setCustomInsuranceType] = useState('');
  const [company, setCompany] = useState('HDI Sigorta');
  const [customCompany, setCustomCompany] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [initialPaidAmount, setInitialPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'Peşin / Tek Çekim' | 'Taksitli'>('Peşin / Tek Çekim');
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Collect Payment Modal State
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<'Kredi Kartı' | 'Banka Havalesi / EFT' | 'Nakit'>('Kredi Kartı');
  const [collectNote, setCollectNote] = useState('');

  // Save to localStorage when state updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('elisam_debt_records', JSON.stringify(records));
    }
  }, [records]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('elisam_cash_logs', JSON.stringify(cashLogs));
    }
  }, [cashLogs]);

  // Handle Customer Selection in New Record Modal
  const handleCustomerSelect = (cId: string) => {
    setSelectedCustomerId(cId);
    if (cId === 'custom') {
      setCustomCustomerName('');
      setCustomCustomerPhone('');
      setCustomCustomerTc('');
      return;
    }
    const found = customers.find(c => c.id === cId);
    if (found) {
      setCustomCustomerName(found.name);
      setCustomCustomerPhone(found.phone);
      setCustomCustomerTc(found.identityNo || '');
      if (found.policyNo) setPolicyNo(found.policyNo);
      if (found.insuranceType) setInsuranceType(found.insuranceType);
    }
  };

  // Create Installments Helper
  const generateInstallments = (total: number, count: number, start: string, initialPaid: number): Installment[] => {
    const installments: Installment[] = [];
    const monthlyAmt = Math.round(total / count);
    const sDate = start ? new Date(start) : new Date();

    let paidRemaining = initialPaid;

    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(sDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      const formattedDue = dueDate.toLocaleDateString('tr-TR');

      const isOverdue = dueDate < new Date() && paidRemaining < monthlyAmt;
      const isPaid = paidRemaining >= monthlyAmt;
      
      if (isPaid) {
        paidRemaining -= monthlyAmt;
      }

      installments.push({
        installmentNo: i,
        amount: i === count ? (total - monthlyAmt * (count - 1)) : monthlyAmt,
        dueDate: formattedDue,
        status: isPaid ? 'Ödendi' : (isOverdue ? 'Gecikmede' : 'Bekliyor'),
        paidDate: isPaid ? new Date().toLocaleDateString('tr-TR') : undefined
      });
    }

    return installments;
  };

  // Add New Debt / Policy Record
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCustomerName || !totalAmount) return;

    const finalType = insuranceType === 'DIGER' ? (customInsuranceType.trim() || 'Özel Sigorta') : insuranceType;
    const finalCompany = company === 'DIGER' ? (customCompany.trim() || 'Diğer Sigorta') : company;

    const total = Number(totalAmount);
    const paid = Number(initialPaidAmount) || (paymentType === 'Peşin / Tek Çekim' ? total : 0);
    const remaining = Math.max(0, total - paid);

    const instCount = paymentType === 'Taksitli' ? installmentCount : 1;
    const installments = generateInstallments(total, instCount, startDate, paid);

    const generatedPolicyNo = policyNo.trim() || `POL-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRecord: CustomerDebtRecord = {
      id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: selectedCustomerId || 'CUSTOM',
      customerName: customCustomerName,
      customerPhone: customCustomerPhone || '-',
      customerTc: customCustomerTc || '-',
      policyNo: generatedPolicyNo,
      insuranceType: finalType,
      company: finalCompany,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentType,
      installmentCount: instCount,
      installments,
      status: remaining === 0 ? 'Ödendi' : (paid > 0 ? 'Kısmi Ödendi' : 'Bekliyor'),
      startDate: startDate ? new Date(startDate).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
      notes: notes || 'Poliçe ödeme kaydı.'
    };

    setRecords([newRecord, ...records]);

    // If initial payment was made, add to cash log
    if (paid > 0) {
      const newCashLog: CashLog = {
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('tr-TR'),
        customerName: customCustomerName,
        policyNo: generatedPolicyNo,
        amount: paid,
        paymentMethod: 'Kredi Kartı',
        type: 'Tahsilat',
        description: `${generatedPolicyNo} nolu ${insuranceType} poliçesi peşinat/ilk tahsilatı.`
      };
      setCashLogs([newCashLog, ...cashLogs]);
    }

    setIsAddModalOpen(false);

    // Reset Form
    setCustomCustomerName('');
    setCustomCustomerPhone('');
    setCustomCustomerTc('');
    setPolicyNo('');
    setTotalAmount('');
    setInitialPaidAmount('');
    setNotes('');
  };

  // Handle Collecting Partial or Installment Payment
  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !collectAmount) return;

    const amt = Number(collectAmount);
    if (amt <= 0) return;

    const newPaid = selectedRecord.paidAmount + amt;
    const newRemaining = Math.max(0, selectedRecord.totalAmount - newPaid);

    // Update installments status
    let remainingPaidPool = newPaid;
    const updatedInstallments = selectedRecord.installments.map(inst => {
      if (remainingPaidPool >= inst.amount) {
        remainingPaidPool -= inst.amount;
        return { ...inst, status: 'Ödendi' as const, paidDate: inst.paidDate || new Date().toLocaleDateString('tr-TR') };
      } else {
        return { ...inst, status: (inst.status === 'Ödendi' ? 'Bekliyor' : inst.status) as any };
      }
    });

    const updatedRecord: CustomerDebtRecord = {
      ...selectedRecord,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      status: newRemaining === 0 ? 'Ödendi' : 'Kısmi Ödendi',
      installments: updatedInstallments
    };

    setRecords(records.map(r => r.id === selectedRecord.id ? updatedRecord : r));

    // Log to Cash Book
    const newLog: CashLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('tr-TR'),
      customerName: selectedRecord.customerName,
      policyNo: selectedRecord.policyNo,
      amount: amt,
      paymentMethod: collectMethod,
      type: 'Tahsilat',
      description: collectNote || `${selectedRecord.policyNo} nolu poliçeye ait ${amt.toLocaleString('tr-TR')} ₺ tahsilat.`
    };
    setCashLogs([newLog, ...cashLogs]);

    setIsCollectModalOpen(false);
    setSelectedRecord(null);
    setCollectAmount('');
    setCollectNote('');
  };

  // WhatsApp Reminder Generator
  const sendWhatsAppReminder = (rec: CustomerDebtRecord) => {
    const cleanPhone = rec.customerPhone.replace(/\s+/g, '').replace(/^0/, '90');
    const msg = `Sayın ${rec.customerName},\n\nElisam Sigorta acentemizden bildirilmektedir.\n${rec.policyNo} numaralı ${rec.insuranceType} poliçenize ait kalan borç / taksit tutarınız: *${rec.remainingAmount.toLocaleString('tr-TR')} ₺*'dir.\n\nÖdemenizi güvenle gerçekleştirmek için bizimle iletişime geçebilirsiniz:\n📞 0551 438 77 71\nElisam Sigorta • Alanya`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Telegram Reminder Generator (uses config from Ayarlar)
  const sendTelegramReminder = async (rec: CustomerDebtRecord) => {
    try {
      const config = JSON.parse(localStorage.getItem('elisam_telegram_config') || '{}');
      if (!config.botToken || !config.chatId) {
        alert('Lütfen önce Ayarlar -> Hatırlatmalar & Telegram bölümünden Bot Token ve Chat ID bilgilerinizi kaydedin.');
        return;
      }

      const text = `💳 *Ödeme / Taksit Hatırlatması*\n\n👤 *Müşteri:* ${rec.customerName}\n📱 *Telefon:* ${rec.customerPhone}\n📄 *Poliçe No:* \`${rec.policyNo}\` (${rec.insuranceType} - ${rec.company})\n💰 *Toplam Prim:* ${rec.totalAmount.toLocaleString('tr-TR')} ₺\n🟢 *Ödenen:* ${rec.paidAmount.toLocaleString('tr-TR')} ₺\n🔴 *Kalan Borç:* ${rec.remainingAmount.toLocaleString('tr-TR')} ₺\n📅 *Ödeme Tipi:* ${rec.paymentType} (${rec.installmentCount} Taksit)\n\n⏰ *Hatırlatma Zamanı:* ${new Date().toLocaleString('tr-TR')}`;

      const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: 'Markdown' })
      });
      const data = await res.json();
      if (data.ok) {
        alert(`✓ ${rec.customerName} müşterisine ait borç özeti Telegram kanalınıza başarıyla iletildi!`);
      } else {
        alert(`Telegram Hatası: ${data.description}`);
      }
    } catch (err: any) {
      alert('Telegram mesajı gönderilemedi: ' + err.message);
    }
  };

  // Calculations
  const totalTahakkuk = records.reduce((s, r) => s + r.totalAmount, 0);
  const totalTahsilEdilen = records.reduce((s, r) => s + r.paidAmount, 0);
  const totalKalanAlacak = records.reduce((s, r) => s + r.remainingAmount, 0);
  const totalGeciken = records
    .filter(r => r.status === 'Gecikmede' || (r.remainingAmount > 0 && r.installments.some(i => i.status === 'Gecikmede')))
    .reduce((s, r) => s + r.remainingAmount, 0);

  // Filtered List
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.policyNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.customerPhone.includes(searchTerm) ||
                          (r.customerTc && r.customerTc.includes(searchTerm));

    if (activeTab === 'kalan') return matchesSearch && r.remainingAmount > 0;
    if (activeTab === 'geciken') return matchesSearch && (r.status === 'Gecikmede' || r.installments.some(i => i.status === 'Gecikmede'));
    if (activeTab === 'odendi') return matchesSearch && r.remainingAmount === 0;
    return matchesSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Müşteri Ödeme, Taksit & Borç Takibi
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px', margin: 0 }}>
            Kimin ne kadar ödemesi var, kimin kaç taksiti kalmış tek ekrandan anlık takip edin ve tahsilat yapın.
          </p>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className={styles.btnCrm}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', fontSize: '0.95rem' }}
        >
          <Plus size={18} /> Yeni Poliçe Ödeme / Taksit Kaydı Ekle
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '25px' }}>
        
        {/* Toplam Satış Hacmi */}
        <div className={styles.card} style={{ borderLeft: '4px solid #3b82f6', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Toplam Satış Hacmi</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 850, color: '#0f172a' }}>
            {totalTahakkuk.toLocaleString('tr-TR')} ₺
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            {records.length} adet kayıtlı poliçe
          </div>
        </div>

        {/* Toplam Tahsil Edilen */}
        <div className={styles.card} style={{ borderLeft: '4px solid #10b981', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tahsil Edilen (Kasada)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 850, color: '#059669' }}>
            {totalTahsilEdilen.toLocaleString('tr-TR')} ₺
          </div>
          <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
            ✓ Kasaya giren net tutar
          </div>
        </div>

        {/* Kalan Müşteri Alacakları */}
        <div className={styles.card} style={{ borderLeft: '4px solid #ef4444', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kalan Müşteri Borçları</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 850, color: '#dc2626' }}>
            {totalKalanAlacak.toLocaleString('tr-TR')} ₺
          </div>
          <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
            {records.filter(r => r.remainingAmount > 0).length} müşteride açık bakiye
          </div>
        </div>

        {/* Geciken / Vadesi Dolan Taksitler */}
        <div className={styles.card} style={{ borderLeft: '4px solid #f59e0b', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Geciken Taksitler</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 850, color: '#d97706' }}>
            {totalGeciken.toLocaleString('tr-TR')} ₺
          </div>
          <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '4px' }}>
            Vadesi geçmiş ödemeler
          </div>
        </div>

      </div>

      {/* Main Content Card */}
      <div className={styles.card}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #edf2f7', marginBottom: '20px', overflowX: 'auto' }}>
          {[
            { key: 'tumu', label: `Tüm Müşteri Kayıtları (${records.length})` },
            { key: 'kalan', label: `Borcu Kalanlar / Taksitli (${records.filter(r => r.remainingAmount > 0).length})` },
            { key: 'geciken', label: `Vadesi Geçenler (${records.filter(r => r.status === 'Gecikmede' || r.installments.some(i => i.status === 'Gecikmede')).length})` },
            { key: 'odendi', label: `Tamamı Ödenenler (${records.filter(r => r.remainingAmount === 0).length})` },
            { key: 'kasa', label: `Kasa Defteri / Tahsilat Geçmişi (${cashLogs.length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 6px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid #2563eb' : '3px solid transparent',
                color: activeTab === tab.key ? '#2563eb' : '#64748b',
                fontWeight: activeTab === tab.key ? 750 : 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        {activeTab !== 'kasa' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="Müşteri adı, TC kimlik, telefon veya poliçe no ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '11px 12px 11px 42px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem' }}
              />
            </div>
          </div>
        )}

        {/* TAB 1: MÜŞTERİ BORÇ & TAKSİT TABLOSU */}
        {activeTab !== 'kasa' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Müşteri Bilgisi</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Poliçe No / Tür</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Toplam Prim</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Ödenen Tutar</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Kalan Borç</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Ödeme Planı</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Durum</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map(rec => {
                    const paidInstallments = rec.installments.filter(i => i.status === 'Ödendi').length;
                    return (
                      <tr key={rec.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                        
                        {/* Müşteri */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '0.95rem' }}>{rec.customerName}</div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                            📞 {rec.customerPhone} {rec.customerTc !== '-' && `• TC: ${rec.customerTc}`}
                          </div>
                        </td>

                        {/* Poliçe No */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#1e40af', fontFamily: 'monospace', fontSize: '0.92rem' }}>
                            {rec.policyNo}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {rec.insuranceType} • {rec.company}
                          </div>
                        </td>

                        {/* Toplam Tutar */}
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                          {rec.totalAmount.toLocaleString('tr-TR')} ₺
                        </td>

                        {/* Ödenen */}
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#059669' }}>
                          {rec.paidAmount.toLocaleString('tr-TR')} ₺
                        </td>

                        {/* Kalan Borç */}
                        <td style={{ padding: '14px 16px' }}>
                          {rec.remainingAmount > 0 ? (
                            <span style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 800, fontSize: '0.95rem' }}>
                              {rec.remainingAmount.toLocaleString('tr-TR')} ₺
                            </span>
                          ) : (
                            <span style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>
                              ✓ Borcu Yok
                            </span>
                          )}
                        </td>

                        {/* Ödeme Planı */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155' }}>
                            {rec.paymentType}
                          </div>
                          {rec.paymentType === 'Taksitli' && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {paidInstallments} / {rec.installmentCount} Taksit Ödendi
                            </div>
                          )}
                        </td>

                        {/* Durum */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor: rec.remainingAmount === 0 ? '#dcfce7' : (rec.paidAmount > 0 ? '#eff6ff' : '#fef3c7'),
                            color: rec.remainingAmount === 0 ? '#15803d' : (rec.paidAmount > 0 ? '#1d4ed8' : '#b45309')
                          }}>
                            {rec.remainingAmount === 0 ? 'Ödendi' : (rec.paidAmount > 0 ? 'Kısmi Ödendi' : 'Ödeme Bekliyor')}
                          </span>
                        </td>

                        {/* Aksiyonlar */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            
                            {/* Tahsilat Yap Butonu */}
                            {rec.remainingAmount > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedRecord(rec);
                                  setCollectAmount(rec.paymentType === 'Taksitli' ? String(Math.min(rec.remainingAmount, Math.round(rec.totalAmount / rec.installmentCount))) : String(rec.remainingAmount));
                                  setIsCollectModalOpen(true);
                                }}
                                style={{
                                  padding: '7px 12px',
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                💳 Tahsilat Yap
                              </button>
                            )}

                            {/* Taksit Planı Butonu */}
                            <button
                              onClick={() => {
                                setSelectedRecord(rec);
                                setIsScheduleModalOpen(true);
                              }}
                              style={{
                                padding: '7px 11px',
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              📋 Plan
                            </button>

                            {/* WhatsApp Hatırlat */}
                            {rec.remainingAmount > 0 && rec.customerPhone !== '-' && (
                              <button
                                onClick={() => sendWhatsAppReminder(rec)}
                                title="WhatsApp'tan borç hatırlatma mesajı gönder"
                                style={{
                                  padding: '7px 10px',
                                  backgroundColor: '#25d366',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer'
                                }}
                              >
                                💬
                              </button>
                            )}

                            {/* Telegram'a Bildir */}
                            {rec.remainingAmount > 0 && (
                              <button
                                onClick={() => sendTelegramReminder(rec)}
                                title="Telegram botunuza borç özetini gönder"
                                style={{
                                  padding: '7px 10px',
                                  backgroundColor: '#0088cc',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer'
                                }}
                              >
                                🤖
                              </button>
                            )}

                            {/* Sil */}
                            <button
                              onClick={() => {
                                if (confirm(`${rec.customerName} müşterisinin ödeme kaydını silmek istiyor musunuz?`)) {
                                  setRecords(records.filter(r => r.id !== rec.id));
                                }
                              }}
                              style={{
                                padding: '7px 9px',
                                backgroundColor: '#fff',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Kayıtlı finans/borç kaydı bulunamadı. &ldquo;Yeni Poliçe Ödeme / Taksit Kaydı Ekle&rdquo; butonundan ekleyebilirsiniz.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: KASA DEFTERİ (TAHSİLAT GEÇMİŞİ) */}
        {activeTab === 'kasa' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Kasa Giriş / Çıkış Defteri ({cashLogs.length} İşlem)
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>İşlem No / Tarih</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Müşteri Adı</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Poliçe No</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Ödeme Yöntemi</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Açıklama</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Tahsil Edilen Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {cashLogs.length > 0 ? (
                    cashLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 700, color: '#1e40af', fontFamily: 'monospace' }}>{log.id}</span>
                          <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{log.date}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{log.customerName}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>{log.policyNo}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.86rem', color: '#334155' }}>{log.paymentMethod}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b' }}>{log.description}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '1rem' }}>
                          +{log.amount.toLocaleString('tr-TR')} ₺
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Henüz kasa tahsilat kaydı bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: YENİ POLİÇE / BORÇ KAYDI EKLEME */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={22} color="#2563eb" /> Yeni Poliçe Ödeme / Taksit Kaydı
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleAddRecord}>
              
              {/* Müşteri Seçimi */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Kayıtlı Müşteri Seçin veya Manuel Girin *
                </label>
                <select 
                  value={selectedCustomerId} 
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 600, backgroundColor: '#f8fafc' }}
                >
                  <option value="custom">-- Manuel Müşteri Bilgisi Yazacağım --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type} - {c.phone})</option>
                  ))}
                </select>
              </div>

              {/* Manuel Müşteri Alanları */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Müşteri Ad Soyad *</label>
                  <input 
                    type="text" 
                    required 
                    value={customCustomerName} 
                    onChange={(e) => setCustomCustomerName(e.target.value)} 
                    placeholder="Örn: Ahmet Yılmaz" 
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Telefon Numarası</label>
                  <input 
                    type="text" 
                    value={customCustomerPhone} 
                    onChange={(e) => setCustomCustomerPhone(e.target.value)} 
                    placeholder="05XX XXX XX XX" 
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                  />
                </div>
              </div>

              {/* Poliçe Numarası & Türü & Şirket */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Poliçe Numarası (Manuel Yazın)</label>
                  <input 
                    type="text" 
                    value={policyNo} 
                    onChange={(e) => setPolicyNo(e.target.value)} 
                    placeholder="Örn: 312984920/0 veya AK-2024-912" 
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700, fontFamily: 'monospace' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Sigorta Türü</label>
                  <select value={insuranceType} onChange={(e) => setInsuranceType(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                    <option value="Kasko">Kasko</option>
                    <option value="Trafik">Trafik</option>
                    <option value="DASK">DASK Deprem</option>
                    <option value="Konut">Konut</option>
                    <option value="İşyeri">İşyeri</option>
                    <option value="Özel Sağlık">Özel Sağlık</option>
                    <option value="Tamamlayıcı Sağlık (TSS)">Tamamlayıcı Sağlık (TSS)</option>
                    <option value="Yabancı Sağlık">Yabancı Sağlık</option>
                    <option value="Seyahat Sağlık">Seyahat Sağlık</option>
                    <option value="Ferdi Kaza">Ferdi Kaza</option>
                    <option value="Nakliyat">Nakliyat</option>
                    <option value="Mesleki Sorumluluk">Mesleki Sorumluluk</option>
                    <option value="TARSİM Tarım">TARSİM Tarım</option>
                    <option value="Tekne / Yat">Tekne / Yat</option>
                    <option value="DIGER">➕ Diğer (Manuel Tür Yaz...)</option>
                  </select>
                  {insuranceType === 'DIGER' && (
                    <input 
                      type="text" 
                      required 
                      value={customInsuranceType} 
                      onChange={(e) => setCustomInsuranceType(e.target.value)} 
                      placeholder="Sigorta türünü yazın..." 
                      style={{ width: '100%', marginTop: '6px', padding: '8px 10px', borderRadius: '6px', border: '2px solid #0284c7', outline: 'none', fontWeight: 600, backgroundColor: '#f0f9ff' }} 
                    />
                  )}
                </div>
              </div>

              {/* Sigorta Şirketi */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Sigorta Şirketi</label>
                <select value={company} onChange={(e) => setCompany(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="HDI Sigorta">HDI Sigorta</option>
                  <option value="Ak Sigorta">Ak Sigorta</option>
                  <option value="Sompo Sigorta">Sompo Sigorta</option>
                  <option value="Allianz">Allianz</option>
                  <option value="Anadolu Sigorta">Anadolu Sigorta</option>
                  <option value="Quick Sigorta">Quick Sigorta</option>
                  <option value="Emaa Sigorta">Emaa Sigorta</option>
                  <option value="Türkiye Sigorta">Türkiye Sigorta</option>
                  <option value="Axa Sigorta">Axa Sigorta</option>
                  <option value="Ray Sigorta">Ray Sigorta</option>
                  <option value="Neova Sigorta">Neova Sigorta</option>
                  <option value="Hepiyi Sigorta">Hepiyi Sigorta</option>
                  <option value="Generali Sigorta">Generali Sigorta</option>
                  <option value="Unico Sigorta">Unico Sigorta</option>
                  <option value="Corpus Sigorta">Corpus Sigorta</option>
                  <option value="Koru Sigorta">Koru Sigorta</option>
                  <option value="Bereket Sigorta">Bereket Sigorta</option>
                  <option value="Mapfre Sigorta">Mapfre Sigorta</option>
                  <option value="Orient Sigorta">Orient Sigorta</option>
                  <option value="Ankara Sigorta">Ankara Sigorta</option>
                  <option value="Zurich Sigorta">Zurich Sigorta</option>
                  <option value="DIGER">➕ Diğer (Manuel Şirket Yaz...)</option>
                </select>
                {company === 'DIGER' && (
                  <input 
                    type="text" 
                    required 
                    value={customCompany} 
                    onChange={(e) => setCustomCompany(e.target.value)} 
                    placeholder="Sigorta şirketini yazın..." 
                    style={{ width: '100%', marginTop: '6px', padding: '8px 10px', borderRadius: '6px', border: '2px solid #0284c7', outline: 'none', fontWeight: 600, backgroundColor: '#f0f9ff' }} 
                  />
                )}
              </div>

              {/* Toplam Prim & Peşin / Taksit */}
              <div style={{ padding: '14px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#0369a1', marginBottom: '4px' }}>Toplam Prim / Borç Tutarı (₺) *</label>
                    <input 
                      type="number" 
                      required 
                      value={totalAmount} 
                      onChange={(e) => setTotalAmount(e.target.value)} 
                      placeholder="Örn: 15000" 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #7dd3fc', outline: 'none', fontWeight: 800, fontSize: '1.05rem' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#0369a1', marginBottom: '4px' }}>Ödeme Şekli</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #7dd3fc', outline: 'none', fontWeight: 700 }}>
                      <option value="Peşin / Tek Çekim">Peşin / Tek Çekim</option>
                      <option value="Taksitli">Taksitli Ödeme</option>
                    </select>
                  </div>
                </div>

                {paymentType === 'Taksitli' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', marginBottom: '4px' }}>Taksit Sayısı</label>
                    <select value={installmentCount} onChange={(e) => setInstallmentCount(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #7dd3fc', outline: 'none', fontWeight: 700 }}>
                      <option value={2}>2 Taksit</option>
                      <option value={3}>3 Taksit</option>
                      <option value={4}>4 Taksit</option>
                      <option value={6}>6 Taksit</option>
                      <option value={9}>9 Taksit</option>
                      <option value={12}>12 Taksit</option>
                    </select>
                    {totalAmount && (
                      <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#0284c7', fontWeight: 700 }}>
                        💡 Her ay ödenecek taksit: {(Number(totalAmount) / installmentCount).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', marginBottom: '4px' }}>Peşin Tahsil Edilen Tutar (₺)</label>
                    <input 
                      type="number" 
                      value={initialPaidAmount} 
                      onChange={(e) => setInitialPaidAmount(e.target.value)} 
                      placeholder={totalAmount || "Örn: 15000"} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #7dd3fc', outline: 'none', fontWeight: 700 }} 
                    />
                  </div>
                )}
              </div>

              {/* Not */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Ödeme Notu / Açıklama</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Örn: 2. taksit 15 Eylül'de ödenecek..." 
                  rows={2} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                ></textarea>
              </div>

              {/* Butonlar */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}>İptal</button>
                <button type="submit" className={styles.btnCrm} style={{ padding: '10px 22px' }}>Kaydet ve Listeye Ekle</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAHSİLAT YAP (PARÇALI VEYA TAKSİT ÖDEMESİ ALMA) */}
      {isCollectModalOpen && selectedRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a' }}>TAHSİLAT İŞLEMİ</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                  {selectedRecord.customerName}
                </h2>
              </div>
              <button onClick={() => setIsCollectModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={22} />
              </button>
            </div>

            {/* Bakiye Özeti */}
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Poliçe Toplamı</div>
                <div style={{ fontWeight: 750, color: '#0f172a' }}>{selectedRecord.totalAmount.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Şimdiye Kadar Ödenen</div>
                <div style={{ fontWeight: 750, color: '#059669' }}>{selectedRecord.paidAmount.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Kalan Borç</div>
                <div style={{ fontWeight: 850, color: '#dc2626' }}>{selectedRecord.remainingAmount.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>

            <form onSubmit={handleCollectPayment}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#0f172a', marginBottom: '6px' }}>
                  Tahsil Edilecek Tutar (₺) *
                </label>
                <input 
                  type="number" 
                  required 
                  max={selectedRecord.remainingAmount}
                  value={collectAmount} 
                  onChange={(e) => setCollectAmount(e.target.value)} 
                  placeholder="0" 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #16a34a', outline: 'none', fontWeight: 850, fontSize: '1.2rem', color: '#16a34a' }} 
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ödeme Yöntemi</label>
                <select 
                  value={collectMethod} 
                  onChange={(e) => setCollectMethod(e.target.value as any)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 600 }}
                >
                  <option value="Kredi Kartı">Kredi Kartı (Pos)</option>
                  <option value="Banka Havalesi / EFT">Banka Havalesi / EFT</option>
                  <option value="Nakit">Nakit Para</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Açıklama / Makbuz Notu</label>
                <input 
                  type="text" 
                  value={collectNote} 
                  onChange={(e) => setCollectNote(e.target.value)} 
                  placeholder="Örn: 2. taksit tahsilatı yapıldı..." 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsCollectModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}>İptal</button>
                <button type="submit" style={{ padding: '10px 22px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 750, cursor: 'pointer' }}>
                  ✓ Tahsilatı Kaydet ve Kasaya Ekle
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: TAKSİT PLANI DETAYI */}
      {isScheduleModalOpen && selectedRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>TAKSİT VE ÖDEME PLANI</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                  {selectedRecord.customerName}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Poliçe No: {selectedRecord.policyNo} ({selectedRecord.insuranceType})</div>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={22} />
              </button>
            </div>

            {/* Taksit Listesi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {selectedRecord.installments.map((inst) => (
                <div 
                  key={inst.installmentNo}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: inst.status === 'Ödendi' ? '#f0fdf4' : (inst.status === 'Gecikmede' ? '#fef2f2' : '#f8fafc'),
                    border: `1px solid ${inst.status === 'Ödendi' ? '#bbf7d0' : (inst.status === 'Gecikmede' ? '#fecaca' : '#e2e8f0')}`
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '0.92rem' }}>
                      {inst.installmentNo}. Taksit: {inst.amount.toLocaleString('tr-TR')} ₺
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Vade Tarihi: {inst.dueDate} {inst.paidDate && `• Ödendiği Tarih: ${inst.paidDate}`}
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 750,
                    backgroundColor: inst.status === 'Ödendi' ? '#dcfce7' : (inst.status === 'Gecikmede' ? '#fee2e2' : '#fef3c7'),
                    color: inst.status === 'Ödendi' ? '#15803d' : (inst.status === 'Gecikmede' ? '#dc2626' : '#b45309')
                  }}>
                    {inst.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 750, color: '#dc2626' }}>
                Kalan Toplam Borç: {selectedRecord.remainingAmount.toLocaleString('tr-TR')} ₺
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} style={{ padding: '8px 18px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
