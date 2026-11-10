import React, { useMemo, useState } from 'react';
import { Target, Hash, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { useTargetAllocations, type TargetAllocation } from '../../../shared/hooks/useTargetAllocations';

const COMMODITY_LABELS: Record<string, { en: string; te: string }> = {
  fertilizer: { en: 'Fertilizer', te: 'ఎరువులు' },
  seed: { en: 'Seed', te: 'విత్తనాలు' },
  pesticide: { en: 'Pesticide', te: 'పురుగుమందులు' },
};

function allocationLabel(a: TargetAllocation, t: (en: string, te: string) => string): string {
  const commodity = COMMODITY_LABELS[a.commodity] || { en: a.commodity, te: a.commodity };
  if (a.code_number) {
    return t(`Sample code ${a.code_number}`, `నమూనా కోడ్ ${a.code_number}`);
  }
  return t(
    `${commodity.en} target: ${a.numeric_target} samples`,
    `${commodity.te} లక్ష్యం: ${a.numeric_target} నమూనాలు`
  );
}

export function OfficerTargetsCard() {
  const { t } = useLanguage();
  const { officerProfile, isAdminUser } = useAuth();
  const { allocations, loading, refresh } = useTargetAllocations();
  const [expanded, setExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isDno = (officerProfile?.designation || '').toUpperCase() === 'DNO';
  const canDelete = isDno || isAdminUser;

  const visible = useMemo(() => {
    // Officers see everything RLS returns; DNOs mainly care about what they
    // allocated, so surface those first.
    const sorted = [...allocations].sort((a, b) => {
      if (isDno) {
        const aMine = a.allocated_by === officerProfile?.id ? 0 : 1;
        const bMine = b.allocated_by === officerProfile?.id ? 0 : 1;
        if (aMine !== bMine) return aMine - bMine;
      }
      return b.created_at.localeCompare(a.created_at);
    });
    return expanded ? sorted : sorted.slice(0, 8);
  }, [allocations, expanded, isDno, officerProfile?.id]);

  if (!officerProfile || allocations.length === 0) return null;

  const removeAllocation = async (id: string) => {
    setDeletingId(id);
    try {
      await supabase.from('officer_target_allocations').delete().eq('id', id);
      await refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard-rise dashboard-delay-2 portal-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white font-[var(--font-heading)]">
          <Target className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          {isDno ? t('Target Allocations', 'లక్ష్యాల కేటాయింపులు') : t('Allocated Targets', 'కేటాయించిన లక్ష్యాలు')}
        </h2>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          {allocations.length}
        </span>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {visible.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">
                <Hash className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">{allocationLabel(a, t)}</span>
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {a.financial_year} · {t(COMMODITY_LABELS[a.commodity]?.en || a.commodity, COMMODITY_LABELS[a.commodity]?.te || a.commodity)}
                {' · '}{a.mandal}
                {a.officer_name ? ` · ${a.officer_name}` : ''}
                {a.allocated_by_name ? ` · ${t('by', 'ద్వారా')} ${a.allocated_by_name}` : ''}
              </p>
            </div>
            {canDelete && (
              <button
                type="button"
                onClick={() => removeAllocation(a.id)}
                disabled={deletingId === a.id}
                title={t('Delete allocation', 'కేటాయింపు తొలగించండి')}
                className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {loading && <p className="py-2 text-center text-[11px] font-semibold text-slate-400">{t('Loading…', 'లోడ్ అవుతోంది…')}</p>}

      {allocations.length > 8 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? t('Show less', 'తక్కువ చూపించు') : t(`Show all ${allocations.length}`, `అన్నీ ${allocations.length} చూపించు`)}
        </button>
      )}
    </div>
  );
}
