import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Target, Users, X } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { FINANCIAL_YEARS, currentFinancialYear } from '../../../shared/utils/financialYear';
import { getMandalsForDistrict } from '../../../shared/data/telanganaDistrictMandalData';
import { OFFICER_DISTRICT_TO_MANDAL_KEY } from '../../auth/lib/officerProfileForm';
import {
  listAllocationOfficers,
  type AllocationOfficer,
} from '../../../shared/hooks/useTargetAllocations';
import type { SampleCommodity } from '../../../shared/hooks/useSampleTargets';

const COMMODITIES: { id: SampleCommodity; label: string; telugu: string }[] = [
  { id: 'fertilizer', label: 'Fertilizer', telugu: 'ఎరువులు' },
  { id: 'seed', label: 'Seed', telugu: 'విత్తనాలు' },
  { id: 'pesticide', label: 'Pesticide', telugu: 'పురుగుమందులు' },
];

const ALL_MANDAL = '__all__';

export function TargetAllocationModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const { t } = useLanguage();
  const { user, officerProfile } = useAuth();

  const [financialYear, setFinancialYear] = useState(currentFinancialYear());
  const [commodity, setCommodity] = useState<SampleCommodity>('fertilizer');
  const [mandal, setMandal] = useState('');
  const [officerId, setOfficerId] = useState(ALL_MANDAL);
  const [numericTarget, setNumericTarget] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [officers, setOfficers] = useState<AllocationOfficer[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  const district = officerProfile?.district || '';
  const mandals = useMemo(
    () => getMandalsForDistrict(OFFICER_DISTRICT_TO_MANDAL_KEY[district] || district),
    [district]
  );

  useEffect(() => {
    if (!open) return;
    setFinancialYear(currentFinancialYear());
    setCommodity('fertilizer');
    setMandal('');
    setOfficerId(ALL_MANDAL);
    setNumericTarget('');
    setCodeInput('');
    setError('');
  }, [open]);

  useEffect(() => {
    if (!open || !district) return;
    let cancelled = false;
    setLoadingOfficers(true);
    listAllocationOfficers(district)
      .then((rows) => {
        if (!cancelled) setOfficers(rows);
      })
      .catch((err) => {
        console.error('Failed to load officers for allocation:', err);
        if (!cancelled) setError(t('Failed to load officer list.', 'అధికారుల జాబితా లోడ్ కాలేదు.'));
      })
      .finally(() => {
        if (!cancelled) setLoadingOfficers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, district]); // eslint-disable-line react-hooks/exhaustive-deps

  const officersInMandal = useMemo(
    () => (mandal ? officers.filter((o) => o.mandal === mandal) : []),
    [officers, mandal]
  );

  const selectedOfficer = officers.find((o) => o.id === officerId) || null;
  const targetOfficerName = officerId === ALL_MANDAL ? null : selectedOfficer?.full_name || null;

  const parseCodes = (raw: string) =>
    Array.from(
      new Set(
        raw
          .split(/[\n,;]+/)
          .map((code) => code.trim())
          .filter(Boolean)
      )
    );

  const save = async () => {
    setError('');
    if (!mandal) {
      setError(t('Please select a mandal.', 'దయచేసి మండలం ఎంచుకోండి.'));
      return;
    }
    if (officerId !== ALL_MANDAL && !selectedOfficer) {
      setError(t('Please select an officer.', 'దయచేసి అధికారి ఎంచుకోండి.'));
      return;
    }

    const numeric = numericTarget.trim() === '' ? null : Number(numericTarget);
    if (numeric !== null && (!Number.isInteger(numeric) || numeric < 0)) {
      setError(t('Numeric target must be a whole number (0 or more).', 'సంఖ్యా లక్ష్యం 0 లేదా అంతకంటే ఎక్కువ పూర్ణ సంఖ్యగా నమోదు చేయండి.'));
      return;
    }

    const codes = parseCodes(codeInput);
    if (numeric === null && codes.length === 0) {
      setError(t('Enter a numeric target and/or at least one sample code.', 'సంఖ్యా లక్ష్యం మరియు/లేదా కనీసం ఒక నమూనా కోడ్ నమోదు చేయండి.'));
      return;
    }

    setSaving(true);
    try {
      const base = {
        allocated_by: user?.id ?? null,
        allocated_by_name:
          officerProfile?.full_name ||
          (user?.user_metadata?.full_name as string | undefined) ||
          user?.email ||
          null,
        officer_id: officerId === ALL_MANDAL ? null : officerId,
        officer_name: officerId === ALL_MANDAL ? `All officers — ${mandal}` : targetOfficerName,
        mandal,
        district,
        commodity,
        financial_year: financialYear,
      };

      const rows: Record<string, unknown>[] = [];
      if (numeric !== null) rows.push({ ...base, numeric_target: numeric, code_number: null });
      for (const code of codes) rows.push({ ...base, numeric_target: null, code_number: code });

      const { error: insertError } = await supabase.from('officer_target_allocations').insert(rows);
      if (insertError) throw insertError;

      onSaved?.();
      onClose();
    } catch (err: any) {
      const message = err?.message || 'Failed to save allocation.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
              <Target className="h-5 w-5 text-emerald-600" />
              {t('Allocate Targets', 'లక్ష్యాలు కేటాయించండి')}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t(
                'Assign numeric targets and/or sample code numbers to MAO/ADA officers for a mandal.',
                'MAO/ADA అధికారులకు మండలం వారీగా సంఖ్యా లక్ష్యాలు మరియు/లేదా నమూనా కోడ్‌లు కేటాయించండి.'
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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('Mandal', 'మండలం')} *
              </span>
              <select
                value={mandal}
                onChange={(event) => {
                  setMandal(event.target.value);
                  setOfficerId(ALL_MANDAL);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">{t('Select mandal', 'మండలం ఎంచుకోండి')}</option>
                {mandals.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('Assign To', 'ఎవరు కేటాయించాలి')}
              </span>
              <select
                value={officerId}
                onChange={(event) => setOfficerId(event.target.value)}
                disabled={!mandal || loadingOfficers}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value={ALL_MANDAL}>
                  {mandal ? t(`All officers — ${mandal}`, `అందరు అధికారి — ${mandal}`) : t('All officers in mandal', 'మండలంలోని అందరు అధికారి')}
                </option>
                {officersInMandal.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name} ({o.designation})
                  </option>
                ))}
              </select>
            </label>
          </div>
          {mandal && !loadingOfficers && officersInMandal.length === 0 && (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <Users className="h-3.5 w-3.5" />
              {t('No MAO/ADA officers registered in this mandal — allocation will apply mandal-wide.', 'No MAO/ADA officers registered in this mandal — allocation will apply mandal-wide.')}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('Numeric Target (samples)', 'సంఖ్యా లక్ష్యం (నమూనాలు)')}
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={numericTarget}
                onChange={(event) => setNumericTarget(event.target.value)}
                placeholder={t('e.g. 25', 'ఉదా. 25')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('Sample Code Numbers', 'నమూనా కోడ్ నంబర్లు')}
              </span>
              <textarea
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                rows={2}
                placeholder={t('One code per line or comma separated — e.g. CDA-2026-001', 'ప్రతి పంక్తికి ఒక కోడ్ లేదా కామాతో వేరు — ఉదా: CDA-2026-001')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </div>

          {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('Cancel', 'రద్దు')}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t('Allocate', 'కేటాయించండి')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
