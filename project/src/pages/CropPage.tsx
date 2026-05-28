import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Leaf, FileText, MapPin, Save, Upload } from 'lucide-react';
import { FileActionButtons } from '../components/ui/FileActionButtons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { uploadPortalFile } from '../lib/uploadFile';
import { Crop, CropData } from '../types/database';

interface CropPageProps {
  cropType: string;
}

export function CropPage({ cropType }: CropPageProps) {
  const { isAdminUser } = useAuth();
  const [crop, setCrop] = useState<Crop | null>(null);
  const [cropData, setCropData] = useState<CropData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCrop, setEditingCrop] = useState(false);
  const [showAddDataForm, setShowAddDataForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newData, setNewData] = useState({
    title: '',
    description: '',
    file_url: '',
    file_type: 'document',
  });

  const cropImages: Record<string, string> = {
    cotton: '/images/cotton.jpg',
    paddy: '/images/paddy.jpg',
    maize: '/images/maize.jpg',
    pulses: '/images/pulses.jpg',
    oilseeds: '/images/oilseeds.jpg',
  };

  useEffect(() => {
    fetchCropData();
  }, [cropType]);

  const fetchCropData = async () => {
    try {
      const cropName = cropType.charAt(0).toUpperCase() + cropType.slice(1);
      const { data: cropResult } = await supabase
        .from('crops')
        .select('*')
        .eq('crop_name', cropName)
        .maybeSingle();

      if (cropResult) {
        setCrop(cropResult);
        const { data: dataResult } = await supabase
          .from('crop_data')
          .select('*')
          .eq('crop_id', cropResult.id)
          .order('created_at', { ascending: false });
        setCropData(dataResult || []);
      }
    } catch (error) {
      console.error('Error fetching crop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCrop = async () => {
    if (!crop) return;
    try {
      const { error } = await supabase
        .from('crops')
        .update({
          acreage: crop.acreage,
          description: crop.description,
        })
        .eq('id', crop.id);

      if (error) throw error;
      setEditingCrop(false);
    } catch (error) {
      console.error('Error updating crop:', error);
      alert('Failed to update crop information');
    }
  };

  const handleAddCropData = async () => {
    if (!crop) return;

    if (!newData.title.trim()) {
      alert('Please enter a document title');
      return;
    }

    if (!selectedFile && !newData.file_url.trim()) {
      alert('Please upload a file or enter a file URL');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = newData.file_url.trim();
      let fileType = newData.file_type;

      if (selectedFile) {
        const uploaded = await uploadPortalFile(selectedFile, `crops/${cropType}`);
        fileUrl = uploaded.publicUrl;
        fileType = uploaded.fileType;
      }

      const { error } = await supabase
        .from('crop_data')
        .insert([{
          title: newData.title.trim(),
          description: newData.description.trim(),
          file_url: fileUrl,
          file_type: fileType,
          crop_id: crop.id,
          created_by: 'admin',
        }]);

      if (error) throw error;
      setShowAddDataForm(false);
      setSelectedFile(null);
      setNewData({ title: '', description: '', file_url: '', file_type: 'document' });
      fetchCropData();
    } catch (error) {
      console.error('Error adding crop data:', error);
      const message = error instanceof Error ? error.message : 'Failed to add document';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCropData = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('crop_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCropData();
    } catch (error) {
      console.error('Error deleting crop data:', error);
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="text-center py-12">
        <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Crop not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Crop Header */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={cropImages[cropType] || cropImages.cotton}
            alt={crop.crop_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-emerald-800/70"></div>
        </div>
        <div className="relative p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{crop.crop_name}</h1>
              <p className="text-emerald-200">Cultivation in Tiryani Mandal</p>
            </div>
          </div>

          {editingCrop && isAdminUser ? (
            <div className="bg-white/10 rounded-xl p-4 mt-6 max-w-lg">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-emerald-200 mb-1">Acreage</label>
                  <input
                    type="number"
                    value={crop.acreage}
                    onChange={(e) => setCrop({ ...crop, acreage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-emerald-200 mb-1">Description</label>
                  <textarea
                    value={crop.description}
                    onChange={(e) => setCrop({ ...crop, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:border-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateCrop}
                    className="flex items-center gap-1 px-4 py-2 bg-white text-emerald-700 rounded-lg font-medium"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    onClick={() => setEditingCrop(false)}
                    className="px-4 py-2 text-white border border-white/30 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-6 mt-6">
                <div className="bg-white/10 px-4 py-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-emerald-300 inline mr-2" />
                  <span className="text-white font-semibold">{crop.acreage.toLocaleString()} acres</span>
                </div>
              </div>
              {crop.description && (
                <p className="mt-4 text-emerald-100 max-w-2xl">{crop.description}</p>
              )}
              {isAdminUser && (
                <button
                  onClick={() => setEditingCrop(true)}
                  className="mt-4 flex items-center gap-1 text-emerald-200 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" /> Edit Info
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Crop Data Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Documents & Guides
          </h2>
          {isAdminUser && (
            <button
              onClick={() => setShowAddDataForm(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Document
            </button>
          )}
        </div>

        {/* Add Data Form Modal */}
        {showAddDataForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Document</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newData.title}
                    onChange={(e) => setNewData({ ...newData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Document title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newData.description}
                    onChange={(e) => setNewData({ ...newData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File URL (optional)</label>
                  <input
                    type="url"
                    value={newData.file_url}
                    onChange={(e) => setNewData({ ...newData, file_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Upload file</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Upload className="mb-2 h-6 w-6 text-emerald-700" />
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedFile ? selectedFile.name : 'Choose PDF, Word, Excel, or image'}
                    </p>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddDataForm(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCropData}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                >
                  {uploading ? 'Uploading...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {cropData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cropData.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="bg-gray-200 px-2 py-1 rounded">{item.file_type}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {isAdminUser && (
                    <button
                      onClick={() => handleDeleteCropData(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {item.file_url && (
                  <div className="mt-3 flex justify-end border-t border-gray-200 pt-3">
                    <FileActionButtons fileUrl={item.file_url} size="sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No documents available for this crop</p>
          </div>
        )}
      </div>
    </div>
  );
}
