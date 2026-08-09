import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, FileSpreadsheet, FileText, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { StockCategory, currentReportDate, shiftReportDate } from '../lib/stockInventory';

type ReportKey =
  | 'dealer-directory'
  | 'stock-inventory'
  | 'fertilizer-receipts'
  | 'daily-stock-sales'
  | 'nil-stock'
  | 'current-stock'
  | 'urea-stock-ranking'
  | 'urea-sales-ranking'
  | 'highest-stock-received-7-days'
  | 'weekly-top-sellers'
  | 'seed-stock-sales'
  | 'pesticide-stock-sales'
  | 'quality-control'
  | 'inspection';

type DealerRow = {
  id: string;
  dealer_name: string;
  ifms_id?: string | null;
  phone_number?: string | null;
  license_number?: string | null;
  expiry_date?: string | null;
  location?: string | null;
  dealer_category?: StockCategory | null;
};

type StockRow = {
  id: string;
  dealer_id?: string | null;
  category: StockCategory;
  product_type?: string | null;
  entry_type?: string | null;
  opening_balance?: number | null;
  receipts?: number | null;
  total?: number | null;
  sales?: number | null;
  closing_balance?: number | null;
  invoice_date?: string | null;
  invoice_no?: string | null;
  supplier?: string | null;
  report_date?: string | null;
  report_month?: string | null;
  financial_year?: string | null;
  unit?: string | null;
  created_at?: string | null;
};

type ReceiptRow = {
  id: string;
  dealer_id?: string | null;
  fertilizer_type?: string | null;
  quantity_mts?: number | null;
  quantity_bags?: number | null;
  quantity_unit?: string | null;
  wholesaler_name?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  last_updated?: string | null;
  created_at?: string | null;
};

type QualityRow = {
  id: string;
  category?: string | null;
  financial_year?: string | null;
  dealer_name?: string | null;
  license_number?: string | null;
  phone_number?: string | null;
  location?: string | null;
  sample_date?: string | null;
  form_url?: string | null;
  remarks?: string | null;
  created_at?: string | null;
};

type ReportRow = Record<string, string | number>;

const CATEGORY_OPTIONS: Array<'all' | StockCategory | 'quality'> = ['all', 'fertilizer', 'seed', 'pesticide', 'quality'];

const REPORTS: Array<{ key: ReportKey; title: string; description: string; category: 'all' | StockCategory | 'quality' }> = [
  { key: 'dealer-directory', title: 'Dealer Directory Report', description: 'Registered dealer contact, category, and license details.', category: 'all' },
  { key: 'stock-inventory', title: 'Stock Inventory Report', description: 'Opening, total, sales, and closing stock by product.', category: 'all' },
  { key: 'fertilizer-receipts', title: 'Fertilizer Receipts Report', description: 'Fertilizer invoice and wholesaler receipts.', category: 'fertilizer' },
  { key: 'daily-stock-sales', title: 'Daily Stock / Sales Report', description: 'Daily sales movement from saved dealer entries.', category: 'all' },
  { key: 'nil-stock', title: 'Nil Stock Report', description: 'Latest saved product rows with zero closing stock.', category: 'all' },
  { key: 'current-stock', title: 'Current Stock Report', description: 'Latest closing stock by dealer and product.', category: 'all' },
  { key: 'urea-stock-ranking', title: 'Urea Stock Ranking', description: 'Current Urea closing stock ranked highest first.', category: 'fertilizer' },
  { key: 'urea-sales-ranking', title: 'Urea Sales Ranking', description: 'Urea sales by dealer for selected period.', category: 'fertilizer' },
  { key: 'highest-stock-received-7-days', title: 'Highest Stock Received - Last 7 Days', description: 'Receipt entries grouped by dealer for the last 7 days.', category: 'all' },
  { key: 'weekly-top-sellers', title: 'Weekly Top Sellers by Category', description: 'Top dealer per category and product for weekly sales.', category: 'all' },
  { key: 'seed-stock-sales', title: 'Seed Stock / Sales Report', description: 'Seed stock and sales entries only.', category: 'seed' },
  { key: 'pesticide-stock-sales', title: 'Pesticide Stock / Sales Report', description: 'Pesticide stock and sales entries only.', category: 'pesticide' },
  { key: 'quality-control', title: 'Quality Control Reports', description: 'Quality control samples and uploaded form status.', category: 'quality' },
  { key: 'inspection', title: 'Inspection Reports', description: 'Inspection-style sample records with remarks and form status.', category: 'quality' },
];

