import { StockCategory } from '../../features/dealer-stock/lib/stockInventory';
import { addTableSheet, createExcelWorkbook, saveStyledWorkbook, type ExcelCellValue } from './styledExcel';

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

export async function writeProfessionalWorkbook(filename: string, sheetName: string, rows: Record<string, unknown>[], metadata: Metadata) {
  const meta: ExcelCellValue[][] = [
    ['Firm Name', metadata.firmName],
    ['Dealer Name', metadata.dealerName],
    ['Relevant License Number', metadata.licenseNumber],
  ];
  if (metadata.category === 'fertilizer') {
    meta.push(['IFMS ID', metadata.ifmsId || '']);
  }
  meta.push(
    ['Category', categoryLabel[metadata.category]],
    ['Financial Year', metadata.financialYear],
    ['Filter Range', metadata.filterRange],
    ['Generated Date', new Date().toLocaleString('en-IN')]
  );

  const header = rows.length ? Object.keys(rows[0]) : ['Details'];
  const body = rows.length
    ? rows.map((row) => header.map((key) => row[key] as ExcelCellValue))
    : [['No matching records']];

  const workbook = await createExcelWorkbook();
  addTableSheet(workbook, { name: sheetName, meta, headers: header, rows: body });
  await saveStyledWorkbook(workbook, filename);
}
