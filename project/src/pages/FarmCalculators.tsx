import React from 'react';
import { ArrowLeft, Bug, FlaskConical, PackageCheck, Ruler, Sprout, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const calculatorItems = [
  {
    title: 'Acreage Calculator',
    titleTe: '?????????? ?????????????',
    description: 'Calculate acreage from survey measurements.',
    descriptionTe: '????? ????? ??????? ?????????????? ???????????.',
    path: '/officer-toolkit/acreage-calculator',
    icon: Ruler,
    accent: 'from-sky-600 to-cyan-700',
    panel: 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30',
  },
  {
    title: 'Plant Population Calculator',
    titleTe: 'à°®à±Šà°•à±à°•à°² à°œà°¨à°¾à°­à°¾ à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    description: 'Calculate plant population from spacing.',
    descriptionTe: 'à°µà°°à±à°¸ à°®à°°à°¿à°¯à± à°®à±Šà°•à±à°•à°² à°®à°§à±à°¯ à°¦à±‚à°°à°‚à°¤à±‹ à°®à±Šà°•à±à°•à°² à°¸à°‚à°–à±à°¯à°¨à± à°²à±†à°•à±à°•à°¿à°‚à°šà°‚à°¡à°¿.',
    path: '/officer-toolkit/plant-population-calculator',
    icon: Sprout,
    accent: 'from-green-600 to-teal-700',
    panel: 'from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30',
  },
  {
    title: 'Seed Rate Calculator',
    titleTe: 'à°µà°¿à°¤à±à°¤à°¨ à°®à±‹à°¤à°¾à°¦à± à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    description: 'Calculate seed requirement using test weight, germination and population.',
    descriptionTe: 'à°Ÿà±†à°¸à±à°Ÿà± à°µà±†à°¯à°¿à°Ÿà±, à°®à±Šà°²à°• à°¶à°¾à°¤à°‚ à°®à°°à°¿à°¯à± à°®à±Šà°•à±à°•à°² à°¸à°‚à°–à±à°¯à°¤à±‹ à°µà°¿à°¤à±à°¤à°¨ à°…à°µà°¸à°°à°¾à°¨à±à°¨à°¿ à°²à±†à°•à±à°•à°¿à°‚à°šà°‚à°¡à°¿.',
    path: '/officer-toolkit/seed-rate-calculator',
    icon: Wheat,
    accent: 'from-lime-600 to-emerald-700',
    panel: 'from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/30',
  },
  {
    title: 'Fertilizer Calculator',
    titleTe: 'à°Žà°°à±à°µà±à°² à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    description: 'Calculate fertilizer quantity based on nutrient requirement.',
    descriptionTe: 'à°ªà±‹à°·à°• à°…à°µà°¸à°°à°¾à°² à°†à°§à°¾à°°à°‚à°—à°¾ à°Žà°°à±à°µà± à°ªà°°à°¿à°®à°¾à°£à°¾à°¨à±à°¨à°¿ à°²à±†à°•à±à°•à°¿à°‚à°šà°‚à°¡à°¿.',
    path: '/officer-toolkit/fertilizer-calculator',
    icon: PackageCheck,
    accent: 'from-emerald-600 to-green-700',
    panel: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
  },
  {
    title: 'Pesticide Calculator',
    titleTe: 'à°ªà±à°°à±à°—à±à°®à°‚à°¦à± à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    description: 'Calculate pesticide quantity from active ingredient or dose per litre.',
    descriptionTe: 'à°•à±à°°à°¿à°¯à°¾à°¶à±€à°² à°ªà°¦à°¾à°°à±à°¥à°‚ à°²à±‡à°¦à°¾ à°²à±€à°Ÿà°°à±à°•à± à°®à±‹à°¤à°¾à°¦à±à°¤à±‹ à°ªà±à°°à±à°—à±à°®à°‚à°¦à± à°ªà°°à°¿à°®à°¾à°£à°¾à°¨à±à°¨à°¿ à°²à±†à°•à±à°•à°¿à°‚à°šà°‚à°¡à°¿.',
    path: '/officer-toolkit/pesticide-calculator',
    icon: Bug,
    accent: 'from-red-500 to-amber-600',
    panel: 'from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30',
  },
];

export function FarmCalculators() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 p-4 text-white shadow-sm dark:border-emerald-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 shadow-sm ring-1 ring-white/20">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-100">
                {t('Officer Toolkit', 'à°…à°§à°¿à°•à°¾à°°à±à°² à°Ÿà±‚à°²à±â€Œà°•à°¿à°Ÿà±')}
              </p>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                {t('Farm Calculators', 'à°µà±à°¯à°µà°¸à°¾à°¯ à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±à°²à±')}
              </h1>
              <p className="mt-1 text-sm font-semibold text-emerald-50">
                {t('Crop, Seed, Fertilizer and Pesticide Calculations', 'à°ªà°‚à°Ÿ, à°µà°¿à°¤à±à°¤à°¨à°‚, à°Žà°°à±à°µà± à°®à°°à°¿à°¯à± à°ªà±à°°à±à°—à±à°®à°‚à°¦à± à°²à±†à°•à±à°•à°²à±')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/officer-toolkit')}
            className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3 text-xs font-black text-white transition hover:bg-white/25 focus:outline-none focus:ring-4 focus:ring-white/25"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back', 'à°µà±†à°¨à°•à±à°•à°¿')}
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {calculatorItems.map((item) => (
          <article
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`cursor-pointer rounded-lg border border-emerald-200/70 bg-gradient-to-br ${item.panel} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-emerald-900/60`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.accent} text-white shadow-sm`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black text-slate-950 dark:text-white">{t(item.title, item.titleTe)}</h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{t(item.description, item.descriptionTe)}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
