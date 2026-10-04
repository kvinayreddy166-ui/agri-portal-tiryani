import React, { useEffect, useMemo, useState } from 'react';
import { IndianRupee, RefreshCw, Store } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { fetchMandiPrices, MandiPriceRecord } from '../services/mandiPrices';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export function MandiPricesWidget() {
  const { t } = useLanguage();
  const [records, setRecords] = useState<MandiPriceRecord[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [districtFilter, setDistrictFilter] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await fetchMandiPrices({ state: 'Telangana', limit: 100 });
      if (!active) return;
      setRecords(result?.records ?? []);
      setState(result && result.records.length ? 'ready' : 'unavailable');
    };
    void load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const districts = useMemo(
    () => [...new Set(records.map((r) => r.district).filter(Boolean))].sort(),
    [records]
  );
  const commodities = useMemo(
    () => [...new Set(records.map((r) => r.commodity).filter(Boolean))].sort(),
    [records]
  );

  const latestDate = useMemo(() => {
    let latest = '';
    for (const r of records) {
      const iso = arrivalToIso(r.arrival_date);
      if (iso > latest) latest = iso;
    }
    return latest;
  }, [records]);

  const visible = useMemo(() => {
    const rows = records.filter((r) => {
      if (districtFilter && r.district !== districtFilter) return false;
      if (commodityFilter && r.commodity !== commodityFilter) return false;
      return true;
    });
    // Latest arrivals first, then highest modal price.
    return rows
      .sort((a, b) => arrivalToIso(b.arrival_date).localeCompare(arrivalToIso(a.arrival_date)) || b.modal_price - a.modal_price)
      .slice(0, 10);
  }, [records, districtFilter, commodityFilter]);

  if (state === 'loading') {
    return (
      <div className="portal-card flex h-48 items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
      </div>
    );
  }

  return (
    <div className="portal-card overflow-hidden">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4 text-white">
        <h3 className="flex items-center gap-2 text-lg font-black">
          <Store className="h-6 w-6" />
          {t('Mandi Prices — Telangana', 'మండి ధరలు — తెలంగాణ')}
        </h3>
        <p className="mt-1 text-xs text-amber-100/90">
          {t('Agmarknet daily prices via data.gov.in (₹/quintal)', 'data.gov.in ద్వారా అగ్మార్క్‌నెట్ రోజువారీ ధరలు (₹/క్వింటాల్)')}
        </p>
      </div>

      {state === 'unavailable' ? (
        <div className="p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {t(
            'Mandi prices are temporarily unavailable.',
            'మండి ధరలు తాత్కాలికంగా అందుబాటులో లేవు.'
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="filter-select max-w-[12rem]"
            >
              <option value="">{t('All districts', 'అన్ని జిల్లాలు')}</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
              className="filter-select max-w-[12rem]"
            >
              <option value="">{t('All commodities', 'అన్ని వస్తువులు')}</option>
              {commodities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {latestDate && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                <RefreshCw className="h-3 w-3" />
                {t('Latest arrivals', 'తాజా రాకలు')}: {formatDateLabel(latestDate)}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="pb-2 pr-3">{t('Commodity', 'వస్తువు')}</th>
                  <th className="pb-2 pr-3">{t('Market', 'మార్కెట్')}</th>
                  <th className="pb-2 pr-3">{t('Variety', 'రకం')}</th>
                  <th className="pb-2 pr-3 text-right">{t('Min', 'కనిష్ట')}</th>
                  <th className="pb-2 pr-3 text-right">{t('Max', 'గరిష్ట')}</th>
                  <th className="pb-2 text-right">{t('Modal', 'మోడల్')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr
                    key={`${r.market}-${r.commodity}-${r.variety}-${i}`}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-2 pr-3 font-bold text-slate-900 dark:text-white">{r.commodity}</td>
                    <td className="py-2 pr-3 font-semibold text-slate-600 dark:text-slate-300">
                      {r.market}
                      <span className="block text-[10px] font-medium text-slate-400">{r.district}</span>
                    </td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{r.variety || '—'}</td>
                    <td className="py-2 pr-3 text-right text-slate-600 dark:text-slate-300">₹{r.min_price.toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-3 text-right text-slate-600 dark:text-slate-300">₹{r.max_price.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right">
                      <span className="inline-flex items-center gap-0.5 font-black text-emerald-700 dark:text-emerald-300">
                        <IndianRupee className="h-3 w-3" />
                        {r.modal_price.toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center font-semibold text-slate-500">
                      {t('No records for this filter.', 'ఈ ఫిల్టర్ కోసం రికార్డులు లేవు.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/** OGD dates arrive as "DD/MM/YYYY" (occasionally "YYYY-MM-DD"). */
function arrivalToIso(date: string): string {
  const dmy = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return date;
}

function formatDateLabel(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? iso
    : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
