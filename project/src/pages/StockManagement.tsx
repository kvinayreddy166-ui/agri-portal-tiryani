import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronDown, FileSpreadsheet, Package, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Dealer, DealerStockAllocation } from '../types/database';
import { FERTILIZER_TYPES } from '../lib/constants';
import { syncFertilizerStockTable } from '../lib/fertilizerStock';
import { upsertDealerStockAllocation } from '../lib/dealerStockAllocation';
import { useVirtualRows } from '../hooks/useVirtualRows';
import { IconButton } from '../components/ui/DesignSystem';
import { appendSheetWithTotals, appendSummarySheet, totalValue, type ExcelRow } from '../utils/excelTotals';

const fertilizers = [...FERTILIZER_TYPES];

const titleCase = (value = '') =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const FINANCIAL_YEAR_OPTIONS = ['2025-26', '2026-27', '2027-28', '2028-29', '2029-30', '2030-31'];
const WHOLESALER_OPTIONS = [
  'M/s. Laxmi Narasimha Traders, Karimnagar',
  'M/s. FR Lahoti & Sons',
  'M/s. Vaibhav Traders, Karimnagar',
  'Jahnavi Agro Agencies',
  'M/s. Sai Rama Trading Company, Karimnagar',
  'M/s. Meher Sai Seeds & Fertilizers',
  'Sri Rajarajeshwari Traders, Mancherial',
  'Markfed',
  'Kanaka Durga Trading Company',
  'M/s. Hanuman Agro Bellampally',
  'Sri Laxmi Fertilizers',
  'Rama Trading Company',
  'Sri Ganesh Pesticides',
  'Maheshwara Fertilizers & Seeds',
  'Others provide description',
];

const currentFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const start = now.getMonth() >= 3 ? year : year - 1;
  const value = `${start}-${String(start + 1).slice(-2)}`;
  return FINANCIAL_YEAR_OPTIONS.includes(value) ? value : FINANCIAL_YEAR_OPTIONS[0];
};

const dateInFinancialYear = (value: string | undefined, financialYear: string) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const start = Number(financialYear.slice(0, 4));
  const from = new Date(start, 3, 1);
  const to = new Date(start + 1, 2, 31, 23, 59, 59, 999);
  return date >= from && date <= to;
};

