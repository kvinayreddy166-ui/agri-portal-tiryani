import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, RotateCcw, Filter, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translateDealerText } from '../lib/dealerTranslations';
import { supabase } from '../lib/supabase';

type FertilizerUnit = 'mts' | 'bags';

interface DealerReceipt {
  id: string;
  dealer_id: string;
  fertilizer_type: string;
  quantity_mts: number;
  quantity_unit?: string;
  quantity_bags?: number;
  wholesaler_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  last_updated: string;
  created_at: string;
}

interface StockInventoryLine {
  id: string;
  dealer_id: string;
  category: string;
  serial_no: number;
  product_type: string;
  opening_balance: number;
  receipts: number;
  total: number;
  sales: number;
  closing_balance: number;
  report_date: string;
  report_month: string;
  submitted_by: string;
  updated_at: string;
}

interface HistoryRecord {
  id: string;
  type: 'receipt' | 'stock';
  date: string;
  product_type: string;
  fertilizer_type: string;
  quantity_mts: number;
  quantity_bags?: number;
  wholesaler_name?: string;
  invoice_number?: string;
  opening_balance?: number;
  receipts?: number;
  sales?: number;
  closing_balance?: number;
}

export function DealerHistory() {
  const { dealerId, dealerName } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  
  // Translation helper
  const t = useCallback((english: string) => translateDealerText(english, language), [language]);
  const [receipts, setReceipts] = useState<DealerReceipt[]>([]);
  const [stockLines, setStockLines] = useState<StockInventoryLine[]>([]);
  const [fertilizerQtyUnit, setFertilizerQtyUnit] = useState<FertilizerUnit>(() => {
    const saved = localStorage.getItem('dealerFertilizerUnit');
    return (saved === 'bags' || saved === 'mts') ? saved : 'mts';
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState<'date' | 'product_type' | 'quantity_mts'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Save unit preference to localStorage
  useEffect(() => {
    localStorage.setItem('dealerFertilizerUnit', fertilizerQtyUnit);
  }, [fertilizerQtyUnit]);

  const loadReceipts = useCallback(async () => {
    if (!dealerId) return;
    const { data, error } = await supabase
      .from('dealer_stock_allocation')
      .select('*')
      .eq('dealer_id', dealerId)
      .order('invoice_date', { ascending: false, nullsFirst: false })
      .order('last_updated', { ascending: false });

    if (error) {
      console.error(error);
      setReceipts([]);
    } else {
      setReceipts((data || []) as DealerReceipt[]);
    }
  }, [dealerId]);

  const loadStockLines = useCallback(async () => {
    if (!dealerId) return;
    const { data, error } = await supabase
      .from('stock_inventory_lines')
      .select('*')
      .eq('dealer_id', dealerId)
      .eq('category', 'fertilizer')
      .order('report_date', { ascending: false });

    if (error) {
      console.error(error);
      setStockLines([]);
    } else {
      setStockLines((data || []) as StockInventoryLine[]);
    }
  }, [dealerId]);

  useEffect(() => {
    if (!dealerId) return;
    setLoading(true);
    Promise.all([loadReceipts(), loadStockLines()]).finally(() => {
      setLoading(false);
    });
  }, [dealerId, loadReceipts, loadStockLines]);

  // Combine and transform data
  const historyRecords = useMemo(() => {
    const records: HistoryRecord[] = [];
    
    receipts.forEach(r => {
      records.push({
        id: `receipt-${r.id}`,
        type: 'receipt',
        date: r.invoice_date || r.created_at,
        product_type: r.fertilizer_type,
        fertilizer_type: r.fertilizer_type,
        quantity_mts: r.quantity_mts,
        quantity_bags: r.quantity_bags,
        wholesaler_name: r.wholesaler_name,
        invoice_number: r.invoice_number,
      });
    });
    
    stockLines.forEach(s => {
      records.push({
        id: `stock-${s.id}`,
        type: 'stock',
        date: s.report_date,
        product_type: s.product_type,
        fertilizer_type: s.product_type,
        quantity_mts: s.sales || 0,
        opening_balance: s.opening_balance,
        receipts: s.receipts,
        sales: s.sales,
        closing_balance: s.closing_balance,
      });
    });
    
    return records;
  }, [receipts, stockLines]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return historyRecords.filter(record => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch = !search ||
        record.product_type.toLowerCase().includes(search) ||
        (record.invoice_number || '').toLowerCase().includes(search) ||
        (record.wholesaler_name || '').toLowerCase().includes(search) ||
        record.date.includes(search);
      
      const matchesFromDate = !fromDate || record.date >= fromDate;
      const matchesToDate = !toDate || record.date <= toDate;
      const matchesProduct = !selectedProduct || record.product_type === selectedProduct;
      const matchesMonth = !selectedMonth || record.date.startsWith(selectedMonth);
      const matchesYear = !selectedYear || record.date.startsWith(selectedYear);
      
      return matchesSearch && matchesFromDate && matchesToDate && matchesProduct && matchesMonth && matchesYear;
    });
  }, [historyRecords, searchTerm, fromDate, toDate, selectedProduct, selectedMonth, selectedYear]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'product_type') {
        comparison = a.product_type.localeCompare(b.product_type);
      } else if (sortField === 'quantity_mts') {
        comparison = a.quantity_mts - b.quantity_mts;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredRecords, sortField, sortDirection]);

  // Pagination
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);

  // Cumulative summary calculations
  const summary = useMemo(() => {
    const totalReceipts = receipts.reduce((sum, r) => sum + (r.quantity_mts || 0), 0);
    const totalSales = stockLines.reduce((sum, s) => sum + (s.sales || 0), 0);
    const currentStock = stockLines.reduce((sum, s) => sum + (s.closing_balance || 0), 0);
    
    const byFertilizer = receipts.reduce((acc, r) => {
      acc[r.fertilizer_type] = (acc[r.fertilizer_type] || 0) + (r.quantity_mts || 0);
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalReceipts,
      totalSales,
      currentStock,
      totalUrea: byFertilizer['Urea'] || 0,
      totalDAP: byFertilizer['DAP'] || 0,
      totalPotash: byFertilizer['Potash'] || 0,
      totalComplex: byFertilizer['Complex'] || 0,
    };
  }, [receipts, stockLines]);

  // Get unique products for filter
  const products = useMemo(() => {
    const unique = new Set(historyRecords.map(r => r.product_type));
    return Array.from(unique).sort();
  }, [historyRecords]);

  // Get unique months for filter
  const months = useMemo(() => {
    const unique = new Set(historyRecords.map(r => r.date.substring(0, 7)));
    return Array.from(unique).sort().reverse();
  }, [historyRecords]);

  // Get unique years for filter
  const years = useMemo(() => {
    const unique = new Set(historyRecords.map(r => r.date.substring(0, 4)));
    return Array.from(unique).sort().reverse();
  }, [historyRecords]);

  const resetFilters = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setSelectedProduct('');
    setSelectedMonth('');
    setSelectedYear('');
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Receipts sheet
    if (receipts.length > 0) {
      const receiptsData = receipts.map((r, index) => ({
        'S.No': index + 1,
        Dealer: dealerName || '',
        Fertilizer: r.fertilizer_type,
        'Receipts (MT)': r.quantity_mts,
        Bags: r.quantity_bags,
        Wholesaler: r.wholesaler_name,
        'Invoice No.': r.invoice_number,
        'Invoice Date': r.invoice_date,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(receiptsData), 'Receipts');
    }
    
    // Stock lines sheet
    if (stockLines.length > 0) {
      const stockData = stockLines.map((s, index) => ({
        'S.No': index + 1,
        Dealer: dealerName || '',
        Date: s.report_date,
        Product: s.product_type,
        Opening: s.opening_balance,
        Receipts: s.receipts,
        Total: s.total,
        Sales: s.sales,
        Closing: s.closing_balance,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stockData), 'Daily Stock');
    }
    
    if (receipts.length === 0 && stockLines.length === 0) {
      alert('No data to export');
      return;
    }
    
    XLSX.writeFile(workbook, `dealer-history-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleSort = (field: 'date' | 'product_type' | 'quantity_mts') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (!dealerId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {t('Dealer account not linked. Please sign in with your registered phone number.')}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg bg-[#0B3D91] p-4 text-white shadow-lg">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-black uppercase tracking-wide sm:text-2xl">{t('Stock Receipts & Sales History')}</h1>
            <p className="mt-1 text-sm font-semibold text-blue-100">{dealerName || 'Dealer Firm'}</p>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-blue-400 bg-blue-900/50 px-3 py-2 text-sm font-bold text-white">
            {t('Unit')}
            <select
              value={fertilizerQtyUnit}
              onChange={(event) => setFertilizerQtyUnit(event.target.value as FertilizerUnit)}
              className="bg-transparent font-black text-white outline-none"
            >
              <option value="mts">MT</option>
              <option value="bags">{t('Bags')}</option>
            </select>
          </label>
        </div>
      </div>

      {/* Cumulative Summary Cards */}
      <section className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
        <SummaryCard label={t('Total Receipts')} value={`${summary.totalReceipts.toFixed(2)} MT`} tone="emerald" />
        <SummaryCard label={t('Total Sales')} value={`${summary.totalSales.toFixed(2)} MT`} tone="amber" />
        <SummaryCard label={t('Current Stock')} value={`${summary.currentStock.toFixed(2)} MT`} tone="sky" />
        <SummaryCard label={t('Total Urea Received')} value={`${summary.totalUrea.toFixed(2)} MT`} tone="emerald" />
        <SummaryCard label={t('Total DAP Received')} value={`${summary.totalDAP.toFixed(2)} MT`} tone="sky" />
        <SummaryCard label={t('Total Potash Received')} value={`${summary.totalPotash.toFixed(2)} MT`} tone="amber" />
        <SummaryCard label={t('Total Complex Received')} value={`${summary.totalComplex.toFixed(2)} MT`} tone="emerald" />
      </section>

      {/* Filters */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-black text-slate-950 dark:text-white">{t('Filter')}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('Search invoice, fertilizer, wholesaler')}
                  className="w-64 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <select
                value={selectedProduct}
                onChange={(event) => setSelectedProduct(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">{t('Product')}</option>
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">{t('Month')}</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">{t('Financial Year')}</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
                {t('Reset')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportToExcel}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300"
        >
          <Download className="h-5 w-5" />
          {t('Export Excel')}
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
        Showing {paginatedRecords.length} of {sortedRecords.length} records
      </p>

      {/* History Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-900 text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-slate-800" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-2">
                    {t('Date')}
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-slate-800" onClick={() => handleSort('product_type')}>
                  <div className="flex items-center gap-2">
                    {t('Product')}
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">{t('Type')}</th>
                <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort('quantity_mts')}>
                  <div className="flex items-center justify-end gap-2">
                    {t('Quantity')} (MT)
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">{t('Opening Stock')}</th>
                <th className="px-4 py-3 text-right">{t('Receipts')}</th>
                <th className="px-4 py-3 text-right">{t('Sales')}</th>
                <th className="px-4 py-3 text-right">{t('Closing Stock')}</th>
                <th className="px-4 py-3 text-left">{t('Wholesaler')}</th>
                <th className="px-4 py-3 text-left">{t('Invoice No.')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-3 font-semibold">{record.date}</td>
                  <td className="px-4 py-3 font-black text-slate-950 dark:text-white">{record.product_type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                      record.type === 'receipt' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {record.type === 'receipt' ? t('Receipt') : t('Stock')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                    {record.quantity_mts.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">{record.opening_balance?.toFixed(2) || '-'}</td>
                  <td className="px-4 py-3 text-right">{record.receipts?.toFixed(2) || '-'}</td>
                  <td className="px-4 py-3 text-right">{record.sales?.toFixed(2) || '-'}</td>
                  <td className="px-4 py-3 text-right">{record.closing_balance?.toFixed(2) || '-'}</td>
                  <td className="px-4 py-3">{record.wholesaler_name || '-'}</td>
                  <td className="px-4 py-3">{record.invoice_number || '-'}</td>
                </tr>
              ))}
              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    {t('No receipts match the selected filters.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'sky' | 'amber' }) {
  const classes = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200',
    sky: 'border-sky-100 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200',
    amber: 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
  }[tone];

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${classes}`}>
      <p className="text-[10px] font-black uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}
