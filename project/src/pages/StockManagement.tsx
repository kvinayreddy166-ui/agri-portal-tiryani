import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Box, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FertilizerStock } from '../types/database';

export function StockManagement() {
  const { isAdminUser } = useAuth();
  const [stock, setStock] = useState<FertilizerStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    fertilizer_type: '',
    quantity_available: 0,
    unit: 'MTS',
  });

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const { data, error } = await supabase
        .from('fertilizer_stock')
        .select('*')
        .order('fertilizer_type');

      if (error) throw error;
      setStock(data || []);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('fertilizer_stock')
        .insert([formData]);

      if (error) throw error;
      setShowAddForm(false);
      setFormData({ fertilizer_type: '', quantity_available: 0, unit: 'MTS' });
      fetchStock();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock item');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const item = stock.find(s => s.id === id);
      if (!item) return;

      const { error } = await supabase
        .from('fertilizer_stock')
        .update({
          fertilizer_type: item.fertilizer_type,
          quantity_available: item.quantity_available,
          unit: item.unit,
        })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchStock();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return;

    try {
      const { error } = await supabase
        .from('fertilizer_stock')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchStock();
    } catch (error) {
      console.error('Error deleting stock:', error);
      alert('Failed to delete stock item');
    }
  };

  const updateLocalStock = (id: string, field: string, value: string | number) => {
    setStock(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600">Manage fertilizer inventory and availability</p>
        </div>
        {isAdminUser && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Stock Item
          </button>
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Stock Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer Type</label>
                <input
                  type="text"
                  value={formData.fertilizer_type}
                  onChange={(e) => setFormData({ ...formData, fertilizer_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Urea"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available</label>
                <input
                  type="number"
                  value={formData.quantity_available}
                  onChange={(e) => setFormData({ ...formData, quantity_available: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="MTS">Metric Tons (MTS)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stock.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-6">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                <Box className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="p-4">
              {editingId === item.id && isAdminUser ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={item.fertilizer_type}
                    onChange={(e) => updateLocalStock(item.id, 'fertilizer_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={item.quantity_available}
                      onChange={(e) => updateLocalStock(item.id, 'quantity_available', parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateLocalStock(item.id, 'unit', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="MTS">MTS</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(item.id)}
                      className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{item.fertilizer_type}</h3>
                  <p className="text-3xl font-bold text-amber-600 text-center">{item.quantity_available.toLocaleString()}</p>
                  <p className="text-gray-500 text-center text-sm">MTS</p>
                  {isAdminUser && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-emerald-600 hover:bg-emerald-50 py-2 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-400 text-center">
                Last updated: {new Date(item.last_updated).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {stock.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Box className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No stock items found</p>
        </div>
      )}
    </div>
  );
}
