// Agronix Field Diagnosis — crop-wise disease & symptom dataset.
// Disease/symptom records are generated from diseaseSymptoms.json, which
// consolidates the TNAU Agritech Crop Protection Portal reference data.
// Where the source does not specify a growth stage, records use 'UNKNOWN'
// rather than an inferred value.

import sourceData from './diseaseSymptoms.json';

export const UNKNOWN_STAGE = 'UNKNOWN';

export interface FdCrop {
  id: string;
  name: string;
  category: string;
  image?: string;
}

export interface FdStage {
  code: string;
  label: string;
  hint?: string;
}

export interface FdPlantPart {
  code: string;
  label: string;
}

export interface FdSymptomDef {
  id: string;
  label: string;
  parts: string[];
}

export type FdTraitKey = 'lesionShape' | 'lesionCentre' | 'distribution' | 'severity';

export interface FdDisease {
  id: string;
  cropId: string;
  name: string;
  scientificName: string;
  type: string;
  parts: string[];
  stages: string[];
  overview: string;
  references: { label: string; url: string }[];
  symptomWeights: Record<string, number>;
  traits: Partial<Record<FdTraitKey, string[]>>;
}

// ---------------------------------------------------------------------------
// Crops (TNAU coverage: cereals & millets, pulses, oilseeds, cash crops)
// ---------------------------------------------------------------------------

export const FD_CROPS: FdCrop[] = [
  { id: 'paddy', name: 'Paddy (Rice)', category: 'Cereals & Millets', image: '/images/paddy.webp' },
  { id: 'maize', name: 'Maize', category: 'Cereals & Millets', image: '/images/maize.webp' },
  { id: 'sorghum', name: 'Sorghum', category: 'Cereals & Millets' },
  { id: 'pearl-millet', name: 'Pearl Millet', category: 'Cereals & Millets' },
  { id: 'wheat', name: 'Wheat', category: 'Cereals & Millets' },
  { id: 'ragi', name: 'Ragi', category: 'Cereals & Millets' },
  { id: 'redgram', name: 'Redgram', category: 'Pulses', image: '/images/pulses.webp' },
  { id: 'greengram', name: 'Greengram', category: 'Pulses', image: '/images/greengram.webp' },
  { id: 'blackgram', name: 'Blackgram', category: 'Pulses', image: '/images/pulses.webp' },
  { id: 'cowpea', name: 'Cowpea', category: 'Pulses', image: '/images/pulses.webp' },
  { id: 'chickpea', name: 'Chickpea', category: 'Pulses', image: '/images/pulses.webp' },
  { id: 'soybean', name: 'Soybean', category: 'Pulses', image: '/images/pulses.webp' },
  { id: 'groundnut', name: 'Groundnut', category: 'Oilseeds', image: '/images/groundnut.webp' },
  { id: 'sunflower', name: 'Sunflower', category: 'Oilseeds', image: '/images/oilseeds.webp' },
  { id: 'castor', name: 'Castor', category: 'Oilseeds', image: '/images/oilseeds.webp' },
  { id: 'sesame', name: 'Sesame', category: 'Oilseeds', image: '/images/sesamum.webp' },
  { id: 'rapeseed-mustard', name: 'Rapeseed & Mustard', category: 'Oilseeds', image: '/images/oilseeds.webp' },
  { id: 'safflower', name: 'Safflower', category: 'Oilseeds', image: '/images/oilseeds.webp' },
  { id: 'cotton', name: 'Cotton', category: 'Cash Crops', image: '/images/cotton.webp' },
  { id: 'sugarcane', name: 'Sugarcane', category: 'Cash Crops' },
  { id: 'tobacco', name: 'Tobacco', category: 'Cash Crops' },
];

// ---------------------------------------------------------------------------
// Growth stages — crop specific; UNKNOWN retained where the source is silent
// ---------------------------------------------------------------------------

const PADDY_STAGES: FdStage[] = [
  { code: 'NURSERY', label: 'Nursery', hint: '0–25 days' },
  { code: 'SEEDLING', label: 'Seedling', hint: '25–40 days' },
  { code: 'TILLERING', label: 'Tillering', hint: '40–65 days' },
  { code: 'STEM_ELONGATION', label: 'Stem Elongation', hint: '65–80 days' },
  { code: 'BOOTING', label: 'Booting', hint: '80–95 days' },
  { code: 'HEADING', label: 'Heading', hint: '95–110 days' },
  { code: 'FLOWERING', label: 'Flowering', hint: '110–115 days' },
  { code: 'GRAIN_FILLING', label: 'Grain Filling', hint: '115–140 days' },
  { code: 'MATURITY', label: 'Maturity', hint: '>140 days' },
];

