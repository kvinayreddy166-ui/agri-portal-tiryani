import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Briefcase, CalendarClock, FlaskConical, Scale, Search, X } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import {
  EnforcementTrackerService,
  normalizeDealerName,
  type EnforcementData,
  type DealerScorecard,
} from '../services/enforcementTrackerService';
import type { StatutoryCommodity } from '../../auth/types/officerAuth';

const COMMODITY_LABELS: Record<StatutoryCommodity | 'mixed', { en: string; te: string }> = {
  fertilizer: { en: 'Fertilizer', te: 'ఎరువు' },
  pesticide: { en: 'Pesticide', te: 'పురుగుమందు' },
  seed: { en: 'Seed', te: 'విత్తనం' },
  mixed: { en: 'Mixed', te: 'మిశ్రమం' },
};

const RISK_STYLES: Record<DealerScorecard['riskLevel'], string> = {
  LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const LAB_STATUS_LABELS: Record<string, { en: string; te: string }> = {
  DRAFT: { en: 'Draft', te: 'డ్రాఫ్ట్' },
  DISPATCHED: { en: 'Dispatched', te: 'పంపబడింది' },
  RECEIVED_LAB: { en: 'At Lab', te: 'ల్యాబ్‌లో' },
  TEST_PASSED: { en: 'Passed', te: 'పాస్' },
  TEST_FAILED: { en: 'Failed', te: 'ఫెయిల్' },
};

interface DealerProfileDrawerProps {
  dealerName: string;
  data: EnforcementData;
  onClose: () => void;
}

/**
 * Aggregates every tracker record for one dealer — inspections, orders,
 * samples and cases — into a single 360° profile drawer.
 */
export function DealerProfileDrawer({ dealerName, data, onClose }: DealerProfileDrawerProps) {
  const { t } = useLanguage();
  const key = normalizeDealerName(dealerName);

  const profile = useMemo(() => {
    const matches = (name: string | undefined | null) => normalizeDealerName(name ?? '') === key;

    const inspections = data.inspections.filter((i) => matches(i.firm_name));
    const orders = data.orders.filter((o) => matches(o.firm_name));
    const samples = data.samples.filter((s) => matches(s.firm_name));
    const cases = data.cases.filter((c) => matches(c.dealer_name));

    const scorecard = EnforcementTrackerService.buildDealerScorecards(data).find(
      (s) => normalizeDealerName(s.dealerName) === key
    );

    return { inspections, orders, samples, cases, scorecard };
  }, [data, key]);

  // Cases group the raw records below — counting them here would double-count
  // the same activity (a sample appears once as a sample and once via its case).
  const totalRecords =
    profile.inspections.length + profile.orders.length + profile.samples.length;

  return (
    <div className="fixed inset-0 z-[96] flex justify-end bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              {t('Dealer 360° Profile', 'డీలర్ 360° ప్రొఫైల్')}
            </p>
            <h3 className="mt-0.5 truncate text-base font-black text-slate-900 dark:text-white">{dealerName}</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              {totalRecords} {t('total records', 'మొత్తం రికార్డులు')}
              {profile.scorecard && (
                <>
                  {' · '}
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase ${RISK_STYLES[profile.scorecard.riskLevel]}`}>
                    {profile.scorecard.riskLevel} · {profile.scorecard.riskScore}
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t('Close', 'మూసివేయి')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Scorecard strip */}
          {profile.scorecard && (
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
              {[
                { label: t('Inspections', 'తనిఖీలు'), value: profile.scorecard.inspections },
                { label: t('Orders', 'ఆర్డర్లు'), value: profile.scorecard.orders },
                { label: t('Show Cause', 'షో కారణం'), value: profile.scorecard.showCause },
                { label: t('Seizures', 'సీజర్లు'), value: profile.scorecard.seizures },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-slate-50 px-1 py-1.5 dark:bg-slate-800/60">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{m.value}</p>
                  <p className="text-slate-400">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Cases */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Briefcase className="h-3.5 w-3.5" />
              {t('Cases', 'కేసులు')} ({profile.cases.length})
            </h4>
            {profile.cases.length === 0 ? (
              <p className="text-[11px] font-semibold text-slate-400">{t('No cases', 'కేసులు లేవు')}</p>
            ) : (
              <ul className="space-y-1.5">
                {profile.cases.map((c) => (
                  <li key={c.id} className="rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
                    <p className="font-mono text-[10px] font-bold text-slate-400">{c.case_number}</p>
                    <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">
                      {c.stage} · {t(COMMODITY_LABELS[c.commodity].en, COMMODITY_LABELS[c.commodity].te)} · {c.opened_date}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Orders */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Scale className="h-3.5 w-3.5" />
              {t('Orders & Notices', 'ఆర్డర్లు & నోటీసులు')} ({profile.orders.length})
            </h4>
            {profile.orders.length === 0 ? (
              <p className="text-[11px] font-semibold text-slate-400">{t('No orders', 'ఆర్డర్లు లేవు')}</p>
            ) : (
              <ul className="space-y-1.5">
                {profile.orders.map((o) => (
                  <li key={o.id} className="rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {o.order_number} · {o.order_type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                      {o.order_date} · {t(COMMODITY_LABELS[o.commodity].en, COMMODITY_LABELS[o.commodity].te)}
                      {o.reply_deadline ? ` · ${t('reply by', 'గడువు')} ${o.reply_deadline}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Samples */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <FlaskConical className="h-3.5 w-3.5" />
              {t('Samples', 'నమూనాలు')} ({profile.samples.length})
            </h4>
            {profile.samples.length === 0 ? (
              <p className="text-[11px] font-semibold text-slate-400">{t('No samples', 'నమూనాలు లేవు')}</p>
            ) : (
              <ul className="space-y-1.5">
                {profile.samples.map((s) => (
                  <li key={s.id} className="rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.sample_code}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                      {s.date_of_sampling} · {t(COMMODITY_LABELS[s.commodity].en, COMMODITY_LABELS[s.commodity].te)} ·{' '}
                      {t(LAB_STATUS_LABELS[s.lab_status]?.en ?? s.lab_status, LAB_STATUS_LABELS[s.lab_status]?.te ?? s.lab_status)}
                      {s.lab_report_ref ? ` · ${s.lab_report_ref}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Inspections */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Search className="h-3.5 w-3.5" />
              {t('Inspections', 'తనిఖీలు')} ({profile.inspections.length})
            </h4>
            {profile.inspections.length === 0 ? (
              <p className="text-[11px] font-semibold text-slate-400">{t('No inspections', 'తనిఖీలు లేవు')}</p>
            ) : (
              <ul className="space-y-1.5">
                {profile.inspections.map((i) => (
                  <li key={i.id} className="rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {i.inspection_type.toUpperCase()} · {i.license_number || '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{i.inspection_date}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {profile.scorecard && profile.scorecard.samplesFailed > 0 && (
            <p className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {profile.scorecard.samplesFailed} {t('failed sample(s) on record — consider enforcement action.', 'ఫెయిల్ అయిన నమూనాలు ఉన్నాయి — అమలు చర్యను పరిగణించండి.')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          <Link
            to={`/officer-toolkit/enforcement-tracker?tab=scorecards`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {t('Open in Enforcement Tracker', 'అమలు ట్రాకర్‌లో తెరవండి')}
          </Link>
        </div>
      </div>
    </div>
  );
}
