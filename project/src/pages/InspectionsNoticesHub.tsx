import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, ClipboardCheck, FileText, FlaskConical, Sprout } from 'lucide-react';
import { ShowCauseNoticeEntry } from '../components/ShowCauseNoticeEntry';
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

const toneClasses: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100',
  sky: 'border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400 hover:bg-sky-100',
  rose: 'border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400 hover:bg-rose-100',
  amber: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100',
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

export function InspectionsNoticesHub() {
  const navigate = useNavigate();
  const [showInspectionTypes, setShowInspectionTypes] = useState(false);
  const [showNoticeTypes, setShowNoticeTypes] = useState(false);
  const [selectedNoticeCategory, setSelectedNoticeCategory] = useState<NoticeCategory | null>(null);

  return (
    <div className="mx-auto w-full max-w-4xl p-2 sm:p-3">
      <div className="mb-4 rounded-2xl border border-lime-200/60 bg-gradient-to-r from-lime-50 to-green-50 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-lime-600 shadow-sm ring-1 ring-white/20">
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-lime-800">Officer Toolkit</p>
              <h1 className="text-lg font-black text-lime-950 sm:text-xl">Inspections &amp; Notices</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const idx = (window.history.state as { idx?: number } | null)?.idx;
              if (typeof idx === 'number' && idx > 0) navigate(-1);
              else navigate('/officer-toolkit');
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-lime-300 bg-white/70 px-2 py-1.5 text-xs font-black text-lime-800 shadow-sm transition hover:bg-white hover:border-lime-500"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
        </div>
      </div>

      <div className="grid items-start gap-3 sm:grid-cols-2">
        <div
          className={`overflow-hidden rounded-xl border shadow-sm transition ${
            showInspectionTypes
              ? 'border-lime-500 bg-white'
              : 'border-lime-200 bg-white hover:border-lime-400 hover:bg-lime-50'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setShowInspectionTypes((current) => !current);
              setShowNoticeTypes(false);
            }}
            className={`block w-full p-3 text-left transition ${
              showInspectionTypes ? 'bg-lime-600 text-white' : 'text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${showInspectionTypes ? 'bg-white/20' : 'bg-lime-100'}`}>
                  <ClipboardCheck className={`h-4 w-4 ${showInspectionTypes ? 'text-white' : 'text-lime-700'}`} />
                </div>
                <div>
                  <p className="text-sm font-black">Inspections</p>
                  <p className={`text-[11px] font-semibold leading-tight ${showInspectionTypes ? 'text-lime-100' : 'text-slate-500'}`}>
                    Seed • Fertilizer • Pesticide dealer inspection
                  </p>
                </div>
              </div>
              {showInspectionTypes && <span className="text-lime-200">✓</span>}
            </div>
          </button>
          {showInspectionTypes && (
            <div className="grid gap-2 border-t border-lime-200/70 bg-lime-50/50 p-3">
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
            showNoticeTypes
              ? 'border-purple-500 bg-white'
              : 'border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setShowNoticeTypes((current) => !current);
              setShowInspectionTypes(false);
            }}
            className={`block w-full p-3 text-left transition ${
              showNoticeTypes ? 'bg-purple-600 text-white' : 'text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${showNoticeTypes ? 'bg-white/20' : 'bg-purple-100'}`}>
                  <FileText className={`h-4 w-4 ${showNoticeTypes ? 'text-white' : 'text-purple-700'}`} />
                </div>
                <div>
                  <p className="text-sm font-black">Notices / Memos</p>
                  <p className={`text-[11px] font-semibold leading-tight ${showNoticeTypes ? 'text-purple-100' : 'text-slate-500'}`}>
                    Seed • Fertilizer • Pesticide notices and memos
                  </p>
                </div>
              </div>
              {showNoticeTypes && <span className="text-purple-200">✓</span>}
            </div>
          </button>
          {showNoticeTypes && (
            <div className="grid gap-2 border-t border-purple-200/70 bg-purple-50/50 p-3">
              {NOTICE_TYPES.map((item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => setSelectedNoticeCategory(item.category)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left shadow-sm transition ${toneClasses[item.tone]}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-black">{item.label} Notices / Memos</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedNoticeCategory && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <section className="flex h-full max-h-none w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[94vh] sm:rounded-2xl">
            <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-4 sm:px-6 ${noticeModalThemes[selectedNoticeCategory].header}`}>
              <div className="relative flex min-w-0 flex-1 items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${noticeModalThemes[selectedNoticeCategory].icon}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${noticeModalThemes[selectedNoticeCategory].eyebrow}`}>Notices &amp; memos</p>
                  <h2 className="max-w-full whitespace-normal text-base font-black leading-tight text-slate-900 sm:text-lg">
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
    </div>
  );
}
