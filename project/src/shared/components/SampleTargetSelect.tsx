import React, { useMemo, useState } from 'react';
import { Hash } from 'lucide-react';
import type { SampleTarget } from '../hooks/useSampleTargets';
import { FINANCIAL_YEARS, currentFinancialYear } from '../utils/financialYear';

interface SampleTargetSelectProps {
  targets: SampleTarget[];
  onPick: (codeNumber: string) => void;
  label?: string;
  className?: string;
}

/**
 * Quick-pick dropdown for officer-entered sample code numbers, scoped by
 * financial year. The underlying form field stays freely editable — this only
 * fills it when a code is chosen.
 */
export function SampleTargetSelect({ targets, onPick, label = 'Select sample code', className = '' }: SampleTargetSelectProps) {
  const [financialYear, setFinancialYear] = useState(currentFinancialYear());

  const codes = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const target of targets) {
      if (target.financial_year !== financialYear) continue;
      const code = target.code_number.trim();
      if (!code || seen.has(code)) continue;
      seen.add(code);
      list.push(code);
    }
    return list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [targets, financialYear]);

  if (targets.length === 0) return null;

  return (
    <div className={`grid gap-2 sm:grid-cols-[140px_1fr] ${className}`}>
      <label className="block">
        <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Financial Year
        </span>
        <select
          value={financialYear}
          onChange={(event) => setFinancialYear(event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {FINANCIAL_YEARS.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="relative block">
          <Hash className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) onPick(event.target.value);
            }}
            className="w-full appearance-none rounded-lg border border-emerald-600/60 bg-emerald-50/60 py-2 pl-8 pr-8 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-500/50 dark:bg-emerald-950/30 dark:text-slate-100"
          >
            <option value="">
              {codes.length > 0 ? `Choose from ${codes.length} code${codes.length === 1 ? '' : 's'}` : 'No codes for this FY'}
            </option>
            {codes.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </span>
      </label>
    </div>
  );
}
