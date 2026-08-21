"use client";

import { useState } from 'react';
import { Users, FileText, TrendingUp, AlertTriangle, ArrowRight, Eye, X, Calendar, CreditCard, User, Download, Target, Activity } from 'lucide-react';
import Link from 'next/link';
import { Policy, initialPoliciesData, initialCustomersData } from '@/data/crmData';
import styles from './dashboard.module.css';

export default function SigortaDashboard() {
  const [policies] = useState<Policy[]>(initialPoliciesData);
  const [customers] = useState(initialCustomersData);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const expiringPolicies = policies.filter(p => p.status === 'Yaklaşıyor');
  const totalPremium = policies.reduce((sum, p) => sum + p.premium, 0);
  const totalCommission = policies.reduce((sum, p) => sum + (p.premium * p.commissionRate) / 100, 0);

  // Target metrics
  const monthlyGoal = 100000;
  const goalPercentage = Math.min(Math.round((totalPremium / monthlyGoal) * 100), 100);

  // Audit Logs
  const auditLogs: any[] = [];

  return (
    <div>
      {/* Top Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#3498db' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Kayıtlı Müşteri</div>
            <div className={styles.statValue}>{customers.length}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#2ecc71' }}>
            <FileText size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Toplam Poliçe Hacmi</div>
            <div className={styles.statValue}>{totalPremium.toLocaleString('tr-TR')} ₺</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#f1c40f' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tahmini Net Komisyon</div>
            <div className={styles.statValue}>{totalCommission.toLocaleString('tr-TR')} ₺</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: '#e74c3c' }}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Yaklaşan Yenileme</div>
            <div className={styles.statValue}>{expiringPolicies.length}</div>
          </div>
        </div>
      </div>

      {/* Target Progress Bar Widget */}
      <div className={styles.sectionCard} style={{ marginBottom: '25px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="#e67e22" /> Aylık Poliçe Üretim Hedefi (%{goalPercentage})
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#718096' }}>
            {totalPremium.toLocaleString('tr-TR')} ₺ / {monthlyGoal.toLocaleString('tr-TR')} ₺ Target
          </span>
        </div>
        <div style={{ width: '100%', height: '12px', backgroundColor: '#edf2f7', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${goalPercentage}%`, height: '100%', backgroundColor: goalPercentage > 75 ? '#2ecc71' : '#f1c40f', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
        </div>
      </div>

      {/* Main Sections */}
      <div className={styles.dashboardSections}>
        
        {/* Renewals Table */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>
            Yaklaşan Poliçe Yenilemeleri ({expiringPolicies.length})
            <Link href="/crm/sigorta/policeler" style={{ fontSize: '0.85rem', color: '#3498db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Poliçe No</th>
                <th>Müşteri Adı</th>
                <th>Tür</th>
                <th>Şirket</th>
                <th>Bitiş</th>
                <th>Detay</th>
              </tr>
            </thead>
            <tbody>
              {expiringPolicies.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    Yaklaşan yenileme poliçesi bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                expiringPolicies.map((policy) => (
                  <tr key={policy.id} onClick={() => setSelectedPolicy(policy)} style={{ cursor: 'pointer' }}>
                    <td className={styles.policyId}>{policy.id}</td>
                    <td style={{ fontWeight: 600, color: '#2d3748' }}>{policy.customerName}</td>
                    <td>{policy.type}</td>
                    <td>{policy.company}</td>
                    <td>{policy.endDate}</td>
                    <td style={{ fontWeight: 700, color: '#2b6cb0' }}>{policy.premium.toLocaleString('tr-TR')} ₺</td>
                    <td>
                      <button style={{ padding: '4px 10px', backgroundColor: '#ebf8ff', color: '#3182ce', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={12} /> Gör
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Log Feed */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={18} color="#3182ce" /> Canlı Sistem İşlem Günlüğü
          </div>
          <ul className={styles.recentList}>
            {auditLogs.length === 0 ? (
              <li className={styles.recentItem} style={{ padding: '20px', color: '#a0aec0', justifyContent: 'center' }}>
                Henüz bir sistem işlemi bulunmuyor.
              </li>
            ) : (
              auditLogs.map((log) => (
                <li key={log.id} className={styles.recentItem}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3182ce', marginTop: '6px' }}></div>
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

      {/* Policy Details Modal for Dashboard */}
      {selectedPolicy && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedPolicy(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>YENİLEME DETAY KARTI</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d3748', margin: '4px 0 0 0' }}>{selectedPolicy.id}</h2>
              </div>
              <button onClick={() => setSelectedPolicy(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ backgroundColor: '#ebf8ff', padding: '16px', borderRadius: '12px', border: '1px solid #bee3f8', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#2b6cb0', fontWeight: 600 }}>EŞLEŞEN MÜŞTERİ</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <User size={18} color="#3182ce" /> {selectedPolicy.customerName}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Poliçe Türü</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem' }}>{selectedPolicy.type} Sigortası</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Sigorta Şirketi</div>
                <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '1rem' }}>{selectedPolicy.company}</div>
              </div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedPolicy(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', cursor: 'pointer', fontWeight: 600, color: '#4a5568' }}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
