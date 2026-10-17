import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Customer, Policy } from '@/data/crmData';
import { RentCustomer, RentalBooking, RentVehicle } from '@/data/rentCrmData';
import { resolvePlateAndDocSerial, extractReferenceFromNotes, sanitizeReference } from './excelHelper';

export interface CariMovement {
  id: string;
  date: string;               // Tarih (DD.MM.YYYY)
  dueDate?: string;           // Vade Tarihi (opsiyonel)
  receiptNo?: string;         // Fiş / Dekont / Belge No
  customerId: string;         // Müşteri ID
  customerName: string;       // Müşteri Adı / Ünvanı
  description: string;        // Açıklama
  movementType: 
    | 'Poliçe Tahakkuku' 
    | 'Banka Giden Havale' 
    | 'Banka Gelen Havale' 
    | 'Kredi Kartı Tahsilat' 
    | 'Hizmet Alım Faturası' 
    | 'Cari Mahsup Çıkışı' 
    | 'Cari Hareket Girişi' 
    | 'Poliçe İptal / İade' 
    | 'Tarih Öncesi Devir Bakiye';
  debitAmount: number;        // Borç (TL)
  creditAmount: number;       // Alacak (TL)
  notes?: string;
  deletedAt?: string;
}

/** Yeni CRM kayıtları için tahmin edilmesi ve çakışması zor bir ID üretir. */
export function generateUniqueCrmId(prefix: 'CUST' | 'CAR' | 'POL' | 'RENT'): string {
  const cryptoApi = globalThis.crypto;
  const randomId = cryptoApi?.randomUUID?.();
  if (randomId) return `${prefix}-${randomId.toUpperCase()}`;

  if (cryptoApi?.getRandomValues) {
    const randomBytes = cryptoApi.getRandomValues(new Uint8Array(16));
    const fallbackId = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${prefix}-${fallbackId.toUpperCase()}`;
  }

  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2).toUpperCase()}-${Math.random().toString(36).slice(2).toUpperCase()}`;
}

const SUPABASE_PAGE_SIZE = 1000;

async function fetchSupabaseTableAll(
  table: string,
  select: string,
  order?: { column: string; ascending: boolean }
): Promise<{ data: any[] | null; error: { message: string } | null }> {
  const all: any[] = [];
  let from = 0;
  while (true) {
    let query = supabase.from(table).select(select).range(from, from + SUPABASE_PAGE_SIZE - 1);
    if (order) {
      query = query.order(order.column, { ascending: order.ascending });
    }
    const { data, error } = await query;
    if (error) return { data: null, error };
    if (!data?.length) break;
    all.push(...data);
    if (data.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }
  return { data: all, error: null };
}

export function normalizeCariCustomerName(n: string): string {
  return n.toLocaleLowerCase('tr-TR').trim();
}

/** Finans listesinde cari hareket ünvanı için sabit seçim kimliği */
export function cariCustomerOptionId(normalizedName: string): string {
  return `CARI:${normalizedName}`;
}

export function isSyntheticCariCustomerId(id: string): boolean {
  return id.startsWith('CARI:') || id.startsWith('NAME-');
}

/** customers tablosu + cari_movements içindeki benzersiz müşteri ünvanları (ünvan cari kayıttaki gibidir) */
export function mergeCustomersWithCariMovements(
  customers: Customer[],
  movements: CariMovement[]
): Customer[] {
  const normalizeName = normalizeCariCustomerName;
  const byName = new Map<string, Customer>();

  for (const m of movements) {
    const name = m.customerName?.trim();
    if (!name) continue;
    const nameKey = normalizeName(name);
    if (byName.has(nameKey)) continue;

    const matchedByName = customers.find((c) => normalizeName(c.name) === nameKey);
    if (matchedByName) {
      byName.set(nameKey, matchedByName);
      continue;
    }

    const isCorp = /(?:ŞİRKETİ|LİMİTED|LTD|A\.Ş|SANAYİ|TİCARET|AŞ|HOLDİNG|NAKLİYAT)/i.test(name);
    byName.set(nameKey, {
      id: cariCustomerOptionId(nameKey),
      name,
      type: isCorp ? 'Kurumsal' : 'Bireysel',
      phone: '-',
      email: '-',
      identityNo: '-',
      address: 'Alanya / Antalya',
      createdAt: new Date().toLocaleDateString('tr-TR'),
      notes: m.customerId?.trim() ? `Cari bağlantı ID: ${m.customerId.trim()}` : 'Cari hareketten tanımlandı.',
    });
  }

  for (const c of customers) {
    const nameKey = normalizeName(c.name);
    if (!byName.has(nameKey)) byName.set(nameKey, c);
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

// -------------------------------------------------------------
// 1. MÜŞTERİLER (CUSTOMERS)
// -------------------------------------------------------------
export async function fetchCustomersFromCloud(): Promise<Customer[]> {
  try {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('elisam_customers');
      return saved ? JSON.parse(saved) : [];
    }

    const [custResult, movResult] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      fetchSupabaseTableAll('cari_movements', 'customer_id, customer_name'),
    ]);

    if (custResult.error) {
      console.warn('Supabase customers fetch error, using localStorage fallback:', custResult.error.message);
      const saved = localStorage.getItem('elisam_customers');
      return saved ? JSON.parse(saved) : [];
    }

    const data = custResult.data || [];

    const existingLocal: Customer[] = (() => {
      try {
        const s = localStorage.getItem('elisam_customers');
        return s ? JSON.parse(s) : [];
      } catch { return []; }
    })();
    const localMap = new Map(existingLocal.map(lc => [lc.id, lc]));

    const mapped: Customer[] = data.map((c: any) => {
      const local = localMap.get(c.id);
      const rawNotes = c.notes || local?.notes || '';
      const rawPlate = c.plate || local?.plate || undefined;
      const rawDocSerial = c.document_serial || c.documentSerial || local?.documentSerial || undefined;
      const resolvedVeh = resolvePlateAndDocSerial(rawPlate, rawDocSerial, rawNotes);

      const cleanPlate = resolvedVeh.plate !== '-' ? resolvedVeh.plate : (rawPlate || undefined);
      const cleanDocSerial = resolvedVeh.docSerial !== '-' ? resolvedVeh.docSerial : (rawDocSerial || undefined);

      return {
        id: c.id,
        name: c.name,
        type: c.type || 'Bireysel',
        identityNo: c.identity_no || c.identityNo || local?.identityNo || '-',
        phone: c.phone || local?.phone || '-',
        email: c.email || local?.email || '-',
        address: c.address || local?.address || 'Alanya / Antalya',
        birthDate: c.birth_date || c.birthDate || local?.birthDate || undefined,
        reference: sanitizeReference(c.reference || local?.reference, rawNotes),
        notes: rawNotes || undefined,
        createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('tr-TR') : (local?.createdAt || new Date().toLocaleDateString('tr-TR')),
        policyNo: c.policy_no || c.policyNo || local?.policyNo || undefined,
        insuranceType: c.insurance_type || c.insuranceType || local?.insuranceType || undefined,
        policyStartDate: c.policy_start_date || c.policyStartDate || local?.policyStartDate || undefined,
        policyEndDate: c.policy_end_date || c.policyEndDate || local?.policyEndDate || undefined,
        plate: cleanPlate,
        documentSerial: cleanDocSerial,
        vehicleUsage: c.vehicle_usage || c.vehicleUsage || local?.vehicleUsage || undefined,
        vehicleBrand: c.vehicle_brand || c.vehicleBrand || local?.vehicleBrand || undefined,
        vehicleType: c.vehicle_type || c.vehicleType || local?.vehicleType || undefined,
        vehicleModelYear: c.vehicle_model_year || c.vehicleModelYear || local?.vehicleModelYear || undefined,
        vehicleRegistrationDate: c.vehicle_registration_date || c.vehicleRegistrationDate || local?.vehicleRegistrationDate || undefined,
        vehicleValue: c.vehicle_value || c.vehicleValue || local?.vehicleValue || undefined
      };
    });

    if (movResult.error) {
      console.warn('Supabase cari_movements (müşteri listesi) fetch error:', movResult.error.message);
    }

    const movStubs: CariMovement[] = (movResult.data || []).map((m: any) => ({
      id: '',
      date: '',
      customerId: m.customer_id ?? '',
      customerName: m.customer_name ?? '',
      description: '',
      movementType: 'Cari Hareket Girişi',
      debitAmount: 0,
      creditAmount: 0,
    }));

    const merged = mergeCustomersWithCariMovements(mapped, movStubs);
    localStorage.setItem('elisam_customers', JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('fetchCustomersFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_customers');
  return saved ? JSON.parse(saved) : [];
}

export async function upsertCustomerToCloud(customer: Customer): Promise<void> {
  const cleanRef = sanitizeReference(customer.reference, customer.notes);
  const sanitizedCustomer: Customer = {
    ...customer,
    reference: cleanRef
  };

  if (isSupabaseConfigured()) {
    let customerNotes = customer.notes || '';
    if (cleanRef && !customerNotes.toLowerCase().includes('referans:') && !customerNotes.toLowerCase().includes('ref:')) {
      customerNotes = (customerNotes ? customerNotes + '\n' : '') + `Referans: ${cleanRef}`;
    }
    if (customer.documentSerial && !customerNotes.toLowerCase().includes('belge seri') && !customerNotes.toLowerCase().includes('ruhsat seri')) {
      customerNotes = (customerNotes ? customerNotes + '\n' : '') + `Belge Seri: ${customer.documentSerial}`;
    }
    if (customer.plate && !customerNotes.toLowerCase().includes('plaka:')) {
      customerNotes = (customerNotes ? customerNotes + '\n' : '') + `Plaka: ${customer.plate}`;
    }

    const baseRow: any = {
      id: customer.id,
      name: customer.name,
      type: customer.type,
      identity_no: customer.identityNo,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      birth_date: customer.birthDate || null,
      notes: customerNotes || null
    };

    const extendedRow: any = {
      ...baseRow,
      ...(customer.reference ? { reference: customer.reference } : {}),
      ...(customer.plate ? { plate: customer.plate } : {}),
      ...(customer.documentSerial ? { document_serial: customer.documentSerial } : {}),
      ...(customer.policyNo ? { policy_no: customer.policyNo } : {}),
      ...(customer.insuranceType ? { insurance_type: customer.insuranceType } : {}),
      ...(customer.vehicleUsage ? { vehicle_usage: customer.vehicleUsage } : {}),
      ...(customer.vehicleBrand ? { vehicle_brand: customer.vehicleBrand } : {})
    };

    const { error: extendedError } = await supabase.from('customers').upsert(extendedRow);
    if (extendedError) {
      const { error: baseError } = await supabase.from('customers').upsert(baseRow);
      if (baseError) throw new Error(baseError.message);
    }
  }

  const saved = localStorage.getItem('elisam_customers');
  const list: Customer[] = saved ? JSON.parse(saved) : [];
  const updated = [sanitizedCustomer, ...list.filter(c => c.id !== customer.id)];
  localStorage.setItem('elisam_customers', JSON.stringify(updated));
}

export async function deleteCustomerFromCloud(customerId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { data: linkedMovements, error: movementCheckError } = await supabase
      .from('cari_movements')
      .select('id')
      .eq('customer_id', customerId)
      .limit(1);
    if (movementCheckError) throw new Error(movementCheckError.message);
    if (linkedMovements?.length) {
      throw new Error('Bu cariye bağlı finans hareketleri var; müşteri silinmedi.');
    }

    const { data, error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error(`Silinecek müşteri bulunamadı: ${customerId}`);
  }

  const saved = localStorage.getItem('elisam_customers');
  if (saved) {
    const list: Customer[] = JSON.parse(saved);
    localStorage.setItem('elisam_customers', JSON.stringify(list.filter(c => c.id !== customerId)));
  }
}

// -------------------------------------------------------------
// HELPER: Para Birimi & Sayı Formatlama / Düzeltme
// -------------------------------------------------------------
export function normalizeMoney(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return Math.round(val * 100) / 100;
  
  const str = String(val).trim();
  if (!str) return 0;

  // If string contains both comma and dot, check which one comes last (decimal separator)
  if (str.includes(',') && str.includes('.')) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Turkish format: 1.234,56
      const clean = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
      const num = Number(clean);
      return isNaN(num) ? 0 : Math.round(num * 100) / 100;
    } else {
      // International / English format: 1,234.56
      const clean = str.replace(/,/g, '').replace(/[^\d.]/g, '');
      const num = Number(clean);
      return isNaN(num) ? 0 : Math.round(num * 100) / 100;
    }
  }

  // If string contains comma, it is TR formatted decimal (e.g. 12.386,50 or 55144,94)
  if (str.includes(',')) {
    const clean = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    const num = Number(clean);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }

  // If string contains dot:
  if (str.includes('.')) {
    const parts = str.split('.');
    // Multiple dots (e.g. 1.234.567) -> all thousands separators
    if (parts.length > 2) {
      const clean = str.replace(/\./g, '');
      return Number(clean) || 0;
    }
    // Single dot: if fractional part has 3 digits (e.g. 12.386), it is a thousand separator
    if (parts[1].length === 3) {
      const clean = str.replace(/\./g, '');
      return Number(clean) || 0;
    }
    // Otherwise standard decimal dot (e.g. 12386.5 or 12386.50)
    const num = Number(str.replace(/[^\d.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }


  const clean = str.replace(/[^\d]/g, '');
  return Number(clean) || 0;
}

export function formatMoneyInput(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).trim();
  if (!str) return '';

  const hasComma = str.includes(',');
  let parts: string[] = [];

  if (hasComma) {
    parts = str.split(',');
  } else {
    const dotParts = str.split('.');
    if (dotParts.length === 2 && (dotParts[1].length === 1 || dotParts[1].length === 2)) {
      parts = dotParts;
    } else {
      parts = [str.replace(/\./g, '')];
    }
  }

  const rawInt = parts[0].replace(/[^\d]/g, '');
  const formattedInt = rawInt ? rawInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : (hasComma ? '0' : '');

  if (parts.length > 1 || hasComma) {
    const kurus = (parts[1] || '').replace(/[^\d]/g, '').slice(0, 2);
    return `${formattedInt},${kurus}`;
  }

  return formattedInt;
}

export function formatMoneyDisplay(val: any): string {
  const num = normalizeMoney(val);
  const hasKurus = Math.abs(num - Math.round(num)) > 0.001;
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: hasKurus ? 2 : 0,
    maximumFractionDigits: 2
  });
}

// -------------------------------------------------------------
// 2. POLİÇELER (POLICIES)
// -------------------------------------------------------------
export async function fetchPoliciesFromCloud(): Promise<Policy[]> {
  try {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('elisam_policies');
      if (saved) {
        const list: Policy[] = JSON.parse(saved);
        return list.map(p => ({ ...p, premium: normalizeMoney(p.premium), paidAmount: normalizeMoney(p.paidAmount), remainingAmount: Math.max(0, normalizeMoney(p.premium) - normalizeMoney(p.paidAmount)) }));
      }
      return [];
    }

    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase policies fetch error, fallback to local:', error.message);
      const saved = localStorage.getItem('elisam_policies');
      if (saved) {
        const list: Policy[] = JSON.parse(saved);
        return list.map(p => ({ ...p, premium: normalizeMoney(p.premium), paidAmount: normalizeMoney(p.paidAmount), remainingAmount: Math.max(0, normalizeMoney(p.premium) - normalizeMoney(p.paidAmount)) }));
      }
      return [];
    }

    if (data) {
      const existingLocal: Policy[] = (() => {
        try {
          const s = localStorage.getItem('elisam_policies');
          return s ? JSON.parse(s) : [];
        } catch { return []; }
      })();
      const localMap = new Map(existingLocal.map(lp => [lp.id, lp]));

      const mapped: Policy[] = data.map((p: any) => {
        const local = localMap.get(p.id) || (p.policy_no ? localMap.get(p.policy_no) : undefined);
        const rawNotes = p.notes || local?.notes || '';

        const extractFromNotes = (regex: RegExp) => {
          if (!rawNotes) return undefined;
          const match = rawNotes.match(regex);
          return match ? match[1].trim() : undefined;
        };

        const rawNetFromNotes = extractFromNotes(/(?:Net\s*Pr[iİıI]m|Net\s*Tutar|Net\s*P[iİıI]r[iİıI]m|Net)\s*[:=\s]+\s*([0-9.,]+)/i);
        const netFromNotes = rawNetFromNotes ? normalizeMoney(rawNetFromNotes) : undefined;

        const rawGrossFromNotes = extractFromNotes(/(?:Br[üuÜU]t+?\s*Pr[iİıI]m|B[üuÜU]r[üuÜU]t\s*Pr[iİıI]m|B[üuÜU]r[üuÜU]t\s*P[iİıI]r[iİıI]m|Br[üuÜU]t\s*Tutar|Br[üuÜU]t+?|B[üuÜU]r[üuÜU]t)\s*[:=\s]+\s*([0-9.,]+)/i);
        const grossFromNotes = rawGrossFromNotes ? normalizeMoney(rawGrossFromNotes) : undefined;

        const basePrem = normalizeMoney(p.premium !== undefined && p.premium !== null ? p.premium : (local?.premium || 0));
        const prem = (grossFromNotes && grossFromNotes > 0 && Math.abs(grossFromNotes - basePrem) < 1) ? grossFromNotes : (basePrem || grossFromNotes || 0);

        const netPrem = (p.net_premium !== undefined && p.net_premium !== null) 
          ? normalizeMoney(p.net_premium) 
          : (p.netPremium !== undefined && p.netPremium !== null 
              ? normalizeMoney(p.netPremium) 
              : (local?.netPremium !== undefined && local.netPremium > 0
                  ? normalizeMoney(local.netPremium) 
                  : netFromNotes));

        const paid = normalizeMoney(p.paid_amount !== undefined && p.paid_amount !== null ? p.paid_amount : (local?.paidAmount || 0));
        const rem = Math.max(0, prem - paid);

        const rawPlate = p.plate || local?.plate || undefined;
        const rawDocSerial = p.document_serial || p.documentSerial || local?.documentSerial || undefined;
        const resolvedVeh = resolvePlateAndDocSerial(rawPlate, rawDocSerial, rawNotes);

        const cleanPlate = resolvedVeh.plate !== '-' ? resolvedVeh.plate : (rawPlate || undefined);
        const cleanDocSerial = resolvedVeh.docSerial !== '-' ? resolvedVeh.docSerial : (rawDocSerial || undefined);

        const vUsage = p.vehicle_usage || p.vehicleUsage || local?.vehicleUsage || extractFromNotes(/(?:Araç\s*Kullanım\s*Tarzı|Kullanım\s*Tarzı|Kullanım\s*Şekli):\s*(.*)/i);
        const vBrand = p.vehicle_brand || p.vehicleBrand || local?.vehicleBrand || extractFromNotes(/(?:Marka|Araç\s*Markası):\s*(.*)/i);
        const vType = p.vehicle_type || p.vehicleType || local?.vehicleType || extractFromNotes(/(?:Tip|Model\s*Tipi|Araç\s*Tipi|Model\s*\/\s*Tip):\s*(.*)/i);
        const vYear = p.vehicle_model_year || p.vehicleModelYear || local?.vehicleModelYear || extractFromNotes(/(?:Model\s*Yılı|Yıl|Üretim\s*Yılı):\s*(.*)/i);
        const vReg = p.vehicle_registration_date || p.vehicleRegistrationDate || local?.vehicleRegistrationDate || extractFromNotes(/(?:Tescil\s*Tarihi|İlk\s*Tescil\s*Tarihi|Ruhsat\s*Tescil):\s*(.*)/i);
        const vVal = p.vehicle_value || p.vehicleValue || local?.vehicleValue || extractFromNotes(/(?:Araç\s*Kasko\s*Değeri|Kasko\s*Değeri|Rayiç\s*Bedel|Araç\s*Bedeli):\s*([0-9.,]+)/i);

        return {
          id: p.id,
          policyNo: p.policy_no || p.id,
          customerId: p.customer_id,
          customerName: p.customer_name,
          customerPhone: p.customer_phone || local?.customerPhone,
          customerTc: p.customer_tc || local?.customerTc,
          type: p.type,
          company: p.company,
          startDate: p.start_date,
          endDate: p.end_date,
          premium: prem,
          netPremium: netPrem,
          paidAmount: paid,
          remainingAmount: rem,
          paymentType: p.payment_type || local?.paymentType || 'Peşin / Tek Çekim',
          installmentCount: p.installment_count || local?.installmentCount || 1,
          commissionRate: Number(p.commission_rate) || local?.commissionRate || 15,
          paymentStatus: p.payment_status || local?.paymentStatus || 'Bekliyor',
          status: p.status || local?.status || 'Aktif',
          plate: cleanPlate,
          documentSerial: cleanDocSerial,
          vehicleUsage: vUsage,
          vehicleBrand: vBrand,
          vehicleType: vType,
          vehicleModelYear: vYear,
          vehicleRegistrationDate: vReg,
          vehicleValue: vVal,
          reference: sanitizeReference(p.reference || local?.reference, rawNotes),
          notes: rawNotes || undefined
        };
      });
      localStorage.setItem('elisam_policies', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('fetchPoliciesFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_policies');
  if (saved) {
    try {
      const list: Policy[] = JSON.parse(saved);
      return list.map(p => ({ 
        ...p, 
        reference: sanitizeReference(p.reference, p.notes),
        premium: normalizeMoney(p.premium), 
        netPremium: p.netPremium ? normalizeMoney(p.netPremium) : undefined,
        paidAmount: normalizeMoney(p.paidAmount), 
        remainingAmount: Math.max(0, normalizeMoney(p.premium) - normalizeMoney(p.paidAmount)) 
      }));
    } catch (e) {}
  }
  return [];
}

export async function upsertPolicyToCloud(policy: Policy): Promise<void> {
  const cleanRef = sanitizeReference(policy.reference, policy.notes);
  const sanitizedPolicy: Policy = {
    ...policy,
    reference: cleanRef,
    premium: normalizeMoney(policy.premium),
    netPremium: policy.netPremium ? normalizeMoney(policy.netPremium) : undefined,
    paidAmount: normalizeMoney(policy.paidAmount),
    remainingAmount: Math.max(0, normalizeMoney(policy.premium) - normalizeMoney(policy.paidAmount))
  };

  try {
    const saved = localStorage.getItem('elisam_policies');
    const list: Policy[] = saved ? JSON.parse(saved) : [];
    const updated = [sanitizedPolicy, ...list.filter(p => p.id !== sanitizedPolicy.id)];
    localStorage.setItem('elisam_policies', JSON.stringify(updated));
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    let policyNotes = sanitizedPolicy.notes || '';
    if (cleanRef && !policyNotes.toLowerCase().includes('referans:') && !policyNotes.toLowerCase().includes('ref:')) {
      policyNotes = (policyNotes ? policyNotes + '\n' : '') + `Referans: ${cleanRef}`;
    }
    if (sanitizedPolicy.documentSerial && !policyNotes.toLowerCase().includes('belge seri') && !policyNotes.toLowerCase().includes('ruhsat seri')) {
      policyNotes = (policyNotes ? policyNotes + '\n' : '') + `Belge Seri: ${sanitizedPolicy.documentSerial}`;
    }
    if (sanitizedPolicy.plate && !policyNotes.toLowerCase().includes('plaka:')) {
      policyNotes = (policyNotes ? policyNotes + '\n' : '') + `Plaka: ${sanitizedPolicy.plate}`;
    }
    if (sanitizedPolicy.netPremium && !policyNotes.toLowerCase().includes('net prim') && !policyNotes.toLowerCase().includes('net pirim')) {
      policyNotes = (policyNotes ? policyNotes + '\n' : '') + `Net Prim: ${sanitizedPolicy.netPremium}`;
    }
    if (sanitizedPolicy.premium && !policyNotes.toLowerCase().includes('brüt prim') && !policyNotes.toLowerCase().includes('bürüt prim')) {
      policyNotes = (policyNotes ? policyNotes + '\n' : '') + `Brüt Prim: ${sanitizedPolicy.premium}`;
    }


    const baseRow: any = {
      id: sanitizedPolicy.id,
      policy_no: sanitizedPolicy.policyNo || sanitizedPolicy.id,
      customer_id: sanitizedPolicy.customerId,
      customer_name: sanitizedPolicy.customerName,
      customer_phone: sanitizedPolicy.customerPhone || null,
      customer_tc: sanitizedPolicy.customerTc || null,
      type: sanitizedPolicy.type,
      company: sanitizedPolicy.company,
      start_date: sanitizedPolicy.startDate,
      end_date: sanitizedPolicy.endDate,
      premium: sanitizedPolicy.premium,
      paid_amount: sanitizedPolicy.paidAmount,
      remaining_amount: sanitizedPolicy.remainingAmount,
      payment_type: sanitizedPolicy.paymentType,
      installment_count: sanitizedPolicy.installmentCount || 1,
      commission_rate: sanitizedPolicy.commissionRate || 15,
      payment_status: sanitizedPolicy.paymentStatus,
      status: sanitizedPolicy.status || 'Aktif',
      plate: sanitizedPolicy.plate || null,
      notes: policyNotes || null
    };
    
    // Try with document_serial and vehicle columns if they exist in Supabase
    const extendedRow: any = {
      ...baseRow,
      ...(sanitizedPolicy.reference ? { reference: sanitizedPolicy.reference } : {}),
      ...(sanitizedPolicy.netPremium !== undefined ? { net_premium: sanitizedPolicy.netPremium } : {}),
      ...(sanitizedPolicy.documentSerial ? { document_serial: sanitizedPolicy.documentSerial } : {}),
      ...(sanitizedPolicy.vehicleUsage ? { vehicle_usage: sanitizedPolicy.vehicleUsage } : {}),
      ...(sanitizedPolicy.vehicleBrand ? { vehicle_brand: sanitizedPolicy.vehicleBrand } : {}),
      ...(sanitizedPolicy.vehicleType ? { vehicle_type: sanitizedPolicy.vehicleType } : {}),
      ...(sanitizedPolicy.vehicleModelYear ? { vehicle_model_year: sanitizedPolicy.vehicleModelYear } : {})
    };

    try {
      const { error } = await supabase.from('policies').upsert(extendedRow);
      if (!error) return;
    } catch (e) {}

    // Fallback: try with baseRow + net_premium
    if (sanitizedPolicy.netPremium !== undefined) {
      try {
        const rowWithNet = { ...baseRow, net_premium: sanitizedPolicy.netPremium };
        const { error } = await supabase.from('policies').upsert(rowWithNet);
        if (!error) return;
      } catch (e) {}
    }
    
    await supabase.from('policies').upsert(baseRow);
  } catch (err) {
    console.error('upsertPolicyToCloud error:', err);
  }
}

export async function deletePolicyFromCloud(policyId: string): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_policies');
    if (saved) {
      const list: Policy[] = JSON.parse(saved);
      localStorage.setItem('elisam_policies', JSON.stringify(list.filter(p => p.id !== policyId)));
    }
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('policies').delete().eq('id', policyId);
  } catch (err) {
    console.error('deletePolicyFromCloud error:', err);
  }
}

