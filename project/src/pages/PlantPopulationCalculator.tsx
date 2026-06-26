import React, { useMemo, useState } from 'react';
import { ArrowLeft, Copy, Languages, Leaf, RotateCcw, Ruler, Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

type AreaUnit = 'acres' | 'hectares';
type SpacingUnit = 'cm' | 'm' | 'feet' | 'inches';

const SQ_METERS_PER_ACRE = 4000;
const SQ_METERS_PER_HECTARE = 10000;

const initialForm = {
  cropName: '',
  areaValue: '',
  areaUnit: 'acres' as AreaUnit,
  rowSpacing: '',
  rowSpacingUnit: 'cm' as SpacingUnit,
  plantSpacing: '',
  plantSpacingUnit: 'cm' as SpacingUnit,
};

export function PlantPopulationCalculator() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [copied, setCopied] = useState(false);
  const calculation = useMemo(() => calculatePlantPopulation(form), [form]);
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
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-green-700 dark:text-green-300">
                {t('Officer Toolkit', 'అధికారుల టూల్‌కిట్')}
              </p>
              <h1 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                {t('Plant Population Calculator', 'మొక్కల జనాభా కాలిక్యులేటర్')}
              </h1>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                {t('Calculate plant stand from row and plant spacing.', 'వరుసల మధ్య మరియు మొక్కల మధ్య దూరం ఆధారంగా మొక్కల సంఖ్యను లెక్కించండి.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/officer-toolkit/farm-calculators')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
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
          <FormSection title={t('Crop and Area', 'పంట మరియు విస్తీర్ణం')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Crop name', 'పంట పేరు')} optional>
                <input
                  value={form.cropName}
                  onChange={(event) => updateForm('cropName', event.target.value)}
                  className={inputClass}
                  placeholder={t('Optional', 'ఐచ్ఛికం')}
                />
              </Field>
              <Field label={t('Area value', 'విస్తీర్ణం')}>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={form.areaValue}
                  onChange={(event) => updateForm('areaValue', event.target.value)}
                  className={inputClass}
                  placeholder="1"
                />
              </Field>
              <Field label={t('Area unit', 'విస్తీర్ణ యూనిట్')}>
                <select value={form.areaUnit} onChange={(event) => updateForm('areaUnit', event.target.value)} className={inputClass}>
                  <option value="acres">{t('Acres', 'ఎకరాలు')}</option>
                  <option value="hectares">{t('Hectares', 'హెక్టార్లు')}</option>
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title={t('Spacing', 'దూరం')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Row-to-row spacing', 'వరుస నుంచి వరుస దూరం')}>
                <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={form.rowSpacing}
                    onChange={(event) => updateForm('rowSpacing', event.target.value)}
                    className={inputClass}
                    placeholder="90"
                  />
                  <select value={form.rowSpacingUnit} onChange={(event) => updateForm('rowSpacingUnit', event.target.value)} className={inputClass} aria-label={t('Row spacing unit', 'వరుస దూరం యూనిట్')}>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                    <option value="feet">feet</option>
                    <option value="inches">inches</option>
                  </select>
                </div>
              </Field>
              <Field label={t('Plant-to-plant spacing', 'మొక్క నుంచి మొక్క దూరం')}>
                <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={form.plantSpacing}
                    onChange={(event) => updateForm('plantSpacing', event.target.value)}
                    className={inputClass}
                    placeholder="15"
                  />
                  <select value={form.plantSpacingUnit} onChange={(event) => updateForm('plantSpacingUnit', event.target.value)} className={inputClass} aria-label={t('Plant spacing unit', 'మొక్క దూరం యూనిట్')}>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                    <option value="feet">feet</option>
                    <option value="inches">inches</option>
                  </select>
                </div>
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
                  <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    {t('Actual field population may vary due to germination percentage, gap filling, thinning and field layout.', 'మొలక శాతం, ఖాళీలు నింపడం, పలుచన చేయడం మరియు పొలం అమరిక వల్ల వాస్తవ మొక్కల సంఖ్య మారవచ్చు.')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <Ruler className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-2 text-sm font-black text-slate-700 dark:text-slate-200">{t('Results will appear here', 'ఫలితాలు ఇక్కడ కనిపిస్తాయి')}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Enter area and spacing details.', 'విస్తీర్ణం మరియు దూరం వివరాలు నమోదు చేయండి.')}</p>
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

function ResultGrid({ areaUnit, result, t }: { areaUnit: AreaUnit; result: PlantPopulationResult; t: (english: string, telugu: string) => string }) {
  const densityCard = areaUnit === 'hectares'
    ? { label: t('Plants per hectare', 'హెక్టారుకు మొక్కలు'), value: `${formatWhole(result.plantsPerHectare)} plants/ha`, note: t('Based on selected hectare output', 'ఎంచుకున్న హెక్టారు ఆధారంగా') }
    : { label: t('Plants per acre', 'ఎకరానికి మొక్కలు'), value: `${formatWhole(result.plantsPerAcre)} plants/acre`, note: t('Based on selected acre output', 'ఎంచుకున్న ఎకరా ఆధారంగా') };

  const cards = [
    { label: t('Total plant population', 'మొత్తం మొక్కల సంఖ్య'), value: `${formatWhole(result.totalPlants)} ${t('plants', 'మొక్కలు')}`, note: t('For selected area', 'ఎంచుకున్న విస్తీర్ణానికి') },
    densityCard,
    { label: t('Area per plant', 'ఒక్క మొక్కకు విస్తీర్ణం'), value: `${result.areaPerPlant.toFixed(3)} sq. m`, note: t('Row spacing x plant spacing', 'వరుస దూరం x మొక్క దూరం') },
    { label: t('Plants per square meter', 'చదరపు మీటరుకు మొక్కలు'), value: result.plantsPerSqMeter.toFixed(2), note: t('Density estimate', 'సాంద్రత అంచనా') },
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

interface PlantPopulationResult {
  rowSpacingMeters: number;
  plantSpacingMeters: number;
  areaSqMeters: number;
  areaPerPlant: number;
  plantsPerSqMeter: number;
  totalPlants: number;
  plantsPerAcre: number;
  plantsPerHectare: number;
}

function calculatePlantPopulation(form: typeof initialForm): { errors: string[]; result: PlantPopulationResult | null } {
  const areaValue = toNumber(form.areaValue);
  const rowSpacing = toNumber(form.rowSpacing);
  const plantSpacing = toNumber(form.plantSpacing);
  const errors: string[] = [];

  if (areaValue <= 0) errors.push('Area must be greater than 0.');
  if (rowSpacing <= 0) errors.push('Row spacing must be greater than 0.');
  if (plantSpacing <= 0) errors.push('Plant spacing must be greater than 0.');

  if (errors.length > 0) return { errors, result: null };

  const rowSpacingMeters = toMeters(rowSpacing, form.rowSpacingUnit);
  const plantSpacingMeters = toMeters(plantSpacing, form.plantSpacingUnit);
  const areaSqMeters = form.areaUnit === 'hectares' ? areaValue * SQ_METERS_PER_HECTARE : areaValue * SQ_METERS_PER_ACRE;
  const areaPerPlant = rowSpacingMeters * plantSpacingMeters;
  const plantsPerSqMeter = 1 / areaPerPlant;

  return {
    errors,
    result: {
      rowSpacingMeters,
      plantSpacingMeters,
      areaSqMeters,
      areaPerPlant,
      plantsPerSqMeter,
      totalPlants: areaSqMeters / areaPerPlant,
      plantsPerAcre: SQ_METERS_PER_ACRE / areaPerPlant,
      plantsPerHectare: SQ_METERS_PER_HECTARE / areaPerPlant,
    },
  };
}

function toMeters(value: number, unit: SpacingUnit) {
  if (unit === 'cm') return value / 100;
  if (unit === 'feet') return value * 0.3048;
  if (unit === 'inches') return value * 0.0254;
  return value;
}

function toNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWhole(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
}

function buildShareText(form: typeof initialForm, result: PlantPopulationResult | null, t: (english: string, telugu: string) => string) {
  if (!result) return '';
  const densityLine = form.areaUnit === 'hectares'
    ? `${t('Plants per hectare', 'హెక్టారుకు మొక్కలు')}: ${formatWhole(result.plantsPerHectare)} plants/ha`
    : `${t('Plants per acre', 'ఎకరానికి మొక్కలు')}: ${formatWhole(result.plantsPerAcre)} plants/acre`;
  const lines = [t('Plant Population Calculator Result', 'మొక్కల జనాభా కాలిక్యులేటర్ ఫలితం')];

  if (form.cropName.trim()) lines.push(`${t('Crop', 'పంట')}: ${form.cropName.trim()}`);

  lines.push(
    `${t('Area', 'విస్తీర్ణం')}: ${form.areaValue || '0'} ${form.areaUnit}`,
    `${t('Row spacing', 'వరుస దూరం')}: ${form.rowSpacing || '0'} ${form.rowSpacingUnit}`,
    `${t('Plant spacing', 'మొక్క దూరం')}: ${form.plantSpacing || '0'} ${form.plantSpacingUnit}`,
    `${t('Total plant population', 'మొత్తం మొక్కల సంఖ్య')}: ${formatWhole(result.totalPlants)} ${t('plants', 'మొక్కలు')}`,
    densityLine,
    `${t('Area per plant', 'ఒక్క మొక్కకు విస్తీర్ణం')}: ${result.areaPerPlant.toFixed(3)} sq. m`,
    `${t('Plants per square meter', 'చదరపు మీటరుకు మొక్కలు')}: ${result.plantsPerSqMeter.toFixed(2)}`,
    '',
    t('Actual field population may vary due to germination percentage, gap filling, thinning and field layout.', 'మొలక శాతం, ఖాళీలు నింపడం, పలుచన చేయడం మరియు పొలం అమరిక వల్ల వాస్తవ మొక్కల సంఖ్య మారవచ్చు.')
  );

  return lines.join('\n');
}