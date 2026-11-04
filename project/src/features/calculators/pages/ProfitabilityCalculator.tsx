import React, { useMemo, useState } from 'react';
import {
  Check,
  CircleDollarSign,
  Copy,
  ExternalLink,
  Layers,
  Printer,
  RotateCcw,
  Sparkles,
  Sprout,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { CompactToolkitHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { useAuth } from '../../../shared/context/AuthContext';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';

export type YieldUnit = 'quintal' | 'bag50' | 'bag75' | 'tonne' | 'kg';
export type AreaUnit = 'acres' | 'guntas' | 'hectares';
export type CostInputMode = 'per_acre' | 'total_field';
export type ResultDisplayMode = 'per_acre' | 'total_field';

interface CropPreset {
  id: string;
  name: string;
  nameTe: string;
  icon: string;
  defaultYield: number; // in default unit
  yieldUnit: YieldUnit;
  defaultPrice: number; // ₹ per unit
  msp?: number; // MSP per quintal if applicable
  mspNote?: string;
  landPreparation: number;
  seeds: number;
  fertilizers: number;
  pesticides: number;
  labour: number;
  otherExpenses: number;
  byProductValue: number;
}

const CROP_PRESETS: CropPreset[] = [
  {
    id: 'cotton',
    name: 'Cotton',
    nameTe: 'పత్తి (కపాస్)',
    icon: '🌱',
    defaultYield: 10,
    yieldUnit: 'quintal',
    defaultPrice: 8267,
    msp: 8267,
    mspNote: 'MSP 2026-27 (Medium: ₹8,267 / Long: ₹8,667)',
    landPreparation: 4500,
    seeds: 2100,
    fertilizers: 6500,
    pesticides: 5500,
    labour: 14000,
    otherExpenses: 2000,
    byProductValue: 0,
  },
  {
    id: 'paddy',
    name: 'Paddy',
    nameTe: 'వరి (ధాన్యం)',
    icon: '🌾',
    defaultYield: 24,
    yieldUnit: 'quintal',
    defaultPrice: 2441,
    msp: 2441,
    mspNote: 'MSP 2026-27 (Common: ₹2,441 / Grade A: ₹2,461)',
    landPreparation: 5000,
    seeds: 2200,
    fertilizers: 5500,
    pesticides: 3500,
    labour: 13500,
    otherExpenses: 2500,
    byProductValue: 2000, // Paddy straw
  },
  {
    id: 'redgram',
    name: 'Redgram / Pigeonpea',
    nameTe: 'కందులు',
    icon: '🌿',
    defaultYield: 6.5,
    yieldUnit: 'quintal',
    defaultPrice: 8450,
    msp: 8450,
    mspNote: 'MSP 2026-27',
    landPreparation: 3500,
    seeds: 1400,
    fertilizers: 4000,
    pesticides: 3800,
    labour: 7500,
    otherExpenses: 1500,
    byProductValue: 0,
  },
  {
    id: 'maize',
    name: 'Maize',
    nameTe: 'మొక్కజొన్న',
    icon: '🌽',
    defaultYield: 26,
    yieldUnit: 'quintal',
    defaultPrice: 2410,
    msp: 2410,
    mspNote: 'MSP 2026-27',
    landPreparation: 4200,
    seeds: 2600,
    fertilizers: 6800,
    pesticides: 2800,
    labour: 8500,
    otherExpenses: 2000,
    byProductValue: 1200, // Stover/fodder
  },
  {
    id: 'soybean',
    name: 'Soybean',
    nameTe: 'సోయాబీన్',
    icon: '🍃',
    defaultYield: 9.5,
    yieldUnit: 'quintal',
    defaultPrice: 5708,
    msp: 5708,
    mspNote: 'MSP 2026-27',
    landPreparation: 3500,
    seeds: 3500,
    fertilizers: 4200,
    pesticides: 3200,
    labour: 6500,
    otherExpenses: 1800,
    byProductValue: 0,
  },
  {
    id: 'groundnut',
    name: 'Groundnut',
    nameTe: 'వేరుశనగ (పల్లీ)',
    icon: '🥜',
    defaultYield: 12,
    yieldUnit: 'quintal',
    defaultPrice: 7517,
    msp: 7517,
    mspNote: 'MSP 2026-27',
    landPreparation: 4000,
    seeds: 5000,
    fertilizers: 4500,
    pesticides: 3000,
    labour: 11000,
    otherExpenses: 2000,
    byProductValue: 1500, // Groundnut haulms/fodder
  },
  {
    id: 'jowar',
    name: 'Jowar (Sorghum)',
    nameTe: 'జొన్న',
    icon: '🌾',
    defaultYield: 14,
    yieldUnit: 'quintal',
    defaultPrice: 4023,
    msp: 4023,
    mspNote: 'MSP 2026-27 (Hybrid: ₹4,023 / Maldandi: ₹4,073)',
    landPreparation: 3500,
    seeds: 1200,
    fertilizers: 3800,
    pesticides: 1800,
    labour: 6500,
    otherExpenses: 1500,
    byProductValue: 2000, // Stover/fodder
  },
  {
    id: 'greengram',
    name: 'Greengram (Moong)',
    nameTe: 'పెసలు',
    icon: '🌱',
    defaultYield: 5,
    yieldUnit: 'quintal',
    defaultPrice: 8780,
    msp: 8780,
    mspNote: 'MSP 2026-27',
    landPreparation: 3200,
    seeds: 1600,
    fertilizers: 3000,
    pesticides: 2800,
    labour: 6000,
    otherExpenses: 1200,
    byProductValue: 0,
  },
  {
    id: 'blackgram',
    name: 'Blackgram (Urad)',
    nameTe: 'మినుములు',
    icon: '🌱',
    defaultYield: 5.5,
    yieldUnit: 'quintal',
    defaultPrice: 8200,
    msp: 8200,
    mspNote: 'MSP 2026-27',
    landPreparation: 3200,
    seeds: 1500,
    fertilizers: 3000,
    pesticides: 2800,
    labour: 6000,
    otherExpenses: 1200,
    byProductValue: 0,
  },
  {
    id: 'bengalgram',
    name: 'Bengal Gram (Chickpea)',
    nameTe: 'శనగ',
    icon: '🫘',
    defaultYield: 7.5,
    yieldUnit: 'quintal',
    defaultPrice: 5650,
    msp: 5650,
    mspNote: 'MSP Rabi (₹5,650 / Quintal)',
    landPreparation: 3500,
    seeds: 3000,
    fertilizers: 3200,
    pesticides: 2800,
    labour: 6500,
    otherExpenses: 1500,
    byProductValue: 0,
  },
  {
    id: 'chilli',
    name: 'Chilli',
    nameTe: 'మిరప',
    icon: '🌶️',
    defaultYield: 20,
    yieldUnit: 'quintal',
    defaultPrice: 18000,
    landPreparation: 8000,
    seeds: 7500,
    fertilizers: 18000,
    pesticides: 22000,
    labour: 38000,
    otherExpenses: 5000,
    byProductValue: 0,
  },
  {
    id: 'custom',
    name: 'Custom Crop',
    nameTe: 'ఇతర పంట',
    icon: '✨',
    defaultYield: 0,
    yieldUnit: 'quintal',
    defaultPrice: 0,
    landPreparation: 0,
    seeds: 0,
    fertilizers: 0,
    pesticides: 0,
    labour: 0,
    otherExpenses: 0,
    byProductValue: 0,
  },
];

const YIELD_UNIT_META: Record<YieldUnit, { label: string; labelTe: string; quintalMultiplier: number }> = {
  quintal: { label: 'Quintal (100 kg)', labelTe: 'క్వింటాళ్ళు (100 కిలోలు)', quintalMultiplier: 1 },
  bag50: { label: 'Bag (50 kg)', labelTe: 'బస్తా (50 కిలోలు)', quintalMultiplier: 0.5 },
  bag75: { label: 'Bag (75 kg)', labelTe: 'బస్తా (75 కిలోలు)', quintalMultiplier: 0.75 },
  tonne: { label: 'Tonne (1000 kg)', labelTe: 'టన్ను (1000 కిలోలు)', quintalMultiplier: 10 },
  kg: { label: 'Kilogram (Kg)', labelTe: 'కిలో (Kg)', quintalMultiplier: 0.01 },
};

function formatRupees(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString('en-IN')}`;
}

function WhatsAppIcon({ className = '' }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function ProfitabilityCalculator() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const { isAdminUser, isTestUser } = useAuth();
  const showCompactHeader = isAdminUser || isTestUser;
  const { toasts, removeToast, showSuccess, showWarning } = useToast();

  // Reset animation state
  const [isResetting, setIsResetting] = useState(false);

  // Selected crop preset
  const [selectedCropId, setSelectedCropId] = useState<string>('cotton');
  const [customCropName, setCustomCropName] = useState<string>('');

  // Field area settings
  const [landArea, setLandArea] = useState<string>('1');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('acres');
  const [costInputMode, setCostInputMode] = useState<CostInputMode>('per_acre');
  const [resultDisplayMode, setResultDisplayMode] = useState<ResultDisplayMode>('per_acre');

  // Operational Expenses Inputs
  const [landPrepCost, setLandPrepCost] = useState<string>('4500');
  const [seedsCost, setSeedsCost] = useState<string>('2100');
  const [fertilizersCost, setFertilizersCost] = useState<string>('6500');
  const [pesticidesCost, setPesticidesCost] = useState<string>('5500');
  const [labourCost, setLabourCost] = useState<string>('14000');
  const [otherCost, setOtherCost] = useState<string>('2000');

  // Yield & Revenue Inputs
  const [yieldQuantity, setYieldQuantity] = useState<string>('10');
  const [yieldUnit, setYieldUnit] = useState<YieldUnit>('quintal');
  const [unitPrice, setUnitPrice] = useState<string>('8267');
  const [byProductIncome, setByProductIncome] = useState<string>('0');

  // Convert area to Acres
  const areaInAcres = useMemo(() => {
    const raw = parseFloat(landArea) || 0;
    if (raw <= 0) return 1;
    if (areaUnit === 'guntas') return raw / 40;
    if (areaUnit === 'hectares') return raw * 2.47105;
    return raw;
  }, [landArea, areaUnit]);

  // Apply crop preset
  const applyPreset = (preset: CropPreset) => {
    setSelectedCropId(preset.id);
    if (preset.id !== 'custom') {
      setYieldQuantity(preset.defaultYield > 0 ? String(preset.defaultYield) : '');
      setYieldUnit(preset.yieldUnit);
      setUnitPrice(preset.defaultPrice > 0 ? String(preset.defaultPrice) : '');
      setByProductIncome(preset.byProductValue > 0 ? String(preset.byProductValue) : '0');
      setLandPrepCost(preset.landPreparation > 0 ? String(preset.landPreparation) : '0');
      setSeedsCost(preset.seeds > 0 ? String(preset.seeds) : '0');
      setFertilizersCost(preset.fertilizers > 0 ? String(preset.fertilizers) : '0');
      setPesticidesCost(preset.pesticides > 0 ? String(preset.pesticides) : '0');
      setLabourCost(preset.labour > 0 ? String(preset.labour) : '0');
      setOtherCost(preset.otherExpenses > 0 ? String(preset.otherExpenses) : '0');
      setCostInputMode('per_acre');
      showSuccess(
        t('Preset Applied', 'ప్రిసెట్ వర్తించబడింది'),
        t(`Loaded typical per-acre estimates for ${preset.name}.`, `${preset.nameTe} కొరకు సాధారణ ఎకరా అంచనాలు లోడ్ చేయబడ్డాయి.`)
      );
    } else {
      setCustomCropName('');
      setYieldQuantity('');
      setUnitPrice('');
      setByProductIncome('0');
      setLandPrepCost('');
      setSeedsCost('');
      setFertilizersCost('');
      setPesticidesCost('');
      setLabourCost('');
      setOtherCost('');
    }
  };

  // Calculations
  const calculations = useMemo(() => {
    const rawLand = parseFloat(landPrepCost) || 0;
    const rawSeeds = parseFloat(seedsCost) || 0;
    const rawFert = parseFloat(fertilizersCost) || 0;
    const rawPest = parseFloat(pesticidesCost) || 0;
    const rawLabour = parseFloat(labourCost) || 0;
    const rawOther = parseFloat(otherCost) || 0;

    const rawYield = parseFloat(yieldQuantity) || 0;
    const rawPrice = parseFloat(unitPrice) || 0;
    const rawByProduct = parseFloat(byProductIncome) || 0;

    // Normalizing to Per Acre base
    const multiplierToPerAcre = costInputMode === 'total_field' && areaInAcres > 0 ? 1 / areaInAcres : 1;

    // Per Acre Costs
    const landPerAcre = costInputMode === 'total_field' ? rawLand * multiplierToPerAcre : rawLand;
    const seedsPerAcre = costInputMode === 'total_field' ? rawSeeds * multiplierToPerAcre : rawSeeds;
    const fertPerAcre = costInputMode === 'total_field' ? rawFert * multiplierToPerAcre : rawFert;
    const pestPerAcre = costInputMode === 'total_field' ? rawPest * multiplierToPerAcre : rawPest;
    const labourPerAcre = costInputMode === 'total_field' ? rawLabour * multiplierToPerAcre : rawLabour;
    const otherPerAcre = costInputMode === 'total_field' ? rawOther * multiplierToPerAcre : rawOther;

    const totalCostPerAcre = landPerAcre + seedsPerAcre + fertPerAcre + pestPerAcre + labourPerAcre + otherPerAcre;
    const totalCostField = totalCostPerAcre * areaInAcres;

    // Yield in per-acre and field
    const yieldPerAcre = costInputMode === 'total_field' ? rawYield / areaInAcres : rawYield;
    const yieldField = yieldPerAcre * areaInAcres;

    // Revenue
    const mainCropRevenuePerAcre = yieldPerAcre * rawPrice;
    const byProductPerAcre = costInputMode === 'total_field' ? rawByProduct / areaInAcres : rawByProduct;
    const grossRevenuePerAcre = mainCropRevenuePerAcre + byProductPerAcre;
    const grossRevenueField = grossRevenuePerAcre * areaInAcres;

    // Net Profit / Loss
    const netProfitPerAcre = grossRevenuePerAcre - totalCostPerAcre;
    const netProfitField = grossRevenueField - totalCostField;

    // Key Ratios
    const bcRatio = totalCostPerAcre > 0 ? grossRevenuePerAcre / totalCostPerAcre : 0;
    const costOfProductionPerUnit = yieldPerAcre > 0 ? totalCostPerAcre / yieldPerAcre : 0;
    const breakEvenPrice = yieldPerAcre > 0 ? (totalCostPerAcre - byProductPerAcre) / yieldPerAcre : 0;
    const breakEvenYield = rawPrice > 0 ? (totalCostPerAcre - byProductPerAcre) / rawPrice : 0;
    const profitMargin = grossRevenuePerAcre > 0 ? (netProfitPerAcre / grossRevenuePerAcre) * 100 : 0;

    // Expense Breakdown
    const breakdown = [
      {
        id: 'land',
        name: 'Land Preparation',
        nameTe: 'నేల తయారీ',
        amountPerAcre: landPerAcre,
        amountField: landPerAcre * areaInAcres,
        color: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-400',
        barColor: 'bg-amber-500',
      },
      {
        id: 'seeds',
        name: 'Seeds',
        nameTe: 'విత్తనాలు',
        amountPerAcre: seedsPerAcre,
        amountField: seedsPerAcre * areaInAcres,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        barColor: 'bg-emerald-500',
      },
      {
        id: 'fertilizers',
        name: 'Fertilizers',
        nameTe: 'ఎరువులు',
        amountPerAcre: fertPerAcre,
        amountField: fertPerAcre * areaInAcres,
        color: 'bg-teal-500',
        textColor: 'text-teal-700 dark:text-teal-400',
        barColor: 'bg-teal-500',
      },
      {
        id: 'pesticides',
        name: 'Pesticides / Chemicals',
        nameTe: 'పురుగుమందులు / రసాయనాలు',
        amountPerAcre: pestPerAcre,
        amountField: pestPerAcre * areaInAcres,
        color: 'bg-rose-500',
        textColor: 'text-rose-700 dark:text-rose-400',
        barColor: 'bg-rose-500',
      },
      {
        id: 'labour',
        name: 'Labour Charges',
        nameTe: 'కూలీల ఖర్చులు',
        amountPerAcre: labourPerAcre,
        amountField: labourPerAcre * areaInAcres,
        color: 'bg-indigo-500',
        textColor: 'text-indigo-700 dark:text-indigo-400',
        barColor: 'bg-indigo-500',
      },
      {
        id: 'other',
        name: 'Other Operations',
        nameTe: 'ఇతర ఖర్చులు',
        amountPerAcre: otherPerAcre,
        amountField: otherPerAcre * areaInAcres,
        color: 'bg-slate-400',
        textColor: 'text-slate-700 dark:text-slate-400',
        barColor: 'bg-slate-400',
      },
    ].map((item) => ({
      ...item,
      percentage: totalCostPerAcre > 0 ? (item.amountPerAcre / totalCostPerAcre) * 100 : 0,
    }));

    return {
      landPerAcre,
      seedsPerAcre,
      fertPerAcre,
      pestPerAcre,
      labourPerAcre,
      otherPerAcre,
      totalCostPerAcre,
      totalCostField,
      yieldPerAcre,
      yieldField,
      grossRevenuePerAcre,
      grossRevenueField,
      netProfitPerAcre,
      netProfitField,
      bcRatio,
      costOfProductionPerUnit,
      breakEvenPrice,
      breakEvenYield,
      profitMargin,
      breakdown,
      isProfit: netProfitPerAcre >= 0,
    };
  }, [
    landPrepCost,
    seedsCost,
    fertilizersCost,
    pesticidesCost,
    labourCost,
    otherCost,
    yieldQuantity,
    unitPrice,
    byProductIncome,
    costInputMode,
    areaInAcres,
  ]);

  const activePreset = CROP_PRESETS.find((p) => p.id === selectedCropId);
  const displayCropName = selectedCropId === 'custom' && customCropName ? customCropName : activePreset?.name || 'Crop';
  const displayCropNameTe = selectedCropId === 'custom' && customCropName ? customCropName : activePreset?.nameTe || 'పంట';

  const resetAll = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setSelectedCropId('custom');
    setCustomCropName('');
    setLandArea('');
    setLandPrepCost('');
    setSeedsCost('');
    setFertilizersCost('');
    setPesticidesCost('');
    setLabourCost('');
    setOtherCost('');
    setYieldQuantity('');
    setUnitPrice('');
    setByProductIncome('0');
    setCostInputMode('per_acre');
    setResultDisplayMode('per_acre');
    showSuccess(t('Inputs Cleared', 'ఇన్‌పుట్‌లు తొలగించబడ్డాయి'), t('All input fields have been cleared.', 'అన్ని ఇన్‌పుట్ ఫీల్డ్‌లు ఖాళీ చేయబడ్డాయి.'));
  };

  // WhatsApp Share Text Builder
  const shareText = useMemo(() => {
    const crop = t(displayCropName, displayCropNameTe);
    const areaStr = `${landArea} ${t(areaUnit, areaUnit)}`;
    const cost = formatRupees(resultDisplayMode === 'per_acre' ? calculations.totalCostPerAcre : calculations.totalCostField);
    const revenue = formatRupees(resultDisplayMode === 'per_acre' ? calculations.grossRevenuePerAcre : calculations.grossRevenueField);
    const profit = formatRupees(resultDisplayMode === 'per_acre' ? calculations.netProfitPerAcre : calculations.netProfitField);
    const profitLabel = calculations.isProfit ? t('Net Profit', 'నికర లాభం') : t('Net Loss', 'నికర నష్టం');
    const unitLabel = t(YIELD_UNIT_META[yieldUnit].label, YIELD_UNIT_META[yieldUnit].labelTe);

    return `🌾 *AGRONIX — Crop Profitability Report*\n` +
      `🌱 *Crop / పంట:* ${crop}\n` +
      `📍 *Area / విస్తీర్ణం:* ${areaStr}\n` +
      `📦 *Yield / దిగుబడి:* ${yieldQuantity} ${unitLabel}\n` +
      `💰 *Price / ధర:* ₹${unitPrice} per ${unitLabel}\n` +
      `---------------------------------\n` +
      `💵 *Gross Returns / మొత్తం ఆదాయం:* ${revenue}\n` +
      `🧾 *Total Cost / సాగు ఖర్చు:* ${cost}\n` +
      `📊 *${profitLabel}:* ${profit} (${resultDisplayMode === 'per_acre' ? 'Per Acre' : 'Total Field'})\n` +
      `📈 *B:C Ratio / లాభ నిష్పత్తి:* ${calculations.bcRatio.toFixed(2)} : 1\n` +
      `🎯 *Cost of Production:* ${formatRupees(calculations.costOfProductionPerUnit)} / ${unitLabel}\n` +
      `⚖️ *Break-Even Price:* ${formatRupees(calculations.breakEvenPrice)} / ${unitLabel}\n` +
      `---------------------------------\n` +
      `Generated on Agri-Portal Tiryani / AGRONIX`;
  }, [displayCropName, displayCropNameTe, landArea, areaUnit, yieldQuantity, yieldUnit, unitPrice, resultDisplayMode, calculations, t]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      showSuccess(t('Report Copied', 'నివేదిక కాపీ అయింది'), t('Summary copied to clipboard.', 'సారాంశం క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది.'));
    } catch {
      showWarning(t('Copy Failed', 'కాపీ విఫలమైంది'), t('Could not copy report.', 'నివేదికను కాపీ చేయలేకపోయాము.'));
    }
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 sm:px-6 lg:px-8 print:hidden">
        {showCompactHeader ? (
          <CompactToolkitHeader
            icon={CircleDollarSign}
            eyebrow={t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
            title={t('Profit Calculator', 'లాభదాయకత కాలిక్యులేటర్')}
            subtitle={t(
              'Comprehensive cost of cultivation, yield economics and net profit assessment.',
              'సమగ్ర సాగు ఖర్చు, దిగుబడి ఆదాయం మరియు నికర లాభాల విశ్లేషణ.'
            )}
            onBack={() => navigate('/officer-toolkit/farm-calculators')}
            actions={<LanguageToggle language={language} onClick={toggleLanguage} accent="emerald" />}
            className="mb-1"
          />
        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 p-3.5 sm:p-4 text-white shadow-md dark:border-emerald-700/60">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
              <BackButton onClick={() => navigate('/officer-toolkit/farm-calculators')} tone="solid" className="mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                    <CircleDollarSign className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-100 mb-0.5">
                      {t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
                    </p>
                    <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug tracking-tight">
                      {t('Profit Calculator', 'లాభదాయకత కాలిక్యులేటర్')}
                    </h1>
                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                      {t(
                        'Cost of cultivation, operational expenses, yield & net profit per acre.',
                        'సాగు ఖర్చు, దిగుబడి, విక్రయ ధర మరియు నికర లాభాల సమగ్ర గణన.'
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

      {/* Printable Heading (Only visible in Print) */}
      <div className="hidden print:block text-center border-b pb-3 mb-3">
        <h1 className="text-2xl font-black text-slate-900">AGRONIX — Crop Profitability & Economics Report</h1>
        <p className="text-sm text-slate-600">Agricultural Extension & Farm Economics Assessment</p>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-8 sm:px-6 lg:px-8">
        {/* Step 1: Crop Presets Bar */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {t('Select Crop or Preset', 'పంట లేదా ప్రిసెట్ ఎంచుకోండి')}
              </h2>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto w-fit">
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <RotateCcw className={`h-3.5 w-3.5 transition-transform duration-500 ${isResetting ? 'animate-spin' : ''}`} />
                {t('Reset All', 'అన్నీ రీసెట్')}
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {CROP_PRESETS.map((preset) => {
              const isSelected = selectedCropId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  title={t(preset.name, preset.nameTe)}
                  className={`flex w-full min-w-0 items-center justify-start gap-2 rounded-xl border px-2.5 sm:px-3 py-2 text-xs font-black transition ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-base shrink-0">{preset.icon}</span>
                  <span className="truncate text-left">{t(preset.name, preset.nameTe)}</span>
                  {isSelected && <Check className="ml-auto h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>

          {selectedCropId === 'custom' && (
            <div className="mt-3 max-w-sm">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('Custom Crop Name', 'ఇతర పంట పేరు')}
              </label>
              <input
                type="text"
                value={customCropName}
                onChange={(e) => setCustomCropName(e.target.value)}
                placeholder="e.g. Tomato, Groundnut, Turmeric..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          )}

          {activePreset?.msp && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span>
                  {t('Official MSP (2026-27):', 'అధికారిక మద్దతు ధర (MSP 2026-27):')}{' '}
                  <strong className="text-amber-950 dark:text-amber-100 font-black">
                    ₹{activePreset.msp.toLocaleString('en-IN')}
                  </strong>{' '}
                  / Quintal ({activePreset.mspNote})
                </span>
              </div>
              <a
                href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618&reg=48&lang=2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 hover:text-amber-950 hover:underline dark:text-amber-300 dark:hover:text-amber-100"
                title="View official PIB Press Release (PRID 2260618)"
              >
                <span>{t('PIB Release (PRID 2260618)', 'PIB అధికారిక ప్రకటన')}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}
        </section>

        {/* Main Grid: Inputs (Left 7 Cols) + Live Results (Right 5 Cols) */}
        <div className="grid gap-5 lg:grid-cols-12 items-start">
          {/* LEFT: Inputs Form */}
          <div className="space-y-4 lg:col-span-7">
            {/* Field Size & Cost Basis Setting */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('1. Land Area & Input Basis', '1. పొలం విస్తీర్ణం & గణన పద్ధతి')}
                  </h3>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Land Holding / Area', 'భూ విస్తీర్ణం')}
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      placeholder="1"
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <select
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="acres">{t('Acres', 'ఎకరాలు')}</option>
                      <option value="guntas">{t('Guntas', 'గుంటలు')}</option>
                      <option value="hectares">{t('Hectares', 'హెక్టార్లు')}</option>
                    </select>
                  </div>
                  {areaUnit !== 'acres' && (
                    <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                      ≈ {areaInAcres.toFixed(2)} {t('Acres', 'ఎకరాలు')}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('Cost Inputs Basis', 'ఖర్చుల నమోదు విధానం')}
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setCostInputMode('per_acre')}
                      className={`rounded-lg py-1.5 text-xs font-bold transition ${
                        costInputMode === 'per_acre'
                          ? 'bg-white text-emerald-800 shadow-sm dark:bg-slate-700 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      {t('Per Acre (₹/Ac)', 'ఎకరాకు')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCostInputMode('total_field')}
                      className={`rounded-lg py-1.5 text-xs font-bold transition ${
                        costInputMode === 'total_field'
                          ? 'bg-white text-emerald-800 shadow-sm dark:bg-slate-700 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      {t('Total Field', 'మొత్తం పొలానికి')}
                    </button>
                  </div>
                  <span className="mt-1 block text-[11px] font-medium text-slate-500">
                    {costInputMode === 'per_acre'
                      ? t('Entering standard per-acre costs.', 'ఎకరాకు అయ్యే ఖర్చులను నమోదు చేస్తున్నారు.')
                      : t(`Entering overall costs for ${landArea} ${areaUnit}.`, `మొత్తం ${landArea} ${areaUnit} కోసం ఖర్చులు నమోదు చేస్తున్నారు.`)}
                  </span>
                </div>
              </div>
            </section>

            {/* Expenses Sections (The 5 requested categories + other) */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {t('2. Cost of Cultivation (Operational Expenses)', '2. సాగు ఖర్చులు (ఆపరేషనల్ వ్యయాలు)')}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      {costInputMode === 'per_acre' ? t('All values in ₹ per Acre', 'అన్ని విలువలు ₹ ఎకరాకు') : t(`All values in ₹ for total field (${landArea} ${areaUnit})`, `మొత్తం పొలానికి ₹ లో`)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* 1. Land Preparation */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200/80 text-[10px] font-black text-amber-900 dark:bg-amber-950 dark:text-amber-300">1</span>
                      {t('Land Preparation', 'నేల తయారీ')}
                    </label>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {t('Ploughing, harrowing, rotavator, ridges & furrows', 'దుక్కి, రోటవేటర్, గట్లు, నాగలి ఖర్చులు')}
                  </p>
                  <div className="mt-2 relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={landPrepCost}
                      onChange={(e) => setLandPrepCost(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-sm font-bold text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* 2. Seeds */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200/80 text-[10px] font-black text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">2</span>
                      {t('Seeds & Sowing', 'విత్తనాలు & విత్తడం')}
                    </label>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {t('Seed packets/kg, seed treatment & sowing', 'విత్తనాల ఖర్చు, విత్తన శుద్ధి & విత్తే ఖర్చు')}
                  </p>
                  <div className="mt-2 relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={seedsCost}
                      onChange={(e) => setSeedsCost(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* 3. Fertilizers */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-200/80 text-[10px] font-black text-teal-900 dark:bg-teal-950 dark:text-teal-300">3</span>
                      {t('Fertilizers & Nutrients', 'ఎరువులు & పోషకాలు')}
                    </label>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {t('DAP, Urea, MOP, Complex, FYM manure & micro-nutrients', 'రసాయన ఎరువులు, సేంద్రీయ ఎరువు & సూక్ష్మ పోషకాలు')}
                  </p>
                  <div className="mt-2 relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={fertilizersCost}
                      onChange={(e) => setFertilizersCost(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* 4. Pesticides & Chemicals */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-200/80 text-[10px] font-black text-rose-900 dark:bg-rose-950 dark:text-rose-300">4</span>
                      {t('Pesticides & Chemicals', 'పురుగుమందులు & రసాయనాలు')}
                    </label>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {t('Weedicides, insecticides, fungicides & spray labor', 'కలుపు మందులు, క్రిమిసంహారకాలు & స్ప్రేయింగ్ ఖర్చు')}
                  </p>
                  <div className="mt-2 relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={pesticidesCost}
                      onChange={(e) => setPesticidesCost(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-sm font-bold text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* 5. Labour */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200/80 text-[10px] font-black text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">5</span>
                      {t('Labour & Operations', 'కూలీల ఖర్చులు')}
                    </label>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {t('Intercultivation, weeding, harvesting & picking', 'ఎడతెగని కలుపుతీత, నీటి పారుదల & కోత / తీత కూలీలు')}
                  </p>
                  <div className="mt-2 relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={labourCost}
                      onChange={(e) => setLabourCost(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-sm font-bold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* 6. Other / Machinery / Transport */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-900 dark:bg-slate-800 dark:text-slate-300">6</span>
                      {t('Machinery & Transport', 'యంత్రాలు & రవాణా ఖర్చులు')}
                    </label>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {t('Threshing rent, gunny bags, mandi transport & misc.', 'నూర్పిడి, గోనె సంచులు, మార్కెట్ రవాణా & ఇతరులు')}
                  </p>
                  <div className="mt-2 relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={otherCost}
                      onChange={(e) => setOtherCost(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Total Cost Strip */}
              <div className="flex items-center justify-between rounded-xl bg-slate-100 p-3 text-xs font-bold dark:bg-slate-800">
                <span className="text-slate-700 dark:text-slate-300">
                  {t('Total Cost of Cultivation:', 'మొత్తం సాగు ఖర్చు:')}
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {formatRupees(costInputMode === 'per_acre' ? calculations.totalCostPerAcre : calculations.totalCostField)}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    ({costInputMode === 'per_acre' ? t('per acre', 'ఎకరాకు') : t('total field', 'మొత్తం')})
                  </span>
                </span>
              </div>
            </section>

            {/* Yield & Output Realization (Requested inputs) */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300">
                    <Sprout className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {t('3. Yield & Market Price (Revenue)', '3. దిగుబడి & మార్కెట్ ధర (ఆదాయం)')}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      {t('Specify production volume and expected realization per unit', 'దిగుబడి పరిమాణం మరియు యూనిట్ విక్రయ ధరను నమోదు చేయండి')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Yield quantity & unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t('Yield Quantity', 'దిగుబడి పరిమాణం')}
                    <span className="ml-1 text-[11px] font-normal text-slate-500">
                      ({costInputMode === 'per_acre' ? t('per acre', 'ఎకరాకు') : t('total field', 'మొత్తం')})
                    </span>
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={yieldQuantity}
                      onChange={(e) => setYieldQuantity(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <select
                      value={yieldUnit}
                      onChange={(e) => setYieldUnit(e.target.value as YieldUnit)}
                      className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition focus:border-green-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      {Object.entries(YIELD_UNIT_META).map(([key, val]) => (
                        <option key={key} value={key}>
                          {t(val.label, val.labelTe)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cost per unit (Market Price / MSP) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t('Selling Price / Cost per Unit', 'విక్రయ ధర / యూనిట్ ధర')}
                  </label>
                  <div className="mt-1 relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="e.g. 8267"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <span className="mt-1 block text-[10px] font-semibold text-slate-500">
                    {t('Per', 'యూనిట్:')} {t(YIELD_UNIT_META[yieldUnit].label, YIELD_UNIT_META[yieldUnit].labelTe)}
                  </span>
                </div>

                {/* By-product / Straw value (Optional) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t('By-product / Straw / Fodder Income (Optional)', 'ఉప-ఉత్పత్తి / ఎండుగడ్డి / దాణా ఆదాయం (ఐచ్ఛికం)')}
                  </label>
                  <div className="mt-1 relative max-w-xs">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={byProductIncome}
                      onChange={(e) => setByProductIncome(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-xs font-bold text-slate-900 outline-none transition focus:border-green-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Live Results & Economics Card (Sticky on desktop) */}
          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-4">
            {/* Main Profit / Loss Card */}
            <div
              className={`relative overflow-hidden rounded-2xl border p-5 shadow-lg transition duration-200 ${
                calculations.isProfit
                  ? 'border-emerald-500/60 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white'
                  : 'border-rose-500/60 bg-gradient-to-br from-rose-950 via-rose-900 to-red-900 text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur-sm">
                  {calculations.isProfit ? (
                    <>
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                      {t('PROFITABLE CROP', 'లాభదాయకమైన పంట')}
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3.5 w-3.5 text-rose-300" />
                      {t('NET DEFICIT / LOSS', 'నికర లోటు / నష్టం')}
                    </>
                  )}
                </span>

                {/* Per Acre vs Field Toggle */}
                <div className="inline-flex rounded-lg bg-black/30 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setResultDisplayMode('per_acre')}
                    className={`rounded-md px-2 py-0.5 transition ${
                      resultDisplayMode === 'per_acre' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {t('Per Acre', 'ఎకరాకు')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultDisplayMode('total_field')}
                    className={`rounded-md px-2 py-0.5 transition ${
                      resultDisplayMode === 'total_field' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {t(`Field (${landArea} Ac)`, `మొత్తం`)}
                  </button>
                </div>
              </div>

              {/* Big Profit Hero Display */}
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {calculations.isProfit ? t('Estimated Net Profit', 'అంచనా నికర లాభం') : t('Estimated Net Loss', 'అంచనా నికర నష్టం')}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight">
                    {formatRupees(resultDisplayMode === 'per_acre' ? calculations.netProfitPerAcre : calculations.netProfitField)}
                  </span>
                  <span className="text-xs font-bold text-white/80">
                    {resultDisplayMode === 'per_acre' ? t('/ acre', '/ ఎకరాకు') : t('/ total field', '/ మొత్తం')}
                  </span>
                </div>
              </div>

              {/* High-level metrics row */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/15 pt-4">
                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {t('Gross Income', 'మొత్తం ఆదాయం')}
                  </span>
                  <span className="text-base font-black text-white">
                    {formatRupees(resultDisplayMode === 'per_acre' ? calculations.grossRevenuePerAcre : calculations.grossRevenueField)}
                  </span>
                </div>

                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {t('Total Cost', 'సాగు ఖర్చు')}
                  </span>
                  <span className="text-base font-black text-white">
                    {formatRupees(resultDisplayMode === 'per_acre' ? calculations.totalCostPerAcre : calculations.totalCostField)}
                  </span>
                </div>
              </div>

              {/* B:C Ratio & Cost of Production */}
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {t('Benefit-Cost (B:C)', 'లాభ-ఖర్చు నిష్పత్తి')}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-base font-black text-white">
                      {calculations.bcRatio.toFixed(2)} : 1
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-black ${
                        calculations.bcRatio >= 1.5
                          ? 'bg-emerald-400/30 text-emerald-200'
                          : calculations.bcRatio >= 1.0
                          ? 'bg-amber-400/30 text-amber-200'
                          : 'bg-rose-400/30 text-rose-200'
                      }`}
                    >
                      {calculations.bcRatio >= 1.5 ? 'Strong' : calculations.bcRatio >= 1.0 ? 'Fair' : 'Low'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {t('Cost / Unit Produced', 'యూనిట్ ఉత్పత్తి ఖర్చు')}
                  </span>
                  <span className="text-base font-black text-white">
                    {formatRupees(calculations.costOfProductionPerUnit)}
                  </span>
                </div>
              </div>

              {/* Break-even insights */}
              <div className="mt-3 rounded-xl bg-black/25 p-2.5 text-xs text-white/90">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>{t('Break-Even Sale Price:', 'కనీస విక్రయ ధర (నష్టం లేని ధర):')}</span>
                  <span className="font-black text-amber-300">
                    {formatRupees(calculations.breakEvenPrice)} / {t(YIELD_UNIT_META[yieldUnit].label, YIELD_UNIT_META[yieldUnit].labelTe).split(' ')[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold mt-1">
                  <span>{t('Break-Even Yield:', 'కనీస అవసర దిగుబడి:')}</span>
                  <span className="font-black text-amber-300">
                    {calculations.breakEvenYield.toFixed(2)} {t(YIELD_UNIT_META[yieldUnit].label, YIELD_UNIT_META[yieldUnit].labelTe).split(' ')[0]} / ac
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown Progress Bar & Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                <span>{t('Cost Breakdown by Operation', 'సాగు ఖర్చుల విభజన')}</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {formatRupees(resultDisplayMode === 'per_acre' ? calculations.totalCostPerAcre : calculations.totalCostField)}
                </span>
              </h4>

              {/* Proportional Stacked Bar */}
              <div className="mt-2.5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {calculations.breakdown.map((item) => {
                  if (item.percentage <= 0) return null;
                  return (
                    <div
                      key={item.id}
                      style={{ width: `${item.percentage}%` }}
                      className={`${item.barColor} transition-all duration-300`}
                      title={`${item.name}: ${item.percentage.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Breakdown List */}
              <div className="mt-3 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {calculations.breakdown.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {t(item.name, item.nameTe)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-400 text-[11px]">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <span className="font-black text-slate-900 dark:text-white w-20 text-right">
                        {formatRupees(resultDisplayMode === 'per_acre' ? item.amountPerAcre : item.amountField)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={copyReport}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-slate-800 active:scale-95 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
              >
                <Copy className="h-4 w-4" />
                {t('Copy Summary', 'నివేదిక కాపీ')}
              </button>

              <button
                type="button"
                onClick={shareToWhatsApp}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
                title="Share on WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('WhatsApp', 'వాట్సాప్')}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                title="Print Report"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Print', 'ప్రింట్')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
