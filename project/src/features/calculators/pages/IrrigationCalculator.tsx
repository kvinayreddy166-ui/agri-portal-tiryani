import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Droplet,
  Droplets,
  Gauge,
  Info,
  Printer,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { useAuth } from '../../../shared/context/AuthContext';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import {
  type AreaUnit,
  type LengthUnit,
  type DripIrrigationInput,
  type SprinklerIrrigationInput,
  type DripIrrigationResult,
  type SprinklerIrrigationResult,
  type DripPreset,
  type SprinklerPreset,
  calculateDripIrrigation,
  calculateSprinklerIrrigation,
  DRIP_CROP_PRESETS,
  SPRINKLER_CROP_PRESETS,
} from '../engine/irrigationEngine';

type IrrigationMode = 'drip' | 'sprinkler';

function WhatsAppIcon({ className = '' }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

const emptyDripForm: DripIrrigationInput = {
  cropName: '',
  area: 0,
  areaUnit: 'acres',
  rowSpacing: 0,
  rowSpacingUnit: 'cm',
  plantSpacing: 0,
  plantSpacingUnit: 'cm',
  emitterSpacing: 0,
  emitterSpacingUnit: 'cm',
  emitterDischarge: 0,
  waterRequirementPerPlant: 0,
  pumpHorsePower: 0,
};

const emptySprinklerForm: SprinklerIrrigationInput = {
  cropName: '',
  area: 0,
  areaUnit: 'acres',
  spacingX: 0,
  spacingY: 0,
  nozzleDischargeLph: 0,
  operatingSprinklers: 0,
  targetDepthMm: 0,
  pumpHorsePower: 0,
};

const defaultDripForm: DripIrrigationInput = {
  cropName: 'Bt Cotton',
  area: 1,
  areaUnit: 'acres',
  rowSpacing: 90,
  rowSpacingUnit: 'cm',
  plantSpacing: 60,
  plantSpacingUnit: 'cm',
  emitterSpacing: 60,
  emitterSpacingUnit: 'cm',
  emitterDischarge: 2.0,
  waterRequirementPerPlant: 3.5,
  pumpHorsePower: 3,
};

const defaultSprinklerForm: SprinklerIrrigationInput = {
  cropName: 'Groundnut',
  area: 2,
  areaUnit: 'acres',
  spacingX: 12,
  spacingY: 12,
  nozzleDischargeLph: 1800,
  operatingSprinklers: 8,
  targetDepthMm: 25,
  pumpHorsePower: 5,
};

function formatNumber(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(decimals, 1),
  }).format(value);
}

