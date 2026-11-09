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
    text: 'text-sky-700 dark:text-sky-300',
  },
  {
    title: 'Fertilizer Calculator',
    titleTe: 'ఎరువుల కాలిక్యులేటర్',
    description: 'Use crop recommendation or manual nutrients.',
    descriptionTe: 'పోషక అవసరాల ఆధారంగా ఎరువు పరిమాణాన్ని లెక్కించండి.',
    path: '/officer-toolkit/fertilizer-calculator',
    icon: PackageCheck,
    accent: 'from-emerald-600 to-green-700',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    title: 'Irrigation Calculator',
    titleTe: 'నీటిపారుదల కాలిక్యులేటర్',
    description: 'Calculate pump run hours for drip & sprinkler.',
    descriptionTe: 'బిందు మరియు తుంపర సేద్యానికి పంపు పనివేళలను లెక్కించండి.',
    path: '/officer-toolkit/irrigation-calculator',
    icon: Droplets,
    accent: 'from-blue-600 to-indigo-600',
    text: 'text-blue-700 dark:text-blue-300',
  },
  {
    title: 'Pesticide Calculator',
    titleTe: 'పురుగుమందు కాలిక్యులేటర్',
    description: 'Enter dose, tank and area for spray quantity.',
    descriptionTe: 'క్రియాశీల పదార్థం లేదా లీటరుకు మోతాదుతో పురుగుమందు పరిమాణాన్ని లెక్కించండి.',
    path: '/officer-toolkit/pesticide-calculator',
    icon: Bug,
    accent: 'from-orange-500 to-red-600',
    text: 'text-orange-700 dark:text-orange-300',
  },
  {
    title: 'Plant Population Calculator',
    titleTe: 'మొక్కల జనాభా కాలిక్యులేటర్',
    description: 'Enter spacing and get plants per field.',
    descriptionTe: 'వరుస మరియు మొక్కల మధ్య దూరంతో మొక్కల సంఖ్యను లెక్కించండి.',
    path: '/officer-toolkit/plant-population-calculator',
    icon: Sprout,
    accent: 'from-teal-600 to-cyan-700',
    text: 'text-teal-700 dark:text-teal-300',
  },
  {
    title: 'Profit Calculator',
    titleTe: 'లాభదాయకత కాలిక్యులేటర్',
    description: 'Calculate cost of cultivation, yield and net profit.',
    descriptionTe: 'సాగు ఖర్చు, దిగుబడి మరియు నికర లాభాన్ని లెక్కించండి.',
    path: '/officer-toolkit/profitability-calculator',
    icon: TrendingUp,
    accent: 'from-amber-500 to-yellow-600',
    text: 'text-amber-700 dark:text-amber-300',
  },
  {
    title: 'Seed Rate Calculator',
    titleTe: 'విత్తన మోతాదు కాలిక్యులేటర్',
    description: 'Enter population and seed label details.',
    descriptionTe: 'టెస్ట్ వెయిట్, మొలక శాతం మరియు మొక్కల సంఖ్యతో విత్తన అవసరాన్ని లెక్కించండి.',
    path: '/officer-toolkit/seed-rate-calculator',
    icon: Wheat,
    accent: 'from-lime-600 to-green-700',
    text: 'text-lime-700 dark:text-lime-300',
  },
  {
    title: 'Soil Health Meter',
    titleTe: 'మట్టి ఆరోగ్య మీటర్',
    description: 'Assess soil test results & field indicators with instant health scoring and advisory.',
    descriptionTe: 'రసాయన పరీక్ష మరియు క్షేత్ర స్థాయి లక్షణాలతో మట్టి ఆరోగ్య స్కోర్ మరియు సిఫార్సులు పొందండి.',
    path: '/officer-toolkit/soil-health-meter',
    icon: FlaskConical,
    accent: 'from-violet-600 to-purple-700',
    text: 'text-violet-700 dark:text-violet-300',
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
              className="group flex min-h-[76px] w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-3.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:p-4"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-md transition duration-200 group-hover:scale-105`}>
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={`text-sm font-bold leading-5 ${item.text}`}>{t(item.title, item.titleTe)}</h2>
                <p className="mt-0.5 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{t(item.description, item.descriptionTe)}</p>
              </div>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
