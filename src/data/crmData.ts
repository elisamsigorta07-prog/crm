export interface Installment {
  installmentNo: number;
  amount: number;
  dueDate: string; // Vade Tarihi (DD.MM.YYYY veya YYYY-MM-DD)
  paidDate?: string;
  status: 'Ödendi' | 'Bekliyor' | 'Gecikmede';
}

export interface Customer {
  id: string;
  name: string;
  type: 'Bireysel' | 'Kurumsal';
  identityNo: string; // TC or VKN
  phone: string;
  email: string;
  address: string;
  birthDate?: string;  // Doğum Tarihi
  notes?: string;
  createdAt: string;
  // Araç ve Sigorta bilgileri
  policyNo?: string;   // Poliçe Numarası (Kullanıcının girdiği)
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
  policyNo?: string; // Poliçe Numarası (Kullanıcının girdiği resmi numara)
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerTc?: string;
  type: string;
  company: string;
  startDate: string;
  endDate: string;
  premium: number; // Toplam Brüt Prim (TL)
  paidAmount: number; // Şimdiye kadar tahsil edilen (TL)
  remainingAmount: number; // Kalan bakiye / borç (TL)
  commissionRate: number; // örn %15
  paymentType: 'Peşin / Tek Çekim' | 'Taksitli';
  installmentCount?: number; // Taksit sayısı (1-12)
  installments?: Installment[]; // Taksit dökümü
  paymentStatus: 'Ödendi' | 'Bekliyor' | 'Taksitli' | 'Kısmi Ödendi' | 'Gecikmede';
  status: 'Aktif' | 'Yaklaşıyor' | 'Biten';
  plate?: string;
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
  policyNo?: string;
  customerId?: string;
  category: 'Poliçe Primi Tahsilatı' | 'Poliçe Taksit Ödemesi' | 'Şirket Hakediş Ödemesi' | 'Acente Komisyonu' | 'Ofis & Operasyon' | 'Personel & Maaş' | 'Diğer';
  amount: number;
  paymentMethod: 'Kredi Kartı' | 'Banka Havalesi / EFT' | 'Nakit' | 'Çek / Senet';
  date: string;
  dueDate?: string;
  status: 'Tahsil Edildi' | 'Ödendi' | 'Bekliyor' | 'Gecikmede';
  description: string;
}

export const initialFinancialTransactionsData: FinancialTransaction[] = [];
