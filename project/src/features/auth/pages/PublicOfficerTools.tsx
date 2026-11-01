import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calculator,
  Download,
  Eye,
  FileText,
  FlaskConical,
  HelpCircle,
  Layers,
  Loader2,
  Scale,
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
  import('../../sampling-hub/components/FertilizerStatutoryPdfTool')
    .then((module) => ({ default: module.FertilizerStatutoryPdfTool }))
    .catch((error) => {
      console.error('Failed to load FertilizerStatutoryPdfTool:', error);
      return { default: () => <div>Error loading fertilizer form</div> };
    })
);
const PesticideStatutoryPdfTool = lazy(() =>
  import('../../sampling-hub/components/PesticideStatutoryPdfTool').then((module) => ({ default: module.PesticideStatutoryPdfTool }))
);
const SeedForms = lazy(() =>
  import('../../sampling-hub/pages/SeedForms').then((module) => ({ default: module.SeedForms }))
);
const FertilizerCalculator = lazy(() =>
  import('../../calculators/pages/FertilizerCalculator').then((module) => ({ default: module.FertilizerCalculator }))
);

const STATUTORY_FOLDERS = [
  { id: 'fertilizers', label: 'Fertilizer', telugu: 'ఎరువులు' },
  { id: 'seed', label: 'Seed', telugu: 'విత్తనాలు' },
  { id: 'pesticides', label: 'Pesticide', telugu: 'పురుగుమందులు' },
];

const PUBLIC_TOOLKIT_STATE_KEY = 'tiryani-public-officer-toolkit-state';
const PUBLIC_FORMS_CACHE_KEY = 'tiryani-public-statutory-forms-cache';
const PUBLIC_FORMS_PAGE_SIZE = 100;

export type PublicFormSubGroup = 'sampling' | 'enforcement' | 'reference';

export interface PublicFormGroupMeta {
  id: PublicFormSubGroup;
  label: string;
  telugu: string;
  badge: string;
  badgeTelugu: string;
  description: string;
  descriptionTelugu: string;
}

export const PUBLIC_FORM_SUBGROUPS: Record<PublicFormSubGroup, PublicFormGroupMeta> = {
  sampling: {
    id: 'sampling',
    label: 'Statutory & Sampling Forms',
    telugu: 'నమూనా సేకరణ & చట్టబద్ధ ఫారాలు',
    badge: 'Sampling Form',
    badgeTelugu: 'శాంప్లింగ్ ఫారం',
    description: 'Sampling memorandums, proformas and testing request forms',
    descriptionTelugu: 'నమూనా డ్రాయింగ్ ప్రొఫార్మాలు, మెమోరాండమ్లు మరియు పరీక్ష అభ్యర్థనలు',
  },
  enforcement: {
    id: 'enforcement',
    label: 'Inspection, Stop-Sale & Seizure Orders',
    telugu: 'తనిఖీ, స్టాప్-సేల్ & జబ్తు ఉత్తర్వులు',
    badge: 'Enforcement Order',
    badgeTelugu: 'ఎన్ఫోర్స్‌మెంట్ ఉత్తర్వు',
    description: 'Stop sale orders, seizure memos, panchanama, and revocations',
    descriptionTelugu: 'స్టాప్-సేల్ ఆర్డర్లు, జబ్తు మెమోలు, పంచనామా మరియు ఉపసంహరణలు',
  },
  reference: {
    id: 'reference',
    label: 'Acts, Rules & Reference Material',
    telugu: 'చట్టాలు, నిబంధనలు & మార్గదర్శకాలు',
    badge: 'Acts & Reference',
    badgeTelugu: 'చట్టం / మార్గదర్శకం',
    description: 'Acts, official statutory rules, procedure manuals, and lists',
    descriptionTelugu: 'శాసన చట్టాలు, అధికారిక నిబంధనలు, విధాన మార్గదర్శకాలు మరియు జాబితాలు',
  },
};

