import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Leaf,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  DEFAULT_GRADES,
  DEFAULT_RECOMMENDATIONS,
  DEFAULT_SPLIT,
  type CropRecommendation,
  type FertilizerGrade,
  type SplitDose,
} from '../lib/fertilizerCalculatorData';
import {
  calculateFertilizers,
  emptyNutrients,
  gradeComposition,
  numberValue,
  round,
  visibleNutrientKeys,
  type Nutrients,
} from '../features/fertilizerCalculator/fertilizerEngine';
import { loadFertilizerGrades } from '../features/fertilizerCalculator/useFertilizerGrades';

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
  'ఎరువులను తగిన తేమ ఉన్న సమయంలో వేయడం ఉత్తమం.',
];

const PRESETS = [
  { label: '48:24:24', n: 48, p: 24, k: 24 },
  { label: '36:18:18', n: 36, p: 18, k: 18 },
  { label: '60:24:24', n: 60, p: 24, k: 24 },
  { label: '80:32:32', n: 80, p: 32, k: 32 },
  { label: '16:8:8', n: 16, p: 8, k: 8 },
  { label: '8:20:0', n: 8, p: 20, k: 0 },
];

function gradeKey(grade: FertilizerGrade) {
  return grade.id || grade.name;
}

function getGradeLabel(grade: FertilizerGrade) {
  const composition = gradeComposition(grade);
  const entries = visibleNutrientKeys(composition)
    .filter((nutrient) => numberValue(composition[nutrient]) > 0)
    .map((nutrient) => `${nutrient.toUpperCase()} ${round(composition[nutrient])}`);
  return entries.length ? `${grade.name} (${entries.join(', ')})` : grade.name;
}

function getAcres(areaValue: number, unit: string) {
  if (unit === 'hectares') return areaValue * 2.47105;
  if (unit === 'guntas') return areaValue / 40;
  return areaValue;
}

function areaUnitLabel(unit: string, language: 'en' | 'te') {
  const labels: Record<string, { en: string; te: string }> = {
    acres: { en: 'acres', te: 'ఎకరాలు' },
    hectares: { en: 'hectares', te: 'హెక్టార్లు' },
    guntas: { en: 'guntas', te: 'గుంటలు' },
  };
  return labels[unit]?.[language] || unit;
}

function formatSelectedArea(area: { value: number; unit: string }, language: 'en' | 'te') {
  return `${round(numberValue(area.value))} ${areaUnitLabel(area.unit, language)}`;
}

function formatNutrients(nutrients: Nutrients) {
  return visibleNutrientKeys(nutrients)
    .filter((nutrient) => numberValue(nutrients[nutrient]) > 0 || ['n', 'p', 'k'].includes(nutrient))
    .map((nutrient) => `${nutrient === 'p' ? 'P2O5' : nutrient === 'k' ? 'K2O' : nutrient.toUpperCase()} ${round(numberValue(nutrients[nutrient]))} kg`)
    .join(', ');
}

function formatNutrientLinesTe(nutrients: Nutrients) {
  return [
    `🔹 నత్రజని (N) : ${round(nutrients.n)} కిలోలు`,
    `🔹 భాస్వరం (P₂O₅) : ${round(nutrients.p)} కిలోలు`,
    `🔹 పొటాష్ (K₂O) : ${round(nutrients.k)} కిలోలు`,
  ];
}

function compositionToText(composition?: Record<string, number>) {
  return Object.entries(composition || {})
    .filter(([key, value]) => !['n', 'p', 'k', 's'].includes(key) && numberValue(value) > 0)
    .map(([key, value]) => `${key}:${value}`)
    .join(', ');
}

function parseCompositionText(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, number>>((total, item) => {
      const [key, amount] = item.split(/[:=]/).map((part) => part.trim());
      if (key && numberValue(amount) > 0) total[key] = numberValue(amount);
      return total;
    }, {});
}

function fertilizerNameTe(name: string) {
  const names: Record<string, string> = {
    Urea: 'యూరియా',
    'Ammonium Sulphate': 'అమ్మోనియం సల్ఫేట్',
    DAP: 'డి.ఎ.పీ',
    MOP: 'ఎం.ఓ.పీ',
    SSP: 'ఎస్ఎస్పీ',
    TSP: 'టీఎస్పీ',
  };
  return names[name] || name;
}

function cropNameTe(name: string) {
  const names: Record<string, string> = {
    Cotton: 'పత్తి',
    Paddy: 'వరి',
    Maize: 'మక్కజొన్న',
    Redgram: 'కందులు',
    Greengram: 'పెసలు',
    Sesamum: 'నువ్వులు',
  };
  return names[name] || name;
}

function seasonNameTe(name = '') {
  const names: Record<string, string> = {
    Vanakalam: 'వానాకాలం',
    Yasangi: 'యాసంగి',
    'All Seasons': 'అన్ని సీజన్లు',
  };
  return names[name] || name || '-';
}

function zoneNameTe(name = '') {
  const names: Record<string, string> = {
    'All Zones': 'అన్ని జోన్లు',
    'Northern Telangana': 'ఉత్తర తెలంగాణ',
    'Central Telangana': 'మధ్య తెలంగాణ',
    'Southern Telangana': 'దక్షిణ తెలంగాణ',
  };
  return names[name] || name || '-';
}