const COTTON_STAGES: FdStage[] = [
  { code: 'SEEDLING', label: 'Seedling' },
  { code: 'SQUARE_FORMATION', label: 'Square Formation' },
  { code: 'FLOWERING', label: 'Flowering' },
  { code: 'BOLL_FORMATION', label: 'Boll Formation' },
  { code: 'BOLL_DEVELOPMENT', label: 'Boll Development' },
  { code: 'MATURITY', label: 'Maturity' },
];

const GENERIC_STAGES: FdStage[] = [
  { code: 'GERMINATION', label: 'Germination' },
  { code: 'SEEDLING', label: 'Seedling' },
  { code: 'VEGETATIVE', label: 'Vegetative Growth' },
  { code: 'FLOWERING', label: 'Flowering' },
  { code: 'POD_FRUIT_FORMATION', label: 'Pod / Fruit Formation' },
  { code: 'MATURITY', label: 'Maturity' },
];

const MAIZE_STAGES: FdStage[] = [
  { code: 'SEEDLING', label: 'Seedling' },
  { code: 'VEGETATIVE', label: 'Vegetative Growth' },
  { code: 'TASSELING', label: 'Tasseling' },
  { code: 'SILKING', label: 'Silking' },
  { code: 'GRAIN_FILLING', label: 'Grain Filling' },
  { code: 'MATURITY', label: 'Maturity' },
];

export function getGrowthStages(cropId: string): FdStage[] {
  switch (cropId) {
    case 'paddy':
      return PADDY_STAGES;
    case 'cotton':
      return COTTON_STAGES;
    case 'maize':
    case 'sorghum':
    case 'pearl-millet':
    case 'wheat':
    case 'ragi':
      return MAIZE_STAGES;
    default:
      return GENERIC_STAGES;
  }
}

// ---------------------------------------------------------------------------
// Plant parts
// ---------------------------------------------------------------------------

export const FD_PLANT_PARTS: FdPlantPart[] = [
  { code: 'ROOT', label: 'Root' },
  { code: 'COLLAR', label: 'Collar Region' },
  { code: 'STEM_BASE', label: 'Stem Base' },
  { code: 'STEM', label: 'Stem' },
  { code: 'NODE', label: 'Node' },
  { code: 'PETIOLE', label: 'Petiole' },
  { code: 'LEAF', label: 'Leaf' },
  { code: 'LEAF_TIP', label: 'Leaf Tip' },
  { code: 'LEAF_MARGIN', label: 'Leaf Margin' },
  { code: 'LEAF_SHEATH', label: 'Leaf Sheath' },
  { code: 'FLOWER', label: 'Flower' },
  { code: 'BUD', label: 'Bud' },
  { code: 'FRUIT', label: 'Fruit' },
  { code: 'BOLL', label: 'Boll' },
  { code: 'POD', label: 'Pod' },
  { code: 'PANICLE', label: 'Panicle' },
  { code: 'NECK', label: 'Neck' },
  { code: 'GRAIN', label: 'Grain' },
  { code: 'SEED', label: 'Seed' },
  { code: 'SEEDLING', label: 'Seedling' },
  { code: 'WHOLE_PLANT', label: 'Whole Plant' },
];

export function plantPartLabel(code: string): string {
  return FD_PLANT_PARTS.find((p) => p.code === code)?.label || code;
}

// ---------------------------------------------------------------------------
// Diagnostic questions (symptom characteristics — additional details)
// ---------------------------------------------------------------------------

export const FD_TRAIT_QUESTIONS: { key: FdTraitKey; label: string; options: string[] }[] = [
  { key: 'lesionShape', label: 'Lesion shape', options: ['Spindle-shaped', 'Round', 'Irregular', 'Unknown'] },
  { key: 'lesionCentre', label: 'Lesion centre colour', options: ['Grey / Ashy', 'Brown', 'Black', 'Unknown'] },
  { key: 'distribution', label: 'Distribution in field', options: ['Few plants', 'Many plants', 'Patchy', 'Throughout field'] },
  { key: 'severity', label: 'Severity', options: ['Mild', 'Moderate', 'Severe'] },
];

const TRAIT_WEIGHT = 3;

const TNAU_PORTAL = 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_diseases_agri.html';

// ---------------------------------------------------------------------------
// Source JSON → app structures
// ---------------------------------------------------------------------------