export function StockManagement() {
  const { isAdminUser, isDealerUser } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [stock, setStock] = useState<DealerStockAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [financialYear, setFinancialYear] = useState(currentFinancialYear());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dealerFilter, setDealerFilter] = useState('all');
  const [fertilizerFilter, setFertilizerFilter] = useState('all');
  const [wholesalerFilter, setWholesalerFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    dealer_id: '',
    fertilizer_type: 'Urea',
    quantity_mts: 0,
  });

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('fertilizer-tracking-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dealer_stock_allocation' }, () => {
        void fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_inventory_lines' }, () => {
        void fetchData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealersResult, stockResult] = await Promise.all([
        supabase
          .from('dealers')
          .select('id, dealer_name, ifms_id, phone_number, portal_email, license_number, issue_date, expiry_date, location, dealer_category, created_at, updated_at')
          .order('dealer_name')
          .limit(800),
        supabase
          .from('dealer_stock_allocation')
          .select('id, dealer_id, fertilizer_type, quantity_mts, quantity_unit, quantity_bags, wholesaler_name, invoice_number, invoice_date, last_updated, created_at')
          .order('invoice_date', { ascending: false, nullsFirst: false })
          .order('last_updated', { ascending: false })
          .range(0, 4999),
      ]);

      if (dealersResult.error) throw dealersResult.error;
      if (stockResult.error) throw stockResult.error;

      const dealerRows = dealersResult.data || [];
      const enrichedStock = (stockResult.data || []).map((item) => {
        const dealer = dealerRows.find((row) => row.id === item.dealer_id);
        return {
          ...item,
          dealer_name: dealer?.dealer_name || 'Unknown dealer',
        };
      });

      setDealers(dealerRows);
      setStock(enrichedStock);
    } catch (error) {
      console.error('Error fetching dealer-wise stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.dealer_id || !formData.fertilizer_type || formData.quantity_mts < 0) {
      alert('Please select a dealer, fertilizer, and valid quantity.');
      return;
    }

    try {
      await upsertDealerStockAllocation({
        dealer_id: formData.dealer_id,
        fertilizer_type: formData.fertilizer_type,
        quantity_mts: formData.quantity_mts,
      });

      try {
        await syncFertilizerStockTable();
      } catch (syncErr) {
        console.warn('fertilizer_stock sync:', syncErr);
      }
      setShowAddForm(false);
      setFormData({ dealer_id: '', fertilizer_type: 'Urea', quantity_mts: 0 });
      void fetchData();
    } catch (error) {
      console.error('Error adding dealer-wise stock:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(
        `Failed to add dealer-wise stock: ${message}\n\nIf this mentions permission or policy, run the latest Supabase migration (stock inventory & dealer login).`
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fertilizer receipt entry?')) return;

    try {
      const { error } = await supabase
        .from('dealer_stock_allocation')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await syncFertilizerStockTable();
      void fetchData();
    } catch (error) {
      console.error('Error deleting dealer-wise stock:', error);
      alert('Failed to delete stock entry.');
    }
  };

  const financialYearStock = useMemo(() => {
    return stock.filter((item) => dateInFinancialYear(item.invoice_date || item.last_updated, financialYear));
  }, [financialYear, stock]);

  const dealerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of financialYearStock) {
      map.set(item.dealer_id, item.dealer_name || 'Unknown dealer');
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [financialYearStock]);

  const filteredStock = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return financialYearStock.filter((item) => (
      (dealerFilter === 'all' || item.dealer_id === dealerFilter) &&
      (fertilizerFilter === 'all' || item.fertilizer_type === fertilizerFilter) &&
      (wholesalerFilter === 'all' || (item.wholesaler_name || '').trim() === wholesalerFilter) &&
      (!fromDate || (item.invoice_date || item.last_updated || '') >= fromDate) &&
      (!toDate || (item.invoice_date || item.last_updated || '') <= toDate) &&
      ((item.dealer_name || '').toLowerCase().includes(search) ||
      item.fertilizer_type.toLowerCase().includes(search) ||
      (item.invoice_number || '').toLowerCase().includes(search) ||
      (item.invoice_date || '').toLowerCase().includes(search) ||
      (item.last_updated || '').toLowerCase().includes(search) ||
      (item.wholesaler_name || '').toLowerCase().includes(search))
    ));
  }, [dealerFilter, fertilizerFilter, financialYearStock, fromDate, searchTerm, toDate, wholesalerFilter]);

  const fertilizerSummary = useMemo(() => fertilizers.map((fertilizer) => {
    const items = filteredStock.filter((item) => item.fertilizer_type === fertilizer);
    return {
      fertilizer,
      receipts: items.reduce((sum, item) => sum + Number(item.quantity_mts || 0), 0),
      dealers: new Set(items.map((item) => item.dealer_id)).size,
      entries: items.length,
    };
  }), [filteredStock]);

  const visibleSummary = fertilizerSummary.filter((item) => item.entries > 0);
  const totalReceipts = visibleSummary.reduce((sum, item) => sum + item.receipts, 0);
  const dealerSummary = useMemo(() => {
    const map = new Map<string, { dealer: string; receipts: number; entries: number; fertilizers: Set<string> }>();
    for (const item of filteredStock) {
      const key = item.dealer_id || item.dealer_name || 'unknown';
      const current = map.get(key) || {
        dealer: item.dealer_name || 'Unknown dealer',
        receipts: 0,
        entries: 0,
        fertilizers: new Set<string>(),
      };
      current.receipts += Number(item.quantity_mts || 0);
      current.entries += 1;
      current.fertilizers.add(item.fertilizer_type);
      map.set(key, current);
    }
    return Array.from(map.values())
      .map((item) => ({ ...item, fertilizerCount: item.fertilizers.size }))
      .sort((a, b) => b.receipts - a.receipts);
  }, [filteredStock]);
  const wholesalerSummary = useMemo(() => {
    const map = new Map<string, { wholesaler: string; receipts: number; entries: number; dealers: Set<string> }>();
    for (const item of filteredStock) {
      const key = (item.wholesaler_name || 'Not specified').trim() || 'Not specified';
      const current = map.get(key) || {
        wholesaler: key,
        receipts: 0,
        entries: 0,
        dealers: new Set<string>(),
      };
      current.receipts += Number(item.quantity_mts || 0);
      current.entries += 1;
      current.dealers.add(item.dealer_id || item.dealer_name || 'unknown');
      map.set(key, current);
    }
    return Array.from(map.values())
      .map((item) => ({ ...item, dealerCount: item.dealers.size }))
      .sort((a, b) => b.receipts - a.receipts);
  }, [filteredStock]);
  const chartRows = visibleSummary.map((item) => ({
    fertilizer: item.fertilizer,
    Receipts: Number(item.receipts.toFixed(2)),
  }));
  const receiptRows = useVirtualRows(filteredStock, { rowHeight: 34, viewportHeight: 480 });
  const receiptColumnCount = isAdminUser ? 9 : 8;

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN');
  };

  const exportFilteredReceipts = () => {
    downloadWorkbook(
      filteredStock.map((item, index) => ({
        'S.No': index + 1,
        Dealer: titleCase(item.dealer_name || 'Unknown dealer'),
        Fertilizer: item.fertilizer_type,
        'Receipts (MT)': Number(item.quantity_mts || 0),
        Wholesaler: item.wholesaler_name || '',
        'Invoice No.': item.invoice_number || '',
        'Invoice Date': item.invoice_date || '',
        Updated: item.last_updated || '',
      })),
      `fertilizer-receipts-${financialYear}.xlsx`,
      'Filtered Receipts',
      ['Receipts (MT)'],
      [
        ['Financial Year', financialYear],
        ['From Date', fromDate || ''],
        ['To Date', toDate || ''],
        ['Dealer Filter', dealerFilter === 'all' ? 'All dealers' : dealerOptions.find(([id]) => id === dealerFilter)?.[1] || dealerFilter],
        ['Fertilizer Filter', fertilizerFilter === 'all' ? 'All fertilizers' : fertilizerFilter],
        ['Wholesaler Filter', wholesalerFilter === 'all' ? 'All wholesalers' : wholesalerFilter],
        ['Total Entries', filteredStock.length],
        ['Total Receipts (MT)', totalReceipts.toFixed(2)],
      ]
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isDealerUser ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
          <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            Receipts and sales are not available here. Please use the "Stock Receipts & Sales" section to view your receipts and sales.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="page-title">Fertilizer Tracking</h1>
              <p className="page-subtitle">Fertilizer receipts, dealer load entries, and current balance.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <IconButton label="Refresh fertilizer tracking" tone="secondary" onClick={fetchData}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </IconButton>
              <IconButton label="Export filtered Excel" tone="excel" onClick={exportFilteredReceipts} disabled={filteredStock.length === 0}>
                <FileSpreadsheet className="h-4 w-4" />
              </IconButton>
              {isAdminUser && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Manual Receipt
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black text-slate-950 dark:text-white">Filters</h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Showing {filteredStock.length} of {financialYearStock.length} receipt entries</p>
              </div>
              <IconButton label="Filters" tone="secondary" onClick={() => setFiltersOpen((value) => !value)} className="h-9 w-9">
                <ChevronDown className={`h-3.5 w-3.5 transition ${filtersOpen ? 'rotate-180' : ''}`} />
              </IconButton>
            </div>
          <div className={`${filtersOpen ? 'flex' : 'hidden'} mt-3 flex-col gap-3 md:flex-row md:items-center md:justify-between`}>
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-emerald-900/40"
                placeholder="Search dealer, fertilizer, wholesaler, or invoice"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Financial Year
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="bg-transparent text-slate-950 outline-none dark:text-white"
                >
                  {FINANCIAL_YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From Date"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="To Date"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Dealer
                <select
                  value={dealerFilter}
                  onChange={(e) => setDealerFilter(e.target.value)}
                  className="max-w-44 bg-transparent text-slate-950 outline-none dark:text-white"
                >
                  <option value="all">All dealers</option>
                  {dealerOptions.map(([dealerId, dealerName]) => (
                    <option key={dealerId} value={dealerId}>{titleCase(dealerName)}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Fertilizer
                <select
                  value={fertilizerFilter}
                  onChange={(e) => setFertilizerFilter(e.target.value)}
                  className="max-w-40 bg-transparent text-slate-950 outline-none dark:text-white"
                >
                  <option value="all">All fertilizers</option>
                  {fertilizers.map((fertilizer) => (
                    <option key={fertilizer} value={fertilizer}>{fertilizer}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Wholesaler
                <select
                  value={wholesalerFilter}
                  onChange={(e) => setWholesalerFilter(e.target.value)}
                  className="max-w-44 bg-transparent text-slate-950 outline-none dark:text-white"
                >
                  <option value="all">All wholesalers</option>
                  {WHOLESALER_OPTIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          </div>

          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">Add Fertilizer Receipt</h2>
                  <button onClick={() => setShowAddForm(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Dealer</label>
                    <select
                      value={formData.dealer_id}
                      onChange={(e) => setFormData({ ...formData, dealer_id: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">Select dealer</option>
                      {dealers.map((dealer) => (
                        <option key={dealer.id} value={dealer.id}>
                          {titleCase(dealer.dealer_name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Fertilizer</label>
                    <select
                      value={formData.fertilizer_type}
                      onChange={(e) => setFormData({ ...formData, fertilizer_type: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      {fertilizers.map((fertilizer) => (
                        <option key={fertilizer} value={fertilizer}>{fertilizer}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Receipt Quantity (MT)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity_mts}
                      onChange={(e) => setFormData({ ...formData, quantity_mts: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredStock.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
              <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No fertilizer receipt entries found.</p>
            </div>
          ) : (
            <>
              <section className="grid gap-3 md:grid-cols-[15rem_1fr]">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm shadow-amber-100/80 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Total Receipts</p>
                  <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{totalReceipts.toFixed(2)} MT</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{visibleSummary.length} fertilizer types</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900">
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                    Fertilizer-wise Receipts Chart
                  </h2>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartRows} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="fertilizer" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => `${Number(value ?? 0).toFixed(2)} MT`} />
                    <Bar dataKey="Receipts" fill="#b68a18" radius={[4, 4, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <GroupedTotalsTable
              title="Dealer-wise Receipts Total"
              firstColumn="Dealer"
              secondColumn="Fertilizers"
              tone="sky"
              rows={dealerSummary.map((item) => ({
                name: titleCase(item.dealer),
                receipts: item.receipts,
                entries: item.entries,
                count: item.fertilizerCount,
              }))}
            />
            <GroupedTotalsTable
              title="Wholesaler-wise Receipts Total"
              firstColumn="Wholesaler"
              secondColumn="Dealers"
              tone="violet"
              rows={wholesalerSummary.map((item) => ({
                name: item.wholesaler,
                receipts: item.receipts,
                entries: item.entries,
                count: item.dealerCount,
              }))}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Fertilizer-wise Receipts Summary</h2>
            </div>
            <div className="table-scroll">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Fertilizer</th>
                    <th className="px-3 py-2 text-right">Receipts (MT)</th>
                    <th className="px-3 py-2 text-right">Dealers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleSummary.map((item) => (
                    <tr key={item.fertilizer}>
                      <td className="px-3 py-2 font-black text-slate-950 dark:text-white">{item.fertilizer}</td>
                      <td className="px-3 py-2 text-right font-black text-emerald-700 dark:text-emerald-300">{item.receipts.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{item.dealers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Fertilizer Receipts</h2>
            </div>
            <div className="table-scroll" {...receiptRows.containerProps}>
              <table className="w-full min-w-[980px] text-xs">
                <thead className="bg-slate-900 text-[10px] uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-2.5 py-2 text-left">S.No</th>
                    <th className="px-2.5 py-2 text-left">Dealer</th>
                    <th className="px-2.5 py-2 text-left">Fertilizer</th>
                    <th className="px-2.5 py-2 text-right">Receipts (MT)</th>
                    <th className="px-2.5 py-2 text-left">Wholesaler</th>
                    <th className="px-2.5 py-2 text-left">Invoice No.</th>
                    <th className="px-2.5 py-2 text-left">Invoice Date</th>
                    <th className="px-2.5 py-2 text-left">Updated</th>
                    {isAdminUser && <th className="px-2.5 py-2 text-center">Delete</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {receiptRows.paddingTop > 0 && (
                    <tr aria-hidden="true">
                      <td colSpan={receiptColumnCount} className="p-0" style={{ height: receiptRows.paddingTop }} />
                    </tr>
                  )}
                  {receiptRows.virtualRows.map(({ row: item, index }) => (
                    <tr key={item.id} className="hover:bg-emerald-50/50 dark:hover:bg-slate-800/60">
                      <td className="px-2.5 py-1.5 font-bold">{index + 1}</td>
                      <td className="max-w-[260px] px-2.5 py-1.5 font-black leading-tight text-slate-950 dark:text-white">{titleCase(item.dealer_name || 'Unknown dealer')}</td>
                      <td className="px-2.5 py-1.5 font-semibold">{item.fertilizer_type}</td>
                      <td className="px-2.5 py-1.5 text-right font-black text-emerald-700 dark:text-emerald-300">
                        {Number(item.quantity_mts || 0).toFixed(2)}
                      </td>
                      <td className="max-w-[220px] truncate px-2.5 py-1.5">{item.wholesaler_name || '-'}</td>
                      <td className="px-2.5 py-1.5">{item.invoice_number || '-'}</td>
                      <td className="px-2.5 py-1.5">{formatDate(item.invoice_date)}</td>
                      <td className="px-2.5 py-1.5">{formatDate(item.last_updated)}</td>
                      {isAdminUser && (
                        <td className="px-2.5 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            aria-label="Delete fertilizer receipt"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {receiptRows.paddingBottom > 0 && (
                    <tr aria-hidden="true">
                      <td colSpan={receiptColumnCount} className="p-0" style={{ height: receiptRows.paddingBottom }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

function GroupedTotalsTable({
  title,
  firstColumn,
  secondColumn,
  tone = 'slate',
  rows,
}: {
  title: string;
  firstColumn: string;
  secondColumn: string;
  tone?: 'sky' | 'violet' | 'slate';
  rows: { name: string; receipts: number; entries: number; count: number }[];
}) {
  const toneClass = {
    sky: 'border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/20',
    violet: 'border-violet-200 bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/20',
    slate: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900',
  }[tone];

  return (
    <section className={`overflow-hidden rounded-xl border shadow-sm ${toneClass}`}>
      <div className="border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-black text-slate-950 dark:text-white">{title}</h2>
      </div>
      <div className="table-scroll">
        <table className="w-full min-w-[440px] text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-left">{firstColumn}</th>
              <th className="px-3 py-2 text-right">Receipts (MT)</th>
              <th className="px-3 py-2 text-right">{secondColumn}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length > 0 ? (
              rows.map((item) => (
                <tr key={item.name}>
                  <td className="px-3 py-2 font-black text-slate-950 dark:text-white">{item.name}</td>
                  <td className="px-3 py-2 text-right font-black text-slate-700 dark:text-slate-200">{item.receipts.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{item.count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-sm font-semibold text-slate-500">
                  No matching receipts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function downloadWorkbook(
  rows: ExcelRow[],
  fileName: string,
  sheetName: string,
  totalColumns: string[],
  summaryRows: Array<[string, string | number]>
) {
  if (!rows.length) return;
  const workbook = XLSX.utils.book_new();
  appendSheetWithTotals(workbook, sheetName, rows, totalColumns);
  appendSummarySheet(workbook, `${sheetName} Summary`, [
    ...summaryRows,
    ...totalColumns.map((column): [string, number] => [`Total ${column}`, totalValue(rows, column)]),
    ['Generated On', new Date().toLocaleString('en-IN')],
  ]);
  XLSX.writeFile(workbook, fileName);
}