function varietyNameTe(name = '') {
  const names: Record<string, string> = {
    Normal: 'సాధారణ రకం',
    Hybrid: 'హైబ్రిడ్ రకం',
    'Sweet Corn': 'స్వీట్ కార్న్',
    'Pop Corn': 'పాప్ కార్న్',
    'Baby Corn': 'బేబీ కార్న్',
    'Long Duration': 'దీర్ఘకాలిక రకం',
  };
  return names[name] || name || '-';
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

type FertilizerReportInput = {
  language: 'en' | 'te';
  mode: 'simple' | 'crop';
  area: { value: number; unit: string };
  required: Nutrients;
  results: FertilizerResult[];
  supplied: Nutrients;
  balance: Nutrients;
  excess: Nutrients;
  selectedRecommendation: CropRecommendation;
  recommendationNutrients: Nutrients;
  splitPlan: SplitFertilizerPlanRow[];
};

function buildWhatsAppText(input: FertilizerReportInput) {
  const {
  language,
  mode,
  area,
  required,
  results,
  supplied,
  balance,
  excess,
  selectedRecommendation,
  recommendationNutrients,
  splitPlan,
  } = input;
  const fertilizerRows = formatFertilizerRows(results, language);

  if (language === 'te') {
    const crop = recommendationCrop(selectedRecommendation);
    const perAcreNutrients = mode === 'crop'
      ? { n: selectedRecommendation.n, p: selectedRecommendation.p, k: selectedRecommendation.k }
      : required;
    const totalNutrients = mode === 'crop' ? recommendationNutrients : required;
    const lines = [
      '🌾 స్మార్ట్ ఎరువుల కాలిక్యులేటర్',
      '',
      'తిర్యాణి వ్యవసాయ పోర్టల్',
      '',
      'పంట వివరాలు',
      '',
      mode === 'crop' ? `పంట: ${cropNameTe(crop)} (${crop})` : 'పంట: ఎంపిక చేసిన పోషక అవసరం',
      mode === 'crop' ? `సీజన్: ${seasonNameTe(selectedRecommendation.season)}` : '',
      mode === 'crop' ? `ప్రాంతం: ${zoneNameTe(selectedRecommendation.zone)}` : '',
      mode === 'crop' ? `రకం: ${varietyNameTe(selectedRecommendation.variety)}` : '',
      mode === 'crop' ? `ఎంపిక చేసిన విస్తీర్ణం: ${formatSelectedArea(area, 'te')}` : '',
      '',
      mode === 'crop' ? `మొత్తం అవసరం (${formatSelectedArea(area, 'te')} కోసం):` : '',
      ...(mode === 'crop' ? formatNutrientLinesTe(totalNutrients) : []),
      '',
      'వ్యవసాయ విశ్వవిద్యాలయ సిఫారసు',
      '',
      'ఎకరానికి సిఫారసు చేయబడిన పోషకాలు (N:P:K)',
      '',
      ...formatNutrientLinesTe(perAcreNutrients),
      '',
      '---',
      '',
      '✅ పోషకాల సరఫరా',
      '',
      ...formatNutrientLinesTe(supplied),
      '',
      '---',
      '',
      '📊 పోషకాల లోటు',
      '',
      ...formatNutrientLinesTe(balance),
      '',
      '---',
      '',
      '📈 పోషకాల అధిక సరఫరా',
      '',
      ...formatNutrientLinesTe(excess),
      '',
      '---',
      '',
      '🧪 అవసరమైన ఎరువుల పరిమాణం',
      '',
      '| ఎరువు | పరిమాణం | బస్తాలు |',
      '| --- | --- | --- |',
      ...(results.filter((row) => row.kg > 0.01).map((row) => `| ${fertilizerNameTe(row.grade.name)} | ${round(row.kg)} కిలోలు | ${round(row.bags)} బస్తాలు |`)),
      ...(fertilizerRows.length ? [] : ['ఎరువు అవసరం లేదు.']),
      '',
      '---',
    ];

    if (mode === 'crop') {
      lines.push('', '🌱 విడతల వారీ ఎరువుల మోతాదు', '');
      splitPlan.forEach(({ dose, nutrients, calculation }, index) => {
        const rows = formatFertilizerRows(calculation.results, language);
        lines.push(`${index + 1}. ${stageNameTe(dose.stage)}`, '');
        lines.push('లక్ష్యం', '', ...formatNutrientLinesTe(nutrients).filter((line) => !line.includes(': 0 కిలోలు')), '');
        lines.push('వేయవలసిన ఎరువులు', '');
        lines.push(...(rows.length ? rows.map((row) => `• ${row}`) : ['• ఈ విడతలో ఎరువు అవసరం లేదు.']));
        lines.push('', '---', '');
      });
    }

    lines.push(
      '⚠️ ముఖ్యమైన వ్యవసాయ సూచనలు',
      '',
      ...AGRONOMIC_NOTES_TE.map((note) => `✅ ${note}`),
      '',
      '────────────────────────────────',
      '',
      'తయారు చేసినది',
      '',
      'కె. వినయ్ రెడ్డి',
      'మండల వ్యవసాయ అధికారి (MAO)',
      'తిర్యాణి మండలం',
      'కొమురం భీం ఆసిఫాబాద్ జిల్లా',
      '',
      '🌾 తిర్యాణి వ్యవసాయ పోర్టల్',
      '',
      '────────────────────────────────'
    );
    return lines.filter((line, index, all) => line !== '' || all[index - 1] !== '').join('\n');
  }

  const lines = [
    'Smart Fertilizer Calculator - Tiryani Agriculture Portal',
    mode === 'crop'
      ? `Agriculture University recommendation: ${recommendationLabel(selectedRecommendation)} - ${recommendationNpkLabel(selectedRecommendation)} per acre`
      : 'Selected nutrient requirement',
    mode === 'crop' ? `Selected area: ${formatSelectedArea(area, 'en')}` : '',
    mode === 'crop' ? `Total requirement for selected area: ${formatNutrients(recommendationNutrients)}` : '',
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

function stripWhatsAppMarkdown(value: string) {
  return value
    .replace(/^#+\s*/gm, '')
    .replace(/\*/g, '')
    .replace(/[🌾✅📊📈🧪🌱⚠️🔹•]/g, '')
    .replace(/\|/g, '  ');
}

function isPdfHeading(line: string) {
  return /^---|^─/.test(line) || /^(🌾|తిర్యాణి వ్యవసాయ పోర్టల్|పంట వివరాలు|వ్యవసాయ విశ్వవిద్యాలయ|✅|📊|📈|🧪|🌱|⚠️|తయారు చేసినది|Smart|Important|Fertilizer|Generated)/.test(stripWhatsAppMarkdown(line).trim());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildFertilizerReportHtml(text: string, language: 'en' | 'te') {
  const sections = text.split(/\n---\n/g).map((section) => section.trim()).filter(Boolean);
  const [titleBlock, ...bodySections] = sections;
  const titleLines = (titleBlock || '').split('\n').filter(Boolean);
  const title = titleLines.shift() || 'Smart Fertilizer Calculator';
  const subtitle = titleLines.shift() || 'Tiryani Agriculture Portal';
  const firstSection = titleLines.join('\n').trim();
  const allSections = [firstSection, ...bodySections].filter(Boolean);

  const renderLine = (line: string) => {
    const clean = stripWhatsAppMarkdown(line).trim();
    if (!clean) return '';
    if (isPdfHeading(line)) return `<h2>${escapeHtml(clean)}</h2>`;
    if (/^\|/.test(line)) return `<p class="mono">${escapeHtml(clean.replace(/\s*\|\s*/g, '   ').replace(/^---.*$/, ''))}</p>`;
    if (/^(🔹|✅|•)/.test(line)) return `<p class="bullet">${escapeHtml(clean)}</p>`;
    if (/^\d+\./.test(clean) || clean === 'లక్ష్యం' || clean === 'వేయవలసిన ఎరువులు') return `<p class="strong">${escapeHtml(clean)}</p>`;
    return `<p>${escapeHtml(clean)}</p>`;
  };

  return `
    <div class="fertilizer-pdf ${language === 'te' ? 'telugu' : 'english'}">
      <header>
        <h1>${escapeHtml(stripWhatsAppMarkdown(title).trim())}</h1>
        <p>${escapeHtml(stripWhatsAppMarkdown(subtitle).trim())}</p>
      </header>
      ${allSections.map((section) => `
        <section class="card">
          ${section.split('\n').map(renderLine).join('')}
        </section>
      `).join('')}
    </div>
  `;
}

function createFertilizerReportElement(html: string) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = '#eef6f0';
  container.innerHTML = `
    <style>
      .fertilizer-pdf {
        box-sizing: border-box;
        width: 794px;
        padding: 22px;
        background: #eef6f0;
        color: #0f172a;
        font-family: Arial, "Noto Sans Telugu", "Nirmala UI", "Gautami", sans-serif;
        line-height: 1.28;
      }
      .fertilizer-pdf header {
        margin-bottom: 10px;
        text-align: center;
        color: #047857;
      }
      .fertilizer-pdf h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 900;
      }
      .fertilizer-pdf header p {
        margin: 2px 0 0;
        font-size: 15px;
        font-weight: 800;
      }
      .fertilizer-pdf .card {
        margin: 0 0 8px;
        padding: 8px 10px;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 3px 10px rgba(15, 118, 110, 0.06);
      }
      .fertilizer-pdf h2 {
        margin: 0 0 5px;
        color: #047857;
        font-size: 14px;
        font-weight: 900;
      }
      .fertilizer-pdf p {
        margin: 1px 0;
        font-size: 10.5px;
        font-weight: 600;
      }
      .fertilizer-pdf .strong {
        margin-top: 5px;
        font-size: 11.5px;
        font-weight: 900;
      }
      .fertilizer-pdf .bullet {
        padding-left: 4px;
        font-weight: 700;
      }
      .fertilizer-pdf .mono {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        font-weight: 800;
      }
      .fertilizer-pdf.english {
        padding: 18px;
        line-height: 1.18;
      }
      .fertilizer-pdf.english header {
        margin-bottom: 7px;
      }
      .fertilizer-pdf.english h1 {
        font-size: 20px;
      }
      .fertilizer-pdf.english header p {
        font-size: 13px;
      }
      .fertilizer-pdf.english .card {
        margin-bottom: 6px;
        padding: 7px 9px;
      }
      .fertilizer-pdf.english h2 {
        margin-bottom: 4px;
        font-size: 12.5px;
      }
      .fertilizer-pdf.english p {
        font-size: 9.5px;
      }
      .fertilizer-pdf.english .strong {
        margin-top: 4px;
        font-size: 10px;
      }
    </style>
    ${html}
  `;
  document.body.appendChild(container);
  return container;
}

function getInitialSelected(grades: FertilizerGrade[]) {
  const defaultNames = new Set(['DAP', 'Urea', 'MOP']);
  return grades.filter((grade) => defaultNames.has(grade.name)).map(gradeKey);
}

function recommendationMergeKey(recommendation: CropRecommendation) {
  return [
    recommendation.crop_name,
    recommendation.crop || '',
    recommendation.zone || '',
    recommendation.season || '',
    recommendation.variety || '',
  ].join('|').trim().toLowerCase();
}

function mergeRecommendationsWithDefaults(rows: CropRecommendation[]) {
  const activeRows = rows.filter((row) => row.is_active !== false);
  const inactiveKeys = new Set(rows.filter((row) => row.is_active === false).map(recommendationMergeKey));
  const merged = new Map<string, CropRecommendation>();

  DEFAULT_RECOMMENDATIONS.forEach((recommendation) => {
    const key = recommendationMergeKey(recommendation);
    if (!inactiveKeys.has(key)) merged.set(key, recommendation);
  });
  activeRows.forEach((recommendation) => merged.set(recommendationMergeKey(recommendation), recommendation));

  return [...merged.values()].sort((a, b) => a.crop_name.localeCompare(b.crop_name));
}

function supabaseErrorMessage(error: unknown) {
  if (!error) return 'Unknown Supabase error';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const details = error as { message?: string; details?: string; hint?: string; code?: string };
    return [details.message, details.details, details.hint, details.code ? `Code: ${details.code}` : ''].filter(Boolean).join(' ');
  }
  return String(error);
}

function isMissingColumnError(error: unknown, column: string) {
  const message = supabaseErrorMessage(error).toLowerCase();
  return message.includes(column.toLowerCase()) || message.includes('schema cache') || message.includes('column');
}

function isMissingConflictTargetError(error: unknown) {
  const message = supabaseErrorMessage(error).toLowerCase();
  return message.includes('42p10') || message.includes('unique') || message.includes('constraint') || message.includes('conflict');
}

function mergeGradeIntoList(list: FertilizerGrade[], grade: FertilizerGrade) {
  if (!grade.name) return list;
  const byName = grade.name.trim().toLowerCase();
  const next = list.filter((item) => item.name.trim().toLowerCase() !== byName);
  next.push(grade);
  return next.sort((a, b) => a.name.localeCompare(b.name));
}

function mergeRecommendationIntoList(list: CropRecommendation[], recommendation: CropRecommendation) {
  const key = recommendationMergeKey(recommendation);
  const next = list.filter((item) => recommendationMergeKey(item) !== key);
  next.push(recommendation);
  return next.sort((a, b) => a.crop_name.localeCompare(b.crop_name));
}

async function loadCropRecommendations() {
  let response: any = await supabase
    .from('crop_fertilizer_recommendations')
    .select('id, crop_name, crop, zone, season, variety, n, p, k, nutrients, area_unit, split_plan, is_active')
    .order('crop_name');

  if (response.error) {
    response = await supabase
      .from('crop_fertilizer_recommendations')
      .select('id, crop_name, crop, zone, season, variety, n, p, k, area_unit, split_plan, is_active')
      .order('crop_name');
  }

  if (response.error) return DEFAULT_RECOMMENDATIONS;

  return mergeRecommendationsWithDefaults((response.data || []).map((row: any) => ({
    id: row.id,
    crop_name: row.crop_name,
    crop: row.crop || row.crop_name,
    zone: row.zone || 'All Zones',
    season: row.season || 'Vanakalam',
    variety: row.variety || 'Normal',
    n: numberValue(row.n),
    p: numberValue(row.p),
    k: numberValue(row.k),
    nutrients: typeof row.nutrients === 'object' && row.nutrients ? row.nutrients as Record<string, number> : undefined,
    area_unit: row.area_unit || 'acre',
    split_plan: Array.isArray(row.split_plan) ? row.split_plan as SplitDose[] : DEFAULT_SPLIT,
    is_active: row.is_active,
  })));
}

async function saveFertilizerGradeRecord(
  payload: Omit<FertilizerGrade, 'id'> & { composition: Record<string, number>; is_active: boolean },
  grade: FertilizerGrade
) {
  const serverId = grade.id && !grade.id.startsWith('local-') ? grade.id : null;
  const { composition: _composition, ...legacyPayload } = payload;
  const writePayload = async (record: typeof payload | typeof legacyPayload) => {
    if (serverId) {
      return supabase.from('fertilizer_grades').update(record).eq('id', serverId);
    }

    const upsertResponse = await supabase.from('fertilizer_grades').upsert(record, { onConflict: 'name' });
    if (!upsertResponse.error || !isMissingConflictTargetError(upsertResponse.error)) return upsertResponse;

    const existing = await supabase
      .from('fertilizer_grades')
      .select('id')
      .eq('name', payload.name)
      .limit(1)
      .maybeSingle();
    if (existing.error) return existing;
    if (existing.data?.id) {
      return supabase.from('fertilizer_grades').update(record).eq('id', existing.data.id);
    }
    return supabase.from('fertilizer_grades').insert(record);
  };

  let response = await writePayload(payload);
  if (response.error && isMissingColumnError(response.error, 'composition')) {
    response = await writePayload(legacyPayload);
  }
  return response;
}

async function saveCropRecommendationRecord(
  payload: Omit<CropRecommendation, 'id'> & { nutrients: Record<string, number>; is_active: boolean },
  crop: CropRecommendation
) {
  const serverId = crop.id && !crop.id.startsWith('local-') ? crop.id : null;
  const { nutrients: _nutrients, ...legacyPayload } = payload;
  const writePayload = async (record: typeof payload | typeof legacyPayload) => {
    if (serverId) {
      return supabase.from('crop_fertilizer_recommendations').update(record).eq('id', serverId);
    }

    const upsertResponse = await supabase.from('crop_fertilizer_recommendations').upsert(record, { onConflict: 'crop_name' });
    if (!upsertResponse.error || !isMissingConflictTargetError(upsertResponse.error)) return upsertResponse;

    const existing = await supabase
      .from('crop_fertilizer_recommendations')
      .select('id')
      .eq('crop_name', payload.crop_name)
      .eq('crop', payload.crop)
      .eq('zone', payload.zone)
      .eq('season', payload.season)
      .eq('variety', payload.variety)
      .limit(1)
      .maybeSingle();
    if (existing.error) return existing;
    if (existing.data?.id) {
      return supabase.from('crop_fertilizer_recommendations').update(record).eq('id', existing.data.id);
    }
    return supabase.from('crop_fertilizer_recommendations').insert(record);
  };

  let response = await writePayload(payload);
  if (response.error && isMissingColumnError(response.error, 'nutrients')) {
    response = await writePayload(legacyPayload);
  }
  return response;
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
  const { isAdminUser, user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [mode, setMode] = useState<'simple' | 'crop'>('crop');
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
  const [saveNotice, setSaveNotice] = useState<{ type: 'grade' | 'crop'; label: string; details: string } | null>(null);
  const [savedCalculations, setSavedCalculations] = useState<Array<{ id: string; input: unknown; output: unknown; created_at: string }>>([]);

  useEffect(() => {
    const loadCalculatorData = async () => {
      setLoadingData(true);
      const [loadedGrades, loadedRecommendations] = await Promise.all([loadFertilizerGrades(), loadCropRecommendations()]);

      setGrades(loadedGrades);
      setSelectedKeys((current) => {
        const kept = current.filter((key) => loadedGrades.some((grade) => gradeKey(grade) === key));
        return kept.length ? kept : getInitialSelected(loadedGrades);
      });
      setRecommendations(loadedRecommendations);
      setLoadingData(false);
    };

    void loadCalculatorData();
  }, []);

  const refreshSavedCalculations = async () => {
    if (!isAdminUser) return;
    const { data, error } = await supabase
      .from('fertilizer_calculation_records')
      .select('id, input, output, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (!error) setSavedCalculations(data || []);
  };

  useEffect(() => {
    void refreshSavedCalculations();
  }, [isAdminUser]);

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
  const adminCropOptions = useMemo(() => uniqueValues([...recommendations.map(recommendationCrop), 'Cotton', 'Paddy', 'Maize', 'Redgram', 'Greengram', 'Sesamum']), [recommendations]);
  const adminZoneOptions = useMemo(() => uniqueValues([...recommendations.map((recommendation) => recommendation.zone), 'All Zones', 'Northern Telangana', 'Central Telangana', 'Southern Telangana']), [recommendations]);
  const adminSeasonOptions = useMemo(() => uniqueValues([...recommendations.map((recommendation) => recommendation.season), 'Vanakalam', 'Yasangi', 'All Seasons']), [recommendations]);
  const adminVarietyOptions = useMemo(() => uniqueValues([...recommendations.map((recommendation) => recommendation.variety), 'Normal', 'Hybrid', 'Sweet Corn', 'Pop Corn', 'Baby Corn', 'Long Duration']), [recommendations]);
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
    const base: Nutrients = {
      n: selectedRecommendation.n * acres,
      p: selectedRecommendation.p * acres,
      k: selectedRecommendation.k * acres,
    };
    Object.entries(selectedRecommendation.nutrients || {}).forEach(([nutrient, value]) => {
      base[nutrient] = numberValue(value) * acres;
    });
    return base;
  }, [area, selectedRecommendation]);
  const recommendationCalculation = useMemo(
    () => calculateFertilizers(recommendationNutrients, selectedGrades),
    [recommendationNutrients, selectedGrades]
  );
  const splitFertilizerPlan = useMemo(
    () => (selectedRecommendation.split_plan || DEFAULT_SPLIT).map((dose) => {
      const doseNutrients: Nutrients = {
        n: recommendationNutrients.n * dose.nPct / 100,
        p: recommendationNutrients.p * dose.pPct / 100,
        k: recommendationNutrients.k * dose.kPct / 100,
      };
      Object.entries(dose.nutrientsPct || {}).forEach(([nutrient, percent]) => {
        doseNutrients[nutrient] = numberValue(recommendationNutrients[nutrient]) * numberValue(percent) / 100;
      });
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
    setMode('crop');
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
      composition: {
        n: numberValue(grade.n),
        p: numberValue(grade.p),
        k: numberValue(grade.k),
        s: numberValue(grade.s),
        ...(grade.composition || {}),
      },
      is_active: true,
    };
    if (!payload.name) return;
    const { error } = await saveFertilizerGradeRecord(payload, grade);
    if (error) {
      alert(`Could not save fertilizer grade: ${supabaseErrorMessage(error)}`);
      return;
    }
    const savedGrade: FertilizerGrade = {
      ...grade,
      ...payload,
      composition: payload.composition,
      is_active: true,
    };
    const refreshedGrades = await loadFertilizerGrades();
    const visibleGrades = mergeGradeIntoList(refreshedGrades, savedGrade);
    setGrades(visibleGrades);
    setSelectedKeys((current) => {
      const kept = current.filter((key) => visibleGrades.some((item) => gradeKey(item) === key));
      return kept.length ? kept : getInitialSelected(visibleGrades);
    });
    setSaveNotice({
      type: 'grade',
      label: payload.name,
      details: `Grade ${payload.n}:${payload.p}:${payload.k}${payload.s ? `:${payload.s}` : ''} | ${payload.bag_kg} kg bag`,
    });
    setGradeDraft({ name: '', n: 0, p: 0, k: 0, s: 0, bag_kg: 50 });
  };

  const deleteGrade = async (grade: FertilizerGrade) => {
    if (!window.confirm(`Delete fertilizer label "${grade.name}"?`)) return;
    const key = gradeKey(grade);
    const serverId = grade.id && !grade.id.startsWith('local-') ? grade.id : null;

    if (serverId) {
      const deleteResponse = await supabase.from('fertilizer_grades').delete().eq('id', serverId);
      if (deleteResponse.error) {
        const inactiveResponse = await supabase.from('fertilizer_grades').update({ is_active: false }).eq('id', serverId);
        if (inactiveResponse.error) {
          alert('Could not delete fertilizer label. Please check Supabase admin permissions.');
          return;
        }
      }
    }

    const refreshedGrades = await loadFertilizerGrades();
    setGrades(refreshedGrades.filter((item) => gradeKey(item) !== key));
    setSelectedKeys((current) => current.filter((item) => item !== key));
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
      nutrients: {
        n: numberValue(crop.n),
        p: numberValue(crop.p),
        k: numberValue(crop.k),
        ...(crop.nutrients || {}),
      },
      area_unit: 'acre',
      split_plan: crop.split_plan || DEFAULT_SPLIT,
      is_active: true,
    };
    if (!payload.crop_name) return;
    const { error } = await saveCropRecommendationRecord(payload, crop);
    if (error) {
      alert(`Could not save crop recommendation: ${supabaseErrorMessage(error)}`);
      return;
    }
    const savedRecommendation: CropRecommendation = {
      ...crop,
      ...payload,
      nutrients: payload.nutrients,
      is_active: true,
    };
    const refreshedRecommendations = await loadCropRecommendations();
    setRecommendations(mergeRecommendationIntoList(refreshedRecommendations, savedRecommendation));
    setSaveNotice({
      type: 'crop',
      label: payload.crop_name,
      details: `${payload.crop} | ${payload.season} | ${payload.zone} | ${payload.variety} | N:P:K ${payload.n}:${payload.p}:${payload.k}`,
    });
    setCropDraft({ crop_name: '', crop: '', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 0, p: 0, k: 0, area_unit: 'acre', split_plan: DEFAULT_SPLIT });
  };

  const deleteCrop = async (crop: CropRecommendation) => {
    if (!window.confirm(`Delete crop recommendation "${crop.crop_name}"?`)) return;
    const serverId = crop.id && !crop.id.startsWith('local-') ? crop.id : null;

    if (serverId) {
      const deleteResponse = await supabase.from('crop_fertilizer_recommendations').delete().eq('id', serverId);
      if (deleteResponse.error) {
        const inactiveResponse = await supabase.from('crop_fertilizer_recommendations').update({ is_active: false }).eq('id', serverId);
        if (inactiveResponse.error) {
          alert('Could not delete crop recommendation. Please check Supabase admin permissions.');
          return;
        }
      }
    }

    const refreshedRecommendations = await loadCropRecommendations();
    setRecommendations(refreshedRecommendations.filter((item) => (item.id || item.crop_name) !== (crop.id || crop.crop_name)));
  };

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const text = buildWhatsAppText({
      language,
      mode,
      area,
      required: activeRequired,
      results: activeCalculation.results,
      supplied: activeCalculation.supplied,
      balance: activeCalculation.balance,
      excess: activeCalculation.excess,
      selectedRecommendation,
      recommendationNutrients,
      splitPlan: splitFertilizerPlan,
    });
    const html2canvas = (await import('html2canvas')).default;
    const reportElement = createFertilizerReportElement(buildFertilizerReportHtml(text, language));
    const canvas = await html2canvas(reportElement, {
      backgroundColor: '#eef6f0',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    reportElement.remove();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const footerHeight = 24;
    const imageWidth = pageWidth - margin * 2;
    const pageImageHeight = pageHeight - margin * 2 - footerHeight;

    if (language === 'en') {
      const naturalImageHeight = (canvas.height / canvas.width) * imageWidth;
      const fitScale = Math.min(1, pageImageHeight / naturalImageHeight);
      const fittedWidth = imageWidth * fitScale;
      const fittedHeight = naturalImageHeight * fitScale;
      const x = margin + (imageWidth - fittedWidth) / 2;
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, margin, fittedWidth, fittedHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      doc.text('Tiryani Agriculture Portal | Generated by K. Vinay Reddy, MAO, Tiryani', pageWidth / 2, pageHeight - 16, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('Page 1 of 1', pageWidth / 2, pageHeight - 7, { align: 'center' });
      doc.save(`fertilizer-calculator-${new Date().toISOString().slice(0, 10)}.pdf`);
      return;
    }

    const sourcePageHeight = Math.floor((pageImageHeight / imageWidth) * canvas.width);
    const pageCount = Math.max(1, Math.ceil(canvas.height / sourcePageHeight));

    for (let page = 0; page < pageCount; page += 1) {
      if (page > 0) doc.addPage();
      const sourceY = page * sourcePageHeight;
      const sliceHeight = Math.min(sourcePageHeight, canvas.height - sourceY);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const context = pageCanvas.getContext('2d');
      context?.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      const imageHeight = (sliceHeight / canvas.width) * imageWidth;
      doc.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, imageWidth, imageHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      doc.text('Tiryani Agriculture Portal | Generated by K. Vinay Reddy, MAO, Tiryani', pageWidth / 2, pageHeight - 16, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`Page ${page + 1} of ${pageCount}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
    }
    doc.save(`fertilizer-calculator-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const shareWhatsApp = () => {
    const text = buildWhatsAppText({
      language,
      mode,
      area,
      required: activeRequired,
      results: activeCalculation.results,
      supplied: activeCalculation.supplied,
      balance: activeCalculation.balance,
      excess: activeCalculation.excess,
      selectedRecommendation,
      recommendationNutrients,
      splitPlan: splitFertilizerPlan,
    });
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const saveCalculation = async () => {
    const input = {
      mode,
      simpleTab,
      area,
      required: activeRequired,
      selectedRecommendation,
      selectedGrades,
    };
    const output = {
      supplied: activeCalculation.supplied,
      balance: activeCalculation.balance,
      excess: activeCalculation.excess,
      remarks: activeCalculation.remarks,
      results: activeCalculation.results.map((row) => ({
        fertilizer: row.grade.name,
        kg: row.kg,
        bags: row.bags,
        supplied: row.supplied,
      })),
    };
    const { error } = await supabase.from('fertilizer_calculation_records').insert({
      input,
      output,
      created_by: user?.id || null,
    });
    if (error) {
      alert('Could not save calculation. Please apply the latest Supabase migration.');
      return;
    }
    setSaveNotice({
      type: 'crop',
      label: 'Saved successfully',
      details: `${mode === 'crop' ? recommendationLabel(selectedRecommendation) : 'Custom nutrients'} | ${formatNutrients(activeRequired)}`,
    });
    await refreshSavedCalculations();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-2 text-slate-950 sm:space-y-3">
      <section className="rounded-xl border border-emerald-100 bg-white p-2 shadow-sm sm:p-3">
        <div className="flex justify-end">
          <button type="button" onClick={toggleLanguage} className="inline-flex min-h-8 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-800">
              {language === 'te' ? 'English' : 'తెలుగు'}
            </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            <button type="button" onClick={exportPdf} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-red-600 px-2 py-1.5 text-white sm:px-3" aria-label="Export PDF" title="PDF">
              <FileText className="h-4 w-4" />
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
          {activeCalculation.remarks.length > 0 && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-bold text-amber-950">
              {activeCalculation.remarks.map((remark) => <p key={remark}>{remark}</p>)}
            </div>
          )}
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
          {saveNotice && (
            <div className="mb-3 rounded-lg border border-emerald-300 bg-white p-3 text-emerald-950 shadow-sm">
              <p className="text-sm font-black">Saved successfully</p>
              <p className="mt-1 text-sm font-bold">{saveNotice.label}</p>
              <p className="text-xs font-semibold text-emerald-800">{saveNotice.details}</p>
            </div>
          )}
          <div className="mb-3 rounded-lg border border-white bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-black text-slate-950">Save Current Calculation</p>
                <p className="text-xs font-semibold text-slate-500">Stores complete input and output including dynamic nutrients.</p>
              </div>
              <button type="button" onClick={saveCalculation} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white">
                <Save className="h-4 w-4" /> Save Calculation
              </button>
            </div>
            {savedCalculations.length > 0 && (
              <div className="mt-3 grid gap-2">
                {savedCalculations.map((entry) => (
                  <div key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-700">
                    Saved: {new Date(entry.created_at).toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <AdminGradeEditor grades={grades} draft={gradeDraft} onDraftChange={setGradeDraft} onSave={saveGrade} onDelete={deleteGrade} loading={loadingData} />
            <AdminCropEditor
              crops={recommendations}
              draft={cropDraft}
              onDraftChange={setCropDraft}
              onSave={saveCrop}
              onDelete={deleteCrop}
              options={{ crops: adminCropOptions, zones: adminZoneOptions, seasons: adminSeasonOptions, varieties: adminVarietyOptions }}
            />
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
      <p className="mt-1 text-xs font-bold">
        {visibleNutrientKeys(values)
          .filter((nutrient) => numberValue(values[nutrient]) > 0 || ['n', 'p', 'k'].includes(nutrient))
          .map((nutrient) => `${nutrient.toUpperCase()} ${round(numberValue(values[nutrient]))}`)
          .join(' | ')}
      </p>
    </div>
  );
}

function AdminGradeEditor({
  grades,
  draft,
  onDraftChange,
  onSave,
  onDelete,
  loading,
}: {
  grades: FertilizerGrade[];
  draft: FertilizerGrade;
  onDraftChange: (grade: FertilizerGrade) => void;
  onSave: (grade: FertilizerGrade) => void;
  onDelete: (grade: FertilizerGrade) => void;
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
          <EditableGradeRow key={gradeKey(grade)} grade={grade} onSave={onSave} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function EditableGradeRow({ grade, onSave, onDelete }: { grade: FertilizerGrade; onSave: (grade: FertilizerGrade) => void; onDelete: (grade: FertilizerGrade) => void }) {
  const [value, setValue] = useState(grade);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <EditorInputs value={value} onChange={setValue} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => onSave(value)} className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-black text-white">
          <Save className="h-3.5 w-3.5" /> Save
        </button>
        <button type="button" onClick={() => onDelete(grade)} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-black text-white">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
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
      <input
        defaultValue={compositionToText(value.composition)}
        onChange={(event) => onChange({ ...value, composition: parseCompositionText(event.target.value) })}
        placeholder="Extra nutrients Zn:1, B:0.5"
        className="col-span-6 rounded-md border border-slate-200 px-2 py-1 text-xs font-bold"
      />
    </div>
  );
}

function AdminCropEditor({
  crops,
  draft,
  onDraftChange,
  onSave,
  onDelete,
  options,
}: {
  crops: CropRecommendation[];
  draft: CropRecommendation;
  onDraftChange: (crop: CropRecommendation) => void;
  onSave: (crop: CropRecommendation) => void;
  onDelete: (crop: CropRecommendation) => void;
  options: CropInputOptions;
}) {
  return (
    <div className="rounded-xl border border-white bg-white p-3">
      <h3 className="mb-2 text-sm font-black">Crop Recommendations</h3>
      <CropInputs value={draft} onChange={onDraftChange} options={options} />
      <button type="button" onClick={() => onSave(draft)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white">
        <Plus className="h-4 w-4" /> Add Crop
      </button>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
        {crops.map((crop) => (
          <EditableCropRow key={crop.id || crop.crop_name} crop={crop} onSave={onSave} onDelete={onDelete} options={options} />
        ))}
      </div>
    </div>
  );
}

function EditableCropRow({ crop, onSave, onDelete, options }: { crop: CropRecommendation; onSave: (crop: CropRecommendation) => void; onDelete: (crop: CropRecommendation) => void; options: CropInputOptions }) {
  const [value, setValue] = useState(crop);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <CropInputs value={value} onChange={setValue} options={options} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => onSave(value)} className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-black text-white">
          <Save className="h-3.5 w-3.5" /> Save
        </button>
        <button type="button" onClick={() => onDelete(crop)} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-black text-white">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

type CropInputOptions = {
  crops: string[];
  zones: string[];
  seasons: string[];
  varieties: string[];
};

function CropInputs({ value, onChange, options }: { value: CropRecommendation; onChange: (crop: CropRecommendation) => void; options: CropInputOptions }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      <input value={value.crop_name} onChange={(event) => onChange({ ...value, crop_name: event.target.value })} placeholder="Title" className="col-span-2 rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      <AdminSelect value={value.crop || ''} options={options.crops} placeholder="Crop" onChange={(crop) => onChange({ ...value, crop })} />
      <AdminSelect value={value.zone || ''} options={options.zones} placeholder="Zone" onChange={(zone) => onChange({ ...value, zone })} />
      <AdminSelect value={value.season || ''} options={options.seasons} placeholder="Season" onChange={(season) => onChange({ ...value, season })} />
      <AdminSelect value={value.variety || ''} options={options.varieties} placeholder="Variety" onChange={(variety) => onChange({ ...value, variety })} />
      {(['n', 'p', 'k'] as const).map((key) => (
        <input key={key} type="number" value={value[key]} onChange={(event) => onChange({ ...value, [key]: numberValue(event.target.value) })} placeholder={key.toUpperCase()} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold" />
      ))}
    </div>
  );
}

function AdminSelect({ value, options, placeholder, onChange }: { value: string; options: string[]; placeholder: string; onChange: (value: string) => void }) {
  const selectOptions = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold">
      <option value="">{placeholder}</option>
      {selectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

export default FertilizerCalculator;
