"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  KeyRound, 
  Eye, 
  X, 
  Calendar, 
  User, 
  CarFront, 
  Gauge, 
  Fuel, 
  MapPin, 
  ShieldCheck, 
  DollarSign, 
  Printer, 
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Filter,
  Phone,
  Mail,
  CreditCard,
  Building2,
  Globe,
  Coins
} from 'lucide-react';
import { 
  RentalBooking, 
  RentVehicle, 
  RentCustomer, 
  initialBookingsData, 
  initialVehiclesData, 
  initialRentCustomersData 
} from '@/data/rentCrmData';
import { 
  fetchRentBookingsFromCloud, 
  fetchRentCustomersFromCloud, 
  fetchRentVehiclesFromCloud,
  upsertRentBookingToCloud,
  upsertRentVehicleToCloud,
  deleteRentBookingFromCloud,
  upsertRentCustomerToCloud,
  upsertRentCariMovementToCloud,
  deleteRentCariMovementFromCloud,
  RentCariMovement
} from '@/lib/supabaseService';
import { generateModernPDF } from '@/lib/pdfReportGenerator';
import styles from '../layout.module.css';

export default function KiralamalarPage() {
  const [bookings, setBookings] = useState<RentalBooking[]>(initialBookingsData);
  const [vehicles, setVehicles] = useState<RentVehicle[]>(initialVehiclesData);
  const [customers, setCustomers] = useState<RentCustomer[]>(initialRentCustomersData);
  const [isMounted, setIsMounted] = useState(false);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tümü' | 'Aktif' | 'Bugün Başlayanlar' | 'Yaklaşan İadeler' | 'Tamamlandı' | 'İptal'>('Tümü');
  const [vehicleFilter, setVehicleFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<RentalBooking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<RentalBooking | null>(null);

  // Form State - Sürücü / Müşteri Bilgileri
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState('NEW');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerIdentity, setCustomerIdentity] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCountry, setCustomerCountry] = useState('Türkiye');
  const [customerLicenseNo, setCustomerLicenseNo] = useState('');
  const [customerLicenseClass, setCustomerLicenseClass] = useState('B');
  const [customerBirthDate, setCustomerBirthDate] = useState('');

  // Form State - Araç & Kiralama Detayları
  const [bookingNo, setBookingNo] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0]);
  const [returnTime, setReturnTime] = useState('10:00');
  const [customDays, setCustomDays] = useState<string>('3');
  const [totalPrice, setTotalPrice] = useState<string>('4500');
  const [paymentMethod, setPaymentMethod] = useState<RentalBooking['paymentMethod']>('Kredi Kartı');
  const [startKm, setStartKm] = useState<number>(0);
  const [endKm, setEndKm] = useState<string>('');
  const [fuelLevel, setFuelLevel] = useState('4/4 (Dolu)');
  const [depositAmount, setDepositAmount] = useState('3000');
  const [pickupLocation, setPickupLocation] = useState('Alanya Merkez Ofis');
  const [dropoffLocation, setDropoffLocation] = useState('Alanya Merkez Ofis');
  const [contractStatus, setContractStatus] = useState<'Aktif' | 'Tamamlandı' | 'İptal'>('Aktif');
  const [notes, setNotes] = useState('');

  // Hydration-safe initial load from Supabase Cloud (with Local fallback)
  useEffect(() => {
    setIsMounted(true);
    async function loadCloudData() {
      try {
        const [cloudBookings, cloudVehs, cloudCusts] = await Promise.all([
          fetchRentBookingsFromCloud(),
          fetchRentVehiclesFromCloud(),
          fetchRentCustomersFromCloud()
        ]);
        if (cloudBookings) setBookings(cloudBookings);
        if (cloudVehs) {
          setVehicles(cloudVehs);
          if (cloudVehs.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(cloudVehs[0].id);
            setStartKm(cloudVehs[0].currentKm || 0);
          }
        }
        if (cloudCusts) setCustomers(cloudCusts);
      } catch (err) {
        console.error('Supabase rent load error:', err);
      }
    }
    loadCloudData();
  }, []);

  // Update startKm whenever selected vehicle changes in form
  useEffect(() => {
    const v = vehicles.find(item => item.id === selectedVehicleId);
    if (v && selectedExistingCustomerId !== 'EDIT') {
      setStartKm(v.currentKm || 0);
    }
  }, [selectedVehicleId, vehicles]);

  // Dynamically calculate days when dates change
  useEffect(() => {
    if (pickupDate && returnDate) {
      const start = new Date(pickupDate).getTime();
      const end = new Date(returnDate).getTime();
      const diff = Math.ceil((end - start) / (1000 * 3600 * 24));
      const calculated = diff > 0 ? diff : 1;
      setCustomDays(String(calculated));
    }
  }, [pickupDate, returnDate]);

  // Reset Form helper
  const resetForm = () => {
    setSelectedExistingCustomerId('NEW');
    setCustomerSearchInput('');
    setCustomerName('');
    setCustomerIdentity('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerCountry('Türkiye');
    setCustomerLicenseNo('');
    setCustomerLicenseClass('B');
    setCustomerBirthDate('');

    setBookingNo(`REZ-${Math.floor(1000 + Math.random() * 9000)}`);
    if (vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
      setStartKm(vehicles[0].currentKm || 0);
    }
    setPickupDate(new Date().toISOString().split('T')[0]);
    setPickupTime('10:00');
    setReturnDate(new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0]);
    setReturnTime('10:00');
    setCustomDays('3');
    setTotalPrice('4500');
    setPaymentMethod('Kredi Kartı');
    setEndKm('');
    setFuelLevel('4/4 (Dolu)');
    setDepositAmount('3000');
    setPickupLocation('Alanya Merkez Ofis');
    setDropoffLocation('Alanya Merkez Ofis');
    setContractStatus('Aktif');
    setNotes('');
    setEditingBooking(null);
  };

  // Open Modal for New Contract
  const handleOpenNewModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (b: RentalBooking) => {
    setEditingBooking(b);
    setSelectedExistingCustomerId('EDIT');
    setBookingNo(b.id);
    setSelectedVehicleId(b.vehicleId);
    setCustomerName(b.customerName);
    
    // Find customer details if exists
    const cust = customers.find(c => c.id === b.customerId || c.name.toLowerCase() === b.customerName.toLowerCase());
    setCustomerIdentity(cust?.identityOrPassport || '');
    setCustomerPhone(cust?.phone || '');
    setCustomerEmail(cust?.email || '');
    setCustomerCountry(cust?.country || 'Türkiye');
    setCustomerLicenseNo(cust?.licenseNo || '');
    setCustomerLicenseClass(cust?.licenseClass || 'B');
    setCustomerBirthDate(cust?.birthDate || '');

    // Format dates (if DD.MM.YYYY to YYYY-MM-DD)
    if (b.pickupDate && b.pickupDate.includes('.')) {
      setPickupDate(b.pickupDate.split('.').reverse().join('-'));
    } else {
      setPickupDate(b.pickupDate || new Date().toISOString().split('T')[0]);
    }

    if (b.returnDate && b.returnDate.includes('.')) {
      setReturnDate(b.returnDate.split('.').reverse().join('-'));
    } else {
      setReturnDate(b.returnDate || new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0]);
    }

    setCustomDays(String(b.days || 1));
    setTotalPrice(String(b.totalAmount || 0));
    setPaymentMethod(b.paymentMethod || 'Kredi Kartı');
    setStartKm(b.startKm || 0);
    setEndKm(b.endKm ? String(b.endKm) : '');
    setFuelLevel(b.fuelLevel || '4/4 (Dolu)');
    setDepositAmount(String(b.depositAmount || 0));
    setPickupLocation(b.pickupLocation || 'Alanya Merkez Ofis');
    setDropoffLocation(b.dropoffLocation || 'Alanya Merkez Ofis');
    setContractStatus(b.status || 'Aktif');
    setNotes(b.notes || '');

    setIsAddModalOpen(true);
  };

  // Save Booking & Auto-Sync
  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !selectedVehicleId || !totalPrice) {
      alert('Lütfen sürücü adı, araç seçimi ve kiralama tutarını doldurunuz.');
      return;
    }

    const matchedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    const finalBookingNo = bookingNo.trim() || `REZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const calcDays = Number(customDays) || 1;
    const finalTotal = Number(totalPrice) || 0;
    const finalDeposit = Number(depositAmount) || 0;

    // 1. SAVE / UPDATE CUSTOMER
    let customerId = selectedExistingCustomerId !== 'NEW' && selectedExistingCustomerId !== 'EDIT' 
      ? selectedExistingCustomerId 
      : (editingBooking?.customerId || `RCUST-${Math.floor(100 + Math.random() * 900)}`);

    const existingCust = customers.find(c => c.id === customerId || c.name.toLowerCase() === customerName.trim().toLowerCase());
    let customerToSave: RentCustomer;

    if (existingCust) {
      customerId = existingCust.id;
      customerToSave = {
        ...existingCust,
        name: customerName.trim(),
        identityOrPassport: customerIdentity || existingCust.identityOrPassport,
        phone: customerPhone || existingCust.phone,
        email: customerEmail || existingCust.email,
        country: customerCountry || existingCust.country,
        licenseNo: customerLicenseNo || existingCust.licenseNo,
        licenseClass: customerLicenseClass || existingCust.licenseClass,
        birthDate: customerBirthDate || existingCust.birthDate,
        totalRentals: (existingCust.totalRentals || 0) + (editingBooking ? 0 : 1)
      };
      setCustomers(customers.map(c => c.id === customerId ? customerToSave : c));
    } else {
      customerToSave = {
        id: customerId,
        name: customerName.trim(),
        identityOrPassport: customerIdentity || '-',
        country: customerCountry || 'Türkiye',
        phone: customerPhone || '-',
        email: customerEmail || '-',
        licenseNo: customerLicenseNo || '-',
        licenseClass: customerLicenseClass || 'B',
        birthDate: customerBirthDate || undefined,
        totalRentals: 1
      };
      setCustomers([customerToSave, ...customers]);
    }
    upsertRentCustomerToCloud(customerToSave);

    // Format display dates
    const formattedPickup = pickupDate.includes('-') ? pickupDate.split('-').reverse().join('.') : pickupDate;
    const formattedReturn = returnDate.includes('-') ? returnDate.split('-').reverse().join('.') : returnDate;

    // 2. SAVE / UPDATE BOOKING
    const newBookingRecord: RentalBooking = {
      id: finalBookingNo,
      vehicleId: selectedVehicleId,
      vehiclePlate: matchedVehicle?.plate || '07 ELS 07',
      vehicleName: matchedVehicle ? `${matchedVehicle.brand} ${matchedVehicle.model}` : 'Kiralık Araç',
      customerId,
      customerName: customerName.trim(),
      pickupDate: formattedPickup,
      returnDate: formattedReturn,
      days: calcDays,
      totalAmount: finalTotal,
      paymentMethod,
      status: contractStatus,
      startKm: startKm || matchedVehicle?.currentKm || 0,
      endKm: endKm ? Number(endKm) : undefined,
      fuelLevel,
      depositAmount: finalDeposit,
      pickupLocation: `${pickupLocation} (${pickupTime})`,
      dropoffLocation: `${dropoffLocation} (${returnTime})`,
      notes: notes || 'Kiralama sözleşmesi aktif.'
    };

    if (editingBooking) {
      setBookings(bookings.map(b => b.id === editingBooking.id ? newBookingRecord : b));
    } else {
      setBookings([newBookingRecord, ...bookings]);
    }
    upsertRentBookingToCloud(newBookingRecord);

    // Update vehicle status & Km
    if (matchedVehicle) {
      matchedVehicle.status = contractStatus === 'Aktif' ? 'Kirada' : 'Müsait';
      if (endKm && Number(endKm) > 0) {
        matchedVehicle.currentKm = Number(endKm);
      }
      upsertRentVehicleToCloud(matchedVehicle);
    }

    // 3. AUTO-SYNC WITH RENT FINANS & CARİ HESAP EKSTRESİ (elisam_rent_cari_movements)
    try {
      const savedMovs = JSON.parse(localStorage.getItem('elisam_rent_cari_movements') || '[]');
      
      const getNextReceiptNo = (currentMovements: any[]): string => {
        if (!currentMovements || currentMovements.length === 0) return 'R000001';
        const numbers = currentMovements
          .map(m => {
            const match = m.receiptNo?.match(/^R(\d+)$/i);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(n => !isNaN(n) && n > 0);
        const maxNum = numbers.length > 0 ? Math.max(...numbers) : currentMovements.length;
        return `R${String(maxNum + 1).padStart(6, '0')}`;
      };

      // Filter out old movements of this booking if editing
      let updatedMovs = savedMovs.filter((m: any) => !(m.description?.includes(finalBookingNo)));

      // 1. Borç Kaydı: Kiralama Bedeli Tahakkuku
      const receiptNoDebt = getNextReceiptNo(updatedMovs);
      const debtMovement: RentCariMovement = {
        id: `RCAR-${Math.floor(1000 + Math.random() * 9000)}`,
        date: formattedPickup,
        dueDate: formattedReturn,
        receiptNo: receiptNoDebt,
        customerId,
        customerName: customerName.trim(),
        vehicleId: selectedVehicleId,
        vehiclePlate: matchedVehicle?.plate,
        vehicleName: matchedVehicle ? `${matchedVehicle.brand} ${matchedVehicle.model}` : undefined,
        description: `${finalBookingNo} nolu Sözleşme - ${matchedVehicle?.plate || ''} ${calcDays} Günlük Kiralama Bedeli`,
        movementType: 'Kiralama Bedeli Tahakkuku',
        debitAmount: finalTotal,
        creditAmount: 0,
        notes: notes || 'Kiralama sözleşmesi ile otomatik oluşturuldu.'
      };
      updatedMovs = [debtMovement, ...updatedMovs];
      upsertRentCariMovementToCloud(debtMovement);

      // 2. Tahsilat Kaydı (Kiralama peşin ödendiyse)
      if (finalTotal > 0) {
        const receiptNoPaid = getNextReceiptNo(updatedMovs);
        const paidMovement: RentCariMovement = {
          id: `RCAR-${Math.floor(1000 + Math.random() * 9000)}`,
          date: formattedPickup,
          dueDate: undefined,
          receiptNo: receiptNoPaid,
          customerId,
          customerName: customerName.trim(),
          vehicleId: selectedVehicleId,
          vehiclePlate: matchedVehicle?.plate,
          vehicleName: matchedVehicle ? `${matchedVehicle.brand} ${matchedVehicle.model}` : undefined,
          description: `${finalBookingNo} nolu Sözleşme Kira Tahsilatı (${paymentMethod})`,
          movementType: (paymentMethod === 'Kredi Kartı' ? 'Kira Tahsilatı (Kredi Kartı)' : (paymentMethod === 'Nakit' ? 'Kira Tahsilatı (Nakit)' : 'Kira Tahsilatı (Banka Havale/EFT)')),
          debitAmount: 0,
          creditAmount: finalTotal,
          notes: 'Kiralama başlangıcında tahsil edildi.'
        };
        updatedMovs = [paidMovement, ...updatedMovs];
        upsertRentCariMovementToCloud(paidMovement);
      }

      // 3. Depozito Kaydı (Depozito alındıysa)
      if (finalDeposit > 0) {
        const receiptNoDep = getNextReceiptNo(updatedMovs);
        const depMovement: RentCariMovement = {
          id: `RCAR-${Math.floor(1000 + Math.random() * 9000)}`,
          date: formattedPickup,
          dueDate: formattedReturn,
          receiptNo: receiptNoDep,
          customerId,
          customerName: customerName.trim(),
          vehicleId: selectedVehicleId,
          vehiclePlate: matchedVehicle?.plate,
          vehicleName: matchedVehicle ? `${matchedVehicle.brand} ${matchedVehicle.model}` : undefined,
          description: `${finalBookingNo} nolu Sözleşme - ${matchedVehicle?.plate || ''} Kiralama Güvence Depozitosu`,
          movementType: 'Depozito / Provizyon Tahsilatı',
          debitAmount: 0,
          creditAmount: finalDeposit,
          notes: 'Sözleşme başlangıcında depozito/provizyon alındı.'
        };
        updatedMovs = [depMovement, ...updatedMovs];
        upsertRentCariMovementToCloud(depMovement);
      }

      localStorage.setItem('elisam_rent_cari_movements', JSON.stringify(updatedMovs));
    } catch (err) {
      console.error('Rent cari sync error:', err);
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  // Delete Booking
  const handleDeleteBooking = (id: string, name: string) => {
    if (confirm(`"${name}" müşterisine ait ${id} numaralı kiralama sözleşmesini silmek istediğinize emin misiniz?`)) {
      setBookings(bookings.filter(b => b.id !== id));
      if (selectedBooking?.id === id) setSelectedBooking(null);

      deleteRentBookingFromCloud(id);

      try {
        const savedMovs = JSON.parse(localStorage.getItem('elisam_rent_cari_movements') || '[]');
        const updatedMovs = savedMovs.filter((m: any) => !m.description?.includes(id));
        localStorage.setItem('elisam_rent_cari_movements', JSON.stringify(updatedMovs));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Export Official PDF Contract
  const handlePrintContractPDF = (b: RentalBooking) => {
    const cust = customers.find(c => c.id === b.customerId || c.name.toLowerCase() === b.customerName.toLowerCase());
    const veh = vehicles.find(v => v.id === b.vehicleId || v.plate === b.vehiclePlate);

    generateModernPDF({
      title: `${b.id} NOLU ARAÇ KİRALAMA SÖZLEŞMESİ`,
      subtitle: 'Elisam Rent A Car • Resmi Kiralama Sözleşmesi ve Teslim-İade Tutanağı',
      category: 'RENT A CAR FİLO',
      dateRange: `Sözleşme Tarihi: ${b.pickupDate}`,
      customerInfo: {
        name: b.customerName,
        identityNo: cust?.identityOrPassport || '-',
        phone: cust?.phone || '-',
        type: `Ehliyet: ${cust?.licenseNo || '-'} (${cust?.licenseClass || 'B'})`,
        address: `${cust?.country || 'Türkiye'} / Tel: ${cust?.phone || '-'}`
      },
      kpis: [
        { label: 'KİRALANAN ARAÇ', value: `${b.vehiclePlate}`, color: '#e67e22' },
        { label: 'KİRALAMA SÜRESİ', value: `${b.days} Gün`, color: '#3b82f6' },
        { label: 'TOPLAM KİRA BEDELİ', value: `${b.totalAmount.toLocaleString('tr-TR')} ₺`, color: '#16a34a' },
        { label: 'ALINAN DEPOZİTO', value: `${b.depositAmount?.toLocaleString('tr-TR') || 0} ₺`, color: '#d97706' }
      ],
      headers: ['Sözleşme Parametresi', 'Açıklama / Sözleşme Kaydı'],
      rows: [
        ['Sözleşme / Rezervasyon No', b.id],
        ['Araç Modeli & Segment', `${b.vehicleName} (${veh?.category || 'Standart'})`],
        ['Araç Plakası', b.vehiclePlate],
        ['Çıkış / Başlangıç Kilometresi', `${b.startKm?.toLocaleString('tr-TR') || 0} KM`],
        ['Dönüş / Bitiş Kilometresi', b.endKm ? `${b.endKm.toLocaleString('tr-TR')} KM` : 'Henüz İade Alınmadı'],
        ['Yakıt Depo Seviyesi', b.fuelLevel || '4/4 (Dolu)'],
        ['Alış Tarihi & Lokasyonu', `${b.pickupDate} - ${b.pickupLocation || 'Merkez Ofis'}`],
        ['İade Tarihi & Lokasyonu', `${b.returnDate} - ${b.dropoffLocation || 'Merkez Ofis'}`],
        ['Ödeme Şekli & Durumu', `${b.paymentMethod} • ${b.status}`],
        ['Alınan Güvence Depozitosu', `₺${b.depositAmount?.toLocaleString('tr-TR') || 0}`],
        ['Sözleşme Özel Notları', b.notes || 'Aracın genel temizliği ve mekanik kontrolleri yapılarak teslim edilmiştir.']
      ],
      summaryNotes: [
        'Kiracı, aracı trafik kurallarına uygun, yetkili sürücü haricinde kimseye kullandırmayacağını ve süresi bitiminde teslim edeceğini taahhüt eder.',
        'Trafik cezaları, HGS/OGS geçiş ücretleri ve araç hasar sorumluluğu kiralama süresi boyunca kiracıya aittir.',
        'Bu sözleşme taraflarca okunup dijital olarak onaylanmıştır.'
      ]
    });
  };

  // Filter Bookings logic
  const filteredBookings = bookings.filter((b) => {
    // 1. Search Query
    const matchesSearch = 
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Status Tab
    let matchesStatus = true;
    const todayStr = new Date().toLocaleDateString('tr-TR');
    if (statusFilter === 'Aktif') {
      matchesStatus = b.status === 'Aktif';
    } else if (statusFilter === 'Bugün Başlayanlar') {
      matchesStatus = b.pickupDate === todayStr;
    } else if (statusFilter === 'Yaklaşan İadeler') {
      matchesStatus = b.returnDate === todayStr || b.status === 'Aktif';
    } else if (statusFilter === 'Tamamlandı') {
      matchesStatus = b.status === 'Tamamlandı';
    } else if (statusFilter === 'İptal') {
      matchesStatus = b.status === 'İptal';
    }

    // 3. Vehicle Filter
    const matchesVehicle = vehicleFilter === 'ALL' || b.vehiclePlate === vehicleFilter || b.vehicleId === vehicleFilter;

    // 4. Date Range
    let matchesDate = true;
    if (startDateFilter) {
      const bStart = b.pickupDate.includes('.') ? b.pickupDate.split('.').reverse().join('-') : b.pickupDate;
      matchesDate = matchesDate && bStart >= startDateFilter;
    }
    if (endDateFilter) {
      const bEnd = b.returnDate.includes('.') ? b.returnDate.split('.').reverse().join('-') : b.returnDate;
      matchesDate = matchesDate && bEnd <= endDateFilter;
    }

    return matchesSearch && matchesStatus && matchesVehicle && matchesDate;
  });

  // KPI Calculations
  const totalBookingsCount = bookings.length;
  const activeBookingsCount = bookings.filter(b => b.status === 'Aktif').length;
  const todayReturnsCount = bookings.filter(b => b.status === 'Aktif' && b.returnDate === new Date().toLocaleDateString('tr-TR')).length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <KeyRound size={28} color="#e67e22" /> Araç Kiralamalar & Sözleşmeler
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px', margin: 0 }}>
            Tüm filo kiralama sözleşmeleri, sürücü kayıtları, teslim-iade takip dökümü ve anlık operasyonel durumlar.
          </p>
        </div>

        <button 
          onClick={handleOpenNewModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 20px',
            backgroundColor: '#e67e22',
            color: '#ffffff',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(230, 126, 34, 0.25)'
          }}
        >
          <Plus size={18} /> Yeni Kiralama Sözleşmesi Kes
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Toplam Sözleşme */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>TOPLAM SÖZLEŞME</span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#fff7ed', color: '#e67e22' }}>
              <KeyRound size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
            {totalBookingsCount} Adet
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Tüm Filo Kiralama Kayıtları
          </div>
        </div>

        {/* Aktif Kirada Olanlar */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>ŞU AN KİRADA (AKTİF)</span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <CarFront size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16a34a' }}>
            {activeBookingsCount} Araç
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '4px', fontWeight: 600 }}>
            Müşteride Kullanımda
          </div>
        </div>

        {/* Bugün İade Edilecekler */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>BUGÜN İADE BEKLEYEN</span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d97706' }}>
            {todayReturnsCount} Araç
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px', fontWeight: 600 }}>
            Günü Dolan Sözleşmeler
          </div>
        </div>

        {/* Toplam Ciro / Hasılat */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>TOPLAM HASILAT</span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
            ₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#2563eb', marginTop: '4px', fontWeight: 600 }}>
            Kiralama Cirosu
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Hub */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '16px', 
        padding: '18px 20px', 
        border: '1px solid #e2e8f0', 
        marginBottom: '20px' 
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {(['Tümü', 'Aktif', 'Bugün Başlayanlar', 'Yaklaşan İadeler', 'Tamamlandı', 'İptal'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: statusFilter === tab ? 'none' : '1px solid #e2e8f0',
                backgroundColor: statusFilter === tab ? '#e67e22' : '#ffffff',
                color: statusFilter === tab ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'Tümü' && `📋 Tümü (${bookings.length})`}
              {tab === 'Aktif' && `🟢 Aktif Kiralar (${bookings.filter(b => b.status === 'Aktif').length})`}
              {tab === 'Bugün Başlayanlar' && `📅 Bugün Başlayanlar`}
              {tab === 'Yaklaşan İadeler' && `⏳ Yaklaşan İadeler`}
              {tab === 'Tamamlandı' && `✅ Bitenler (${bookings.filter(b => b.status === 'Tamamlandı').length})`}
              {tab === 'İptal' && `❌ İptaller`}
            </button>
          ))}
        </div>

        {/* Detailed Filter Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Sözleşme No, Sürücü Adı, Plaka veya Araç..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '9px 10px 9px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Vehicle Filter */}
          <div>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: '#334155', fontWeight: 600, outline: 'none' }}
            >
              <option value="ALL">🚗 TÜM ARAÇLAR (FİLO)</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.plate}>
                  {v.plate} - {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <input 
              type="date" 
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              placeholder="Başlangıç Tarihi"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', outline: 'none' }}
            />
          </div>

          {/* End Date Filter */}
          <div>
            <input 
              type="date" 
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              placeholder="Bitiş Tarihi"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Main Bookings Table */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0', 
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Sözleşme No</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Sürücü / Müşteri</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Araç & Plaka</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Alış Tarihi</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>İade Tarihi</th>
                <th style={{ padding: '12px 12px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Süre</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Toplam Tutar</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Ödeme</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Durum</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    <KeyRound size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>Aradığınız kriterlere uygun kiralama sözleşmesi bulunamadı.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Yukarıdaki <strong>"Yeni Kiralama Sözleşmesi Kes"</strong> butonuna basarak ilk sözleşmenizi düzenleyebilirsiniz.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, idx) => {
                  return (
                    <tr 
                      key={b.id || idx}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Sözleşme No */}
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#e67e22', whiteSpace: 'nowrap' }}>
                        <span style={{ backgroundColor: '#fff7ed', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fed7aa', fontSize: '0.85rem' }}>
                          {b.id}
                        </span>
                      </td>

                      {/* Sürücü Adı & Detay */}
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="#e67e22" />
                          <span>{b.customerName}</span>
                        </div>
                      </td>

                      {/* Araç & Plaka */}
                      <td style={{ padding: '12px 16px', color: '#1e293b' }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                            🚗 {b.vehiclePlate}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                          {b.vehicleName}
                        </div>
                      </td>

                      {/* Alış Tarihi */}
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {b.pickupDate}
                      </td>

                      {/* İade Tarihi */}
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {b.returnDate}
                      </td>

                      {/* Süre (Gün) */}
                      <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                          {b.days} Gün
                        </span>
                      </td>

                      {/* Toplam Tutar */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>
                        ₺{b.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Ödeme Şekli */}
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                        💳 {b.paymentMethod || 'Kredi Kartı'}
                      </td>

                      {/* Durum */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: b.status === 'Aktif' ? '#f0fdf4' : (b.status === 'Tamamlandı' ? '#eff6ff' : '#fef2f2'),
                          color: b.status === 'Aktif' ? '#16a34a' : (b.status === 'Tamamlandı' ? '#2563eb' : '#dc2626'),
                          border: `1px solid ${b.status === 'Aktif' ? '#bbf7d0' : (b.status === 'Tamamlandı' ? '#bfdbfe' : '#fecaca')}`
                        }}>
                          {b.status === 'Aktif' ? '🟢 Aktif Kirada' : (b.status === 'Tamamlandı' ? '✅ İade Alındı' : '❌ İptal')}
                        </span>
                      </td>

                      {/* İşlemler */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handlePrintContractPDF(b)}
                            style={{ padding: '6px 8px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', color: '#c2410c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8rem', fontWeight: 600 }}
                            title="Sözleşmeyi Yazdır / PDF İndir"
                          >
                            <Printer size={13} /> Yazdır
                          </button>

                          <button
                            onClick={() => setSelectedBooking(b)}
                            style={{ padding: '6px 8px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#475569', cursor: 'pointer' }}
                            title="Detay Görüntüle"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(b)}
                            style={{ padding: '6px 8px', backgroundColor: '#f0fdf4', border: 'none', borderRadius: '6px', color: '#16a34a', cursor: 'pointer' }}
                            title="Düzenle"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteBooking(b.id, b.customerName)}
                            style={{ padding: '6px 8px', backgroundColor: '#fef2f2', border: 'none', borderRadius: '6px', color: '#dc2626', cursor: 'pointer' }}
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Unified All-in-One Kiralama Sözleşmesi Ekle / Düzenle */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={22} color="#e67e22" />
                  {editingBooking ? `Sözleşmeyi Düzenle: ${editingBooking.id}` : 'Yeni Araç Kiralama Sözleşmesi & Sürücü Kaydı'}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Sürücü bilgilerini, araç seçimini, kiralama tarihlerini ve tahsilat detaylarını tek formdan kaydedin.
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveBooking}>
              {/* BÖLÜM 1: SÜRÜCÜ / MÜŞTERİ BİLGİLERİ */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 700, color: '#e67e22', fontSize: '0.92rem' }}>
                  <User size={18} /> 1. SÜRÜCÜ & MÜŞTERİ BİLGİLERİ
                </div>

                {/* Existing Customer Auto-Fill Selector */}
                {customers.length > 0 && selectedExistingCustomerId !== 'EDIT' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                      Kayıtlı Sürücülerden Hızlı Seç (Opsiyonel)
                    </label>
                    <select
                      value={selectedExistingCustomerId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedExistingCustomerId(val);
                        if (val !== 'NEW') {
                          const c = customers.find(item => item.id === val);
                          if (c) {
                            setCustomerName(c.name);
                            setCustomerIdentity(c.identityOrPassport || '');
                            setCustomerPhone(c.phone || '');
                            setCustomerEmail(c.email || '');
                            setCustomerCountry(c.country || 'Türkiye');
                            setCustomerLicenseNo(c.licenseNo || '');
                            setCustomerLicenseClass(c.licenseClass || 'B');
                            setCustomerBirthDate(c.birthDate || '');
                          }
                        }
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', backgroundColor: '#ffffff' }}
                    >
                      <option value="NEW">➕ YENİ SÜRÜCÜ BİLGİLERİ GİR</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          👤 {c.name} - {c.phone} (TC/Pas: {c.identityOrPassport || '-'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Sürücü Adı Soyadı *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)} 
                      placeholder="Örn: Mehmet Can Demir" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      TCKN / Pasaport No
                    </label>
                    <input 
                      type="text" 
                      value={customerIdentity} 
                      onChange={(e) => setCustomerIdentity(e.target.value)} 
                      placeholder="11 Haneli TCKN veya Pasaport" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Telefon Numarası *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={customerPhone} 
                      onChange={(e) => setCustomerPhone(e.target.value)} 
                      placeholder="05XX XXX XX XX" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      E-Posta Adresi
                    </label>
                    <input 
                      type="email" 
                      value={customerEmail} 
                      onChange={(e) => setCustomerEmail(e.target.value)} 
                      placeholder="ornek@mail.com" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Ehliyet Belge No
                    </label>
                    <input 
                      type="text" 
                      value={customerLicenseNo} 
                      onChange={(e) => setCustomerLicenseNo(e.target.value)} 
                      placeholder="Örn: 987654" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Ehliyet Sınıfı
                    </label>
                    <select 
                      value={customerLicenseClass} 
                      onChange={(e) => setCustomerLicenseClass(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    >
                      <option value="B">B (Otomobil)</option>
                      <option value="A2">A2 (Motosiklet)</option>
                      <option value="C">C (Kamyon)</option>
                      <option value="D">D (Minibüs/Otobüs)</option>
                      <option value="BE">BE (Römorklu Otomobil)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BÖLÜM 2: ARAÇ VE KİRALAMA DETAYLARI */}
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 700, color: '#e67e22', fontSize: '0.92rem' }}>
                  <CarFront size={18} /> 2. KİRALANAN ARAÇ & TARİH DETAYLARI
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  {/* Araç Seçimi */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Kiralanacak Araç (Filo) *
                    </label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          🚗 {v.plate} — {v.brand} {v.model} ({v.year}) • {v.fuelType} • {v.transmission} • {v.currentKm} KM [{v.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Alış Tarihi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Alış / Başlangıç Tarihi *
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={pickupDate} 
                      onChange={(e) => setPickupDate(e.target.value)} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                    />
                  </div>

                  {/* İade Tarihi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      İade / Bitiş Tarihi *
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={returnDate} 
                      onChange={(e) => setReturnDate(e.target.value)} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                    />
                  </div>

                  {/* Gün Sayısı */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Kiralama Süresi (Gün)
                    </label>
                    <input 
                      type="number" 
                      value={customDays} 
                      onChange={(e) => setCustomDays(e.target.value)} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }} 
                    />
                  </div>

                  {/* Toplam Kiralama Tutarı */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
                      Toplam Kiralama Tutarı (TL) *
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={totalPrice} 
                      onChange={(e) => setTotalPrice(e.target.value)} 
                      placeholder="0.00"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '2px solid #e67e22', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }} 
                    />
                  </div>

                  {/* Ödeme Yöntemi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Ödeme Şekli
                    </label>
                    <select 
                      value={paymentMethod} 
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    >
                      <option value="Kredi Kartı">💳 Kredi Kartı / Mail Order</option>
                      <option value="Nakit">💵 Nakit (TL)</option>
                      <option value="Banka Havalesi / EFT">🏦 Banka Havalesi / EFT</option>
                      <option value="Döviz (EUR/USD)">💶 Döviz (EUR / USD)</option>
                    </select>
                  </div>

                  {/* Çıkış KM */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Çıkış Kilometresi (KM)
                    </label>
                    <input 
                      type="number" 
                      value={startKm} 
                      onChange={(e) => setStartKm(Number(e.target.value))} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                    />
                  </div>

                  {/* Yakıt Durumu */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Yakıt Depo Durumu
                    </label>
                    <select 
                      value={fuelLevel} 
                      onChange={(e) => setFuelLevel(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    >
                      <option value="4/4 (Dolu)">⛽ 4/4 (Full Dolu)</option>
                      <option value="3/4 Depo">⛽ 3/4 Depo</option>
                      <option value="1/2 (Yarım)">⛽ 1/2 (Yarım Depo)</option>
                      <option value="1/4 Depo">⛽ 1/4 (Çeyrek Depo)</option>
                      <option value="Çeyrek Altı / Işık Yanık">⛽ Çeyrek Altı</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Alış / Teslim Lokasyonu
                    </label>
                    <input 
                      type="text" 
                      value={pickupLocation} 
                      onChange={(e) => setPickupLocation(e.target.value)} 
                      placeholder="Alanya Merkez Ofis / Havalimanı" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      İade Lokasyonu
                    </label>
                    <input 
                      type="text" 
                      value={dropoffLocation} 
                      onChange={(e) => setDropoffLocation(e.target.value)} 
                      placeholder="Alanya Merkez Ofis / Havalimanı" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} 
                    />
                  </div>
                </div>
              </div>

              {/* BÖLÜM 3: DEPOZİTO VE NOTLAR */}
              <div style={{ backgroundColor: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fef3c7', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 700, color: '#b45309', fontSize: '0.92rem' }}>
                  <Coins size={18} /> 3. GÜVENCE DEPOZİTOSU & SÖZLEŞME NOTLARI
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>
                      Alınan Depozito / Provizyon (TL)
                    </label>
                    <input 
                      type="number" 
                      value={depositAmount} 
                      onChange={(e) => setDepositAmount(e.target.value)} 
                      placeholder="3000" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.95rem', fontWeight: 700, backgroundColor: '#ffffff' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#78350f', marginBottom: '4px' }}>
                      Sözleşme Notları (Opsiyonel)
                    </label>
                    <input 
                      type="text" 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Ekstra bebek koltuğu, HGS teminatı, ek sürücü kaydı vb." 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.88rem', backgroundColor: '#ffffff' }} 
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#e67e22',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(230, 126, 34, 0.3)'
                  }}
                >
                  {editingBooking ? 'Sözleşmeyi Güncelle' : 'Sözleşmeyi Onayla & Kes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Booking Detail Modal */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '26px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#e67e22', fontWeight: 800 }}>SÖZLEŞME DETAY KARTI</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedBooking.id} • {selectedBooking.customerName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Kiralanan Araç</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginTop: '2px' }}>🚗 {selectedBooking.vehiclePlate}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedBooking.vehicleName}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Kiralama Durumu</div>
                <div style={{ fontWeight: 800, color: selectedBooking.status === 'Aktif' ? '#16a34a' : '#2563eb', fontSize: '1rem', marginTop: '2px' }}>
                  {selectedBooking.status}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedBooking.days} Günlük Süre</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Teslim Alış Tarihi</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>{selectedBooking.pickupDate}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{selectedBooking.pickupLocation}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>İade Tarihi</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>{selectedBooking.returnDate}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{selectedBooking.dropoffLocation}</div>
              </div>

              <div style={{ backgroundColor: '#fff7ed', padding: '12px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: '0.75rem', color: '#c2410c' }}>Toplam Kira Bedeli</div>
                <div style={{ fontWeight: 800, color: '#c2410c', fontSize: '1.2rem', marginTop: '2px' }}>
                  ₺{selectedBooking.totalAmount.toLocaleString('tr-TR')}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9a3412' }}>{selectedBooking.paymentMethod}</div>
              </div>

              <div style={{ backgroundColor: '#fffbeb', padding: '12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.75rem', color: '#b45309' }}>Alınan Depozito</div>
                <div style={{ fontWeight: 800, color: '#b45309', fontSize: '1.2rem', marginTop: '2px' }}>
                  ₺{selectedBooking.depositAmount?.toLocaleString('tr-TR') || 0}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#92400e' }}>Provizyon Teminatı</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Sözleşme & Araç Notu:</div>
              <div style={{ fontSize: '0.85rem', color: '#334155' }}>{selectedBooking.notes || 'Özel not bulunmuyor.'}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button
                onClick={() => {
                  handlePrintContractPDF(selectedBooking);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  backgroundColor: '#e67e22',
                  color: '#ffffff',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <Printer size={16} /> Resmi Sözleşmeyi Yazdır
              </button>

              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
