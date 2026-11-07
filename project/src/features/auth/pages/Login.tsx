import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UserPlus,
  X,
} from 'lucide-react';
import { PortalLogo } from '../../../shared/components/ui/PortalLogo';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { OfficialChannelsSidebar } from '../../../shared/components/ui/OfficialChannelsSidebar';
import { DEALER_DEFAULT_PASSWORD } from '../lib/dealerAuth';
import { translateDealerLoginError } from '../lib/dealerLoginMessages';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { supabase } from '../../../shared/lib/supabase';
import { recordSiteHit } from '../../../shared/lib/siteHits';
import { getMandalsForDistrict } from '../../../shared/data/telanganaDistrictMandalData';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBackButtonOverlay } from '../../../shared/hooks/useBackButtonOverlay';

const PublicOfficerTools = React.lazy(() => import('./PublicOfficerTools').then((m) => ({ default: m.PublicOfficerTools })));

const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';
const TEST_EMAIL = 'test@gmail.com';

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

const DISTRICT_TO_MANDAL_KEY: Record<string, string> = {
  'Hanamakonda': 'Hanamkonda',
  'Kumuram Bheem Asifabad': 'Kumrambheem Asifabad',
  'Medchal-Malkajgiri': 'Medchal–Malkajgiri',
  'Rangareddy': 'Ranga Reddy',
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState<'staff' | 'officer' | 'dealer'>('officer');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dealerPhone, setDealerPhone] = useState('');
  const [dealerPassword, setDealerPassword] = useState(DEALER_DEFAULT_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [grievanceOpen, setGrievanceOpen] = useState(false);
  const [grievanceStatus, setGrievanceStatus] = useState<string | null>(null);

  const showOfficerToolkit = location.pathname === '/officer-toolkit';
  const showStatutoryForms = location.pathname === '/officer-toolkit/smart-sampling' || location.pathname === '/officer-toolkit/sampling-hub' || location.pathname === '/officer-toolkit/statutory-forms';
  const showFormsLibrary = location.pathname === '/officer-toolkit/forms-library';
  const calculatorOpen = location.pathname === '/officer-toolkit/acreage-calculator';
  const fertilizerCalculatorOpen = location.pathname === '/officer-toolkit/fertilizer-calculator';
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [appInstalled, setAppInstalled] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)')?.matches || Boolean((window.navigator as Navigator & { standalone?: boolean })?.standalone))
  );

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
  const grievanceMandals = getMandalsForDistrict(DISTRICT_TO_MANDAL_KEY[grievance.district] || grievance.district);
  const grievanceOverlay = useBackButtonOverlay('public-grievance', () => setGrievanceOpen(false));

  const openOfficerToolkit = () => {
    void recordSiteHit({ path: '/officer-toolkit', countOncePerSession: false });
    navigate('/officer-toolkit', { state: { from: 'login' } });
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
      setInstallMessage(t('App installed successfully.', 'యాప్ విజయవంతంగా ఇన్‌స్టాల్ అయింది.'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [t]);

  const handleOfficerPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const targetEmail = officerEmail.trim().toLowerCase();
    if (!targetEmail || !officerPassword) {
      setError(t('Please enter both email and password.', 'దయచేసి ఇమెయిల్ మరియు పాస్వర్డ్ నమోదు చేయండి.'));
      return;
    }
    setLoading(true);
    const { error: signInErr } = await signIn(targetEmail, officerPassword);
    setLoading(false);
    if (signInErr) {
      setError(signInErr.message);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
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
            : t('Install cancelled. Tap Install App again when the browser prompt is available.', 'ఇన్‌స్టాల్ రద్దు చేయబడింది. బ్రౌజర్ ప్రాంప్ట్ అందుబాటులో ఉన్నప్పుడు మళ్లీ Install App నొక్కండి.')
        );
      } catch {
        setInstallMessage(t('Use your browser menu and choose Install app.', 'బ్రౌజర్ మెనూలో Install app ఎంచుకోండి.'));
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
      setInstallMessage(t('Use your browser menu and choose Install app. If it is not visible, refresh once and tap Install App again.', 'బ్రౌజర్ మెనూలో Install app ఎంచుకోండి. కనిపించకపోతే ఒకసారి రిఫ్రెష్ చేసి మళ్లీ Install App నొక్కండి.'));
      return;
    }

    setInstallMessage(t('On iPhone/iPad: tap Share, then Add to Home Screen.', 'iPhone/iPadలో Share నొక్కి, Add to Home Screen ఎంచుకోండి.'));
  };

  if (showOfficerToolkit) {
    return null;
  }

  if (showStatutoryForms || showFormsLibrary || calculatorOpen || fertilizerCalculatorOpen) {
    return (
      <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>}>
        <PublicOfficerTools />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-emerald-950 p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-gold-300/10" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl dashboard-float" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl dashboard-float" style={{ animationDelay: '1.5s' }} />
        <div className="pointer-events-none absolute right-10 top-1/2 h-44 w-44 rounded-full bg-gold-300/15 blur-3xl dashboard-float" style={{ animationDelay: '2.5s' }} />
        <div className="pointer-events-none absolute -left-40 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -left-24 top-1/2 h-[18rem] w-[18rem] -translate-y-1/2 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="login-logo-hero inline-flex">
            <PortalLogo size="lg" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-gold-300 font-[var(--font-stylish)] drop-shadow-sm">
              {t('AGRONIX', 'అగ్రోనిక్స్')}
            </h1>
            <p className="text-xs font-semibold text-emerald-200">
              {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
            </p>
          </div>
        </div>

        <div className="relative space-y-4 max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-800/80 px-3.5 py-1 text-xs font-semibold text-gold-300 ring-1 ring-gold-400/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('Agricultural Management System', 'వ్యవసాయ నిర్వహణ వ్యవస్థ')}
          </span>
          <h2 className="text-3xl font-black tracking-tight leading-tight xl:text-4xl text-white">
            {t('Enforcing Quality & Empowering Agricultural Officers', 'నాణ్యత పర్యవేక్షణ & అధికారులకు సమగ్ర డిజిటల్ సాధనాలు')}
          </h2>
          <p className="text-sm leading-relaxed text-emerald-100/90">
            {t('Issue statutory Stop Sale & Seizure orders, conduct dealer inspections, track seed/fertilizer samples, and synchronize statutory notices securely with cloud backup.', 'స్టాప్ సేల్ & సీజర్ ఆర్డర్లు, డీలర్ తనిఖీలు, సాంప్లింగ్ రికార్డులను క్లౌడ్ బ్యాకప్‌తో సురక్షితంగా నిర్వహించండి.')}
          </p>
        </div>

        <div className="relative text-xs text-emerald-300/80">
          <p>&copy; 2026 Agronix IMS &middot; {t('Kumuram Bheem Asifabad District', 'కొమరం భీమ్ ఆసిఫాబాద్ జిల్లా')}</p>
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="relative w-full max-w-[30rem]">
          <section className="relative flex flex-col justify-start overflow-hidden rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-2xl shadow-emerald-900/10 ring-1 ring-slate-900/5 backdrop-blur-xl animate-fadeIn dark:border-slate-800 dark:bg-slate-900/90 dark:ring-white/5 sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-800 via-gold-400 to-emerald-800" />
            
            <div className="flex items-center justify-between mb-4">
              <LanguageToggle language={language} onClick={toggleLanguage} accent="emerald" />
              <button
                type="button"
                onClick={openOfficerToolkit}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{t('Public Toolkit', 'పబ్లిక్ టూల్‌కిట్')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="w-full">
              <div className="mb-6 flex flex-col items-center gap-2 text-center animate-slide-up lg:hidden">
                <div className="login-logo-hero inline-flex">
                  <PortalLogo size="lg" />
                </div>
                <div>
                  <h2 className="whitespace-nowrap text-xl font-black tracking-wider text-[#c59b27] dark:text-gold-300 font-[var(--font-stylish)]">
                    {t('AGRONIX', 'అగ్రోనిక్స్')}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
                  </p>
                </div>
              </div>

              {/* 3-Way Mode Switcher */}
              <div className="mb-5 grid animate-slide-up grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs sm:text-sm font-semibold ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
                <button
                  type="button"
                  onClick={() => { setLoginMode('officer'); setError(null); setSuccessMessage(null); }}
                  className={`rounded-lg px-2 py-2 transition font-bold flex items-center justify-center gap-1.5 ${loginMode === 'officer' ? 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-md shadow-emerald-900/25' : 'text-slate-500 hover:text-emerald-800 dark:hover:text-emerald-300'}`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>{t('Officer', 'అధికారి')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('staff'); setError(null); setSuccessMessage(null); }}
                  className={`rounded-lg px-2 py-2 transition font-bold ${loginMode === 'staff' ? 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-md shadow-emerald-900/25' : 'text-slate-500 hover:text-emerald-800 dark:hover:text-emerald-300'}`}
                >
                  {t('Admin', 'అడ్మిన్')}
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('dealer'); setError(null); setSuccessMessage(null); }}
                  className={`rounded-lg px-2 py-2 transition font-bold ${loginMode === 'dealer' ? 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-md shadow-emerald-900/25' : 'text-slate-500 hover:text-emerald-800 dark:hover:text-emerald-300'}`}
                >
                  {t('Dealer', 'డీలర్')}
                </button>
              </div>

              {error && (
                <div className="mb-4 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-700 animate-shake dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-800 animate-fadeIn dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* ===================== OFFICER PORTAL ===================== */}
              {loginMode === 'officer' && (
                <div className="space-y-4 animate-slide-up">
                  <div className="mb-2">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {t('Officer Sign In', 'అధికారి లాగిన్')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t('Sign in with your registered email address and password', 'మీ నమోదైన ఇమెయిల్ చిరునామా మరియు పాస్‌వర్డ్‌తో లాగిన్ అవ్వండి')}
                    </p>
                  </div>

                  <form onSubmit={handleOfficerPasswordSignIn} className="space-y-4">
                    <LoginField
                      label={t('Registered Email Address', 'నమోదైన ఇమెయిల్ చిరునామా')}
                      icon={<Mail />}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={officerEmail}
                      onChange={setOfficerEmail}
                      placeholder="officer@email.com / gmail.com"
                    />
                    <LoginField
                      label={t('Password', 'పాస్వర్డ్')}
                      icon={<LockKeyhole />}
                      type="password"
                      autoComplete="current-password"
                      value={officerPassword}
                      onChange={setOfficerPassword}
                      placeholder={t('Enter password', 'పాస్వర్డ్ నమోదు చేయండి')}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {t('Forgot password?', 'పాస్‌వర్డ్ మర్చిపోయారా?')}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 text-sm font-semibold text-white shadow-xs hover:shadow transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <LogIn className="h-4 w-4 shrink-0" />}
                      <span>{loading ? t('Signing in...', 'లాగిన్ అవుతోంది...') : t('Sign In as Officer', 'అధికారిగా లాగిన్ అవ్వండి')}</span>
                    </button>
                  </form>

                  {/* Visual separation */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                      {t('Or', 'లేదా')}
                    </span>
                  </div>

                  {/* Officer Sign Up — distinctive card style */}
                  <div className="animate-slide-up rounded-2xl border-2 border-dashed border-gold-300/50 bg-gradient-to-br from-gold-50/50 to-amber-50/30 p-4 dark:border-gold-700/40 dark:from-gold-950/20 dark:to-amber-950/10">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {t('New Agriculture Officer', 'కొత్త వ్యవసాయ అధికారి')}
                      </h3>
                    </div>
                    <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
                      {t('Register with email verification to create your officer account', 'ఇమెయిల్ ధృవీకరణతో మీ అధికారి ఖాతాను సృష్టించండి')}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-amber-600 hover:from-gold-500 hover:to-amber-500 active:from-gold-700 active:to-amber-700 px-4 text-sm font-semibold text-white shadow-md shadow-gold-900/20 transition active:scale-[0.99]"
                    >
                      <UserPlus className="h-4 w-4 shrink-0" />
                      <span>{t('Sign Up as Officer', 'అధికారిగా సైన్ అప్ అవ్వండి')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ===================== ADMIN / DEALER PORTAL ===================== */}
              {loginMode !== 'officer' && (
                <>
                  <div className="mb-4 animate-slide-up">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {loginMode === 'dealer' ? t('Dealer Sign In', 'డీలర్ సైన్ ఇన్') : t('Admin Sign In', 'అడ్మిన్ సైన్ ఇన్')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {loginMode === 'dealer'
                        ? t('Access stock reports and allocations with registered phone', 'నమోదైన ఫోన్ నంబర్‌తో స్టాక్ రిపోర్టులు పొందండి')
                        : t('Administrative access', 'అధికారిక యాక్సెస్')}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
                    {loginMode === 'dealer' ? (
                      <>
                        <LoginField label={t('Registered Phone Number', 'నమోదైన ఫోన్ నంబర్')} icon={<Phone />} type="tel" inputMode="tel" autoComplete="tel" value={dealerPhone} onChange={setDealerPhone} placeholder="9949497506" />
                        <LoginField label={t('Guest Password', 'గెస్ట్ పాస్వర్డ్')} icon={<LockKeyhole />} type="password" autoComplete="current-password" value={dealerPassword} onChange={setDealerPassword} />
                      </>
                    ) : (
                      <>
                        <LoginField label={t('Email Address', 'ఇమెయిల్ చిరునామా')} icon={<Mail />} type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder={t('Enter email address', 'ఇమెయిల్ చిరునామా నమోదు చేయండి')} />
                        <LoginField label={t('Password', 'పాస్వర్డ్')} icon={<LockKeyhole />} type="password" autoComplete="current-password" value={password} onChange={setPassword} placeholder={t('Enter password', 'పాస్వర్డ్ నమోదు చేయండి')} />
                      </>
                    )}
                    {loginMode !== 'dealer' && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate('/forgot-password')}
                          className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          {t('Forgot password?', 'పాస్‌వర్డ్ మర్చిపోయారా?')}
                        </button>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 text-sm font-semibold text-white shadow-xs hover:shadow transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : loginMode === 'dealer' ? <Store className="h-4 w-4 shrink-0" /> : <LogIn className="h-4 w-4 shrink-0" />}
                      <span>{loading ? t('Signing in...', 'లాగిన్ అవుతోంది...') : loginMode === 'dealer' ? t('Dealer Sign In', 'డీలర్ లాగిన్') : t('Sign In', 'లాగిన్')}</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>

          <div className="mt-5 pb-24 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
            <p className="font-medium">version-1.0.1</p>
            <p>&copy; 2026 {t('Agronix - Information Management System', 'అగ్రోనిక్స్ - సమాచార నిర్వహణ వ్యవస్థ')}</p>
            <p>{t('Developed and maintained by K.Vinay Reddy, MAO, Tiryani', 'రూపకల్పన & నిర్వహణ: కె.వినయ్ రెడ్డి, ఎం.ఎ.ఓ, తిర్యాని')}</p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <Link to="/disclaimer" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                {t('Disclaimer', 'Disclaimer')}
              </Link>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <Link to="/privacy-policy" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                {t('Privacy Policy', 'Privacy Policy')}
              </Link>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <Link to="/terms-conditions" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                {t('Terms & Conditions', 'Terms & Conditions')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleInstallApp}
        className="fixed bottom-4 left-4 z-50 inline-flex max-w-[calc(100vw-9rem)] items-center gap-2 rounded-full bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10 backdrop-blur transition hover:-translate-y-0.5 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800"
      >
        <Smartphone className="h-5 w-5" />
        {t('Install App', 'యాప్ ఇన్‌స్టాల్ చేయండి')}
      </button>
      {installMessage && (
        <div className="fixed bottom-20 left-4 z-50 max-w-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xl shadow-slate-950/15">
          {installMessage}
        </div>
      )}

      <OfficialChannelsSidebar />
      <button
        type="button"
        onClick={openGrievance}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800"
      >
        <MessageSquareText className="h-5 w-5" />
        {t('Grievances', 'ఫిర్యాదులు')}
      </button>

      {grievanceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-emerald-900 dark:text-emerald-200">
                <MessageSquareText className="h-5 w-5" />
                {t('Farmer Grievance', 'రైతు ఫిర్యాదు')}
              </h3>
              <button type="button" onClick={grievanceOverlay.closeOverlay} className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleGrievanceSubmit} className="space-y-4">
              <p className="text-sm font-black text-slate-900 dark:text-white">{t('Farmer details', 'రైతు వివరాలు')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={grievance.farmer_name} onChange={(e) => setGrievance({ ...grievance, farmer_name: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Farmer name', 'రైతు పేరు')} required />
                <input type="tel" inputMode="tel" autoComplete="tel-national" value={grievance.mobile} onChange={(e) => setGrievance({ ...grievance, mobile: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Mobile number', 'మొబైల్ నంబర్')} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="email" value={grievance.email} onChange={(e) => setGrievance({ ...grievance, email: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Email (optional)', 'ఇమెయిల్ (ఐచ్చికం)')} />
                <select value={grievance.district} onChange={(e) => setGrievance({ ...grievance, district: e.target.value, mandal: '' })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
                  {TELANGANA_DISTRICTS.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                <select value={grievance.mandal} onChange={(e) => setGrievance({ ...grievance, mandal: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" required>
                  <option value="" disabled>{t('Select mandal', 'మండలం ఎంచుకోండి')}</option>
                  {grievanceMandals.map((mandal) => (
                    <option key={mandal} value={mandal}>{mandal}</option>
                  ))}
                  <option value="Others">{t('Others', 'ఇతరులు')}</option>
                </select>
              </div>

              <p className="pt-2 text-sm font-black text-slate-900 dark:text-white">{t('Complaint details', 'ఫిర్యాదు వివరాలు')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <select value={grievance.issue_type} onChange={(e) => setGrievance({ ...grievance, issue_type: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
                  <option value="fertilizer">{t('Fertilizer', 'ఎరువులు')}</option>
                  <option value="seed">{t('Seed', 'విత్తనాలు')}</option>
                  <option value="pesticide">{t('Pesticide', 'పురుగుమందులు')}</option>
                  <option value="govt_schemes">{t('Govt schemes', 'ప్రభుత్వ పథకాలు')}</option>
                  <option value="others">{t('Others', 'ఇతరులు')}</option>
                </select>
                <input value={grievance.subject} onChange={(e) => setGrievance({ ...grievance, subject: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Subject', 'విషయం')} required />
              </div>
              <textarea value={grievance.description} onChange={(e) => setGrievance({ ...grievance, description: e.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Description', 'వివరణ')} required />
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/25 transition hover:from-emerald-600 hover:to-emerald-800">
                <Send className="h-5 w-5" />
                {t('Submit Complaint', 'ఫిర్యాదు పంపండి')}
              </button>
              {grievanceStatus && <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{grievanceStatus}</p>}
            </form>
          </div>
        </div>
      )}
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
  inputMode,
  autoComplete,
}: {
  label: string;
  icon: React.ReactElement;
  type: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="group">
      <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      <div className="relative">
        {React.cloneElement(icon, {
          className: 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600',
        })}
        <input
          type={isPassword && revealed ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={`h-10 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-10 text-xs sm:text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:hover:border-slate-600 dark:focus:ring-emerald-500/20 ${isPassword ? 'pr-11' : 'pr-3.5'}`}
          placeholder={placeholder}
          required
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            {revealed ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default Login;
