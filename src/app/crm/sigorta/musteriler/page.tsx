"use client";

import { useState } from 'react';
import { Search, Plus, Phone, Mail, X, UserCheck, Eye, ShieldCheck, MapPin, FileSpreadsheet, MessageCircle, Send } from 'lucide-react';
import { Customer, Policy, initialCustomersData, initialPoliciesData } from '@/data/crmData';
import styles from '../layout.module.css';

export default function MusterilerPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomersData);
  const [policies] = useState<Policy[]>(initialPoliciesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tümü');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'Bireysel' | 'Kurumsal'>('Bireysel');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [identityNo, setIdentityNo] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // Extended fields
  const [insuranceType, setInsuranceType] = useState('Kasko');
  const [policyStartDate, setPolicyStartDate] = useState('');
  const [policyEndDate, setPolicyEndDate] = useState('');
  const [plate, setPlate] = useState('');
  const [documentSerial, setDocumentSerial] = useState('');
  const [vehicleUsage, setVehicleUsage] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleModelYear, setVehicleModelYear] = useState('');
  const [vehicleRegistrationDate, setVehicleRegistrationDate] = useState('');
  const [vehicleValue, setVehicleValue] = useState('');

  // Modal UI state
  const [addMode, setAddMode] = useState<'Manuel' | 'Otomatik'>('Manuel');
  const [autoText, setAutoText] = useState('');

  // Dynamic note adding state
  const [newNoteInput, setNewNoteInput] = useState('');

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setType('Bireysel');
    setPhone('');
    setEmail('');
    setIdentityNo('');
    setAddress('');
    setBirthDate('');
    setNotes('');
    setInsuranceType('Kasko');
    setPolicyStartDate('');
    setPolicyEndDate('');
    setPlate('');
    setDocumentSerial('');
    setVehicleUsage('');
    setVehicleBrand('');
    setVehicleType('');
    setVehicleModelYear('');
    setVehicleRegistrationDate('');
    setVehicleValue('');
    setAddMode('Manuel');
    setAutoText('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setType(cust.type);
    setPhone(cust.phone);
    setEmail(cust.email === '-' ? '' : cust.email);
    setIdentityNo(cust.identityNo === '-' ? '' : cust.identityNo);
    setAddress(cust.address);
    setBirthDate(cust.birthDate || '');
    setNotes(cust.notes || '');
    setInsuranceType(cust.insuranceType || 'Kasko');
    setPolicyStartDate(cust.policyStartDate || '');
    setPolicyEndDate(cust.policyEndDate || '');
    setPlate(cust.plate || '');
    setDocumentSerial(cust.documentSerial || '');
    setVehicleUsage(cust.vehicleUsage || '');
    setVehicleBrand(cust.vehicleBrand || '');
    setVehicleType(cust.vehicleType || '');
    setVehicleModelYear(cust.vehicleModelYear || '');
    setVehicleRegistrationDate(cust.vehicleRegistrationDate || '');
    setVehicleValue(cust.vehicleValue || '');
    setAddMode('Manuel');
    setIsAddModalOpen(true);
  };

  const handleAutoPaste = (text: string) => {
    setAutoText(text);
    
    // Regex parsing
    const extract = (regex: RegExp) => {
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    const parsedName = extract(/Ad \/ Soy Ad:\s*(.*)/i);
    if (parsedName) setName(parsedName);

    const parsedTckn = extract(/Tckn\/Vergi No:\s*(.*)/i);
    if (parsedTckn) setIdentityNo(parsedTckn);

    const dates = extract(/Başlangıç-Bitiş Tarihi:\s*(.*)/i);
    if (dates) {
      const parts = dates.split('/');
      if (parts.length === 2) {
        setPolicyStartDate(parts[0].trim());
        setPolicyEndDate(parts[1].trim());
      }
    }

    const parsedPlate = extract(/Plaka:\s*(.*)/i);
    if (parsedPlate) setPlate(parsedPlate);

    const parsedBelge = extract(/Belge Seri:\s*(.*)/i);
    if (parsedBelge) setDocumentSerial(parsedBelge);

    const parsedUsage = extract(/Araç Kullanım Tarzı:\s*(.*)/i);
    if (parsedUsage) setVehicleUsage(parsedUsage);

    const parsedBrand = extract(/Marka:\s*(.*)/i);
    if (parsedBrand) setVehicleBrand(parsedBrand);

    const parsedTip = extract(/Tip:\s*(.*)/i);
    if (parsedTip) setVehicleType(parsedTip);

    const parsedYear = extract(/Model Yılı:\s*(.*)/i);
    if (parsedYear) setVehicleModelYear(parsedYear);

    const parsedReg = extract(/Tescil Tarihi:\s*(.*)/i);
    if (parsedReg) setVehicleRegistrationDate(parsedReg);

    const parsedVal = extract(/Araç Kasko Değeri:\s*(.*)/i);
    if (parsedVal) setVehicleValue(parsedVal);
    
    // set phone placeholder if auto parsed
    if (!phone) setPhone('05-- --- -- --'); 
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? {
        ...c,
        name,
        type,
        phone,
        email: email || '-',
        identityNo: identityNo || '-',
        address: address || 'Alanya / Antalya',
        birthDate: birthDate || c.birthDate,
        notes: notes || c.notes,
        insuranceType, policyStartDate, policyEndDate, plate, documentSerial, vehicleUsage, vehicleBrand, vehicleType, vehicleModelYear, vehicleRegistrationDate, vehicleValue
      } : c));
    } else {
      const newCustomer: Customer = {
        id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        name,
        type,
        phone,
        email: email || '-',
        identityNo: identityNo || '-',
        address: address || 'Alanya / Antalya',
        birthDate: birthDate || undefined,
        notes: notes || 'Yeni müşteri kaydı.',
        createdAt: new Date().toLocaleDateString('tr-TR'),
        insuranceType, policyStartDate, policyEndDate, plate, documentSerial, vehicleUsage, vehicleBrand, vehicleType, vehicleModelYear, vehicleRegistrationDate, vehicleValue
      };
      setCustomers([newCustomer, ...customers]);
    }

    setIsAddModalOpen(false);
    setEditingCustomer(null);
  };

  const handleAddDynamicNote = () => {
    if (!newNoteInput.trim() || !selectedCustomer) return;
    const updatedNotes = selectedCustomer.notes 
      ? `${selectedCustomer.notes} \n• [${new Date().toLocaleDateString('tr-TR')}]: ${newNoteInput}`
      : `• [${new Date().toLocaleDateString('tr-TR')}]: ${newNoteInput}`;

    const updatedCustomer = { ...selectedCustomer, notes: updatedNotes };
    setSelectedCustomer(updatedCustomer);
    setCustomers(customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c));
    setNewNoteInput('');
  };

  const openWhatsApp = (customerPhone: string, customerName: string) => {
    const formattedPhone = customerPhone.replace(/\s+/g, '').replace('^0', '90');
    const msg = `Merhaba Sayın ${customerName}, Elisam Sigorta acentemizden sizinle iletişime geçiyoruz. Poliçeleriniz ve teklifleriniz hakkında yardımcı olabilir miyiz?`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          c.identityNo.includes(searchTerm);
    const matchesType = typeFilter === 'Tümü' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getCustomerPolicies = (custId: string) => {
    return policies.filter(p => p.customerId === custId || p.customerName.toLowerCase() === selectedCustomer?.name.toLowerCase());
  };

  const getCustomerTotalSpend = (custId: string) => {
    const custPolicies = getCustomerPolicies(custId);
    return custPolicies.reduce((sum, p) => sum + p.premium, 0);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Müşteri Portföyü ({filteredCustomers.length})</h1>
        <button className={styles.btnCrm} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Yeni Müşteri Ekle
        </button>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <input 
              type="text" 
              placeholder="İsim, telefon veya TC/VKN ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['Tümü', 'Bireysel', 'Kurumsal'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: typeFilter === t ? '#031924' : '#edf2f7',
                  color: typeFilter === t ? 'white' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Müşteri Kodu</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Müşteri Adı/Ünvanı</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>TC / VKN</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Tür</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>İletişim</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Poliçe Sayısı</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Detay & İletişim</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                  const custPoliciesCount = policies.filter(p => p.customerId === customer.id || p.customerName.toLowerCase() === customer.name.toLowerCase()).length;
                  return (
                    <tr 
                      key={customer.id} 
                      onClick={() => setSelectedCustomer(customer)}
                      style={{ transition: 'background-color 0.2s', cursor: 'pointer' }} 
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'} 
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.85rem', color: '#718096', fontFamily: 'monospace', fontWeight: 600 }}>
                        {customer.id}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 600, color: '#2d3748' }}>
                        {customer.name}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.85rem', color: '#718096', fontFamily: 'monospace' }}>
                        {customer.identityNo}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7' }}>
                        <span style={{ padding: '4px 10px', backgroundColor: customer.type === 'Kurumsal' ? '#ebf4ff' : '#f0fff4', color: customer.type === 'Kurumsal' ? '#3182ce' : '#38a169', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {customer.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#4a5568' }}><Phone size={12} /> {customer.phone}</span>
                          {customer.email !== '-' && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#718096' }}><Mail size={12} /> {customer.email}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center', fontWeight: 600, color: '#3182ce' }}>
                        {custPoliciesCount} Poliçe
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => setSelectedCustomer(customer)}
                            style={{ padding: '8px 14px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Eye size={16} /> İncele
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(customer);
                            }}
                            style={{ padding: '8px 14px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            ✏️ Düzenle
                          </button>

                          <button 
                            onClick={(e) => { e.stopPropagation(); openWhatsApp(customer.phone, customer.name); }} 
                            title="WhatsApp Mesaj Gönder"
                            style={{ padding: '8px 12px', backgroundColor: '#25d366', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <MessageCircle size={16} /> WhatsApp
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomers(customers.filter(c => c.id !== customer.id));
                            }}
                            title="Müşteriyi Sil"
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
                    Aranan kriterlere uygun müşteri bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedCustomer(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>MÜŞTERİ PROFİLİ ({selectedCustomer.id})</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d3748', margin: '4px 0 0 0' }}>{selectedCustomer.name}</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => openWhatsApp(selectedCustomer.phone, selectedCustomer.name)} style={{ backgroundColor: '#25d366', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageCircle size={16} /> WhatsApp'tan Yaz
                </button>
                <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Profile Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>TC Kimlik / VKN</div>
                <div style={{ fontWeight: 600, color: '#2d3748', fontFamily: 'monospace' }}>{selectedCustomer.identityNo}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>Telefon & E-Posta</div>
                <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.9rem' }}>{selectedCustomer.phone}</div>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>{selectedCustomer.email}</div>
                {selectedCustomer.birthDate && (
                  <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>🎂 {selectedCustomer.birthDate}</div>
                )}
              </div>
              <div style={{ backgroundColor: '#ebf8ff', padding: '15px', borderRadius: '10px', border: '1px solid #bee3f8' }}>
                <div style={{ fontSize: '0.8rem', color: '#2b6cb0', marginBottom: '4px' }}>Toplam Prim Harcaması</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2b6cb0' }}>
                  {getCustomerTotalSpend(selectedCustomer.id).toLocaleString('tr-TR')} ₺
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#718096', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> Adres Bilgisi:
              </div>
              <div style={{ fontSize: '0.95rem', color: '#2d3748', backgroundColor: '#f7fafc', padding: '10px 12px', borderRadius: '8px' }}>
                {selectedCustomer.address}
              </div>
            </div>

            {/* Insurance & Vehicle Initial Details */}
            {(selectedCustomer.insuranceType || selectedCustomer.plate) && (
              <div style={{ marginBottom: '20px', backgroundColor: '#e6fffa', padding: '15px', borderRadius: '10px', border: '1px solid #b2f5ea' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#285e61', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} /> Kayıt Esnasında Alınan Sigorta & Araç Bilgileri (Özet)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {selectedCustomer.insuranceType && <div><span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Sigorta Türü:</span> <span style={{ fontWeight: 600, color: '#234e52' }}>{selectedCustomer.insuranceType}</span></div>}
                  {selectedCustomer.policyStartDate && <div><span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Başlangıç:</span> <span style={{ fontWeight: 600, color: '#234e52' }}>{selectedCustomer.policyStartDate}</span></div>}
                  {selectedCustomer.policyEndDate && <div><span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Bitiş:</span> <span style={{ fontWeight: 600, color: '#234e52' }}>{selectedCustomer.policyEndDate}</span></div>}
                  {selectedCustomer.plate && <div><span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Plaka:</span> <span style={{ fontWeight: 600, color: '#234e52' }}>{selectedCustomer.plate}</span></div>}
                  {selectedCustomer.documentSerial && <div><span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Belge Seri:</span> <span style={{ fontWeight: 600, color: '#234e52' }}>{selectedCustomer.documentSerial}</span></div>}
                  {selectedCustomer.vehicleBrand && <div><span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Araç:</span> <span style={{ fontWeight: 600, color: '#234e52' }}>{selectedCustomer.vehicleBrand} {selectedCustomer.vehicleType}</span></div>}
                  {selectedCustomer.vehicleModelYear && <div><span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Model Yılı:</span> <span style={{ fontWeight: 600, color: '#234e52' }}>{selectedCustomer.vehicleModelYear}</span></div>}
                  {selectedCustomer.vehicleValue && <div><span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Kasko Değeri:</span> <span style={{ fontWeight: 600, color: '#234e52' }}>{selectedCustomer.vehicleValue} ₺</span></div>}
                </div>
              </div>
            )}

            {/* Dynamic Notes Section */}
            <div style={{ marginBottom: '25px', backgroundColor: '#fffaf0', padding: '15px', borderRadius: '10px', border: '1px solid #feebc8' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dd6b20', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileSpreadsheet size={16} /> Müşteri Özel Notları & Görüşme Geçmişi:
              </div>
              <div style={{ fontSize: '0.9rem', color: '#4a5568', whiteSpace: 'pre-line', marginBottom: '12px' }}>
                {selectedCustomer.notes || 'Henüz eklenmiş not yok.'}
              </div>

              {/* Add Note Input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Yeni görüşme notu veya hatırlatma yazın..." 
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem', outline: 'none' }}
                />
                <button onClick={handleAddDynamicNote} style={{ backgroundColor: '#dd6b20', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Send size={14} /> Ekle
                </button>
              </div>
            </div>

            {/* Linked Policies List */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2d3748', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#3498db" /> Müşteriye Ait Bağlı Poliçeler ({getCustomerPolicies(selectedCustomer.id).length})
              </h3>

              {getCustomerPolicies(selectedCustomer.id).length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#edf2f7' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Poliçe No</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Tür</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Şirket</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Bitiş Tarihi</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Brüt Prim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCustomerPolicies(selectedCustomer.id).map(pol => (
                      <tr key={pol.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                        <td style={{ padding: '10px 12px', fontSize: '0.85rem', fontWeight: 600, color: '#3182ce' }}>{pol.id}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.85rem', fontWeight: 600 }}>{pol.type}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#4a5568' }}>{pol.company}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#718096' }}>{pol.endDate}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.85rem', fontWeight: 700, color: '#38a169', textAlign: 'right' }}>{pol.premium.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#a0aec0', fontSize: '0.9rem' }}>
                  Bu müşteriye henüz tanımlanmış aktif bir poliçe yok.
                </div>
              )}
            </div>

            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedCustomer(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Kapat</button>
            </div>

          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} color="#3498db" /> {editingCustomer ? 'Müşteri Güncelle' : 'Yeni Müşteri Kaydı'}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>
                <X size={20} />
              </button>
            </div>

            {!editingCustomer && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #edf2f7' }}>
                <button 
                  onClick={() => setAddMode('Manuel')}
                  style={{ padding: '10px', background: 'none', border: 'none', borderBottom: addMode === 'Manuel' ? '2px solid #3498db' : '2px solid transparent', color: addMode === 'Manuel' ? '#3498db' : '#718096', fontWeight: 600, cursor: 'pointer' }}
                >
                  Manuel Giriş
                </button>
                <button 
                  onClick={() => setAddMode('Otomatik')}
                  style={{ padding: '10px', background: 'none', border: 'none', borderBottom: addMode === 'Otomatik' ? '2px solid #3498db' : '2px solid transparent', color: addMode === 'Otomatik' ? '#3498db' : '#718096', fontWeight: 600, cursor: 'pointer' }}
                >
                  Otomatik Doldur (Metin Yapıştır)
                </button>
              </div>
            )}

            {addMode === 'Otomatik' && !editingCustomer && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Kopyalanan Metni Buraya Yapıştırın</label>
                <textarea 
                  value={autoText}
                  onChange={(e) => handleAutoPaste(e.target.value)}
                  placeholder="Teklif Bilgileri... Ad / Soy Ad: ... Plaka: ..."
                  rows={6}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed #3498db', outline: 'none', backgroundColor: '#f0f9ff' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '6px' }}>Metni yapıştırdığınızda aşağıdaki alanlar otomatik dolacaktır. Eksik kısımları manuel tamamlayabilirsiniz.</div>
              </div>
            )}

            <form onSubmit={handleSaveCustomer}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Müşteri Türü</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: type === 'Bireysel' ? '#ebf8ff' : 'white' }}>
                    <input type="radio" name="custType" checked={type === 'Bireysel'} onChange={() => setType('Bireysel')} /> Bireysel
                  </label>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: type === 'Kurumsal' ? '#ebf8ff' : 'white' }}>
                    <input type="radio" name="custType" checked={type === 'Kurumsal'} onChange={() => setType('Kurumsal')} /> Kurumsal
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Ad Soyad / Firma Ünvanı *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Mehmet Öz" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>TC Kimlik No / Vergi No</label>
                <input type="text" value={identityNo} onChange={(e) => setIdentityNo(e.target.value)} placeholder="11 haneli TC veya VKN" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Doğum Tarihi</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Telefon Numarası *</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>E-Posta Adresi</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@domain.com" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              {/* Sigorta ve Araç Bilgileri Section */}
              <div style={{ marginTop: '20px', marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2d3748', marginBottom: '15px' }}>Sigorta ve Araç Bilgileri</h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Sigorta Türü</label>
                  <select value={insuranceType} onChange={(e) => setInsuranceType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                    <option value="Kasko">Kasko</option>
                    <option value="Trafik">Trafik</option>
                    <option value="Özel Sağlık">Özel Sağlık</option>
                    <option value="DASK">DASK</option>
                    <option value="Konut">Konut</option>
                    <option value="İşyeri">İşyeri</option>
                  </select>
                </div>

                {(insuranceType === 'Kasko' || insuranceType === 'Trafik') && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Plaka</label>
                        <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="38AHD233" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Belge Seri</label>
                        <input type="text" value={documentSerial} onChange={(e) => setDocumentSerial(e.target.value)} placeholder="HI 378069" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Marka</label>
                        <input type="text" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder="VOLKSWAGEN" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Model Yılı</label>
                        <input type="text" value={vehicleModelYear} onChange={(e) => setVehicleModelYear(e.target.value)} placeholder="2022" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Araç Tip</label>
                      <input type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="TRANSPORTER..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Araç Kasko Değeri</label>
                        <input type="text" value={vehicleValue} onChange={(e) => setVehicleValue(e.target.value)} placeholder="1639396" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Kullanım Tarzı</label>
                        <input type="text" value={vehicleUsage} onChange={(e) => setVehicleUsage(e.target.value)} placeholder="KAMYONET" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Poliçe Başlangıç Tarihi</label>
                    <input type="text" value={policyStartDate} onChange={(e) => setPolicyStartDate(e.target.value)} placeholder="01.08.2026" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Poliçe Bitiş Tarihi</label>
                    <input type="text" value={policyEndDate} onChange={(e) => setPolicyEndDate(e.target.value)} placeholder="01.08.2027" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Açık Adres / Müşteri Özel Notu</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Örn: Ruhsat takibi yapılacak, Adres: Mahalle..." rows={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>İptal</button>
                <button type="submit" className={styles.btnCrm}>Kaydet ve Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
