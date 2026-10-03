import type { PdfSubTable } from './types';

type InspectionExcelOptions = {
  title: string;
  items: string[][];
  subTables: PdfSubTable[];
  dealerLabel: string;
  dealerName: string;
  inspectorLabel: string;
  inspectorLines: string[];
  fileName: string;
};

const FONT_NAME = 'Times New Roman';
const MAIN_WIDTHS = [8, 50, 72];
const LINE_HEIGHT = 15;

const wrappedLines = (text: string, charsPerLine: number) =>
  String(text ?? '')
    .split('\n')
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);

const charsFor = (width: number) => Math.max(6, Math.floor(width * 1.05));

const sheetNameFor = (title: string, used: Set<string>) => {
  const itemMatch = title.match(/^(Item\s+\d+)\b/i);
  const base = (itemMatch ? itemMatch[1] : title.replace(/\s+as on .*$/i, '')).replace(/[\\/?*[\]:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28) || 'Details';
  let name = base;
  let counter = 2;
  while (used.has(name.toLowerCase())) {
    name = `${base.slice(0, 25)} ${counter}`;
    counter += 1;
  }
  used.add(name.toLowerCase());
  return name;
};

export async function exportInspectionExcel(options: InspectionExcelOptions) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AGRONIX';

  const pageSetup = {
    paperSize: 9,
    orientation: 'portrait' as const,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };
  const thin = { style: 'thin' as const, color: { argb: 'FF000000' } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };

  const styleCell = (
    cell: import('exceljs').Cell,
    opts: { bold?: boolean; italic?: boolean; size?: number; underline?: boolean; horizontal?: 'left' | 'center' | 'right'; vertical?: 'top' | 'middle'; bordered?: boolean },
  ) => {
    cell.font = { name: FONT_NAME, size: opts.size ?? 11, bold: !!opts.bold, italic: !!opts.italic, underline: !!opts.underline };
    cell.alignment = { horizontal: opts.horizontal ?? 'left', vertical: opts.vertical ?? 'top', wrapText: true };
    if (opts.bordered) cell.border = border;
  };

  // Work out which sheet each supporting table will live on, so the main sheet can point to it.
  const usedNames = new Set<string>(['inspection']);
  const subTableSheets = options.subTables.map((table) => ({ table, name: sheetNameFor(table.title, usedNames) }));
  const sheetForItem = (no: string) => {
    const match = subTableSheets.find(({ table }) => new RegExp(`^Item\\s+${no.replace(/[()]/g, '')}\\b`, 'i').test(table.title));
    return match?.name;
  };

  // ---------- Main sheet: No. | Particulars | Observation / Remarks
  const sheet = workbook.addWorksheet('Inspection', { views: [{ showGridLines: false }], pageSetup });
  sheet.columns = MAIN_WIDTHS.map((width) => ({ width }));

  sheet.mergeCells(1, 1, 1, 3);
  const title = sheet.getCell(1, 1);
  title.value = options.title;
  styleCell(title, { bold: true, size: 14, underline: true, horizontal: 'center', vertical: 'middle' });
  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 8;

  const headerRow = sheet.getRow(3);
  ['No.', 'Particulars', 'Observation / Remarks'].forEach((text, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = text;
    styleCell(cell, { bold: true, horizontal: index === 0 ? 'center' : 'left', vertical: 'middle', bordered: true });
  });
  headerRow.height = 20;

  options.items.forEach(([no, label, rawValue]) => {
    const sheetName = sheetForItem(no);
    const value = sheetName ? String(rawValue ?? '').replace('(see table below)', `(see sheet "${sheetName}")`) : String(rawValue ?? '');
    const row = sheet.addRow([no, label, value]);
    styleCell(row.getCell(1), { horizontal: 'center', bordered: true });
    styleCell(row.getCell(2), { bordered: true });
    styleCell(row.getCell(3), { bold: true, bordered: true });
    const lines = Math.max(wrappedLines(label, charsFor(MAIN_WIDTHS[1])), wrappedLines(value, charsFor(MAIN_WIDTHS[2])), 1);
    row.height = lines * LINE_HEIGHT + 4;
  });

  // Signatures
  sheet.addRow([]);
  sheet.addRow([]);
  const signatureRow = sheet.addRow([]);
  sheet.mergeCells(signatureRow.number, 1, signatureRow.number, 2);
  signatureRow.getCell(1).value = options.dealerLabel;
  signatureRow.getCell(3).value = options.inspectorLabel;
  styleCell(signatureRow.getCell(1), { bold: true, horizontal: 'center', vertical: 'middle' });
  styleCell(signatureRow.getCell(3), { bold: true, horizontal: 'center', vertical: 'middle' });
  signatureRow.height = 22;

  const dealerLines = options.dealerName.trim() ? [`(${options.dealerName.trim()})`] : [];
  const signatureLines = Math.max(dealerLines.length, options.inspectorLines.length);
  for (let index = 0; index < signatureLines; index += 1) {
    const row = sheet.addRow([]);
    sheet.mergeCells(row.number, 1, row.number, 2);
    row.getCell(1).value = dealerLines[index] || '';
    row.getCell(3).value = options.inspectorLines[index] || '';
    styleCell(row.getCell(1), { italic: true, horizontal: 'center', vertical: 'middle' });
    styleCell(row.getCell(3), { italic: true, horizontal: 'center', vertical: 'middle' });
  }
  sheet.pageSetup.printTitlesRow = '3:3';

  // ---------- One sheet per supporting table
  subTableSheets.forEach(({ table, name }) => {
    const detail = workbook.addWorksheet(name, { views: [{ showGridLines: false }], pageSetup });
    const columnCount = table.head.length;
    const widths = table.head.map((head, column) => {
      const longest = Math.max(head.length, ...table.body.map((row) => String(row[column] ?? '').length));
      return Math.min(40, Math.max(14, longest + 4));
    });
    detail.columns = widths.map((width) => ({ width }));

    detail.mergeCells(1, 1, 1, columnCount);
    const heading = detail.getCell(1, 1);
    heading.value = table.title;
    styleCell(heading, { bold: true, size: 12, horizontal: 'left', vertical: 'middle' });
    detail.getRow(1).height = 22;
    detail.getRow(2).height = 6;

    const head = detail.getRow(3);
    table.head.forEach((text, column) => {
      const cell = head.getCell(column + 1);
      cell.value = text;
      styleCell(cell, { bold: true, horizontal: 'center', vertical: 'middle', bordered: true });
    });
    head.height = Math.max(20, Math.max(...table.head.map((text, column) => wrappedLines(text, charsFor(widths[column])))) * LINE_HEIGHT + 4);

    table.body.forEach((cells) => {
      const row = detail.addRow(cells.map((cell) => cell || ''));
      const isTotal = String(cells[1] ?? '').trim().toLowerCase() === 'total';
      for (let column = 1; column <= columnCount; column += 1) {
        styleCell(row.getCell(column), { bold: isTotal, horizontal: 'center', vertical: 'middle', bordered: true });
      }
      const lines = Math.max(1, ...cells.map((text, column) => wrappedLines(text, charsFor(widths[column] ?? 14))));
      row.height = lines * LINE_HEIGHT + 4;
    });
    detail.pageSetup.printTitlesRow = '3:3';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
