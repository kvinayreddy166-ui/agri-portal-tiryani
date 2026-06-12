import React, { useState } from 'react';
import { FlaskConical, ShieldCheck, Sprout } from 'lucide-react';
import { QualityControl } from './QualityControl';

type QualityCategory = 'seeds' | 'pesticides' | 'fertilizers';

const qualityTabs: Array<{ id: QualityCategory; label: string; icon: React.ElementType; tone: string; activeTone: string }> = [
  { id: 'seeds', label: 'Seeds', icon: Sprout, tone: 'border-emerald-200 bg-emerald-50 text-emerald-800', activeTone: 'border-emerald-700 bg-emerald-700 text-white' },
  { id: 'pesticides', label: 'Pesticides', icon: ShieldCheck, tone: 'border-sky-200 bg-sky-50 text-sky-800', activeTone: 'border-sky-700 bg-sky-700 text-white' },
  { id: 'fertilizers', label: 'Fertilizers', icon: FlaskConical, tone: 'border-amber-200 bg-amber-50 text-amber-900', activeTone: 'border-amber-700 bg-amber-600 text-white' },
];

export function QualityControlHub() {
  const [activeCategory, setActiveCategory] = useState<QualityCategory>('seeds');

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
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-white/15' : 'bg-white/80'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="truncate text-sm font-black">{tab.label}</p>
                <p className={`text-[11px] font-bold ${active ? 'text-white/80' : 'text-slate-500'}`}>{active ? 'Selected' : 'View records'}</p>
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
