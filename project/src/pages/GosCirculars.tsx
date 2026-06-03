import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { uploadPortalFile } from '../lib/uploadFile';
import { GosCircular } from '../types/database';
import { FileActionButtons } from '../components/ui/FileActionButtons';
import { FileTypeIcon } from '../components/ui/FileTypeIcon';

const emptyForm = {
  title: '',
  description: '',
  issued_date: '',
};

export function GosCirculars() {
  const { isAdminUser, user } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<GosCircular[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDoc, setNewDoc] = useState(emptyForm);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('gos_circulars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching GOs and circulars:', error);
      setFetchError(
        error instanceof Error
          ? error.message
          : 'Unable to load GOs and circulars.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewDoc(emptyForm);
    setSelectedFile(null);
    setShowAddForm(false);
  };

  const handleAdd = async () => {
    if (!newDoc.title.trim()) {
      alert(t('Please enter a title', 'దయచేసి శీర్షిక నమోదు చేయండి'));
      return;
    }

    if (!selectedFile) {
      alert(t('Please select a file to upload', 'దయచేసి అప్లోడ్ చేయడానికి ఫైల్ ఎంచుకోండి'));
      return;
    }

    setUploading(true);
    try {
      const { publicUrl, fileType } = await uploadPortalFile(
        selectedFile,
        'gos-circulars'
      );

      const { error } = await supabase.from('gos_circulars').insert([
        {
          title: newDoc.title.trim(),
          description: newDoc.description.trim(),
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_type: fileType,
          issued_date: newDoc.issued_date || null,
          created_by: user?.email || 'admin',
        },
      ]);

      if (error) throw error;
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error adding GO/circular:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to upload document.';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Delete this document?', 'ఈ పత్రాన్ని తొలగించాలా?'))) return;

    try {
      const { error } = await supabase.from('gos_circulars').delete().eq('id', id);
      if (error) throw error;
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(t('Failed to delete document', 'పత్రాన్ని తొలగించడం విఫలమైంది'));
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
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            {t('Official documents', 'అధికారిక పత్రాలు')}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white">
            {t('GOs & Circulars', 'జీ.ఓలు & సర్క్యులర్లు')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            {t(
              'View government orders and circulars shared by the agriculture office.',
              'వ్యవసాయ కార్యాలయం పంచిన ప్రభుత్వ ఆదేశాలు మరియు సర్క్యులర్లను చూడండి.'
            )}
          </p>
        </div>
        {isAdminUser && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            {t('Upload Document', 'పత్రం అప్లోడ్')}
          </button>
        )}
      </div>

      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-gray-950">
                {t('Upload GO / Circular', 'జీ.ఓ / సర్క్యులర్ అప్లోడ్')}
              </h2>
              <button onClick={resetForm} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  {t('Title', 'శీర్షిక')}
                </label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  {t('Description', 'వివరణ')}
                </label>
                <textarea
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  {t('Issue date', 'జారీ తేదీ')}
                </label>
                <input
                  type="date"
                  value={newDoc.issued_date}
                  onChange={(e) => setNewDoc({ ...newDoc, issued_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <Upload className="mb-2 h-6 w-6 text-emerald-700" />
                <p className="text-sm font-bold text-gray-900">
                  {selectedFile
                    ? selectedFile.name
                    : t('Choose PDF, Word, Excel, or image', 'PDF, Word, Excel లేదా చిత్రం ఎంచుకోండి')}
                </p>
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={resetForm}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                {t('Cancel', 'రద్దు')}
              </button>
              <button
                onClick={handleAdd}
                disabled={uploading}
                className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {uploading ? t('Uploading...', 'అప్లోడ్ అవుతోంది...') : t('Save', 'సేవ్')}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {documents.length > 0 ? (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 dark:divide-slate-700 dark:border-slate-700">
            {documents.map((doc) => (
              <article
                key={doc.id}
                className="group flex items-center gap-2 px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-slate-800/50"
              >
                <FileTypeIcon fileName={doc.file_name || doc.title} fileType={doc.file_type} fileUrl={doc.file_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-black text-gray-950 dark:text-white">{doc.title}</h3>
                    {isAdminUser && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="rounded-md p-1 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                        aria-label="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {doc.issued_date && (
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {t('Issued', 'జారీ')}: {new Date(doc.issued_date).toLocaleDateString()}
                    </p>
                  )}
                  <div className="mt-1 flex justify-end">
                    <FileActionButtons fileUrl={doc.file_url} fileName={doc.title} fileType={doc.file_type} size="sm" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-semibold text-gray-600">
              {t('No GOs or circulars uploaded yet', 'ఇంకా జీ.ఓలు లేదా సర్క్యులర్లు అప్లోడ్ కాలేదు')}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
