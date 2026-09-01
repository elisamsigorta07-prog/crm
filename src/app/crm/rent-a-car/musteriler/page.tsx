"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, X, UserCheck, Eye, Globe, CreditCard } from 'lucide-react';
import { RentCustomer, initialRentCustomersData, initialBookingsData } from '@/data/rentCrmData';
import styles from '../layout.module.css';

export default function RentMusterilerPage() {
  const [customers, setCustomers] = useState<RentCustomer[]>(initialRentCustomersData);
  const [isMounted, setIsMounted] = useState(false);
  const [bookings] = useState(initialBookingsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<RentCustomer | null>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('elisam_rent_customers');
      if (saved) setCustomers(JSON.parse(saved));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('elisam_rent_customers', JSON.stringify(customers));
    }
  }, [customers, isMounted]);

  // Form state
  const [name, setName] = useState('');
  const [identityOrPassport, setIdentityOrPassport] = useState('');
  const [country, setCountry] = useState('Türkiye');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseClass, setLicenseClass] = useState('B');
  const [birthDate, setBirthDate] = useState('');

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newCustomer: RentCustomer = {
      id: `RCUST-${Math.floor(10 + Math.random() * 90)}`,
      name,
      identityOrPassport: identityOrPassport || 'TC123456789',
      country: country || 'Türkiye',
      phone,
      email: email || '-',
      licenseNo: licenseNo || 'TR-999999',
      licenseClass: licenseClass || 'B',
      birthDate: birthDate || undefined,
      totalRentals: 0,
    };

    setCustomers([newCustomer, ...customers]);
    setIsAddModalOpen(false);

    // Reset Form
    setName('');
    setIdentityOrPassport('');
    setPhone('');
    setEmail('');
    setLicenseNo('');
    setBirthDate('');
  };

  const filteredCustomers = customers.filter((c) => {
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.phone.includes(searchTerm) || 
           c.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.identityOrPassport.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getCustomerBookings = (custId: string) => {
    return bookings.filter(b => b.customerId === custId || b.customerName.toLowerCase() === selectedCustomer?.name.toLowerCase());
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Sürücü & Müşteri Portföyü ({filteredCustomers.length})</h1>
        <button className={styles.btnCrm} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Yeni Sürücü Kaydet
        </button>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <input 
              type="text" 
              placeholder="İsim, telefon, ülke veya pasaport/TC ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>
        </div>

        {/* Customer Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Müşteri Kodu</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Adı Soyadı</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Ülke / Kimlik No</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Ehliyet Sınıfı</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>İletişim</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Kiralama Adedi</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Detay</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <tr key={c.id} style={{ transition: 'background-color 0.2s', cursor: 'pointer' }} onClick={() => setSelectedCustomer(c)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.85rem', color: '#718096', fontFamily: 'monospace', fontWeight: 600 }}>{c.id}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 600, color: '#2d3748' }}>{c.name}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2b6cb0' }}>{c.country}</span>
                        <span style={{ fontSize: '0.75rem', color: '#718096', fontFamily: 'monospace' }}>{c.identityOrPassport}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568' }}>
                      {c.licenseClass} ({c.licenseNo})
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#4a5568' }}>{c.phone}</span>
                        <span style={{ fontSize: '0.75rem', color: '#718096' }}>{c.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center', fontWeight: 600, color: '#dd6b20' }}>
                      {c.totalRentals} Kiralama
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => setSelectedCustomer(c)}
                          style={{ padding: '8px 14px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Eye size={16} /> Profil
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setName(c.name);
                            setIdentityOrPassport(c.identityOrPassport);
                            setCountry(c.country);
                            setPhone(c.phone);
                            setEmail(c.email);
                            setLicenseNo(c.licenseNo);
                            setLicenseClass(c.licenseClass);
                            setCustomers(customers.filter(item => item.id !== c.id));
                            setIsAddModalOpen(true);
                          }}
                          style={{ padding: '8px 14px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          ✏️ Düzenle
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomers(customers.filter(item => item.id !== c.id));
                          }}
                          style={{ padding: '8px 12px', backgroundColor: '#f8fafc', color: '#ef4444', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '50px 16px', color: '#94a3b8' }}>
                    Henüz kayıtlı sürücü/müşteri bulunmamaktadır. <strong>"Yeni Müşteri/Sürücü Kaydı"</strong> butonuna basarak ekleyebilirsiniz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedCustomer(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>SÜRÜCÜ PROFİL KARTI ({selectedCustomer.id})</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e67e22', margin: '2px 0 0 0' }}>{selectedCustomer.name}</h2>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#fffaf0', padding: '14px', borderRadius: '10px', border: '1px solid #feebc8' }}>
                <div style={{ fontSize: '0.8rem', color: '#dd6b20' }}>Ülke & Pasaport/TC</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem', marginTop: '2px' }}>{selectedCustomer.country}</div>
                <div style={{ fontSize: '0.85rem', color: '#718096', fontFamily: 'monospace' }}>{selectedCustomer.identityOrPassport}</div>
                {selectedCustomer.birthDate && (
                  <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>🎂 D.T: {selectedCustomer.birthDate}</div>
                )}
              </div>

              <div style={{ backgroundColor: '#fffaf0', padding: '14px', borderRadius: '10px', border: '1px solid #feebc8' }}>
                <div style={{ fontSize: '0.8rem', color: '#dd6b20' }}>Ehliyet Sınıfı & No</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem', marginTop: '2px' }}>Sınıf {selectedCustomer.licenseClass}</div>
                <div style={{ fontSize: '0.85rem', color: '#718096', fontFamily: 'monospace' }}>No: {selectedCustomer.licenseNo}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#2d3748', marginBottom: '10px' }}>Geçmiş Araç Kiralamaları ({getCustomerBookings(selectedCustomer.id).length})</h3>
              {getCustomerBookings(selectedCustomer.id).length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#edf2f7' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Sözleşme No</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Kiralanan Araç</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Tarihler</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCustomerBookings(selectedCustomer.id).map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                        <td style={{ padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600, color: '#e67e22' }}>{b.id}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600 }}>{b.vehicleName}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#718096' }}>{b.pickupDate} - {b.returnDate}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.85rem', fontWeight: 700, color: '#276749', textAlign: 'right' }}>{b.totalAmount.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#a0aec0', fontSize: '0.85rem' }}>
                  Bu sürücüye tanımlı tamamlanmış kiralama yok.
                </div>
              )}
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedCustomer(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} color="#e67e22" /> Yeni Sürücü / Müşteri Kaydı
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddCustomer}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Adı Soyadı *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Hans Mueller" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Ülke</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Almanya, Türkiye..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Pasaport / TC No *</label>
                  <input type="text" required value={identityOrPassport} onChange={(e) => setIdentityOrPassport(e.target.value)} placeholder="Pasaport veya TC" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Ehliyet No</label>
                  <input type="text" value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="Ehliyet Seri No" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Ehliyet Sınıfı</label>
                  <input type="text" value={licenseClass} onChange={(e) => setLicenseClass(e.target.value)} placeholder="B, A2..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Telefon *</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5XX..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>E-Posta</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Doğum Tarihi</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>İptal</button>
                <button type="submit" className={styles.btnCrm}>Sürücüyü Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
