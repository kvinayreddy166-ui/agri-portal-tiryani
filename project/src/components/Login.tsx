import React, { useState } from 'react';
import {
  AlertCircle,
  Eye,
  Globe2,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';
const TEST_EMAIL = 'test@gmail.com';
const TEST_PASSWORD = 'Test@123';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const { error: signInError } = await signIn(normalizedEmail, password);

    if (signInError) {
      setError(
        normalizedEmail === ADMIN_EMAIL
          ? t(
              'Admin login failed. Please check the admin email and password.',
              'అడ్మిన్ లాగిన్ విఫలమైంది. దయచేసి అడ్మిన్ ఇమెయిల్ మరియు పాస్వర్డ్ తనిఖీ చేయండి.'
            )
          : t(
              'Login failed. Please use the assigned test login details.',
              'లాగిన్ విఫలమైంది. దయచేసి మీకు ఇచ్చిన టెస్ట్ లాగిన్ వివరాలను ఉపయోగించండి.'
            )
      );
    }

    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef6f0] p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.18),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/90 shadow-2xl shadow-emerald-950/10 backdrop-blur-sm lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden min-h-[720px] flex-col justify-between overflow-hidden bg-emerald-950 p-10 text-white lg:flex">
          <img src="/images/rice.jpg" alt="" className="absolute inset-x-0 top-0 h-[52%] w-full object-cover opacity-80" />
          <img src="/images/cotton.jpg" alt="" className="absolute inset-x-0 bottom-0 h-[52%] w-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/96 via-emerald-900/75 to-slate-900/50" />

          <div className="relative">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md">
              <img src="/images/agri-emblem.png" alt="" className="h-9 w-9 rounded-full bg-white p-0.5" />
              {t('Department of Agriculture', 'వ్యవసాయ శాఖ')}
            </div>
            <h1 className="max-w-lg text-4xl font-black leading-[1.1] tracking-tight xl:text-5xl">
              {t('Tiryani Agriculture Portal', 'తిర్యాని వ్యవసాయ పోర్టల్')}
            </h1>
            <p className="mt-3 text-lg font-semibold text-emerald-100">
              {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
            </p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-emerald-50/95">
              {t(
                'A secure workspace for Fertilizer, dealer, crop management system for Tiryani Mandal.',
                'తిర్యాని మండలానికి ఎరువులు, డీలర్, పంట నిర్వహణ వ్యవస్థ కోసం సురక్షిత వేదిక.'
              )}
            </p>
          </div>

          <div className="relative grid gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                {t('Admin access', 'అడ్మిన్ ప్రవేశం')}
              </div>
              <p className="text-sm text-emerald-50/90">
                {t('Full access to manage stock, dealers, crops, and uploads.', 'స్టాక్, డీలర్లు, పంటలు మరియు అప్లోడ్లను నిర్వహించే పూర్తి ప్రవేశం.')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <Eye className="h-5 w-5 text-cyan-200" />
                {t('Test user — view documents', 'టెస్ట్ వినియోగదారు — పత్రాలు చూడండి')}
              </div>
              <p className="text-sm text-emerald-50/90">
                {t(
                  'Sign in to view and download all uploaded files and reports.',
                  'అప్లోడ్ చేసిన అన్ని ఫైళ్లు మరియు నివేదికలను చూడటానికి మరియు డౌన్లోడ్ చేసుకోవడానికి లాగిన్ అవండి.'
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <img
                  src="/images/agri-emblem.png"
                  alt="Agriculture emblem"
                  className="mb-4 h-20 w-20 rounded-2xl border border-emerald-100 bg-white p-1.5 shadow-lg"
                />
                <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {t('Tiryani Agriculture Portal', 'తిర్యాని వ్యవసాయ పోర్టల్')}
                </h2>
                <p className="mt-1 text-sm font-bold text-emerald-700">
                  {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 lg:hidden">
                  {t(
                    'A secure workspace for Fertilizer, dealer, crop management system for Tiryani Mandal.',
                    'తిర్యాని మండలానికి ఎరువులు, డీలర్, పంట నిర్వహణ వ్యవస్థ కోసం సురక్షిత వేదిక.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                <Globe2 className="h-4 w-4" />
                {language === 'en' ? 'తెలుగు' : 'English'}
              </button>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                {t('Secure sign in', 'సురక్షిత లాగిన్')}
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">{t('Welcome', 'స్వాగతం')}</h3>
            </div>

            {error && (
              <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('Email Address', 'ఇమెయిల్ చిరునామా')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    placeholder={t('Enter email address', 'ఇమెయిల్ నమోదు చేయండి')}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('Password', 'పాస్వర్డ్')}
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    placeholder={t('Enter password', 'పాస్వర్డ్ నమోదు చేయండి')}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:from-emerald-800 hover:to-teal-800 disabled:opacity-60"
              >
                <LogIn className="h-5 w-5" />
                {loading ? t('Signing in...', 'లాగిన్ అవుతోంది...') : t('Sign In', 'లాగిన్')}
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 px-4 py-3 text-sm text-sky-950">
              <p className="flex items-center gap-2 font-bold">
                <UserRoundCheck className="h-4 w-4" />
                {t('Test login', 'టెస్ట్ లాగిన్')}
              </p>
              <p className="mt-2">
                <span className="font-semibold">Email:</span> {TEST_EMAIL}
              </p>
              <p>
                <span className="font-semibold">Password:</span> {TEST_PASSWORD}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-4 text-center text-xs leading-5 text-emerald-900">
              <p>
                <span className="font-semibold">{t('Tiryani Mandal', 'తిర్యాని మండలం')}</span>
                <span className="mx-2 text-emerald-400">·</span>
                <span>{t('Asifabad Division', 'ఆసిఫాబాద్ డివిజన్')}</span>
              </p>
              <p className="mt-2 font-semibold">
                {t('K. Vinay Reddy, MAO, Tiryani', 'కె. వినయ్ రెడ్డి, ఎం.ఏ.ఓ, తిర్యాని')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
