import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  ScrollText,
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            {t('Official documents', 'అధికారిక పత్రాలు')}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-950">
            {t('GOs & Circulars', 'జీ.ఓలు & సర్క్యులర్లు')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t(
              'View government orders and circulars shared by the agriculture office.',
              'వ్యవసాయ కార్యాలయం పంచిన ప్రభుత్వ ఆదేశాలు మరియు సర్క్యులర్లను చూడండి.'
            )}
          </p>
        </div>
        {isAdminUser && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
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
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-gray-950">
                {t('Upload GO / Circular', 'జీ.ఓ / సర్క్యులర్ అప్లోడ్')}
              </h2>
              <button onClick={resetForm} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  {t('Title', 'శీర్షిక')}
                </label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <Upload className="mb-3 h-8 w-8 text-emerald-700" />
                <p className="font-bold text-gray-900">
                  {selectedFile
                    ? selectedFile.name
                    : t('Choose PDF, Word, Excel, or image', 'PDF, Word, Excel లేదా చిత్రం ఎంచుకోండి')}
                </p>
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-bold text-gray-700 hover:bg-gray-50"
              >
                {t('Cancel', 'రద్దు')}
              </button>
              <button
                onClick={handleAdd}
                disabled={uploading}
                className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {uploading ? t('Uploading...', 'అప్లోడ్ అవుతోంది...') : t('Save', 'సేవ్')}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => (
              <article
                key={doc.id}
                className="group rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                    <ScrollText className="h-6 w-6" />
                  </div>
                  {isAdminUser && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="rounded-lg p-2 text-red-500 opacity-0 transition hover:bg-red-50 group-hover:opacity-100"
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-black text-gray-950">{doc.title}</h3>
                {doc.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">{doc.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded-full bg-white px-2 py-1 font-semibold uppercase">
                    {doc.file_type}
                  </span>
                  {doc.issued_date && (
                    <span className="rounded-full bg-white px-2 py-1">
                      {t('Issued', 'జారీ')}: {new Date(doc.issued_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                  <FileActionButtons fileUrl={doc.file_url} fileName={doc.title} fileType={doc.file_type} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="font-semibold text-gray-600">
              {t('No GOs or circulars uploaded yet', 'ఇంకా జీ.ఓలు లేదా సర్క్యులర్లు అప్లోడ్ కాలేదు')}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
