import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Trash2, Download, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ExcelUpload } from '../types/database';

export function ExcelUploads() {
  const { isAdminUser, user } = useAuth();
  const [uploads, setUploads] = useState<ExcelUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('excel_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}_${cleanName}`;
      const filePath = `office-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('excel_uploads')
        .insert([{
          file_name: file.name,
          file_url: publicUrl,
          upload_type: 'data',
          created_by: user?.email || 'unknown',
        }]);

      if (dbError) throw dbError;

      fetchUploads();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please make sure the Supabase uploads bucket and storage policies are applied.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this upload?')) return;

    try {
      const { error } = await supabase
        .from('excel_uploads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchUploads();
    } catch (error) {
      console.error('Error deleting upload:', error);
      alert('Failed to delete upload');
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">File Uploads</h1>
        <p className="text-gray-600">Upload PDF, Word, and Excel files for users to download</p>
      </div>

      {/* Upload Area */}
      {isAdminUser && (
        <div
          className={`
            bg-white rounded-xl border-2 border-dashed p-8 text-center transition-colors
            ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
              ${dragActive ? 'bg-emerald-100' : 'bg-gray-100'}
            `}>
              <Upload className={`w-8 h-8 ${dragActive ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              {uploading ? 'Uploading...' : 'Drag and drop PDF, Word, or Excel files here'}
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
                onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
                disabled={uploading}
              />
              <span className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${uploading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }
              `}>
                <Upload className="w-5 h-5" />
                {uploading ? 'Uploading...' : 'Select File'}
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-4">Supported formats: PDF, DOC, DOCX, XLSX, XLS, CSV</p>
          </div>
        </div>
      )}

      {/* Uploads List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Uploaded Files</h2>
        </div>
        {uploads.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {uploads.map((upload) => (
              <div key={upload.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 group">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{upload.file_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(upload.created_at).toLocaleString()}
                    <span className="mx-2">|</span>
                    by {upload.created_by}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={upload.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  {isAdminUser && (
                    <button
                      onClick={() => handleDelete(upload.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No files uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
