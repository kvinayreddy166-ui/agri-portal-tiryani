import React from 'react';
import { Bug, FlaskConical, PackageCheck, Ruler, Sprout, Wheat } from 'lucide-react';
import { ToolkitPageHeader } from '../components/ui/ToolkitPageHeader';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/ui/LanguageToggle';


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
    border: 'border-sky-300 dark:border-sky-800/60',
  },
  {
    title: 'Plant Population Calculator',
    titleTe: 'మొక్కల జనాభా కాలిక్యులేటర్',
    description: 'Enter spacing and get plants per field.',
    descriptionTe: 'వరుస మరియు మొక్కల మధ్య దూరంతో మొక్కల సంఖ్యను లెక్కించండి.',
    path: '/officer-toolkit/plant-population-calculator',
    icon: Sprout,
    accent: 'from-green-600 to-teal-700',
    panel: 'from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30',
    border: 'border-green-300 dark:border-green-800/60',
  },
  {
    title: 'Seed Rate Calculator',
    titleTe: 'విత్తన మోతాదు కాలిక్యులేటర్',
    description: 'Enter population and seed label details.',
    descriptionTe: 'టెస్ట్ వెయిట్, మొలక శాతం మరియు మొక్కల సంఖ్యతో విత్తన అవసరాన్ని లెక్కించండి.',
    path: '/officer-toolkit/seed-rate-calculator',
    icon: Wheat,
    accent: 'from-lime-600 to-emerald-700',
    panel: 'from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/30',
    border: 'border-lime-300 dark:border-lime-800/60',
  },
  {
    title: 'Fertilizer Calculator',
    titleTe: 'ఎరువుల కాలిక్యులేటర్',
    description: 'Use crop recommendation or manual nutrients.',
    descriptionTe: 'పోషక అవసరాల ఆధారంగా ఎరువు పరిమాణాన్ని లెక్కించండి.',
    path: '/officer-toolkit/fertilizer-calculator',
    icon: PackageCheck,
    accent: 'from-emerald-600 to-green-700',
    panel: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
    border: 'border-emerald-300 dark:border-emerald-800/60',
  },
  {
    title: 'Pesticide Calculator',
    titleTe: 'పురుగుమందు కాలిక్యులేటర్',
    description: 'Enter dose, tank and area for spray quantity.',
    descriptionTe: 'క్రియాశీల పదార్థం లేదా లీటరుకు మోతాదుతో పురుగుమందు పరిమాణాన్ని లెక్కించండి.',
    path: '/officer-toolkit/pesticide-calculator',
    icon: Bug,
    accent: 'from-red-500 to-amber-600',
    panel: 'from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30',
    border: 'border-red-300 dark:border-red-800/60',
  },
];

export function FarmCalculators() {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="relative">
          <ToolkitPageHeader
            icon={FlaskConical}
            tone="emerald"
            variant="solid"
            eyebrow={t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
            title={t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
            subtitle={t('Area, Plant, Seed and Fertilizer Calculations', 'విస్తీరణ, మొక్కలు, విత్తనం మరియు ఎరువుల లెక్కలు')}
            fallbackPath="/officer-toolkit"
            onBack={() => navigate('/officer-toolkit')}
            className="mb-0"
          />
          <div className="absolute bottom-4 right-4">
            <LanguageToggle language={language} onClick={toggleLanguage} tone="solid" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {calculatorItems.map((item) => (
            <article
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`min-h-[140px] cursor-pointer rounded-xl border-2 ${item.border} bg-gradient-to-br ${item.panel} p-4 text-center shadow-md transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.accent} text-white shadow-lg`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black leading-snug text-slate-950 dark:text-white">{t(item.title, item.titleTe)}</h2>
                  <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-700 dark:text-slate-300">{t(item.description, item.descriptionTe)}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
