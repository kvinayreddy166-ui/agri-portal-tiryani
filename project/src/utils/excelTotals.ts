
export type ExcelCell = string | number | boolean | null | undefined;
export type ExcelRow = Record<string, ExcelCell>;

export async function appendSheetWithTotals(
  workbook: any,
  sheetName: string,
  rows: ExcelRow[],
  totalColumns: string[],
  labelColumn = 'S.No'
) {
  const XLSX = await import('xlsx');
  const rowsWithTotals = rows.length
    ? [...rows, buildTotalsRow(rows, totalColumns, labelColumn)]
    : rows;
  const worksheet = XLSX.utils.json_to_sheet(rowsWithTotals);
  worksheet['!cols'] = columnWidths(rowsWithTotals);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
}

export async function appendSummarySheet(
  workbook: any,
  title: string,
  rows: Array<[string, ExcelCell]>
) {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.aoa_to_sheet([[title], [], ...rows]);
  worksheet['!cols'] = [{ wch: 28 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
}

export function totalValue(rows: ExcelRow[], key: string) {
  return roundNumber(rows.reduce((sum, row) => sum + numericValue(row[key]), 0));
}

function buildTotalsRow(rows: ExcelRow[], totalColumns: string[], labelColumn: string): ExcelRow {
  const totalRow: ExcelRow = {};
  const keys = Object.keys(rows[0] || {});
  keys.forEach((key) => {
    if (key === labelColumn) totalRow[key] = 'TOTAL';
    else if (totalColumns.includes(key)) totalRow[key] = totalValue(rows, key);
    else totalRow[key] = '';
  });
  return totalRow;
}

function columnWidths(rows: ExcelRow[]) {
  const keys = Object.keys(rows[0] || {});
  return keys.map((key) => ({
    wch: Math.min(
      42,
      Math.max(
        12,
        key.length + 2,
        ...rows.map((row) => String(row[key] ?? '').length + 2)
      )
    ),
  }));
}

function numericValue(value: ExcelCell) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundNumber(value: number) {
  return Math.round(value * 100) / 100;
}
