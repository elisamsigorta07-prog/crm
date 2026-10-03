import writeXlsxFile, { SheetData, Row, Cell } from 'write-excel-file/browser';

export interface ExcelColumnConfig {
  header: string;
  width: number; // Column width in characters
  align?: 'left' | 'center' | 'right';
  isCurrency?: boolean;
  isDate?: boolean;
}

export interface SingleSheetExportParams {
  filename: string;
  sheetName?: string;
  columns: ExcelColumnConfig[];
  rows: (string | number | null | undefined)[][];
}

export interface MultiSheetExportParams {
  filename: string;
  sheets: {
    sheetName: string;
    columns: ExcelColumnConfig[];
    rows: (string | number | null | undefined)[][];
  }[];
}

// Görsel Kurumsal Renk Paleti: Belirgin Başlık ve Net Tablo Izgarası
const HEADER_BG_COLOR = '#1e3a8a';      // Güçlü Kurumsal Koyu Mavi
const HEADER_TEXT_COLOR = '#ffffff';    // Beyaz Kalın Başlık Yazısı
const HEADER_BORDER_COLOR = '#0f172a';  // Başlık Ayrım Çizgisi
const CELL_BORDER_COLOR = '#cbd5e1';    // Açık Gri Hücre Izgara Çizgisi
const ZEBRA_BG_COLOR = '#f8fafc';       // Dönüşümlü Satır Rengi

/**
 * Builds SheetData (header row + data rows) with distinct header coloring,
 * sharp separator borders, and full gridlines.
 */
function buildSheetData(
  columns: ExcelColumnConfig[],
  rawRows: (string | number | null | undefined)[][]
): SheetData {
  // 1. Başlık Satırı - Renkli, Belirgin, Kalın ve Tablodan Ayrılmış
  const headerRow: Row = columns.map(col => ({
    value: col.header,
    type: String,
    fontWeight: 'bold',
    fontSize: 11,
    height: 30, // Ferah başlık yüksekliği
    backgroundColor: HEADER_BG_COLOR,
    textColor: HEADER_TEXT_COLOR,
    align: col.align || (col.isCurrency ? 'right' : 'center'),
    alignVertical: 'center',
    wrap: false,
    // Dört tarafı çerçeveli + alt kısmı kalın ayrımlı çizgi
    borderStyle: 'thin',
    borderColor: '#3b82f6',
    topBorderStyle: 'thin',
    topBorderColor: '#1d4ed8',
    bottomBorderStyle: 'medium', // Başlığı tablodan ayıran belirgin kalın çizgi
    bottomBorderColor: HEADER_BORDER_COLOR,
    leftBorderStyle: 'thin',
    leftBorderColor: '#3b82f6',
    rightBorderStyle: 'thin',
    rightBorderColor: '#3b82f6'
  }));

  // 2. Veri Satırları - Tam Çerçeveli Tablo Formatı (Zebra desenli)
  const dataRows: Row[] = rawRows.map((rowVals, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    const rowBg = isEven ? '#ffffff' : ZEBRA_BG_COLOR;

    return columns.map((col, colIdx) => {
      const rawVal = rowVals[colIdx];
      const align = col.align || (col.isCurrency ? 'right' : 'left');

      const baseCellProps = {
        align: align,
        alignVertical: 'center' as const,
        height: 22,
        backgroundColor: rowBg,
        borderStyle: 'thin' as const,
        borderColor: CELL_BORDER_COLOR,
        topBorderStyle: 'thin' as const,
        topBorderColor: CELL_BORDER_COLOR,
        bottomBorderStyle: 'thin' as const,
        bottomBorderColor: CELL_BORDER_COLOR,
        leftBorderStyle: 'thin' as const,
        leftBorderColor: CELL_BORDER_COLOR,
        rightBorderStyle: 'thin' as const,
        rightBorderColor: CELL_BORDER_COLOR
      };

      if (rawVal === null || rawVal === undefined || rawVal === '') {
        return {
          ...baseCellProps,
          value: '-',
          type: String,
          align: 'center' as const,
          textColor: '#94a3b8'
        };
      }

      if (col.isCurrency) {
        const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^\d.-]/g, ''));
        if (!isNaN(numVal)) {
          return {
            ...baseCellProps,
            value: numVal,
            type: Number,
            format: '#,##0.00 "₺"',
            align: 'right' as const,
            textColor: numVal > 0 ? '#0f172a' : '#64748b',
            fontWeight: numVal > 0 ? ('bold' as const) : undefined
          };
        }
      }

      if (typeof rawVal === 'number') {
        return {
          ...baseCellProps,
          value: rawVal,
          type: Number,
          align: align,
          textColor: '#0f172a'
        };
      }

      // Metin Değerleri (TC, Poliçe No, Belge Seri No, Plaka gibi alanların bozulmasını önler)
      const strVal = String(rawVal).trim();
      return {
        ...baseCellProps,
        value: strVal,
        type: String,
        align: align,
        textColor: '#1e293b'
      };
    });
  });

  return [headerRow, ...dataRows];
}

/**
 * Downloads a single-sheet Excel workbook (.xlsx) with:
 * - Renkli ve ayrılmış başlık satırı
 * - Tam ızgara/tablo kenarlıkları (borders)
 * - Başlık satırı dondurma (freeze panes / sticky)
 * - Otomatik genişletilmiş ferah sütunlar
 */
export async function downloadExcelSingleSheet({
  filename,
  sheetName = 'Rapor',
  columns,
  rows
}: SingleSheetExportParams): Promise<void> {
  const sheetData = buildSheetData(columns, rows);
  const columnWidths = columns.map(c => ({ width: Math.max(c.width || 15, 12) }));

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  await writeXlsxFile(sheetData, {
    sheet: sheetName,
    columns: columnWidths,
    stickyRowsCount: 1, // Başlık satırını kaydırırken yukarıda sabitle
    showGridLines: true // Izgara çizgilerini göster
  }).toFile(cleanFilename);
}

/**
 * Downloads a multi-sheet Excel workbook (.xlsx) with:
 * - Renkli ve ayrılmış başlık satırı
 * - Tam ızgara/tablo kenarlıkları
 * - Başlık satırı dondurma
 * - Çoklu sekmeler
 */
export async function downloadExcelMultiSheet({
  filename,
  sheets
}: MultiSheetExportParams): Promise<void> {
  const sheetConfigs = sheets.map(s => {
    const data = buildSheetData(s.columns, s.rows);
    const columns = s.columns.map(c => ({ width: Math.max(c.width || 15, 12) }));
    return {
      sheet: s.sheetName,
      columns,
      data,
      stickyRowsCount: 1,
      showGridLines: true
    };
  });

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  await writeXlsxFile(sheetConfigs).toFile(cleanFilename);
}
