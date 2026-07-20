import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  Download,
  Eye,
  UsersRound,
  FileText,
  FlaskConical,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
  Smartphone,
  Store,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { FileTypeIcon } from './ui/FileTypeIcon';
import { PortalLogo } from './ui/PortalLogo';
import { LanguageToggle } from './ui/LanguageToggle';
import { DEALER_DEFAULT_PASSWORD } from '../lib/dealerAuth';
import { translateDealerLoginError } from '../lib/dealerLoginMessages';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { downloadFileFromUrl } from '../lib/fileBlob';
import { recordSiteHit, fetchSiteHitSummary, SiteHitSummary } from '../lib/siteHits';
import { FormDownload } from '../types/database';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBackButtonOverlay } from '../hooks/useBackButtonOverlay';

const FilePreviewModal = lazy(() =>
  import('./ui/FilePreviewModal').then((module) => ({ default: module.FilePreviewModal }))
);
const FertilizerStatutoryPdfTool = lazy(() =>
  import('./forms/FertilizerStatutoryPdfTool').then((module) => ({ default: module.FertilizerStatutoryPdfTool }))
);
const PesticideStatutoryPdfTool = lazy(() =>
  import('./forms/PesticideStatutoryPdfTool').then((module) => ({ default: module.PesticideStatutoryPdfTool }))
);
const SeedForms = lazy(() =>
  import('../pages/SeedForms').then((module) => ({ default: module.SeedForms }))
);
const FertilizerCalculator = lazy(() =>
  import('../features/fertilizerCalculator/FertilizerCalculatorCore').then((module) => ({ default: module.FertilizerCalculatorCore }))
);

const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';
const TEST_EMAIL = 'test@gmail.com';
const TEST_PASSWORD = 'Test@123';

function WhatsAppIcon({ className = '' }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.03 3.2A12.73 12.73 0 0 0 5.11 22.5L3.7 28.8l6.45-1.52a12.74 12.74 0 1 0 5.88-24.08Zm0 2.34a10.4 10.4 0 1 1-5.08 19.47l-.4-.23-3.9.92.86-3.8-.25-.41A10.39 10.39 0 0 1 16.03 5.54Zm-4.3 5.12c-.22 0-.58.08-.88.42-.3.33-1.16 1.13-1.16 2.76 0 1.62 1.18 3.19 1.34 3.41.17.22 2.28 3.65 5.63 4.97 2.78 1.09 3.35.87 3.95.81.6-.05 1.95-.79 2.22-1.56.28-.77.28-1.43.2-1.57-.08-.14-.3-.22-.63-.39-.33-.16-1.95-.96-2.25-1.07-.3-.11-.52-.17-.74.16-.22.33-.85 1.07-1.04 1.29-.19.22-.38.25-.71.08-.33-.16-1.39-.51-2.64-1.63-.98-.87-1.64-1.95-1.83-2.28-.19-.33-.02-.51.14-.67.15-.15.33-.38.49-.57.16-.19.22-.33.33-.55.11-.22.06-.41-.03-.57-.08-.17-.74-1.79-1.02-2.45-.27-.64-.54-.55-.74-.56h-.64Z" />
    </svg>
  );
}

const STATUTORY_FOLDERS = [
  { id: 'fertilizers', label: 'Fertilizer', telugu: 'à°Žà°°à±à°µà±à°²à±' },
  { id: 'seed', label: 'Seed', telugu: 'à°µà°¿à°¤à±à°¤à°¨à°¾à°²à±' },
  { id: 'pesticides', label: 'Pesticide', telugu: 'à°ªà±à°°à±à°—à±à°®à°‚à°¦à±à°²à±' },
];

const PUBLIC_FORM_CATEGORY_ALIASES: Record<string, string[]> = {
  fertilizers: ['fertilizers', 'fertilizer'],
  seed: ['seed', 'seeds'],
  pesticides: ['pesticides', 'pesticide'],
};
const PUBLIC_FORM_CATEGORY_VALUES = Array.from(new Set(Object.values(PUBLIC_FORM_CATEGORY_ALIASES).flat()));

