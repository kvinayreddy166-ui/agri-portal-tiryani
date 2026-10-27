import React, { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Ban, Bug, ChevronDown, ClipboardCheck, FileText, FlaskConical, PackageX, Sprout } from 'lucide-react';
import { ToolkitPageHeader } from '../../../shared/components/ui/ToolkitPageHeader';
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

const INSPECTION_TYPES = [
  { label: 'Seed', path: '/officer-toolkit/seed-dealer-inspection', icon: Sprout, tone: 'emerald' },
  { label: 'Fertilizer', path: '/officer-toolkit/fertilizer-dealer-inspection', icon: FlaskConical, tone: 'sky' },
  { label: 'Pesticide', path: '/officer-toolkit/insecticide-dealer-inspection', icon: Bug, tone: 'rose' },
] as const;

const NOTICE_TYPES: { label: string; category: NoticeCategory; icon: typeof Sprout; tone: string }[] = [
  { label: 'Seed', category: 'seed', icon: Sprout, tone: 'emerald' },
  { label: 'Fertilizer', category: 'fertiliser', icon: FlaskConical, tone: 'sky' },
  { label: 'Pesticide', category: 'pesticide', icon: Bug, tone: 'amber' },
];

const STOP_SALE_TYPES: { label: string; icon: typeof Sprout; tone: string }[] = [
  { label: 'Seed', icon: Sprout, tone: 'emerald' },
  { label: 'Fertilizer', icon: FlaskConical, tone: 'sky' },
  { label: 'Pesticide', icon: Bug, tone: 'amber' },
];

const SEIZURE_TYPES: { label: string; icon: typeof Sprout; tone: string }[] = [
  { label: 'Seed', icon: Sprout, tone: 'emerald' },
  { label: 'Fertilizer', icon: FlaskConical, tone: 'sky' },
  { label: 'Pesticide', icon: Bug, tone: 'amber' },
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
    bar: string;
    gradientTop: string;
    iconBg: string;
    iconShadow: string;
    borderActive: string;
    borderHover: string;
    bgTint: string;
    badgeBg: string;
    badgeText: string;
    chevronOpen: string;
    itemHoverBorder: string;
    itemHoverBg: string;
  }
