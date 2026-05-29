import React, { useEffect, useMemo, useState } from 'react';
import { Folder, Link, Plus, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FormDownload } from '../types/database';
import { FileActionButtons } from '../components/ui/FileActionButtons';
import { FileTypeBadge } from '../components/ui/FileTypeBadge';
import { getContentType, inferFileTypeFromName } from '../lib/fileTypes';

const folders = [
  { id: 'seed', label: 'Seed', telugu: 'విత్తనాలు' },
  { id: 'fertilizers', label: 'Fertilizers', telugu: 'ఎరువులు' },
  { id: 'pesticides', label: 'Pesticides', telugu: 'పురుగుమందులు' },
];

const emptyForm = {
  title: '',
  description: '',
  file_url: '',
  file_type: 'pdf',
  category: 'seed',
};

export function FormsDownloads() {
  const { isAdminUser } = useAuth();
  const { t } = useLanguage();
  const [forms, setForms] = useState<FormDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('seed');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newForm, setNewForm] = useState(emptyForm);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('forms_downloads')
        .select('*')
        .in('category', folders.map((folder) => folder.id))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      setFetchError(error instanceof Error ? error.message : 'Unable to load downloads.');
    } finally {
      setLoading(false);
    }
  };

  const folderCounts = useMemo(
    () =>
      folders.reduce((counts, folder) => {
        counts[folder.id] = forms.filter((form) => form.category === folder.id).length;
        return counts;
      }, {} as Record<string, number>),
    [forms]
  );

  const selectedForms = forms.filter((form) => form.category === selectedFolder);
  const activeFolder = folders.find((folder) => folder.id === selectedFolder) || folders[0];

  const resetForm = () => {
    setNewForm({ ...emptyForm, category: selectedFolder });
    setSelectedFile(null);
    setShowAddForm(false);
  };

  const handleAdd = async () => {
    if (!newForm.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!selectedFile && !newForm.file_url.trim()) {
      alert('Please select a file or enter a file URL');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = newForm.file_url.trim();
      let fileType = newForm.file_type;

      if (selectedFile) {
        fileType = inferFileTypeFromName(selectedFile.name, selectedFile.type);
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `forms/${newForm.category}/${Date.now()}_${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, selectedFile, {
            upsert: true,
            contentType: getContentType(selectedFile),
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);
        fileUrl = publicUrl;
      } else {
        fileType = inferFileTypeFromName(fileUrl, fileType);
      }

      const { error } = await supabase.from('forms_downloads').insert([{
        title: newForm.title.trim(),
        description: newForm.description.trim(),
        file_url: fileUrl,
        file_type: fileType,
        category: newForm.category,
      }]);

      if (error) throw error;

      resetForm();
      fetchForms();
    } catch (error) {
      console.error('Error adding document:', error);
      alert(error instanceof Error ? error.message : 'Failed to add document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const { error } = await supabase.from('forms_downloads').delete().eq('id', id);
      if (error) throw error;
      fetchForms();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete item');
    }
  };

  const openAddForm = () => {
    setNewForm({ ...emptyForm, category: selectedFolder });
    setSelectedFile(null);
    setShowAddForm(true);
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            {t('Resource library', 'వనరుల గ్రంథాలయం')}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-950">
            {t('Forms & Downloads', 'ఫారాలు & డౌన్‌లోడ్‌లు')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t(
              'Download seed, fertilizer, and pesticide documents shared by the office.',
              'కార్యాలయం పంచిన విత్తనాలు, ఎరువులు మరియు పురుగుమందుల పత్రాలను చూడండి.'
            )}
          </p>
        </div>

        {isAdminUser && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            {t('Add Item', 'ఐటమ్ జోడించండి')}
          </button>
        )}
      </div>

      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() => setSelectedFolder(folder.id)}
            className={`rounded-2xl border p-5 text-left transition ${
              selectedFolder === folder.id
                ? 'border-emerald-300 bg-emerald-700 text-white shadow-lg shadow-emerald-900/10'
                : 'border-gray-100 bg-white text-gray-900 shadow-sm hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className={`rounded-xl p-3 ${selectedFolder === folder.id ? 'bg-white/15' : 'bg-emerald-50'}`}>
                <Folder className={`h-6 w-6 ${selectedFolder === folder.id ? 'text-white' : 'text-emerald-700'}`} />
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                selectedFolder === folder.id ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {folderCounts[folder.id] || 0}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-black">{t(folder.label, folder.telugu)}</h2>
            <p className={`mt-1 text-sm ${selectedFolder === folder.id ? 'text-emerald-50' : 'text-gray-500'}`}>
              {t('Folder', 'ఫోల్డర్')}
            </p>
          </button>
        ))}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-950">{t('Add Download Item', 'డౌన్‌లోడ్ ఐటమ్ జోడించండి')}</h2>
                <p className="text-sm text-gray-500">{t('Upload an image or document for users.', 'వినియోగదారుల కోసం చిత్రం లేదా పత్రం అప్లోడ్ చేయండి.')}</p>
              </div>
              <button onClick={resetForm} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-gray-700">{t('Title', 'శీర్షిక')}</label>
                <input
                  type="text"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-gray-700">{t('Description', 'వివరణ')}</label>
                <textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">{t('Folder', 'ఫోల్డర్')}</label>
                <select
                  value={newForm.category}
                  onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{t(folder.label, folder.telugu)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">{t('File URL', 'ఫైల్ లింక్')}</label>
                <div className="relative">
                  <Link className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={newForm.file_url}
                    onChange={(e) => setNewForm({ ...newForm, file_url: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  {t('Upload image or document', 'చిత్రం లేదా పత్రం అప్లోడ్ చేయండి')}
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <Upload className="mb-3 h-8 w-8 text-emerald-700" />
                  <p className="font-bold text-gray-900">
                    {selectedFile ? selectedFile.name : t('Choose a file', 'ఫైల్ ఎంచుకోండి')}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('Images, PDF, Word, and Excel files are supported.', 'చిత్రాలు, PDF, Word, Excel ఫైళ్లు సపోర్ట్ చేస్తుంది.')}
                  </p>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={resetForm} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-bold text-gray-700 hover:bg-gray-50">
                {t('Cancel', 'రద్దు')}
              </button>
              <button onClick={handleAdd} disabled={uploading} className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
                {uploading ? t('Saving...', 'సేవ్ అవుతోంది...') : t('Save Item', 'సేవ్ చేయండి')}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-gray-950">{t(activeFolder.label, activeFolder.telugu)}</h2>
          <p className="text-sm text-gray-500">
            {selectedForms.length} {t('items available', 'ఐటమ్లు అందుబాటులో ఉన్నాయి')}
          </p>
        </div>

        {selectedForms.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <div className="hidden grid-cols-[1.4fr_0.75fr_0.7fr_auto] gap-4 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid">
              <span>{t('File', 'ఫైల్')}</span>
              <span>{t('Type', 'రకం')}</span>
              <span>{t('Date', 'తేదీ')}</span>
              <span className="text-right">{t('Action', 'చర్య')}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {selectedForms.map((form) => (
                <article
                  key={form.id}
                  className="grid gap-4 px-4 py-4 transition hover:bg-gray-50 md:grid-cols-[1.4fr_0.75fr_0.7fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-gray-950">{form.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{form.description}</p>
                  </div>
                  <FileTypeBadge fileName={form.file_url || form.title} fileType={form.file_type} />
                  <span className="text-sm font-medium text-gray-500">
                    {new Date(form.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex justify-end gap-2">
                    {form.file_url && (
                      <FileActionButtons fileUrl={form.file_url} fileName={form.title} fileType={form.file_type} size="sm" />
                    )}
                    {isAdminUser && (
                      <button onClick={() => handleDelete(form.id)} className="rounded-lg p-2 text-red-500 transition hover:bg-red-50" aria-label="Delete item">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <Folder className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="font-semibold text-gray-600">{t('No items in this folder yet', 'ఈ ఫోల్డర్‌లో ఇంకా ఐటమ్లు లేవు')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
