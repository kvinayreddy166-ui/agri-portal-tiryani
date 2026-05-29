import React, { useState } from 'react';
import { Leaf } from 'lucide-react';
import { CropPage } from './CropPage';

const cropTabs = [
  { id: 'cotton', label: 'Cotton', image: '/images/cotton.jpg' },
  { id: 'paddy', label: 'Paddy', image: '/images/paddy.jpg' },
  { id: 'maize', label: 'Maize', image: '/images/maize.jpg' },
  { id: 'pulses', label: 'Pulses', image: '/images/pulses.jpg' },
  { id: 'oilseeds', label: 'Oilseeds', image: '/images/oilseeds.jpg' },
];

export function CropManagement() {
  const [activeCrop, setActiveCrop] = useState(cropTabs[0].id);

  return (
    <div className="grid gap-5 xl:grid-cols-[18rem_1fr]">
      <aside className="space-y-3">
        {cropTabs.map((crop) => {
          const active = activeCrop === crop.id;
          return (
            <button
              key={crop.id}
              type="button"
              onClick={() => setActiveCrop(crop.id)}
              className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition ${
                active
                  ? 'border-emerald-300 bg-emerald-700 text-white shadow-lg shadow-emerald-900/10'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
              }`}
            >
              <img src={crop.image} alt="" className="absolute inset-y-0 right-0 h-full w-24 object-cover opacity-25 transition group-hover:opacity-40" />
              <div className="relative">
                <div className={`mb-3 w-fit rounded-xl p-2 ${active ? 'bg-white/15' : 'bg-emerald-50 text-emerald-700'}`}>
                  <Leaf className="h-5 w-5" />
                </div>
                <p className="text-lg font-black">{crop.label}</p>
                <p className={`mt-1 text-xs font-semibold ${active ? 'text-emerald-50' : 'text-slate-500'}`}>
                  {active ? 'Open' : 'Switch'}
                </p>
              </div>
            </button>
          );
        })}
      </aside>

      <div className="min-w-0">
        <CropPage cropType={activeCrop} />
      </div>
    </div>
  );
}