// -------------------------------------------------------------
// 3. CARİ HESAP & FİNANS HAREKETLERİ (CARI MOVEMENTS)
// -------------------------------------------------------------
export async function fetchCariMovementsFromCloud(): Promise<CariMovement[]> {
  try {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('elisam_cari_movements');
      return saved ? (JSON.parse(saved) as CariMovement[]).filter((movement) => !movement.deletedAt) : [];
    }

    const { data, error } = await fetchSupabaseTableAll('cari_movements', '*', {
      column: 'created_at',
      ascending: false,
    });

    if (error) {
      console.warn('Supabase cari_movements fetch error, fallback to local:', error.message);
      const saved = localStorage.getItem('elisam_cari_movements');
      return saved ? JSON.parse(saved) : [];
    }

    if (data) {
      const mapped: CariMovement[] = data.map((m: any) => ({
        id: m.id,
        date: m.date,
        dueDate: m.due_date || undefined,
        receiptNo: m.receipt_no || '-',
        customerId: m.customer_id,
        customerName: m.customer_name,
        description: m.description || '',
        movementType: m.movement_type,
        debitAmount: Number(m.debit_amount) || 0,
        creditAmount: Number(m.credit_amount) || 0,
        notes: m.notes || undefined,
        deletedAt: m.deleted_at || undefined
      }));
      const activeMovements = mapped.filter((movement) => !movement.deletedAt);
      localStorage.setItem('elisam_cari_movements', JSON.stringify(activeMovements));
      localStorage.setItem('elisam_cari_movement_trash', JSON.stringify(mapped.filter((movement) => movement.deletedAt)));
      return activeMovements;
    }
  } catch (err) {
    console.error('fetchCariMovementsFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_cari_movements');
  return saved ? JSON.parse(saved) : [];
}