export function classifyPublicForm(form: FormDownload): PublicFormSubGroup {
  const text = `${form.title || ''} ${form.label || ''} ${form.description || ''}`.toLowerCase();

  // 1. Enforcement (Stop-Sale, Seizure, Panchanama, Custody, Revocation, Chargesheet)
  // Checked first so orders mentioning an Act ("Stop Sale Order under Insecticides Act") stay under Enforcement.
  if (
    text.includes('stop sale') ||
    text.includes('stop-sale') ||
    text.includes('seizure') ||
    text.includes('seized') ||
    text.includes('panchanama') ||
    text.includes('panchanam') ||
    text.includes('chargesheet') ||
    text.includes('charge-sheet') ||
    text.includes('charge sheet') ||
    text.includes('annexure -a') ||
    text.includes('annexure-a') ||
    text.includes('annexure - a') ||
    text.includes('annexure i(') ||
    text.includes('annexure- i') ||
    text.includes('annexure-i(') ||
    text.includes('annexure ii') ||
    text.includes('annexure-ii') ||
    text.includes('form – iii') ||
    text.includes('form iii') ||
    text.includes('form-iii') ||
    text.includes('form iv') ||
    text.includes('form-iv') ||
    text.includes('form va') ||
    text.includes('form-va') ||
    text.includes('form v-b') ||
    text.includes('form vb') ||
    text.includes('form-vb') ||
    text.includes('custody') ||
    text.includes('revocation')
  ) {
    return 'enforcement';
  }

  // 2. Acts, Rules, Reference & Technical Manuals
  if (
    text.includes('act ') ||
    text.includes('act,') ||
    text.includes('act 19') ||
    text.includes('rules 19') ||
    text.includes('rules,') ||
    text.includes('control order') ||
    text.includes('(control) order') ||
    text.includes('order, 19') ||
    text.includes('order 19') ||
    text.includes('quarantine order') ||
    text.includes('handbook') ||
    text.includes('salient features') ||
    text.includes('drawal procedure') ||
    text.includes('sampling procedure') ||
    text.includes('procedure manual') ||
    text.includes('standard operating procedure') ||
    text.includes('sop') ||
    text.includes('procedure') ||
    text.includes('banned') ||
    text.includes('restricted') ||
    text.includes('major use') ||
    text.includes('registered pesticide') ||
    text.includes('formulations') ||
    text.includes('guidelines') ||
    text.includes('follow up actions') ||
    text.includes('desert locust') ||
    text.includes('public health') ||
    text.includes('house hold') ||
    text.includes('household') ||
    text.includes('rodenticide') ||
    text.includes('biostimulant')
  ) {
    return 'reference';
  }

  // 3. Default: Statutory & Sampling Forms
  return 'sampling';
}

