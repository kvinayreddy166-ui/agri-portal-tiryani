import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Package, Plus, Search, Trash2, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Dealer, DealerStockAllocation } from '../types/database';
import { FERTILIZER_TYPES } from '../lib/constants';
import { syncFertilizerStockTable } from '../lib/fertilizerStock';
import { upsertDealerStockAllocation } from '../lib/dealerStockAllocation';

const fertilizers = [...FERTILIZER_TYPES];

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
  const { isAdminUser } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [stock, setStock] = useState<DealerStockAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [financialYear, setFinancialYear] = useState(currentFinancialYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    dealer_id: '',
    fertilizer_type: 'Urea',
    quantity_mts: 0,
  });

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealersResult, stockResult] = await Promise.all([
        supabase.from('dealers').select('*').order('dealer_name'),
        supabase
          .from('dealer_stock_allocation')
          .select('*')
          .order('last_updated', { ascending: false }),
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

  const filteredStock = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return stock.filter((item) => (
      dateInFinancialYear(item.invoice_date || item.last_updated, financialYear) &&
      ((item.dealer_name || '').toLowerCase().includes(search) ||
      item.fertilizer_type.toLowerCase().includes(search) ||
      (item.invoice_number || '').toLowerCase().includes(search) ||
      (item.wholesaler_name || '').toLowerCase().includes(search))
    ));
  }, [financialYear, searchTerm, stock]);

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
  const chartRows = visibleSummary.map((item) => ({
    fertilizer: item.fertilizer,
    Receipts: Number(item.receipts.toFixed(2)),
  }));

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title">Fertilizer Tracking</h1>
          <p className="page-subtitle">Fertilizer receipts, dealer load entries, and current balance.</p>
        </div>
        {isAdminUser && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            Add Manual Receipt
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
              {financialYearOptions().map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing {filteredStock.length} of {stock.length} receipt entries
          </p>
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
          <section className="grid gap-3 md:grid-cols-[16rem_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Receipts</p>
              <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{totalReceipts.toFixed(2)} MT</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{visibleSummary.length} fertilizer types</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Fertilizer-wise Receipts Chart
              </h2>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="fertilizer" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => `${Number(value ?? 0).toFixed(2)} MT`} />
                    <Bar dataKey="Receipts" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Fertilizer-wise Receipts Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Fertilizer</th>
                    <th className="px-3 py-2 text-right">Receipts (MT)</th>
                    <th className="px-3 py-2 text-right">Dealers</th>
                    <th className="px-3 py-2 text-right">Entries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleSummary.map((item) => (
                    <tr key={item.fertilizer}>
                      <td className="px-3 py-2 font-black text-slate-950 dark:text-white">{item.fertilizer}</td>
                      <td className="px-3 py-2 text-right font-black text-emerald-700 dark:text-emerald-300">{item.receipts.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{item.dealers}</td>
                      <td className="px-3 py-2 text-right">{item.entries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Fertilizer Receipts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="bg-slate-900 text-xs uppercase text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">S.No</th>
                    <th className="px-3 py-2 text-left">Dealer</th>
                    <th className="px-3 py-2 text-left">Fertilizer</th>
                    <th className="px-3 py-2 text-right">Receipts (MT)</th>
                    <th className="px-3 py-2 text-right">Bags</th>
                    <th className="px-3 py-2 text-left">Wholesaler</th>
                    <th className="px-3 py-2 text-left">Invoice</th>
                    <th className="px-3 py-2 text-left">Invoice Date</th>
                    <th className="px-3 py-2 text-left">Updated</th>
                    {isAdminUser && <th className="px-3 py-2 text-center">Delete</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStock.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-3 py-2 font-bold">{index + 1}</td>
                      <td className="px-3 py-2 font-black text-slate-950 dark:text-white">{titleCase(item.dealer_name || 'Unknown dealer')}</td>
                      <td className="px-3 py-2 font-semibold">{item.fertilizer_type}</td>
                      <td className="px-3 py-2 text-right font-black text-emerald-700 dark:text-emerald-300">
                        {Number(item.quantity_mts || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">{Number(item.quantity_bags || 0).toFixed(0)}</td>
                      <td className="px-3 py-2">{item.wholesaler_name || '-'}</td>
                      <td className="px-3 py-2">{item.invoice_number || '-'}</td>
                      <td className="px-3 py-2">{formatDate(item.invoice_date)}</td>
                      <td className="px-3 py-2">{formatDate(item.last_updated)}</td>
                      {isAdminUser && (
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            aria-label="Delete fertilizer receipt"
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
        </>
      )}
    </div>
  );
}