interface SourceDisease {
  disease_name: string;
  plant_parts_affected?: string[];
  symptoms?: string[];
  diagnostic_features?: string[];
}

interface SourceCrop {
  crop_name: string;
  category: string;
  diseases: SourceDisease[];
}

const CROP_NAME_TO_ID: Record<string, string> = {
  'rice (paddy)': 'paddy',
  'sorghum (jowar)': 'sorghum',
  maize: 'maize',
  'cumbu (pearl millet)': 'pearl-millet',
  wheat: 'wheat',
  'ragi (finger millet)': 'ragi',
  'redgram (pigeon pea)': 'redgram',
  'blackgram (urad)': 'blackgram',
  'greengram (mungbean)': 'greengram',
  cowpea: 'cowpea',
  'chickpea (bengal gram)': 'chickpea',
  soybean: 'soybean',
  sunflower: 'sunflower',
  groundnut: 'groundnut',
  castor: 'castor',
  'gingelly (sesame)': 'sesame',
  'rapeseed and mustard': 'rapeseed-mustard',
  safflower: 'safflower',
  cotton: 'cotton',
  sugarcane: 'sugarcane',
  tobacco: 'tobacco',
};

const PART_NAME_MAP: Record<string, string> = {
  leaves: 'LEAF',
  leaf: 'LEAF',
  midrib: 'LEAF',
  'leaf sheaths': 'LEAF_SHEATH',
  'leaf sheath': 'LEAF_SHEATH',
  'panicle neck': 'NECK',
  neck: 'NECK',
  panicle: 'PANICLE',
  panicles: 'PANICLE',
  'finger-like spikes': 'PANICLE',
  ear: 'PANICLE',
  ears: 'PANICLE',
  grains: 'GRAIN',
  grain: 'GRAIN',
  seeds: 'SEED',
  seed: 'SEED',
  setts: 'SEED',
  'whole plant': 'WHOLE_PLANT',
  seedlings: 'SEEDLING',
  seedling: 'SEEDLING',
  shoots: 'SEEDLING',
  stem: 'STEM',
  stems: 'STEM',
  stalks: 'STEM',
  stalk: 'STEM',
  branches: 'STEM',
  'vascular tissues': 'STEM',
  'stem base': 'STEM_BASE',
  collar: 'COLLAR',
  roots: 'ROOT',
  root: 'ROOT',
  pegs: 'ROOT',
  pods: 'POD',
  pod: 'POD',
  capsules: 'FRUIT',
  bolls: 'BOLL',
  flowers: 'FLOWER',
  flower: 'FLOWER',
  'flower head': 'FLOWER',
  head: 'FLOWER',
  inflorescence: 'FLOWER',
  tassels: 'FLOWER',
  petioles: 'PETIOLE',
  petiole: 'PETIOLE',
  'growing point': 'WHOLE_PLANT',
  'growing points': 'WHOLE_PLANT',
};

function mapPart(name: string): string {
  return PART_NAME_MAP[name.trim().toLowerCase()] || 'WHOLE_PLANT';
}

// Past-participle forms used after "have" in modal phrases ("may appear" → "may have appeared")
const AUX_PARTICIPLE: Record<string, string> = {
  be: 'been', become: 'become', break: 'broken', cause: 'caused', collapse: 'collapsed',
  cover: 'covered', crack: 'cracked', develop: 'developed', die: 'died', drop: 'dropped',
  dry: 'dried', enlarge: 'enlarged', fall: 'fallen', form: 'formed', girdle: 'girdled',
  hang: 'hung', merge: 'merged', occur: 'occurred', produce: 'produced', remain: 'remained',
  result: 'resulted', rot: 'rotted', shrivel: 'shriveled', split: 'split', spread: 'spread',
  stunt: 'stunted', turn: 'turned', wilt: 'wilted', appear: 'appeared', show: 'shown',
};

