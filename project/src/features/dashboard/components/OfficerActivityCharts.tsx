import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BarChart3, Loader2, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import {
  EnforcementTrackerService,
  type EnforcementData,
} from '../../officers-toolkit/services/enforcementTrackerService';
import { currentFinancialYear, dateInFinancialYear } from '../../../shared/utils/financialYear';
import type { TargetAllocation } from '../../../shared/hooks/useTargetAllocations';
import type { SampleCommodity } from '../../../shared/hooks/useSampleTargets';

const LazyStackedBarChart = lazy(() =>
  import('../../../shared/components/charts/StackedBarChart').then((module) => ({
    default: module.StackedBarChart,
  }))
);

const ALLOCATION_COLUMNS =
  'id, allocated_by, allocated_by_name, officer_id, officer_name, mandal, district, commodity, financial_year, numeric_target, code_number, created_at';

const COMMODITIES: { id: SampleCommodity; label: string; telugu: string; bar: string }[] = [
  { id: 'fertilizer', label: 'Fertilizer', telugu: 'ఎరువులు', bar: 'bg-emerald-500' },
  { id: 'seed', label: 'Seed', telugu: 'విత్తనాలు', bar: 'bg-amber-500' },
  { id: 'pesticide', label: 'Pesticide', telugu: 'పురుగుమందులు', bar: 'bg-sky-500' },
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Officer-only dashboard section: a 6-month enforcement activity chart
 * (inspections / samples / orders) and a target-progress card showing how
 * much of each commodity's allocated target the officer has completed.
 */
export function OfficerActivityCharts() {
  const { t } = useLanguage();
  const { isOfficerUser, user } = useAuth();
  const [data, setData] = useState<EnforcementData | null>(null);
  const [allocations, setAllocations] = useState<TargetAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isOfficerUser || !user) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    Promise.all([
      EnforcementTrackerService.fetchAll(),
      supabase
        .from('officer_target_allocations')
        .select(ALLOCATION_COLUMNS)
        .order('financial_year', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(2000)
        .then(({ data: rows, error }) => {
          if (error) throw error;
          return (rows || []) as TargetAllocation[];
        }),
    ])
      .then(([enforcement, allocs]) => {
        if (cancelled) return;
        setData(enforcement);
        setAllocations(allocs);
      })
      .catch((error) => {
        console.error('Failed to load officer activity charts:', error);
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOfficerUser, user]);

  const monthlyActivity = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    const rows = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        month: `${MONTHS_SHORT[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        inspections: 0,
        samples: 0,
        orders: 0,
      };
    });
    const indexByKey = new Map(rows.map((row, index) => [row.key, index]));
    const bump = (dateValue: string | undefined | null, field: 'inspections' | 'samples' | 'orders') => {
      const index = indexByKey.get(String(dateValue || '').slice(0, 7));
      if (index !== undefined) rows[index][field] += 1;
    };
    data.inspections.forEach((item) => bump(item.inspection_date, 'inspections'));
    data.samples.forEach((item) => bump(item.date_of_sampling, 'samples'));
    data.orders.forEach((item) => bump(item.order_date, 'orders'));
    return rows.map(({ key: _key, ...row }) => row);
  }, [data]);

  const hasMonthlyActivity = monthlyActivity.some(
    (row) => row.inspections > 0 || row.samples > 0 || row.orders > 0
  );

  const financialYear = currentFinancialYear();
  const targetProgress = useMemo(() => {
    const fyAllocations = allocations.filter((a) => a.financial_year === financialYear);
    const sampleCodes = new Set(
      (data?.samples ?? [])
        .map((s) => String(s.sample_code || '').trim().toLowerCase())
        .filter(Boolean)
    );
    const fySamples = (data?.samples ?? []).filter((s) =>
      dateInFinancialYear(s.date_of_sampling, financialYear)
    );

    return COMMODITIES.map((commodity) => {
      const rows = fyAllocations.filter((a) => a.commodity === commodity.id);
      const numericTarget = rows.reduce((sum, a) => sum + (a.numeric_target ?? 0), 0);
      const codes = Array.from(
        new Set(rows.map((a) => String(a.code_number || '').trim()).filter(Boolean))
      );
      const codesDone = codes.filter((code) => sampleCodes.has(code.toLowerCase())).length;
      const commoditySamples = fySamples.filter((s) => s.commodity === commodity.id).length;
      const achieved = Math.min(commoditySamples, numericTarget) + codesDone;
      const target = numericTarget + codes.length;
      return {
        ...commodity,
        achieved,
        target,
        percent: target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0,
        codesDone,
        codesTotal: codes.length,
      };
    }).filter((row) => row.target > 0);
  }, [allocations, data, financialYear]);

  if (!isOfficerUser) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-black text-emerald-900 dark:text-emerald-200">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            {t('Enforcement activity — last 6 months', 'అమలు కార్యకలాపాలు — గత 6 నెలలు')}
          </h3>
          <Link
            to="/officer-toolkit/enforcement-tracker"
            className="text-[10px] font-bold text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            {t('Open tracker', 'ట్రాకర్ తెరవండి')} →
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-xs font-semibold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Loading activity…', 'కార్యకలాపాలు లోడ్ అవుతున్నాయి…')}
          </div>
        ) : loadError ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-500">
            {t('Could not load activity data.', 'కార్యకలాపాల డేటా లోడ్ కాలేదు.')}
          </p>
        ) : !hasMonthlyActivity ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-500">
            {t('No enforcement activity recorded yet.', 'ఇంకా అమలు కార్యకలాపాలు నమోదు కాలేదు.')}
          </p>
        ) : (
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center text-xs font-semibold text-slate-400">
                {t('Loading chart…', 'చార్ట్ లోడ్ అవుతోంది…')}
              </div>
            }
          >
            <LazyStackedBarChart
              data={monthlyActivity}
              xKey="month"
              bars={[
                { key: 'inspections', label: t('Inspections', 'తనిఖీలు') },
                { key: 'samples', label: t('Samples', 'నమూనాలు') },
                { key: 'orders', label: t('Orders', 'ఆర్డర్లు') },
              ]}
              height={240}
              minWidth={420}
            />
          </Suspense>
        )}
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-black text-emerald-900 dark:text-emerald-200">
            <Target className="h-4 w-4 text-emerald-600" />
            {t(`Target progress — FY ${financialYear}`, `లక్ష్య పురోగతి — ఋ. ${financialYear}`)}
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-xs font-semibold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Loading targets…', 'లక్ష్యాలు లోడ్ అవుతున్నాయి…')}
          </div>
        ) : loadError ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-500">
            {t('Could not load target data.', 'లక్ష్యాల డేటా లోడ్ కాలేదు.')}
          </p>
        ) : targetProgress.length === 0 ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-500">
            {t(`No targets allocated for FY ${financialYear}.`, `ఋ. ${financialYear} కోసం లక్ష్యాలు కేటాయించబడలేదు.`)}
          </p>
        ) : (
          <div className="space-y-4">
            {targetProgress.map((row) => (
              <div key={row.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                    {t(row.label, row.telugu)}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {row.achieved}/{row.target}
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                        row.percent >= 100
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : row.percent >= 50
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {row.percent >= 100 && <TrendingUp className="h-2.5 w-2.5" />}
                      {row.percent}%
                    </span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all ${row.bar}`}
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
                {row.codesTotal > 0 && (
                  <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {t(
                      `${row.codesDone}/${row.codesTotal} allocated sample codes completed`,
                      `${row.codesTotal} కేటాయించిన నమూనా కోడ్‌లలో ${row.codesDone} పూర్తయ్యాయి`
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
