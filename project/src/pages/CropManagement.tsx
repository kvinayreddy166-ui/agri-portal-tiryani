import React, { useState } from 'react';
import { BrainCircuit, ClipboardList, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const { isAdminUser } = useAuth();
  const navigate = useNavigate();

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
        {isAdminUser && (
          <button
            type="button"
            onClick={() => navigate('/crop-admin')}
            className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-amber-950 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white/80 p-1.5 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-black">{t('Crop Admin', 'పంట అడ్మిన్')}</p>
                <p className="text-xs font-semibold opacity-80">{t('Switch to admin tools', 'అడ్మిన్ సాధనాలకు మారండి')}</p>
              </div>
            </div>
          </button>
        )}
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
              <img src={crop.image} alt="" width={80} height={80} loading="lazy" decoding="async" className="absolute inset-y-0 right-0 h-full w-20 object-cover opacity-25 transition group-hover:opacity-40" />
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
