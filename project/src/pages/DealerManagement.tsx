import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Dealer } from '../types/database';

export function DealerManagement() {
  const { isAdminUser } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    dealer_name: '',
    ifms_id: '',
    phone_number: '',
    license_number: '',
    issue_date: '',
    expiry_date: '',
    location: '',
  });

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .order('dealer_name');

      if (error) throw error;
      setDealers(data || []);
    } catch (error) {
      console.error('Error fetching dealers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('dealers')
        .insert([formData]);

      if (error) throw error;
      setShowAddForm(false);
      setFormData({
        dealer_name: '',
        ifms_id: '',
        phone_number: '',
        license_number: '',
        issue_date: '',
        expiry_date: '',
        location: '',
      });
      fetchDealers();
    } catch (error) {
      console.error('Error adding dealer:', error);
      alert('Failed to add dealer');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const dealer = dealers.find(d => d.id === id);
      if (!dealer) return;

      const { error } = await supabase
        .from('dealers')
        .update(dealer)
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchDealers();
    } catch (error) {
      console.error('Error updating dealer:', error);
      alert('Failed to update dealer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dealer?')) return;

    try {
      const { error } = await supabase
        .from('dealers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDealers();
    } catch (error) {
      console.error('Error deleting dealer:', error);
      alert('Failed to delete dealer');
    }
  };

  const updateLocalDealer = (id: string, field: string, value: string) => {
    setDealers(prev => prev.map(dealer =>
      dealer.id === id ? { ...dealer, [field]: value } : dealer
    ));
  };

  const filteredDealers = dealers.filter(dealer =>
    dealer.dealer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.license_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Dealer Management</h1>
          <p className="text-gray-600">Manage registered dealers and their licenses</p>
        </div>
        {isAdminUser && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Dealer
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search dealers by name, location, or license number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
        />
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Dealer</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dealer Name</label>
                <input
                  type="text"
                  value={formData.dealer_name}
                  onChange={(e) => setFormData({ ...formData, dealer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFMS ID</label>
                <input
                  type="text"
                  value={formData.ifms_id}
                  onChange={(e) => setFormData({ ...formData, ifms_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Add Dealer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dealers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dealer Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IFMS ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">License No.</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Valid Until</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                {isAdminUser && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDealers.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-gray-50">
                  {editingId === dealer.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={dealer.dealer_name}
                          onChange={(e) => updateLocalDealer(dealer.id, 'dealer_name', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={dealer.ifms_id}
                          onChange={(e) => updateLocalDealer(dealer.id, 'ifms_id', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="tel"
                          value={dealer.phone_number}
                          onChange={(e) => updateLocalDealer(dealer.id, 'phone_number', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={dealer.license_number}
                          onChange={(e) => updateLocalDealer(dealer.id, 'license_number', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={dealer.expiry_date}
                          onChange={(e) => updateLocalDealer(dealer.id, 'expiry_date', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={dealer.location}
                          onChange={(e) => updateLocalDealer(dealer.id, 'location', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUpdate(dealer.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{dealer.dealer_name}</td>
                      <td className="px-4 py-3 text-gray-600">{dealer.ifms_id}</td>
                      <td className="px-4 py-3 text-gray-600">{dealer.phone_number}</td>
                      <td className="px-4 py-3 text-gray-600">{dealer.license_number}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          new Date(dealer.expiry_date) > new Date()
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {new Date(dealer.expiry_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{dealer.location}</td>
                      {isAdminUser && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingId(dealer.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(dealer.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDealers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No dealers found</p>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredDealers.length} of {dealers.length} dealers
      </div>
    </div>
  );
}
