import React, { useMemo, useState } from 'react';
import { ArrowLeft, Bug, Calculator, Copy, Languages, RotateCcw, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

type Mode = 'activeIngredient' | 'directDose';
type AreaUnit = 'acres' | 'hectares';
type UnitType = 'liquid' | 'solid';
type TankChoice = '16' | '20' | 'custom';
type AiDoseUnit = 'g-ai-acre' | 'kg-ai-ha';

const HECTARE_TO_ACRES = 2.471;
const DEFAULT_WATER_PER_ACRE = '200';

const initialForm = {
  productName: '',
  unitType: 'liquid' as UnitType,
  areaValue: '',
  areaUnit: 'acres' as AreaUnit,
  waterPerAcre: DEFAULT_WATER_PER_ACRE,
  tankChoice: '16' as TankChoice,
  customTankSize: '',
  aiPercentage: '',
  aiDose: '',
  aiDoseUnit: 'g-ai-acre' as AiDoseUnit,
  directDose: '',
};

export function PesticideCalculator() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const [mode, setMode] = useState<Mode>('activeIngredient');
  const [form, setForm] = useState(initialForm);
  const [copied, setCopied] = useState(false);

  const calculation = useMemo(() => calculatePesticide(mode, form), [form, mode]);
  const unitLabels = getUnitLabels(form.unitType);
  const shareText = useMemo(
    () => buildShareText({ mode, form, calculation, unitLabels, t }),
    [calculation, form, mode, t, unitLabels]
  );

  const updateForm = (field: keyof typeof initialForm, value: string) => {
    setCopied(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const reset = () => {
    setCopied(false);
    setMode('activeIngredient');
    setForm(initialForm);
  };

  const copyResult = async () => {
    if (!calculation.result) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const shareWhatsApp = () => {
    if (!calculation.result) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Bug className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {t('Officer Toolkit', 'అధికారుల టూల్‌కిట్')}
              </p>
              <h1 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                {t('Pesticide Calculator', 'పురుగుమందు కాలిక్యులేటర్')}
              </h1>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                {t('Selected tank dose, total water and total product.', 'ఎంచుకున్న ట్యాంక్ మోతాదు, మొత్తం నీరు మరియు మొత్తం ఉత్పత్తి.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/officer-toolkit')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Toolkit', 'టూల్‌కిట్')}
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <button type="button" onClick={copyResult} disabled={!calculation.result} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700">
          <Copy className="h-4 w-4" />
          {copied ? t('Copied', 'కాపీ అయింది') : t('Copy Text', 'టెక్స్ట్ కాపీ')}
        </button>
        <button type="button" onClick={shareWhatsApp} disabled={!calculation.result} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700" aria-label="WhatsApp" title="WhatsApp">
          <WhatsAppIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={toggleLanguage} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
          <Languages className="h-4 w-4" />
          {language === 'en' ? 'తెలుగు' : 'English'}
        </button>
        <button type="button" onClick={reset} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
          <RotateCcw className="h-4 w-4" />
          {t('Reset', 'రీసెట్')}
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <ModeButton active={mode === 'activeIngredient'} onClick={() => setMode('activeIngredient')} label={t('Active Ingredient', 'యాక్టివ్ ఇంగ్రిడియెంట్')} />
              <ModeButton active={mode === 'directDose'} onClick={() => setMode('directDose')} label={t('Direct Dose', 'ప్రత్యక్ష మోతాదు')} />
            </div>
          </div>

          <FormSection title={t('Product Details', 'ఉత్పత్తి వివరాలు')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Product name', 'ఉత్పత్తి పేరు')} optional>
                <input value={form.productName} onChange={(event) => updateForm('productName', event.target.value)} className={inputClass} placeholder={t('Optional', 'ఐచ్ఛికం')} />
              </Field>
              <Field label={t('Unit type', 'యూనిట్ రకం')}>
                <div className="grid grid-cols-2 gap-2">
                  <label className={radioCardClass(form.unitType === 'liquid')}>
                    <input type="radio" className="sr-only" checked={form.unitType === 'liquid'} onChange={() => updateForm('unitType', 'liquid')} />
                    <span className="text-sm font-black">{t('Liquid', 'ద్రవం')}</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">mL, mL/L</span>
                  </label>
                  <label className={radioCardClass(form.unitType === 'solid')}>
                    <input type="radio" className="sr-only" checked={form.unitType === 'solid'} onChange={() => updateForm('unitType', 'solid')} />
                    <span className="text-sm font-black">{t('Solid', 'ఘన పదార్థం')}</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">g, g/L</span>
                  </label>
                </div>
              </Field>
            </div>
          </FormSection>

          <FormSection title={t('Area, Water and Tank', 'విస్తీర్ణం, నీరు మరియు ట్యాంక్')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Area value', 'విస్తీర్ణం')}>
                <input type="number" min="0" inputMode="decimal" value={form.areaValue} onChange={(event) => updateForm('areaValue', event.target.value)} className={inputClass} placeholder="2" />
              </Field>
              <Field label={t('Area unit', 'విస్తీర్ణ యూనిట్')}>
                <select value={form.areaUnit} onChange={(event) => updateForm('areaUnit', event.target.value)} className={inputClass}>
                  <option value="acres">{t('Acres', 'ఎకరాలు')}</option>
                  <option value="hectares">{t('Hectares', 'హెక్టార్లు')}</option>
                </select>
              </Field>
              <Field label={t('Water volume per acre', 'ఎకరానికి నీటి పరిమాణం')}>
                <input type="number" min="0" inputMode="decimal" value={form.waterPerAcre} onChange={(event) => updateForm('waterPerAcre', event.target.value)} className={inputClass} placeholder="200" />
              </Field>
              <Field label={t('Selected spray tank size', 'ఎంచుకున్న స్ప్రే ట్యాంక్ పరిమాణం')}>
                <select value={form.tankChoice} onChange={(event) => updateForm('tankChoice', event.target.value)} className={inputClass}>
                  <option value="16">16 L</option>
                  <option value="20">20 L</option>
                  <option value="custom">{t('Custom', 'కస్టమ్')}</option>
                </select>
              </Field>
            </div>
            {form.tankChoice === 'custom' && (
              <div className="mt-3 max-w-xs">
                <Field label={t('Custom tank size', 'కస్టమ్ ట్యాంక్ పరిమాణం')}>
                  <input type="number" min="0" inputMode="decimal" value={form.customTankSize} onChange={(event) => updateForm('customTankSize', event.target.value)} className={inputClass} placeholder="15" />
                </Field>
              </div>
            )}
          </FormSection>

          {mode === 'activeIngredient' ? (
            <FormSection title={t('Active Ingredient Dose', 'యాక్టివ్ ఇంగ్రిడియెంట్ మోతాదు')}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={t('Active ingredient %', 'యాక్టివ్ ఇంగ్రిడియెంట్ %')}>
                  <input type="number" min="0" max="100" inputMode="decimal" value={form.aiPercentage} onChange={(event) => updateForm('aiPercentage', event.target.value)} className={inputClass} placeholder="17.8" />
                </Field>
                <Field label={t('Recommended a.i. dose', 'సిఫార్సు చేసిన a.i. మోతాదు')}>
                  <input type="number" min="0" inputMode="decimal" value={form.aiDose} onChange={(event) => updateForm('aiDose', event.target.value)} className={inputClass} placeholder="20" />
                </Field>
                <Field label={t('Dose unit', 'మోతాదు యూనిట్')}>
                  <select value={form.aiDoseUnit} onChange={(event) => updateForm('aiDoseUnit', event.target.value)} className={inputClass}>
                    <option value="g-ai-acre">g a.i./acre</option>
                    <option value="kg-ai-ha">kg a.i./ha</option>
                  </select>
                </Field>
              </div>
            </FormSection>
          ) : (
            <FormSection title={t('Direct Dose', 'ప్రత్యక్ష మోతాదు')}>
              <div className="max-w-xs">
                <Field label={`${t('Dose per litre', 'లీటరుకు మోతాదు')} (${unitLabels.perLitre})`}>
                  <input type="number" min="0" inputMode="decimal" value={form.directDose} onChange={(event) => updateForm('directDose', event.target.value)} className={inputClass} placeholder={form.unitType === 'liquid' ? '2' : '3'} />
                </Field>
              </div>
            </FormSection>
          )}
        </div>

        <aside className="space-y-3">
          {calculation.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/60 dark:bg-red-950/30">
              <p className="text-sm font-black text-red-800 dark:text-red-200">{t('Check inputs', 'ఇన్‌పుట్‌లను తనిఖీ చేయండి')}</p>
              <ul className="mt-2 space-y-1 text-sm font-semibold text-red-700 dark:text-red-200">
                {calculation.errors.map((error) => (
                  <li key={error}>- {error}</li>
                ))}
              </ul>
            </div>
          )}

          {calculation.result ? (
            <>
              <ResultGrid result={calculation.result} unitLabels={unitLabels} t={t} />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
                <div className="flex gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    {t('Always verify pesticide label recommendation, crop, pest stage, waiting period and local agriculture officer advisory before spraying.', 'స్ప్రే చేసే ముందు పురుగుమందు లేబుల్ సిఫార్సు, పంట, పురుగు దశ, వెయిటింగ్ పీరియడ్ మరియు స్థానిక వ్యవసాయ అధికారి సూచనను తప్పనిసరిగా ధృవీకరించండి.')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <Calculator className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-2 text-sm font-black text-slate-700 dark:text-slate-200">{t('Results will appear here', 'ఫలితాలు ఇక్కడ కనిపిస్తాయి')}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Enter area, water, selected tank size and dose details.', 'విస్తీర్ణం, నీరు, ఎంచుకున్న ట్యాంక్ పరిమాణం మరియు మోతాదు వివరాలు నమోదు చేయండి.')}</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function WhatsAppIcon({ className = '' }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.14 6.43 2.14 11.87c0 1.74.46 3.44 1.33 4.93L2 22l5.33-1.4a9.88 9.88 0 0 0 4.71 1.2h.01c5.45 0 9.89-4.43 9.89-9.87C21.94 6.43 17.5 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.16.83.84-3.08-.2-.32a8.18 8.18 0 1 1 7.01 3.89Zm4.49-6.14c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.14.17-.29.19-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.17.21-.58.21-1.07.14-1.17-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`min-h-10 rounded-md px-3 py-2 text-sm font-black transition ${active ? 'bg-white text-emerald-800 shadow-sm dark:bg-slate-950 dark:text-emerald-300' : 'text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-950/70'}`}>
      {label}
    </button>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
        <span>{label}</span>
        {optional && <span className="text-[11px] font-bold text-slate-400">Optional</span>}
      </span>
      {children}
    </label>
  );
}

function ResultGrid({ result, unitLabels, t }: { result: PesticideResult; unitLabels: UnitLabels; t: (english: string, telugu: string) => string }) {
  const cards = [
    { label: t('Total water required', 'అవసరమైన మొత్తం నీరు'), value: `${formatNumber(result.totalWater)} L`, note: `${formatNumber(result.totalAcres)} acres` },
    { label: t('Product per litre of water', 'లీటరు నీటికి ఉత్పత్తి'), value: `${formatNumber(result.productPerLitre)} ${unitLabels.perLitre}`, note: t('Calculated dose concentration', 'లెక్కించిన మోతాదు సాంద్రత') },
    { label: t('Selected tank dose', 'ఎంచుకున్న ట్యాంక్ మోతాదు'), value: `${formatNumber(result.productPerSelectedTank)} ${unitLabels.perTank}`, note: `${formatNumber(result.selectedTankSize)} L tank` },
    { label: t('Spray tanks required', 'అవసరమైన స్ప్రే ట్యాంకులు'), value: `${result.tanksRequired} ${t('tanks', 'ట్యాంకులు')}`, note: `${t('Exact tanks', 'ఖచ్చితమైన ట్యాంకులు')}: ${formatNumber(result.exactTanks)}` },
    { label: t('Total product required', 'అవసరమైన మొత్తం ఉత్పత్తి'), value: formatTotalProduct(result.totalProduct, unitLabels), note: t('For total spray solution', 'మొత్తం స్ప్రే ద్రావణానికి') },
  ];

  return (
    <div className="grid gap-3">
      {cards.map((card) => (
        <article key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
          <p className="mt-1 break-words text-2xl font-black text-slate-950 dark:text-white">{card.value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{card.note}</p>
        </article>
      ))}
    </div>
  );
}

const inputClass = 'min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-900/40';

function radioCardClass(active: boolean) {
  return `flex min-h-16 cursor-pointer flex-col justify-center rounded-lg border p-3 transition ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`;
}

interface PesticideResult {
  totalAcres: number;
  totalWater: number;
  exactTanks: number;
  tanksRequired: number;
  selectedTankSize: number;
  productPerLitre: number;
  productPerSelectedTank: number;
  totalProduct: number;
}

interface UnitLabels {
  base: 'mL' | 'g';
  perLitre: 'mL/L' | 'g/L';
  perTank: 'mL/tank' | 'g/tank';
  totalLarge: 'L' | 'kg';
}

function calculatePesticide(mode: Mode, form: typeof initialForm): { errors: string[]; result: PesticideResult | null } {
  const areaValue = toNumber(form.areaValue);
  const waterPerAcre = toNumber(form.waterPerAcre);
  const selectedTankSize = form.tankChoice === 'custom' ? toNumber(form.customTankSize) : Number(form.tankChoice);
  const errors: string[] = [];

  if (areaValue <= 0) errors.push('Area must be greater than 0.');
  if (waterPerAcre <= 0) errors.push('Water volume per acre must be greater than 0.');
  if (selectedTankSize <= 0) errors.push('Tank size must be greater than 0.');

  let productPerLitre = 0;
  if (mode === 'activeIngredient') {
    const aiPercentage = toNumber(form.aiPercentage);
    const aiDose = toNumber(form.aiDose);
    if (aiPercentage <= 0 || aiPercentage > 100) errors.push('Active ingredient % must be greater than 0 and up to 100.');
    if (aiDose <= 0) errors.push('Recommended a.i. dose must be greater than 0.');
    if (errors.length === 0) {
      const aiDoseGramPerAcre = form.aiDoseUnit === 'kg-ai-ha' ? (aiDose * 1000) / HECTARE_TO_ACRES : aiDose;
      const aiFraction = aiPercentage / 100;
      const productPerAcre = aiDoseGramPerAcre / aiFraction;
      productPerLitre = productPerAcre / waterPerAcre;
    }
  } else {
    const directDose = toNumber(form.directDose);
    if (directDose <= 0) errors.push('Dose per litre must be greater than 0.');
    productPerLitre = directDose;
  }

  if (errors.length > 0) return { errors, result: null };

  const totalAcres = form.areaUnit === 'hectares' ? areaValue * HECTARE_TO_ACRES : areaValue;
  const totalWater = waterPerAcre * totalAcres;
  const exactTanks = totalWater / selectedTankSize;

  return {
    errors,
    result: {
      totalAcres,
      totalWater,
      exactTanks,
      tanksRequired: Math.ceil(exactTanks),
      selectedTankSize,
      productPerLitre,
      productPerSelectedTank: productPerLitre * selectedTankSize,
      totalProduct: productPerLitre * totalWater,
    },
  };
}

function getUnitLabels(unit: UnitType): UnitLabels {
  return unit === 'liquid'
    ? { base: 'mL', perLitre: 'mL/L', perTank: 'mL/tank', totalLarge: 'L' }
    : { base: 'g', perLitre: 'g/L', perTank: 'g/tank', totalLarge: 'kg' };
}

function toNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
}

function formatTotalProduct(value: number, labels: UnitLabels) {
  const base = `${formatNumber(value)} ${labels.base}`;
  if (value < 1000) return base;
  return `${base} (${formatNumber(value / 1000)} ${labels.totalLarge})`;
}

function buildShareText({ mode, form, calculation, unitLabels, t }: { mode: Mode; form: typeof initialForm; calculation: { result: PesticideResult | null }; unitLabels: UnitLabels; t: (english: string, telugu: string) => string }) {
  if (!calculation.result) return '';
  const result = calculation.result;
  const lines = [
    t('Pesticide Calculator Result', 'పురుగుమందు కాలిక్యులేటర్ ఫలితం'),
    `${t('Mode', 'మోడ్')}: ${mode === 'activeIngredient' ? t('Active Ingredient Mode', 'యాక్టివ్ ఇంగ్రిడియెంట్ మోడ్') : t('Direct Dose Mode', 'ప్రత్యక్ష మోతాదు మోడ్')}`,
  ];

  if (form.productName.trim()) lines.push(`${t('Product', 'ఉత్పత్తి')}: ${form.productName.trim()}`);

  lines.push(
    `${t('Area', 'విస్తీర్ణం')}: ${form.areaValue || '0'} ${form.areaUnit}`,
    `${t('Water', 'నీరు')}: ${formatNumber(result.totalWater)} L`,
    `${t('Product per litre', 'లీటరుకు ఉత్పత్తి')}: ${formatNumber(result.productPerLitre)} ${unitLabels.perLitre}`,
    `${t('Selected tank dose', 'ఎంచుకున్న ట్యాంక్ మోతాదు')}: ${formatNumber(result.productPerSelectedTank)} ${unitLabels.perTank}`,
    `${t('Spray tanks required', 'అవసరమైన స్ప్రే ట్యాంకులు')}: ${result.tanksRequired} (${t('Exact', 'ఖచ్చితం')}: ${formatNumber(result.exactTanks)})`,
    `${t('Total product', 'మొత్తం ఉత్పత్తి')}: ${formatTotalProduct(result.totalProduct, unitLabels)}`,
    '',
    t('Always verify pesticide label recommendation, crop, pest stage, waiting period and local agriculture officer advisory before spraying.', 'స్ప్రే చేసే ముందు పురుగుమందు లేబుల్ సిఫార్సు, పంట, పురుగు దశ, వెయిటింగ్ పీరియడ్ మరియు స్థానిక వ్యవసాయ అధికారి సూచనను తప్పనిసరిగా ధృవీకరించండి.')
  );

  return lines.join('\n');
}