"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  Download, 
  X, 
  ShieldCheck, 
  Eye, 
  User, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Printer, 
  Send,
  MessageCircle,
  Car,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ClipboardPaste,
  Building2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { 
  Policy, 
  Customer, 
  initialPoliciesData, 
  initialCustomersData,
  Installment
} from '@/data/crmData';
import styles from '../layout.module.css';

export default function PolicelerPage() {
  const [policies, setPolicies] = useState<Policy[]>(initialPoliciesData);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomersData);
  const [isMounted, setIsMounted] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Tümü' | 'Aktifler' | 'Yaklaşanlar' | 'Bitenler' | 'Borcu Kalanlar'>('Tümü');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // Auto-paste / Form Mode
  const [addMode, setAddMode] = useState<'Manuel' | 'Otomatik'>('Manuel');
  const [autoText, setAutoText] = useState('');

  // Form State - Müşteri Bilgileri
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState('NEW');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<'Bireysel' | 'Kurumsal'>('Bireysel');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerTc, setCustomerTc] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerBirthDate, setCustomerBirthDate] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Form State - Poliçe Bilgileri
  const [policyNo, setPolicyNo] = useState('');
  const [type, setType] = useState('Trafik');
  const [customType, setCustomType] = useState('');
  const [company, setCompany] = useState('HDI Sigorta');
  const [customCompany, setCustomCompany] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]);
  const [premium, setPremium] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'Peşin / Tek Çekim' | 'Taksitli'>('Peşin / Tek Çekim');
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [commissionRate, setCommissionRate] = useState('15');
  const [notes, setNotes] = useState('');

  // Form State - Araç / Ruhsat Bilgileri
  const [plate, setPlate] = useState('');
  const [documentSerial, setDocumentSerial] = useState('');
  const [vehicleUsage, setVehicleUsage] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleModelYear, setVehicleModelYear] = useState('');
  const [vehicleRegistrationDate, setVehicleRegistrationDate] = useState('');
  const [vehicleValue, setVehicleValue] = useState('');

  // Dynamic note adding inside detail modal
  const [newDetailNote, setNewDetailNote] = useState('');

  // Hydration-safe initial load from localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedPol = localStorage.getItem('elisam_policies');
      if (savedPol) setPolicies(JSON.parse(savedPol));

      const savedCust = localStorage.getItem('elisam_customers');
      if (savedCust) setCustomers(JSON.parse(savedCust));
    } catch (err) {
      console.error('LocalStorage load error:', err);
    }
  }, []);

  // Persist policies & customers to localStorage after mount
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('elisam_policies', JSON.stringify(policies));
    }
  }, [policies, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('elisam_customers', JSON.stringify(customers));
    }
  }, [customers, isMounted]);

  // Reset form helper
  const resetForm = () => {
    setSelectedExistingCustomerId('NEW');
    setCustomerSearchInput('');
    setCustomerName('');
    setCustomerType('Bireysel');
    setCustomerPhone('');
    setCustomerTc('');
    setCustomerEmail('');
    setCustomerBirthDate('');
    setCustomerAddress('');
    setPolicyNo('');
    setType('Trafik');
    setCustomType('');
    setCompany('HDI Sigorta');
    setCustomCompany('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]);
    setPremium('');
    setPaidAmount('');
    setPaymentType('Peşin / Tek Çekim');
    setInstallmentCount(3);
    setCommissionRate('15');
    setNotes('');
    setPlate('');
    setDocumentSerial('');
    setVehicleUsage('');
    setVehicleBrand('');
    setVehicleType('');
    setVehicleModelYear('');
    setVehicleRegistrationDate('');
    setVehicleValue('');
    setAddMode('Manuel');
    setAutoText('');
    setEditingPolicy(null);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (pol: Policy) => {
    setEditingPolicy(pol);
    setPolicyNo(pol.policyNo || pol.id);
    setCustomerName(pol.customerName);
    setCustomerPhone(pol.customerPhone || '');
    setCustomerTc(pol.customerTc || '');
    
    // Find customer for additional info
    const matchedCust = customers.find(c => c.id === pol.customerId || c.name === pol.customerName);
    if (matchedCust) {
      setCustomerType(matchedCust.type);
      setCustomerEmail(matchedCust.email === '-' ? '' : matchedCust.email);
      setCustomerBirthDate(matchedCust.birthDate || '');
      setCustomerAddress(matchedCust.address || '');
      setPlate(matchedCust.plate || '');
      setDocumentSerial(matchedCust.documentSerial || '');
      setVehicleUsage(matchedCust.vehicleUsage || '');
      setVehicleBrand(matchedCust.vehicleBrand || '');
      setVehicleType(matchedCust.vehicleType || '');
      setVehicleModelYear(matchedCust.vehicleModelYear || '');
      setVehicleRegistrationDate(matchedCust.vehicleRegistrationDate || '');
      setVehicleValue(matchedCust.vehicleValue || '');
    }

    setType(pol.type);
    setCompany(pol.company);
    setPremium(String(pol.premium));
    setPaidAmount(String(pol.paidAmount || ''));
    setPaymentType(pol.paymentType || 'Peşin / Tek Çekim');
    setInstallmentCount(pol.installmentCount || 3);
    setCommissionRate(String(pol.commissionRate || 15));
    setNotes(pol.notes || '');

    setAddMode('Manuel');
    setIsAddModalOpen(true);
  };

  // Select existing customer
  const handleSelectExistingCustomer = (cId: string) => {
    setSelectedExistingCustomerId(cId);
    if (cId === 'NEW') {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerTc('');
      setCustomerEmail('');
      setCustomerBirthDate('');
      setCustomerAddress('');
      return;
    }
    const found = customers.find(c => c.id === cId);
    if (found) {
      setCustomerName(found.name);
      setCustomerType(found.type);
      setCustomerPhone(found.phone);
      setCustomerTc(found.identityNo === '-' ? '' : found.identityNo);
      setCustomerEmail(found.email === '-' ? '' : found.email);
      setCustomerBirthDate(found.birthDate || '');
      setCustomerAddress(found.address || '');
      if (found.plate) setPlate(found.plate);
      if (found.documentSerial) setDocumentSerial(found.documentSerial);
      if (found.vehicleBrand) setVehicleBrand(found.vehicleBrand);
      if (found.vehicleType) setVehicleType(found.vehicleType);
      if (found.vehicleModelYear) setVehicleModelYear(found.vehicleModelYear);
      if (found.vehicleRegistrationDate) setVehicleRegistrationDate(found.vehicleRegistrationDate);
      if (found.vehicleValue) setVehicleValue(found.vehicleValue);
    }
  };

  // Auto-paste text parser
  const handleAutoPaste = (text: string) => {
    setAutoText(text);

    const extract = (regex: RegExp) => {
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    // 1. Müşteri Ad Soyad & Şirket Algılama
    const parsedName = extract(/Ad \/ Soy Ad:\s*(.*)/i);
    if (parsedName) {
      setCustomerName(parsedName);
      if (/(?:ŞİRKETİ|LİMİTED|LTD|A\.Ş|SANAYİ|TİCARET|AŞ|HOLDİNG|ORTAKLIĞI|KOOPERATİF)/i.test(parsedName)) {
        setCustomerType('Kurumsal');
      }
    }

    // 2. Doğum Tarihi (DD.MM.YYYY -> YYYY-MM-DD)
    const parsedBirth = extract(/(?:Do[ğg\u011f\u011e]um|Dogum)\s*Tarihi:\s*(.*)/i);
    if (parsedBirth) {
      if (parsedBirth.includes('.')) {
        const parts = parsedBirth.split('.');
        if (parts.length === 3) {
          const d = parts[0].trim().padStart(2, '0');
          const m = parts[1].trim().padStart(2, '0');
          const y = parts[2].trim();
          setCustomerBirthDate(`${y}-${m}-${d}`);
        } else {
          setCustomerBirthDate(parsedBirth);
        }
      } else if (parsedBirth.includes('/')) {
        const parts = parsedBirth.split('/');
        if (parts.length === 3) {
          const d = parts[0].trim().padStart(2, '0');
          const m = parts[1].trim().padStart(2, '0');
          const y = parts[2].trim();
          setCustomerBirthDate(`${y}-${m}-${d}`);
        } else {
          setCustomerBirthDate(parsedBirth);
        }
      } else {
        setCustomerBirthDate(parsedBirth);
      }
    }

    // 3. TCKN / VKN
    const parsedTckn = extract(/Tckn\/Vergi No:\s*(.*)/i);
    if (parsedTckn) setCustomerTc(parsedTckn);

    // 4. Telefon
    const parsedPhone = extract(/(?:Telefon|Tel|Gsm):\s*(.*)/i);
    if (parsedPhone) setCustomerPhone(parsedPhone);
    else if (!customerPhone) setCustomerPhone('05-- --- -- --');

    // 5. Poliçe Numarası
    const parsedPolicyNo = extract(/Poliçe (?:No|Numarası):\s*(.*)/i);
    if (parsedPolicyNo) setPolicyNo(parsedPolicyNo);

    // 6. Başlangıç - Bitiş Tarihleri
    const dates = extract(/Başlangıç-Bitiş Tarihi:\s*(.*)/i);
    if (dates) {
      const parts = dates.split('/');
      if (parts.length === 2) {
        const parseD = (s: string) => {
          const p = s.trim().split('.');
          if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
          return s.trim();
        };
        setStartDate(parseD(parts[0]));
        setEndDate(parseD(parts[1]));
      }
    }

    // 7. Plaka & Belge Seri
    const parsedPlate = extract(/Plaka:\s*(.*)/i);
    if (parsedPlate) setPlate(parsedPlate);

    const parsedBelge = extract(/Belge Seri:\s*(.*)/i);
    if (parsedBelge) setDocumentSerial(parsedBelge);

    // 8. Araç Bilgileri
    const parsedUsage = extract(/Araç Kullanım Tarzı:\s*(.*)/i);
    if (parsedUsage) setVehicleUsage(parsedUsage);

    const parsedBrand = extract(/Marka:\s*(.*)/i);
    if (parsedBrand) setVehicleBrand(parsedBrand);

    const parsedTip = extract(/Tip:\s*(.*)/i);
    if (parsedTip) setVehicleType(parsedTip);

    const parsedYear = extract(/Model Yılı:\s*(.*)/i);
    if (parsedYear) setVehicleModelYear(parsedYear);

    const parsedReg = extract(/Tescil Tarihi:\s*(.*)/i);
    if (parsedReg) setVehicleRegistrationDate(parsedReg);

    const parsedVal = extract(/Araç Kasko Değeri:\s*(.*)/i);
    if (parsedVal) setVehicleValue(parsedVal);

    // 9. Prim / Tutar
    const parsedPrice = extract(/(?:Prim|Tutar|Fiyat|Teklif):\s*([0-9.,]+)/i);
    if (parsedPrice) {
      setPremium(parsedPrice.replace(/\./g, '').replace(',', '.'));
    }

    // 10. Meslek
    const parsedProfession = extract(/Meslek:\s*(.*)/i);
    if (parsedProfession && !notes) {
      setNotes(`Meslek: ${parsedProfession}`);
    }
  };

  // Helper to generate installments for debt record
  const generateInstallments = (total: number, count: number, start: string, initialPaid: number): Installment[] => {
    const installments: Installment[] = [];
    const monthlyAmt = Math.round(total / count);
    const sDate = start ? new Date(start) : new Date();

    let paidRemaining = initialPaid;

    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(sDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      const formattedDue = dueDate.toLocaleDateString('tr-TR');

      const isPaid = paidRemaining >= monthlyAmt;
      const isOverdue = dueDate < new Date() && !isPaid;
      
      if (isPaid) {
        paidRemaining -= monthlyAmt;
      }

      installments.push({
        installmentNo: i,
        amount: i === count ? (total - monthlyAmt * (count - 1)) : monthlyAmt,
        dueDate: formattedDue,
        status: isPaid ? 'Ödendi' : (isOverdue ? 'Gecikmede' : 'Bekliyor'),
        paidDate: isPaid ? new Date().toLocaleDateString('tr-TR') : undefined
      });
    }

    return installments;
  };

  // Save Policy & Customer in One Single Action
  const handleSavePolicyAndCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !premium) {
      alert('Lütfen en azından Müşteri Adı ve Prim Tutarını girin.');
      return;
    }

    const finalType = type === 'DIGER' ? (customType.trim() || 'Özel Sigorta') : type;
    const finalCompany = company === 'DIGER' ? (customCompany.trim() || 'Diğer Sigorta') : company;
    const finalPolicyNo = policyNo.trim() || `POL-${Math.floor(100000 + Math.random() * 900000)}`;
    const prem = Number(premium);
    const paid = Number(paidAmount) || (paymentType === 'Peşin / Tek Çekim' ? prem : 0);
    const remaining = Math.max(0, prem - paid);
    const instCount = paymentType === 'Taksitli' ? installmentCount : 1;

    // 1. SAVE / UPDATE CUSTOMER
    let customerId = selectedExistingCustomerId !== 'NEW' ? selectedExistingCustomerId : `CUST-${Math.floor(100 + Math.random() * 900)}`;
    
    const existingCust = customers.find(c => c.id === customerId || c.name.toLowerCase() === customerName.toLowerCase());
    if (existingCust) {
      customerId = existingCust.id;
      const updatedCustomer: Customer = {
        ...existingCust,
        name: customerName,
        type: customerType,
        phone: customerPhone || existingCust.phone,
        email: customerEmail || existingCust.email,
        identityNo: customerTc || existingCust.identityNo,
        birthDate: customerBirthDate || existingCust.birthDate,
        address: customerAddress || existingCust.address,
        policyNo: finalPolicyNo,
        insuranceType: finalType,
        policyStartDate: startDate,
        policyEndDate: endDate,
        plate: plate || existingCust.plate,
        documentSerial: documentSerial || existingCust.documentSerial,
        vehicleUsage: vehicleUsage || existingCust.vehicleUsage,
        vehicleBrand: vehicleBrand || existingCust.vehicleBrand,
        vehicleType: vehicleType || existingCust.vehicleType,
        vehicleModelYear: vehicleModelYear || existingCust.vehicleModelYear,
        vehicleRegistrationDate: vehicleRegistrationDate || existingCust.vehicleRegistrationDate,
        vehicleValue: vehicleValue || existingCust.vehicleValue
      };
      setCustomers(customers.map(c => c.id === customerId ? updatedCustomer : c));
    } else {
      const newCustomer: Customer = {
        id: customerId,
        name: customerName,
        type: customerType,
        phone: customerPhone || '-',
        email: customerEmail || '-',
        identityNo: customerTc || '-',
        address: customerAddress || 'Alanya / Antalya',
        birthDate: customerBirthDate || undefined,
        notes: notes || 'Poliçe kesimi ile otomatik kaydedildi.',
        createdAt: new Date().toLocaleDateString('tr-TR'),
        policyNo: finalPolicyNo,
        insuranceType: finalType,
        policyStartDate: startDate,
        policyEndDate: endDate,
        plate,
        documentSerial,
        vehicleUsage,
        vehicleBrand,
        vehicleType,
        vehicleModelYear,
        vehicleRegistrationDate,
        vehicleValue
      };
      setCustomers([newCustomer, ...customers]);
    }

    // 2. SAVE / UPDATE POLICY
    const newPolicyRecord: Policy = {
      id: finalPolicyNo,
      policyNo: finalPolicyNo,
      customerId,
      customerName,
      customerPhone: customerPhone || '-',
      customerTc: customerTc || '-',
      type: finalType,
      company: finalCompany,
      startDate: startDate ? new Date(startDate).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
      endDate: endDate ? new Date(endDate).toLocaleDateString('tr-TR') : new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('tr-TR'),
      premium: prem,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentType,
      installmentCount: instCount,
      commissionRate: Number(commissionRate) || 15,
      paymentStatus: remaining === 0 ? 'Ödendi' : (paid > 0 ? 'Kısmi Ödendi' : 'Bekliyor'),
      status: 'Aktif',
      notes: notes || 'Yeni poliçe kaydı.'
    };

    if (editingPolicy) {
      setPolicies(policies.map(p => p.id === editingPolicy.id ? newPolicyRecord : p));
    } else {
      setPolicies([newPolicyRecord, ...policies]);
    }

    // 3. AUTO-SYNC WITH FINANS & CASH LOGS
    try {
      const savedDebts = JSON.parse(localStorage.getItem('elisam_debt_records') || '[]');
      const installments = generateInstallments(prem, instCount, startDate, paid);
      const newDebt = {
        id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId,
        customerName,
        customerPhone: customerPhone || '-',
        customerTc: customerTc || '-',
        policyNo: finalPolicyNo,
        insuranceType: finalType,
        company: finalCompany,
        totalAmount: prem,
        paidAmount: paid,
        remainingAmount: remaining,
        paymentType,
        installmentCount: instCount,
        installments,
        status: remaining === 0 ? 'Ödendi' : (paid > 0 ? 'Kısmi Ödendi' : 'Bekliyor'),
        startDate: startDate ? new Date(startDate).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
        notes: notes || 'Poliçe kesimi ile otomatik kaydedildi.'
      };
      localStorage.setItem('elisam_debt_records', JSON.stringify([newDebt, ...savedDebts.filter((d: any) => d.policyNo !== finalPolicyNo)]));

      if (paid > 0) {
        const savedLogs = JSON.parse(localStorage.getItem('elisam_cash_logs') || '[]');
        const newCashLog = {
          id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toLocaleDateString('tr-TR'),
          customerName,
          policyNo: finalPolicyNo,
          amount: paid,
          paymentMethod: 'Kredi Kartı',
          type: 'Tahsilat',
          description: `${finalPolicyNo} nolu ${finalType} poliçesi ilk tahsilatı.`
        };
        localStorage.setItem('elisam_cash_logs', JSON.stringify([newCashLog, ...savedLogs]));
      }
    } catch (err) {
      console.error('Finans sync hatası:', err);
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  // Delete Policy
  const handleDeletePolicy = (id: string, name: string) => {
    if (confirm(`${name} müşterisine ait ${id} numaralı poliçeyi silmek istediğinize emin misiniz?`)) {
      setPolicies(policies.filter(p => p.id !== id));
      if (selectedPolicy?.id === id) setSelectedPolicy(null);
    }
  };

  // Add Dynamic Note in details modal
  const handleAddDynamicNote = () => {
    if (!newDetailNote.trim() || !selectedPolicy) return;
    const stampedNote = `\n• [${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}]: ${newDetailNote.trim()}`;
    const updatedNotes = (selectedPolicy.notes || '') + stampedNote;

    const updatedPol = { ...selectedPolicy, notes: updatedNotes };
    setSelectedPolicy(updatedPol);
    setPolicies(policies.map(p => p.id === selectedPolicy.id ? updatedPol : p));
    setNewDetailNote('');
  };

  // WhatsApp Reminder
  const sendWhatsAppReminder = (pol: Policy) => {
    const cleanPhone = (pol.customerPhone || '').replace(/\s+/g, '').replace(/^0/, '90');
    const msg = `Sayın ${pol.customerName},\n\nElisam Sigorta acentemizden bildirilmektedir.\n${pol.policyNo || pol.id} numaralı ${pol.type} poliçenizin detayları:\n\n🛡️ Şirket: ${pol.company}\n📅 Bitiş Tarihi: ${pol.endDate}\n💰 Prim Tutarı: ${pol.premium.toLocaleString('tr-TR')} ₺\n${pol.remainingAmount && pol.remainingAmount > 0 ? `🔴 Kalan Borç: ${pol.remainingAmount.toLocaleString('tr-TR')} ₺\n` : '🟢 Ödeme Durumu: Tamamı Ödendi\n'}\nSorularınız ve yenileme talepleriniz için bize ulaşabilirsiniz:\n📞 0551 438 77 71\nElisam Sigorta • Alanya`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Telegram Reminder
  const sendTelegramReminder = async (pol: Policy) => {
    try {
      const config = JSON.parse(localStorage.getItem('elisam_telegram_config') || '{}');
      if (!config.botToken || !config.chatId) {
        alert('Lütfen önce Ayarlar -> Hatırlatmalar & Telegram bölümünden Bot Token ve Chat ID bilgilerinizi kaydedin.');
        return;
      }

      const text = `📄 *Poliçe Bilgilendirmesi*\n\n👤 *Müşteri:* ${pol.customerName}\n📱 *Telefon:* ${pol.customerPhone || '-'}\n📄 *Poliçe No:* \`${pol.policyNo || pol.id}\`\n🛡️ *Tür / Şirket:* ${pol.type} - ${pol.company}\n📅 *Vade:* ${pol.startDate} -> ${pol.endDate}\n💰 *Toplam Prim:* ${pol.premium.toLocaleString('tr-TR')} ₺\n📊 *Durum:* ${pol.status}\n\n⏰ *Kayıt Tarihi:* ${new Date().toLocaleString('tr-TR')}`;

      const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: 'Markdown' })
      });
      const data = await res.json();
      if (data.ok) {
        alert(`✓ ${pol.customerName} poliçe özeti Telegram botunuza başarıyla iletildi!`);
      } else {
        alert(`Telegram Hatası: ${data.description}`);
      }
    } catch (err: any) {
      alert('Telegram mesajı gönderilemedi: ' + err.message);
    }
  };

  // Filtered Policies
  const filteredPolicies = policies.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (p.policyNo || p.id).toLowerCase().includes(term) ||
      p.customerName.toLowerCase().includes(term) ||
      (p.customerPhone && p.customerPhone.includes(term)) ||
      (p.customerTc && p.customerTc.includes(term)) ||
      p.company.toLowerCase().includes(term) ||
      p.type.toLowerCase().includes(term);
    
    if (activeTab === 'Aktifler') return matchesSearch && p.status === 'Aktif';
    if (activeTab === 'Yaklaşanlar') return matchesSearch && p.status === 'Yaklaşıyor';
    if (activeTab === 'Bitenler') return matchesSearch && p.status === 'Biten';
    if (activeTab === 'Borcu Kalanlar') return matchesSearch && p.remainingAmount && p.remainingAmount > 0;
    return matchesSearch;
  });

  const totalPremiumAll = policies.reduce((s, p) => s + p.premium, 0);
  const totalActive = policies.filter(p => p.status === 'Aktif').length;
  const totalExpiring = policies.filter(p => p.status === 'Yaklaşıyor').length;
  const totalWithDebt = policies.filter(p => p.remainingAmount && p.remainingAmount > 0).length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#2563eb" /> Poliçe Portföyü & Müşteri Yönetimi
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px', margin: 0 }}>
            Tek adımda müşteri bilgilerini girin veya otomatik yapıştırarak anında poliçesini kesin.
          </p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className={styles.btnCrm}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.95rem', fontWeight: 750 }}
        >
          <Plus size={20} /> Yeni Poliçe Kes (Müşteri & Poliçe)
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '25px' }}>
        
        <div className={styles.card} style={{ borderLeft: '4px solid #2563eb', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Toplam Poliçe Adedi</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 850, color: '#0f172a', marginTop: '4px' }}>{policies.length} Adet</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>{customers.length} kayıtlı müşteri portföyü</div>
        </div>

        <div className={styles.card} style={{ borderLeft: '4px solid #16a34a', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Toplam Prim Hacmi</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 850, color: '#16a34a', marginTop: '4px' }}>{totalPremiumAll.toLocaleString('tr-TR')} ₺</div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '3px', fontWeight: 600 }}>✓ Toplam brüt üretim</div>
        </div>

        <div className={styles.card} style={{ borderLeft: '4px solid #f59e0b', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Yaklaşan Yenilemeler</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 850, color: '#d97706', marginTop: '4px' }}>{totalExpiring} Poliçe</div>
          <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '3px' }}>Yenileme hatırlatması bekliyor</div>
        </div>

        <div className={styles.card} style={{ borderLeft: '4px solid #ef4444', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Taksitli / Açık Borçlar</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 850, color: '#dc2626', marginTop: '4px' }}>{totalWithDebt} Poliçe</div>
          <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '3px', fontWeight: 600 }}>Ödemesi devam edenler</div>
        </div>

      </div>

      {/* Main Content Card */}
      <div className={styles.card}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #edf2f7', marginBottom: '20px', overflowX: 'auto' }}>
          {[
            { key: 'Tümü', label: `Tüm Poliçeler (${policies.length})` },
            { key: 'Aktifler', label: `Yürürlükte / Aktif (${totalActive})` },
            { key: 'Yaklaşanlar', label: `Yenilemesi Yaklaşanlar (${totalExpiring})` },
            { key: 'Bitenler', label: `Süresi Bitenler (${policies.filter(p => p.status === 'Biten').length})` },
            { key: 'Borcu Kalanlar', label: `Taksitli / Açık Borçlular (${totalWithDebt})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 6px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid #2563eb' : '3px solid transparent',
                color: activeTab === tab.key ? '#2563eb' : '#64748b',
                fontWeight: activeTab === tab.key ? 750 : 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Poliçe no, müşteri adı, TC kimlik, telefon veya şirket ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '11px 12px 11px 42px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        {/* POLICIES & CUSTOMERS TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Poliçe Numarası</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Müşteri Bilgisi</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Sigorta Türü / Şirket</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Toplam Prim</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Ödeme Durumu</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Bitiş Tarihi</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Durum</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map(pol => {
                  const matchedCust = customers.find(c => c.id === pol.customerId || c.name === pol.customerName);
                  return (
                    <tr key={pol.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                      
                      {/* Poliçe No */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 750, color: '#1e40af', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                          {pol.policyNo || pol.id}
                        </div>
                        {matchedCust?.plate && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                            🚗 {matchedCust.plate}
                          </div>
                        )}
                      </td>

                      {/* Müşteri Bilgisi */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '0.95rem' }}>
                          {pol.customerName}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                          📞 {pol.customerPhone || '-'} {pol.customerTc && pol.customerTc !== '-' && `• TC: ${pol.customerTc}`}
                        </div>
                      </td>

                      {/* Tür & Şirket */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.92rem' }}>
                          {pol.type}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {pol.company}
                        </div>
                      </td>

                      {/* Prim */}
                      <td style={{ padding: '14px 16px', fontWeight: 750, color: '#0f172a', fontSize: '0.95rem' }}>
                        {pol.premium.toLocaleString('tr-TR')} ₺
                      </td>

                      {/* Ödeme Durumu */}
                      <td style={{ padding: '14px 16px' }}>
                        {pol.remainingAmount && pol.remainingAmount > 0 ? (
                          <div>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 750, fontSize: '0.82rem' }}>
                              Borç: {pol.remainingAmount.toLocaleString('tr-TR')} ₺
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              {pol.paymentType} {pol.installmentCount && pol.installmentCount > 1 ? `(${pol.installmentCount} Taksit)` : ''}
                            </div>
                          </div>
                        ) : (
                          <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.82rem' }}>
                            ✓ Tamamı Ödendi
                          </span>
                        )}
                      </td>

                      {/* Bitiş Tarihi */}
                      <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#334155', fontWeight: 600 }}>
                        {pol.endDate}
                      </td>

                      {/* Durum Rozeti */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 750,
                          backgroundColor: pol.status === 'Aktif' ? '#dcfce7' : (pol.status === 'Yaklaşıyor' ? '#fef3c7' : '#fee2e2'),
                          color: pol.status === 'Aktif' ? '#15803d' : (pol.status === 'Yaklaşıyor' ? '#b45309' : '#dc2626')
                        }}>
                          {pol.status}
                        </span>
                      </td>

                      {/* İşlemler */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          
                          <button
                            onClick={() => setSelectedPolicy(pol)}
                            title="Poliçe ve Müşteri Detaylarını Gör"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={14} /> Detay
                          </button>

                          <button
                            onClick={() => sendWhatsAppReminder(pol)}
                            title="WhatsApp'tan Poliçe Bilgisi / Hatırlatma Gönder"
                            style={{
                              padding: '6px 9px',
                              backgroundColor: '#25d366',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <MessageCircle size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(pol)}
                            title="Poliçeyi Düzenle"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#f8fafc',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeletePolicy(pol.id, pol.customerName)}
                            title="Poliçeyi Sil"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#fff',
                              color: '#ef4444',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Kayıtlı poliçe bulunamadı. &ldquo;Yeni Poliçe Kes (Müşteri & Poliçe)&rdquo; butonundan hem müşterinizi kaydedip hem poliçenizi kesebilirsiniz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL 1: YENİ POLİÇE KES & MÜŞTERİ KAYDET (TEK ADIMDA BİRLEŞİK) */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 850, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={24} color="#2563eb" /> {editingPolicy ? 'Poliçe & Müşteri Bilgilerini Düzenle' : 'Yeni Poliçe Kes & Müşteri Kaydet'}
                </h2>
                <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
                  Müşteri ve poliçe bilgilerini tek seferde girin veya metin yapıştırarak saniyeler içinde otomatik doldurun.
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={24} />
              </button>
            </div>

            {/* Mode Selector (Manuel vs Otomatik Metin Yapıştır) */}
            {!editingPolicy && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setAddMode('Manuel')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: addMode === 'Manuel' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: addMode === 'Manuel' ? '#eff6ff' : '#f8fafc',
                    color: addMode === 'Manuel' ? '#1d4ed8' : '#64748b',
                    fontWeight: 750,
                    cursor: 'pointer',
                    fontSize: '0.92rem'
                  }}
                >
                  ✍️ Manuel Form Doldur
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('Otomatik')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: addMode === 'Otomatik' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: addMode === 'Otomatik' ? '#eff6ff' : '#f8fafc',
                    color: addMode === 'Otomatik' ? '#1d4ed8' : '#64748b',
                    fontWeight: 750,
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ClipboardPaste size={16} /> 📋 Otomatik Metin Yapıştır & Doldur
                </button>
              </div>
            )}

            {/* Otomatik Metin Yapıştırma Alanı */}
            {addMode === 'Otomatik' && (
              <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '2px dashed #38bdf8', marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#0369a1', marginBottom: '6px' }}>
                  Sigorta ekranından kopyaladığınız teklif/poliçe metnini buraya yapıştırın:
                </label>
                <textarea 
                  value={autoText}
                  onChange={(e) => handleAutoPaste(e.target.value)}
                  placeholder="Ad / Soy Ad: ...&#10;Doğum Tarihi: ...&#10;Tckn/Vergi No: ...&#10;Poliçe No: ...&#10;Plaka: ...&#10;Marka: ... Model Yılı: ... Prim: ..."
                  rows={6}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #7dd3fc', outline: 'none', fontSize: '0.88rem', fontFamily: 'monospace' }}
                />
                <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: '6px', fontWeight: 600 }}>
                  💡 Yapıştırdığınız anda Müşteri Adı, TC, Doğum Tarihi, Poliçe No, Plaka, Araç Detayları ve Prim tutarı aşağıdaki kutulara otomatik işlenecektir.
                </div>
              </div>
            )}

            <form onSubmit={handleSavePolicyAndCustomer}>
              
              {/* KART 1: MÜŞTERİ BİLGİLERİ */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={18} color="#2563eb" /> 1. Müşteri Bilgileri
                </h3>

                {!editingPolicy && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                      🔍 Kayıtlı Müşteri Ara & Seç (İsim, TC, Telefon, Poliçe No veya Plaka ile):
                    </label>
                    
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text"
                        placeholder="Örn: Ahmet, 384030..., 0551..., POL-123456 veya 38AHD233..."
                        value={customerSearchInput}
                        onChange={(e) => setCustomerSearchInput(e.target.value)}
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
                      {customerSearchInput && (
                        <button
                          type="button"
                          onClick={() => setCustomerSearchInput('')}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* Auto-suggest dropdown list when user types */}
                    {customerSearchInput.trim() && (
                      <div style={{
                        marginTop: '6px',
                        maxHeight: '190px',
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #93c5fd',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        zIndex: 50
                      }}>
                        {customers.filter(c => {
                          const q = customerSearchInput.toLowerCase();
                          return c.name.toLowerCase().includes(q) ||
                                 (c.identityNo && c.identityNo.includes(q)) ||
                                 (c.phone && c.phone.includes(q)) ||
                                 (c.policyNo && c.policyNo.toLowerCase().includes(q)) ||
                                 (c.plate && c.plate.toLowerCase().includes(q));
                        }).length > 0 ? (
                          customers.filter(c => {
                            const q = customerSearchInput.toLowerCase();
                            return c.name.toLowerCase().includes(q) ||
                                   (c.identityNo && c.identityNo.includes(q)) ||
                                   (c.phone && c.phone.includes(q)) ||
                                   (c.policyNo && c.policyNo.toLowerCase().includes(q)) ||
                                   (c.plate && c.plate.toLowerCase().includes(q));
                          }).map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                handleSelectExistingCustomer(c.id);
                                setCustomerSearchInput('');
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
                                  {c.name} <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{c.type}</span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                                  📞 {c.phone} {c.identityNo && c.identityNo !== '-' ? `• 🆔 TC: ${c.identityNo}` : ''} {c.plate ? `• 🚗 ${c.plate}` : ''} {c.policyNo ? `• 📄 ${c.policyNo}` : ''}
                                </div>
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 750, color: '#2563eb' }}>Seç ➔</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.84rem', color: '#94a3b8' }}>
                            Aramanızla eşleşen kayıtlı müşteri bulunamadı. Aşağıdaki alanlara yazarak yeni müşteri olarak kaydedebilirsiniz.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected customer badge */}
                    {selectedExistingCustomerId !== 'NEW' && (
                      <div style={{ marginTop: '8px', padding: '9px 14px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 750, color: '#065f46' }}>
                          ✓ Kayıtlı Müşteri Seçildi: {customerName} ({customerPhone})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectExistingCustomer('NEW')}
                          style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          ✕ Seçimi Kaldır / Yeni Müşteri Yaz
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Müşteri Ad Soyad / Şirket Ünvanı *</label>
                    <input 
                      type="text" 
                      required 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)} 
                      placeholder="Örn: Ahmet Yılmaz veya ABC Ltd. Şti." 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700 }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Müşteri Türü</label>
                    <select value={customerType} onChange={(e) => setCustomerType(e.target.value as any)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                      <option value="Bireysel">Bireysel Müşteri</option>
                      <option value="Kurumsal">Kurumsal Firma</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Telefon Numarası *</label>
                    <input 
                      type="text" 
                      required
                      value={customerPhone} 
                      onChange={(e) => setCustomerPhone(e.target.value)} 
                      placeholder="05XX XXX XX XX" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>TC Kimlik / Vergi No</label>
                    <input 
                      type="text" 
                      value={customerTc} 
                      onChange={(e) => setCustomerTc(e.target.value)} 
                      placeholder="11 haneli TC veya Vergi No" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Doğum Tarihi</label>
                    <input 
                      type="date" 
                      value={customerBirthDate} 
                      onChange={(e) => setCustomerBirthDate(e.target.value)} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Adres & İletişim Notu</label>
                  <input 
                    type="text" 
                    value={customerAddress} 
                    onChange={(e) => setCustomerAddress(e.target.value)} 
                    placeholder="Mahmutlar Mah. Alanya / Antalya" 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                  />
                </div>
              </div>

              {/* KART 2: POLİÇE & TEMİNAT BİLGİLERİ */}
              <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#166534', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={18} color="#16a34a" /> 2. Poliçe & Prim Detayları
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#166534', marginBottom: '4px' }}>Poliçe Numarası (Manuel Yazın)</label>
                    <input 
                      type="text" 
                      value={policyNo} 
                      onChange={(e) => setPolicyNo(e.target.value)} 
                      placeholder="Örn: 312984920/0 veya AK-2024-912" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none', fontWeight: 750, fontFamily: 'monospace' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Sigorta Türü</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none', fontWeight: 600 }}>
                      <option value="Trafik">Trafik Sigortası</option>
                      <option value="Kasko">Kasko Sigortası</option>
                      <option value="DASK">DASK Deprem</option>
                      <option value="Konut">Konut Sigortası</option>
                      <option value="İşyeri">İşyeri Sigortası</option>
                      <option value="Özel Sağlık">Özel Sağlık</option>
                      <option value="Tamamlayıcı Sağlık (TSS)">Tamamlayıcı Sağlık (TSS)</option>
                      <option value="Yabancı Sağlık">Yabancı Sağlık Sigortası</option>
                      <option value="Seyahat Sağlık">Seyahat Sağlık Sigortası</option>
                      <option value="Ferdi Kaza">Ferdi Kaza Sigortası</option>
                      <option value="Nakliyat">Nakliyat Sigortası</option>
                      <option value="Mesleki Sorumluluk">Mesleki Sorumluluk</option>
                      <option value="TARSİM Tarım">TARSİM Tarım Sigortası</option>
                      <option value="Tekne / Yat">Tekne / Yat Sigortası</option>
                      <option value="DIGER">➕ Diğer (Manuel Tür Yaz...)</option>
                    </select>
                    {type === 'DIGER' && (
                      <input 
                        type="text" 
                        required 
                        value={customType} 
                        onChange={(e) => setCustomType(e.target.value)} 
                        placeholder="Sigorta türünü yazın..." 
                        style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '6px', border: '2px solid #16a34a', outline: 'none', fontWeight: 600, backgroundColor: '#ffffff' }} 
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Sigorta Şirketi</label>
                    <select value={company} onChange={(e) => setCompany(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none', fontWeight: 600 }}>
                      <option value="HDI Sigorta">HDI Sigorta</option>
                      <option value="Ak Sigorta">Ak Sigorta</option>
                      <option value="Sompo Sigorta">Sompo Sigorta</option>
                      <option value="Allianz">Allianz</option>
                      <option value="Anadolu Sigorta">Anadolu Sigorta</option>
                      <option value="Quick Sigorta">Quick Sigorta</option>
                      <option value="Emaa Sigorta">Emaa Sigorta</option>
                      <option value="Türkiye Sigorta">Türkiye Sigorta</option>
                      <option value="Axa Sigorta">Axa Sigorta</option>
                      <option value="Ray Sigorta">Ray Sigorta</option>
                      <option value="Neova Sigorta">Neova Sigorta</option>
                      <option value="Hepiyi Sigorta">Hepiyi Sigorta</option>
                      <option value="Generali Sigorta">Generali Sigorta</option>
                      <option value="Unico Sigorta">Unico Sigorta</option>
                      <option value="Corpus Sigorta">Corpus Sigorta</option>
                      <option value="Koru Sigorta">Koru Sigorta</option>
                      <option value="Bereket Sigorta">Bereket Sigorta</option>
                      <option value="Mapfre Sigorta">Mapfre Sigorta</option>
                      <option value="Orient Sigorta">Orient Sigorta</option>
                      <option value="Ankara Sigorta">Ankara Sigorta</option>
                      <option value="Zurich Sigorta">Zurich Sigorta</option>
                      <option value="DIGER">➕ Diğer (Manuel Şirket Yaz...)</option>
                    </select>
                    {company === 'DIGER' && (
                      <input 
                        type="text" 
                        required 
                        value={customCompany} 
                        onChange={(e) => setCustomCompany(e.target.value)} 
                        placeholder="Sigorta şirketini yazın..." 
                        style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '6px', border: '2px solid #16a34a', outline: 'none', fontWeight: 600, backgroundColor: '#ffffff' }} 
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Başlangıç Tarihi</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Bitiş Tarihi</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 750, color: '#166534', marginBottom: '4px' }}>Toplam Brüt Prim (₺) *</label>
                    <input 
                      type="number" 
                      required 
                      value={premium} 
                      onChange={(e) => setPremium(e.target.value)} 
                      placeholder="Örn: 15000" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none', fontWeight: 800, fontSize: '1rem', color: '#166534' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Komisyon (%)</label>
                    <input 
                      type="number" 
                      value={commissionRate} 
                      onChange={(e) => setCommissionRate(e.target.value)} 
                      placeholder="15" 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #86efac', outline: 'none' }} 
                    />
                  </div>
                </div>

                {/* Ödeme Planı & Taksit Seçenekleri */}
                <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #86efac' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Ödeme Şekli</label>
                      <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 600 }}>
                        <option value="Peşin / Tek Çekim">Peşin / Tek Çekim</option>
                        <option value="Taksitli">Taksitli Ödeme</option>
                      </select>
                    </div>

                    {paymentType === 'Taksitli' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Taksit Sayısı</label>
                        <select value={installmentCount} onChange={(e) => setInstallmentCount(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700 }}>
                          <option value={2}>2 Taksit</option>
                          <option value={3}>3 Taksit</option>
                          <option value={4}>4 Taksit</option>
                          <option value={6}>6 Taksit</option>
                          <option value={9}>9 Taksit</option>
                          <option value={12}>12 Taksit</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Tahsil Edilen Tutar (₺)</label>
                        <input 
                          type="number" 
                          value={paidAmount} 
                          onChange={(e) => setPaidAmount(e.target.value)} 
                          placeholder={premium || "Örn: 15000"} 
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700 }} 
                        />
                      </div>
                    )}
                  </div>

                  {paymentType === 'Taksitli' && premium && (
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>
                      💡 Her ay ödenecek taksit tutarı: {(Number(premium) / installmentCount).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺
                    </div>
                  )}
                </div>
              </div>

              {/* KART 3: ARAÇ & RUHSAT BİLGİLERİ (OPSİYONEL) */}
              <div style={{ padding: '16px', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400e', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Car size={18} color="#d97706" /> 3. Araç & Ruhsat Bilgileri (Kasko, Trafik vb. için)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Plaka</label>
                    <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Örn: 38AHD233" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none', fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Belge Seri No</label>
                    <input type="text" value={documentSerial} onChange={(e) => setDocumentSerial(e.target.value)} placeholder="Örn: HI 378069" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Kullanım Tarzı</label>
                    <input type="text" value={vehicleUsage} onChange={(e) => setVehicleUsage(e.target.value)} placeholder="Örn: HUSUSİ OTO / KAMYONET" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Marka</label>
                    <input type="text" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder="VOLKSWAGEN" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Model / Tip</label>
                    <input type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="TRANSPORTER 5+1" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Kasko Değeri (₺)</label>
                    <input type="text" value={vehicleValue} onChange={(e) => setVehicleValue(e.target.value)} placeholder="1639396" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none', fontWeight: 700 }} />
                  </div>
                </div>
              </div>

              {/* KART 4: NOTLAR */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Özel Not & Açıklama</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Müşteri ve poliçeye dair özel açıklamalar..." 
                  rows={2} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              {/* BUTONLAR */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  style={{ padding: '11px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className={styles.btnCrm} 
                  style={{ padding: '11px 26px', fontSize: '0.95rem', fontWeight: 750 }}
                >
                  ✓ Poliçeyi Kes ve Müşteriyi Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: POLİÇE & MÜŞTERİ DOSYASI DETAY GÖRÜNÜMÜ */}
      {selectedPolicy && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 750, color: '#2563eb' }}>POLİÇE DOSYASI</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 850, color: '#0f172a', margin: '2px 0 0 0' }}>
                  {selectedPolicy.policyNo || selectedPolicy.id}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                  {selectedPolicy.type} • {selectedPolicy.company}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 750,
                  backgroundColor: selectedPolicy.status === 'Aktif' ? '#dcfce7' : (selectedPolicy.status === 'Yaklaşıyor' ? '#fef3c7' : '#fee2e2'),
                  color: selectedPolicy.status === 'Aktif' ? '#15803d' : (selectedPolicy.status === 'Yaklaşıyor' ? '#b45309' : '#dc2626')
                }}>
                  {selectedPolicy.status}
                </span>
                <button onClick={() => setSelectedPolicy(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Müşteri & Poliçe Özeti */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              
              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Müşteri Bilgileri</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{selectedPolicy.customerName}</div>
                <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '4px' }}>📞 {selectedPolicy.customerPhone || '-'}</div>
                {selectedPolicy.customerTc && <div style={{ fontSize: '0.84rem', color: '#475569' }}>🆔 TC/VKN: {selectedPolicy.customerTc}</div>}
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: '6px' }}>Finans & Prim Bilgisi</div>
                <div style={{ fontWeight: 850, color: '#0369a1', fontSize: '1.2rem' }}>{selectedPolicy.premium.toLocaleString('tr-TR')} ₺</div>
                <div style={{ fontSize: '0.82rem', color: '#0284c7', marginTop: '4px' }}>
                  Ödeme: {selectedPolicy.paymentType || 'Peşin'} {selectedPolicy.remainingAmount && selectedPolicy.remainingAmount > 0 ? `(Kalan: ${selectedPolicy.remainingAmount.toLocaleString('tr-TR')} ₺)` : '(Tamamı Ödendi)'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  Vade: {selectedPolicy.startDate} - {selectedPolicy.endDate}
                </div>
              </div>

            </div>

            {/* Not Geçmişi & Not Ekleme */}
            <div style={{ padding: '14px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 750, color: '#334155', marginBottom: '8px' }}>Poliçe & Müşteri Notları:</div>
              <div style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', minHeight: '60px', maxHeight: '140px', overflowY: 'auto' }}>
                {selectedPolicy.notes || 'Kayıtlı özel not bulunmuyor.'}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input 
                  type="text" 
                  value={newDetailNote} 
                  onChange={(e) => setNewDetailNote(e.target.value)} 
                  placeholder="Bu poliçeye yeni tarihli not ekle..." 
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.86rem' }} 
                />
                <button 
                  onClick={handleAddDynamicNote} 
                  style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Not Ekle
                </button>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => sendWhatsAppReminder(selectedPolicy)}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#25d366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageCircle size={16} /> WhatsApp Bilgilendir
                </button>

                <button
                  onClick={() => sendTelegramReminder(selectedPolicy)}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#0088cc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={16} /> Telegram
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const pol = selectedPolicy;
                    setSelectedPolicy(null);
                    handleOpenEditModal(pol);
                  }}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit2 size={16} /> Düzenle
                </button>

                <button
                  onClick={() => setSelectedPolicy(null)}
                  style={{
                    padding: '9px 18px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Kapat
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
