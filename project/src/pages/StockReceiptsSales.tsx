import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Filter, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  FINANCIAL_YEARS,
  StockCategory,
  StockInventoryLine,
  financialYearForDate,
  financialYearRange,
} from '../lib/stockInventory';
import { IconButton } from '../components/ui/DesignSystem';
import { appendSheetWithTotals, appendSummarySheet, totalValue } from '../utils/excelTotals';

type DealerProfile = {
  id: string;
  dealer_name: string;
  ifms_id: string;
};

type AdminStockRecord = StockInventoryLine & {
  dealers?: DealerProfile | null;
};

const categoryLabels: Record<StockCategory, string> = {
  fertilizer: 'Fertilizer',
  seed: 'Seed',
  pesticide: 'Pesticide',
};

export default function StockReceiptsSales() {
  const [records, setRecords] = useState<AdminStockRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [financialYear, setFinancialYear] = useState(financialYearForDate());
  const [category, setCategory] = useState<'all' | StockCategory>('all');
  const [entryType, setEntryType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    if (dataLoaded) return;
    const range = financialYearRange(financialYear);
    setLoading(true);
    const { data, error } = await supabase
      .from('stock_inventory_lines')
      .select('*, dealers(id, dealer_name, ifms_id)')
      .gte('report_date', range.start)
      .lte('report_date', range.end)
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setRecords([]);
    } else {
      setRecords((data || []) as AdminStockRecord[]);
    }
    setDataLoaded(true);
    setLoading(false);
  }, [financialYear, dataLoaded]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      const dealerName = record.firm_name || record.dealers?.dealer_name || '';
      const ifms = record.ifms_id || record.dealers?.ifms_id || '';
      const haystack = [
        dealerName,
        ifms,
        record.product_type,
        record.crop,
        record.variety,
        record.company_name,
        record.technical_name,
        record.formulation,
        record.lot_number,
        record.batch_number,
        record.invoice_no,
        record.remarks,
      ].join(' ').toLowerCase();
      return (
        (category === 'all' || record.category === category) &&
        (entryType === 'all' || (record.entry_type || 'daily_stock') === entryType) &&
        (!fromDate || (record.report_date || '') >= fromDate) &&
        (!toDate || (record.report_date || '') <= toDate) &&
        (!search || haystack.includes(search))
      );
    });
  }, [category, entryType, fromDate, records, searchTerm, toDate]);

  const summary = useMemo(() => {
    const opening = filteredRecords.reduce((sum, row) => sum + Number(row.opening_balance || 0), 0);
    const received = filteredRecords.reduce((sum, row) => sum + Number(row.receipts || 0), 0);
    const sold = filteredRecords.reduce((sum, row) => sum + Number(row.sales || 0), 0);
    const dealerCount = new Set(filteredRecords.map((row) => row.dealer_id).filter(Boolean)).size;
    const productCount = new Set(filteredRecords.map((row) => `${row.category}-${row.product_type}`).filter(Boolean)).size;
    return {
      opening,
      received,
      sold,
      closing: opening + received - sold,
      entries: filteredRecords.length,
      dealers: dealerCount,
      products: productCount,
    };
  }, [filteredRecords]);

  const categoryChart = useMemo(() => {
    if (!dataLoaded) return [];
    const map = new Map<string, number>();
    filteredRecords.forEach((record) => {
      const label = categoryLabels[record.category];
      map.set(label, (map.get(label) || 0) + Number(record.closing_balance || 0));
    });
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filteredRecords, dataLoaded]);

  const movementChart = useMemo(() => {
    if (!dataLoaded) return [];
    return [
      { label: 'Received', value: summary.received },
      { label: 'Sold', value: summary.sold },
      { label: 'Closing', value: summary.closing },
    ];
  }, [summary, dataLoaded]);

  const productChart = useMemo(() => {
    if (!dataLoaded) return [];
    const map = new Map<string, number>();
    filteredRecords.forEach((record) => {
      const key = record.product_type || 'Unknown';
      map.set(key, (map.get(key) || 0) + Number(record.receipts || 0) + Number(record.sales || 0));
    });
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredRecords, dataLoaded]);

  const dealerChart = useMemo(() => {
    if (!dataLoaded) return [];
    const map = new Map<string, number>();
    filteredRecords.forEach((record) => {
      const key = record.firm_name || record.dealers?.dealer_name || 'Unknown dealer';
      map.set(key, (map.get(key) || 0) + Number(record.closing_balance || 0));
    });
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredRecords, dataLoaded]);

  const exportToExcel = async () => {
    if (!filteredRecords.length) {
      alert('No data to export');
      return;
    }
    const XLSX = await import('xlsx');
    const rows = filteredRecords.map((record) => ({
      'Financial Year': record.financial_year || financialYearForDate(record.report_date),
      'Entry Date': record.report_date || '',
      Category: categoryLabels[record.category],
      'Entry Type': record.entry_type || 'daily_stock',
      'Firm Name': record.firm_name || record.dealers?.dealer_name || '',
      'IFMS ID': record.ifms_id || record.dealers?.ifms_id || '',
      'Product Name': record.product_type,
      Crop: record.crop || '',
      'Variety / Hybrid': record.variety || '',
      'Lot Number': record.lot_number || '',
      'Batch Number': record.batch_number || '',
      'Company Name': record.company_name || '',
      'Technical Name': record.technical_name || '',
      Formulation: record.formulation || '',
      'Opening Stock': record.opening_balance,
      'Received Quantity': record.receipts,
      'Sold Quantity': record.sales,
      'Closing Stock': record.closing_balance,
      Unit: record.unit || '',
      'Invoice No': record.invoice_no || '',
      'Invoice Date': record.invoice_date || '',
      Supplier: record.supplier || '',
      Remarks: record.remarks || '',
    }));
    const workbook = XLSX.utils.book_new();
    const totalColumns = ['Opening Stock', 'Received Quantity', 'Sold Quantity', 'Closing Stock'];
    appendSheetWithTotals(workbook, 'Stock Receipts Sales', rows, totalColumns);
    appendSummarySheet(workbook, 'Stock Receipts & Sales Summary', [
      ['Financial Year', financialYear],
      ['From Date', fromDate || financialYearRange(financialYear).start],
      ['To Date', toDate || financialYearRange(financialYear).end],
      ['Category', category === 'all' ? 'All categories' : categoryLabels[category]],
      ['Entry Type', entryType === 'all' ? 'All entry types' : entryType],
      ['Search', searchTerm || ''],
      ['Total Entries', rows.length],
      ['Total Opening Stock', totalValue(rows, 'Opening Stock')],
      ['Total Received Quantity', totalValue(rows, 'Received Quantity')],
      ['Total Sold Quantity', totalValue(rows, 'Sold Quantity')],
      ['Total Closing Stock', totalValue(rows, 'Closing Stock')],
      ['Generated On', new Date().toLocaleString('en-IN')],
    ]);
    XLSX.writeFile(workbook, `stock-receipts-sales-${financialYear}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Admin stock module</p>
            <h1 className="text-2xl font-black text-slate-950">Stock Receipts & Sales</h1>
            <p className="text-sm font-semibold text-slate-500">All dealers, all categories, date-wise daily stock entries.</p>
          </div>
          <IconButton label="Export all/filtered data to Excel" tone="excel" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4" />
          </IconButton>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
        <SummaryCard label="Total Opening Stock" value={summary.opening.toFixed(2)} />
        <SummaryCard label="Total Received" value={summary.received.toFixed(2)} />
        <SummaryCard label="Total Sold" value={summary.sold.toFixed(2)} />
        <SummaryCard label="Current Closing Stock" value={summary.closing.toFixed(2)} />
        <SummaryCard label="Total Entries" value={String(summary.entries)} />
        <SummaryCard label="Dealers" value={String(summary.dealers)} />
        <SummaryCard label="Products" value={String(summary.products)} />
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        <AdminChartCard title="Category-wise Closing Stock" data={categoryChart} tone="emerald" />
        <AdminChartCard title="Stock Movement" data={movementChart} tone="slate" />
        <AdminChartCard title="Top Products" data={productChart} tone="amber" />
        <AdminChartCard title="Dealer Stock Ranking" data={dealerChart} tone="red" />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-5 w-5 text-emerald-700" />
          <h2 className="text-base font-black text-slate-950">Filters</h2>
        </div>
        <div className="grid gap-2 md:grid-cols-7">
          <select value={financialYear} onChange={(event) => setFinancialYear(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">
            {FINANCIAL_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" aria-label="From Date" />
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" aria-label="To Date" />
          <select value={category} onChange={(event) => setCategory(event.target.value as 'all' | StockCategory)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">
            <option value="all">All categories</option>
            <option value="fertilizer">Fertilizer</option>
            <option value="seed">Seed</option>
            <option value="pesticide">Pesticide</option>
          </select>
          <select value={entryType} onChange={(event) => setEntryType(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">
            <option value="all">All entry types</option>
            <option value="daily_stock">Daily Stock</option>
            <option value="receipt">Receipt</option>
            <option value="sale">Sale</option>
          </select>
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search dealer, IFMS, product, batch, lot, remarks" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm font-bold" />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-base font-black text-slate-950">Daily Stock History | Receipts History | Sales History</h2>
          <p className="text-xs font-semibold text-slate-500">Sorted by entry date descending.</p>
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[1400px] text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  {['Financial Year', 'Entry Date', 'Category', 'Firm Name', 'IFMS ID', 'Product/Crop/Variety Name', 'Opening Stock', 'Received Quantity', 'Sold Quantity', 'Closing Stock', 'Unit', 'Batch/Lot/Invoice', 'Remarks'].map((head) => (
                    <th key={head} className="px-3 py-2 text-left">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-3 py-2 font-bold">{record.financial_year || financialYearForDate(record.report_date)}</td>
                    <td className="px-3 py-2">{record.report_date}</td>
                    <td className="px-3 py-2">{categoryLabels[record.category]}</td>
                    <td className="px-3 py-2">{record.firm_name || record.dealers?.dealer_name || '-'}</td>
                    <td className="px-3 py-2">{record.ifms_id || record.dealers?.ifms_id || '-'}</td>
                    <td className="px-3 py-2 font-black">{[record.product_type, record.crop, record.variety].filter(Boolean).join(' / ')}</td>
                    <td className="px-3 py-2 text-right">{Number(record.opening_balance || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{Number(record.receipts || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{Number(record.sales || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-black">{Number(record.closing_balance || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">{record.unit || '-'}</td>
                    <td className="px-3 py-2">{record.lot_number || record.batch_number || record.invoice_no || '-'}</td>
                    <td className="px-3 py-2">{record.remarks || '-'}</td>
                  </tr>
                ))}
                {!filteredRecords.length && (
                  <tr>
                    <td colSpan={13} className="px-3 py-10 text-center text-sm font-semibold text-slate-500">No stock records match the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-900 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function AdminChartCard({ title, data, tone }: { title: string; data: { label: string; value: number }[]; tone: 'emerald' | 'slate' | 'amber' | 'red' }) {
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  const color = tone === 'emerald' ? 'bg-emerald-600' : tone === 'amber' ? 'bg-amber-500' : tone === 'red' ? 'bg-red-600' : 'bg-slate-800';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-black text-slate-950">{title}</h3>
      {data.length ? (
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-black">
                <span className="truncate text-slate-700">{item.label}</span>
                <span className="shrink-0 text-slate-500">{item.value.toFixed(2)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, Math.min(100, (Math.abs(item.value) / max) * 100))}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 p-3 text-center text-xs font-bold text-slate-500">No chart data.</div>
      )}
    </div>
  );
}
