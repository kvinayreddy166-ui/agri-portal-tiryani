import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Folder, Link, Plus, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FormDownload } from '../types/database';
import { FileActionButtons } from '../components/ui/FileActionButtons';
import { FileTypeIcon } from '../components/ui/FileTypeIcon';
import { inferFileTypeFromName } from '../lib/fileTypes';
import { uploadPortalFile } from '../lib/uploadFile';

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
  category: 'fertilizers',
};

const STATE_KEY = 'tiryani-statutory-forms-state';

export function FormsDownloads() {
  const { isAdminUser } = useAuth();
  const { t } = useLanguage();
  const [forms, setForms] = useState<FormDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STATE_KEY) || '{}');
      return folders.some((folder) => folder.id === stored.selectedFolder) ? stored.selectedFolder : 'fertilizers';
    } catch {
      return 'fertilizers';
    }
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newForm, setNewForm] = useState(emptyForm);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STATE_KEY) || '{}');
      window.localStorage.setItem(STATE_KEY, JSON.stringify({ ...stored, selectedFolder }));
    } catch {
      window.localStorage.setItem(STATE_KEY, JSON.stringify({ selectedFolder }));
    }
  }, [selectedFolder]);

  useEffect(() => {
    let restoreTimer: number | undefined;
    try {
      const stored = JSON.parse(window.localStorage.getItem(STATE_KEY) || '{}');
      if (typeof stored.scrollY === 'number') {
        restoreTimer = window.setTimeout(() => window.scrollTo({ top: stored.scrollY, left: 0 }), 80);
      }
    } catch {
      // Ignore stale local state and continue with defaults.
    }

    return () => {
      if (restoreTimer) window.clearTimeout(restoreTimer);
      try {
        const stored = JSON.parse(window.localStorage.getItem(STATE_KEY) || '{}');
        window.localStorage.setItem(STATE_KEY, JSON.stringify({ ...stored, selectedFolder, scrollY: window.scrollY }));
      } catch {
        window.localStorage.setItem(STATE_KEY, JSON.stringify({ selectedFolder, scrollY: window.scrollY }));
      }
    };
  }, [selectedFolder]);

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
    setEditingFormId(null);
    setShowAddForm(false);
  };

  const handleSave = async () => {
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
        const upload = await uploadPortalFile(selectedFile, `forms/${newForm.category}`);
        fileType = upload.fileType;
        fileUrl = upload.publicUrl;
      } else {
        fileType = inferFileTypeFromName(fileUrl, fileType);
      }

      const payload = {
        title: newForm.title.trim(),
        description: newForm.description.trim(),
        file_url: fileUrl,
        file_type: fileType,
        category: newForm.category,
      };

      const { error } = editingFormId
        ? await supabase.from('forms_downloads').update(payload).eq('id', editingFormId)
        : await supabase.from('forms_downloads').insert([payload]);

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
    setEditingFormId(null);
    setShowAddForm(true);
  };

  const openEditForm = (form: FormDownload) => {
    setNewForm({
      title: form.title,
      description: form.description || '',
      file_url: form.file_url || '',
      file_type: form.file_type || 'pdf',
      category: form.category || selectedFolder,
    });
    setSelectedFile(null);
    setEditingFormId(form.id);
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-950 dark:text-white">
            {t('Statutory Forms', 'Statutory Forms')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-300">
            {t(
              'Files uploaded here appear on the public Statutory Forms page before login.',
              'చట్టబద్ధ ఫారాలు మరియు టెంప్లేట్లను అప్లోడ్, సవరించు, తొలగించు, చూడండి మరియు డౌన్‌లోడ్ చేయండి.'
            )}
          </p>
        </div>

        {isAdminUser && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            {t('Upload Statutory Form', 'Upload Statutory Form')}
          </button>
        )}
      </div>

      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() => setSelectedFolder(folder.id)}
            className={`rounded-lg border px-2.5 py-2 text-left transition ${
              selectedFolder === folder.id
                ? 'border-emerald-300 bg-emerald-700 text-white shadow-md shadow-emerald-900/10'
                : 'border-gray-100 bg-white text-gray-900 shadow-sm hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className={`rounded-md p-2 ${selectedFolder === folder.id ? 'bg-white/15' : 'bg-slate-100'}`}>
                <Folder className={`h-4 w-4 ${selectedFolder === folder.id ? 'text-white' : 'text-slate-600'}`} />
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                selectedFolder === folder.id ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {folderCounts[folder.id] || 0}
              </span>
            </div>
            <h2 className="mt-1.5 truncate text-sm font-black">{t(folder.label, folder.telugu)}</h2>
            <p className={`mt-0.5 text-xs ${selectedFolder === folder.id ? 'text-emerald-50' : 'text-gray-500'}`}>
              {t('Statutory section', 'Statutory section')}
            </p>
          </button>
        ))}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-950">
                  {editingFormId ? t('Edit Statutory Form', 'Edit Statutory Form') : t('Upload Statutory Form', 'Upload Statutory Form')}
                </h2>
                <p className="text-sm text-gray-500">{t('This will be visible to the public on the login page.', 'This will be visible to the public on the login page.')}</p>
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
                <label className="mb-1 block text-sm font-bold text-gray-700">{t('Statutory section', 'Statutory section')}</label>
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
              <button onClick={handleSave} disabled={uploading} className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
                {uploading ? t('Saving...', 'సేవ్ అవుతోంది...') : t('Save Item', 'సేవ్ చేయండి')}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3">
          <h2 className="text-xl font-black text-gray-950 dark:text-white">{t(activeFolder.label, activeFolder.telugu)}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-300">
            {selectedForms.length} {t('items available', 'ఐటమ్లు అందుబాటులో ఉన్నాయి')}
          </p>
        </div>

        {selectedForms.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-slate-700">
            <table className="min-w-[720px] w-full border-collapse text-left">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="w-20 px-3 py-2.5">{t('S.No.', 'S.No.')}</th>
                  <th className="px-3 py-2.5">{t('Proforma / Form Name', 'Proforma / Form Name')}</th>
                  <th className="w-36 px-3 py-2.5">{t('Date', 'తేదీ')}</th>
                  <th className="w-36 px-3 py-2.5 text-right">{t('Action', 'చర్య')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {selectedForms.map((form, index) => (
                  <tr key={form.id} className="transition hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300">{index + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileTypeIcon fileName={form.title} fileType={form.file_type} fileUrl={form.file_url || undefined} size="sm" />
                        <h3 className="max-w-[28rem] truncate text-sm font-black text-gray-950 dark:text-white">{form.title}</h3>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-slate-400">
                      {new Date(form.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-0.5">
                        {form.file_url && (
                          <FileActionButtons fileUrl={form.file_url} fileName={form.title} fileType={form.file_type} size="sm" />
                        )}
                        {isAdminUser && (
                          <>
                            <button onClick={() => openEditForm(form)} className="rounded-md p-1 text-blue-600 transition hover:bg-blue-50" aria-label="Edit item">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(form.id)} className="rounded-md p-1 text-red-500 transition hover:bg-red-50" aria-label="Delete item">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
