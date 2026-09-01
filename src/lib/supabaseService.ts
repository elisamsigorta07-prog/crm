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
      const mapped: Customer[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type || 'Bireysel',
        identityNo: c.identity_no || c.identityNo || '-',
        phone: c.phone || '-',
        email: c.email || '-',
        address: c.address || 'Alanya / Antalya',
        birthDate: c.birth_date || c.birthDate || undefined,
        notes: c.notes || undefined,
        createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR')
      }));
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
    const row = {
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
    await supabase.from('customers').upsert(row);
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
// 2. POLİÇELER (POLICIES)
// -------------------------------------------------------------
export async function fetchPoliciesFromCloud(): Promise<Policy[]> {
  try {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('elisam_policies');
      return saved ? JSON.parse(saved) : [];
    }

    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase policies fetch error, fallback to local:', error.message);
      const saved = localStorage.getItem('elisam_policies');
      return saved ? JSON.parse(saved) : [];
    }

    if (data) {
      const mapped: Policy[] = data.map((p: any) => ({
        id: p.id,
        policyNo: p.policy_no || p.id,
        customerId: p.customer_id,
        customerName: p.customer_name,
        customerPhone: p.customer_phone,
        customerTc: p.customer_tc,
        type: p.type,
        company: p.company,
        startDate: p.start_date,
        endDate: p.end_date,
        premium: Number(p.premium) || 0,
        paidAmount: Number(p.paid_amount) || 0,
        remainingAmount: Number(p.remaining_amount) || 0,
        paymentType: p.payment_type || 'Peşin / Tek Çekim',
        installmentCount: p.installment_count || 1,
        commissionRate: Number(p.commission_rate) || 15,
        paymentStatus: p.payment_status || 'Bekliyor',
        status: p.status || 'Aktif',
        plate: p.plate || undefined,
        notes: p.notes || undefined
      }));
      localStorage.setItem('elisam_policies', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('fetchPoliciesFromCloud error:', err);
  }
  const saved = localStorage.getItem('elisam_policies');
  return saved ? JSON.parse(saved) : [];
}

export async function upsertPolicyToCloud(policy: Policy): Promise<void> {
  try {
    const saved = localStorage.getItem('elisam_policies');
    const list: Policy[] = saved ? JSON.parse(saved) : [];
    const updated = [policy, ...list.filter(p => p.id !== policy.id)];
    localStorage.setItem('elisam_policies', JSON.stringify(updated));
  } catch (err) {
    console.error(err);
  }

  if (!isSupabaseConfigured()) return;
  try {
    const row = {
      id: policy.id,
      policy_no: policy.policyNo || policy.id,
      customer_id: policy.customerId,
      customer_name: policy.customerName,
      customer_phone: policy.customerPhone || null,
      customer_tc: policy.customerTc || null,
      type: policy.type,
      company: policy.company,
      start_date: policy.startDate,
      end_date: policy.endDate,
      premium: policy.premium,
      paid_amount: policy.paidAmount,
      remaining_amount: policy.remainingAmount,
      payment_type: policy.paymentType,
      installment_count: policy.installmentCount || 1,
      commission_rate: policy.commissionRate || 15,
      payment_status: policy.paymentStatus,
      status: policy.status || 'Aktif',
      plate: policy.plate || null,
      notes: policy.notes || null
    };
    await supabase.from('policies').upsert(row);
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
// 7. TOPLU BULUT SENKRONİZASYONU (SYNC ALL LOCAL DATA TO SUPABASE)
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

    // 4. Sync Rent Bookings
    const savedRent = localStorage.getItem('elisam_rent_bookings');
    if (savedRent) {
      const bookings: RentalBooking[] = JSON.parse(savedRent);
      for (const b of bookings) {
        await upsertRentBookingToCloud(b);
      }
    }

    return { success: true, message: 'Tüm yerel veriler Supabase bulut veritabanına başarıyla aktarıldı!' };
  } catch (err: any) {
    return { success: false, message: `Senkronizasyon hatası: ${err.message}` };
  }
}

