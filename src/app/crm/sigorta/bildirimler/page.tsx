"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Send, 
  MessageCircle, 
  Phone, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  FileSpreadsheet, 
  Settings, 
  AlertCircle, 
  Car, 
  Info,
  CalendarDays,
  SendHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Customer, Policy } from '@/data/crmData';
import { 
  fetchPoliciesFromCloud, 
  fetchCustomersFromCloud, 
  normalizeMoney,
  formatMoneyDisplay 
} from '@/lib/supabaseService';
import { formatExcelText, formatExcelCurrency, resolvePlateAndDocSerial } from '@/lib/excelHelper';
import { downloadExcelSingleSheet } from '@/lib/excelExport';
import styles from '../layout.module.css';

// Hatırlatıcı Poliçe Ögesi Arayüzü
export interface RenewalItem {
  id: string;
  policyNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerTc: string;
  type: string;
  company: string;
  startDate: string;
  endDate: string;
  premium: number;
  netPremium?: number;
  plate: string;
  documentSerial: string;
  daysRemaining: number;
  urgency: 'expired' | 'today' | 'critical' | 'week' | 'twoWeeks' | 'month' | 'future';
  status: string;
  source: 'policy' | 'customer';
  notes?: string;
}

type UrgencyFilter = 'ALL' | 'EXPIRED' | 'TODAY_CRITICAL' | 'WEEK' | 'TWO_WEEKS' | 'MONTH' | 'FUTURE';
type SortField = 'daysRemaining' | 'endDate' | 'customerName' | 'premium' | 'policyNo';
type SortOrder = 'asc' | 'desc';

