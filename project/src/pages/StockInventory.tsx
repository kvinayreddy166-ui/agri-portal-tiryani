import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronDown, FileSpreadsheet, FolderOpen, RefreshCw, RotateCcw, Search, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FERTILIZER_TYPES } from '../lib/constants';
import { cachedSupabaseRows } from '../lib/offlineCache';
import { IconButton } from '../components/ui/DesignSystem';
import { totalValue } from '../utils/excelTotals';
import {
  STOCK_CATEGORIES,
  StockCategory,
  currentReportDate,
  formatFertilizerQuantity,
  fertilizerMtsToBags,
  formatReportDateLabel,
} from '../lib/stockInventory';

const titleCase = (value = '') =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const FINANCIAL_YEAR_OPTIONS = ['2025-26', '2026-27', '2027-28', '2028-29', '2029-30', '2030-31'];
const STOCK_ROWS_PAGE_SIZE = 25;

const currentFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const start = now.getMonth() >= 3 ? year : year - 1;
  const value = `${start}-${String(start + 1).slice(-2)}`;
  return FINANCIAL_YEAR_OPTIONS.includes(value) ? value : FINANCIAL_YEAR_OPTIONS[0];
};

const reportDateInFinancialYear = (value: string, financialYear: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const start = Number(financialYear.slice(0, 4));
  const from = new Date(start, 3, 1);
  const to = new Date(start + 1, 2, 31, 23, 59, 59, 999);
  return date >= from && date <= to;
};

interface InventoryRow {
  id: string;
  dealer_id: string;
  category: StockCategory;
  serial_no: number;
  product_type: string;
  opening_balance: number;
  receipts: number;
  total: number;
  sales: number;
  closing_balance: number;
  report_date: string;
  report_month: string;
  dealers?: { dealer_name: string };
}

