import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileCheck,
  FileText,
  FlaskConical,
  Globe,
  HelpCircle,
  Leaf,
  LogIn,
  MapPin,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Stethoscope,
  Tractor,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { PortalLogo } from '../../../shared/components/ui/PortalLogo';
import { OfficialChannelsSidebar } from '../../../shared/components/ui/OfficialChannelsSidebar';
import { FloatingActions } from '../../../shared/components/ui/FloatingActions';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { useAuth } from '../../../shared/context/AuthContext';

/* ───────────────────────────── Static Data ───────────────────────────── */

const STATS = [
  { value: '30+', label: 'Operational Districts', sub: 'Regional Framework', icon: Globe },
  { value: '30+', label: 'Digital Modules', sub: 'Integrated System', icon: Zap },
  { value: '7', label: 'Precision Calculators', sub: 'Dosage, Seed, Area & Yield', icon: Calculator },
  { value: '100%', label: 'Offline Capable', sub: 'PWA for Rural Field Areas', icon: Smartphone },
];

const MODULE_HIGHLIGHTS = [
  {
    icon: ClipboardCheck,
    title: 'Statutory Inspection & Enforcement',
    titleTe: 'చట్టబద్ధమైన తనిఖీ & అమలు',
    desc: 'Instant digital inspection for Seed, Fertilizer & Pesticide dealers. Issue stop-sale notices, Form VIII & Form J seizure orders with cloud backup.',
    descTe: 'విత్తన, ఎరువుల & పురుగుమందుల డీలర్ల తనిఖీలు, స్టాప్ సేల్ ఆర్డర్లు, ఫారం VIII & J రికార్డులను నిర్వహించండి.',
    badge: 'Statutory',
    badgeColor: 'emerald',
    route: '/officer-toolkit/inspection-enforcement',
    requiresAuth: true,
  },
  {
    icon: FlaskConical,
    title: 'Agrochemicals Database',
    titleTe: 'వ్యవసాయ రసాయనాల భాండాగారం',
    desc: 'Exhaustive repository of fertilizers, insecticides, fungicides & herbicides with fertilizer standards, active formulations, and pre-harvest intervals.',
    descTe: 'ఎరువులు, పురుగుమందులు & తెగుళ్ల నివారణ రసాయనాల ఎరువుల ప్రమాణాలు, మోతాదులు మరియు సిఫార్సులు.',
    badge: 'Public Reference',
    badgeColor: 'gold',
    route: '/officer-toolkit/agrochemicals',
    requiresAuth: false,
  },
  {
    icon: Calculator,
    title: '7 Precision Farm Calculators',
    titleTe: '7 వ్యవసాయ కాలిక్యులేటర్లు',
    desc: 'Precision scientific tools for fertilizer dosage (N-P-K), seed rate per acre, plant population spacing, irrigation water requirements, and crop profitability.',
    descTe: 'ఎరువుల మోతాదు, విత్తన మోతాదు, మొక్కల సాంద్రత, నీటి అవసరాలు మరియు లాభదాయకత కాలిక్యులేటర్లు.',
    badge: 'Free Tools',
    badgeColor: 'emerald',
    route: '/officer-toolkit/farm-calculators',
    requiresAuth: false,
  },
  {
    icon: Stethoscope,
    title: 'AI Crop Doctor & Diagnostics',
    titleTe: 'క్రాప్ డాక్టర్ & నివారణలు',
    desc: 'Diagnostic guides for major crops (Cotton, Paddy, Maize, Pulses, Chilli) identifying insect pests, fungal diseases, and micro-nutrient deficiencies with cures.',
    descTe: 'పత్తి, వరి, మొక్కజొన్న, మిరప తదితర పంటల తెగుళ్లు, పురుగులు మరియు పోషక లోపాల సకాల నిర్ధారణ.',
    badge: 'Diagnostics',
    badgeColor: 'gold',
    route: '/officer-toolkit/crop-doctor',
    requiresAuth: false,
  },
  {
    icon: Scale,
    title: 'Acts, Orders & Ready Reckoners',
    titleTe: 'చట్టాలు, ఉత్తర్వులు & రెడీ రెకనర్',
    desc: 'Instant legal lookup for Seeds Act 1966, Insecticides Act 1968, Fertilizer regulations, and Essential Commodities Act with section citations.',
    descTe: 'సీడ్స్ యాక్ట్ 1966, ఇన్సెక్టిసైడ్స్ యాక్ట్ 1968, ఎరువుల నియంత్రణలు మరియు అత్యవసర సరుకుల చట్టం సమగ్ర మార్గదర్శకాలు.',
    badge: 'Legal Ready Reckoner',
    badgeColor: 'emerald',
    route: '/officer-toolkit/acts-and-orders',
    requiresAuth: false,
  },
  {
    icon: BookOpen,
    title: 'AI Knowledge Base (RAG)',
    titleTe: 'AI నాలెడ్జ్ బేస్',
    desc: 'Ask questions in natural language and receive grounded answers sourced directly from official circulars, departmental GOs, and crop protection manuals.',
    descTe: 'ప్రభుత్వ జీవోలు, మార్గదర్శకాలు మరియు అధికారిక వ్యవసాయ పత్రాల నుండి AI ద్వారా ఖచ్చితమైన సమాధానాలు.',
    badge: 'AI Powered',
    badgeColor: 'gold',
    route: '/login',
    requiresAuth: true,
  },
  {
    icon: FileCheck,
    title: 'Smart Sampling & Statutory Forms',
    titleTe: 'స్మార్ట్ సాంప్లింగ్ & ఫారాలు',
    desc: 'End-to-end statutory sample collection workflow with GPS location tagging, dealer acknowledgement generation, and auto-filled Form P & Form J.',
    descTe: 'విత్తనాలు, ఎరువులు మరియు పురుగుమందుల నమూనా సేకరణ మరియు చట్టబద్ధ రసీదుల డిజిటల్ తయారీ.',
    badge: 'Compliance',
    badgeColor: 'emerald',
    route: '/officer-toolkit/forms-library',
    requiresAuth: false,
  },
  {
    icon: Database,
    title: 'Unified District Agriculture Registry',
    titleTe: 'జిల్లా వ్యవసాయ రిజిస్ట్రీ',
    desc: 'Integrated databases for authorized input dealers, subsidy machinery allocations, soil health records, and daily officer field tour diaries.',
    descTe: 'లైసెన్స్ పొందిన డీలర్లు, సబ్సిడీ యంత్రాలు, మట్టి పరీక్ష రికార్డులు మరియు టూర్ డైరీ నిర్వహణ.',
    badge: 'Enterprise Hub',
    badgeColor: 'gold',
    route: '/login',
    requiresAuth: true,
  },
];

