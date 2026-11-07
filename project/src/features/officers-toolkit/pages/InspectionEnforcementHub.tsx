import React, { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, Bug, ChevronDown, ChevronRight, ClipboardCheck, FileText, FlaskConical, PackageX, Sprout } from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { ToolkitPageHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import type { SavedPestStopSaleOrder } from '../components/PesticideStopSaleEntry';
import type { SavedFertStopSaleOrder } from '../components/FertilizerStopSaleEntry';
import type { SavedSeedStopSaleOrder } from '../components/SeedStopSaleEntry';
import type { NoticeCategory } from '../data/showCauseViolationData';

const ShowCauseNoticeEntry = lazy(() => import('../components/ShowCauseNoticeEntry').then((m) => ({ default: m.ShowCauseNoticeEntry })));
const PesticideStopSaleEntry = lazy(() => import('../components/PesticideStopSaleEntry').then((m) => ({ default: m.PesticideStopSaleEntry })));
const PesticideStopSaleRevokeEntry = lazy(() => import('../components/PesticideStopSaleRevokeEntry').then((m) => ({ default: m.PesticideStopSaleRevokeEntry })));
const FertilizerStopSaleEntry = lazy(() => import('../components/FertilizerStopSaleEntry').then((m) => ({ default: m.FertilizerStopSaleEntry })));
const SeedStopSaleEntry = lazy(() => import('../components/SeedStopSaleEntry').then((m) => ({ default: m.SeedStopSaleEntry })));
const FertilizerStopSaleRevokeEntry = lazy(() => import('../components/FertilizerStopSaleRevokeEntry').then((m) => ({ default: m.FertilizerStopSaleRevokeEntry })));
const FertilizerSeizureOrderEntry = lazy(() => import('../components/FertilizerSeizureOrderEntry').then((m) => ({ default: m.FertilizerSeizureOrderEntry })));
const SeedSeizureOrderEntry = lazy(() => import('../components/SeedSeizureOrderEntry').then((m) => ({ default: m.SeedSeizureOrderEntry })));
const PesticideSeizureOrderEntry = lazy(() => import('../components/PesticideSeizureOrderEntry').then((m) => ({ default: m.PesticideSeizureOrderEntry })));
const SeedStopSaleRevokeEntry = lazy(() => import('../components/SeedStopSaleRevokeEntry').then((m) => ({ default: m.SeedStopSaleRevokeEntry })));

const LazySubLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
  </div>
);

const NOTICE_TYPES: { label: string; category: NoticeCategory; icon: typeof Sprout; tone: string }[] = [
  { label: 'Seed', category: 'seed', icon: Sprout, tone: 'emerald' },
  { label: 'Fertilizer', category: 'fertiliser', icon: FlaskConical, tone: 'sky' },
  { label: 'Pesticide', category: 'pesticide', icon: Bug, tone: 'amber' },
];

const chipClasses: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
  sky: 'bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60',
  rose: 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
};

type HubCardKey = 'inspections' | 'notices' | 'stopSale' | 'seizure';

const cardThemes: Record<
  string,
  {
    iconBg: string;
    borderActive: string;
    borderIdle: string;
    borderHover: string;
    badgeBg: string;
    badgeText: string;
    badgeTeText: string;
    chevronOpen: string;
    itemHoverBorder: string;
    itemHoverBg: string;
    accentGlow: string;
  }
