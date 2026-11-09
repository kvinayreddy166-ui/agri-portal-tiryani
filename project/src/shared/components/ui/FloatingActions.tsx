import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Send,
  Smartphone,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { getMandalsForDistrict } from '../../data/telanganaDistrictMandalData';
import { useBackButtonOverlay } from '../../hooks/useBackButtonOverlay';

const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';

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

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-emerald-500/20';

export function FloatingActions() {
  const { t } = useLanguage();

  const [grievanceOpen, setGrievanceOpen] = useState(false);
  const [grievanceStatus, setGrievanceStatus] = useState<string | null>(null);
  const [grievanceSubmitting, setGrievanceSubmitting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [appInstalled, setAppInstalled] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)')?.matches || Boolean((window.navigator as Navigator & { standalone?: boolean })?.standalone))
  );
  const showInstallButton = !appInstalled;

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

  const grievanceMandals = getMandalsForDistrict(DISTRICT_TO_MANDAL_KEY[grievance.district] || grievance.district);
  const grievanceOverlay = useBackButtonOverlay('public-grievance', () => setGrievanceOpen(false));

  const openGrievance = () => {
    grievanceOverlay.pushOverlay();
    setGrievanceOpen(true);
  };

  // Allow other UI (e.g. landing page grievance banner) to open the modal
  useEffect(() => {
    const handler = () => openGrievance();
    window.addEventListener('agronix:open-grievance', handler);
    return () => window.removeEventListener('agronix:open-grievance', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleGrievanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrievanceStatus(null);
    setGrievanceSubmitting(true);

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
    setGrievanceStatus(t('Complaint prepared for email. Please send it from your mail app.', 'ఫిర్యాదు ఈమెయిల్ సిద్ధం చేయబడింది. దయచేసి మీ మెయిల్ యాప్ నుండి పంపండి.'));
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
    setGrievanceSubmitting(false);
  };

  const handleInstallApp = async () => {
    if (appInstalled) {
      setInstallMessage(t('App is already installed.', 'యాప్ ఇప్పటికే ఇన్‌స్టాల్ చేయబడింది.'));
      return;
    }

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        setInstallPrompt(null);
        setInstallMessage(
          choice.outcome === 'accepted'
            ? t('Installing app...', 'యాప్ ఇన్‌స్టాల్ అవుతోంది...')
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

  return (
    <>
      {/* Install App — floating bottom-left (only when install is possible) */}
      {showInstallButton && (
      <>
      <button
        type="button"
        onClick={handleInstallApp}
        aria-label={t('Install App', 'యాప్ ఇన్‌స్టాల్ చేయండి')}
        title={t('Install App', 'యాప్ ఇన్‌స్టాల్ చేయండి')}
        className="fixed bottom-4 left-4 z-50 inline-flex animate-slide-up items-center gap-2 rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-amber-300 py-3 pl-3 pr-4 text-sm font-bold text-emerald-950 shadow-xl shadow-amber-500/30 ring-1 ring-gold-200/60 backdrop-blur transition hover:-translate-y-0.5 hover:from-gold-200 hover:via-gold-300 hover:to-amber-200"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900/15">
          <Smartphone className="h-3.5 w-3.5" />
        </span>
        {t('Install', 'ఇన్‌స్టాల్')}
      </button>
      {installMessage && (
        <div className="fixed bottom-20 left-4 z-50 max-w-xs animate-pop-in rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {installMessage}
        </div>
      )}
      </>
      )}

      {/* Grievance — floating bottom-right */}
      <button
        type="button"
        onClick={openGrievance}
        className="fixed bottom-4 right-4 z-50 inline-flex animate-slide-up items-center gap-2 rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-amber-300 px-4 py-3 text-sm font-bold text-emerald-950 shadow-xl shadow-amber-500/30 ring-1 ring-gold-200/60 transition hover:-translate-y-0.5 hover:from-gold-200 hover:via-gold-300 hover:to-amber-200"
      >
        <MessageSquareText className="h-5 w-5" />
        {t('Grievances', 'ఫిర్యాదులు')}
      </button>

      {/* Grievance modal */}
      {grievanceOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={grievanceOverlay.closeOverlay}>
          <div
            className="max-h-[92vh] w-full max-w-lg animate-pop-in overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient header */}
            <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 px-6 pb-5 pt-6 text-white sm:rounded-t-3xl">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/20 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                    <MessageSquareText className="h-5 w-5 text-gold-300" />
                  </span>
                  <div>
                    <h3 className="text-base font-black tracking-tight">{t('Farmer Grievance', 'రైతు ఫిర్యాదు')}</h3>
                    <p className="text-[11px] font-semibold text-emerald-100/80">
                      {t('Fertilizer, seed & scheme issues — we respond fast', 'ఎరువులు, విత్తనాలు & పథకాల సమస్యలపై త్వరిత స్పందన')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={grievanceOverlay.closeOverlay}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                  aria-label={t('Close', 'మూసివేయండి')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleGrievanceSubmit} className="space-y-4 p-6">
              <p className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {t('Farmer details', 'రైతు వివరాలు')}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={grievance.farmer_name} onChange={(e) => setGrievance({ ...grievance, farmer_name: e.target.value })} className={inputCls} placeholder={t('Farmer name', 'రైతు పేరు')} required />
                <input type="tel" inputMode="tel" autoComplete="tel-national" value={grievance.mobile} onChange={(e) => setGrievance({ ...grievance, mobile: e.target.value })} className={inputCls} placeholder={t('Mobile number', 'మొబైల్ నంబర్')} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="email" value={grievance.email} onChange={(e) => setGrievance({ ...grievance, email: e.target.value })} className={inputCls} placeholder={t('Email (optional)', 'ఇమెయిల్ (ఐచ్చికం)')} />
                <select value={grievance.district} onChange={(e) => setGrievance({ ...grievance, district: e.target.value, mandal: '' })} className={inputCls}>
                  {TELANGANA_DISTRICTS.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                <select value={grievance.mandal} onChange={(e) => setGrievance({ ...grievance, mandal: e.target.value })} className={inputCls} required>
                  <option value="" disabled>{t('Select mandal', 'మండలం ఎంచుకోండి')}</option>
                  {grievanceMandals.map((mandal) => (
                    <option key={mandal} value={mandal}>{mandal}</option>
                  ))}
                  <option value="Others">{t('Others', 'ఇతరులు')}</option>
                </select>
              </div>

              <p className="flex items-center gap-2 pt-2 text-sm font-black text-slate-900 dark:text-white">
                <AlertCircle className="h-4 w-4 text-gold-600" />
                {t('Complaint details', 'ఫిర్యాదు వివరాలు')}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <select value={grievance.issue_type} onChange={(e) => setGrievance({ ...grievance, issue_type: e.target.value })} className={inputCls}>
                  <option value="fertilizer">{t('Fertilizer', 'ఎరువులు')}</option>
                  <option value="seed">{t('Seed', 'విత్తనాలు')}</option>
                  <option value="pesticide">{t('Pesticide', 'పురుగుమందులు')}</option>
                  <option value="govt_schemes">{t('Govt schemes', 'ప్రభుత్వ పథకాలు')}</option>
                  <option value="others">{t('Others', 'ఇతరులు')}</option>
                </select>
                <input value={grievance.subject} onChange={(e) => setGrievance({ ...grievance, subject: e.target.value })} className={inputCls} placeholder={t('Subject', 'విషయం')} required />
              </div>
              <textarea value={grievance.description} onChange={(e) => setGrievance({ ...grievance, description: e.target.value })} rows={4} className={inputCls} placeholder={t('Description', 'వివరణ')} required />

              <button
                type="submit"
                disabled={grievanceSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/25 transition hover:from-emerald-600 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {grievanceSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {t('Submit Complaint', 'ఫిర్యాదు పంపండి')}
              </button>
              {grievanceStatus && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {grievanceStatus}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
