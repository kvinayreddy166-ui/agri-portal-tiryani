import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, Briefcase, CalendarClock, FlaskConical, MapPin, Phone, Printer, Scale, Search, X } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { supabase } from '../../../shared/lib/supabase';
import type { Dealer } from '../../../shared/types/database';
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

  const [dealerRecord, setDealerRecord] = useState<Dealer | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDealerRecord(null);
    const pattern = dealerName.replace(/[%_]/g, '').trim();
    if (!pattern) return;
    void (async () => {
      try {
        const { data: rows } = await supabase
          .from('dealers')
          .select('dealer_name, license_number, location, district, mandal, phone_number, dealer_category, ifms_id')
          .ilike('dealer_name', `%${pattern}%`)
          .limit(20);
        if (cancelled) return;
        const list = (rows ?? []) as Dealer[];
        const exact = list.find((d) => normalizeDealerName(d.dealer_name) === key);
        setDealerRecord(exact ?? list[0] ?? null);
      } catch {
        // dealer directory unavailable — fall back to record-derived details
      }
    })();
    return () => { cancelled = true; };
  }, [dealerName, key]);

  const licenseNo =
    dealerRecord?.license_number ||
    profile.inspections.find((i) => i.license_number)?.license_number ||
    '';
  const addressLine = [
    dealerRecord?.location,
    [dealerRecord?.mandal, dealerRecord?.district].filter(Boolean).join(', '),
  ]
    .filter((part) => part && String(part).trim())
    .join(' · ');

  // Cases group the raw records below — counting them here would double-count
  // the same activity (a sample appears once as a sample and once via its case).
  const totalRecords =
    profile.inspections.length + profile.orders.length + profile.samples.length;

  const esc = (v: unknown) =>
    String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const handlePrint = () => {
    const rows = (items: React.ReactNode[]) =>
      items.length
        ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`
        : `<p class="empty">${t('None', 'లేదు')}</p>`;

    const caseItems = profile.cases.map(
      (c) =>
        `<b>${esc(c.case_number)}</b> — ${esc(c.stage)} · ${esc(t(COMMODITY_LABELS[c.commodity].en, COMMODITY_LABELS[c.commodity].te))} · ${esc(c.opened_date)}`
    );
    const orderItems = profile.orders.map(
      (o) =>
        `<b>${esc(o.order_number)}</b> — ${esc(o.order_type.replace('_', ' ').toUpperCase())} · ${esc(o.order_date)} · ${esc(t(COMMODITY_LABELS[o.commodity].en, COMMODITY_LABELS[o.commodity].te))}${o.reply_deadline ? ` · ${t('reply by', 'గడువు')} ${esc(o.reply_deadline)}` : ''}`
    );
    const sampleItems = profile.samples.map(
      (s) =>
        `<b>${esc(s.sample_code)}</b> — ${esc(s.date_of_sampling)} · ${esc(t(COMMODITY_LABELS[s.commodity].en, COMMODITY_LABELS[s.commodity].te))} · ${esc(t(LAB_STATUS_LABELS[s.lab_status]?.en ?? s.lab_status, LAB_STATUS_LABELS[s.lab_status]?.te ?? s.lab_status))}${s.lab_report_ref ? ` · ${esc(s.lab_report_ref)}` : ''}`
    );
    const inspectionItems = profile.inspections.map(
      (i) =>
        `<b>${esc(i.inspection_type.toUpperCase())}</b> — ${esc(i.license_number || '—')} · ${esc(i.inspection_date)}`
    );

    const scorecard = profile.scorecard
      ? `<table class="score"><tr>
          <td><b>${profile.scorecard.inspections}</b><span>${t('Inspections', 'తనిఖీలు')}</span></td>
          <td><b>${profile.scorecard.stopSale}</b><span>${t('Stop Sale', 'స్టాప్ సేల్')}</span></td>
          <td><b>${profile.scorecard.showCause}</b><span>${t('Show Cause', 'షో కారణం')}</span></td>
          <td><b>${profile.scorecard.seizures}</b><span>${t('Seizures', 'సీజర్లు')}</span></td>
          <td><b>${profile.scorecard.samplesTotal}</b><span>${t('Samples', 'నమూనాలు')}</span></td>
        </tr></table>
        <p class="risk">${t('Risk:', 'రిస్క్:')} <b>${esc(profile.scorecard.riskLevel)} · ${profile.scorecard.riskScore}</b></p>`
      : '';

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${t('Dealer 360° Profile', 'డీలర్ 360° ప్రొఫైల్')} — ${esc(dealerName)}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:800px;margin:24px auto;padding:0 16px}
        h1{font-size:20px;margin:0} h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#166534;margin:20px 0 6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
        .meta{font-size:12px;color:#475569;margin-top:4px} .meta b{color:#0f172a}
        table.score{width:100%;border-collapse:collapse;margin:12px 0} table.score td{border:1px solid #e2e8f0;padding:8px;text-align:center} table.score b{display:block;font-size:20px} table.score span{font-size:10px;text-transform:uppercase;color:#64748b}
        .risk{font-size:12px;color:#475569;margin:0 0 8px} ul{margin:0;padding-left:18px} li{font-size:12px;margin:4px 0} .empty{font-size:12px;color:#94a3b8;font-style:italic}
        .foot{margin-top:24px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
      </style></head><body>
      <h1>${t('Dealer 360° Profile', 'డీలర్ 360° ప్రొఫైల్')}</h1>
      <div class="meta"><b>${esc(dealerName)}</b> · ${totalRecords} ${t('total records', 'మొత్తం రికార్డులు')}${licenseNo ? ` · ${t('License / Authorization No.', 'లైసెన్స్ / అథారిటీ నం.')}: ${esc(licenseNo)}` : ''}${addressLine ? ` · ${esc(addressLine)}` : ''}${dealerRecord?.phone_number ? ` · ${esc(dealerRecord.phone_number)}` : ''}</div>
      <div class="meta">${new Date().toLocaleString('en-IN')}</div>
      ${scorecard}
      <h2>${t('Cases', 'కేసులు')} (${profile.cases.length})</h2>${rows(caseItems)}
      <h2>${t('Orders & Notices', 'ఆర్డర్లు & నోటీసులు')} (${profile.orders.length})</h2>${rows(orderItems)}
      <h2>${t('Samples', 'నమూనాలు')} (${profile.samples.length})</h2>${rows(sampleItems)}
      <h2>${t('Inspections', 'తనిఖీలు')} (${profile.inspections.length})</h2>${rows(inspectionItems)}
      <div class="foot">AGRONIX — ${t('generated from Enforcement Tracker', 'అమలు ట్రాకర్ నుండి రూపొందించబడింది')}</div>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.opener = null;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-[96] flex justify-end bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900"
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
            {(licenseNo || addressLine || dealerRecord?.phone_number) && (
              <div className="mt-3 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-[11px] dark:border-slate-800 dark:bg-slate-800/40">
                {licenseNo && (
                  <p className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="min-w-0 truncate">
                      {t('License / Authorization No.', 'లైసెన్స్ / అథారిటీ నం.')}: {licenseNo}
                    </span>
                  </p>
                )}
                {addressLine && (
                  <p className="flex items-start gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="min-w-0">{addressLine}</span>
                  </p>
                )}
                {dealerRecord?.phone_number && (
                  <p className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="min-w-0">{dealerRecord.phone_number}</span>
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title={t('Print profile', 'ప్రొఫైల్ ప్రింట్')}
              aria-label={t('Print profile', 'ప్రొఫైల్ ప్రింట్')}
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={t('Close', 'మూసివేయి')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Scorecard strip */}
          {profile.scorecard && (
            <div className="flex divide-x divide-slate-100 overflow-hidden rounded-xl bg-slate-50/80 ring-1 ring-slate-100 dark:divide-slate-800 dark:bg-slate-800/40 dark:ring-slate-800">
              {[
                { label: t('Inspections', 'తనిఖీలు'), value: profile.scorecard.inspections, cls: 'text-sky-600 dark:text-sky-400' },
                { label: t('Stop Sale', 'స్టాప్ సేల్'), value: profile.scorecard.stopSale, cls: 'text-orange-600 dark:text-orange-400' },
                { label: t('Show Cause', 'షో కారణం'), value: profile.scorecard.showCause, cls: 'text-amber-600 dark:text-amber-400' },
                { label: t('Seizures', 'సీజర్లు'), value: profile.scorecard.seizures, cls: 'text-red-600 dark:text-red-400' },
                { label: t('Samples', 'నమూనాలు'), value: profile.scorecard.samplesTotal, cls: profile.scorecard.samplesFailed > 0 ? 'text-red-600 dark:text-red-400' : 'text-violet-600 dark:text-violet-400' },
              ].map((m) => (
                <div key={m.label} className="min-w-0 flex-1 px-1.5 py-2 text-center">
                  <p className={`text-base font-black leading-none ${m.cls}`}>{m.value}</p>
                  <p className="mt-1 truncate text-[9px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{m.label}</p>
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
            to={`/officer-toolkit/enforcement-tracker?tab=scorecards&dealer=${encodeURIComponent(dealerName)}`}
            onClick={onClose}
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
