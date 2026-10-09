import { downloadBlobFile } from '../../features/documents/lib/documentActions';
import type { Workbook, Worksheet } from 'exceljs';

/**
 * Shared styled-workbook layer for every `.xlsx` the app exports.
 *
 * The SheetJS `xlsx` community build silently drops cell styles on write, so
 * exports produced through it arrive with plain headers and no table grid.
 * These helpers go through ExcelJS (already used by the Tour Diary and
 * inspection exports) so every downloaded workbook gets a branded title row,
 * a bold bordered header, thin grid borders on data cells, frozen headers and
 * an autofilter.
 */

const FONT_NAME = 'Times New Roman';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const THIN = { style: 'thin' as const, color: { argb: 'FF64748B' } };
const TABLE_BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF047857' } };
const TOTAL_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF1F5F9' } };
const HEADER_FONT = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };

export type ExcelCellValue = string | number | boolean | Date | null | undefined | Record<string, unknown>;

export type TableSheetSpec = {
  name: string;
  /** Merged banner row rendered above the metadata and table. */
  title?: string;
  /** Label/value rows rendered above the table; the first cell is bolded. */
  meta?: Array<Array<ExcelCellValue>>;
  headers: string[];
  rows: Array<Array<ExcelCellValue>>;
  /** Style the final body row as a totals row (bold + fill). */
  totalsRow?: boolean;
};

export async function createExcelWorkbook(): Promise<Workbook> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AGRONIX';
  return workbook;
}

export async function saveStyledWorkbook(workbook: Workbook, fileName: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlobFile(new Blob([buffer], { type: XLSX_MIME }), fileName);
}

function cellValue(value: ExcelCellValue): string | number | boolean | Date {
  if (value == null) return '';
  if (value instanceof Date) return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

const isBlankRow = (values: Array<ExcelCellValue>) =>
  !values.length || values.every((value) => value == null || value === '');

export function addTableSheet(workbook: Workbook, spec: TableSheetSpec): Worksheet {
  const sheet = workbook.addWorksheet(spec.name.slice(0, 31) || 'Sheet');
  const columnCount = Math.max(1, spec.headers.length);

  if (spec.title) {
    const titleRow = sheet.addRow([spec.title]);
    sheet.mergeCells(titleRow.number, 1, titleRow.number, columnCount);
    const cell = titleRow.getCell(1);
    cell.font = { name: FONT_NAME, size: 13, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    titleRow.height = 24;
  }

  const metaRows = spec.meta ?? [];
  metaRows.forEach((metaRow) => {
    if (isBlankRow(metaRow)) {
      sheet.addRow([]);
      return;
    }
    const row = sheet.addRow(metaRow.map(cellValue));
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT_NAME, size: 11, bold: Number(cell.col) === 1 };
      cell.alignment = { vertical: 'top', wrapText: true };
    });
  });

  if (spec.title || metaRows.length) sheet.addRow([]);

  const headerRow = sheet.addRow(spec.headers.length ? spec.headers : ['Details']);
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.border = TABLE_BORDER;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  headerRow.height = 20;

  spec.rows.forEach((values, index) => {
    const row = sheet.addRow(Array.from({ length: columnCount }, (_, column) => cellValue(values[column])));
    const isTotal = spec.totalsRow && index === spec.rows.length - 1;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT_NAME, size: 11, bold: !!isTotal };
      cell.border = TABLE_BORDER;
      if (isTotal) cell.fill = TOTAL_FILL;
      cell.alignment = {
        horizontal: typeof cell.value === 'number' ? 'right' : 'left',
        vertical: 'top',
        wrapText: true,
      };
    });
  });

  for (let index = 0; index < columnCount; index += 1) {
    const longest = Math.max(
      (spec.headers[index] ?? '').length,
      ...metaRows.map((row) => String(row[index] ?? '').length),
      ...spec.rows.map((row) => String(row[index] ?? '').length)
    );
    sheet.getColumn(index + 1).width = Math.min(48, Math.max(10, longest + 3));
  }

  sheet.views = [{ state: 'frozen', ySplit: headerRow.number }];
  if (spec.rows.length) {
    sheet.autoFilter = {
      from: { row: headerRow.number, column: 1 },
      to: { row: sheet.rowCount, column: columnCount },
    };
  }
  return sheet;
}

export function addSummarySheet(workbook: Workbook, title: string, rows: Array<Array<ExcelCellValue>>): Worksheet {
  const sheet = workbook.addWorksheet('Summary');
  const titleRow = sheet.addRow([title]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, 2);
  const cell = titleRow.getCell(1);
  cell.font = { name: FONT_NAME, size: 13, bold: true };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
  titleRow.height = 22;

  rows.forEach((values) => {
    if (isBlankRow(values)) {
      sheet.addRow([]);
      return;
    }
    const row = sheet.addRow(values.map(cellValue));
    const isSection = values.length === 1;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT_NAME, size: isSection ? 12 : 11, bold: isSection || Number(cell.col) === 1 };
      cell.alignment = { vertical: 'top', wrapText: true };
      if (!isSection) cell.border = TABLE_BORDER;
    });
  });

  sheet.getColumn(1).width = 34;
  sheet.getColumn(2).width = 52;
  return sheet;
}
