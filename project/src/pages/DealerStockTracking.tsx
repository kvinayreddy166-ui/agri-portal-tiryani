import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Search, Save, X, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Dealer } from '../types/database';
import { IconButton } from '../components/ui/DesignSystem';

interface DealerStockAllocation {
  id: string;
  dealer_id: string;
  fertilizer_type: string;
  quantity_mts: number;
  last_updated: string;
  created_at: string;
  dealer_name?: string;
}

export function DealerStockTracking() {
  const { isAdminUser } = useAuth();
  const [dealers, setDealers] = useState<Pick<Dealer, 'id' | 'dealer_name'>[]>([]);
  const [stockData, setStockData] = useState<DealerStockAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    dealer_id: '',
    fertilizer_type: 'Urea',
    quantity_mts: 0,
  });

  const fertilizers = ['Urea', 'DAP', 'Potash', 'SSP', 'Complex'];

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('dealer-stock-tracking-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dealer_stock_allocation' }, () => {
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
      const [dealersRes, stockRes] = await Promise.all([
        supabase.from('dealers').select('id, dealer_name').order('dealer_name'),
        supabase
          .from('dealer_stock_allocation')
          .select('id, dealer_id, fertilizer_type, quantity_mts, last_updated, created_at')
          .order('created_at', { ascending: false }),
      ]);

      if (dealersRes.data) setDealers(dealersRes.data);
      if (stockRes.data) {
        const enrichedStock = stockRes.data.map(stock => ({
          ...stock,
          dealer_name: dealersRes.data?.find(d => d.id === stock.dealer_id)?.dealer_name || 'Unknown'
        }));
        setStockData(enrichedStock);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.dealer_id || formData.quantity_mts < 0) {
      alert('Please fill all fields correctly');
      return;
    }

    try {
      const { error } = await supabase
        .from('dealer_stock_allocation')
        .insert([formData]);

      if (error) throw error;
      setShowAddForm(false);
      setFormData({ dealer_id: '', fertilizer_type: 'Urea', quantity_mts: 0 });
      void fetchData();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock allocation');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const item = stockData.find(s => s.id === id);
      if (!item) return;

      const { error } = await supabase
        .from('dealer_stock_allocation')
        .update({
          quantity_mts: item.quantity_mts,
          last_updated: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      void fetchData();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock allocation?')) return;

    try {
      const { error } = await supabase
        .from('dealer_stock_allocation')
        .delete()
        .eq('id', id);

      if (error) throw error;
      void fetchData();
    } catch (error) {
      console.error('Error deleting stock:', error);
      alert('Failed to delete stock');
    }
  };

  const updateLocalStock = (id: string, field: string, value: string | number) => {
    setStockData(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const filteredStock = stockData.filter(item =>
    (item.dealer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    item.fertilizer_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStockByFertilizer = fertilizers.reduce((acc, fert) => {
    acc[fert] = stockData
      .filter(s => s.fertilizer_type === fert)
      .reduce((sum, s) => sum + s.quantity_mts, 0);
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Dealer Stock Tracking
        </h1>
        <p className="text-gray-600 mt-1">Manage fertilizer allocation to dealers (in MT)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {fertilizers.map((fert, idx) => {
          const colors = [
            'from-yellow-400 to-yellow-600',
            'from-blue-400 to-blue-600',
            'from-purple-400 to-purple-600',
            'from-orange-400 to-orange-600',
            'from-pink-400 to-pink-600'
          ];
          return (
            <div key={fert} className={`bg-gradient-to-br ${colors[idx]} rounded-xl p-4 text-white shadow-lg`}>
              <p className="text-sm opacity-90">{fert}</p>
              <p className="text-2xl font-bold mt-1">{totalStockByFertilizer[fert].toFixed(1)}</p>
              <p className="text-xs opacity-75 mt-1">MT Total</p>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search dealer or fertilizer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <IconButton label="Refresh stock tracking" tone="secondary" onClick={fetchData}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </IconButton>
          {isAdminUser && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Allocation
            </button>
          )}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Stock Allocation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dealer</label>
                <select
                  value={formData.dealer_id}
                  onChange={(e) => setFormData({ ...formData, dealer_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Dealer</option>
                  {dealers.map(dealer => (
                    <option key={dealer.id} value={dealer.id}>
                      {dealer.dealer_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fertilizer Type</label>
                <select
                  value={formData.fertilizer_type}
                  onChange={(e) => setFormData({ ...formData, fertilizer_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {fertilizers.map(fert => (
                    <option key={fert} value={fert}>{fert}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity (MT)</label>
                <input
                  type="number"
                  value={formData.quantity_mts}
                  onChange={(e) => setFormData({ ...formData, quantity_mts: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="table-scroll">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Dealer Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Fertilizer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Quantity (MT)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Last Updated</th>
                {isAdminUser && <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStock.map((item) => {
                const dealer = dealers.find(d => d.id === item.dealer_id);
                return (
                  <tr key={item.id} className="hover:bg-emerald-50 transition-colors">
                    {editingId === item.id && isAdminUser ? (
                      <>
                        <td className="px-6 py-4 text-sm font-medium">{dealer?.dealer_name}</td>
                        <td className="px-6 py-4">
                          <select
                            value={item.fertilizer_type}
                            onChange={(e) => updateLocalStock(item.id, 'fertilizer_type', e.target.value)}
                            className="px-3 py-1 border rounded text-sm"
                          >
                            {fertilizers.map(fert => (
                              <option key={fert} value={fert}>{fert}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.quantity_mts}
                            onChange={(e) => updateLocalStock(item.id, 'quantity_mts', parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-1 border rounded text-sm"
                            step="0.1"
                            min="0"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.last_updated).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(item.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium text-gray-900">{dealer?.dealer_name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                            {item.fertilizer_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-lg text-gray-900">{item.quantity_mts.toFixed(2)}</span>
                            <span className="text-sm text-gray-500">MT</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.last_updated).toLocaleDateString()}</td>
                        {isAdminUser && (
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingId(item.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStock.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No stock allocations found</p>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredStock.length} of {stockData.length} allocations
      </div>
    </div>
  );
}
