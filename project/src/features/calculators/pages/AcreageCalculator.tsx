import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Check,
  Copy,
  Printer,
  RotateCcw,
  Ruler,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { CompactToolkitHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { safeSessionStorage } from '../../../shared/lib/safeStorage';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';

const STORAGE_KEY = 'tiryani-acreage-calculator-input';
const MODE_STORAGE_KEY = 'tiryani-acreage-calculator-mode';
const CENTS_STORAGE_KEY = 'tiryani-acreage-calculator-cents';
const ACRES_CENTS_PASTE_STORAGE_KEY = 'tiryani-acreage-calculator-acres-cents-paste';
const GUNTAS_STORAGE_KEY = 'tiryani-acreage-calculator-guntas';
const HECTARES_STORAGE_KEY = 'tiryani-area-calculator-hectares';
const CENTS_PER_ACRE = 100;
const CENTS_PER_GUNTA = 2.5;
const GUNTAS_PER_ACRE = 40;
const HECTARES_PER_ACRE = 0.404686;

type AcreageMode = 'acres' | 'cents' | 'acres-cents' | 'guntas' | 'hectares';

const modeOptions: Array<{ value: AcreageMode; label: string; telugu: string; icon: string }> = [
  { value: 'acres', label: 'Acres.Guntas', telugu: 'ఎకరాలు.గుంటలు', icon: '📐' },
  { value: 'cents', label: 'Cents', telugu: 'సెంట్లు', icon: '📏' },
  { value: 'acres-cents', label: 'Acres.Cents', telugu: 'ఎకరాలు.సెంట్లు', icon: '📝' },
  { value: 'guntas', label: 'Guntas', telugu: 'గుంటలు', icon: '🌾' },
  { value: 'hectares', label: 'Hectares', telugu: 'హెక్టార్లు', icon: '🌐' },
];

function WhatsAppIcon({ className = '' }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function AcreageCalculator() {
  const navigate = useNavigate();
  const { isAdminUser, isTestUser } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const showCompactHeader = isAdminUser || isTestUser;
  const { toasts, removeToast, showSuccess } = useToast();

  const [mode, setMode] = useState<AcreageMode>(() => readMode());
  const [acreInput, setAcreInput] = useState(() => safeSessionStorage.getItem(STORAGE_KEY) || '');
  const [centInput, setCentInput] = useState(() => safeSessionStorage.getItem(CENTS_STORAGE_KEY) || '');
  const [guntaInput, setGuntaInput] = useState(() => safeSessionStorage.getItem(GUNTAS_STORAGE_KEY) || '');
  const [hectareInput, setHectareInput] = useState(() => safeSessionStorage.getItem(HECTARES_STORAGE_KEY) || '');
  const [acresCentsPasteInput, setAcresCentsPasteInput] = useState(() => safeSessionStorage.getItem(ACRES_CENTS_PASTE_STORAGE_KEY) || '');
  const [isResetting, setIsResetting] = useState(false);

  const result = useMemo(
    () => calculateAcreageResult({ mode, acreInput, centInput, guntaInput, hectareInput, acresCentsPasteInput, t }),
    [acreInput, acresCentsPasteInput, centInput, guntaInput, hectareInput, mode, t]
  );
  const acreResult = useMemo(() => calculateAcreValues(acreInput), [acreInput]);
  const guideItems = useMemo(() => getAcreageGuide(mode, t), [mode, t]);
  const hasInput = Boolean(acreInput || centInput || guntaInput || hectareInput || acresCentsPasteInput);

  const resetCalculator = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setAcreInput('');
    setCentInput('');
    setGuntaInput('');
    setHectareInput('');
    setAcresCentsPasteInput('');
    safeSessionStorage.removeItem(STORAGE_KEY);
    safeSessionStorage.removeItem(CENTS_STORAGE_KEY);
    safeSessionStorage.removeItem(GUNTAS_STORAGE_KEY);
    safeSessionStorage.removeItem(HECTARES_STORAGE_KEY);
    safeSessionStorage.removeItem(ACRES_CENTS_PASTE_STORAGE_KEY);
  };

  useEffect(() => {
    safeSessionStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    safeSessionStorage.setItem(STORAGE_KEY, acreInput);
  }, [acreInput]);

  useEffect(() => {
    safeSessionStorage.setItem(CENTS_STORAGE_KEY, centInput);
  }, [centInput]);

  useEffect(() => {
    safeSessionStorage.setItem(GUNTAS_STORAGE_KEY, guntaInput);
  }, [guntaInput]);

  useEffect(() => {
    safeSessionStorage.setItem(HECTARES_STORAGE_KEY, hectareInput);
  }, [hectareInput]);

  useEffect(() => {
    safeSessionStorage.setItem(ACRES_CENTS_PASTE_STORAGE_KEY, acresCentsPasteInput);
  }, [acresCentsPasteInput]);

  // Share Text
  const shareText = useMemo(() => {
    const mainVal = mode === 'acres' ? `${acreResult.formatted} Ac.Gts (${acreResult.acres} ac ${acreResult.guntas} gts)` : `${result.acresDecimal} Ac (${result.acreGuntaNote})`;
    return `📐 *AGRONIX — Land Area Conversion Report*\n` +
      `📌 *Input Mode:* ${modeOptions.find((m) => m.value === mode)?.label}\n` +
      `🌾 *Total Area:* ${mainVal}\n` +
      `🌐 *Hectares:* ${mode === 'acres' ? acreResult.hectares : result.hectares} ha\n` +
      `📏 *Guntas:* ${mode === 'acres' ? acreResult.guntas : result.guntas} guntas\n` +
      `📐 *Cents:* ${result.cents} cents\n` +
      `---------------------------------\n` +
      `Generated on Agri-Portal Tiryani / AGRONIX`;
  }, [mode, acreResult, result]);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      showSuccess(t('Result Copied', 'ఫలితం కాపీ అయింది'), t('Summary copied to clipboard.', 'సారాంశం క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది.'));
    } catch {}
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 sm:px-6 lg:px-8 print:hidden">
        {showCompactHeader ? (
          <CompactToolkitHeader
            icon={Calculator}
            eyebrow={t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
            title={t('Area Calculator', 'విస్తీర్ణ కాలిక్యులేటర్')}
            subtitle={t(
              'Convert land area between acres, hectares, cents and guntas for official field reports.',
              'ఫీల్డ్ నివేదికల కోసం ఎకరాలు, హెక్టార్లు, సెంట్లు మరియు గుంటల మధ్య భూవిస్తీర్ణాన్ని మార్చండి.'
            )}
            onBack={() => navigate('/officer-toolkit/farm-calculators')}
            actions={<LanguageToggle language={language} onClick={toggleLanguage} accent="emerald" />}
            className="mb-1"
          />
        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-sky-300/60 bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 p-3.5 sm:p-4 text-white shadow-md dark:border-sky-700/60">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
              <BackButton onClick={() => navigate('/officer-toolkit/farm-calculators')} tone="solid" className="mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                    <Calculator className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" aria-label="Area Calculator" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-100 mb-0.5">
                      {t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
                    </p>
                    <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug tracking-tight">
                      {t('Area Calculator', 'విస్తీర్ణ కాలిక్యులేటర్')}
                    </h1>
                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                      {t(
                        'Convert land area between acres, hectares, cents and guntas for field reports.',
                        'ఫీల్డ్ నివేదికల కోసం ఎకరాలు, హెక్టార్లు, సెంట్లు మరియు గుంటల మధ్య భూవిస్తీర్ణాన్ని మార్చండి.'
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
        {/* Step 1: Input Mode Selector Bar */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-500" />
                {t('Select Measurement Unit', 'కొలత రకాన్ని ఎంచుకోండి')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('Choose how you want to enter land survey extents.', 'భూవిస్తీర్ణాన్ని ఏ యూనిట్లలో నమోదు చేయాలనుకుంటున్నారో ఎంచుకోండి.')}
              </p>
            </div>
            <button
              type="button"
              onClick={resetCalculator}
              disabled={!hasInput}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 self-start sm:self-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RotateCcw className={`h-3.5 w-3.5 transition-transform duration-500 ${isResetting ? 'animate-spin' : ''}`} />
              {t('Clear Inputs', 'క్లియర్ చేయి')}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {modeOptions.map((option) => {
              const isSelected = mode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition ${
                    isSelected
                      ? 'border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-950/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{t(option.label, option.telugu)}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-5 lg:grid-cols-12 items-start">
          {/* LEFT: Inputs Form (7 cols) */}
          <div className="space-y-4 lg:col-span-7">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('Enter Land Extents', 'భూ విస్తీర్ణం వివరాలను నమోదు చేయండి')}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {mode === 'acres' && t('Paste Excel column or type values like 2.10, 3.20 (2 ac 10 gts)', 'ఎకరాలు.గుంటల విలువలు నమోదు చేయండి')}
                    {mode === 'cents' && t('Enter total cents (100 cents = 1 acre)', 'మొత్తం సెంట్ల విలువ నమోదు చేయండి')}
                    {mode === 'acres-cents' && t('Paste Excel column or type values like 2.25 (2 ac 25 cents)', 'ఎకరాలు.సెంట్ల విలువలు నమోదు చేయండి')}
                    {mode === 'guntas' && t('Enter total guntas (40 guntas = 1 acre)', 'మొత్తం గుంటల విలువ నమోదు చేయండి')}
                    {mode === 'hectares' && t('Enter total hectares (1 ha = 2.471 acres)', 'మొత్తం హెక్టార్ల విలువ నమోదు చేయండి')}
                  </p>
                </div>
              </div>

              {mode === 'acres' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Acres.Guntas Values (one per line or separated by +)', 'ఎకరాలు.గుంటల విలువలు')}
                  </label>
                  <textarea
                    value={acreInput}
                    onChange={(event) => setAcreInput(event.target.value)}
                    rows={10}
                    wrap="soft"
                    spellCheck={false}
                    className="w-full resize-y overflow-auto rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-950 outline-none transition placeholder:font-sans focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={t('Example:\n2.10\n2.36\n0.15\n1.00', 'ఉదాహరణ:\n2.10\n2.36\n0.15')}
                  />
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                    {t('Tip: 2.10 means 2 acres and 10 guntas (max 40 guntas per acre).', 'గమనిక: 2.10 అంటే 2 ఎకరాలు 10 గుంటలు.')}
                  </p>
                </div>
              )}

              {mode === 'cents' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Total Cents', 'మొత్తం సెంట్లు')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={centInput}
                    onChange={(event) => setCentInput(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="e.g. 150"
                  />
                </div>
              )}

              {mode === 'acres-cents' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Acre.Cent Values (one per line)', 'ఎకరాలు.సెంట్ల విలువలు')}
                  </label>
                  <textarea
                    value={acresCentsPasteInput}
                    onChange={(event) => setAcresCentsPasteInput(event.target.value)}
                    rows={10}
                    wrap="soft"
                    spellCheck={false}
                    className="w-full resize-y overflow-auto rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-950 outline-none transition placeholder:font-sans focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={t('Example:\n2.25\n1.50\n0.75', 'ఉదాహరణ:\n2.25\n1.50\n0.75')}
                  />
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                    {t('Paste one column or type values. Example: 2.25 means 2 acres 25 cents.', 'ఉదా: 2.25 అంటే 2 ఎకరాలు 25 సెంట్లు.')}
                  </p>
                </div>
              )}

              {mode === 'guntas' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Total Guntas', 'మొత్తం గుంటలు')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={guntaInput}
                    onChange={(event) => setGuntaInput(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="e.g. 10"
                  />
                </div>
              )}

              {mode === 'hectares' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Total Hectares', 'మొత్తం హెక్టార్లు')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={hectareInput}
                    onChange={(event) => setHectareInput(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="e.g. 1.5"
                  />
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: Live Area Results Hero Card (5 cols) */}
          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-4">
            {/* Hero Area Card */}
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/60 bg-gradient-to-br from-sky-950 via-cyan-900 to-teal-900 p-5 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur-sm">
                  <Calculator className="h-3.5 w-3.5 text-sky-300" />
                  {t('CALCULATED TOTAL EXTENT', 'మొత్తం లెక్కించిన విస్తీర్ణం')}
                </span>
                <span className="text-xs font-bold text-sky-200">
                  {modeOptions.find((m) => m.value === mode)?.label}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {mode === 'acres' ? t('Total Acres.Guntas', 'మొత్తం ఎకరాలు.గుంటలు') : t('Total Decimal Acres', 'మొత్తం ఎకరాలు')}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight">
                    {mode === 'acres' ? acreResult.formatted : result.acresDecimal}
                  </span>
                  <span className="text-sm font-bold text-sky-200">
                    {mode === 'acres' ? `${acreResult.acres} ac ${acreResult.guntas} gts` : t('Acres', 'ఎకరాలు')}
                  </span>
                </div>
                {mode !== 'acres' && (
                  <p className="mt-1 text-xs font-semibold text-sky-200">
                    {result.acreGuntaNote}
                  </p>
                )}
              </div>

              {/* Sub-metrics Grid */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/15 pt-4">
                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {t('Hectares (ha)', 'హెక్టార్లు')}
                  </span>
                  <span className="text-base font-black text-white">
                    {mode === 'acres' ? acreResult.hectares : result.hectares}
                  </span>
                </div>

                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {t('Guntas', 'గుంటలు')}
                  </span>
                  <span className="text-base font-black text-white">
                    {mode === 'acres' ? `${acreResult.acres * 40 + acreResult.guntas}` : result.guntas}
                  </span>
                </div>

                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {t('Total Cents', 'మొత్తం సెంట్లు')}
                  </span>
                  <span className="text-base font-black text-white">
                    {result.cents}
                  </span>
                </div>

                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {mode === 'acres' ? t('Items Count', 'అంశాల సంఖ్య') : t('Acres + Cents', 'ఎకరాలు + సెంట్లు')}
                  </span>
                  <span className="text-sm font-black text-white truncate">
                    {mode === 'acres' ? `${acreResult.count} parcels` : result.acresCents}
                  </span>
                </div>
              </div>
            </div>

            {/* Standard Conversion Reference Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                <Scale className="h-4 w-4 text-sky-600" />
                {t('Telangana Standard Conversions', 'ప్రామాణిక విస్తీర్ణ కొలతలు')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <p>• 1 Acre = 40 Guntas</p>
                <p>• 1 Acre = 100 Cents</p>
                <p>• 1 Gunta = 2.5 Cents</p>
                <p>• 1 Hectare = 2.471 Acres</p>
              </div>
            </div>

            {/* Guide Instructions Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                <Ruler className="h-4 w-4 text-cyan-600" />
                {t('Measurement Guide', 'విస్తీర్ణ కొలత మార్గదర్శి')}
              </h4>
              <ul className="space-y-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                {guideItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={copyResult}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-slate-800 active:scale-95 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
              >
                <Copy className="h-4 w-4" />
                {t('Copy Area', 'విస్తీర్ణం కాపీ')}
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
          </div>
        </div>
      </div>
    </div>
  );
}

function getAcreageGuide(mode: AcreageMode, t: (english: string, telugu: string) => string) {
  if (mode === 'acres') {
    return [
      t('Paste Acres.Guntas values from Excel or type one per line.', 'Excel నుండి ఎకరాలు.గుంటల విలువలను అతికించండి లేదా ఒక్కో లైన్‌లో టైప్ చేయండి.'),
      t('Example 2.10 means 2 acres and 10 guntas.', 'ఉదా: 2.10 అంటే 2 ఎకరాలు 10 గుంటలు.'),
      t('Read total Acres.Guntas, hectares and item count.', 'మొత్తం ఎకరాలు.గుంటలు, హెక్టార్లు మరియు అంశాల సంఖ్య చూడండి.'),
    ];
  }

  if (mode === 'cents') {
    return [
      t('Enter the total cents value.', 'మొత్తం సెంట్ల విలువ నమోదు చేయండి.'),
      t('Read decimal acres and equivalent guntas.', 'దశాంశ ఎకరాలు మరియు సమానమైన గుంటలు చూడండి.'),
      t('Use hectares output for official reports.', 'అధికారిక నివేదికలకు హెక్టార్లు ఉపయోగించండి.'),
    ];
  }

  if (mode === 'acres-cents') {
    return [
      t('Paste Acres.Cents values from Excel or type one per line.', 'Excel నుండి ఎకరాలు.సెంట్ల విలువలను అతికించండి లేదా ఒక్కో లైన్‌లో టైప్ చేయండి.'),
      t('Example 2.25 means 2 acres and 25 cents.', 'ఉదా: 2.25 అంటే 2 ఎకరాలు 25 సెంట్లు.'),
      t('Read acres, cents, guntas and hectares instantly.', 'ఎకరాలు, సెంట్లు, గుంటలు, హెక్టార్లు వెంటనే చూడండి.'),
    ];
  }

  if (mode === 'hectares') {
    return [
      t('Enter the total hectare value.', 'మొత్తం హెక్టార్ల విలువ నమోదు చేయండి.'),
      t('Read equivalent acres, cents and guntas.', 'సమానమైన ఎకరాలు, సెంట్లు, గుంటలు చూడండి.'),
      t('Use the acre-gunta note for field records.', 'ఫీల్డ్ రికార్డులకు ఎకరా-గుంట గమనిక ఉపయోగించండి.'),
    ];
  }

  return [
    t('Enter the total guntas value.', 'మొత్తం గుంటల విలువ నమోదు చేయండి.'),
    t('Read decimal acres and equivalent cents.', 'దశాంశ ఎకరాలు మరియు సమానమైన సెంట్లు చూడండి.'),
    t('Use hectares output for field records.', 'ఫీల్డ్ రికార్డులకు హెక్టార్లు ఉపయోగించండి.'),
  ];
}

function readMode(): AcreageMode {
  const stored = safeSessionStorage.getItem(MODE_STORAGE_KEY);
  return modeOptions.some((option) => option.value === stored) ? stored as AcreageMode : 'acres';
}

export function calculateAcreageResult({
  mode,
  acreInput,
  centInput,
  guntaInput,
  hectareInput,
  acresCentsPasteInput,
  t,
}: {
  mode: AcreageMode;
  acreInput: string;
  centInput: string;
  guntaInput: string;
  hectareInput: string;
  acresCentsPasteInput: string;
  t: (english: string, telugu: string) => string;
}) {
  const totalCents = calculateTotalCents({ mode, acreInput, centInput, guntaInput, hectareInput, acresCentsPasteInput });
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
    acresCents: `${wholeAcres} ${t('acres', 'ఎకరాలు')} ${formatNumber(remainingCents)} ${t('cents', 'సెంట్లు')}`,
    guntas: formatNumber(totalGuntas),
    acreGuntaNote: `${Math.floor(totalGuntas / GUNTAS_PER_ACRE)} ${t('acres', 'ఎకరాలు')} ${formatNumber(totalGuntas % GUNTAS_PER_ACRE)} ${t('guntas', 'గుంటలు')}`,
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
  hectareInput,
  acresCentsPasteInput,
}: {
  mode: AcreageMode;
  acreInput: string;
  centInput: string;
  guntaInput: string;
  hectareInput: string;
  acresCentsPasteInput: string;
}) {
  if (mode === 'cents') return parsePositiveNumber(centInput);
  if (mode === 'guntas') return parsePositiveNumber(guntaInput) * CENTS_PER_GUNTA;
  if (mode === 'hectares') return (parsePositiveNumber(hectareInput) / HECTARES_PER_ACRE) * CENTS_PER_ACRE;
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

export function calculateAcreValues(input: string) {
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
