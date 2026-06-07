import React, { useEffect, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';

const STORAGE_KEY = 'tiryani-acreage-calculator-input';

export function AcreageCalculator() {
  const [acreInput, setAcreInput] = useState(() => window.sessionStorage.getItem(STORAGE_KEY) || '');
  const result = useMemo(() => calculateAcreValues(acreInput), [acreInput]);

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, acreInput);
  }, [acreInput]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Acreage Calculator</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Add acres.guntas values and convert to total acres and hectares.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <label className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Acre values</span>
          <textarea
            value={acreInput}
            onChange={(event) => setAcreInput(event.target.value)}
            rows={10}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-950 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder={'Example:\n2.10\n2.36\n0.15'}
          />
        </label>

        <div className="grid gap-3">
          <ResultCard label="Total acres" value={result.formatted} note={`${result.acres} acres ${result.guntas} guntas`} />
          <ResultCard label="Hectares" value={result.hectares} note="Converted from total acres" />
          <ResultCard label="Items read" value={String(result.count)} note="Paste one Excel column or type values with plus signs" />
        </div>
      </section>
    </div>
  );
}

function ResultCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{note}</p>
    </article>
  );
}

function calculateAcreValues(input: string) {
  const values = input.match(/\d+(?:\.\d+)?/g) || [];
  const totalGuntas = values.reduce((sum, value) => {
    const [acrePart, guntaPart = '0'] = value.split('.');
    const acres = Number.parseInt(acrePart, 10) || 0;
    const guntas = Number.parseInt(guntaPart.padEnd(2, '0').slice(0, 2), 10) || 0;
    return sum + acres * 40 + guntas;
  }, 0);
  const acres = Math.floor(totalGuntas / 40);
  const guntas = totalGuntas % 40;
  const decimalAcres = totalGuntas / 40;
  return {
    acres,
    guntas,
    count: values.length,
    formatted: `${acres}.${String(guntas).padStart(2, '0')}`,
    hectares: (decimalAcres * 0.40468564224).toFixed(4),
  };
}