export async function fetchCariMovementTrashFromCloud(): Promise<CariMovement[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await fetchSupabaseTableAll('cari_movements', '*', {
        column: 'created_at',
        ascending: false,
      });
      if (error) throw new Error(error.message);
      const trashed = (data || []).filter((row: any) => row.deleted_at).map((row: any) => ({
        id: row.id,
        date: row.date,
        dueDate: row.due_date || undefined,
        receiptNo: row.receipt_no || '-',
        customerId: row.customer_id,
        customerName: row.customer_name,
        description: row.description || '',
        movementType: row.movement_type,
        debitAmount: Number(row.debit_amount) || 0,
        creditAmount: Number(row.credit_amount) || 0,
        notes: row.notes || undefined,
        deletedAt: row.deleted_at as string
      } satisfies CariMovement));
      localStorage.setItem('elisam_cari_movement_trash', JSON.stringify(trashed));
      return trashed;
    }
  } catch (err) {
    console.error('fetchCariMovementTrashFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_cari_movement_trash');
  return saved ? JSON.parse(saved) : [];
}

function toCariMovementRow(mov: CariMovement) {
  return {
    id: mov.id,
    date: mov.date,
    due_date: mov.dueDate || null,
    receipt_no: mov.receiptNo || null,
    customer_id: mov.customerId,
    customer_name: mov.customerName,
    description: mov.description,
    movement_type: mov.movementType,
    debit_amount: mov.debitAmount,
    credit_amount: mov.creditAmount,
    notes: mov.notes || null,
    deleted_at: null
  };
}

