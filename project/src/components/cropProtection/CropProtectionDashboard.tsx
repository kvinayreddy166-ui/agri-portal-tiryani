import React, { useMemo, useState } from 'react';
import { AlertTriangle, Languages, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { CropProtectionCategory, CropProtectionCrop, LanguageCode, SeverityLevel } from '../../services/cropProtectionService';
import { buildGeneralIpmItem, pickLang } from '../../services/cropProtectionService';
import { label } from '../../services/translationService';
import { CropCard } from './CropCard';
import { ProtectionItemCard } from './ProtectionItemCard';
import { SprayCalculator } from './SprayCalculator';
import { CropProtectionAdmin } from './CropProtectionAdmin';

const categories: Array<{ key: CropProtectionCategory; label: string }> = [
  { key: 'weed', label: 'Weeds' },
  { key: 'pest', label: 'Pests' },
  { key: 'disease', label: 'Diseases' },
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
  const { isAdminUser } = useAuth();
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [selectedCropKey, setSelectedCropKey] = useState(crops[0]?.crop_key || 'cotton');
  const [category, setCategory] = useState<CropProtectionCategory>('pest');
  const [severity, setSeverity] = useState<'all' | SeverityLevel>('all');
  const [stage, setStage] = useState('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'guidance' | 'spray' | 'admin'>('guidance');

  const selectedCrop = crops.find((crop) => crop.crop_key === selectedCropKey) || crops[0];
  const stages = useMemo(() => {
    const values = new Set<string>();
    crops.forEach((crop) => crop.items?.forEach((item) => item.stage && values.add(item.stage)));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [crops]);

  const filteredItems = useMemo(() => {
    if (!selectedCrop) return [];
    const query = search.trim().toLowerCase();
    const items = (selectedCrop.items || []).filter((item) => {
      if (item.category !== category) return false;
      if (severity !== 'all' && item.severity_level !== severity) return false;
      if (stage !== 'all' && item.stage !== stage) return false;
      if (!query) return true;
      return [
        item.name_en,
        item.name_te,
        item.scientific_name,
        item.symptoms_en,
        item.symptoms_te,
        item.damage_en,
        item.damage_te,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
    return items.length ? items : [buildGeneralIpmItem(selectedCrop, category)];
  }, [category, search, selectedCrop, severity, stage]);

  if (loading && !crops.length) {
    return <LoadingSkeleton />;
  }

  if (!selectedCrop) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
        Crop protection data is loading. If this persists, check the bundled seed file.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Officer Toolkit</p>
            <h1 className="text-xl font-black text-slate-950">{label('Crop Protection Guidance', language)}</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Weed, pest and disease guidance with official-source records and never-empty General IPM fallback.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLanguage((value) => (value === 'en' ? 'te' : 'en'))}
              className="action-button bg-white"
            >
              <Languages className="h-4 w-4" /> {language === 'en' ? 'తెలుగు' : 'English'}
            </button>
            <button type="button" onClick={onRefresh} className="action-button">
              <ShieldCheck className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-2">
          {crops.map((crop) => (
            <CropCard
              key={crop.crop_key}
              crop={crop}
              selected={crop.crop_key === selectedCrop.crop_key}
              language={language}
              onSelect={() => setSelectedCropKey(crop.crop_key)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={label('Search guidance', language)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={category} onChange={(event) => setCategory(event.target.value as CropProtectionCategory)} className="filter-select">
              {categories.map((item) => <option key={item.key} value={item.key}>{label(item.label, language)}</option>)}
            </select>
            <select value={severity} onChange={(event) => setSeverity(event.target.value as 'all' | SeverityLevel)} className="filter-select">
              <option value="all">All severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select value={stage} onChange={(event) => setStage(event.target.value)} className="filter-select">
              <option value="all">All stages</option>
              {stages.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <TabButton active={activeTab === 'guidance'} onClick={() => setActiveTab('guidance')}>Guidance</TabButton>
          <TabButton active={activeTab === 'spray'} onClick={() => setActiveTab('spray')}>{label('Spray Calculator', language)}</TabButton>
          <TabButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')}>{label('Admin Data Editor', language)}</TabButton>
        </div>
      </section>

      {activeTab === 'guidance' && (
        <section className="space-y-3">
          {!filteredItems.some((item) => item.is_verified) && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                More official recommendations will be updated soon. General IPM is shown so officers never see an empty card.
              </p>
            </div>
          )}
          {filteredItems.map((item) => (
            <ProtectionItemCard key={item.id} crop={selectedCrop} item={item} language={language} />
          ))}
        </section>
      )}

      {activeTab === 'spray' && <SprayCalculator language={language} />}
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
      <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
