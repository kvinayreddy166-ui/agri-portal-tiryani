import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { PortalLogo } from '../../../shared/components/ui/PortalLogo';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { DEALER_DEFAULT_PASSWORD } from '../lib/dealerAuth';
import { translateDealerLoginError } from '../lib/dealerLoginMessages';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { recordSiteHit } from '../../../shared/lib/siteHits';
import { useLocation, useNavigate } from 'react-router-dom';
import { TurnstileWidget, type TurnstileWidgetHandle } from '../../../shared/components/security/TurnstileWidget';
import { isTurnstileEnabled } from '../../../shared/lib/turnstile';

const PublicOfficerTools = React.lazy(() => import('./PublicOfficerTools').then((m) => ({ default: m.PublicOfficerTools })));

const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';
const TEST_EMAIL = 'test@gmail.com';

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

  const showOfficerToolkit = location.pathname === '/officer-toolkit';
  const showStatutoryForms = location.pathname === '/officer-toolkit/smart-sampling' || location.pathname === '/officer-toolkit/sampling-hub' || location.pathname === '/officer-toolkit/statutory-forms';
  const showFormsLibrary = location.pathname === '/officer-toolkit/forms-library';
  const calculatorOpen = location.pathname === '/officer-toolkit/acreage-calculator';
  const fertilizerCalculatorOpen = location.pathname === '/officer-toolkit/fertilizer-calculator';

  const { signIn, signInDealer } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const resetCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };
  const requireCaptcha = () => {
    if (isTurnstileEnabled() && !captchaToken) {
      setError(t('Please complete the security verification below.', 'దయచేసి దిగువ సెక్యూరిటీ ధృవీకరణను పూర్తి చేయండి.'));
      return false;
    }
    return true;
  };
  const handleOfficerPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const targetEmail = officerEmail.trim().toLowerCase();
    if (!targetEmail || !officerPassword) {
      setError(t('Please enter both email and password.', 'దయచేసి ఇమెయిల్ మరియు పాస్వర్డ్ నమోదు చేయండి.'));
      return;
    }
    if (!requireCaptcha()) return;
    setLoading(true);
    const { error: signInErr } = await signIn(targetEmail, officerPassword, captchaToken ?? undefined);
    resetCaptcha();
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

    if (!requireCaptcha()) {
      setLoading(false);
      return;
    }

    if (loginMode === 'dealer') {
      const { error: signInError } = await signInDealer(dealerPhone, dealerPassword, captchaToken ?? undefined);
      resetCaptcha();
      if (signInError) {
        setError(translateDealerLoginError(signInError.message, language === 'te'));
      }
      setLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { error: signInError } = await signIn(normalizedEmail, password, captchaToken ?? undefined);
    resetCaptcha();

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4">

        <div className="relative w-full max-w-[26rem]">
          <section className="relative flex flex-col justify-start overflow-hidden rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-emerald-900/10 ring-1 ring-slate-900/5 backdrop-blur-xl animate-fadeIn dark:border-slate-800 dark:bg-slate-900/90 dark:ring-white/5 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-800 via-gold-400 to-emerald-800" />
            
            <div className="flex items-center justify-between mb-3">
              <Link
                to="/"
                className="group inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/80 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs backdrop-blur-xs transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-900 active:scale-95 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
              >
                <Home className="h-3.5 w-3.5 text-emerald-700 transition-transform group-hover:scale-110 dark:text-emerald-400" />
                <span>{t('Home', 'హోమ్')}</span>
              </Link>
              <LanguageToggle language={language} onClick={toggleLanguage} accent="emerald" />
            </div>

            <div className="w-full">
              <div className="mb-4 flex flex-col items-center gap-1.5 text-center animate-slide-up">
                <div className="login-logo-hero inline-flex">
                  <PortalLogo size="md" />
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
              <div className="mb-4 grid animate-slide-up grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs sm:text-sm font-semibold ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
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
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 text-sm font-semibold text-white shadow-xs hover:shadow transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <LogIn className="h-4 w-4 shrink-0" />}
                      <span>{loading ? t('Signing in...', 'లాగిన్ అవుతోంది...') : t('Sign In as Officer', 'అధికారిగా లాగిన్ అవ్వండి')}</span>
                    </button>
                    <div className="flex justify-center pt-1">
                      <TurnstileWidget
                        ref={turnstileRef}
                        onVerify={setCaptchaToken}
                        onExpire={() => setCaptchaToken(null)}
                        onError={() => setCaptchaToken(null)}
                      />
                    </div>
                  </form>

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
                    <div className="flex justify-center pt-1">
                      <TurnstileWidget
                        ref={turnstileRef}
                        onVerify={setCaptchaToken}
                        onExpire={() => setCaptchaToken(null)}
                        onError={() => setCaptchaToken(null)}
                      />
                    </div>
                  </form>
                </>
              )}
            </div>
          </section>

          <div className="mt-5 pb-8" />
        </div>

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
