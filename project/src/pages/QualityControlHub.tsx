import React, { useState } from 'react';
import { FlaskConical, ShieldCheck, Sprout } from 'lucide-react';
import { QualityControl } from './QualityControl';
import { useLanguage } from '../context/LanguageContext';

type QualityCategory = 'seeds' | 'pesticides' | 'fertilizers';

const qualityTabs: Array<{ id: QualityCategory; label: string; telugu: string; icon: React.ElementType; tone: string; iconTone: string; activeTone: string }> = [
  {
    id: 'seeds',
    label: 'Seeds',
    telugu: 'విత్తనాలు',
    icon: Sprout,
    tone: 'border-emerald-100 bg-white text-slate-900 hover:border-emerald-300 hover:bg-emerald-50/70',
    iconTone: 'bg-emerald-50 text-emerald-700',
    activeTone: 'border-emerald-700 bg-emerald-700 text-white',
  },
  {
    id: 'pesticides',
    label: 'Pesticides',
    telugu: 'పురుగుమందులు',
    icon: ShieldCheck,
    tone: 'border-emerald-100 bg-white text-slate-900 hover:border-teal-300 hover:bg-teal-50/70',
    iconTone: 'bg-teal-50 text-teal-700',
    activeTone: 'border-teal-700 bg-teal-700 text-white',
  },
  {
    id: 'fertilizers',
    label: 'Fertilizers',
    telugu: 'ఎరువులు',
    icon: FlaskConical,
    tone: 'border-emerald-100 bg-white text-slate-900 hover:border-lime-300 hover:bg-lime-50/70',
    iconTone: 'bg-lime-50 text-lime-700',
    activeTone: 'border-lime-700 bg-lime-700 text-white',
  },
];

export function QualityControlHub() {
  const [activeCategory, setActiveCategory] = useState<QualityCategory>('seeds');
  const { t } = useLanguage();

  return (
    <div className="grid gap-3 xl:grid-cols-[16rem_1fr]">
      <aside className="grid grid-cols-3 gap-2 xl:grid-cols-1">
        {qualityTabs.map((tab) => {
          const active = activeCategory === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`flex h-24 flex-col justify-between rounded-lg border p-3 text-left shadow-sm transition hover:shadow-md ${
                active ? tab.activeTone : `${tab.tone} dark:border-slate-700 dark:bg-slate-900 dark:text-white`
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-white/15 text-white' : tab.iconTone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="truncate text-sm font-black">{t(tab.label, tab.telugu)}</p>
                <p className={`text-[11px] font-bold ${active ? 'text-white/80' : 'text-slate-500'}`}>
                  {active ? t('Selected', 'ఎంచుకున్నారు') : t('View records', 'రికార్డులు చూడండి')}
                </p>
              </div>
            </button>
          );
        })}
      </aside>

      <div className="min-w-0">
        <QualityControl category={activeCategory} />
      </div>
    </div>
  );
}