export function getPublicFormWorkflowRank(form: FormDownload): number {
  const text = `${form.title || ''} ${form.label || ''}`.toLowerCase();
  const subGroup = classifyPublicForm(form);

  if (subGroup === 'sampling') {
    if (text === 'form i' || text.startsWith('form i ') || text.includes('form i(') || text.includes('form 1(') || text === 'form 1') return 10;
    if (
      (text === 'form ii' || text.startsWith('form ii ') || text.includes('form ii(') || text.includes('form 2')) &&
      !text.includes('iii')
    ) return 20;
    if (
      text.includes('form v(') ||
      text === 'form v' ||
      (text.includes('form v') &&
        !text.includes('vi') &&
        !text.includes('viii') &&
        !text.includes('va') &&
        !text.includes('vb'))
    ) return 30;
    if (text.includes('form vi') && !text.includes('viii')) return 40;
    if (text.includes('form viii')) return 50;
    if (text.includes('form j')) return 60;
    if (text.includes('form k')) return 70;
    if (text.includes('form p')) return 80;
    if (text.includes('covering letter')) return 90;
    if (text.includes('information slip') || text.includes('docket sheet')) return 100;
    if (text.includes('pesticide forms') || text.includes('pesticide pdf forms')) return 110;
    return 150;
  }

  if (subGroup === 'enforcement') {
    // Stop Sale orders first, immediately followed by their revocations
    if (
      text.includes('annexure -a(') ||
      text.includes('annexure-a(') ||
      text.includes('form – iii') ||
      text.includes('form iii') ||
      text.includes('form va') ||
      (text.includes('stop sale') && !text.includes('revocation'))
    ) return 210;
    if (
      text.includes('stop sale revocation') ||
      text.includes('revocation of stop sale') ||
      text.includes('annexure- i') ||
      text.includes('annexure i(')
    ) return 220;

    // Seizure memos next, followed immediately by custody bond, panchanama, and seizure revocation
    if (
      text.includes('annexure-aa') ||
      text.includes('annexure - aa') ||
      text.includes('form iv(') ||
      text.includes('form v-b') ||
      text.includes('form vb') ||
      (text.includes('seizure') && !text.includes('revocation') && !text.includes('panchanama') && !text.includes('custody'))
    ) return 230;
    if (text.includes('custody') || text.includes('bond')) return 240;
    if (text.includes('panchanama') || text.includes('panchanam')) return 250;
    if (text.includes('annexure ii') || text.includes('revocation of seizure') || (text.includes('revocation') && text.includes('seiz'))) return 260;

    if (text.includes('chargesheet') || text.includes('charge sheet')) return 270;
    return 290;
  }

  if (subGroup === 'reference') {
    if (text.includes('act 19') || text.includes('act,') || text.includes('act ')) return 310;
    if (text.includes('rules 19') || text.includes('rules,') || text.includes('rules ')) return 320;
    if (text.includes('control order') || text.includes('quarantine order') || text.includes('salient features') || text.includes('follow up')) return 330;
    if (text.includes('handbook') || text.includes('drawal procedure') || text.includes('sampling procedure') || text.includes('procedure') || text.includes('sop')) return 340;
    if (text.includes('banned') || text.includes('restricted')) return 350;
    if (text.includes('registered pesticide') || text.includes('formulations')) return 360;
    if (text.includes('desert locust')) return 362;
    if (text.includes('public health') || text.includes('household') || text.includes('house hold') || text.includes('rodenticide')) return 364;
    if (text.includes('biostimulant')) return 366;
    if (text.includes('major use of insecticides')) return 370;
    if (text.includes('major use of fungicides')) return 372;
    if (text.includes('major use of herbicides')) return 374;
    if (text.includes('major use of bio-insecticides')) return 376;
    if (text.includes('major use of pgrs')) return 378;
    return 390;
  }

  return 500;
}

export function comparePublicForms(a: FormDownload, b: FormDownload): number {
  const gA = classifyPublicForm(a);
  const gB = classifyPublicForm(b);
  const groupOrder: Record<PublicFormSubGroup, number> = { sampling: 1, enforcement: 2, reference: 3 };
  if (groupOrder[gA] !== groupOrder[gB]) {
    return groupOrder[gA] - groupOrder[gB];
  }
  const rankDiff = getPublicFormWorkflowRank(a) - getPublicFormWorkflowRank(b);
  if (rankDiff !== 0) return rankDiff;
  return (a.title || a.label || '').localeCompare(b.title || b.label || '');
}

