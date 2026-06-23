import React from 'react';
import { Bug, Calculator, FlaskConical, PackageCheck, Sprout, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const calculatorItems = [
  {
    title: 'Acreage Calculator',
    description: 'Calculate acreage from field entries and convert to hectares.',
    path: '/officer-toolkit/acreage-calculator',
    icon: Calculator,
    accent: 'from-sky-500 to-blue-600',
    panel: 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30',
  },
  {
    title: 'Plant Population Calculator',
    description: 'Calculate plant population from spacing.',
    path: '/officer-toolkit/plant-population-calculator',
    icon: Sprout,
    accent: 'from-green-600 to-teal-700',
    panel: 'from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30',
  },
  {
    title: 'Seed Rate Calculator',
    description: 'Calculate seed requirement using test weight, germination and population.',
    path: '/officer-toolkit/seed-rate-calculator',
    icon: Wheat,
    accent: 'from-lime-600 to-emerald-700',
    panel: 'from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/30',
  },
  {
    title: 'Fertilizer Calculator',
    description: 'Calculate fertilizer quantity based on nutrient requirement.',
    path: '/officer-toolkit/fertilizer-calculator',
    icon: PackageCheck,
    accent: 'from-emerald-600 to-green-700',
    panel: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
  },
  {
    title: 'Pesticide Calculator',
    description: 'Calculate pesticide quantity from active ingredient or dose per litre.',
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
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 shadow-sm ring-1 ring-white/20">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-100">
              {t('Officer Toolkit', 'అధికారుల టూల్‌కిట్')}
            </p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
            </h1>
            <p className="mt-1 text-sm font-semibold text-emerald-50">
              {t('Crop, Seed, Fertilizer and Pesticide Calculations', 'పంట, విత్తనం, ఎరువు మరియు పురుగుమందు లెక్కలు')}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                <h2 className="text-base font-black text-slate-950 dark:text-white">{t(item.title, item.title)}</h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{t(item.description, item.description)}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}