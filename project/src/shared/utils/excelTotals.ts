import type { Workbook } from 'exceljs';
import { addSummarySheet, addTableSheet } from './styledExcel';

export type ExcelCell = string | number | boolean | null | undefined;
export type ExcelRow = Record<string, ExcelCell>;

export function appendSheetWithTotals(
  workbook: Workbook,
  sheetName: string,
  rows: ExcelRow[],
  totalColumns: string[],
  labelColumn = 'S.No'
) {
  const rowsWithTotals = rows.length
    ? [...rows, buildTotalsRow(rows, totalColumns, labelColumn)]
    : rows;
  const keys = Object.keys(rowsWithTotals[0] || {});
  addTableSheet(workbook, {
    name: sheetName,
    headers: keys,
    rows: rowsWithTotals.map((row) => keys.map((key) => row[key])),
    totalsRow: rows.length > 0,
  });
}

export function appendSummarySheet(
  workbook: Workbook,
  title: string,
  rows: Array<[string, ExcelCell]>
) {
  addSummarySheet(workbook, title, rows.map(([label, value]) => [label, value]));
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

function numericValue(value: ExcelCell) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundNumber(value: number) {
  return Math.round(value * 100) / 100;
}