> = {
  teal: {
    bar: 'from-emerald-500 to-emerald-600',
    gradientTop: 'from-emerald-500 via-teal-500 to-emerald-600',
    iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-700',
    iconShadow: 'shadow-emerald-900/15',
    borderActive: 'border-emerald-500/60 ring-2 ring-emerald-500/10 dark:border-emerald-500',
    borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    bgTint: 'from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20',
    badgeBg: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/60',
    badgeText: '3 Checklists',
    chevronOpen: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    itemHoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    itemHoverBg: 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30',
  },
  amber: {
    bar: 'from-amber-500 to-orange-500',
    gradientTop: 'from-amber-400 via-orange-400 to-amber-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconShadow: 'shadow-amber-900/15',
    borderActive: 'border-amber-500/60 ring-2 ring-amber-500/10 dark:border-amber-500',
    borderHover: 'hover:border-amber-300 dark:hover:border-amber-700',
    bgTint: 'from-white via-amber-50/20 to-orange-50/25 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20',
    badgeBg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/60',
    badgeText: '3 Notices',
    chevronOpen: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    itemHoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    itemHoverBg: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/30',
  },
  rose: {
    bar: 'from-rose-500 to-red-600',
    gradientTop: 'from-rose-500 via-red-500 to-rose-600',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
    iconShadow: 'shadow-rose-900/15',
    borderActive: 'border-rose-500/60 ring-2 ring-rose-500/10 dark:border-rose-500',
    borderHover: 'hover:border-rose-300 dark:hover:border-rose-700',
    bgTint: 'from-white via-rose-50/20 to-red-50/25 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20',
    badgeBg: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800/60',
    badgeText: '3 Orders',
    chevronOpen: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    itemHoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    itemHoverBg: 'hover:bg-rose-50/40 dark:hover:bg-rose-950/30',
  },
  indigo: {
    bar: 'from-indigo-500 to-violet-600',
    gradientTop: 'from-indigo-500 via-violet-500 to-purple-600',
    iconBg: 'bg-gradient-to-br from-indigo-600 to-violet-700',
    iconShadow: 'shadow-indigo-900/15',
    borderActive: 'border-indigo-500/60 ring-2 ring-indigo-500/10 dark:border-indigo-500',
    borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    bgTint: 'from-white via-indigo-50/20 to-violet-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20',
    badgeBg: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800/60',
    badgeText: '3 Seizures',
    chevronOpen: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200',
    itemHoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    itemHoverBg: 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30',
  },
  // Backward compatibility aliases
  cyan: {
    bar: 'from-amber-500 to-orange-500',
    gradientTop: 'from-amber-400 via-orange-400 to-amber-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconShadow: 'shadow-amber-900/15',
    borderActive: 'border-amber-500/60 ring-2 ring-amber-500/10 dark:border-amber-500',
    borderHover: 'hover:border-amber-300 dark:hover:border-amber-700',
    bgTint: 'from-white via-amber-50/20 to-orange-50/25 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20',
    badgeBg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/60',
    badgeText: '3 Notices',
    chevronOpen: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    itemHoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    itemHoverBg: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/30',
  },
  sky: {
    bar: 'from-rose-500 to-red-600',
    gradientTop: 'from-rose-500 via-red-500 to-rose-600',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
    iconShadow: 'shadow-rose-900/15',
    borderActive: 'border-rose-500/60 ring-2 ring-rose-500/10 dark:border-rose-500',
    borderHover: 'hover:border-rose-300 dark:hover:border-rose-700',
    bgTint: 'from-white via-rose-50/20 to-red-50/25 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20',
    badgeBg: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800/60',
    badgeText: '3 Orders',
    chevronOpen: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    itemHoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    itemHoverBg: 'hover:bg-rose-50/40 dark:hover:bg-rose-950/30',
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

  const hubCards: {
    key: HubCardKey;
    title: string;
    subtitle: string;
    icon: typeof Sprout;
    theme: string;
    items: { label: string; icon: typeof Sprout; tone: string; onClick: () => void }[];
  }[] = [
    {
      key: 'inspections',
      title: 'Inspections',
      subtitle: 'Dealer inspection checklists',
      icon: ClipboardCheck,
      theme: 'teal',

      items: INSPECTION_TYPES.map((item) => ({ label: `${item.label} Inspection`, icon: item.icon, tone: item.tone, onClick: () => navigate(item.path) })),
    },
    {
      key: 'notices',
      title: 'Memo & Show Cause Notice',
      subtitle: 'Notices and memos',
      icon: FileText,
      theme: 'cyan',

      items: NOTICE_TYPES.map((item) => ({ label: `${item.label} Notice`, icon: item.icon, tone: item.tone, onClick: () => setSelectedNoticeCategory(item.category) })),
    },
    {
      key: 'stopSale',
      title: 'Stop Sale Order',
      subtitle: 'Stop sale orders & revocations',
      icon: Ban,
      theme: 'sky',

      items: STOP_SALE_TYPES.map((item) => ({
        label: `${item.label} Stop Sale`,
        icon: item.icon,
        tone: item.tone,
        onClick: () => {
          if (item.label === 'Pesticide') { setPestStopSaleTab('issue'); setShowPesticideStopSale(true); }
          if (item.label === 'Fertilizer') { setFertStopSaleTab('issue'); setShowFertilizerStopSale(true); }
          if (item.label === 'Seed') { setSeedStopSaleTab('issue'); setShowSeedStopSale(true); }
        },
      })),
    },
    {
      key: 'seizure',
      title: 'Seizure Order',
      subtitle: 'Stock seizure orders',
      icon: PackageX,
      theme: 'indigo',

      items: SEIZURE_TYPES.map((item) => ({
        label: `${item.label} Seizure`,
        icon: item.icon,
        tone: item.tone,
        onClick: () => {
          if (item.label === 'Fertilizer') setShowFertilizerSeizure(true);
          if (item.label === 'Seed') setShowSeedSeizure(true);
          if (item.label === 'Pesticide') setShowPesticideSeizure(true);
        },
      })),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl p-2 sm:p-3">
      <ToolkitPageHeader
        title="Inspection & Enforcement"
        eyebrow="Officer Toolkit"
        icon={ClipboardCheck}
        tone="teal-indigo"
        fallbackPath="/officer-toolkit"
        className="mb-4"
      />

      <div className="grid items-start gap-4 sm:grid-cols-2">
        {hubCards.map((card) => {
          const isOpen = openCard === card.key;
          const theme = cardThemes[card.theme];
          return (
            <div
              key={card.key}
              className={`group relative overflow-hidden rounded-2xl border transition duration-300 bg-gradient-to-br ${theme.bgTint} ${
                isOpen
                  ? `${theme.borderActive} shadow-lg shadow-slate-900/5`
                  : `border-slate-200/80 shadow-sm hover:-translate-y-0.5 hover:shadow-md ${theme.borderHover} dark:border-slate-800`
              }`}
            >
              {/* Left Accent Vertical Bar */}
              <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${theme.bar}`} />

              <button
                type="button"
                onClick={() => toggleCard(card.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 py-4 pl-6 pr-4 sm:py-5 sm:pl-7 sm:pr-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-all duration-300 group-hover:scale-105 ${theme.iconBg} ${theme.iconShadow}`}
                >
                  <card.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-black leading-tight text-slate-900 dark:text-white">{card.title}</p>
                    <span className={`hidden sm:inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${theme.badgeBg}`}>
                      {theme.badgeText}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium leading-snug text-slate-500 dark:text-slate-400">{card.subtitle}</p>
                </div>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                    isOpen
                      ? `rotate-180 ${theme.chevronOpen}`
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700/60'
                  }`}
                  aria-hidden="true"
                >
                  <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                </span>
              </button>

              {/* Sub-item Labels / Action Cards */}
              {isOpen && (
                <div className="grid gap-2 border-t border-slate-100/90 bg-slate-50/60 p-3 sm:p-4 backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-950/50">
                  {card.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className={`group/item flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 text-left shadow-xs transition duration-200 hover:-translate-y-px hover:shadow-sm ${theme.itemHoverBorder} ${theme.itemHoverBg} dark:border-slate-800 dark:bg-slate-900`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-xs transition-transform duration-200 group-hover/item:scale-105 ${chipClasses[item.tone]}`}>
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1 text-sm font-black text-slate-800 dark:text-slate-100">{item.label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition duration-200 group-hover/item:translate-x-1 group-hover/item:text-slate-700 dark:text-slate-500 dark:group-hover/item:text-slate-200" />
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
