import React from 'react';
import { Bug, FlaskConical, PackageCheck, Ruler, Sprout, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { BackButton } from '../components/ui/BackButton';

const calculatorItems = [
  {
    title: 'Area Calculator',
    titleTe: '?????????? ?????????????',
    description: 'Convert acres, hectares, cents and guntas.',
    descriptionTe: '????? ????? ??????? ?????????????? ???????????.',
    path: '/officer-toolkit/acreage-calculator',
    icon: Ruler,
    accent: 'from-sky-600 to-cyan-700',
    panel: 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30',
  },
  {
    title: 'Plant Population Calculator',
    titleTe: 'Ã Â°Â®Ã Â±Å Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â² Ã Â°Å“Ã Â°Â¨Ã Â°Â¾Ã Â°Â­Ã Â°Â¾ Ã Â°â€¢Ã Â°Â¾Ã Â°Â²Ã Â°Â¿Ã Â°â€¢Ã Â±ÂÃ Â°Â¯Ã Â±ÂÃ Â°Â²Ã Â±â€¡Ã Â°Å¸Ã Â°Â°Ã Â±Â',
    description: 'Enter spacing and get plants per field.',
    descriptionTe: 'Ã Â°ÂµÃ Â°Â°Ã Â±ÂÃ Â°Â¸ Ã Â°Â®Ã Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â±Â Ã Â°Â®Ã Â±Å Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â² Ã Â°Â®Ã Â°Â§Ã Â±ÂÃ Â°Â¯ Ã Â°Â¦Ã Â±â€šÃ Â°Â°Ã Â°â€šÃ Â°Â¤Ã Â±â€¹ Ã Â°Â®Ã Â±Å Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â² Ã Â°Â¸Ã Â°â€šÃ Â°â€“Ã Â±ÂÃ Â°Â¯Ã Â°Â¨Ã Â±Â Ã Â°Â²Ã Â±â€ Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â¿Ã Â°â€šÃ Â°Å¡Ã Â°â€šÃ Â°Â¡Ã Â°Â¿.',
    path: '/officer-toolkit/plant-population-calculator',
    icon: Sprout,
    accent: 'from-green-600 to-teal-700',
    panel: 'from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30',
  },
  {
    title: 'Seed Rate Calculator',
    titleTe: 'Ã Â°ÂµÃ Â°Â¿Ã Â°Â¤Ã Â±ÂÃ Â°Â¤Ã Â°Â¨ Ã Â°Â®Ã Â±â€¹Ã Â°Â¤Ã Â°Â¾Ã Â°Â¦Ã Â±Â Ã Â°â€¢Ã Â°Â¾Ã Â°Â²Ã Â°Â¿Ã Â°â€¢Ã Â±ÂÃ Â°Â¯Ã Â±ÂÃ Â°Â²Ã Â±â€¡Ã Â°Å¸Ã Â°Â°Ã Â±Â',
    description: 'Enter population and seed label details.',
    descriptionTe: 'Ã Â°Å¸Ã Â±â€ Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â±Â Ã Â°ÂµÃ Â±â€ Ã Â°Â¯Ã Â°Â¿Ã Â°Å¸Ã Â±Â, Ã Â°Â®Ã Â±Å Ã Â°Â²Ã Â°â€¢ Ã Â°Â¶Ã Â°Â¾Ã Â°Â¤Ã Â°â€š Ã Â°Â®Ã Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â±Â Ã Â°Â®Ã Â±Å Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â² Ã Â°Â¸Ã Â°â€šÃ Â°â€“Ã Â±ÂÃ Â°Â¯Ã Â°Â¤Ã Â±â€¹ Ã Â°ÂµÃ Â°Â¿Ã Â°Â¤Ã Â±ÂÃ Â°Â¤Ã Â°Â¨ Ã Â°â€¦Ã Â°ÂµÃ Â°Â¸Ã Â°Â°Ã Â°Â¾Ã Â°Â¨Ã Â±ÂÃ Â°Â¨Ã Â°Â¿ Ã Â°Â²Ã Â±â€ Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â¿Ã Â°â€šÃ Â°Å¡Ã Â°â€šÃ Â°Â¡Ã Â°Â¿.',
    path: '/officer-toolkit/seed-rate-calculator',
    icon: Wheat,
    accent: 'from-lime-600 to-emerald-700',
    panel: 'from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/30',
  },
  {
    title: 'Fertilizer Calculator',
    titleTe: 'Ã Â°Å½Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±ÂÃ Â°Â² Ã Â°â€¢Ã Â°Â¾Ã Â°Â²Ã Â°Â¿Ã Â°â€¢Ã Â±ÂÃ Â°Â¯Ã Â±ÂÃ Â°Â²Ã Â±â€¡Ã Â°Å¸Ã Â°Â°Ã Â±Â',
    description: 'Use crop recommendation or manual nutrients.',
    descriptionTe: 'Ã Â°ÂªÃ Â±â€¹Ã Â°Â·Ã Â°â€¢ Ã Â°â€¦Ã Â°ÂµÃ Â°Â¸Ã Â°Â°Ã Â°Â¾Ã Â°Â² Ã Â°â€ Ã Â°Â§Ã Â°Â¾Ã Â°Â°Ã Â°â€šÃ Â°â€”Ã Â°Â¾ Ã Â°Å½Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±Â Ã Â°ÂªÃ Â°Â°Ã Â°Â¿Ã Â°Â®Ã Â°Â¾Ã Â°Â£Ã Â°Â¾Ã Â°Â¨Ã Â±ÂÃ Â°Â¨Ã Â°Â¿ Ã Â°Â²Ã Â±â€ Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â¿Ã Â°â€šÃ Â°Å¡Ã Â°â€šÃ Â°Â¡Ã Â°Â¿.',
    path: '/officer-toolkit/fertilizer-calculator',
    icon: PackageCheck,
    accent: 'from-emerald-600 to-green-700',
    panel: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
  },
  {
    title: 'Pesticide Calculator',
    titleTe: 'Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â±ÂÃ Â°â€”Ã Â±ÂÃ Â°Â®Ã Â°â€šÃ Â°Â¦Ã Â±Â Ã Â°â€¢Ã Â°Â¾Ã Â°Â²Ã Â°Â¿Ã Â°â€¢Ã Â±ÂÃ Â°Â¯Ã Â±ÂÃ Â°Â²Ã Â±â€¡Ã Â°Å¸Ã Â°Â°Ã Â±Â',
    description: 'Enter dose, tank and area for spray quantity.',
    descriptionTe: 'Ã Â°â€¢Ã Â±ÂÃ Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â°Â¾Ã Â°Â¶Ã Â±â‚¬Ã Â°Â² Ã Â°ÂªÃ Â°Â¦Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°Â¥Ã Â°â€š Ã Â°Â²Ã Â±â€¡Ã Â°Â¦Ã Â°Â¾ Ã Â°Â²Ã Â±â‚¬Ã Â°Å¸Ã Â°Â°Ã Â±ÂÃ Â°â€¢Ã Â±Â Ã Â°Â®Ã Â±â€¹Ã Â°Â¤Ã Â°Â¾Ã Â°Â¦Ã Â±ÂÃ Â°Â¤Ã Â±â€¹ Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â±ÂÃ Â°â€”Ã Â±ÂÃ Â°Â®Ã Â°â€šÃ Â°Â¦Ã Â±Â Ã Â°ÂªÃ Â°Â°Ã Â°Â¿Ã Â°Â®Ã Â°Â¾Ã Â°Â£Ã Â°Â¾Ã Â°Â¨Ã Â±ÂÃ Â°Â¨Ã Â°Â¿ Ã Â°Â²Ã Â±â€ Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â¿Ã Â°â€šÃ Â°Å¡Ã Â°â€šÃ Â°Â¡Ã Â°Â¿.',
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
                {t('Officer Toolkit', 'Ã Â°â€¦Ã Â°Â§Ã Â°Â¿Ã Â°â€¢Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°Â² Ã Â°Å¸Ã Â±â€šÃ Â°Â²Ã Â±ÂÃ¢â‚¬Å’Ã Â°â€¢Ã Â°Â¿Ã Â°Å¸Ã Â±Â')}
              </p>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                {t('Farm Calculators', 'Ã Â°ÂµÃ Â±ÂÃ Â°Â¯Ã Â°ÂµÃ Â°Â¸Ã Â°Â¾Ã Â°Â¯ Ã Â°â€¢Ã Â°Â¾Ã Â°Â²Ã Â°Â¿Ã Â°â€¢Ã Â±ÂÃ Â°Â¯Ã Â±ÂÃ Â°Â²Ã Â±â€¡Ã Â°Å¸Ã Â°Â°Ã Â±ÂÃ Â°Â²Ã Â±Â')}
              </h1>
              <p className="mt-1 text-sm font-semibold text-emerald-50">
                {t('Crop, Seed, Fertilizer and Pesticide Calculations', 'Ã Â°ÂªÃ Â°â€šÃ Â°Å¸, Ã Â°ÂµÃ Â°Â¿Ã Â°Â¤Ã Â±ÂÃ Â°Â¤Ã Â°Â¨Ã Â°â€š, Ã Â°Å½Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±Â Ã Â°Â®Ã Â°Â°Ã Â°Â¿Ã Â°Â¯Ã Â±Â Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â±ÂÃ Â°â€”Ã Â±ÂÃ Â°Â®Ã Â°â€šÃ Â°Â¦Ã Â±Â Ã Â°Â²Ã Â±â€ Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Â²Ã Â±Â')}
              </p>
            </div>
          </div>
          <BackButton onClick={() => navigate('/officer-toolkit')} tone="solid">
            Back
          </BackButton>
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
