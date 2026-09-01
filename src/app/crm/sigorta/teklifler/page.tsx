"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, FileCheck, X, ClipboardPaste, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import styles from '../layout.module.css';

interface Quote {
  id: string;
  customer: string;
  tc: string;
  phone: string;
  birthDate: string;
  plate: string;
  type: string;
  offeredPrice: string;
  date: string;
  status: 'Beklemede' | 'Onaylandı' | 'Reddedildi';
}

const initialQuotes: Quote[] = [];

export default function TekliflerPage() {
  const loadStoredQuotes = (): Quote[] => {
    if (typeof window === 'undefined') return initialQuotes;
    try {
      const saved = localStorage.getItem('elisam_quotes');
      return saved ? JSON.parse(saved) : initialQuotes;
    } catch {
      return initialQuotes;
    }
  };

  const [quotes, setQuotes] = useState<Quote[]>(loadStoredQuotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tümü');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'Manuel' | 'Otomatik'>('Manuel');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('elisam_quotes', JSON.stringify(quotes));
    }
  }, [quotes]);

  const [customer, setCustomer] = useState('');
  const [tc, setTc] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState('Kasko Sigortası');
  const [customType, setCustomType] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [autoText, setAutoText] = useState('');

  const resetForm = () => {
    setCustomer(''); setTc(''); setPhone(''); setBirthDate('');
    setPlate(''); setType('Kasko Sigortası'); setCustomType(''); setOfferedPrice('');
    setAutoText(''); setAddMode('Manuel');
  };

  const handleAutoPaste = (text: string) => {
    setAutoText(text);
    const extract = (regex: RegExp) => {
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };
    const parsedName = extract(/Ad \/ Soy Ad:\s*(.*)/i);
    if (parsedName) setCustomer(parsedName);
    const parsedTckn = extract(/Tckn\/Vergi No:\s*(.*)/i);
    if (parsedTckn) setTc(parsedTckn);
    const parsedPhone = extract(/Telefon:\s*(.*)/i);
    if (parsedPhone) setPhone(parsedPhone);
    const parsedBirth = extract(/(?:Do[ğg\u011f\u011e]um|Dogum)\s*Tarihi:\s*(.*)/i);
    if (parsedBirth) {
      if (parsedBirth.includes('.')) {
        const parts = parsedBirth.split('.');
        if (parts.length === 3) {
          const d = parts[0].trim().padStart(2, '0');
          const m = parts[1].trim().padStart(2, '0');
          const y = parts[2].trim();
          setBirthDate(`${y}-${m}-${d}`);
        } else {
          setBirthDate(parsedBirth);
        }
      } else {
        setBirthDate(parsedBirth);
      }
    }
    const parsedPlate = extract(/Plaka:\s*(.*)/i);
    if (parsedPlate) setPlate(parsedPlate);
    const parsedPrice = extract(/(?:Prim|Tutar|Teklif):\s*([0-9.,]+)/i);
    if (parsedPrice) setOfferedPrice(parsedPrice.replace(/\./g, '').replace(',', '.'));
  };

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !offeredPrice) return;
    const finalType = type === 'Diğer' ? (customType.trim() || 'Özel Sigorta') : type;
    const newQuote: Quote = {
      id: `TEK-${Math.floor(200 + Math.random() * 800)}`,
      customer, tc, phone, birthDate, plate, type: finalType,
      offeredPrice: `${Number(offeredPrice.replace(',', '.')).toLocaleString('tr-TR')} TL`,
      date: new Date().toLocaleDateString('tr-TR'),
      status: 'Beklemede',
    };
    setQuotes([newQuote, ...quotes]);
    setIsModalOpen(false);
    resetForm();
  };

  const handleStatusChange = (id: string, status: 'Onaylandı' | 'Reddedildi') => {
    setQuotes(quotes.map(q => q.id === id ? { ...q, status } : q));
  };

  const handleConvertToPolicy = (q: Quote) => {
    alert('Teklif ' + q.id + ' onaylandı! Müşteri: ' + q.customer + (q.tc ? ' | TC: ' + q.tc : '') + (q.plate ? ' | Plaka: ' + q.plate : '') + '\nTutar: ' + q.offeredPrice + '\n\nPoliçeler sayfasına yönlendirilerek tek adımda poliçesini kesebilir ve müşteriyi kaydedebilirsiniz.');
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.tc || '').includes(searchTerm) ||
      (q.plate || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tümü' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, { bg: string; color: string }> = {
    'Onaylandı': { bg: '#dcfce7', color: '#15803d' },
    'Beklemede': { bg: '#fef3c7', color: '#b45309' },
    'Reddedildi': { bg: '#fee2e2', color: '#b91c1c' },
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Fiyat Teklifleri ({filteredQuotes.length})</h1>
        <button className={styles.btnCrm} onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus size={18} /> Yeni Teklif Oluştur
        </button>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <input
              type="text"
              placeholder="Teklif no, müşteri, TC, plaka veya sigorta türü ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Tümü', 'Beklemede', 'Onaylandı', 'Reddedildi'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: statusFilter === s ? '#031924' : '#edf2f7', color: statusFilter === s ? 'white' : '#4a5568', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                {['Teklif Kod', 'Müşteri / İletişim', 'Ürün / Plaka', 'Teklif Tutarı', 'Tarih', 'Durum', 'Aksiyon'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Durum' || h === 'Aksiyon' ? 'center' : 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((q) => (
                  <tr key={q.id} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem', color: '#3182ce', fontWeight: 600, fontFamily: 'monospace' }}>{q.id}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7' }}>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>{q.customer}</div>
                      {q.tc && <div style={{ fontSize: '0.78rem', color: '#718096', fontFamily: 'monospace' }}>TC: {q.tc}</div>}
                      {q.phone && <div style={{ fontSize: '0.78rem', color: '#718096' }}>Tel: {q.phone}</div>}
                      {q.birthDate && <div style={{ fontSize: '0.78rem', color: '#718096' }}>D.T: {q.birthDate}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem', color: '#4a5568' }}>
                      <div>{q.type}</div>
                      {q.plate && <div style={{ fontSize: '0.8rem', color: '#3182ce', fontWeight: 600, fontFamily: 'monospace' }}>{q.plate}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 600, color: '#2b6cb0' }}>{q.offeredPrice}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.85rem', color: '#718096' }}>{q.date}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center' }}>
                      <span style={{ padding: '6px 12px', backgroundColor: statusColors[q.status]?.bg, color: statusColors[q.status]?.color, borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700 }}>
                        {q.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {q.status === 'Beklemede' && (
                          <>
                            <button onClick={() => handleStatusChange(q.id, 'Onaylandı')} style={{ padding: '7px 11px', borderRadius: '8px', border: '1px solid #86efac', background: '#dcfce7', color: '#15803d', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={13} /> Kabul
                            </button>
                            <button onClick={() => handleStatusChange(q.id, 'Reddedildi')} style={{ padding: '7px 11px', borderRadius: '8px', border: '1px solid #fca5a5', background: '#fee2e2', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={13} /> Reddet
                            </button>
                          </>
                        )}
                        {q.status === 'Onaylandı' && (
                          <button onClick={() => handleConvertToPolicy(q)} style={{ padding: '7px 11px', borderRadius: '8px', border: '1px solid #93c5fd', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowRight size={13} /> Policeye Donustur
                          </button>
                        )}
                        <button onClick={() => setQuotes(quotes.filter(item => item.id !== q.id))} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: '#a0aec0' }}>
                    Henüz oluşturulmuş fiyat teklifi bulunmamaktadır. Yeni Teklif Oluştur ile başlayın.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} color="#3498db" /> Yeni Fiyat Teklifi
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #edf2f7' }}>
              <button onClick={() => setAddMode('Manuel')} style={{ padding: '10px', background: 'none', border: 'none', borderBottom: addMode === 'Manuel' ? '2px solid #3498db' : '2px solid transparent', color: addMode === 'Manuel' ? '#3498db' : '#718096', fontWeight: 600, cursor: 'pointer' }}>Manuel Giriş</button>
              <button onClick={() => setAddMode('Otomatik')} style={{ padding: '10px', background: 'none', border: 'none', borderBottom: addMode === 'Otomatik' ? '2px solid #3498db' : '2px solid transparent', color: addMode === 'Otomatik' ? '#3498db' : '#718096', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardPaste size={15} /> Otomatik Doldur
              </button>
            </div>

            {addMode === 'Otomatik' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Teklif Metnini Yapıştırın</label>
                <textarea value={autoText} onChange={(e) => handleAutoPaste(e.target.value)} placeholder="Ad / Soy Ad: ... Tckn/Vergi No: ... Plaka: ... Prim: ..." rows={5} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed #3498db', outline: 'none', backgroundColor: '#f0f9ff', fontSize: '0.9rem' }} />
                <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '6px' }}>Metni yapıştırdığınızda alanlar otomatik dolacaktır.</div>
              </div>
            )}

            <form onSubmit={handleAddQuote}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Müşteri Adı Soyadı / Firma *</label>
                <input type="text" required value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Hasan Yılmaz" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>TC Kimlik No / Vergi No</label>
                  <input type="text" value={tc} onChange={(e) => setTc(e.target.value)} placeholder="11 haneli TC" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Doğum Tarihi</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Telefon</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Plaka (varsa)</label>
                  <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="07 ABC 123" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Sigorta Ürünü / Türü</label>
                <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                  <option>Kasko Sigortası</option>
                  <option>Trafik Sigortası</option>
                  <option>DASK Deprem</option>
                  <option>Konut Paket</option>
                  <option>Tamamlayıcı Sağlık</option>
                  <option>İşyeri Paket</option>
                  <option>Bireysel Sağlık</option>
                  <option>Yabancı Sağlık</option>
                  <option>Seyahat Sağlık</option>
                  <option>Ferdi Kaza</option>
                  <option>Nakliyat</option>
                  <option>Mesleki Sorumluluk</option>
                  <option>TARSİM Tarım</option>
                  <option>Tekne / Yat</option>
                  <option value="Diğer">➕ Diğer (Manuel Tür Yaz...)</option>
                </select>
                {type === 'Diğer' && (
                  <input 
                    type="text" 
                    required 
                    value={customType} 
                    onChange={(e) => setCustomType(e.target.value)} 
                    placeholder="Sigorta ürününü/türünü yazın..." 
                    style={{ width: '100%', marginTop: '8px', padding: '9px', borderRadius: '8px', border: '2px solid #3b82f6', outline: 'none', fontWeight: 600, backgroundColor: '#eff6ff' }} 
                  />
                )}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Sunulan Teklif Fiyatı (TL) *</label>
                <input type="number" required value={offeredPrice} onChange={(e) => setOfferedPrice(e.target.value)} placeholder="9500" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
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