// Simple-past forms for standalone present-tense verbs in symptom text
const SIMPLE_PAST: Record<string, string> = {
  develop: 'developed', develops: 'developed', become: 'became', becomes: 'became',
  wilt: 'wilted', wilts: 'wilted', turn: 'turned', turns: 'turned',
  cause: 'caused', causes: 'caused', die: 'died', dies: 'died',
  enlarge: 'enlarged', enlarges: 'enlarged', dry: 'dried', dries: 'dried',
  rot: 'rotted', rots: 'rotted', merge: 'merged', merges: 'merged',
  show: 'showed', shows: 'showed', appear: 'appeared', appears: 'appeared',
  produce: 'produced', produces: 'produced', spread: 'spread', spreads: 'spread',
  fall: 'fell', falls: 'fell', drop: 'dropped', drops: 'dropped',
  collapse: 'collapsed', collapses: 'collapsed', split: 'split', splits: 'split',
  shrivel: 'shriveled', shrivels: 'shriveled', crack: 'cracked', cracks: 'cracked',
  ooze: 'oozed', oozes: 'oozed', exude: 'exuded', exudes: 'exuded',
  girdle: 'girdled', girdles: 'girdled', stunt: 'stunted', stunts: 'stunted',
  dwarf: 'dwarfed', dwarfs: 'dwarfed', cover: 'covered', covers: 'covered',
  result: 'resulted', results: 'resulted', remain: 'remained', remains: 'remained',
  occur: 'occurred', occurs: 'occurred', discolor: 'discolored', discolors: 'discolored',
  form: 'formed', forms: 'formed', break: 'broke', breaks: 'broke',
  hang: 'hung', hangs: 'hung', extend: 'extended', extends: 'extended',
  swell: 'swelled', swells: 'swelled', burst: 'burst', bursts: 'burst',
  bend: 'bent', bends: 'bent', kill: 'killed', kills: 'killed',
  expand: 'expanded', expands: 'expanded', lose: 'lost', loses: 'lost',
};

// Convert present-tense symptom descriptions into past-tense observations.
export function toPastTense(text: string): string {
  const protectedSpans: string[] = [];
  let out = text.replace(/\b(may|can|could|might)\s+([a-z]+)\b/gi, (_m, aux: string, verb: string) => {
    const pp = AUX_PARTICIPLE[verb.toLowerCase()] || `${verb}ed`;
    const placeholder = `__FDPH${protectedSpans.length}__`;
    protectedSpans.push(`${aux.toLowerCase()} have ${pp}`);
    return placeholder;
  });
  out = out.replace(/\bis\b/g, 'was').replace(/\bare\b/g, 'were');
  for (const [present, past] of Object.entries(SIMPLE_PAST)) {
    out = out.replace(new RegExp(`\\b${present}\\b`, 'g'), past);
  }
  return out.replace(/__FDPH(\d+)__/g, (_m, i) => protectedSpans[Number(i)]);
}

function symptomId(cropId: string, index: number): string {
  return `${cropId}-s${index}`;
}

