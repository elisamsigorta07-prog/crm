import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Customer, Policy } from '@/data/crmData';
import { RentCustomer, RentalBooking, RentVehicle } from '@/data/rentCrmData';

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

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase customers fetch error, using localStorage fallback:', error.message);
      const saved = localStorage.getItem('elisam_customers');
      return saved ? JSON.parse(saved) : [];
    }

    if (data) {
      const existingLocal: Customer[] = (() => {
        try {
          const s = localStorage.getItem('elisam_customers');
          return s ? JSON.parse(s) : [];
        } catch { return []; }
      })();
      const localMap = new Map(existingLocal.map(lc => [lc.id, lc]));

      const mapped: Customer[] = data.map((c: any) => {
        const local = localMap.get(c.id);
        return {
          id: c.id,
          name: c.name,
          type: c.type || 'Bireysel',
          identityNo: c.identity_no || c.identityNo || local?.identityNo || '-',
          phone: c.phone || local?.phone || '-',
          email: c.email || local?.email || '-',
          address: c.address || local?.address || 'Alanya / Antalya',
          birthDate: c.birth_date || c.birthDate || local?.birthDate || undefined,
          notes: c.notes || local?.notes || undefined,
          createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('tr-TR') : (local?.createdAt || new Date().toLocaleDateString('tr-TR')),
          policyNo: c.policy_no || c.policyNo || local?.policyNo || undefined,
          insuranceType: c.insurance_type || c.insuranceType || local?.insuranceType || undefined,
          policyStartDate: c.policy_start_date || c.policyStartDate || local?.policyStartDate || undefined,
          policyEndDate: c.policy_end_date || c.policyEndDate || local?.policyEndDate || undefined,
          plate: c.plate || local?.plate || undefined,
          documentSerial: c.document_serial || c.documentSerial || local?.documentSerial || undefined,
          vehicleUsage: c.vehicle_usage || c.vehicleUsage || local?.vehicleUsage || undefined,
          vehicleBrand: c.vehicle_brand || c.vehicleBrand || local?.vehicleBrand || undefined,
          vehicleType: c.vehicle_type || c.vehicleType || local?.vehicleType || undefined,
          vehicleModelYear: c.vehicle_model_year || c.vehicleModelYear || local?.vehicleModelYear || undefined,
          vehicleRegistrationDate: c.vehicle_registration_date || c.vehicleRegistrationDate || local?.vehicleRegistrationDate || undefined,
          vehicleValue: c.vehicle_value || c.vehicleValue || local?.vehicleValue || undefined
        };
      });
      localStorage.setItem('elisam_customers', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('fetchCustomersFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_customers');
  return saved ? JSON.parse(saved) : [];
}

export async function upsertCustomerToCloud(customer: Customer): Promise<void> {
  // LocalStorage update
  try {
    const saved = localStorage.getItem('elisam_customers');
    const list: Customer[] = saved ? JSON.parse(saved) : [];
    const updated = [customer, ...list.filter(c => c.id !== customer.id)];
    localStorage.setItem('elisam_customers', JSON.stringify(updated));
  } catch (err) {
    console.error(err);
  }

  // Cloud update
  if (!isSupabaseConfigured()) return;
  try {
    const baseRow: any = {
      id: customer.id,
      name: customer.name,
      type: customer.type,
      identity_no: customer.identityNo,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      birth_date: customer.birthDate || null,
      notes: customer.notes || null
    };

    const extendedRow: any = {
      ...baseRow,
      ...(customer.plate ? { plate: customer.plate } : {}),
      ...(customer.documentSerial ? { document_serial: customer.documentSerial } : {}),
      ...(customer.policyNo ? { policy_no: customer.policyNo } : {}),
      ...(customer.insuranceType ? { insurance_type: customer.insuranceType } : {}),
      ...(customer.vehicleUsage ? { vehicle_usage: customer.vehicleUsage } : {}),
      ...(customer.vehicleBrand ? { vehicle_brand: customer.vehicleBrand } : {})
    };

    try {
      const { error } = await supabase.from('customers').upsert(extendedRow);
      if (!error) return;
    } catch (e) {}

    await supabase.from('customers').upsert(baseRow);
  } catch (err) {
    console.error('upsertCustomerToCloud error:', err);
  }
}

export async function deleteCustomerFromCloud(customerId: string): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_customers');
    if (saved) {
      const list: Customer[] = JSON.parse(saved);
      localStorage.setItem('elisam_customers', JSON.stringify(list.filter(c => c.id !== customerId)));
    }
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('customers').delete().eq('id', customerId);
  } catch (err) {
    console.error('deleteCustomerFromCloud error:', err);
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
        const prem = normalizeMoney(p.premium !== undefined && p.premium !== null ? p.premium : (local?.premium || 0));
        const netPrem = (p.net_premium !== undefined && p.net_premium !== null) 
          ? normalizeMoney(p.net_premium) 
          : (p.netPremium !== undefined && p.netPremium !== null ? normalizeMoney(p.netPremium) : (local?.netPremium !== undefined ? normalizeMoney(local.netPremium) : undefined));
        const paid = normalizeMoney(p.paid_amount !== undefined && p.paid_amount !== null ? p.paid_amount : (local?.paidAmount || 0));
        const rem = Math.max(0, prem - paid);
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
          plate: p.plate || local?.plate || undefined,
          documentSerial: p.document_serial || p.documentSerial || local?.documentSerial || undefined,
          vehicleUsage: p.vehicle_usage || p.vehicleUsage || local?.vehicleUsage || undefined,
          vehicleBrand: p.vehicle_brand || p.vehicleBrand || local?.vehicleBrand || undefined,
          vehicleType: p.vehicle_type || p.vehicleType || local?.vehicleType || undefined,
          vehicleModelYear: p.vehicle_model_year || p.vehicleModelYear || local?.vehicleModelYear || undefined,
          vehicleRegistrationDate: p.vehicle_registration_date || p.vehicleRegistrationDate || local?.vehicleRegistrationDate || undefined,
          vehicleValue: p.vehicle_value || p.vehicleValue || local?.vehicleValue || undefined,
          notes: p.notes || local?.notes || undefined
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
  const sanitizedPolicy: Policy = {
    ...policy,
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
      notes: sanitizedPolicy.notes || null
    };
    
    // Try with document_serial and vehicle columns if they exist in Supabase
    const extendedRow: any = {
      ...baseRow,
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
      return saved ? JSON.parse(saved) : [];
    }

    const { data, error } = await supabase
      .from('cari_movements')
      .select('*')
      .order('created_at', { ascending: false });

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
        notes: m.notes || undefined
      }));
      localStorage.setItem('elisam_cari_movements', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('fetchCariMovementsFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_cari_movements');
  return saved ? JSON.parse(saved) : [];
}

