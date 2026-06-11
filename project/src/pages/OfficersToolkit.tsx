import React from 'react';
import { ArrowLeft, Calculator, ShieldCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const toolkitItems = [
  {
    title: 'Statutory Forms',
    path: '/officer-toolkit/statutory-forms',
    icon: FileText,
    tone: 'border-[#d8cfb2] bg-white text-stone-800 hover:bg-[#fbf7ea] dark:border-stone-700 dark:bg-slate-900 dark:text-stone-100 dark:hover:bg-slate-800',
    iconTone: 'bg-[#a9842f] text-white',
  },
  {
    title: 'Acreage Calculator',
    path: '/officer-toolkit/acreage-calculator',
    icon: Calculator,
    tone: 'border-[#d8cfb2] bg-white text-stone-800 hover:bg-[#fbf7ea] dark:border-stone-700 dark:bg-slate-900 dark:text-stone-100 dark:hover:bg-slate-800',
    iconTone: 'bg-stone-600 text-white',
  },
  {
    title: 'PDF Tools',
    path: '/officer-toolkit/pdf-tools',
    icon: FileText,
    tone: 'border-[#d8cfb2] bg-white text-stone-800 hover:bg-[#fbf7ea] dark:border-stone-700 dark:bg-slate-900 dark:text-stone-100 dark:hover:bg-slate-800',
    iconTone: 'bg-emerald-600 text-white',
  },
];

export function OfficersToolkit() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#eef6f0] p-3 dark:bg-slate-950 sm:p-4">
    <div className="mx-auto max-w-2xl">
      <section className="rounded-lg border border-[#d8cfb2] bg-[#f4efdf] p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:p-4">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>
        <div className="mb-3 flex items-center gap-3">
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
                <span className="mt-0.5 block text-xs font-semibold opacity-75">{t('Open', 'Open')}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
    </div>
  );
}
