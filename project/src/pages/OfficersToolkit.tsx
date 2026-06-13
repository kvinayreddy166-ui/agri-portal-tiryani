import React from 'react';
import { Calculator, FlaskConical, ShieldCheck, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const toolkitItems = [
  {
    title: 'Statutory Forms',
    description: 'Prepare and download field forms.',
    path: '/officer-toolkit/statutory-forms',
    icon: FileText,
    tone: 'border-[#d8cfb2] bg-white text-stone-800 hover:bg-[#fbf7ea] dark:border-stone-700 dark:bg-slate-900 dark:text-stone-100 dark:hover:bg-slate-800',
    iconTone: 'bg-[#a9842f] text-white',
  },
  {
    title: 'Acreage Calculator',
    description: 'Calculate acreage from field entries.',
    path: '/officer-toolkit/acreage-calculator',
    icon: Calculator,
    tone: 'border-[#d8cfb2] bg-white text-stone-800 hover:bg-[#fbf7ea] dark:border-stone-700 dark:bg-slate-900 dark:text-stone-100 dark:hover:bg-slate-800',
    iconTone: 'bg-stone-600 text-white',
  },
  {
    title: 'Fertilizer Calculator',
    description: 'Calculate nutrients, bags, split doses, and exports.',
    path: '/officer-toolkit/fertilizer-calculator',
    icon: FlaskConical,
    tone: 'border-[#d8cfb2] bg-white text-stone-800 hover:bg-[#fbf7ea] dark:border-stone-700 dark:bg-slate-900 dark:text-stone-100 dark:hover:bg-slate-800',
    iconTone: 'bg-emerald-700 text-white',
  },
];

export function OfficersToolkit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const fromLogin = location.state?.from === 'login';

  return (
    <div className="min-h-screen bg-[#eef6f0] p-3 dark:bg-slate-950 sm:p-4">
    <div className="mx-auto max-w-2xl">
      <section className="rounded-lg border border-[#d8cfb2] bg-[#f4efdf] p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#a9842f] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-stone-600 dark:text-stone-200">
                {t('Officer Toolkit', 'Officer Toolkit')}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-stone-500 dark:text-stone-300">
                {t('Choose a field tool to continue.', 'Choose a field tool to continue.')}
              </p>
            </div>
          </div>
          {fromLogin && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('Back to Login', 'లాగిన్‌కి తిరిగి వెళ్లు')}
            </button>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {toolkitItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2.5 text-left shadow-sm transition hover:shadow-md ${item.tone}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconTone}`}>
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black">{t(item.title, item.title)}</span>
                <span className="mt-0.5 block text-xs font-semibold opacity-75">{t(item.description, item.description)}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
    </div>
  );
}
