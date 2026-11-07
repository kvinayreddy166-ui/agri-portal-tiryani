import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  File,
  FileSpreadsheet,
  FileText,
  Gavel,
  Image as ImageIcon,
  Mail,
  Plus,
  ScrollText,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { uploadPortalFile } from '../../../shared/lib/uploadFile';
import { GosCircular } from '../../../shared/types/database';
import { FileActionButtons } from '../../../shared/components/ui/FileActionButtons';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { resolveFileIdentity, validateUploadFile } from '../../../shared/lib/fileTypes';

type DocKind = 'go' | 'circular';
type KindFilter = 'all' | DocKind;
type SortMode = 'newest' | 'oldest' | 'title';

const emptyForm = {
  title: '',
  description: '',
  issued_date: '',
};

function docKind(doc: GosCircular): DocKind {
  if (doc.doc_type === 'go' || doc.doc_type === 'circular') return doc.doc_type;
  // Fallback for rows uploaded before the doc_type column existed:
  // infer from the title only ("GO Ms.No…", "G.O. Rt.No…", "Read Order"…).
  return /\b(go|g\.o\.?|roc|read order)\b/i.test(doc.title) ? 'go' : 'circular';
}

function FileKindIcon({ fileType, className = 'h-5 w-5' }: { fileType: string; className?: string }) {
  switch (fileType) {
    case 'pdf':
      return <FileText className={`${className} text-red-600 dark:text-red-400`} />;
    case 'doc':
      return <FileText className={`${className} text-blue-600 dark:text-blue-400`} />;
    case 'excel':
      return <FileSpreadsheet className={`${className} text-emerald-600 dark:text-emerald-400`} />;
    case 'image':
      return <ImageIcon className={`${className} text-rose-600 dark:text-rose-400`} />;
    default:
      return <File className={`${className} text-slate-500 dark:text-slate-400`} />;
  }
}

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GosCirculars() {
  const { isAdminUser, user } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<GosCircular[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [newDoc, setNewDoc] = useState(emptyForm);
  const [newDocType, setNewDocType] = useState<DocKind>('circular');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<GosCircular | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setFetchError(null);
    const baseSelect = 'id, title, description, file_url, file_name, file_type, issued_date, created_at, created_by';
    try {
      // doc_type column arrives with migration 20261109000000; fall back
      // gracefully (title-based inference) if it is not deployed yet.
      let { data, error } = await supabase
        .from('gos_circulars')
        .select(`${baseSelect}, doc_type`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        const retry = await supabase
          .from('gos_circulars')
          .select(baseSelect)
          .order('created_at', { ascending: false })
          .limit(200);
        data = retry.data;
        error = retry.error;
      }

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
    setNewDocType('circular');
    setSelectedFile(null);
    setFileError(null);
    setShowAddForm(false);
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setFileError(file ? validateUploadFile(file) : null);
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

    const validationError = validateUploadFile(selectedFile);
    if (validationError) {
      setFileError(validationError);
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
          doc_type: newDocType,
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

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const target = docToDelete;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('gos_circulars').delete().eq('id', target.id);
      if (error) throw error;
      fetchDocuments();
      setDocToDelete(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(t('Failed to delete document', 'పత్రాన్ని తొలగించడం విఫలమైంది'));
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const goCount = documents.filter((d) => docKind(d) === 'go').length;
    return { total: documents.length, go: goCount, circular: documents.length - goCount };
  }, [documents]);

  const visibleDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = documents.filter((doc) => {
      if (kindFilter !== 'all' && docKind(doc) !== kindFilter) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        (doc.description || '').toLowerCase().includes(q) ||
        (doc.file_name || '').toLowerCase().includes(q)
      );
    });
    return [...filtered].sort((a, b) => {
      if (sortMode === 'title') return a.title.localeCompare(b.title);
      const aTime = new Date(a.issued_date || a.created_at).getTime();
      const bTime = new Date(b.issued_date || b.created_at).getTime();
      return sortMode === 'oldest' ? aTime - bTime : bTime - aTime;
    });
  }, [documents, search, kindFilter, sortMode]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  const kindBadge = (kind: DocKind) =>
    kind === 'go' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800 ring-1 ring-amber-300/60 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/50">
        <Gavel className="h-3 w-3" />
        {t('GO', 'జీ.ఓ')}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-800 ring-1 ring-sky-300/60 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800/50">
        <Mail className="h-3 w-3" />
        {t('Circular', 'సర్క్యులర్')}
      </span>
    );

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={Boolean(docToDelete)}
        title={t('Delete Document?', 'పత్రాన్ని తొలగించాలా?')}
        message={
          docToDelete
            ? t(
                `Are you sure you want to delete "${docToDelete.title}"? This action cannot be undone.`,
                `మీరు "${docToDelete.title}" పత్రాన్ని ఖచ్చితంగా తొలగించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేము.`
              )
            : undefined
        }
        confirmLabel={isDeleting ? t('Deleting...', 'తొలగిస్తోంది...') : t('Delete', 'తొలగించు')}
        cancelLabel={t('Cancel', 'రద్దు చేయి')}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDocToDelete(null);
        }}
      />

      <ModulePageHeader
        icon={ScrollText}
        title={t('GOs & Circulars', 'జీ.ఓలు & సర్క్యులర్లు')}
        subtitle={t(
          'Government orders and circulars shared by Admin',
          'అడ్మిన్ పంచిన ప్రభుత్వ ఆదేశాలు మరియు సర్క్యులర్లు'
        )}
        actions={
          isAdminUser ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <Plus className="h-4 w-4" />
              {t('Upload Document', 'పత్రం అప్లోడ్')}
            </button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: t('Total', 'మొత్తం'), value: stats.total, classes: 'text-slate-800 dark:text-slate-100' },
          { label: t('Government Orders', 'ప్రభుత్వ ఆదేశాలు'), value: stats.go, classes: 'text-amber-700 dark:text-amber-300' },
          { label: t('Circulars', 'సర్క్యులర్లు'), value: stats.circular, classes: 'text-sky-700 dark:text-sky-300' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <p className={`text-xl font-black leading-6 ${s.classes}`}>{s.value}</p>
            <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar: search + kind filter + sort */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search by title, description or file name…', 'శీర్షిక, వివరణ లేదా ఫైల్ పేరుతో వెతకండి…')}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-800 shadow-xs outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/30"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {([
            ['all', t('All', 'అన్నీ')],
            ['go', t('GOs', 'జీ.ఓలు')],
            ['circular', t('Circulars', 'సర్క్యులర్లు')],
          ] as [KindFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setKindFilter(value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                kindFilter === value
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="relative ml-1">
            <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="appearance-none rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs font-bold text-slate-600 shadow-xs outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              aria-label={t('Sort documents', 'పత్రాలను క్రమబద్ధీకరించు')}
            >
              <option value="newest">{t('Newest', 'కొత్తవి')}</option>
              <option value="oldest">{t('Oldest', 'పాతవి')}</option>
              <option value="title">{t('Title A–Z', 'శీర్షిక A–Z')}</option>
            </select>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {fetchError}
        </div>
      )}

      {/* Upload modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  {t('Upload GO / Circular', 'జీ.ఓ / సర్క్యులర్ అప్లోడ్')}
                </h2>
              </div>
              <button
                onClick={resetForm}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label={t('Close', 'మూసివేయి')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3.5">
              {/* Document type */}
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('Document type', 'పత్రం రకం')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['go', t('Government Order (GO)', 'ప్రభుత్వ ఆదేశం (జీ.ఓ)'), Gavel],
                    ['circular', t('Circular', 'సర్క్యులర్'), Mail],
                  ] as [DocKind, string, typeof Gavel][]).map(([value, label, Icon]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewDocType(value)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                        newDocType === value
                          ? value === 'go'
                            ? 'border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-300 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'border-sky-400 bg-sky-50 text-sky-800 ring-1 ring-sky-300 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('Title', 'శీర్షిక')}
                </label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  placeholder={t('e.g., GO Ms.No.123 — Fertilizer subsidy', 'ఉదా., జీ.ఓ ఎం.ఎస్.నం.123 — ఎరువుల రాయతీ')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('Description', 'వివరణ')}
                </label>
                <textarea
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                  rows={2}
                  placeholder={t('Short summary of the order or circular…', 'ఆదేశం లేదా సర్క్యులర్ యొక్క సంక్షిప్త సారాంశం…')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/30"
                />
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('Issue date', 'జారీ తేదీ')}
                  </label>
                  <input
                    type="date"
                    value={newDoc.issued_date}
                    onChange={(e) => setNewDoc({ ...newDoc, issued_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('File', 'ఫైల్')}
                </label>
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
                    fileError
                      ? 'border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/20'
                      : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/60 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                  {selectedFile ? (
                    <>
                      <FileKindIcon fileType={resolveFileIdentity(selectedFile.name).resolvedType} className="mb-2 h-7 w-7" />
                      <p className="max-w-full truncate text-sm font-bold text-slate-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {formatBytes(selectedFile.size)} · {t('tap to change', 'మార్చటానికి నొక్కండి')}
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-2 h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {t('Choose PDF, Word, Excel, CSV or image', 'PDF, Word, Excel, CSV లేదా చిత్రం ఎంచుకోండి')}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {t('Max 50 MB', 'గరిష్టంగా 50 MB')}
                      </p>
                    </>
                  )}
                </label>
                {fileError && (
                  <p className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-400">{fileError}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={resetForm}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'రద్దు')}
              </button>
              <button
                onClick={handleAdd}
                disabled={uploading || Boolean(fileError)}
                className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? t('Uploading...', 'అప్లోడ్ అవుతోంది...') : t('Save & Publish', 'సేవ్ & ప్రచురించు')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document grid */}
      <section>
        {visibleDocuments.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleDocuments.map((doc) => {
              const kind = docKind(doc);
              const { resolvedType } = resolveFileIdentity(doc.file_name, doc.file_type, doc.file_url);
              return (
                <article
                  key={doc.id}
                  className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
                      <FileKindIcon fileType={resolvedType} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {kindBadge(kind)}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                          {resolvedType.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="mt-1.5 line-clamp-2 text-sm font-black leading-snug text-slate-900 dark:text-white">
                        {doc.title}
                      </h3>
                    </div>
                    {isAdminUser && (
                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/40"
                        aria-label={t('Delete document', 'పత్రాన్ని తొలగించు')}
                        title={t('Delete document', 'పత్రాన్ని తొలగించు')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {doc.description && (
                    <p className="mt-2.5 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                      {doc.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <div className="min-w-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {doc.issued_date && (
                        <p>
                          {t('Issued', 'జారీ')}: {new Date(doc.issued_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      <p className="truncate">{doc.file_name}</p>
                    </div>
                    <FileActionButtons fileUrl={doc.file_url} fileName={doc.title} fileType={doc.file_type} size="sm" />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800/50">
              <ScrollText className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-black text-slate-800 dark:text-slate-100">
              {documents.length === 0
                ? t('No GOs or circulars uploaded yet', 'ఇంకా జీ.ఓలు లేదా సర్క్యులర్లు అప్లోడ్ కాలేదు')
                : t('No documents match your filters', 'మీ ఫిల్టర్లకు తగిన పత్రాలు లేవు')}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {documents.length === 0
                ? t('Upload the first official document to get started.', 'ప్రారంభించడానికి మొదటి అధికారిక పత్రాన్ని అప్లోడ్ చేయండి.')
                : t('Try a different search term or filter.', 'వేరే శోధన పదం లేదా ఫిల్టర్ ప్రయత్నించండి.')}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
