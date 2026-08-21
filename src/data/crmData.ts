export interface Customer {
  id: string;
  name: string;
  type: 'Bireysel' | 'Kurumsal';
  identityNo: string; // TC or VKN
  phone: string;
  email: string;
  address: string;
  notes?: string;
  createdAt: string;
  // Yeni eklenen Araç ve Sigorta bilgileri
  insuranceType?: string;
  policyStartDate?: string;
  policyEndDate?: string;
  plate?: string;
  documentSerial?: string;
  vehicleUsage?: string;
  vehicleBrand?: string;
  vehicleType?: string;
  vehicleModelYear?: string;
  vehicleRegistrationDate?: string;
  vehicleValue?: string;
}

export interface Policy {
  id: string;
  customerId: string;
  customerName: string;
  type: 'Trafik' | 'Kasko' | 'DASK' | 'Konut' | 'Özel Sağlık' | 'İşyeri';
  company: 'HDI Sigorta' | 'Ak Sigorta' | 'Sompo Sigorta' | 'Allianz' | 'Anadolu Sigorta' | 'Quick Sigorta';
  startDate: string;
  endDate: string;
  premium: number; // Gross premium in TL
  commissionRate: number; // e.g. 15 for 15%
  paymentStatus: 'Ödendi' | 'Bekliyor' | 'Taksitli';
  status: 'Aktif' | 'Yaklaşıyor' | 'Biten';
  notes?: string;
}

export const initialCustomersData: Customer[] = [];

export const initialPoliciesData: Policy[] = [];

export interface FinancialTransaction {
  id: string;
  type: 'Tahsilat' | 'Ödeme'; // Tahsilat: Gelir (Kimden Aldı), Ödeme: Gider (Kime Verdi)
  partyName: string; // Müşteri veya Kurum/Firma Adı
  partyType: 'Müşteri' | 'Sigorta Şirketi' | 'Tedarikçi/Diğer';
  policyId?: string;
  category: 'Poliçe Primi Tahsilatı' | 'Şirket Hakediş Ödemesi' | 'Acente Komisyonu' | 'Ofis & Operasyon' | 'Personel & Maaş' | 'Diğer';
  amount: number;
  paymentMethod: 'Kredi Kartı' | 'Banka Havalesi / EFT' | 'Nakit' | 'Çek / Senet';
  date: string;
  dueDate?: string;
  status: 'Tahsil Edildi' | 'Ödendi' | 'Bekliyor' | 'Gecikmede';
  description: string;
}

export const initialFinancialTransactionsData: FinancialTransaction[] = [];
