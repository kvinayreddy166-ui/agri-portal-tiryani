import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bug,
  ChevronDown,
  Info,
  RotateCcw,
  Search,
  Share2,
  Shield,
  Wheat,
  X,
} from 'lucide-react';
import { type AgrochemicalItem, type CropPestInsecticideEntry, type ToxicityBand } from '../types';
import { CROP_PEST_INSECTICIDES_DATA } from '../data/cropPestInsecticidesData';
import {
  getCropList,
  getPestListForCrop,
  getAvailableIracGroups,
  filterCropPestInsecticides,
  buildCropPestWhatsAppAdvisory,
  entryToAgrochemicalItem,
} from '../services/agrochemicalService';
import { ToxicityBadge } from './ToxicityBadge';
import { useLanguage } from '../../../../src/shared/context/LanguageContext';

interface CropPestInsecticideExplorerProps {
  onSelectChemical: (item: AgrochemicalItem) => void;
  onToast: (title: string, message: string) => void;
}

// Major crops for quick pill selection
const QUICK_CROPS = [
  { name: 'Paddy', icon: '🌾', te: 'వరి' },
  { name: 'Cotton', icon: '☁️', te: 'పత్తి' },
  { name: 'Chilli', icon: '🌶️', te: 'మిరప' },
  { name: 'Tomato', icon: '🍅', te: 'టమాటా' },
  { name: 'Bengal gram', icon: '🫘', te: 'శనగ' },
  { name: 'Maize', icon: '🌽', te: 'మొక్కజొన్న' },
  { name: 'Sugarcane', icon: '🎋', te: 'చెరకు' },
  { name: 'Ground nut', icon: '🥜', te: 'వేరుశనగ' },
  { name: 'Red Gram', icon: '🫘', te: 'కంది' },
  { name: 'Bhendi', icon: '🥬', te: 'బెండ' },
  { name: 'Mango', icon: '🥭', te: 'మామిడి' },
  { name: 'Onion', icon: '🧅', te: 'ఉల్లి' },
  { name: 'Apple', icon: '🍎', te: 'యాపిల్' },
];

