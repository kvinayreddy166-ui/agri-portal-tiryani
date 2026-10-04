import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
  Smartphone,
  Sprout,
  Store,
  X,
} from 'lucide-react';
import { PortalLogo } from '../../../shared/components/ui/PortalLogo';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { WhatsAppFab } from '../../../shared/components/ui/WhatsAppFab';
import { UpdateBanner } from '../../../shared/components/UpdateBanner';
import { DEALER_DEFAULT_PASSWORD } from '../lib/dealerAuth';
import { translateDealerLoginError } from '../lib/dealerLoginMessages';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { supabase } from '../../../shared/lib/supabase';
import { recordSiteHit } from '../../../shared/lib/siteHits';
import { getMandalsForDistrict } from '../../../shared/data/telanganaDistrictMandalData';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBackButtonOverlay } from '../../../shared/hooks/useBackButtonOverlay';
import { PublicOfficerTools } from './PublicOfficerTools';

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
  const [loginMode, setLoginMode] = useState<'staff' | 'dealer'>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dealerPhone, setDealerPhone] = useState('');
  const [dealerPassword, setDealerPassword] = useState(DEALER_DEFAULT_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [grievanceOpen, setGrievanceOpen] = useState(false);
  const [grievanceStatus, setGrievanceStatus] = useState<string | null>(null);
  const showOfficerToolkit = location.pathname === '/officer-toolkit';
  const showStatutoryForms = location.pathname === '/officer-toolkit/statutory-forms';
  const calculatorOpen = location.pathname === '/officer-toolkit/acreage-calculator';
  const fertilizerCalculatorOpen = location.pathname === '/officer-toolkit/fertilizer-calculator';
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [appInstalled, setAppInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
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
            : t('Install cancelled. Tap Install App again when the browser prompt is available.', 'à°‡à°¨à±â€Œà°¸à±à°Ÿà°¾à°²à± à°°à°¦à±à°¦à± à°šà±‡à°¯à°¬à°¡à°¿à°‚à°¦à°¿. à°¬à±à°°à±Œà°œà°°à± à°ªà±à°°à°¾à°‚à°ªà±à°Ÿà± à°…à°‚à°¦à±à°¬à°¾à°Ÿà±à°²à±‹ à°‰à°¨à±à°¨à°ªà±à°ªà±à°¡à± à°®à°³à±à°²à±€ Install App à°¨à±Šà°•à±à°•à°‚à°¡à°¿.')
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
      setInstallMessage(t('Use your browser menu and choose Install app. If it is not visible, refresh once and tap Install App again.', 'à°¬à±à°°à±Œà°œà°°à± à°®à±†à°¨à±‚à°²à±‹ Install app à°Žà°‚à°šà±à°•à±‹à°‚à°¡à°¿. à°•à°¨à°¿à°ªà°¿à°‚à°šà°•à°ªà±‹à°¤à±‡ à°’à°•à°¸à°¾à°°à°¿ à°°à°¿à°«à±à°°à±†à°·à± à°šà±‡à°¸à°¿ à°®à°³à±à°²à±€ Install App à°¨à±Šà°•à±à°•à°‚à°¡à°¿.'));
      return;
    }

    setInstallMessage(t('On iPhone/iPad: tap Share, then Add to Home Screen.', 'iPhone/iPadలో Share నొక్కి, Add to Home Screen ఎంచుకోండి.'));
  };

  // Officer toolkit is now handled by App.tsx with OfficersToolkit component
  // This prevents the old toolkit from flashing before the new one loads
  if (showOfficerToolkit) {
    return null;
  }


  if (showStatutoryForms || calculatorOpen || fertilizerCalculatorOpen) {
    return <PublicOfficerTools />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <UpdateBanner />

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-emerald-600 p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-800" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-emerald-200/25" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl dashboard-float" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-emerald-300/35 blur-3xl dashboard-float" style={{ animationDelay: '1.5s' }} />
        <div className="pointer-events-none absolute right-10 top-1/2 h-44 w-44 rounded-full bg-green-300/30 blur-3xl dashboard-float" style={{ animationDelay: '2.5s' }} />
        <div className="pointer-events-none absolute -left-40 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -left-24 top-1/2 h-[18rem] w-[18rem] -translate-y-1/2 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="login-logo-hero inline-flex">
            <PortalLogo size="md" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-[var(--font-stylish)]">AGRONIX</h2>
            <p className="text-xs text-emerald-200">
              {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
            </p>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="max-w-md bg-gradient-to-r from-white via-emerald-50 to-emerald-100 bg-clip-text text-3xl font-bold leading-tight tracking-tight text-transparent xl:text-[2.5rem]">
            {t('Field-ready documents for Quality enforcement.', 'నాణ్యత అమలు కోసం సిద్ధమైన పత్రాలు.')}
          </h1>
          <p className="max-w-md text-[15px] leading-7 text-emerald-50/95">
            {t('Inspections, memos, stop sale and seizure orders — prepared in departmental format, ready for PDF and Word.', 'తనిఖీలు, మెమోలు, స్టాప్ సేల్ మరియు జబ్తు ఆర్డర్లు — శాఖా ఫార్మాట్‌లో, PDF మరియు Word కోసం సిద్ధం.')}
          </p>
          <ul className="max-w-md space-y-3 text-sm font-medium text-white">
            <li className="group flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 shadow-lg shadow-emerald-950/10 backdrop-blur-md transition hover:border-white/30 hover:bg-white/15">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 transition group-hover:scale-105">
                <FileText className="h-4 w-4 text-white" />
              </span>
              <span>{t('Statutory forms & covering letters', 'చట్టబద్ధ ఫారాలు & కవరింగ్ లెటర్లు')}</span>
            </li>
            <li className="group flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 shadow-lg shadow-emerald-950/10 backdrop-blur-md transition hover:border-white/30 hover:bg-white/15">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 transition group-hover:scale-105">
                <ShieldCheck className="h-4 w-4 text-white" />
              </span>
              <span>{t('Inspection & enforcement toolkit', 'తనిఖీ & అమలు టూల్‌కిట్')}</span>
            </li>
            <li className="group flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 shadow-lg shadow-emerald-950/10 backdrop-blur-md transition hover:border-white/30 hover:bg-white/15">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 transition group-hover:scale-105">
                <Sprout className="h-4 w-4 text-emerald-100" />
              </span>
              <span>{t('Seed, fertilizer & pesticide workflows', 'విత్తన, ఎరువు & పురుగుమందు పనిప్రవాహాలు')}</span>
            </li>
          </ul>
        </div>
        <div className="relative border-t border-white/15 pt-4 text-xs leading-5 text-emerald-100/80">
          <p>version-1.0.1 &middot; &copy; 2026 Agronix — Information Management System</p>
          <p>Developed and maintained by K.Vinay Reddy, MAO, Tiryani</p>
        </div>
      </aside>

      <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100 p-4 pb-28 dark:from-slate-950 dark:via-emerald-950/50 dark:to-emerald-950/70 sm:pb-24 lg:min-h-0 lg:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-green-300/40 blur-3xl dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-emerald-300/35 blur-3xl dashboard-float dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-green-300/30 blur-3xl dashboard-float dark:bg-green-500/10" style={{ animationDelay: '2s' }} />
      <div className="flex flex-1 items-center justify-center">
      <div className="relative w-full max-w-[28rem]">
        <section className="relative flex flex-col justify-start overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-emerald-900/10 ring-1 ring-slate-900/5 backdrop-blur-xl animate-fadeIn dark:border-slate-800 dark:bg-slate-900/85 dark:ring-white/5 sm:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400" />
          <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
            <LanguageToggle language={language} onClick={toggleLanguage} accent="emerald" />
          </div>
          <div className="w-full">
            <div className="mb-8 flex flex-col items-center gap-3 text-center animate-slide-up lg:hidden">
              <div className="login-logo-hero inline-flex">
                <PortalLogo size="lg" />
              </div>
              <div>
                <h2 className="whitespace-nowrap text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl font-[var(--font-stylish)]">
                  {t('AGRONIX', 'AGRONIX')}
                </h2>
                <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {t('Information Management System', 'à°¸à°®à°¾à°šà°¾à°° à°¨à°¿à°°à±à°µà°¹à°£ à°µà±à°¯à°µà°¸à±à°¥')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openOfficerToolkit}
              className="group mb-5 flex w-full animate-slide-up items-center gap-3 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-green-50/80 to-emerald-50 px-3.5 py-3 text-left shadow-sm transition delay-100 hover:-translate-y-px hover:border-emerald-400 hover:from-emerald-100/80 hover:to-green-100/70 hover:shadow-md hover:shadow-emerald-500/10 active:translate-y-0 active:scale-[0.99] dark:border-emerald-500/50 dark:from-emerald-950/50 dark:via-green-950/40 dark:to-emerald-950/50 dark:hover:border-emerald-400"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100 transition group-hover:scale-105 dark:bg-slate-800 dark:text-emerald-300 dark:ring-emerald-500/30">
                <ShieldCheck className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{t('Officer Toolkit', 'అధికారుల టూల్‌కిట్')}</span>
                <span className="block text-[11px] font-medium leading-snug text-slate-500 dark:text-slate-400">{t('Inspections, notices & orders', 'తనిఖీలు, నోటీసులు & ఆర్డర్లు')}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5 dark:text-emerald-300" />
            </button>

            <div className="mb-6 grid animate-slide-up grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold ring-1 ring-inset ring-slate-200/70 delay-100 dark:bg-slate-800 dark:ring-slate-700">
              <button
                type="button"
                onClick={() => setLoginMode('staff')}
                className={`rounded-lg px-3 py-2.5 transition-all ${loginMode === 'staff' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-emerald-300 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                {t('Staff / Test', 'సిబ్బంది / పరీక్ష')}
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('dealer')}
                className={`rounded-lg px-3 py-2.5 transition-all ${loginMode === 'dealer' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-emerald-300 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                {t('Dealer', 'డీలర్')}
              </button>
            </div>

            <div className="mb-4 animate-slide-up delay-200">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {loginMode === 'dealer' ? t('Dealer sign in', 'డీలర్ సైన్ ఇన్') : t('Secure sign in', 'సురక్షిత సైన్ ఇన్')}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t('Access Agronix with your official credentials', 'మీ అధికారిక ఆధారాలతో Agronixను యాక్సెస్ చేయండి')}
              </p>
            </div>

            {error && (
              <div className="mb-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-shake dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up delay-200">
              {loginMode === 'dealer' ? (
                <>
                  <LoginField label={t('Registered phone (Dealers Directory)', 'à°¨à°®à±‹à°¦à±ˆà°¨ à°«à±‹à°¨à± (à°¡à±€à°²à°°à±à°² à°¡à±ˆà°°à±†à°•à±à°Ÿà°°à±€)')} icon={<Phone />} type="tel" value={dealerPhone} onChange={setDealerPhone} placeholder="9949497506" />
                  <LoginField label={t('Guest Password', 'à°—à±†à°¸à±à°Ÿà± à°ªà°¾à°¸à±à°µà°°à±à°¡à±')} icon={<LockKeyhole />} type="password" value={dealerPassword} onChange={setDealerPassword} />
                  <p className="-mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0aa775] to-[#1cb454] py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-px hover:from-emerald-600 hover:to-green-600 hover:shadow-xl hover:shadow-emerald-500/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : loginMode === 'dealer' ? <Store className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                {loading ? t('Signing in...', 'à°²à°¾à°—à°¿à°¨à± à°…à°µà±à°¤à±‹à°‚à°¦à°¿...') : loginMode === 'dealer' ? t('Dealer Sign In', 'à°¡à±€à°²à°°à± à°²à°¾à°—à°¿à°¨à±') : t('Sign In', 'à°²à°¾à°—à°¿à°¨à±')}
              </button>
            </form>


          </div>
        </section>

        <div className="mt-5 animate-fadeIn text-center text-xs leading-5 text-slate-400 delay-300 dark:text-slate-500 lg:hidden">
          <p className="font-medium">version-1.0.1</p>
          <p>&copy; 2026 Agronix - Information Management System</p>
          <p>Developed and maintained by K.Vinay Reddy, MAO, Tiryani</p>
        </div>
      </div>
      </div>
      </div>

      <button
        type="button"
        onClick={handleInstallApp}
        className="fixed bottom-4 left-4 z-50 inline-flex max-w-[calc(100vw-9rem)] items-center gap-2 rounded-full bg-gradient-to-r from-[#0aa775] to-[#1cb454] px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-500/25 ring-1 ring-white/10 backdrop-blur transition hover:-translate-y-0.5 hover:from-emerald-600 hover:to-green-600"
      >
        <Smartphone className="h-5 w-5" />
        Install App
      </button>
      {installMessage && (
        <div className="fixed bottom-20 left-4 z-50 max-w-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xl shadow-slate-950/15">
          {installMessage}
        </div>
      )}

      <div className="fixed bottom-[4.5rem] right-4 z-50">
        <WhatsAppFab whatsappLink="https://wa.me/918308487046" />
      </div>
      <button
        type="button"
        onClick={openGrievance}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0aa775] to-[#1cb454] px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-500/25 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:from-emerald-600 hover:to-green-600"
      >
        <MessageSquareText className="h-5 w-5" />
        {t('Grievances', 'à°«à°¿à°°à±à°¯à°¾à°¦à±à°²à±')}
      </button>

      {grievanceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-emerald-900 dark:text-emerald-200">
                <MessageSquareText className="h-5 w-5" />
                {t('Farmer Grievance', 'à°°à±ˆà°¤à± à°«à°¿à°°à±à°¯à°¾à°¦à±')}
              </h3>
              <button type="button" onClick={grievanceOverlay.closeOverlay} className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleGrievanceSubmit} className="space-y-4">
              <p className="text-sm font-black text-slate-900 dark:text-white">{t('Farmer details', 'à°°à±ˆà°¤à± à°µà°¿à°µà°°à°¾à°²à±')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={grievance.farmer_name} onChange={(e) => setGrievance({ ...grievance, farmer_name: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Farmer name', 'à°°à±ˆà°¤à± à°ªà±‡à°°à±')} required />
                <input value={grievance.mobile} onChange={(e) => setGrievance({ ...grievance, mobile: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Mobile number', 'à°®à±Šà°¬à±ˆà°²à± à°¨à°‚à°¬à°°à±')} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="email" value={grievance.email} onChange={(e) => setGrievance({ ...grievance, email: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Email (optional)', 'à°‡à°®à±†à°¯à°¿à°²à± (à°à°šà±à°šà°¿à°•à°‚)')} />
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

              <p className="pt-2 text-sm font-black text-slate-900 dark:text-white">{t('Complaint details', 'à°«à°¿à°°à±à°¯à°¾à°¦à± à°µà°¿à°µà°°à°¾à°²à±')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <select value={grievance.issue_type} onChange={(e) => setGrievance({ ...grievance, issue_type: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
                  <option value="fertilizer">{t('Fertilizer', 'à°Žà°°à±à°µà±à°²à±')}</option>
                  <option value="seed">{t('Seed', 'à°µà°¿à°¤à±à°¤à°¨à°¾à°²à±')}</option>
                  <option value="pesticide">{t('Pesticide', 'à°ªà±à°°à±à°—à±à°®à°‚à°¦à±à°²à±')}</option>
                  <option value="govt_schemes">{t('Govt schemes', 'à°ªà±à°°à°­à±à°¤à±à°µ à°ªà°¥à°•à°¾à°²à±')}</option>
                  <option value="others">{t('Others', 'à°‡à°¤à°°à±à°²à±')}</option>
                </select>
                <input value={grievance.subject} onChange={(e) => setGrievance({ ...grievance, subject: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Subject', 'à°µà°¿à°·à°¯à°‚')} required />
              </div>
              <textarea value={grievance.description} onChange={(e) => setGrievance({ ...grievance, description: e.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-slate-950 dark:text-white outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" placeholder={t('Description', 'à°µà°¿à°µà°°à°£')} required />
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-700 py-3.5 font-bold text-white shadow-lg">
                <Send className="h-5 w-5" />
                {t('Submit Complaint', 'à°«à°¿à°°à±à°¯à°¾à°¦à± à°ªà°‚à°ªà°‚à°¡à°¿')}
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
}: {
  label: string;
  icon: React.ReactElement;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="group">
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      <div className="relative">
        {React.cloneElement(icon, {
          className: 'pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600',
        })}
        <input
          type={isPassword && revealed ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:hover:border-slate-600 dark:focus:ring-emerald-500/20 ${isPassword ? 'pr-12' : 'pr-4'}`}
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


