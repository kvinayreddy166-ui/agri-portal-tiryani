import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Download,
  Eye,
  FileText,
  FlaskConical,
  Loader2,
  Sprout,
} from 'lucide-react';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { FileTypeIcon } from '../../../shared/components/ui/FileTypeIcon';
import { PortalLogo } from '../../../shared/components/ui/PortalLogo';
import { FilePreviewModal } from '../../../shared/components/ui/FilePreviewModal';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { supabase } from '../../../shared/lib/supabase';
import { downloadFileFromUrl, fetchBlobUrl, revokeBlobUrl } from '../../../shared/lib/fileBlob';
import { FormDownload } from '../../../shared/types/database';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBackButtonOverlay } from '../../../shared/hooks/useBackButtonOverlay';
const FertilizerStatutoryPdfTool = lazy(() =>
  import('../../statutory-forms/components/FertilizerStatutoryPdfTool')
    .then((module) => ({ default: module.FertilizerStatutoryPdfTool }))
    .catch((error) => {
      console.error('Failed to load FertilizerStatutoryPdfTool:', error);
      return { default: () => <div>Error loading fertilizer form</div> };
    })
);
const PesticideStatutoryPdfTool = lazy(() =>
  import('../../statutory-forms/components/PesticideStatutoryPdfTool').then((module) => ({ default: module.PesticideStatutoryPdfTool }))
);
const SeedForms = lazy(() =>
  import('../../statutory-forms/pages/SeedForms').then((module) => ({ default: module.SeedForms }))
);
const FertilizerCalculator = lazy(() =>
  import('../../calculators/pages/FertilizerCalculator').then((module) => ({ default: module.FertilizerCalculator }))
);

const STATUTORY_FOLDERS = [
  { id: 'fertilizers', label: 'Fertilizer', telugu: 'ఎరువులు' },
  { id: 'seed', label: 'Seed', telugu: 'విత్తనాలు' },
  { id: 'pesticides', label: 'Pesticide', telugu: 'పురుగుమందులు' },
];

const PUBLIC_FORM_CATEGORY_ALIASES: Record<string, string[]> = {
  fertilizers: ['fertilizers', 'fertilizer'],
  seed: ['seed', 'seeds'],
  pesticides: ['pesticides', 'pesticide'],
};
const PUBLIC_FORM_CATEGORY_VALUES = Array.from(new Set(Object.values(PUBLIC_FORM_CATEGORY_ALIASES).flat()));

const PUBLIC_TOOLKIT_STATE_KEY = 'tiryani-public-officer-toolkit-state';
const PUBLIC_FORMS_CACHE_KEY = 'tiryani-public-statutory-forms-cache';
const PUBLIC_FORMS_PAGE_SIZE = 20;
const PUBLIC_FORM_COLUMNS_WITHOUT_LABEL = 'id, title, description, file_url, file_type, category, created_at';

