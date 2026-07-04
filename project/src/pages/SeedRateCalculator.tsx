import React, { useMemo, useState } from 'react';
import { Copy, RotateCcw, Scale, ShieldAlert, Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { BackButton } from '../components/ui/BackButton';
import { LanguageToggle } from '../components/ui/LanguageToggle';

type AreaUnit = 'acres' | 'hectares';
type PopulationUnit = 'plants-acre' | 'plants-ha' | 'total-plants';

const HECTARE_TO_ACRES = 2.471;

const initialForm = {
  cropName: '',
  areaValue: '',
  areaUnit: 'acres' as AreaUnit,
  requiredPopulation: '',
  populationUnit: 'plants-acre' as PopulationUnit,
  seedsPerHill: '1',
  germinationPercentage: '',
  testWeight: '',
  wastagePercentage: '',
};

export function SeedRateCalculator() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [copied, setCopied] = useState(false);
  const calculation = useMemo(() => calculateSeedRate(form), [form]);
  const shareText = useMemo(() => buildShareText(form, calculation.result, t), [calculation.result, form, t]);

  const updateForm = (field: keyof typeof initialForm, value: string) => {
    setCopied(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const reset = () => {
    setCopied(false);
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
      <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-100 via-lime-50 to-cyan-100 p-3 shadow-md dark:border-emerald-900/60 dark:from-emerald-950/50 dark:via-slate-900 dark:to-cyan-950/40 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
              <Scale className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {t('Officer Toolkit', 'అధికారుల టూల్‌కిట్')}
              </p>
              <h1 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                {t('Seed Rate Calculator', 'విత్తన మోతాదు కాలిక్యులేటర్')}
              </h1>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                {t('Calculate seed requirement from population, germination and test weight.', 'జనాభా, మొలక శాతం మరియు టెస్ట్ వెయిట్ ఆధారంగా విత్తన అవసరాన్ని లెక్కించండి.')}
              </p>
            </div>
          </div>
          <BackButton onClick={() => navigate('/officer-toolkit/farm-calculators')}>
            Back
          </BackButton>
        </div>
      </section>

      <section className="rounded-xl border border-lime-200 bg-gradient-to-br from-lime-100 to-emerald-100 p-4 text-sm font-semibold text-emerald-950 shadow-md dark:border-emerald-900 dark:from-emerald-950/50 dark:to-lime-950/30 dark:text-emerald-100">
        <div className="grid gap-2 sm:grid-cols-3">
          <p><span className="font-black">1.</span> Enter crop area and required population.</p>
          <p><span className="font-black">2.</span> Add germination and test weight from seed label.</p>
          <p><span className="font-black">3.</span> Get seed required in kg.</p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-lime-100 p-3 shadow-md dark:border-emerald-900/60 dark:from-slate-900 dark:via-emerald-950/30 dark:to-lime-950/20">
        <button type="button" onClick={copyResult} disabled={!calculation.result} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700">
          <Copy className="h-4 w-4" />
          {copied ? t('Copied', 'కాపీ అయింది') : t('Copy Result', 'టెక్స్ట్ కాపీ')}
        </button>
        <button type="button" onClick={shareWhatsApp} disabled={!calculation.result} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700" aria-label="WhatsApp" title="WhatsApp">
          <WhatsAppIcon className="h-4 w-4" />
        </button>
        <LanguageToggle language={language} onClick={toggleLanguage} />
        <button type="button" onClick={reset} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
          <RotateCcw className="h-4 w-4" />
          {t('Reset', 'రీసెట్')}
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <FormSection title={t('Step 1: Crop and Area', 'పంట మరియు విస్తీర్ణం')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Crop name', 'పంట పేరు')} optional>
                <input value={form.cropName} onChange={(event) => updateForm('cropName', event.target.value)} className={inputClass} placeholder={t('Optional', 'ఐచ్ఛికం')} />
              </Field>
              <Field label={t('Area value', 'విస్తీర్ణం')}>
                <input type="number" min="0" inputMode="decimal" value={form.areaValue} onChange={(event) => updateForm('areaValue', event.target.value)} className={inputClass} placeholder="1" />
              </Field>
              <Field label={t('Area unit', 'విస్తీర్ణ యూనిట్')}>
                <select value={form.areaUnit} onChange={(event) => updateForm('areaUnit', event.target.value)} className={inputClass}>
                  <option value="acres">{t('Acres', 'ఎకరాలు')}</option>
                  <option value="hectares">{t('Hectares', 'హెక్టార్లు')}</option>
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title={t('Step 2: Seed Details', 'జనాభా మరియు విత్తన వివరాలు')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Required population', 'అవసరమైన మొక్కల జనాభా')}>
                <input type="number" min="0" inputMode="decimal" value={form.requiredPopulation} onChange={(event) => updateForm('requiredPopulation', event.target.value)} className={inputClass} placeholder="30000" />
              </Field>
              <Field label={t('Population unit', 'జనాభా యూనిట్')}>
                <select value={form.populationUnit} onChange={(event) => updateForm('populationUnit', event.target.value)} className={inputClass}>
                  <option value="plants-acre">{t('Plants per acre', 'ఎకరానికి మొక్కలు')}</option>
                  <option value="plants-ha">{t('Plants per hectare', 'హెక్టారుకు మొక్కలు')}</option>
                  <option value="total-plants">{t('Total plants', 'మొత్తం మొక్కలు')}</option>
                </select>
              </Field>
              <Field label={t('Seeds per hill', 'ఒక్క గుంతకు విత్తనాలు')}>
                <input type="number" min="0" inputMode="decimal" value={form.seedsPerHill} onChange={(event) => updateForm('seedsPerHill', event.target.value)} className={inputClass} placeholder="1" />
              </Field>
              <Field label={t('Germination percentage', 'మొలక శాతం')}>
                <input type="number" min="0" max="100" inputMode="decimal" value={form.germinationPercentage} onChange={(event) => updateForm('germinationPercentage', event.target.value)} className={inputClass} placeholder="85" />
              </Field>
              <Field label={t('Test weight', 'టెస్ట్ వెయిట్')} hint={t('Weight of 1000 seeds in grams', '1000 విత్తనాల బరువు గ్రాముల్లో')}>
                <input type="number" min="0" inputMode="decimal" value={form.testWeight} onChange={(event) => updateForm('testWeight', event.target.value)} className={inputClass} placeholder="8" />
              </Field>
              <Field label={t('Seed wastage / field loss %', 'విత్తన వృథా / పొలం నష్టం %')} optional>
                <input type="number" min="0" inputMode="decimal" value={form.wastagePercentage} onChange={(event) => updateForm('wastagePercentage', event.target.value)} className={inputClass} placeholder="10" />
              </Field>
            </div>
          </FormSection>
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
              <ResultGrid areaUnit={form.areaUnit} result={calculation.result} t={t} />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
                <div className="flex gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    {t('Actual seed rate may vary depending on seed size, germination, purity, sowing method, gap filling and field conditions.', 'విత్తన పరిమాణం, మొలక, స్వచ్ఛత, విత్తే విధానం, గ్యాప్ ఫిల్లింగ్ మరియు పొలం పరిస్థితులపై వాస్తవ విత్తన మోతాదు మారవచ్చు.')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-100 p-4 text-center shadow-md dark:border-emerald-900/60 dark:from-slate-900 dark:to-emerald-950/30">
              <Sprout className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-2 text-sm font-black text-slate-700 dark:text-slate-200">{t('Results will appear here', 'ఫలితాలు ఇక్కడ కనిపిస్తాయి')}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Enter area, population, germination and test weight.', 'విస్తీర్ణం, జనాభా, మొలక శాతం మరియు టెస్ట్ వెయిట్ నమోదు చేయండి.')}</p>
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

const resultCardPalette = [
  'from-emerald-100 to-lime-100 border-emerald-200',
  'from-sky-100 to-cyan-100 border-sky-200',
  'from-amber-100 to-orange-100 border-amber-200',
];

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-lime-100 p-4 shadow-md dark:border-emerald-900/60 dark:from-slate-900 dark:via-emerald-950/30 dark:to-lime-950/20">
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, optional, hint, children }: { label: string; optional?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
        <span>{label}</span>
        {optional && <span className="text-[11px] font-bold text-slate-400">Optional</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">{hint}</span>}
    </label>
  );
}

function ResultGrid({ areaUnit, result, t }: { areaUnit: AreaUnit; result: SeedRateResult; t: (english: string, telugu: string) => string }) {
  const seedRateValue = areaUnit === 'hectares'
    ? `${formatDecimal(result.seedRateKgPerHa)} kg/ha`
    : `${formatDecimal(result.seedRateKgPerAcre)} kg/acre`;
  const seedRateLabel = areaUnit === 'hectares' ? t('Seed rate kg/hectare', 'హెక్టారుకు విత్తన మోతాదు kg') : t('Seed rate kg/acre', 'ఎకరానికి విత్తన మోతాదు kg');

  const cards = [
    { label: seedRateLabel, value: seedRateValue, note: t('Recommended seed rate', 'సిఫార్సు చేసిన విత్తన మోతాదు') },
    { label: t('Total seed required', 'అవసరమైన మొత్తం విత్తనం'), value: `${formatDecimal(result.seedWeightKg)} kg`, note: `${formatWhole(result.finalSeeds)} ${t('seeds', 'విత్తనాలు')}` },
    { label: t('Plant population', 'మొక్కల జనాభా'), value: `${formatWhole(result.requiredPlants)} ${t('plants', 'మొక్కలు')}`, note: t('Required plants for selected area', 'ఎంచుకున్న విస్తీర్ణానికి అవసరమైన మొక్కలు') },
  ];

  return (
    <div className="grid gap-3">
      {cards.map((card, index) => (
        <article key={card.label} className={`rounded-xl border bg-gradient-to-br ${resultCardPalette[index % resultCardPalette.length]} p-4 shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-800`}>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
          <p className="mt-1 break-words text-2xl font-black text-slate-950 dark:text-white">{card.value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{card.note}</p>
        </article>
      ))}
    </div>
  );
}

const inputClass = 'min-h-11 w-full rounded-lg border border-emerald-200 bg-white/85 px-3 py-2 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-emerald-900 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-900/40';

interface SeedRateResult {
  totalAcres: number;
  totalHectares: number;
  requiredPlants: number;
  targetSeeds: number;
  adjustedSeeds: number;
  finalSeeds: number;
  seedWeightGrams: number;
  seedWeightKg: number;
  seedRateKgPerAcre: number;
  seedRateKgPerHa: number;
}

function calculateSeedRate(form: typeof initialForm): { errors: string[]; result: SeedRateResult | null } {
  const areaValue = toNumber(form.areaValue);
  const requiredPopulation = toNumber(form.requiredPopulation);
  const seedsPerHill = toNumber(form.seedsPerHill);
  const germinationPercentage = toNumber(form.germinationPercentage);
  const testWeight = toNumber(form.testWeight);
  const wastagePercentage = form.wastagePercentage.trim() ? toNumber(form.wastagePercentage) : 0;
  const errors: string[] = [];

  if (areaValue <= 0) errors.push('Area must be greater than 0.');
  if (requiredPopulation <= 0) errors.push('Required population must be greater than 0.');
  if (seedsPerHill <= 0) errors.push('Seeds per hill must be greater than 0.');
  if (germinationPercentage <= 0 || germinationPercentage > 100) errors.push('Germination % must be greater than 0 and up to 100.');
  if (testWeight <= 0) errors.push('Test weight must be greater than 0.');
  if (wastagePercentage < 0) errors.push('Wastage % must be 0 or more.');

  if (errors.length > 0) return { errors, result: null };

  const totalAcres = form.areaUnit === 'hectares' ? areaValue * HECTARE_TO_ACRES : areaValue;
  const totalHectares = totalAcres / HECTARE_TO_ACRES;
  const requiredPlants = getRequiredPlants(requiredPopulation, form.populationUnit, totalAcres, totalHectares);
  const germinationFraction = germinationPercentage / 100;
  const wastageFraction = wastagePercentage / 100;
  const targetSeeds = requiredPlants * seedsPerHill;
  const adjustedSeeds = targetSeeds / germinationFraction;
  const finalSeeds = adjustedSeeds * (1 + wastageFraction);
  const seedWeightGrams = (finalSeeds * testWeight) / 1000;
  const seedWeightKg = seedWeightGrams / 1000;

  return {
    errors,
    result: {
      totalAcres,
      totalHectares,
      requiredPlants,
      targetSeeds,
      adjustedSeeds,
      finalSeeds,
      seedWeightGrams,
      seedWeightKg,
      seedRateKgPerAcre: seedWeightKg / totalAcres,
      seedRateKgPerHa: seedWeightKg / totalHectares,
    },
  };
}

function getRequiredPlants(population: number, unit: PopulationUnit, totalAcres: number, totalHectares: number) {
  if (unit === 'plants-ha') return population * totalHectares;
  if (unit === 'total-plants') return population;
  return population * totalAcres;
}

function populationUnitLabel(unit: PopulationUnit) {
  if (unit === 'plants-ha') return 'plants/ha';
  if (unit === 'total-plants') return 'total plants';
  return 'plants/acre';
}

function toNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWhole(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function buildShareText(form: typeof initialForm, result: SeedRateResult | null, t: (english: string, telugu: string) => string) {
  if (!result) return '';
  const seedRateLine = form.areaUnit === 'hectares'
    ? `${t('Seed rate', 'విత్తన మోతాదు')}: ${formatDecimal(result.seedRateKgPerHa)} kg/ha`
    : `${t('Seed rate', 'విత్తన మోతాదు')}: ${formatDecimal(result.seedRateKgPerAcre)} kg/acre`;
  const lines = [t('Seed Rate Calculator Result', 'విత్తన మోతాదు కాలిక్యులేటర్ ఫలితం')];

  if (form.cropName.trim()) lines.push(`${t('Crop', 'పంట')}: ${form.cropName.trim()}`);

  lines.push(
    `${t('Area', 'విస్తీర్ణం')}: ${form.areaValue || '0'} ${form.areaUnit}`,
    `${t('Required population', 'అవసరమైన మొక్కల జనాభా')}: ${form.requiredPopulation || '0'} ${populationUnitLabel(form.populationUnit)}`,
    `${t('Seeds per hill', 'ఒక్క గుంతకు విత్తనాలు')}: ${form.seedsPerHill || '0'}`,
    `${t('Germination', 'మొలక')}: ${form.germinationPercentage || '0'}%`,
    `${t('Test weight', 'టెస్ట్ వెయిట్')}: ${form.testWeight || '0'} g/1000 seeds`,
    seedRateLine,
    `${t('Total seed required', 'అవసరమైన మొత్తం విత్తనం')}: ${formatDecimal(result.seedWeightKg)} kg`,
    `${t('Plant population', 'మొక్కల జనాభా')}: ${formatWhole(result.requiredPlants)} ${t('plants', 'మొక్కలు')}`,
    `${t('Final seeds', 'చివరి విత్తనాలు')}: ${formatWhole(result.finalSeeds)} ${t('seeds', 'విత్తనాలు')}`,
    '',
    t('Actual seed rate may vary depending on seed size, germination, purity, sowing method, gap filling and field conditions.', 'విత్తన పరిమాణం, మొలక, స్వచ్ఛత, విత్తే విధానం, గ్యాప్ ఫిల్లింగ్ మరియు పొలం పరిస్థితులపై వాస్తవ విత్తన మోతాదు మారవచ్చు.')
  );

  return lines.join('\n');
}