> = {
  teal: {
    iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-900/10',
    borderActive: 'border-emerald-600/50 ring-2 ring-emerald-500/15 dark:border-emerald-500',
    borderIdle: 'border-slate-200/90 dark:border-slate-800',
    borderHover: 'hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-950/5',
    badgeBg: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800/60',
    badgeText: '3 Checklists',
    badgeTeText: '3 చెక్‌లిస్టులు',
    chevronOpen: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    itemHoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    itemHoverBg: 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30',
    accentGlow: 'from-emerald-600 via-teal-500 to-emerald-700',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-900/10',
    borderActive: 'border-amber-600/50 ring-2 ring-amber-500/15 dark:border-amber-500',
    borderIdle: 'border-slate-200/90 dark:border-slate-800',
    borderHover: 'hover:border-amber-500/40 hover:shadow-md hover:shadow-amber-950/5',
    badgeBg: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800/60',
    badgeText: '3 Notices',
    badgeTeText: '3 నోటీసులు',
    chevronOpen: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    itemHoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    itemHoverBg: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/30',
    accentGlow: 'from-amber-500 via-orange-500 to-amber-600',
  },
  rose: {
    iconBg: 'bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-md shadow-rose-900/10',
    borderActive: 'border-rose-600/50 ring-2 ring-rose-500/15 dark:border-rose-500',
    borderIdle: 'border-slate-200/90 dark:border-slate-800',
    borderHover: 'hover:border-rose-500/40 hover:shadow-md hover:shadow-rose-950/5',
    badgeBg: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800/60',
    badgeText: '3 Orders',
    badgeTeText: '3 ఆర్డర్లు',
    chevronOpen: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    itemHoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    itemHoverBg: 'hover:bg-rose-50/40 dark:hover:bg-rose-950/30',
    accentGlow: 'from-rose-500 via-red-500 to-rose-600',
  },
  indigo: {
    iconBg: 'bg-gradient-to-br from-indigo-700 to-slate-800 text-white shadow-md shadow-indigo-900/10',
    borderActive: 'border-indigo-600/50 ring-2 ring-indigo-500/15 dark:border-indigo-500',
    borderIdle: 'border-slate-200/90 dark:border-slate-800',
    borderHover: 'hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-950/5',
    badgeBg: 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800/60',
    badgeText: '3 Seizures',
    badgeTeText: '3 జప్తులు',
    chevronOpen: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    itemHoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    itemHoverBg: 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30',
    accentGlow: 'from-indigo-600 via-blue-600 to-indigo-700',
  },
  // Backward compatibility aliases
  cyan: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-900/10',
    borderActive: 'border-amber-600/50 ring-2 ring-amber-500/15 dark:border-amber-500',
    borderIdle: 'border-slate-200/90 dark:border-slate-800',
    borderHover: 'hover:border-amber-500/40 hover:shadow-md hover:shadow-amber-950/5',
    badgeBg: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800/60',
    badgeText: '3 Notices',
    badgeTeText: '3 నోటీసులు',
    chevronOpen: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    itemHoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    itemHoverBg: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/30',
    accentGlow: 'from-amber-500 via-orange-500 to-amber-600',
  },
  sky: {
    iconBg: 'bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-md shadow-rose-900/10',
    borderActive: 'border-rose-600/50 ring-2 ring-rose-500/15 dark:border-rose-500',
    borderIdle: 'border-slate-200/90 dark:border-slate-800',
    borderHover: 'hover:border-rose-500/40 hover:shadow-md hover:shadow-rose-950/5',
    badgeBg: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800/60',
    badgeText: '3 Orders',
    badgeTeText: '3 ఆర్డర్లు',
    chevronOpen: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    itemHoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    itemHoverBg: 'hover:bg-rose-50/40 dark:hover:bg-rose-950/30',
    accentGlow: 'from-rose-500 via-red-500 to-rose-600',
  },
};

const noticeModalThemes: Record<NoticeCategory, { header: string; icon: string; eyebrow: string }> = {
  fertiliser: {
    header: 'border-blue-100/60 from-blue-50 via-white to-sky-50',
    icon: 'from-blue-600 to-sky-600 shadow-blue-500/25',
    eyebrow: 'text-blue-600/80',
  },
  seed: {
    header: 'border-green-100/60 from-green-50 via-white to-emerald-50',
    icon: 'from-green-600 to-emerald-600 shadow-green-500/25',
    eyebrow: 'text-green-600/80',
  },
  pesticide: {
    header: 'border-amber-100/60 from-amber-50 via-white to-yellow-50',
    icon: 'from-amber-500 to-yellow-600 shadow-amber-500/25',
    eyebrow: 'text-amber-700/80',
  },
};

