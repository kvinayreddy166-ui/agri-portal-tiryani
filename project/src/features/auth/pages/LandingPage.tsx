import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
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
  { value: '30+', label: 'Operational Districts', labelTe: 'కార్యాచరణ జిల్లాలు', sub: 'Regional Framework', subTe: 'ప్రాంతీయ వ్యవస్థ', icon: Globe },
  { value: '30+', label: 'Digital Modules', labelTe: 'డిజిటల్ మాడ్యూల్స్', sub: 'Integrated System', subTe: 'సమీకృత వ్యవస్థ', icon: Zap },
  { value: '7', label: 'Precision Calculators', labelTe: 'వ్యవసాయ కాలిక్యులేటర్లు', sub: 'Dosage, Seed, Area & Yield', subTe: 'ఎరువులు, విత్తనాలు & దిగుబడి', icon: Calculator },
  { value: '100%', label: 'Offline Capable', labelTe: 'ఆఫ్‌లైన్ పనితీరు', sub: 'PWA for Rural Field Areas', subTe: 'గ్రామీణ ప్రాంతాల కోసం PWA', icon: Smartphone },
];

const MODULE_HIGHLIGHTS = [
  {
    icon: ClipboardCheck,
    title: 'Statutory Inspection & Enforcement',
    titleTe: 'చట్టబద్ధమైన తనిఖీ & అమలు',
    desc: 'Instant digital inspection for Seed, Fertilizer & Pesticide dealers. Issue stop-sale notices, Form VIII & Form J seizure orders with cloud backup.',
    descTe: 'విత్తన, ఎరువుల & పురుగుమందుల డీలర్ల తనిఖీలు, స్టాప్ సేల్ ఆర్డర్లు, ఫారం VIII & J రికార్డులను నిర్వహించండి.',
    badge: 'Statutory',
    badgeTe: 'చట్టబద్ధం',
    badgeColor: 'emerald',
    route: '/officer-toolkit/inspection-enforcement',
  },
  {
    icon: FlaskConical,
    title: 'Agrochemicals Database',
    titleTe: 'వ్యవసాయ రసాయనాల భాండాగారం',
    desc: 'Exhaustive repository of fertilizers, insecticides, fungicides & herbicides with fertilizer standards, active formulations, and pre-harvest intervals.',
    descTe: 'ఎరువులు, పురుగుమందులు & తెగుళ్ల నివారణ రసాయనాల ఎరువుల ప్రమాణాలు, మోతాదులు మరియు సిఫార్సులు.',
    badge: 'Public Reference',
    badgeTe: 'ప్రజా సమాచారం',
    badgeColor: 'gold',
    route: '/officer-toolkit/agrochemicals',
  },
  {
    icon: Calculator,
    title: '7 Precision Farm Calculators',
    titleTe: '7 వ్యవసాయ కాలిక్యులేటర్లు',
    desc: 'Precision scientific tools for fertilizer dosage (N-P-K), seed rate per acre, plant population spacing, irrigation water requirements, and crop profitability.',
    descTe: 'ఎరువుల మోతాదు, విత్తన మోతాదు, మొక్కల సాంద్రత, నీటి అవసరాలు మరియు లాభదాయకత కాలిక్యులేటర్లు.',
    badge: 'Free Tools',
    badgeTe: 'ఉచిత సాధనాలు',
    badgeColor: 'emerald',
    route: '/officer-toolkit/farm-calculators',
  },
  {
    icon: Stethoscope,
    title: 'AI Crop Doctor & Diagnostics',
    titleTe: 'క్రాప్ డాక్టర్ & నివారణలు',
    desc: 'Diagnostic guides for major crops (Cotton, Paddy, Maize, Pulses, Chilli) identifying insect pests, fungal diseases, and micro-nutrient deficiencies with cures.',
    descTe: 'పత్తి, వరి, మొక్కజొన్న, మిరప తదితర పంటల తెగుళ్లు, పురుగులు మరియు పోషక లోపాల సకాల నిర్ధారణ.',
    badge: 'Diagnostics',
    badgeTe: 'పంట నిర్ధారణ',
    badgeColor: 'gold',
    route: '/officer-toolkit/crop-doctor',
  },
  {
    icon: Scale,
    title: 'Acts, Orders & Ready Reckoners',
    titleTe: 'చట్టాలు, ఉత్తర్వులు & రెడీ రెకనర్',
    desc: 'Instant legal lookup for Seeds Act 1966, Insecticides Act 1968, Fertilizer regulations, and Essential Commodities Act with section citations.',
    descTe: 'సీడ్స్ యాక్ట్ 1966, ఇన్సెక్టిసైడ్స్ యాక్ట్ 1968, ఎరువుల నియంత్రణలు మరియు అత్యవసర సరుకుల చట్టం సమగ్ర మార్గదర్శకాలు.',
    badge: 'Legal Ready Reckoner',
    badgeTe: 'చట్టాల గైడ్',
    badgeColor: 'emerald',
    route: '/officer-toolkit/acts-and-orders',
  },
  {
    icon: BookOpen,
    title: 'AI Knowledge Base (RAG)',
    titleTe: 'AI నాలెడ్జ్ బేస్',
    desc: 'Ask questions in natural language and receive grounded answers sourced directly from official circulars, departmental GOs, and crop protection manuals.',
    descTe: 'ప్రభుత్వ జీవోలు, మార్గదర్శకాలు మరియు అధికారిక వ్యవసాయ పత్రాల నుండి AI ద్వారా ఖచ్చితమైన సమాధానాలు.',
    badge: 'AI Powered',
    badgeTe: 'AI ఆధారితం',
    badgeColor: 'gold',
    route: '/knowledge',
  },
  {
    icon: FileCheck,
    title: 'Smart Sampling & Statutory Forms',
    titleTe: 'స్మార్ట్ సాంప్లింగ్ & ఫారాలు',
    desc: 'End-to-end statutory sample collection workflow with GPS location tagging, dealer acknowledgement generation, and auto-filled Form P & Form J.',
    descTe: 'విత్తనాలు, ఎరువులు మరియు పురుగుమందుల నమూనా సేకరణ మరియు చట్టబద్ధ రసీదుల డిజిటల్ తయారీ.',
    badge: 'Compliance',
    badgeTe: 'నిబంధనల పాలన',
    badgeColor: 'emerald',
    route: '/officer-toolkit/forms-library',
  },
  {
    icon: Database,
    title: 'Unified District Agriculture Registry',
    titleTe: 'జిల్లా వ్యవసాయ రిజిస్ట్రీ',
    desc: 'Integrated databases for authorized input dealers, subsidy machinery allocations, soil health records, and daily officer field tour diaries.',
    descTe: 'లైసెన్స్ పొందిన డీలర్లు, సబ్సిడీ యంత్రాలు, మట్టి పరీక్ష రికార్డులు మరియు టూర్ డైరీ నిర్వహణ.',
    badge: 'Enterprise Hub',
    badgeTe: 'కేంద్ర పోర్టల్',
    badgeColor: 'gold',
    route: '/dealers',
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
    descriptionTe:
      'మండల వ్యవసాయ అధికారులు (MAO), సహాయ వ్యవసాయ సంచాలకులు (ADA), జిల్లా వ్యవసాయ అధికారులు (DAO) మరియు క్వాలిటీ కంట్రోల్ ఇన్‌స్పెక్టర్ల కోసం ప్రత్యేకంగా రూపొందించబడింది.',
    features: [
      'Digital dealer inspections with instant printable PDF notices',
      'Statutory stop sale orders & seizure tracking under fertilizer regulations',
      'Smart sampling workflow with geo-tagged receipts',
      'Section-by-section ready reckoner for Seed & Insecticide Acts',
      'Daily field tour diary with offline storage & automatic cloud sync',
    ],
    featuresTe: [
      'తక్షణ ప్రింట్ చేయగల PDF నోటీసులతో డిజిటల్ డీలర్ తనిఖీలు',
      'ఎరువుల నియంత్రణ నిబంధనల ప్రకారం స్టాప్ సేల్ ఆర్డర్లు & సీజ్ రికార్డులు',
      'జియో-ట్యాగ్డ్ రసీదులతో కూడిన స్మార్ట్ నమూనా (శాంప్లింగ్) సేకరణ',
      'విత్తన & పురుగుమందుల చట్టాల సమగ్ర సెక్షన్-వారీ గైడ్ (రెడీ రెకనర్)',
      'ఆఫ్‌లైన్ స్టోరేజ్ & ఆటో క్లౌడ్ సింక్‌తో రోజువారీ ఫీల్డ్ టూర్ డైరీ',
    ],
  },
  {
    id: 'dealers',
    label: 'Input Dealers & Retailers',
    labelTe: 'డీలర్లు & రిటైలర్లు',
    icon: Users,
    headline: 'Stock Receipts, Compliance & Inventory Transparency',
    headlineTe: 'స్టాక్ రసీదులు, నిబంధనల పాలన & పారదర్శక నిల్వలు',
    description:
      'Dedicated portal for registered seed, fertilizer, and pesticide dealers to monitor supplies, maintain statutory compliance, and streamline documentation.',
    descriptionTe:
      'నమోదిత విత్తన, ఎరువుల మరియు పురుగుమందుల డీలర్ల కోసం ప్రత్యేక పోర్టల్ — సరఫరాల పర్యవేక్షణ, చట్టబద్ధ నిబంధనల పాటింపు మరియు సులభతర రికార్డుల నిర్వహణ.',
    features: [
      'Digital stock verification and receipt acknowledgements',
      'Real-time allocation visibility for subsidized inputs',
      'Instant access to licensing services and renewal forms',
      'Verified chemical safety sheets & expiry tracking',
      'Simplified compliance reporting to district authorities',
    ],
    featuresTe: [
      'డిజిటల్ స్టాక్ ధ్రువీకరణ మరియు రసీదుల ఆమోదం',
      'సబ్సిడీ ఎరువులు మరియు విత్తనాల సరఫరా వివరాల ప్రత్యక్ష వీక్షణ',
      'లైసెన్సింగ్ సేవలు మరియు రెన్యువల్ ఫారాల తక్షణ లభ్యత',
      'రసాయన భద్రతా సూచికలు మరియు గడువు తేదీల (ఎక్స్‌పైరీ) ట్రాకింగ్',
      'జిల్లా అధికారులకు సులభతర చట్టబద్ధ నివేదికల సమర్పణ',
    ],
  },
  {
    id: 'farmers',
    label: 'Farmers & Citizens',
    labelTe: 'రైతులు & పౌరులు',
    icon: Sprout,
    headline: 'Public Diagnostics, Precision Calculators & Grievance Desk',
    headlineTe: 'ఉచిత పంట వ్యాధి నిర్ధారణ, కాలిక్యులేటర్లు & సమస్యల పరిష్కారం',
    description:
      'Access to precision agricultural tools, diagnostics and grievance support through the portal. Designed for rural farmers to maximize yield and protect crop health.',
    descriptionTe:
      'పోర్టల్ ద్వారా ఆధునిక వ్యవసాయ సాధనాలు, నిర్ధారణలు మరియు సమస్యల పరిష్కార మద్దతు. రైతులు అధిక దిగుబడి సాధించి పంట ఆరోగ్యాన్ని కాపాడుకోవడానికి రూపొందించబడింది.',
    features: [
      'Scientific fertilizer dosage calculator for specific crops & acres',
      'Instant disease diagnostic guide & photo recommendations',
      'Seed rate and plant spacing calculators for ideal crop density',
      'Verified list of licensed agricultural input dealers in the district',
      'Direct grievance lodging for spurious inputs or supply shortages',
    ],
    featuresTe: [
      'పంటలు మరియు విస్తీర్ణానికి తగిన శాస్త్రీయ ఎరువుల మోతాదు కాలిక్యులేటర్',
      'తక్షణ పంట తెగుళ్లు, వ్యాధుల నిర్ధారణ గైడ్ మరియు ఫోటో సిఫార్సులు',
      'సరైన పంట సాంద్రత కోసం విత్తన మోతాదు మరియు నాటే దూరం కాలిక్యులేటర్లు',
      'జిల్లాలోని లైసెన్స్ పొందిన డీలర్ల ధ్రువీకృత జాబితా',
      'నకిలీ ఉత్పత్తులు లేదా సరఫరా కొరతపై నేరుగా ఫిర్యాదు నమోదు చేసే సదుపాయం',
    ],
  },
];

