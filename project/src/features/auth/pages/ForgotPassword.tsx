import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { PortalLogo } from '../../../shared/components/ui/PortalLogo';
import { ResendOtpService } from '../services/resendOtpService';
import { AuthStepper } from '../components/AuthStepper';
import { OtpInput } from '../components/OtpInput';

type ResetStep = 'email' | 'otp' | 'password' | 'completed';

export function ForgotPassword() {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<ResetStep>('email');
  const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [confirmRevealed, setConfirmRevealed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devOtpNotice, setDevOtpNotice] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  // Step 1: Send OTP for Password Reset
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setDevOtpNotice(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError(t('Please enter a valid registered email address.', 'దయచేసి సరైన నమోదైన ఇమెయిల్ చిరునామాను నమోదు చేయండి.'));
      return;
    }

    setLoading(true);
    const res = await ResendOtpService.sendOtp({
      email: normalizedEmail,
      fullName: 'Officer',
      designation: 'Officer',
      purpose: 'reset_password',
    });
    setLoading(false);

    if (res.success) {
      setOtpCooldown(30);
      setStep('otp');
      setSuccessMessage(
        t(
          `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox and spam folder.`,
          `${normalizedEmail} కి 6-అంకెల ధృవీకరణ కోడ్ పంపబడింది. దయచేసి మీ ఇన్బాక్స్ మరియు స్పామ్ ఫోల్డర్ చూడండి.`
        )
      );
      // Only show dev OTP in development mode
      if (res.devOtp && import.meta.env.DEV) {
        setDevOtpNotice(`[Test Code]: ${res.devOtp}`);
      }
    } else {
      setError(
        res.error ||
          t('Failed to send verification code. Please check your email or network.', 'ధృవీకరణ కోడ్ పంపడం విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.')
      );
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanToken = otp.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setError(t('Please enter the 6-digit OTP code received in your email.', 'దయచేసి మీ ఇమెయిల్‌లో అందిన 6-అంకెల OTP కోడ్‌ను నమోదు చేయండి.'));
      return;
    }

    setLoading(true);
    const verifyRes = await ResendOtpService.verifyOtp(email, cleanToken, 'reset_password');
    setLoading(false);

    if (!verifyRes.success) {
      setError(
        verifyRes.error ||
          t('Invalid or expired OTP code. Please try again.', 'చెల్లని లేదా గడువు ముగిసిన OTP కోడ్. దయచేసి మళ్ళీ ప్రయత్నించండి.')
      );
      return;
    }

    setStep('password');
    setSuccessMessage(
      t('Email verified successfully! Please enter your new password.', 'ఇమెయిల్ విజయవంతంగా ధృవీకరించబడింది! ఇప్పుడు మీ కొత్త పాస్‌వర్డ్‌ను నమోదు చేయండి.')
    );
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPassword || cleanPassword.length < 6) {
      setError(t('Password must be at least 6 characters long.', 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.'));
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setError(t('Passwords do not match. Please verify.', 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు. దయచేసి సరిచూసుకోండి.'));
      return;
    }

    setLoading(true);
    const resetRes = await ResendOtpService.resetPassword({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      newPassword: cleanPassword,
    });
    setLoading(false);

    if (resetRes.success) {
      setStep('completed');
      setSuccessMessage(
        t('Your password has been reset successfully! You can now log in.', 'మీ పాస్‌వర్డ్ విజయవంతంగా రీసెట్ చేయబడింది! ఇప్పుడు మీరు లాగిన్ అవ్వవచ్చు.')
      );
    } else {
      setError(
        resetRes.error ||
          t('Failed to reset password. Please request a new verification code.', 'పాస్‌వర్డ్ రీసెట్ చేయడం విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.')
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8 dark:from-emerald-950/20 dark:via-slate-950 dark:to-slate-950">
      <div className="mx-auto max-w-lg">
        {/* Navigation & Language Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('Back to Login', 'లాగిన్‌కు తిరిగి వెళ్ళండి')}</span>
          </Link>
          <LanguageToggle language={language} onClick={toggleLanguage} tone="solid" />
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white">
            <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-white/10 p-2 backdrop-blur-xs ring-1 ring-white/20">
                <PortalLogo size="md" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('Reset Password', 'పాస్‌వర్డ్ రీసెట్')}
                </h1>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {t('Verify your registered email with Resend OTP', 'నమోదైన ఇమెయిల్‌ను OTP తో ధృవీకరించండి')}
                </p>
              </div>
            </div>

            {/* Stepper Progress */}
            <AuthStepper
              steps={[
                t('Email', 'ఇమెయిల్'),
                t('OTP', 'OTP'),
                t('New Password', 'కొత్త పాస్‌వర్డ్'),
              ]}
              currentIndex={stepIndex}
              finished={step === 'completed'}
            />
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8">
            {error && (
              <div role="alert" className="mb-5 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 animate-shake">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div role="status" className="mb-5 flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200 animate-fadeIn">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {devOtpNotice && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                <strong>{t('Development OTP Notice:', 'డెవలప్‌మెంట్ OTP నోటీసు:')}</strong> {devOtpNotice}
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('Find Your Account', 'మీ ఖాతాను కనుగొనండి')}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t(
                      'Enter your registered email address. We will dispatch a 6-digit OTP verification code to reset your password.',
                      'మీ నమోదైన ఇమెయిల్ చిరునామాను నమోదు చేయండి. పాస్‌వర్డ్ రీసెట్ చేయడానికి 6-అంకెల OTP కోడ్ పంపబడుతుంది.'
                    )}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('Registered Email Address', 'నమోదైన ఇమెయిల్ చిరునామా')} *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      inputMode="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@email.com / gmail.com"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 px-4 text-sm font-semibold text-white shadow-xs hover:shadow active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <ArrowRight className="h-4 w-4 shrink-0" />}
                  <span>{loading ? t('Sending OTP Code...', 'OTP పంపుతోంది...') : t('Send Verification OTP', 'ధృవీకరణ OTP పంపండి')}</span>
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('Enter 6-Digit Code', '6-అంకెల కోడ్ నమోదు చేయండి')}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {t('Code sent to:', 'కోడ్ పంపబడిన ఇమెయిల్:')} <span className="font-semibold text-emerald-600 dark:text-emerald-400">{email}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(null); }}
                    className="text-xs font-semibold text-emerald-200 hover:text-white hover:underline"
                  >
                    {t('Change', 'మార్చండి')}
                  </button>
                </div>

                <div>
                  <label htmlFor="reset-otp" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('6-Digit Verification Code', '6-అంకెల ధృవీకరణ కోడ్')} *
                  </label>
                  <OtpInput
                    inputId="reset-otp"
                    value={otp}
                    onChange={setOtp}
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    disabled={otpCooldown > 0 || loading}
                    onClick={() => handleSendOtp()}
                    className="flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline disabled:text-slate-400 dark:text-emerald-400 dark:disabled:text-slate-500"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>
                      {otpCooldown > 0
                        ? `${t('Resend in', 'మళ్ళీ పంపండి')} ${otpCooldown}s`
                        : t('Resend Verification Code', 'కోడ్ మళ్ళీ పంపండి')}
                    </span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 px-4 text-sm font-semibold text-white shadow-xs hover:shadow active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  <span>{loading ? t('Verifying OTP...', 'ధృవీకరిస్తోంది...') : t('Verify OTP & Continue', 'ధృవీకరించి కొనసాగించండి')}</span>
                </button>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('Create New Password', 'కొత్త పాస్‌వర్డ్‌ను సృష్టించండి')}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('Choose a strong password with at least 6 characters.', 'కనీసం 6 అక్షరాలతో బలమైన పాస్‌వర్డ్‌ను ఎంచుకోండి.')}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('New Password', 'కొత్త పాస్‌వర్డ్')} *
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={revealed ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('Enter new password', 'కొత్త పాస్‌వర్డ్ నమోదు చేయండి')}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setRevealed(!revealed)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('Confirm New Password', 'కొత్త పాస్‌వర్డ్‌ను నిర్ధారించండి')} *
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={confirmRevealed ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('Confirm new password', 'కొత్త పాస్‌వర్డ్‌ను నిర్ధారించండి')}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmRevealed(!confirmRevealed)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {confirmRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 space-y-1">
                  <div className={`flex items-center gap-1.5 ${password.length >= 6 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}`}>
                    <span>{password.length >= 6 ? '✓' : '•'}</span>
                    <span>{t('At least 6 characters', 'కనీసం 6 అక్షరాలు')}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${password && confirmPassword && password === confirmPassword ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}`}>
                    <span>{password && confirmPassword && password === confirmPassword ? '✓' : '•'}</span>
                    <span>{t('Both passwords match', 'రెండు పాస్‌వర్డ్‌లు సరిపోలుతున్నాయి')}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || password.length < 6 || password !== confirmPassword}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 text-sm font-semibold text-white shadow-xs hover:shadow active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <KeyRound className="h-4 w-4 shrink-0" />}
                  <span>{loading ? t('Updating Password...', 'పాస్‌వర్డ్ నవీకరిస్తోంది...') : t('Reset Password & Complete', 'పాస్‌వర్డ్ రీసెట్ పూర్తి చేయండి')}</span>
                </button>
              </form>
            )}

            {/* STEP 4: Completed */}
            {step === 'completed' && (
              <div className="text-center py-4 space-y-4 animate-fadeIn">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('Password Reset Successful!', 'పాస్‌వర్డ్ విజయవంతంగా రీసెట్ చేయబడింది!')}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {t(
                      'Your password has been securely updated. You can now sign in using your registered email and new password.',
                      'మీ పాస్‌వర్డ్ సురక్షితంగా మార్చబడింది. మీ నమోదైన ఇమెయిల్ మరియు కొత్త పాస్‌వర్డ్‌తో లాగిన్ అవ్వండి.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 px-4 text-sm font-semibold text-white shadow-xs hover:shadow active:scale-[0.99] transition"
                >
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  <span>{t('Proceed to Sign In', 'లాగిన్‌కు కొనసాగండి')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