const defaultFromDate = '';
const defaultToDate = '';

const titleCase = (value = '') =>
  value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export function Analytics() {
  const { user } = useAuth();
  const [dealers, setDealers] = useState<DealerRow[]>([]);
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [receiptRows, setReceiptRows] = useState<ReceiptRow[]>([]);
  const [qualityRows, setQualityRows] = useState<QualityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [dealerId, setDealerId] = useState('all');
  const [category, setCategory] = useState<'all' | StockCategory | 'quality'>('all');
  const [product, setProduct] = useState('all');
  const [reportType, setReportType] = useState<ReportKey>('stock-inventory');
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadData = useCallback(async () => {
    if (dataLoaded) return;
    setLoading(true);
    try {
      const [dealerData, stockData, receiptData, qualityData] = await Promise.all([
        fetchDealerRows(),
        fetchStockRows(),
        fetchReceiptRows(),
        fetchQualityRows(),
      ]);

      setDealers(dealerData);
      setStockRows(stockData);
      setReceiptRows(receiptData);
      setQualityRows(qualityData);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading reports:', error);
      setDealers([]);
      setStockRows([]);
      setReceiptRows([]);
      setQualityRows([]);
    } finally {
      setLoading(false);
    }
  }, [dataLoaded]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const dealerMap = useMemo(() => new Map(dealers.map((dealer) => [dealer.id, dealer])), [dealers]);
  const productOptions = useMemo(() => {
    const values = new Set<string>();
    stockRows.forEach((row) => row.product_type && values.add(row.product_type));
    receiptRows.forEach((row) => row.fertilizer_type && values.add(row.fertilizer_type));
    qualityRows.forEach((row) => row.category && values.add(titleCase(row.category)));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [qualityRows, receiptRows, stockRows]);

  const filteredDealers = useMemo(() => dealers.filter((dealer) => (
    (dealerId === 'all' || dealer.id === dealerId) &&
    (category === 'all' || category === 'quality' || (dealer.dealer_category || 'fertilizer') === category)
  )), [category, dealerId, dealers]);

  const filteredStock = useMemo(() => stockRows.filter((row) => (
    dateInRange(stockRowDate(row), fromDate, toDate) &&
    (dealerId === 'all' || row.dealer_id === dealerId) &&
    (category === 'all' || category === 'quality' || row.category === category) &&
    (product === 'all' || row.product_type === product)
  )), [category, dealerId, fromDate, product, stockRows, toDate]);

  const filteredReceipts = useMemo(() => receiptRows.filter((row) => (
    dateInRange(receiptRowDate(row), fromDate, toDate) &&
    (dealerId === 'all' || row.dealer_id === dealerId) &&
    (category === 'all' || category === 'fertilizer') &&
    (product === 'all' || row.fertilizer_type === product)
  )), [category, dealerId, fromDate, product, receiptRows, toDate]);

  const filteredQuality = useMemo(() => qualityRows.filter((row) => (
    dateInRange(qualityRowDate(row), fromDate, toDate) &&
    (category === 'all' || category === 'quality' || row.category === category || `${row.category}s` === category) &&
    (product === 'all' || titleCase(row.category || '') === product)
  )), [category, fromDate, product, qualityRows, toDate]);

  const currentReport = REPORTS.find((report) => report.key === reportType) || REPORTS[1];
  const reportRows = useMemo(
    () => buildReportRows(reportType, filteredDealers, filteredStock, filteredReceipts, filteredQuality, dealerMap),
    [dealerMap, filteredDealers, filteredQuality, filteredReceipts, filteredStock, reportType]
  );
  const previewRows = reportRows.slice(0, 50);

  const downloadExcel = async () => {
    if (!reportRows.length) {
      alert('No data available for selected filters');
      return;
    }
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const meta = reportMetadataRows(currentReport.title, fromDate, toDate, user?.email || 'MAO/Admin');
    const worksheet = XLSX.utils.aoa_to_sheet([...meta, [], Object.keys(reportRows[0]), ...reportRows.map((row) => Object.values(row))]);
    worksheet['!cols'] = Object.keys(reportRows[0]).map((key) => ({ wch: Math.min(38, Math.max(12, key.length + 2)) }));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${safeFileName(currentReport.title)}_${fromDate || 'all'}_${toDate || 'all'}.xlsx`);
  };

  const downloadPdf = async () => {
    if (!reportRows.length) {
      alert('No data available for selected filters');
      return;
    }
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 32;
    let y = 34;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(currentReport.title, margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date Range: ${fromDate || 'All'} to ${toDate || 'All'} | Generated: ${new Date().toLocaleString('en-IN')}`, margin, y);
    y += 18;

    const headers = Object.keys(reportRows[0]).slice(0, 8);
    const colWidth = (pageWidth - margin * 2) / headers.length;
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, index) => doc.text(trimText(header, 16), margin + index * colWidth, y));
    y += 12;
    doc.setFont('helvetica', 'normal');
    reportRows.slice(0, 32).forEach((row) => {
      if (y > 540) {
        addFooter(doc, user?.email || 'MAO/Admin');
        doc.addPage();
        y = 34;
      }
      headers.forEach((header, index) => doc.text(trimText(String(row[header] ?? ''), 18), margin + index * colWidth, y));
      y += 14;
    });
    addFooter(doc, user?.email || 'MAO/Admin');
    doc.save(`${safeFileName(currentReport.title)}_${fromDate || 'all'}_${toDate || 'all'}.pdf`);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Reports</p>
            <h1 className="text-xl font-black text-slate-950">Reports</h1>
            <p className="text-xs font-semibold text-slate-500">Official report preview, Excel, PDF, and live charts from existing app data.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setFiltersOpen((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" aria-label="Filters">
              <Filter className="h-4 w-4" />
            </button>
            <button type="button" onClick={loadData} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {filtersOpen && (
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Selected Report</p>
              <p className="mt-1 text-sm font-black text-slate-950">{currentReport.title}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-600">{currentReport.description}</p>
            </div>
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
              <FilterField label="From Date"><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold" /></FilterField>
              <FilterField label="To Date"><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold" /></FilterField>
              <FilterField label="Dealer">
                <select value={dealerId} onChange={(event) => setDealerId(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold">
                  <option value="all">All dealers</option>
                  {dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{titleCase(dealer.dealer_name)}</option>)}
                </select>
              </FilterField>
              <FilterField label="Category">
                <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold">
                  {CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{item === 'all' ? 'All' : titleCase(item)}</option>)}
                </select>
              </FilterField>
              <FilterField label="Product/Fertilizer Type">
                <select value={product} onChange={(event) => setProduct(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold">
                  <option value="all">All products</option>
                  {productOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </FilterField>
              <FilterField label="Report Type">
                <select value={reportType} onChange={(event) => setReportType(event.target.value as ReportKey)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold">
                  {REPORTS.map((report) => <option key={report.key} value={report.key}>{report.title}</option>)}
                </select>
              </FilterField>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Dealers" value={filteredDealers.length} />
        <Metric title="Stock Rows" value={filteredStock.length} />
        <Metric title="Receipts" value={filteredReceipts.length} />
        <Metric title="Quality Samples" value={filteredQuality.length} />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Preview</p>
            <h2 className="text-base font-black text-slate-950">{currentReport.title}</h2>
            <p className="text-xs font-semibold text-slate-500">Date range: {fromDate || 'All'} to {toDate || 'All'} | Generated: {new Date().toLocaleString('en-IN')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button type="button" onClick={downloadPdf} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-xs font-black text-white">
              <FileText className="h-4 w-4" /> Download PDF
            </button>
            <button type="button" onClick={downloadExcel} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white">
              <FileSpreadsheet className="h-4 w-4" /> Download Excel
            </button>
          </div>
        </div>
        {previewRows.length ? (
          <div className="table-scroll">
            <table className="w-full min-w-[900px] text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>{Object.keys(previewRows[0]).map((key) => <th key={key} className="whitespace-nowrap px-3 py-2 text-left font-black">{key}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.map((row, index) => (
                  <tr key={index} className="hover:bg-emerald-50/40">
                    {Object.keys(previewRows[0]).map((key) => <td key={key} className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">{row[key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm font-bold text-slate-500">No data available for selected filters</div>
        )}
        <div className="border-t border-slate-100 px-3 py-2 text-xs font-bold text-slate-500">MAO/Admin Footer: AGRONIX | Generated by {user?.email || 'MAO/Admin'}</div>
      </section>
    </div>
  );
}

function buildReportRows(
  reportType: ReportKey,
  dealers: DealerRow[],
  stockRows: StockRow[],
  receiptRows: ReceiptRow[],
  qualityRows: QualityRow[],
  dealerMap: Map<string, DealerRow>
): ReportRow[] {
  switch (reportType) {
    case 'dealer-directory':
      return dealers.map((dealer, index) => ({
        'S.No': index + 1,
        Dealer: titleCase(dealer.dealer_name),
        Category: titleCase(dealer.dealer_category || 'fertilizer'),
        IFMS: dealer.ifms_id || '',
        Phone: dealer.phone_number || '',
        License: dealer.license_number || '',
        Village: dealer.location || '',
        'Valid Upto': dealer.expiry_date || '',
      }));
    case 'fertilizer-receipts':
      return receiptRows.map((row, index) => ({
        'S.No': index + 1,
        Date: receiptRowDate(row),
        Dealer: titleCase(dealerMap.get(row.dealer_id || '')?.dealer_name || 'Unknown'),
        Fertilizer: row.fertilizer_type || '',
        'Quantity MT': round(row.quantity_mts),
        Bags: round(row.quantity_bags),
        Wholesaler: row.wholesaler_name || '',
        Invoice: row.invoice_number || '',
      }));
    case 'daily-stock-sales':
      return stockRows.filter((row) => Number(row.sales || 0) > 0 || row.entry_type === 'daily_stock').map(stockReportRow(dealerMap));
    case 'nil-stock':
      return latestRows(stockRows).filter((row) => Number(row.closing_balance || 0) === 0).map(stockReportRow(dealerMap));
    case 'current-stock':
      return latestRows(stockRows).map(stockReportRow(dealerMap));
    case 'urea-stock-ranking':
      return latestRows(stockRows)
        .filter((row) => row.category === 'fertilizer' && row.product_type?.toLowerCase() === 'urea' && Number(row.closing_balance || 0) > 0)
        .sort((a, b) => Number(b.closing_balance || 0) - Number(a.closing_balance || 0))
        .map(stockReportRow(dealerMap));
    case 'urea-sales-ranking':
      return ureaSalesRows(dealers, stockRows);
    case 'highest-stock-received-7-days':
      return highestReceiptsRows(stockRows, receiptRows, dealerMap);
    case 'weekly-top-sellers':
      return weeklyTopSellerRows(stockRows, dealerMap);
    case 'seed-stock-sales':
      return stockRows.filter((row) => row.category === 'seed').map(stockReportRow(dealerMap));
    case 'pesticide-stock-sales':
      return stockRows.filter((row) => row.category === 'pesticide').map(stockReportRow(dealerMap));
    case 'quality-control':
      return qualityRows.map(qualityReportRow);
    case 'inspection':
      return qualityRows.map((row, index) => ({
        'S.No': index + 1,
        Date: qualityRowDate(row),
        Category: titleCase(row.category || ''),
        Dealer: titleCase(row.dealer_name || ''),
        License: row.license_number || '',
        Location: row.location || '',
        Remarks: row.remarks || '',
        'Form Uploaded': row.form_url ? 'Yes' : 'No',
      }));
    case 'stock-inventory':
    default:
      return stockRows.map(stockReportRow(dealerMap));
  }
}

async function fetchDealerRows(): Promise<DealerRow[]> {
  const primary = await supabase
    .from('dealers')
    .select('id, dealer_name, ifms_id, phone_number, license_number, expiry_date, location, dealer_category')
    .order('dealer_name')
    .limit(2000);
  if (!primary.error) return (primary.data || []) as DealerRow[];

  console.warn('Dealer report query fallback:', primary.error);
  const fallback = await supabase
    .from('dealers')
    .select('id, dealer_name, ifms_id, phone_number, license_number, expiry_date, location')
    .order('dealer_name')
    .limit(2000);
  return (fallback.data || []) as DealerRow[];
}

async function fetchStockRows(): Promise<StockRow[]> {
  const primary = await supabase
    .from('stock_inventory_lines')
    .select('id, dealer_id, category, product_type, entry_type, opening_balance, receipts, total, sales, closing_balance, invoice_date, invoice_no, supplier, report_date, report_month, financial_year, unit, created_at')
    .order('report_date', { ascending: false, nullsFirst: false })
    .limit(10000);
  if (!primary.error) return (primary.data || []) as StockRow[];

  console.warn('Stock report query fallback:', primary.error);
  const fallback = await supabase
    .from('stock_inventory_lines')
    .select('id, dealer_id, category, product_type, entry_type, opening_balance, receipts, total, sales, closing_balance, report_date, report_month, financial_year, created_at')
    .limit(10000);
  return (fallback.data || []) as StockRow[];
}

async function fetchReceiptRows(): Promise<ReceiptRow[]> {
  const primary = await supabase
    .from('dealer_stock_allocation')
    .select('id, dealer_id, fertilizer_type, quantity_mts, quantity_bags, quantity_unit, wholesaler_name, invoice_number, invoice_date, last_updated, created_at')
    .order('invoice_date', { ascending: false, nullsFirst: false })
    .limit(10000);
  if (!primary.error) return (primary.data || []) as ReceiptRow[];

  console.warn('Receipt report query fallback:', primary.error);
  const fallback = await supabase
    .from('dealer_stock_allocation')
    .select('id, dealer_id, fertilizer_type, quantity_mts, quantity_bags, wholesaler_name, invoice_number, last_updated, created_at')
    .limit(10000);
  return (fallback.data || []) as ReceiptRow[];
}

async function fetchQualityRows(): Promise<QualityRow[]> {
  const primary = await supabase
    .from('quality_control_samples')
    .select('id, category, financial_year, dealer_name, license_number, phone_number, location, sample_date, form_url, remarks, created_at')
    .order('sample_date', { ascending: false, nullsFirst: false })
    .limit(3000);
  if (!primary.error) return (primary.data || []) as QualityRow[];

  console.warn('Quality report query fallback:', primary.error);
  const fallback = await supabase
    .from('quality_control_samples')
    .select('id, category, financial_year, dealer_name, license_number, phone_number, location, form_url, remarks, created_at')
    .limit(3000);
  return (fallback.data || []) as QualityRow[];
}

function stockReportRow(dealerMap: Map<string, DealerRow>) {
  return (row: StockRow, index: number): ReportRow => ({
    'S.No': index + 1,
    Date: stockRowDate(row),
    Category: titleCase(row.category),
    Dealer: titleCase(dealerMap.get(row.dealer_id || '')?.dealer_name || 'Unknown'),
    Product: row.product_type || '',
    Opening: round(row.opening_balance),
    Total: round(row.total),
    Sales: round(row.sales),
    Closing: round(row.closing_balance),
  });
}

function qualityReportRow(row: QualityRow, index: number): ReportRow {
  return {
    'S.No': index + 1,
    Date: qualityRowDate(row),
    Category: titleCase(row.category || ''),
    Dealer: titleCase(row.dealer_name || ''),
    License: row.license_number || '',
    Phone: row.phone_number || '',
    Location: row.location || '',
    'Form Uploaded': row.form_url ? 'Yes' : 'No',
  };
}

function latestRows(rows: StockRow[]) {
  const map = new Map<string, StockRow>();
  rows.forEach((row) => {
    const key = `${row.dealer_id}:${row.category}:${(row.product_type || '').toLowerCase()}`;
    const current = map.get(key);
    if (!current || stockRowDate(row) > stockRowDate(current)) map.set(key, row);
  });
  return Array.from(map.values());
}

function ureaSalesRows(dealers: DealerRow[], rows: StockRow[]): ReportRow[] {
  return dealers
    .filter((dealer) => (dealer.dealer_category || 'fertilizer') === 'fertilizer')
    .map((dealer, index) => ({
      'S.No': index + 1,
      Dealer: titleCase(dealer.dealer_name),
      Category: 'Fertilizer',
      Product: 'Urea',
      Sales: round(rows.filter((row) => row.category === 'fertilizer' && row.dealer_id === dealer.id && row.product_type?.toLowerCase() === 'urea').reduce((sum, row) => sum + Number(row.sales || 0), 0)),
    }))
    .sort((a, b) => Number(b.Sales) - Number(a.Sales));
}

function highestReceiptsRows(rows: StockRow[], receiptRows: ReceiptRow[], dealerMap: Map<string, DealerRow>): ReportRow[] {
  const cutoff = shiftReportDate(currentReportDate(), -6);
  const map = new Map<string, { dealer: string; receipts: number }>();
  rows.filter((row) => isReceiptRow(row) && stockRowDate(row) >= cutoff).forEach((row) => {
    const id = row.dealer_id || 'unknown';
    const current = map.get(id) || { dealer: titleCase(dealerMap.get(id)?.dealer_name || 'Unknown'), receipts: 0 };
    current.receipts += Number(row.receipts || 0);
    map.set(id, current);
  });
  receiptRows.filter((row) => (receiptRowDate(row) || '') >= cutoff).forEach((row) => {
    const id = row.dealer_id || 'unknown';
    const current = map.get(id) || { dealer: titleCase(dealerMap.get(id)?.dealer_name || 'Unknown'), receipts: 0 };
    current.receipts += Number(row.quantity_mts || row.quantity_bags || 0);
    map.set(id, current);
  });
  return Array.from(map.values()).sort((a, b) => b.receipts - a.receipts).map((row, index) => ({
    'S.No': index + 1,
    Dealer: row.dealer,
    'Received Quantity': round(row.receipts),
  }));
}

function weeklyTopSellerRows(rows: StockRow[], dealerMap: Map<string, DealerRow>): ReportRow[] {
  const cutoff = shiftReportDate(currentReportDate(), -6);
  const grouped = new Map<string, { category: StockCategory; product: string; dealer: string; sales: number }>();
  rows.filter((row) => stockRowDate(row) >= cutoff && Number(row.sales || 0) > 0).forEach((row) => {
    const product = row.product_type || '';
    const dealer = titleCase(dealerMap.get(row.dealer_id || '')?.dealer_name || 'Unknown');
    const key = `${row.category}:${product}:${row.dealer_id}`;
    const current = grouped.get(key) || { category: row.category, product, dealer, sales: 0 };
    current.sales += Number(row.sales || 0);
    grouped.set(key, current);
  });
  const top = new Map<string, { category: StockCategory; product: string; dealer: string; sales: number }>();
  grouped.forEach((row) => {
    const key = `${row.category}:${row.product}`;
    const current = top.get(key);
    if (!current || row.sales > current.sales) top.set(key, row);
  });
  return Array.from(top.values()).sort((a, b) => a.category.localeCompare(b.category) || b.sales - a.sales).map((row, index) => ({
    'S.No': index + 1,
    Category: titleCase(row.category),
    Product: row.product,
    Dealer: row.dealer,
    Sales: round(row.sales),
  }));
}

function isReceiptRow(row: StockRow) {
  return row.entry_type === 'receipt' || (Number(row.receipts || 0) > 0 && Number(row.sales || 0) === 0 && Number(row.opening_balance || 0) === 0);
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value.toLocaleString('en-IN')}</p>
    </div>
  );
}

function reportMetadataRows(title: string, fromDate: string, toDate: string, generatedBy: string) {
  return [
    ['AGRONIX'],
    [title],
    ['Date Range', `${fromDate || 'All'} to ${toDate || 'All'}`],
    ['Generated Date', new Date().toLocaleString('en-IN')],
    ['Generated By', generatedBy],
    ['Footer', 'MAO/Admin, AGRONIX'],
  ];
}

function addFooter(doc: {
  internal: { pageSize: { getHeight: () => number; getWidth: () => number } };
  setFontSize: (size: number) => unknown;
  text: (text: string, x: number, y: number, options?: { align?: 'center' | 'left' | 'right' | 'justify' }) => unknown;
}, generatedBy: string) {
  const y = doc.internal.pageSize.getHeight() - 24;
  doc.setFontSize(8);
  doc.text(`MAO/Admin, AGRONIX | Generated by ${generatedBy}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function trimText(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}.` : value;
}

function round(value: unknown) {
  const number = Number(value || 0);
  return Math.round(number * 100) / 100;
}

function dateInRange(dateValue: string, fromDate: string, toDate: string) {
  if (!dateValue) return true;
  if (fromDate && dateValue < fromDate) return false;
  if (toDate && dateValue > toDate) return false;
  return true;
}

function stockRowDate(row: StockRow) {
  return row.report_date || row.invoice_date || row.created_at?.slice(0, 10) || '';
}

function receiptRowDate(row: ReceiptRow) {
  return row.invoice_date || row.last_updated?.slice(0, 10) || row.created_at?.slice(0, 10) || '';
}

function qualityRowDate(row: QualityRow) {
  return row.sample_date || row.created_at?.slice(0, 10) || '';
}