export async function upsertCariMovementToCloud(mov: CariMovement): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_cari_movements');
    const list: CariMovement[] = saved ? JSON.parse(saved) : [];
    const updated = [mov, ...list.filter(m => m.id !== mov.id)];
    localStorage.setItem('elisam_cari_movements', JSON.stringify(updated));
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
      description: mov.description,
      movement_type: mov.movementType,
      debit_amount: mov.debitAmount,
      credit_amount: mov.creditAmount,
      notes: mov.notes || null
    };
    await supabase.from('cari_movements').upsert(row);
  } catch (err) {
    console.error('upsertCariMovementToCloud error:', err);
  }
}

export async function deleteCariMovementFromCloud(movementId: string): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_cari_movements');
    if (saved) {
      const list: CariMovement[] = JSON.parse(saved);
      localStorage.setItem('elisam_cari_movements', JSON.stringify(list.filter(m => m.id !== movementId)));
    }
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('cari_movements').delete().eq('id', movementId);
  } catch (err) {
    console.error('deleteCariMovementFromCloud error:', err);
  }
}

export async function clearCariMovementsFromCloud(): Promise<void> {
  try {
    localStorage.removeItem('elisam_cari_movements');
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('cari_movements').delete().neq('id', 'CLEAN_ALL');
  } catch (err) {
    console.error('clearCariMovementsFromCloud error:', err);
  }
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

    // 3. Sync Cari Movements
    const savedMov = localStorage.getItem('elisam_cari_movements');
    if (savedMov) {
      const movs: CariMovement[] = JSON.parse(savedMov);
      for (const m of movs) {
        await upsertCariMovementToCloud(m);
      }
    }

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

    return { success: true, message: 'Tüm Sigorta ve Rent A Car verileri Supabase bulut veritabanına başarıyla aktarıldı!' };
  } catch (err: any) {
    return { success: false, message: `Senkronizasyon hatası: ${err.message}` };
  }
}

