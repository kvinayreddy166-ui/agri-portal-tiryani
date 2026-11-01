import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Leaf,
  Printer,
  RotateCcw,
  Ruler,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { CompactToolkitHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { useAuth } from '../../../shared/context/AuthContext';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';

type AreaUnit = 'acres' | 'hectares';
type SpacingUnit = 'cm' | 'm' | 'feet' | 'inches';

export const SQ_METERS_PER_ACRE = 4046.86;
const SQ_METERS_PER_HECTARE = 10000;

const initialForm = {
  cropName: 'HDPS Cotton',
  areaValue: '1',
  areaUnit: 'acres' as AreaUnit,
  rowSpacing: '90',
  rowSpacingUnit: 'cm' as SpacingUnit,
  plantSpacing: '15',
  plantSpacingUnit: 'cm' as SpacingUnit,
};

const POPULAR_SPACING_PRESETS = [
  { name: 'HDPS Cotton', nameTe: 'HDPS పత్తి', row: '90', plant: '15', unit: 'cm' as SpacingUnit, icon: '🌱' },
  { name: 'CS Cotton', nameTe: 'సాధారణ పత్తి (CS)', row: '90', plant: '30', unit: 'cm' as SpacingUnit, icon: '🌱' },
  { name: 'Bengal Gram', nameTe: 'శనగ', row: '30', plant: '15', unit: 'cm' as SpacingUnit, icon: '🫘' },
  { name: 'Maize', nameTe: 'మొక్కజొన్న', row: '60', plant: '20', unit: 'cm' as SpacingUnit, icon: '🌽' },
  { name: 'Paddy', nameTe: 'వరి', row: '20', plant: '15', unit: 'cm' as SpacingUnit, icon: '🌾' },
  { name: 'Redgram', nameTe: 'కందులు', row: '90', plant: '20', unit: 'cm' as SpacingUnit, icon: '🌿' },
  { name: 'Chilli', nameTe: 'మిరప', row: '60', plant: '45', unit: 'cm' as SpacingUnit, icon: '🌶️' },
  { name: 'Tomato', nameTe: 'టమోటా', row: '60', plant: '45', unit: 'cm' as SpacingUnit, icon: '🍅' },
  { name: 'Soybean', nameTe: 'సోయాబీన్', row: '45', plant: '10', unit: 'cm' as SpacingUnit, icon: '🍃' },
];

const numericFieldWarnings: Partial<Record<keyof typeof initialForm, { isInvalid: (value: number) => boolean; message: [string, string] }>> = {
  areaValue: { isInvalid: (v) => v <= 0, message: ['Area must be greater than 0.', 'విస్తీర్ణం 0 కంటే ఎక్కువగా ఉండాలి.'] },
  rowSpacing: { isInvalid: (v) => v <= 0, message: ['Row spacing must be greater than 0.', 'వరుస దూరం 0 కంటే ఎక్కువగా ఉండాలి.'] },
  plantSpacing: { isInvalid: (v) => v <= 0, message: ['Plant spacing must be greater than 0.', 'మొక్క దూరం 0 కంటే ఎక్కువగా ఉండాలి.'] },
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

export function PlantPopulationCalculator() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const { isAdminUser, isTestUser } = useAuth();
  const showCompactHeader = isAdminUser || isTestUser;
  const [form, setForm] = useState(initialForm);
  const [copied, setCopied] = useState(false);
  const { toasts, removeToast, showWarning, showSuccess } = useToast();
  const calculation = useMemo(() => calculatePlantPopulation(form), [form]);
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

  const applySpacingPreset = (preset: typeof POPULAR_SPACING_PRESETS[0]) => {
    setForm((prev) => ({
      ...prev,
      cropName: preset.name,
      rowSpacing: preset.row,
      plantSpacing: preset.plant,
      rowSpacingUnit: preset.unit,
      plantSpacingUnit: preset.unit,
    }));
    showSuccess(
      t('Preset Loaded', 'ప్రిసెట్ లోడ్ అయింది'),
      t(`Loaded spacing for ${preset.name} (${preset.row} × ${preset.plant} ${preset.unit}).`, `${preset.nameTe} దూరం లోడ్ చేయబడింది.`)
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
            icon={Sprout}
            eyebrow={t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
            title={t('Plant Population Calculator', 'మొక్కల జనాభా కాలిక్యులేటర్')}
            subtitle={t(
              'Calculate field plant stand, plant density and area per plant from row spacing.',
              'వరుసల మధ్య మరియు మొక్కల మధ్య దూరం ఆధారంగా మొక్కల సంఖ్యను లెక్కించండి.'
            )}
            onBack={() => navigate('/officer-toolkit/farm-calculators')}
            actions={<LanguageToggle language={language} onClick={toggleLanguage} accent="emerald" />}
            className="mb-1"
          />
        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-green-300/60 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-3.5 sm:p-4 text-white shadow-md dark:border-green-700/60">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
              <BackButton onClick={() => navigate('/officer-toolkit/farm-calculators')} tone="solid" className="mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                    <Sprout className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" aria-label="Plant Population Calculator" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-green-100 mb-0.5">
                      {t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
                    </p>
                    <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug tracking-tight">
                      {t('Plant Population Calculator', 'మొక్కల జనాభా కాలిక్యులేటర్')}
                    </h1>
                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                      {t(
                        'Calculate plant stand and density from row and plant spacing.',
                        'వరుసల మధ్య మరియు మొక్కల మధ్య దూరం ఆధారంగా మొక్కల సంఖ్యను లెక్కించండి.'
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
        {/* Step 1: Quick Crop Spacing Presets */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                {t('Standard Crop Spacing Presets', 'ప్రామాణిక పంట దూరం ప్రిసెట్లు')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('Tap a crop to auto-fill recommended row & plant spacing.', 'సిఫార్సు చేయబడిన వరుస మరియు మొక్క దూరాన్ని పూరించడానికి ఒక పంటను ఎంచుకోండి.')}
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
            {POPULAR_SPACING_PRESETS.map((preset) => {
              const isActive = form.cropName === preset.name && form.rowSpacing === preset.row && form.plantSpacing === preset.plant;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applySpacingPreset(preset)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{t(preset.name, preset.nameTe)}</span>
                  <span className="text-[10px] font-semibold opacity-75">
                    ({preset.row}×{preset.plant} {preset.unit})
                  </span>
                  {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2-Column Responsive Grid */}
        <div className="grid gap-5 lg:grid-cols-12 items-start">
          {/* LEFT: Inputs Form */}
          <div className="space-y-4 lg:col-span-7">
            {/* Step 1: Crop and Area */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Sprout className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('1. Crop & Field Area', '1. పంట & పొలం విస్తీర్ణం')}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {t('Specify crop identification and total cultivation extent', 'పంట పేరు మరియు సాగు విస్తీర్ణం నమోదు చేయండి')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Crop Name', 'పంట పేరు')}
                    <span className="ml-1 text-[11px] font-normal text-slate-400">({t('Optional', 'ఐచ్ఛికం')})</span>
                  </label>
                  <input
                    value={form.cropName}
                    onChange={(event) => updateForm('cropName', event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="e.g. Cotton, Maize..."
                  />
                </div>

                <div>
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
              </div>
            </section>

            {/* Step 2: Spacing Details */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('2. Row & Plant Spacing', '2. వరుస మరియు మొక్కల మధ్య దూరం')}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {t('Enter row-to-row and plant-to-plant distances with units', 'వరుసల మధ్య మరియు మొక్కల మధ్య కొలతలను నమోదు చేయండి')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Row-to-Row Spacing (R)', 'వరుస నుంచి వరుస దూరం')}
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={form.rowSpacing}
                      onChange={(event) => updateForm('rowSpacing', event.target.value)}
                      onBlur={() => handleBlur('rowSpacing')}
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="90"
                    />
                    <select
                      value={form.rowSpacingUnit}
                      onChange={(event) => updateForm('rowSpacingUnit', event.target.value as SpacingUnit)}
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="cm">cm (సెం.మీ)</option>
                      <option value="m">m (మీటర్లు)</option>
                      <option value="feet">feet (అడుగులు)</option>
                      <option value="inches">inches (అంగుళాలు)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Plant-to-Plant Spacing (P)', 'మొక్క నుంచి మొక్క దూరం')}
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={form.plantSpacing}
                      onChange={(event) => updateForm('plantSpacing', event.target.value)}
                      onBlur={() => handleBlur('plantSpacing')}
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="60"
                    />
                    <select
                      value={form.plantSpacingUnit}
                      onChange={(event) => updateForm('plantSpacingUnit', event.target.value as SpacingUnit)}
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="cm">cm (సెం.మీ)</option>
                      <option value="m">m (మీటర్లు)</option>
                      <option value="feet">feet (అడుగులు)</option>
                      <option value="inches">inches (అంగుళాలు)</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Live Results & Stand Analysis (Sticky right-rail) */}
          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-4">
            {calculation.result ? (
              <>
                {/* Hero Result Card */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/60 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-900 p-5 shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur-sm">
                      <Sprout className="h-3.5 w-3.5 text-emerald-300" />
                      {t('RECOMMENDED PLANT POPULATION', 'సిఫార్సు చేయబడిన మొక్కల సంఖ్య')}
                    </span>
                    <span className="text-xs font-bold text-emerald-200">
                      {form.areaValue} {t(form.areaUnit, form.areaUnit)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                      {t('Total Plant Stand', 'మొత్తం మొక్కల సంఖ్య')}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight">
                        {formatWhole(calculation.result.totalPlants)}
                      </span>
                      <span className="text-sm font-bold text-emerald-200">
                        {t('plants', 'మొక్కలు')}
                      </span>
                    </div>
                  </div>

                  {/* Sub-metrics Grid */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/15 pt-4">
                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {form.areaUnit === 'hectares' ? t('Plants / Hectare', 'హెక్టారుకు మొక్కలు') : t('Plants / Acre', 'ఎకరానికి మొక్కలు')}
                      </span>
                      <span className="text-base font-black text-white">
                        {formatWhole(form.areaUnit === 'hectares' ? calculation.result.plantsPerHectare : calculation.result.plantsPerAcre)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Area per Plant', 'ఒక్క మొక్కకు విస్తీర్ణం')}
                      </span>
                      <span className="text-base font-black text-white">
                        {calculation.result.areaPerPlant.toFixed(3)} m²
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Plant Density', 'మొక్కల సాంద్రత')}
                      </span>
                      <span className="text-base font-black text-white">
                        {calculation.result.plantsPerSqMeter.toFixed(2)} / m²
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Spacing Config', 'దూరం అమరిక')}
                      </span>
                      <span className="text-sm font-black text-white">
                        {form.rowSpacing}×{form.plantSpacing} {form.rowSpacingUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Field Reality Advisory */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex gap-2.5 items-start">
                    <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="font-semibold leading-relaxed">
                      {t(
                        'Actual field stand may vary with germination rate, gap filling, thinning and bund layout. A 5-10% buffer is recommended.',
                        'మొలక శాతం, ఖాళీలు నింపడం, పలుచన చేయడం మరియు గట్ల అమరిక వల్ల వాస్తవ మొక్కల సంఖ్య మారవచ్చు. 5-10% అదనపు జాగ్రత్త సిఫార్సు.'
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
                <Sprout className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {t('Enter valid area and spacing values to see plant population.', 'మొక్కల సంఖ్యను చూడటానికి సరైన విస్తీర్ణం మరియు దూరాలను నమోదు చేయండి.')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

export function calculatePlantPopulation(form: typeof initialForm): { errors: string[]; result: PlantPopulationResult | null } {
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
