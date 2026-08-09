import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Camera, RefreshCw, Search, Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { CropProtectionCategory, CropProtectionCrop, CropProtectionItem, LanguageCode } from '../../services/cropProtectionService';
import { buildGeneralIpmItem, pickLang } from '../../services/cropProtectionService';
import { label } from '../../services/translationService';
import { ProtectionItemCard } from './ProtectionItemCard';
import { CropProtectionAdmin } from './CropProtectionAdmin';
import { BackButton } from '../ui/BackButton';
import { LanguageToggle } from '../ui/LanguageToggle';

const categories: Array<{
  key: CropProtectionCategory;
  label: string;
  description: string;
}> = [
  { key: 'pest', label: 'Pests', description: 'Identify insects, symptoms and ETL.' },
  { key: 'disease', label: 'Diseases', description: 'Identify diseases and field symptoms.' },
  { key: 'weed', label: 'Weeds', description: 'Identify weed flora and control options.' },
  { key: 'nutrient', label: 'Nutrient Deficiencies', description: 'Identify nutrient deficiency symptoms.' },
];

export function CropProtectionDashboard({
  crops,
  loading,
  onRefresh,
}: {
  crops: CropProtectionCrop[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const { isAdminUser } = useAuth();
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [selectedCropKey, setSelectedCropKey] = useState(crops[0]?.crop_key || 'cotton');
  const [category, setCategory] = useState<CropProtectionCategory>('pest');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'guidance' | 'admin'>('guidance');

  useEffect(() => {
    if (!crops.length) return;
    if (!crops.some((crop) => crop.crop_key === selectedCropKey)) {
      setSelectedCropKey(crops[0].crop_key);
    }
  }, [crops, selectedCropKey]);

  const selectedCrop = crops.find((crop) => crop.crop_key === selectedCropKey) || crops[0];
  const query = search.trim().toLowerCase();


  const filteredItems = useMemo<Array<{ crop: CropProtectionCrop; item: CropProtectionItem }>>(() => {
    if (!selectedCrop) return [];
    const sourceCrops = query ? crops : [selectedCrop];
    const matches: Array<{ crop: CropProtectionCrop; item: CropProtectionItem }> = [];

    sourceCrops.forEach((crop) => {
      (crop.items || []).forEach((item) => {
        if (!query && item.category !== category) return;

        const haystack = [
          crop.name_en,
          crop.name_te,
          item.category,
          item.name_en,
          item.name_te,
          item.scientific_name,
          item.symptoms_en,
          item.symptoms_te,
          item.damage_en,
          item.damage_te,
          item.favourable_conditions_en,
          item.favourable_conditions_te,
          item.etl,
          item.stage,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!query || haystack.includes(query)) matches.push({ crop, item });
      });
    });

    if (matches.length) return matches;
    if (query) return [];
    return [{ crop: selectedCrop, item: buildGeneralIpmItem(selectedCrop, category) }];
  }, [category, crops, query, selectedCrop]);

  const selectedCategory = categories.find((item) => item.key === category) || categories[0];

  if (loading && !crops.length) return <LoadingSkeleton />;

  if (!selectedCrop) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
        {label('No information available currently', language)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-800 via-green-700 to-teal-800 p-4 text-white shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-100">{label('Officer Toolkit', language)}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {label('Crop Doctor', language)}
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold text-emerald-50">
              {label('Crop, pest, disease, weed and nutrient deficiency guidance for field officers.', language)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BackButton onClick={() => navigate('/officer-toolkit')} tone="solid">
              Back
            </BackButton>
            <LanguageToggle language={language} onClick={() => setLanguage((value) => (value === 'en' ? 'te' : 'en'))} tone="solid" />
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3 text-xs font-black text-white transition hover:bg-white/25"
            >
              <RefreshCw className="h-4 w-4" /> {label('Refresh', language)}
            </button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={label('Search crop, pest, disease, weed or symptom', language)}
            className="h-11 w-full rounded-xl border border-white/20 bg-white py-2 pl-10 pr-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-white/25"
          />
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{label('Quick Crop Selection', language)}</p>
            <h2 className="text-base font-black text-slate-950">{pickLang(selectedCrop.name_en, selectedCrop.name_te, language)}</h2>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-2.5 text-[11px] font-black text-emerald-800 disabled:opacity-80"
            title={label('AI photo diagnosis coming soon', language)}
          >
            <Camera className="h-3.5 w-3.5" /> {label('Identify from Photo', language)}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-10">
          {crops.map((crop) => {
            const selected = crop.crop_key === selectedCrop.crop_key;
            return (
              <button
                key={crop.crop_key}
                type="button"
                onClick={() => setSelectedCropKey(crop.crop_key)}
                className="group flex min-w-0 flex-col items-center gap-1.5 text-center"
              >
                <span className={`h-14 w-14 overflow-hidden rounded-full border-2 bg-slate-100 shadow-sm transition group-hover:scale-105 ${selected ? 'border-emerald-600 ring-4 ring-emerald-100' : 'border-white'}`}>
                  {crop.image_url ? (
                    <img src={crop.image_url} alt={crop.name_en} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-emerald-100 text-emerald-700">
                      <Sprout className="h-5 w-5" />
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-[11px] font-black text-slate-700">{pickLang(crop.name_en, crop.name_te, language)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeTab === 'guidance'} onClick={() => setActiveTab('guidance')}>{label('Guidance', language)}</TabButton>
            {isAdminUser && <TabButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')}>{label('Admin Data Editor', language)}</TabButton>}
          </div>
          {activeTab === 'guidance' && (
            <select value={category} onChange={(event) => setCategory(event.target.value as CropProtectionCategory)} className="filter-select max-w-xs">
              {categories.map((item) => <option key={item.key} value={item.key}>{label(item.label, language)}</option>)}
            </select>
          )}
        </div>
      </section>

      {activeTab === 'guidance' && (
        <section className="space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              {query ? label('Search guidance', language) : label(selectedCategory.label, language)}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {query ? search : label(selectedCategory.description, language)}
            </p>
          </div>

          {!filteredItems.length && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              {label('No information available currently', language)}
            </div>
          )}

          {filteredItems.length > 0 && !filteredItems.some(({ item }) => item.is_verified) && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>More official recommendations will be updated soon. General IPM is shown so officers never see an empty card.</p>
            </div>
          )}

          {filteredItems.map(({ crop, item }) => (
            <ProtectionItemCard key={`${crop.crop_key}-${item.id}`} crop={crop} item={item} language={language} />
          ))}
        </section>
      )}
      {activeTab === 'admin' && <CropProtectionAdmin crops={crops} isAdmin={isAdminUser} onSaved={onRefresh} />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-black transition ${
        active ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
