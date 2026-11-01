import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Layers,
  Printer,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  Wheat,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { CompactToolkitHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { useAuth } from '../../../shared/context/AuthContext';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';

type AreaUnit = 'acres' | 'hectares';
type PopulationUnit = 'plants-acre' | 'plants-ha' | 'total-plants';

const HECTARE_TO_ACRES = 2.471;

const initialForm = {
  cropName: '',
  areaValue: '1',
  areaUnit: 'acres' as AreaUnit,
  requiredPopulation: '7400',
  populationUnit: 'plants-acre' as PopulationUnit,
  seedsPerHill: '1',
  germinationPercentage: '75',
  testWeight: '90',
  wastagePercentage: '5',
};

const POPULAR_SEED_PRESETS = [
  { name: 'Bt Cotton', nameTe: 'బిటి పత్తి', pop: '7400', popUnit: 'plants-acre' as PopulationUnit, seedsPerHill: '1', germ: '75', testWeight: '90', wastage: '5', icon: '🌱' },
  { name: 'Bengal Gram', nameTe: 'శనగ', pop: '90000', popUnit: 'plants-acre' as PopulationUnit, seedsPerHill: '1', germ: '85', testWeight: '200', wastage: '5', icon: '🫘' },
  { name: 'Paddy (Transplanted)', nameTe: 'వరి (నాట్లు)', pop: '133000', popUnit: 'plants-acre' as PopulationUnit, seedsPerHill: '2', germ: '85', testWeight: '24', wastage: '5', icon: '🌾' },
  { name: 'Maize (Hybrid)', nameTe: 'మొక్కజొన్న', pop: '33000', popUnit: 'plants-acre' as PopulationUnit, seedsPerHill: '1', germ: '90', testWeight: '280', wastage: '5', icon: '🌽' },
  { name: 'Redgram', nameTe: 'కందులు', pop: '22000', popUnit: 'plants-acre' as PopulationUnit, seedsPerHill: '1', germ: '85', testWeight: '75', wastage: '5', icon: '🌿' },
  { name: 'Soybean', nameTe: 'సోయాబీన్', pop: '160000', popUnit: 'plants-acre' as PopulationUnit, seedsPerHill: '1', germ: '70', testWeight: '120', wastage: '5', icon: '🍃' },
];

const numericFieldWarnings: Partial<Record<keyof typeof initialForm, { isInvalid: (value: number) => boolean; message: [string, string] }>> = {
  areaValue: { isInvalid: (v) => v <= 0, message: ['Area must be greater than 0.', 'విస్తీర్ణం 0 కంటే ఎక్కువగా ఉండాలి.'] },
  requiredPopulation: { isInvalid: (v) => v <= 0, message: ['Required population must be greater than 0.', 'అవసరమైన జనాభా 0 కంటే ఎక్కువగా ఉండాలి.'] },
  seedsPerHill: { isInvalid: (v) => v <= 0, message: ['Seeds per hill must be greater than 0.', 'ఒక్క గుంతకు విత్తనాలు 0 కంటే ఎక్కువగా ఉండాలి.'] },
  germinationPercentage: { isInvalid: (v) => v <= 0 || v > 100, message: ['Germination % must be greater than 0 and up to 100.', 'మొలక శాతం 0 కంటే ఎక్కువగా మరియు 100 వరకు ఉండాలి.'] },
  testWeight: { isInvalid: (v) => v <= 0, message: ['Test weight must be greater than 0.', 'టెస్ట్ వెయిట్ 0 కంటే ఎక్కువగా ఉండాలి.'] },
  wastagePercentage: { isInvalid: (v) => v < 0, message: ['Wastage % must be 0 or more.', 'వృథా శాతం 0 లేదా అంతకంటే ఎక్కువగా ఉండాలి.'] },
};

function isIntermediateTyping(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed === '' ||
    trimmed === '.' ||
    trimmed === '-' ||
    trimmed === '0' ||
    trimmed === '0.' ||
    /^0\.0*$/.test(trimmed) ||
    trimmed.endsWith('.')
  );
}

