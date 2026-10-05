import React, { useState, useEffect } from 'react';
import { Calculator, ShieldCheck, ExternalLink, Leaf, Globe2, PackageCheck, Database, Sprout, Scale, Phone, CalendarDays, FileCheck, Files, FolderOpen, Stethoscope, HandCoins, BarChart3, Landmark, CloudSunRain, Gavel, IndianRupee, Wheat, UserRound, UsersRound, ClipboardCheck, MapPin, Bug, Microscope, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';

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
    path: '/officer-toolkit/license-services',
    icon: FileCheck,
    category: 'internal',
    gradient: 'from-teal-500 to-emerald-600',
    bgGradient: 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30',
  },
  {
    title: 'Smart Sampling',
    description: 'Sample drawal forms, covering letters & documents.',
    path: '/officer-toolkit/smart-sampling',
    icon: Files,
    category: 'internal',
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
  },
  {
    title: 'Forms & Library',
    description: 'Browse, download and manage uploaded forms.',
    path: '/officer-toolkit/forms-library',
    icon: FolderOpen,
    category: 'internal',
    gradient: 'from-sky-500 to-blue-600',
    bgGradient: 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30',
  },
  {
    title: 'Inspection & Enforcement',
    description: 'Inspection proforma, memo & show cause notice, stop sale & seizure orders for seed, fertilizer & insecticide.',
    path: '/officer-toolkit/inspection-enforcement',
    icon: ClipboardCheck,
    category: 'internal',
    gradient: 'from-lime-500 to-green-600',
    bgGradient: 'from-lime-50 to-green-50 dark:from-lime-950/30 dark:to-green-950/30',
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
    path: '/officer-toolkit/crop-doctor',
    icon: Stethoscope,
    category: 'internal',
    gradient: 'from-red-500 to-amber-600',
    bgGradient: 'from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30',
    statusMessage: 'Under development',
  },
  {
    title: 'Field Diagnosis',
    description: 'Identify crop diseases by symptoms.',
    path: '/officer-toolkit/field-diagnosis',
    icon: Microscope,
    category: 'internal',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
    statusMessage: 'Under development',
  },
  {
    title: 'Acts & Orders',
    description: 'FCO, Seed Act, Insecticide Act, clauses, Rules.',
    path: '/officer-toolkit/acts-and-orders',
    icon: Scale,
    category: 'internal',
    gradient: 'from-blue-600 to-emerald-700',
    bgGradient: 'from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30',
  },
];

const externalPortals: ToolkitItem[] = [
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
    title: 'TGDPS Weather',
    description: 'Telangana Development Planning Society Weather',
    externalUrl: 'https://tgdps.telangana.gov.in/districtdata.jsp',
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
  {
    title: 'GT Points',
    description: 'Krishi Decision Support System',
    externalUrl: 'https://krishi-dss.gov.in/krishi-dss/auth/login',
    icon: MapPin,
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
  },
  {
    title: 'CFQCTI',
    description: 'Central Fertilizer Quality Control & Training Institute',
    externalUrl: 'https://cfqcti.da.gov.in/',
    icon: ShieldCheck,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
  },
  {
    title: 'FFS Web',
    description: 'Fertilizer Statistics & Analysis (DA&FW)',
    externalUrl: 'https://fsas.agriwelfare.gov.in/fertilizer/#/',
    icon: BarChart3,
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
  },
  {
    title: 'CIB&RC',
    description: 'Central Insecticide Board & Registration Committee',
    externalUrl: 'https://ppqs.gov.in/divisions/central-insecticide-board-registration-committee',
    icon: Bug,
    gradient: 'from-lime-500 to-green-600',
    bgGradient: 'from-lime-50 to-green-50 dark:from-lime-950/30 dark:to-green-950/30',
  },
  {
    title: 'IRAC',
    description: 'Insecticide Resistance Action Committee',
    externalUrl: 'https://irac-online.org/',
    icon: Bug,
    gradient: 'from-red-500 to-amber-600',
    bgGradient: 'from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30',
  },
  {
    title: 'FRAC',
    description: 'Fungicide Resistance Action Committee',
    externalUrl: 'https://www.frac.info/',
    icon: Microscope,
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
  },
  {
    title: 'HRAC',
    description: 'Herbicide Resistance Action Committee',
    externalUrl: 'https://hracglobal.com/herbicide-resistance',
    icon: Leaf,
    gradient: 'from-green-600 to-emerald-700',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  },
];

