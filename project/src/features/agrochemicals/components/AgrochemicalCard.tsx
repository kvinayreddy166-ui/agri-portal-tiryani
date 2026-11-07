import React from 'react';
import {
  Bug,
  Clock,
  Droplets,
  ExternalLink,
  Flame,
  Leaf,
  Sprout,
  Wheat,
} from 'lucide-react';
import { type AgrochemicalItem } from '../types';
import { ToxicityBadge } from './ToxicityBadge';
import { useLanguage } from '../../../../src/shared/context/LanguageContext';

interface AgrochemicalCardProps {
  item: AgrochemicalItem;
  onSelect: (item: AgrochemicalItem) => void;
}

export function AgrochemicalCard({ item, onSelect }: AgrochemicalCardProps) {
  const { t } = useLanguage();

  const categoryTheme = {
    insecticide: {
      badge: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300',
      icon: Bug,
      accentBorder: 'hover:border-rose-400 dark:hover:border-rose-600',
      moaBadge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
    },
    fungicide: {
      badge: 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300',
      icon: Flame,
      accentBorder: 'hover:border-purple-400 dark:hover:border-purple-600',
      moaBadge: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
    },
    weedicide: {
      badge: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300',
      icon: Leaf,
      accentBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
      moaBadge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    },
    fertilizer: {
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300',
      icon: Sprout,
      accentBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
      moaBadge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
  }[item.category];

  const CategoryIcon = categoryTheme.icon;

  return (
    <article
      onClick={() => onSelect(item)}
      className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${categoryTheme.accentBorder}`}
    >
      <div>
        {/* Top Header: Category & MoA Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <span
            className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${categoryTheme.badge}`}
          >
            <CategoryIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t(item.category, item.categoryTe)}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {item.verificationStatus === 'VERIFIED' && (
              <span
                className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                title="CIB&RC Level 1 Verified Label Claims"
              >
                ✓ CIB-RC
              </span>
            )}
            <span
              className={`inline-flex max-w-[9rem] items-center truncate rounded-md border px-2 py-0.5 text-[10px] font-black ${categoryTheme.moaBadge}`}
              title={item.moaGroupName}
            >
              {item.moaGroup}
            </span>
          </div>
        </div>

        {/* Chemical Title & Telugu Name */}
        <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
          {item.name}
        </h3>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {item.nameTe}
        </p>

        {/* Trade/Brand Names */}
        {item.popularBrands.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {item.popularBrands.slice(0, 3).map((brand) => (
              <span
                key={brand}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {brand}
              </span>
            ))}
            {item.popularBrands.length > 3 && (
              <span className="text-[10px] font-semibold text-slate-400 self-center">
                +{item.popularBrands.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Target Crops & Pests Snippet */}
        <div className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800 text-xs">
          <div className="flex items-start gap-1.5">
            <Wheat className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-slate-700 dark:text-slate-300 text-[11px] line-clamp-1 font-medium">
              <strong className="font-bold text-slate-900 dark:text-slate-200">{t('Crops', 'పంటలు')}:</strong>{' '}
              {item.targetCrops.join(', ')}
            </span>
          </div>

          <div className="flex items-start gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-cyan-600 shrink-0 mt-0.5" />
            <span className="text-slate-700 dark:text-slate-300 text-[11px] line-clamp-1 font-medium">
              <strong className="font-bold text-slate-900 dark:text-slate-200">{t('Dose', 'మోతాదు')}:</strong>{' '}
              {item.dosagePerAcre}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info: PHI & Toxicity / Action */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
        {item.category !== 'fertilizer' && item.waitingPeriodDays !== 'N/A' ? (
          <div className="flex min-w-0 items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span className="truncate">
              {item.waitingPeriodDays} {t('days PHI', 'రోజుల నిరీక్షణ')}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            {t('FCO Standard', 'FCO ప్రమాణం')}
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <ToxicityBadge band={item.toxicityBand} size="sm" showIcon={false} />
          <span className="text-slate-400 group-hover:text-emerald-600 transition">
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
