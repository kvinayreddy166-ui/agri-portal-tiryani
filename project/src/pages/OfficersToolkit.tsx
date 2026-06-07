import React from 'react';
import { Calculator, FileText, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const toolkitItems = [
  {
    title: 'Statutory Forms',
    telugu: 'Statutory Forms',
    path: '/forms',
    icon: FileText,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
    iconTone: 'bg-emerald-700 text-white',
  },
  {
    title: 'Acreage Calculator',
    telugu: 'Acreage Calculator',
    path: '/acreage-calculator',
    icon: Calculator,
    tone: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100',
    iconTone: 'bg-sky-700 text-white',
  },
];

export function OfficersToolkit() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl">
      <section className="rounded-lg border border-emerald-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {t('Officer Toolkit', 'Officer Toolkit')}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-500 dark:text-slate-300">
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
                <span className="block text-sm font-black">{t(item.title, item.telugu)}</span>
                <span className="mt-0.5 block text-xs font-semibold opacity-75">Open</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
