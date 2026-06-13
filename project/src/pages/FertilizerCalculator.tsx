import React, { useEffect, useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Leaf,
  Plus,
  RefreshCw,
  Save,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

type Nutrients = {
  n: number;
  p: number;
  k: number;
};

type FertilizerGrade = Nutrients & {
  id?: string;
  name: string;
  s: number;
  bag_kg: number;
  is_active?: boolean;
};

type SplitDose = {
  stage: string;
  nPct: number;
  pPct: number;
  kPct: number;
};

type CropRecommendation = Nutrients & {
  id?: string;
  crop_name: string;
  crop?: string;
  zone?: string;
  season?: string;
  variety?: string;
  area_unit?: string;
  split_plan?: SplitDose[];
  is_active?: boolean;
};

type FertilizerResult = {
  grade: FertilizerGrade;
  kg: number;
  bags: number;
  supplied: Nutrients;
};

type SplitFertilizerPlanRow = {
  dose: SplitDose;
  nutrients: Nutrients;
  calculation: ReturnType<typeof calculateFertilizers>;
};

function WhatsAppIcon({ className = '' }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.03 3.2A12.73 12.73 0 0 0 5.11 22.5L3.7 28.8l6.45-1.52a12.74 12.74 0 1 0 5.88-24.08Zm0 2.34a10.4 10.4 0 1 1-5.08 19.47l-.4-.23-3.9.92.86-3.8-.25-.41A10.39 10.39 0 0 1 16.03 5.54Zm-4.3 5.12c-.22 0-.58.08-.88.42-.3.33-1.16 1.13-1.16 2.76 0 1.62 1.18 3.19 1.34 3.41.17.22 2.28 3.65 5.63 4.97 2.78 1.09 3.35.87 3.95.81.6-.05 1.95-.79 2.22-1.56.28-.77.28-1.43.2-1.57-.08-.14-.3-.22-.63-.39-.33-.16-1.95-.96-2.25-1.07-.3-.11-.52-.17-.74.16-.22.33-.85 1.07-1.04 1.29-.19.22-.38.25-.71.08-.33-.16-1.39-.51-2.64-1.63-.98-.87-1.64-1.95-1.83-2.28-.19-.33-.02-.51.14-.67.15-.15.33-.38.49-.57.16-.19.22-.33.33-.55.11-.22.06-.41-.03-.57-.08-.17-.74-1.79-1.02-2.45-.27-.64-.54-.55-.74-.56h-.64Z" />
    </svg>
  );
}

const AGRONOMIC_NOTES_EN = [
  'Apply 3-4 tons FYM per acre as basal application.',
  'Fertilizer recommendations should preferably be based on Soil Test Results.',
  'Split application of Nitrogen and Potash improves fertilizer use efficiency.',
  'Avoid fertilizer application before heavy rainfall.',
];

const AGRONOMIC_NOTES_TE = [
  'ఎకరానికి 3-4 టన్నుల పశువుల ఎరువును బేసల్ మోతాదుగా వేయాలి.',
  'ఎరువుల సిఫారసులు సాధ్యమైనంత వరకు మట్టి పరీక్ష ఫలితాల ఆధారంగా ఉండాలి.',
  'నత్రజని మరియు పొటాష్‌ను విడతల వారీగా వేయడం వల్ల ఎరువుల వినియోగ సామర్థ్యం మెరుగుపడుతుంది.',
  'భారీ వర్షానికి ముందు ఎరువులు వేయకండి.',
];

const DEFAULT_SPLIT: SplitDose[] = [
  { stage: 'Basal', nPct: 30, pPct: 100, kPct: 50 },
  { stage: '20 DAS', nPct: 25, pPct: 0, kPct: 20 },
  { stage: '40 DAS', nPct: 25, pPct: 0, kPct: 20 },
  { stage: '60 DAS', nPct: 20, pPct: 0, kPct: 10 },
  { stage: '80 DAS', nPct: 0, pPct: 0, kPct: 0 },
];

const DEFAULT_GRADES: FertilizerGrade[] = [
  { name: 'Urea', n: 46, p: 0, k: 0, s: 0, bag_kg: 45 },
  { name: 'Ammonium Sulphate', n: 21, p: 0, k: 0, s: 24, bag_kg: 50 },
  { name: 'DAP', n: 18, p: 46, k: 0, s: 0, bag_kg: 50 },
  { name: 'MOP', n: 0, p: 0, k: 60, s: 0, bag_kg: 50 },
  { name: 'SSP', n: 0, p: 16, k: 0, s: 0, bag_kg: 50 },
  { name: 'TSP', n: 0, p: 46, k: 0, s: 0, bag_kg: 50 },
  { name: '10:26:26', n: 10, p: 26, k: 26, s: 0, bag_kg: 50 },
  { name: '12:32:16', n: 12, p: 32, k: 16, s: 0, bag_kg: 50 },
  { name: '14:35:14', n: 14, p: 35, k: 14, s: 0, bag_kg: 50 },
  { name: '15:15:15', n: 15, p: 15, k: 15, s: 0, bag_kg: 50 },
  { name: '16:16:16', n: 16, p: 16, k: 16, s: 0, bag_kg: 50 },
  { name: '16:20:0:13', n: 16, p: 20, k: 0, s: 13, bag_kg: 50 },
  { name: '17:17:17', n: 17, p: 17, k: 17, s: 0, bag_kg: 50 },
  { name: '19:19:19', n: 19, p: 19, k: 19, s: 0, bag_kg: 50 },
  { name: '20:20:0:13', n: 20, p: 20, k: 0, s: 13, bag_kg: 50 },
  { name: '20:20:0', n: 20, p: 20, k: 0, s: 0, bag_kg: 50 },
  { name: '24:24:0', n: 24, p: 24, k: 0, s: 0, bag_kg: 50 },
  { name: '28:28:0', n: 28, p: 28, k: 0, s: 0, bag_kg: 50 },
];

const COTTON_SPLIT: SplitDose[] = [
  { stage: 'Basal', nPct: 0, pPct: 100, kPct: 0 },
  { stage: '20 DAS', nPct: 25, pPct: 0, kPct: 25 },
  { stage: '40 DAS', nPct: 25, pPct: 0, kPct: 25 },
  { stage: '60 DAS', nPct: 25, pPct: 0, kPct: 25 },
  { stage: '80 DAS', nPct: 25, pPct: 0, kPct: 25 },
];

const PADDY_SPLIT: SplitDose[] = [
  { stage: 'Before transplanting / final puddling', nPct: 34, pPct: 100, kPct: 100 },
  { stage: 'Active tillering stage', nPct: 33, pPct: 0, kPct: 0 },
  { stage: 'Panicle initiation stage', nPct: 33, pPct: 0, kPct: 0 },
];

