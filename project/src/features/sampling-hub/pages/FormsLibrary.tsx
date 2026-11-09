import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, Edit2, Eye, FileText, FolderOpen, Layers, Link, Loader2, Plus, Scale, Trash2, Upload, X, FlaskConical, Sprout, Bug, Search } from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { FilePreviewModal } from '../../../shared/components/ui/FilePreviewModal';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { FormDownload } from '../../../shared/types/database';
import { FileTypeIcon } from '../../../shared/components/ui/FileTypeIcon';
import { inferFileTypeFromName } from '../../../shared/lib/fileTypes';
import { uploadPortalFile } from '../../../shared/lib/uploadFile';
import { downloadFileFromUrl, fetchBlobUrl, revokeBlobUrl } from '../../../shared/lib/fileBlob';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { classifyPublicForm, comparePublicForms, PUBLIC_FORM_SUBGROUPS, type PublicFormSubGroup, type PublicFormGroupMeta } from '../../auth/pages/PublicOfficerTools';

import { safeStorage } from '../../../shared/lib/safeStorage';
const folders = [
  { id: 'fertilizers', label: 'Fertilizer', telugu: 'ఎరువులు', icon: FlaskConical, tone: 'sky' },
  { id: 'seed', label: 'Seed', telugu: 'విత్తనాలు', icon: Sprout, tone: 'emerald' },
  { id: 'pesticides', label: 'Pesticide', telugu: 'పురుగుమందులు', icon: Bug, tone: 'amber' },
];

const FORMS_PAGE_SIZE = 100;

const emptyForm = {
  title: '',
  description: '',
  file_url: '',
  file_type: 'pdf',
  category: 'fertilizers',
};

const STATE_KEY = 'tiryani-statutory-forms-state';

function normalizeCategory(cat: string): string {
  const c = (cat || '').toLowerCase().trim();
  if (c === 'fertilizer' || c === 'fertilizers') return 'fertilizers';
  if (c === 'seed' || c === 'seeds') return 'seed';
  if (c === 'pesticide' || c === 'pesticides') return 'pesticides';
  return c || 'fertilizers';
}

function isNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|network|timed?\s?out|connection/i.test(message);
}

async function withNetworkRetry<T>(fn: () => PromiseLike<T>, retries = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !isNetworkError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
}