export function StockInventory() {
  const { isAdminUser } = useAuth();
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<StockCategory>('fertilizer');
  const [reportDate, setReportDate] = useState(currentReportDate());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [reportMonth, setReportMonth] = useState(reportDate.slice(0, 7));
  const [financialYear, setFinancialYear] = useState(currentFinancialYear());
  const [fertilizerQtyUnit, setFertilizerQtyUnit] = useState<'mts' | 'bags'>('mts');
  const [fertilizerFilter, setFertilizerFilter] = useState('all');
  const [dealerFilter, setDealerFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const dateLocale = language === 'te' ? 'te-IN' : 'en-IN';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stock_inventory_lines')
        .select('id, dealer_id, category, serial_no, product_type, opening_balance, receipts, total, sales, closing_balance, report_date, report_month, dealers(dealer_name)')
        .order('report_date', { ascending: false })
        .order('dealers(dealer_name)', { ascending: true })
        .order('serial_no')
        .range(0, 999);

      if (viewMode === 'day') {
        query = query.eq('report_date', reportDate);
      } else {
        query = query.eq('report_month', reportMonth);
      }

      query = query.eq('category', category);

      const data = await cachedSupabaseRows<InventoryRow>(
        `stock-inventory:${category}:${viewMode}:${viewMode === 'day' ? reportDate : reportMonth}:v2`,
        () => query,
        []
      );
      setRows(data);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [category, reportDate, reportMonth, viewMode]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel(`stock-inventory-live-${category}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_inventory_lines' }, () => {
        void fetchData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [category, fetchData]);

  const dealerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.dealer_id, row.dealers?.dealer_name || 'Unknown');
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const dealerFilteredRows = useMemo(() => {
    const yearRows = rows.filter((row) => reportDateInFinancialYear(row.report_date, financialYear));
    if (dealerFilter === 'all') return yearRows;
    return yearRows.filter((row) => row.dealer_id === dealerFilter);
  }, [dealerFilter, financialYear, rows]);

  const filteredRows = useMemo(() => {
    const fertilizerRows =
      fertilizerFilter === 'all'
        ? dealerFilteredRows
        : dealerFilteredRows.filter((row) => row.category !== 'fertilizer' || row.product_type === fertilizerFilter);
    const search = appliedSearchTerm.trim().toLowerCase();
    if (!search) return fertilizerRows;
    return fertilizerRows.filter((row) => {
      const invoiceNumber = String((row as InventoryRow & { invoice_number?: string }).invoice_number || '');
      return (
        (row.dealers?.dealer_name || '').toLowerCase().includes(search) ||
        row.product_type.toLowerCase().includes(search) ||
        row.category.toLowerCase().includes(search) ||
        row.report_date.toLowerCase().includes(search) ||
        row.report_month.toLowerCase().includes(search) ||
        invoiceNumber.toLowerCase().includes(search)
      );
    });
  }, [appliedSearchTerm, dealerFilteredRows, fertilizerFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / STOCK_ROWS_PAGE_SIZE));
  const paginatedRows = filteredRows.slice(
    currentPage * STOCK_ROWS_PAGE_SIZE,
    currentPage * STOCK_ROWS_PAGE_SIZE + STOCK_ROWS_PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [appliedSearchTerm, category, dealerFilter, fertilizerFilter, financialYear, reportDate, reportMonth, viewMode]);

  const resetFilters = () => {
    setSearchInput('');
    setAppliedSearchTerm('');
    setDealerFilter('all');
    setFertilizerFilter('all');
    setFinancialYear(currentFinancialYear());
    setReportDate(currentReportDate());
    setReportMonth(currentReportDate().slice(0, 7));
  };

  const chartQuantity = useCallback((line: InventoryRow, value: number) => {
    if (line.category === 'fertilizer' && fertilizerQtyUnit === 'bags') {
      return Math.round(fertilizerMtsToBags(value, line.product_type));
    }
    return Number(value || 0);
  }, [fertilizerQtyUnit]);

  const stockSummary = useMemo(() => {
    const products =
      category === 'fertilizer'
        ? fertilizerFilter === 'all'
          ? FERTILIZER_TYPES
          : [fertilizerFilter]
        : Array.from(new Set(dealerFilteredRows.filter((row) => row.category === category).map((row) => row.product_type))).sort();

    return products.map((product) => {
      const lines = dealerFilteredRows.filter((row) => row.category === category && row.product_type === product);
      return {
        product,
        receipts: lines.reduce((sum, row) => sum + chartQuantity(row, row.receipts), 0),
        sales: lines.reduce((sum, row) => sum + chartQuantity(row, row.sales), 0),
        closing: lines.reduce((sum, row) => sum + chartQuantity(row, row.closing_balance), 0),
      };
    });
  }, [category, chartQuantity, dealerFilteredRows, fertilizerFilter]);

  const chartRows = useMemo(
    () => stockSummary.map((item) => ({
      product: item.product,
      Receipts: Number(item.receipts.toFixed(2)),
      Sales: Number(item.sales.toFixed(2)),
      Closing: Number(item.closing.toFixed(2)),
    })),
    [stockSummary]
  );

  const formatQuantity = (line: InventoryRow, value: number) => {
    if (line.category !== 'fertilizer') return Number(value || 0).toFixed(2);
    return formatFertilizerQuantity(value, line.product_type, fertilizerQtyUnit);
  };

  const unitLabelForLine = (line: InventoryRow) => {
    if (line.category !== 'fertilizer') return '';
    return fertilizerQtyUnit === 'bags' ? 'Bags' : 'MT';
  };

  const handleDeleteLine = async (line: InventoryRow) => {
    if (!isAdminUser) return;
    if (!confirm(`Delete ${line.product_type} stock submission from ${line.dealers?.dealer_name || 'this dealer'}?`)) return;

    const { error } = await supabase.from('stock_inventory_lines').delete().eq('id', line.id);
    if (error) {
      alert(`Could not delete submission: ${error.message}`);
      return;
    }
    await fetchData();
  };

  const exportToExcel = async () => {
    if (!filteredRows.length) {
      alert('No records to export.');
      return;
    }

    const XLSX = await import('xlsx');
    const quantityUnit = category === 'fertilizer' ? (fertilizerQtyUnit === 'bags' ? 'Bags' : 'MT') : '';
    const metadataRows = [
      ['Tiryani Agriculture Portal'],
      ['Dealer Daily Stock Inventory'],
      ['Category', titleCase(category)],
      ['Financial Year', financialYear],
      ['Report Mode', viewMode === 'day' ? 'Day' : 'Month'],
      ['Report Period', viewMode === 'day' ? reportDate : reportMonth],
      ['Dealer Filter', dealerFilter === 'all' ? 'All dealers' : dealerOptions.find(([id]) => id === dealerFilter)?.[1] || dealerFilter],
      ['Product Filter', category === 'fertilizer' ? fertilizerFilter : 'All'],
      ['Unit', quantityUnit || 'As submitted'],
      ['Generated On', new Date().toLocaleString('en-IN')],
      [],
    ];

    const tableRows = filteredRows.map((line, index) => ({
      'S.No': index + 1,
      'Financial Year': financialYear,
      Date: line.report_date,
      Month: line.report_month,
      Category: titleCase(line.category),
      Dealer: titleCase(line.dealers?.dealer_name || 'Unknown'),
      Type: line.product_type,
      Unit: unitLabelForLine(line) || '',
      Opening: formatQuantity(line, line.opening_balance),
      Receipts: formatQuantity(line, line.receipts),
      Total: formatQuantity(line, line.total),
      Sales: formatQuantity(line, line.sales),
      Closing: formatQuantity(line, line.closing_balance),
    }));

    const summaryRows = chartRows.map((item, index) => ({
      'S.No': index + 1,
      Product: item.product,
      Receipts: item.Receipts,
      Sales: item.Sales,
      Closing: item.Closing,
    }));

    const totalColumns = ['Opening', 'Receipts', 'Total', 'Sales', 'Closing'];
    const totalRow = Object.keys(tableRows[0]).reduce((row, key) => {
      row[key as keyof typeof tableRows[number]] =
        key === 'S.No'
          ? 'TOTAL'
          : totalColumns.includes(key)
            ? totalValue(tableRows, key)
            : '';
      return row;
    }, {} as Record<string, string | number>);
    const summaryTotalRow = {
      'S.No': 'TOTAL',
      Product: '',
      Receipts: totalValue(summaryRows, 'Receipts'),
      Sales: totalValue(summaryRows, 'Sales'),
      Closing: totalValue(summaryRows, 'Closing'),
    };

    const workbook = XLSX.utils.book_new();
    const stockSheet = XLSX.utils.aoa_to_sheet(metadataRows);
    XLSX.utils.sheet_add_json(stockSheet, [...tableRows, totalRow], { origin: `A${metadataRows.length + 1}`, skipHeader: false });
    stockSheet['!cols'] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 28 },
      { wch: 18 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, stockSheet, 'Daily Stock');

    const summarySheet = XLSX.utils.json_to_sheet([...summaryRows, summaryTotalRow]);
    summarySheet['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const safePeriod = (viewMode === 'day' ? reportDate : reportMonth).replace(/[^0-9-]/g, '');
    XLSX.writeFile(workbook, `dealer_daily_stock_${category}_${safePeriod}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
            <FolderOpen className="h-6 w-6 text-emerald-600" />
            {t('Dealer Daily Stock', 'Dealer Daily Stock')}
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {t('View dealer daily stock submissions as a table list.', 'View dealer daily stock submissions as a table list.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IconButton label={t('Export to Excel', 'Export to Excel')} tone="excel" onClick={exportToExcel} disabled={!filteredRows.length}>
            <FileSpreadsheet className="h-4 w-4" />
          </IconButton>
          <IconButton label={t('Refresh', 'Refresh')} tone="secondary" onClick={fetchData}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </IconButton>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">
            FY
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-transparent font-black text-slate-950 outline-none dark:text-white"
            >
              {FINANCIAL_YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-950 dark:text-white">Filters</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Search and filter dealer stock records</p>
          </div>
          <IconButton label="Filters" tone="secondary" onClick={() => setFiltersOpen((value) => !value)} className="h-9 w-9">
            <ChevronDown className={`h-3.5 w-3.5 transition ${filtersOpen ? 'rotate-180' : ''}`} />
          </IconButton>
        </div>
      <div className={`${filtersOpen ? 'flex' : 'hidden'} mt-3 flex-wrap items-center gap-3`}>
        <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setAppliedSearchTerm(searchInput);
              }}
              placeholder="Search dealer, firm, fertilizer, invoice, date"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <IconButton label="Search" tone="primary" onClick={() => setAppliedSearchTerm(searchInput)}>
            <Search className="h-4 w-4" />
          </IconButton>
          <IconButton label="Reset filters" tone="secondary" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
          </IconButton>
        </div>
        <button
          type="button"
          onClick={() => setViewMode('day')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            viewMode === 'day' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {t('By day', 'By day')}
        </button>
        <button
          type="button"
          onClick={() => setViewMode('month')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            viewMode === 'month' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {t('By month', 'By month')}
        </button>
        {viewMode === 'day' ? (
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        ) : (
          <input
            type="month"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        )}
        {STOCK_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              category === item.id ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {t(item.label, item.telugu)}
          </button>
        ))}
        <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">
          {t('Dealer', 'Dealer')}
          <select
            value={dealerFilter}
            onChange={(e) => setDealerFilter(e.target.value)}
            className="bg-transparent font-black text-slate-950 outline-none dark:text-white"
          >
            <option value="all">All dealers</option>
            {dealerOptions.map(([dealerId, dealerName]) => (
              <option key={dealerId} value={dealerId}>{titleCase(dealerName)}</option>
            ))}
          </select>
        </label>
        {category === 'fertilizer' && (
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">
            {t('Fertilizer unit', 'Fertilizer unit')}
            <select
              value={fertilizerQtyUnit}
              onChange={(e) => setFertilizerQtyUnit(e.target.value as 'mts' | 'bags')}
              className="bg-transparent font-black text-slate-950 outline-none dark:text-white"
            >
              <option value="mts">MT</option>
              <option value="bags">Bags</option>
            </select>
          </label>
        )}
        {category === 'fertilizer' && (
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">
            {t('Fertilizer', 'Fertilizer')}
            <select
              value={fertilizerFilter}
              onChange={(e) => setFertilizerFilter(e.target.value)}
              className="bg-transparent font-black text-slate-950 outline-none dark:text-white"
            >
              <option value="all">All</option>
              {FERTILIZER_TYPES.map((fertilizer) => (
                <option key={fertilizer} value={fertilizer}>{fertilizer}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Stock Movement Chart
          </h2>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
            {filteredRows.length} records
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="product" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={46} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value) => `${Number(value ?? 0).toFixed(category === 'fertilizer' && fertilizerQtyUnit === 'bags' ? 0 : 2)} ${category === 'fertilizer' ? unitLabelForLine({ category: 'fertilizer', product_type: 'Urea' } as InventoryRow) : ''}`}
                contentStyle={{ borderRadius: 12, border: '1px solid #dbe7df', fontSize: 12, fontWeight: 700 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Bar dataKey="Receipts" fill="#2563eb" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Sales" fill="#f59e0b" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Closing" fill="#0b7a5c" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-600">
          {viewMode === 'day'
            ? t(
                `No dealer stock submitted for ${formatReportDateLabel(reportDate, dateLocale)}.`,
                `No dealer stock submitted for ${formatReportDateLabel(reportDate, dateLocale)}.`
              )
            : t('No dealer stock submitted for this month yet.', 'No dealer stock submitted for this month yet.')}
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="table-scroll">
            <table className="w-full min-w-[820px] text-xs">
              <thead className="sticky top-0 z-10 bg-slate-900 text-[11px] uppercase text-white">
                <tr>
                  <th className="px-2 py-1.5 text-left">S.No</th>
                  <th className="px-2 py-1.5 text-left">Dealer</th>
                  <th className="px-2 py-1.5 text-left">Type</th>
                  <th className="px-2 py-1.5 text-right">Opening</th>
                  <th className="px-2 py-1.5 text-right">Receipts</th>
                  <th className="px-2 py-1.5 text-right">Total</th>
                  <th className="px-2 py-1.5 text-right">Sales</th>
                  <th className="px-2 py-1.5 text-right">Closing</th>
                  {isAdminUser && <th className="px-2 py-1.5 text-center">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedRows.map((line, index) => (
                  <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-2 py-1.5 font-bold">{currentPage * STOCK_ROWS_PAGE_SIZE + index + 1}</td>
                    <td className="max-w-[220px] truncate px-2 py-1.5 font-black text-slate-950 dark:text-white">{titleCase(line.dealers?.dealer_name || 'Unknown')}</td>
                    <td className="px-2 py-1.5 font-semibold">
                      {line.product_type}
                      {unitLabelForLine(line) ? ` (${unitLabelForLine(line)})` : ''}
                    </td>
                    <td className="px-2 py-1.5 text-right">{formatQuantity(line, line.opening_balance)}</td>
                    <td className="px-2 py-1.5 text-right">{formatQuantity(line, line.receipts)}</td>
                    <td className="px-2 py-1.5 text-right font-bold">{formatQuantity(line, line.total)}</td>
                    <td className="px-2 py-1.5 text-right">{formatQuantity(line, line.sales)}</td>
                    <td className="px-2 py-1.5 text-right font-black text-emerald-700 dark:text-emerald-400">
                      {formatQuantity(line, line.closing_balance)}
                    </td>
                    {isAdminUser && (
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteLine(line)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          aria-label="Delete stock submission"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length > STOCK_ROWS_PAGE_SIZE && (
            <TablePagination
              currentPage={currentPage}
              pageCount={pageCount}
              onPageChange={setCurrentPage}
            />
          )}
        </section>
      )}
    </div>
  );
}

function TablePagination({
  currentPage,
  pageCount,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:text-slate-300">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-50 dark:border-slate-700"
      >
        Previous
      </button>
      <span className="uppercase tracking-wide">
        Page {currentPage + 1} / {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
        disabled={currentPage >= pageCount - 1}
        className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-50 dark:border-slate-700"
      >
        Next
      </button>
    </div>
  );
}