function saveCariMovementToLocalCache(mov: CariMovement, rejectDuplicateId = false): void {
  const saved = localStorage.getItem('elisam_cari_movements');
  const list: CariMovement[] = saved ? JSON.parse(saved) : [];
  if (rejectDuplicateId && list.some((item) => item.id === mov.id)) {
    throw new Error(`Bu kayıt ID'si zaten mevcut: ${mov.id}`);
  }
  localStorage.setItem(
    'elisam_cari_movements',
    JSON.stringify([mov, ...list.filter((item) => item.id !== mov.id)])
  );
}

/** Inserts a new movement; duplicate IDs fail instead of replacing an existing record. */
export async function createCariMovementInCloud(mov: CariMovement): Promise<void> {
  await createCariMovementsInCloud([mov]);
}

/** Inserts a batch in one database statement so a policy debit/collection pair cannot half-save. */
export async function createCariMovementsInCloud(movements: CariMovement[]): Promise<void> {
  if (movements.length === 0) return;

  const submittedIds = movements.map((movement) => movement.id);
  if (new Set(submittedIds).size !== submittedIds.length) {
    throw new Error('Yeni hareketler arasında aynı kayıt ID\'si birden fazla kullanılmış.');
  }

  const submittedReceipts = movements
    .map((movement) => movement.receiptNo?.trim())
    .filter((receiptNo): receiptNo is string => Boolean(receiptNo && receiptNo !== '-'));
  if (new Set(submittedReceipts).size !== submittedReceipts.length) {
    throw new Error('Yeni hareketler arasında aynı fiş numarası birden fazla kullanılmış.');
  }

  if (isSupabaseConfigured()) {
    const { data: existingIds, error: idCheckError } = await supabase
      .from('cari_movements')
      .select('id')
      .in('id', submittedIds);
    if (idCheckError) throw new Error(idCheckError.message);
    if (existingIds?.length) throw new Error(`Kayıt ID'si zaten kullanılmış: ${existingIds[0].id}`);

    if (submittedReceipts.length > 0) {
      const { data: existingReceipts, error: receiptCheckError } = await supabase
        .from('cari_movements')
        .select('receipt_no')
        .in('receipt_no', submittedReceipts);
      if (receiptCheckError) throw new Error(receiptCheckError.message);
      if (existingReceipts?.length) {
        throw new Error(`Fiş numarası zaten kullanılmış: ${existingReceipts[0].receipt_no}`);
      }
    }

    const { error } = await supabase
      .from('cari_movements')
      .insert(movements.map(toCariMovementRow));
    if (error) throw new Error(error.message);
  }

  try {
    const saved = localStorage.getItem('elisam_cari_movements');
    const list: CariMovement[] = saved ? JSON.parse(saved) : [];
    const knownIds = new Set(list.map((item) => item.id));
    const knownReceipts = new Set(list.map((item) => item.receiptNo?.trim()).filter(Boolean));
    for (const movement of movements) {
      if (knownIds.has(movement.id)) throw new Error(`Bu kayıt ID'si zaten mevcut: ${movement.id}`);
      knownIds.add(movement.id);
      const receiptNo = movement.receiptNo?.trim();
      if (receiptNo && receiptNo !== '-' && knownReceipts.has(receiptNo)) {
        throw new Error(`Fiş numarası zaten kullanılmış: ${receiptNo}`);
      }
      if (receiptNo && receiptNo !== '-') knownReceipts.add(receiptNo);
    }
    localStorage.setItem('elisam_cari_movements', JSON.stringify([...movements, ...list]));
  } catch (err) {
    if (isSupabaseConfigured()) {
      console.error('Cari hareket bulut kaydedildi, yerel önbellek güncellenemedi:', err);
      return;
    }
    throw err;
  }
}