const ECOSYSTEM_TABS = [
  {
    id: 'officers',
    label: 'Agriculture Officers',
    labelTe: 'వ్యవసాయ అధికారులు',
    icon: ShieldCheck,
    headline: 'Statutory Authority & High-Speed Field Toolkit',
    headlineTe: 'అధికారుల క్షేత్రస్థాయి చట్టబద్ధ విధులు & సాధనాలు',
    description:
      'Engineered specifically for Mandal Agriculture Officers (MAOs), Assistant Director of Agriculture (ADAs), District Agriculture Officers (DAOs), and Quality Control Inspectors.',
    features: [
      'Digital dealer inspections with instant printable PDF notices',
      'Statutory stop sale orders & seizure tracking under fertilizer regulations',
      'Smart sampling workflow with geo-tagged receipts',
      'Section-by-section ready reckoner for Seed & Insecticide Acts',
      'Daily field tour diary with offline storage & automatic cloud sync',
    ],
  },
  {
    id: 'dealers',
    label: 'Input Dealers & Retailers',
    labelTe: 'డీలర్లు & అమ్మకందారులు',
    icon: Users,
    headline: 'Stock Receipts, Compliance & Inventory Transparency',
    headlineTe: 'స్టాక్ రసీదులు, నిల్వలు & విక్రయాల సమాచారం',
    description:
      'Dedicated portal for registered seed, fertilizer, and pesticide dealers to monitor supplies, maintain statutory compliance, and streamline documentation.',
    features: [
      'Digital stock verification and receipt acknowledgements',
      'Real-time allocation visibility for subsidized inputs',
      'Instant access to licensing services and renewal forms',
      'Verified chemical safety sheets & expiry tracking',
      'Simplified compliance reporting to district authorities',
    ],
  },
  {
    id: 'farmers',
    label: 'Farmers & Citizens',
    labelTe: 'రైతులు & పౌరులు',
    icon: Sprout,
    headline: 'Public Diagnostics, Precision Calculators & Grievance Desk',
    headlineTe: 'ఉచిత వ్యవసాయ సేవలు, కాలిక్యులేటర్లు & ఫిర్యాదులు',
    description:
      'Zero-barrier access to precision agricultural tools without requiring a login. Designed for rural farmers to maximize yield and protect crop health.',
    features: [
      'Scientific fertilizer dosage calculator for specific crops & acres',
      'Instant disease diagnostic guide & photo recommendations',
      'Seed rate and plant spacing calculators for ideal crop density',
      'Verified list of licensed agricultural input dealers in the district',
      'Direct grievance lodging for spurious inputs or supply shortages',
    ],
  },
];