function translateToolkit(label?: string) {
  const labels: Record<string, string> = {
    'Tour Diary': 'పర్యటన డైరీ',
    'Monthly tour diary with journey tracking.': 'ప్రయాణ ట్రాకింగ్‌తో నెలవారీ పర్యటన డైరీ.',
    'License Services': 'లైసెన్స్ సేవలు',
    'Fertilizer • Seed • Pesticide': 'ఎరువులు • విత్తనాలు • పురుగుమందులు',
    'Smart Sampling': 'స్మార్ట్ సాంప్లింగ్',
    'Sample drawal forms, covering letters & documents.': 'నమూనా డ్రాయింగ్ ఫారాలు, కవరింగ్ లెటర్లు & పత్రాలు.',
    'Forms & Library': 'ఫారాలు & లైబ్రరీ',
    'Browse, download and manage uploaded forms.': 'అప్‌లోడ్ చేసిన ఫారాలను చూడండి, డౌన్‌లోడ్ చేయండి మరియు నిర్వహించండి.',
    'Inspection & Enforcement': 'తనిఖీ & అమలు',
    'Inspection proforma, memo & show cause notice, stop sale & seizure orders for seed, fertilizer & insecticide.': 'విత్తనం, ఎరువు & పురుగుమందు తనిఖీ ప్రొఫార్మా, మెమో & షోకాజ్ నోటీసు, స్టాప్ సేల్ & జప్తి ఆర్డర్లు.',
    'Farm Calculators': 'వ్యవసాయ కాలిక్యులేటర్లు',
    'Crop, seed, fertilizer and pesticide calculations.': 'పంట, విత్తనం, ఎరువు మరియు పురుగుమందుల లెక్కలు.',
    'Crop Doctor': 'పంట డాక్టర్',
    'Crop-wise pests, diseases, weeds and nutrient deficiencies.': 'పంటల వారీగా పురుగులు, వ్యాధులు, కలుపు మొక్కలు మరియు పోషక లోపాలు.',
    'Field Diagnosis': 'క్షేత్ర నిర్ధారణ',
    'Identify crop diseases by symptoms.': 'లక్షణాల ద్వారా పంట వ్యాధులను గుర్తించండి.',
    'Acts & Orders': 'చట్టాలు & ఉత్తర్వులు',
    'FCO, Seed Act, Insecticide Act, clauses, Rules.': 'FCO, విత్తన చట్టం, పురుగుమందు చట్టం, క్లాజులు, నియమాలు.',
    'Under development': 'అభివృద్ధిలో ఉంది',

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
    'TGDPS Weather': 'TGDPS వాతావరణం',
    'Telangana Development Planning Society Weather': 'తెలంగాణ డెవలప్‌మెంట్ ప్లానింగ్ సొసైటీ వాతావరణం',
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
    'GT Points': 'జీటీ పాయింట్స్',
    'Krishi Decision Support System': 'కృషి డిసిషన్ సపోర్ట్ సిస్టమ్',
    'CFQCTI': 'సీఎఫ్‌క్యూసీటీఐ',
    'Central Fertilizer Quality Control & Training Institute': 'సెంట్రల్ ఎరువుల నాణ్యత నియంత్రణ & శిక్షణ సంస్థ',
    'FFS Web': 'ఎఫ్‌ఎఫ్‌ఎస్ వెబ్',
    'Fertilizer Statistics & Analysis (DA&FW)': 'ఎరువుల గణాంకాలు & విశ్లేషణ (DA&FW)',
    'CIB&RC': 'సీఐబీ&ఆర్‌సీ',
    'Central Insecticide Board & Registration Committee': 'సెంట్రల్ ఇన్‌సెక్టిసైడ్ బోర్డ్ & రిజిస్ట్రేషన్ కమిటీ',
    IRAC: 'ఐఆర్‌ఏసీ',
    'Insecticide Resistance Action Committee': 'పురుగుమందుల నిరోధక చర్య కమిటీ',
    FRAC: 'ఎఫ్‌ఆర్‌ఏసీ',
    'Fungicide Resistance Action Committee': 'శిలీంధ్రమందుల నిరోధక చర్య కమిటీ',
    HRAC: 'హెచ్‌ఆర్‌ఏసీ',
    'Herbicide Resistance Action Committee': 'కలుపుమందుల నిరోధక చర్య కమిటీ',
    'Officer Toolkit': 'అధికారుల టూల్‌కిట్',
    'Agricultural Tools & Government Portals': 'వ్యవసాయ సాధనాలు & ప్రభుత్వ పోర్టళ్లు',
    'Field Tools': 'క్షేత్ర సాధనాలు',
    'Government Portals': 'ప్రభుత్వ పోర్టళ్లు',
    'Empowering Agriculture with Digital Tools': 'డిజిటల్ సాధనాలతో వ్యవసాయాన్ని శక్తివంతం చేయడం',
  };
  return label ? labels[label] || label : '';
}



