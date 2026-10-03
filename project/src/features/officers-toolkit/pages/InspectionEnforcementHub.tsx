import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Ban, Bug, ChevronDown, ClipboardCheck, FileText, FlaskConical, PackageX, Sprout } from 'lucide-react';
import { ToolkitPageHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { ShowCauseNoticeEntry } from '../components/ShowCauseNoticeEntry';
import { PesticideStopSaleEntry, type SavedPestStopSaleOrder } from '../components/PesticideStopSaleEntry';
import { PesticideStopSaleRevokeEntry } from '../components/PesticideStopSaleRevokeEntry';
import { FertilizerStopSaleEntry, type SavedFertStopSaleOrder } from '../components/FertilizerStopSaleEntry';
import { SeedStopSaleEntry, type SavedSeedStopSaleOrder } from '../components/SeedStopSaleEntry';
import { FertilizerStopSaleRevokeEntry } from '../components/FertilizerStopSaleRevokeEntry';
import { FertilizerSeizureOrderEntry } from '../components/FertilizerSeizureOrderEntry';
import { SeedSeizureOrderEntry } from '../components/SeedSeizureOrderEntry';
import { PesticideSeizureOrderEntry } from '../components/PesticideSeizureOrderEntry';
import { SeedStopSaleRevokeEntry } from '../components/SeedStopSaleRevokeEntry';
import type { NoticeCategory } from '../data/showCauseViolationData';

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
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

type HubCardKey = 'inspections' | 'notices' | 'stopSale' | 'seizure';

const cardThemes: Record<string, { bar: string; tile: string; openBorder: string; openShadow: string; chevronOpen: string }> = {
  teal: {
    bar: 'from-teal-400 to-emerald-500',
    tile: 'from-teal-500 to-emerald-600 shadow-teal-500/30',
    openBorder: 'border-teal-300 dark:border-teal-600',
    openShadow: 'shadow-teal-500/10',
    chevronOpen: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  },
  cyan: {
    bar: 'from-cyan-400 to-blue-500',
    tile: 'from-cyan-500 to-blue-600 shadow-cyan-500/30',
    openBorder: 'border-cyan-300 dark:border-cyan-600',
    openShadow: 'shadow-cyan-500/10',
    chevronOpen: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  },
  sky: {
    bar: 'from-sky-400 to-indigo-500',
    tile: 'from-sky-500 to-blue-600 shadow-sky-500/30',
    openBorder: 'border-sky-300 dark:border-sky-600',
    openShadow: 'shadow-sky-500/10',
    chevronOpen: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  },
  indigo: {
    bar: 'from-indigo-400 to-violet-500',
    tile: 'from-indigo-500 to-violet-600 shadow-indigo-500/30',
    openBorder: 'border-indigo-300 dark:border-indigo-600',
    openShadow: 'shadow-indigo-500/10',
    chevronOpen: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
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
    chips: { label: string; tone: string }[];
    items: { label: string; icon: typeof Sprout; tone: string; onClick: () => void }[];
  }[] = [
    {
      key: 'inspections',
      title: 'Inspections',
      subtitle: 'Dealer inspection checklists',
      icon: ClipboardCheck,
      theme: 'teal',
      chips: INSPECTION_TYPES.map((item) => ({ label: item.label, tone: item.tone })),
      items: INSPECTION_TYPES.map((item) => ({ label: `${item.label} Inspection`, icon: item.icon, tone: item.tone, onClick: () => navigate(item.path) })),
    },
    {
      key: 'notices',
      title: 'Memo & Show Cause Notice',
      subtitle: 'Notices and memos',
      icon: FileText,
      theme: 'cyan',
      chips: NOTICE_TYPES.map((item) => ({ label: item.label, tone: item.tone })),
      items: NOTICE_TYPES.map((item) => ({ label: `${item.label} Notice`, icon: item.icon, tone: item.tone, onClick: () => setSelectedNoticeCategory(item.category) })),
    },
    {
      key: 'stopSale',
      title: 'Stop Sale Order',
      subtitle: 'Stop sale orders & revocations',
      icon: Ban,
      theme: 'sky',
      chips: STOP_SALE_TYPES.map((item) => ({ label: item.label, tone: item.tone })),
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
      chips: SEIZURE_TYPES.map((item) => ({ label: item.label, tone: item.tone })),
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
    <div className="mx-auto w-full max-w-4xl p-2 sm:p-3">
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
              className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 dark:bg-slate-900 ${
                isOpen
                  ? `${theme.openBorder} shadow-xl ${theme.openShadow}`
                  : 'border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800'
              }`}
            >
              <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${theme.bar}`} />
              <button
                type="button"
                onClick={() => toggleCard(card.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 py-4 pl-6 pr-4 text-left"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:scale-105 dark:ring-slate-900 ${theme.tile}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-black leading-tight text-slate-900 dark:text-white">{card.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{card.items.length} tools</span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold leading-snug text-slate-500 dark:text-slate-400">{card.subtitle}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {card.chips.map((chip) => (
                      <span key={chip.label} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${chipClasses[chip.tone]}`}>
                        {chip.label}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? `rotate-180 ${theme.chevronOpen}` : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
              {isOpen && (
                <div className="grid gap-2 border-t border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  {card.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className="group/item flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all hover:-translate-y-px hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chipClasses[item.tone]}`}>
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1 text-sm font-black text-slate-800 dark:text-slate-100">{item.label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition-all group-hover/item:translate-x-0.5 group-hover/item:text-slate-500 dark:text-slate-600" />
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
          <section className="flex h-full max-h-none w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
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
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <ShowCauseNoticeEntry lockedCategory={selectedNoticeCategory} />
            </div>
          </section>
        </div>
      )}

      {showPesticideStopSale && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
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
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 hover:border-red-700"
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
            </div>
          </section>
        </div>
      )}

      {showFertilizerStopSale && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
            <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 sm:px-6 ${noticeModalThemes.fertiliser.header}`}>
              <div className="relative flex min-w-0 flex-1 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${noticeModalThemes.fertiliser.icon}`}>
                  <Ban className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.fertiliser.eyebrow}`}>
                    {fertStopSaleTab === 'issue' ? 'Stop Sale Notice — Annexure-A' : 'Revoke of Stop Sale Notice — Clause 28'}
                  </p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    {fertStopSaleTab === 'issue' ? 'Fertilizer Stop Sale Notice Entry' : 'Fertilizer Stop Sale Revoke Entry'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFertilizerStopSale(false)}
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 hover:border-red-700"
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
            </div>
          </section>
        </div>
      )}

      {showSeedStopSale && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
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
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 hover:border-red-700"
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
            </div>
          </section>
        </div>
      )}

      {showFertilizerSeizure && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
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
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <FertilizerSeizureOrderEntry />
            </div>
          </section>
        </div>
      )}

      {showSeedSeizure && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
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
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <SeedSeizureOrderEntry />
            </div>
          </section>
        </div>
      )}

      {showPesticideSeizure && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
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
                className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:bg-red-700 hover:border-red-700"
              >
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
              <PesticideSeizureOrderEntry />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
