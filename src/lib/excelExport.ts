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

const HEADER_BG_COLOR = '#1e3a8a'; // Corporate Dark Blue
const HEADER_TEXT_COLOR = '#ffffff';
const BORDER_COLOR = '#cbd5e1';

/**
 * Builds SheetData (header row + data rows) from columns and raw row values.
 */
function buildSheetData(
  columns: ExcelColumnConfig[],
  rawRows: (string | number | null | undefined)[][]
): SheetData {
  // 1. Header row
  const headerRow: Row = columns.map(col => ({
    value: col.header,
    type: String,
    fontWeight: 'bold',
    backgroundColor: HEADER_BG_COLOR,
    textColor: HEADER_TEXT_COLOR,
    align: col.align || (col.isCurrency ? 'right' : 'left'),
    alignVertical: 'center',
    height: 26,
    borderColor: '#1e40af',
    borderStyle: 'thin'
  }));

  // 2. Data rows
  const dataRows: Row[] = rawRows.map((rowVals, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    const rowBg = isEven ? '#ffffff' : '#f8fafc';

    return columns.map((col, colIdx) => {
      const rawVal = rowVals[colIdx];
      const align = col.align || (col.isCurrency ? 'right' : 'left');

      if (rawVal === null || rawVal === undefined || rawVal === '') {
        return {
          value: '-',
          type: String,
          align: 'center',
          alignVertical: 'center',
          backgroundColor: rowBg,
          borderColor: BORDER_COLOR,
          borderStyle: 'thin'
        };
      }

      if (col.isCurrency) {
        const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^\d.-]/g, ''));
        if (!isNaN(numVal)) {
          return {
            value: numVal,
            type: Number,
            format: '#,##0.00 "₺"',
            align: 'right',
            alignVertical: 'center',
            backgroundColor: rowBg,
            borderColor: BORDER_COLOR,
            borderStyle: 'thin',
            fontWeight: numVal > 0 ? 'bold' : undefined
          };
        }
      }

      if (typeof rawVal === 'number') {
        return {
          value: rawVal,
          type: Number,
          align: align,
          alignVertical: 'center',
          backgroundColor: rowBg,
          borderColor: BORDER_COLOR,
          borderStyle: 'thin'
        };
      }

      // Strings (Preserves TC, Policy No, Document Serial, Plate as pure string without scientific notation)
      const strVal = String(rawVal).trim();
      return {
        value: strVal,
        type: String,
        align: align,
        alignVertical: 'center',
        backgroundColor: rowBg,
        borderColor: BORDER_COLOR,
        borderStyle: 'thin'
      };
    });
  });

  return [headerRow, ...dataRows];
}

/**
 * Downloads a single-sheet Excel workbook (.xlsx) with auto-spaced, generous column widths.
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
    columns: columnWidths
  }).toFile(cleanFilename);
}

/**
 * Downloads a multi-sheet Excel workbook (.xlsx) with custom column widths for each sheet.
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
      data
    };
  });

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  await writeXlsxFile(sheetConfigs).toFile(cleanFilename);
}
