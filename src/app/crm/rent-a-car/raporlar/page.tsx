"use client";

import { useState } from 'react';
import { CarFront, KeyRound, TrendingUp, Download, Calendar } from 'lucide-react';
import styles from '../layout.module.css';

export default function RentRaporlarPage() {
  const [dateRange, setDateRange] = useState('Bu Ay');

  const categoryStats: any[] = [];

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Rent A Car Filo & Gelir Raporları</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}>
            <option value="Bu Ay">Bu Ay (Temmuz 2026)</option>
            <option value="Geçen Ay">Geçen Ay (Haziran 2026)</option>
            <option value="Bu Yıl">Bu Yıl (2026)</option>
          </select>
          <button className={styles.btnCrm} onClick={() => alert('Filo Gelir Raporu Excel olarak indiriliyor...')}>
            <Download size={18} /> Raporu İndir
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className={styles.card} style={{ borderLeft: '4px solid #e67e22' }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>TOPLAM FİLO CİROSU</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#e67e22', marginTop: '4px' }}>0 ₺</div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px', fontWeight: 600 }}>Henüz veri bulunmuyor</div>
        </div>

        <div className={styles.card} style={{ borderLeft: '4px solid #2ecc71' }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>ORTALAMA KİRALAMA SÜRESİ</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2d3748', marginTop: '4px' }}>0 Gün</div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>Müşteri başına ortalama</div>
        </div>

        <div className={styles.card} style={{ borderLeft: '4px solid #3498db' }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>FİLO DOLULUK ORANI</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#3182ce', marginTop: '4px' }}>%0</div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>Henüz veri bulunmuyor</div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className={styles.card}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2d3748', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CarFront size={18} color="#e67e22" /> Araç Kategorilerine Göre Gelir Dağılımı
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#edf2f7' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', color: '#4a5568' }}>Kategori</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', color: '#4a5568' }}>Kiralama Sayısı</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.85rem', color: '#4a5568' }}>Kiralanan Toplam Gün</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.85rem', color: '#4a5568' }}>Kategori Geliri</th>
            </tr>
          </thead>
          <tbody>
            {categoryStats.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>
                  Henüz veri bulunmuyor.
                </td>
              </tr>
            ) : (
              categoryStats.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '14px 16px', fontSize: '0.95rem', fontWeight: 600, color: '#2d3748' }}>{item.category}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.95rem', textAlign: 'center' }}>{item.count} Kiralama</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.95rem', textAlign: 'center', fontWeight: 600, color: '#3182ce' }}>{item.days} Gün</td>
                  <td style={{ padding: '14px 16px', fontSize: '1rem', fontWeight: 700, color: '#276749', textAlign: 'right' }}>{item.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
