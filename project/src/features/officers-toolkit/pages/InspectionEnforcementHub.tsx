import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, Bug, ClipboardCheck, FileText, FlaskConical, PackageX, Sprout } from 'lucide-react';
import { ToolkitPageHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { ShowCauseNoticeEntry } from '../components/ShowCauseNoticeEntry';
import { PesticideStopSaleEntry } from '../components/PesticideStopSaleEntry';
import { FertilizerStopSaleEntry } from '../components/FertilizerStopSaleEntry';
import { SeedStopSaleEntry } from '../components/SeedStopSaleEntry';
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

const toneClasses: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/70',
  sky: 'border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:border-sky-600 dark:hover:bg-sky-950/70',
  rose: 'border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:border-rose-600 dark:hover:bg-rose-950/70',
  amber: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:border-amber-600 dark:hover:bg-amber-950/70',
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
  const [openCard, setOpenCard] = useState<'inspections' | 'notices' | 'stopSale' | 'seizure' | null>(null);
  const [selectedNoticeCategory, setSelectedNoticeCategory] = useState<NoticeCategory | null>(null);
  const [showPesticideStopSale, setShowPesticideStopSale] = useState(false);
  const [showFertilizerStopSale, setShowFertilizerStopSale] = useState(false);
  const [showSeedStopSale, setShowSeedStopSale] = useState(false);

  const toggleCard = (card: 'inspections' | 'notices' | 'stopSale' | 'seizure') =>
    setOpenCard((current) => (current === card ? null : card));

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

      <div className="grid items-start gap-3 sm:grid-cols-2">
        <div
          className={`overflow-hidden rounded-xl border shadow-sm transition ${
            openCard === 'inspections'
              ? 'border-teal-400 bg-white dark:border-teal-600 dark:bg-slate-900'
              : 'border-teal-200 bg-white hover:border-teal-300 hover:bg-teal-50 dark:border-teal-800 dark:bg-slate-900 dark:hover:border-teal-600 dark:hover:bg-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleCard('inspections')}
            className={`block min-h-[76px] w-full p-4 text-left transition ${
              openCard === 'inspections' ? 'bg-teal-500 text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${openCard === 'inspections' ? 'bg-white/20' : 'bg-teal-100 dark:bg-teal-900/40'}`}>
                  <ClipboardCheck className={`h-5 w-5 ${openCard === 'inspections' ? 'text-white' : 'text-teal-700 dark:text-teal-300'}`} />
                </div>
                <div>
                  <p className="text-base font-black">Inspections</p>
                  <p className={`text-xs font-semibold leading-snug ${openCard === 'inspections' ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    Seed • Fertilizer • Pesticide dealer inspection
                  </p>
                </div>
              </div>
              {openCard === 'inspections' && <span className="text-teal-200">✓</span>}
            </div>
          </button>
          {openCard === 'inspections' && (
            <div className="grid gap-2 border-t border-teal-200/70 bg-teal-50/50 p-3 dark:border-teal-800/50 dark:bg-slate-950/40">
              {INSPECTION_TYPES.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left shadow-sm transition ${toneClasses[item.tone]}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-black">{item.label} Inspection</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={`overflow-hidden rounded-xl border shadow-sm transition ${
            openCard === 'notices'
              ? 'border-cyan-400 bg-white dark:border-cyan-500 dark:bg-slate-900'
              : 'border-cyan-200 bg-white hover:border-cyan-300 hover:bg-cyan-50 dark:border-cyan-800 dark:bg-slate-900 dark:hover:border-cyan-600 dark:hover:bg-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleCard('notices')}
            className={`block min-h-[76px] w-full p-4 text-left transition ${
              openCard === 'notices' ? 'bg-cyan-500 text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${openCard === 'notices' ? 'bg-white/20' : 'bg-cyan-100 dark:bg-cyan-900/40'}`}>
                  <FileText className={`h-5 w-5 ${openCard === 'notices' ? 'text-white' : 'text-cyan-700 dark:text-cyan-300'}`} />
                </div>
                <div>
                  <p className="text-base font-black">Notices / Memos</p>
                  <p className={`text-xs font-semibold leading-snug ${openCard === 'notices' ? 'text-cyan-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    Seed • Fertilizer • Pesticide notices and memos
                  </p>
                </div>
              </div>
              {openCard === 'notices' && <span className="text-cyan-200">✓</span>}
            </div>
          </button>
          {openCard === 'notices' && (
            <div className="grid gap-2 border-t border-cyan-200/70 bg-cyan-50/50 p-3 dark:border-cyan-800/50 dark:bg-slate-950/40">
              {NOTICE_TYPES.map((item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => setSelectedNoticeCategory(item.category)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left shadow-sm transition ${toneClasses[item.tone]}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-black">{item.label} Notice</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={`overflow-hidden rounded-xl border shadow-sm transition ${
            openCard === 'stopSale'
              ? 'border-sky-400 bg-white dark:border-sky-500 dark:bg-slate-900'
              : 'border-sky-200 bg-white hover:border-sky-300 hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:hover:border-sky-600 dark:hover:bg-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleCard('stopSale')}
            className={`block min-h-[76px] w-full p-4 text-left transition ${
              openCard === 'stopSale' ? 'bg-sky-500 text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${openCard === 'stopSale' ? 'bg-white/20' : 'bg-sky-100 dark:bg-sky-900/40'}`}>
                  <Ban className={`h-5 w-5 ${openCard === 'stopSale' ? 'text-white' : 'text-sky-700 dark:text-sky-300'}`} />
                </div>
                <div>
                  <p className="text-base font-black">Stop Sale</p>
                  <p className={`text-xs font-semibold leading-snug ${openCard === 'stopSale' ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    Seed • Fertilizer • Pesticide stop sale orders
                  </p>
                </div>
              </div>
              {openCard === 'stopSale' && <span className="text-sky-200">✓</span>}
            </div>
          </button>
          {openCard === 'stopSale' && (
            <div className="grid gap-2 border-t border-sky-200/70 bg-sky-50/50 p-3 dark:border-sky-800/50 dark:bg-slate-950/40">
              {STOP_SALE_TYPES.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.label === 'Pesticide') setShowPesticideStopSale(true);
                    if (item.label === 'Fertilizer') setShowFertilizerStopSale(true);
                    if (item.label === 'Seed') setShowSeedStopSale(true);
                  }}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left shadow-sm transition ${toneClasses[item.tone]}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-black">{item.label} Stop Sale</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={`overflow-hidden rounded-xl border shadow-sm transition ${
            openCard === 'seizure'
              ? 'border-indigo-400 bg-white dark:border-indigo-500 dark:bg-slate-900'
              : 'border-indigo-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:hover:border-indigo-600 dark:hover:bg-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleCard('seizure')}
            className={`block min-h-[76px] w-full p-4 text-left transition ${
              openCard === 'seizure' ? 'bg-indigo-500 text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${openCard === 'seizure' ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/40'}`}>
                  <PackageX className={`h-5 w-5 ${openCard === 'seizure' ? 'text-white' : 'text-indigo-700 dark:text-indigo-300'}`} />
                </div>
                <div>
                  <p className="text-base font-black">Seizure</p>
                  <p className={`text-xs font-semibold leading-snug ${openCard === 'seizure' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    Seed • Fertilizer • Pesticide seizure memos
                  </p>
                </div>
              </div>
              {openCard === 'seizure' && <span className="text-indigo-200">✓</span>}
            </div>
          </button>
          {openCard === 'seizure' && (
            <div className="grid gap-2 border-t border-indigo-200/70 bg-indigo-50/50 p-3 dark:border-indigo-800/50 dark:bg-slate-950/40">
              {SEIZURE_TYPES.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left shadow-sm transition ${toneClasses[item.tone]}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-black">{item.label} Seizure</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.pesticide.eyebrow}`}>Stop Sale Order — Form V(A)</p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    Pesticide Stop Sale Order Entry
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
              <PesticideStopSaleEntry />
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
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.fertiliser.eyebrow}`}>Stop Sale Notice — Annexure-A</p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    Fertilizer Stop Sale Notice Entry
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
              <FertilizerStopSaleEntry />
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
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes.seed.eyebrow}`}>Stop Sale Order — Form III</p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                    Seed Stop Sale Order Entry
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
              <SeedStopSaleEntry />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
