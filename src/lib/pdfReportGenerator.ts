/**
 * Elisam Sigorta & Rent A Car - Modern PDF Rapor Üretici
 * Profesyonel kurumsal logo, şık tipografi, KPI kutuları ve yazdırma/PDF indirme motoru.
 */

export interface PDFReportConfig {
  title: string;
  subtitle?: string;
  category: 'SİGORTA ACENTELİĞİ' | 'RENT A CAR FİLO';
  dateRange?: string;
  customerInfo?: {
    name: string;
    phone?: string;
    identityNo?: string;
    type?: string;
    address?: string;
  };
  kpis?: { label: string; value: string; color?: string }[];
  headers: string[];
  rows: (string | number)[][];
  summaryNotes?: string[];
}

export function generateModernPDF(config: PDFReportConfig) {
  const currentDate = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kapatıp tekrar deneyin.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${config.title} - Elisam Sigorta</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      padding: 32px;
      font-size: 13px;
      line-height: 1.5;
    }

    @media print {
      body {
        padding: 15px;
      }
      .no-print {
        display: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
    }

    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    }

    .btn-print {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }

    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }

    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 900;
      font-size: 22px;
      letter-spacing: -1px;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.3);
    }

    .brand-name {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      line-height: 1.1;
    }

    .brand-sub {
      font-size: 11px;
      font-weight: 700;
      color: #0284c7;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .company-info {
      text-align: right;
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }

    .report-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 5px solid #0284c7;
      padding: 14px 18px;
      border-radius: 10px;
      margin-bottom: 20px;
    }

    .report-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }

    .report-meta {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-align: right;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(${Math.min(config.kpis?.length || 4, 4)}, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 14px;
      border-radius: 10px;
    }

    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-value {
      font-size: 17px;
      font-weight: 850;
      color: #0f172a;
      margin-top: 4px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11.5px;
    }

    .data-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 9px 12px;
      font-size: 11px;
      letter-spacing: 0.3px;
    }

    .data-table th:first-child {
      border-top-left-radius: 8px;
    }
    .data-table th:last-child {
      border-top-right-radius: 8px;
    }

    .data-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    .data-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10.5px;
      font-weight: 700;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    .badge-info { background: #e0f2fe; color: #0369a1; }

    .footer-section {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #64748b;
    }

    .signature-box {
      border: 1px dashed #cbd5e1;
      width: 200px;
      height: 75px;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      font-size: 10.5px;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- Print Button Bar (Hidden in Print Mode) -->
  <div class="action-bar no-print">
    <div>
      <strong>📄 PDF & Yazdırma Önizleme</strong>
      <span style="opacity: 0.7; font-size: 12px; margin-left: 8px;">(Tarayıcı iletişim kutusunda 'PDF Olarak Kaydet' seçebilirsiniz)</span>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ PDF İndir / Yazdır
    </button>
  </div>

  <!-- Header with Brand Logo -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <div class="logo-badge">
          <div class="logo-icon">E</div>
          <div>
            <div class="brand-name">ELİSAM SİGORTA</div>
            <div class="brand-sub">${config.category}</div>
          </div>
        </div>
      </td>
      <td class="company-info" style="vertical-align: middle;">
        <strong>Elisam Sigorta Aracılık Hizmetleri Ltd. Şti.</strong><br>
        Alanya / Antalya • Tel: 0551 438 77 71<br>
        info@elisamsigorta.com • www.elisamsigorta07.com
      </td>
    </tr>
  </table>

  <!-- Report Title & Date -->
  <div class="report-title-bar">
    <div>
      <div class="report-title">${config.title}</div>
      ${config.subtitle ? `<div style="font-size: 11px; color: #64748b; margin-top: 3px;">${config.subtitle}</div>` : ''}
    </div>
    <div class="report-meta">
      Rapor Tarihi: <strong>${currentDate}</strong><br>
      ${config.dateRange ? `Filtre Aralığı: <strong>${config.dateRange}</strong>` : 'Kapsam: <strong>Tüm Kayıtlar</strong>'}
    </div>
  </div>

  <!-- Customer Info Box (if provided) -->
  ${config.customerInfo ? `
  <div style="display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; border: 1px solid #bae6fd; border-left: 5px solid #0284c7; padding: 12px 18px; border-radius: 8px; margin-bottom: 18px;">
    <div>
      <div style="font-size: 10px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">CARİ / MÜŞTERİ HESAP SAHİBİ</div>
      <div style="font-size: 16px; font-weight: 850; color: #0c4a6e; margin-top: 2px;">${config.customerInfo.name}</div>
    </div>
    <div style="text-align: right; font-size: 11.5px; color: #334155; line-height: 1.5;">
      ${config.customerInfo.type ? `<div><strong>Müşteri Türü:</strong> ${config.customerInfo.type}</div>` : ''}
      ${config.customerInfo.identityNo && config.customerInfo.identityNo !== '-' ? `<div><strong>TCKN / VKN:</strong> ${config.customerInfo.identityNo}</div>` : ''}
      ${config.customerInfo.phone && config.customerInfo.phone !== '-' ? `<div><strong>Telefon:</strong> ${config.customerInfo.phone}</div>` : ''}
      ${config.customerInfo.address && config.customerInfo.address !== '-' ? `<div><strong>Adres:</strong> ${config.customerInfo.address}</div>` : ''}
    </div>
  </div>
  ` : ''}

  <!-- KPI Metrics (if provided) -->
  ${config.kpis && config.kpis.length > 0 ? `
  <div class="kpi-grid">
    ${config.kpis.map(k => `
      <div class="kpi-card" style="${k.color ? `border-left: 3px solid ${k.color};` : ''}">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value" style="${k.color ? `color: ${k.color};` : ''}">${k.value}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Main Table -->
  <table class="data-table">
    <thead>
      <tr>
        ${config.headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${config.rows.map(row => `
        <tr>
          ${row.map((cell, idx) => {
            const val = String(cell);
            let content = val;
            if (val === 'Aktif' || val === 'Ödendi' || val === 'Onaylandı') {
              content = `<span class="badge badge-success">${val}</span>`;
            } else if (val === 'Yaklaşıyor' || val === 'Bekliyor' || val === 'Beklemede' || val === 'Taksitli' || val === 'Kısmi Ödendi') {
              content = `<span class="badge badge-warning">${val}</span>`;
            } else if (val === 'Biten' || val === 'Gecikmede' || val === 'Reddedildi') {
              content = `<span class="badge badge-danger">${val}</span>`;
            } else if (idx === 0 && (val.startsWith('POL-') || val.startsWith('CUST-') || val.startsWith('SOZ-') || val.includes('/'))) {
              content = `<strong style="font-family: monospace; color: #0284c7;">${val}</strong>`;
            }
            return `<td>${content}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Footer with Legal & Stamp Box -->
  <div class="footer-section">
    <div>
      <strong>Elisam Sigorta CRM Sistemi</strong> • Resmi Rapor Çıktısı<br>
      Bu doküman sistem üzerinden otomatik olarak üretilmiş olup iç kullanım ve muhasebe teyidi içindir.
    </div>

    <div class="signature-box">
      <div>Yetkili İmza / Kaşe</div>
      <div style="font-size: 9.5px; color: #cbd5e1;">Elisam Sigorta Aracılık Hiz.</div>
    </div>
  </div>

  <script>
    // Auto-trigger print dialog after render
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