const PUBLIC_TOOLKIT_STATE_KEY = 'tiryani-public-officer-toolkit-state';
const PUBLIC_FORMS_CACHE_KEY = 'tiryani-public-statutory-forms-cache';
const PUBLIC_FORMS_PAGE_SIZE = 10;
const PUBLIC_FORM_COLUMNS = 'id, title, label, description, file_url, file_type, category, created_at';
const PUBLIC_FORM_COLUMNS_WITHOUT_LABEL = 'id, title, description, file_url, file_type, category, created_at';

const TELANGANA_DISTRICTS = [
  'Adilabad',
  'Bhadradri Kothagudem',
  'Hanumakonda',
  'Hyderabad',
  'Jagtial',
  'Jangaon',
  'Jayashankar Bhupalpally',
  'Jogulamba Gadwal',
  'Kamareddy',
  'Karimnagar',
  'Khammam',
  'Kumuram Bheem Asifabad',
  'Mahabubabad',
  'Mahabubnagar',
  'Mancherial',
  'Medak',
  'Medchal-Malkajgiri',
  'Mulugu',
  'Nagarkurnool',
  'Nalgonda',
  'Narayanpet',
  'Nirmal',
  'Nizamabad',
  'Peddapalli',
  'Rajanna Sircilla',
  'Rangareddy',
  'Sangareddy',
  'Siddipet',
  'Suryapet',
  'Vikarabad',
  'Wanaparthy',
  'Warangal',
  'Yadadri Bhuvanagiri',
];

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState<'staff' | 'dealer'>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dealerPhone, setDealerPhone] = useState('');
  const [dealerPassword, setDealerPassword] = useState(DEALER_DEFAULT_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [grievanceOpen, setGrievanceOpen] = useState(false);
  const [acreInput, setAcreInput] = useState(() => loadPublicToolkitState().acreInput || '');
  const [grievanceStatus, setGrievanceStatus] = useState<string | null>(null);
  const showOfficerToolkit = location.pathname === '/officer-toolkit';
  const showStatutoryForms = location.pathname === '/officer-toolkit/statutory-forms';
  const calculatorOpen = location.pathname === '/officer-toolkit/acreage-calculator';
  const fertilizerCalculatorOpen = location.pathname === '/officer-toolkit/fertilizer-calculator';
  const [statutoryFolder, setStatutoryFolder] = useState(() => loadPublicToolkitState().statutoryFolder || 'fertilizers');
  const [statutoryPage, setStatutoryPage] = useState(() => loadPublicToolkitState().statutoryPage || 0);
  const [statutoryForms, setStatutoryForms] = useState<FormDownload[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [previewForm, setPreviewForm] = useState<FormDownload | null>(null);
  const [pdfToolOpen, setPdfToolOpen] = useState(false);
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [appInstalled, setAppInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
  const [siteHitSummary, setSiteHitSummary] = useState<SiteHitSummary | null>(null);
  const [grievance, setGrievance] = useState({
    farmer_name: '',
    mobile: '',
    email: '',
    district: 'Kumuram Bheem Asifabad',
    mandal: '',
    issue_type: 'fertilizer',
    subject: '',
    description: '',
  });

  const { signIn, signInDealer } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const previewOverlay = useBackButtonOverlay('public-file-preview', () => setPreviewForm(null));
  const pdfToolOverlay = useBackButtonOverlay('public-pdf-tool', () => setPdfToolOpen(false));
  const grievanceOverlay = useBackButtonOverlay('public-grievance', () => setGrievanceOpen(false));

  useEffect(() => {
    savePublicToolkitState({ statutoryFolder, statutoryPage, acreInput });
  }, [acreInput, statutoryFolder, statutoryPage]);

  const goBackWithinPublicToolkit = (fallbackPath: string) => {
    navigate(fallbackPath, { replace: true });
  };

  const closeToolPage = () => {
    setPreviewForm(null);
    setPdfToolOpen(false);
    goBackWithinPublicToolkit('/officer-toolkit');
  };

  const openOfficerToolkit = () => {
    void recordSiteHit({ path: '/officer-toolkit', countOncePerSession: false });
    navigate('/officer-toolkit', { state: { from: 'login' } });
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

  const closeAcreageCalculator = () => {
    goBackWithinPublicToolkit('/officer-toolkit');
  };

  const openPdfTool = () => {
    pdfToolOverlay.pushOverlay();
    setPdfToolOpen(true);
  };

  const closePdfTool = () => {
    pdfToolOverlay.releaseOverlay();
    setPdfToolOpen(false);
  };

  const openGrievance = () => {
    grievanceOverlay.pushOverlay();
    setGrievanceOpen(true);
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallMessage(null);
    };

    const handleAppInstalled = () => {
      setAppInstalled(true);
      setInstallPrompt(null);
      setInstallMessage(t('App installed successfully.', 'App installed successfully.'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [t]);

  useEffect(() => {
    void fetchSiteHitSummary().then(setSiteHitSummary).catch(() => {});
  }, []);

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
  const statutoryPageCount = Math.max(1, Math.ceil(selectedStatutoryForms.length / PUBLIC_FORMS_PAGE_SIZE));
  const paginatedStatutoryForms = useMemo(
    () => selectedStatutoryForms.slice(
      statutoryPage * PUBLIC_FORMS_PAGE_SIZE,
      statutoryPage * PUBLIC_FORMS_PAGE_SIZE + PUBLIC_FORMS_PAGE_SIZE
    ),
    [selectedStatutoryForms, statutoryPage]
  );

  useEffect(() => {
    setStatutoryPage(0);
    if (statutoryFolder === 'pesticides') {
      setPdfToolOpen(false);
    }
  }, [statutoryFolder]);

  const openPublicPreview = (form: FormDownload) => {
    if (!form.file_url) return;
    previewOverlay.pushOverlay();
    setPreviewForm(form);
  };

  const closePublicPreview = () => {
    previewOverlay.closeOverlay();
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

  const handleTestLogin = () => {
    setEmail(TEST_EMAIL);
    setPassword(TEST_PASSWORD);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (loginMode === 'dealer') {
      const { error: signInError } = await signInDealer(dealerPhone, dealerPassword);
      if (signInError) {
        setError(translateDealerLoginError(signInError.message, language === 'te'));
      }
      setLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { error: signInError } = await signIn(normalizedEmail, password);

    if (signInError) {
      setError(
        normalizedEmail === ADMIN_EMAIL
          ? t('Admin login failed. Please check the admin email and password.', 'Admin login failed. Please check the admin email and password.')
          : t('Login failed. Please use the assigned test login details.', 'Login failed. Please use the assigned test login details.')
      );
    } else if (normalizedEmail === TEST_EMAIL) {
      void recordSiteHit({ path: '/login/test-login', countOncePerSession: false });
    }

    setLoading(false);
  };

  const handleGrievanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrievanceStatus(null);

    const subject = grievance.subject.trim() || `Farmer grievance - ${grievance.issue_type}`;
    const body = [
      `Farmer Name: ${grievance.farmer_name}`,
      `Mobile: ${grievance.mobile}`,
      `Email: ${grievance.email || 'Not provided'}`,
      `District: ${grievance.district}`,
      `Mandal: ${grievance.mandal}`,
      `Complaint Type: ${grievance.issue_type}`,
      `Subject: ${subject}`,
      '',
      grievance.description,
    ].join('\n');

    try {
      await supabase.from('farmer_grievances').insert([{
        farmer_name: grievance.farmer_name.trim(),
        village: grievance.mandal.trim(),
        phone: grievance.mobile.trim(),
        issue_type: grievance.issue_type,
        message: body,
        email_to: ADMIN_EMAIL,
      }]);
    } catch (err) {
      console.warn('Grievance table insert skipped:', err);
    }

    window.location.href = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setGrievanceStatus(t('Complaint prepared for email. Please send it from your mail app.', 'Complaint prepared for email. Please send it from your mail app.'));
    setGrievance({
      farmer_name: '',
      mobile: '',
      email: '',
      district: 'Kumuram Bheem Asifabad',
      mandal: '',
      issue_type: 'fertilizer',
      subject: '',
      description: '',
    });
  };

  const handleInstallApp = async () => {
    if (appInstalled) {
      setInstallMessage(t('App is already installed.', 'App is already installed.'));
      return;
    }

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        setInstallPrompt(null);
        setInstallMessage(
          choice.outcome === 'accepted'
            ? t('Installing app...', 'Installing app...')
            : t('Install cancelled. Tap Install App again when the browser prompt is available.', 'Install cancelled. Tap Install App again when the browser prompt is available.')
        );
      } catch {
        setInstallMessage(t('Use your browser menu and choose Install app.', 'à°¬à±à°°à±Œà°œà°°à± à°®à±†à°¨à±‚à°²à±‹ Install app à°Žà°‚à°šà±à°•à±‹à°‚à°¡à°¿.'));
      }
      return;
    }
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.ready;
      } catch (error) {
        console.warn('Service worker not ready for install:', error);
      }
    }

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isIos) {
      setInstallMessage(t('Use your browser menu and choose Install app. If it is not visible, refresh once and tap Install App again.', 'Use your browser menu and choose Install app. If it is not visible, refresh once and tap Install App again.'));
      return;
    }

    setInstallMessage(t('On iPhone/iPad: tap Share, then Add to Home Screen.', 'On iPhone/iPad: tap Share, then Add to Home Screen.'));
  };

  // Officer toolkit is now handled by App.tsx with OfficersToolkit component
  // This prevents the old toolkit from flashing before the new one loads
  if (showOfficerToolkit) {
    return null;
  }

  if (showStatutoryForms || calculatorOpen || fertilizerCalculatorOpen) {
    return (
      <div className="min-h-screen bg-[#eef6f0] p-2 pb-28 sm:p-3 sm:pb-24">
        <div className="mx-auto w-full max-w-4xl rounded-lg border border-white/70 bg-white/95 p-3 shadow-xl shadow-emerald-950/10 sm:p-4">
          {showStatutoryForms ? (
            <section className="mb-4 overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 p-4 text-white shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 shadow-sm ring-1 ring-white/20">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-100">
                      {t('Officer Toolkit', 'Officer Toolkit')}
                    </p>
                    <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                      {t('Statutory Forms', 'చట్టబద్ధ ఫారాలు')}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-emerald-50">
                      {t('Generate PDFs and view statutory form files', 'Generate PDFs and view statutory form files')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeToolPage}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-black text-white shadow-sm ring-1 ring-white/20 transition hover:bg-white/25"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('Back', 'వెనుకకు')}
                </button>
              </div>
            </section>
          ) : (
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeToolPage}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('Back', 'వెనుకకు')}
                </button>
                <div>
                  <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
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
              {t('Statutory Forms', 'à°šà°Ÿà±à°Ÿà°¬à°¦à±à°§ à°«à°¾à°°à°¾à°²à±')}
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
              {t('Fertilizer Calculator', 'à°Žà°°à±à°µà±à°² à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±')}
            </button>
          </div>
          <div className={calculatorOpen || fertilizerCalculatorOpen ? 'hidden' : ''}>
          <section className="rounded-xl border border-white/70 bg-gradient-to-br from-emerald-100 via-lime-50 to-cyan-100 p-4 shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-950 sm:text-xl">Auto Form Generator</h2>
                  <p className="text-sm font-semibold text-slate-600">Generate statutory PDF forms for the selected category.</p>
                </div>
              </div>
              <div className="grid w-full gap-2 sm:w-auto sm:min-w-[18rem] sm:grid-cols-[minmax(0,1fr)_auto]">
                <select
                  value={statutoryFolder}
                  onChange={(event) => setStatutoryFolder(event.target.value)}
                  className="min-h-11 rounded-lg border border-emerald-200 bg-white/90 px-3 py-2 text-sm font-black text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  aria-label="Select statutory form category"
                >
                  {STATUTORY_FOLDERS.map((folder) => (
                    <option key={folder.id} value={folder.id}>{language === 'te' ? folder.telugu : folder.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openPdfTool}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white shadow-md shadow-red-900/10 transition hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-red-700 hover:shadow-lg"
                >
                  <FileText className="h-4 w-4" />
                  Generate PDF
                </button>
              </div>
            </div>
<div className="mt-4 table-scroll rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[430px] table-fixed text-left">
              <thead className="sticky top-0 z-10 bg-slate-900 text-xs font-bold text-white sm:text-sm">
                <tr>
                  <th className="w-14 px-2.5 py-2 sm:w-16">{t('S.No.', 'à°•à±à°°.à°¸à°‚.')}</th>
                  <th className="px-2.5 py-2">{t('Proforma / Form Name', 'à°ªà±à°°à±Šà°«à°¾à°°à±à°®à°¾ / à°«à°¾à°°à°‚ à°ªà±‡à°°à±')}</th>
                  <th className="w-24 px-2.5 py-2 text-right">{t('Action', 'à°šà°°à±à°¯')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formsLoading ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-sm font-semibold text-slate-500">
                      {t('Loading forms...', 'à°«à°¾à°°à°¾à°²à± à°²à±‹à°¡à± à°…à°µà±à°¤à±à°¨à±à°¨à°¾à°¯à°¿...')}
                    </td>
                  </tr>
                ) : selectedStatutoryForms.length > 0 ? (
                  paginatedStatutoryForms.map((form, index) => (
                    <tr key={form.id} className="hover:bg-emerald-50/60">
                      <td className="px-2.5 py-2 align-middle text-sm font-bold text-slate-600">{statutoryPage * PUBLIC_FORMS_PAGE_SIZE + index + 1}</td>
                      <td className="px-2.5 py-2 align-middle">
                        <div className="flex w-full min-w-0 items-center gap-2 text-left">
                          <FileTypeIcon fileName={form.title} fileType={form.file_type} fileUrl={form.file_url || undefined} size="sm" />
                          <span className="block min-w-0 truncate text-sm font-bold text-slate-950 sm:text-base">{form.label || form.title}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-2 align-middle">
                        <div className="flex items-center justify-end">
                          {form.file_url && (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openPublicPreview(form)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-700 transition hover:bg-emerald-50"
                                aria-label={t('Preview file', 'à°«à±ˆà°²à± à°ªà±à°°à°¿à°µà±à°¯à±‚')}
                                title={t('Preview', 'à°ªà±à°°à°¿à°µà±à°¯à±‚')}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePublicDownload(form)}
                                disabled={downloadingFormId === form.id}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                                aria-label={t('Download file', 'à°«à±ˆà°²à± à°¡à±Œà°¨à±à°²à±‹à°¡à± à°šà±‡à°¯à°‚à°¡à°¿')}
                                title={t('Download', 'à°¡à±Œà°¨à±à°²à±‹à°¡à±')}
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                      {t('No statutory forms uploaded yet.', 'à°‡à°‚à°•à°¾ à°«à°¾à°°à°¾à°²à± à°…à°ªà±à°²à±‹à°¡à± à°•à°¾à°²à±‡à°¦à±.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {selectedStatutoryForms.length > PUBLIC_FORMS_PAGE_SIZE && (
            <PublicFormsPagination
              currentPage={statutoryPage}
              pageCount={statutoryPageCount}
              onPageChange={setStatutoryPage}
            />
          )}
                    </section>
          </div>
          {calculatorOpen && (
            <div className="rounded-xl border border-sky-100 bg-white p-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Type or paste acre values</span>
                <textarea
                  value={acreInput}
                  onChange={(event) => setAcreInput(event.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-950 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder={'Example:\n2.10\n2.36\n0.15'}
                />
              </label>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Paste one Excel column or type values with + signs. Format uses acres.guntas; one acre is 40 guntas.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Total acres</p>
                  <p className="mt-1 text-3xl font-black text-emerald-950">{acreCalculation.formatted}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-800">
                    {acreCalculation.acres} acres {acreCalculation.guntas} guntas
                  </p>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-700">Hectares</p>
                  <p className="mt-1 text-3xl font-black text-sky-950">{acreCalculation.hectares}</p>
                  <p className="mt-1 text-xs font-semibold text-sky-800">Converted from total acres</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                Read values: {acreCalculation.count} item{acreCalculation.count === 1 ? '' : 's'}
              </div>
            </div>
          )}
          {fertilizerCalculatorOpen && (
            <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-700" /></div>}>
              <FertilizerCalculator />
            </Suspense>
          )}
        </div>
        {showStatutoryForms && previewForm?.file_url && (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <FilePreviewModal
              fileUrl={previewForm.file_url}
              fileName={previewForm.title}
              fileType={previewForm.file_type}
              onClose={closePublicPreview}
            />
          </Suspense>
        )}
        {showStatutoryForms && pdfToolOpen && (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            {statutoryFolder === 'seed' ? (
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
                <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl">
                  <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Seed sampling</p>
                      <h2 className="max-w-full whitespace-normal text-sm font-black leading-snug text-slate-950 sm:text-base">Generate FORM II / FORM V / FORM VI / FORM VIII</h2>
                    </div>
                    <button
                      type="button"
                      onClick={closePdfTool}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg bg-red-700 px-3 py-2 text-white hover:bg-red-800"
                      aria-label="Close seed PDF generator"
                    >
                      <X className="h-4 w-4" />
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
        )}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef6f0] p-2 pb-28 sm:p-3 sm:pb-24 lg:p-4 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(4,120,87,0.08),rgba(14,165,233,0.08)_48%,rgba(250,204,21,0.08))]" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl shadow-emerald-950/10 backdrop-blur-sm animate-fadeIn">
        <section className="flex flex-col justify-start p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 flex flex-col items-center gap-4 text-center animate-slide-up">
              <div className="login-logo-hero inline-flex">
                <PortalLogo size="xl" />
              </div>
              <div>
                <h2 className="whitespace-nowrap text-xl font-black tracking-tight text-slate-950 sm:text-2xl font-[var(--font-stylish)]">
                  {t('AGRONIX', 'AGRONIX')}
                </h2>
                <p className="mt-1 text-sm font-bold text-emerald-700">
                  {t('Information Management System', 'à°¸à°®à°¾à°šà°¾à°° à°¨à°¿à°°à±à°µà°¹à°£ à°µà±à°¯à°µà°¸à±à°¥')}
                </p>
              </div>
            </div>

            <div className="absolute top-6 right-6 flex items-center gap-2 animate-slide-up delay-100">
              <a
                href="https://whatsapp.com/channel/0029Vb61tsc59PwZEKYH3A0A"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800 transition hover:bg-emerald-100"
                aria-label="WhatsApp Channel"
                title={t('WhatsApp Channel', 'à°µà°¾à°Ÿà±à°¸à°ªà± à°›à°¾à°¨à±†à°²à±')}
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
              <LanguageToggle language={language} onClick={toggleLanguage} className="shrink-0" />
            </div>

            <button
              type="button"
              onClick={openOfficerToolkit}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-800 shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-100 hover:border-emerald-600 animate-slide-up delay-200 pulse-border-animation"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{t('Officer Toolkit', 'à°…à°§à°¿à°•à°¾à°°à±à°² à°Ÿà±‚à°²à±â€Œà°•à°¿à°Ÿà±')}</span>
            </button>

            <div className="mb-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-bold animate-slide-up delay-300">
              <button
                type="button"
                onClick={() => setLoginMode('staff')}
                className={`rounded-lg px-3 py-2 ${loginMode === 'staff' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
              >
                {t('Staff / Test', 'à°¸à°¿à°¬à±à°¬à°‚à°¦à°¿ / à°ªà°°à±€à°•à±à°·')}
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('dealer')}
                className={`rounded-lg px-3 py-2 ${loginMode === 'dealer' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
              >
                {t('Dealer', 'à°¡à±€à°²à°°à±')}
              </button>
            </div>

            <div className="mb-3 animate-slide-up delay-400">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                {loginMode === 'dealer' ? t('Dealer login', 'à°¡à±€à°²à°°à± à°²à°¾à°—à°¿à°¨à±') : t('Secure sign in', 'à°¸à±à°°à°•à±à°·à°¿à°¤ à°²à°¾à°—à°¿à°¨à±')}
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">{t('Welcome', 'à°¸à±à°µà°¾à°—à°¤à°‚')}</h3>
            </div>

            {error && (
              <div className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-slide-up">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2 animate-slide-up delay-500">
              {loginMode === 'dealer' ? (
                <>
                  <LoginField label={t('Registered phone (Dealers Directory)', 'à°¨à°®à±‹à°¦à±ˆà°¨ à°«à±‹à°¨à± (à°¡à±€à°²à°°à±à°² à°¡à±ˆà°°à±†à°•à±à°Ÿà°°à±€)')} icon={<Phone />} type="tel" value={dealerPhone} onChange={setDealerPhone} placeholder="9949497506" />
                  <LoginField label={t('Guest Password', 'à°—à±†à°¸à±à°Ÿà± à°ªà°¾à°¸à±à°µà°°à±à°¡à±')} icon={<LockKeyhole />} type="password" value={dealerPassword} onChange={setDealerPassword} />
                  <p className="-mt-1 text-[10px] text-slate-500">
                    {t(`Guest password: ${DEALER_DEFAULT_PASSWORD}`, `à°—à±†à°¸à±à°Ÿà± à°ªà°¾à°¸à±à°µà°°à±à°¡à±: ${DEALER_DEFAULT_PASSWORD}`)}
                  </p>
                </>
              ) : (
                <>
                  <LoginField label={t('Email Address', 'à°‡à°®à±†à°¯à°¿à°²à± à°šà°¿à°°à±à°¨à°¾à°®à°¾')} icon={<Mail />} type="email" value={email} onChange={setEmail} placeholder={t('Enter email address', 'à°‡à°®à±†à°¯à°¿à°²à± à°šà°¿à°°à±à°¨à°¾à°®à°¾ à°¨à°®à±‹à°¦à± à°šà±‡à°¯à°‚à°¡à°¿')} />
                  <LoginField label={t('Password', 'à°ªà°¾à°¸à±à°µà°°à±à°¡à±')} icon={<LockKeyhole />} type="password" value={password} onChange={setPassword} placeholder={t('Enter password', 'à°ªà°¾à°¸à±à°µà°°à±à°¡à± à°¨à°®à±‹à°¦à± à°šà±‡à°¯à°‚à°¡à°¿')} />
                </>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3 font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:from-emerald-800 hover:to-teal-800 disabled:opacity-60"
              >
                {loginMode === 'dealer' ? <Store className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                {loading ? t('Signing in...', 'à°²à°¾à°—à°¿à°¨à± à°…à°µà±à°¤à±‹à°‚à°¦à°¿...') : loginMode === 'dealer' ? t('Dealer Sign In', 'à°¡à±€à°²à°°à± à°²à°¾à°—à°¿à°¨à±') : t('Sign In', 'à°²à°¾à°—à°¿à°¨à±')}
              </button>
            </form>

            {loginMode === 'staff' && (
              <button
                type="button"
                onClick={handleTestLogin}
                className="mt-3 w-full rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 px-4 py-3 text-sm font-bold text-sky-950 transition hover:bg-sky-100 animate-slide-up delay-600"
              >
                <span className="flex items-center justify-center gap-2">
                  <UserRoundCheck className="h-4 w-4" />
                  {t('Test Login', 'à°ªà°°à±€à°•à±à°· à°²à°¾à°—à°¿à°¨à±')}
                </span>
              </button>
            )}

            {siteHitSummary && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 animate-slide-up delay-700">
                <UsersRound className="h-4 w-4" />
                <span className="font-semibold">{t('Total Visitors', '\u0C2E\u0C4A\u0C24\u0C4D\u0C24\u0C02 \u0C38\u0C02\u0C26\u0C30\u0C4D\u0C36\u0C15\u0C41\u0C32\u0C41')}:</span>
                <span className="font-black">{siteHitSummary.totalViews.toLocaleString()}</span>
              </div>
            )}

            <div className="mb-20 mt-3 text-center text-[11px] font-semibold leading-5 text-slate-600 sm:mb-16 animate-slide-up delay-600">
              <p className="font-black text-emerald-700">version-1.0.1</p>
              <p>&copy; 2026 Agronix - Information Management System</p>
              <p>Developed and maintained by K.Vinay Reddy, MAO, Tiryani</p>
            </div>
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={handleInstallApp}
        className="fixed bottom-4 left-4 z-50 inline-flex max-w-[calc(100vw-9rem)] items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-xl shadow-slate-950/20 transition hover:bg-slate-800"
      >
        <Smartphone className="h-5 w-5" />
        Install App
      </button>
      {installMessage && (
        <div className="fixed bottom-20 left-4 z-50 max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xl shadow-slate-950/15">
          {installMessage}
        </div>
      )}

      <button
        type="button"
        onClick={openGrievance}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-xl shadow-emerald-950/20 transition hover:bg-emerald-800"
      >
        <MessageSquareText className="h-5 w-5" />
        {t('Grievances', 'à°«à°¿à°°à±à°¯à°¾à°¦à±à°²à±')}
      </button>

      {calculatorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
                <Calculator className="h-5 w-5 text-sky-700" />
                {t('Area Calculator', 'à°Žà°•à°°à°¾à°² à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±')}
              </h3>
              <button type="button" onClick={closeAcreageCalculator} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Type or paste acre values</span>
              <textarea
                value={acreInput}
                onChange={(event) => setAcreInput(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-950 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder={'Example:\n2.10\n2.36\n0.15'}
              />
            </label>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Paste one Excel column or type values with + signs. Format uses acres.guntas; one acre is 40 guntas.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Total acres</p>
                <p className="mt-1 text-3xl font-black text-emerald-950">{acreCalculation.formatted}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-800">
                  {acreCalculation.acres} acres {acreCalculation.guntas} guntas
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-sky-700">Hectares</p>
                <p className="mt-1 text-3xl font-black text-sky-950">{acreCalculation.hectares}</p>
                <p className="mt-1 text-xs font-semibold text-sky-800">Converted from total acres</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              Read values: {acreCalculation.count} item{acreCalculation.count === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      )}

      {grievanceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-emerald-900">
                <MessageSquareText className="h-5 w-5" />
                {t('Farmer Grievance', 'à°°à±ˆà°¤à± à°«à°¿à°°à±à°¯à°¾à°¦à±')}
              </h3>
              <button type="button" onClick={grievanceOverlay.closeOverlay} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleGrievanceSubmit} className="space-y-4">
              <p className="text-sm font-black text-slate-900">Farmer details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={grievance.farmer_name} onChange={(e) => setGrievance({ ...grievance, farmer_name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="Farmer name" required />
                <input value={grievance.mobile} onChange={(e) => setGrievance({ ...grievance, mobile: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="Mobile number" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="email" value={grievance.email} onChange={(e) => setGrievance({ ...grievance, email: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="Email (optional)" />
                <select value={grievance.district} onChange={(e) => setGrievance({ ...grievance, district: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
                  {TELANGANA_DISTRICTS.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <input value={grievance.mandal} onChange={(e) => setGrievance({ ...grievance, mandal: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="Mandal" required />

              <p className="pt-2 text-sm font-black text-slate-900">Complaint details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <select value={grievance.issue_type} onChange={(e) => setGrievance({ ...grievance, issue_type: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
                  <option value="fertilizer">Fertilizer</option>
                  <option value="seed">Seed</option>
                  <option value="pesticide">Pesticide</option>
                  <option value="govt_schemes">Govt schemes</option>
                  <option value="others">Others</option>
                </select>
                <input value={grievance.subject} onChange={(e) => setGrievance({ ...grievance, subject: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="Subject" required />
              </div>
              <textarea value={grievance.description} onChange={(e) => setGrievance({ ...grievance, description: e.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder="Description" required />
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3.5 font-bold text-white shadow-lg">
                <Send className="h-5 w-5" />
                {t('Submit Complaint', 'à°«à°¿à°°à±à°¯à°¾à°¦à± à°ªà°‚à°ªà°‚à°¡à°¿')}
              </button>
              {grievanceStatus && <p className="text-sm font-semibold text-emerald-700">{grievanceStatus}</p>}
            </form>
          </div>
        </div>
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

function getBrowserHistoryIndex() {
  const state = window.history.state as { idx?: number } | null;
  return typeof state?.idx === 'number' ? state.idx : 0;
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
  return (
    <div className="mt-2 flex items-center justify-end gap-2 text-xs font-black text-slate-600">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 disabled:opacity-50"
      >
        Previous
      </button>
      <span className="uppercase tracking-wide">
        Page {currentPage + 1} / {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
        disabled={currentPage >= pageCount - 1}
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

function LoginField({
  label,
  icon,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactElement;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        {React.cloneElement(icon, {
          className: 'pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400',
        })}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-12 pr-4 text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          placeholder={placeholder}
          required
        />
      </div>
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
  const initialResult = await supabase
    .from('forms_downloads')
    .select(PUBLIC_FORM_COLUMNS)
    .in('category', PUBLIC_FORM_CATEGORY_VALUES)
    .order('created_at', { ascending: false });
  let data = initialResult.data as FormDownload[] | null;
  let error: unknown = initialResult.error;

  if (error && isMissingPublicLabelColumnError(error)) {
    const fallback = await supabase
      .from('forms_downloads')
      .select(PUBLIC_FORM_COLUMNS_WITHOUT_LABEL)
      .in('category', PUBLIC_FORM_CATEGORY_VALUES)
      .order('created_at', { ascending: false });
    data = fallback.data as FormDownload[] | null;
    error = fallback.error;
  }

  if (error) throw error;
  return (data || []).map(normalizePublicFormRow);
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

function isMissingPublicLabelColumnError(error: unknown) {
  const message = typeof error === 'object' && error && 'message' in error
    ? String((error as { message?: unknown }).message || '')
    : String(error || '');
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code || '')
  : '';
  return code === 'PGRST204' || (/label/i.test(message) && /column|schema|cache|not found|does not exist/i.test(message));
}

export default Login;