const PADDY_LONG_DURATION_SPLIT: SplitDose[] = [
  { stage: 'Before transplanting / final puddling', nPct: 25, pPct: 100, kPct: 100 },
  { stage: '15-20 days after first split', nPct: 25, pPct: 0, kPct: 0 },
  { stage: '15-20 days after second split', nPct: 25, pPct: 0, kPct: 0 },
  { stage: 'Panicle initiation stage', nPct: 25, pPct: 0, kPct: 0 },
];

const MAIZE_SPLIT: SplitDose[] = [
  { stage: 'Basal at sowing', nPct: 34, pPct: 100, kPct: 50 },
  { stage: 'Knee-high stage', nPct: 33, pPct: 0, kPct: 0 },
  { stage: 'Flowering / tasseling stage', nPct: 33, pPct: 0, kPct: 50 },
];

const BASAL_SPLIT: SplitDose[] = [
  { stage: 'Basal before sowing', nPct: 100, pPct: 100, kPct: 100 },
];

const DEFAULT_RECOMMENDATIONS: CropRecommendation[] = [
  { crop_name: 'Cotton - Normal', crop: 'Cotton', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 36, p: 18, k: 18, area_unit: 'acre', split_plan: COTTON_SPLIT },
  { crop_name: 'Cotton - Hybrid', crop: 'Cotton', zone: 'All Zones', season: 'Vanakalam', variety: 'Hybrid', n: 48, p: 24, k: 24, area_unit: 'acre', split_plan: COTTON_SPLIT },
  { crop_name: 'Paddy Vanakalam - Northern Telangana', crop: 'Paddy', zone: 'Northern Telangana', season: 'Vanakalam', variety: 'Normal', n: 48, p: 20, k: 16, area_unit: 'acre', split_plan: PADDY_SPLIT },
  { crop_name: 'Paddy Vanakalam - Central Telangana', crop: 'Paddy', zone: 'Central Telangana', season: 'Vanakalam', variety: 'Normal', n: 48, p: 20, k: 16, area_unit: 'acre', split_plan: PADDY_SPLIT },
  { crop_name: 'Paddy Vanakalam - Southern Telangana', crop: 'Paddy', zone: 'Southern Telangana', season: 'Vanakalam', variety: 'Normal', n: 48, p: 24, k: 16, area_unit: 'acre', split_plan: PADDY_SPLIT },
  { crop_name: 'Paddy Yasangi - All Zones', crop: 'Paddy', zone: 'All Zones', season: 'Yasangi', variety: 'Normal', n: 60, p: 24, k: 16, area_unit: 'acre', split_plan: PADDY_SPLIT },
  { crop_name: 'Paddy Long Duration - All Zones', crop: 'Paddy', zone: 'All Zones', season: 'All Seasons', variety: 'Long Duration', n: 60, p: 24, k: 16, area_unit: 'acre', split_plan: PADDY_LONG_DURATION_SPLIT },
  { crop_name: 'Maize Kharif - Normal', crop: 'Maize', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 80, p: 24, k: 20, area_unit: 'acre', split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Kharif - Sweet Corn', crop: 'Maize', zone: 'All Zones', season: 'Vanakalam', variety: 'Sweet Corn', n: 72, p: 24, k: 20, area_unit: 'acre', split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Kharif - Pop Corn', crop: 'Maize', zone: 'All Zones', season: 'Vanakalam', variety: 'Pop Corn', n: 32, p: 24, k: 20, area_unit: 'acre', split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Kharif - Baby Corn', crop: 'Maize', zone: 'All Zones', season: 'Vanakalam', variety: 'Baby Corn', n: 48, p: 20, k: 16, area_unit: 'acre', split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Yasangi - Normal', crop: 'Maize', zone: 'All Zones', season: 'Yasangi', variety: 'Normal', n: 90, p: 32, k: 32, area_unit: 'acre', split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Yasangi - Sweet Corn', crop: 'Maize', zone: 'All Zones', season: 'Yasangi', variety: 'Sweet Corn', n: 80, p: 24, k: 20, area_unit: 'acre', split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Yasangi - Pop Corn', crop: 'Maize', zone: 'All Zones', season: 'Yasangi', variety: 'Pop Corn', n: 40, p: 24, k: 20, area_unit: 'acre', split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Yasangi - Baby Corn', crop: 'Maize', zone: 'All Zones', season: 'Yasangi', variety: 'Baby Corn', n: 70, p: 24, k: 20, area_unit: 'acre', split_plan: MAIZE_SPLIT },
  { crop_name: 'Redgram', crop: 'Redgram', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 8, p: 20, k: 0, area_unit: 'acre', split_plan: BASAL_SPLIT },
  { crop_name: 'Greengram', crop: 'Greengram', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 8, p: 20, k: 0, area_unit: 'acre', split_plan: BASAL_SPLIT },
  { crop_name: 'Sesamum', crop: 'Sesamum', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 16, p: 8, k: 8, area_unit: 'acre', split_plan: BASAL_SPLIT },
];

const PRESETS = [
  { label: '48:24:24', n: 48, p: 24, k: 24 },
  { label: '36:18:18', n: 36, p: 18, k: 18 },
  { label: '60:24:24', n: 60, p: 24, k: 24 },
  { label: '80:32:32', n: 80, p: 32, k: 32 },
  { label: '16:8:8', n: 16, p: 8, k: 8 },
  { label: '8:20:0', n: 8, p: 20, k: 0 },
];

const numberValue = (value: string | number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

const emptyNutrients = (): Nutrients => ({ n: 0, p: 0, k: 0 });

function gradeKey(grade: FertilizerGrade) {
  return grade.id || grade.name;
}

function getGradeLabel(grade: FertilizerGrade) {
  return grade.s > 0 ? `${grade.name} (${grade.n}:${grade.p}:${grade.k}:${grade.s})` : `${grade.name} (${grade.n}:${grade.p}:${grade.k})`;
}

function calculateFertilizers(required: Nutrients, selected: FertilizerGrade[]) {
  const quantities = new Map<string, number>();
  const remaining = { ...required };
  const pickBest = (nutrient: keyof Nutrients) => {
    return [...selected]
      .filter((grade) => grade[nutrient] > 0)
      .sort((a, b) => b[nutrient] - a[nutrient])[0];
  };
  const addQuantity = (grade: FertilizerGrade, kg: number) => {
    if (kg <= 0) return;
    const key = gradeKey(grade);
    quantities.set(key, (quantities.get(key) || 0) + kg);
    remaining.n -= kg * (grade.n / 100);
    remaining.p -= kg * (grade.p / 100);
    remaining.k -= kg * (grade.k / 100);
  };

  if (selected.length === 1) {
    const grade = selected[0];
    const kg = Math.max(
      grade.n > 0 ? required.n / (grade.n / 100) : 0,
      grade.p > 0 ? required.p / (grade.p / 100) : 0,
      grade.k > 0 ? required.k / (grade.k / 100) : 0
    );
    addQuantity(grade, kg);
  } else {
    const phosphorusGrade = pickBest('p');
    if (phosphorusGrade && remaining.p > 0) addQuantity(phosphorusGrade, remaining.p / (phosphorusGrade.p / 100));
    const potashGrade = pickBest('k');
    if (potashGrade && remaining.k > 0) addQuantity(potashGrade, remaining.k / (potashGrade.k / 100));
    const nitrogenGrade = pickBest('n');
    if (nitrogenGrade && remaining.n > 0) addQuantity(nitrogenGrade, remaining.n / (nitrogenGrade.n / 100));
  }

  const results = selected.map((grade) => {
    const kg = quantities.get(gradeKey(grade)) || 0;
    return {
      grade,
      kg,
      bags: grade.bag_kg > 0 ? kg / grade.bag_kg : 0,
      supplied: {
        n: kg * (grade.n / 100),
        p: kg * (grade.p / 100),
        k: kg * (grade.k / 100),
      },
    };
  });
  const supplied = results.reduce(
    (total, row) => ({
      n: total.n + row.supplied.n,
      p: total.p + row.supplied.p,
      k: total.k + row.supplied.k,
    }),
    emptyNutrients()
  );

  return {
    results,
    supplied,
    balance: {
      n: Math.max(0, required.n - supplied.n),
      p: Math.max(0, required.p - supplied.p),
      k: Math.max(0, required.k - supplied.k),
    },
    excess: {
      n: Math.max(0, supplied.n - required.n),
      p: Math.max(0, supplied.p - required.p),
      k: Math.max(0, supplied.k - required.k),
    },
  };
}

function getAcres(areaValue: number, unit: string) {
  if (unit === 'hectares') return areaValue * 2.47105;
  if (unit === 'guntas') return areaValue / 40;
  return areaValue;
}

function formatNutrients(nutrients: Nutrients) {
  return `N ${round(nutrients.n)} kg, P2O5 ${round(nutrients.p)} kg, K2O ${round(nutrients.k)} kg`;
}

function formatNutrientsTe(nutrients: Nutrients) {
  return `నత్రజని ${round(nutrients.n)} కిలోలు, భాస్వరం ${round(nutrients.p)} కిలోలు, పొటాష్ ${round(nutrients.k)} కిలోలు`;
}

function fertilizerNameTe(name: string) {
  const names: Record<string, string> = {
    Urea: 'యూరియా',
    'Ammonium Sulphate': 'అమ్మోనియం సల్ఫేట్',
    DAP: 'డీఏపీ',
    MOP: 'ఎంఓపీ',
    SSP: 'ఎస్ఎస్పీ',
    TSP: 'టీఎస్పీ',
  };
  return names[name] || name;
}

function stageNameTe(stage: string) {
  const stages: Record<string, string> = {
    Basal: 'బేసల్ దశ',
    'Basal before sowing': 'విత్తే ముందు బేసల్ దశ',
    'Basal at sowing': 'విత్తే సమయంలో బేసల్ దశ',
    'Before transplanting / final puddling': 'నాటే ముందు / చివరి దమ్ము దశ',
    'Active tillering stage': 'సక్రియ పిలకల దశ',
    'Panicle initiation stage': 'గొలుసు ప్రారంభ దశ',
    'Knee-high stage': 'మోకాలి ఎత్తు దశ',
    'Flowering / tasseling stage': 'పూత / టాసెలింగ్ దశ',
    '15-20 days after first split': 'మొదటి విడత తర్వాత 15-20 రోజులు',
    '15-20 days after second split': 'రెండవ విడత తర్వాత 15-20 రోజులు',
  };
  return stages[stage] || stage;
}

function formatFertilizerRows(results: FertilizerResult[], language: 'en' | 'te') {
  return results
    .filter((row) => row.kg > 0.01)
    .map((row) => {
      const name = language === 'te' ? fertilizerNameTe(row.grade.name) : row.grade.name;
      const kgLabel = language === 'te' ? 'కిలోలు' : 'kg';
      const bagLabel = language === 'te' ? 'బస్తాలు' : 'bags';
      return `${name}: ${round(row.kg)} ${kgLabel} (${round(row.bags)} ${bagLabel})`;
    });
}

function buildReportText(required: Nutrients, results: FertilizerResult[], supplied: Nutrients, balance: Nutrients, excess: Nutrients) {
  const lines = [
    'Smart Fertilizer Calculator - Tiryani Agriculture Portal',
    `Required: ${formatNutrients(required)}`,
    `Supplied: ${formatNutrients(supplied)}`,
    `Balance: ${formatNutrients(balance)}`,
    `Excess: ${formatNutrients(excess)}`,
    '',
    'Fertilizer quantity:',
    ...results.map((row) => `${row.grade.name}: ${round(row.kg)} kg (${round(row.bags)} bags)`),
    '',
    'Important Agronomic Note:',
    ...AGRONOMIC_NOTES_EN,
    '',
    'Generated by K. Vinay Reddy, MAO, Tiryani',
  ];
  return lines.join('\n');
}

function buildWhatsAppText({
  language,
  mode,
  required,
  results,
  supplied,
  balance,
  excess,
  selectedRecommendation,
  recommendationNutrients,
  splitPlan,
}: {
  language: 'en' | 'te';
  mode: 'simple' | 'crop';
  required: Nutrients;
  results: FertilizerResult[];
  supplied: Nutrients;
  balance: Nutrients;
  excess: Nutrients;
  selectedRecommendation: CropRecommendation;
  recommendationNutrients: Nutrients;
  splitPlan: SplitFertilizerPlanRow[];
}) {
  const fertilizerRows = formatFertilizerRows(results, language);

  if (language === 'te') {
    const lines = [
      'స్మార్ట్ ఎరువుల కాలిక్యులేటర్ - తిర్యాణి వ్యవసాయ పోర్టల్',
      mode === 'crop'
        ? `వ్యవసాయ విశ్వవిద్యాలయ సిఫారసు: ${recommendationLabel(selectedRecommendation)} - ${recommendationNpkLabel(selectedRecommendation)} ఎకరానికి`
        : 'ఎంచుకున్న పోషక అవసరం',
      `అవసరం: ${formatNutrientsTe(mode === 'crop' ? recommendationNutrients : required)}`,
      `సరఫరా: ${formatNutrientsTe(supplied)}`,
      `లోటు: ${formatNutrientsTe(balance)}`,
      `అధికం: ${formatNutrientsTe(excess)}`,
      '',
      'ఎరువుల పరిమాణం:',
      ...(fertilizerRows.length ? fertilizerRows : ['ఎరువు అవసరం లేదు.']),
    ];

    if (mode === 'crop') {
      lines.push('', 'స్మార్ట్ విడతల వారీ ఎరువు మోతాదు:');
      splitPlan.forEach(({ dose, nutrients, calculation }) => {
        const rows = formatFertilizerRows(calculation.results, language);
        lines.push(`${stageNameTe(dose.stage)} - లక్ష్యం: ${formatNutrientsTe(nutrients)}`);
        lines.push(...(rows.length ? rows.map((row) => `  ${row}`) : ['  ఈ విడతలో ఎరువు అవసరం లేదు.']));
      });
    }

    lines.push('', 'ముఖ్యమైన వ్యవసాయ సూచనలు:', ...AGRONOMIC_NOTES_TE);
    lines.push('', 'తయారు చేసినది: కె. వినయ్ రెడ్డి, MAO, తిర్యాణి');
    return lines.join('\n');
  }

  const lines = [
    'Smart Fertilizer Calculator - Tiryani Agriculture Portal',
    mode === 'crop'
      ? `Agriculture University recommendation: ${recommendationLabel(selectedRecommendation)} - ${recommendationNpkLabel(selectedRecommendation)} per acre`
      : 'Selected nutrient requirement',
    `Required: ${formatNutrients(mode === 'crop' ? recommendationNutrients : required)}`,
    `Supplied: ${formatNutrients(supplied)}`,
    `Balance: ${formatNutrients(balance)}`,
    `Excess: ${formatNutrients(excess)}`,
    '',
    'Fertilizer quantity:',
    ...(fertilizerRows.length ? fertilizerRows : ['No fertilizer required.']),
  ];

  if (mode === 'crop') {
    lines.push('', 'Smart split dose plan:');
    splitPlan.forEach(({ dose, nutrients, calculation }) => {
      const rows = formatFertilizerRows(calculation.results, language);
      lines.push(`${dose.stage} - Target: ${formatNutrients(nutrients)}`);
      lines.push(...(rows.length ? rows.map((row) => `  ${row}`) : ['  No fertilizer required in this split.']));
    });
  }

  lines.push('', 'Important Agronomic Note:', ...AGRONOMIC_NOTES_EN);
  lines.push('', 'Generated by K. Vinay Reddy, MAO, Tiryani');
  return lines.join('\n');
}

function getInitialSelected(grades: FertilizerGrade[]) {
  const defaultNames = new Set(['DAP', 'Urea', 'MOP']);
  return grades.filter((grade) => defaultNames.has(grade.name)).map(gradeKey);
}

function uniqueValues(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function recommendationCrop(recommendation: CropRecommendation) {
  return recommendation.crop || recommendation.crop_name.split(' - ')[0];
}

function recommendationLabel(recommendation: CropRecommendation) {
  return [
    recommendation.crop || recommendation.crop_name,
    recommendation.season,
    recommendation.zone,
    recommendation.variety,
  ].filter(Boolean).join(' | ');
}

function recommendationValue(value: number) {
  return Number.isInteger(value) ? String(value) : String(round(value));
}

function recommendationNpkLabel(recommendation: CropRecommendation) {
  const crop = recommendationCrop(recommendation);
  const season = recommendation.season || '';
  const variety = recommendation.variety || '';

  if (crop === 'Paddy' && season === 'Vanakalam') {
    return recommendation.zone === 'Southern Telangana' ? '40-48:24:16' : '40-48:20:16';
  }
  if (crop === 'Paddy' && season === 'Yasangi') return '48-60:24:16';
  if (crop === 'Maize' && season === 'Vanakalam' && variety === 'Normal') return '72-80:24:20';
  if (crop === 'Maize' && season === 'Vanakalam' && variety === 'Sweet Corn') return '60-72:24:20';
  if (crop === 'Maize' && season === 'Yasangi' && variety === 'Normal') return '80-90:32:32';
  if (crop === 'Maize' && season === 'Yasangi' && variety === 'Sweet Corn') return '72-80:24:20';
  if (crop === 'Maize' && season === 'Yasangi' && variety === 'Baby Corn') return '60-70:24:20';

  return `${recommendationValue(recommendation.n)}:${recommendationValue(recommendation.p)}:${recommendationValue(recommendation.k)}`;
}

export function FertilizerCalculator() {
  const { isAdminUser } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [mode, setMode] = useState<'simple' | 'crop'>('simple');
  const [simpleTab, setSimpleTab] = useState<'forward' | 'reverse'>('forward');
  const [grades, setGrades] = useState<FertilizerGrade[]>(DEFAULT_GRADES);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>(DEFAULT_RECOMMENDATIONS);
  const [loadingData, setLoadingData] = useState(false);
  const [required, setRequired] = useState<Nutrients>({ n: 48, p: 24, k: 24 });
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => getInitialSelected(DEFAULT_GRADES));
  const [reverseBags, setReverseBags] = useState<Record<string, number>>({});
  const [selectedCrop, setSelectedCrop] = useState('Cotton');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [selectedSeason, setSelectedSeason] = useState('Vanakalam');
  const [selectedVariety, setSelectedVariety] = useState('Hybrid');
  const [area, setArea] = useState({ value: 1, unit: 'acres' });
  const [gradeDraft, setGradeDraft] = useState<FertilizerGrade>({ name: '', n: 0, p: 0, k: 0, s: 0, bag_kg: 50 });
  const [cropDraft, setCropDraft] = useState<CropRecommendation>({ crop_name: '', n: 0, p: 0, k: 0, area_unit: 'acre', split_plan: DEFAULT_SPLIT });

  useEffect(() => {
    const loadCalculatorData = async () => {
      setLoadingData(true);
      const [gradeResponse, cropResponse] = await Promise.all([
        supabase.from('fertilizer_grades').select('id, name, n, p, k, s, bag_kg, is_active').eq('is_active', true).order('name'),
        supabase.from('crop_fertilizer_recommendations').select('id, crop_name, crop, zone, season, variety, n, p, k, area_unit, split_plan, is_active').eq('is_active', true).order('crop_name'),
      ]);

      if (!gradeResponse.error && gradeResponse.data?.length) {
        const loadedGrades = gradeResponse.data.map((row) => ({
          id: row.id,
          name: row.name,
          n: numberValue(row.n),
          p: numberValue(row.p),
          k: numberValue(row.k),
          s: numberValue(row.s),
          bag_kg: numberValue(row.bag_kg) || 50,
          is_active: row.is_active,
        }));
        setGrades(loadedGrades);
        setSelectedKeys((current) => current.filter((key) => loadedGrades.some((grade) => gradeKey(grade) === key)));
      }

      if (!cropResponse.error && cropResponse.data?.length) {
        setRecommendations(
          cropResponse.data.map((row) => ({
          id: row.id,
          crop_name: row.crop_name,
          crop: row.crop || row.crop_name,
          zone: row.zone || 'All Zones',
          season: row.season || 'Vanakalam',
          variety: row.variety || 'Normal',
          n: numberValue(row.n),
            p: numberValue(row.p),
            k: numberValue(row.k),
            area_unit: row.area_unit || 'acre',
            split_plan: Array.isArray(row.split_plan) ? row.split_plan as SplitDose[] : DEFAULT_SPLIT,
            is_active: row.is_active,
          }))
        );
      }
      setLoadingData(false);
    };

    void loadCalculatorData();
  }, []);

  const selectedGrades = useMemo(
    () => grades.filter((grade) => selectedKeys.includes(gradeKey(grade))),
    [grades, selectedKeys]
  );
  const calculation = useMemo(() => calculateFertilizers(required, selectedGrades), [required, selectedGrades]);
  const cropOptions = useMemo(() => uniqueValues(recommendations.map(recommendationCrop)), [recommendations]);
  const recommendationsForCrop = useMemo(
    () => recommendations.filter((recommendation) => recommendationCrop(recommendation) === selectedCrop),
    [recommendations, selectedCrop]
  );
  const zoneOptions = useMemo(() => uniqueValues(recommendationsForCrop.map((recommendation) => recommendation.zone)), [recommendationsForCrop]);
  const seasonOptions = useMemo(() => uniqueValues(recommendationsForCrop.map((recommendation) => recommendation.season)), [recommendationsForCrop]);
  const varietyOptions = useMemo(
    () => uniqueValues(
      recommendationsForCrop
        .filter((recommendation) => !selectedSeason || recommendation.season === selectedSeason)
        .map((recommendation) => recommendation.variety)
    ),
    [recommendationsForCrop, selectedSeason]
  );
  const selectedRecommendation = useMemo(
    () =>
      recommendationsForCrop.find((recommendation) =>
        (recommendation.zone === selectedZone || recommendation.zone === 'All Zones' || selectedZone === 'All Zones') &&
        recommendation.season === selectedSeason &&
        recommendation.variety === selectedVariety
      ) ||
      recommendationsForCrop.find((recommendation) => recommendation.season === selectedSeason) ||
      recommendationsForCrop[0] ||
      recommendations[0],
    [recommendations, recommendationsForCrop, selectedSeason, selectedVariety, selectedZone]
  );
  const recommendationNutrients = useMemo(() => {
    const acres = Math.max(0, getAcres(area.value, area.unit));
    return {
      n: selectedRecommendation.n * acres,
      p: selectedRecommendation.p * acres,
      k: selectedRecommendation.k * acres,
    };
  }, [area, selectedRecommendation]);
  const recommendationCalculation = useMemo(
    () => calculateFertilizers(recommendationNutrients, selectedGrades),
    [recommendationNutrients, selectedGrades]
  );
  const splitFertilizerPlan = useMemo(
    () => (selectedRecommendation.split_plan || DEFAULT_SPLIT).map((dose) => {
      const doseNutrients = {
        n: recommendationNutrients.n * dose.nPct / 100,
        p: recommendationNutrients.p * dose.pPct / 100,
        k: recommendationNutrients.k * dose.kPct / 100,
      };
      return {
        dose,
        nutrients: doseNutrients,
        calculation: calculateFertilizers(doseNutrients, selectedGrades),
      };
    }),
    [recommendationNutrients, selectedGrades, selectedRecommendation.split_plan]
  );

  useEffect(() => {
    if (zoneOptions.length > 0 && !zoneOptions.includes(selectedZone)) {
      setSelectedZone(zoneOptions[0]);
    }
  }, [selectedZone, zoneOptions]);

  useEffect(() => {
    if (seasonOptions.length > 0 && !seasonOptions.includes(selectedSeason)) {
      setSelectedSeason(seasonOptions[0]);
    }
  }, [seasonOptions, selectedSeason]);

  useEffect(() => {
    if (varietyOptions.length > 0 && !varietyOptions.includes(selectedVariety)) {
      setSelectedVariety(varietyOptions[0]);
    }
  }, [selectedVariety, varietyOptions]);
  const reverseTotals = useMemo(
    () => grades.reduce((total, grade) => {
      const bags = reverseBags[gradeKey(grade)] || 0;
      const kg = bags * grade.bag_kg;
      return {
        n: total.n + kg * (grade.n / 100),
        p: total.p + kg * (grade.p / 100),
        k: total.k + kg * (grade.k / 100),
      };
    }, emptyNutrients()),
    [grades, reverseBags]
  );
  const activeRequired = mode === 'crop' ? recommendationNutrients : required;
  const activeCalculation = mode === 'crop' ? recommendationCalculation : calculation;

  const toggleGrade = (key: string) => {
    setSelectedKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const applyPreset = (preset: Nutrients) => {
    setRequired(preset);
    setMode('simple');
    setSimpleTab('forward');
  };

  const resetCalculator = () => {
    setMode('simple');
    setSimpleTab('forward');
    setRequired({ n: 48, p: 24, k: 24 });
    setSelectedKeys(getInitialSelected(grades));
    setReverseBags({});
    setSelectedCrop('Cotton');
    setSelectedZone('All Zones');
    setSelectedSeason('Vanakalam');
    setSelectedVariety('Hybrid');
    setArea({ value: 1, unit: 'acres' });
  };

  const saveGrade = async (grade: FertilizerGrade) => {
    const payload = {
      name: grade.name.trim(),
      n: numberValue(grade.n),
      p: numberValue(grade.p),
      k: numberValue(grade.k),
      s: numberValue(grade.s),
      bag_kg: numberValue(grade.bag_kg) || 50,
      is_active: true,
    };
    if (!payload.name) return;
    const query = grade.id
      ? supabase.from('fertilizer_grades').update(payload).eq('id', grade.id)
      : supabase.from('fertilizer_grades').insert(payload).select().single();
    const { error } = await query;
    if (error) {
      alert('Could not save fertilizer grade. Please apply the Supabase migration first.');
      return;
    }
    setGrades((current) => {
      if (grade.id) {
        return current.map((item) => item.id === grade.id ? { ...item, ...payload } : item);
      }
      return [...current, { ...payload, id: `local-${payload.name}` }];
    });
    setGradeDraft({ name: '', n: 0, p: 0, k: 0, s: 0, bag_kg: 50 });
  };

  const saveCrop = async (crop: CropRecommendation) => {
    const payload = {
      crop_name: crop.crop_name.trim(),
      crop: crop.crop || crop.crop_name.trim(),
      zone: crop.zone || 'All Zones',
      season: crop.season || 'Vanakalam',
      variety: crop.variety || 'Normal',
      n: numberValue(crop.n),
      p: numberValue(crop.p),
      k: numberValue(crop.k),
      area_unit: 'acre',
      split_plan: crop.split_plan || DEFAULT_SPLIT,
      is_active: true,
    };
    if (!payload.crop_name) return;
    const query = crop.id
      ? supabase.from('crop_fertilizer_recommendations').update(payload).eq('id', crop.id)
      : supabase.from('crop_fertilizer_recommendations').insert(payload).select().single();
    const { error } = await query;
    if (error) {
      alert('Could not save crop recommendation. Please apply the Supabase migration first.');
      return;
    }
    setRecommendations((current) => {
      if (crop.id) {
        return current.map((item) => item.id === crop.id ? { ...item, ...payload } : item);
      }
      return [...current, { ...payload, id: `local-${payload.crop_name}` }];
    });
    setCropDraft({ crop_name: '', crop: '', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 0, p: 0, k: 0, area_unit: 'acre', split_plan: DEFAULT_SPLIT });
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const summary = [
      ['Smart Fertilizer Calculator'],
      ['Generated By', 'K. Vinay Reddy, MAO, Tiryani'],
      ['Generated Date', new Date().toLocaleString()],
      [],
      ['Required N', round(activeRequired.n), 'Required P2O5', round(activeRequired.p), 'Required K2O', round(activeRequired.k)],
      ['Supplied N', round(activeCalculation.supplied.n), 'Supplied P2O5', round(activeCalculation.supplied.p), 'Supplied K2O', round(activeCalculation.supplied.k)],
      ['Balance N', round(activeCalculation.balance.n), 'Balance P2O5', round(activeCalculation.balance.p), 'Balance K2O', round(activeCalculation.balance.k)],
      ['Excess N', round(activeCalculation.excess.n), 'Excess P2O5', round(activeCalculation.excess.p), 'Excess K2O', round(activeCalculation.excess.k)],
    ];
    const rows = activeCalculation.results.map((row) => ({
      Fertilizer: row.grade.name,
      Grade: row.grade.s > 0 ? `${row.grade.n}:${row.grade.p}:${row.grade.k}:${row.grade.s}` : `${row.grade.n}:${row.grade.p}:${row.grade.k}`,
      'Bag Kg': row.grade.bag_kg,
      'Required Kg': round(row.kg),
      Bags: round(row.bags),
      'N Supplied': round(row.supplied.n),
      'P Supplied': round(row.supplied.p),
      'K Supplied': round(row.supplied.k),
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), 'Summary');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Calculation');
    XLSX.writeFile(workbook, `fertilizer-calculator-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const text = buildReportText(activeRequired, activeCalculation.results, activeCalculation.supplied, activeCalculation.balance, activeCalculation.excess);
    doc.setFontSize(13);
    doc.text(doc.splitTextToSize(text, 180), 14, 18);
    doc.save(`fertilizer-calculator-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const shareWhatsApp = () => {
    const text = buildWhatsAppText({
      language,
      mode,
      required: activeRequired,
      results: activeCalculation.results,
      supplied: activeCalculation.supplied,
      balance: activeCalculation.balance,
      excess: activeCalculation.excess,
      selectedRecommendation,
      recommendationNutrients,
      splitPlan: splitFertilizerPlan,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-2 text-slate-950 sm:space-y-3">
      <section className="rounded-xl border border-emerald-100 bg-white p-2 shadow-sm sm:p-3">
        <div className="flex justify-end">
          <button type="button" onClick={toggleLanguage} className="inline-flex min-h-8 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-800">
              {language === 'te' ? 'English' : 'తెలుగు'}
            </button>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            <button type="button" onClick={exportPdf} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-red-600 px-2 py-1.5 text-white sm:px-3" aria-label="Export PDF" title="PDF">
              <FileText className="h-4 w-4" />
            </button>
            <button type="button" onClick={exportExcel} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-700 px-2 py-1.5 text-white sm:px-3" aria-label="Export Excel" title="Excel">
              <FileSpreadsheet className="h-4 w-4" />
            </button>
            <button type="button" onClick={shareWhatsApp} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-green-600 px-2 py-1.5 text-white sm:px-3" aria-label="Share on WhatsApp" title="WhatsApp">
              <WhatsAppIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={resetCalculator} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-700 sm:px-3 sm:text-sm">
              <RefreshCw className="h-4 w-4" /> Reset
            </button>
        </div>
      </section>

      <section className="grid gap-2 sm:gap-3 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-xl border border-emerald-100 bg-white p-2 shadow-sm sm:p-4">
          <div className="mb-2 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-black sm:mb-3 sm:text-sm">
            <button type="button" onClick={() => setMode('simple')} className={`rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 ${mode === 'simple' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}>
              Mode 1: Simple
            </button>
            <button type="button" onClick={() => setMode('crop')} className={`rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 ${mode === 'crop' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}>
              Mode 2: Crop
            </button>
          </div>

          {mode === 'simple' ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="grid grid-cols-2 rounded-xl bg-emerald-50 p-1 text-xs font-black sm:text-sm">
                <button type="button" onClick={() => setSimpleTab('forward')} className={`rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 ${simpleTab === 'forward' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-700'}`}>
                  Required to Fertilizer
                </button>
                <button type="button" onClick={() => setSimpleTab('reverse')} className={`rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 ${simpleTab === 'reverse' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-700'}`}>
                  Bags to Nutrients
                </button>
              </div>

              {simpleTab === 'forward' ? (
                <>
                  <div className="grid gap-1.5 sm:grid-cols-3 sm:gap-2">
                    {(['n', 'p', 'k'] as const).map((key) => (
                      <label key={key} className="block rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
                        <span className="text-xs font-black uppercase text-slate-600">{key === 'n' ? 'Nitrogen (N)' : key === 'p' ? 'Phosphorus (P2O5)' : 'Potash (K2O)'}</span>
                        <input
                          type="number"
                          value={required[key]}
                          onChange={(event) => setRequired((current) => ({ ...current, [key]: numberValue(event.target.value) }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-base font-black outline-none focus:border-emerald-500 sm:px-3 sm:py-2 sm:text-lg"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => applyPreset(preset)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {grades.map((grade) => (
                    <label key={gradeKey(grade)} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-black">{grade.name}</span>
                        <span className="text-xs font-bold text-slate-500">{grade.bag_kg} kg bag</span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={reverseBags[gradeKey(grade)] || ''}
                        onChange={(event) => setReverseBags((current) => ({ ...current, [gradeKey(grade)]: numberValue(event.target.value) }))}
                        placeholder="Bags"
                        className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right font-black outline-none focus:border-emerald-500"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-5">
                <label className="block rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
                  <span className="text-xs font-black uppercase text-slate-600">Crop</span>
                  <select
                    value={selectedCrop}
                    onChange={(event) => setSelectedCrop(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-black outline-none focus:border-emerald-500"
                  >
                    {cropOptions.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
                  </select>
                </label>
                <label className="block rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
                  <span className="text-xs font-black uppercase text-slate-600">Zone</span>
                  <select value={selectedZone} onChange={(event) => setSelectedZone(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-black outline-none focus:border-emerald-500">
                    {zoneOptions.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                  </select>
                </label>
                <label className="block rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
                  <span className="text-xs font-black uppercase text-slate-600">Season</span>
                  <select value={selectedSeason} onChange={(event) => setSelectedSeason(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-black outline-none focus:border-emerald-500">
                    {seasonOptions.map((season) => <option key={season} value={season}>{season}</option>)}
                  </select>
                </label>
                <label className="block rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
                  <span className="text-xs font-black uppercase text-slate-600">Variety</span>
                  <select value={selectedVariety} onChange={(event) => setSelectedVariety(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-black outline-none focus:border-emerald-500">
                    {varietyOptions.map((variety) => <option key={variety} value={variety}>{variety}</option>)}
                  </select>
                </label>
                <label className="block rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
                  <span className="text-xs font-black uppercase text-slate-600">Area</span>
                  <input type="number" value={area.value} onChange={(event) => setArea((current) => ({ ...current, value: numberValue(event.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-black outline-none focus:border-emerald-500" />
                </label>
                <label className="block rounded-lg border border-slate-200 bg-slate-50 p-2 sm:col-span-2 sm:p-3 lg:col-span-1">
                  <span className="text-xs font-black uppercase text-slate-600">Unit</span>
                  <select value={area.unit} onChange={(event) => setArea((current) => ({ ...current, unit: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-black outline-none focus:border-emerald-500">
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="guntas">Guntas</option>
                  </select>
                </label>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">
                Agriculture University recommendation for {recommendationLabel(selectedRecommendation)}: {recommendationNpkLabel(selectedRecommendation)} per acre. Current area requirement is calculated with the upper recommended dose: {formatNutrients(recommendationNutrients)}.
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white p-2 shadow-sm sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
            <h2 className="text-base font-black">Available Fertilizers</h2>
            <button type="button" onClick={() => setSelectedKeys(getInitialSelected(grades))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-black text-slate-600">
              <RefreshCw className="h-3.5 w-3.5" /> Default
            </button>
          </div>
          <div className="grid max-h-[18rem] gap-1.5 overflow-y-auto pr-1 sm:max-h-[23rem] sm:grid-cols-2 sm:gap-2">
            {grades.map((grade) => (
              <button
                key={gradeKey(grade)}
                type="button"
                onClick={() => toggleGrade(gradeKey(grade))}
                className={`rounded-lg border p-2.5 text-left transition ${selectedKeys.includes(gradeKey(grade)) ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
              >
                <span className="block text-sm font-black">{grade.name}</span>
                <span className="text-xs font-bold">{getGradeLabel(grade)} | {grade.bag_kg} kg bag</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-2 sm:gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-xl border border-emerald-100 bg-white p-2 shadow-sm sm:p-4">
          <h2 className="mb-2 text-sm font-black sm:mb-3 sm:text-base">{simpleTab === 'reverse' && mode === 'simple' ? 'Reverse Calculation' : 'Live Calculation'}</h2>
          {simpleTab === 'reverse' && mode === 'simple' ? (
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <NutrientGauge label="Nitrogen supplied" value={reverseTotals.n} max={Math.max(reverseTotals.n, 1)} color="emerald" />
              <NutrientGauge label="Phosphorus supplied" value={reverseTotals.p} max={Math.max(reverseTotals.p, 1)} color="sky" />
              <NutrientGauge label="Potash supplied" value={reverseTotals.k} max={Math.max(reverseTotals.k, 1)} color="amber" />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <NutrientGauge label="N supplied" value={activeCalculation.supplied.n} max={Math.max(activeRequired.n, activeCalculation.supplied.n, 1)} color="emerald" />
              <NutrientGauge label="P supplied" value={activeCalculation.supplied.p} max={Math.max(activeRequired.p, activeCalculation.supplied.p, 1)} color="sky" />
              <NutrientGauge label="K supplied" value={activeCalculation.supplied.k} max={Math.max(activeRequired.k, activeCalculation.supplied.k, 1)} color="amber" />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white p-2 shadow-sm sm:p-4">
          <h2 className="mb-2 text-sm font-black sm:mb-3 sm:text-base">Fertilizer Quantity and Breakdown</h2>
          <div className="table-scroll overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-900 text-xs font-black text-white">
                <tr>
                  <th className="px-3 py-2">Fertilizer</th>
                  <th className="px-3 py-2 text-right">Kg</th>
                  <th className="px-3 py-2 text-right">Bags</th>
                  <th className="px-3 py-2 text-right">N</th>
                  <th className="px-3 py-2 text-right">P</th>
                  <th className="px-3 py-2 text-right">K</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeCalculation.results.map((row) => (
                  <tr key={gradeKey(row.grade)} className="hover:bg-emerald-50/60">
                    <td className="px-3 py-2 font-black">{row.grade.name}</td>
                    <td className="px-3 py-2 text-right font-bold">{round(row.kg)}</td>
                    <td className="px-3 py-2 text-right font-bold">{round(row.bags)}</td>
                    <td className="px-3 py-2 text-right">{round(row.supplied.n)}</td>
                    <td className="px-3 py-2 text-right">{round(row.supplied.p)}</td>
                    <td className="px-3 py-2 text-right">{round(row.supplied.k)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 grid gap-1.5 sm:mt-3 sm:grid-cols-3 sm:gap-2">
            <SummaryTile title="Balance" values={activeCalculation.balance} tone="bg-red-50 text-red-900 border-red-100" />
            <SummaryTile title="Excess" values={activeCalculation.excess} tone="bg-amber-50 text-amber-900 border-amber-100" />
            <SummaryTile title="Supplied" values={activeCalculation.supplied} tone="bg-emerald-50 text-emerald-900 border-emerald-100" />
          </div>
        </div>
      </section>

      {mode === 'crop' && (
        <section className="rounded-xl border border-emerald-100 bg-white p-2 shadow-sm sm:p-4">
          <h2 className="mb-2 text-sm font-black sm:mb-3 sm:text-base">Smart Split Dose Planner - Fertilizer Quantities</h2>
          <div className="grid gap-1.5 sm:gap-2 md:grid-cols-2 xl:grid-cols-4">
            {splitFertilizerPlan.map(({ dose, nutrients, calculation: doseCalculation }) => (
              <div key={dose.stage} className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
                <p className="text-sm font-black text-slate-950">{dose.stage}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  Target: N {round(nutrients.n)} | P {round(nutrients.p)} | K {round(nutrients.k)}
                </p>
                <div className="mt-2 space-y-1.5">
                  {doseCalculation.results.filter((row) => row.kg > 0.01).length > 0 ? (
                    doseCalculation.results.filter((row) => row.kg > 0.01).map((row) => (
                      <div key={gradeKey(row.grade)} className="flex items-center justify-between gap-2 rounded-md bg-white px-2 py-1 text-xs font-black">
                        <span className="truncate">{row.grade.name}</span>
                        <span className="shrink-0 text-emerald-800">{round(row.kg)} kg / {round(row.bags)} bags</span>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-500">No fertilizer required in this split.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-950 shadow-sm sm:p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-black sm:text-base"><Leaf className="h-5 w-5" /> {language === 'te' ? 'ముఖ్యమైన వ్యవసాయ సూచనలు' : 'Important Agronomic Note'}</h2>
          <ul className="space-y-1 text-sm font-bold">
            {(language === 'te' ? AGRONOMIC_NOTES_TE : AGRONOMIC_NOTES_EN).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
      </section>

      {isAdminUser && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm sm:p-4">
          <h2 className="mb-3 text-base font-black text-emerald-950">Admin Panel</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            <AdminGradeEditor grades={grades} draft={gradeDraft} onDraftChange={setGradeDraft} onSave={saveGrade} loading={loadingData} />
            <AdminCropEditor crops={recommendations} draft={cropDraft} onDraftChange={setCropDraft} onSave={saveCrop} />
          </div>
        </section>
      )}
    </div>
  );
}

function NutrientGauge({ label, value, max, color }: { label: string; value: number; max: number; color: 'emerald' | 'sky' | 'amber' }) {
  const width = Math.min(100, Math.max(0, (value / max) * 100));
  const colorClass = color === 'emerald' ? 'bg-emerald-600 text-emerald-900' : color === 'sky' ? 'bg-sky-600 text-sky-900' : 'bg-amber-500 text-amber-900';
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase text-slate-600">{label}</span>
        <span className={`rounded-full bg-white px-2 py-0.5 text-xs font-black ${colorClass.split(' ')[1]}`}>{round(value)} kg</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${colorClass.split(' ')[0]}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SummaryTile({ title, values, tone }: { title: string; values: Nutrients; tone: string }) {
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <p className="text-xs font-black uppercase">{title}</p>
      <p className="mt-1 text-xs font-bold">N {round(values.n)} | P {round(values.p)} | K {round(values.k)}</p>
    </div>
  );
}

function AdminGradeEditor({
  grades,
  draft,
  onDraftChange,
  onSave,
  loading,
}: {
  grades: FertilizerGrade[];
  draft: FertilizerGrade;
  onDraftChange: (grade: FertilizerGrade) => void;
  onSave: (grade: FertilizerGrade) => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-white bg-white p-3">
      <h3 className="mb-2 text-sm font-black">Fertilizer Grades</h3>
      <div className="grid gap-2">
        <EditorInputs value={draft} onChange={onDraftChange} />
        <button type="button" onClick={() => onSave(draft)} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white disabled:opacity-50">
          <Plus className="h-4 w-4" /> Add Fertilizer
        </button>
      </div>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
        {grades.map((grade) => (
          <EditableGradeRow key={gradeKey(grade)} grade={grade} onSave={onSave} />
        ))}
      </div>
    </div>
  );
}

function EditableGradeRow({ grade, onSave }: { grade: FertilizerGrade; onSave: (grade: FertilizerGrade) => void }) {
  const [value, setValue] = useState(grade);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <EditorInputs value={value} onChange={setValue} />
      <button type="button" onClick={() => onSave(value)} className="mt-2 inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-black text-white">
        <Save className="h-3.5 w-3.5" /> Save
      </button>
    </div>
  );
}

function EditorInputs({ value, onChange }: { value: FertilizerGrade; onChange: (grade: FertilizerGrade) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      <input value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} placeholder="Name" className="col-span-2 rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      {(['n', 'p', 'k', 's'] as const).map((key) => (
        <input key={key} type="number" value={value[key]} onChange={(event) => onChange({ ...value, [key]: numberValue(event.target.value) })} placeholder={key.toUpperCase()} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      ))}
      <input type="number" value={value.bag_kg} onChange={(event) => onChange({ ...value, bag_kg: numberValue(event.target.value) })} placeholder="Bag" className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
    </div>
  );
}

function AdminCropEditor({
  crops,
  draft,
  onDraftChange,
  onSave,
}: {
  crops: CropRecommendation[];
  draft: CropRecommendation;
  onDraftChange: (crop: CropRecommendation) => void;
  onSave: (crop: CropRecommendation) => void;
}) {
  return (
    <div className="rounded-xl border border-white bg-white p-3">
      <h3 className="mb-2 text-sm font-black">Crop Recommendations</h3>
      <CropInputs value={draft} onChange={onDraftChange} />
      <button type="button" onClick={() => onSave(draft)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white">
        <Plus className="h-4 w-4" /> Add Crop
      </button>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
        {crops.map((crop) => (
          <EditableCropRow key={crop.id || crop.crop_name} crop={crop} onSave={onSave} />
        ))}
      </div>
    </div>
  );
}

function EditableCropRow({ crop, onSave }: { crop: CropRecommendation; onSave: (crop: CropRecommendation) => void }) {
  const [value, setValue] = useState(crop);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <CropInputs value={value} onChange={setValue} />
      <button type="button" onClick={() => onSave(value)} className="mt-2 inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-black text-white">
        <Save className="h-3.5 w-3.5" /> Save
      </button>
    </div>
  );
}

function CropInputs({ value, onChange }: { value: CropRecommendation; onChange: (crop: CropRecommendation) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      <input value={value.crop_name} onChange={(event) => onChange({ ...value, crop_name: event.target.value })} placeholder="Title" className="col-span-2 rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      <input value={value.crop || ''} onChange={(event) => onChange({ ...value, crop: event.target.value })} placeholder="Crop" className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      <input value={value.zone || ''} onChange={(event) => onChange({ ...value, zone: event.target.value })} placeholder="Zone" className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      <input value={value.season || ''} onChange={(event) => onChange({ ...value, season: event.target.value })} placeholder="Season" className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      <input value={value.variety || ''} onChange={(event) => onChange({ ...value, variety: event.target.value })} placeholder="Variety" className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      {(['n', 'p', 'k'] as const).map((key) => (
        <input key={key} type="number" value={value[key]} onChange={(event) => onChange({ ...value, [key]: numberValue(event.target.value) })} placeholder={key.toUpperCase()} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      ))}
    </div>
  );
}

export default FertilizerCalculator;
