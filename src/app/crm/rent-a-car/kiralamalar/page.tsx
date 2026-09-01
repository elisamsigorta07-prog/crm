"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, KeyRound, Eye, X, Calendar, User, CarFront, Gauge, Fuel, MapPin, ShieldCheck, DollarSign, Printer, Send } from 'lucide-react';
import { RentalBooking, RentVehicle, RentCustomer, initialBookingsData, initialVehiclesData, initialRentCustomersData } from '@/data/rentCrmData';
import styles from '../layout.module.css';

export default function KiralamalarPage() {
  const loadStoredBookings = (): RentalBooking[] => {
    if (typeof window === 'undefined') return initialBookingsData;
    try {
      const saved = localStorage.getItem('elisam_rent_bookings');
      return saved ? JSON.parse(saved) : initialBookingsData;
    } catch {
      return initialBookingsData;
    }
  };

  const loadStoredVehicles = (): RentVehicle[] => {
    if (typeof window === 'undefined') return initialVehiclesData;
    try {
      const saved = localStorage.getItem('elisam_rent_vehicles');
      return saved ? JSON.parse(saved) : initialVehiclesData;
    } catch {
      return initialVehiclesData;
    }
  };

  const loadStoredCustomers = (): RentCustomer[] => {
    if (typeof window === 'undefined') return initialRentCustomersData;
    try {
      const saved = localStorage.getItem('elisam_rent_customers');
      return saved ? JSON.parse(saved) : initialRentCustomersData;
    } catch {
      return initialRentCustomersData;
    }
  };

  const [bookings, setBookings] = useState<RentalBooking[]>(loadStoredBookings);
  const [vehicles, setVehicles] = useState<RentVehicle[]>(loadStoredVehicles);
  const [customers, setCustomers] = useState<RentCustomer[]>(loadStoredCustomers);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<RentalBooking | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('elisam_rent_bookings', JSON.stringify(bookings));
    }
  }, [bookings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('elisam_rent_vehicles', JSON.stringify(vehicles));
    }
  }, [vehicles]);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [pickupDate, setPickupDate] = useState('2026-08-01');
  const [returnDate, setReturnDate] = useState('2026-08-05');
  const [paymentMethod, setPaymentMethod] = useState<RentalBooking['paymentMethod']>('Kredi Kartı');
  
  // New KM & Contract fields
  const [startKm, setStartKm] = useState<number>(vehicles[0]?.currentKm || 0);
  const [endKm, setEndKm] = useState<string>('');
  const [fuelLevel, setFuelLevel] = useState('Full (4/4)');
  const [depositAmount, setDepositAmount] = useState('3000');
  const [pickupLocation, setPickupLocation] = useState('Alanya Merkez Ofis');
  const [dropoffLocation, setDropoffLocation] = useState('Alanya Merkez Ofis');
  const [notes, setNotes] = useState('');

  // Update startKm whenever selected vehicle changes
  useEffect(() => {
    const v = vehicles.find(item => item.id === selectedVehicleId);
    if (v) {
      setStartKm(v.currentKm);
    }
  }, [selectedVehicleId, vehicles]);

  // Calculate days & cost dynamically
  const selectedVehicleObj = vehicles.find(v => v.id === selectedVehicleId);
  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 1;
    const start = new Date(pickupDate).getTime();
    const end = new Date(returnDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  };
  const calculatedDays = calculateDays();
  const calculatedTotal = selectedVehicleObj ? selectedVehicleObj.dailyPrice * calculatedDays : 0;

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedCustomerId) return;

    const matchedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    const matchedCustomer = customers.find(c => c.id === selectedCustomerId);

    const newBooking: RentalBooking = {
      id: `REZ-${Math.floor(500 + Math.random() * 500)}`,
      vehicleId: selectedVehicleId,
      vehiclePlate: matchedVehicle?.plate || '07 TR 00',
      vehicleName: matchedVehicle ? `${matchedVehicle.brand} ${matchedVehicle.model}` : 'Araç',
      customerId: selectedCustomerId,
      customerName: matchedCustomer?.name || 'Müşteri',
      pickupDate: new Date(pickupDate).toLocaleDateString('tr-TR'),
      returnDate: new Date(returnDate).toLocaleDateString('tr-TR'),
      days: calculatedDays,
      totalAmount: calculatedTotal,
      paymentMethod,
      status: 'Aktif',
      startKm: startKm || matchedVehicle?.currentKm || 0,
      endKm: endKm ? Number(endKm) : undefined,
      fuelLevel,
      depositAmount: Number(depositAmount) || 0,
      pickupLocation,
      dropoffLocation,
      notes: notes || 'Çıkış Km ve depo bilgisi kayıtlı sözleşme.'
    };

    // Update vehicle status & currentKm
    if (matchedVehicle) {
      matchedVehicle.status = 'Kirada';
      if (endKm) {
        matchedVehicle.currentKm = Number(endKm);
      }
    }

    setBookings([newBooking, ...bookings]);
    setIsAddModalOpen(false);

    // Reset
    setNotes('');
    setEndKm('');
  };

  const filteredBookings = bookings.filter((b) => {
    return b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
           b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           b.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           b.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Araç Kiralamalar & Sözleşmeler ({filteredBookings.length})</h1>
        <button className={styles.btnCrm} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Yeni Kiralama Sözleşmesi Kes
        </button>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
            <input 
              type="text" 
              placeholder="Sözleşme no, müşteri, araç veya plaka ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Sözleşme Kod</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Araç & Plaka</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Çıkış KM</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Müşteri Sürücü</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Tarihler</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Depozito</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Toplam Ücret</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#718096', borderBottom: '1px solid #edf2f7' }}>Detay</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => (
                  <tr key={b.id} style={{ transition: 'background-color 0.2s', cursor: 'pointer' }} onClick={() => setSelectedBooking(b)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem', color: '#e67e22', fontWeight: 700, fontFamily: 'monospace' }}>
                      {b.id}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7' }}>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>{b.vehicleName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#718096', fontFamily: 'monospace' }}>{b.vehiclePlate}</div>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568' }}>
                      {b.startKm.toLocaleString('tr-TR')} km
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 600, color: '#2d3748' }}>
                      {b.customerName}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.85rem', color: '#4a5568' }}>
                      {b.pickupDate} - {b.returnDate} ({b.days} Gün)
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.85rem', fontWeight: 600, color: '#dd6b20' }}>
                      {b.depositAmount ? `${b.depositAmount.toLocaleString('tr-TR')} ₺` : 'Yok'}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontWeight: 700, color: '#276749' }}>
                      {b.totalAmount.toLocaleString('tr-TR')} ₺
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #edf2f7', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => setSelectedBooking(b)}
                          style={{ padding: '8px 14px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Eye size={16} /> İncele & Yazdır
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVehicleId(b.vehicleId);
                            setSelectedCustomerId(b.customerId);
                            setPickupDate(b.pickupDate);
                            setReturnDate(b.returnDate);
                            setPaymentMethod(b.paymentMethod);
                            setStartKm(b.startKm);
                            setFuelLevel(b.fuelLevel);
                            setDepositAmount(b.depositAmount?.toString() || '3000');
                            setPickupLocation(b.pickupLocation);
                            setDropoffLocation(b.dropoffLocation);
                            setNotes(b.notes || '');
                            setBookings(bookings.filter(item => item.id !== b.id));
                            setIsAddModalOpen(true);
                          }}
                          style={{ padding: '8px 14px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          ✏️ Düzenle
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookings(bookings.filter(item => item.id !== b.id));
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px 16px', color: '#94a3b8' }}>
                    Henüz kayıtlı kiralama sözleşmesi bulunmamaktadır. <strong>"Yeni Kiralama Sözleşmesi Ekle"</strong> butonuna basarak ekleyebilirsiniz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Contract Modal */}
      {selectedBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedBooking(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>DETAYLI DİJİTAL SÖZLEŞME VE KM KÜNYESİ</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e67e22', margin: '2px 0 0 0' }}>{selectedBooking.id}</h2>
              </div>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={24} /></button>
            </div>

            {/* Vehicle & Customer Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#fffaf0', padding: '14px', borderRadius: '10px', border: '1px solid #feebc8' }}>
                <div style={{ fontSize: '0.8rem', color: '#dd6b20', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><CarFront size={14} /> KİRALANAN ARAÇ</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem', marginTop: '4px' }}>{selectedBooking.vehicleName}</div>
                <div style={{ fontSize: '0.85rem', color: '#718096', fontFamily: 'monospace' }}>Plaka: {selectedBooking.vehiclePlate}</div>
              </div>

              <div style={{ backgroundColor: '#fffaf0', padding: '14px', borderRadius: '10px', border: '1px solid #feebc8' }}>
                <div style={{ fontSize: '0.8rem', color: '#dd6b20', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> SÜRÜCÜ MÜŞTERİ</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem', marginTop: '4px' }}>{selectedBooking.customerName}</div>
              </div>
            </div>

            {/* Detailed KM & Fuel Parameters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#edf2f7', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}><Gauge size={12} /> VERİLEN (ÇIKIŞ) KM</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1.1rem', marginTop: '2px' }}>{selectedBooking.startKm.toLocaleString('tr-TR')} km</div>
              </div>

              <div style={{ backgroundColor: '#edf2f7', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}><Gauge size={12} /> ALINAN (DÖNÜŞ) KM</div>
                <div style={{ fontWeight: 700, color: selectedBooking.endKm ? '#2d3748' : '#a0aec0', fontSize: '1.1rem', marginTop: '2px' }}>
                  {selectedBooking.endKm ? `${selectedBooking.endKm.toLocaleString('tr-TR')} km` : 'Girilmedi'}
                </div>
              </div>

              <div style={{ backgroundColor: '#edf2f7', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}><Fuel size={12} /> YAKIT SEVİYESİ</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem', marginTop: '2px' }}>{selectedBooking.fuelLevel}</div>
              </div>

              <div style={{ backgroundColor: '#edf2f7', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>DEPOZİTO / PROVİZYON</div>
                <div style={{ fontWeight: 700, color: '#e67e22', fontSize: '1.1rem', marginTop: '2px' }}>{selectedBooking.depositAmount.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>

            {/* Locations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.75rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Teslim Alma Yeri:</div>
                <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.9rem', marginTop: '2px' }}>{selectedBooking.pickupLocation}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.75rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Teslim Etme Yeri:</div>
                <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.9rem', marginTop: '2px' }}>{selectedBooking.dropoffLocation}</div>
              </div>
            </div>

            {/* Total Financial Box */}
            <div style={{ backgroundColor: '#f0fff4', padding: '16px', borderRadius: '12px', border: '1px solid #c6f6d5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#2f855a' }}>Sözleşme Toplam Kiralama Tutarı</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#276749' }}>{selectedBooking.totalAmount.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#2f855a' }}>Ödeme Yöntemi</div>
                <div style={{ fontWeight: 600, color: '#2f855a' }}>{selectedBooking.paymentMethod}</div>
              </div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => alert(`${selectedBooking.id} Kiralama Sözleşmesi yazdırılıyor...`)} className={styles.btnCrm} style={{ backgroundColor: '#1a252c', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Sözleşmeyi Yazdır
                </button>
                <button onClick={() => alert(`${selectedBooking.customerName} sürücüsüne teslimat bilgisi SMS/E-posta atıldı!`)} className={styles.btnCrm} style={{ backgroundColor: '#e67e22', fontSize: '0.85rem' }}>
                  <Send size={16} /> SMS / E-posta Gönder
                </button>
              </div>
              <button onClick={() => setSelectedBooking(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="#e67e22" /> Yeni Kiralama Sözleşmesi Oluştur
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddBooking}>
              {/* Relational Vehicle Dropdown */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Kalan/Müsait Araç Seçin *</label>
                <select 
                  required 
                  value={selectedVehicleId} 
                  onChange={(e) => setSelectedVehicleId(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e67e22', outline: 'none', backgroundColor: '#fffaf0', fontWeight: 600 }}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.plate}) - {v.currentKm} km - {v.dailyPrice} ₺/gün [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Relational Customer Search & Picker */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  🔍 Sürücü / Müşteri Ara & Seç (İsim, Pasaport/TC, Telefon veya Ülke):
                </label>

                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    placeholder="Örn: John, Hans, Mehmet, TC123456... veya 05XX..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearchQuery('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Autocomplete dropdown */}
                {customerSearchQuery.trim() && (
                  <div style={{
                    marginTop: '6px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #93c5fd',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    zIndex: 50
                  }}>
                    {customers.filter(c => {
                      const q = customerSearchQuery.toLowerCase();
                      return c.name.toLowerCase().includes(q) ||
                             c.identityOrPassport.toLowerCase().includes(q) ||
                             c.phone.includes(q) ||
                             c.country.toLowerCase().includes(q);
                    }).length > 0 ? (
                      customers.filter(c => {
                        const q = customerSearchQuery.toLowerCase();
                        return c.name.toLowerCase().includes(q) ||
                               c.identityOrPassport.toLowerCase().includes(q) ||
                               c.phone.includes(q) ||
                               c.country.toLowerCase().includes(q);
                      }).map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setCustomerSearchQuery('');
                          }}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div>
                            <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '0.92rem' }}>
                              {c.name} <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{c.country}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                              📞 {c.phone} • 🆔 {c.identityOrPassport} • Ehliyet: {c.licenseClass}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>Seç ➔</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.84rem', color: '#94a3b8' }}>
                        Kayıtlı sürücü bulunamadı.
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Driver Pill */}
                {selectedCustomerId && (
                  <div style={{ marginTop: '8px', padding: '9px 14px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 750, color: '#065f46' }}>
                      ✓ Seçilen Sürücü: {customers.find(c => c.id === selectedCustomerId)?.name} ({customers.find(c => c.id === selectedCustomerId)?.phone})
                    </span>
                  </div>
                )}
              </div>

              {/* KM Parameters Section */}
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2b6cb0', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Gauge size={14} /> KM VE YAKIT METRİKLERİ
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Verilen (Çıkış) KM *</label>
                    <input type="number" required value={startKm} onChange={(e) => setStartKm(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none', fontWeight: 600 }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Alınan (Dönüş) KM (Opsiyonel)</label>
                    <input type="number" value={endKm} onChange={(e) => setEndKm(e.target.value)} placeholder="Teslimde girilir" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Yakıt Seviyesi</label>
                    <select value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}>
                      <option value="Full (4/4)">Full (4/4)</option>
                      <option value="3/4 Depo">3/4 Depo</option>
                      <option value="1/2 Depo">1/2 Depo</option>
                      <option value="1/4 Depo">1/4 Depo</option>
                      <option value="Boş Depo">Boş Depo</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Alınan Depozito (₺)</label>
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="3000" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Locations & Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Teslim Alış Yeri</label>
                  <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="Alanya Ofis, AYT..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Teslim Ediş Yeri</label>
                  <input type="text" value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} placeholder="Alanya Ofis, GZP..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Teslim Alma Tarihi</label>
                  <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Teslim Etme Tarihi</label>
                  <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
              </div>

              {/* Dynamic Cost Preview */}
              <div style={{ backgroundColor: '#f0fff4', padding: '12px 15px', borderRadius: '8px', border: '1px solid #c6f6d5', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#276749', fontWeight: 600 }}>Kiralama: {calculatedDays} Gün</span>
                <span style={{ fontSize: '1.1rem', color: '#276749', fontWeight: 700 }}>Otomatik Tutar: {calculatedTotal.toLocaleString('tr-TR')} ₺</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>İptal</button>
                <button type="submit" className={styles.btnCrm}>Sözleşmeyi Onayla & Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