const SAMPLE_CROPS: Record<string, { n: number; p: number; k: number; seed: string; water: string }> = {
  Cotton: { n: 120, p: 60, k: 60, seed: '0.9 - 1.2 kg/acre (Hybrid BG-II)', water: '650 - 750 mm' },
  Paddy: { n: 100, p: 50, k: 50, seed: '20 - 25 kg/acre (Transplanted)', water: '1100 - 1250 mm' },
  Maize: { n: 120, p: 60, k: 40, seed: '7.5 - 8.0 kg/acre (Hybrid)', water: '500 - 600 mm' },
  Chilli: { n: 150, p: 60, k: 80, seed: '200 - 300 g/acre (Seedling)', water: '700 - 800 mm' },
  Redgram: { n: 20, p: 50, k: 0, seed: '4.0 - 5.0 kg/acre', water: '350 - 450 mm' },
};

/* ───────────────────────────── Component ───────────────────────────── */

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  // Landing page is light-only: strip the global dark class while mounted
  // and restore the user's theme when navigating away.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (wasDark) root.classList.add('dark');
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'officers' | 'dealers' | 'farmers'>('officers');
  const [selectedCrop, setSelectedCrop] = useState<string>('Cotton');
  const [acresInput, setAcresInput] = useState<number>(1);

  const currentTab = ECOSYSTEM_TABS.find((tab) => tab.id === activeTab) || ECOSYSTEM_TABS[0];
  const cropData = SAMPLE_CROPS[selectedCrop] || SAMPLE_CROPS['Cotton'];

  const ureaBags = Math.round(((cropData.n * acresInput) / 0.46 / 45) * 10) / 10;
  const dapBags = Math.round(((cropData.p * acresInput) / 0.46 / 50) * 10) / 10;
  const mopBags = Math.round(((cropData.k * acresInput) / 0.60 / 50) * 10) / 10;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* ──────────────────────── Top Bar & Navbar ──────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/85 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex min-w-0 items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
          >
            <div className="shrink-0 transition-transform group-hover:scale-105">
              <PortalLogo size="sm" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-black tracking-tight text-emerald-800 dark:text-gold-300 font-[var(--font-stylish)]">
                {t('AGRONIX', 'అగ్రోనిక్స్')}
              </span>
              <p className="truncate text-[10px] font-medium italic tracking-wide text-gold-600 dark:text-gold-400">
                {t('Agriculture Meets Intelligence', 'వ్యవసాయం & మేధస్సు')}
              </p>
            </div>
          </button>

          {/* Nav links & actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Quick public tools anchor */}
            <button
              type="button"
              onClick={() => navigate('/officer-toolkit')}
              className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-slate-800 md:inline-flex cursor-pointer"
            >
              <Sprout className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('Public Toolkit', 'పబ్లిక్ టూల్‌కిట్')}</span>
            </button>

            {/* Login button */}
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-900/20 transition hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 active:scale-[0.98] cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{user ? t('Dashboard', 'డ్యాష్‌బోర్డ్') : t('Sign In', 'లాగిన్')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ──────────────────────── Hero Section ──────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white">
        {/* Decorative layers */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Headlines & CTA */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-emerald-900/70 px-3.5 py-1.5 text-xs font-bold text-gold-300 backdrop-blur-md">
                <Leaf className="h-3.5 w-3.5" />
                <span>{t('Comprehensive Agricultural Digital Ecosystem', 'సమగ్ర వ్యవసాయ డిజిటల్ వ్యవస్థ')}</span>
              </div>

              <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
                {t('Empowering Agriculture Through', 'వ్యవసాయానికి ఆధునిక సాంకేతికత')}
                <br />
                <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-amber-300 bg-clip-text text-transparent">
                  {t('Digital Intelligence & Enforcement', 'డిజిటల్ సాధనాలు & చట్టబద్ధ పర్యవేక్షణ')}
                </span>
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-justify text-emerald-100/90 sm:text-base">
                {t(
                  'A high-performance platform uniting Agricultural Officers, authorized Input Dealers, and Farmers. From statutory inspections (Seeds, Fertilizers, Insecticides) to precision farm calculators and AI diagnostic advisory — built to work 100% offline in the field.',
                  'వ్యవసాయเตอรี่, డీలర్లు మరియు రైతులకు అవసరమైన చట్టబద్ధ తనిఖీలు, ఎరువుల నియంత్రణ, స్మార్ట్ కాలిక్యులేటర్లు మరియు ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ సలహాల సమగ్ర పోర్టల్.'
                )}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 px-6 py-3.5 text-sm font-black text-emerald-950 shadow-xl shadow-gold-950/20 transition hover:from-gold-300 hover:to-amber-400 active:scale-[0.98] cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{user ? t('Go to Dashboard', 'డ్యాష్‌బోర్డ్‌కి వెళ్లండి') : t('Officer & Dealer Login', 'అధికారి & డీలర్ లాగిన్')}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="group inline-flex items-center gap-2 rounded-2xl border border-gold-400/50 bg-gradient-to-r from-gold-500/15 via-amber-500/10 to-transparent px-5 py-3.5 text-sm font-bold text-gold-300 backdrop-blur-md transition hover:border-gold-300 hover:bg-gold-500/25 active:scale-[0.98] cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-gold-400 transition-transform group-hover:scale-110" />
                  <span>{t('New Officer Sign Up', 'కొత్త అధికారి నమోదు')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/officer-toolkit')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:border-white/40 hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                >
                  <Sprout className="h-4 w-4 text-emerald-300" />
                  <span>{t('Explore Public Tools', 'ఉచిత పరికరాలు')}</span>
                </button>
              </div>

              {/* Badges / Trust points */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-xs font-semibold text-emerald-200/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-400" />
                  <span>{t('FCO 1985, Seeds Act 1966, Insecticide Act 1968 Ready', 'FCO 1985, విత్తన చట్టం 1966, పురుగుమందుల చట్టం 1968')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-400" />
                  <span>{t('Zero-Loss Offline Sync', 'ఆఫ్‌లైన్ వర్కింగ్ సపోర్ట్')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-400" />
                  <span>{t('English & Telugu Support', 'ద్విభాషా సదుపాయం')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Interactive Teaser Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gold-300">
                      {t('Quick Crop Calculator', 'త్వరిత పంట కాలిక్యులేటర్')}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-emerald-200">
                    {t('Live Estimation', 'ఖచ్చితమైన మోతాదు')}
                  </span>
                </div>

                {/* Crop Selector Buttons */}
                <div className="mb-4">
                  <label htmlFor="hero-crop-select" className="mb-1.5 block text-xs font-semibold text-emerald-100">
                    {t('Select Major Crop', 'పంటను ఎంచుకోండి')}
                  </label>
                  <div id="hero-crop-select" className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-3" role="group" aria-label={t('Select crop', 'పంటను ఎంచుకోండి')}>
                    {Object.keys(SAMPLE_CROPS).map((crop) => (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => setSelectedCrop(crop)}
                        aria-pressed={selectedCrop === crop}
                        className={`cursor-pointer rounded-xl px-2 py-2 text-xs font-bold transition ${
                          selectedCrop === crop
                            ? 'bg-gradient-to-r from-gold-400 to-amber-500 text-emerald-950 shadow-md font-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {crop}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Acre Input */}
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-emerald-100">
                    <label htmlFor="hero-acres">{t('Land Area (Acres)', 'భూమి విస్తీర్ణం (ఎకరాలు)')}</label>
                    <span className="shrink-0 font-bold text-gold-300">{acresInput} {acresInput === 1 ? 'Acre' : 'Acres'}</span>
                  </div>
                  <input
                    id="hero-acres"
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={acresInput}
                    onChange={(e) => setAcresInput(parseFloat(e.target.value))}
                    className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-emerald-950/60 accent-gold-400"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-emerald-300/60">
                    <span>1 Acre</span>
                    <span>5 Acres</span>
                    <span>10 Acres</span>
                  </div>
                </div>

                {/* Instant Output Pill Cards */}
                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-emerald-950/70 p-3 ring-1 ring-white/10">
                  <div className="min-w-0 text-center">
                    <p className="truncate text-[10px] font-bold text-emerald-300">Urea (45kg)</p>
                    <p className="text-lg font-black text-white">{ureaBags} <span className="text-[10px] font-normal text-emerald-200">bags</span></p>
                  </div>
                  <div className="min-w-0 border-x border-white/10 text-center">
                    <p className="truncate text-[10px] font-bold text-emerald-300">DAP (50kg)</p>
                    <p className="text-lg font-black text-white">{dapBags} <span className="text-[10px] font-normal text-emerald-200">bags</span></p>
                  </div>
                  <div className="min-w-0 text-center">
                    <p className="truncate text-[10px] font-bold text-emerald-300">MOP (50kg)</p>
                    <p className="text-lg font-black text-white">{mopBags} <span className="text-[10px] font-normal text-emerald-200">bags</span></p>
                  </div>
                </div>

                {/* Seed & Water note */}
                <div className="mt-3 flex flex-col gap-1 text-[11px] text-emerald-200/80 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">Seed: <strong className="text-white">{cropData.seed}</strong></span>
                  <span className="shrink-0">Water: <strong className="text-white">{cropData.water}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/officer-toolkit/fertilizer-calculator')}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/15 py-2.5 text-xs font-bold text-white transition hover:bg-white/25 cursor-pointer"
                >
                  <Calculator className="h-4 w-4 text-gold-300" />
                  <span>{t('Open Full Fertilizer Calculator', 'పూర్తి కాలిక్యులేటర్ తెరవండి')}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── Stats Band (light section — no overlap) ──────────────── */}
      <section className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-emerald-700"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 transition-transform group-hover:scale-110 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <s.icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-right text-[10px] font-bold leading-tight text-slate-500 dark:text-slate-400">{s.sub}</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">{s.value}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── Compact Officer Sign-Up Strip ──────────────── */}
      <section className="bg-white py-10 dark:bg-slate-900/40 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="group relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 p-4 text-left shadow-xl shadow-emerald-900/25 ring-1 ring-emerald-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-900/30 sm:gap-5 sm:p-5"
          >
            {/* Ambient glows */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold-400/20 blur-3xl transition-transform duration-500 group-hover:scale-125" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:18px_18px]" />

            {/* Animated officer badge */}
            <div className="relative shrink-0">
              <span className="absolute inset-0 animate-ping rounded-2xl bg-gold-400/40" />
              <span className="absolute -inset-1 animate-pulse rounded-2xl bg-white/20" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-emerald-950 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 sm:h-14 sm:w-14">
                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
            </div>

            {/* Copy */}
            <div className="relative min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white sm:text-base">
                  {t('New Agriculture Officer Registration', 'కొత్త వ్యవసాయ అధికారి నమోదు')}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold-300 ring-1 ring-gold-400/40">
                  <Sparkles className="h-3 w-3" />
                  {t('Official', 'అధికారిక')}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-emerald-100/80 sm:text-sm">
                {t(
                  'DAO / ADA / MAO / AEO — verified email access to inspections, Form VIII notices & offline sync',
                  'DAO / ADA / MAO / AEO — తనిఖీలు, ఫారం VIII నోటీసులు & ఆఫ్‌లైన్ సింక్'
                )}
              </p>
            </div>

            {/* CTA */}
            <span className="relative inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-gold-300 to-amber-400 px-4 py-2.5 text-xs font-black text-emerald-950 shadow-lg shadow-gold-950/30 transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-xl sm:text-sm">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('Sign Up Now', 'ఇప్పుడే నమోదు')}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </section>

      {/* ──────────────── Who Is Agronix For (Interactive 3-Pillar Ecosystem) ──────────────── */}
      <section className="border-b border-slate-200/80 bg-white py-12 dark:border-slate-800 dark:bg-slate-900/60 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Users className="h-3.5 w-3.5" />
              {t('Stakeholder Ecosystem', 'భాగస్వామ్య వ్యవస్థ')}
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {t('One Platform Built for Three Core Communities', 'ఒకే పోర్టల్ — ముగ్గురు కీలక భాగస్వాములకు')}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t('Seamlessly bridging agricultural administration, input retail, and field-level farming.', 'వ్యవసాయ పాలన, డీలర్ నెట్‌వర్క్ మరియు రైతు సేవల అనుసంధానం.')}
            </p>
          </div>

          {/* Tab selector */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-1.5 dark:border-slate-800 dark:bg-slate-950">
              {ECOSYSTEM_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as 'officers' | 'dealers' | 'farmers')}
                    aria-pressed={isActive}
                    className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-md dark:bg-emerald-700'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{language === 'te' ? tab.labelTe : tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Showcase Card */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-6 shadow-xl dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 sm:p-10">
            <div className="grid items-center gap-8 md:grid-cols-12">
              <div className="space-y-4 md:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <currentTab.icon className="h-4 w-4" />
                  <span>{language === 'te' ? currentTab.labelTe : currentTab.label}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                  {language === 'te' ? currentTab.headlineTe : currentTab.headline}
                </h3>
                <p className="text-sm leading-relaxed text-justify text-slate-600 dark:text-slate-300">
                  {currentTab.description}
                </p>

                <ul className="space-y-2.5 pt-2">
                  {currentTab.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 sm:text-sm dark:text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Graphical preview badge */}
              <div className="flex justify-center md:col-span-5">
                <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <span className="truncate text-xs font-black uppercase text-emerald-800 dark:text-gold-300">
                      {activeTab === 'officers' ? 'MAO / ADA Desk' : activeTab === 'dealers' ? 'Stock & Allocation' : 'Farmer Advisory'}
                    </span>
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-white">
                          {activeTab === 'officers' ? 'Form VIII (Sampling Notice)' : activeTab === 'dealers' ? 'Dealer Quota Receipt #2026' : 'Crop Diagnostic: Cotton BG-II'}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">Kumuram Bheem Asifabad</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700 dark:bg-gold-900 dark:text-gold-300">
                        <Calculator className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-white">
                          {activeTab === 'officers' ? 'Stop Sale Order Generator' : activeTab === 'dealers' ? 'Fertilizer POS Reconciliation' : 'Optimal N-P-K & Micronutrient Dosing'}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">Verified Fertilizer Spec</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-white">
                          {activeTab === 'officers' ? 'Enforcement Tracker & Case Log' : activeTab === 'dealers' ? 'License Renewal Status: Active' : 'Official Officer Directory Support'}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">Statutory Standard</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── Core Capabilities & Modules Grid ──────────────── */}
      <section className="bg-slate-50 py-12 dark:bg-slate-950 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-900 dark:bg-gold-950 dark:text-gold-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t('Full System Capabilities', 'సమగ్ర మాడ్యూల్స్')}
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {t('A Modern Toolkit Built Around Field Reality', 'క్షేత్రస్థాయి అవసరాలకు తగిన సాధనాలు')}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t('Engineered without bloated fluff — every module directly serves statutory compliance or agricultural productivity.', 'ఎటువంటి అనవసరపు హంగులు లేకుండా, వాస్తవ అవసరాల కోసమే రూపొందించబడింది.')}
            </p>
          </div>

          <div className="mt-12 grid h-full gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MODULE_HIGHLIGHTS.map((mod) => (
              <div
                key={mod.title}
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"
              >
                <div className="min-w-0">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
                        mod.badgeColor === 'gold'
                          ? 'bg-gold-100 text-gold-700 dark:bg-gold-950/60 dark:text-gold-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      <mod.icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        mod.badgeColor === 'gold'
                          ? 'bg-gold-50 text-gold-800 ring-1 ring-gold-200 dark:bg-gold-950/40 dark:text-gold-300 dark:ring-gold-800'
                          : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800'
                      }`}
                    >
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-black leading-snug text-slate-900 dark:text-white">
                    {language === 'te' ? mod.titleTe : mod.title}
                  </h3>
                  <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-justify text-slate-600 dark:text-slate-400">
                    {language === 'te' ? mod.descTe : mod.desc}
                  </p>
                </div>

                <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate(mod.route)}
                    className="flex w-full cursor-pointer items-center justify-between text-xs font-bold text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    <span>{mod.requiresAuth ? t('Access via Sign In', 'లాగిన్ ద్వారా ప్రవేశించండి') : t('Open Tool Directly', 'పరికరము చూడండి')}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── Direct Grievance & Public Helpdesk ──────────────── */}
      <section className="border-t border-slate-200/80 bg-white py-14 dark:border-slate-800 dark:bg-slate-900/40 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-emerald-900/10 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 p-8 text-white shadow-xl dark:border-emerald-800/40 sm:p-12">
            <div className="grid items-center gap-8 md:grid-cols-12">
              <div className="space-y-3 md:col-span-8">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gold-300 backdrop-blur-md">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{t('Farmer Grievance & Assistance', 'రైతు సమస్యల పరిష్కారం')}</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {t('Facing Fertilizer Shortages or Seed Quality Issues?', 'ఎరువుల కొరత లేదా నకిలీ విత్తనాల సమస్యలు ఉన్నాయా?')}
                </h3>
                <p className="max-w-2xl text-xs text-justify text-emerald-100 sm:text-sm">
                  {t(
                    'Farmers can file instant grievances directly with the Agricultural Officer. Our enforcement team verifies dealer stocks, investigates quality complaints, and enforces statutory consumer protections.',
                    'రైతులు తమ సమస్యలను నేరుగా అధికారులకు తెలియజేయవచ్చు. తనిఖీ బృందం డీలర్ స్టాక్‌ను తనిఖీ చేసి చర్యలు తీసుకుంటుంది.'
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row md:col-span-4 md:flex-col">
                <button
                  type="button"
                  onClick={() => navigate('/officer-toolkit/officer-contacts')}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-[0.98] sm:text-sm"
                >
                  <UserCheck className="h-4 w-4 text-gold-300" />
                  <span>{t('View Agriculture Officers Directory', 'అధికారుల సంప్రదింపు వివరాలు')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── Call to Action Banner ──────────────── */}
      <section className="bg-slate-50 py-12 dark:bg-slate-950 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 text-white shadow-lg">
            <Tractor className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {t('Ready to Experience Modern Agricultural Management?', 'ఆధునిక వ్యవసాయ నిర్వహణను ప్రారంభించండి')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            {t(
              'Sign in with your officer credentials, dealer phone number, or explore free public advisory tools.',
              'మీ అధికారి ఈమెయిల్ లేదా డీలర్ ఫోన్ నంబర్‌తో లాగిన్ అవ్వండి లేదా ఉచిత టూల్స్ ఉపయోగించండి.'
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl bg-emerald-800 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-900/20 transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4" />
              <span>{t('Direct to Login Page', 'లాగిన్ పేజీకి వెళ్లండి')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              <span>{t('Register as New Officer', 'కొత్త అధికారి నమోదు')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────── Professional Footer ──────────────── */}
      <footer className="border-t border-slate-200 bg-white pt-12 pb-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand column */}
            <div className="space-y-3 sm:col-span-2">
              <div className="flex items-center gap-2.5">
                <PortalLogo size="sm" />
                <div>
                  <span className="text-base font-black text-emerald-800 dark:text-gold-300 font-[var(--font-stylish)]">
                    AGRONIX
                  </span>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Information Management System
                  </p>
                </div>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                An integrated governance and precision agriculture platform supporting Agricultural Officers, Input Retailers, and Farmers. Built with offline-first PWA architecture and enterprise security.
              </p>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
                <MapPin className="h-3.5 w-3.5" />
                Kumuram Bheem Asifabad District
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                {t('Public Tools', 'ఉచిత సాధనాలు')}
              </p>
              <ul className="mt-3 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <li>
                  <button type="button" onClick={() => navigate('/officer-toolkit/fertilizer-calculator')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    Fertilizer Calculator
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/officer-toolkit/crop-doctor')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    Crop Doctor Diagnostics
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/officer-toolkit/agrochemicals')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    Agrochemicals Database
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/officer-toolkit/acts-and-orders')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    Acts & Ready Reckoners
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/dealers')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    Dealers Directory
                  </button>
                </li>
              </ul>
            </div>

            {/* Portal Access */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                {t('Portal Sign In', 'పోర్టల్ ప్రవేశం')}
              </p>
              <ul className="mt-3 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <li>
                  <button type="button" onClick={() => navigate('/login')} className="cursor-pointer font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                    Officer Sign In &rarr;
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/login')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    Dealer Portal Sign In
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/register')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    New Officer Sign Up
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/forgot-password')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    Reset Password
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <OfficialChannelsSidebar inline />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <button type="button" onClick={() => navigate('/disclaimer')} className="cursor-pointer text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300">
                Disclaimer
              </button>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <button type="button" onClick={() => navigate('/privacy-policy')} className="cursor-pointer text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300">
                Privacy Policy
              </button>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <button type="button" onClick={() => navigate('/terms-conditions')} className="cursor-pointer text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300">
                Terms & Conditions
              </button>
            </div>
            <p className="mt-3">
              &copy; 2026 AGRONIX &middot; Information Management System
            </p>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Developed and maintained by K. Vinay Reddy, MAO, Tiryani &middot; Kumuram Bheem Asifabad District
            </p>
          </div>
        </div>
      </footer>

      <FloatingActions />
    </div>
  );
}