export function PublicOfficerTools() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const samplingHubOpen = location.pathname === '/officer-toolkit/smart-sampling' || location.pathname === '/officer-toolkit/sampling-hub' || location.pathname === '/officer-toolkit/statutory-forms';
  const formsLibraryOpen = location.pathname === '/officer-toolkit/forms-library' || location.pathname === '/forms' || (!samplingHubOpen && !location.pathname.includes('calculator'));
  const showToolPage = samplingHubOpen || formsLibraryOpen;
  const calculatorOpen = location.pathname === '/officer-toolkit/acreage-calculator';
  const fertilizerCalculatorOpen = location.pathname === '/officer-toolkit/fertilizer-calculator';
  const [acreInput, setAcreInput] = useState(() => loadPublicToolkitState().acreInput || '');
  const [statutoryFolder, setStatutoryFolder] = useState(() => loadPublicToolkitState().statutoryFolder || 'fertilizers');
  const [statutoryPage, setStatutoryPage] = useState(() => loadPublicToolkitState().statutoryPage || 0);
  const [statutoryForms, setStatutoryForms] = useState<FormDownload[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [pdfToolOpen, setPdfToolOpen] = useState(false);
  const [seedInstructionOpen, setSeedInstructionOpen] = useState(true);
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null);
  const [previewForm, setPreviewForm] = useState<FormDownload | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [subGroupFilter, setSubGroupFilter] = useState<'all' | PublicFormSubGroup>('all');
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
    navigate('/officer-toolkit/smart-sampling', { state: { from: 'officer-toolkit' } });
  };

  const openFormsLibrary = () => {
    navigate('/officer-toolkit/forms-library', { state: { from: 'officer-toolkit' } });
  };

  const openAcreageCalculator = () => {
    navigate('/officer-toolkit/acreage-calculator', { state: { from: 'officer-toolkit' } });
  };

  const openFertilizerCalculator = () => {
    navigate('/officer-toolkit/fertilizer-calculator', { state: { from: 'officer-toolkit' } });
  };

  const openPdfTool = () => {
    setSeedInstructionOpen(true);
    pdfToolOverlay.pushOverlay();
    setPdfToolOpen(true);
  };

  const closePdfTool = () => {
    pdfToolOverlay.releaseOverlay();
    setPdfToolOpen(false);
  };

  useEffect(() => {
    if (!formsLibraryOpen) return;
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
  }, [formsLibraryOpen]);

  const selectedStatutoryForms = useMemo(() => {
    const list = statutoryForms.filter((form) => normalizePublicFormCategory(form.category) === statutoryFolder);
    return [...list].sort(comparePublicForms);
  }, [statutoryForms, statutoryFolder]);

  const subGroupCounts = useMemo(() => {
    const counts: Record<'all' | PublicFormSubGroup, number> = {
      all: selectedStatutoryForms.length,
      sampling: 0,
      enforcement: 0,
      reference: 0,
    };
    for (const form of selectedStatutoryForms) {
      const g = classifyPublicForm(form);
      counts[g] = (counts[g] || 0) + 1;
    }
    return counts;
  }, [selectedStatutoryForms]);

  const filteredStatutoryForms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return selectedStatutoryForms.filter((form) => {
      if (subGroupFilter !== 'all' && classifyPublicForm(form) !== subGroupFilter) {
        return false;
      }
      if (!query) return true;
      const title = (form.label || form.title || '').toLowerCase();
      const description = (form.description || '').toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [selectedStatutoryForms, subGroupFilter, searchQuery]);

  const groupedForms = useMemo(() => {
    const groups: {
      meta: PublicFormGroupMeta;
      icon: typeof FileText;
      colorClasses: {
        badge: string;
        headerBg: string;
        headerBorder: string;
        headerText: string;
      };
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

    for (const form of filteredStatutoryForms) {
      const g = classifyPublicForm(form);
      const target = groups.find((item) => item.meta.id === g);
      if (target) {
        target.forms.push(form);
      }
    }

    return groups.filter((g) => g.forms.length > 0);
  }, [filteredStatutoryForms]);

  const otherMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return STATUTORY_FOLDERS.filter((f) => f.id !== statutoryFolder)
      .map((f) => {
        const matchCount = statutoryForms.filter(
          (form) =>
            normalizePublicFormCategory(form.category) === f.id &&
            ((form.label || form.title || '').toLowerCase().includes(query) ||
              (form.description || '').toLowerCase().includes(query))
        ).length;
        return { ...f, matchCount };
      })
      .filter((f) => f.matchCount > 0);
  }, [statutoryForms, statutoryFolder, searchQuery]);

  const statutoryPageCount = Math.max(1, Math.ceil(filteredStatutoryForms.length / PUBLIC_FORMS_PAGE_SIZE));
  const paginatedStatutoryForms = useMemo(
    () => filteredStatutoryForms.slice(
      statutoryPage * PUBLIC_FORMS_PAGE_SIZE,
      statutoryPage * PUBLIC_FORMS_PAGE_SIZE + PUBLIC_FORMS_PAGE_SIZE
    ),
    [filteredStatutoryForms, statutoryPage]
  );

  useEffect(() => {
    setSubGroupFilter('all');
    setStatutoryPage(0);
    if (statutoryFolder === 'pesticides') {
      setPdfToolOpen(false);
    }
  }, [statutoryFolder]);

  useEffect(() => {
    setStatutoryPage(0);
  }, [searchQuery, subGroupFilter]);

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
      alert(t('Download started in new tab. If it does not download, try right-clicking and "Save as".', 'డౌన్లోడ్ కొత్త ట్యాబ్‌లో ప్రారంభమైంది. డౌన్లోడ్ కాకపోతే, కుడి-క్లిక్ చేసి "సేవ్ యాజ్" ప్రయత్నించండి.'));
    } finally {
      setDownloadingFormId(null);
    }
  };

  const renderPublicFormCard = (form: FormDownload) => {
    const subGroup = classifyPublicForm(form);
    const meta = PUBLIC_FORM_SUBGROUPS[subGroup];
    const badgeClasses =
      subGroup === 'sampling'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
        : subGroup === 'enforcement'
        ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300'
        : 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300';

    return (
      <div
        key={form.id}
        className="group flex items-center justify-between gap-2.5 sm:gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 transition duration-150 hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-700/60"
      >
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
            <FileTypeIcon fileName={form.title} fileType={form.file_type} fileUrl={form.file_url || undefined} size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${badgeClasses}`}>
                {language === 'te' ? meta.badgeTelugu : meta.badge}
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug break-words">
              {form.label || form.title}
            </h3>
            {form.description && (
              <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-2">
                {form.description}
              </p>
            )}
          </div>
        </div>
        {form.file_url && (
          <div className="flex items-center gap-1.5 shrink-0 justify-end">
            <button
              type="button"
              onClick={() => void openPublicPreview(form)}
              disabled={previewLoadingId === form.id}
              className="inline-flex h-9 w-9 sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-0 sm:px-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 disabled:opacity-50"
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
              onClick={() => handlePublicDownload(form)}
              disabled={downloadingFormId === form.id}
              className="inline-flex h-9 w-9 sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-0 sm:px-3 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
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
          </div>
        )}
      </div>
    );
  };

  const acreCalculation = useMemo(() => calculateAcreValues(acreInput), [acreInput]);

    return (
      <div className="min-h-screen bg-[#eef6f0] p-2 pb-28 sm:p-3 sm:pb-24">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          {showToolPage ? (
            <div className="mb-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 p-4 shadow-lg border border-emerald-800/60">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
                <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <BackButton onClick={closeToolPage} tone="solid" label={t('Back', 'వెనుకకు')} className="mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                        <FileText className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" aria-label={samplingHubOpen ? 'Smart Sampling' : 'Forms & Library'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-100 mb-0.5">
                          {t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
                        </p>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug tracking-tight">
                          {samplingHubOpen ? t('Smart Sampling', 'స్మార్ట్ సాంప్లింగ్') : t('Forms & Library', 'ఫారాలు & లైబ్రరీ')}
                        </h1>
                        <p className="mt-0.5 text-xs sm:text-sm font-medium text-emerald-50 leading-snug max-w-3xl">
                          {samplingHubOpen
                            ? t('Create sample drawal forms for seed, fertilizer & pesticide', 'విత్తనం, ఎరువు & పురుగుమందు నమూనా డ్రాయింగ్ ఫారాలను సృష్టించండి')
                            : t('Download statutory forms, proformas and official documents', 'చట్టబద్ధ ఫారాలు, ప్రొఫార్మాలు మరియు అధికారిక పత్రాలను డౌన్‌లోడ్ చేయండి')}
                        </p>
                      </div>
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
                samplingHubOpen ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <FileText className="h-4 w-4" />
              {t('Smart Sampling', 'స్మార్ట్ సాంప్లింగ్')}
            </button>
            <button
              type="button"
              onClick={openFormsLibrary}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 transition ${
                formsLibraryOpen ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <Download className="h-4 w-4" />
              {t('Forms & Library', 'ఫారాలు & లైబ్రరీ')}
            </button>
            <button
              type="button"
              onClick={openAcreageCalculator}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 transition ${
                calculatorOpen ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <Calculator className="h-4 w-4" />
              {t('Area Calculator', 'ఎకరాల కాలిక్యులేటర్')}
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
          <section className="rounded-2xl border border-white/70 bg-gradient-to-br from-emerald-100 dark:from-emerald-900 via-lime-50 dark:via-lime-950/60 to-cyan-100 dark:to-cyan-900 p-4 sm:p-5 shadow-md">
              <div className="mb-4">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  {t('Select Category', 'వర్గాన్ని ఎంచుకోండి')}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {STATUTORY_FOLDERS.map((folder) => {
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setStatutoryFolder(folder.id)}
                      className={`flex min-h-[48px] sm:h-[52px] items-center justify-between rounded-xl border px-4 py-2.5 text-left transition duration-200 ${
                        statutoryFolder === folder.id
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-900/15'
                          : 'border-emerald-200/90 bg-white text-slate-800 shadow-xs hover:border-emerald-400 hover:bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <span className="text-sm font-black">
                        {language === 'te' ? folder.telugu : folder.label}
                      </span>
                      {statutoryFolder === folder.id && (
                        <span className="shrink-0 text-xs font-black text-emerald-100">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {samplingHubOpen && (
                <div className="mt-5 flex flex-col items-center justify-center text-center">
                  <button
                    type="button"
                    onClick={openPdfTool}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 text-sm font-black text-white shadow-md shadow-emerald-950/15 transition hover:from-emerald-700 hover:to-green-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-900 sm:min-w-[280px] sm:max-w-md"
                  >
                    <FileText className="h-5 w-5" />
                    {t('Start New Sample Drawal', 'కొత్త నమూనా డ్రాయింగ్‌ను ప్రారంభించండి')}
                  </button>
                  <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300 max-w-md">
                    {t('Create sample details and generate required statutory forms.', 'నమూనా వివరాలను సృష్టించండి మరియు అవసరమైన చట్టబద్ధ ఫారాలను సృష్టించండి.')}
                  </p>
                </div>
              )}
            </section>

          {formsLibraryOpen && (
            <div className="mt-4 space-y-3">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('🔍 Search forms, acts, orders & manuals...', '🔍 ఫారాలు, చట్టాలు, ఆర్డర్లు & మాన్యువల్స్ వెతకండి...')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-950 dark:text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
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
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
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
                  {filteredStatutoryForms.length} {t(filteredStatutoryForms.length === 1 ? 'Form' : 'Forms', filteredStatutoryForms.length === 1 ? 'ఫారం' : 'ఫారాలు')}
                </span>
              </div>

              {formsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-300" />
                </div>
              ) : filteredStatutoryForms.length > 0 ? (
                subGroupFilter === 'all' ? (
                  <div className="space-y-5">
                    {groupedForms.map((group) => (
                      <div key={group.meta.id} className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 pt-1">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-md border ${group.colorClasses.badge}`}>
                              <group.icon className="h-3.5 w-3.5" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                              {language === 'te' ? group.meta.telugu : group.meta.label}
                            </h3>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {group.forms.length} {t(group.forms.length === 1 ? 'item' : 'items', group.forms.length === 1 ? 'అంశం' : 'అంశాలు')}
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {group.forms.map(renderPublicFormCard)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {paginatedStatutoryForms.map(renderPublicFormCard)}
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
                          onClick={() => setStatutoryFolder(m.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                        >
                          {language === 'te' ? m.telugu : m.label} ({m.matchCount})
                        </button>
                      ))}
                    </div>
                  )}
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
                <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">{t('Type or paste acre values', 'ఎకరాల విలువలను టైప్ చేయండి లేదా అతికించండి')}</span>
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
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('Total acres', 'మొత్తం ఎకరాలు')}</p>
                  <p className="mt-1 text-3xl font-black text-emerald-950 dark:text-emerald-100">{acreCalculation.formatted}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    {acreCalculation.acres} acres {acreCalculation.guntas} guntas
                  </p>
                </div>
                <div className="rounded-xl border border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/40 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">{t('Hectares', 'హెక్టార్లు')}</p>
                  <p className="mt-1 text-3xl font-black text-sky-950 dark:text-sky-100">{acreCalculation.hectares}</p>
                  <p className="mt-1 text-xs font-semibold text-sky-800 dark:text-sky-300">{t('Converted from total acres', 'మొత్తం ఎకరాల నుండి మార్చబడింది')}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('Read values', 'చదివిన విలువలు')}: {acreCalculation.count} {t(acreCalculation.count === 1 ? 'item' : 'items', acreCalculation.count === 1 ? 'అంశం' : 'అంశాలు')}
              </div>
            </div>
          )}
          {fertilizerCalculatorOpen && (
            <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-700 dark:text-emerald-300" /></div>}>
              <FertilizerCalculator />
            </Suspense>
          )}
        </div>
        {samplingHubOpen && pdfToolOpen && (
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
                <section className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
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
                    <div className="relative flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSeedInstructionOpen(true)}
                        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-lime-200 dark:border-lime-800/60 bg-lime-50 dark:bg-lime-950/40 px-2.5 py-1.5 text-xs font-bold text-lime-700 dark:text-lime-300 shadow-sm transition hover:bg-lime-100 dark:hover:bg-lime-900/60"
                        title="View Seed Sample Drawal Procedure"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Procedure</span>
                      </button>
                      <button
                        type="button"
                        onClick={closePdfTool}
                        className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-red-700 hover:border-red-700"
                        aria-label="Close seed PDF generator"
                      >
                        Close
                      </button>
                    </div>
                  </header>
                  <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
                    <SeedForms
                      showInstructionModal={seedInstructionOpen}
                      setShowInstructionModal={setSeedInstructionOpen}
                    />
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
        {t('Page', 'పేజీ')} {currentPage + 1} / {pageCount}
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

async function fetchPublicFormsFromDatabase() {
  const { data, error } = await withNetworkRetry(() =>
    supabase
      .from('forms_downloads')
      .select('id, title, description, file_url, file_type, category, created_at')
  );

  if (error) throw error;
  const list = ((data || []) as FormDownload[]).map(normalizePublicFormRow);
  return list.sort(comparePublicForms);
}

function normalizePublicFormCategory(category: string) {
  const normalized = String(category || '').trim().toLowerCase();
  if (normalized === 'fertilizer' || normalized === 'fertilizers') return 'fertilizers';
  if (normalized === 'seed' || normalized === 'seeds') return 'seed';
  if (normalized === 'pesticide' || normalized === 'pesticides') return 'pesticides';
  return normalized || 'fertilizers';
}

function normalizePublicFormRow(form: FormDownload): FormDownload {
  return { ...form, category: normalizePublicFormCategory(form.category) };
}

function readCachedPublicForms() {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(PUBLIC_FORMS_CACHE_KEY) || '[]') as FormDownload[];
    if (!Array.isArray(cached)) return [];
    return cached.map(normalizePublicFormRow).sort(comparePublicForms);
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