export function InspectionEnforcementHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isAdminUser, isTestUser, isOfficerUser } = useAuth();
  const showCompactHeader = !user || isAdminUser || isTestUser || isOfficerUser;
  const [openCard, setOpenCard] = useState<HubCardKey | null>(null);
  const [selectedNoticeCategory, setSelectedNoticeCategory] = useState<NoticeCategory | null>(null);
  const [showPesticideStopSale, setShowPesticideStopSale] = useState(false);
  const [showFertilizerStopSale, setShowFertilizerStopSale] = useState(false);
  const [showSeedStopSale, setShowSeedStopSale] = useState(false);
  const [fertStopSaleTab, setFertStopSaleTab] = useState<'issue' | 'revoke'>('issue');
  const [fertRevokePrefill, setFertRevokePrefill] = useState<SavedFertStopSaleOrder | null>(null);
  const [seedStopSaleTab, setSeedStopSaleTab] = useState<'issue' | 'revoke'>('issue');
  const [seedRevokePrefill, setSeedRevokePrefill] = useState<SavedSeedStopSaleOrder | null>(null);
  const [pestStopSaleTab, setPestStopSaleTab] = useState<'issue' | 'revoke'>('issue');
  const [pestRevokePrefill, setPestRevokePrefill] = useState<SavedPestStopSaleOrder | null>(null);
  const [showFertilizerSeizure, setShowFertilizerSeizure] = useState(false);
  const [showSeedSeizure, setShowSeedSeizure] = useState(false);
  const [showPesticideSeizure, setShowPesticideSeizure] = useState(false);

  const toggleCard = (card: HubCardKey) =>
    setOpenCard((current) => (current === card ? null : card));

  const hubCards = [
    {
      key: 'inspections' as const,
      title: 'Inspections',
      teTitle: 'తనిఖీలు',
      subtitle: 'Dealer inspection checklists',
      teSubtitle: 'విత్తనం, ఎరువు & పురుగుమందు డీలర్ల తనిఖీ చెక్‌లిస్టులు',
      icon: ClipboardCheck,
      theme: 'teal',
      items: [
        { label: 'Seed Inspection', teLabel: 'విత్తన డీలర్ తనిఖీ', desc: 'Seeds Act, 1966 & Seeds Rules', teDesc: 'విత్తన చట్టం ప్రకారం డీలర్ తనిఖీ', icon: Sprout, tone: 'emerald', onClick: () => navigate('/officer-toolkit/seed-dealer-inspection') },
        { label: 'Fertilizer Inspection', teLabel: 'ఎరువుల డీలర్ తనిఖీ', desc: 'FCO 1985 & Clause 28/35', teDesc: 'ఎఫ్.సి.ఒ 1985 ప్రకారం తనిఖీ', icon: FlaskConical, tone: 'sky', onClick: () => navigate('/officer-toolkit/fertilizer-dealer-inspection') },
        { label: 'Pesticide Inspection', teLabel: 'పురుగుమందుల డీలర్ తనిఖీ', desc: 'Insecticides Act, 1968 & Rules', teDesc: 'పురుగుమందు చట్టం ప్రకారం తనిఖీ', icon: Bug, tone: 'rose', onClick: () => navigate('/officer-toolkit/insecticide-dealer-inspection') },
      ],
    },
    {
      key: 'notices' as const,
      title: 'Memo & Show Cause Notice',
      teTitle: 'మెమో & షోకాజ్ నోటీసు',
      subtitle: 'Notices and memos',
      teSubtitle: 'నోటీసులు, మెమోలు & వివరణ ఉత్తర్వులు',
      icon: FileText,
      theme: 'amber',
      items: [
        { label: 'Seed Notice', teLabel: 'విత్తన షోకాజ్ నోటీసు', desc: 'Seeds Act statutory notice & memo', teDesc: 'విత్తన ఉల్లంఘనలపై చట్టబద్ధమైన నోటీసు', icon: Sprout, tone: 'emerald', onClick: () => setSelectedNoticeCategory('seed') },
        { label: 'Fertilizer Notice', teLabel: 'ఎరువుల షోకాజ్ నోటీసు', desc: 'FCO 1985 statutory notice & memo', teDesc: 'ఎఫ్.సి.ఒ నిబంధనల ఉల్లంఘన నోటీసు', icon: FlaskConical, tone: 'sky', onClick: () => setSelectedNoticeCategory('fertiliser') },
        { label: 'Pesticide Notice', teLabel: 'పురుగుమందుల షోకాజ్ నోటీసు', desc: 'Insecticides Act statutory notice & memo', teDesc: 'పురుగుమందుల చట్ట ఉల్లంఘన నోటీసు', icon: Bug, tone: 'amber', onClick: () => setSelectedNoticeCategory('pesticide') },
      ],
    },
    {
      key: 'stopSale' as const,
      title: 'Stop Sale Order',
      teTitle: 'స్టాప్ సేల్ ఆర్డర్',
      subtitle: 'Stop sale orders & revocations',
      teSubtitle: 'అమ్మకం నిలిపివేత & ఉపసంహరణ ఉత్తర్వులు',
      icon: Ban,
      theme: 'rose',
      items: [
        {
          label: 'Pesticide Stop Sale',
          teLabel: 'పురుగుమందుల స్టాప్ సేల్',
          desc: 'Form XIV / Rule 28 stop sale & revocation',
          teDesc: 'ఫారం XIV / నిబంధన 28 ప్రకారం అమ్మకం నిలిపివేత',
          icon: Bug,
          tone: 'amber',
          onClick: () => { setPestStopSaleTab('issue'); setShowPesticideStopSale(true); },
        },
        {
          label: 'Fertilizer Stop Sale',
          teLabel: 'ఎరువుల స్టాప్ సేల్',
          desc: 'Form L / Clause 28 stop sale & revocation',
          teDesc: 'ఫారం L / క్లాజ్ 28 ప్రకారం అమ్మకం నిలిపివేత',
          icon: FlaskConical,
          tone: 'sky',
          onClick: () => { setFertStopSaleTab('issue'); setShowFertilizerStopSale(true); },
        },
        {
          label: 'Seed Stop Sale',
          teLabel: 'విత్తనాల స్టాప్ సేల్',
          desc: 'Form III / Section 14(1)(c) stop sale & revocation',
          teDesc: 'ఫారం III / సెక్షన్ 14(1)(c) ప్రకారం నిలిపివేత',
          icon: Sprout,
          tone: 'emerald',
          onClick: () => { setSeedStopSaleTab('issue'); setShowSeedStopSale(true); },
        },
      ],
    },
    {
      key: 'seizure' as const,
      title: 'Seizure Order',
      teTitle: 'జప్తి ఆర్డర్',
      subtitle: 'Stock seizure orders',
      teSubtitle: 'స్టాక్ జప్తి ఉత్తర్వులు & భద్రతా రికార్డులు',
      icon: PackageX,
      theme: 'indigo',
      items: [
        { label: 'Fertilizer Seizure', teLabel: 'ఎరువుల జప్తి ఆర్డర్', desc: 'Form M / Clause 28(1)(d) stock seizure', teDesc: 'ఫారం M / క్లాజ్ 28(1)(d) ప్రకారం జప్తి', icon: FlaskConical, tone: 'sky', onClick: () => setShowFertilizerSeizure(true) },
        { label: 'Seed Seizure', teLabel: 'విత్తనాల జప్తి ఆర్డర్', desc: 'Form IV / Section 14(1)(b) stock seizure', teDesc: 'ఫారం IV / సెక్షన్ 14(1)(b) ప్రకారం జప్తి', icon: Sprout, tone: 'emerald', onClick: () => setShowSeedSeizure(true) },
        { label: 'Pesticide Seizure', teLabel: 'పురుగుమందుల జప్తి ఆర్డర్', desc: 'Form XV / Rule 29 stock seizure', teDesc: 'ఫారం XV / రూల్ 29 ప్రకారం జప్తి', icon: Bug, tone: 'amber', onClick: () => setShowPesticideSeizure(true) },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl p-2 sm:p-3">
      {showCompactHeader ? (
        <ModulePageHeader
          className="mb-4"
          title={t('Inspection & Enforcement', 'తనిఖీ & అమలు')}
          subtitle={t('Inspection proforma, memo & show cause notice, stop sale & seizure orders', 'విత్తనం, ఎరువు & పురుగుమందు తనిఖీ ప్రొఫార్మా, మెమోలు, షోకాజ్ నోటీసులు & జప్తి ఉత్తర్వులు')}
          icon={ClipboardCheck}
          onBack={!user ? () => navigate('/dashboard') : undefined}
        />
      ) : (
        <ToolkitPageHeader
          icon={ClipboardCheck}
          tone="teal-indigo"
          eyebrow={t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
          title={t('Inspection & Enforcement', 'తనిఖీ & అమలు')}
          fallbackPath="/dashboard"
          onBack={() => navigate('/dashboard')}
          className="mb-4"
        />
      )}

      <div className="grid items-start gap-4 sm:grid-cols-2">
        {hubCards.map((card) => {
          const isOpen = openCard === card.key;
          const theme = cardThemes[card.theme] || cardThemes.teal;
          return (
            <div
              key={card.key}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                isOpen
                  ? `${theme.borderActive} bg-white shadow-md dark:bg-slate-900`
                  : `${theme.borderIdle} bg-white shadow-xs hover:-translate-y-0.5 hover:shadow-md ${theme.borderHover} dark:bg-slate-900`
              }`}
            >
              {/* Subtle top hairline indicator when open */}
              {isOpen && (
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.accentGlow}`} />
              )}

              <button
                type="button"
                onClick={() => toggleCard(card.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3.5 p-4 sm:p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                <div
                  className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 ${theme.iconBg}`}
                >
                  <card.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm sm:text-base font-black leading-tight text-slate-900 dark:text-white font-[var(--font-heading)]">
                      {t(card.title, card.teTitle)}
                    </p>
                    <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${theme.badgeBg}`}>
                      {t(theme.badgeText, theme.badgeTeText)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs font-medium leading-snug text-slate-500 dark:text-slate-400">
                    {t(card.subtitle, card.teSubtitle)}
                  </p>
                </div>
                <span
                  className={`ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                    isOpen
                      ? `rotate-180 ${theme.chevronOpen}`
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700/80'
                  }`}
                  aria-hidden="true"
                >
                  <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                </span>
              </button>

              {/* Sub-item Labels / Action Cards */}
              {isOpen && (
                <div className="grid gap-2 border-t border-slate-100 bg-slate-50/70 p-3 sm:p-4 backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-950/50">
                  {card.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className={`group/item flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-2xs transition-all duration-200 hover:-translate-y-px hover:shadow-xs ${theme.itemHoverBorder} ${theme.itemHoverBg} dark:border-slate-800 dark:bg-slate-900`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-2xs transition-transform duration-200 group-hover/item:scale-105 ${chipClasses[item.tone]}`}>
                        <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {t(item.label, item.teLabel)}
                        </span>
                        <span className="block truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {t(item.desc, item.teDesc)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover/item:translate-x-0.5 group-hover/item:text-slate-700 dark:text-slate-500 dark:group-hover/item:text-slate-200" strokeWidth={2.5} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedNoticeCategory && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-7xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
            <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 sm:px-6 ${noticeModalThemes[selectedNoticeCategory].header}`}>
              <div className="relative flex min-w-0 flex-1 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${noticeModalThemes[selectedNoticeCategory].icon}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes[selectedNoticeCategory].eyebrow}`}>Notices &amp; memos</p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    {NOTICE_TYPES.find((item) => item.category === selectedNoticeCategory)?.label} Show Cause Notice / Memo Entry
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNoticeCategory(null)}
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <Suspense fallback={<LazySubLoader />}>
                <ShowCauseNoticeEntry lockedCategory={selectedNoticeCategory} />
              </Suspense>
            </div>
          </section>
        </div>
      )}

      {showPesticideStopSale && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-7xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
            <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 sm:px-6 ${noticeModalThemes.pesticide.header}`}>
              <div className="relative flex min-w-0 flex-1 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${noticeModalThemes.pesticide.icon}`}>
                  <Ban className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.pesticide.eyebrow}`}>
                    {pestStopSaleTab === 'issue' ? 'Stop Sale Order — Form V(A)' : 'Revocation of Stop Sale Order'}
                  </p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    {pestStopSaleTab === 'issue' ? 'Pesticide Stop Sale Order Entry' : 'Pesticide Stop Sale Revoke Entry'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPesticideStopSale(false)}
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <div className="mb-3 flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => setPestStopSaleTab('issue')}
                  className={`flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold shadow-sm transition dark:border-slate-700 ${pestStopSaleTab === 'issue' ? 'border-amber-600 bg-amber-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                >
                  Stop Sale Order
                </button>
                <button
                  type="button"
                  onClick={() => { setPestRevokePrefill(null); setPestStopSaleTab('revoke'); }}
                  className={`flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold shadow-sm transition dark:border-slate-700 ${pestStopSaleTab === 'revoke' ? 'border-amber-600 bg-amber-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                >
                  Revocation Order
                </button>
              </div>
              <Suspense fallback={<LazySubLoader />}>
                {pestStopSaleTab === 'issue' ? (
                  <PesticideStopSaleEntry
                    onRevoke={(order) => {
                      setPestRevokePrefill(order);
                      setPestStopSaleTab('revoke');
                    }}
                  />
                ) : (
                  <PesticideStopSaleRevokeEntry prefill={pestRevokePrefill} />
                )}
              </Suspense>
            </div>
          </section>
        </div>
      )}

      {showFertilizerStopSale && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-7xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
            <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 sm:px-6 ${noticeModalThemes.fertiliser.header}`}>
              <div className="relative flex min-w-0 flex-1 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${noticeModalThemes.fertiliser.icon}`}>
                  <Ban className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.fertiliser.eyebrow}`}>
                    {fertStopSaleTab === 'issue' ? 'Stop Sale Notice — Annexure-A' : 'Revoke of Stop Sale Order — Clause 28'}
                  </p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    {fertStopSaleTab === 'issue' ? 'Fertilizer Stop Sale Notice Entry' : 'Fertilizer Stop Sale Revoke Entry'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFertilizerStopSale(false)}
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <div className="mb-3 flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => setFertStopSaleTab('issue')}
                  className={`flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold shadow-sm transition dark:border-slate-700 ${fertStopSaleTab === 'issue' ? 'border-sky-600 bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                >
                  Stop Sale Notice
                </button>
                <button
                  type="button"
                  onClick={() => { setFertRevokePrefill(null); setFertStopSaleTab('revoke'); }}
                  className={`flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold shadow-sm transition dark:border-slate-700 ${fertStopSaleTab === 'revoke' ? 'border-sky-600 bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                >
                  Revocation Order
                </button>
              </div>
              <Suspense fallback={<LazySubLoader />}>
                {fertStopSaleTab === 'issue' ? (
                  <FertilizerStopSaleEntry
                    onRevoke={(order) => {
                      setFertRevokePrefill(order);
                      setFertStopSaleTab('revoke');
                    }}
                  />
                ) : (
                  <FertilizerStopSaleRevokeEntry prefill={fertRevokePrefill} />
                )}
              </Suspense>
            </div>
          </section>
        </div>
      )}

      {showSeedStopSale && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-7xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
            <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 sm:px-6 ${noticeModalThemes.seed.header}`}>
              <div className="relative flex min-w-0 flex-1 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${noticeModalThemes.seed.icon}`}>
                  <Ban className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.seed.eyebrow}`}>
                    {seedStopSaleTab === 'issue' ? 'Stop Sale Order — Form III' : 'Revocation of Stop Sale Order — Annexure-I'}
                  </p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    {seedStopSaleTab === 'issue' ? 'Seed Stop Sale Order Entry' : 'Seed Stop Sale Revoke Entry'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSeedStopSale(false)}
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <div className="mb-3 flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => setSeedStopSaleTab('issue')}
                  className={`flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold shadow-sm transition dark:border-slate-700 ${seedStopSaleTab === 'issue' ? 'border-emerald-600 bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                >
                  Stop Sale Order
                </button>
                <button
                  type="button"
                  onClick={() => { setSeedRevokePrefill(null); setSeedStopSaleTab('revoke'); }}
                  className={`flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold shadow-sm transition dark:border-slate-700 ${seedStopSaleTab === 'revoke' ? 'border-emerald-600 bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                >
                  Revocation Order
                </button>
              </div>
              <Suspense fallback={<LazySubLoader />}>
                {seedStopSaleTab === 'issue' ? (
                  <SeedStopSaleEntry
                    onRevoke={(order) => {
                      setSeedRevokePrefill(order);
                      setSeedStopSaleTab('revoke');
                    }}
                  />
                ) : (
                  <SeedStopSaleRevokeEntry prefill={seedRevokePrefill} />
                )}
              </Suspense>
            </div>
          </section>
        </div>
      )}

      {showFertilizerSeizure && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-7xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
            <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 sm:px-6 ${noticeModalThemes.fertiliser.header}`}>
              <div className="relative flex min-w-0 flex-1 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${noticeModalThemes.fertiliser.icon}`}>
                  <PackageX className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.fertiliser.eyebrow}`}>
                    Seizure of Stock — Annexure 'AA', Clause 28(1)(d)
                  </p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    Fertilizer Seizure Order Entry
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFertilizerSeizure(false)}
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <Suspense fallback={<LazySubLoader />}>
                <FertilizerSeizureOrderEntry />
              </Suspense>
            </div>
          </section>
        </div>
      )}

      {showSeedSeizure && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-7xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
            <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 sm:px-6 ${noticeModalThemes.seed.header}`}>
              <div className="relative flex min-w-0 flex-1 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${noticeModalThemes.seed.icon}`}>
                  <PackageX className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.seed.eyebrow}`}>
                    Receipt of Records — Form IV, Sec. 14(1)(4), Seeds Act 1966
                  </p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    Seed Seizure — Form IV Entry
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSeedSeizure(false)}
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <Suspense fallback={<LazySubLoader />}>
                <SeedSeizureOrderEntry />
              </Suspense>
            </div>
          </section>
        </div>
      )}

      {showPesticideSeizure && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-7xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
            <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 sm:px-6 ${noticeModalThemes.pesticide.header}`}>
              <div className="relative flex min-w-0 flex-1 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${noticeModalThemes.pesticide.icon}`}>
                  <PackageX className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.pesticide.eyebrow}`}>
                    Receipt for Seized Insecticides — Form V(B), Rule 32, Sec. 21(1)(d)
                  </p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    Pesticide Seizure — Form V(B) Entry
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPesticideSeizure(false)}
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <Suspense fallback={<LazySubLoader />}>
                <PesticideSeizureOrderEntry />
              </Suspense>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