function diseaseId(cropId: string, name: string): string {
  return `${cropId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

interface BuiltCropData {
  symptoms: FdSymptomDef[];
  diseases: FdDisease[];
}

function buildCropData(source: SourceCrop): BuiltCropData | null {
  const cropId = CROP_NAME_TO_ID[source.crop_name.trim().toLowerCase()];
  if (!cropId) return null;

  // Shared symptom list: same description shared across diseases maps to one id.
  const symptomIndex = new Map<string, { id: string; label: string; parts: Set<string>; diseaseCount: number }>();
  const diseaseSymptomIds: Map<string, string[]> = new Map();

  for (const disease of source.diseases) {
    const ids: string[] = [];
    for (const symptom of disease.symptoms || []) {
      const key = symptom.trim().toLowerCase();
      const parts = (disease.plant_parts_affected || []).map(mapPart);
      const existing = symptomIndex.get(key);
      if (existing) {
        parts.forEach((p) => existing.parts.add(p));
        existing.diseaseCount += 1;
        ids.push(existing.id);
      } else {
        const id = symptomId(cropId, symptomIndex.size);
        symptomIndex.set(key, { id, label: toPastTense(symptom.trim()), parts: new Set(parts), diseaseCount: 1 });
        ids.push(id);
      }
    }
    diseaseSymptomIds.set(disease.disease_name, ids);
  }

  const symptoms: FdSymptomDef[] = Array.from(symptomIndex.values()).map((s) => ({
    id: s.id,
    label: s.label,
    parts: Array.from(s.parts),
  }));

  const diseases: FdDisease[] = source.diseases.map((disease) => {
    const ids = diseaseSymptomIds.get(disease.disease_name) || [];
    const weights: Record<string, number> = {};
    ids.forEach((id) => {
      const entry = Array.from(symptomIndex.values()).find((s) => s.id === id);
      // Distinctive symptoms (seen in fewer diseases of this crop) weigh more.
      const count = entry?.diseaseCount || 1;
      weights[id] = count === 1 ? 5 : count === 2 ? 4 : count === 3 ? 3 : 2;
    });
    return {
      id: diseaseId(cropId, disease.disease_name),
      cropId,
      name: disease.disease_name,
      scientificName: '',
      type: '',
      parts: Array.from(new Set((disease.plant_parts_affected || []).map(mapPart))),
      stages: [UNKNOWN_STAGE],
      overview: (disease.symptoms || []).join(' '),
      references: [{ label: 'TNAU Agritech Crop Protection Portal', url: TNAU_PORTAL }],
      symptomWeights: weights,
      traits: {},
    };
  });

  return { symptoms, diseases };
}

const BUILT: { symptoms: Record<string, FdSymptomDef[]>; diseases: FdDisease[] } = (() => {
  const symptoms: Record<string, FdSymptomDef[]> = {};
  const diseases: FdDisease[] = [];
  for (const crop of (sourceData as unknown as { crops: SourceCrop[] }).crops) {
    const built = buildCropData(crop);
    if (!built) continue;
    const cropId = CROP_NAME_TO_ID[crop.crop_name.trim().toLowerCase()];
    symptoms[cropId] = built.symptoms;
    diseases.push(...built.diseases);
  }
  return { symptoms, diseases };
})();

export const FD_SYMPTOMS: Record<string, FdSymptomDef[]> = BUILT.symptoms;
export const FD_DISEASES: FdDisease[] = BUILT.diseases;

export function getSymptoms(cropId: string): FdSymptomDef[] {
  return FD_SYMPTOMS[cropId] || [];
}

export function getDiseasesForCrop(cropId: string): FdDisease[] {
  return FD_DISEASES.filter((d) => d.cropId === cropId);
}

// ---------------------------------------------------------------------------
// Scoring (spec section 8)
// ---------------------------------------------------------------------------

export type FdObservation = 'present' | 'partial' | 'contradictory' | 'unknown' | 'unchecked';

const OBSERVATION_VALUE: Record<FdObservation, number | null> = {
  present: 1,
  partial: 0.5,
  contradictory: -1,
  unknown: null, // excluded
  unchecked: null, // excluded
};

export interface FdScoreInput {
  selectedSymptomIds: string[];
  partialSymptomIds?: string[];
  traitAnswers: Partial<Record<FdTraitKey, string>>;
}

export interface FdDiseaseScore {
  disease: FdDisease;
  score: number;
  rawScore: number;
  maxScore: number;
  matchedSymptoms: string[];
  missingSymptoms: string[];
  contradictoryTraits: string[];
  hasData: boolean;
}

export function scoreDisease(disease: FdDisease, symptomDefs: FdSymptomDef[], input: FdScoreInput): FdDiseaseScore {
  const defById = new Map(symptomDefs.map((s) => [s.id, s]));
  const partial = new Set(input.partialSymptomIds || []);

  let raw = 0;
  let max = 0;
  const matched: string[] = [];
  const missing: string[] = [];

  for (const [symId, weight] of Object.entries(disease.symptomWeights)) {
    max += weight;
    if (input.selectedSymptomIds.includes(symId)) {
      const v = partial.has(symId) ? 0.5 : 1;
      raw += weight * v;
      matched.push(defById.get(symId)?.label || symId);
    } else {
      missing.push(defById.get(symId)?.label || symId);
    }
  }

  const contradictoryTraits: string[] = [];
  for (const question of FD_TRAIT_QUESTIONS) {
    const answer = input.traitAnswers[question.key];
    if (!answer || answer === 'Unknown') continue; // unknown → excluded
    const expected = disease.traits[question.key];
    if (!expected || expected.length === 0) continue;
    max += TRAIT_WEIGHT;
    if (expected.includes(answer)) {
      raw += TRAIT_WEIGHT;
    } else {
      raw -= TRAIT_WEIGHT;
      contradictoryTraits.push(`${question.label}: observed "${answer}"`);
    }
  }

  const hasData = Object.keys(disease.symptomWeights).length > 0;
  const score = max > 0 ? Math.max(0, Math.round((raw / max) * 100)) : 0;
  return {
    disease,
    score,
    rawScore: raw,
    maxScore: max,
    matchedSymptoms: matched,
    missingSymptoms: missing,
    contradictoryTraits,
    hasData,
  };
}

export function matchTier(score: number): { label: string; badge: string } {
  if (score >= 70) return { label: 'High Match', badge: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' };
  if (score >= 40) return { label: 'Possible', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' };
  return { label: 'Low Match', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' };
}

export const OBSERVATION_VALUES = OBSERVATION_VALUE;
