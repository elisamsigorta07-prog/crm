export interface RentVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  fuelType: 'Benzin' | 'Dizel' | 'Hibrit' | 'Elektrik';
  transmission: 'Otomatik' | 'Manuel';
  dailyPrice: number; // TL
  currentKm: number;
  status: 'Müsait' | 'Kirada' | 'Bakımda';
  imageUrl: string;
  category: 'Ekonomik' | 'Konfor' | 'SUV' | 'Lüks';
}

export interface RentCustomer {
  id: string;
  name: string;
  identityOrPassport: string;
  country: string;
  phone: string;
  email: string;
  licenseNo: string;
  licenseClass: string;
  birthDate?: string;  // Doğum Tarihi
  totalRentals: number;
}

export interface RentalBooking {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleName: string;
  customerId: string;
  customerName: string;
  pickupDate: string;
  returnDate: string;
  days: number;
  totalAmount: number;
  paymentMethod: 'Nakit' | 'Kredi Kartı' | 'Havale';
  status: 'Aktif' | 'Tamamlandı' | 'İptal';
  startKm: number;
  endKm?: number;
  fuelLevel: string;
  depositAmount: number;
  pickupLocation: string;
  dropoffLocation: string;
  notes?: string;
}

export const initialVehiclesData: RentVehicle[] = [];

export const initialRentCustomersData: RentCustomer[] = [];

export const initialBookingsData: RentalBooking[] = [];
