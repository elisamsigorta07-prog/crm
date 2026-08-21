"use client";

import { useState } from 'react';
import { Search, Plus, Filter, FileCheck, X } from 'lucide-react';
import styles from '../layout.module.css';

interface Quote {
  id: string;
  customer: string;
  type: string;
  offeredPrice: string;
  date: string;
  status: 'Beklemede' | 'Onaylandı' | 'Reddedildi';
}

const initialQuotes: Quote[] = [];

export default function TekliflerPage() {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tümü');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [customer, setCustomer] = useState('');
  const [type, setType] = useState('Kasko Sigortası');
  const [offeredPrice, setOfferedPrice] = useState('');

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !offeredPrice) return;

    const newQuote: Quote = {
      id: `TEK-${Math.floor(200 + Math.random() * 800)}`,
      customer,
      type,
      offeredPrice: `${Number(offeredPrice).toLocaleString('tr-TR')} ₺`,
      date: 'Bugün',
      status: 'Beklemede',
    };

    setQuotes([newQuote, ...quotes]);
    setIsModalOpen(false);

    // Reset
    setCustomer('');
    setType('Kasko Sigortası');
    setOfferedPrice('');
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch = q.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tümü' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Fiyat Teklifleri ({filteredQuotes.length})</h1>
        <button className={styles.btnCrm} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Yeni Teklif Oluştur
        </button>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <input 
              type="text" 
              placeholder="Teklif no, müşteri veya sigorta türü ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Tümü', 'Beklemede', 'Onaylandı', 'Reddedildi'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: statusFilter === s ? '#031924' : '#edf2f7',
                  color: statusFilter === s ? 'white' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Quotes Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Teklif Kod</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Müşteri</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Ürün / Tür</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Teklif Tutarı</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Tarih</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Durum</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Aksiyon & Onay</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((q) => (
                  <tr key={q.id} style={{ transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem', color: '#3182ce', fontWeight: 600, fontFamily: 'monospace' }}>
                      {q.id}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 600, color: '#2d3748' }}>
                      {q.customer}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem', color: '#4a5568' }}>
                      {q.type}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 600, color: '#2b6cb0' }}>
                      {q.offeredPrice}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.85rem', color: '#718096' }}>
                      {q.date}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '6px 12px', 
                        backgroundColor: q.status === 'Onaylandı' ? '#dcfce7' : q.status === 'Beklemede' ? '#fef3c7' : '#fee2e2', 
                        color: q.status === 'Onaylandı' ? '#15803d' : q.status === 'Beklemede' ? '#b45309' : '#b91c1c', 
                        borderRadius: '20px', 
                        fontSize: '0.82rem', 
                        fontWeight: 700 
                      }}>
                        {q.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {q.status === 'Beklemede' && (
                          <>
                            <button 
                              onClick={() => setQuotes(quotes.map(item => item.id === q.id ? { ...item, status: 'Onaylandı' } : item))}
                              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #86efac', background: '#dcfce7', color: '#15803d', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                            >
                              ✅ Onayla
                            </button>
                            <button 
                              onClick={() => setQuotes(quotes.map(item => item.id === q.id ? { ...item, status: 'Reddedildi' } : item))}
                              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #fca5a5', background: '#fee2e2', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                            >
                              ❌ Reddet
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            setCustomer(q.customer);
                            setType(q.type);
                            setOfferedPrice(q.offeredPrice.replace(/[^0-9]/g, ''));
                            setQuotes(quotes.filter(item => item.id !== q.id));
                            setIsModalOpen(true);
                          }}
                          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}
                        >
                          ✏️ Düzenle
                        </button>
                        <button 
                          onClick={() => setQuotes(quotes.filter(item => item.id !== q.id))}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: '#a0aec0' }}>
                    Henüz oluşturulmuş fiyat teklifi bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Quote Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} color="#3498db" /> Yeni Fiyat Teklifi Hazırla
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddQuote}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Müşteri Adı Soyadı / Firma *</label>
                <input type="text" required value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Örn: Hasan Yılmaz" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Sigorta Ürünü</label>
                <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                  <option value="Kasko Sigortası">Kasko Sigortası</option>
                  <option value="Trafik Sigortası">Trafik Sigortası</option>
                  <option value="DASK Deprem">DASK Deprem</option>
                  <option value="Konut Paket">Konut Paket</option>
                  <option value="Tamamlayıcı Sağlık">Tamamlayıcı Sağlık</option>
                  <option value="İşyeri Paket">İşyeri Paket</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Sunulan Teklif Fiyatı (₺) *</label>
                <input type="number" required value={offeredPrice} onChange={(e) => setOfferedPrice(e.target.value)} placeholder="Örn: 9500" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>İptal</button>
                <button type="submit" className={styles.btnCrm}>Teklifi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
