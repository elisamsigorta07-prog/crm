"use client";

import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Shield, FileSpreadsheet, Download } from 'lucide-react';
import styles from '../layout.module.css';

export default function SigortaRaporlarPage() {
  const [dateRange, setDateRange] = useState('Bu Ay');

  const companyStats: any[] = [];
  const branchStats: any[] = [];

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Finansal Raporlar & Üretim Analizi</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}>
            <option value="Bu Ay">Bu Ay (Temmuz 2026)</option>
            <option value="Geçen Ay">Geçen Ay (Haziran 2026)</option>
            <option value="Bu Yıl">Bu Yıl (2026)</option>
          </select>
          <button className={styles.btnCrm} onClick={() => alert('Rapor Excel dökümü indiriliyor...')}>
            <Download size={18} /> Excel İndir
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className={styles.card} style={{ borderLeft: '4px solid #3498db' }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>TOPLAM ÜRETİM</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2d3748', marginTop: '4px' }}>0 ₺</div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px', fontWeight: 600 }}>Geçen aya göre değişim yok</div>
        </div>

        <div className={styles.card} style={{ borderLeft: '4px solid #2ecc71' }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>NET ACENTE KOMİSYONU</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2ecc71', marginTop: '4px' }}>0 ₺</div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>Ortalama %15 Komisyon</div>
        </div>

        <div className={styles.card} style={{ borderLeft: '4px solid #f1c40f' }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>KESİLEN KABUL POLİÇE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2d3748', marginTop: '4px' }}>0 Adet</div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>Günlük ortalama 0 poliçe</div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Company Breakdown */}
        <div className={styles.card}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2d3748', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#3498db" /> Sigorta Şirketlerine Göre Dağılım
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#edf2f7' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Şirket</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Adet</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Pay</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Toplam Prim</th>
              </tr>
            </thead>
            <tbody>
              {companyStats.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>
                    Henüz veri bulunmuyor.
                  </td>
                </tr>
              ) : (
                companyStats.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 600, color: '#2d3748' }}>{item.company}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{item.count}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600, color: '#3182ce' }}>{item.share}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 700, color: '#276749', textAlign: 'right' }}>{item.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Branch Breakdown */}
        <div className={styles.card}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2d3748', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#2ecc71" /> Branşlara Göre Üretim Dağılımı
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#edf2f7' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Branş</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Poliçe Sayısı</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '0.8rem', color: '#4a5568' }}>Toplam Hacim</th>
              </tr>
            </thead>
            <tbody>
              {branchStats.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>
                    Henüz veri bulunmuyor.
                  </td>
                </tr>
              ) : (
                branchStats.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 600, color: '#2d3748' }}>{item.branch}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{item.count}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 700, color: '#2b6cb0', textAlign: 'right' }}>{item.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