/* ───────────────────────────── Component ───────────────────────────── */

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

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

  const currentTab = ECOSYSTEM_TABS.find((tab) => tab.id === activeTab) || ECOSYSTEM_TABS[0];

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
                AGRONIX
              </span>
              <p className="truncate text-[10px] font-medium italic tracking-wide text-gold-600 dark:text-gold-400">
                Agriculture Meets Intelligence
              </p>
            </div>
          </button>

          {/* Nav links & actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Animated language toggle */}
            <div
              role="group"
              aria-label={language === 'en' ? 'Swap to Telugu' : 'Swap to English'}
              className="relative flex h-8 items-center rounded-full border border-gold-300/70 bg-gold-50/80 p-0.5 shadow-[0_1px_3px_rgba(216,155,24,0.15)]"
            >
              <span
                aria-hidden="true"
                className={`absolute left-0.5 top-0.5 h-7 w-[calc(50%-2px)] rounded-full bg-gradient-to-r from-gold-400 to-amber-500 shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${language === 'te' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'}`}
              />
              <button
                type="button"
                onClick={() => language !== 'en' && toggleLanguage()}
                aria-pressed={language === 'en'}
                className={`relative z-10 flex h-7 w-9 items-center justify-center rounded-full text-[10px] font-black transition-colors duration-200 ${language === 'en' ? 'text-emerald-950' : 'text-gold-700 hover:text-gold-800'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => language !== 'te' && toggleLanguage()}
                aria-pressed={language === 'te'}
                className={`relative z-10 flex h-7 w-9 items-center justify-center rounded-full text-[10px] font-black transition-colors duration-200 ${language === 'te' ? 'text-emerald-950' : 'text-gold-700 hover:text-gold-800'}`}
              >
                తె
              </button>
            </div>

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
                  'A high-performance platform uniting Agriculture Officers, authorized Input Dealers, and Farmers. From statutory inspections (Seeds, Fertilizers, Insecticides) to precision farm calculators and AI diagnostic advisory — built to work 100% offline in the field.',
                  'వ్యవసాయ అధికారులు, అధీకృత డీలర్లు మరియు రైతులకు అనుసంధాన వేదిక. చట్టబద్ధ తనిఖీలు (విత్తనాలు, ఎరువులు, పురుగుమందులు), శాస్త్రీయ కాలిక్యులేటర్లు మరియు AI పంట సలహాలతో — క్షేత్రస్థాయిలో 100% ఆఫ్‌లైన్‌లో పనిచేసేలా రూపొందించబడింది.'
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

              </div>

              {/* Badges / Trust points */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-xs font-semibold text-emerald-200/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-400" />
                  <span>{t('FCO 1985, Seeds Act 1966, Insecticide Act 1968 Ready', 'FCO 1985, విత్తనాల చట్టం 1966, పురుగుమందుల చట్టం 1968 నిబంధనలు')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-400" />
                  <span>{t('Zero-Loss Offline Sync', 'పూర్తి ఆఫ్‌లైన్ వర్కింగ్ & ఆటో సింక్')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-400" />
                  <span>{t('English & Telugu Support', 'తెలుగు & ఇంగ్లీష్ ద్విభాషా సదుపాయం')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Officer Registration Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300 ring-1 ring-gold-300/30">
                    <UserCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white">{t('Officer Registration', 'అధికారి నమోదు')}</h3>
                    <p className="truncate text-[11px] font-semibold text-emerald-200/70">
                      {t('DAO · ADA · MAO · AEO — verified email access', 'DAO · ADA · MAO · AEO — ధ్రువీకరించిన ఇమెయిల్')}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-emerald-100/85 sm:text-sm">
                  {t(
                    'Register as an Agriculture Officer for statutory inspection tools, forms, notices, dealer stock reconciliation, and offline field sync.',
                    'చట్టబద్ధ తనిఖీ సాధనాలు, ఫారాలు, నోటీసులు, డీలర్ స్టాక్ సమన్వయం మరియు ఆఫ్‌లైన్ ఫీల్డ్ సింక్ సేవల కోసం వ్యవసాయ అధికారి‌గా నమోదు చేసుకోండి.'
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="group mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 px-5 py-3 text-sm font-black text-emerald-950 shadow-lg shadow-gold-950/25 transition hover:from-gold-300 hover:to-amber-400 active:scale-[0.98]"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{t('Register as Agriculture Officer', 'వ్యవసాయ అధికారిగా నమోదు చేసుకోండి')}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────── Stats Band (light section — no overlap) ──────────────── */}
      <section className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 [content-visibility:auto] [contain-intrinsic-size:1px_160px]">
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
                  <span className="text-right text-[10px] font-bold leading-tight text-slate-500 dark:text-slate-400">
                    {language === 'te' ? s.subTe : s.sub}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">{s.value}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {language === 'te' ? s.labelTe : s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── Ecosystem Tabs ──────────────── */}
      {/* ──────────────── Who Is Agronix For (Interactive 3-Pillar Ecosystem) ──────────────── */}
      <section className="border-b border-slate-200/80 bg-white py-12 dark:border-slate-800 dark:bg-slate-900/60 sm:py-14 [content-visibility:auto] [contain-intrinsic-size:1px_650px]">
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
                  {language === 'te' ? currentTab.descriptionTe : currentTab.description}
                </p>

                <ul className="space-y-2.5 pt-2">
                  {(language === 'te' ? currentTab.featuresTe : currentTab.features).map((feat, i) => (
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
                      {activeTab === 'officers'
                        ? t('MAO / ADA Desk', 'MAO / ADA డెస్క్')
                        : activeTab === 'dealers'
                        ? t('Stock & Allocation', 'స్టాక్ & కేటాయింపులు')
                        : t('Farmer Advisory', 'రైతు సలహా కేంద్రం')}
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
                          {activeTab === 'officers'
                            ? t('Form VIII (Sampling Notice)', 'ఫారం VIII (శాంప్లింగ్ నోటీసు)')
                            : activeTab === 'dealers'
                            ? t('Dealer Quota Receipt #2026', 'డీలర్ కోటా రసీదు #2026')
                            : t('Crop Diagnostic: Cotton BG-II', 'పంట నిర్ధారణ: పత్తి BG-II')}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">{t('Kumurambheem Asifabad', 'కొమరం భీమ్ ఆసిఫాబాద్')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700 dark:bg-gold-900 dark:text-gold-300">
                        <Calculator className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-white">
                          {activeTab === 'officers'
                            ? t('Stop Sale Order Generator', 'స్టాప్ సేల్ ఆర్డర్ జెనరేటర్')
                            : activeTab === 'dealers'
                            ? t('Fertilizer POS Reconciliation', 'ఎరువుల POS రికార్డుల సరిపోలిక')
                            : t('Optimal N-P-K & Micronutrient Dosing', 'ఖచ్చితమైన N-P-K & పోషకాల మోతాదు')}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">{t('Verified Fertilizer Spec', 'ధ్రువీకృత ఎరువుల ప్రమాణాలు')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-white">
                          {activeTab === 'officers'
                            ? t('Enforcement Tracker & Case Log', 'ఎన్‌ఫోర్స్‌మెంట్ ట్రాకర్ & కేసుల రికార్డు')
                            : activeTab === 'dealers'
                            ? t('License Renewal Status: Active', 'లైసెన్స్ స్థితి: యాక్టివ్')
                            : t('Official Officer Directory Support', 'అధికారుల సంప్రదింపుల మద్దతు')}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">{t('Statutory Standard', 'చట్టబద్ధ నిబంధనల ప్రమాణం')}</p>
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
      <section className="bg-slate-50 py-12 dark:bg-slate-950 sm:py-14 [content-visibility:auto] [contain-intrinsic-size:1px_800px]">
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
                      {language === 'te' && mod.badgeTe ? mod.badgeTe : mod.badge}
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
                    onClick={() => navigate(user ? mod.route : '/login')}
                    className="flex w-full cursor-pointer items-center justify-between text-xs font-bold text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    <span>{t('Open Module', 'మాడ్యూల్ తెరవండి')}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── Direct Grievance & Public Helpdesk ──────────────── */}
      <section className="border-t border-slate-200/80 bg-white py-14 dark:border-slate-800 dark:bg-slate-900/40 sm:py-16 [content-visibility:auto] [contain-intrinsic-size:1px_350px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-emerald-900/10 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 p-8 text-white shadow-xl dark:border-emerald-800/40 sm:p-12">
            <div className="grid items-center gap-8 md:grid-cols-12">
              <div className="space-y-3 md:col-span-8">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gold-300 backdrop-blur-md">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{t('Farmer Grievance & Assistance', 'రైతు సమస్యల పరిష్కారం & సహాయం')}</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {t('Facing Fertilizer Shortages or Seed Quality Issues?', 'ఎరువుల కొరత లేదా నాణ్యత సమస్యలు ఎదుర్కొంటున్నారా?')}
                </h3>
                <p className="max-w-2xl text-xs text-justify text-emerald-100 sm:text-sm">
                  {t(
                    'Farmers can file instant grievances directly with the Agriculture Officer. Our enforcement team verifies dealer stocks, investigates quality complaints, and enforces statutory consumer protections.',
                    'రైతులు తమ సమస్యలను నేరుగా వ్యవసాయ అధికారులకు తెలియజేయవచ్చు. మా తనిఖీ బృందం డీలర్ స్టాక్‌ను తనిఖీ చేసి, నాణ్యతా లోపాలపై విచారణ జరిపి రైతులకు చట్టబద్ధ రక్షణ కల్పిస్తుంది.'
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row md:col-span-4 md:flex-col">
                <button
                  type="button"
                  onClick={() => navigate(user ? '/officer-toolkit/officer-contacts' : '/login')}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-[0.98] sm:text-sm"
                >
                  <UserCheck className="h-4 w-4 text-gold-300" />
                  <span>{t('View Agriculture Officers Directory', 'వ్యవసాయ అధికారుల డైరెక్టరీ')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── About the Developer ──────────────── */}
      <section className="bg-white py-14 dark:bg-slate-950 sm:py-16 [content-visibility:auto] [contain-intrinsic-size:1px_900px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t('The Visionary', 'ఆవిష్కర్త')}
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {t('About the Developer', 'డెవలపర్ గురించి')}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t('Bridging agricultural science with modern digital innovation', 'వ్యవసాయ శాస్త్రం & ఆధునిక డిజిటల్ నవీకరణకు అనుసంధానం')}
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-12">
            {/* Left Column: Profile Overview */}
            <div className="space-y-6 lg:col-span-5">
              {/* Profile Card */}
              <div className="overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-emerald-50/25 p-6 shadow-sm shadow-emerald-100/50 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <img
                      src="/developer-profile.jpg"
                      alt="K. Vinay Reddy"
                      className="h-20 w-20 rounded-2xl object-cover shadow-lg ring-4 ring-white dark:ring-slate-900"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      K. Vinay Reddy, M.Sc. (Ag.)
                    </h3>
                    <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {t('Founder & Developer – AGRONIX', 'వ్యవస్థాపకుడు & డెవలపర్ – AGRONIX')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <Leaf className="h-3 w-3" />
                        {t('Agricultural Professional', 'వ్యవసాయ నిపుణుడు')}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-800 dark:bg-gold-950 dark:text-gold-300">
                        <Zap className="h-3 w-3" />
                        {t('Technology Enthusiast', 'సాంకేతిక ప్రియుడు')}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-justify text-slate-600 dark:text-slate-300 sm:text-sm">
                  {t(
                    'An agricultural science professional, researcher, government agricultural officer, and technology enthusiast with a multidisciplinary background spanning agricultural sciences, plant breeding, research, fertilizer marketing, agricultural administration, and digital application development.',
                    'వ్యవసాయ శాస్త్ర నిపుణుడు, పరిశోధకుడు, ప్రభుత్వ వ్యవసాయ అధికారి మరియు సాంకేతిక ప్రియుడు — వ్యవసాయ శాస్త్రం, మొక్కల పెంపకం, పరిశోధన, ఎరువుల మార్కెటింగ్, వ్యవసాయ పాలన మరియు డిజిటల్ అప్లికేషన్ డెవలప్‌మెంట్‌లో బహుళ నైపుణ్యం.'
                  )}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('Mandal Agriculture Officer, Tiryani, Kumurambheem Asifabad District, Telangana', 'మండల వ్యవసాయ అధికారి, తిర్యాణి, కొమరం భీమ్ ఆసిఫాబాద్ జిల్లా, తెలంగాణ')}</span>
                </div>
              </div>

              {/* Philosophy Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {t('Professional Philosophy', 'వృత్తి తత్వం')}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-justify text-slate-600 dark:text-slate-300">
                  {t(
                    'Technology should solve real problems encountered in everyday agricultural work. Digital tools should be easy to understand, accessible, and convenient to use. Applications should prioritize accuracy, data integrity, security, and consistent performance.',
                    'సాంకేతికత అసలైన సమస్యలను పరిష్కరించాలి. డిజిటల్ సాధనాలు సులభంగా అర్థమయ్యేలా, అందుబాటులో ఉండేలా ఉండాలి. అప్లికేషన్లు ఖచ్చితత్వం, డేటా పరిశీలత, భద్రత మరియు స్థిరమైన పనితీరును ప్రాధాన్యత ఇవ్వాలి.'
                  )}
                </p>
              </div>
            </div>

            {/* Right Column: Journey Timeline */}
            <div className="lg:col-span-7">
              <div className="space-y-6">
                {/* Academic Journey */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {t('Academic Journey', 'విద్యా ప్రస్థానం')}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Bachelor of Science in Agriculture (B.Sc. Agriculture)', 'బ్యాచిలర్ ఆఫ్ సైన్స్ ఇన్ అగ్రికల్చర్')}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Dr. Balasaheb Sawant Konkan Krishi Vidyapeeth — {t('First Class with Distinction', 'ఫస్ట్ క్లాస్ విత్ డిస్టింక్షన్')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-600 dark:bg-gold-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Master of Science in Agriculture — Genetics & Plant Breeding', 'మాస్టర్ ఆఫ్ సైన్స్ ఇన్ అగ్రికల్చర్ — జెనెటిక్స్ & ప్లాంట్ బ్రీడింగ్')}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Professor Jayashankar Telangana Agricultural University (PJTSAU) — {t('ICAR NET Qualified, AIR 41', 'ICAR NET క్వాలిఫైడ్, AIR 41')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Career Timeline */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100 text-gold-700 dark:bg-gold-950 dark:text-gold-300">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {t('Professional Experience', 'వృత్తి అనుభవం')}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('ICAR – Indian Institute of Maize Research (IIMR)', 'ICAR – ఇండియన్ ఇన్స్టిట్యూట్ ఆఫ్ మేజ్ రీసెర్చ్')}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {t('One Year — Maize Research & Crop Improvement', 'ఒక సంవత్సరం — మొక్కజొన్న పరిశోధన & పంట మెరుగుదల')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-600 dark:bg-sky-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('National Fertilizers Limited (NFL)', 'నేషనల్ ఫర్టిలైజర్స్ లిమిటెడ్')}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {t('One Year — Management Trainee (Marketing)', 'ఒక సంవత్సరం — మేనేజ్‌మెంట్ ట్రైనీ (మార్కెటింగ్)')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-600 dark:bg-gold-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Mandal Agriculture Officer (MAO)', 'మండల వ్యవసాయ అధికారి (MAO)')}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {t('Department of Agriculture, Government of Telangana — Current Posting: Tiryani Mandal', 'వ్యవసాయ శాఖ, తెలంగాణ ప్రభుత్వం — ప్రస్తుత పోస్టింగ్: తిర్యాణి మండల్')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Skills */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      <Zap className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {t('Technical Expertise', 'సాంకేతిక నైపుణ్యం')}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { label: 'React.js / TypeScript', icon: '⚛️' },
                      { label: 'Supabase / PostgreSQL', icon: '🗄️' },
                      { label: 'Vite / PWA', icon: '📱' },
                      { label: 'Tailwind CSS', icon: '🎨' },
                      { label: 'Cloudflare / Vercel', icon: '☁️' },
                      { label: 'AI / LLM Integration', icon: '🤖' },
                    ].map((skill) => (
                      <div
                        key={skill.label}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <span>{skill.icon}</span>
                        <span>{skill.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vision Statement */}
          <div className="mt-10 rounded-3xl border border-emerald-200/70 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 p-8 text-white shadow-xl dark:border-emerald-800/40 sm:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/15 text-gold-300 ring-1 ring-gold-300/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black sm:text-2xl">
                {t('The Vision Behind AGRONIX', 'AGRONIX వెనుక దృక్పథం')}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-justify text-emerald-100/90 sm:text-base">
                {t(
                  'To make agricultural administration smarter, more efficient, accessible, and technology-driven. Technology should not complicate agricultural work — it should simplify processes, reduce repetitive efforts, improve accessibility, and empower the people working at the grassroots level.',
                  'వ్యవసాయ పాలనను మేధావిగా, సమర్థవంతంగా, అందుబాటులో మరియు సాంకేతికంగా ముందుకు తీసుకెళ్లాలి. సాంకేతికత వ్యవసాయ పనులను క్లిష్టతరం చేయకూడదు — ప్రక్రియలను సులభతరం చేయాలి, పునరావృత ప్రయత్నాలను తగ్గించాలి, అందుబాటును మెరుగుపరచాలి మరియు క్షేత్రస్థాయిలో పనిచేసే వ్యక్తులను శక్తివంతం చేయాలి.'
                )}
              </p>
              <p className="mt-4 text-xs font-semibold text-gold-300">
                {t('— K. Vinay Reddy, M.Sc. (Ag.)', '— కె. వినయ్ రెడ్డి, M.Sc. (Ag.)')}
              </p>
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
            {t('Ready to Experience Modern Agricultural Management?', 'ఆధునిక వ్యవసాయ పరిపాలనా వ్యవస్థను ఉపయోగించండి')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            {t(
              'Sign in with your officer credentials or dealer phone number to access all portal tools.',
              'అన్ని పోర్టల్ సాధనాలను ఉపయోగించుకోవడానికి మీ అధికారి వివరాలు లేదా డీలర్ మొబైల్ నంబర్‌తో లాగిన్ అవ్వండి.'
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
              <span>{t('Register as New Officer', 'కొత్త అధికారిగా నమోదు చేసుకోండి')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────── Professional Footer ──────────────── */}
      <footer className="border-t border-slate-200 bg-white pt-12 pb-8 dark:border-slate-800 dark:bg-slate-950 [content-visibility:auto] [contain-intrinsic-size:1px_400px]">
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
                    {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
                  </p>
                </div>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {t(
                  'An integrated governance and precision agriculture platform supporting Agriculture Officers, Input Retailers, and Farmers. Built with offline-first PWA architecture and enterprise security.',
                  'వ్యవసాయ అధికారులు, డీలర్లు మరియు రైతులకు సహాయపడే సమగ్ర పాలన మరియు శాస్త్రీయ వ్యవసాయ వేదిక. ఆఫ్‌లైన్-ఫస్ట్ PWA సాంకేతికతతో భద్రంగా రూపొందించబడింది.'
                )}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
                <MapPin className="h-3.5 w-3.5" />
                {t('Kumurambheem Asifabad District', 'కొమరం భీమ్ ఆసిఫాబాద్ జిల్లా')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                {t('Quick Tools', 'త్వరిత సాధనాలు')}
              </p>
              <ul className="mt-3 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <li>
                  <button type="button" onClick={() => navigate(user ? '/officer-toolkit/fertilizer-calculator' : '/login')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    {t('Fertilizer Calculator', 'ఎరువుల కాలిక్యులేటర్')}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate(user ? '/officer-toolkit/crop-doctor' : '/login')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    {t('Crop Doctor Diagnostics', 'క్రాప్ డాక్టర్ వ్యాధి నిర్ధారణ')}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate(user ? '/officer-toolkit/agrochemicals' : '/login')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    {t('Agrochemicals Database', 'వ్యవసాయ రసాయనాల సమాచారం')}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate(user ? '/officer-toolkit/acts-and-orders' : '/login')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    {t('Acts & Ready Reckoners', 'చట్టాలు & రెడీ రెకనర్')}
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
                    {t('Officer Sign In →', 'అధికారుల లాగిన్ →')}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/login')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    {t('Dealer Portal Sign In', 'డీలర్ పోర్టల్ లాగిన్')}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/register')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    {t('New Officer Sign Up', 'కొత్త అధికారి నమోదు')}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/forgot-password')} className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300">
                    {t('Reset Password', 'పాస్‌వర్డ్ రీసెట్')}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <OfficialChannelsSidebar inline />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <button type="button" onClick={() => navigate('/disclaimer')} className="cursor-pointer text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300">
                {t('Disclaimer', 'నిరాకరణ (Disclaimer)')}
              </button>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <button type="button" onClick={() => navigate('/privacy-policy')} className="cursor-pointer text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300">
                {t('Privacy Policy', 'గోప్యతా విధానం')}
              </button>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <button type="button" onClick={() => navigate('/terms-conditions')} className="cursor-pointer text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300">
                {t('Terms & Conditions', 'నిబంధనలు & షరతులు')}
              </button>
            </div>
            <p className="mt-3">
              &copy; 2026 Agronix, {t('All Rights Reserved.', 'సర్వ హక్కులు ప్రత్యేకించబడ్డాయి.')}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              {t(
                'Developed & maintained by K. Vinay Reddy, MAO, Tiryani · Kumurambheem Asifabad District',
                'రూపకల్పన & నిర్వహణ: కె. వినయ్ రెడ్డి, MAO, తిర్యాణి · కొమరం భీమ్ ఆసిఫాబాద్ జిల్లా'
              )}
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp floating button — stacked above Grievances */}
      <a
        href="https://wa.me/918308487046"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp: 83084 87046"
        title="WhatsApp: 83084 87046"
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 animate-slide-up items-center justify-center rounded-full bg-gradient-to-r from-[#25D366] to-[#1eb856] text-white shadow-xl shadow-emerald-600/40 ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl"
      >
        <span className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/50" />
          <svg viewBox="0 0 24 24" fill="currentColor" className="relative h-5 w-5" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </span>
      </a>
      <FloatingActions />
    </div>
  );
}
