import React, { useMemo, useState } from 'react';
import {
  Bug,
  Check,
  Copy,
  Droplet,
  FlaskConical,
  Layers,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { useAuth } from '../../../shared/context/AuthContext';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';

type Mode = 'activeIngredient' | 'directDose';
type AreaUnit = 'acres' | 'hectares';
type UnitType = 'liquid' | 'powder' | 'solid';
type AiDoseUnit = 'g-ai-acre' | 'kg-ai-ha' | 'g-ai-ha';
type TankChoice = '15' | '16' | '20' | 'custom';

interface UnitLabels {
  base: 'mL' | 'g';
  perLitre: 'mL/L' | 'g/L';
  perTank: 'mL/tank' | 'g/tank';
  totalLarge: 'L' | 'kg';
}

const HECTARE_TO_ACRES = 2.471;

const emptyForm = {
  productName: '',
  areaValue: '',
  areaUnit: 'acres' as AreaUnit,
  unitType: 'liquid' as UnitType,
  waterPerAcre: '',
  tankChoice: '16' as TankChoice,
  customTankSize: '',
  aiPercentage: '',
  aiDose: '',
  aiDoseUnit: 'g-ai-acre' as AiDoseUnit,
  directDose: '',
};

const initialForm = {
  productName: '',
  areaValue: '1',
  areaUnit: 'acres' as AreaUnit,
  unitType: 'liquid' as UnitType,
  waterPerAcre: '200',
  tankChoice: '16' as TankChoice,
  customTankSize: '',
  aiPercentage: '18.5',
  aiDose: '30',
  aiDoseUnit: 'g-ai-acre' as AiDoseUnit,
  directDose: '0.4',
};

const POPULAR_PESTICIDE_PRESETS = [
  { name: 'Chlorantraniliprole 18.5% SC', nameTe: 'కోరాజెన్ (18.5% SC)', mode: 'directDose' as Mode, dose: '0.4', unitType: 'liquid' as UnitType, water: '200', icon: '🐛' },
  { name: 'Emamectin Benzoate 5% SG', nameTe: 'ప్రోక్లెయిమ్ (5% SG)', mode: 'directDose' as Mode, dose: '0.5', unitType: 'powder' as UnitType, water: '200', icon: '🦗' },
  { name: 'Acephate 75% SP', nameTe: 'ఎసిఫేట్ 75% SP', mode: 'directDose' as Mode, dose: '1.5', unitType: 'powder' as UnitType, water: '200', icon: '🪲' },
  { name: 'Mancozeb 75% WP', nameTe: 'డైథేన్ M-45 (75% WP)', mode: 'directDose' as Mode, dose: '2.5', unitType: 'powder' as UnitType, water: '200', icon: '🍄' },
  { name: 'Glyphosate 41% SL', nameTe: 'రౌండప్ (41% SL)', mode: 'directDose' as Mode, dose: '10', unitType: 'liquid' as UnitType, water: '200', icon: '🌿' },
];

const numericFieldWarnings: Partial<Record<keyof typeof initialForm, { isInvalid: (value: number) => boolean; message: [string, string] }>> = {
  areaValue: { isInvalid: (v) => v <= 0, message: ['Area must be greater than 0.', 'విస్తీర్ణం 0 కంటే ఎక్కువగా ఉండాలి.'] },
  waterPerAcre: { isInvalid: (v) => v <= 0, message: ['Water volume must be greater than 0.', 'నీటి పరిమాణం 0 కంటే ఎక్కువగా ఉండాలి.'] },
  customTankSize: { isInvalid: (v) => v <= 0, message: ['Custom tank size must be greater than 0.', 'ట్యాంక్ పరిమాణం 0 కంటే ఎక్కువగా ఉండాలి.'] },
  aiPercentage: { isInvalid: (v) => v <= 0 || v > 100, message: ['Active ingredient % must be between 0 and 100.', 'యాక్టివ్ ఇంగ్రిడియెంట్ % 0 మరియు 100 మధ్య ఉండాలి.'] },
  aiDose: { isInvalid: (v) => v <= 0, message: ['AI dose must be greater than 0.', 'మోతాదు 0 కంటే ఎక్కువగా ఉండాలి.'] },
  directDose: { isInvalid: (v) => v <= 0, message: ['Dose must be greater than 0.', 'మోతాదు 0 కంటే ఎక్కువగా ఉండాలి.'] },
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

export function PesticideCalculator() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const { isAdminUser, isTestUser, isOfficerUser } = useAuth();
  const showCompactHeader = isAdminUser || isTestUser || isOfficerUser;
  const [mode, setMode] = useState<Mode>('activeIngredient');
  const [form, setForm] = useState(initialForm);
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toasts, removeToast, showWarning, showSuccess } = useToast();
  const unitLabels = useMemo(() => getUnitLabels(form.unitType), [form.unitType]);
  const calculation = useMemo(() => calculatePesticide(mode, form), [mode, form]);
  const shareText = useMemo(() => buildShareText({ mode, form, calculation, unitLabels, t }), [calculation, form, mode, t, unitLabels]);

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

  const applyPesticidePreset = (preset: typeof POPULAR_PESTICIDE_PRESETS[0]) => {
    setMode(preset.mode);
    setForm((prev) => ({
      ...prev,
      productName: preset.name,
      unitType: preset.unitType,
      waterPerAcre: preset.water,
      directDose: preset.dose,
    }));
    showSuccess(
      t('Preset Loaded', 'ప్రిసెట్ లోడ్ అయింది'),
      t(`Loaded formulation for ${preset.name} (${preset.dose} ${preset.unitType === 'liquid' ? 'mL' : 'g'}/L).`, `${preset.nameTe} వివరాలు లోడ్ చేయబడ్డాయి.`)
    );
  };

  const reset = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setCopied(false);
    setMode('activeIngredient');
    setForm(emptyForm);
    showSuccess(t('Inputs Cleared', 'ఇన్‌పుట్‌లు తొలగించబడ్డాయి'), t('All input fields have been cleared.', 'అన్ని ఇన్‌పుట్ ఫీల్డ్‌లు ఖాళీ చేయబడ్డాయి.'));
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
          <ModulePageHeader
            className="mb-4"
            title={t('Pesticide Calculator', 'పురుగుమందు కాలిక్యులేటర్')}
            subtitle={t(
              'Calculate commercial pesticide quantity, tank-wise spray solution and water calibration.',
              'స్ప్రే ట్యాంక్ మోతాదు, మొత్తం నీరు మరియు పురుగుమందు పరిమాణాన్ని ఖచ్చితంగా లెక్కించండి.'
            )}
            icon={Bug}
          />
        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-rose-300/60 bg-gradient-to-br from-rose-600 via-rose-500 to-red-700 p-3.5 sm:p-4 text-white shadow-md dark:border-rose-800/60">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
              <BackButton onClick={() => navigate('/officer-toolkit/farm-calculators')} tone="solid" className="mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                    <Bug className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" aria-label="Pesticide Calculator" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-100 mb-0.5">
                      {t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
                    </p>
                    <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug tracking-tight">
                      {t('Pesticide Calculator', 'పురుగుమందు కాలిక్యులేటర్')}
                    </h1>
                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                      {t(
                        'Selected tank dose, spray volume and commercial formulation quantity.',
                        'ట్యాంక్ మోతాదు, మొత్తం నీరు మరియు అవసరమైన మందు పరిమాణాన్ని లెక్కించండి.'
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
        {/* Step 1: Quick Common Chemical Formulations Bar */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-rose-500" />
                {t('Common Chemical Presets', 'సాధారణ మందుల ప్రిసెట్లు')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('Tap to auto-fill commercial dose per litre and formulation type.', 'లీటరు మోతాదు మరియు ఫార్ములేషన్ రకాన్ని పూరించడానికి ఎంచుకోండి.')}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 self-start sm:self-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RotateCcw className={`h-3.5 w-3.5 transition-transform duration-500 ${isResetting ? 'animate-spin' : ''}`} />
              {t('Reset', 'రీసెట్')}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR_PESTICIDE_PRESETS.map((preset) => {
              const isActive = form.productName === preset.name && form.directDose === preset.dose;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPesticidePreset(preset)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                    isActive
                      ? 'border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-950/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-300 hover:bg-rose-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{t(preset.name, preset.nameTe)}</span>
                  <span className="text-[10px] font-semibold opacity-75">
                    ({preset.dose} {preset.unitType === 'liquid' ? 'mL' : 'g'}/L)
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
            {/* Calculation Mode Selector */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('1. Dosage Calculation Mode', '1. మోతాదు లెక్కించే విధానం')}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {t('Choose active ingredient % formula or direct commercial label recommendation', 'యాక్టివ్ ఇంగ్రిడియెంట్ % లేదా ప్రత్యక్ష లేబుల్ సిఫార్సు ఎంచుకోండి')}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('activeIngredient')}
                  className={`rounded-lg py-2 text-xs font-bold transition ${
                    mode === 'activeIngredient'
                      ? 'bg-white text-rose-800 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {t('Active Ingredient (a.i. %)', 'యాక్టివ్ ఇంగ్రిడియెంట్ (a.i.)')}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('directDose')}
                  className={`rounded-lg py-2 text-xs font-bold transition ${
                    mode === 'directDose'
                      ? 'bg-white text-rose-800 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {t('Direct Dose (mL or g per Litre)', 'ప్రత్యక్ష మోతాదు (లీటరుకు)')}
                </button>
              </div>
            </section>

            {/* Step 2: Area & Spray Solution Calibration */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                  <Droplet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('2. Spray Extent & Tank Capacity', '2. స్ప్రే విస్తీర్ణం & ట్యాంక్ పరిమాణం')}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {t('Field size, water volume per acre and sprayer tank size', 'విస్తీర్ణం, ఎకరాకు నీరు మరియు స్ప్రేయర్ ట్యాంక్ పరిమాణం')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Spray Field Area', 'స్ప్రే విస్తీర్ణం')}
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
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="1"
                    />
                    <select
                      value={form.areaUnit}
                      onChange={(event) => updateForm('areaUnit', event.target.value as AreaUnit)}
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="acres">{t('Acres', 'ఎకరాలు')}</option>
                      <option value="hectares">{t('Hectares', 'హెక్టార్లు')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Water Volume per Acre', 'ఎకరాకు నీటి పరిమాణం')}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      inputMode="decimal"
                      value={form.waterPerAcre}
                      onChange={(event) => updateForm('waterPerAcre', event.target.value)}
                      onBlur={() => handleBlur('waterPerAcre')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-14 text-sm font-black text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="200"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      L/acre
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Knapsack Sprayer Tank Capacity', 'స్ప్రేయర్ ట్యాంక్ పరిమాణం')}
                  </label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {(['15', '16', '20'] as TankChoice[]).map((tank) => (
                      <button
                        key={tank}
                        type="button"
                        onClick={() => updateForm('tankChoice', tank)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                          form.tankChoice === tank
                            ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {tank} Litres
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateForm('tankChoice', 'custom')}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                        form.tankChoice === 'custom'
                          ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {t('Custom...', 'ఇతర పరిమాణం')}
                    </button>
                    {form.tankChoice === 'custom' && (
                      <div className="relative inline-block w-28">
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={form.customTankSize}
                          onChange={(e) => updateForm('customTankSize', e.target.value)}
                          placeholder="e.g. 18"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs font-black text-slate-900 outline-none transition focus:border-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">L</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Chemical Formulation & Dose */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('3. Chemical Formulation & Dose', '3. మందు ఫార్ములేషన్ & మోతాదు')}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {t('Enter product name, formulation state (liquid vs powder) and recommended rate', 'ఉత్పత్తి పేరు, ద్రవ/పొడి రకం మరియు మోతాదును నమోదు చేయండి')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Pesticide Name', 'పురుగుమందు పేరు')}
                    <span className="ml-1 text-[11px] font-normal text-slate-400">({t('Optional', 'ఐచ్ఛికం')})</span>
                  </label>
                  <input
                    value={form.productName}
                    onChange={(event) => updateForm('productName', event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="e.g. Chlorantraniliprole"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Formulation Type', 'ఫార్ములేషన్ రకం')}
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => updateForm('unitType', 'liquid')}
                      className={`rounded-lg py-1.5 text-xs font-bold transition ${
                        form.unitType === 'liquid'
                          ? 'bg-white text-rose-800 shadow-sm dark:bg-slate-700 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      {t('Liquid (EC/SC/SL)', 'ద్రవ (mL)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateForm('unitType', 'powder')}
                      className={`rounded-lg py-1.5 text-xs font-bold transition ${
                        form.unitType === 'powder'
                          ? 'bg-white text-rose-800 shadow-sm dark:bg-slate-700 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      {t('Powder (WP/SP/SG)', 'పొడి (g)')}
                    </button>
                  </div>
                </div>

                {mode === 'activeIngredient' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t('Active Ingredient (a.i.) %', 'యాక్టివ్ ఇంగ్రిడియెంట్ %')}
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type="number"
                          min="0.1"
                          max="100"
                          step="any"
                          inputMode="decimal"
                          value={form.aiPercentage}
                          onChange={(event) => updateForm('aiPercentage', event.target.value)}
                          onBlur={() => handleBlur('aiPercentage')}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-7 text-sm font-black text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          placeholder="18.5"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t('Recommended a.i. Dose', 'సిఫార్సు చేసిన a.i. మోతాదు')}
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          inputMode="decimal"
                          value={form.aiDose}
                          onChange={(event) => updateForm('aiDose', event.target.value)}
                          onBlur={() => handleBlur('aiDose')}
                          className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          placeholder="30"
                        />
                        <select
                          value={form.aiDoseUnit}
                          onChange={(event) => updateForm('aiDoseUnit', event.target.value as AiDoseUnit)}
                          className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          <option value="g-ai-acre">g a.i./acre</option>
                          <option value="kg-ai-ha">kg a.i./ha</option>
                          <option value="g-ai-ha">g a.i./ha</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('Direct Commercial Dose per Litre of Water', 'ఒక్క లీటరు నీటికి వాణిజ్య మోతాదు')}
                    </label>
                    <div className="mt-1 relative max-w-xs">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        inputMode="decimal"
                        value={form.directDose}
                        onChange={(event) => updateForm('directDose', event.target.value)}
                        onBlur={() => handleBlur('directDose')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-16 text-sm font-black text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="0.4"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {unitLabels.perLitre}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: Live Spray Results Hero Card (5 cols) */}
          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-4">
            {calculation.result ? (
              <>
                {/* Hero Spray Card */}
                <div className="relative overflow-hidden rounded-2xl border border-rose-500/60 bg-gradient-to-br from-rose-950 via-rose-900 to-red-900 p-5 shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur-sm">
                      <Bug className="h-3.5 w-3.5 text-rose-300" />
                      {t('RECOMMENDED SPRAY CALCULATION', 'సిఫార్సు చేసిన స్ప్రే మోతాదు')}
                    </span>
                    <span className="text-xs font-bold text-rose-200">
                      {form.areaValue} {t(form.areaUnit, form.areaUnit)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                      {t('Total Product to Procure', 'మొత్తం అవసరమైన మందు')}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight">
                        {formatTotalProduct(calculation.result.totalProduct, unitLabels)}
                      </span>
                    </div>
                  </div>

                  {/* Sub-metrics Grid */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/15 pt-4">
                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Dose per Tank', 'ట్యాంక్‌కు మోతాదు')} ({calculation.result.selectedTankSize}L)
                      </span>
                      <span className="text-base font-black text-white">
                        {formatNumber(calculation.result.productPerSelectedTank)} {unitLabels.base}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Spray Tanks Required', 'అవసరమైన స్ప్రే ట్యాంకులు')}
                      </span>
                      <span className="text-base font-black text-white">
                        {calculation.result.tanksRequired} {t('tanks', 'ట్యాంకులు')}
                        <span className="text-[10px] font-semibold text-rose-200 ml-1">
                          ({calculation.result.exactTanks.toFixed(1)})
                        </span>
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Total Water Volume', 'మొత్తం స్ప్రే నీరు')}
                      </span>
                      <span className="text-base font-black text-white">
                        {formatNumber(calculation.result.totalWater)} Litres
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t('Dose per Litre', 'లీటరుకు మోతాదు')}
                      </span>
                      <span className="text-base font-black text-white">
                        {formatNumber(calculation.result.productPerLitre)} {unitLabels.perLitre}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Spray Safety Advisory */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex gap-2.5 items-start">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="font-semibold leading-relaxed">
                      {t(
                        'Always wear masks and gloves. Spray early morning or late evening in wind direction. Follow waiting periods printed on the label.',
                        'ఎల్లప్పుడూ మాస్క్ మరియు చేతి తొడుగులు ధరించండి. ఉదయం లేదా సాయంత్రం గాలి వీచే దిశలోనే స్ప్రే చేయండి.'
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
                <Bug className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {t('Enter valid area, water and dose values to calculate pesticide quantity.', 'పురుగుమందు పరిమాణాన్ని లెక్కించడానికి విస్తీర్ణం, నీరు మరియు మోతాదును నమోదు చేయండి.')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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

export function calculatePesticide(mode: Mode, form: typeof initialForm): { errors: string[]; result: PesticideResult | null } {
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
      const aiDoseGramPerAcre =
        form.aiDoseUnit === 'kg-ai-ha'
          ? (aiDose * 1000) / HECTARE_TO_ACRES
          : form.aiDoseUnit === 'g-ai-ha'
            ? aiDose / HECTARE_TO_ACRES
            : aiDose;
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
