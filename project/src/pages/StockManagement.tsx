import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Package, Plus, Save, Search, Trash2, TrendingUp, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Dealer, DealerStockAllocation } from '../types/database';

const fertilizers = ['Urea', 'DAP', 'Potash', 'SSP', 'Complex'];

export function StockManagement() {
  const { isAdminUser } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [stock, setStock] = useState<DealerStockAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
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
      const { error } = await supabase
        .from('dealer_stock_allocation')
        .insert([{
          dealer_id: formData.dealer_id,
          fertilizer_type: formData.fertilizer_type,
          quantity_mts: formData.quantity_mts,
          last_updated: new Date().toISOString(),
        }]);

      if (error) throw error;
      setShowAddForm(false);
      setFormData({ dealer_id: '', fertilizer_type: 'Urea', quantity_mts: 0 });
      fetchData();
    } catch (error) {
      console.error('Error adding dealer-wise stock:', error);
      alert('Failed to add dealer-wise stock. Please check database permissions.');
    }
  };

  const handleUpdate = async (id: string) => {
    const item = stock.find((row) => row.id === id);
    if (!item) return;

    try {
      const { error } = await supabase
        .from('dealer_stock_allocation')
        .update({
          fertilizer_type: item.fertilizer_type,
          quantity_mts: item.quantity_mts,
          last_updated: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('Error updating dealer-wise stock:', error);
      alert('Failed to update dealer-wise stock.');
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
      fetchData();
    } catch (error) {
      console.error('Error deleting dealer-wise stock:', error);
      alert('Failed to delete stock entry.');
    }
  };

  const updateLocalStock = (id: string, field: keyof DealerStockAllocation, value: string | number) => {
    setStock((currentStock) =>
      currentStock.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const filteredStock = stock.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      (item.dealer_name || '').toLowerCase().includes(search) ||
      (item.dealer_location || '').toLowerCase().includes(search) ||
      item.fertilizer_type.toLowerCase().includes(search)
    );
  });

  const totals = useMemo(
    () =>
      fertilizers.reduce((result, fertilizer) => {
        result[fertilizer] = stock
          .filter((item) => item.fertilizer_type === fertilizer)
          .reduce((sum, item) => sum + Number(item.quantity_mts || 0), 0);
        return result;
      }, {} as Record<string, number>),
    [stock]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-950">Stock Management</h1>
          <p className="mt-1 text-gray-600">Enter and manage fertilizer stock dealer-wise in MTS.</p>
        </div>
        {isAdminUser && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            Add Dealer Stock
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {fertilizers.map((fertilizer) => (
          <div key={fertilizer} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 w-fit rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <Package className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">{fertilizer}</p>
            <p className="mt-1 text-3xl font-black text-gray-950">{totals[fertilizer].toFixed(2)}</p>
            <p className="text-xs font-semibold text-gray-400">MTS total</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Search dealer, location, or fertilizer"
          />
        </div>
        <p className="text-sm font-medium text-gray-500">
          Showing {filteredStock.length} of {stock.length} dealer-wise entries
        </p>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-950">Add Dealer Stock</h2>
              <button onClick={() => setShowAddForm(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">Dealer</label>
                <select
                  value={formData.dealer_id}
                  onChange={(e) => setFormData({ ...formData, dealer_id: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                <label className="mb-1 block text-sm font-bold text-gray-700">Fertilizer</label>
                <select
                  value={formData.fertilizer_type}
                  onChange={(e) => setFormData({ ...formData, fertilizer_type: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {fertilizers.map((fertilizer) => (
                    <option key={fertilizer} value={fertilizer}>{fertilizer}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">Quantity (MTS)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity_mts}
                  onChange={(e) => setFormData({ ...formData, quantity_mts: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-bold">Dealer</th>
                <th className="px-5 py-4 text-left text-sm font-bold">Location</th>
                <th className="px-5 py-4 text-left text-sm font-bold">Fertilizer</th>
                <th className="px-5 py-4 text-left text-sm font-bold">Quantity</th>
                <th className="px-5 py-4 text-left text-sm font-bold">Last Updated</th>
                {isAdminUser && <th className="px-5 py-4 text-left text-sm font-bold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStock.map((item) => (
                <tr key={item.id} className="transition hover:bg-emerald-50">
                  <td className="px-5 py-4 font-bold text-gray-950">{item.dealer_name}</td>
                  <td className="px-5 py-4 text-gray-600">{item.dealer_location || '-'}</td>
                  <td className="px-5 py-4">
                    {editingId === item.id && isAdminUser ? (
                      <select
                        value={item.fertilizer_type}
                        onChange={(e) => updateLocalStock(item.id, 'fertilizer_type', e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500"
                      >
                        {fertilizers.map((fertilizer) => (
                          <option key={fertilizer} value={fertilizer}>{fertilizer}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                        {item.fertilizer_type}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingId === item.id && isAdminUser ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity_mts}
                        onChange={(e) => updateLocalStock(item.id, 'quantity_mts', parseFloat(e.target.value) || 0)}
                        className="w-28 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500"
                      />
                    ) : (
                      <span className="inline-flex items-center gap-2 font-black text-gray-950">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        {Number(item.quantity_mts || 0).toFixed(2)} MTS
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(item.last_updated).toLocaleDateString()}
                  </td>
                  {isAdminUser && (
                    <td className="px-5 py-4">
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(item.id)}
                            className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-100"
                            aria-label="Save stock"
                          >
                            <Save className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                            aria-label="Cancel editing"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(item.id)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            aria-label="Edit stock"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            aria-label="Delete stock"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStock.length === 0 && (
          <div className="p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="font-semibold text-gray-600">No dealer-wise stock entries found.</p>
          </div>
        )}
      </section>
    </div>
  );
}
