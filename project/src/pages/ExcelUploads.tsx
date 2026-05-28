import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ExcelUpload } from '../types/database';
import { PageHeader } from '../components/ui/PageHeader';
import { DocumentCard } from '../components/ui/DocumentCard';

export function ExcelUploads() {
  const { isAdminUser, user } = useAuth();
  const { t } = useLanguage();
  const [uploads, setUploads] = useState<ExcelUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('excel_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setFetchError(
        error instanceof Error
          ? error.message
          : 'Unable to load uploaded files. Please sign in again and retry.'
      );
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
        .upload(filePath, file, { upsert: true });

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
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to upload file. Please make sure the Supabase uploads bucket and storage policies are applied.';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this upload?')) return;
    try {
      const { error } = await supabase.from('excel_uploads').delete().eq('id', id);
      if (error) throw error;
      fetchUploads();
    } catch (error) {
      console.error('Error deleting upload:', error);
      alert('Failed to delete upload');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('Office files', 'కార్యాలయ ఫైళ్లు')}
        title={isAdminUser ? t('File Uploads', 'ఫైల్ అప్లోడ్లు') : t('Office Files', 'కార్యాలయ ఫైళ్లు')}
        description={
          isAdminUser
            ? t('Upload PDF, Word, and Excel files for users to view and download.', 'వినియోగదారులు చూడటానికి మరియు డౌన్లోడ్ చేసుకోవడానికి PDF, Word, Excel ఫైళ్లను అప్లోడ్ చేయండి.')
            : t('View and download files shared by the agriculture office.', 'వ్యవసాయ కార్యాలయం పంచిన ఫైళ్లను చూడండి మరియు డౌన్లోడ్ చేసుకోండి.')
        }
      />

      {isAdminUser && (
        <div
          className={`portal-card border-2 border-dashed p-8 text-center transition ${
            dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className={`mx-auto mb-4 h-10 w-10 ${dragActive ? 'text-emerald-600' : 'text-slate-400'}`} />
          <p className="font-semibold text-slate-800">
            {uploading ? t('Uploading...', 'అప్లోడ్ అవుతోంది...') : t('Drag and drop files here', 'ఫైళ్లను ఇక్కడ డ్రాగ్ చేయండి')}
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
              onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
              disabled={uploading}
            />
            {t('Select File', 'ఫైల్ ఎంచుకోండి')}
          </label>
        </div>
      )}

      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{fetchError}</div>
      )}

      {uploads.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {uploads.map((upload) => (
            <DocumentCard
              key={upload.id}
              title={upload.file_name}
              description={`${t('Uploaded by', 'అప్లోడ్')}: ${upload.created_by}`}
              fileUrl={upload.file_url}
              fileType="file"
              meta={new Date(upload.created_at).toLocaleString()}
              showDelete={isAdminUser}
              onDelete={() => handleDelete(upload.id)}
            />
          ))}
        </div>
      ) : (
        <div className="portal-card flex flex-col items-center p-16 text-center">
          <FileSpreadsheet className="mb-4 h-14 w-14 text-slate-300" />
          <p className="text-slate-600">{t('No files uploaded yet', 'ఇంకా ఫైళ్లు అప్లోడ్ కాలేదు')}</p>
        </div>
      )}
    </div>
  );
}
