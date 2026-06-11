import * as XLSX from 'xlsx';
import { StockCategory } from '../lib/stockInventory';

type Metadata = {
  firmName: string;
  dealerName: string;
  licenseNumber: string;
  ifmsId?: string;
  category: StockCategory;
  financialYear: string;
  filterRange: string;
};

const categoryLabel: Record<StockCategory, string> = {
  fertilizer: 'Fertilizer',
  seed: 'Seed',
  pesticide: 'Pesticide',
};

export function writeProfessionalWorkbook(filename: string, sheetName: string, rows: Record<string, unknown>[], metadata: Metadata) {
  const metaRows: unknown[][] = [
    ['Firm Name', metadata.firmName],
    ['Dealer Name', metadata.dealerName],
    ['Relevant License Number', metadata.licenseNumber],
  ];
  if (metadata.category === 'fertilizer') {
    metaRows.push(['IFMS ID', metadata.ifmsId || '']);
  }
  metaRows.push(
    ['Category', categoryLabel[metadata.category]],
    ['Financial Year', metadata.financialYear],
    ['Filter Range', metadata.filterRange],
    ['Generated Date', new Date().toLocaleString('en-IN')],
    []
  );

  const header = rows.length ? Object.keys(rows[0]) : ['No Records'];
  const body = rows.length ? rows.map((row) => header.map((key) => row[key])) : [['No matching records']];
  const worksheet = XLSX.utils.aoa_to_sheet([...metaRows, header, ...body]);
  worksheet['!cols'] = header.map((key) => ({ wch: Math.max(14, key.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}
