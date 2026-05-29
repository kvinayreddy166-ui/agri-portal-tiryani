import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { QualityControl } from './QualityControl';

type QualityCategory = 'seeds' | 'pesticides' | 'fertilizers';

const qualityTabs: Array<{ id: QualityCategory; label: string; tone: string }> = [
  { id: 'seeds', label: 'Seeds', tone: 'from-emerald-50 to-lime-50' },
  { id: 'pesticides', label: 'Pesticides', tone: 'from-sky-50 to-cyan-50' },
  { id: 'fertilizers', label: 'Fertilizers', tone: 'from-amber-50 to-yellow-50' },
];

export function QualityControlHub() {
  const [activeCategory, setActiveCategory] = useState<QualityCategory>('seeds');

  return (
    <div className="grid gap-5 xl:grid-cols-[18rem_1fr]">
      <aside className="space-y-3">
        {qualityTabs.map((tab) => {
          const active = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                active
                  ? 'border-emerald-300 bg-emerald-700 text-white shadow-lg shadow-emerald-900/10'
                  : `border-slate-200 bg-gradient-to-br ${tab.tone} text-slate-900 hover:border-emerald-300 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900 dark:text-white`
              }`}
            >
              <div className={`mb-4 w-fit rounded-xl p-3 ${active ? 'bg-white/15' : 'bg-white/75 text-emerald-700'}`}>
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="text-xl font-black">{tab.label}</p>
              <p className={`mt-1 text-xs font-semibold ${active ? 'text-emerald-50' : 'text-slate-500'}`}>
                {active ? 'Open' : 'Switch'}
              </p>
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
