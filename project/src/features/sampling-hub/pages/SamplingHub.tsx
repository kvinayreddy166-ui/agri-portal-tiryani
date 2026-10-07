import React, { lazy, Suspense, useState } from 'react';
import { Bug, FileText, FlaskConical, Loader2, Sprout } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { useBackButtonOverlay } from '../../../shared/hooks/useBackButtonOverlay';

const FertilizerStatutoryPdfTool = lazy(() =>
  import('../components/FertilizerStatutoryPdfTool').then((module) => ({ default: module.FertilizerStatutoryPdfTool }))
);
const PesticideStatutoryPdfTool = lazy(() =>
  import('../components/PesticideStatutoryPdfTool').then((module) => ({ default: module.PesticideStatutoryPdfTool }))
);
const SeedForms = lazy(() =>
  import('./SeedForms').then((module) => ({ default: module.SeedForms }))
);

const SAMPLE_CATEGORIES = [
  {
    id: 'fertilizers',
    label: 'Fertilizer',
    telugu: 'ఎరువులు',
    forms: 'Form O, covering letter & sample memo',
    icon: FlaskConical,
    tile: 'bg-sky-50 text-sky-600 ring-1 ring-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/50',
  },
  {
    id: 'seed',
    label: 'Seed',
    telugu: 'విత్తనాలు',
    forms: 'Form II, Form V, Form VI & Form VIII',
    icon: Sprout,
    tile: 'bg-lime-50 text-lime-600 ring-1 ring-lime-200/70 dark:bg-lime-950/40 dark:text-lime-300 dark:ring-lime-800/50',
  },
  {
    id: 'pesticides',
    label: 'Pesticide',
    telugu: 'పురుగుమందులు',
    forms: 'Insecticide sample forms & covering letter',
    icon: Bug,
    tile: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50',
  },
];

export function SamplingHub() {
  const { t } = useLanguage();
  const [category, setCategory] = useState('fertilizers');
  const [toolOpen, setToolOpen] = useState(false);
  const toolOverlay = useBackButtonOverlay('sampling-hub-tool', () => setToolOpen(false));

  const openTool = () => {
    toolOverlay.pushOverlay();
    setToolOpen(true);
  };

  const closeTool = () => {
    toolOverlay.releaseOverlay();
    setToolOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
          {t('Smart Sampling', 'స్మార్ట్ సాంప్లింగ్')}
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          {t(
            'Create sample drawal details and generate the required statutory forms.',
            'నమూనా వివరాలను సృష్టించండి మరియు అవసరమైన చట్టబద్ధ ఫారాలను సృష్టించండి.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {SAMPLE_CATEGORIES.map((item) => {
          const Icon = item.icon;
          const selected = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`relative overflow-hidden rounded-xl border px-3 py-2.5 text-left transition duration-200 ${
                selected
                  ? 'border-emerald-700 bg-gradient-to-br from-emerald-800 to-emerald-900 text-white shadow-md shadow-emerald-950/20'
                  : 'border-slate-200/90 bg-white text-slate-800 shadow-sm hover:border-emerald-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
              }`}
            >
              {selected && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400" />
              )}
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-white/15 text-white' : item.tile}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="min-w-0 flex-1 truncate text-sm font-black font-[var(--font-heading)]">{t(item.label, item.telugu)}</h2>
                {selected && <span className="shrink-0 text-xs font-black text-gold-300">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-white font-[var(--font-heading)]">
          {t('New Sample Drawal', 'కొత్త నమూనా డ్రాయింగ్')}
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
          {t(
            'Fill the sample details once — the required forms are generated in departmental format, ready for PDF and Word.',
            'నమూనా వివరాలను ఒకసారి నింపండి — అవసరమైన ఫారాలు శాఖా ఫార్మాట్‌లో సిద్ధమవుతాయి.'
          )}
        </p>
        <button
          type="button"
          onClick={openTool}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 px-4 py-3 text-sm font-black text-white shadow-md shadow-emerald-950/20 transition hover:from-emerald-900 hover:to-emerald-800 hover:shadow-lg sm:w-auto"
        >
          <FileText className="h-5 w-5" />
          {t('Start New Sample Drawal', 'కొత్త నమూనా డ్రాయింగ్‌ను ప్రారంభించండి')}
        </button>
      </section>

      {toolOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          {category === 'seed' ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
              <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <header className="relative flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-green-100/50 bg-gradient-to-r from-green-50 via-white to-emerald-50 px-4 py-4 backdrop-blur-sm dark:border-green-900/50 dark:from-green-950 dark:to-emerald-950 sm:px-6 sm:py-5">
                  <div className="relative flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-50 text-lime-600 ring-1 ring-lime-200/70 dark:bg-lime-950/40 dark:text-lime-300 dark:ring-lime-800/50">
                      <Sprout className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-600/80 dark:text-green-300/80">Seed sampling</p>
                      <h2 className="max-w-full whitespace-normal text-base leading-tight text-slate-900 dark:text-white sm:text-lg">Generate FORM II / FORM V / FORM VI / FORM VIII</h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeTool}
                    className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:border-red-700 hover:bg-red-700"
                    aria-label="Close seed PDF generator"
                  >
                    Close
                  </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
                  <SeedForms />
                </div>
              </section>
            </div>
          ) : category === 'pesticides' ? (
            <PesticideStatutoryPdfTool onClose={closeTool} />
          ) : (
            <FertilizerStatutoryPdfTool onClose={closeTool} />
          )}
        </Suspense>
      )}
    </div>
  );
}
