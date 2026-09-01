"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, CarFront, Eye, X, Fuel, Gauge, ShieldCheck } from 'lucide-react';
import { RentVehicle, initialVehiclesData, initialBookingsData } from '@/data/rentCrmData';
import styles from '../layout.module.css';

export default function FiloPage() {
  const loadStoredVehicles = (): RentVehicle[] => {
    if (typeof window === 'undefined') return initialVehiclesData;
    try {
      const saved = localStorage.getItem('elisam_rent_vehicles');
      return saved ? JSON.parse(saved) : initialVehiclesData;
    } catch {
      return initialVehiclesData;
    }
  };

  const [vehicles, setVehicles] = useState<RentVehicle[]>(loadStoredVehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tümü');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<RentVehicle | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('elisam_rent_vehicles', JSON.stringify(vehicles));
    }
  }, [vehicles]);

  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('2023');
  const [dailyPrice, setDailyPrice] = useState('');
  const [fuelType, setFuelType] = useState<RentVehicle['fuelType']>('Benzin');
  const [transmission, setTransmission] = useState<RentVehicle['transmission']>('Otomatik');
  const [category, setCategory] = useState<RentVehicle['category']>('Ekonomik');

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !plate || !dailyPrice) return;

    const newVehicle: RentVehicle = {
      id: `VEH-${Math.floor(100 + Math.random() * 900)}`,
      brand,
      model,
      plate,
      year: Number(year),
      dailyPrice: Number(dailyPrice),
      currentKm: 1000,
      fuelType,
      transmission,
      status: 'Müsait',
      category,
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
    };

    setVehicles([newVehicle, ...vehicles]);
    setIsAddModalOpen(false);

    // Reset Form
    setBrand('');
    setModel('');
    setPlate('');
    setDailyPrice('');
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.plate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tümü' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Araç Filosu ({filteredVehicles.length})</h1>
        <button className={styles.btnCrm} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Filoya Yeni Araç Ekle
        </button>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <input 
              type="text" 
              placeholder="Marka, model veya plaka ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Tümü', 'Müsait', 'Kirada', 'Bakımda'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: statusFilter === st ? '#e67e22' : '#edf2f7',
                  color: statusFilter === st ? 'white' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicles Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((v) => (
              <div 
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                style={{ border: '1px solid #edf2f7', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ position: 'relative', height: '160px', backgroundColor: '#f7fafc' }}>
                  <img src={v.imageUrl} alt={v.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    backgroundColor: v.status === 'Müsait' ? '#f0fff4' : v.status === 'Kirada' ? '#fffaf0' : '#fff5f5',
                    color: v.status === 'Müsait' ? '#38a169' : v.status === 'Kirada' ? '#dd6b20' : '#e53e3e',
                    border: '1px solid currentColor'
                  }}>
                    {v.status}
                  </span>
                </div>

                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2d3748', margin: 0 }}>{v.brand} {v.model}</h3>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: '#edf2f7', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>{v.plate}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#718096', marginBottom: '15px' }}>
                    <span><Fuel size={12} /> {v.fuelType}</span>
                    <span>• {v.transmission}</span>
                    <span>• {v.year}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #edf2f7' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#718096' }}>Günlük Kira</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e67e22' }}>₺{v.dailyPrice.toLocaleString('tr-TR')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => setSelectedVehicle(v)}
                        style={{ padding: '8px 12px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      >
                        <Eye size={15} /> İncele
                      </button>
                      <button 
                        onClick={() => {
                          setBrand(v.brand);
                          setModel(v.model);
                          setPlate(v.plate);
                          setYear(v.year.toString());
                          setDailyPrice(v.dailyPrice.toString());
                          setFuelType(v.fuelType);
                          setTransmission(v.transmission);
                          setCategory(v.category);
                          setVehicles(vehicles.filter(item => item.id !== v.id));
                          setIsAddModalOpen(true);
                        }}
                        style={{ padding: '8px 12px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      >
                        ✏️ Düzenle
                      </button>
                      <button 
                        onClick={() => setVehicles(vehicles.filter(item => item.id !== v.id))}
                        style={{ padding: '8px 10px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px', color: '#94a3b8', background: 'white', borderRadius: '16px', border: '1px border-dashed #cbd5e1' }}>
              Filoda kayıtlı araç bulunmamaktadır. <strong>"Filoya Yeni Araç Ekle"</strong> butonuna basarak ilk aracınızı ekleyebilirsiniz.
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedVehicle(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>ARAÇ DETAY KARTI</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d3748', margin: '2px 0 0 0' }}>{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})</h2>
              </div>
              <button onClick={() => setSelectedVehicle(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={24} /></button>
            </div>

            <div style={{ height: '200px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
              <img src={selectedVehicle.imageUrl} alt={selectedVehicle.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Plaka</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1.1rem', fontFamily: 'monospace' }}>{selectedVehicle.plate}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Araç Durumu</div>
                <div style={{ fontWeight: 700, color: selectedVehicle.status === 'Müsait' ? '#38a169' : '#dd6b20', fontSize: '1.1rem' }}>{selectedVehicle.status}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Güncel Kilometre</div>
                <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '1rem' }}>{selectedVehicle.currentKm.toLocaleString('tr-TR')} km</div>
              </div>

              <div style={{ backgroundColor: '#fffaf0', padding: '14px', borderRadius: '10px', border: '1px solid #feebc8' }}>
                <div style={{ fontSize: '0.8rem', color: '#dd6b20' }}>Günlük Kira Fiyatı</div>
                <div style={{ fontWeight: 700, color: '#dd6b20', fontSize: '1.2rem' }}>{selectedVehicle.dailyPrice.toLocaleString('tr-TR')} ₺ / gün</div>
              </div>
            </div>

            {/* Damage & Maintenance Record */}
            <div style={{ backgroundColor: '#fffaf0', padding: '15px', borderRadius: '10px', border: '1px solid #feebc8', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dd6b20', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Hasar & Periyodik Bakım Geçmişi:
              </div>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.85rem', color: '#4a5568' }}>
                <li>15.000 KM periyodik yağ ve filtre bakımı yetkili serviste yapıldı.</li>
                <li>Sağ arka tamponda hafif sürtme izi (Boyasız göçük düzeltme yapıldı).</li>
                <li>Yazlık lastikler yenilendi (Michelin Primacy 4).</li>
              </ul>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedVehicle(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CarFront size={20} color="#e67e22" /> Filoya Yeni Araç Kaydı
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddVehicle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Marka *</label>
                  <input type="text" required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Örn: Toyota" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Model *</label>
                  <input type="text" required value={model} onChange={(e) => setModel(e.target.value)} placeholder="Örn: Corolla 1.8 Hybrid" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Plaka *</label>
                  <input type="text" required value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="07 AAA 007" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'monospace', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Günlük Ücret (₺) *</label>
                  <input type="number" required value={dailyPrice} onChange={(e) => setDailyPrice(e.target.value)} placeholder="1800" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Yakıt Türü</label>
                  <select value={fuelType} onChange={(e) => setFuelType(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                    <option value="Benzin">Benzin</option>
                    <option value="Dizel">Dizel</option>
                    <option value="Hibrit">Hibrit</option>
                    <option value="Elektrik">Elektrik</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Vites</label>
                  <select value={transmission} onChange={(e) => setTransmission(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                    <option value="Otomatik">Otomatik</option>
                    <option value="Manuel">Manuel</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>İptal</button>
                <button type="submit" className={styles.btnCrm}>Aracı Filoya Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
