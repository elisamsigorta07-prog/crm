"use client";

import { useState } from 'react';
import { Search, Plus, Filter, FileText, Download, X, ShieldCheck, Eye, User, Calendar, CreditCard, DollarSign, Printer, Send } from 'lucide-react';
import { Policy, Customer, initialPoliciesData, initialCustomersData } from '@/data/crmData';
import styles from '../layout.module.css';

export default function PolicelerPage() {
  const [policies, setPolicies] = useState<Policy[]>(initialPoliciesData);
  const [customers] = useState<Customer[]>(initialCustomersData);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Tümü');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // Form state
  const [policyNo, setPolicyNo] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [type, setType] = useState<Policy['type']>('Trafik');
  const [company, setCompany] = useState<Policy['company']>('HDI Sigorta');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]);
  const [premium, setPremium] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'Peşin / Tek Çekim' | 'Taksitli'>('Peşin / Tek Çekim');
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [commissionRate, setCommissionRate] = useState('15');
  const [paymentStatus, setPaymentStatus] = useState<Policy['paymentStatus']>('Ödendi');
  const [notes, setNotes] = useState('');

  const handleAddPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !premium) return;

    const matchedCustomer = customers.find(c => c.id === selectedCustomerId);
    const prem = Number(premium);
    const paid = Number(paidAmount) || (paymentType === 'Peşin / Tek Çekim' ? prem : Math.round(prem / installmentCount));
    const remaining = Math.max(0, prem - paid);

    const generatedPolicyNo = policyNo.trim() || `POL-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPol: Policy = {
      id: generatedPolicyNo,
      policyNo: generatedPolicyNo,
      customerId: selectedCustomerId,
      customerName: matchedCustomer ? matchedCustomer.name : 'Bilinmeyen Müşteri',
      customerPhone: matchedCustomer ? matchedCustomer.phone : '',
      customerTc: matchedCustomer ? matchedCustomer.identityNo : '',
      type,
      company,
      startDate: startDate ? new Date(startDate).toLocaleDateString('tr-TR') : '01.01.2024',
      endDate: endDate ? new Date(endDate).toLocaleDateString('tr-TR') : '01.01.2025',
      premium: prem,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentType,
      installmentCount: paymentType === 'Taksitli' ? installmentCount : 1,
      commissionRate: Number(commissionRate) || 15,
      paymentStatus: remaining === 0 ? 'Ödendi' : (paid > 0 ? 'Kısmi Ödendi' : 'Bekliyor'),
      status: 'Aktif',
      notes: notes || 'Yeni poliçe kaydı.'
    };

    setPolicies([newPol, ...policies]);
    setIsAddModalOpen(false);

    // Reset Form
    setPolicyNo('');
    setPremium('');
    setPaidAmount('');
    setNotes('');
  };

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'Aktifler') return matchesSearch && p.status === 'Aktif';
    if (activeTab === 'Yaklaşanlar') return matchesSearch && p.status === 'Yaklaşıyor';
    if (activeTab === 'Bitenler') return matchesSearch && p.status === 'Biten';
    return matchesSearch;
  });

  const tabs = ['Tümü', 'Aktifler', 'Yaklaşanlar', 'Bitenler'];

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Poliçe Portföyü ({filteredPolicies.length})</h1>
        <button className={styles.btnCrm} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Yeni Poliçe Kes
        </button>
      </div>

      <div className={styles.card}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #edf2f7', marginBottom: '20px' }}>
          {tabs.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '10px 4px', 
                background: 'none', 
                border: 'none', 
                borderBottom: activeTab === tab ? '2px solid #3498db' : '2px solid transparent',
                color: activeTab === tab ? '#3498db' : '#718096',
                fontWeight: activeTab === tab ? 600 : 500,
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <input 
              type="text" 
              placeholder="Poliçe no, müşteri veya şirket ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <button style={{ padding: '10px 15px', backgroundColor: '#edf2f7', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500, color: '#4a5568' }}>
            <Filter size={16} /> Filtrele
          </button>
        </div>

        {/* Policies Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Poliçe No</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Eşleşen Müşteri</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Tür / Şirket</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Brüt Prim</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Tahmini Komisyon</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Bitiş Tarihi</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>İncele</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map((policy) => {
                  const estCommission = (policy.premium * policy.commissionRate) / 100;
                  return (
                    <tr 
                      key={policy.id} 
                      onClick={() => setSelectedPolicy(policy)}
                      style={{ transition: 'background-color 0.2s', cursor: 'pointer' }} 
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'} 
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem', color: '#4a5568', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="#3182ce" />
                          <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{policy.id}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 600, color: '#2d3748' }}>
                        {policy.customerName}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2d3748' }}>{policy.type}</span>
                          <span style={{ fontSize: '0.8rem', color: '#718096' }}>{policy.company}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 700, color: '#2b6cb0' }}>
                        {policy.premium.toLocaleString('tr-TR')} ₺
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 600, color: '#38a169', fontSize: '0.85rem' }}>
                        %{policy.commissionRate} ({estCommission.toLocaleString('tr-TR')} ₺)
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem', color: '#4a5568', fontWeight: 500 }}>
                        {policy.endDate}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => setSelectedPolicy(policy)}
                            style={{ padding: '8px 14px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Eye size={16} /> İncele
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomerId(policy.customerId);
                              setType(policy.type);
                              setCompany(policy.company);
                              setPremium(policy.premium.toString());
                              setCommissionRate(policy.commissionRate.toString());
                              setPaymentStatus(policy.paymentStatus);
                              setNotes(policy.notes || '');
                              setPolicies(policies.filter(p => p.id !== policy.id));
                              setIsAddModalOpen(true);
                            }}
                            style={{ padding: '8px 14px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            ✏️ Düzenle
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPolicies(policies.filter(p => p.id !== policy.id));
                            }}
                            style={{ padding: '8px 12px', backgroundColor: '#f8fafc', color: '#ef4444', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
                          >
                            🗑️ Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: '#a0aec0' }}>
                    Bu kategoride poliçe bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Details Modal */}
      {selectedPolicy && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedPolicy(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>POLİÇE KÜNYESİ</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d3748', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {selectedPolicy.id}
                  <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px', backgroundColor: selectedPolicy.status === 'Aktif' ? '#f0fff4' : '#fffaf0', color: selectedPolicy.status === 'Aktif' ? '#38a169' : '#dd6b20' }}>
                    {selectedPolicy.status}
                  </span>
                </h2>
              </div>
              <button onClick={() => setSelectedPolicy(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>
                <X size={24} />
              </button>
            </div>

            {/* Linked Customer Header Box */}
            <div style={{ backgroundColor: '#ebf8ff', padding: '16px', borderRadius: '12px', border: '1px solid #bee3f8', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#2b6cb0', fontWeight: 600 }}>POLİÇE SAHİBİ (EŞLEŞEN MÜŞTERİ)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <User size={18} color="#3182ce" /> {selectedPolicy.customerName}
                </div>
              </div>
            </div>

            {/* Policy Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Poliçe Türü</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem', marginTop: '2px' }}>{selectedPolicy.type} Sigortası</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Sigorta Şirketi</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem', marginTop: '2px' }}>{selectedPolicy.company}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> Başlangıç / Bitiş Tarihleri</div>
                <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.9rem', marginTop: '2px' }}>
                  {selectedPolicy.startDate} - {selectedPolicy.endDate}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={12} /> Tahsilat Durumu</div>
                <div style={{ fontWeight: 600, color: selectedPolicy.paymentStatus === 'Ödendi' ? '#38a169' : '#dd6b20', fontSize: '0.9rem', marginTop: '2px' }}>
                  {selectedPolicy.paymentStatus}
                </div>
              </div>
            </div>

            {/* Financial Commission Box */}
            <div style={{ backgroundColor: '#f0fff4', padding: '16px', borderRadius: '12px', border: '1px solid #c6f6d5', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#2f855a' }}>Müşterinin Ödediği Brüt Prim</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#276749' }}>
                  {selectedPolicy.premium.toLocaleString('tr-TR')} ₺
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#2f855a' }}>Net Acente Komisyonu (%{selectedPolicy.commissionRate})</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#2f855a' }}>
                  {((selectedPolicy.premium * selectedPolicy.commissionRate) / 100).toLocaleString('tr-TR')} ₺
                </div>
              </div>
            </div>

            {selectedPolicy.notes && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#718096', marginBottom: '4px' }}>Poliçe Notları & Plaka:</div>
                <div style={{ fontSize: '0.9rem', color: '#4a5568', backgroundColor: '#f7fafc', padding: '10px 12px', borderRadius: '8px' }}>
                  {selectedPolicy.notes}
                </div>
              </div>
            )}

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => alert(`${selectedPolicy.id} Tahsilat Makbuzu hazırlanıyor...`)} className={styles.btnCrm} style={{ backgroundColor: '#2b6cb0', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Makbuz Bas / Yazdır
                </button>
                <button onClick={() => alert(`${selectedPolicy.customerName} müşterisine yenileme hatırlatma SMS'i gönderildi!`)} className={styles.btnCrm} style={{ backgroundColor: '#dd6b20', fontSize: '0.85rem' }}>
                  <Send size={16} /> SMS / E-posta Gönder
                </button>
              </div>
              <button onClick={() => setSelectedPolicy(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Kapat</button>
            </div>

          </div>
        </div>
      )}

      {/* Add Policy Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#3498db" /> Yeni Poliçe Kes & Müşteriye Bağla
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPolicy}>
              {/* Relational Customer Dropdown */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Sistemden Müşteri Seçin *</label>
                <select 
                  required 
                  value={selectedCustomerId} 
                  onChange={(e) => setSelectedCustomerId(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #3498db', outline: 'none', backgroundColor: '#ebf8ff', fontWeight: 600 }}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type} - {c.identityNo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Poliçe Numarası Manuel Giriş */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Poliçe Numarası (Manuel Yazın)</label>
                <input 
                  type="text" 
                  value={policyNo} 
                  onChange={(e) => setPolicyNo(e.target.value)} 
                  placeholder="Örn: 312984920/0 veya AK-2024-912" 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600, fontFamily: 'monospace' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Poliçe Türü</label>
                  <select value={type} onChange={(e) => setType(e.target.value as Policy['type'])} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                    <option value="Trafik">Trafik Sigortası</option>
                    <option value="Kasko">Kasko Sigortası</option>
                    <option value="DASK">DASK Deprem</option>
                    <option value="Konut">Konut Sigortası</option>
                    <option value="Özel Sağlık">Özel Sağlık</option>
                    <option value="İşyeri">İşyeri Sigortası</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Sigorta Şirketi</label>
                  <select value={company} onChange={(e) => setCompany(e.target.value as Policy['company'])} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                    <option value="HDI Sigorta">HDI Sigorta</option>
                    <option value="Ak Sigorta">Ak Sigorta</option>
                    <option value="Sompo Sigorta">Sompo Sigorta</option>
                    <option value="Allianz">Allianz</option>
                    <option value="Anadolu Sigorta">Anadolu Sigorta</option>
                    <option value="Quick Sigorta">Quick Sigorta</option>
                    <option value="Emaa Sigorta">Emaa Sigorta</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Toplam Brüt Prim (₺) *</label>
                  <input type="number" required value={premium} onChange={(e) => setPremium(e.target.value)} placeholder="Örn: 14500" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 700 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Komisyon Oranı (%)</label>
                  <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="15" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              {/* Ödeme Türü ve Taksit Seçenekleri */}
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #edf2f7', marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Ödeme Şekli</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}>
                      <option value="Peşin / Tek Çekim">Peşin / Tek Çekim</option>
                      <option value="Taksitli">Taksitli Ödeme</option>
                    </select>
                  </div>

                  {paymentType === 'Taksitli' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Taksit Sayısı</label>
                      <select value={installmentCount} onChange={(e) => setInstallmentCount(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}>
                        <option value={2}>2 Taksit</option>
                        <option value={3}>3 Taksit</option>
                        <option value={4}>4 Taksit</option>
                        <option value={6}>6 Taksit</option>
                        <option value={9}>9 Taksit</option>
                        <option value={12}>12 Taksit</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Tahsil Edilen Tutar (₺)</label>
                      <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder={premium || "0"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                    </div>
                  )}
                </div>

                {paymentType === 'Taksitli' && premium && (
                  <div style={{ fontSize: '0.8rem', color: '#2b6cb0', fontWeight: 600, backgroundColor: '#ebf8ff', padding: '8px 12px', borderRadius: '6px' }}>
                    💡 Aylık Taksit: ~{(Number(premium) / installmentCount).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺ x {installmentCount} Ay
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Başlangıç Tarihi</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Bitiş Tarihi</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Poliçe / Araç Notu</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Örn: 07 ABC 123 plaka Passat aracı." rows={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>İptal</button>
                <button type="submit" className={styles.btnCrm}>Poliçeyi Kaydet ve Müşteriye İşle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