function WhatsAppIcon({ className = '' }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function SeedRateCalculator() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const { isAdminUser, isTestUser } = useAuth();
  const showCompactHeader = isAdminUser || isTestUser;
  const [form, setForm] = useState(initialForm);
  const [copied, setCopied] = useState(false);
  const { toasts, removeToast, showWarning, showSuccess } = useToast();
  const calculation = useMemo(() => calculateSeedRate(form), [form]);
  const shareText = useMemo(() => buildShareText(form, calculation.result, t), [calculation.result, form, t]);

  const updateForm = (field: keyof typeof initialForm, value: string) => {
    setCopied(false);
    const warning = numericFieldWarnings[field];
    if (warning && !isIntermediateTyping(value)) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        const isStrictlyInvalid = parsed < 0 || (warning.isInvalid(parsed) && parsed !== 0);
        if (isStrictlyInvalid) {
          showWarning(t('Invalid input', 'చెల్లని ఇన్‌పుట్'), t(warning.message[0], warning.message[1]));
        }
      }
    }
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleBlur = (field: keyof typeof initialForm) => {
    const value = form[field];
    if (!value || value.trim() === '') return;
    const warning = numericFieldWarnings[field];
    if (warning) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed) && warning.isInvalid(parsed)) {
        showWarning(t('Invalid input', 'చెల్లని ఇన్‌పుట్'), t(warning.message[0], warning.message[1]));
      }
    }
  };

  const applySeedPreset = (preset: typeof POPULAR_SEED_PRESETS[0]) => {
    setForm((prev) => ({
      ...prev,
      cropName: preset.name,
      requiredPopulation: preset.pop,
      populationUnit: preset.popUnit,
      seedsPerHill: preset.seedsPerHill,
      germinationPercentage: preset.germ,
      testWeight: preset.testWeight,
      wastagePercentage: preset.wastage,
    }));
    showSuccess(
      t('Preset Loaded', 'ప్రిసెట్ లోడ్ అయింది'),
      t(`Loaded seed parameters for ${preset.name}.`, `${preset.nameTe} విత్తన వివరాలు లోడ్ చేయబడ్డాయి.`)
    );
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
      showSuccess(t('Result Copied', 'ఫలితం కాపీ అయింది'), t('Summary copied to clipboard.', 'సారాంశం క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది.'));
    } catch {
      setCopied(false);
    }
  };

  const shareWhatsApp = () => {
    if (!calculation.result) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 sm:px-6 lg:px-8 print:hidden">
        {showCompactHeader ? (
          <CompactToolkitHeader
            icon={Scale}
            eyebrow={t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
            title={t('Seed Rate Calculator', 'విత్తన మోతాదు కాలిక్యులేటర్')}
            subtitle={t(
              'Calculate precise seed weight requirement from plant population, germination % and test weight.',
              'జనాభా, మొలక శాతం మరియు టెస్ట్ వెయిట్ ఆధారంగా విత్తన అవసరాన్ని లెక్కించండి.'
            )}
            onBack={() => navigate('/officer-toolkit/farm-calculators')}
            actions={<LanguageToggle language={language} onClick={toggleLanguage} accent="emerald" />}
            className="mb-1"
          />
        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-lime-300/60 bg-gradient-to-br from-lime-600 via-green-600 to-emerald-700 p-3.5 sm:p-4 text-white shadow-md dark:border-lime-700/60">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
              <BackButton onClick={() => navigate('/officer-toolkit/farm-calculators')} tone="solid" className="mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                    <Scale className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" aria-label="Seed Rate Calculator" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-lime-100 mb-0.5">
                      {t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
                    </p>
                    <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug tracking-tight">
                      {t('Seed Rate Calculator', 'విత్తన మోతాదు కాలిక్యులేటర్')}
                    </h1>
                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                      {t(
                        'Calculate seed quantity requirement in kg from label details.',
                        'జనాభా, మొలక శాతం మరియు టెస్ట్ వెయిట్ ఆధారంగా విత్తన అవసరాన్ని లెక్కించండి.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start pt-1">
                <LanguageToggle language={language} onClick={toggleLanguage} tone="solid" />
              </div>
            </div>
          </section>
        )}


      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-8 sm:px-6 lg:px-8">
        {/* Step 1: Quick Crop Seed Label Presets */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                {t('Crop Seed Label Presets', 'పంట విత్తన లేబుల్ ప్రిసెట్లు')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('Tap a crop to auto-fill standard test weight, germination % and plant density.', 'సిఫార్సు చేయబడిన టెస్ట్ వెయిట్, మొలక శాతం పూరించడానికి ఒక పంటను ఎంచుకోండి.')}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('Reset', 'రీసెట్')}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR_SEED_PRESETS.map((preset) => {
              const isActive = form.cropName === preset.name && form.testWeight === preset.testWeight && form.germinationPercentage === preset.germ;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applySeedPreset(preset)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{t(preset.name, preset.nameTe)}</span>
                  <span className="text-[10px] font-semibold opacity-75">
                    (TW: {preset.testWeight}g · {preset.germ}%)
                  </span>
                  {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-5 lg:grid-cols-12 items-start">
          {/* LEFT: Inputs Form (7 cols) */}
          <div className="space-y-4 lg:col-span-7">
            {/* Step 1: Crop and Extent */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Wheat className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('1. Crop & Field Area', '1. పంట & పొలం విస్తీర్ణం')}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {t('Target extent and seeds per sowing hill / dibble point', 'సాగు విస్తీర్ణం మరియు ఒక గుంతకు విత్తనాల సంఖ్య')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Crop Name', 'పంట పేరు')}
                    <span className="ml-1 text-[11px] font-normal text-slate-400">({t('Optional', 'ఐచ్ఛికం')})</span>
                  </label>
                  <input
                    value={form.cropName}
                    onChange={(event) => updateForm('cropName', event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="e.g. Cotton"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Cultivated Area', 'సాగు విస్తీర్ణం')}
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={form.areaValue}
                      onChange={(event) => updateForm('areaValue', event.target.value)}
                      onBlur={() => handleBlur('areaValue')}
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="1"
                    />
                    <select
                      value={form.areaUnit}
                      onChange={(event) => updateForm('areaUnit', event.target.value as AreaUnit)}
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="acres">{t('Acres', 'ఎకరాలు')}</option>
                      <option value="hectares">{t('Hectares', 'హెక్టార్లు')}</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Seeds per Hill', 'గుంతకు విత్తనాలు')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.seedsPerHill}
                    onChange={(event) => updateForm('seedsPerHill', event.target.value)}
                    onBlur={() => handleBlur('seedsPerHill')}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="1"
                  />
                </div>
              </div>
            </section>

            {/* Step 2: Seed Label Quality Specs */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('2. Seed Label Quality Details', '2. విత్తన లేబుల్ నాణ్యతా వివరాలు')}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {t('Test weight (g per 1000 seeds) and germination % printed on bag tag', 'బ్యాగ్‌పై ముద్రించిన టెస్ట్ వెయిట్ మరియు మొలక శాతం')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Germination Percentage', 'మొలక శాతం')}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      inputMode="decimal"
                      value={form.germinationPercentage}
                      onChange={(event) => updateForm('germinationPercentage', event.target.value)}
                      onBlur={() => handleBlur('germinationPercentage')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-7 text-sm font-black text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="85"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Test Weight (1000 seeds)', 'టెస్ట్ వెయిట్ (1000 విత్తనాలు)')}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      inputMode="decimal"
                      value={form.testWeight}
                      onChange={(event) => updateForm('testWeight', event.target.value)}
                      onBlur={() => handleBlur('testWeight')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-black text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="90"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">g</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Wastage / Gap-fill Buffer', 'వృథా / గ్యాప్-ఫిల్లింగ్ శాతం')}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      inputMode="decimal"
                      value={form.wastagePercentage}
                      onChange={(event) => updateForm('wastagePercentage', event.target.value)}
                      onBlur={() => handleBlur('wastagePercentage')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-7 text-sm font-black text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="5"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Required Population Target */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('3. Plant Population Target', '3. లక్ష్యిత మొక్కల జనాభా')}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {t('Target plant stand per acre or per hectare according to agronomic package', 'సాగు సిఫార్సుల ప్రకారం ఎకరా లేదా హెక్టారుకు అవసరమైన మొక్కల సంఖ్య')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Target Population Count', 'లక్ష్యిత మొక్కల సంఖ్య')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    inputMode="numeric"
                    value={form.requiredPopulation}
                    onChange={(event) => updateForm('requiredPopulation', event.target.value)}
                    onBlur={() => handleBlur('requiredPopulation')}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="7400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Population Metric Unit', 'జనాభా కొలత యూనిట్')}
                  </label>
                  <select
                    value={form.populationUnit}
                    onChange={(event) => updateForm('populationUnit', event.target.value as PopulationUnit)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="plants-acre">{t('Plants per Acre', 'ఎకరానికి మొక్కలు')}</option>
                    <option value="plants-ha">{t('Plants per Hectare', 'హెక్టారుకు మొక్కలు')}</option>
                    <option value="total-plants">{t('Total Field Plants', 'మొత్తం పొలం మొక్కలు')}</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Live Results & Seed Weight Hero Card (Sticky 5 cols) */}
          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-4">
            {calculation.result ? (
              <>
                {/* Hero Seed Rate Card */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/60 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-900 p-5 shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur-sm">
                      <Scale className="h-3.5 w-3.5 text-emerald-300" />
                      {t('RECOMMENDED SEED QUANTITY', 'సిఫార్సు చేయబడిన విత్తన పరిమాణం')}
                    </span>
                    <span className="text-xs font-bold text-emerald-200">
                      {form.areaValue} {t(form.areaUnit, form.areaUnit)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                      {t('Total Seed Required', 'మొత్తం అవసరమైన విత్తనం')}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight">
                        {formatDecimal(calculation.result.seedWeightKg)}
                      </span>
                      <span className="text-sm font-bold text-emerald-200">
                        kg ({formatDecimal(calculation.result.seedWeightGrams)} g)
                      </span>
                    </div>
                  </div>

                  {/* Sub-metrics Grid */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/15 pt-4">
                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Seed Rate / Acre', 'ఎకరానికి విత్తన మోతాదు')}
                      </span>
                      <span className="text-base font-black text-white">
                        {formatDecimal(calculation.result.seedRateKgPerAcre)} kg/ac
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Seed Rate / Hectare', 'హెక్టారుకు విత్తన మోతాదు')}
                      </span>
                      <span className="text-base font-black text-white">
                        {formatDecimal(calculation.result.seedRateKgPerHa)} kg/ha
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Target Plant Stand', 'లక్ష్యిత మొక్కల సంఖ్య')}
                      </span>
                      <span className="text-base font-black text-white">
                        {formatWhole(calculation.result.requiredPlants)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Adjusted Seed Count', 'సరిచేసిన విత్తనాల సంఖ్య')}
                      </span>
                      <span className="text-base font-black text-white">
                        {formatWhole(calculation.result.finalSeeds)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seed Quality Advisory Note */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex gap-2.5 items-start">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="font-semibold leading-relaxed">
                      {t(
                        'Actual requirement varies with seed purity, grade size, seedbed moisture, and mechanical sowing calibration.',
                        'విత్తన స్వచ్ఛత, పరిమాణం, తేమ మరియు విత్తే యంత్రాల అమరికపై వాస్తవ విత్తన మోతాదు మారవచ్చు.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={copyResult}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-slate-800 active:scale-95 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? t('Copied', 'కాపీ అయింది') : t('Copy Result', 'ఫలితం కాపీ')}
                  </button>

                  <button
                    type="button"
                    onClick={shareWhatsApp}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
                    title="Share on WhatsApp"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('WhatsApp', 'వాట్సాప్')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    title="Print"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <Scale className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {t('Enter valid area, population and test weight to calculate seed rate.', 'విత్తన మోతాదును లెక్కించడానికి విస్తీర్ణం, జనాభా మరియు టెస్ట్ వెయిట్‌ను నమోదు చేయండి.')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

export function calculateSeedRate(form: typeof initialForm): { errors: string[]; result: SeedRateResult | null } {
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
