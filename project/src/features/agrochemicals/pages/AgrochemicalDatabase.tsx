import React, { useEffect, useMemo, useState } from 'react';
import {
  Bug,
  Flame,
  FlaskConical,
  Leaf,
  RotateCcw,
  Search,
  Sprout,
  X,
} from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { useAuth } from '../../../shared/context/AuthContext';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { type AgrochemicalCategory, type AgrochemicalItem } from '../types';
import { AGROCHEMICALS_DATA } from '../data/agrochemicalsData';
import {
  filterAgrochemicals,
  getCategoryCounts,
  getAvailableLetters,
} from '../services/agrochemicalService';
import { AgrochemicalCard } from '../components/AgrochemicalCard';
import { AgrochemicalDetailModal } from '../components/AgrochemicalDetailModal';
import { CropPestInsecticideExplorer } from '../components/CropPestInsecticideExplorer';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function AgrochemicalDatabase() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const { user, isAdminUser, isTestUser, isOfficerUser } = useAuth();
  const showCompactHeader = !user || isAdminUser || isTestUser || isOfficerUser;
  const { toasts, removeToast, showSuccess } = useToast();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AgrochemicalCategory>('insecticide');
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [activeItem, setActiveItem] = useState<AgrochemicalItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const PAGE_SIZE = 50;

  // Available letters and category counts
  const categoryCounts = useMemo(() => getCategoryCounts(AGROCHEMICALS_DATA), []);
  const availableLetters = useMemo(() => new Set(getAvailableLetters(AGROCHEMICALS_DATA)), []);

  // Filtered chemicals
  const filteredChemicals = useMemo(() => {
    return filterAgrochemicals(AGROCHEMICALS_DATA, {
      query,
      category: selectedCategory,
      letter: selectedLetter,
    });
  }, [query, selectedCategory, selectedLetter]);

  const visibleChemicals = useMemo(
    () => filteredChemicals.slice(0, visibleCount),
    [filteredChemicals, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, selectedCategory, selectedLetter]);

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedLetter('');
  };

  const hasActiveFilters = query.trim() !== '' || selectedCategory !== 'all' || selectedLetter !== '';

  return (
    <div className="space-y-4 print:space-y-2">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Detail Modal */}
      <AgrochemicalDetailModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onToast={showSuccess}
      />

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 sm:px-6 lg:px-8 print:hidden">
        {showCompactHeader ? (
          <ModulePageHeader
            className="mb-4"
            title={t('Agrochemicals Database', 'వ్యవసాయ రసాయనాల భాండాగారం')}
            subtitle={t(
              'CIB&RC approved pesticides, insecticides, fungicides & herbicides with registered crops, target pests, dosages, waiting periods & antidote info.',
              'సిఐబి&ఆర్‌సి ఆమోదించిన పురుగుమందులు, తెగుళ్ల మందులు, కలుపు మందుల సమగ్ర సమాచారం.'
            )}
            icon={FlaskConical}
            onBack={!user ? () => navigate('/dashboard') : undefined}
            actions={!user ? <LanguageToggle language={language} onClick={toggleLanguage} accent="teal" /> : undefined}
          />
        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-teal-300/60 bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800 p-3.5 sm:p-4 text-white shadow-md dark:border-teal-700/60">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                <BackButton onClick={() => navigate('/dashboard')} tone="solid" className="mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white shadow-sm ring-1 ring-white/25 backdrop-blur-xs mt-0.5">
                      <FlaskConical className="h-5 w-5 sm:h-[22px] sm:w-[22px] text-white" aria-label="Agrochemicals Database" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-teal-100 mb-0.5">
                        {t('Agriculture Portal', 'వ్యవసాయ పోర్టల్')}
                      </p>
                      <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug tracking-tight">
                        {t('Agrochemicals Database', 'వ్యవసాయ రసాయనాల భాండాగారం')}
                      </h1>
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                        {t(
                          'CIB&RC approved pesticides, insecticides, fungicides & herbicides with registered crops, target pests, dosages, waiting periods & antidote info.',
                          'సిఐబి&ఆర్‌సి ఆమోదించిన పురుగుమందులు, తెగుళ్ల మందులు, కలుపు మందుల సమగ్ర సమాచారం.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start pt-1">
                <LanguageToggle language={language} onClick={toggleLanguage} tone="solid" />
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-12 sm:px-6 lg:px-8">
        {/* Search Bar & Category Filters */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3.5">
          {/* Top Row: Search Input (shown when browsing general chemicals) */}
          {selectedCategory !== 'insecticide' && (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(
                  'Search by chemical name, brand (e.g. Coragen), pest, crop, or IRAC group...',
                  'రసాయనం పేరు, బ్రాండ్ (ఉదా: కోరాజెన్), పురుగు, పంట లేదా IRAC గ్రూప్ ద్వారా వెతకండి...'
                )}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-10 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 shadow-2xs transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

            {/* Category Tabs with live counts */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span>{t('All Chemicals', 'అన్ని రసాయనాలు')}</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {categoryCounts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('insecticide')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === 'insecticide'
                    ? 'bg-rose-600 text-white shadow-xs shadow-rose-950/20'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                <Bug className="h-3.5 w-3.5" />
                <span>{t('Insecticides', 'పురుగుమందులు')}</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  732
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('fungicide')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === 'fungicide'
                    ? 'bg-purple-600 text-white shadow-xs shadow-purple-950/20'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>{t('Fungicides', 'శిలీంద్ర సంహారిణులు')}</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {categoryCounts.fungicide}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('weedicide')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === 'weedicide'
                    ? 'bg-amber-600 text-white shadow-xs shadow-amber-950/20'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                <Leaf className="h-3.5 w-3.5" />
                <span>{t('Weedicides', 'కలుపుమందులు')}</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {categoryCounts.weedicide}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('fertilizer')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === 'fertilizer'
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-950/20'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                <Sprout className="h-3.5 w-3.5" />
                <span>{t('Fertilizers (FCO)', 'ఎరువులు & పోషకాలు')}</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {categoryCounts.fertilizer}
                </span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t('Reset', 'రీసెట్')}</span>
                </button>
              )}
            </div>

            {/* A–Z Quick Jump Bar (Shown only in standard categories) */}
            {selectedCategory !== 'insecticide' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-thin">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0">
                  {t('A–Z Filter', 'అక్షరం')}:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLetter('')}
                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] shrink-0 transition ${
                    selectedLetter === ''
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {t('All', 'అన్నీ')}
                </button>

                {ALPHABET.map((letter) => {
                  const isAvailable = availableLetters.has(letter);
                  const isSelected = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedLetter(letter)}
                      className={`w-6 h-6 rounded-md font-bold text-[11px] shrink-0 flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs'
                          : isAvailable
                          ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                          : 'text-slate-300 cursor-not-allowed dark:text-slate-600'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            )}
        </section>

        {/* Conditional View: Crop & Pest Wise Explorer vs Standard Cards Grid */}
        {selectedCategory === 'insecticide' ? (
          <CropPestInsecticideExplorer
            onSelectChemical={(selected) => setActiveItem(selected)}
            onToast={showSuccess}
          />
        ) : (
          <>
            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-slate-600 dark:text-slate-400">
                {t('Showing', 'చూపిస్తున్నవి')}{' '}
                <strong className="text-slate-900 dark:text-white font-black">{visibleChemicals.length}</strong>
                {' '}
                {t('of', 'నుండి')}{' '}
                <strong className="text-slate-900 dark:text-white font-black">{filteredChemicals.length}</strong>{' '}
                {t('registered chemicals', 'నమోదిత రసాయనాలు')}
              </span>

              {selectedLetter && (
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                  {t('Letter', 'అక్షరం')}: {selectedLetter}
                </span>
              )}
            </div>

            {/* Responsive Cards Grid */}
            {filteredChemicals.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visibleChemicals.map((item) => (
                    <AgrochemicalCard
                      key={item.id}
                      item={item}
                      onSelect={(selected) => setActiveItem(selected)}
                    />
                  ))}
                </div>
                {filteredChemicals.length > visibleCount && (
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      className="inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-white px-5 py-2.5 text-sm font-black text-teal-800 shadow-sm transition hover:bg-teal-50 hover:border-teal-400 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-slate-800"
                    >
                      {t('Load More', 'మరిన్ని లోడ్ చేయండి')} ({filteredChemicals.length - visibleCount} {t('remaining', 'మిగిలి ఉన్నాయి')})
                    </button>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {t('Showing', 'చూపిస్తున్నవి')} {visibleChemicals.length} {t('of', 'నుండి')} {filteredChemicals.length}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 mb-3">
                  <FlaskConical className="h-7 w-7" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t('No Agrochemicals Found', 'రసాయనాలు ఏవీ కనుగొనబడలేదు')}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t(
                    'No chemicals match your current search query or letter filter. Try clearing filters or searching by different trade names.',
                    'మీరు వెతికిన పదానికి లేదా ఎంచుకున్న అక్షరానికి సరిపోలే రసాయనాలు లేవు. ఫిల్టర్లను రీసెట్ చేసి మళ్లీ ప్రయత్నించండి.'
                  )}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-teal-700 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{t('Reset All Filters', 'అన్ని ఫిల్టర్లను రీసెట్ చేయండి')}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
