"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  X, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar,
  CreditCard,
  Banknote,
  Send,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  Building2,
  Trash2,
  Edit2,
  Receipt,
  CarFront,
  KeyRound,
  ShieldAlert,
  Coins
} from 'lucide-react';
import { 
  RentCustomer, 
  initialRentCustomersData, 
  RentVehicle, 
  initialVehiclesData,
  RentalBooking,
  initialBookingsData
} from '@/data/rentCrmData';
import { 
  RentCariMovement,
  fetchRentCariMovementsFromCloud,
  fetchRentCustomersFromCloud,
  fetchRentVehiclesFromCloud,
  upsertRentCariMovementToCloud,
  deleteRentCariMovementFromCloud,
  clearRentCariMovementsFromCloud,
  upsertRentCustomerToCloud,
  deleteRentCustomerFromCloud
} from '@/lib/supabaseService';
import { generateModernPDF } from '@/lib/pdfReportGenerator';
import styles from '../layout.module.css';

export default function RentFinansPage() {
  const [movements, setMovements] = useState<RentCariMovement[]>([]);
  const [customers, setCustomers] = useState<RentCustomer[]>([]);
  const [vehicles, setVehicles] = useState<RentVehicle[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // Selected Customer / Driver Filter (Default: ALL or specific customer)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('ALL');
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');
  const [activeMovementTypeFilter, setActiveMovementTypeFilter] = useState<string>('Tümü');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState<'KIRA_BORC' | 'TAHSILAT' | 'DEPOZITO_AL' | 'DEPOZITO_IADE' | 'GIDER' | 'DEVIR'>('KIRA_BORC');
  const [editingMovement, setEditingMovement] = useState<RentCariMovement | null>(null);

  // Form States
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formReceiptNo, setFormReceiptNo] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formVehiclePlate, setFormVehiclePlate] = useState('');
  const [formVehicleName, setFormVehicleName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMovementType, setFormMovementType] = useState<RentCariMovement['movementType']>('Kiralama Bedeli Tahakkuku');
  const [formAmount, setFormAmount] = useState('');
  const [devirDirection, setDevirDirection] = useState<'BORC' | 'ALACAK'>('BORC');
  const [formNotes, setFormNotes] = useState('');

  // Hydration-safe initial load from Supabase Cloud (with Local fallback)
  useEffect(() => {
    setIsMounted(true);
    async function loadInitialData() {
      try {
        const [cloudMovs, cloudCusts, cloudVehs] = await Promise.all([
          fetchRentCariMovementsFromCloud(),
          fetchRentCustomersFromCloud(),
          fetchRentVehiclesFromCloud()
        ]);
        if (cloudMovs) setMovements(cloudMovs);
        if (cloudCusts) setCustomers(cloudCusts);
        if (cloudVehs) setVehicles(cloudVehs);
      } catch (err) {
        console.error('Supabase rent finans initial load error:', err);
      }
    }
    loadInitialData();
  }, []);

  const [modalCustomerSearch, setModalCustomerSearch] = useState('');

  // Otomatik Sıralı Fiş No Üretici (R000001'den başlar, sırayla artar)
  const getNextReceiptNo = (currentMovements: RentCariMovement[]): string => {
    if (!currentMovements || currentMovements.length === 0) return 'R000001';
    
    const numbers = currentMovements
      .map(m => {
        const match = m.receiptNo?.match(/^R(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : currentMovements.length;
    const nextNum = maxNum + 1;
    return `R${String(nextNum).padStart(6, '0')}`;
  };

  // Open Modal with clean preset
  const handleOpenAddModal = (action: 'KIRA_BORC' | 'TAHSILAT' | 'DEPOZITO_AL' | 'DEPOZITO_IADE' | 'GIDER' | 'DEVIR', editItem?: RentCariMovement) => {
    setModalActionType(action);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDueDate('');
    setFormAmount('');
    setFormNotes('');
    setModalCustomerSearch('');

    if (editItem) {
      setEditingMovement(editItem);
      // Parse DD.MM.YYYY to YYYY-MM-DD for date input
      const dateParts = editItem.date.split('.');
      if (dateParts.length === 3) {
        setFormDate(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      }
      if (editItem.dueDate) {
        const dueParts = editItem.dueDate.split('.');
        if (dueParts.length === 3) {
          setFormDueDate(`${dueParts[2]}-${dueParts[1]}-${dueParts[0]}`);
        }
      }
      setFormReceiptNo(editItem.receiptNo || '');
      setFormCustomerId(editItem.customerId);
      setFormCustomerName(editItem.customerName);
      setFormVehiclePlate(editItem.vehiclePlate || '');
      setFormVehicleName(editItem.vehicleName || '');
      setFormDescription(editItem.description);
      setFormMovementType(editItem.movementType);
      setFormAmount(String(editItem.debitAmount > 0 ? editItem.debitAmount : editItem.creditAmount));
      setDevirDirection(editItem.debitAmount > 0 ? 'BORC' : 'ALACAK');
      setFormNotes(editItem.notes || '');
    } else {
      setEditingMovement(null);
      const generatedNo = getNextReceiptNo(movements);
      setFormReceiptNo(generatedNo);

      // Pre-select customer if one is filtered
      if (selectedCustomerId !== 'ALL') {
        const cust = customers.find(c => c.id === selectedCustomerId || c.name.toLowerCase() === selectedCustomerId.toLowerCase());
        if (cust) {
          setFormCustomerId(cust.id);
          setFormCustomerName(cust.name);
        } else {
          setFormCustomerId(selectedCustomerId);
          setFormCustomerName(selectedCustomerId);
        }
      } else if (customers.length > 0) {
        setFormCustomerId(customers[0].id);
        setFormCustomerName(customers[0].name);
      } else {
        setFormCustomerId('');
        setFormCustomerName('');
      }

      // Default presets based on action
      if (action === 'KIRA_BORC') {
        setFormMovementType('Kiralama Bedeli Tahakkuku');
        setFormDescription('Araç Kiralama Bedeli Tahakkuku');
      } else if (action === 'TAHSILAT') {
        setFormMovementType('Kira Tahsilatı (Kredi Kartı)');
        setFormDescription('Kira Tahsilatı (Kredi Kartı)');
      } else if (action === 'DEPOZITO_AL') {
        setFormMovementType('Depozito / Provizyon Tahsilatı');
        setFormDescription('Kiralama Güvence Depozitosu Alındı');
      } else if (action === 'DEPOZITO_IADE') {
        setFormMovementType('Depozito İadesi');
        setFormDescription('Kiralama Güvence Depozitosu İade Edildi');
      } else if (action === 'GIDER') {
        setFormMovementType('Araç Bakım & Servis Gideri');
        setFormDescription('Araç Bakım / Servis / Akaryakıt Gideri');
      } else if (action === 'DEVIR') {
        setFormMovementType('Tarih Öncesi Devir Bakiye');
        setFormDescription('Geçmiş Dönemden Devreden Bakiye');
      }
    }

    setIsAddModalOpen(true);
  };

  // Save or Update Movement
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName || !formAmount || isNaN(Number(formAmount))) {
      alert('Lütfen geçerli bir müşteri adı ve tutar giriniz.');
      return;
    }

    const numAmount = Math.abs(Number(formAmount));
    let dAmount = 0;
    let cAmount = 0;

    // Movement direction logic:
    // Borç: Müşterinin bize olan borcunu artırır (+)
    // Alacak / Tahsilat: Müşterinin borcunu düşürür (-)
    if (modalActionType === 'KIRA_BORC' || formMovementType === 'Kiralama Bedeli Tahakkuku' || formMovementType === 'Ekstra Km / Yakıt / Temizlik Farkı' || formMovementType === 'Trafik Cezası / HGS Geçişi' || formMovementType === 'Hasar / Onarım Bedeli Tahakkuku') {
      dAmount = numAmount;
      cAmount = 0;
    } else if (modalActionType === 'DEPOZITO_IADE' || formMovementType === 'Depozito İadesi' || formMovementType === 'Cari Mahsup Çıkışı') {
      // Depozito İadesi müşteriye ödeme yapılmasıdır (Borç kapanışı / Firma çıkışı)
      dAmount = numAmount;
      cAmount = 0;
    } else if (modalActionType === 'GIDER' || formMovementType === 'Araç Bakım & Servis Gideri' || formMovementType === 'Kasko / Muayene / Sigorta Gideri') {
      dAmount = 0;
      cAmount = numAmount;
    } else if (modalActionType === 'DEVIR' || formMovementType === 'Tarih Öncesi Devir Bakiye') {
      if (devirDirection === 'BORC') {
        dAmount = numAmount;
        cAmount = 0;
      } else {
        dAmount = 0;
        cAmount = numAmount;
      }
    } else {
      // Tahsilatlar & Depozito Alımları
      dAmount = 0;
      cAmount = numAmount;
    }

    // Format date string to DD.MM.YYYY
    const formattedDate = formDate ? formDate.split('-').reverse().join('.') : new Date().toLocaleDateString('tr-TR');
    const formattedDueDate = formDueDate ? formDueDate.split('-').reverse().join('.') : undefined;

    // Auto create customer in rent customer list if new
    let custId = formCustomerId;
    const existingCust = customers.find(c => c.id === custId || c.name.toLowerCase() === formCustomerName.trim().toLowerCase());
    if (!existingCust) {
      custId = `RCUST-${Math.floor(100 + Math.random() * 900)}`;
      const newCust: RentCustomer = {
        id: custId,
        name: formCustomerName.trim(),
        identityOrPassport: '-',
        country: 'Türkiye',
        phone: '-',
        email: '-',
        licenseNo: '-',
        licenseClass: 'B',
        totalRentals: 1
      };
      const updatedCustList = [newCust, ...customers];
      setCustomers(updatedCustList);
      upsertRentCustomerToCloud(newCust);
    } else {
      custId = existingCust.id;
    }

    const newMov: RentCariMovement = {
      id: editingMovement ? editingMovement.id : `RCAR-${Math.floor(1000 + Math.random() * 9000)}`,
      date: formattedDate,
      dueDate: formattedDueDate || undefined,
      receiptNo: formReceiptNo || '-',
      customerId: custId,
      customerName: formCustomerName.trim(),
      vehiclePlate: formVehiclePlate || undefined,
      vehicleName: formVehicleName || undefined,
      description: formDescription,
      movementType: formMovementType,
      debitAmount: dAmount,
      creditAmount: cAmount,
      notes: formNotes || undefined
    };

    if (editingMovement) {
      setMovements(movements.map(m => m.id === editingMovement.id ? newMov : m));
    } else {
      setMovements([...movements, newMov]);
    }
    // Async Cloud Save
    upsertRentCariMovementToCloud(newMov);

    setIsAddModalOpen(false);
  };

  // Delete Movement
  const handleDeleteMovement = (id: string, desc: string) => {
    if (confirm(`"${desc}" hareketini silmek istediğinize emin misiniz?`)) {
      setMovements(movements.filter(m => m.id !== id));
      deleteRentCariMovementFromCloud(id);
    }
  };

  // Delete Customer and all their movements
  const handleDeleteCustomer = (customerIdToDelete: string) => {
    const targetCust = customers.find(c => c.id === customerIdToDelete);
    const name = targetCust?.name || customerIdToDelete;

    if (confirm(`"${name}" sürücüsünü/müşterisini ve bu müşteriye ait tüm rent cari hareketlerini sistemden tamamen silmek istediğinize emin misiniz?`)) {
      setCustomers(customers.filter(c => c.id !== customerIdToDelete && c.name.toLowerCase() !== customerIdToDelete.toLowerCase()));
      setMovements(movements.filter(m => m.customerId !== customerIdToDelete && m.customerName.toLowerCase() !== name.toLowerCase()));

      deleteRentCustomerFromCloud(customerIdToDelete);

      setSelectedCustomerId('ALL');
      alert(`"${name}" sürücüsü ve tüm cari hareketleri başarıyla silindi.`);
    }
  };

  // Filtered movements based on selected customer, vehicle & search
  const filteredMovements = movements.filter(m => {
    const matchesCustomer = selectedCustomerId === 'ALL' || m.customerId === selectedCustomerId || m.customerName.toLowerCase() === selectedCustomerId.toLowerCase();
    const matchesVehicle = selectedVehicleFilter === 'ALL' || (m.vehiclePlate && m.vehiclePlate === selectedVehicleFilter);
    const matchesSearch = 
      m.description.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
      (m.receiptNo && m.receiptNo.toLowerCase().includes(tableSearchTerm.toLowerCase())) ||
      (m.vehiclePlate && m.vehiclePlate.toLowerCase().includes(tableSearchTerm.toLowerCase())) ||
      m.movementType.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
      m.customerName.toLowerCase().includes(tableSearchTerm.toLowerCase());
    
    const matchesType = activeMovementTypeFilter === 'Tümü' || m.movementType === activeMovementTypeFilter;
    return matchesCustomer && matchesVehicle && matchesSearch && matchesType;
  });

  // Calculate Cumulative Running Balances for each row
  let runningBalance = 0;
  const movementsWithBalance = filteredMovements.map(m => {
    runningBalance += (m.debitAmount - m.creditAmount);
    return {
      ...m,
      currentBalance: runningBalance
    };
  });

  // Totals
  const totalDebit = filteredMovements.reduce((sum, m) => sum + m.debitAmount, 0);
  const totalCredit = filteredMovements.reduce((sum, m) => sum + m.creditAmount, 0);
  const netRemainingBalance = totalDebit - totalCredit;

  // Deposit Pool Calculation
  const totalDepositsCollected = filteredMovements
    .filter(m => m.movementType === 'Depozito / Provizyon Tahsilatı')
    .reduce((sum, m) => sum + m.creditAmount, 0);
  const totalDepositsRefunded = filteredMovements
    .filter(m => m.movementType === 'Depozito İadesi')
    .reduce((sum, m) => sum + m.debitAmount, 0);
  const activeDepositPool = Math.max(0, totalDepositsCollected - totalDepositsRefunded);

  // Selected customer name for title
  const currentCustomerObj = customers.find(c => c.id === selectedCustomerId);
  const headerCustomerTitle = selectedCustomerId === 'ALL' 
    ? 'GENEL RENT A CAR CARİ HESAP EKSTRESİ (TÜM MÜŞTERİLER & FİLO)' 
    : (currentCustomerObj ? `${currentCustomerObj.name.toUpperCase()} - KİRALAMA HESAP ÖZETİ` : `${selectedCustomerId.toUpperCase()} - HESAP ÖZETİ`);

  // Export to Branded PDF (Sürücü & Araç Bilgili Resmi Ekstre Formatı)
  const handleExportPDF = () => {
    const matchedCustomer = customers.find(c => c.id === selectedCustomerId || c.name.toLowerCase() === selectedCustomerId.toLowerCase());
    
    generateModernPDF({
      title: headerCustomerTitle,
      subtitle: 'Elisam Rent A Car • Filo & Müşteri Cari Hesap Ekstresi, Kiralama ve Tahsilat Dökümü',
      category: 'RENT A CAR FİLO',
      dateRange: `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
      customerInfo: selectedCustomerId !== 'ALL' ? {
        name: matchedCustomer?.name || selectedCustomerId,
        type: `Ehliyet: ${matchedCustomer?.licenseNo || '-'} (${matchedCustomer?.licenseClass || 'B'})`,
        identityNo: matchedCustomer?.identityOrPassport || '-',
        phone: matchedCustomer?.phone || '-',
        address: `${matchedCustomer?.country || 'Türkiye'} / Alanya Ofis`
      } : (movements.length > 0 ? {
        name: `Genel Filo Dökümü (${customers.length} Kayıtlı Sürücü)`,
        type: 'Konsolide Kiralama Cari Ekstresi',
        phone: '0551 438 77 71',
        address: 'Alanya / Antalya'
      } : undefined),
      kpis: [
        { label: 'TOPLAM KİRALAMA BORCU', value: `${totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, color: '#1e3a8a' },
        { label: 'TOPLAM TAHSİLAT & DEPOZİTO', value: `${totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, color: '#16a34a' },
        { label: 'AKTİF DEPOZİTO HAVUZU', value: `${activeDepositPool.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, color: '#d97706' },
        { 
          label: 'NET BAKİYE', 
          value: `${Math.abs(netRemainingBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ${netRemainingBalance > 0 ? '(Borçlu)' : (netRemainingBalance < 0 ? '(Alacaklı)' : '(Kapalı)')}`, 
          color: netRemainingBalance > 0 ? '#dc2626' : (netRemainingBalance < 0 ? '#2563eb' : '#16a34a') 
        }
      ],
      headers: selectedCustomerId === 'ALL'
        ? ['Tarih', 'Vade', 'Fiş No', 'Sürücü / Müşteri', 'Araç / Plaka', 'İşlem Türü', 'Açıklama', 'Borç (₺)', 'Alacak (₺)', 'Bakiye (₺)']
        : ['Tarih', 'Vade', 'Fiş No', 'Araç / Plaka', 'İşlem Türü', 'Açıklama', 'Borç (₺)', 'Alacak (₺)', 'Bakiye (₺)'],
      rows: movementsWithBalance.map(m => selectedCustomerId === 'ALL' ? [
        m.date,
        m.dueDate || '-',
        m.receiptNo || '-',
        m.customerName,
        m.vehiclePlate ? `${m.vehiclePlate} ${m.vehicleName ? `(${m.vehicleName})` : ''}` : '-',
        m.movementType,
        m.description,
        m.debitAmount > 0 ? `${m.debitAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-',
        m.creditAmount > 0 ? `${m.creditAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-',
        `${(m as any).currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
      ] : [
        m.date,
        m.dueDate || '-',
        m.receiptNo || '-',
        m.vehiclePlate ? `${m.vehiclePlate} ${m.vehicleName ? `(${m.vehicleName})` : ''}` : '-',
        m.movementType,
        m.description,
        m.debitAmount > 0 ? `${m.debitAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-',
        m.creditAmount > 0 ? `${m.creditAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-',
        `${(m as any).currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
      ]),
      summaryNotes: [
        `Bu ekstre Elisam Rent A Car CRM sistemi tarafından ${new Date().toLocaleString('tr-TR')} tarihinde elektronik ortamda üretilmiştir.`,
        `Aktif kiralama sözleşmeleri ve provizyon depozito bakiyeleri yürüyen bakiye hesabına dahildir.`
      ]
    });
  };

  // Export to Excel CSV
  const handleExportCSV = () => {
    let csv = '\uFEFF';
    csv += 'Tarih;Vade Tarihi;Fiş No;Sürücü / Müşteri;Araç Plakası;Araç Modeli;Hareket Türü;Açıklama;Borç (TL);Alacak / Tahsilat (TL);Yürüyen Bakiye (TL);Notlar\n';
    
    movementsWithBalance.forEach(m => {
      csv += `"${m.date}";"${m.dueDate || ''}";"${m.receiptNo || ''}";"${m.customerName}";"${m.vehiclePlate || ''}";"${m.vehicleName || ''}";"${m.movementType}";"${m.description}";"${m.debitAmount}";"${m.creditAmount}";"${(m as any).currentBalance}";"${m.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Elisam_Rent_Cari_Ekstresi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Clear all movements
  const handleClearAllMovements = () => {
    if (confirm('Tüm rent cari ekstre hareketlerini temizlemek ve sıfırlamak istediğinize emin misiniz?')) {
      setMovements([]);
      clearRentCariMovementsFromCloud();
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CarFront size={28} color="#e67e22" /> Rent A Car Cari Hesap Ekstresi & Finans Defteri
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px', margin: 0 }}>
            Sürücü ve filo kiralama borçlandırmaları, depozito/provizyon havuzu, tahsilatlar, hasar/ceza takibi ve anlık bakiyeler.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              backgroundColor: '#e67e22',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} /> PDF Ekstre Al / Yazdır
          </button>

          <button 
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              backgroundColor: '#059669',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <Download size={16} /> Excel (CSV)
          </button>

          {movements.length > 0 && (
            <button 
              onClick={handleClearAllMovements}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                borderRadius: '10px',
                border: '1px solid #fecaca',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              title="Tüm hareketleri sıfırlar"
            >
              <Trash2 size={15} /> Sıfırla
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Toplam Borç Tahakkuku */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#64748b' }}>TOPLAM KİRALAMA BORÇ</span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
            ₺{totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', fontWeight: 500 }}>
            Kiralama, Km Farkı & Ekstralar
          </div>
        </div>

        {/* Toplam Tahsilat */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#64748b' }}>TAHSİL EDİLEN KİRA & DEPOZİTO</span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16a34a' }}>
            ₺{totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '4px', fontWeight: 500 }}>
            Nakit, Kredi Kartı, Havale & Döviz
          </div>
        </div>

        {/* Aktif Depozito Havuzu */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#64748b' }}>AKTİF DEPOZİTO HAVUZU</span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#fffbeb', color: '#d97706' }}>
              <Coins size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d97706' }}>
            ₺{activeDepositPool.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px', fontWeight: 500 }}>
            Sözleşme Sonu İade Bekleyen Provizyon
          </div>
        </div>

        {/* Net Kalan Bakiye */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          padding: '18px 20px', 
          border: `2px solid ${netRemainingBalance > 0 ? '#fecaca' : '#bbf7d0'}`, 
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: netRemainingBalance > 0 ? '#dc2626' : '#16a34a' }}>
              {netRemainingBalance > 0 ? 'NET ALACAĞIMIZ (BORÇLU)' : 'BAKİYE DURUMU'}
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: netRemainingBalance > 0 ? '#fef2f2' : '#f0fdf4', color: netRemainingBalance > 0 ? '#dc2626' : '#16a34a' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: netRemainingBalance > 0 ? '#dc2626' : '#16a34a' }}>
            ₺{Math.abs(netRemainingBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
            {netRemainingBalance > 0 ? 'Müşteriden tahsil edilecek tutar' : (netRemainingBalance === 0 ? 'Hesap Tamamen Kapalı (0 TL)' : 'Müşteri Fazla Ödemeli')}
          </div>
        </div>
      </div>

      {/* Action Buttons Hub */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px', 
        flexWrap: 'wrap', 
        backgroundColor: '#ffffff', 
        padding: '14px 18px', 
        borderRadius: '14px', 
        border: '1px solid #e2e8f0' 
      }}>
        <button
          onClick={() => handleOpenAddModal('KIRA_BORC')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Kiralama Borç Kaydı Ekle
        </button>

        <button
          onClick={() => handleOpenAddModal('TAHSILAT')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <CreditCard size={16} /> Kira Tahsilatı Ekle (Nakit / KK / Havale)
        </button>

        <button
          onClick={() => handleOpenAddModal('DEPOZITO_AL')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#f59e0b',
            color: '#ffffff',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <ShieldCheck size={16} /> Depozito Alındı
        </button>

        <button
          onClick={() => handleOpenAddModal('DEPOZITO_IADE')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#6366f1',
            color: '#ffffff',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <Coins size={16} /> Depozito İade Et
        </button>

        <button
          onClick={() => handleOpenAddModal('GIDER')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <Banknote size={16} /> Araç Gideri / Servis
        </button>

        <button
          onClick={() => handleOpenAddModal('DEVIR')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#f8fafc',
            color: '#475569',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          <Clock size={16} /> Devir Bakiyesi Gir
        </button>
      </div>

      {/* Customer & Filter Header Card */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '16px', 
        padding: '18px 20px', 
        border: '1px solid #e2e8f0', 
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          {/* Customer Selection Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
            <User size={20} color="#e67e22" />
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                Sürücü / Müşteri Hesabı Seçimi
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">🏢 TÜM SÜRÜCÜLER & MÜŞTERİLER (GENEL FİLO EKSTRESİ)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    👤 {c.name} {c.identityOrPassport && c.identityOrPassport !== '-' ? `(TC/Pasaport: ${c.identityOrPassport})` : ''} - {c.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Selection Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
            <CarFront size={20} color="#e67e22" />
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                Araç / Plaka Filtresi
              </label>
              <select
                value={selectedVehicleFilter}
                onChange={(e) => setSelectedVehicleFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">🚗 TÜM ARAÇLAR (FİLO)</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.plate}>
                    🚗 {v.plate} ({v.brand} {v.model})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Delete Customer Button */}
          {selectedCustomerId !== 'ALL' && (
            <button
              onClick={() => handleDeleteCustomer(selectedCustomerId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                backgroundColor: '#fff1f2',
                color: '#e11d48',
                border: '1px solid #fecdd3',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '18px'
              }}
              title="Bu sürücüyü ve tüm cari/finans hareketlerini sistemden tamamen siler"
            >
              <Trash2 size={16} /> Bu Müşteriyi & Kayıtlarını Sil
            </button>
          )}
        </div>

        {/* Search and Category Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '7px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#94a3b8" />
            <input 
              type="text"
              placeholder="Fiş No, Araç Plakası, Açıklama veya Müşteri Ara..."
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.88rem', width: '100%', color: '#1e293b' }}
            />
            {tableSearchTerm && (
              <button onClick={() => setTableSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              'Tümü', 
              'Kiralama Bedeli Tahakkuku', 
              'Kira Tahsilatı (Kredi Kartı)', 
              'Kira Tahsilatı (Nakit)', 
              'Depozito / Provizyon Tahsilatı',
              'Depozito İadesi'
            ].map(type => (
              <button
                key={type}
                onClick={() => setActiveMovementTypeFilter(type)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeMovementTypeFilter === type ? 'none' : '1px solid #e2e8f0',
                  backgroundColor: activeMovementTypeFilter === type ? '#e67e22' : '#ffffff',
                  color: activeMovementTypeFilter === type ? '#ffffff' : '#64748b'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Cari Ledger Table */}
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
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Tarih</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Vade</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Fiş No</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Sürücü / Müşteri</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Araç / Plaka</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>İşlem Türü</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Açıklama</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#dc2626', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Borç (TL)</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#16a34a', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Alacak / Tahsilat (TL)</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Yürüyen Bakiye (TL)</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {movementsWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    <Receipt size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>Bu filtreye uygun herhangi bir cari hareket bulunamadı.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Yukarıdaki butonları kullanarak yeni kiralama borcu veya tahsilat ekleyebilirsiniz.</p>
                  </td>
                </tr>
              ) : (
                movementsWithBalance.map((m, idx) => {
                  const isDebit = m.debitAmount > 0;
                  const balance = (m as any).currentBalance;

                  return (
                    <tr 
                      key={m.id || idx}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Tarih */}
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        {m.date}
                      </td>

                      {/* Vade Tarihi */}
                      <td style={{ padding: '12px 14px', color: m.dueDate ? '#d97706' : '#94a3b8', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {m.dueDate || '-'}
                      </td>

                      {/* Fiş / Belge No */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#e67e22', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        <span style={{ backgroundColor: '#fff7ed', padding: '3px 7px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                          {m.receiptNo || '-'}
                        </span>
                      </td>

                      {/* Sürücü / Müşteri Adı */}
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="#e67e22" />
                          <span>{m.customerName}</span>
                        </div>
                      </td>

                      {/* Araç Plakası */}
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {m.vehiclePlate ? (
                          <span style={{ backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}>
                            🚗 {m.vehiclePlate}
                          </span>
                        ) : '-'}
                      </td>

                      {/* İşlem / Hareket Türü */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: 
                            m.movementType.includes('Borç') || m.movementType.includes('Tahakkuk') ? '#fef2f2' :
                            m.movementType.includes('Depozito / Provizyon') ? '#fffbeb' :
                            m.movementType.includes('İade') ? '#e0e7ff' :
                            m.movementType.includes('Gider') ? '#f0f9ff' :
                            '#f0fdf4',
                          color: 
                            m.movementType.includes('Borç') || m.movementType.includes('Tahakkuk') ? '#dc2626' :
                            m.movementType.includes('Depozito / Provizyon') ? '#b45309' :
                            m.movementType.includes('İade') ? '#4338ca' :
                            m.movementType.includes('Gider') ? '#0369a1' :
                            '#16a34a',
                          border: `1px solid ${
                            m.movementType.includes('Borç') || m.movementType.includes('Tahakkuk') ? '#fecaca' :
                            m.movementType.includes('Depozito / Provizyon') ? '#fde68a' :
                            m.movementType.includes('İade') ? '#c7d2fe' :
                            m.movementType.includes('Gider') ? '#bae6fd' :
                            '#bbf7d0'
                          }`
                        }}>
                          {m.movementType}
                        </span>
                      </td>

                      {/* Açıklama */}
                      <td style={{ padding: '12px 16px', color: '#334155', maxWidth: '280px', lineHeight: 1.4 }}>
                        <div>{m.description}</div>
                        {m.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                            Not: {m.notes}
                          </div>
                        )}
                      </td>

                      {/* Borç Tutarı */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: isDebit ? '#dc2626' : '#cbd5e1', fontSize: '0.92rem' }}>
                        {isDebit ? `₺${m.debitAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>

                      {/* Alacak / Tahsilat Tutarı */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: !isDebit && m.creditAmount > 0 ? '#16a34a' : '#cbd5e1', fontSize: '0.92rem' }}>
                        {!isDebit && m.creditAmount > 0 ? `₺${m.creditAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>

                      {/* Anlık Yürüyen Bakiye */}
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'right', 
                        fontWeight: 800, 
                        fontSize: '0.94rem',
                        color: balance > 0 ? '#dc2626' : (balance < 0 ? '#16a34a' : '#64748b')
                      }}>
                        ₺{Math.abs(balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        <span style={{ fontSize: '0.72rem', marginLeft: '4px', fontWeight: 600 }}>
                          {balance > 0 ? '(B)' : (balance < 0 ? '(A)' : '')}
                        </span>
                      </td>

                      {/* Aksiyonlar */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenAddModal(isDebit ? 'KIRA_BORC' : 'TAHSILAT', m)}
                            style={{ padding: '5px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#475569', cursor: 'pointer' }}
                            title="Düzenle"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMovement(m.id, m.description)}
                            style={{ padding: '5px', backgroundColor: '#fef2f2', border: 'none', borderRadius: '6px', color: '#dc2626', cursor: 'pointer' }}
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

            {/* Table Footer Totals */}
            {movementsWithBalance.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 800 }}>
                  <td colSpan={7} style={{ padding: '14px 16px', textAlign: 'right', color: '#0f172a', fontSize: '0.92rem' }}>
                    TOPLAM GENEL TOPLAMLAR:
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#dc2626', fontSize: '1rem' }}>
                    ₺{totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#16a34a', fontSize: '1rem' }}>
                    ₺{totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ 
                    padding: '14px 16px', 
                    textAlign: 'right', 
                    fontSize: '1.05rem', 
                    color: netRemainingBalance > 0 ? '#dc2626' : '#16a34a' 
                  }}>
                    ₺{Math.abs(netRemainingBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    <span style={{ fontSize: '0.78rem', marginLeft: '4px' }}>
                      {netRemainingBalance > 0 ? '(BORÇ)' : '(KAPALI)'}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL: Add / Edit Movement */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingMovement ? 'Cari Hareketi Düzenle' : (
                  modalActionType === 'KIRA_BORC' ? '🚗 Yeni Kiralama Borç Tahakkuku Ekle' :
                  modalActionType === 'TAHSILAT' ? '💳 Yeni Kira Tahsilatı Kaydet' :
                  modalActionType === 'DEPOZITO_AL' ? '🛡️ Kiralama Depozitosu / Provizyon Alındı' :
                  modalActionType === 'DEPOZITO_IADE' ? '🪙 Depozito İadesi Kaydet' :
                  modalActionType === 'GIDER' ? '🔧 Araç Gideri / Servis Ödemesi' :
                  '⚖️ Devir Bakiyesi Girişi'
                )}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMovement}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                {/* Tarih */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    İşlem Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                {/* Vade / İade Tarihi */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Vade / İade Tarihi
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Fiş / Sözleşme No */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Fiş / Dekont / Sözleşme No (Otomatik Sıralı)
                </label>
                <input
                  type="text"
                  value={formReceiptNo}
                  onChange={(e) => setFormReceiptNo(e.target.value)}
                  placeholder="örn: R000001"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#e67e22' }}
                />
              </div>

              {/* Sürücü / Müşteri Adı */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Sürücü / Müşteri Adı *
                </label>
                <input
                  type="text"
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  placeholder="Müşteri adını yazın veya aşağıdaki listeden seçin"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                />
                
                {/* Hızlı Müşteri Seçici */}
                {customers.length > 0 && (
                  <div style={{ marginTop: '6px', maxHeight: '110px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', padding: '4px' }}>
                    {customers
                      .filter(c => !formCustomerName || c.name.toLowerCase().includes(formCustomerName.toLowerCase()))
                      .slice(0, 5)
                      .map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setFormCustomerId(c.id);
                            setFormCustomerName(c.name);
                          }}
                          style={{
                            padding: '6px 8px',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ fontWeight: 600 }}>👤 {c.name}</span>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{c.phone}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Araç / Plaka Seçimi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Araç Plakası
                  </label>
                  <input
                    type="text"
                    value={formVehiclePlate}
                    onChange={(e) => setFormVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="örn: 07 ELS 07"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Araç Modeli / Filo
                  </label>
                  <select
                    value={formVehiclePlate}
                    onChange={(e) => {
                      const veh = vehicles.find(v => v.plate === e.target.value);
                      if (veh) {
                        setFormVehiclePlate(veh.plate);
                        setFormVehicleName(`${veh.brand} ${veh.model}`);
                      }
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="">Araç Seçiniz (Opsiyonel)</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.plate}>
                        {v.plate} - {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hareket Türü */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  İşlem / Hareket Türü *
                </label>
                <select
                  value={formMovementType}
                  onChange={(e) => setFormMovementType(e.target.value as RentCariMovement['movementType'])}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  <option value="Kiralama Bedeli Tahakkuku">🚗 Kiralama Bedeli Tahakkuku (Borç)</option>
                  <option value="Kira Tahsilatı (Kredi Kartı)">💳 Kira Tahsilatı (Kredi Kartı)</option>
                  <option value="Kira Tahsilatı (Nakit)">💵 Kira Tahsilatı (Nakit)</option>
                  <option value="Kira Tahsilatı (Banka Havale/EFT)">🏦 Kira Tahsilatı (Banka Havale/EFT)</option>
                  <option value="Kira Tahsilatı (Döviz EUR/USD)">💶 Kira Tahsilatı (Döviz EUR/USD)</option>
                  <option value="Depozito / Provizyon Tahsilatı">🛡️ Depozito / Provizyon Tahsilatı (Alacak)</option>
                  <option value="Depozito İadesi">🪙 Depozito İadesi (Sözleşme Sonu Çıkış)</option>
                  <option value="Ekstra Km / Yakıt / Temizlik Farkı">⛽ Ekstra Km / Yakıt / Temizlik Farkı (Borç)</option>
                  <option value="Trafik Cezası / HGS Geçişi">🛑 Trafik Cezası / HGS Geçişi (Borç)</option>
                  <option value="Hasar / Onarım Bedeli Tahakkuku">⚠️ Hasar / Onarım Bedeli Tahakkuku (Borç)</option>
                  <option value="Araç Bakım & Servis Gideri">🔧 Araç Bakım & Servis Gideri</option>
                  <option value="Kasko / Muayene / Sigorta Gideri">📑 Kasko / Muayene / Sigorta Gideri</option>
                  <option value="Cari Mahsup Çıkışı">🔄 Cari Mahsup Çıkışı</option>
                  <option value="Tarih Öncesi Devir Bakiye">⚖️ Tarih Öncesi Devir Bakiye</option>
                </select>
              </div>

              {/* Devir Yönü (Eğer Devir Seçiliyse) */}
              {formMovementType === 'Tarih Öncesi Devir Bakiye' && (
                <div style={{ marginBottom: '14px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Devir Bakiyesi Yönü
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}>
                      <input 
                        type="radio" 
                        name="devirYonu" 
                        checked={devirDirection === 'BORC'} 
                        onChange={() => setDevirDirection('BORC')} 
                      />
                      Müşteri Bize Borçlu (+ Borç)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer', fontWeight: 600, color: '#16a34a' }}>
                      <input 
                        type="radio" 
                        name="devirYonu" 
                        checked={devirDirection === 'ALACAK'} 
                        onChange={() => setDevirDirection('ALACAK')} 
                      />
                      Müşteriye Alacaklıyız (- Alacak)
                    </label>
                  </div>
                </div>
              )}

              {/* Tutar */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  İşlem Tutarı (TL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}
                />
              </div>

              {/* Açıklama */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Açıklama *
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="örn: 3 Günlük Renault Clio Kiralama Bedeli"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Ek Notlar */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Özel Notlar (Opsiyonel)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="İşleme dair özel notlar..."
                  rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '10px 16px',
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
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#e67e22',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {editingMovement ? 'Güncellemeyi Kaydet' : 'Hareketi İşle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