/** Updates an existing movement only; a missing ID is never recreated during an edit. */
export async function updateCariMovementInCloud(mov: CariMovement): Promise<void> {
  const receiptNo = mov.receiptNo?.trim();
  if (isSupabaseConfigured()) {
    const { data: currentRows, error: currentError } = await supabase
      .from('cari_movements')
      .select('id, receipt_no')
      .eq('id', mov.id)
      .limit(1);
    if (currentError) throw new Error(currentError.message);
    const current = currentRows?.[0];
    if (!current) throw new Error(`Düzenlenecek kayıt bulunamadı: ${mov.id}`);

    const currentReceipt = String(current.receipt_no || '').trim();
    if (receiptNo && receiptNo !== '-' && receiptNo !== currentReceipt) {
      const { data, error } = await supabase
        .from('cari_movements')
        .select('id')
        .eq('receipt_no', receiptNo)
        .neq('id', mov.id)
        .limit(1);
      if (error) throw new Error(error.message);
      if (data?.length) throw new Error(`Fiş numarası başka bir harekette kullanılmış: ${receiptNo}`);
    }
    const { data, error } = await supabase
      .from('cari_movements')
      .update(toCariMovementRow(mov))
      .eq('id', mov.id)
      .is('deleted_at', null)
      .select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error(`Düzenlenecek kayıt bulunamadı: ${mov.id}`);
  } else {
    const saved = localStorage.getItem('elisam_cari_movements');
    const list: CariMovement[] = saved ? JSON.parse(saved) : [];
    const current = list.find((item) => item.id === mov.id);
    if (!current) throw new Error(`Düzenlenecek kayıt bulunamadı: ${mov.id}`);
    const currentReceipt = current.receiptNo?.trim();
    if (receiptNo && receiptNo !== '-' && receiptNo !== currentReceipt &&
      list.some((item) => item.id !== mov.id && item.receiptNo?.trim() === receiptNo)) {
      throw new Error(`Fiş numarası başka bir harekette kullanılmış: ${receiptNo}`);
    }
  }

  saveCariMovementToLocalCache(mov);
}

