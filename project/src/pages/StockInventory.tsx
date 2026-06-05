import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, FolderOpen, RefreshCw, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FERTILIZER_TYPES } from '../lib/constants';
import {
  STOCK_CATEGORIES,
  StockCategory,
  currentReportDate,
  formatFertilizerQuantity,
  formatReportDateLabel,
} from '../lib/stockInventory';

const titleCase = (value = '') =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const currentFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const start = now.getMonth() >= 3 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const financialYearOptions = () => {
  const currentStart = Number(currentFinancialYear().slice(0, 4));
  return Array.from({ length: 5 }, (_, index) => {
    const start = currentStart - index;
    return `${start}-${String(start + 1).slice(-2)}`;
  });
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
  const dateLocale = language === 'te' ? 'te-IN' : 'en-IN';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stock_inventory_lines')
        .select('*, dealers(dealer_name)')
        .order('report_date', { ascending: false })
        .order('dealers(dealer_name)', { ascending: true })
        .order('serial_no');

      if (viewMode === 'day') {
        query = query.eq('report_date', reportDate);
      } else {
        query = query.eq('report_month', reportMonth);
      }

      query = query.eq('category', category);

      const { data, error } = await query;
      if (error) throw error;
      setRows((data as InventoryRow[]) || []);
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
    if (fertilizerFilter === 'all') return dealerFilteredRows;
    return dealerFilteredRows.filter((row) => row.category !== 'fertilizer' || row.product_type === fertilizerFilter);
  }, [dealerFilteredRows, fertilizerFilter]);

  const fertilizerSummary = useMemo(() => {
    const fertilizers = fertilizerFilter === 'all' ? FERTILIZER_TYPES : [fertilizerFilter];
    return fertilizers.map((fertilizer) => {
      const lines = dealerFilteredRows.filter((row) => row.category === 'fertilizer' && row.product_type === fertilizer);
      return {
        fertilizer,
        sales: lines.reduce((sum, row) => sum + Number(row.sales || 0), 0),
        closing: lines.reduce((sum, row) => sum + Number(row.closing_balance || 0), 0),
      };
    });
  }, [dealerFilteredRows, fertilizerFilter]);

  const chartRows = useMemo(
    () => fertilizerSummary.map((item) => ({
      fertilizer: item.fertilizer,
      Sales: Number(item.sales.toFixed(2)),
      Closing: Number(item.closing.toFixed(2)),
    })),
    [fertilizerSummary]
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black text-slate-950 dark:text-white">
            <FolderOpen className="h-8 w-8 text-emerald-600" />
            {t('Dealer Daily Stock', 'Dealer Daily Stock')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {t('View dealer daily stock submissions as a table list.', 'View dealer daily stock submissions as a table list.')}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-bold dark:border-slate-600"
        >
          <RefreshCw className="h-4 w-4" />
          {t('Refresh', 'Refresh')}
        </button>
        <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">
          Financial Year
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="bg-transparent font-black text-slate-950 outline-none dark:text-white"
          >
            {financialYearOptions().map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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

      {category === 'fertilizer' && (
        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Fertilizer Sales and Closing Chart
          </h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fertilizer" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `${Number(value ?? 0).toFixed(2)} MT`} />
                <Bar dataKey="Sales" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Closing" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-900 text-xs uppercase text-white">
                <tr>
                  <th className="px-3 py-2 text-left">S.No</th>
                  <th className="px-3 py-2 text-left">Dealer</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Opening</th>
                  <th className="px-3 py-2 text-right">Receipts</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Sales</th>
                  <th className="px-3 py-2 text-right">Closing</th>
                  {isAdminUser && <th className="px-3 py-2 text-center">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.map((line, index) => (
                  <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-3 py-2 font-bold">{index + 1}</td>
                    <td className="px-3 py-2 font-black text-slate-950 dark:text-white">{titleCase(line.dealers?.dealer_name || 'Unknown')}</td>
                    <td className="px-3 py-2 font-semibold">
                      {line.product_type}
                      {unitLabelForLine(line) ? ` (${unitLabelForLine(line)})` : ''}
                    </td>
                    <td className="px-3 py-2 text-right">{formatQuantity(line, line.opening_balance)}</td>
                    <td className="px-3 py-2 text-right">{formatQuantity(line, line.receipts)}</td>
                    <td className="px-3 py-2 text-right font-bold">{formatQuantity(line, line.total)}</td>
                    <td className="px-3 py-2 text-right">{formatQuantity(line, line.sales)}</td>
                    <td className="px-3 py-2 text-right font-black text-emerald-700 dark:text-emerald-400">
                      {formatQuantity(line, line.closing_balance)}
                    </td>
                    {isAdminUser && (
                      <td className="px-3 py-2 text-center">
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
        </section>
      )}
    </div>
  );
}
