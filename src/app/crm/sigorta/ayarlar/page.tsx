"use client";

import { useState, useEffect } from 'react';
import { Building2, Shield, Users, Save, Plus, Trash2, Bell } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import styles from '../layout.module.css';

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

  // Telegram bot state
  const loadTelegramConfig = () => {
    if (typeof window === 'undefined') return { botToken: '', chatId: '', notifyExpiry: true, notifyInstallments: true, notifyNewPolicy: true };
    try { return JSON.parse(localStorage.getItem('elisam_telegram_config') || 'null') || { botToken: '', chatId: '', notifyExpiry: true, notifyInstallments: true, notifyNewPolicy: true }; } catch { return { botToken: '', chatId: '', notifyExpiry: true, notifyInstallments: true, notifyNewPolicy: true }; }
  };
  const [botToken, setBotToken] = useState(() => loadTelegramConfig().botToken);
  const [chatId, setChatId] = useState(() => loadTelegramConfig().chatId);
  const [notifyExpiry, setNotifyExpiry] = useState(() => loadTelegramConfig().notifyExpiry);
  const [notifyInstallments, setNotifyInstallments] = useState(() => loadTelegramConfig().notifyInstallments);
  const [notifyNewPolicy, setNotifyNewPolicy] = useState(() => loadTelegramConfig().notifyNewPolicy);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { botToken, chatId, notifyExpiry, notifyInstallments, notifyNewPolicy };
    if (typeof window !== 'undefined') localStorage.setItem('elisam_telegram_config', JSON.stringify(data));
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 2500);
  };

  const handleTestTelegram = async () => {
    if (!botToken || !chatId) {
      alert('Lütfen önce Telegram Bot Token ve Chat ID bilgilerinizi girin.');
      return;
    }
    setIsTestingTelegram(true);
    setTelegramStatus(null);
    try {
      const message = `🔔 *Elisam Sigorta CRM - Test Bildirimi*\n\n✅ Telegram Bot entegrasyonu başarıyla kuruldu!\n⏰ Zaman: ${new Date().toLocaleString('tr-TR')}\n\nPoliçe bitişleri ve taksit hatırlatmaları bu kanala otomatik olarak iletilecektir.`;
      const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: message,
          parse_mode: 'Markdown'
        })
      });
      const resData = await res.json();
      if (resData.ok) {
        setTelegramStatus('success');
      } else {
        setTelegramStatus(`error: ${resData.description || 'Bağlantı kurulamadı.'}`);
      }
    } catch (err: any) {
      setTelegramStatus(`error: ${err.message || 'Ağ hatası oluştu.'}`);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSaveAllReminders = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveReminders(e);
    handleSaveTelegram(e);
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

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [newUsernamePrefix, setNewUsernamePrefix] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  useEffect(() => {
    if (activeTab === 'kullanicilar') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    if (!isSupabaseConfigured()) {
      setUsers([
        { id: 1, username: 'admin@elisamsigorta07.com', password: '••••••••', role: 'Yönetici' }
      ]);
      return;
    }

    try {
      const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setUsers(data);
      }
    } catch (err) {
      console.warn("Supabase kullanıcıları çekilemedi:", err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsernamePrefix || !newUserPassword) return;

    const fullUsername = `${newUsernamePrefix}@elisamsigorta07.com`;

    if (!isSupabaseConfigured()) {
      setUsers([{ id: Date.now(), username: fullUsername, password: newUserPassword, role: 'Kullanıcı' }, ...users]);
      setNewUsernamePrefix('');
      setNewUserPassword('');
      alert('Kullanıcı yerel listeye eklendi. (Supabase ortam değişkenleri tanımlandığında kalıcı olarak veritabanına yazılacaktır)');
      return;
    }

    try {
      const { data, error } = await supabase.from('app_users').insert([
        { username: fullUsername, password: newUserPassword, role: 'Kullanıcı' }
      ]).select();

      if (error) {
        alert('Kullanıcı eklenirken hata: ' + error.message);
      } else if (data) {
        setUsers([data[0], ...users]);
        setNewUsernamePrefix('');
        setNewUserPassword('');
        alert('Kullanıcı başarıyla oluşturuldu.');
      }
    } catch (err) {
      alert('Veritabanına bağlanılamadı.');
    }
  };

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

        {/* Tab 3: Users */}
        {activeTab === 'kullanicilar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#2d3748' }}>CRM Yetkili Kullanıcı Listesi</h3>
            </div>

            <form onSubmit={handleAddUser} style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #edf2f7', marginBottom: '25px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4a5568', marginBottom: '15px' }}>Yeni Kullanıcı Tanımla</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#718096', marginBottom: '6px' }}>Kullanıcı Adı</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={newUsernamePrefix}
                      onChange={(e) => setNewUsernamePrefix(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                      placeholder="adsoyad"
                      style={{ padding: '10px', borderRadius: '8px 0 0 8px', border: '1px solid #e2e8f0', outline: 'none', borderRight: 'none', width: '100%' }}
                      required
                    />
                    <div style={{ padding: '10px 15px', backgroundColor: '#edf2f7', border: '1px solid #e2e8f0', borderRadius: '0 8px 8px 0', fontSize: '0.85rem', color: '#4a5568', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      @elisamsigorta07.com
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#718096', marginBottom: '6px' }}>Şifre Belirle</label>
                  <input 
                    type="text" 
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Şifre giriniz..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                    required
                  />
                </div>
                <div>
                  <button type="submit" className={styles.btnCrm} style={{ height: '42px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Kaydet
                  </button>
                </div>
              </div>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Kullanıcı Adı / E-Posta</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Şifre</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Rol / Yetki</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 600, color: '#2d3748' }}>{u.username}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem', color: '#4a5568', fontFamily: 'monospace' }}>{u.password}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7' }}>
                      <span style={{ padding: '4px 10px', backgroundColor: u.role === 'Yönetici' ? '#ebf8ff' : '#f7fafc', color: u.role === 'Yönetici' ? '#2b6cb0' : '#4a5568', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#a0aec0' }}>Kullanıcı bulunamadı veya Supabase'e henüz bağlanılmadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Hatırlatmalar & Telegram Bot */}
        {activeTab === 'hatirlatmalar' && (
          <div style={{ maxWidth: '720px' }}>
            
            {/* Form */}
            <form onSubmit={handleSaveAllReminders}>
              
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

              {/* 2. Kısım: Telegram Botu Entegrasyonu */}
              <div style={{ marginBottom: '28px', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🤖</span> Telegram Bildirim Botu Entegrasyonu
                  </h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', backgroundColor: botToken && chatId ? '#dcfce7' : '#fef3c7', color: botToken && chatId ? '#15803d' : '#b45309' }}>
                    {botToken && chatId ? '🟢 Entegre Edildi' : '🟡 Kurulum Bekliyor'}
                  </span>
                </div>

                <p style={{ fontSize: '0.86rem', color: '#15803d', lineHeight: '1.5', marginBottom: '18px' }}>
                  Poliçe bitişleri, yaklaşan ödemeler ve geciken taksitler anında Telegram grubunuza veya özel botunuza otomatik mesaj olarak gönderilir.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#166534', marginBottom: '6px' }}>Telegram Bot Token</label>
                    <input 
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="Örn: 7829418294:AAHF279182hkshf9812..."
                      style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none', fontFamily: 'monospace', fontSize: '0.9rem', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#166534', marginBottom: '6px' }}>Telegram Chat ID / Grup ID</label>
                    <input 
                      type="text"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="Örn: 591823901 veya -1009182741"
                      style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none', fontFamily: 'monospace', fontSize: '0.9rem', backgroundColor: '#ffffff' }}
                    />
                  </div>
                </div>

                {/* Bildirim Seçenekleri */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: '#166534', cursor: 'pointer' }}>
                    <input type="checkbox" checked={notifyExpiry} onChange={(e) => setNotifyExpiry(e.target.checked)} style={{ accentColor: '#16a34a' }} />
                    <strong>Poliçe Yenileme Bildirimleri</strong> (Yaklaşan poliçeleri otomatik ilet)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: '#166534', cursor: 'pointer' }}>
                    <input type="checkbox" checked={notifyInstallments} onChange={(e) => setNotifyInstallments(e.target.checked)} style={{ accentColor: '#16a34a' }} />
                    <strong>Taksit & Borç Bildirimleri</strong> (Vadesi gelen/geçen taksitleri ilet)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: '#166534', cursor: 'pointer' }}>
                    <input type="checkbox" checked={notifyNewPolicy} onChange={(e) => setNotifyNewPolicy(e.target.checked)} style={{ accentColor: '#16a34a' }} />
                    <strong>Yeni Poliçe Kesim Bildirimi</strong> (Sistemde yeni poliçe oluşturulduğunda bildir)
                  </label>
                </div>

                {/* Telegram Test Butonu */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    onClick={handleTestTelegram} 
                    disabled={isTestingTelegram}
                    style={{ 
                      padding: '10px 18px', 
                      backgroundColor: '#15803d', 
                      color: '#ffffff', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontWeight: 700, 
                      fontSize: '0.88rem', 
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isTestingTelegram ? '⏳ Test Gönderiliyor...' : '📲 Telegram Bağlantısını Test Et'}
                  </button>

                  {telegramStatus === 'success' && (
                    <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.88rem' }}>
                      ✅ Harika! Test bildirimi Telegram&apos;a başarıyla ulaştı.
                    </span>
                  )}
                  {telegramStatus && telegramStatus.startsWith('error') && (
                    <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                      ❌ Hata: {telegramStatus.replace('error: ', '')}
                    </span>
                  )}
                </div>

                {/* Bot Kurulum Rehberi */}
                <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#334155', display: 'block', marginBottom: '6px' }}>💡 3 Adımda Bot Kurulumu:</strong>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6' }}>
                    <li>Telegram&apos;da <code>@BotFather</code> hesabına gidin, <code>/newbot</code> yazarak bot oluşturup <strong>Token</strong> alın.</li>
                    <li>Botunuzu grubunuza veya özel sohbetinize ekleyip bir mesaj yazın. <code>@userinfobot</code> ile <strong>Chat ID</strong> nizi öğrenin.</li>
                    <li>Yukarıdaki kutulara yapıştırıp &ldquo;Test Et&rdquo; butonuna basın.</li>
                  </ol>
                </div>
              </div>

              {/* Kaydet Butonu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button type="submit" className={styles.btnCrm} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.95rem' }}>
                  <Save size={18} /> Tüm Hatırlatma & Telegram Ayarlarını Kaydet
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
