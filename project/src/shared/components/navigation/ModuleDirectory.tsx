import React, { useMemo, useState } from 'react';
import { Search, Pin, Clock, X, ChevronRight, LayoutGrid } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getVisibleModuleItems, moduleSections, translateMenu, type ModuleMenuItem } from '../../data/modules';
import { getPinnedModules, getRecentModules, togglePinnedModule } from '../../lib/modulePrefs';

interface ModuleDirectoryProps {
  currentPage: string;
  isAdminUser: boolean;
  onNavigate: (page: string) => void;
}

export function ModuleDirectory({ currentPage, isAdminUser, onNavigate }: ModuleDirectoryProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState<string[]>(() => getPinnedModules());

  const items = useMemo(() => getVisibleModuleItems(isAdminUser), [isAdminUser]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const sections = useMemo(() => moduleSections(items, t), [items, t]);
  const recents = useMemo(
    () => getRecentModules().map((id) => itemById.get(id)).filter((i): i is ModuleMenuItem => Boolean(i)),
    [itemById]
  );
  const pinnedItems = useMemo(
    () => pinned.map((id) => itemById.get(id)).filter((i): i is ModuleMenuItem => Boolean(i)),
    [pinned, itemById]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return null;
    return items.filter((item) =>
      [item.label, item.desc, item.descTe, translateMenu(item.label)]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [items, normalizedQuery]);

  const handlePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPinned(togglePinnedModule(id));
  };

  const renderCard = (item: ModuleMenuItem, compact = false) => {
    const isActive = currentPage === item.id;
    const isPinned = pinned.includes(item.id);
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative flex w-full items-start gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 dark:bg-slate-900 dark:hover:border-emerald-700 dark:focus-visible:ring-emerald-900/50 ${
          isActive ? 'border-emerald-500 ring-1 ring-emerald-500 dark:border-emerald-500' : 'border-slate-200 dark:border-slate-800'
        } ${compact ? 'p-2.5' : ''}`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isActive
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:group-hover:bg-emerald-900/60'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={`truncate text-[13px] font-black ${isActive ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-100'}`}>
              {t(item.label, translateMenu(item.label))}
            </span>
          </span>
          {!compact && (
            <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {t(item.desc, item.descTe)}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1 self-center">
          <button
            type="button"
            onClick={(e) => handlePin(e, item.id)}
            aria-label={isPinned ? t('Unpin module', 'మాడ్యూల్ పిన్ తీసివేయండి') : t('Pin module', 'మాడ్యూల్ పిన్ చేయండి')}
            aria-pressed={isPinned}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
              isPinned
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400'
            }`}
          >
            <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-current' : ''}`} />
          </button>
          <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500 dark:text-slate-600" />
        </span>
      </button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-900/20">
          <LayoutGrid className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {t('All Modules', 'అన్ని మాడ్యూల్‌లు')}
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t(`${items.length} modules available`, `${items.length} మాడ్యూల్‌లు అందుబాటులో ఉన్నాయి`)}
          </p>
        </div>
      </div>

      <div className="sticky top-2 z-20 mb-4">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-emerald-600 dark:focus-within:ring-emerald-900/40">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search modules…', 'మాడ్యూల్‌లను వెతకండి…')}
            aria-label={t('Search modules', 'మాడ్యూల్‌లను వెతకండి')}
            className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('Clear search', 'వెతుకు క్లియర్ చేయండి')}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {results ? (
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t(`${results.length} result${results.length === 1 ? '' : 's'}`, `${results.length} ఫలితాలు`)}
          </p>
          {results.length ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{results.map((item) => renderCard(item))}</div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <Search className="mx-auto mb-2 h-6 w-6 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t('No modules found', 'మాడ్యూల్‌లు కనుగొనబడలేదు')}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{t('Try a different keyword', 'వేరే కీ్వర్డ్ ప్రయత్నించండి')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {pinnedItems.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Pin className="h-3.5 w-3.5" /> {t('Pinned', 'పిన్ చేసినవి')}
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{pinnedItems.map((item) => renderCard(item))}</div>
            </section>
          )}

          {recents.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Clock className="h-3.5 w-3.5" /> {t('Recently used', 'ఇటీవల ఉపయోగించినవి')}
              </h2>
              <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recents.map((item) => {
                  const isActive = currentPage === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className={`flex w-36 shrink-0 items-center gap-2.5 rounded-2xl border bg-white p-2.5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 dark:bg-slate-900 dark:hover:border-emerald-700 dark:focus-visible:ring-emerald-900/50 ${
                        isActive ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-black text-slate-800 dark:text-slate-100">
                          {t(item.label, translateMenu(item.label))}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{section.items.map((item) => renderCard(item))}</div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