export async function deleteCariMovementFromCloud(movementId: string): Promise<CariMovement> {
  const deletedAt = new Date().toISOString();
  let trashedMovement: CariMovement | undefined;
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('cari_movements')
      .update({ deleted_at: deletedAt })
      .eq('id', movementId)
      .is('deleted_at', null)
      .select('*');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error(`Silinecek aktif kayıt bulunamadı: ${movementId}`);
    const row = data[0];
    trashedMovement = {
      id: row.id,
      date: row.date,
      dueDate: row.due_date || undefined,
      receiptNo: row.receipt_no || '-',
      customerId: row.customer_id,
      customerName: row.customer_name,
      description: row.description || '',
      movementType: row.movement_type,
      debitAmount: Number(row.debit_amount) || 0,
      creditAmount: Number(row.credit_amount) || 0,
      notes: row.notes || undefined,
      deletedAt: row.deleted_at || deletedAt
    };
  }

  const saved = localStorage.getItem('elisam_cari_movements');
  const list: CariMovement[] = saved ? JSON.parse(saved) : [];
  const cachedMovement = list.find((movement) => movement.id === movementId);
  if (!isSupabaseConfigured() && !cachedMovement) throw new Error(`Silinecek kayıt bulunamadı: ${movementId}`);
  if (!trashedMovement && cachedMovement) trashedMovement = { ...cachedMovement, deletedAt };
  if (saved) {
    localStorage.setItem('elisam_cari_movements', JSON.stringify(list.filter((movement) => movement.id !== movementId)));
  }
  if (trashedMovement) {
    const savedTrash = localStorage.getItem('elisam_cari_movement_trash');
    const trash: CariMovement[] = savedTrash ? JSON.parse(savedTrash) : [];
    localStorage.setItem('elisam_cari_movement_trash', JSON.stringify([trashedMovement, ...trash.filter((movement) => movement.id !== movementId)]));
  }
  if (!trashedMovement) throw new Error(`Silinen kayıt bilgisi alınamadı: ${movementId}`);
  return trashedMovement;
}

export async function restoreCariMovementFromTrash(movementId: string): Promise<CariMovement> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('cari_movements')
      .update({ deleted_at: null })
      .eq('id', movementId)
      .not('deleted_at', 'is', null)
      .select('*');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error(`Geri yüklenecek kayıt bulunamadı: ${movementId}`);

    const row = data[0];
    const restored: CariMovement = {
      id: row.id,
      date: row.date,
      dueDate: row.due_date || undefined,
      receiptNo: row.receipt_no || '-',
      customerId: row.customer_id,
      customerName: row.customer_name,
      description: row.description || '',
      movementType: row.movement_type,
      debitAmount: Number(row.debit_amount) || 0,
      creditAmount: Number(row.credit_amount) || 0,
      notes: row.notes || undefined
    };
    const activeSaved = localStorage.getItem('elisam_cari_movements');
    const active: CariMovement[] = activeSaved ? JSON.parse(activeSaved) : [];
    localStorage.setItem('elisam_cari_movements', JSON.stringify([restored, ...active.filter((movement) => movement.id !== movementId)]));
    const trashSaved = localStorage.getItem('elisam_cari_movement_trash');
    const trash: CariMovement[] = trashSaved ? JSON.parse(trashSaved) : [];
    localStorage.setItem('elisam_cari_movement_trash', JSON.stringify(trash.filter((movement) => movement.id !== movementId)));
    return restored;
  }

  const trashSaved = localStorage.getItem('elisam_cari_movement_trash');
  const trash: CariMovement[] = trashSaved ? JSON.parse(trashSaved) : [];
  const trashed = trash.find((movement) => movement.id === movementId);
  if (!trashed) throw new Error(`Geri yüklenecek kayıt bulunamadı: ${movementId}`);
  const restored = { ...trashed, deletedAt: undefined };
  const activeSaved = localStorage.getItem('elisam_cari_movements');
  const active: CariMovement[] = activeSaved ? JSON.parse(activeSaved) : [];
  localStorage.setItem('elisam_cari_movements', JSON.stringify([restored, ...active.filter((movement) => movement.id !== movementId)]));
  localStorage.setItem('elisam_cari_movement_trash', JSON.stringify(trash.filter((movement) => movement.id !== movementId)));
  return restored;
}

// -------------------------------------------------------------
// 4. RENT A CAR ARAÇLARI (RENT VEHICLES)
// -------------------------------------------------------------
export async function fetchRentVehiclesFromCloud(): Promise<RentVehicle[]> {
  try {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('elisam_rent_vehicles');
      return saved ? JSON.parse(saved) : [];
    }

    const { data, error } = await supabase
      .from('rent_vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase rent_vehicles fetch error:', error.message);
      const saved = localStorage.getItem('elisam_rent_vehicles');
      return saved ? JSON.parse(saved) : [];
    }

    if (data) {
      const mapped: RentVehicle[] = data.map((v: any) => ({
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year || new Date().getFullYear(),
        fuelType: v.fuel_type || 'Benzin',
        transmission: v.transmission || 'Otomatik',
        dailyPrice: Number(v.daily_price) || 0,
        currentKm: Number(v.current_km) || 0,
        status: v.status || 'Müsait',
        imageUrl: v.image_url || '',
        category: v.category || 'Ekonomik'
      }));
      localStorage.setItem('elisam_rent_vehicles', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('fetchRentVehiclesFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_rent_vehicles');
  return saved ? JSON.parse(saved) : [];
}

export async function upsertRentVehicleToCloud(vehicle: RentVehicle): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_rent_vehicles');
    const list: RentVehicle[] = saved ? JSON.parse(saved) : [];
    const updated = [vehicle, ...list.filter(v => v.id !== vehicle.id)];
    localStorage.setItem('elisam_rent_vehicles', JSON.stringify(updated));
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    const row = {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      fuel_type: vehicle.fuelType,
      transmission: vehicle.transmission,
      daily_price: vehicle.dailyPrice,
      current_km: vehicle.currentKm,
      status: vehicle.status,
      image_url: vehicle.imageUrl,
      category: vehicle.category
    };
    await supabase.from('rent_vehicles').upsert(row);
  } catch (err) {
    console.error('upsertRentVehicleToCloud error:', err);
  }
}

