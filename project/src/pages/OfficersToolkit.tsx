import React, { useState, useEffect } from 'react';
import { Calculator, LayoutDashboard, ShieldCheck, ExternalLink, Leaf, Globe2, PackageCheck, Database, Sprout, Scale, Phone, CalendarDays, FileCheck, Files, Stethoscope, HandCoins, BarChart3, Landmark, CloudSunRain, Gavel, IndianRupee, Wheat, UserRound, UsersRound, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { BackButton } from '../components/ui/BackButton';
import { LanguageToggle } from '../components/ui/LanguageToggle';

interface ToolkitItem {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  bgGradient: string;
  path?: string;
  externalUrl?: string;
  category?: 'internal';
  statusMessage?: string;
}

interface OfficersToolkitProps {
  isAdmin?: boolean;
  isTestUser?: boolean;
}

const toolkitItems: ToolkitItem[] = [
  {
    title: 'Tour Diary',
    description: 'Monthly tour diary with journey tracking.',
    path: '/officer-toolkit/tour-diary',
    icon: CalendarDays,
    category: 'internal',
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30',
  },
  {
    title: 'Officer Contacts',
    description: 'AEO • MAO • ADA • DAO',
    path: '/officer-toolkit/officer-contacts',
    icon: Phone,
    category: 'internal',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
  },
  {
    title: 'License Services',
    description: 'Fertilizer • Seed • Pesticide',
    path: '/officer-toolkit/license-application-generator',
    icon: FileCheck,
    category: 'internal',
    gradient: 'from-teal-500 to-emerald-600',
    bgGradient: 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30',
  },
  {
    title: 'Statutory Forms',
    description: 'Prepare and download field forms.',
    path: '/officer-toolkit/statutory-forms',
    icon: Files,
    category: 'internal',
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
  },
  {
    title: 'Farm Calculators',
    description: 'Crop, seed, fertilizer and pesticide calculations.',
    path: '/officer-toolkit/farm-calculators',
    icon: Calculator,
    category: 'internal',
    gradient: 'from-green-600 to-teal-700',
    bgGradient: 'from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30',
  },
  {
    title: 'Crop Doctor',
    description: 'Crop-wise pests, diseases, weeds and nutrient deficiencies.',
    path: '/officer-toolkit/crop-protection',
    icon: Stethoscope,
    category: 'internal',
    gradient: 'from-red-500 to-amber-600',
    bgGradient: 'from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30',
    statusMessage: 'Under development',
  },
  {
    title: 'Legal Ready Reckoner',
    description: 'Acts, clauses, stop sale, seizure, sampling and notice tools.',
    path: '/officer-toolkit/legal-ready-reckoner',
    icon: Scale,
    category: 'internal',
    gradient: 'from-blue-600 to-emerald-700',
    bgGradient: 'from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30',
    statusMessage: 'Under development',
  },
];

const externalPortals: ToolkitItem[] = [
  {
    title: 'Urea Dashboard',
    description: 'Urea Fertilizer Dashboard Portal',
    externalUrl: 'http://74.225.14.186:8025/login',
    icon: LayoutDashboard,
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
  },
  {
    title: 'Crop Loan Waiver',
    description: 'Telangana Crop Loan Waiver Portal',
    externalUrl: 'https://clw.telangana.gov.in/Login.aspx',
    icon: HandCoins,
    gradient: 'from-rose-500 to-red-600',
    bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
  },
  {
    title: 'Soil Health Card',
    description: 'Soil Health Card Portal',
    externalUrl: 'https://soilhealth.dac.gov.in/admin/',
    icon: Globe2,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
  },
  {
    title: 'OLMS',
    description: 'Online License Management System',
    externalUrl: 'https://agriolms.telangana.gov.in/Default.aspx',
    icon: BarChart3,
    gradient: 'from-teal-500 to-cyan-600',
    bgGradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
  },
  {
    title: 'IFMS',
    description: 'Integrated Fertilizer Management System',
    externalUrl: 'https://dbtfert.nic.in/mFMS/loginNew.action',
    icon: Database,
    gradient: 'from-indigo-500 to-purple-600',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30',
  },
  {
    title: 'Treasury Challan Generation',
    description: 'Telangana IFMIS e-Challan Portal',
    externalUrl: 'https://ifmis.telangana.gov.in/echallan',
    icon: Landmark,
    gradient: 'from-slate-600 to-emerald-700',
    bgGradient: 'from-slate-50 to-emerald-50 dark:from-slate-950/30 dark:to-emerald-950/30',
  },
  {
    title: 'Agromet Advisories',
    description: 'Agricultural Meteorological Advisories',
    externalUrl: 'https://pjtau.edu.in/agromet-advisories/',
    icon: Sprout,
    gradient: 'from-sky-500 to-blue-600',
    bgGradient: 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30',
  },
  {
    title: 'IMD Weather',
    description: 'India Meteorological Department Weather',
    externalUrl: 'https://mausam.imd.gov.in/imd_latest/contents/districtwise-warning_mc.php?id=1',
    icon: CloudSunRain,
    gradient: 'from-cyan-500 to-teal-600',
    bgGradient: 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30',
  },
  {
    title: 'Quality Control - Court Judgements',
    description: 'Fertilizer Control Order Court Judgements',
    externalUrl: 'https://indiankanoon.org/search/?formInput=fertilizer+control+order+&filters=doctypes%3A+judgments&filters=sortby%3A+mostrecent',
    icon: Gavel,
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
  },
  {
    title: 'Rythu Bharosa',
    description: 'Telangana Government Agriculture Portal',
    externalUrl: 'https://rythubharosa.telangana.gov.in/Login.aspx',
    icon: UserRound,
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
  },
  {
    title: 'PM-Kisan',
    description: 'Pradhan Mantri Kisan Samman Nidhi',
    externalUrl: 'https://fw.pmkisan.gov.in/',
    icon: IndianRupee,
    gradient: 'from-yellow-500 to-amber-600',
    bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
  },
  {
    title: 'T-Seed Portal',
    description: 'Telangana Seed Portal',
    externalUrl: 'https://ossds.telangana.gov.in/Tseedlogin.aspx',
    icon: Wheat,
    gradient: 'from-lime-500 to-green-600',
    bgGradient: 'from-lime-50 to-green-50 dark:from-lime-950/30 dark:to-green-950/30',
  },
  {
    title: 'OPMS',
    description: 'Online Procurement Management System',
    externalUrl: 'https://pps.telangana.gov.in/View/Login.aspx',
    icon: PackageCheck,
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
  },
  {
    title: 'NMNF',
    description: 'Natural Farming National Portal',
    externalUrl: 'https://naturalfarming.dac.gov.in/AboutUs/login',
    icon: Leaf,
    gradient: 'from-green-600 to-emerald-700',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  },
  {
    title: 'Farmer Registry',
    description: 'Telangana Farmer Registry',
    externalUrl: 'https://tlfr.agristack.gov.in/farmer-registry-tl/#/',
    icon: UsersRound,
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30',
  },
];

function translateToolkit(label?: string) {
  const labels: Record<string, string> = {
    'Tour Diary': 'పర్యటన డైరీ',
    'Monthly tour diary with journey tracking.': 'ప్రయాణ ట్రాకింగ్‌తో నెలవారీ పర్యటన డైరీ.',
    'License Services': 'లైసెన్స్ సేవలు',
    'Fertilizer • Seed • Pesticide': 'ఎరువులు • విత్తనాలు • పురుగుమందులు',
    'Statutory Forms': 'చట్టబద్ధ ఫారాలు',
    'Prepare and download field forms.': 'క్షేత్ర ఫారాలను సిద్ధం చేసి డౌన్‌లోడ్ చేయండి.',
    'Farm Calculators': 'వ్యవసాయ కాలిక్యులేటర్లు',
    'Crop, seed, fertilizer and pesticide calculations.': 'పంట, విత్తనం, ఎరువు మరియు పురుగుమందుల లెక్కలు.',
    'Crop Doctor': 'పంట డాక్టర్',
    'Crop-wise pests, diseases, weeds and nutrient deficiencies.': 'పంటల వారీగా పురుగులు, వ్యాధులు, కలుపు మొక్కలు మరియు పోషక లోపాలు.',
    'Legal Ready Reckoner': 'లీగల్ రెడీ రెకనర్',
    'Acts, clauses, stop sale, seizure, sampling and notice tools.': 'చట్టాలు, క్లాజులు, స్టాప్ సేల్, సీజర్, శాంప్లింగ్ మరియు నోటీస్ సాధనాలు.',
    'Under development': 'అభివృద్ధిలో ఉంది',
    'Urea Dashboard': 'యూరియా డ్యాష్‌బోర్డ్',
    'Urea Fertilizer Dashboard Portal': 'యూరియా ఎరువుల డ్యాష్‌బోర్డ్ పోర్టల్',
    'Crop Loan Waiver': 'పంట రుణమాఫీ',
    'Telangana Crop Loan Waiver Portal': 'తెలంగాణ పంట రుణమాఫీ పోర్టల్',
    'Soil Health Card': 'సాయిల్ హెల్త్ కార్డ్',
    'Soil Health Card Portal': 'సాయిల్ హెల్త్ కార్డ్ పోర్టల్',
    OLMS: 'ఓఎల్ఎంఎస్',
    'Online License Management System': 'ఆన్‌లైన్ లైసెన్స్ నిర్వహణ వ్యవస్థ',
    IFMS: 'ఐఎఫ్‌ఎంఎస్',
    'Integrated Fertilizer Management System': 'ఇంటిగ్రేటెడ్ ఫర్టిలైజర్ మేనేజ్‌మెంట్ సిస్టమ్',
    'Treasury Challan Generation': 'ట్రెజరీ చలాన్ జనరేషన్',
    'Telangana IFMIS e-Challan Portal': 'తెలంగాణ IFMIS ఈ-చలాన్ పోర్టల్',
    'Agromet Advisories': 'అగ్రోమెట్ సలహాలు',
    'Agricultural Meteorological Advisories': 'వ్యవసాయ వాతావరణ సలహాలు',
    'IMD Weather': 'IMD వాతావరణం',
    'India Meteorological Department Weather': 'భారత వాతావరణ శాఖ వాతావరణం',
    'Quality Control - Court Judgements': 'నాణ్యత నియంత్రణ - కోర్టు తీర్పులు',
    'Fertilizer Control Order Court Judgements': 'ఎరువుల నియంత్రణ ఉత్తర్వుల కోర్టు తీర్పులు',
    'Rythu Bharosa': 'రైతు భరోసా',
    'Telangana Government Agriculture Portal': 'తెలంగాణ ప్రభుత్వ వ్యవసాయ పోర్టల్',
    'PM-Kisan': 'పీఎం-కిసాన్',
    'Pradhan Mantri Kisan Samman Nidhi': 'ప్రధాన్ మంత్రి కిసాన్ సమ్మాన్ నిధి',
    'T-Seed Portal': 'టి-సీడ్ పోర్టల్',
    'Telangana Seed Portal': 'తెలంగాణ విత్తన పోర్టల్',
    OPMS: 'ఓపీఎంఎస్',
    'Online Procurement Management System': 'ఆన్‌లైన్ కొనుగోలు నిర్వహణ వ్యవస్థ',
    NMNF: 'ఎన్‌ఎంఎన్‌ఎఫ్',
    'Natural Farming National Portal': 'ప్రకృతి వ్యవసాయ జాతీయ పోర్టల్',
    'Farmer Registry': 'రైతు రిజిస్ట్రీ',
    'Telangana Farmer Registry': 'తెలంగాణ రైతు రిజిస్ట్రీ',
    'Officer Toolkit': 'అధికారుల టూల్‌కిట్',
    'Agricultural Tools & Government Portals': 'వ్యవసాయ సాధనాలు & ప్రభుత్వ పోర్టళ్లు',
    'Field Tools': 'క్షేత్ర సాధనాలు',
    'Government Portals': 'ప్రభుత్వ పోర్టళ్లు',
    'Empowering Agriculture with Digital Tools': 'డిజిటల్ సాధనాలతో వ్యవసాయాన్ని శక్తివంతం చేయడం',
  };
  return label ? labels[label] || label : '';
}

const cardThemeByGradient: Record<string, { cardBg: string; icon: string }> = {
  'from-cyan-500 to-blue-600': { cardBg: 'from-cyan-100 to-blue-100 dark:from-cyan-950/30 dark:to-blue-950/30', icon: 'text-cyan-600 dark:text-cyan-400' },
  'from-emerald-500 to-teal-600': { cardBg: 'from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30', icon: 'text-emerald-600 dark:text-emerald-400' },
  'from-teal-500 to-emerald-600': { cardBg: 'from-teal-100 to-emerald-100 dark:from-teal-950/30 dark:to-emerald-950/30', icon: 'text-teal-600 dark:text-teal-400' },
  'from-amber-500 to-orange-600': { cardBg: 'from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30', icon: 'text-amber-600 dark:text-amber-400' },
  'from-green-600 to-teal-700': { cardBg: 'from-green-100 to-teal-100 dark:from-green-950/30 dark:to-teal-950/30', icon: 'text-green-600 dark:text-green-400' },
  'from-red-500 to-amber-600': { cardBg: 'from-red-100 to-amber-100 dark:from-red-950/30 dark:to-amber-950/30', icon: 'text-red-600 dark:text-red-400' },
  'from-blue-600 to-emerald-700': { cardBg: 'from-blue-100 to-emerald-100 dark:from-blue-950/30 dark:to-emerald-950/30', icon: 'text-blue-600 dark:text-blue-400' },
  'from-purple-500 to-pink-600': { cardBg: 'from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30', icon: 'text-purple-600 dark:text-purple-400' },
  'from-rose-500 to-red-600': { cardBg: 'from-rose-100 to-red-100 dark:from-rose-950/30 dark:to-red-950/30', icon: 'text-rose-600 dark:text-rose-400' },
  'from-teal-500 to-cyan-600': { cardBg: 'from-teal-100 to-cyan-100 dark:from-teal-950/30 dark:to-cyan-950/30', icon: 'text-teal-600 dark:text-teal-400' },
  'from-indigo-500 to-purple-600': { cardBg: 'from-indigo-100 to-purple-100 dark:from-indigo-950/30 dark:to-purple-950/30', icon: 'text-indigo-600 dark:text-indigo-400' },
  'from-slate-600 to-emerald-700': { cardBg: 'from-slate-100 to-emerald-100 dark:from-slate-950/30 dark:to-emerald-950/30', icon: 'text-slate-600 dark:text-slate-300' },
  'from-sky-500 to-blue-600': { cardBg: 'from-sky-100 to-blue-100 dark:from-sky-950/30 dark:to-blue-950/30', icon: 'text-sky-600 dark:text-sky-400' },
  'from-cyan-500 to-teal-600': { cardBg: 'from-cyan-100 to-teal-100 dark:from-cyan-950/30 dark:to-teal-950/30', icon: 'text-cyan-600 dark:text-cyan-400' },
  'from-violet-500 to-purple-600': { cardBg: 'from-violet-100 to-purple-100 dark:from-violet-950/30 dark:to-purple-950/30', icon: 'text-violet-600 dark:text-violet-400' },
  'from-orange-500 to-red-600': { cardBg: 'from-orange-100 to-red-100 dark:from-orange-950/30 dark:to-red-950/30', icon: 'text-orange-600 dark:text-orange-400' },
  'from-yellow-500 to-amber-600': { cardBg: 'from-yellow-100 to-amber-100 dark:from-yellow-950/30 dark:to-amber-950/30', icon: 'text-amber-600 dark:text-amber-400' },
  'from-lime-500 to-green-600': { cardBg: 'from-lime-100 to-green-100 dark:from-lime-950/30 dark:to-green-950/30', icon: 'text-lime-600 dark:text-lime-400' },
  'from-blue-500 to-indigo-600': { cardBg: 'from-blue-100 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30', icon: 'text-blue-600 dark:text-blue-400' },
  'from-green-600 to-emerald-700': { cardBg: 'from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30', icon: 'text-emerald-600 dark:text-emerald-400' },
};

function ToolkitCard({ item, index, onClick }: { item: ToolkitItem; index: number; onClick: () => void }) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const theme = cardThemeByGradient[item.gradient];
  const cardBg = theme?.cardBg ?? item.bgGradient;
  const iconColor = theme?.icon ?? 'text-emerald-600 dark:text-emerald-400';

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      onClick={onClick}
      className={`group relative flex h-full cursor-pointer flex-col items-center overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br ${cardBg} px-2 pb-3 pt-4 text-center shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-emerald-800/50 sm:px-3 sm:pb-4 sm:pt-5 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
      {item.externalUrl && (
        <div className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-emerald-600 shadow-sm dark:bg-slate-800/80 dark:text-emerald-400">
          <ExternalLink className="h-3 w-3" />
        </div>
      )}
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-900/5 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800 dark:ring-slate-700 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
        <item.icon className={`h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 ${iconColor}`} />
      </div>
      <h3 className="relative mt-2 text-balance text-[11px] font-bold leading-tight text-slate-800 transition-colors group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400 sm:mt-3 sm:text-sm">
        {t(item.title, translateToolkit(item.title))}
      </h3>
      <div className="relative mt-1 hidden md:block">
        <p className="text-[11px] font-medium leading-snug text-slate-500 line-clamp-2 dark:text-slate-400">
          {t(item.description, translateToolkit(item.description))}
        </p>
      </div>
      {item.statusMessage && (
        <div className="relative mt-1.5 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-800 dark:bg-red-900/40 dark:text-red-200 sm:text-[10px]">
          {t(item.statusMessage, translateToolkit(item.statusMessage))}
        </div>
      )}
      <div className={`pointer-events-none absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-gradient-to-br ${item.gradient} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20`} />
    </div>
  );
}

export function OfficersToolkit({ isAdmin = false, isTestUser = false }: OfficersToolkitProps) {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const shouldHideHeader = isAdmin || isTestUser;

  const sortedToolkitItems = [...toolkitItems].sort((a, b) => a.title.localeCompare(b.title));
  const sortedExternalPortals = [...externalPortals].sort((a, b) => a.title.localeCompare(b.title));

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        {/* Header Section - Only shown for public access */}
        {!shouldHideHeader && (
          <div className={`mb-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative overflow-hidden rounded-2xl border border-violet-300/70 bg-gradient-to-br from-violet-200 via-violet-100 to-purple-200/70 px-4 py-3 shadow-lg shadow-violet-900/10 backdrop-blur-sm dark:border-violet-700/60 dark:from-violet-900/50 dark:via-slate-900 dark:to-purple-900/40">
              <div className="relative flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-md shadow-violet-600/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                    {t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
                  </h1>
                  <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('Agricultural Tools & Government Portals', 'వ్యవసాయ పనిముట్లు & ప్రభుత్వ పోర్టల్స్')}
                  </p>
                </div>
              </div>
              <div className="relative mt-3 flex items-center justify-between gap-3 border-t border-violet-300/60 pt-3 dark:border-violet-700/50">
                <LanguageToggle
                  language={language}
                  onClick={toggleLanguage}
                  className="h-9 rounded-xl !border-violet-200 !bg-white/80 !text-violet-800 px-3 hover:!bg-white dark:!border-violet-800 dark:!bg-slate-800/80 dark:!text-violet-200 dark:hover:!bg-slate-700"
                />
                <BackButton
                  onClick={() => navigate('/login')}
                  className="h-9 rounded-xl !border-transparent !bg-gradient-to-r !from-violet-600 !to-purple-600 !text-white px-4 shadow-md shadow-violet-600/25 hover:!from-violet-700 hover:!to-purple-700"
                >
                  Back
                </BackButton>
              </div>
            </div>
          </div>
        )}

        {shouldHideHeader && (
          <div className={`mb-4 flex justify-end transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <LanguageToggle language={language} onClick={toggleLanguage} />
          </div>
        )}

        {/* Internal Tools Section */}
        <div className={`mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Calculator className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('Field Tools', 'ఫీల్డ్ టూల్స్')}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {sortedToolkitItems.map((item, index) => (
              <ToolkitCard
                key={item.path}
                item={item}
                index={index}
                onClick={() => item.path && navigate(item.path)}
              />
            ))}
          </div>
        </div>

        {/* External Portals Section */}
        <div className={`transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
              <ExternalLink className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('Government Portals', 'ప్రభుత్వ పోర్టల్స్')}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {sortedExternalPortals.map((item, index) => (
              <a
                key={item.externalUrl}
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <ToolkitCard
                  item={item}
                  index={index + toolkitItems.length}
                  onClick={() => {}}
                />
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-8 text-center transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('Empowering Agriculture with Digital Tools', 'డిజిటల్ టూల్స్‌తో వ్యవసాయాన్ని శక్తివంతం చేయడం')}
          </p>
        </div>
      </div>
    </div>
  );
}