export function PublicOfficerTools() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const showStatutoryForms = location.pathname === '/officer-toolkit/statutory-forms';
  const calculatorOpen = location.pathname === '/officer-toolkit/acreage-calculator';
  const fertilizerCalculatorOpen = location.pathname === '/officer-toolkit/fertilizer-calculator';
  const [acreInput, setAcreInput] = useState(() => loadPublicToolkitState().acreInput || '');
  const [statutoryFolder, setStatutoryFolder] = useState(() => loadPublicToolkitState().statutoryFolder || 'fertilizers');
  const [statutoryPage, setStatutoryPage] = useState(() => loadPublicToolkitState().statutoryPage || 0);
  const [statutoryForms, setStatutoryForms] = useState<FormDownload[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [pdfToolOpen, setPdfToolOpen] = useState(false);
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null);
  const [previewForm, setPreviewForm] = useState<FormDownload | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [statutoryView, setStatutoryView] = useState<'generate' | 'library'>('generate');
  const [searchQuery, setSearchQuery] = useState('');
  const pdfToolOverlay = useBackButtonOverlay('public-pdf-tool', () => setPdfToolOpen(false));

  useEffect(() => {
    savePublicToolkitState({ statutoryFolder, statutoryPage, acreInput });
  }, [acreInput, statutoryFolder, statutoryPage]);

  const goBackWithinPublicToolkit = (fallbackPath: string) => {
    navigate(fallbackPath, { replace: true });
  };

  const closeToolPage = () => {
    setPdfToolOpen(false);
    goBackWithinPublicToolkit('/officer-toolkit');
  };

  const openStatutoryForms = () => {
    navigate('/officer-toolkit/statutory-forms', { state: { from: 'officer-toolkit' } });
  };

  const openAcreageCalculator = () => {
    navigate('/officer-toolkit/acreage-calculator', { state: { from: 'officer-toolkit' } });
  };

  const openFertilizerCalculator = () => {
    navigate('/officer-toolkit/fertilizer-calculator', { state: { from: 'officer-toolkit' } });
  };

  const openPdfTool = () => {
    pdfToolOverlay.pushOverlay();
    setPdfToolOpen(true);
  };

  const closePdfTool = () => {
    pdfToolOverlay.releaseOverlay();
    setPdfToolOpen(false);
  };

  useEffect(() => {
    if (!showStatutoryForms) return;
    let isCancelled = false;

    const fetchForms = async () => {
      const cachedForms = readCachedPublicForms();
      if (cachedForms.length > 0) {
        setStatutoryForms(cachedForms);
      }
      setFormsLoading(cachedForms.length === 0);

      try {
        const data = await fetchPublicFormsFromDatabase();
        if (isCancelled) return;
        setStatutoryForms(data);
        writeCachedPublicForms(data);
      } catch (error) {
        console.warn('Statutory forms fetch failed:', error);
        if (!isCancelled && cachedForms.length === 0) {
          setStatutoryForms([]);
        }
      } finally {
        if (!isCancelled) setFormsLoading(false);
      }
    };

    fetchForms();
    return () => {
      isCancelled = true;
    };
  }, [showStatutoryForms]);

  const selectedStatutoryForms = useMemo(
    () => statutoryForms.filter((form) => normalizePublicFormCategory(form.category) === statutoryFolder),
    [statutoryForms, statutoryFolder]
  );

  const filteredStatutoryForms = useMemo(
    () => selectedStatutoryForms.filter((form) => {
      const query = searchQuery.toLowerCase();
      const title = (form.label || form.title || '').toLowerCase();
      const description = (form.description || '').toLowerCase();
      return title.includes(query) || description.includes(query);
    }),
    [selectedStatutoryForms, searchQuery]
  );
  const statutoryPageCount = Math.max(1, Math.ceil(filteredStatutoryForms.length / PUBLIC_FORMS_PAGE_SIZE));
  const paginatedStatutoryForms = useMemo(
    () => filteredStatutoryForms.slice(
      statutoryPage * PUBLIC_FORMS_PAGE_SIZE,
      statutoryPage * PUBLIC_FORMS_PAGE_SIZE + PUBLIC_FORMS_PAGE_SIZE
    ),
    [filteredStatutoryForms, statutoryPage]
  );

  useEffect(() => {
    setStatutoryPage(0);
    if (statutoryFolder === 'pesticides') {
      setPdfToolOpen(false);
    }
  }, [statutoryFolder, searchQuery]);

  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const openPublicPreview = async (form: FormDownload) => {
    if (!form.file_url) return;
    // Mobile browsers cannot render PDFs inside the page, so open the blob in the
    // native viewer. The tab is opened synchronously to avoid popup blocking.
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

  const closePublicPreview = () => {
    setPreviewForm(null);
    revokeBlobUrl(previewBlobUrl);
    setPreviewBlobUrl(null);
  };

  const handlePublicDownload = async (form: FormDownload) => {
    if (!form.file_url) return;
    setDownloadingFormId(form.id);
    try {
      await downloadFileFromUrl(form.file_url, form.title);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(form.file_url, '_blank', 'noopener,noreferrer');
      alert(t('Download started in new tab. If it does not download, try right-clicking and "Save as".', 'à°¡à±Œà°¨à±à°²à±‹à°¡à± à°•à±Šà°¤à±à°¤ à°Ÿà±à°¯à°¾à°¬à±â€Œà°²à±‹ à°ªà±à°°à°¾à°°à°‚à°­à°®à±ˆà°‚à°¦à°¿. à°¡à±Œà°¨à±à°²à±‹à°¡à± à°•à°¾à°•à°ªà±‹à°¤à±‡, à°•à±à°¡à°¿-à°•à±à°²à°¿à°•à± à°šà±‡à°¸à°¿ "à°¸à±‡à°µà± à°¯à°¾à°œà±" à°ªà±à°°à°¯à°¤à±à°¨à°¿à°‚à°šà°‚à°¡à°¿.'));
    } finally {
      setDownloadingFormId(null);
    }
  };

  const acreCalculation = useMemo(() => calculateAcreValues(acreInput), [acreInput]);

    return (
      <div className="min-h-screen bg-[#eef6f0] p-2 pb-28 sm:p-3 sm:pb-24">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {showStatutoryForms ? (
            <div className="mb-4">
              <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 p-4 shadow-lg border border-emerald-800/60">
                <div className="flex items-start gap-3">
                  <BackButton onClick={closeToolPage} tone="solid" label={t('Back', 'వెనుకకు')} className="mt-0.5" />
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 dark:bg-slate-900/15 shadow-sm ring-1 ring-white/25">
                      <FileText className="h-6 w-6 text-white" aria-label="Statutory Forms" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">
                        {t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
                      </p>
                      <h1 className="text-xl font-black text-white">
                        {t('Statutory Forms', 'చట్టబద్ధ ఫారాలు')}
                      </h1>
                      <p className="text-sm font-semibold text-emerald-50">
                        {t('Generate and manage official documents', 'అధికారిక పత్రాలను సృష్టించండి మరియు నిర్వహించండి')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <BackButton
                  onClick={closeToolPage}
                  colors="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  label={t('Back', 'వెనుకకు')}
                />
                <div>
                  <h1 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                    {fertilizerCalculatorOpen
                      ? t('Fertilizer Calculator', 'ఎరువుల కాలిక్యులేటర్')
                      : t('Area Calculator', 'ఎకరాల కాలిక్యులేటర్')}
                  </h1>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <PortalLogo size="md" />
              </div>
            </div>
          )}<div className="hidden">
            <button
              type="button"
              onClick={openStatutoryForms}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 transition ${
                showStatutoryForms ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <FileText className="h-4 w-4" />
              {t('Statutory Forms', 'చట్టబద్ధ ఫారాలు')}
            </button>
            <button
              type="button"
              onClick={openAcreageCalculator}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 transition ${
                calculatorOpen ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <Calculator className="h-4 w-4" />
              {t('Area Calculator', 'à°Žà°•à°°à°¾à°² à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±')}
            </button>
            <button
              type="button"
              onClick={openFertilizerCalculator}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 transition ${
                fertilizerCalculatorOpen ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <FlaskConical className="h-4 w-4" />
              {t('Fertilizer Calculator', 'ఎరువుల కాలిక్యులేటర్')}
            </button>
          </div>
          <div className={calculatorOpen || fertilizerCalculatorOpen ? 'hidden' : ''}>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStatutoryView('generate')}
              className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all hover:shadow-md ${
                statutoryView === 'generate'
                  ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50'
                  : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('Generate Forms', 'ఫారాలను సృష్టించండి')}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 line-clamp-2">
                    {t('Create statutory forms automatically for sample drawal.', 'నమూనా డ్రాయింగ్ కోసం చట్టబద్ధ ఫారాలను స్వయంచాలకంగా సృష్టించండి.')}
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setStatutoryView('library')}
              className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all hover:shadow-md ${
                statutoryView === 'library'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50'
                  : 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                  <Download className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('Forms Library', 'ఫారాలు లైబ్రరీ')}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 line-clamp-2">
                    {t('View and download uploaded statutory forms and documents.', 'అప్‌లోడ్ చేసిన చట్టబద్ధ ఫారాలు మరియు పత్రాలను చూడండి మరియు డౌన్‌లోడ్ చేయండి.')}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <section className="mt-4 rounded-xl border border-white/70 bg-gradient-to-br from-emerald-100 dark:from-emerald-900 via-lime-50 dark:via-lime-950/60 to-cyan-100 dark:to-cyan-900 p-4 shadow-md">
              <div className="mb-4">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  {t('Select Category', 'వర్గాన్ని ఎంచుకోండి')}
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {STATUTORY_FOLDERS.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setStatutoryFolder(folder.id)}
                    className={`rounded-lg border p-2 text-left transition ${
                      statutoryFolder === folder.id
                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-md'
                        : 'border-emerald-200 bg-white text-slate-900 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">
                        {language === 'te' ? folder.telugu : folder.label}
                      </span>
                      {statutoryFolder === folder.id && (
                        <span className="text-emerald-200">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {statutoryView === 'generate' && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={openPdfTool}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 text-sm font-black text-white shadow-md transition hover:from-emerald-700 hover:to-green-700 hover:shadow-lg"
                  >
                    <FileText className="h-5 w-5" />
                    {t('Start New Sample Drawal', 'కొత్త నమూనా డ్రాయింగ్‌ను ప్రారంభించండి')}
                  </button>
                  <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">
                    {t('Create sample details and generate required statutory forms.', 'నమూనా వివరాలను సృష్టించండి మరియు అవసరమైన చట్టబద్ధ ఫారాలను సృష్టించండి.')}
                  </p>
                </div>
              )}
            </section>

          {statutoryView === 'library' && (
            <div className="mt-4">
              <div className="mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('🔍 Search forms...', '🔍 ఫారాలను వెతకండి...')}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-950 dark:text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  {t('Available Forms', 'అందుబాటులో ఉన్న ఫారాలు')}
                </h2>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {filteredStatutoryForms.length} {t('Forms', 'ఫారాలు')}
                </span>
              </div>

              {formsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-300" />
                </div>
              ) : filteredStatutoryForms.length > 0 ? (
                <div className="grid gap-2">
                  {paginatedStatutoryForms.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <FileTypeIcon fileName={form.title} fileType={form.file_type} fileUrl={form.file_url || undefined} size="sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{form.label || form.title}</h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{form.description || ''}</p>
                      </div>
                      {form.file_url && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => void openPublicPreview(form)}
                            disabled={previewLoadingId === form.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-100 disabled:opacity-50"
                            aria-label={t('Preview file', 'ఫైల్‌ను ప్రివ్యూ చేయండి')}
                            title={t('Preview', 'ప్రివ్యూ')}
                          >
                            {previewLoadingId === form.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePublicDownload(form)}
                            disabled={downloadingFormId === form.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sky-700 dark:text-sky-300 transition hover:bg-sky-100 disabled:opacity-50"
                            aria-label={t('Download file', 'ఫైల్‌ను డౌన్‌లోడ్ చేయండి')}
                            title={t('Download', 'డౌన్‌లోడ్')}
                          >
                            {downloadingFormId === form.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t('No statutory forms uploaded yet.', 'ఇంకా చట్టబద్ధ ఫారాలు అప్‌లోడ్ చేయబడలేదు.')}
                  </p>
                </div>
              )}
              {filteredStatutoryForms.length > PUBLIC_FORMS_PAGE_SIZE && (
                <PublicFormsPagination
                  currentPage={statutoryPage}
                  pageCount={statutoryPageCount}
                  onPageChange={setStatutoryPage}
                />
              )}
            </div>
          )}
          </div>
          {calculatorOpen && (
            <div className="rounded-xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-900 p-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">{t('Type or paste acre values', 'à°Žà°•à°°à°¾à°² à°µà°¿à°²à±à°µà°²à°¨à± à°Ÿà±ˆà°ªà± à°šà±‡à°¯à°‚à°¡à°¿ à°²à±‡à°¦à°¾ à°…à°¤à°¿à°•à°¿à°‚à°šà°‚à°¡à°¿')}</span>
                <textarea
                  value={acreInput}
                  onChange={(event) => setAcreInput(event.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 font-semibold text-slate-950 dark:text-white outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={'Example:\n2.10\n2.36\n0.15'}
                />
              </label>
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Paste one Excel column or type values with + signs. Format uses acres.guntas; one acre is 40 guntas.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('Total acres', 'à°®à±Šà°¤à±à°¤à°‚ à°Žà°•à°°à°¾à°²à±')}</p>
                  <p className="mt-1 text-3xl font-black text-emerald-950 dark:text-emerald-100">{acreCalculation.formatted}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    {acreCalculation.acres} acres {acreCalculation.guntas} guntas
                  </p>
                </div>
                <div className="rounded-xl border border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/40 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">{t('Hectares', 'à°¹à±†à°•à±à°Ÿà°¾à°°à±à°²à±')}</p>
                  <p className="mt-1 text-3xl font-black text-sky-950 dark:text-sky-100">{acreCalculation.hectares}</p>
                  <p className="mt-1 text-xs font-semibold text-sky-800 dark:text-sky-300">{t('Converted from total acres', 'à°®à±Šà°¤à±à°¤à°‚ à°Žà°•à°°à°¾à°² à°¨à±à°‚à°¡à°¿ à°®à°¾à°°à±à°šà°¬à°¡à°¿à°‚à°¦à°¿')}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('Read values', 'à°šà°¦à°¿à°µà°¿à°¨ à°µà°¿à°²à±à°µà°²à±')}: {acreCalculation.count} {t(acreCalculation.count === 1 ? 'item' : 'items', acreCalculation.count === 1 ? 'à°…à°‚à°¶à°‚' : 'à°…à°‚à°¶à°¾à°²à±')}
              </div>
            </div>
          )}
          {fertilizerCalculatorOpen && (
            <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-700 dark:text-emerald-300" /></div>}>
              <FertilizerCalculator />
            </Suspense>
          )}
        </div>
        {showStatutoryForms && pdfToolOpen && (
          <>
            <Suspense
              fallback={
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 text-white">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }
            >
            {statutoryFolder === 'seed' ? (
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
                <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
                  <header className="relative flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-green-100/50 dark:border-green-900/50 bg-gradient-to-r from-green-50 dark:from-green-950 via-white to-emerald-50 dark:to-emerald-950 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-green-500/5 opacity-50" />
                    <div className="relative flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25">
                        <Sprout className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600/80 dark:text-green-300/80">Seed sampling</p>
                        <h2 className="max-w-full whitespace-normal text-base leading-tight text-slate-900 dark:text-white sm:text-lg">Generate FORM II / FORM V / FORM VI / FORM VIII</h2>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closePdfTool}
                      className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 hover:border-red-700"
                      aria-label="Close seed PDF generator"
                    >
                      Close
                    </button>
                  </header>
                  <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
                    <SeedForms />
                  </div>
                </section>
              </div>
            ) : statutoryFolder === 'pesticides' ? (
              <PesticideStatutoryPdfTool onClose={closePdfTool} />
            ) : (
              <FertilizerStatutoryPdfTool onClose={closePdfTool} />
            )}
          </Suspense>
          </>
        )}
        {previewForm?.file_url && (
          <FilePreviewModal
            fileUrl={previewForm.file_url}
            fileName={previewForm.label || previewForm.title}
            fileType={previewForm.file_type}
            onClose={closePublicPreview}
          />
        )}
      </div>
    );
}

type PublicToolkitState = {
  statutoryFolder?: string;
  statutoryPage?: number;
  acreInput?: string;
};

function loadPublicToolkitState(): PublicToolkitState {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(PUBLIC_TOOLKIT_STATE_KEY) || '{}') as PublicToolkitState;
    return {
      statutoryFolder: STATUTORY_FOLDERS.some((folder) => folder.id === stored.statutoryFolder)
        ? stored.statutoryFolder
        : 'fertilizers',
      statutoryPage: Number.isInteger(stored.statutoryPage) && Number(stored.statutoryPage) >= 0
        ? Number(stored.statutoryPage)
        : 0,
      acreInput: typeof stored.acreInput === 'string' ? stored.acreInput : '',
    };
  } catch {
    return { statutoryFolder: 'fertilizers', statutoryPage: 0, acreInput: '' };
  }
}

function savePublicToolkitState(state: PublicToolkitState) {
  try {
    window.sessionStorage.setItem(PUBLIC_TOOLKIT_STATE_KEY, JSON.stringify(state));
  } catch {
    // Persisting toolkit UI state is best effort.
  }
}

function PublicFormsPagination({
  currentPage,
  pageCount,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="mt-2 flex items-center justify-end gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 disabled:opacity-50"
      >
        Previous
      </button>
      <span className="uppercase tracking-wide">
        {t('Page', 'à°ªà±‡à°œà±€')} {currentPage + 1} / {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
        disabled={currentPage >= pageCount - 1}
        className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

function calculateAcreValues(input: string) {
  const values = input.match(/\d+(?:\.\d+)?/g) || [];
  const totalGuntas = values.reduce((sum, value) => {
    const [acrePart, guntaPart = '0'] = value.split('.');
    const acres = Number.parseInt(acrePart, 10) || 0;
    const guntas = Number.parseInt(guntaPart.padEnd(2, '0').slice(0, 2), 10) || 0;
    return sum + acres * 40 + guntas;
  }, 0);
  const acres = Math.floor(totalGuntas / 40);
  const guntas = totalGuntas % 40;
  const decimalAcres = totalGuntas / 40;
  return {
    acres,
    guntas,
    count: values.length,
    formatted: `${acres}.${String(guntas).padStart(2, '0')}`,
    hectares: (decimalAcres * 0.40468564224).toFixed(4),
  };
}

async function fetchPublicFormsFromDatabase() {
  const { data, error } = await supabase
    .from('forms_downloads')
    .select(PUBLIC_FORM_COLUMNS_WITHOUT_LABEL)
    .in('category', PUBLIC_FORM_CATEGORY_VALUES)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as FormDownload[]).map(normalizePublicFormRow);
}

function normalizePublicFormCategory(category: string) {
  const normalized = String(category || '').trim().toLowerCase();
  const match = Object.entries(PUBLIC_FORM_CATEGORY_ALIASES).find(([, aliases]) => aliases.includes(normalized));
  return match?.[0] || normalized;
}

function normalizePublicFormRow(form: FormDownload): FormDownload {
  return { ...form, category: normalizePublicFormCategory(form.category) };
}

function readCachedPublicForms() {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(PUBLIC_FORMS_CACHE_KEY) || '[]') as FormDownload[];
    return Array.isArray(cached) ? cached.map(normalizePublicFormRow) : [];
  } catch {
    return [];
  }
}

function writeCachedPublicForms(forms: FormDownload[]) {
  try {
    window.sessionStorage.setItem(PUBLIC_FORMS_CACHE_KEY, JSON.stringify(forms));
  } catch {
    // Cache is best effort; statutory forms can still render empty if storage is unavailable.
  }
}