function formatWhole(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function IrrigationCalculator() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const { isAdminUser, isTestUser, isOfficerUser } = useAuth();
  const showCompactHeader = isAdminUser || isTestUser || isOfficerUser;
  const { toasts, removeToast, showSuccess } = useToast();

  const [mode, setMode] = useState<IrrigationMode>('drip');
  const [dripForm, setDripForm] = useState<DripIrrigationInput>(defaultDripForm);
  const [sprinklerForm, setSprinklerForm] = useState<SprinklerIrrigationInput>(defaultSprinklerForm);
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Calculations
  const dripResult: DripIrrigationResult = useMemo(
    () => calculateDripIrrigation(dripForm),
    [dripForm]
  );

  const sprinklerResult: SprinklerIrrigationResult = useMemo(
    () => calculateSprinklerIrrigation(sprinklerForm),
    [sprinklerForm]
  );

  // Preset Handlers
  const applyDripPreset = (preset: DripPreset) => {
    setDripForm((prev) => ({
      ...prev,
      cropName: preset.name,
      rowSpacing: preset.rowSpacing,
      rowSpacingUnit: preset.rowSpacingUnit,
      plantSpacing: preset.plantSpacing,
      plantSpacingUnit: preset.plantSpacingUnit,
      emitterSpacing: preset.emitterSpacing,
      emitterSpacingUnit: preset.emitterSpacingUnit,
      emitterDischarge: preset.emitterDischarge,
      waterRequirementPerPlant: preset.waterRequirementPerPlant,
      pumpHorsePower: preset.defaultPumpHp ?? prev.pumpHorsePower,
    }));
    showSuccess(
      t('Preset Loaded', 'ప్రిసెట్ లోడ్ అయింది'),
      t(`Loaded drip parameters for ${preset.name}.`, `${preset.nameTe} బిందు సేద్యం వివరాలు లోడ్ చేయబడ్డాయి.`)
    );
  };

  const applySprinklerPreset = (preset: SprinklerPreset) => {
    setSprinklerForm((prev) => ({
      ...prev,
      cropName: preset.name,
      spacingX: preset.spacingX,
      spacingY: preset.spacingY,
      nozzleDischargeLph: preset.nozzleDischargeLph,
      operatingSprinklers: preset.operatingSprinklers,
      targetDepthMm: preset.targetDepthMm,
      pumpHorsePower: preset.defaultPumpHp ?? prev.pumpHorsePower,
    }));
    showSuccess(
      t('Preset Loaded', 'ప్రిసెట్ లోడ్ అయింది'),
      t(`Loaded sprinkler parameters for ${preset.name}.`, `${preset.nameTe} తుంపర సేద్యం వివరాలు లోడ్ చేయబడ్డాయి.`)
    );
  };

  const resetDrip = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setDripForm(emptyDripForm);
    setCopied(false);
    showSuccess(t('Inputs Cleared', 'ఇన్‌పుట్‌లు తొలగించబడ్డాయి'), t('All input fields have been cleared.', 'అన్ని ఇన్‌పుట్ ఫీల్డ్‌లు ఖాళీ చేయబడ్డాయి.'));
  };

  const resetSprinkler = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setSprinklerForm(emptySprinklerForm);
    setCopied(false);
    showSuccess(t('Inputs Cleared', 'ఇన్‌పుట్‌లు తొలగించబడ్డాయి'), t('All input fields have been cleared.', 'అన్ని ఇన్‌పుట్ ఫీల్డ్‌లు ఖాళీ చేయబడ్డాయి.'));
  };

  // Advisory Share text
  const shareText = useMemo(() => {
    if (mode === 'drip') {
      return buildDripShareText(dripForm, dripResult, t);
    }
    return buildSprinklerShareText(sprinklerForm, sprinklerResult, t);
  }, [mode, dripForm, dripResult, sprinklerForm, sprinklerResult, t]);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      showSuccess(
        t('Advisory Copied', 'సలహా కాపీ అయింది'),
        t('Irrigation advisory copied to clipboard.', 'నీటిపారుదల సలహా క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది.')
      );
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  const printAdvisory = () => {
    window.print();
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 sm:px-6 lg:px-8 print:hidden">
        {showCompactHeader ? (
          <ModulePageHeader
            className="mb-4"
            title={t('Water & Irrigation Requirement Calculator', 'నీరు మరియు నీటిపారుదల అవసరాల కాలిక్యులేటర్')}
            subtitle={t(
              'Calculate pump run hours per acre, discharge rates, and water volume for Drip and Sprinkler systems.',
              'బిందు మరియు తుంపర సేద్యానికి ఎకరాకు పంపు పనివేళలు, ఉత్సర్గ రేటు మరియు నీటి పరిమాణాన్ని లెక్కించండి.'
            )}
            icon={Droplets}
          />
        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-cyan-300/60 bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 p-3.5 sm:p-4 text-white shadow-md dark:border-cyan-700/60">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                <BackButton onClick={() => navigate('/officer-toolkit/farm-calculators')} tone="solid" className="mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                      <Droplets className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" aria-label="Irrigation Calculator" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-cyan-100 mb-0.5">
                        {t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
                      </p>
                      <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug tracking-tight">
                        {t('Water & Irrigation Requirement Calculator', 'నీరు మరియు నీటిపారుదల అవసరాల కాలిక్యులేటర్')}
                      </h1>
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                        {t(
                          'Calculate pump run hours per acre, discharge rates, and water volume for Drip and Sprinkler systems.',
                          'బిందు మరియు తుంపర సేద్యానికి ఎకరాకు పంపు పనివేళలు, ఉత్సర్గ రేటు మరియు నీటి పరిమాణాన్ని లెక్కించండి.'
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
        {/* Mode Switcher Tabs */}
        <section className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
          <button
            type="button"
            onClick={() => setMode('drip')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black transition ${
              mode === 'drip'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/20'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Droplet className="h-4 w-4" />
            <span>{t('Drip Irrigation', 'బిందు సేద్యం (డ్రిప్)')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('sprinkler')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black transition ${
              mode === 'sprinkler'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-950/20'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Droplets className="h-4 w-4" />
            <span>{t('Sprinkler Irrigation', 'తుంపర సేద్యం (స్ప్రింక్లర్)')}</span>
          </button>
        </section>

        {/* Step 1: Quick Crop Presets Bar (Gapless responsive grid) */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                {mode === 'drip'
                  ? t('Drip Crop Presets', 'బిందు సేద్య పంటల ప్రిసెట్లు')
                  : t('Sprinkler Crop Presets', 'తుంపర సేద్య పంటల ప్రిసెట్లు')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {mode === 'drip'
                  ? t('Tap a crop to auto-fill recommended row/plant spacing, dripper discharge & water requirement.', 'సిఫార్సు చేయబడిన వరుస/మొక్క దూరం, డ్రిప్పర్ ఉత్సర్గ మరియు నీటి అవసరాలను పూరించడానికి పంటను ఎంచుకోండి.')
                  : t('Tap a crop to auto-fill sprinkler spacing, nozzle discharge & required irrigation depth.', 'స్ప్రింక్లర్ దూరం, నాజిల్ డిశ్చార్జ్ మరియు నీటి లోతు పూరించడానికి పంటను ఎంచుకోండి.')}
              </p>
            </div>
            <button
              type="button"
              onClick={mode === 'drip' ? resetDrip : resetSprinkler}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 self-start sm:self-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RotateCcw className={`h-3.5 w-3.5 transition-transform duration-500 ${isResetting ? 'animate-spin' : ''}`} />
              {t('Reset', 'రీసెట్')}
            </button>
          </div>

          {/* Gapless Grid Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {mode === 'drip'
              ? DRIP_CROP_PRESETS.map((preset) => {
                  const isActive = dripForm.cropName === preset.name;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyDripPreset(preset)}
                      className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                        isActive
                          ? 'border-cyan-600 bg-cyan-600 text-white shadow-md shadow-cyan-950/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-base">{preset.icon}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <span className="font-black truncate w-full">{t(preset.name, preset.nameTe)}</span>
                      <span className={`text-[10px] ${isActive ? 'text-cyan-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {preset.rowSpacing}{preset.rowSpacingUnit} × {preset.plantSpacing}{preset.plantSpacingUnit}
                      </span>
                    </button>
                  );
                })
              : SPRINKLER_CROP_PRESETS.map((preset) => {
                  const isActive = sprinklerForm.cropName === preset.name;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applySprinklerPreset(preset)}
                      className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                        isActive
                          ? 'border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-950/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-base">{preset.icon}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <span className="font-black truncate w-full">{t(preset.name, preset.nameTe)}</span>
                      <span className={`text-[10px] ${isActive ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {preset.targetDepthMm}mm depth
                      </span>
                    </button>
                  );
                })}
          </div>
        </section>

        {/* Main Grid: Parameters Form (Left) & Results Panel (Right) */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Form: Inputs */}
          <div className="lg:col-span-6 space-y-4">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Gauge className="h-4 w-4 text-cyan-600" />
                {mode === 'drip'
                  ? t('Drip System Inputs', 'బిందు సేద్య వివరాలు')
                  : t('Sprinkler System Inputs', 'తుంపర సేద్య వివరాలు')}
              </h2>

              {mode === 'drip' ? (
                /* DRIP FORM */
                <div className="space-y-4">
                  {/* Crop Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('Crop Name', 'పంట పేరు')}
                    </label>
                    <input
                      type="text"
                      value={dripForm.cropName}
                      onChange={(e) => setDripForm({ ...dripForm, cropName: e.target.value })}
                      placeholder={t('e.g. Bt Cotton, Chilli, Tomato', 'ఉదా: పత్తి, మిర్చి, టమోటా')}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Area & Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Area Size', 'విస్తీర్ణం')}
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={dripForm.area || ''}
                        onChange={(e) => setDripForm({ ...dripForm, area: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Area Unit', 'విస్తీర్ణం యూనిట్')}
                      </label>
                      <select
                        value={dripForm.areaUnit}
                        onChange={(e) => setDripForm({ ...dripForm, areaUnit: e.target.value as AreaUnit })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="acres">{t('Acres', 'ఎకరాలు')}</option>
                        <option value="guntas">{t('Guntas', 'గుంటలు')}</option>
                        <option value="hectares">{t('Hectares', 'హెక్టార్లు')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Row Spacing & Plant Spacing */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {t('Row-to-Row Spacing', 'వరుసల మధ్య దూరం')}
                        </label>
                        <select
                          value={dripForm.rowSpacingUnit}
                          onChange={(e) => setDripForm({ ...dripForm, rowSpacingUnit: e.target.value as LengthUnit })}
                          className="text-[10px] font-bold text-slate-500 bg-transparent border-0 p-0 cursor-pointer focus:ring-0"
                        >
                          <option value="m">m</option>
                          <option value="cm">cm</option>
                          <option value="feet">ft</option>
                        </select>
                      </div>
                      <input
                        type="number"
                        min="0.1"
                        step="0.05"
                        value={dripForm.rowSpacing || ''}
                        onChange={(e) => setDripForm({ ...dripForm, rowSpacing: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {t('Plant-to-Plant Spacing', 'మొక్కల మధ్య దూరం')}
                        </label>
                        <select
                          value={dripForm.plantSpacingUnit}
                          onChange={(e) => setDripForm({ ...dripForm, plantSpacingUnit: e.target.value as LengthUnit })}
                          className="text-[10px] font-bold text-slate-500 bg-transparent border-0 p-0 cursor-pointer focus:ring-0"
                        >
                          <option value="m">m</option>
                          <option value="cm">cm</option>
                          <option value="feet">ft</option>
                        </select>
                      </div>
                      <input
                        type="number"
                        min="0.1"
                        step="0.05"
                        value={dripForm.plantSpacing || ''}
                        onChange={(e) => setDripForm({ ...dripForm, plantSpacing: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Emitter Spacing & Emitter Discharge */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {t('Emitter Spacing', 'డ్రిప్పర్ల మధ్య దూరం')}
                        </label>
                        <select
                          value={dripForm.emitterSpacingUnit}
                          onChange={(e) => setDripForm({ ...dripForm, emitterSpacingUnit: e.target.value as LengthUnit })}
                          className="text-[10px] font-bold text-slate-500 bg-transparent border-0 p-0 cursor-pointer focus:ring-0"
                        >
                          <option value="m">m</option>
                          <option value="cm">cm</option>
                          <option value="feet">ft</option>
                        </select>
                      </div>
                      <input
                        type="number"
                        min="0.1"
                        step="0.05"
                        value={dripForm.emitterSpacing || ''}
                        onChange={(e) => setDripForm({ ...dripForm, emitterSpacing: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Emitter Discharge', 'డ్రిప్పర్ ఉత్సర్గ')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">(LPH)</span>
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={dripForm.emitterDischarge || ''}
                        onChange={(e) => setDripForm({ ...dripForm, emitterDischarge: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Crop Water Requirement & Pump HP */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Water Requirement', 'నీటి అవసరం')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">(L/plant/day)</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={dripForm.waterRequirementPerPlant || ''}
                        onChange={(e) => setDripForm({ ...dripForm, waterRequirementPerPlant: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Pump Capacity (Optional)', 'మోటారు సామర్థ్యం')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">(HP)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={dripForm.pumpHorsePower || ''}
                        onChange={(e) => setDripForm({ ...dripForm, pumpHorsePower: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 3 or 5"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* SPRINKLER FORM */
                <div className="space-y-4">
                  {/* Crop Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('Crop Name', 'పంట పేరు')}
                    </label>
                    <input
                      type="text"
                      value={sprinklerForm.cropName}
                      onChange={(e) => setSprinklerForm({ ...sprinklerForm, cropName: e.target.value })}
                      placeholder={t('e.g. Groundnut, Bengal Gram, Wheat', 'ఉదా: వేరుశనగ, శనగ, గోధుమ')}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Area & Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Field Area', 'పొలం విస్తీర్ణం')}
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={sprinklerForm.area || ''}
                        onChange={(e) => setSprinklerForm({ ...sprinklerForm, area: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Area Unit', 'విస్తీర్ణం యూనిట్')}
                      </label>
                      <select
                        value={sprinklerForm.areaUnit}
                        onChange={(e) => setSprinklerForm({ ...sprinklerForm, areaUnit: e.target.value as AreaUnit })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="acres">{t('Acres', 'ఎకరాలు')}</option>
                        <option value="guntas">{t('Guntas', 'గుంటలు')}</option>
                        <option value="hectares">{t('Hectares', 'హెక్టార్లు')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Sprinkler Spacing (spacingX) & Lateral Spacing (spacingY) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Sprinkler Spacing (Sm)', 'స్ప్రింక్లర్ల మధ్య దూరం')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">(m)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={sprinklerForm.spacingX || ''}
                        onChange={(e) => setSprinklerForm({ ...sprinklerForm, spacingX: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Lateral Spacing (Sl)', 'పైపుల మధ్య దూరం')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">(m)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={sprinklerForm.spacingY || ''}
                        onChange={(e) => setSprinklerForm({ ...sprinklerForm, spacingY: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Sprinkler Nozzle Discharge & Operating Sprinklers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Nozzle Discharge', 'స్ప్రింక్లర్ ఉత్సర్గ')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">(LPH/nozzle)</span>
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={sprinklerForm.nozzleDischargeLph || ''}
                        onChange={(e) => setSprinklerForm({ ...sprinklerForm, nozzleDischargeLph: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Sprinklers Running / Shift', 'ఒక షిఫ్టుకు స్ప్రింక్లర్లు')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={sprinklerForm.operatingSprinklers || ''}
                        onChange={(e) => setSprinklerForm({ ...sprinklerForm, operatingSprinklers: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Water Requirement Depth (mm) & Pump HP */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Irrigation Depth', 'నీటి లోతు')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">(mm)</span>
                      </label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={sprinklerForm.targetDepthMm || ''}
                        onChange={(e) => setSprinklerForm({ ...sprinklerForm, targetDepthMm: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Pump Capacity (Optional)', 'మోటారు సామర్థ్యం')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">(HP)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={sprinklerForm.pumpHorsePower || ''}
                        onChange={(e) => setSprinklerForm({ ...sprinklerForm, pumpHorsePower: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 5 or 7.5"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right Panel: Live Calculation Results */}
          <div className="lg:col-span-6 space-y-4">
            {mode === 'drip' ? (
              /* DRIP RESULTS */
              <section className="rounded-2xl border border-cyan-200/90 bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/50 p-5 shadow-sm dark:border-cyan-900/60 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-cyan-100 dark:border-cyan-900/40">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">
                      {t('Drip Irrigation Runtime', 'బిందు సేద్య పంపు సమయం')}
                    </h2>
                  </div>
                  <span className="rounded-lg bg-cyan-100 px-2 py-0.5 text-[11px] font-black text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200">
                    {t('Daily Run Hours', 'రోజువారీ పనివేళలు')}
                  </span>
                </div>

                {/* Hero Metric: Pump Run Time */}
                <div className="my-4 rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 p-4 text-white shadow-md">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-100">
                    {t('Recommended Pump Run Time', 'సిఫార్సు చేయబడిన పంపు పనివేళలు')}
                  </div>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">
                      {dripResult.formattedRunTime.text}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-cyan-100">
                      ({formatNumber(dripResult.pumpRunHours, 2)} {t('hours/day', 'గంటలు/రోజు')})
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-cyan-50">
                    {t(
                      `Delivers ${formatNumber(dripForm.waterRequirementPerPlant)} Litres/plant across ${formatWhole(dripResult.totalPlants)} plants.`,
                      `${formatWhole(dripResult.totalPlants)} మొక్కలకు ఒక్కోదానికి ${formatNumber(dripForm.waterRequirementPerPlant)} లీటర్ల నీటిని అందిస్తుంది.`
                    )}
                  </p>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('Daily Water Volume', 'రోజువారీ నీరు')}
                    </div>
                    <div className="mt-1 text-base font-black text-cyan-700 dark:text-cyan-300">
                      {formatWhole(dripResult.dailyWaterVolumeLitres)} <span className="text-xs font-bold">L</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ≈ {formatNumber(dripResult.dailyWaterVolumeLitres / 1000, 2)} m³
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('System Discharge', 'సిస్టమ్ డిశ్చార్జ్')}
                    </div>
                    <div className="mt-1 text-base font-black text-blue-700 dark:text-blue-300">
                      {formatNumber(dripResult.systemDischargeM3Hr, 2)} <span className="text-xs font-bold">m³/hr</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatWhole(dripResult.systemDischargeLph)} LPH
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('Total Plant Count', 'మొత్తం మొక్కలు')}
                    </div>
                    <div className="mt-1 text-base font-black text-emerald-700 dark:text-emerald-300">
                      {formatWhole(dripResult.totalPlants)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {t('plants in area', 'పొలంలో మొక్కలు')}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('Total Emitters', 'మొత్తం డ్రిప్పర్లు')}
                    </div>
                    <div className="mt-1 text-base font-black text-slate-800 dark:text-slate-200">
                      {formatWhole(dripResult.totalEmitters)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatNumber(dripResult.emittersPerPlant, 1)} {t('per plant', '/మొక్కకు')}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('Lateral Pipe Length', 'లేటరల్ పైపు పొడవు')}
                    </div>
                    <div className="mt-1 text-base font-black text-slate-800 dark:text-slate-200">
                      {formatWhole(dripResult.totalLateralLengthMeters)} <span className="text-xs font-bold">m</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ≈ {formatWhole(dripResult.totalLateralLengthMeters * 3.28084)} ft
                    </div>
                  </div>

                  {dripResult.estimatedPowerKwh !== undefined && (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 shadow-2xs dark:border-amber-900/40 dark:bg-amber-950/30">
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {t('Est. Power Used', 'విద్యుత్ వినియోగం')}
                      </div>
                      <div className="mt-1 text-base font-black text-amber-800 dark:text-amber-200">
                        {formatNumber(dripResult.estimatedPowerKwh, 1)} <span className="text-xs font-bold">kWh</span>
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">
                        ({dripForm.pumpHorsePower} HP {t('motor', 'మోటారు')})
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              /* SPRINKLER RESULTS */
              <section className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-indigo-50/50 p-5 shadow-sm dark:border-sky-900/60 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-sky-900/40">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">
                      {t('Sprinkler Irrigation Runtime', 'తుంపర సేద్య పంపు సమయం')}
                    </h2>
                  </div>
                  <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-black text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
                    {t('Per Shift Runtime', 'ఒక్కో షిఫ్ట్ సమయం')}
                  </span>
                </div>

                {/* Hero Metric: Run Time Per Shift */}
                <div className="my-4 rounded-2xl bg-gradient-to-br from-sky-600 via-indigo-600 to-blue-700 p-4 text-white shadow-md">
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-100">
                    {t('Run Time Per Shift / Set', 'ఒక్కో షిఫ్ట్‌కు పంపు నడపాల్సిన సమయం')}
                  </div>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">
                      {sprinklerResult.formattedShiftTime.text}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-sky-100">
                      ({formatNumber(sprinklerResult.hoursPerShift, 2)} {t('hours/shift', 'గంటలు/సెట్')})
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-sky-50">
                    {t(
                      `Application rate: ${formatNumber(sprinklerResult.applicationRateMmHr, 2)} mm/hr to supply ${sprinklerForm.targetDepthMm} mm depth.`,
                      `నీటి సరఫరా రేటు: గంటకు ${formatNumber(sprinklerResult.applicationRateMmHr, 2)} మి.మీ (మొత్తం ${sprinklerForm.targetDepthMm} మి.మీ).`
                    )}
                  </p>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('Shifts / Sets Needed', 'అవసరమైన షిఫ్ట్‌లు')}
                    </div>
                    <div className="mt-1 text-base font-black text-sky-700 dark:text-sky-300">
                      {sprinklerResult.totalShiftsRequired} <span className="text-xs font-bold">{t('shifts', 'సెట్లు')}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {t('for entire field area', 'మొత్తం పొలం విస్తీర్ణానికి')}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('Total Field Runtime', 'మొత్తం పంపు సమయం')}
                    </div>
                    <div className="mt-1 text-base font-black text-indigo-700 dark:text-indigo-300">
                      {sprinklerResult.formattedTotalTime.text}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatNumber(sprinklerResult.totalFieldIrrigationHours, 1)} {t('total hrs', 'మొత్తం గంటలు')}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('Total Water Volume', 'మొత్తం నీటి పరిమాణం')}
                    </div>
                    <div className="mt-1 text-base font-black text-cyan-700 dark:text-cyan-300">
                      {formatWhole(sprinklerResult.totalWaterVolumeLitres / 1000)} <span className="text-xs font-bold">m³</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ≈ {formatWhole(sprinklerResult.totalWaterVolumeLitres)} L
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('Shift Discharge', 'సెట్ డిశ్చార్జ్ రేటు')}
                    </div>
                    <div className="mt-1 text-base font-black text-slate-800 dark:text-slate-200">
                      {formatNumber(sprinklerResult.setDischargeM3Hr, 1)} <span className="text-xs font-bold">m³/hr</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatWhole(sprinklerResult.setDischargeLph)} LPH
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t('Area Per Shift', 'ఒక షిఫ్ట్ కవరేజ్')}
                    </div>
                    <div className="mt-1 text-base font-black text-slate-800 dark:text-slate-200">
                      {formatNumber(sprinklerResult.areaCoveredPerSetM2, 0)} <span className="text-xs font-bold">m²</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ≈ {formatNumber(sprinklerResult.areaCoveredPerSetM2 / 4046.86, 2)} {t('acres', 'ఎకరాలు')}
                    </div>
                  </div>

                  {sprinklerResult.estimatedPowerKwh !== undefined && (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 shadow-2xs dark:border-amber-900/40 dark:bg-amber-950/30">
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {t('Total Electricity', 'మొత్తం విద్యుత్')}
                      </div>
                      <div className="mt-1 text-base font-black text-amber-800 dark:text-amber-200">
                        {formatNumber(sprinklerResult.estimatedPowerKwh, 1)} <span className="text-xs font-bold">kWh</span>
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">
                        ({sprinklerForm.pumpHorsePower} HP {t('motor', 'మోటారు')})
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Practical Agronomic Tips */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                <Info className="h-4 w-4 text-cyan-600" />
                {t('Field Advisory & Best Practices', 'క్షేత్ర సలహాలు & ఉత్తమ పద్ధతులు')}
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {mode === 'drip' ? (
                  <>
                    <li className="flex items-start gap-1.5">
                      <span className="text-cyan-600">•</span>
                      <span>{t('Maintain 1.0 to 1.5 bar operating pressure at the end of the laterals for uniform discharge.', 'సమాన ఉత్సర్గ కొరకు లేటరల్ చివర 1.0 నుండి 1.5 బార్ పీడనాన్ని నిర్వహించండి.')}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-cyan-600">•</span>
                      <span>{t('Flush drip sub-mains and laterals once a fortnight to prevent clogging and emitter chokes.', 'డ్రిప్పర్లు మూసుకుపోకుండా 15 రోజులకు ఒకసారి లేటరల్స్ మరియు సబ్‌మెయిన్‌లను ఫ్లష్ చేయండి.')}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-cyan-600">•</span>
                      <span>{t('In heavy black soils, run drip every 2-3 days; in light red/sandy soils, irrigate daily.', 'నల్లరేగడి నేలల్లో 2-3 రోజులకు ఒకసారి, ఎర్ర నేలల్లో రోజూ డ్రిప్ నడపండి.')}</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-1.5">
                      <span className="text-sky-600">•</span>
                      <span>{t('Operate sprinklers during early mornings or late evenings to minimize evaporation losses.', 'ఆవిరైపోకుండా ఉండటానికి ఉదయం లేదా సాయంత్రం వేళల్లో స్ప్రింక్లర్లు నడపండి.')}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-sky-600">•</span>
                      <span>{t('Ensure operating pressure of 2.0 to 2.8 bar for proper water atomization and overlapping.', 'సరిగ్గా నీరు చిమ్మడానికి మరియు సమాన వ్యాప్తికి 2.0 నుండి 2.8 బార్ పీడనం ఉండేలా చూసుకోండి.')}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-sky-600">•</span>
                      <span>{t('Rotate sprinkler sets across shifts to cover the entire field over 3-7 days intervals.', 'పంట దశను బట్టి 3-7 రోజుల వ్యవధిలో మొత్తం పొలాన్ని కవర్ చేయడానికి షిఫ్టులను మార్చండి.')}</span>
                    </li>
                  </>
                )}
              </ul>
            </section>

            {/* Actions: Copy, WhatsApp Share, Print */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 print:hidden">
              <button
                type="button"
                onClick={shareWhatsApp}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>{t('Share on WhatsApp', 'వాట్సాప్‌లో పంపండి')}</span>
              </button>

              <button
                type="button"
                onClick={copyResult}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? t('Copied', 'కాపీ అయింది') : t('Copy', 'కాపీ')}</span>
              </button>

              <button
                type="button"
                onClick={printAdvisory}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Printer className="h-4 w-4" />
                <span>{t('Print', 'ప్రింట్')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// WhatsApp Advisory Builders (Bilingual)
// ----------------------------------------------------

function buildDripShareText(
  form: DripIrrigationInput,
  result: DripIrrigationResult,
  t: (en: string, te: string) => string
): string {
  const lines: string[] = [
    `💧 *${t('AGRONIX — Drip Irrigation Advisory', 'అగ్రోనిక్స్ — బిందు సేద్యం నీటి సలహా')}*`,
    `🌾 *${t('Crop', 'పంట')}:* ${form.cropName || t('Crop', 'పంట')}`,
    `📐 *${t('Area', 'విస్తీర్ణం')}:* ${form.area} ${form.areaUnit}`,
    `📏 *${t('Spacing', 'దూరం')}:* ${form.rowSpacing}${form.rowSpacingUnit} × ${form.plantSpacing}${form.plantSpacingUnit}`,
    `💧 *${t('Dripper', 'డ్రిప్పర్')}:* ${form.emitterDischarge} LPH @ ${form.emitterSpacing}${form.emitterSpacingUnit} spacing`,
    `🌱 *${t('Water Needed', 'నీటి అవసరం')}:* ${form.waterRequirementPerPlant} L/plant/day`,
    '',
    `⏱️ *${t('RECOMMENDED PUMP RUN TIME', 'పంపు నడపాల్సిన సమయం')}:* *${result.formattedRunTime.text}* (${formatNumber(result.pumpRunHours, 2)} hrs/day)`,
    `📊 *${t('System Discharge', 'సిస్టమ్ డిశ్చార్జ్')}:* ${formatNumber(result.systemDischargeM3Hr, 2)} m³/hr (${formatWhole(result.systemDischargeLph)} LPH)`,
    `💦 *${t('Total Daily Water', 'మొత్తం రోజువారీ నీరు')}:* ${formatWhole(result.dailyWaterVolumeLitres)} Litres (≈ ${formatNumber(result.dailyWaterVolumeLitres / 1000, 2)} m³)`,
    `🌿 *${t('Total Plants', 'మొత్తం మొక్కలు')}:* ${formatWhole(result.totalPlants)} plants`,
    `🧵 *${t('Lateral Pipe Length', 'లేటరల్ పైపు')}:* ${formatWhole(result.totalLateralLengthMeters)} meters`,
  ];

  if (result.estimatedPowerKwh !== undefined) {
    lines.push(`⚡ *${t('Est. Power Consumption', 'విద్యుత్ వినియోగం')}:* ${formatNumber(result.estimatedPowerKwh, 1)} kWh (${form.pumpHorsePower} HP motor)`);
  }

  lines.push('');
  lines.push(`_Generated by AGRONIX Farm Portal — Tiryani Mandal_`);
  return lines.join('\n');
}

function buildSprinklerShareText(
  form: SprinklerIrrigationInput,
  result: SprinklerIrrigationResult,
  t: (en: string, te: string) => string
): string {
  const lines: string[] = [
    `💦 *${t('AGRONIX — Sprinkler Irrigation Advisory', 'అగ్రోనిక్స్ — తుంపర సేద్యం నీటి సలహా')}*`,
    `🌾 *${t('Crop', 'పంట')}:* ${form.cropName || t('Crop', 'పంట')}`,
    `📐 *${t('Area', 'విస్తీర్ణం')}:* ${form.area} ${form.areaUnit}`,
    `📏 *${t('Sprinkler Spacing', 'స్ప్రింక్లర్ దూరం')}:* ${form.spacingX}m × ${form.spacingY}m`,
    `🚿 *${t('Nozzle Discharge', 'నాజిల్ డిశ్చార్జ్')}:* ${form.nozzleDischargeLph} LPH/sprinkler`,
    `🎯 *${t('Running Sprinklers', 'నడిచే స్ప్రింక్లర్లు')}:* ${form.operatingSprinklers} sprinklers/shift`,
    `🌧️ *${t('Irrigation Depth', 'నీటి లోతు')}:* ${form.targetDepthMm} mm`,
    '',
    `⏱️ *${t('RUN TIME PER SHIFT', 'ఒక్కో షిఫ్ట్‌కు సమయం')}:* *${result.formattedShiftTime.text}* (${formatNumber(result.hoursPerShift, 2)} hrs/shift)`,
    `🔄 *${t('Total Shifts Needed', 'మొత్తం షిఫ్ట్‌లు')}:* ${result.totalShiftsRequired} shifts`,
    `⌛ *${t('Total Field Runtime', 'మొత్తం పంపు సమయం')}:* ${result.formattedTotalTime.text} (${formatNumber(result.totalFieldIrrigationHours, 1)} total hrs)`,
    `📊 *${t('Application Rate', 'నీటి రేటు')}:* ${formatNumber(result.applicationRateMmHr, 2)} mm/hr`,
    `💦 *${t('Total Water Volume', 'మొత్తం నీటి పరిమాణం')}:* ${formatWhole(result.totalWaterVolumeLitres / 1000)} m³ (${formatWhole(result.totalWaterVolumeLitres)} L)`,
  ];

  if (result.estimatedPowerKwh !== undefined) {
    lines.push(`⚡ *${t('Est. Power Consumption', 'విద్యుత్ వినియోగం')}:* ${formatNumber(result.estimatedPowerKwh, 1)} kWh (${form.pumpHorsePower} HP motor)`);
  }

  lines.push('');
  lines.push(`_Generated by AGRONIX Farm Portal — Tiryani Mandal_`);
  return lines.join('\n');
}
