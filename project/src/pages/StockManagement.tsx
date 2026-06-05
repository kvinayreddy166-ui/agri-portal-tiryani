import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Dealer, DealerStockAllocation } from '../types/database';
import { FERTILIZER_TYPES } from '../lib/constants';
import { syncFertilizerStockTable } from '../lib/fertilizerStock';
import { upsertDealerStockAllocation } from '../lib/dealerStockAllocation';

const fertilizers = [...FERTILIZER_TYPES];

export function StockManagement() {
  const { isAdminUser } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [stock, setStock] = useState<DealerStockAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    dealer_id: '',
    fertilizer_type: 'Urea',
    quantity_mts: 0,
  });

  useEffect(() => {
    fetchData();
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
          dealer_location: dealer?.location || '',
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
      fetchData();
    } catch (error) {
      console.error('Error adding dealer-wise stock:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(
        `Failed to add dealer-wise stock: ${message}\n\nIf this mentions permission or policy, run the latest Supabase migration (stock inventory & dealer login).`
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this dealer-wise stock entry?')) return;

    try {
      const { error } = await supabase
        .from('dealer_stock_allocation')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await syncFertilizerStockTable();
      fetchData();
    } catch (error) {
      console.error('Error deleting dealer-wise stock:', error);
      alert('Failed to delete stock entry.');
    }
  };

  const filteredStock = stock.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      (item.dealer_name || '').toLowerCase().includes(search) ||
      (item.dealer_location || '').toLowerCase().includes(search) ||
      item.fertilizer_type.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title">Fertilizer Tracking</h1>
          <p className="page-subtitle">Dealer load entries and current fertilizer balance.</p>
        </div>
        {isAdminUser && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            Add Manual Balance
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
            placeholder="Search dealer, location, or fertilizer"
          />
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Showing {filteredStock.length} of {stock.length} dealer-wise entries
        </p>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Add Dealer Stock</h2>
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
                      {dealer.dealer_name} - {dealer.location}
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
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Quantity (MTS)</label>
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
          <p className="font-semibold text-slate-600 dark:text-slate-300">No dealer-wise stock entries found.</p>
        </div>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {fertilizers.map((fertilizer) => {
            const items = filteredStock.filter((item) => item.fertilizer_type === fertilizer);
            if (items.length === 0) return null;
            const total = items.reduce((sum, item) => sum + Number(item.quantity_mts || 0), 0);
            return (
              <article key={fertilizer} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{fertilizer}</p>
                    <p className="text-2xl font-black text-slate-950 dark:text-white">{total.toFixed(2)} MTS</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    {items.length} dealers
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.dealer_name}</p>
                          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{item.dealer_location || '-'}</p>
                        </div>
                        <span className="shrink-0 text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {Number(item.quantity_mts || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <p><span className="font-bold text-slate-500">Wholesaler:</span> {item.wholesaler_name || '-'}</p>
                        <p><span className="font-bold text-slate-500">Invoice:</span> {item.invoice_number || '-'}</p>
                        <p><span className="font-bold text-slate-500">Date:</span> {item.invoice_date ? new Date(item.invoice_date).toLocaleDateString() : '-'}</p>
                        <p><span className="font-bold text-slate-500">Updated:</span> {new Date(item.last_updated).toLocaleDateString()}</p>
                      </div>
                      {isAdminUser && (
                        <div className="mt-2 flex gap-1">
                          <button onClick={() => handleDelete(item.id)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" aria-label="Delete stock">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
