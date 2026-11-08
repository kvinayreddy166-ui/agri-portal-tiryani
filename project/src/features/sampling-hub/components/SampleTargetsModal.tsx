import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Hash, Loader2, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { FINANCIAL_YEARS, currentFinancialYear, financialYearRange } from '../../../shared/utils/financialYear';
import { useSampleTargets, type SampleCommodity, type SampleTarget } from '../../../shared/hooks/useSampleTargets';

const COMMODITIES: { id: SampleCommodity; label: string; telugu: string }[] = [
  { id: 'fertilizer', label: 'Fertilizer', telugu: 'ఎరువులు' },
  { id: 'seed', label: 'Seed', telugu: 'విత్తనాలు' },
  { id: 'pesticide', label: 'Pesticide', telugu: 'పురుగుమందులు' },
];

export function SampleTargetsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const { user, officerProfile } = useAuth();
  const [financialYear, setFinancialYear] = useState(currentFinancialYear());
  const [commodity, setCommodity] = useState<SampleCommodity>('fertilizer');
  const [codeInput, setCodeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { targets, loading, refresh } = useSampleTargets();
  const [drawnSamples, setDrawnSamples] = useState<{ commodity: string; sample_code: string; date_of_sampling: string }[]>([]);

  useEffect(() => {
    const officerId = officerProfile?.id || user?.id;
    if (!open || !officerId) {
      setDrawnSamples([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('officer_samples')
        .select('commodity, sample_code, date_of_sampling')
        .eq('officer_id', officerId)
        .order('date_of_sampling', { ascending: false })
        .limit(10000);
      if (!cancelled && !error) {
        setDrawnSamples((data || []) as typeof drawnSamples);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, officerProfile?.id, user?.id]);

  const visible = useMemo(
    () =>
      targets
        .filter((target) => target.financial_year === financialYear && target.commodity === commodity)
        .sort((a, b) => a.code_number.localeCompare(b.code_number, undefined, { numeric: true })),
    [targets, financialYear, commodity]
  );

  const fyRange = financialYearRange(financialYear);

  const drawnMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const sample of drawnSamples) {
      if (sample.commodity !== commodity) continue;
      if (sample.date_of_sampling < fyRange.start || sample.date_of_sampling > fyRange.end) continue;
      const code = String(sample.sample_code || '').trim();
      if (code && !map.has(code)) map.set(code, sample.date_of_sampling);
    }
    return map;
  }, [drawnSamples, commodity, financialYear]);

  const drawnCount = visible.filter((target) => drawnMap.has(target.code_number.trim())).length;
  const remainingCount = Math.max(visible.length - drawnCount, 0);
  const progressPct = visible.length > 0 ? Math.round((drawnCount / visible.length) * 100) : 0;

  if (!open) return null;

  const parseCodes = (raw: string) =>
    Array.from(
      new Set(
        raw
          .split(/[\n,;]+/)
          .map((code) => code.trim())
          .filter(Boolean)
      )
    );

  const addCodes = async () => {
    const codes = parseCodes(codeInput);
    if (codes.length === 0) {
      setError(t('Enter at least one code number.', 'కోడ్ నంబర్ నమోదు చేయండి.'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const rows = codes.map((code_number) => ({
        code_number,
        financial_year: financialYear,
        commodity,
        created_by: user?.id ?? null,
        created_by_name:
          officerProfile?.full_name ||
          (user?.user_metadata?.full_name as string | undefined) ||
          user?.email ||
          null,
      }));
      const { error: insertError } = await supabase.from('sample_targets').insert(rows);
      if (insertError) throw insertError;
      setCodeInput('');
      await refresh();
    } catch (err: any) {
      const message = err?.message || 'Failed to add sample codes.';
      setError(
        message.includes('duplicate') || message.includes('unique') || message.includes('23505')
          ? t('Some codes already exist for this FY and commodity.', 'కొన్ని కోడ్‌లు ఈ ఆర్థిక సంవత్సరం మరియు వస్తువు కోసం ఇప్పటికే ఉన్నాయి.')
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  const removeCode = async (target: SampleTarget) => {
    const { error: deleteError } = await supabase.from('sample_targets').delete().eq('id', target.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {t('Sample Code Targets', 'నమూనా కోడ్ లక్ష్యాలు')}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t(
                'Enter code numbers per financial year and commodity. They become selectable in the sampling forms.',
                'ఆర్థిక సంవత్సరం మరియు వస్తువు వారీగా కోడ్ నంబర్లు నమోదు చేయండి. అవి సాంప్లింగ్ ఫారాల్లో ఎంపిక చేయదగినవుగా మారతాయి.'
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('Financial Year', 'ఆర్థిక సంవత్సరం')}
              </span>
              <select
                value={financialYear}
                onChange={(event) => setFinancialYear(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {FINANCIAL_YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <div>
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('Commodity', 'వస్తువు')}
              </span>
              <div className="flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
                {COMMODITIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCommodity(item.id)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-black transition ${
                      commodity === item.id
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {t(item.label, item.telugu)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('Code Numbers', 'కోడ్ నంబర్లు')}
              </span>
              <textarea
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                rows={3}
                placeholder={t('One code per line, or separated by commas — e.g. CDA-2026-001', 'ప్రతి పంక్తికి ఒక కోడ్, లేదా కామాలతో వేరు చేయండి — ఉదా: CDA-2026-001')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium text-slate-400">
                {t('Duplicates are ignored on save.', 'నకిలీ కోడ్‌లు సేవ్‌లో విస్మరించబడతాయి.')}
              </p>
              <button
                type="button"
                onClick={addCodes}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {t('Add Codes', 'కోడ్‌లు చేర్చండి')}
              </button>
            </div>
            {error && <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">
                {t('Progress', 'పురోగతి')}: {drawnCount}/{visible.length} {t('drawn', 'తీయబడినవి')}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {remainingCount} {t('remaining', 'మిగిలినవి')}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {financialYear} · {COMMODITIES.find((c) => c.id === commodity)?.label} · {visible.length}
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('Loading…', 'లోడ్ అవుతోంది…')}
                </div>
              ) : visible.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Hash className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium text-slate-400">
                    {t('No codes added for this year and commodity yet.', 'ఈ సంవత్సరం మరియు వస్తువు కోసం ఇంకా కోడ్‌లు జోడించలేదు.')}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visible.map((target) => (
                    <li key={target.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{target.code_number}</span>
                        {drawnMap.has(target.code_number.trim()) ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('Drawn', 'తీయబడింది')} {drawnMap.get(target.code_number.trim())}
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {t('Available', 'అందుబాటులో')}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCode(target)}
                        title={t('Delete code', 'కోడ్ తొలగించండి')}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
