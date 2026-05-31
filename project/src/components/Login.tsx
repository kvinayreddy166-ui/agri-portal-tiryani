import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Globe2,
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
import { FarmerChatbot } from './FarmerChatbot';
import { FileActionButtons } from './ui/FileActionButtons';
import { FileTypeIcon } from './ui/FileTypeIcon';
import { PortalLogo } from './ui/PortalLogo';
import { DEALER_DEFAULT_PASSWORD } from '../lib/dealerAuth';
import { translateDealerLoginError } from '../lib/dealerLoginMessages';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { FormDownload } from '../types/database';

const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';
const TEST_EMAIL = 'test@gmail.com';
const TEST_PASSWORD = 'Test@123';

const STATUTORY_FOLDERS = [
  { id: 'fertilizers', label: 'Fertilizer' },
  { id: 'seed', label: 'Seed' },
  { id: 'pesticides', label: 'Pesticide' },
];

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
  const [loginMode, setLoginMode] = useState<'staff' | 'dealer'>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dealerPhone, setDealerPhone] = useState('');
  const [dealerPassword, setDealerPassword] = useState(DEALER_DEFAULT_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [grievanceOpen, setGrievanceOpen] = useState(false);
  const [grievanceStatus, setGrievanceStatus] = useState<string | null>(null);
  const [showStatutoryForms, setShowStatutoryForms] = useState(false);
  const [statutoryFolder, setStatutoryFolder] = useState('fertilizers');
  const [statutoryForms, setStatutoryForms] = useState<FormDownload[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
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

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!showStatutoryForms) return;

    const fetchForms = async () => {
      setFormsLoading(true);
      const { data, error } = await supabase
        .from('forms_downloads')
        .select('*')
        .in('category', STATUTORY_FOLDERS.map((folder) => folder.id))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching statutory forms:', error);
        setStatutoryForms([]);
      } else {
        setStatutoryForms(data || []);
      }
      setFormsLoading(false);
    };

    fetchForms();
  }, [showStatutoryForms]);

  const selectedStatutoryForms = useMemo(
    () => statutoryForms.filter((form) => form.category === statutoryFolder),
    [statutoryForms, statutoryFolder]
  );

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
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  if (showStatutoryForms) {
    return (
      <div className="min-h-screen bg-[#eef6f0] p-4 sm:p-6">
        <div className="mx-auto w-full max-w-5xl rounded-2xl border border-white/70 bg-white/95 p-4 shadow-xl shadow-emerald-950/10 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowStatutoryForms(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Public documents</p>
                <h1 className="text-2xl font-black text-slate-950">Statutory Forms</h1>
              </div>
            </div>
            <PortalLogo size="md" />
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2">
            {STATUTORY_FOLDERS.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setStatutoryFolder(folder.id)}
                className={`rounded-lg border px-3 py-3 text-left font-black transition ${
                  statutoryFolder === folder.id
                    ? 'border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-900/10'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300'
                }`}
              >
                <span className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  {folder.label}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="w-20 px-4 py-3 text-left text-sm font-bold">S.No.</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Proforma / Form Name</th>
                    <th className="w-44 px-4 py-3 text-right text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formsLoading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                        Loading forms...
                      </td>
                    </tr>
                  ) : selectedStatutoryForms.length > 0 ? (
                    selectedStatutoryForms.map((form, index) => (
                      <tr key={form.id} className="hover:bg-emerald-50/60">
                        <td className="px-4 py-3 text-sm font-bold text-slate-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <FileTypeIcon fileName={form.title} fileType={form.file_type} fileUrl={form.file_url || undefined} size="sm" />
                            <span className="truncate font-bold text-slate-950">{form.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {form.file_url && (
                            <FileActionButtons fileUrl={form.file_url} fileName={form.title} fileType={form.file_type} size="sm" />
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                        No statutory forms uploaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef6f0] p-3 sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(4,120,87,0.08),rgba(14,165,233,0.08)_48%,rgba(250,204,21,0.08))]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl shadow-emerald-950/10 backdrop-blur-sm lg:grid-cols-[1fr_0.95fr]">
        <section className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-emerald-950 p-8 text-white lg:flex">
          <img src="/images/rice.jpg" alt="" className="absolute inset-x-0 top-0 h-[50%] w-full object-cover opacity-95" />
          <img src="/images/cotton.jpg" alt="" className="absolute inset-x-0 bottom-0 h-[50%] w-full object-cover opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/82 via-emerald-900/58 to-slate-900/30" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md">
              <PortalLogo size="sm" className="ring-white/30" />
              {t('Department of Agriculture', 'Department of Agriculture')}
            </div>
            <h1 className="max-w-lg text-4xl font-black leading-[1.1] tracking-tight">
              {t('Tiryani Agriculture Portal', 'Tiryani Agriculture Portal')}
            </h1>
            <p className="mt-3 text-lg font-semibold text-emerald-100">
              {t('Information Management System', 'Information Management System')}
            </p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-emerald-50/95">
              {t(
                'A secure workspace for fertilizer, dealer, and crop management for Tiryani Mandal.',
                'A secure workspace for fertilizer, dealer, and crop management for Tiryani Mandal.'
              )}
            </p>
          </div>

          <div className="relative grid gap-2">
            <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                {t('Admin access', 'Admin access')}
              </div>
              <p className="text-sm text-emerald-50/90">
                {t('Full access to manage stock, dealers, crops, and uploads.', 'Full access to manage stock, dealers, crops, and uploads.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowStatutoryForms(true)}
              className="rounded-xl border border-white/15 bg-white/10 p-3 text-left backdrop-blur-md transition hover:bg-white/15"
            >
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <FileText className="h-5 w-5 text-cyan-200" />
                Statutory Forms
              </div>
              <p className="text-sm text-emerald-50/90">
                Fertilizer, seed, and pesticide forms for public view and download.
              </p>
            </button>
          </div>
        </section>

        <section className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <PortalLogo size="md" className="mb-3" />
                <h2 className="whitespace-nowrap text-lg font-black tracking-tight text-slate-950 sm:text-2xl">
                  {t('Tiryani Agriculture Portal', 'Tiryani Agriculture Portal')}
                </h2>
                <p className="mt-1 text-sm font-bold text-emerald-700">
                  {t('Information Management System', 'Information Management System')}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                <Globe2 className="h-4 w-4" />
                {language === 'en' ? 'Telugu' : 'English'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowStatutoryForms(true)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 lg:hidden"
            >
              <FileText className="h-4 w-4" />
              Statutory Forms
            </button>

            <div className="mb-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-bold">
              <button
                type="button"
                onClick={() => setLoginMode('staff')}
                className={`rounded-lg px-3 py-2 ${loginMode === 'staff' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
              >
                {t('Staff / Test', 'Staff / Test')}
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('dealer')}
                className={`rounded-lg px-3 py-2 ${loginMode === 'dealer' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
              >
                {t('Dealer', 'Dealer')}
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                {loginMode === 'dealer' ? t('Dealer login', 'Dealer login') : t('Secure sign in', 'Secure sign in')}
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">{t('Welcome', 'Welcome')}</h3>
            </div>

            {error && (
              <div className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {loginMode === 'dealer' ? (
                <>
                  <LoginField label={t('Registered phone (Dealer Management)', 'Registered phone (Dealer Management)')} icon={<Phone />} type="tel" value={dealerPhone} onChange={setDealerPhone} placeholder="9949497506" />
                  <LoginField label={t('Password', 'Password')} icon={<LockKeyhole />} type="password" value={dealerPassword} onChange={setDealerPassword} />
                  <p className="-mt-2 text-xs text-slate-500">
                    {t(`Default dealer password: ${DEALER_DEFAULT_PASSWORD}`, `Default dealer password: ${DEALER_DEFAULT_PASSWORD}`)}
                  </p>
                </>
              ) : (
                <>
                  <LoginField label={t('Email Address', 'Email Address')} icon={<Mail />} type="email" value={email} onChange={setEmail} placeholder={t('Enter email address', 'Enter email address')} />
                  <LoginField label={t('Password', 'Password')} icon={<LockKeyhole />} type="password" value={password} onChange={setPassword} placeholder={t('Enter password', 'Enter password')} />
                </>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3 font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:from-emerald-800 hover:to-teal-800 disabled:opacity-60"
              >
                {loginMode === 'dealer' ? <Store className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                {loading ? t('Signing in...', 'Signing in...') : loginMode === 'dealer' ? t('Dealer Sign In', 'Dealer Sign In') : t('Sign In', 'Sign In')}
              </button>
            </form>

            {loginMode === 'staff' && (
              <div className="mt-4 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 px-4 py-3 text-sm text-sky-950">
                <p className="flex items-center gap-2 font-bold">
                  <UserRoundCheck className="h-4 w-4" />
                  {t('Test login', 'Test login')}
                </p>
                <p className="mt-2">
                  <span className="font-semibold">Email:</span> {TEST_EMAIL}
                </p>
                <p>
                  <span className="font-semibold">Password:</span> {TEST_PASSWORD}
                </p>
              </div>
            )}

            <div className="mt-4 text-center text-[11px] font-semibold leading-5 text-slate-600">
              <p>(C) 2026- Tiryani Agri portal- Department of Agriculture, Telangana</p>
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
        Install Tiryani Portal App
      </button>

      <button
        type="button"
        onClick={() => setGrievanceOpen(true)}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-xl shadow-emerald-950/20 transition hover:bg-emerald-800"
      >
        <MessageSquareText className="h-5 w-5" />
        {t('Grievances', 'Grievances')}
      </button>

      <FarmerChatbot showOnLoginPage />

      {grievanceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-emerald-900">
                <MessageSquareText className="h-5 w-5" />
                {t('Farmer Grievance', 'Farmer Grievance')}
              </h3>
              <button type="button" onClick={() => setGrievanceOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
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
                {t('Submit Complaint', 'Submit Complaint')}
              </button>
              {grievanceStatus && <p className="text-sm font-semibold text-emerald-700">{grievanceStatus}</p>}
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
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-12 pr-4 text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          placeholder={placeholder}
          required
        />
      </div>
    </div>
  );
}
