"use client";

import { useState } from 'react';
import { Building2, Shield, Users, Save, Plus, Trash2, Bell } from 'lucide-react';
import styles from '../layout.module.css';
import TelegramBotSettings from '@/components/common/TelegramBotSettings';
import CrmUsersSettings from '@/components/common/CrmUsersSettings';

export default function AyarlarPage() {
  const [activeTab, setActiveTab] = useState<'acente' | 'sirketler' | 'kullanicilar' | 'hatirlatmalar'>('acente');

  // Reminder settings state (localStorage backed)
  const loadReminders = () => {
    if (typeof window === 'undefined') return { r1: true, r1Days: 30, r2: true, r2Days: 7, r3: true, r3Days: 1 };
    try { return JSON.parse(localStorage.getItem('elisam_reminders') || 'null') || { r1: true, r1Days: 30, r2: true, r2Days: 7, r3: true, r3Days: 1 }; } catch { return { r1: true, r1Days: 30, r2: true, r2Days: 7, r3: true, r3Days: 1 }; }
  };
  const [r1, setR1] = useState(() => loadReminders().r1);
  const [r1Days, setR1Days] = useState(() => loadReminders().r1Days);
  const [r2, setR2] = useState(() => loadReminders().r2);
  const [r2Days, setR2Days] = useState(() => loadReminders().r2Days);
  const [r3, setR3] = useState(() => loadReminders().r3);
  const [r3Days, setR3Days] = useState(() => loadReminders().r3Days);
  const [reminderSaved, setReminderSaved] = useState(false);

  const handleSaveReminders = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { r1, r1Days, r2, r2Days, r3, r3Days };
    if (typeof window !== 'undefined') localStorage.setItem('elisam_reminders', JSON.stringify(data));
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 2500);
  };

  // Agency info state
  const [agencyName, setAgencyName] = useState('Elisam Sigorta Aracılık Hizmetleri');
  const [taxNo, setTaxNo] = useState('1234567890');
  const [phone, setPhone] = useState('0551 438 77 71');
  const [email, setEmail] = useState('info@elisamsigorta.com');
  const [address, setAddress] = useState('Alanya, Antalya');

  // Companies state
  const [companies, setCompanies] = useState<any[]>([]);
  const [newCompName, setNewCompName] = useState('');

  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Acente bilgileri başarıyla güncellendi!');
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName) return;
    setCompanies([...companies, { id: Date.now(), name: newCompName, code: newCompName.substring(0, 3).toUpperCase(), status: 'Aktif' }]);
    setNewCompName('');
  };

  const handleDeleteCompany = (id: number) => {
    setCompanies(companies.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>CRM Sistem Ayarları</h1>
      </div>

      <div className={styles.card}>
        {/* Settings Tabs */}
        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #edf2f7', marginBottom: '25px' }}>
          <button 
            onClick={() => setActiveTab('acente')}
            style={{ 
              padding: '12px 4px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'acente' ? '2px solid #3498db' : '2px solid transparent',
              color: activeTab === 'acente' ? '#3498db' : '#718096',
              fontWeight: activeTab === 'acente' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Building2 size={18} /> Acente Profil Bilgileri
          </button>

          <button 
            onClick={() => setActiveTab('sirketler')}
            style={{ 
              padding: '12px 4px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'sirketler' ? '2px solid #3498db' : '2px solid transparent',
              color: activeTab === 'sirketler' ? '#3498db' : '#718096',
              fontWeight: activeTab === 'sirketler' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Shield size={18} /> Anlaşmalı Sigorta Şirketleri
          </button>

          <button 
            onClick={() => setActiveTab('kullanicilar')}
            style={{ 
              padding: '12px 4px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'kullanicilar' ? '2px solid #3498db' : '2px solid transparent',
              color: activeTab === 'kullanicilar' ? '#3498db' : '#718096',
              fontWeight: activeTab === 'kullanicilar' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={18} /> Kullanıcı & Personel Yönetimi
          </button>

          <button 
            onClick={() => setActiveTab('hatirlatmalar')}
            style={{ 
              padding: '12px 4px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'hatirlatmalar' ? '2px solid #3498db' : '2px solid transparent',
              color: activeTab === 'hatirlatmalar' ? '#3498db' : '#718096',
              fontWeight: activeTab === 'hatirlatmalar' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Bell size={18} /> Hatırlatma Ayarları
          </button>
        </div>

        {/* Tab 1: Agency Profile */}
        {activeTab === 'acente' && (
          <form onSubmit={handleSaveAgency} style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Acente Resmi Ünvanı</label>
              <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Vergi Dairesi / Vergi Numarası</label>
              <input type="text" value={taxNo} onChange={(e) => setTaxNo(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Telefon</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>E-Posta</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Acente Açık Adresi</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}></textarea>
            </div>

            <button type="submit" className={styles.btnCrm} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Değişiklikleri Kaydet
            </button>
          </form>
        )}

        {/* Tab 2: Insurance Companies */}
        {activeTab === 'sirketler' && (
          <div>
            <form onSubmit={handleAddCompany} style={{ display: 'flex', gap: '10px', marginBottom: '25px', maxWidth: '500px' }}>
              <input 
                type="text" 
                placeholder="Yeni Sigorta Şirketi Adı (Örn: Mapfre)" 
                value={newCompName}
                onChange={(e) => setNewCompName(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
              <button type="submit" className={styles.btnCrm}>
                <Plus size={18} /> Şirket Ekle
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
              {companies.map((c) => (
                <div key={c.id} style={{ border: '1px solid #edf2f7', borderRadius: '10px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#2d3748' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>Kod: {c.code}</div>
                  </div>
                  <button onClick={() => handleDeleteCompany(c.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'kullanicilar' && <CrmUsersSettings />}

        {/* Tab 4: Hatırlatmalar & Telegram Bot */}
        {activeTab === 'hatirlatmalar' && (
          <div style={{ maxWidth: '720px' }}>
            
            {/* Form */}
            <form onSubmit={handleSaveReminders}>
              
              {/* 1. Kısım: Uygulama İçi Hatırlatma Günleri */}
              <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #edf2f7' }}>
                <div style={{ marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2d3748', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={20} color="#3498db" /> 1. Poliçe Bitiş Hatırlatma Sıklığı
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#718096' }}>
                    Poliçesi sona ermek üzere olan müşteriler, belirlediğiniz süreler kadar önce sistemde ve bildirimlerde öne çıkarılır.
                  </p>
                </div>

                {/* Reminder Row Helper */}
                {[
                  { enabled: r1, setEnabled: setR1, days: r1Days, setDays: setR1Days, label: '1. Hatırlatma' },
                  { enabled: r2, setEnabled: setR2, days: r2Days, setDays: setR2Days, label: '2. Hatırlatma' },
                  { enabled: r3, setEnabled: setR3, days: r3Days, setDays: setR3Days, label: '3. Hatırlatma' },
                ].map(({ enabled, setEnabled, days, setDays, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', padding: '14px 16px', backgroundColor: enabled ? '#f0f9ff' : '#f8fafc', borderRadius: '10px', border: `1px solid ${enabled ? '#bee3f8' : '#e2e8f0'}` }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '130px' }}>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#3498db', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.9rem' }}>{label}</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, opacity: enabled ? 1 : 0.4, pointerEvents: enabled ? 'auto' : 'none' }}>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        style={{ width: '75px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center' }}
                      />
                      <span style={{ color: '#4a5568', fontSize: '0.88rem' }}>gün önce bildir</span>
                      <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                        {days === 1 ? '(bitiş günü)' : days <= 7 ? `(${days} gün kala)` : days <= 31 ? `(${Math.round(days/7)} hafta kala)` : `(${Math.round(days/30)} ay kala)`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <TelegramBotSettings />

              {/* Kaydet Butonu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button type="submit" className={styles.btnCrm} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.95rem' }}>
                  <Save size={18} /> Hatırlatma Ayarlarını Kaydet
                </button>
                {reminderSaved && (
                  <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.92rem' }}>✓ Ayarlar Başarıyla Kaydedildi!</span>
                )}
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
