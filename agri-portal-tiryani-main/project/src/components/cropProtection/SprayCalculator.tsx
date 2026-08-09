import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import type { LanguageCode } from '../../services/cropProtectionService';
import { label } from '../../services/translationService';

export function SprayCalculator({ language }: { language: LanguageCode }) {
  const [tankSize, setTankSize] = useState('16');
  const [area, setArea] = useState('1');
  const [dosePerLitre, setDosePerLitre] = useState('');
  const [dosePerAcre, setDosePerAcre] = useState('');
  const result = useMemo(() => {
    const tank = Math.max(1, Number(tankSize) || 16);
    const acres = Math.max(0, Number(area) || 0);
    const waterPerAcre = 200;
    const water = acres * waterPerAcre;
    const tanks = water / tank;
    const byLitre = Number(dosePerLitre) > 0 ? water * Number(dosePerLitre) : 0;
    const byAcre = Number(dosePerAcre) > 0 ? acres * Number(dosePerAcre) : 0;
    return { water, tanks, chemical: byLitre || byAcre };
  }, [area, dosePerAcre, dosePerLitre, tankSize]);

  return (
    <section className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-emerald-700" />
        <h2 className="text-sm font-black text-slate-950">{label('Spray Calculator', language)}</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Input label="Tank size (L)" value={tankSize} onChange={setTankSize} />
        <Input label="Area (acres)" value={area} onChange={setArea} />
        <Input label="Dose per litre" value={dosePerLitre} onChange={setDosePerLitre} />
        <Input label="Dose per acre" value={dosePerAcre} onChange={setDosePerAcre} />
      </div>
      <div className="mt-3 grid gap-2 text-xs font-bold sm:grid-cols-3">
        <Metric label="Water volume" value={`${round(result.water)} L`} />
        <Metric label="Number of tanks" value={round(result.tanks)} />
        <Metric label="Chemical required" value={result.chemical ? round(result.chemical) : 'Enter dose'} />
      </div>
      <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
        Safety note: Use chemicals only as per latest CIBRC label and local Department/PJTSAU recommendation.
      </p>
    </section>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-emerald-50 p-2">
      <p className="text-[10px] uppercase text-emerald-700">{label}</p>
      <p className="text-lg font-black text-emerald-900">{value}</p>
    </div>
  );
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