export function FormsLibrary() {
  const { isAdminUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { t, language } = useLanguage();
  const [forms, setForms] = useState<FormDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState(() => {
    try {
      const stored = JSON.parse(safeStorage.getItem(STATE_KEY) || '{}');
      return folders.some((folder) => folder.id === stored.selectedFolder) ? stored.selectedFolder : 'fertilizers';
    } catch {
      return 'fertilizers';
    }
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newForm, setNewForm] = useState(emptyForm);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toasts, removeToast, showSaved, showDeleted, showWarning } = useToast();
  const [formToDelete, setFormToDelete] = useState<FormDownload | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subGroupFilter, setSubGroupFilter] = useState<'all' | PublicFormSubGroup>('all');
  const [formsPage, setFormsPage] = useState(0);
  const [previewForm, setPreviewForm] = useState<FormDownload | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(safeStorage.getItem(STATE_KEY) || '{}');
      safeStorage.setItem(STATE_KEY, JSON.stringify({ ...stored, selectedFolder }));
    } catch {
      safeStorage.setItem(STATE_KEY, JSON.stringify({ selectedFolder }));
    }
  }, [selectedFolder]);

  useEffect(() => {
    let restoreTimer: number | undefined;
    try {
      const stored = JSON.parse(safeStorage.getItem(STATE_KEY) || '{}');
      if (typeof stored.scrollY === 'number') {
        restoreTimer = window.setTimeout(() => window.scrollTo({ top: stored.scrollY, left: 0 }), 80);
      }
    } catch {
      // Ignore stale local state and continue with defaults.
    }

    return () => {
      if (restoreTimer) window.clearTimeout(restoreTimer);
      try {
        const stored = JSON.parse(safeStorage.getItem(STATE_KEY) || '{}');
        safeStorage.setItem(STATE_KEY, JSON.stringify({ ...stored, selectedFolder, scrollY: window.scrollY }));
      } catch {
        safeStorage.setItem(STATE_KEY, JSON.stringify({ selectedFolder, scrollY: window.scrollY }));
      }
    };
  }, [selectedFolder]);

  const fetchForms = async () => {
    setFetchError(null);
    try {
      const { data, error } = await withNetworkRetry(() => supabase
        .from('forms_downloads')
        .select('id, title, description, file_url, file_type, category, created_at')
        .order('created_at', { ascending: false }));

      if (error) throw error;
      const normalized = (data || []).map((row) => ({
        ...row,
        category: normalizeCategory(row.category),
      }));
      setForms(normalized);
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

  const selectedForms = useMemo(() => {
    const list = forms.filter((form) => form.category === selectedFolder);
    return [...list].sort(comparePublicForms);
  }, [forms, selectedFolder]);

  const subGroupCounts = useMemo(() => {
    const counts: Record<'all' | PublicFormSubGroup, number> = {
      all: selectedForms.length,
      sampling: 0,
      enforcement: 0,
      reference: 0,
    };
    for (const form of selectedForms) {
      const g = classifyPublicForm(form);
      counts[g] = (counts[g] || 0) + 1;
    }
    return counts;
  }, [selectedForms]);

  const filteredForms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return selectedForms.filter((form) => {
      if (subGroupFilter !== 'all' && classifyPublicForm(form) !== subGroupFilter) {
        return false;
      }
      if (!query) return true;
      const title = (form.title || form.label || '').toLowerCase();
      const description = (form.description || '').toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [selectedForms, subGroupFilter, searchQuery]);

  const groupedForms = useMemo(() => {
    const groups: {
      meta: PublicFormGroupMeta;
      icon: typeof FileText;
      colorClasses: { badge: string; headerBg: string; headerBorder: string; headerText: string };
      forms: FormDownload[];
    }[] = [
      {
        meta: PUBLIC_FORM_SUBGROUPS.sampling,
        icon: FileText,
        colorClasses: {
          badge: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300',
          headerBg: 'bg-emerald-100/60 dark:bg-emerald-950/40',
          headerBorder: 'border-emerald-200/80 dark:border-emerald-900/60',
          headerText: 'text-emerald-900 dark:text-emerald-200',
        },
        forms: [],
      },
      {
        meta: PUBLIC_FORM_SUBGROUPS.enforcement,
        icon: Scale,
        colorClasses: {
          badge: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300',
          headerBg: 'bg-amber-100/60 dark:bg-amber-950/40',
          headerBorder: 'border-amber-200/80 dark:border-amber-900/60',
          headerText: 'text-amber-900 dark:text-amber-200',
        },
        forms: [],
      },
      {
        meta: PUBLIC_FORM_SUBGROUPS.reference,
        icon: BookOpen,
        colorClasses: {
          badge: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300',
          headerBg: 'bg-sky-100/60 dark:bg-sky-950/40',
          headerBorder: 'border-sky-200/80 dark:border-sky-900/60',
          headerText: 'text-sky-900 dark:text-sky-200',
        },
        forms: [],
      },
    ];

    for (const form of filteredForms) {
      const g = classifyPublicForm(form);
      const target = groups.find((item) => item.meta.id === g);
      if (target) target.forms.push(form);
    }

    return groups.filter((g) => g.forms.length > 0);
  }, [filteredForms]);

  const otherMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return folders.filter((f) => f.id !== selectedFolder)
      .map((f) => {
        const matchCount = forms.filter(
          (form) =>
            form.category === f.id &&
            ((form.title || '').toLowerCase().includes(query) ||
              (form.description || '').toLowerCase().includes(query))
        ).length;
        return { ...f, matchCount };
      })
      .filter((f) => f.matchCount > 0);
  }, [forms, selectedFolder, searchQuery]);

  const formsPageCount = Math.max(1, Math.ceil(filteredForms.length / FORMS_PAGE_SIZE));
  const paginatedForms = useMemo(
    () => filteredForms.slice(formsPage * FORMS_PAGE_SIZE, formsPage * FORMS_PAGE_SIZE + FORMS_PAGE_SIZE),
    [filteredForms, formsPage]
  );

  useEffect(() => {
    setSubGroupFilter('all');
    setFormsPage(0);
  }, [selectedFolder]);

  useEffect(() => {
    setFormsPage(0);
  }, [searchQuery, subGroupFilter]);

  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const openPreview = async (form: FormDownload) => {
    if (!form.file_url) return;
    const mobileTab = isMobileDevice ? window.open('', '_blank') : null;
    setPreviewLoadingId(form.id);
    try {
      const blobUrl = await fetchBlobUrl(form.file_url, form.title);
      if (mobileTab) {
        mobileTab.location.href = blobUrl;
        window.setTimeout(() => revokeBlobUrl(blobUrl), 60_000);
        return;
      }
      setPreviewBlobUrl(blobUrl);
      setPreviewForm({ ...form, file_url: blobUrl });
    } catch {
      mobileTab?.close();
      setPreviewForm(form);
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const closePreview = () => {
    setPreviewForm(null);
    revokeBlobUrl(previewBlobUrl);
    setPreviewBlobUrl(null);
  };

  const handleDownload = async (form: FormDownload) => {
    if (!form.file_url) return;
    setDownloadingFormId(form.id);
    try {
      await downloadFileFromUrl(form.file_url, form.title);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(form.file_url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingFormId(null);
    }
  };

  const resetForm = () => {
    setNewForm({ ...emptyForm, category: selectedFolder });
    setSelectedFile(null);
    setEditingFormId(null);
    setShowAddForm(false);
  };

  const handleSave = async () => {
    if (!newForm.title.trim()) {
      showWarning('Title required', 'Please enter a title.');
      return;
    }

    if (!selectedFile && !newForm.file_url.trim()) {
      showWarning('File required', 'Please select a file or enter a file URL.');
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
        ? await withNetworkRetry(() => supabase.from('forms_downloads').update(payload).eq('id', editingFormId))
        : await withNetworkRetry(() => supabase.from('forms_downloads').insert([payload]));

      if (error) throw error;

      resetForm();
      fetchForms();
      try { window.sessionStorage.removeItem('tiryani-public-statutory-forms-cache'); } catch {}
      showSaved(editingFormId ? 'Form updated' : 'Form uploaded', payload.title);
    } catch (error) {
      console.error('Error adding document:', error);
      showWarning(
        'Save failed',
        isNetworkError(error)
          ? 'Network error — could not reach the server. Please try again.'
          : error instanceof Error ? error.message : 'Failed to add document.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!formToDelete) return;
    const target = formToDelete;
    setIsDeleting(true);
    try {
      const { error } = await withNetworkRetry(() => supabase.from('forms_downloads').delete().eq('id', target.id));
      if (error) throw error;
      fetchForms();
      try { window.sessionStorage.removeItem('tiryani-public-statutory-forms-cache'); } catch {}
      showDeleted(t('Form deleted', 'ఫారం తొలగించబడింది'), target.title);
      setFormToDelete(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      showWarning(
        t('Delete failed', 'తొలగించడం విఫలమైంది'),
        isNetworkError(error)
          ? t('Network error — could not reach the server. Please try again.', 'నెట్‌వర్క్ లోపం — సర్వర్‌ను చేరుకోలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.')
          : error instanceof Error ? error.message : t('Failed to delete item', 'ఐటమ్‌ను తొలగించడం విఫలమైంది')
      );
    } finally {
      setIsDeleting(false);
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

  const badgeClassesFor = (subGroup: PublicFormSubGroup) =>
    subGroup === 'sampling'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
      : subGroup === 'enforcement'
      ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300'
      : 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300';

  const renderFormCard = (form: FormDownload) => {
    const subGroup = classifyPublicForm(form);
    const meta = PUBLIC_FORM_SUBGROUPS[subGroup];

    return (
      <div
        key={form.id}
        className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-2xs transition-transform duration-200 group-hover:scale-105">
            <FileTypeIcon fileName={form.title} fileType={form.file_type} fileUrl={form.file_url || undefined} size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${badgeClassesFor(subGroup)}`}>
                {language === 'te' ? meta.badgeTelugu : meta.badge}
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug break-words font-[var(--font-heading)]">
              {form.title}
            </h3>
            {form.description && (
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                {form.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 justify-end">
          {form.file_url && (
            <>
              <button
                type="button"
                onClick={() => void openPreview(form)}
                disabled={previewLoadingId === form.id}
                className="inline-flex h-9 sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 sm:px-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 disabled:opacity-50"
                aria-label={t('Preview file', 'ఫైల్‌ను ప్రివ్యూ చేయండి')}
                title={t('Preview', 'ప్రివ్యూ')}
              >
                {previewLoadingId === form.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="hidden sm:inline">{t('Preview', 'ప్రివ్యూ')}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleDownload(form)}
                disabled={downloadingFormId === form.id}
                className="inline-flex h-9 sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 px-3 sm:px-3.5 text-xs font-bold text-white shadow-xs transition hover:from-emerald-800 hover:to-emerald-900 hover:shadow-sm disabled:opacity-50"
                aria-label={t('Download file', 'ఫైల్‌ను డౌన్‌లోడ్ చేయండి')}
                title={t('Download', 'డౌన్‌లోడ్')}
              >
                {downloadingFormId === form.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{t('Download', 'డౌన్‌లోడ్')}</span>
              </button>
            </>
          )}
          {isAdminUser && (
            <>
              <button
                type="button"
                onClick={() => openEditForm(form)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-blue-600 dark:text-blue-300 transition hover:bg-blue-50 dark:hover:bg-blue-950/40"
                aria-label={t('Edit form', 'ఫారం సవరించండి')}
                title={t('Edit', 'సవరించు')}
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setFormToDelete(form)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                aria-label={t('Delete form', 'ఫారం తొలగించు')}
                title={t('Delete', 'తొలగించు')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

    if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        open={Boolean(formToDelete)}
        title={t('Delete Form?', 'ఫారం తొలగించాలా?')}
        message={
          formToDelete
            ? t(
                `Are you sure you want to delete "${formToDelete.title}"? This action cannot be undone and will remove it from both the portal and public library.`,
                `మీరు "${formToDelete.title}" ఫారాన్ని ఖచ్చితంగా తొలగించాలనుకుంటున్నారా? ఇది పోర్టల్ మరియు పబ్లిక్ లైబ్రరీ రెండింటి నుండి శాశ్వతంగా తొలగించబడుతుంది.`
              )
            : undefined
        }
        confirmLabel={isDeleting ? t('Deleting...', 'తొలగిస్తోంది...') : t('Delete Form', 'ఫారం తొలగించు')}
        cancelLabel={t('Cancel', 'రద్దు చేయి')}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setFormToDelete(null);
        }}
      />
      <ModulePageHeader
        title={t('Forms & Library', 'ఫారాలు & లైబ్రరీ')}
        subtitle={t(
          'Files uploaded here appear on the public Forms & Library page before login.',
          'చట్టబద్ధ ఫారాలు మరియు టెంప్లేట్లను అప్లోడ్, సవరించు, తొలగించు, చూడండి మరియు డౌన్‌లోడ్ చేయండి.'
        )}
        icon={FolderOpen}
        actions={
          isAdminUser ? (
            <button
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              {t('Upload Form', 'Upload Form')}
            </button>
          ) : undefined
        }
      />

      {fetchError && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {fetchError}
        </div>
      )}

      {/* Category selector — cohesive with AGRONIX dashboard & toolkit */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {t('Select Category', 'వర్గాన్ని ఎంచుకోండి')}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('Browse statutory proforma, circulars and reference materials', 'చట్టబద్ధమైన ఫారాలు, సర్క్యులర్లు మరియు రిఫరెన్స్ డాక్యుమెంట్లు')}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {folderCounts[selectedFolder] || 0} {t('forms', 'ఫారాలు')}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
          {folders.map((folder) => {
            const isSelected = selectedFolder === folder.id;
            const count = folderCounts[folder.id] || 0;
            const FolderIcon = folder.icon;

            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolder(folder.id)}
                className={`group relative flex min-h-[56px] items-center justify-between overflow-hidden rounded-xl border p-3 sm:p-3.5 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-700 bg-gradient-to-br from-emerald-800 to-emerald-900 text-white shadow-md shadow-emerald-950/20'
                    : 'border-slate-200/90 bg-slate-50/60 text-slate-800 shadow-2xs hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-white hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                {isSelected && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400" />
                )}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
                      isSelected
                        ? 'bg-white/15 text-white ring-1 ring-white/20'
                        : folder.tone === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/50'
                        : folder.tone === 'sky'
                        ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800/50'
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/50'
                    }`}
                  >
                    <FolderIcon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-black font-[var(--font-heading)]">
                      {language === 'te' ? folder.telugu : folder.label}
                    </span>
                    <span className={`block text-[11px] font-semibold ${isSelected ? 'text-emerald-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {count} {t(count === 1 ? 'file' : 'files', count === 1 ? 'ఫైల్' : 'ఫైళ్లు')}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <span className="shrink-0 text-xs font-black text-gold-300">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-950 dark:text-white">
                  {editingFormId ? t('Edit Form', 'Edit Form') : t('Upload Form', 'Upload Form')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{t('This will be visible to the public on the login page.', 'This will be visible to the public on the login page.')}</p>
              </div>
              <button onClick={resetForm} className="rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-200">{t('Title', 'శీర్షిక')}</label>
                <input
                  type="text"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-200">{t('Description', 'వివరణ')}</label>
                <textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-200">{t('Category', 'వర్గం')}</label>
                <select
                  value={newForm.category}
                  onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{t(folder.label, folder.telugu)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-200">{t('File URL', 'ఫైల్ లింక్')}</label>
                <div className="relative">
                  <Link className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <input
                    type="url"
                    value={newForm.file_url}
                    onChange={(e) => setNewForm({ ...newForm, file_url: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-600 py-3 pl-12 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-slate-200">
                  {t('Upload image or document', 'చిత్రం లేదా పత్రం అప్లోడ్ చేయండి')}
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/60 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <Upload className="mb-3 h-8 w-8 text-emerald-700 dark:text-emerald-300" />
                  <p className="font-bold text-gray-900 dark:text-white">
                    {selectedFile ? selectedFile.name : t('Choose a file', 'ఫైల్ ఎంచుకోండి')}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {t('Images, PDF, Word, and Excel files are supported.', 'చిత్రాలు, PDF, Word, Excel ఫైళ్లు సపోర్ట్ చేస్తుంది.')}
                  </p>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={resetForm} className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-3 font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50">
                {t('Cancel', 'రద్దు')}
              </button>
              <button onClick={handleSave} disabled={uploading} className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
                {uploading ? t('Saving...', 'సేవ్ అవుతోంది...') : t('Save Item', 'సేవ్ చేయండి')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search, subgroup filters and grouped form cards — same style as public Forms & Library */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search forms, acts or manuals...', 'ఫారాలు, చట్టాలు వెతకండి...')}
            className="w-full rounded-xl border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-950 dark:text-white outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        {/* Sub-group filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSubGroupFilter('all')}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
              subGroupFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-600'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{t('All', 'అన్నీ')}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                subGroupFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {subGroupCounts.all}
            </span>
          </button>

          {(['sampling', 'enforcement', 'reference'] as PublicFormSubGroup[]).map((groupKey) => {
            const meta = PUBLIC_FORM_SUBGROUPS[groupKey];
            const count = subGroupCounts[groupKey];
            const isSelected = subGroupFilter === groupKey;
            const GroupIcon = groupKey === 'sampling' ? FileText : groupKey === 'enforcement' ? Scale : BookOpen;

            return (
              <button
                key={groupKey}
                type="button"
                onClick={() => setSubGroupFilter(groupKey)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                  isSelected
                    ? groupKey === 'sampling'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : groupKey === 'enforcement'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-sky-700 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <GroupIcon className="h-3.5 w-3.5" />
                <span>{language === 'te' ? meta.telugu : meta.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {subGroupFilter === 'all'
              ? t('Related Forms & Reference Materials', 'సంబంధిత ఫారాలు & మార్గదర్శక పత్రాలు')
              : language === 'te'
              ? PUBLIC_FORM_SUBGROUPS[subGroupFilter].telugu
              : PUBLIC_FORM_SUBGROUPS[subGroupFilter].label}
          </h2>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {filteredForms.length} {t(filteredForms.length === 1 ? 'Form' : 'Forms', filteredForms.length === 1 ? 'ఫారం' : 'ఫారాలు')}
          </span>
        </div>

        {filteredForms.length > 0 ? (
          subGroupFilter === 'all' ? (
            <div className="space-y-5">
              {groupedForms.map((group) => (
                <div key={group.meta.id} className="space-y-2">
                  <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${group.colorClasses.headerBg} ${group.colorClasses.headerBorder}`}>
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-md border ${group.colorClasses.badge}`}>
                        <group.icon className="h-3.5 w-3.5" />
                      </div>
                      <h3 className={`text-xs font-black uppercase tracking-wider ${group.colorClasses.headerText}`}>
                        {language === 'te' ? group.meta.telugu : group.meta.label}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {group.forms.length} {t(group.forms.length === 1 ? 'item' : 'items', group.forms.length === 1 ? 'అంశం' : 'అంశాలు')}
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {group.forms.map(renderFormCard)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-2">
              {paginatedForms.map(renderFormCard)}
            </div>
          )
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {searchQuery.trim()
                ? t('No forms matching your search in this group.', 'ఈ విభాగంలో మీ శోధనకు సరిపోలే ఫారాలు లేవు.')
                : t('No statutory forms found in this group.', 'ఈ విభాగంలో చట్టబద్ధ ఫారాలు లేవు.')}
            </p>
            {otherMatches.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t('Found in other categories:', 'ఇతర వర్గాలలో దొరికాయి:')}
                </span>
                {otherMatches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedFolder(m.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                  >
                    {language === 'te' ? m.telugu : m.label} ({m.matchCount})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {filteredForms.length > FORMS_PAGE_SIZE && subGroupFilter !== 'all' && (
          <div className="mt-2 flex items-center justify-end gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setFormsPage(Math.max(0, formsPage - 1))}
              disabled={formsPage === 0}
              className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 disabled:opacity-50"
            >
              {t('Previous', 'మునుపటి')}
            </button>
            <span className="uppercase tracking-wide">
              {t('Page', 'పేజీ')} {formsPage + 1} / {formsPageCount}
            </span>
            <button
              type="button"
              onClick={() => setFormsPage(Math.min(formsPageCount - 1, formsPage + 1))}
              disabled={formsPage >= formsPageCount - 1}
              className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 disabled:opacity-50"
            >
              {t('Next', 'తదుపరి')}
            </button>
          </div>
        )}
      </div>

      {previewForm?.file_url && (
        <FilePreviewModal
          fileUrl={previewForm.file_url}
          fileName={previewForm.title}
          fileType={previewForm.file_type}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