export default function SigortaBildirimlerPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  // Sıralama durumu (Varsayılan: En acilden uzağa)
  const [sortField, setSortField] = useState<SortField>('daysRemaining');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Çoklu seçim (Toplu Bildirim)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bilgi & Zamanlama paneli açık/kapalı
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);

  // Telegram ayarları (localStorage)
  const [telegramConfig, setTelegramConfig] = useState({ botToken: '', chatId: '', notifyExpiry: true });
  const [telegramSending, setTelegramSending] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  // Özel mesaj önizleme ve düzenleme modalı
  const [activeMessageModal, setActiveMessageModal] = useState<RenewalItem | null>(null);
  const [customMessageText, setCustomMessageText] = useState('');
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  // Veri yükleme
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cloudPols, cloudCusts] = await Promise.all([
          fetchPoliciesFromCloud(),
          fetchCustomersFromCloud()
        ]);
        if (cloudPols) setPolicies(cloudPols);
        if (cloudCusts) setCustomers(cloudCusts);

        // Telegram konfigürasyonunu yükle
        try {
          const conf = localStorage.getItem('elisam_telegram_config');
          if (conf) setTelegramConfig(JSON.parse(conf));
        } catch (e) {}
      } catch (err) {
        console.error('Bildirim sayfası veri yükleme hatası:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Tarih ayrıştırma
  const parseDateToTimestamp = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const s = dateStr.trim();
    if (s.includes('.')) {
      const p = s.split('.');
      if (p.length === 3) return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10)).getTime();
    }
    if (s.includes('/')) {
      const p = s.split('/');
      if (p.length === 3) return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10)).getTime();
    }
    if (s.includes('-')) {
      const p = s.split('-');
      if (p.length === 3) {
        if (p[0].length === 4) return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getTime();
        return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10)).getTime();
      }
    }
    const t = Date.parse(s);
    return isNaN(t) ? 0 : t;
  };

  // Mevcut müşterileri ve poliçeleri tekilleştirip birleşik hatırlatma listesi oluşturma
  const renewalItems: RenewalItem[] = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const items: RenewalItem[] = [];
    const policyMap = new Set<string>();

    // 1. Önce poliçelerden gelen kayıtlar
    policies.forEach(p => {
      const cust = customers.find(c => c.id === p.customerId || c.name.toLowerCase() === p.customerName.toLowerCase());
      const endTs = parseDateToTimestamp(p.endDate);
      const diffMs = endTs ? endTs - todayMidnight : 0;
      const daysRemaining = endTs ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 999;

      let urgency: RenewalItem['urgency'] = 'future';
      if (daysRemaining < 0) urgency = 'expired';
      else if (daysRemaining === 0) urgency = 'today';
      else if (daysRemaining <= 3) urgency = 'critical';
      else if (daysRemaining <= 7) urgency = 'week';
      else if (daysRemaining <= 15) urgency = 'twoWeeks';
      else if (daysRemaining <= 30) urgency = 'month';

      const { plate, docSerial } = resolvePlateAndDocSerial(p.plate || cust?.plate, p.documentSerial || cust?.documentSerial, p.notes || cust?.notes);
      const tc = p.customerTc && p.customerTc !== '-' ? p.customerTc : (cust?.identityNo || '-');
      const phone = p.customerPhone && p.customerPhone !== '-' ? p.customerPhone : (cust?.phone || '-');

      const item: RenewalItem = {
        id: p.id,
        policyNo: p.policyNo || p.id,
        customerId: p.customerId,
        customerName: p.customerName,
        customerPhone: phone,
        customerTc: tc,
        type: p.type || 'Sigorta Poliçesi',
        company: p.company || 'Acente',
        startDate: p.startDate,
        endDate: p.endDate,
        premium: normalizeMoney(p.premium),
        netPremium: p.netPremium ? normalizeMoney(p.netPremium) : undefined,
        plate: plate !== '-' ? plate : '',
        documentSerial: docSerial !== '-' ? docSerial : '',
        daysRemaining,
        urgency,
        status: p.status || 'Aktif',
        source: 'policy',
        notes: p.notes
      };

      policyMap.add(p.id);
      if (p.policyNo) policyMap.add(p.policyNo);
      if (p.customerId) policyMap.add(`CUST_${p.customerId}`);
      items.push(item);
    });

    // 2. Müşteri kartında poliçe bitiş tarihi olan ancak ayrı poliçe kaydı bulunmayan kayıtları dahil et
    // (Böylece kullanıcının daha önce girdiği hiçbir müşteri bilgisi kaybolmaz!)
    customers.forEach(c => {
      const alreadyIncluded = policyMap.has(c.id) || policyMap.has(`CUST_${c.id}`) || (c.policyNo && policyMap.has(c.policyNo));
      if (!alreadyIncluded && c.policyEndDate) {
        const endTs = parseDateToTimestamp(c.policyEndDate);
        const diffMs = endTs ? endTs - todayMidnight : 0;
        const daysRemaining = endTs ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 999;

        let urgency: RenewalItem['urgency'] = 'future';
        if (daysRemaining < 0) urgency = 'expired';
        else if (daysRemaining === 0) urgency = 'today';
        else if (daysRemaining <= 3) urgency = 'critical';
        else if (daysRemaining <= 7) urgency = 'week';
        else if (daysRemaining <= 15) urgency = 'twoWeeks';
        else if (daysRemaining <= 30) urgency = 'month';

        const { plate, docSerial } = resolvePlateAndDocSerial(c.plate, c.documentSerial, c.notes);

        items.push({
          id: `CUST_${c.id}`,
          policyNo: c.policyNo || `MÜŞTERİ-${c.id}`,
          customerId: c.id,
          customerName: c.name,
          customerPhone: c.phone || '-',
          customerTc: c.identityNo || '-',
          type: c.insuranceType || 'Sigorta Poliçesi',
          company: 'Kayıtlı Şirket',
          startDate: c.policyStartDate || '-',
          endDate: c.policyEndDate,
          premium: 0,
          plate: plate !== '-' ? plate : '',
          documentSerial: docSerial !== '-' ? docSerial : '',
          daysRemaining,
          urgency,
          status: daysRemaining < 0 ? 'Biten' : 'Yaklaşıyor',
          source: 'customer',
          notes: c.notes
        });
      }
    });

    return items;
  }, [policies, customers]);

  // Metrik / Sayaç Hesaplamaları
  const counts = useMemo(() => {
    return {
      all: renewalItems.length,
      expired: renewalItems.filter(i => i.daysRemaining < 0).length,
      todayCritical: renewalItems.filter(i => i.daysRemaining >= 0 && i.daysRemaining <= 3).length,
      week: renewalItems.filter(i => i.daysRemaining >= 4 && i.daysRemaining <= 7).length,
      twoWeeks: renewalItems.filter(i => i.daysRemaining >= 8 && i.daysRemaining <= 15).length,
      month: renewalItems.filter(i => i.daysRemaining >= 16 && i.daysRemaining <= 30).length,
      future: renewalItems.filter(i => i.daysRemaining > 30).length,
    };
  }, [renewalItems]);

  // Filtreleme
  const filteredItems = useMemo(() => {
    return renewalItems.filter(item => {
      // 1. Arama terimi
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.customerName.toLowerCase().includes(term);
        const matchesPol = item.policyNo.toLowerCase().includes(term);
        const matchesPhone = item.customerPhone.toLowerCase().includes(term);
        const matchesTc = item.customerTc.toLowerCase().includes(term);
        const matchesPlate = item.plate.toLowerCase().includes(term);
        const matchesCompany = item.company.toLowerCase().includes(term);
        const matchesType = item.type.toLowerCase().includes(term);
        if (!matchesName && !matchesPol && !matchesPhone && !matchesTc && !matchesPlate && !matchesCompany && !matchesType) {
          return false;
        }
      }

      // 2. Aciliyet filtresi
      if (urgencyFilter === 'EXPIRED' && item.daysRemaining >= 0) return false;
      if (urgencyFilter === 'TODAY_CRITICAL' && (item.daysRemaining < 0 || item.daysRemaining > 3)) return false;
      if (urgencyFilter === 'WEEK' && (item.daysRemaining < 4 || item.daysRemaining > 7)) return false;
      if (urgencyFilter === 'TWO_WEEKS' && (item.daysRemaining < 8 || item.daysRemaining > 15)) return false;
      if (urgencyFilter === 'MONTH' && (item.daysRemaining < 16 || item.daysRemaining > 30)) return false;
      if (urgencyFilter === 'FUTURE' && item.daysRemaining <= 30) return false;

      // 3. Şirket filtresi
      if (companyFilter !== 'ALL' && item.company !== companyFilter) return false;

      // 4. Tür filtresi
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

      return true;
    });
  }, [renewalItems, searchTerm, urgencyFilter, companyFilter, typeFilter]);

  // Sıralama
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'daysRemaining') {
        comparison = a.daysRemaining - b.daysRemaining;
      } else if (sortField === 'endDate') {
        comparison = parseDateToTimestamp(a.endDate) - parseDateToTimestamp(b.endDate);
      } else if (sortField === 'customerName') {
        comparison = a.customerName.localeCompare(b.customerName, 'tr-TR');
      } else if (sortField === 'premium') {
        comparison = a.premium - b.premium;
      } else if (sortField === 'policyNo') {
        comparison = a.policyNo.localeCompare(b.policyNo);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortField, sortOrder]);

  // Sıralama başlığı tıklama
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // WhatsApp Mesajı Üretme
  const generateWhatsAppMessage = (item: RenewalItem): string => {
    const plateText = item.plate ? ` (${item.plate} plakalı araç)` : '';
    
    if (item.daysRemaining < 0) {
      return `Sayın ${item.customerName},\n\nElisam Sigorta'dan bildirilmektedir.\n${item.policyNo} numaralı ${item.type} poliçenizin süresi ${item.endDate} tarihinde (geçtiğimiz günlerde) sona ermiştir${plateText}.\n\n⚠️ Olası trafik cezaları veya hasar anında teminatsız kalmamanız adına, en avantajlı yenileme teklifinizi hemen hazırlayalım.\n\nİletişim ve teklif onayı için:\n📞 0551 438 77 71\nElisam Sigorta • Alanya`;
    } else if (item.daysRemaining === 0) {
      return `Sayın ${item.customerName},\n\nElisam Sigorta'dan önemli hatırlatma!\n${item.policyNo} numaralı ${item.type} poliçenizin süresi BUGÜN (${item.endDate}) sona ermektedir${plateText}.\n\n🚨 Poliçenizin kesintiye uğramaması için gün sonuna kadar bize ulaşarak yenilemenizi yapmanızı rica ederiz.\n\n📞 0551 438 77 71\nElisam Sigorta • Alanya`;
    } else if (item.daysRemaining <= 7) {
      return `Sayın ${item.customerName},\n\nElisam Sigorta'dan hatırlatma:\n${item.policyNo} numaralı ${item.type} poliçenizin bitişine son ${item.daysRemaining} gün kaldı (Bitiş Tarihi: ${item.endDate})${plateText}.\n\n🛡️ Size özel indirimli yenileme teklifleriniz hazırlandı. Detayları görüşmek ve poliçenizi onaylamak için bize ulaşabilirsiniz:\n📞 0551 438 77 71\nElisam Sigorta • Alanya`;
    } else {
      return `Sayın ${item.customerName},\n\nElisam Sigorta acentenizden bilgilendirme:\n${item.policyNo} numaralı ${item.type} poliçenizin bitişine ${item.daysRemaining} gün kalmıştır (Bitiş Tarihi: ${item.endDate})${plateText}.\n\n📅 Şimdiden piyasadaki en uygun sigorta şirketlerinden alternatifli tekliflerinizi hazırlamak isteriz. Uygun olduğunuzda bize yazabilirsiniz.\n📞 0551 438 77 71\nElisam Sigorta • Alanya`;
    }
  };

  // WhatsApp Gönderme
  const handleSendWhatsApp = (item: RenewalItem, customMsg?: string) => {
    const rawPhone = item.customerPhone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '90');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Geçerli bir telefon numarası bulunamadı: ' + item.customerPhone);
      return;
    }
    const message = customMsg || generateWhatsAppMessage(item);
    const url = `https://wa.me/${cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Mesaj panoya kopyalama
  const handleCopyMessage = (item: RenewalItem) => {
    const msg = generateWhatsAppMessage(item);
    navigator.clipboard.writeText(msg);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Tekil Telegram Bildirimi
  const handleSendTelegram = async (item: RenewalItem) => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      alert('Lütfen önce Ayarlar -> Hatırlatmalar & Telegram bölümünden Bot Token ve Chat ID bilgilerinizi kaydedin.');
      return;
    }
    setTelegramSending(true);
    try {
      const msg = `🔔 *Poliçe Yenileme Bildirimi*\n\n` +
        `👤 *Müşteri:* ${item.customerName}\n` +
        `📱 *Telefon:* ${item.customerPhone}\n` +
        `📄 *Poliçe No:* \`${item.policyNo}\`\n` +
        `🛡️ *Tür:* ${item.type} (${item.company})\n` +
        `${item.plate ? `🚗 *Plaka:* ${item.plate}\n` : ''}` +
        `📅 *Bitiş Tarihi:* ${item.endDate}\n` +
        `⏳ *Kalan Süre:* ${item.daysRemaining < 0 ? `⚠️ ${Math.abs(item.daysRemaining)} Gün Önce Bitti!` : `${item.daysRemaining} Gün Kaldı`}\n` +
        `💰 *Prim:* ${item.premium > 0 ? `${formatMoneyDisplay(item.premium)} ₺` : 'Belirtilmemiş'}\n\n` +
        `📞 [Müşteriyi Ara](tel:${item.customerPhone.replace(/\s+/g, '')})`;

      const res = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramConfig.chatId, text: msg, parse_mode: 'Markdown' })
      });
      const data = await res.json();
      if (data.ok) {
        alert(`✓ ${item.customerName} için Telegram bildirimi başarıyla iletildi!`);
      } else {
        alert('Telegram Hatası: ' + data.description);
      }
    } catch (err: any) {
      alert('Telegram gönderilemedi: ' + err.message);
    } finally {
      setTelegramSending(false);
    }
  };

  // Toplu Seçim İşlemleri
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === sortedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedItems.map(i => i.id));
    }
  };

  // Toplu Telegram Özeti Gönder
  const handleSendBatchTelegram = async () => {
    if (selectedIds.length === 0) {
      alert('Lütfen önce bildirim göndermek istediğiniz poliçeleri seçin.');
      return;
    }
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      alert('Lütfen önce Ayarlar bölümünden Telegram Bot Token ve Chat ID bilgilerinizi kaydedin.');
      return;
    }
    setTelegramSending(true);
    try {
      const selected = sortedItems.filter(i => selectedIds.includes(i.id));
      let text = `📋 *ELİSAM SİGORTA - TOPLU YENİLEME BİLDİRİMİ*\n`;
      text += `📅 *Rapor Tarihi:* ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}\n`;
      text += `📊 *Toplam Seçilen:* ${selected.length} Adet Poliçe\n\n`;

      selected.slice(0, 20).forEach((item, idx) => {
        text += `*${idx + 1}. ${item.customerName}*\n`;
        text += `   • Poliçe: \`${item.policyNo}\` (${item.type})\n`;
        text += `   • Bitiş: ${item.endDate} (${item.daysRemaining < 0 ? '⚠️ Süresi Geçti' : `${item.daysRemaining} gün kaldı`})\n`;
        text += `   • Tel: ${item.customerPhone} ${item.plate ? `| Plaka: ${item.plate}` : ''}\n\n`;
      });

      if (selected.length > 20) {
        text += `_...ve ${selected.length - 20} poliçe daha._\n`;
      }

      const res = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramConfig.chatId, text, parse_mode: 'Markdown' })
      });
      const data = await res.json();
      if (data.ok) {
        alert(`✓ ${selected.length} adet poliçe hatırlatma özeti Telegram kanalınıza başarıyla iletildi!`);
      } else {
        alert('Telegram Hatası: ' + data.description);
      }
    } catch (err: any) {
      alert('Hata oluştu: ' + err.message);
    } finally {
      setTelegramSending(false);
    }
  };

  // Excel (.xlsx) İndir (Geniş sütun aralıkları ve otomatik para formatlı)
  const handleExportCSV = async () => {
    const columns = [
      { header: 'Poliçe No', width: 20, align: 'center' as const },
      { header: 'Müşteri Adı', width: 34 },
      { header: 'TC Kimlik / VKN', width: 18, align: 'center' as const },
      { header: 'Telefon', width: 18, align: 'center' as const },
      { header: 'Poliçe Türü', width: 22 },
      { header: 'Sigorta Şirketi', width: 25 },
      { header: 'Başlangıç Tarihi', width: 18, align: 'center' as const },
      { header: 'Bitiş Tarihi', width: 18, align: 'center' as const },
      { header: 'Kalan Gün', width: 20, align: 'center' as const },
      { header: 'Aciliyet Durumu', width: 18, align: 'center' as const },
      { header: 'Plaka', width: 16, align: 'center' as const },
      { header: 'Belge Seri No', width: 18, align: 'center' as const },
      { header: 'Net Prim (TL)', width: 20, isCurrency: true },
      { header: 'Brüt Prim (TL)', width: 20, isCurrency: true }
    ];

    const rows = sortedItems.map(item => [
      item.policyNo,
      item.customerName,
      item.customerTc,
      item.customerPhone,
      item.type,
      item.company,
      item.startDate || '-',
      item.endDate,
      item.daysRemaining < 0 ? `Süresi Geçti (${Math.abs(item.daysRemaining)} gün)` : `${item.daysRemaining} gün`,
      getUrgencyBadge(item.daysRemaining).label,
      item.plate,
      item.documentSerial,
      item.netPremium !== undefined && item.netPremium > 0 ? item.netPremium : '-',
      item.premium
    ]);

    await downloadExcelSingleSheet({
      filename: `Elisam_Hatirlatma_Ve_Yenileme_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Yenileme Hatırlatıcı',
      columns,
      rows
    });
  };

  // Rozet Tasarımı
  const getUrgencyBadge = (days: number) => {
    if (days < 0) {
      return {
        label: `Süresi Geçti (${Math.abs(days)} gün)`,
        bg: '#fee2e2',
        color: '#991b1b',
        border: '#fca5a5',
        icon: AlertTriangle
      };
    } else if (days === 0) {
      return {
        label: 'Bugün Bitiyor!',
        bg: '#fef2f2',
        color: '#dc2626',
        border: '#ef4444',
        icon: AlertCircle
      };
    } else if (days <= 3) {
      return {
        label: `Kritik (${days} gün)`,
        bg: '#ffedd5',
        color: '#c2410c',
        border: '#fdba74',
        icon: Clock
      };
    } else if (days <= 7) {
      return {
        label: `1 Hafta (${days} gün)`,
        bg: '#fef3c7',
        color: '#b45309',
        border: '#fde68a',
        icon: Calendar
      };
    } else if (days <= 15) {
      return {
        label: `15 Gün (${days} gün)`,
        bg: '#e0e7ff',
        color: '#3730a3',
        border: '#c7d2fe',
        icon: CalendarDays
      };
    } else if (days <= 30) {
      return {
        label: `1 Ay (${days} gün)`,
        bg: '#e0f2fe',
        color: '#0369a1',
        border: '#bae6fd',
        icon: CalendarDays
      };
    } else {
      return {
        label: `${days} gün kaldı`,
        bg: '#f0fdf4',
        color: '#15803d',
        border: '#bbf7d0',
        icon: CheckCircle2
      };
    }
  };

  // Benzersiz Şirketler ve Türler
  const uniqueCompanies = Array.from(new Set(renewalItems.map(i => i.company))).filter(Boolean);
  const uniqueTypes = Array.from(new Set(renewalItems.map(i => i.type))).filter(Boolean);

  return (
    <div style={{ paddingBottom: '50px' }}>
      
      {/* 1. ÜST BAŞLIK VE HIZLI AKSİYONLAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '10px', color: '#2563eb' }}>
              <Bell size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Hatırlatıcı & Yenileme Bildirim Merkezi
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '3px 0 0 0' }}>
                Poliçe bitiş sürelerine göre akıllı bildirimler, WhatsApp & Telegram hatırlatmaları ve otomatik zamanlama takvimi
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportCSV}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '9px 14px', 
              backgroundColor: 'white', 
              color: '#0f172a', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              fontWeight: 650, 
              cursor: 'pointer' 
            }}
          >
            <Download size={16} /> Excel (CSV) İndir
          </button>

          <Link
            href="/crm/sigorta/ayarlar"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '9px 14px', 
              backgroundColor: '#f8fafc', 
              color: '#475569', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              fontWeight: 650, 
              textDecoration: 'none' 
            }}
          >
            <Settings size={16} /> Bildirim Ayarları
          </Link>
        </div>
      </div>

      {/* 2. SİSTEM HATIRLATMALARI NE ZAMAN YAPACAK? (BİLGİLENDİRME & ZAMANLAMA ÇİZELGESİ) */}
      <div style={{ 
        backgroundColor: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px', 
        marginBottom: '22px', 
        overflow: 'hidden' 
      }}>
        <div 
          onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
          style={{ 
            padding: '14px 18px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            backgroundColor: '#ffffff',
            borderBottom: isScheduleExpanded ? '1px solid #e2e8f0' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#2563eb" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              Sistem Hatırlatmaları Ne Zaman Yapacak? (Otomatik Bildirim Çizelgesi)
            </span>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 700 }}>
              Aktif Çalışıyor
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.82rem' }}>
            <span>{isScheduleExpanded ? 'Gizle' : 'Çizelgeyi Göster'}</span>
            {isScheduleExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {isScheduleExpanded && (
          <div style={{ padding: '18px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              
              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: 750, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <CalendarDays size={16} /> 1. Aşama: 30 Gün Kaldı (1 Ay)
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                  Müşteriye erken bilgilendirme mesajı hazırlanır. Fiyat artışlarından önce en avantajlı teklif hazırlığı yapılır.
                </p>
              </div>

              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', fontWeight: 750, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <Clock size={16} /> 2. Aşama: 15 Gün Kaldı
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                  Karar aşaması takibi. Müşteriye alternatif şirketlerin teklifleri ve taksit imkanları sunulur.
                </p>
              </div>

              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontWeight: 750, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <AlertTriangle size={16} /> 3. Aşama: 7 Gün Kaldı (1 Hafta)
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                  Acil yenileme çağrısı. Son haftaya girildiği, poliçe günü geçmeden onay alınması gerektiği iletilir.
                </p>
              </div>

              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 750, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <AlertCircle size={16} /> 4. Aşama: Son 1-3 Gün & Bugün
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                  Kritik son gün uyarısı. Sigortasız kalma riskine karşı acente botu ve tek tıkla WhatsApp uyarısı gönderilir.
                </p>
              </div>

              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', fontWeight: 750, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <ShieldAlert size={16} /> 5. Aşama: Süresi Geçti
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                  Gecikme zammı ve trafik cezası yememesi için müşteriye anlık kurtarma yenilemesi hatırlatılır.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 3. METRİK VE HIZLI FİLTRE KARTLARI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        
        <button
          onClick={() => setUrgencyFilter('ALL')}
          style={{
            padding: '12px',
            borderRadius: '10px',
            border: urgencyFilter === 'ALL' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            backgroundColor: urgencyFilter === 'ALL' ? '#eff6ff' : 'white',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>TÜMÜ</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{counts.all}</div>
          <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 650 }}>Tüm Poliçeler</div>
        </button>

        <button
          onClick={() => setUrgencyFilter('EXPIRED')}
          style={{
            padding: '12px',
            borderRadius: '10px',
            border: urgencyFilter === 'EXPIRED' ? '2px solid #dc2626' : '1px solid #fecaca',
            backgroundColor: urgencyFilter === 'EXPIRED' ? '#fef2f2' : 'white',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}>SÜRESİ GEÇTİ</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{counts.expired}</div>
          <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 650 }}>Biten Poliçeler</div>
        </button>

        <button
          onClick={() => setUrgencyFilter('TODAY_CRITICAL')}
          style={{
            padding: '12px',
            borderRadius: '10px',
            border: urgencyFilter === 'TODAY_CRITICAL' ? '2px solid #ea580c' : '1px solid #ffedd5',
            backgroundColor: urgencyFilter === 'TODAY_CRITICAL' ? '#fff7ed' : 'white',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c2410c' }}>1-3 GÜN & BUGÜN</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>{counts.todayCritical}</div>
          <div style={{ fontSize: '0.72rem', color: '#c2410c', fontWeight: 650 }}>Acil Yenileme</div>
        </button>

        <button
          onClick={() => setUrgencyFilter('WEEK')}
          style={{
            padding: '12px',
            borderRadius: '10px',
            border: urgencyFilter === 'WEEK' ? '2px solid #d97706' : '1px solid #fef3c7',
            backgroundColor: urgencyFilter === 'WEEK' ? '#fffbeb' : 'white',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>1 HAFTA KALDI</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>{counts.week}</div>
          <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 650 }}>4 - 7 Gün</div>
        </button>

        <button
          onClick={() => setUrgencyFilter('TWO_WEEKS')}
          style={{
            padding: '12px',
            borderRadius: '10px',
            border: urgencyFilter === 'TWO_WEEKS' ? '2px solid #4f46e5' : '1px solid #e0e7ff',
            backgroundColor: urgencyFilter === 'TWO_WEEKS' ? '#eef2ff' : 'white',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca' }}>15 GÜN KALDI</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4f46e5', marginTop: '2px' }}>{counts.twoWeeks}</div>
          <div style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 650 }}>8 - 15 Gün</div>
        </button>

        <button
          onClick={() => setUrgencyFilter('MONTH')}
          style={{
            padding: '12px',
            borderRadius: '10px',
            border: urgencyFilter === 'MONTH' ? '2px solid #0284c7' : '1px solid #e0f2fe',
            backgroundColor: urgencyFilter === 'MONTH' ? '#f0f9ff' : 'white',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}>1 AY KALDI</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>{counts.month}</div>
          <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 650 }}>16 - 30 Gün</div>
        </button>

        <button
          onClick={() => setUrgencyFilter('FUTURE')}
          style={{
            padding: '12px',
            borderRadius: '10px',
            border: urgencyFilter === 'FUTURE' ? '2px solid #16a34a' : '1px solid #dcfce7',
            backgroundColor: urgencyFilter === 'FUTURE' ? '#f0fdf4' : 'white',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>GELECEK</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>{counts.future}</div>
          <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 650 }}>30+ Gün</div>
        </button>

      </div>

      {/* 4. ARAMA, ŞİRKET/TÜR FİLTRESİ VE TOPLU AKSİYON ÇUBUĞU */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '16px', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0', 
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        
        {/* Sol: Arama ve Seçimler */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', flexWrap: 'wrap' }}>
          
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Müşteri adı, plaka, TC, poliçe no veya telefon ile ara..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.83rem',
              outline: 'none',
              backgroundColor: 'white'
            }}
          >
            <option value="ALL">Tüm Poliçe Türleri</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.83rem',
              outline: 'none',
              backgroundColor: 'white'
            }}
          >
            <option value="ALL">Tüm Şirketler</option>
            {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

        </div>

        {/* Sağ: Toplu Seçim ve Bildirim Butonları */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {selectedIds.length > 0 && (
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563eb', padding: '4px 8px', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
              {selectedIds.length} Seçildi
            </span>
          )}

          <button
            onClick={handleSelectAllFiltered}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: 'white',
              fontSize: '0.82rem',
              fontWeight: 650,
              cursor: 'pointer'
            }}
          >
            {selectedIds.length === sortedItems.length && sortedItems.length > 0 ? 'Seçimi Kaldır' : 'Tümünü Seç'}
          </button>

          <button
            onClick={handleSendBatchTelegram}
            disabled={selectedIds.length === 0 || telegramSending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: selectedIds.length > 0 ? '#0284c7' : '#e2e8f0',
              color: selectedIds.length > 0 ? 'white' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            <SendHorizontal size={14} /> Seçilenlere Telegram Özeti Gönder
          </button>

        </div>

      </div>

      {/* 5. POLİÇE VE HATIRLATMA TABLOSU */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                
                <th style={{ width: '40px', padding: '12px 14px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={sortedItems.length > 0 && selectedIds.length === sortedItems.length}
                    onChange={handleSelectAllFiltered}
                    style={{ cursor: 'pointer' }}
                  />
                </th>

                <th 
                  onClick={() => handleSort('daysRemaining')}
                  style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 750, color: '#475569', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Kalan Süre / Durum
                    {sortField === 'daysRemaining' ? (sortOrder === 'asc' ? <ArrowUp size={14} color="#2563eb" /> : <ArrowDown size={14} color="#2563eb" />) : <ArrowUpDown size={12} color="#cbd5e1" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('customerName')}
                  style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 750, color: '#475569', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Müşteri Bilgileri
                    {sortField === 'customerName' ? (sortOrder === 'asc' ? <ArrowUp size={14} color="#2563eb" /> : <ArrowDown size={14} color="#2563eb" />) : <ArrowUpDown size={12} color="#cbd5e1" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('policyNo')}
                  style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 750, color: '#475569', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Poliçe No / Tür
                    {sortField === 'policyNo' ? (sortOrder === 'asc' ? <ArrowUp size={14} color="#2563eb" /> : <ArrowDown size={14} color="#2563eb" />) : <ArrowUpDown size={12} color="#cbd5e1" />}
                  </div>
                </th>

                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 750, color: '#475569' }}>
                  Plaka & Belge Seri
                </th>

                <th 
                  onClick={() => handleSort('endDate')}
                  style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 750, color: '#475569', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Bitiş Tarihi
                    {sortField === 'endDate' ? (sortOrder === 'asc' ? <ArrowUp size={14} color="#2563eb" /> : <ArrowDown size={14} color="#2563eb" />) : <ArrowUpDown size={12} color="#cbd5e1" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('premium')}
                  style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 750, color: '#475569', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Prim (TL)
                    {sortField === 'premium' ? (sortOrder === 'asc' ? <ArrowUp size={14} color="#2563eb" /> : <ArrowDown size={14} color="#2563eb" />) : <ArrowUpDown size={12} color="#cbd5e1" />}
                  </div>
                </th>

                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 750, color: '#475569', textAlign: 'center' }}>
                  Hatırlatma & Bildirim İşlemleri
                </th>

              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} className={styles.spinIcon} style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    Mevcut müşteri ve poliçe verileri hatırlatıcı merkezine yükleniyor...
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Seçili kriterde hatırlatma kaydı bulunamadı
                    </div>
                    <div style={{ fontSize: '0.83rem', color: '#94a3b8' }}>
                      Arama terimini veya aciliyet filtresini değiştirerek tekrar deneyebilirsiniz.
                    </div>
                  </td>
                </tr>
              ) : (
                sortedItems.map(item => {
                  const badge = getUrgencyBadge(item.daysRemaining);
                  const BadgeIcon = badge.icon;
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* Kalan Süre Rozeti */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontSize: '0.78rem',
                          fontWeight: 750
                        }}>
                          <BadgeIcon size={14} />
                          {badge.label}
                        </div>
                      </td>

                      {/* Müşteri Bilgileri */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '0.9rem' }}>
                          {item.customerName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📞 {item.customerPhone}</span>
                          {item.customerTc && item.customerTc !== '-' && <span>• TC: {item.customerTc}</span>}
                        </div>
                      </td>

                      {/* Poliçe No & Şirket */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#1e40af', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {item.policyNo}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 650, marginTop: '2px' }}>
                          {item.type} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({item.company})</span>
                        </div>
                      </td>

                      {/* Plaka & Belge Seri */}
                      <td style={{ padding: '12px 14px' }}>
                        {item.plate ? (
                          <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontWeight: 750, fontSize: '0.8rem', color: '#1e293b' }}>
                            🚗 {item.plate}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>-</span>
                        )}
                        {item.documentSerial && (
                          <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '3px', fontWeight: 650 }}>
                            Seri: {item.documentSerial}
                          </div>
                        )}
                      </td>

                      {/* Bitiş Tarihi */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 750, color: item.daysRemaining <= 7 ? '#dc2626' : '#0f172a', fontSize: '0.88rem' }}>
                          {item.endDate}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '1px' }}>
                          Başlangıç: {item.startDate || '-'}
                        </div>
                      </td>

                      {/* Prim Tutarı (Net & Brüt) */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                          {item.premium > 0 ? `${formatMoneyDisplay(item.premium)} ₺` : '-'}
                        </div>
                        {item.netPremium && item.netPremium > 0 && (
                          <div style={{ fontSize: '0.74rem', color: '#0d9488', fontWeight: 700, marginTop: '2px' }}>
                            Net: {formatMoneyDisplay(item.netPremium)} ₺
                          </div>
                        )}
                      </td>


                      {/* HIZLI AKSİYONLAR (WHATSAPP, TELEGRAM, ARAMA, KOPYALA) */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          
                          {/* WhatsApp Butonu */}
                          <button
                            onClick={() => handleSendWhatsApp(item)}
                            title="WhatsApp ile Hatırlatma Mesajı Gönder"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              backgroundColor: '#25D366',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </button>

                          {/* Mesajı Düzenle & Gönder Modalı */}
                          <button
                            onClick={() => {
                              setActiveMessageModal(item);
                              setCustomMessageText(generateWhatsAppMessage(item));
                            }}
                            title="Mesajı İncele & Düzenle"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Sparkles size={14} />
                          </button>

                          {/* Telegram Bot Butonu */}
                          <button
                            onClick={() => handleSendTelegram(item)}
                            title="Acente Telegram Botuna Bildir"
                            disabled={telegramSending}
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#0284c7',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Send size={14} />
                          </button>

                          {/* Hızlı Arama Butonu */}
                          {item.customerPhone && item.customerPhone !== '-' && (
                            <a
                              href={`tel:${item.customerPhone.replace(/\s+/g, '')}`}
                              title="Müşteriyi Ara"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '6px 8px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                textDecoration: 'none'
                              }}
                            >
                              <Phone size={14} />
                            </a>
                          )}

                          {/* Mesaj Metnini Kopyala */}
                          <button
                            onClick={() => handleCopyMessage(item)}
                            title="Hatırlatma Metnini Kopyala"
                            style={{
                              padding: '6px 8px',
                              backgroundColor: copiedId === item.id ? '#ecfdf5' : '#f8fafc',
                              color: copiedId === item.id ? '#059669' : '#64748b',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            {copiedId === item.id ? <Check size={14} color="#059669" /> : <Copy size={14} />}
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

        {/* Tablo Alt Bilgi */}
        <div style={{ padding: '12px 18px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#64748b', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            Toplam <strong>{sortedItems.length}</strong> hatırlatma kaydı listeleniyor {selectedIds.length > 0 && `(Seçili: ${selectedIds.length} adet)`}.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
            Mevcut müşteri portföyü ve poliçelerinizle tam senkronize.
          </div>
        </div>

      </div>

      {/* 6. MESAJ DÜZENLEME & GÖNDERME MODALI */}
      {activeMessageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            
            <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Hatırlatma Mesajı Gönder
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  {activeMessageModal.customerName} • {activeMessageModal.customerPhone}
                </div>
              </div>
              <button 
                onClick={() => setActiveMessageModal(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Gönderilecek Mesaj Metni (İsteğe Göre Düzenleyebilirsiniz):
              </label>
              <textarea
                value={customMessageText}
                onChange={(e) => setCustomMessageText(e.target.value)}
                rows={9}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(customMessageText);
                    alert('Mesaj panoya kopyalandı!');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 650,
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={14} /> Metni Kopyala
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActiveMessageModal(null)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'transparent',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 650,
                      cursor: 'pointer'
                    }}
                  >
                    Vazgeç
                  </button>

                  <button
                    onClick={() => {
                      handleSendWhatsApp(activeMessageModal, customMessageText);
                      setActiveMessageModal(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 750,
                      cursor: 'pointer'
                    }}
                  >
                    <MessageCircle size={16} /> WhatsApp ile Aç ve Gönder
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
