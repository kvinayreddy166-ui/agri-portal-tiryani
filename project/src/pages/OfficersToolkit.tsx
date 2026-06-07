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
    <div className="space-y-4">
      <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {t('Officer Toolkit', 'Officer Toolkit')}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">
              {t('Choose a field tool to continue.', 'Choose a field tool to continue.')}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {toolkitItems.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            className={`flex min-h-28 items-center gap-4 rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.tone}`}
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${item.iconTone}`}>
              <item.icon className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-black">{t(item.title, item.telugu)}</span>
              <span className="mt-1 block text-sm font-semibold opacity-75">Open</span>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