export function CropPestInsecticideExplorer({
  onSelectChemical,
  onToast,
}: CropPestInsecticideExplorerProps) {
  const { language, t } = useLanguage();

  const [selectedCrop, setSelectedCrop] = useState<string>('Paddy');
  const [selectedPest, setSelectedPest] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIrac, setSelectedIrac] = useState<string>('all');
  const [selectedToxicity, setSelectedToxicity] = useState<ToxicityBand | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(50);
  const PAGE_SIZE = 50;

  // Master crop list
  const cropList = useMemo(() => getCropList(CROP_PEST_INSECTICIDES_DATA), []);

  // Pests available for current selected crop
  const pestList = useMemo(
    () => getPestListForCrop(CROP_PEST_INSECTICIDES_DATA, selectedCrop),
    [selectedCrop]
  );

  // Available IRAC groups for the current crop/pest selection
  const iracGroups = useMemo(
    () => getAvailableIracGroups(CROP_PEST_INSECTICIDES_DATA, selectedCrop, selectedPest),
    [selectedCrop, selectedPest]
  );

  // Filtered insecticides
  const filteredEntries = useMemo(() => {
    return filterCropPestInsecticides(CROP_PEST_INSECTICIDES_DATA, {
      crop: selectedCrop,
      pest: selectedPest,
      query: searchQuery,
      iracGroup: selectedIrac,
      toxicityBand: selectedToxicity,
    });
  }, [selectedCrop, selectedPest, searchQuery, selectedIrac, selectedToxicity]);

  const visibleEntries = useMemo(
    () => filteredEntries.slice(0, visibleCount),
    [filteredEntries, visibleCount]
  );

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCrop, selectedPest, searchQuery, selectedIrac, selectedToxicity]);

  // Handle crop change: reset pest & irac filters
  const handleCropChange = (newCrop: string) => {
    setSelectedCrop(newCrop);
    setSelectedPest('');
    setSelectedIrac('all');
  };

  const resetAllFilters = () => {
    setSelectedCrop('Paddy');
    setSelectedPest('');
    setSearchQuery('');
    setSelectedIrac('all');
    setSelectedToxicity('all');
  };

  const handleShareWhatsApp = (entry: CropPestInsecticideEntry) => {
    const text = buildCropPestWhatsAppAdvisory(entry, t);
    onToast(
      t('Opening WhatsApp', 'వాట్సాప్ తెరుస్తున్నాము'),
      t('Crop advisory ready to share.', 'పంట సలహా పంపడానికి సిద్ధంగా ఉంది.')
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const currentCropObj = cropList.find((c) => c.name === selectedCrop);
  const currentPestObj = pestList.find((p) => p.name === selectedPest);

  return (
    <div className="space-y-4">
      {/* Selector Control Card */}
      <section className="rounded-2xl border border-rose-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-rose-900/30 dark:bg-slate-900 space-y-4">
        {/* Header & Source Notice */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <Bug className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                {t('Crop & Pest Wise Insecticide Recommendations', 'పంట & పురుగుల వారీగా సిఫార్సు చేయబడిన పురుగుమందులు')}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t(
                  'Official CIB-RC Registered Uses across 68 Crops & 734 Target Pest Combinations',
                  'కేంద్ర పురుగుమందుల బోర్డు (CIB-RC) ఆమోదించిన 68 పంటలు మరియు 734 పురుగుల అధికారిక సిఫార్సులు'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Shield className="h-3 w-3 text-emerald-600" />
              <span>{t('CIB-RC Approved', 'CIB-RC ఆమోదితం')}</span>
            </span>

            {(selectedCrop !== 'Paddy' || selectedPest || searchQuery || selectedIrac !== 'all' || selectedToxicity !== 'all') && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{t('Reset', 'రీసెట్')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Crop Selection */}
        <div className="space-y-2">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Wheat className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <span>{t('Select Crop', 'పంటను ఎంచుకోండి')}</span>
            </label>

            {/* Full 68 Crops Dropdown */}
            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => handleCropChange(e.target.value)}
                className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">{t('All Crops', 'అన్ని పంటలు')}</option>
                {cropList.map((c) => (
                  <option key={c.name} value={c.name}>
                    {language === 'te' ? `${c.nameTe} (${c.name})` : `${c.name} (${c.nameTe})`}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Quick Crop Pills */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {QUICK_CROPS.map((qc) => {
              const isSelected = selectedCrop.toLowerCase() === qc.name.toLowerCase();
              return (
                <button
                  key={qc.name}
                  type="button"
                  onClick={() => handleCropChange(qc.name)}
                  className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition shrink-0 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm">{qc.icon}</span>
                  <span>{language === 'te' ? qc.te : qc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Pest Selection (Dynamic for chosen crop) */}
        {pestList.length > 0 && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Bug className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>{t('Select Pest', 'పురుగును ఎంచుకోండి')}</span>
              </label>

              {/* Full Pests Dropdown */}
              <div className="relative">
                <select
                  value={selectedPest}
                  onChange={(e) => setSelectedPest(e.target.value)}
                  className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">{t('All Pests', 'అన్ని పురుగులు')}</option>
                  {pestList.map((p) => (
                    <option key={p.name} value={p.name}>
                      {language === 'te' ? `${p.nameTe} (${p.name})` : `${p.name} (${p.nameTe})`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Quick Pest Chips */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedPest('')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition shrink-0 ${
                  selectedPest === ''
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span>{t('All Pests', 'అన్ని పురుగులు')}</span>
                <span className="ml-1 rounded-full bg-black/15 dark:bg-white/20 px-1 py-0.5 text-[10px]">
                  {filteredEntries.length}
                </span>
              </button>

              {pestList.slice(0, 10).map((p) => {
                const isSelected = selectedPest.toLowerCase() === p.name.toLowerCase();
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedPest(isSelected ? '' : p.name)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition shrink-0 ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50/80 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    <span>{language === 'te' ? p.nameTe : p.name}</span>
                    <span className="rounded-full bg-rose-200/60 dark:bg-rose-900/60 px-1 py-0.5 text-[10px]">
                      {p.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Filters Bar (Search Query + IRAC Group + Toxicity Band) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search chemical or brand...', 'రసాయనం లేదా బ్రాండ్ వెతకండి...')}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-9 py-1.5 text-xs font-semibold text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* IRAC Resistance Filter */}
          <div className="relative">
            <select
              value={selectedIrac}
              onChange={(e) => setSelectedIrac(e.target.value)}
              className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-1.5 pl-2.5 pr-8 text-xs font-semibold text-slate-800 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">{t('All IRAC Resistance Groups', 'అన్ని IRAC గ్రూపులు')}</option>
              {iracGroups.map((g) => (
                <option key={g.group} value={g.group}>
                  {g.group} — {g.name} ({g.count})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Toxicity Band Filter */}
          <div className="relative">
            <select
              value={selectedToxicity}
              onChange={(e) => setSelectedToxicity(e.target.value as ToxicityBand | 'all')}
              className="appearance-none w-full rounded-xl border border-slate-300 bg-slate-50 py-1.5 pl-2.5 pr-8 text-xs font-semibold text-slate-800 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">{t('All Toxicity Bands', 'అన్ని విష తీవ్రత లేబుల్స్')}</option>
              <option value="green">🟢 {t('Green (Slightly Toxic)', 'ఆకుపచ్చ (స్వల్ప విషం)')}</option>
              <option value="blue">🔵 {t('Blue (Moderately Toxic)', 'నీలం (మధ్యస్థ విషం)')}</option>
              <option value="yellow">🟡 {t('Yellow (Highly Toxic)', 'పసుపు (అత్యధిక విషం)')}</option>
              <option value="red">🔴 {t('Red (Extremely Toxic)', 'ఎరుపు (అత్యంత విషం)')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </section>

      {/* Resistance Management Educational Advisory */}
      <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20 text-xs flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <strong className="font-medium text-amber-900 dark:text-amber-200">
            {t('IRAC Resistance Management Rule', 'IRAC రసాయన నిరోధకత నివారణ సూత్రం')}:
          </strong>{' '}
          <span className="text-amber-800 dark:text-amber-300">
            {t(
              'Never spray insecticides belonging to the same IRAC Group consecutively. Always alternate between different mode-of-action groups (e.g. rotate Group 28 Diamides with Group 4A Neonicotinoids or Group 1B Organophosphates) to prevent pests developing immunity.',
              'ఒకే IRAC గ్రూప్‌కు చెందిన మందులను వరుసగా రెండుసార్లు పిచికారీ చేయకూడదు. పురుగులు రోగనిరోధక శక్తిని పెంచుకోకుండా ఉండటానికి వేర్వేరు రసాయన గ్రూపుల (ఉదా: గ్రూప్ 28 తో పాటు గ్రూప్ 4A లేదా 1B) మందులను మార్చి పిచికారీ చేయాలి.'
            )}
          </span>
        </div>
      </div>

      {/* Results Header Counter */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-bold text-slate-700 dark:text-slate-300">
          {t('Found', 'కనుగొనబడినవి')}{' '}
          <strong className="text-rose-600 dark:text-rose-400 font-medium">{filteredEntries.length}</strong>{' '}
          {t('CIB-RC approved insecticides for', 'ఆమోదిత పురుగుమందులు:')}{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {language === 'te'
              ? `${currentCropObj?.nameTe || selectedCrop} ${selectedPest ? `→ ${currentPestObj?.nameTe || selectedPest}` : ''}`
              : `${currentCropObj?.name || selectedCrop} ${selectedPest ? `→ ${selectedPest}` : ''}`}
          </span>
        </span>

        {filteredEntries.length > 0 && (
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {t('CIB-RC Crop-based Schedule Reference', 'CIB-RC అధికారిక షెడ్యూల్ ఆధారంగా')}
          </span>
        )}
      </div>

      {/* Insecticide Recommendation Cards Grid */}
      {filteredEntries.length > 0 ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleEntries.map((entry) => (
            <article
              key={entry.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-rose-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-600"
            >
              <div>
                {/* Top Badges: Crop & IRAC & Toxicity */}
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950/60 dark:border-rose-900/60 dark:text-rose-300">
                      {entry.crop}
                    </span>
                    {!selectedPest && (
                      <span
                        className="rounded-md bg-rose-50/70 border border-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 truncate max-w-[150px]"
                        title={entry.pest}
                      >
                        {language === 'te' && entry.pestTe ? entry.pestTe : entry.pest}
                      </span>
                    )}
                    <span
                      className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      title={entry.moaGroupName}
                    >
                      {entry.iracGroup}
                    </span>
                  </div>

                  <ToxicityBadge band={entry.toxicityBand} size="sm" />
                </div>

                {/* Insecticide Formulation Name */}
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-400 transition-colors">
                  {language === 'te' ? entry.insecticideTe : entry.insecticide}
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'te' ? entry.insecticide : entry.insecticideTe}
                </p>

                {/* MoA Group Name */}
                <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span className="text-slate-400 dark:text-slate-500 font-bold">{t('MoA', 'కార్యవిధానం')}:</span>
                  <span className="truncate">{entry.moaGroupName}</span>
                </p>

                {/* Popular Indian Market Brands */}
                {entry.popularBrands.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.popularBrands.slice(0, 3).map((brand) => (
                      <span
                        key={brand}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dosage Highlight Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-cyan-200/80 bg-cyan-50/50 p-2.5 dark:border-cyan-900/40 dark:bg-cyan-950/20 text-xs">
                  <div>
                    <span className="text-[10px] font-bold tracking-normal text-cyan-800 dark:text-cyan-400 block">
                      {t('Dose / Acre', 'ఎకరాకు మోతాదు')}
                    </span>
                    <strong className="text-xs font-semibold text-cyan-950 dark:text-cyan-200 block truncate">
                      {entry.calculatedDosePerAcre}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold tracking-normal text-cyan-800 dark:text-cyan-400 block">
                      {t('Pump Dose (15L)', 'పంపుకు మోతాదు')}
                    </span>
                    <strong className="text-xs font-semibold text-cyan-950 dark:text-cyan-200 block truncate">
                      {entry.calculatedDosePerPump}
                    </strong>
                  </div>
                </div>

                {/* CIB-RC Official Metric */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                  <span>
                    <strong>CIB-RC:</strong> {entry.formulationDosePerHa} {entry.sprayFluidPerHa ? `in ${entry.sprayFluidPerHa}L` : ''}
                  </span>
                  <span>
                    <strong>PHI:</strong> {entry.waitingPeriodDays} {t('days', 'రోజులు')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectChemical(entryToAgrochemicalItem(entry))}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-1.5 px-2 text-xs font-semibold text-slate-800 transition dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  <Info className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  <span>{t('Details & Safety', 'పూర్తి వివరాలు')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(entry)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 text-xs font-semibold transition shadow-xs"
                  title="Share advisory on WhatsApp"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </article>
          ))}
        </div>
        {filteredEntries.length > visibleCount && (
          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-5 py-2.5 text-sm font-black text-rose-800 shadow-sm transition hover:bg-rose-50 hover:border-rose-400 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-slate-800"
            >
              {t('Load More', 'మరిన్ని లోడ్ చేయండి')} ({filteredEntries.length - visibleCount} {t('remaining', 'మిగిలి ఉన్నాయి')})
            </button>
          </div>
        )}
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 mb-3">
            <Bug className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('No Registered Insecticides Found', 'సిఫార్సు పురుగుమందులు ఏవీ కనుగొనబడలేదు')}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t(
              'No approved insecticides match the chosen crop, pest, or search filter. Try clearing filters or selecting another pest.',
              'ఎంచుకున్న పంట లేదా పురుగుకు సరిపోలే రసాయనాలు లేవు. ఫిల్టర్లను రీసెట్ చేసి వేరే పురుగును ఎంచుకోండి.'
            )}
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t('Reset Filters', 'ఫిల్టర్లను రీసెట్ చేయండి')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
