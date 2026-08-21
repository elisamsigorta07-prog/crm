"use client";

import { useState } from 'react';
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
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Building2, 
  User, 
  Calendar,
  CreditCard,
  Banknote,
  Receipt
} from 'lucide-react';
import { 
  FinancialTransaction, 
  initialFinancialTransactionsData, 
  Customer, 
  initialCustomersData, 
  Policy, 
  initialPoliciesData 
} from '@/data/crmData';
import styles from '../layout.module.css';

export default function SigortaFinansPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(initialFinancialTransactionsData);
  const [customers] = useState<Customer[]>(initialCustomersData);
  const [policies] = useState<Policy[]>(initialPoliciesData);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'hepsi' | 'tahsilat' | 'odeme' | 'bekleyen' | 'cari'>('hepsi');
  const [categoryFilter, setCategoryFilter] = useState<string>('Hepsi');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);

  // Form State for New Transaction
  const [type, setType] = useState<'Tahsilat' | 'Ödeme'>('Tahsilat');
  const [partyType, setPartyType] = useState<'Müşteri' | 'Sigorta Şirketi' | 'Tedarikçi/Diğer'>('Müşteri');
  const [partyName, setPartyName] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [category, setCategory] = useState<FinancialTransaction['category']>('Poliçe Primi Tahsilatı');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<FinancialTransaction['paymentMethod']>('Kredi Kartı');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<FinancialTransaction['status']>('Tahsil Edildi');
  const [description, setDescription] = useState('');

  // Auto-fill policy info when selected
  const handlePolicyChange = (pId: string) => {
    setPolicyId(pId);
    if (!pId) return;
    const matchedPol = policies.find(p => p.id === pId);
    if (matchedPol) {
      setPartyName(matchedPol.customerName);
      setPartyType('Müşteri');
      setAmount(matchedPol.premium.toString());
      setDescription(`${matchedPol.id} numaralı ${matchedPol.type} poliçesi tahsilatı.`);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !amount) return;

    const newTx: FinancialTransaction = {
      id: `FIN-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      partyType,
      partyName,
      policyId: policyId || undefined,
      category,
      amount: Number(amount),
      paymentMethod,
      date: date ? new Date(date).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
      dueDate: dueDate ? new Date(dueDate).toLocaleDateString('tr-TR') : undefined,
      status: type === 'Tahsilat' ? (status === 'Ödendi' ? 'Tahsil Edildi' : status) : (status === 'Tahsil Edildi' ? 'Ödendi' : status),
      description: description || `${type} kaydı oluşturuldu.`
    };

    setTransactions([newTx, ...transactions]);
    setIsAddModalOpen(false);

    // Reset Form
    setPartyName('');
    setPolicyId('');
    setAmount('');
    setDescription('');
    setDueDate('');
  };

  const handleMarkAsPaid = (txId: string) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id === txId) {
        return {
          ...tx,
          status: tx.type === 'Tahsilat' ? 'Tahsil Edildi' : 'Ödendi'
        };
      }
      return tx;
    }));
    if (selectedTransaction && selectedTransaction.id === txId) {
      setSelectedTransaction(prev => prev ? {
        ...prev,
        status: prev.type === 'Tahsilat' ? 'Tahsil Edildi' : 'Ödendi'
      } : null);
    }
  };

  // Calculations
  const totalTahsilat = transactions
    .filter(t => t.type === 'Tahsilat' && t.status === 'Tahsil Edildi')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOdeme = transactions
    .filter(t => t.type === 'Ödeme' && t.status === 'Ödendi')
    .reduce((sum, t) => sum + t.amount, 0);

  const netKasa = totalTahsilat - totalOdeme;

  const totalBekleyen = transactions
    .filter(t => t.status === 'Bekliyor' || t.status === 'Gecikmede')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtered List
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.policyId && t.policyId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'Hepsi' || t.category === categoryFilter;

    if (activeTab === 'tahsilat') return matchesSearch && matchesCategory && t.type === 'Tahsilat';
    if (activeTab === 'odeme') return matchesSearch && matchesCategory && t.type === 'Ödeme';
    if (activeTab === 'bekleyen') return matchesSearch && matchesCategory && (t.status === 'Bekliyor' || t.status === 'Gecikmede');
    
    return matchesSearch && matchesCategory;
  });

  // Calculate Balances per Customer / Company for Cari Tab
  const partyBalances = Array.from(new Set(transactions.map(t => t.partyName))).map(name => {
    const partyTxs = transactions.filter(t => t.partyName === name);
    const tahsilEdilen = partyTxs.filter(t => t.type === 'Tahsilat' && t.status === 'Tahsil Edildi').reduce((s, t) => s + t.amount, 0);
    const odenen = partyTxs.filter(t => t.type === 'Ödeme' && t.status === 'Ödendi').reduce((s, t) => s + t.amount, 0);
    const bekleyen = partyTxs.filter(t => t.status === 'Bekliyor' || t.status === 'Gecikmede').reduce((s, t) => s + t.amount, 0);
    const partyType = partyTxs[0]?.partyType || 'Müşteri';

    return {
      name,
      partyType,
      tahsilEdilen,
      odenen,
      bekleyen,
      txCount: partyTxs.length
    };
  });

  return (
    <div>
      {/* Header & Main Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>Finans & Cari Yönetimi</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Kimden ne alındı, kime ne ödendi, kasa ve cari bakiyelerinizi anlık takip edin.</p>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: 600 }}
        >
          <Plus size={18} /> Yeni Finansal İşlem Ekle
        </button>
      </div>

      {/* Financial Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Total Collections (Gelir) */}
        <div className={styles.card} style={{ borderLeft: '4px solid #22c55e', display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
          <div style={{ background: '#dcfce7', color: '#16a34a', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Toplam Tahsilat (Gelir)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>₺{totalTahsilat.toLocaleString('tr-TR')}</div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <ArrowDownRight size={14} /> Müşteri Tahsilatları
            </div>
          </div>
        </div>

        {/* Total Payments (Gider) */}
        <div className={styles.card} style={{ borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
          <div style={{ background: '#fee2e2', color: '#dc2626', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingDown size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Toplam Ödeme (Gider)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>₺{totalOdeme.toLocaleString('tr-TR')}</div>
            <div style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <ArrowUpRight size={14} /> Şirket Hakediş & Giderler
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className={styles.card} style={{ borderLeft: '4px solid #2563eb', display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
          <div style={{ background: '#dbeafe', color: '#2563eb', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Net Kasa / Bakiye</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: netKasa >= 0 ? '#1e3a8a' : '#dc2626' }}>₺{netKasa.toLocaleString('tr-TR')}</div>
            <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '2px' }}>
              Net Acente Nakit Akışı
            </div>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className={styles.card} style={{ borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
          <div style={{ background: '#fef3c7', color: '#d97706', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Bekleyen / Vadesi Gelen</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>₺{totalBekleyen.toLocaleString('tr-TR')}</div>
            <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '2px' }}>
              Tahsilat & Ödeme Bekleyenler
            </div>
          </div>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className={styles.card} style={{ marginBottom: '25px', padding: '15px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
          
          {/* Main Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button 
              onClick={() => setActiveTab('hepsi')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: activeTab === 'hepsi' ? '#ffffff' : 'transparent',
                color: activeTab === 'hepsi' ? '#1e293b' : '#64748b',
                boxShadow: activeTab === 'hepsi' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Tüm Hareketler ({transactions.length})
            </button>

            <button 
              onClick={() => setActiveTab('tahsilat')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: activeTab === 'tahsilat' ? '#ffffff' : 'transparent',
                color: activeTab === 'tahsilat' ? '#16a34a' : '#64748b',
                boxShadow: activeTab === 'tahsilat' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              📥 Tahsilatlar (Gelir)
            </button>

            <button 
              onClick={() => setActiveTab('odeme')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: activeTab === 'odeme' ? '#ffffff' : 'transparent',
                color: activeTab === 'odeme' ? '#dc2626' : '#64748b',
                boxShadow: activeTab === 'odeme' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              📤 Ödemeler (Gider)
            </button>

            <button 
              onClick={() => setActiveTab('bekleyen')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: activeTab === 'bekleyen' ? '#ffffff' : 'transparent',
                color: activeTab === 'bekleyen' ? '#b45309' : '#64748b',
                boxShadow: activeTab === 'bekleyen' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              ⏳ Bekleyen / Vadeliler
            </button>

            <button 
              onClick={() => setActiveTab('cari')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: activeTab === 'cari' ? '#ffffff' : 'transparent',
                color: activeTab === 'cari' ? '#2563eb' : '#64748b',
                boxShadow: activeTab === 'cari' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              👥 Cari Hesap Özetleri
            </button>
          </div>

          {/* Search Input & Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            >
              <option value="Hepsi">Tüm Kategoriler</option>
              <option value="Poliçe Primi Tahsilatı">Poliçe Tahsilatı</option>
              <option value="Şirket Hakediş Ödemesi">Şirket Hakedişi</option>
              <option value="Acente Komisyonu">Acente Komisyonu</option>
              <option value="Ofis & Operasyon">Ofis & Operasyon</option>
              <option value="Personel & Maaş">Personel & Maaş</option>
              <option value="Diğer">Diğer</option>
            </select>

            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Kişi, şirket, poliçe veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '9px 12px 9px 36px', width: '260px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* CONTENT AREA: TAB 1-4 (TRANSACTIONS TABLE) OR TAB 5 (CARI SUMMARY) */}
      {activeTab !== 'cari' ? (
        <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '14px 18px' }}>İşlem ID</th>
                  <th style={{ padding: '14px 18px' }}>Tür</th>
                  <th style={{ padding: '14px 18px' }}>Muhatap (Kimden / Kime)</th>
                  <th style={{ padding: '14px 18px' }}>Kategori & Bağlantı</th>
                  <th style={{ padding: '14px 18px' }}>Ödeme Yöntemi</th>
                  <th style={{ padding: '14px 18px' }}>Tarih / Vade</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Tutar</th>
                  <th style={{ padding: '14px 18px' }}>Durum</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      Kriterlere uygun finansal işlem kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                      
                      {/* ID */}
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#1e293b' }}>
                        {tx.id}
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '14px 18px' }}>
                        {tx.type === 'Tahsilat' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.78rem' }}>
                            <ArrowDownRight size={14} /> Tahsilat
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.78rem' }}>
                            <ArrowUpRight size={14} /> Ödeme
                          </span>
                        )}
                      </td>

                      {/* Party Name */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {tx.partyType === 'Müşteri' && <User size={14} color="#64748b" />}
                          {tx.partyType === 'Sigorta Şirketi' && <Building2 size={14} color="#2563eb" />}
                          {tx.partyName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{tx.partyType}</div>
                      </td>

                      {/* Category & Policy */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: '#334155', fontWeight: 600 }}>{tx.category}</div>
                        {tx.policyId && (
                          <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginTop: '2px' }}>
                            Poliçe: {tx.policyId}
                          </span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td style={{ padding: '14px 18px', color: '#475569' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {tx.paymentMethod === 'Kredi Kartı' && <CreditCard size={14} color="#2563eb" />}
                          {tx.paymentMethod === 'Banka Havalesi / EFT' && <Banknote size={14} color="#16a34a" />}
                          {tx.paymentMethod === 'Nakit' && <Receipt size={14} color="#d97706" />}
                          {tx.paymentMethod}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: '#334155', fontWeight: 500 }}>{tx.date}</div>
                        {tx.dueDate && (
                          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Vade: {tx.dueDate}</div>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, fontSize: '0.98rem', color: tx.type === 'Tahsilat' ? '#16a34a' : '#dc2626' }}>
                        {tx.type === 'Tahsilat' ? '+' : '-'}₺{tx.amount.toLocaleString('tr-TR')}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        {tx.status === 'Tahsil Edildi' && (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> Tahsil Edildi
                          </span>
                        )}
                        {tx.status === 'Ödendi' && (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> Ödendi
                          </span>
                        )}
                        {tx.status === 'Bekliyor' && (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> Bekliyor
                          </span>
                        )}
                        {tx.status === 'Gecikmede' && (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={13} /> Gecikmede
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <button 
                            onClick={() => setSelectedTransaction(tx)}
                            title="Makbuz & Detay"
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: '#1e293b', fontWeight: 600, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <FileText size={15} color="#2563eb" /> İncele
                          </button>

                          <button 
                            onClick={() => {
                              setSelectedTransaction(tx);
                              // Populate edit fields
                              setType(tx.type);
                              setPartyType(tx.partyType);
                              setPartyName(tx.partyName);
                              setPolicyId(tx.policyId || '');
                              setCategory(tx.category);
                              setAmount(tx.amount.toString());
                              setPaymentMethod(tx.paymentMethod);
                              setStatus(tx.status);
                              setDescription(tx.description);
                              setIsAddModalOpen(true);
                            }}
                            title="İşlemi Düzenle"
                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: '#1d4ed8', fontWeight: 600, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            ✏️ Düzenle
                          </button>

                          {(tx.status === 'Bekliyor' || tx.status === 'Gecikmede') && (
                            <button 
                              onClick={() => handleMarkAsPaid(tx.id)}
                              title={tx.type === 'Tahsilat' ? 'Tahsil Edildi İşaretle' : 'Ödendi İşaretle'}
                              style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: '#15803d', fontWeight: 700, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <CheckCircle2 size={15} /> {tx.type === 'Tahsilat' ? 'Tahsil Et' : 'Öde'}
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARI SUMMARY TAB (Party Balances Summary) */
        <div className={styles.card} style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '15px' }}>
            Müşteri & Şirket Cari Hesap Bakiyeleri Özeti
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Cari / Unvan</th>
                  <th style={{ padding: '12px 16px' }}>Cari Tipi</th>
                  <th style={{ padding: '12px 16px' }}>İşlem Sayısı</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Toplam Tahsil Edilen</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Toplam Ödenen</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Bekleyen Bakiye</th>
                </tr>
              </thead>
              <tbody>
                {partyBalances.map((party, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                      {party.name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '0.78rem', padding: '3px 8px', borderRadius: '4px', background: party.partyType === 'Müşteri' ? '#e0f2fe' : '#fef3c7', color: party.partyType === 'Müşteri' ? '#0369a1' : '#b45309', fontWeight: 600 }}>
                        {party.partyType}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {party.txCount} İşlem
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                      ₺{party.tahsilEdilen.toLocaleString('tr-TR')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                      ₺{party.odenen.toLocaleString('tr-TR')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: party.bekleyen > 0 ? '#b45309' : '#64748b' }}>
                      ₺{party.bekleyen.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW TRANSACTION */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
                  <Wallet size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Yeni Finansal İşlem Ekle</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddTransaction} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Type Switcher */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>İşlem Yönü *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => { setType('Tahsilat'); setCategory('Poliçe Primi Tahsilatı'); }}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: type === 'Tahsilat' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      background: type === 'Tahsilat' ? '#f0fdf4' : '#ffffff',
                      color: type === 'Tahsilat' ? '#15803d' : '#64748b',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <ArrowDownRight size={18} /> 📥 Tahsilat (Gelir / Kimden Alındı)
                  </button>

                  <button 
                    type="button" 
                    onClick={() => { setType('Ödeme'); setCategory('Şirket Hakediş Ödemesi'); }}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: type === 'Ödeme' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      background: type === 'Ödeme' ? '#fef2f2' : '#ffffff',
                      color: type === 'Ödeme' ? '#b91c1c' : '#64748b',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <ArrowUpRight size={18} /> 📤 Ödeme (Gider / Kime Verildi)
                  </button>
                </div>
              </div>

              {/* Policy Auto-Select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Bağlantılı Poliçe (Opsiyonel)</label>
                <select 
                  value={policyId}
                  onChange={(e) => handlePolicyChange(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                >
                  <option value="">Poliçe Seçmeyiniz (Genel İşlem)</option>
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.customerName} ({p.company} {p.type} - ₺{p.premium.toLocaleString('tr-TR')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Party Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Muhatap Tipi</label>
                  <select 
                    value={partyType}
                    onChange={(e) => setPartyType(e.target.value as any)}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="Müşteri">Müşteri</option>
                    <option value="Sigorta Şirketi">Sigorta Şirketi</option>
                    <option value="Tedarikçi/Diğer">Tedarikçi / Diğer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Kimden Alındı / Kime Verildi? *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Müşteri veya Şirket Adı yazın..."
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Amount & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Tutar (TL) *</label>
                  <input 
                    type="number"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Kategori</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="Poliçe Primi Tahsilatı">Poliçe Primi Tahsilatı</option>
                    <option value="Şirket Hakediş Ödemesi">Şirket Hakediş Ödemesi</option>
                    <option value="Acente Komisyonu">Acente Komisyonu</option>
                    <option value="Ofis & Operasyon">Ofis & Operasyon</option>
                    <option value="Personel & Maaş">Personel & Maaş</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
              </div>

              {/* Payment Method & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ödeme Yöntemi</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Banka Havalesi / EFT">Banka Havalesi / EFT</option>
                    <option value="Nakit">Nakit</option>
                    <option value="Çek / Senet">Çek / Senet</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>İşlem Durumu</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="Tahsil Edildi">Tahsil Edildi / Ödendi</option>
                    <option value="Bekliyor">Bekliyor (Vadeli)</option>
                    <option value="Gecikmede">Gecikmede</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>İşlem Tarihi</label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Vade Tarihi (Varsa)</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Açıklama & Notlar</label>
                <textarea 
                  rows={3}
                  placeholder="İşlem ile ilgili dekont no, makbuz notu vb..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
                >
                  İptal
                </button>

                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700 }}
                >
                  İşlemi Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSACTION DETAIL & RECEIPT */}
      {selectedTransaction && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Printable Receipt Header */}
            <div style={{ padding: '24px', background: selectedTransaction.type === 'Tahsilat' ? '#f0fdf4' : '#fef2f2', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: selectedTransaction.type === 'Tahsilat' ? '#16a34a' : '#dc2626' }}>
                  ELİSAM SİGORTA FINANS MAKBUZU
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {selectedTransaction.id}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                  Tarih: {selectedTransaction.date}
                </div>
              </div>

              <button onClick={() => setSelectedTransaction(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={22} />
              </button>
            </div>

            {/* Receipt Details Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>İşlem Yönü:</div>
                  <div style={{ fontWeight: 700, color: selectedTransaction.type === 'Tahsilat' ? '#16a34a' : '#dc2626' }}>
                    {selectedTransaction.type === 'Tahsilat' ? '📥 TAHSİLAT (GELİR)' : '📤 ÖDEME (GİDER)'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>İşlem Durumu:</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedTransaction.status}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Muhatap (Kimden/Kime):</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedTransaction.partyName} ({selectedTransaction.partyType})</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Ödeme Yöntemi:</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedTransaction.paymentMethod}</div>
                </div>
              </div>

              {/* Amount Display Box */}
              <div style={{ textAlign: 'center', padding: '20px', background: '#0f172a', color: '#ffffff', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>İşlem Tutarı</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '4px', color: selectedTransaction.type === 'Tahsilat' ? '#4ade80' : '#f87171' }}>
                  ₺{selectedTransaction.amount.toLocaleString('tr-TR')}
                </div>
              </div>

              {/* Policy & Category Notes */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Kategori & Bağlantılı Poliçe</div>
                <div style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>{selectedTransaction.category}</div>
                {selectedTransaction.policyId && (
                  <div style={{ marginTop: '4px', color: '#2563eb', fontWeight: 600 }}>Poliçe Referans No: {selectedTransaction.policyId}</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>İşlem Açıklaması</div>
                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', color: '#334155' }}>
                  {selectedTransaction.description}
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                {(selectedTransaction.status === 'Bekliyor' || selectedTransaction.status === 'Gecikmede') ? (
                  <button 
                    onClick={() => handleMarkAsPaid(selectedTransaction.id)}
                    style={{ background: '#dcfce7', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', color: '#15803d', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={16} /> {selectedTransaction.type === 'Tahsilat' ? 'Tahsil Edildi Yap' : 'Ödendi Yap'}
                  </button>
                ) : <div></div>}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => window.print()}
                    style={{ padding: '9px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={16} /> Makbuz Yazdır
                  </button>

                  <button 
                    onClick={() => setSelectedTransaction(null)}
                    style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Kapat
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