export async function deleteRentVehicleFromCloud(vehicleId: string): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_rent_vehicles');
    if (saved) {
      const list: RentVehicle[] = JSON.parse(saved);
      localStorage.setItem('elisam_rent_vehicles', JSON.stringify(list.filter(v => v.id !== vehicleId)));
    }
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('rent_vehicles').delete().eq('id', vehicleId);
  } catch (err) {
    console.error('deleteRentVehicleFromCloud error:', err);
  }
}

// -------------------------------------------------------------
// 5. RENT A CAR MÜŞTERİLERİ (RENT CUSTOMERS)
// -------------------------------------------------------------
export async function fetchRentCustomersFromCloud(): Promise<RentCustomer[]> {
  try {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('elisam_rent_customers');
      return saved ? JSON.parse(saved) : [];
    }

    const { data, error } = await supabase
      .from('rent_customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase rent_customers fetch error:', error.message);
      const saved = localStorage.getItem('elisam_rent_customers');
      return saved ? JSON.parse(saved) : [];
    }

    if (data) {
      const mapped: RentCustomer[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        identityOrPassport: c.identity_or_passport || '-',
        country: c.country || 'Türkiye',
        phone: c.phone || '-',
        email: c.email || '-',
        licenseNo: c.license_no || '-',
        licenseClass: c.license_class || 'B',
        birthDate: c.birth_date || undefined,
        totalRentals: Number(c.total_rentals) || 0
      }));
      localStorage.setItem('elisam_rent_customers', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('fetchRentCustomersFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_rent_customers');
  return saved ? JSON.parse(saved) : [];
}

export async function upsertRentCustomerToCloud(cust: RentCustomer): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_rent_customers');
    const list: RentCustomer[] = saved ? JSON.parse(saved) : [];
    const updated = [cust, ...list.filter(c => c.id !== cust.id)];
    localStorage.setItem('elisam_rent_customers', JSON.stringify(updated));
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    const row = {
      id: cust.id,
      name: cust.name,
      identity_or_passport: cust.identityOrPassport,
      country: cust.country,
      phone: cust.phone,
      email: cust.email,
      license_no: cust.licenseNo,
      license_class: cust.licenseClass,
      birth_date: cust.birthDate || null,
      total_rentals: cust.totalRentals || 0
    };
    await supabase.from('rent_customers').upsert(row);
  } catch (err) {
    console.error('upsertRentCustomerToCloud error:', err);
  }
}

export async function deleteRentCustomerFromCloud(customerId: string): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_rent_customers');
    if (saved) {
      const list: RentCustomer[] = JSON.parse(saved);
      localStorage.setItem('elisam_rent_customers', JSON.stringify(list.filter(c => c.id !== customerId)));
    }
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('rent_customers').delete().eq('id', customerId);
  } catch (err) {
    console.error('deleteRentCustomerFromCloud error:', err);
  }
}

// -------------------------------------------------------------
// 6. RENT A CAR KİRALAMALAR (RENT BOOKINGS)
// -------------------------------------------------------------
export async function fetchRentBookingsFromCloud(): Promise<RentalBooking[]> {
  try {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('elisam_rent_bookings');
      return saved ? JSON.parse(saved) : [];
    }

    const { data, error } = await supabase
      .from('rent_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase rent_bookings fetch error:', error.message);
      const saved = localStorage.getItem('elisam_rent_bookings');
      return saved ? JSON.parse(saved) : [];
    }

    if (data) {
      const mapped: RentalBooking[] = data.map((b: any) => ({
        id: b.id,
        vehicleId: b.vehicle_id,
        vehiclePlate: b.vehicle_plate,
        vehicleName: b.vehicle_name,
        customerId: b.customer_id,
        customerName: b.customer_name,
        pickupDate: b.pickup_date,
        returnDate: b.return_date,
        days: Number(b.days) || 1,
        totalAmount: Number(b.total_amount) || 0,
        paymentMethod: b.payment_method || 'Nakit',
        status: b.status || 'Aktif',
        startKm: Number(b.start_km) || 0,
        endKm: b.end_km ? Number(b.end_km) : undefined,
        fuelLevel: b.fuel_level || '4/4 (Dolu)',
        depositAmount: Number(b.deposit_amount) || 0,
        pickupLocation: b.pickup_location || 'Alanya Merkez Ofis',
        dropoffLocation: b.dropoff_location || 'Alanya Merkez Ofis',
        notes: b.notes || undefined
      }));
      localStorage.setItem('elisam_rent_bookings', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('fetchRentBookingsFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_rent_bookings');
  return saved ? JSON.parse(saved) : [];
}

export async function upsertRentBookingToCloud(booking: RentalBooking): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_rent_bookings');
    const list: RentalBooking[] = saved ? JSON.parse(saved) : [];
    const updated = [booking, ...list.filter(b => b.id !== booking.id)];
    localStorage.setItem('elisam_rent_bookings', JSON.stringify(updated));
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    const row = {
      id: booking.id,
      vehicle_id: booking.vehicleId,
      vehicle_plate: booking.vehiclePlate,
      vehicle_name: booking.vehicleName,
      customer_id: booking.customerId,
      customer_name: booking.customerName,
      pickup_date: booking.pickupDate,
      return_date: booking.returnDate,
      days: booking.days,
      total_amount: booking.totalAmount,
      payment_method: booking.paymentMethod,
      status: booking.status,
      start_km: booking.startKm,
      end_km: booking.endKm || null,
      fuel_level: booking.fuelLevel,
      deposit_amount: booking.depositAmount,
      pickup_location: booking.pickupLocation,
      dropoff_location: booking.dropoffLocation,
      notes: booking.notes || null
    };
    await supabase.from('rent_bookings').upsert(row);
  } catch (err) {
    console.error('upsertRentBookingToCloud error:', err);
  }
}

export async function deleteRentBookingFromCloud(bookingId: string): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_rent_bookings');
    if (saved) {
      const list: RentalBooking[] = JSON.parse(saved);
      localStorage.setItem('elisam_rent_bookings', JSON.stringify(list.filter(b => b.id !== bookingId)));
    }
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('rent_bookings').delete().eq('id', bookingId);
  } catch (err) {
    console.error('deleteRentBookingFromCloud error:', err);
  }
}

