"use client";

import { useState, useEffect } from 'react';
import { Building2, Shield, Users, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import styles from '../layout.module.css';

export default function AyarlarPage() {
  const [activeTab, setActiveTab] = useState<'acente' | 'sirketler' | 'kullanicilar'>('acente');

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
    const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setUsers(data);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsernamePrefix || !newUserPassword) return;

    const fullUsername = `${newUsernamePrefix}@elisamsigorta07.com`;

    const { data, error } = await supabase.from('app_users').insert([
      { username: fullUsername, password: newUserPassword, role: 'Kullanıcı' }
    ]).select();

    if (error) {
      alert('Kullanıcı eklenirken hata (Veritabanı tablosu henüz kurulmamış olabilir): ' + error.message);
    } else if (data) {
      setUsers([data[0], ...users]);
      setNewUsernamePrefix('');
      setNewUserPassword('');
      alert('Kullanıcı başarıyla oluşturuldu.');
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
      </div>
    </div>
  );
}
