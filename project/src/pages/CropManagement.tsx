import React, { useState } from 'react';
import { BrainCircuit, Leaf } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CropIntelligencePage } from './crops/CropIntelligencePage.jsx';

const cropTabs = [
  { id: 'paddy', label: 'Paddy', labelTe: 'వరి', image: '/images/paddy.webp' },
  { id: 'maize', label: 'Maize', labelTe: 'మొక్కజొన్న', image: '/images/maize.webp' },
  { id: 'cotton', label: 'Cotton', labelTe: 'పత్తి', image: '/images/cotton.webp' },
  { id: 'redgram', label: 'Redgram', labelTe: 'కందులు', image: '/images/pulses.webp' },
  { id: 'greengram', label: 'Greengram', labelTe: 'పెసలు', image: '/images/greengram.webp' },
];

export function CropManagement() {
  const [activeCrop, setActiveCrop] = useState(cropTabs[0].id);
  const { t } = useLanguage();

  return (
    <div className="grid gap-3 xl:grid-cols-[15rem_1fr]">
      <aside className="space-y-2">
        <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-emerald-700" />
            <h1 className="text-base font-black text-slate-950 dark:text-white">
              {t('Crop Intelligence', 'పంట సమాచారం')}
            </h1>
          </div>
        </div>
        {cropTabs.map((crop) => {
          const active = activeCrop === crop.id;
          const label = t(crop.label, crop.labelTe);
          return (
            <button
              key={crop.id}
              type="button"
              onClick={() => setActiveCrop(crop.id)}
              className={`group relative w-full overflow-hidden rounded-lg border p-3 text-left transition ${
                active
                  ? 'border-emerald-300 bg-emerald-700 text-white shadow-lg shadow-emerald-900/10'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
              }`}
            >
              <img src={crop.image} alt="" loading="lazy" decoding="async" className="absolute inset-y-0 right-0 h-full w-20 object-cover opacity-25 transition group-hover:opacity-40" />
              <div className="relative">
                <div className={`mb-2 w-fit rounded-lg p-1.5 ${active ? 'bg-white/15' : 'bg-emerald-50 text-emerald-700'}`}>
                  <Leaf className="h-4 w-4" />
                </div>
                <p className="text-base font-black">{label}</p>
                <p className={`mt-1 text-xs font-semibold ${active ? 'text-emerald-50' : 'text-slate-500'}`}>
                  {active ? t('Open', 'తెరిచి ఉంది') : t('Switch', 'మార్చండి')}
                </p>
              </div>
            </button>
          );
        })}
      </aside>

      <div className="min-w-0">
        <CropIntelligencePage cropSlug={activeCrop} />
      </div>
    </div>
  );
}