function ToolkitCard({ item, index, onClick }: { item: ToolkitItem; index: number; onClick: () => void }) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      onClick={onClick}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-800 via-gold-400 to-emerald-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:h-12 sm:w-12`}>
          <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        {item.externalUrl && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200/80 transition-all duration-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:ring-emerald-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700 dark:group-hover:bg-emerald-950/50 dark:group-hover:text-emerald-300 dark:group-hover:ring-emerald-700/50">
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <h3 className="relative mt-3 text-[13px] font-bold leading-tight text-slate-800 transition-colors group-hover:text-emerald-950 dark:text-slate-100 dark:group-hover:text-emerald-200 sm:text-sm">
        {t(item.title, translateToolkit(item.title))}
      </h3>
      <div className="relative mt-1 hidden xl:block">
        <p className="text-[11px] font-medium leading-snug text-slate-500 line-clamp-2 dark:text-slate-400">
          {t(item.description, translateToolkit(item.description))}
        </p>
      </div>
      {item.statusMessage && (
        <span className="relative mt-2 inline-flex w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50 sm:text-[10px]">
          {t(item.statusMessage, translateToolkit(item.statusMessage))}
        </span>
      )}
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-emerald-400/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

export function OfficersToolkit({ isAdmin = false, isTestUser = false }: OfficersToolkitProps) {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'portals'>('tools');

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

      <div className="relative mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Header Section - Only shown for public access */}
        {!shouldHideHeader && (
          <div className={`mb-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-white/80 to-emerald-50/90 px-4 py-3.5 shadow-md shadow-emerald-900/5 backdrop-blur-sm dark:border-emerald-800/50 dark:from-emerald-950/50 dark:via-slate-900 dark:to-emerald-950/40">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-800 via-gold-400 to-emerald-800" />
              <div className="relative flex min-w-0 items-center gap-3">
                <BackButton
                  onClick={() => navigate('/login')}
                  colors="text-emerald-700 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-white"
                />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold-300 shadow-lg shadow-emerald-900/25">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                    {t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
                  </h1>
                  <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('Agricultural Tools & Government Portals', 'వ్యవసాయ పనిముట్లు & ప్రభుత్వ పోర్టల్స్')}
                  </p>
                </div>
                <LanguageToggle
                  language={language}
                  onClick={toggleLanguage}
                  className="h-9 shrink-0 rounded-xl !border-emerald-200 !bg-white/80 !text-emerald-800 shadow-sm backdrop-blur px-3 hover:!bg-white dark:!border-emerald-800/60 dark:!bg-slate-900/80 dark:!text-emerald-300 dark:hover:!bg-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {shouldHideHeader && (
          <header className={`mb-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Officer Toolkit
            </p>
            <h1 className="mt-0.5 text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl">
              {t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t('Agricultural Tools & Government Portals', 'వ్యవసాయ పనిముట్లు & ప్రభుత్వ పోర్టల్స్')}
            </p>
          </header>
        )}

        {/* Section Switcher — Field Tools / Government Portals */}
        <div className={`mb-5 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex w-full max-w-md items-stretch gap-1 rounded-2xl border border-emerald-900/10 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
            {(
              [
                { id: 'tools', label: 'Field Tools', te: 'ఫీల్డ్ టూల్స్', icon: Calculator, count: sortedToolkitItems.length },
                { id: 'portals', label: 'Government Portals', te: 'ప్రభుత్వ పోర్టల్స్', icon: Globe2, count: sortedExternalPortals.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-md shadow-emerald-900/25'
                    : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                }`}
              >
                <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-gold-300' : ''}`} />
                <span className="truncate">{t(tab.label, tab.te)}</span>
                <span
                  className={`hidden rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none sm:inline-block ${
                    activeTab === tab.id
                      ? 'bg-white/15 text-emerald-50'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Section Grid */}
        <div
          key={activeTab}
          className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {activeTab === 'tools' ? (
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
          ) : (
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
                    index={index}
                    onClick={() => {}}
                  />
                </a>
              ))}
            </div>
          )}
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

