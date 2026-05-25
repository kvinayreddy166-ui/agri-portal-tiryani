import { useState } from 'react';
import {
  AlertCircle,
  Globe2,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';
const TEST_EMAIL = 'test@123.com';
const TEST_PASSWORD = 'test';
const TEST_AUTH_PASSWORD = 'test123';

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
    const isTestLogin =
      normalizedEmail === TEST_EMAIL && (password === TEST_PASSWORD || password === TEST_AUTH_PASSWORD);
    const authPassword = isTestLogin ? TEST_AUTH_PASSWORD : password;
    const { error: signInError } = await signIn(normalizedEmail, authPassword);

    if (signInError) {
      if (isTestLogin) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: TEST_EMAIL,
          password: TEST_AUTH_PASSWORD,
          options: {
            data: { full_name: 'Test User' },
          },
        });

        if (!signUpError) {
          const { error: retryError } = await signIn(TEST_EMAIL, TEST_AUTH_PASSWORD);
          if (!retryError) {
            setLoading(false);
            return;
          }
        }
      }

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
    <div className="min-h-screen bg-[#f4f8ef] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(34,197,94,0.12),transparent_35%),linear-gradient(300deg,rgba(234,179,8,0.12),transparent_30%)]" />
      <div className="relative w-full max-w-6xl grid overflow-hidden rounded-[28px] bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden min-h-[680px] overflow-hidden bg-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <img
            src="/images/rice.jpg"
            alt=""
            className="absolute inset-x-0 top-0 h-1/2 w-full object-cover opacity-90"
          />
          <img
            src="/images/cotton.jpg"
            alt=""
            className="absolute inset-x-0 bottom-0 h-1/2 w-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-emerald-900/64 to-amber-950/35" />
          <div className="absolute inset-x-0 top-1/2 h-24 -translate-y-1/2 bg-gradient-to-b from-transparent via-emerald-950/70 to-transparent" />

          <div className="relative">
            <div className="mb-10 inline-flex items-center gap-3 rounded-full bg-white/14 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <img src="/images/agri-emblem.png" alt="" className="h-8 w-8 rounded-full bg-white" />
              {t('Department of Agriculture', 'వ్యవసాయ శాఖ')}
            </div>
            <h1 className="max-w-md text-5xl font-black leading-tight tracking-tight">
              {t('Tiryani Agriculture Portal', 'తిర్యాని వ్యవసాయ పోర్టల్')}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-emerald-50">
              {t(
                'A secure workspace for stock, dealer, crop, upload, and analytics management across Tiryani Mandal.',
                'తిర్యాని మండలంలో స్టాక్, డీలర్, పంట, అప్లోడ్ మరియు విశ్లేషణల నిర్వహణ కోసం సురక్షిత వేదిక.'
              )}
            </p>
          </div>

          <div className="relative grid gap-4">
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                {t('Admin access', 'అడ్మిన్ ప్రవేశం')}
              </div>
              <p className="text-sm text-emerald-50">
                {t(
                  'The administrator signs in with the approved admin account.',
                  'నిర్వాహకుడు ఆమోదించబడిన అడ్మిన్ ఖాతాతో లాగిన్ అవుతారు.'
                )}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <UserRoundCheck className="h-5 w-5 text-cyan-200" />
                {t('Test user access', 'టెస్ట్ వినియోగదారు ప్రవేశం')}
              </div>
              <p className="text-sm text-emerald-50">
                {t(
                  'Other users can sign in with the assigned test login credentials.',
                  'ఇతర వినియోగదారులు ఇచ్చిన టెస్ట్ లాగిన్ వివరాలతో ప్రవేశించవచ్చు.'
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto flex min-h-[560px] w-full max-w-md flex-col justify-center">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <img
                  src="/images/agri-emblem.png"
                  alt="Agriculture emblem"
                  className="mb-4 h-20 w-20 rounded-full border border-emerald-100 bg-white p-1 shadow-md"
                />
                <h1 className="text-3xl font-black tracking-tight text-gray-950">
                  {t('Tiryani Portal', 'తిర్యాని పోర్టల్')}
                </h1>
                <p className="mt-2 text-sm font-medium text-gray-600">
                  {t('Agriculture Management System', 'వ్యవసాయ నిర్వహణ వ్యవస్థ')}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                <Globe2 className="h-4 w-4" />
                {language === 'en' ? 'తెలుగు' : 'English'}
              </button>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                {t('Secure sign in', 'సురక్షిత లాగిన్')}
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
                {t('Welcome back', 'స్వాగతం')}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t(
                  'Enter your admin or assigned test credentials to continue.',
                  'కొనసాగడానికి మీ అడ్మిన్ లేదా ఇచ్చిన టెస్ట్ లాగిన్ వివరాలు నమోదు చేయండి.'
                )}
              </p>
            </div>

            {error && (
              <div className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  {t('Email Address', 'ఇమెయిల్ చిరునామా')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder={t('Enter email address', 'ఇమెయిల్ నమోదు చేయండి')}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  {t('Password', 'పాస్వర్డ్')}
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder={t('Enter password', 'పాస్వర్డ్ నమోదు చేయండి')}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-semibold text-white shadow-lg shadow-emerald-900/15 transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="h-5 w-5" />
                {loading ? t('Signing in...', 'లాగిన్ అవుతోంది...') : t('Sign In', 'లాగిన్')}
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              <p className="font-bold">{t('Test login', 'టెస్ట్ లాగిన్')}</p>
              <p className="mt-1">
                <span className="font-semibold">Email:</span> test@123.com
                <span className="mx-2 text-sky-400">|</span>
                <span className="font-semibold">Password:</span> test
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center text-xs leading-5 text-emerald-900">
              <p>
                <span className="font-semibold">{t('Tiryani Mandal', 'తిర్యాని మండలం')}</span>
                <span className="mx-2 text-emerald-500">|</span>
                <span>{t('Asifabad Division', 'ఆసిఫాబాద్ డివిజన్')}</span>
              </p>
              <p className="mt-2 font-semibold text-emerald-800">
                {t(
                  'Developed and maintained by K. Vinay Reddy, MAO, Tiryani',
                  'అభివృద్ధి మరియు నిర్వహణ: కె. వినయ్ రెడ్డి, ఎం.ఏ.ఓ, తిర్యాని'
                )}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
