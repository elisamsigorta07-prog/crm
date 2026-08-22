"use client";

import { useState } from 'react';
import { CarFront, KeyRound, CheckCircle, TrendingUp, ArrowRight, Eye, Calendar, User, Target, Activity } from 'lucide-react';
import Link from 'next/link';
import { initialVehiclesData, initialBookingsData, RentalBooking } from '@/data/rentCrmData';
import styles from './dashboard.module.css';

export default function RentDashboard() {
  const [vehicles] = useState(initialVehiclesData);
  const [bookings] = useState<RentalBooking[]>(initialBookingsData);
  const [selectedBooking, setSelectedBooking] = useState<RentalBooking | null>(null);

  const totalVehicles = vehicles.length;
  const rentedVehicles = vehicles.filter(v => v.status === 'Kirada').length;
  const availableVehicles = vehicles.filter(v => v.status === 'Müsait').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  // Fleet occupancy percentage
  const occupancyPercentage = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

  // Audit Logs
  const auditLogs: any[] = [];

  return (
    <div>
      {/* Top Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#e67e22' }}>
            <CarFront size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Toplam Filo</div>
            <div className={styles.statValue}>{totalVehicles} Araç</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#e74c3c' }}>
            <KeyRound size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Aktif Kirada</div>
            <div className={styles.statValue}>{rentedVehicles} Araç</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#2ecc71' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Müsait Araçlar</div>
            <div className={styles.statValue}>{availableVehicles} Araç</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#3498db' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Bu Ayki Ciro</div>
            <div className={styles.statValue}>{totalRevenue.toLocaleString('tr-TR')} ₺</div>
          </div>
        </div>
      </div>

      {/* Fleet Occupancy Progress Bar Widget */}
      <div className={styles.sectionCard} style={{ marginBottom: '25px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="#e67e22" /> Filo Doluluk Oranı (%{occupancyPercentage})
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#718096' }}>
            {rentedVehicles} Kirada / {totalVehicles} Toplam Araç
          </span>
        </div>
        <div style={{ width: '100%', height: '12px', backgroundColor: '#edf2f7', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${occupancyPercentage}%`, height: '100%', backgroundColor: '#e67e22', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.dashboardSections}>
        
        {/* Active Rentals Table */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>
            Aktif Kiralamalar & Teslimatlar ({bookings.length})
            <Link href="/crm/rent-a-car/kiralamalar" style={{ fontSize: '0.85rem', color: '#e67e22', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sözleşme No</th>
                  <th>Araç & Plaka</th>
                  <th>Müşteri</th>
                  <th>Teslim Tarihi</th>
                  <th>Tutar</th>
                  <th>İncele</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedBooking(b)}>
                    <td style={{ fontWeight: 600, color: '#e67e22', fontFamily: 'monospace' }}>{b.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>{b.vehicleName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#718096', fontFamily: 'monospace' }}>{b.vehiclePlate}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.customerName}</td>
                    <td><span className={`${styles.badge} ${styles.badgeOrange}`}>{b.returnDate}</span></td>
                    <td style={{ fontWeight: 700, color: '#276749' }}>{b.totalAmount.toLocaleString('tr-TR')} ₺</td>
                    <td>
                      <button style={{ padding: '4px 10px', backgroundColor: '#fffaf0', color: '#dd6b20', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={12} /> Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Feed */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={18} color="#e67e22" /> Canlı Filo İşlem Günlüğü
          </div>
          <ul className={styles.recentList}>
            {auditLogs.length === 0 ? (
              <li className={styles.recentItem} style={{ padding: '20px', color: '#a0aec0', justifyContent: 'center' }}>
                Henüz bir sistem işlemi bulunmuyor.
              </li>
            ) : (
              auditLogs.map((log) => (
                <li key={log.id} className={styles.recentItem}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e67e22', marginTop: '6px' }}></div>
                  <div className={styles.recentInfo}>
                    <div className={styles.recentName} style={{ fontSize: '0.85rem' }}>{log.text}</div>
                    <div className={styles.recentAction} style={{ fontSize: '0.75rem', marginTop: '2px' }}>{log.user} • {log.time}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedBooking(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>KİRALAMA SÖZLEŞME KÜNYESİ</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e67e22', margin: '2px 0 0 0' }}>{selectedBooking.id}</h2>
              </div>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>X</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#fffaf0', padding: '14px', borderRadius: '10px', border: '1px solid #feebc8' }}>
                <div style={{ fontSize: '0.8rem', color: '#dd6b20', fontWeight: 600 }}>KİRALANAN ARAÇ</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem', marginTop: '4px' }}>{selectedBooking.vehicleName}</div>
                <div style={{ fontSize: '0.85rem', color: '#718096', fontFamily: 'monospace' }}>{selectedBooking.vehiclePlate}</div>
              </div>

              <div style={{ backgroundColor: '#fffaf0', padding: '14px', borderRadius: '10px', border: '1px solid #feebc8' }}>
                <div style={{ fontSize: '0.8rem', color: '#dd6b20', fontWeight: 600 }}>MÜŞTERİ SÜRÜCÜ</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem', marginTop: '4px' }}>{selectedBooking.customerName}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Tarih Aralığı:</div>
              <div style={{ fontWeight: 600, color: '#2d3748', marginTop: '4px' }}>{selectedBooking.pickupDate} - {selectedBooking.returnDate} ({selectedBooking.days} Gün)</div>
            </div>

            <div style={{ backgroundColor: '#f0fff4', padding: '14px', borderRadius: '10px', border: '1px solid #c6f6d5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#2f855a' }}>Toplam Sözleşme Bedeli</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#276749' }}>{selectedBooking.totalAmount.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#2f855a' }}>Ödeme Yöntemi</div>
                <div style={{ fontWeight: 600, color: '#2f855a' }}>{selectedBooking.paymentMethod}</div>
              </div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedBooking(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
