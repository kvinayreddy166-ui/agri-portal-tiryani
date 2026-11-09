import React from 'react';
import { Bug, Calculator, Droplets, FlaskConical, PackageCheck, Ruler, Sprout, TrendingUp, Wheat } from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { ToolkitPageHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { useAuth } from '../../../shared/context/AuthContext';


const calculatorItems = [
  {
    title: 'Area Calculator',
    titleTe: 'విస్తీర్ణ కాలిక్యులేటర్',
    description: 'Convert acres, hectares, cents and guntas.',
    descriptionTe: 'ఎకరాలు, హెక్టార్లు, సెంట్లు మరియు గుంటలను మార్చండి.',
    path: '/officer-toolkit/acreage-calculator',
    icon: Ruler,
    accent: 'from-sky-600 to-cyan-700',
    panel: 'from-sky-100 via-sky-50 to-cyan-100 dark:from-sky-950/40 dark:via-slate-900 dark:to-cyan-950/40',
    border: 'border-sky-300 dark:border-sky-800/60',
    borderHover: 'hover:border-sky-400 dark:hover:border-sky-600',
    text: 'text-sky-800 dark:text-sky-200',
  },
  {
    title: 'Fertilizer Calculator',
    titleTe: 'ఎరువుల కాలిక్యులేటర్',
    description: 'Use crop recommendation or manual nutrients.',
    descriptionTe: 'పోషక అవసరాల ఆధారంగా ఎరువు పరిమాణాన్ని లెక్కించండి.',
    path: '/officer-toolkit/fertilizer-calculator',
    icon: PackageCheck,
    accent: 'from-emerald-600 to-green-700',
    panel: 'from-emerald-100 via-emerald-50 to-green-100 dark:from-emerald-950/40 dark:via-slate-900 dark:to-green-950/40',
    border: 'border-emerald-300 dark:border-emerald-800/60',
    borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  {
    title: 'Irrigation Calculator',
    titleTe: 'నీటిపారుదల కాలిక్యులేటర్',
    description: 'Calculate pump run hours for drip & sprinkler.',
    descriptionTe: 'బిందు మరియు తుంపర సేద్యానికి పంపు పనివేళలను లెక్కించండి.',
    path: '/officer-toolkit/irrigation-calculator',
    icon: Droplets,
    accent: 'from-cyan-600 to-blue-700',
    panel: 'from-cyan-100 via-sky-50 to-blue-100 dark:from-cyan-950/40 dark:via-slate-900 dark:to-blue-950/40',
    border: 'border-cyan-300 dark:border-cyan-800/60',
    borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-600',
    text: 'text-cyan-800 dark:text-cyan-200',
  },
  {
    title: 'Pesticide Calculator',
    titleTe: 'పురుగుమందు కాలిక్యులేటర్',
    description: 'Enter dose, tank and area for spray quantity.',
    descriptionTe: 'క్రియాశీల పదార్థం లేదా లీటరుకు మోతాదుతో పురుగుమందు పరిమాణాన్ని లెక్కించండి.',
    path: '/officer-toolkit/pesticide-calculator',
    icon: Bug,
    accent: 'from-red-500 to-amber-600',
    panel: 'from-red-100 via-red-50 to-amber-100 dark:from-red-950/40 dark:via-slate-900 dark:to-amber-950/40',
    border: 'border-red-300 dark:border-red-800/60',
    borderHover: 'hover:border-red-400 dark:hover:border-red-600',
    text: 'text-red-800 dark:text-red-200',
  },
  {
    title: 'Plant Population Calculator',
    titleTe: 'మొక్కల జనాభా కాలిక్యులేటర్',
    description: 'Enter spacing and get plants per field.',
    descriptionTe: 'వరుస మరియు మొక్కల మధ్య దూరంతో మొక్కల సంఖ్యను లెక్కించండి.',
    path: '/officer-toolkit/plant-population-calculator',
    icon: Sprout,
    accent: 'from-green-600 to-emerald-700',
    panel: 'from-green-100 via-green-50 to-emerald-100 dark:from-green-950/40 dark:via-slate-900 dark:to-emerald-950/40',
    border: 'border-green-300 dark:border-green-800/60',
    borderHover: 'hover:border-green-400 dark:hover:border-green-600',
    text: 'text-green-800 dark:text-green-200',
  },
  {
    title: 'Profit Calculator',
    titleTe: 'లాభదాయకత కాలిక్యులేటర్',
    description: 'Calculate cost of cultivation, yield and net profit.',
    descriptionTe: 'సాగు ఖర్చు, దిగుబడి మరియు నికర లాభాన్ని లెక్కించండి.',
    path: '/officer-toolkit/profitability-calculator',
    icon: TrendingUp,
    accent: 'from-amber-600 to-emerald-700',
    panel: 'from-amber-100 via-amber-50 to-emerald-100 dark:from-amber-950/40 dark:via-slate-900 dark:to-emerald-950/40',
    border: 'border-amber-300 dark:border-amber-800/60',
    borderHover: 'hover:border-amber-400 dark:hover:border-amber-600',
    text: 'text-amber-800 dark:text-amber-200',
  },
  {
    title: 'Seed Rate Calculator',
    titleTe: 'విత్తన మోతాదు కాలిక్యులేటర్',
    description: 'Enter population and seed label details.',
    descriptionTe: 'టెస్ట్ వెయిట్, మొలక శాతం మరియు మొక్కల సంఖ్యతో విత్తన అవసరాన్ని లెక్కించండి.',
    path: '/officer-toolkit/seed-rate-calculator',
    icon: Wheat,
    accent: 'from-lime-600 to-emerald-700',
    panel: 'from-lime-100 via-lime-50 to-emerald-100 dark:from-lime-950/40 dark:via-slate-900 dark:to-emerald-950/40',
    border: 'border-lime-300 dark:border-lime-800/60',
    borderHover: 'hover:border-lime-400 dark:hover:border-lime-600',
    text: 'text-lime-800 dark:text-lime-200',
  },
  {
    title: 'Soil Health Meter',
    titleTe: 'మట్టి ఆరోగ్య మీటర్',
    description: 'Assess soil test results & field indicators with instant health scoring and advisory.',
    descriptionTe: 'రసాయన పరీక్ష మరియు క్షేత్ర స్థాయి లక్షణాలతో మట్టి ఆరోగ్య స్కోర్ మరియు సిఫార్సులు పొందండి.',
    path: '/officer-toolkit/soil-health-meter',
    icon: FlaskConical,
    accent: 'from-teal-600 to-emerald-700',
    panel: 'from-teal-100 via-teal-50 to-emerald-100 dark:from-teal-950/40 dark:via-slate-900 dark:to-emerald-950/40',
    border: 'border-teal-300 dark:border-teal-800/60',
    borderHover: 'hover:border-teal-400 dark:hover:border-teal-600',
    text: 'text-teal-800 dark:text-teal-200',
  },
];

export function FarmCalculators() {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const { user, isAdminUser, isTestUser, isOfficerUser } = useAuth();
  const showCompactHeader = !user || isAdminUser || isTestUser || isOfficerUser;

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 sm:px-6 lg:px-8">
        {showCompactHeader ? (
          <ModulePageHeader
            className="mb-4"
            title={t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
            subtitle={t('Area, Plant, Seed and Fertilizer Calculations', 'విస్తీరణ, మొక్కలు, విత్తనం మరియు ఎరువుల లెక్కలు')}
            icon={Calculator}
            onBack={!user ? () => navigate('/officer-toolkit') : undefined}
            actions={!user ? <LanguageToggle language={language} onClick={toggleLanguage} accent="emerald" /> : undefined}
          />
        ) : (
        <ToolkitPageHeader
          icon={FlaskConical}
          tone="emerald"
          variant="solid"
          eyebrow={t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్')}
          title={t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
          subtitle={t('Area, Plant, Seed and Fertilizer Calculations', 'విస్తీరణ, మొక్కలు, విత్తనం మరియు ఎరువుల లెక్కలు')}
          fallbackPath="/dashboard"
          onBack={() => navigate('/officer-toolkit')}
          actions={
            <LanguageToggle
              language={language}
              onClick={toggleLanguage}
              tone="solid"
              accent="emerald"
            />
          }
          className="mb-0"
        />
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {calculatorItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`group flex min-h-[76px] w-full cursor-pointer items-center gap-3.5 rounded-2xl border ${item.border} ${item.borderHover} bg-gradient-to-br ${item.panel} p-3.5 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:p-4`}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-md transition duration-300 group-hover:scale-105`}>
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={`text-sm font-black leading-5 ${item.text}`}>{t(item.title, item.titleTe)}</h2>
                <p className="mt-0.5 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">{t(item.description, item.descriptionTe)}</p>
              </div>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
