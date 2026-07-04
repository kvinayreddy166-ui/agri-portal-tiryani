import React, { useEffect, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/ui/BackButton';

const STORAGE_KEY = 'tiryani-acreage-calculator-input';
const MODE_STORAGE_KEY = 'tiryani-acreage-calculator-mode';
const CENTS_STORAGE_KEY = 'tiryani-acreage-calculator-cents';
const ACRES_CENTS_PASTE_STORAGE_KEY = 'tiryani-acreage-calculator-acres-cents-paste';
const GUNTAS_STORAGE_KEY = 'tiryani-acreage-calculator-guntas';
const CENTS_PER_ACRE = 100;
const CENTS_PER_GUNTA = 2.5;
const GUNTAS_PER_ACRE = 40;
const HECTARES_PER_ACRE = 0.404686;

type AcreageMode = 'acres' | 'cents' | 'acres-cents' | 'guntas';

const modeOptions: Array<{ value: AcreageMode; label: string }> = [
  { value: 'acres', label: 'Acres' },
  { value: 'cents', label: 'Cents' },
  { value: 'acres-cents', label: 'Acres + Cents' },
  { value: 'guntas', label: 'Guntas' },
];

export function AcreageCalculator() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AcreageMode>(() => readMode());
  const [acreInput, setAcreInput] = useState(() => window.sessionStorage.getItem(STORAGE_KEY) || '');
  const [centInput, setCentInput] = useState(() => window.sessionStorage.getItem(CENTS_STORAGE_KEY) || '');
  const [guntaInput, setGuntaInput] = useState(() => window.sessionStorage.getItem(GUNTAS_STORAGE_KEY) || '');
  const [acresCentsPasteInput, setAcresCentsPasteInput] = useState(() => window.sessionStorage.getItem(ACRES_CENTS_PASTE_STORAGE_KEY) || '');
  const result = useMemo(
    () => calculateAcreageResult({ mode, acreInput, centInput, guntaInput, acresCentsPasteInput }),
    [acreInput, acresCentsPasteInput, centInput, guntaInput, mode]
  );
  const acreResult = useMemo(() => calculateAcreValues(acreInput), [acreInput]);

  useEffect(() => {
    window.sessionStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, acreInput);
  }, [acreInput]);

  useEffect(() => {
    window.sessionStorage.setItem(CENTS_STORAGE_KEY, centInput);
  }, [centInput]);

  useEffect(() => {
    window.sessionStorage.setItem(GUNTAS_STORAGE_KEY, guntaInput);
  }, [guntaInput]);


  useEffect(() => {
    window.sessionStorage.setItem(ACRES_CENTS_PASTE_STORAGE_KEY, acresCentsPasteInput);
  }, [acresCentsPasteInput]);
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-4 shadow-md dark:border-sky-900/60 dark:from-sky-950/50 dark:via-slate-900 dark:to-emerald-950/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950 dark:text-white">Acreage Calculator</h1>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Convert acres, cents and guntas for field reports.</p>
            </div>
          </div>
          <BackButton onClick={() => navigate('/officer-toolkit/farm-calculators')}>
            Back
          </BackButton>
        </div>
      </section>

      <section className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-100 to-sky-100 p-4 text-sm font-semibold text-sky-950 shadow-md dark:border-sky-900 dark:from-sky-950/50 dark:to-cyan-950/40 dark:text-sky-100">
        <div className="grid gap-2 sm:grid-cols-3">
          <p><span className="font-black">1 acre</span> = 100 cents = 40 guntas.</p>
          <p><span className="font-black">1 gunta</span> = 2.5 cents.</p>
          <p><span className="font-black">Default Acres mode</span> keeps the existing acres.guntas entry format.</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3 rounded-xl border border-sky-200 bg-gradient-to-br from-white via-sky-50 to-cyan-100 p-4 shadow-md dark:border-sky-900/60 dark:from-slate-900 dark:via-sky-950/30 dark:to-cyan-950/30">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Input type</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as AcreageMode)}
              className="w-full rounded-lg border border-sky-200 bg-white/85 px-3 py-2 text-sm font-bold text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-sky-900 dark:bg-slate-950 dark:text-white"
            >
              {modeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          {mode === 'acres' && (
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Acre values</span>
              <textarea
                value={acreInput}
                onChange={(event) => setAcreInput(event.target.value)}
                rows={10}
                className="w-full rounded-lg border border-sky-200 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-sky-900 dark:bg-slate-950 dark:text-white"
                placeholder={'Example:\n2.10\n2.36\n0.15'}
              />
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300">Existing format: 2.10 means 2 acres 10 guntas.</p>
            </label>
          )}

          {mode === 'cents' && (
            <NumberInput label="Total Cents" value={centInput} onChange={setCentInput} placeholder="Example: 150" />
          )}

          {mode === 'acres-cents' && (
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Acre.Cent values</span>
              <textarea
                value={acresCentsPasteInput}
                onChange={(event) => setAcresCentsPasteInput(event.target.value)}
                rows={10}
                className="w-full rounded-lg border border-sky-200 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-sky-900 dark:bg-slate-950 dark:text-white"
                placeholder={'Example:\n2.25\n1.50\n0.75'}
              />
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-300">Paste one column or type values. Example: 2.25 means 2 acres 25 cents.</p>
            </label>
          )}

          {mode === 'guntas' && (
            <NumberInput label="Total Guntas" value={guntaInput} onChange={setGuntaInput} placeholder="Example: 10" />
          )}
        </div>

        <div className="grid gap-3">
          {mode === 'acres' ? (
            <>
              <ResultCard tone="from-emerald-100 to-lime-100 border-emerald-200" label="Total acres" value={acreResult.formatted} note={`${acreResult.acres} acres ${acreResult.guntas} guntas`} />
              <ResultCard tone="from-sky-100 to-cyan-100 border-sky-200" label="Hectares" value={acreResult.hectares} note="Converted from total acres" />
              <ResultCard tone="from-amber-100 to-orange-100 border-amber-200" label="Items read" value={String(acreResult.count)} note="Paste one Excel column or type values with plus signs" />
            </>
          ) : (
            <>
              <ResultCard tone="from-emerald-100 to-lime-100 border-emerald-200" label="Acres" value={result.acresDecimal} note={result.acreGuntaNote} />
              {mode !== 'cents' && <ResultCard tone="from-yellow-100 to-amber-100 border-yellow-200" label="Cents" value={result.cents} note="1 acre = 100 cents" />}
              {mode !== 'acres-cents' && <ResultCard tone="from-pink-100 to-rose-100 border-pink-200" label="Acres + Cents" value={result.acresCents} note="Whole acres with remaining cents" />}
              {mode !== 'guntas' && <ResultCard tone="from-purple-100 to-indigo-100 border-purple-200" label="Guntas" value={result.guntas} note="1 acre = 40 guntas" />}
              <ResultCard tone="from-sky-100 to-cyan-100 border-sky-200" label="Hectares" value={result.hectares} note="Converted from decimal acres" />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function NumberInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-sky-200 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-sky-900 dark:bg-slate-950 dark:text-white"
        placeholder={placeholder}
      />
    </label>
  );
}

function ResultCard({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <article className={`rounded-xl border bg-gradient-to-br ${tone} p-4 shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-800`}>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{note}</p>
    </article>
  );
}

function readMode(): AcreageMode {
  const stored = window.sessionStorage.getItem(MODE_STORAGE_KEY);
  return modeOptions.some((option) => option.value === stored) ? stored as AcreageMode : 'acres';
}

function calculateAcreageResult({
  mode,
  acreInput,
  centInput,
  guntaInput,
  acresCentsPasteInput,
}: {
  mode: AcreageMode;
  acreInput: string;
  centInput: string;
  guntaInput: string;
  acresCentsPasteInput: string;
}) {
  const totalCents = calculateTotalCents({ mode, acreInput, centInput, guntaInput, acresCentsPasteInput });
  const decimalAcres = totalCents / CENTS_PER_ACRE;
  const wholeAcres = Math.floor(totalCents / CENTS_PER_ACRE);
  const remainingCents = totalCents - wholeAcres * CENTS_PER_ACRE;
  const totalGuntas = totalCents / CENTS_PER_GUNTA;
  const wholeGuntas = Math.floor(totalGuntas);
  const remainingGuntas = totalGuntas - wholeGuntas;
  const count = mode === 'acres' ? (acreInput.match(/\d+(?:\.\d+)?/g) || []).length : totalCents > 0 ? 1 : 0;

  return {
    count,
    acresDecimal: formatNumber(decimalAcres),
    cents: formatNumber(totalCents),
    acresCents: `${wholeAcres} acres ${formatNumber(remainingCents)} cents`,
    guntas: formatNumber(totalGuntas),
    acreGuntaNote: `${Math.floor(totalGuntas / GUNTAS_PER_ACRE)} acres ${formatNumber(totalGuntas % GUNTAS_PER_ACRE)} guntas`,
    hectares: formatNumber(decimalAcres * 0.40468564224, 4),
    wholeGuntas,
    remainingGuntas,
  };
}

function calculateTotalCents({
  mode,
  acreInput,
  centInput,
  guntaInput,
  acresCentsPasteInput,
}: {
  mode: AcreageMode;
  acreInput: string;
  centInput: string;
  guntaInput: string;
  acresCentsPasteInput: string;
}) {
  if (mode === 'cents') return parsePositiveNumber(centInput);
  if (mode === 'guntas') return parsePositiveNumber(guntaInput) * CENTS_PER_GUNTA;
  if (mode === 'acres-cents') {
    return calculateAcreCentPasteTotal(acresCentsPasteInput);
  }
  const values = acreInput.match(/\d+(?:\.\d+)?/g) || [];
  return values.reduce((sum, value) => {
    const [acrePart, guntaPart = '0'] = value.split('.');
    const acres = Number.parseInt(acrePart, 10) || 0;
    const guntas = Number.parseInt(guntaPart.padEnd(2, '0').slice(0, 2), 10) || 0;
    return sum + acres * CENTS_PER_ACRE + guntas * CENTS_PER_GUNTA;
  }, 0);
}

function calculateAcreCentPasteTotal(input: string) {
  const values = input.match(/\d+(?:\.\d+)?/g) || [];
  return values.reduce((sum, value) => {
    const [acrePart, centPart = '0'] = value.split('.');
    const acres = Number.parseInt(acrePart, 10) || 0;
    const cents = Number.parseInt(centPart.padEnd(2, '0').slice(0, 2), 10) || 0;
    return sum + acres * CENTS_PER_ACRE + cents;
  }, 0);
}

function calculateAcreValues(input: string) {
  const values = input.match(/\d+(?:\.\d+)?/g) || [];
  const totalGuntas = values.reduce((sum, value) => {
    const [acrePart, guntaPart = '0'] = value.split('.');
    const acres = Number.parseInt(acrePart, 10) || 0;
    const guntas = Number.parseInt(guntaPart.padEnd(2, '0').slice(0, 2), 10) || 0;
    return sum + acres * GUNTAS_PER_ACRE + guntas;
  }, 0);
  const acres = Math.floor(totalGuntas / GUNTAS_PER_ACRE);
  const guntas = totalGuntas % GUNTAS_PER_ACRE;
  const hectaresFromAcres = acres * HECTARES_PER_ACRE;
  const hectaresFromGuntas = (guntas / GUNTAS_PER_ACRE) * HECTARES_PER_ACRE;
  const hectares = hectaresFromAcres + hectaresFromGuntas;

  return {
    acres,
    guntas,
    count: values.length,
    formatted: `${acres}.${String(guntas).padStart(2, '0')}`,
    hectares: hectares.toFixed(4),
  };
}

function parsePositiveNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : undefined,
  }).format(value);
}



