import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react';
import { PortalLogo } from '../../../shared/components/ui/PortalLogo';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { ResendOtpService } from '../services/resendOtpService';
import { getMandalsForDistrict, getDivisionsForDistrict, QUALIFICATION_OPTIONS } from '../../../shared/data/telanganaDistrictMandalData';
import { canonicalDistrictKey } from '../lib/officerInspectorDefaults';
import { AuthStepper } from '../components/AuthStepper';
import { OtpInput } from '../components/OtpInput';

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

type SignUpStep = 'details' | 'otp' | 'password' | 'completed';

export function OfficerSignUp() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const { registerOfficer, signIn } = useAuth();

  const [step, setStep] = useState<SignUpStep>('details');
  const stepIndex = step === 'details' ? 0 : step === 'otp' ? 1 : 2;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1: Officer details
  const [form, setForm] = useState({
    fullName: '',
    designation: 'AEO',
    qualification: '',
    qualificationOther: '',
    hrmsId: '',
    phone: '',
    district: 'Kumuram Bheem Asifabad',
    mandal: 'Tiryani',
    division: '',
    divisionOther: '',
    email: '',
  });

  // Step 2: Email OTP
  const [otp, setOtp] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Step 3: Password creation
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [confirmRevealed, setConfirmRevealed] = useState(false);

  const mandals = getMandalsForDistrict(DISTRICT_TO_MANDAL_KEY[form.district] || form.district);

  const isAdaDesignation = form.designation === 'ADA';
  const districtKey = canonicalDistrictKey(form.district);
  const divisionOptions = isAdaDesignation
    ? getDivisionsForDistrict(districtKey).length
      ? getDivisionsForDistrict(districtKey)
      : getDivisionsForDistrict(districtKey.replace('–', '-'))
    : [];
  const resolvedQualification = form.qualification === 'Others' ? form.qualificationOther.trim() : form.qualification;
  const resolvedDivision = form.division === 'Others' ? form.divisionOther.trim() : form.division;

  // Cooldown countdown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  // Handle Step 1 -> Send OTP via Resend
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim().replace(/\D/g, '');

    if (!fullName || !email || !phone || !form.district || !form.mandal || !resolvedQualification) {
      setError(t('Please fill in all mandatory fields.', 'దయచేసి అన్ని తప్పనిసరి వివరాలను పూరించండి.'));
      return;
    }

    if (isAdaDesignation && !resolvedDivision) {
      setError(t('Please select your division.', 'దయచేసి మీ డివిజన్‌ను ఎంచుకోండి.'));
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError(t('Please enter a valid official email address.', 'దయచేసి సరైన అధికారిక ఇమెయిల్ చిరునామాను నమోదు చేయండి.'));
      return;
    }

    if (phone.length < 10) {
      setError(t('Please enter a valid 10-digit mobile number.', 'దయచేసి సరైన 10-అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి.'));
      return;
    }

    setLoading(true);
    const res = await ResendOtpService.sendOtp({
      email,
      fullName,
      designation: form.designation,
      purpose: 'registration',
      payload: {
        fullName,
        designation: form.designation,
        qualification: resolvedQualification,
        hrmsId: form.hrmsId.trim(),
        district: form.district,
        mandal: form.mandal,
        division: isAdaDesignation ? resolvedDivision : '',
        phone,
      },
    });
    setLoading(false);

    if (!res.success) {
      setError(res.error || t('Failed to send verification code. Please check your email or try again.', 'ధృవీకరణ కోడ్ పంపడంలో విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'));
      return;
    }

    setStep('otp');
    setOtpCooldown(60);
    // Only show dev OTP in development mode, not in production
    if (res.devOtp && import.meta.env.DEV) {
      setSuccessMessage(
        t(
          `Verification code sent! (Dev Mode Code: ${res.devOtp})`,
          `ధృవీకరణ కోడ్ పంపబడింది! (డెవ్ మోడ్ OTP: ${res.devOtp})`
        )
      );
    } else {
      setSuccessMessage(
        t(
          `A 6-digit verification code has been sent to ${email}. Please check your inbox and spam folder.`,
          `${email} కి 6-అంకెల ధృవీకరణ కోడ్ పంపబడింది. దయచేసి మీ ఇన్బాక్స్ మరియు స్పామ్ ఫోల్డర్ చూడండి.`
        )
      );
    }
  };

  // Handle Step 2 -> Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const token = otp.trim();
    if (!token || token.length < 6) {
      setError(t('Please enter the 6-digit OTP code received in your email.', 'దయచేసి మీ ఇమెయిల్‌లో అందిన 6-అంకెల OTP కోడ్‌ను నమోదు చేయండి.'));
      return;
    }

    setLoading(true);
    const verifyRes = await ResendOtpService.verifyOtp(form.email, token, 'registration');
    setLoading(false);

    if (!verifyRes.success) {
      setError(verifyRes.error || t('Invalid or expired OTP code. Please try again.', 'చెల్లని లేదా గడువు ముగిసిన OTP కోడ్. దయచేసి మళ్ళీ ప్రయత్నించండి.'));
      return;
    }

    // OTP Verified! Advance to Step 3 (Set Password)
    setStep('password');
    setSuccessMessage(t('Email verified successfully! Now create your password.', 'ఇమెయిల్ విజయవంతంగా ధృవీకరించబడింది! ఇప్పుడు మీ పాస్‌వర్డ్‌ను సృష్టించండి.'));
  };

  // Handle Step 3 -> Create Password & Finalize Profile
  const handleSetPasswordAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword || trimmedPassword.length < 6) {
      setError(t('Password must be at least 6 characters long.', 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.'));
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError(t('Passwords do not match. Please verify.', 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు. దయచేసి సరిచూసుకోండి.'));
      return;
    }

    setLoading(true);
    const { error: regErr } = await registerOfficer({
      full_name: form.fullName.trim(),
      designation: form.designation.trim(),
      hrms_id: form.hrmsId.trim(),
      qualification: resolvedQualification,
      district: form.district.trim(),
      mandal: form.mandal.trim(),
      division: isAdaDesignation ? resolvedDivision : '',
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      password: trimmedPassword,
    });

    if (regErr) {
      setLoading(false);
      setError(regErr.message);
      return;
    }

    // Attempt sign-in with newly created credentials
    await signIn(form.email.trim().toLowerCase(), trimmedPassword).catch(() => null);
    setLoading(false);

    setStep('completed');
    setSuccessMessage(t('Officer profile created and password set successfully!', 'అధికారి ప్రొఫైల్ మరియు పాస్‌వర్డ్ విజయవంతంగా సృష్టించబడ్డాయి!'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8 dark:from-emerald-950/20 dark:via-slate-950 dark:to-slate-950">
      <div className="mx-auto max-w-xl">
        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('Back to Login', 'లాగిన్‌కు తిరిగి వెళ్ళండి')}</span>
          </Link>
          <LanguageToggle language={language} onClick={toggleLanguage} tone="solid" />
        </div>

        {/* Card Container */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          {/* Brand Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white">
            <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-white/10 p-2 backdrop-blur-xs ring-1 ring-white/20">
                <PortalLogo size="md" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('Agricultural Officer Sign Up', 'వ్యవసాయ అధికారి నమోదు')}
                </h1>
              </div>
            </div>

            {/* Stepper Progress */}
            <AuthStepper
              steps={[
                t('Details', 'వివరాలు'),
                t('Email OTP', 'ఇమెయిల్ OTP'),
                t('Password', 'పాస్‌వర్డ్'),
              ]}
              currentIndex={stepIndex}
              finished={step === 'completed'}
            />
          </div>

          <div className="p-6 sm:p-8">
            {/* Feedback Alerts */}
            {error && (
              <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs sm:text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {successMessage && (
              <div role="status" className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs sm:text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* STEP 1: OFFICER DETAILS FORM */}
            {step === 'details' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('Step 1: Official Profile Details', 'దశ 1: అధికారిక ప్రొఫైల్ వివరాలు')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('Enter your departmental details. We will verify your official email next.', 'మీ శాఖ వివరాలను నమోదు చేయండి. తదుపరి మీ అధికారిక ఇమెయిల్ ధృవీకరించబడుతుంది.')}
                  </p>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Officer Full Name', 'అధికారి పూర్తి పేరు')} *
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder={t('e.g. K. Vinay Reddy', 'ఉదా. కె. వినయ్ రెడ్డి')}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Designation', 'హోదా')} *
                    </label>
                    <select
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    >
                      <option value="AEO">AEO (Agricultural Extension Officer)</option>
                      <option value="MAO">MAO (Mandal Agriculture Officer)</option>
                      <option value="ADA">ADA (Assistant Director of Agriculture)</option>
                      <option value="DAO">DAO (District Agriculture Officer)</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Qualification', 'అర్హత')} *
                    </label>
                    <select
                      value={form.qualification}
                      onChange={(e) => setForm({ ...form, qualification: e.target.value, qualificationOther: '' })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    >
                      <option value="">{t('Select qualification', 'హోదా ఎంచుకోండి')}</option>
                      {QUALIFICATION_OPTIONS.map((q) => (
                        <option key={q.value} value={q.value}>{q.label}</option>
                      ))}
                    </select>
                    {form.qualification === 'Others' && (
                      <input
                        type="text"
                        value={form.qualificationOther}
                        onChange={(e) => setForm({ ...form, qualificationOther: e.target.value })}
                        placeholder={t('Enter qualification', 'హోదా నమోదు చేయండి')}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                      />
                    )}
                  </div>

                  {isAdaDesignation && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t('Division', 'డివిజన్')} *
                      </label>
                      <select
                        value={form.division}
                        onChange={(e) => setForm({ ...form, division: e.target.value, divisionOther: '' })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                      >
                        <option value="">{t('Select division', 'డివిజన్ ఎంచుకోండి')}</option>
                        {divisionOptions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                        <option value="Others">{t('Others', 'ఇతరులు')}</option>
                      </select>
                      {form.division === 'Others' && (
                        <input
                          type="text"
                          value={form.divisionOther}
                          onChange={(e) => setForm({ ...form, divisionOther: e.target.value })}
                          placeholder={t('Enter division name', 'డివిజన్ పేరు నమోదు చేయండి')}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Employee ID', 'ఉద్యోగి ID')}
                    </label>
                    <input
                      type="text"
                      value={form.hrmsId}
                      onChange={(e) => setForm({ ...form, hrmsId: e.target.value })}
                      placeholder={t('e.g. 1029384 (Optional)', 'ఉదా. 1029384')}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Mobile Number', 'మొబైల్ నంబర్')} *
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="9949497506"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('District', 'జిల్లా')} *
                    </label>
                    <select
                      value={form.district}
                      onChange={(e) => {
                        const dist = e.target.value;
                        const distMandals = getMandalsForDistrict(DISTRICT_TO_MANDAL_KEY[dist] || dist);
                        setForm({ ...form, district: dist, mandal: distMandals[0] || '' });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    >
                      {TELANGANA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Mandal / Jurisdiction', 'మండలం / పరిధి')} *
                    </label>
                    <select
                      value={form.mandal}
                      onChange={(e) => setForm({ ...form, mandal: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    >
                      {mandals.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="District HQ">{t('District HQ / Others', 'జిల్లా కేంద్రం / ఇతరులు')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Registered Email Address', 'నమోదైన ఇమెయిల్ చిరునామా')} *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      inputMode="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="officer@email.com / gmail.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {t('A 6-digit OTP verification code will be sent to this email via Resend.', 'ఈ ఇమెయిల్‌కు Resend ద్వారా 6-అంకెల OTP కోడ్ పంపబడుతుంది.')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 text-sm font-semibold text-white shadow-xs hover:shadow active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Send className="h-4 w-4 shrink-0" />}
                  <span>{loading ? t('Sending OTP via Resend...', 'Resend ద్వారా OTP పంపుతోంది...') : t('Send Verification OTP & Continue', 'ధృవీకరణ OTP పంపి కొనసాగించండి')}</span>
                </button>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span>{t('Already registered as an Officer?', 'ఇప్పటికే అధికారిగా నమోదు చేసుకున్నారా?')} </span>
                  <Link to="/login" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                    {t('Sign In here →', 'ఇక్కడ లాగిన్ అవ్వండి →')}
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 2: EMAIL OTP VERIFICATION */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-slide-up">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('Step 2: Verify Your Official Email', 'దశ 2: మీ అధికారిక ఇమెయిల్‌ను ధృవీకరించండి')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('Enter the 6-digit OTP code dispatched via Resend.', 'Resend ద్వారా పంపిన 6-అంకెల OTP కోడ్‌ను నమోదు చేయండి.')}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/80 dark:bg-emerald-950/40 p-4 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-emerald-950 dark:text-emerald-100 block text-xs sm:text-sm">
                        {t('OTP Dispatched via Resend', 'Resend ద్వారా OTP పంపబడింది')}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 mt-1 block">
                        {t('Sent to:', 'పంపబడిన ఇమెయిల్:')} <strong className="text-emerald-900 dark:text-emerald-200 font-bold">{form.email}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setStep('details'); setError(null); }}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 shrink-0"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>{t('Edit Details', 'వివరాలను సవరించండి')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-otp" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t('Enter 6-Digit Email OTP', '6-అంకెల ఇమెయిల్ OTP నమోదు చేయండి')} *
                  </label>
                  <OtpInput
                    inputId="signup-otp"
                    value={otp}
                    onChange={setOtp}
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t('Please check your inbox or spam folder. The code expires in 10 minutes.', 'దయచేసి మీ ఇన్బాక్స్ లేదా స్పామ్ ఫోల్డర్ చూడండి. కోడ్ 10 నిమిషాల్లో ముగుస్తుంది.')}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={otpCooldown > 0 || loading}
                    onClick={() => handleSendOtp()}
                    className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline disabled:text-slate-400 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{otpCooldown > 0 ? `${t('Resend OTP in', 'మళ్లీ పంపు')} ${otpCooldown}s` : t('Resend OTP', 'మళ్లీ OTP పంపండి')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep('details'); setError(null); }}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                  >
                    {t('Change Email Address', 'ఇమెయిల్ మార్చండి')}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 text-sm font-semibold text-white shadow-xs hover:shadow active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
                  <span>{loading ? t('Verifying OTP...', 'ధృవీకరిస్తోంది...') : t('Verify Email & Set Password →', 'ఇమెయిల్ ధృవీకరించి పాస్‌వర్డ్ సెట్ చేయండి →')}</span>
                </button>
              </form>
            )}

            {/* STEP 3: CREATE PASSWORD AFTER AUTHENTICATION */}
            {step === 'password' && (
              <form onSubmit={handleSetPasswordAndRegister} className="space-y-4 animate-slide-up">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('Step 3: Create Your Officer Password', 'దశ 3: మీ అధికారి పాస్‌వర్డ్‌ను సృష్టించండి')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('Your official email is authenticated. Create a secure password to complete your account setup.', 'మీ అధికారిక ఇమెయిల్ ధృవీకరించబడింది. ఖాతా సెటప్‌ను పూర్తి చేయడానికి సురక్షితమైన పాస్‌వర్డ్‌ను సృష్టించండి.')}
                  </p>
                </div>

                {/* Verified Badge Header */}
                <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 text-xs flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                    ✓
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-emerald-900 dark:text-emerald-100 truncate">
                      {form.fullName} ({form.designation})
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] truncate">
                      {t('Authenticated Email:', 'ధృవీకరించబడిన ఇమెయిల్:')} <strong className="text-emerald-800 dark:text-emerald-300 font-semibold">{form.email}</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Create Password', 'పాస్‌వర్డ్ సృష్టించండి')} *
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={revealed ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('Min 6 characters (e.g. Agri#2026)', 'కనీసం 6 అక్షరాలు')}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-10 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setRevealed(!revealed)}
                      aria-label="Toggle password visibility"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Confirm Password', 'పాస్‌వర్డ్‌ను నిర్ధారించండి')} *
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={confirmRevealed ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('Re-enter password', 'పాస్‌వర్డ్‌ను మళ్లీ నమోదు చేయండి')}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-10 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmRevealed(!confirmRevealed)}
                      aria-label="Toggle confirm password visibility"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {confirmRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-500">
                      {t('Passwords do not match.', 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు.')}
                    </p>
                  )}
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
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 text-sm font-semibold text-white shadow-xs hover:shadow active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <UserCheck className="h-4 w-4 shrink-0" />}
                  <span>{loading ? t('Setting Password & Saving...', 'పాస్‌వర్డ్ సెట్ చేస్తోంది...') : t('Set Password & Complete Registration', 'పాస్‌వర్డ్ సెట్ చేసి నమోదు పూర్తి చేయండి')}</span>
                </button>
              </form>
            )}

            {/* STEP 4: SUCCESS & CAN LOGIN CONFIRMATION */}
            {step === 'completed' && (
              <div className="space-y-5 text-center animate-slide-up py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ring-8 ring-emerald-50 dark:ring-emerald-900/20">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {t('Registration Completed & Password Set!', 'నమోదు పూర్తయింది & పాస్‌వర్డ్ సెట్ చేయబడింది!')}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {t('Your official account is verified. You can now login anytime using your email and password.', 'మీ అధికారిక ఖాతా ధృవీకరించబడింది. మీరు ఇప్పుడు మీ ఇమెయిల్ మరియు పాస్‌వర్డ్ ఉపయోగించి ఎప్పుడైనా లాగిన్ అవ్వవచ్చు.')}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left text-xs dark:border-slate-800 dark:bg-slate-800/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('Officer Name:', 'అధికారి పేరు:')}</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{form.fullName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('Designation:', 'హోదా:')}</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{form.designation} ({form.mandal}, {form.district})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('Registered Email:', 'నమోదైన ఇమెయిల్:')}</span>
                    <strong className="text-emerald-800 dark:text-emerald-300 font-bold">{form.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('Password:', 'పాస్‌వర్డ్:')}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ {t('Created & Ready', 'సృష్టించబడింది')}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow active:scale-[0.99] transition"
                  >
                    <span>{t('Go to Dashboard', 'డాష్‌బోర్డ్‌కు వెళ్లండి')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>{t('Go to Login Page', 'లాగిన్ పేజీకి వెళ్లండి')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfficerSignUp;