// -------------------------------------------------------------
// 7. RENT A CAR CARİ & FİNANS HAREKETLERİ (RENT CARI MOVEMENTS)
// -------------------------------------------------------------
export interface RentCariMovement {
  id: string;
  date: string;               // Tarih (DD.MM.YYYY)
  dueDate?: string;           // Vade Tarihi / İade Tarihi
  receiptNo?: string;         // Fiş / Sözleşme No (örn: R000001)
  customerId: string;         // Sürücü / Müşteri ID
  customerName: string;       // Sürücü Ad Soyad
  vehicleId?: string;         // Araç ID
  vehiclePlate?: string;      // Araç Plakası (örn: 07 ELS 07)
  vehicleName?: string;       // Araç Modeli
  description: string;        // Açıklama
  movementType: 
    | 'Kiralama Bedeli Tahakkuku'
    | 'Kira Tahsilatı (Nakit)'
    | 'Kira Tahsilatı (Kredi Kartı)'
    | 'Kira Tahsilatı (Banka Havale/EFT)'
    | 'Kira Tahsilatı (Döviz EUR/USD)'
    | 'Depozito / Provizyon Tahsilatı'
    | 'Depozito İadesi'
    | 'Ekstra Km / Yakıt / Temizlik Farkı'
    | 'Trafik Cezası / HGS Geçişi'
    | 'Hasar / Onarım Bedeli Tahakkuku'
    | 'Araç Bakım & Servis Gideri'
    | 'Kasko / Muayene / Sigorta Gideri'
    | 'Cari Mahsup Çıkışı'
    | 'Tarih Öncesi Devir Bakiye';
  debitAmount: number;        // Borç (TL)
  creditAmount: number;       // Alacak (TL)
  notes?: string;
}

export async function fetchRentCariMovementsFromCloud(): Promise<RentCariMovement[]> {
  try {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('elisam_rent_cari_movements');
      return saved ? JSON.parse(saved) : [];
    }

    const { data, error } = await supabase
      .from('rent_cari_movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase rent_cari_movements fetch error, fallback to local:', error.message);
      const saved = localStorage.getItem('elisam_rent_cari_movements');
      return saved ? JSON.parse(saved) : [];
    }

    if (data) {
      const mapped: RentCariMovement[] = data.map((m: any) => ({
        id: m.id,
        date: m.date,
        dueDate: m.due_date || undefined,
        receiptNo: m.receipt_no || '-',
        customerId: m.customer_id,
        customerName: m.customer_name,
        vehicleId: m.vehicle_id || undefined,
        vehiclePlate: m.vehicle_plate || undefined,
        vehicleName: m.vehicle_name || undefined,
        description: m.description || '',
        movementType: m.movement_type,
        debitAmount: Number(m.debit_amount) || 0,
        creditAmount: Number(m.credit_amount) || 0,
        notes: m.notes || undefined
      }));
      localStorage.setItem('elisam_rent_cari_movements', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('fetchRentCariMovementsFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_rent_cari_movements');
  return saved ? JSON.parse(saved) : [];
}

export async function upsertRentCariMovementToCloud(mov: RentCariMovement): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_rent_cari_movements');
    const list: RentCariMovement[] = saved ? JSON.parse(saved) : [];
    const updated = [mov, ...list.filter(m => m.id !== mov.id)];
    localStorage.setItem('elisam_rent_cari_movements', JSON.stringify(updated));
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    const row = {
      id: mov.id,
      date: mov.date,
      due_date: mov.dueDate || null,
      receipt_no: mov.receiptNo || null,
      customer_id: mov.customerId,
      customer_name: mov.customerName,
      vehicle_id: mov.vehicleId || null,
      vehicle_plate: mov.vehiclePlate || null,
      vehicle_name: mov.vehicleName || null,
      description: mov.description,
      movement_type: mov.movementType,
      debit_amount: mov.debitAmount,
      credit_amount: mov.creditAmount,
      notes: mov.notes || null
    };
    await supabase.from('rent_cari_movements').upsert(row);
  } catch (err) {
    console.error('upsertRentCariMovementToCloud error:', err);
  }
}

export async function deleteRentCariMovementFromCloud(movementId: string): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_rent_cari_movements');
    if (saved) {
      const list: RentCariMovement[] = JSON.parse(saved);
      localStorage.setItem('elisam_rent_cari_movements', JSON.stringify(list.filter(m => m.id !== movementId)));
    }
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('rent_cari_movements').delete().eq('id', movementId);
  } catch (err) {
    console.error('deleteRentCariMovementFromCloud error:', err);
  }
}

export async function clearRentCariMovementsFromCloud(): Promise<void> {
  try {
    localStorage.removeItem('elisam_rent_cari_movements');
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('rent_cari_movements').delete().neq('id', 'CLEAN_ALL');
  } catch (err) {
    console.error('clearRentCariMovementsFromCloud error:', err);
  }
}

// -------------------------------------------------------------
// 8. TOPLU BULUT SENKRONİZASYONU (SYNC ALL LOCAL DATA TO SUPABASE)
// -------------------------------------------------------------
export async function syncAllLocalDataToCloud(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase bağlantısı henüz yapılandırılmamış.' };
  }

  try {
    // 1. Sync Customers
    const savedCust = localStorage.getItem('elisam_customers');
    if (savedCust) {
      const custs: Customer[] = JSON.parse(savedCust);
      for (const c of custs) {
        await upsertCustomerToCloud(c);
      }
    }

    // 2. Sync Policies
    const savedPol = localStorage.getItem('elisam_policies');
    if (savedPol) {
      const pols: Policy[] = JSON.parse(savedPol);
      for (const p of pols) {
        await upsertPolicyToCloud(p);
      }
    }

    // Cari movements are intentionally excluded: localStorage may be stale, and an
    // ID-based upsert here could overwrite a newer financial record in Supabase.

    // 4. Sync Rent Vehicles
    const savedVeh = localStorage.getItem('elisam_rent_vehicles');
    if (savedVeh) {
      const vehs: RentVehicle[] = JSON.parse(savedVeh);
      for (const v of vehs) {
        await upsertRentVehicleToCloud(v);
      }
    }

    // 5. Sync Rent Customers
    const savedRentCust = localStorage.getItem('elisam_rent_customers');
    if (savedRentCust) {
      const rentCusts: RentCustomer[] = JSON.parse(savedRentCust);
      for (const rc of rentCusts) {
        await upsertRentCustomerToCloud(rc);
      }
    }

    // 6. Sync Rent Bookings
    const savedRent = localStorage.getItem('elisam_rent_bookings');
    if (savedRent) {
      const bookings: RentalBooking[] = JSON.parse(savedRent);
      for (const b of bookings) {
        await upsertRentBookingToCloud(b);
      }
    }

    // 7. Sync Rent Cari Movements
    const savedRentMov = localStorage.getItem('elisam_rent_cari_movements');
    if (savedRentMov) {
      const rentMovs: RentCariMovement[] = JSON.parse(savedRentMov);
      for (const rm of rentMovs) {
        await upsertRentCariMovementToCloud(rm);
      }
    }

    return {
      success: true,
      message: 'Sigorta ve Rent A Car verileri eşitlendi. Finans hareketleri olası eski yerel önbelleğin bulut kayıtlarını ezmesini önlemek için eşitleme dışında bırakıldı.'
    };
  } catch (err: any) {
    return { success: false, message: `Senkronizasyon hatası: ${err.message}` };
  }
}

