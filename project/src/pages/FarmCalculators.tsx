import React from 'react';
import { Bug, FlaskConical, PackageCheck, Ruler, Sprout, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { BackButton } from '../components/ui/BackButton';

const calculatorItems = [
  {
    title: 'Acreage Calculator',
    titleTe: '?????????? ?????????????',
    description: 'Add acre.gunta values and get total acres.',
    descriptionTe: '????? ????? ??????? ?????????????? ???????????.',
    path: '/officer-toolkit/acreage-calculator',
    icon: Ruler,
    accent: 'from-sky-600 to-cyan-700',
    panel: 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30',
  },
  {
    title: 'Plant Population Calculator',
    titleTe: 'à°®à±Šà°•à±à°•à°² à°œà°¨à°¾à°­à°¾ à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    description: 'Enter spacing and get plants per field.',
    descriptionTe: 'à°µà°°à±à°¸ à°®à°°à°¿à°¯à± à°®à±Šà°•à±à°•à°² à°®à°§à±à°¯ à°¦à±‚à°°à°‚à°¤à±‹ à°®à±Šà°•à±à°•à°² à°¸à°‚à°–à±à°¯à°¨à± à°²à±†à°•à±à°•à°¿à°‚à°šà°‚à°¡à°¿.',
    path: '/officer-toolkit/plant-population-calculator',
    icon: Sprout,
    accent: 'from-green-600 to-teal-700',
    panel: 'from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30',
  },
  {
    title: 'Seed Rate Calculator',
    titleTe: 'à°µà°¿à°¤à±à°¤à°¨ à°®à±‹à°¤à°¾à°¦à± à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    description: 'Enter population and seed label details.',
    descriptionTe: 'à°Ÿà±†à°¸à±à°Ÿà± à°µà±†à°¯à°¿à°Ÿà±, à°®à±Šà°²à°• à°¶à°¾à°¤à°‚ à°®à°°à°¿à°¯à± à°®à±Šà°•à±à°•à°² à°¸à°‚à°–à±à°¯à°¤à±‹ à°µà°¿à°¤à±à°¤à°¨ à°…à°µà°¸à°°à°¾à°¨à±à°¨à°¿ à°²à±†à°•à±à°•à°¿à°‚à°šà°‚à°¡à°¿.',
    path: '/officer-toolkit/seed-rate-calculator',
    icon: Wheat,
    accent: 'from-lime-600 to-emerald-700',
    panel: 'from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/30',
  },
  {
    title: 'Fertilizer Calculator',
    titleTe: 'à°Žà°°à±à°µà±à°² à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    description: 'Use crop recommendation or manual nutrients.',
    descriptionTe: 'à°ªà±‹à°·à°• à°…à°µà°¸à°°à°¾à°² à°†à°§à°¾à°°à°‚à°—à°¾ à°Žà°°à±à°µà± à°ªà°°à°¿à°®à°¾à°£à°¾à°¨à±à°¨à°¿ à°²à±†à°•à±à°•à°¿à°‚à°šà°‚à°¡à°¿.',
    path: '/officer-toolkit/fertilizer-calculator',
    icon: PackageCheck,
    accent: 'from-emerald-600 to-green-700',
    panel: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
  },
  {
    title: 'Pesticide Calculator',
    titleTe: 'à°ªà±à°°à±à°—à±à°®à°‚à°¦à± à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    description: 'Enter dose, tank and area for spray quantity.',
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
          <BackButton onClick={() => navigate('/officer-toolkit')} tone="solid">
            Back
          </BackButton>
        </div>
      </section>

      <section className="rounded-xl border border-lime-200 bg-gradient-to-br from-lime-100 via-emerald-50 to-cyan-100 p-4 shadow-md dark:border-emerald-900/60 dark:from-emerald-950/50 dark:via-slate-900 dark:to-cyan-950/40">
        <div className="grid gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:grid-cols-3">
          <p><span className="font-black text-emerald-700 dark:text-emerald-300">Acreage:</span> add acre.gunta values.</p>
          <p><span className="font-black text-emerald-700 dark:text-emerald-300">Seed/Plant:</span> enter area and spacing or population.</p>
          <p><span className="font-black text-emerald-700 dark:text-emerald-300">Fertilizer/Pesticide:</span> enter area, dose and share result.</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {calculatorItems.map((item) => (
          <article
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`min-h-[164px] cursor-pointer rounded-xl border border-white/70 bg-gradient-to-br ${item.panel} p-5 text-center shadow-md transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl dark:border-emerald-900/60`}
          >
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.accent} text-white shadow-lg`}>
                <item.icon className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[17px] font-black leading-snug text-slate-950 dark:text-white">{t(item.title, item.titleTe)}</h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-300">{t(item.description, item.descriptionTe)}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
