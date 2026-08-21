import React, { useState, useEffect } from 'react';
import { Calculator, FlaskConical, ShieldCheck, FileStack, ExternalLink, Leaf, Globe2, PackageCheck, Database, Bug, Sprout, Scale, Calendar, type LucideIcon } from 'lucide-react';
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
    title: 'Statutory Forms',
    description: 'Generate PDFs & view statutory form files.',
    path: '/officer-toolkit/statutory-forms',
    icon: FileStack,
    category: 'internal',
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
  },
  {
    title: 'Farm Calculators',
    description: 'Crop, seed, fertilizer and pesticide calculations.',
    path: '/officer-toolkit/farm-calculators',
    icon: Sprout,
    category: 'internal',
    gradient: 'from-green-600 to-teal-700',
    bgGradient: 'from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30',
  },
  {
    title: 'Crop Doctor',
    description: 'Crop-wise pests, diseases, weeds and nutrient deficiencies.',
    path: '/officer-toolkit/crop-protection',
    icon: Bug,
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
    icon: FlaskConical,
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
  },
  {
    title: 'Crop Loan Waiver',
    description: 'Telangana Crop Loan Waiver Portal',
    externalUrl: 'https://clw.telangana.gov.in/Login.aspx',
    icon: Leaf,
    gradient: 'from-rose-500 to-red-600',
    bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
  },
  {
    title: 'Soil Health Card',
    description: 'Soil Health Card Portal',
    externalUrl: 'https://soilhealth.dac.gov.in/admin/',
    icon: ShieldCheck,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
  },
  {
    title: 'OLMS',
    description: 'Online License Management System',
    externalUrl: 'https://agriolms.telangana.gov.in/Default.aspx',
    icon: FileStack,
    gradient: 'from-teal-500 to-cyan-600',
    bgGradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
  },
  {
    title: 'IFMS',
    description: 'Integrated Fertilizer Management System',
    externalUrl: 'https://dbtfert.nic.in/mFMS/loginNew.action',
    icon: PackageCheck,
    gradient: 'from-indigo-500 to-purple-600',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30',
  },
  {
    title: 'Treasury Challan Generation',
    description: 'Telangana IFMIS e-Challan Portal',
    externalUrl: 'https://ifmis.telangana.gov.in/echallan',
    icon: FileStack,
    gradient: 'from-slate-600 to-emerald-700',
    bgGradient: 'from-slate-50 to-emerald-50 dark:from-slate-950/30 dark:to-emerald-950/30',
  },
  {
    title: 'Agromet Advisories',
    description: 'Agricultural Meteorological Advisories',
    externalUrl: 'https://pjtau.edu.in/agromet-advisories/',
    icon: Calculator,
    gradient: 'from-sky-500 to-blue-600',
    bgGradient: 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30',
  },
  {
    title: 'IMD Weather',
    description: 'India Meteorological Department Weather',
    externalUrl: 'https://mausam.imd.gov.in/imd_latest/contents/districtwise-warning_mc.php?id=1',
    icon: Globe2,
    gradient: 'from-cyan-500 to-teal-600',
    bgGradient: 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30',
  },
  {
    title: 'Quality Control - Court Judgements',
    description: 'Fertilizer Control Order Court Judgements',
    externalUrl: 'https://indiankanoon.org/search/?formInput=fertilizer+control+order+&filters=doctypes%3A+judgments&filters=sortby%3A+mostrecent',
    icon: ShieldCheck,
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
  },
  {
    title: 'Rythu Bharosa',
    description: 'Telangana Government Agriculture Portal',
    externalUrl: 'https://rythubharosa.telangana.gov.in/Login.aspx',
    icon: Leaf,
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
  },
  {
    title: 'PM-Kisan',
    description: 'Pradhan Mantri Kisan Samman Nidhi',
    externalUrl: 'https://fw.pmkisan.gov.in/',
    icon: Globe2,
    gradient: 'from-yellow-500 to-amber-600',
    bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
  },
  {
    title: 'T-Seed Portal',
    description: 'Telangana Seed Portal',
    externalUrl: 'https://ossds.telangana.gov.in/Tseedlogin.aspx',
    icon: Leaf,
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
    icon: Database,
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30',
  },
];

function translateToolkit(label?: string) {
  const labels: Record<string, string> = {
    'Statutory Forms': 'చట్టబద్ధ ఫారాలు',
    'Generate PDFs & view statutory form files.': 'PDFలను జనరేట్ చేయి & చట్టబద్ధ ఫారమ్ ఫైళ్లను వీక్షించండి.',
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

function ToolkitCard({ item, index, onClick }: { item: ToolkitItem; index: number; onClick: () => void }) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br ${item.bgGradient} p-5 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 dark:border-emerald-800/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
      <div className="relative flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <item.icon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
            {t(item.title, translateToolkit(item.title))}
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-2">
            {t(item.description, translateToolkit(item.description))}
          </p>
          {item.statusMessage && (
            <div className="mt-2 inline-flex w-fit rounded-full bg-red-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-red-800 dark:bg-red-900/40 dark:text-red-200">
              {t(item.statusMessage, translateToolkit(item.statusMessage))}
            </div>
          )}
          {item.externalUrl && (
            <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ExternalLink className="h-3 w-3" />
              <span>{t('External Portal', 'బాహ్య పోర్టల్')}</span>
            </div>
          )}
        </div>
      </div>
      <div className={`absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-gradient-to-br ${item.gradient} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20`} />
    </div>
  );
}

export function OfficersToolkit({ isAdmin = false, isTestUser = false }: OfficersToolkitProps) {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const shouldHideHeader = isAdmin || isTestUser;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        {/* Header Section - Only shown for public access */}
        {!shouldHideHeader && (
          <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="rounded-3xl border border-emerald-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:border-emerald-800/50 dark:bg-slate-900/80 relative">
              <div className="absolute top-6 right-6">
                <LanguageToggle language={language} onClick={toggleLanguage} />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                      {t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {t('Agricultural Tools & Government Portals', 'వ్యవసాయ పనిముట్లు & ప్రభుత్వ పోర్టల్స్')}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <BackButton onClick={() => navigate('/login')}>
                    Back
                  </BackButton>
                </div>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toolkitItems.map((item, index) => (
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {externalPortals.map((item, index) => (
              <a
                key={item.externalUrl}
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
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

