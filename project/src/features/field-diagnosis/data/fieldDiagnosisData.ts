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

export type FdTraitKey = 'lesionShape' | 'lesionCentre' | 'lesionMargin' | 'distribution' | 'severity';

export interface FdDisease {
  id: string;
  cropId: string;
  name: string;
  scientificName: string;
  type: string;
  parts: string[];
  stages: string[];
  overview: string;
  differentials: string[];
  distinguishing: string[];
  provisional: boolean;
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
  { code: 'GERMINATION', label: 'Seed Germination' },
  { code: 'NURSERY', label: 'Nursery' },
  { code: 'SEEDLING', label: 'Seedling' },
  { code: 'EARLY_TILLERING', label: 'Early Tillering' },
  { code: 'ACTIVE_TILLERING', label: 'Active Tillering' },
  { code: 'MAX_TILLERING', label: 'Maximum Tillering' },
  { code: 'PANICLE_INITIATION', label: 'Panicle Initiation' },
  { code: 'BOOTING', label: 'Booting' },
  { code: 'HEADING', label: 'Heading' },
  { code: 'FLOWERING', label: 'Flowering' },
  { code: 'GRAIN_FILLING', label: 'Grain Filling' },
  { code: 'MATURITY', label: 'Maturity' },
];

const COTTON_STAGES: FdStage[] = [
  { code: 'SEEDLING', label: 'Seedling' },
  { code: 'VEGETATIVE', label: 'Vegetative' },
  { code: 'SQUARING', label: 'Squaring' },
  { code: 'FLOWERING', label: 'Flowering' },
  { code: 'BOLL_FORMATION', label: 'Boll Formation' },
  { code: 'BOLL_DEVELOPMENT', label: 'Boll Development' },
  { code: 'BOLL_OPENING', label: 'Boll Opening' },
  { code: 'HARVEST_MATURITY', label: 'Harvest Maturity' },
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
  { code: 'HYPOCOTYL', label: 'Hypocotyl' },
  { code: 'STEM_BASE', label: 'Stem Base' },
  { code: 'STEM', label: 'Stem' },
  { code: 'BRANCH', label: 'Branches' },
  { code: 'VASCULAR', label: 'Vascular Tissue' },
  { code: 'NODE', label: 'Node' },
  { code: 'PETIOLE', label: 'Petiole' },
  { code: 'LEAF', label: 'Leaf' },
  { code: 'LEAF_BLADE', label: 'Leaf Blade' },
  { code: 'LEAF_TIP', label: 'Leaf Tip' },
  { code: 'LEAF_MARGIN', label: 'Leaf Margin' },
  { code: 'LEAF_VEIN', label: 'Leaf Veins' },
  { code: 'LEAF_SHEATH', label: 'Leaf Sheath' },
  { code: 'LOWER_SHEATH', label: 'Lower Leaf Sheath' },
  { code: 'UPPER_SHEATH', label: 'Upper Leaf Sheath' },
  { code: 'FLAG_LEAF', label: 'Flag Leaf' },
  { code: 'GROWING_POINT', label: 'Growing Point' },
  { code: 'FLOWER', label: 'Flower' },
  { code: 'SQUARE', label: 'Squares / Flower Buds' },
  { code: 'BUD', label: 'Bud' },
  { code: 'FRUIT', label: 'Fruit' },
  { code: 'BOLL', label: 'Boll' },
  { code: 'YOUNG_BOLL', label: 'Young Bolls' },
  { code: 'MATURE_BOLL', label: 'Mature Bolls' },
  { code: 'BOLL_SURFACE', label: 'Boll Surface' },
  { code: 'BOLL_LINT', label: 'Boll Interior / Lint' },
  { code: 'POD', label: 'Pod' },
  { code: 'PANICLE', label: 'Panicle' },
  { code: 'SPIKELET', label: 'Spikelets' },
  { code: 'NECK', label: 'Panicle Neck' },
  { code: 'GRAIN', label: 'Grain' },
  { code: 'SEED', label: 'Seed' },
  { code: 'SEEDLING', label: 'Seedling' },
  { code: 'WHOLE_PLANT', label: 'Whole Plant' },
];

const PART_BY_CODE = new Map(FD_PLANT_PARTS.map((p) => [p.code, p]));

// Crop-specific selectable part lists (spec §3 cotton, §6 paddy).
const PADDY_PART_CODES = ['ROOT', 'SEED', 'SEEDLING', 'STEM_BASE', 'NODE', 'LOWER_SHEATH', 'UPPER_SHEATH', 'LEAF_BLADE', 'LEAF_TIP', 'LEAF_MARGIN', 'FLAG_LEAF', 'NECK', 'PANICLE', 'SPIKELET', 'GRAIN', 'WHOLE_PLANT'];
const COTTON_PART_CODES = ['ROOT', 'SEED', 'SEEDLING', 'COLLAR', 'HYPOCOTYL', 'STEM', 'BRANCH', 'VASCULAR', 'LEAF', 'LEAF_MARGIN', 'LEAF_VEIN', 'PETIOLE', 'GROWING_POINT', 'SQUARE', 'FLOWER', 'YOUNG_BOLL', 'MATURE_BOLL', 'BOLL_SURFACE', 'BOLL_LINT', 'WHOLE_PLANT'];
const GENERIC_PART_CODES = ['ROOT', 'COLLAR', 'STEM_BASE', 'STEM', 'NODE', 'PETIOLE', 'LEAF', 'LEAF_TIP', 'LEAF_MARGIN', 'LEAF_VEIN', 'LEAF_SHEATH', 'GROWING_POINT', 'FLOWER', 'BUD', 'FRUIT', 'BOLL', 'POD', 'PANICLE', 'NECK', 'GRAIN', 'SEED', 'SEEDLING', 'WHOLE_PLANT'];

export function getPlantParts(cropId: string): FdPlantPart[] {
  const codes = cropId === 'paddy' ? PADDY_PART_CODES : cropId === 'cotton' ? COTTON_PART_CODES : GENERIC_PART_CODES;
  return codes.map((c) => PART_BY_CODE.get(c)!).filter(Boolean);
}

// Selecting a fine-grained part also matches symptoms tagged to the broader
// part (and vice versa); whole-plant symptoms always remain visible.
const PART_FAMILY: Record<string, string[]> = {
  ROOT: ['ROOT'],
  COLLAR: ['COLLAR', 'STEM_BASE', 'HYPOCOTYL'],
  HYPOCOTYL: ['COLLAR', 'STEM_BASE', 'HYPOCOTYL'],
  STEM_BASE: ['COLLAR', 'STEM_BASE', 'HYPOCOTYL'],
  STEM: ['STEM', 'STEM_BASE', 'NODE', 'BRANCH', 'VASCULAR'],
  BRANCH: ['STEM', 'BRANCH'],
  VASCULAR: ['STEM', 'VASCULAR'],
  NODE: ['STEM', 'NODE'],
  PETIOLE: ['PETIOLE', 'LEAF'],
  LEAF: ['LEAF', 'LEAF_BLADE', 'FLAG_LEAF', 'LEAF_TIP', 'LEAF_MARGIN', 'LEAF_VEIN', 'PETIOLE'],
  LEAF_BLADE: ['LEAF', 'LEAF_BLADE', 'FLAG_LEAF'],
  LEAF_TIP: ['LEAF', 'LEAF_TIP'],
  LEAF_MARGIN: ['LEAF', 'LEAF_MARGIN'],
  LEAF_VEIN: ['LEAF', 'LEAF_VEIN'],
  LEAF_SHEATH: ['LEAF_SHEATH', 'LOWER_SHEATH', 'UPPER_SHEATH'],
  LOWER_SHEATH: ['LEAF_SHEATH', 'LOWER_SHEATH'],
  UPPER_SHEATH: ['LEAF_SHEATH', 'UPPER_SHEATH'],
  FLAG_LEAF: ['LEAF', 'LEAF_BLADE', 'FLAG_LEAF'],
  GROWING_POINT: ['GROWING_POINT', 'WHOLE_PLANT'],
  FLOWER: ['FLOWER', 'BUD', 'SQUARE'],
  SQUARE: ['FLOWER', 'BUD', 'SQUARE'],
  BUD: ['FLOWER', 'BUD', 'SQUARE'],
  FRUIT: ['FRUIT'],
  BOLL: ['BOLL', 'YOUNG_BOLL', 'MATURE_BOLL', 'BOLL_SURFACE', 'BOLL_LINT'],
  YOUNG_BOLL: ['BOLL', 'YOUNG_BOLL', 'BOLL_SURFACE'],
  MATURE_BOLL: ['BOLL', 'MATURE_BOLL', 'BOLL_SURFACE'],
  BOLL_SURFACE: ['BOLL', 'BOLL_SURFACE'],
  BOLL_LINT: ['BOLL', 'BOLL_LINT'],
  POD: ['POD'],
  PANICLE: ['PANICLE', 'NECK', 'SPIKELET'],
  SPIKELET: ['PANICLE', 'SPIKELET', 'GRAIN'],
  NECK: ['PANICLE', 'NECK'],
  GRAIN: ['GRAIN', 'SPIKELET', 'SEED'],
  SEED: ['SEED', 'GRAIN'],
  SEEDLING: ['SEEDLING', 'WHOLE_PLANT'],
  WHOLE_PLANT: ['WHOLE_PLANT'],
};

// Selected part codes → the set of part codes a symptom can be tagged with.
// Selecting WHOLE_PLANT expands to every part: an officer inspecting the whole
// plant can observe symptoms anywhere, so nothing should be filtered out.
export function expandPartSelection(selected: string[]): Set<string> {
  const out = new Set<string>(selected);
  for (const code of selected) {
    for (const p of PART_FAMILY[code] || [code]) out.add(p);
  }
  if (selected.length > 0) out.add('WHOLE_PLANT');
  if (selected.includes('WHOLE_PLANT')) {
    for (const code of Object.keys(PART_FAMILY)) out.add(code);
  }
  return out;
}

export function plantPartLabel(code: string): string {
  return FD_PLANT_PARTS.find((p) => p.code === code)?.label || code;
}

// ---------------------------------------------------------------------------
// Diagnostic questions (symptom characteristics — additional details)
// ---------------------------------------------------------------------------

export const FD_TRAIT_QUESTIONS: { key: FdTraitKey; label: string; options: string[] }[] = [
  { key: 'lesionShape', label: 'Lesion shape', options: ['Spindle-shaped', 'Diamond-shaped', 'Circular', 'Oval', 'Elliptical', 'Linear / streak', 'Irregular', 'Elongated', 'No distinct lesion', 'Unknown'] },
  { key: 'lesionCentre', label: 'Lesion colour', options: ['Pale green', 'Yellow', 'Straw-yellow', 'Brown', 'Dark brown', 'Reddish-brown', 'Grey / Ashy', 'Whitish-grey', 'Black', 'Translucent', 'Unknown'] },
  { key: 'lesionMargin', label: 'Lesion margin', options: ['Dark brown margin', 'Reddish-brown margin', 'Yellow halo', 'Wavy margin', 'Diffuse margin', 'Distinct margin', 'No distinct margin', 'Unknown'] },
  { key: 'distribution', label: 'Distribution in field', options: ['Single plant', 'Scattered plants', 'Localized patches', 'Multiple patches', 'Widespread across field'] },
  { key: 'severity', label: 'Severity', options: ['Absent', 'Mild', 'Moderate', 'Severe', 'Very severe'] },
];

const TRAIT_WEIGHT = 3;
const TRAIT_EXCLUDED_ANSWERS = new Set(['Unknown', 'Absent', 'No distinct lesion', 'No distinct margin']);

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
  branches: 'BRANCH',
  branch: 'BRANCH',
  'vascular tissues': 'VASCULAR',
  'vascular tissue': 'VASCULAR',
  'main stem vascular tissue': 'VASCULAR',
  'stem base': 'STEM_BASE',
  'basal stem': 'STEM_BASE',
  'stem nodes': 'NODE',
  nodes: 'NODE',
  hypocotyl: 'HYPOCOTYL',
  'root collar': 'COLLAR',
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
  'leaf petiole': 'PETIOLE',
  'growing point': 'GROWING_POINT',
  'growing points': 'GROWING_POINT',
  'leaf blade': 'LEAF_BLADE',
  'leaf blades': 'LEAF_BLADE',
  'leaf tip': 'LEAF_TIP',
  'leaf margin': 'LEAF_MARGIN',
  'leaf margins': 'LEAF_MARGIN',
  'leaf veins': 'LEAF_VEIN',
  veins: 'LEAF_VEIN',
  'lower leaf sheath': 'LOWER_SHEATH',
  'upper leaf sheath': 'UPPER_SHEATH',
  'flag leaf': 'FLAG_LEAF',
  spikelets: 'SPIKELET',
  spikelet: 'SPIKELET',
  'flower buds': 'SQUARE',
  'flower buds / squares': 'SQUARE',
  squares: 'SQUARE',
  buds: 'BUD',
  'young bolls': 'YOUNG_BOLL',
  'mature bolls': 'MATURE_BOLL',
  'boll surface': 'BOLL_SURFACE',
  'boll interior': 'BOLL_LINT',
  'boll interior / lint': 'BOLL_LINT',
  lint: 'BOLL_LINT',
  'young leaves': 'LEAF',
  'lower stem': 'STEM_BASE',
  'root system': 'ROOT',
};

function mapPart(name: string): string {
  return PART_NAME_MAP[name.trim().toLowerCase()] || 'WHOLE_PLANT';
}

// Detect which plant part a symptom sentence is about, so "neck turned black"
// isn't shown when the officer selected Leaf (symptoms were previously tagged
// with every part of the parent disease).
const SYMPTOM_PART_PATTERNS: [RegExp, string][] = [
  [/\broot[s]?\b|\brhizosphere\b/i, 'ROOT'],
  [/\broot collar\b|\bcollar\b/i, 'COLLAR'],
  [/\bhypocotyl\b/i, 'HYPOCOTYL'],
  [/\bstem base\b|\bbasal stem\b/i, 'STEM_BASE'],
  [/\bstem node[s]?\b|\bnode[s]?\b/i, 'NODE'],
  [/\bbranch(?:es)?\b/i, 'BRANCH'],
  [/\bvascular\b/i, 'VASCULAR'],
  [/\bstem[s]?\b|\bstalk[s]?\b/i, 'STEM'],
  [/\bflag leaf\b|\bflag leaves\b/i, 'FLAG_LEAF'],
  [/\bleaf tip[s]?\b|\bleaf apex\b/i, 'LEAF_TIP'],
  [/\bleaf margin[s]?\b/i, 'LEAF_MARGIN'],
  [/\bleaf vein[s]?\b|\bvein[s]?\b|\bveinlet[s]?\b|\bmidrib[s]?\b/i, 'LEAF_VEIN'],
  [/\bleaf sheath\b|\bsheath\b|\bsheaths\b/i, 'LEAF_SHEATH'],
  [/\bleaf blade[s]?\b|\bleaf\b|\bleaves\b|\bleaflet[s]?\b|\bfoliage\b/i, 'LEAF'],
  [/\bpetiole[s]?\b/i, 'PETIOLE'],
  [/\bgrowing point[s]?\b|\bshoot tip[s]?\b/i, 'GROWING_POINT'],
  [/\bseedling[s]?\b|\bshoot[s]?\b/i, 'SEEDLING'],
  [/\bflower[s]?\b|\bblossom[s]?\b|\binflorescence\b|\btassel[s]?\b|\bflower head\b/i, 'FLOWER'],
  [/\bsquare[s]?\b|\bflower bud[s]?\b/i, 'SQUARE'],
  [/\bbud[s]?\b/i, 'BUD'],
  [/\bfruit[s]?\b|\bcapsule[s]?\b|\bberr(?:y|ies)\b/i, 'FRUIT'],
  [/\byoung boll[s]?\b/i, 'YOUNG_BOLL'],
  [/\bmature boll[s]?\b/i, 'MATURE_BOLL'],
  [/\bboll surface\b/i, 'BOLL_SURFACE'],
  [/\blint\b|\bboll interior\b/i, 'BOLL_LINT'],
  [/\bboll[s]?\b/i, 'BOLL'],
  [/\bpod[s]?\b/i, 'POD'],
  [/\bpanicle neck\b|\bneck\b/i, 'NECK'],
  [/\bpanicle[s]?\b|\bear[s]?\b|\bearhead[s]?\b|\bspike[s]?\b/i, 'PANICLE'],
  [/\bspikelet[s]?\b|\bfloret[s]?\b/i, 'SPIKELET'],
  [/\bgrain[s]?\b|\bkernel[s]?\b|\bglume[s]?\b/i, 'GRAIN'],
  [/\bseed[s]?\b|\bsett[s]?\b/i, 'SEED'],
];

function detectSymptomParts(text: string): Set<string> {
  const found = new Set<string>();
  for (const [re, code] of SYMPTOM_PART_PATTERNS) {
    if (re.test(text)) found.add(code);
  }
  return found;
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

// ---------------------------------------------------------------------------
// Curated disease metadata + supplemental records (cotton & paddy spec)
// Keyed by `${cropId}::${disease_name.toLowerCase()}`.
// ---------------------------------------------------------------------------

interface DiseaseMeta {
  scientificName?: string;
  type?: string;
  differentials?: string[];
  distinguishing?: string[];
  provisional?: boolean;
  traits?: Partial<Record<FdTraitKey, string[]>>;
  stages?: string[]; // explicit stage codes; 'ALL' expands to the crop's stages
}

const ALL = '__ALL__';

const DISEASE_META: Record<string, DiseaseMeta> = {
  // ---------------- Paddy ----------------
  'paddy::blast': {
    scientificName: 'Magnaporthe oryzae', type: 'Fungal',
    differentials: ['Brown spot', 'Sheath blight'],
    distinguishing: ['Spindle-shaped lesions with grey or ashy centres', 'Dark brown lesion margins'],
    traits: { lesionShape: ['Spindle-shaped', 'Diamond-shaped', 'Elliptical'], lesionCentre: ['Grey / Ashy', 'Whitish-grey'], lesionMargin: ['Dark brown margin', 'Reddish-brown margin'] },
  },
  'paddy::neck blast': {
    scientificName: 'Magnaporthe oryzae', type: 'Fungal',
    differentials: ['False smut'],
    distinguishing: ['Blackened, shriveled panicle neck'],
    traits: { lesionCentre: ['Black', 'Dark brown'] },
    stages: [ALL],
  },
  'paddy::brown spot': {
    scientificName: 'Bipolaris oryzae', type: 'Fungal',
    differentials: ['Blast', 'Narrow brown leaf spot'],
    distinguishing: ['Oval or circular brown spots'],
    traits: { lesionShape: ['Oval', 'Circular'], lesionCentre: ['Brown'], lesionMargin: ['Yellow halo'] },
  },
  'paddy::bacterial leaf blight': {
    scientificName: 'Xanthomonas oryzae pv. oryzae', type: 'Bacterial',
    differentials: ['Bacterial leaf streak', 'Nutrient deficiency'],
    distinguishing: ['Broad yellowing starting at leaf margins', 'Wavy lesion edge toward the leaf interior'],
    traits: { lesionMargin: ['Wavy margin', 'Yellow halo'], lesionCentre: ['Straw-yellow', 'Yellow'] },
  },
  'paddy::sheath blight': {
    scientificName: 'Rhizoctonia solani', type: 'Fungal',
    differentials: ['Sheath rot', 'Stem rot', 'Blast'],
    distinguishing: ['Lesions on the lower leaf sheath spreading upward'],
    traits: { lesionShape: ['Irregular', 'Elliptical'], lesionCentre: ['Grey / Ashy', 'Whitish-grey'], lesionMargin: ['Dark brown margin', 'Diffuse margin'] },
  },
  'paddy::sheath rot': {
    scientificName: 'Sarocladium oryzae', type: 'Fungal',
    differentials: ['Sheath blight'],
    distinguishing: ['Lesions on the uppermost leaf sheath enclosing the panicle'],
    traits: { lesionShape: ['Irregular'], lesionCentre: ['Grey / Ashy'], lesionMargin: ['Reddish-brown margin', 'Dark brown margin'] },
  },
  'paddy::stem rot': {
    scientificName: 'Nakataea oryzae', type: 'Fungal',
    differentials: ['Sheath blight'],
    distinguishing: ['Internal stem rot with black sclerotia'],
  },
  'paddy::false smut': {
    scientificName: 'Ustilaginoidea virens', type: 'Fungal',
    differentials: ['Neck blast'],
    distinguishing: ['Greenish spore balls replacing individual grains'],
    traits: { lesionCentre: ['Yellow', 'Pale green'] },
  },
  'paddy::narrow brown leaf spot': {
    scientificName: 'Cercospora janseana', type: 'Fungal',
    differentials: ['Brown spot'],
    distinguishing: ['Narrow, linear brown lesions'],
    traits: { lesionShape: ['Linear / streak'], lesionCentre: ['Brown'] },
  },
  'paddy::bakanae': {
    scientificName: 'Fusarium fujikuroi', type: 'Fungal',
    differentials: ['Rice tungro'],
    distinguishing: ['Abnormally tall, thin, pale-green seedlings'],
  },
  'paddy::bacterial leaf streak': {
    scientificName: 'Xanthomonas oryzae pv. oryzicola', type: 'Bacterial',
    differentials: ['Bacterial leaf blight'],
    distinguishing: ['Narrow translucent streaks restricted between veins'],
    traits: { lesionShape: ['Linear / streak'], lesionCentre: ['Translucent', 'Dark brown'] },
  },
  'paddy::rice tungro': {
    scientificName: 'RTBV + RTSV (tungro virus complex)', type: 'Viral',
    differentials: ['Nutrient deficiency', 'Rice grassy stunt', 'Rice yellow dwarf'],
    distinguishing: ['Yellow-orange leaf discoloration with stunting'],
    traits: { distribution: ['Multiple patches', 'Widespread across field', 'Scattered plants'] },
  },
  'paddy::rice yellow dwarf': {
    scientificName: 'Rice yellow dwarf phytoplasma', type: 'Phytoplasma',
    differentials: ['Rice tungro', 'Nutrient deficiency'],
  },
  'paddy::rice grassy stunt': {
    scientificName: 'Rice grassy stunt virus (RGSV)', type: 'Viral',
    differentials: ['Rice tungro'],
  },
  'paddy::grain discoloration': {
    scientificName: 'Fungal complex (multiple pathogens)', type: 'Fungal',
    distinguishing: ['Discoloration of glumes or grain surface'],
  },
  'paddy::root-knot disease': {
    scientificName: 'Meloidogyne graminicola', type: 'Nematode',
    differentials: ['Root rot', 'Nutrient deficiency'],
    distinguishing: ['Root galls or knots', 'Poor root development'],
  },

  // ---------------- Cotton ----------------
  'cotton::fusarium wilt': {
    scientificName: 'Fusarium oxysporum f. sp. vasinfectum', type: 'Fungal',
    differentials: ['Verticillium wilt', 'Root rot', 'Water stress'],
    distinguishing: ['Brown vascular discoloration in the stem', 'Progressive wilt starting on lower leaves'],
    traits: { distribution: ['Localized patches', 'Scattered plants'] },
    stages: [ALL],
  },
  'cotton::verticillium wilt': {
    scientificName: 'Verticillium dahliae', type: 'Fungal',
    differentials: ['Fusarium wilt', 'Nutrient deficiency', 'Root rot'],
    distinguishing: ['Interveinal yellowing and necrosis', 'Vascular discoloration'],
  },
  'cotton::root rot': {
    scientificName: 'Macrophomina phaseolina', type: 'Fungal',
    differentials: ['Fusarium wilt', 'Verticillium wilt', 'Waterlogging injury'],
    distinguishing: ['Darkened root collar and dry brittle roots', 'Plant collapse under heat or moisture stress'],
  },
  'cotton::alternaria leaf blight': {
    scientificName: 'Alternaria macrospora', type: 'Fungal',
    differentials: ['Cercospora leaf spot', 'Helminthosporium leaf spot', 'Bacterial blight'],
    distinguishing: ['Concentric rings or target-like markings', 'Darker outer lesion margin'],
    traits: { lesionShape: ['Circular', 'Irregular'], lesionCentre: ['Brown'], lesionMargin: ['Dark brown margin', 'Distinct margin'] },
  },
  'cotton::cercospora leaf spot': {
    scientificName: 'Cercospora gossypina', type: 'Fungal',
    differentials: ['Alternaria leaf blight', 'Helminthosporium leaf spot'],
    distinguishing: ['Brown or reddish-brown margins with greyish or tan centres'],
    traits: { lesionShape: ['Circular', 'Irregular'], lesionCentre: ['Grey / Ashy', 'Whitish-grey'], lesionMargin: ['Reddish-brown margin', 'Dark brown margin'] },
  },
  'cotton::helminthosporium leaf spot': {
    scientificName: 'Helminthosporium spp.', type: 'Fungal', provisional: true,
    differentials: ['Alternaria leaf blight', 'Cercospora leaf spot'],
    distinguishing: ['Elongated or irregular brown lesions'],
    traits: { lesionShape: ['Elongated', 'Irregular'], lesionCentre: ['Brown', 'Dark brown'] },
  },
  'cotton::grey or areolate mildew': {
    scientificName: 'Ramularia areola', type: 'Fungal',
    differentials: ['Other leaf spots', 'Bacterial blight', 'Nutrient deficiency'],
    distinguishing: ['Angular lesions bounded by leaf veins', 'Greyish-white growth on the leaf underside'],
  },
  'cotton::anthracnose': {
    scientificName: 'Colletotrichum spp.', type: 'Fungal',
    differentials: ['Bacterial boll rot', 'Mechanical injury'],
    distinguishing: ['Dark, sunken lesions on stems, petioles, or bolls'],
    traits: { lesionCentre: ['Black', 'Dark brown'] },
    stages: ['SEEDLING', 'BOLL_FORMATION', 'BOLL_DEVELOPMENT'],
  },
  'cotton::cotton rust': {
    scientificName: 'Phakopsora gossypii', type: 'Fungal',
    differentials: ['Other leaf spots', 'Insect feeding damage'],
    distinguishing: ['Orange or rust-coloured pustules on the leaf underside'],
  },
  'cotton::damping-off': {
    scientificName: 'Rhizoctonia solani / Pythium spp.', type: 'Fungal',
    differentials: ['Seed quality problems', 'Waterlogging'],
    distinguishing: ['Seedling collapse near the soil line', 'Patchy seedling mortality'],
    traits: { distribution: ['Localized patches', 'Multiple patches'] },
    stages: ['SEEDLING'],
  },
  'cotton::boll rot': {
    scientificName: 'Fungal complex (Fusarium, Colletotrichum, others)', type: 'Fungal',
    differentials: ['Bacterial boll rot', 'Insect injury', 'Weather damage'],
    distinguishing: ['Softening and decay of boll tissues with discoloured lint'],
    stages: ['BOLL_FORMATION', 'BOLL_DEVELOPMENT', 'BOLL_OPENING'],
  },
  'cotton::seedling blight': {
    scientificName: 'Rhizoctonia / Fusarium / Pythium complex', type: 'Fungal',
    differentials: ['Damping-off', 'Seed damage', 'Water stress'],
    distinguishing: ['Root and collar lesions with seedling mortality'],
    stages: ['SEEDLING'],
  },
  'cotton::bacterial blight': {
    scientificName: 'Xanthomonas citri pv. malvacearum', type: 'Bacterial',
    differentials: ['Fungal leaf spots', 'Mechanical injury'],
    distinguishing: ['Angular water-soaked lesions limited by veins', 'Blackened veins and "black arm" stem lesions'],
    traits: { lesionShape: ['Irregular'], lesionMargin: ['Distinct margin'] },
  },
  'cotton::bacterial boll rot': {
    scientificName: 'Bacterial boll rot complex', type: 'Bacterial',
    differentials: ['Boll rot', 'Insect damage'],
    distinguishing: ['Water-soaked soft decay of bolls, sometimes with foul odour'],
    stages: ['BOLL_FORMATION', 'BOLL_DEVELOPMENT'],
  },
  'cotton::tobacco streak virus': {
    scientificName: 'Tobacco streak virus (TSV)', type: 'Viral',
    differentials: ['Leaf curl', 'Herbicide injury'],
  },
  'cotton::cotton leaf curl disease': {
    scientificName: 'Cotton leaf curl begomovirus complex', type: 'Viral',
    differentials: ['Herbicide injury', 'Physiological leaf curling', 'Insect damage'],
    distinguishing: ['Leaf curling with vein thickening and enations', 'Shortened internodes'],
  },
  'cotton::cotton mosaic': {
    scientificName: 'Viral — requires regional verification', type: 'Viral', provisional: true,
    differentials: ['Herbicide injury', 'Nutrient disorders'],
    distinguishing: ['Persistent light- and dark-green mosaic mottling on new leaves'],
  },
  'cotton::leaf crumple / deformation': {
    scientificName: 'Provisional — cause unverified', type: 'Symptom-based category', provisional: true,
    differentials: ['Viral infection', 'Herbicide injury', 'Insect feeding', 'Physiological stress'],
    distinguishing: ['Crumpled or distorted new leaves'],
  },
  'cotton::root-knot disease': {
    scientificName: 'Meloidogyne spp.', type: 'Nematode',
    differentials: ['Root rot', 'Nutrient deficiency'],
    distinguishing: ['Root galls or knots', 'Poor root development'],
  },
};

// Supplemental diseases not present in the TNAU source JSON — spec §4.
interface SupplementalDisease {
  name: string;
  parts: string[]; // plant-part names (mapPart vocabulary)
  symptoms: string[]; // present tense — converted by toPastTense
}

const SUPPLEMENTAL_DISEASES: Record<string, SupplementalDisease[]> = {
  paddy: [
    {
      name: 'Stem rot',
      parts: ['stem', 'leaf sheaths', 'stem base'],
      symptoms: [
        'Small black lesions develop on the leaf sheath near the waterline',
        'Lesions extend into the inner sheath and stem tissues',
        'Stem tissues disintegrate and show dark discoloration',
        'Numerous black sclerotia form inside the affected stem',
        'Plants may lodge or dry prematurely',
      ],
    },
    {
      name: 'Narrow brown leaf spot',
      parts: ['leaf blade'],
      symptoms: [
        'Short, narrow brown linear lesions appear on the leaf blades',
        'Lesions develop between the leaf veins',
        'Lesions may unite and cause leaf drying',
        'Heavier infection appears on older leaves',
      ],
    },
    {
      name: 'Root-knot disease',
      parts: ['roots', 'whole plant'],
      symptoms: [
        'Root galls or knots form on the roots',
        'Root development is reduced',
        'Plants show yellowing and stunted growth',
        'Plants may wilt during warm periods',
      ],
    },
  ],
  cotton: [
    {
      name: 'Helminthosporium leaf spot',
      parts: ['leaves'],
      symptoms: [
        'Brown to dark-brown leaf lesions develop',
        'Spots are elongated, oval, or irregular in shape',
        'Lesions may develop lighter-coloured centres with dark margins',
        'Lesions enlarge and merge',
        'Severe infection leads to leaf drying and defoliation',
      ],
    },
    {
      name: 'Cotton rust',
      parts: ['leaves'],
      symptoms: [
        'Small yellowish spots appear on the leaves',
        'Orange or rust-coloured pustules develop, mainly on the leaf underside',
        'Powdery spore masses may be visible on the pustules',
        'Affected leaves turn yellow and dry',
        'Severe infection causes premature defoliation',
      ],
    },
    {
      name: 'Damping-off',
      parts: ['seeds', 'roots', 'hypocotyl', 'root collar'],
      symptoms: [
        'Poor seedling emergence is observed',
        'Seeds or roots show decay',
        'The stem base becomes water-soaked or darkened',
        'Seedlings collapse near the soil surface',
        'Young plants die in patches',
      ],
    },
    {
      name: 'Seedling blight',
      parts: ['roots', 'hypocotyl', 'root collar', 'leaves'],
      symptoms: [
        'Seedlings show poor vigour',
        'Roots show discoloration',
        'Lesions develop at the stem base',
        'Seedlings wilt and growth is stunted',
        'Seedling death occurs in severe cases',
      ],
    },
    {
      name: 'Bacterial boll rot',
      parts: ['young bolls', 'mature bolls', 'boll surface', 'boll interior / lint'],
      symptoms: [
        'Water-soaked lesions appear on bolls',
        'Bolls show brown or black discoloration',
        'Boll tissues soften and decay',
        'Lint becomes discoloured',
        'A foul odour may occur in affected bolls',
        'Boll opening is impaired',
      ],
    },
    {
      name: 'Cotton leaf curl disease',
      parts: ['leaves', 'petioles', 'growing point', 'whole plant'],
      symptoms: [
        'Leaves curl upward or downward',
        'Leaves become thickened',
        'Veins swell and become darkened or enlarged',
        'Leaf-like outgrowths (enations) may develop on the underside of leaves',
        'Internodes become shortened and plants are stunted',
        'Boll formation is reduced in severe cases',
      ],
    },
    {
      name: 'Cotton mosaic',
      parts: ['leaves', 'growing point'],
      symptoms: [
        'Irregular light-green and dark-green mottling appears on leaves',
        'A mosaic pattern develops on newly emerging leaves',
        'Leaves become distorted',
        'Plant vigour is reduced and stunting may occur',
      ],
    },
    {
      name: 'Leaf crumple / deformation',
      parts: ['leaves', 'growing point'],
      symptoms: [
        'Leaves become crumpled or distorted',
        'Leaf expansion is irregular',
        'New growth shows deformation',
        'Plant growth is stunted',
      ],
    },
    {
      name: 'Root-knot disease',
      parts: ['roots', 'whole plant'],
      symptoms: [
        'Root galls or knots form on the roots',
        'Root development is reduced',
        'Plants show yellowing and stunted growth',
        'Plants wilt during warm periods',
        'Plant vigour is reduced',
      ],
    },
  ],
};

interface BuiltCropData {
  symptoms: FdSymptomDef[];
  diseases: FdDisease[];
}

function buildCropData(source: SourceCrop): BuiltCropData | null {
  const cropId = CROP_NAME_TO_ID[source.crop_name.trim().toLowerCase()];
  if (!cropId) return null;

  // Every part code reachable from this crop's selectable list.
  const selectableParts = expandPartSelection(getPlantParts(cropId).map((p) => p.code));

  // Merge supplemental spec-defined diseases with the JSON-sourced records.
  const supplemental: SourceDisease[] = (SUPPLEMENTAL_DISEASES[cropId] || []).map((d) => ({
    disease_name: d.name,
    plant_parts_affected: d.parts,
    symptoms: d.symptoms,
  }));
  const allDiseases = [...source.diseases, ...supplemental];

  // Shared symptom list: same description shared across diseases maps to one id.
  const symptomIndex = new Map<string, { id: string; label: string; parts: Set<string>; diseaseCount: number }>();
  const diseaseSymptomIds: Map<string, string[]> = new Map();

  for (const disease of allDiseases) {
    const ids: string[] = [];
    const diseaseParts = new Set((disease.plant_parts_affected || []).map(mapPart));
    for (const symptom of disease.symptoms || []) {
      const key = symptom.trim().toLowerCase();
      // Tag the symptom with the parts its text actually refers to, restricted
      // to the disease's declared parts. If detection hits parts the disease
      // doesn't declare but the officer can still select, keep them; otherwise
      // fall back to the disease's declared parts so a symptom can never land
      // on an unreachable orphan code.
      const detected = detectSymptomParts(symptom);
      const narrowed = new Set([...detected].filter((p) => diseaseParts.has(p)));
      const reachable = new Set([...detected].filter((p) => selectableParts.has(p)));
      const parts =
        narrowed.size > 0 ? narrowed
        : reachable.size > 0 ? reachable
        : diseaseParts.size > 0 ? diseaseParts
        : new Set(['WHOLE_PLANT']);
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

  const diseases: FdDisease[] = allDiseases.map((disease) => {
    const ids = diseaseSymptomIds.get(disease.disease_name) || [];
    const weights: Record<string, number> = {};
    ids.forEach((id) => {
      const entry = Array.from(symptomIndex.values()).find((s) => s.id === id);
      // Distinctive symptoms (seen in fewer diseases of this crop) weigh more.
      const count = entry?.diseaseCount || 1;
      weights[id] = count === 1 ? 5 : count === 2 ? 4 : count === 3 ? 3 : 2;
    });
    const meta = DISEASE_META[`${cropId}::${disease.disease_name.trim().toLowerCase()}`] || {};
    const metaStages = meta.stages || [];
    const stages = metaStages.includes(ALL)
      ? getGrowthStages(cropId).map((s) => s.code)
      : metaStages.length > 0
        ? metaStages
        : [UNKNOWN_STAGE];
    return {
      id: diseaseId(cropId, disease.disease_name),
      cropId,
      name: disease.disease_name,
      scientificName: meta.scientificName || '',
      type: meta.type || '',
      parts: Array.from(new Set((disease.plant_parts_affected || []).map(mapPart))),
      stages,
      overview: (disease.symptoms || []).join(' '),
      differentials: meta.differentials || [],
      distinguishing: meta.distinguishing || [],
      provisional: meta.provisional || false,
      references: [{ label: 'TNAU Agritech Crop Protection Portal', url: TNAU_PORTAL }],
      symptomWeights: weights,
      traits: meta.traits || {},
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
  contradictedSymptomIds?: string[];
  traitAnswers: Partial<Record<FdTraitKey, string>>;
  selectedParts?: string[];
  selectedStages?: string[];
}

export interface FdDiseaseScore {
  disease: FdDisease;
  score: number;
  rawScore: number;
  maxScore: number;
  matchedSymptoms: string[];
  missingSymptoms: string[];
  missingSymptomIds: string[];
  ruledOutSymptoms: string[];
  contradictoryTraits: string[];
  adjustments: string[];
  hasData: boolean;
}

const CONTRA_WEIGHT = 3;
const PART_WEIGHT = 5;
const STAGE_WEIGHT = 3;

export function scoreDisease(disease: FdDisease, symptomDefs: FdSymptomDef[], input: FdScoreInput): FdDiseaseScore {
  const defById = new Map(symptomDefs.map((s) => [s.id, s]));
  const partial = new Set(input.partialSymptomIds || []);
  const contradicted = new Set(input.contradictedSymptomIds || []);
  const expandedParts = input.selectedParts && input.selectedParts.length > 0
    ? expandPartSelection(input.selectedParts)
    : null;
  const selectedStages = input.selectedStages || [];

  let raw = 0;
  let max = 0;
  const matched: string[] = [];
  const missing: string[] = [];
  const missingIds: string[] = [];
  const ruledOut: string[] = [];
  const adjustments: string[] = [];

  for (const [symId, weight] of Object.entries(disease.symptomWeights)) {
    // Normalize over applicable symptoms only — skip symptoms for parts the
    // officer did not select (spec §9).
    if (expandedParts) {
      const def = defById.get(symId);
      if (def && !def.parts.some((p) => expandedParts.has(p))) continue;
    }
    max += weight;
    if (input.selectedSymptomIds.includes(symId)) {
      const v = partial.has(symId) ? 0.5 : 1;
      raw += weight * v;
      matched.push(defById.get(symId)?.label || symId);
    } else if (contradicted.has(symId)) {
      raw -= CONTRA_WEIGHT;
      ruledOut.push(defById.get(symId)?.label || symId);
    } else {
      missing.push(defById.get(symId)?.label || symId);
      missingIds.push(symId);
    }
  }

  // Plant-part compatibility: characteristic location match adds weight,
  // a clear mismatch subtracts (spec §8.2.B). WHOLE_PLANT is excluded from
  // the overlap test — it is a wildcard present in every part family and
  // would make every disease "compatible" with every selection.
  if (expandedParts) {
    const specificSelected = new Set([...expandedParts].filter((p) => p !== 'WHOLE_PLANT'));
    const diseaseExpanded = expandPartSelection(disease.parts);
    const overlap =
      disease.parts.includes('WHOLE_PLANT') ||
      [...specificSelected].some((p) => diseaseExpanded.has(p));
    max += PART_WEIGHT;
    if (overlap) {
      raw += PART_WEIGHT;
    } else {
      raw -= PART_WEIGHT;
      adjustments.push('Selected plant part is not typical for this disease');
    }
  }

  // Growth-stage compatibility: soft adjustment only — a disease is never
  // excluded for an uncommon stage (spec §5).
  if (selectedStages.length > 0 && !disease.stages.includes(UNKNOWN_STAGE) && disease.stages.length > 0) {
    max += STAGE_WEIGHT;
    if (disease.stages.some((s) => selectedStages.includes(s))) {
      raw += STAGE_WEIGHT;
    } else {
      raw -= STAGE_WEIGHT;
      adjustments.push('Symptoms uncommon at the selected growth stage');
    }
  }

  const contradictoryTraits: string[] = [];
  for (const question of FD_TRAIT_QUESTIONS) {
    const answer = input.traitAnswers[question.key];
    if (!answer || TRAIT_EXCLUDED_ANSWERS.has(answer)) continue; // unknown/absent → excluded
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
  // Symptom evidence is the primary signal: a disease with zero matched
  // symptoms must not rank on part/stage compatibility alone.
  const score =
    max > 0 && matched.length > 0 ? Math.max(0, Math.min(100, Math.round((raw / max) * 100))) : 0;
  return {
    disease,
    score,
    rawScore: raw,
    maxScore: max,
    matchedSymptoms: matched,
    missingSymptoms: missing,
    missingSymptomIds: missingIds,
    ruledOutSymptoms: ruledOut,
    contradictoryTraits,
    adjustments,
    hasData,
  };
}

export function matchTier(score: number): { label: string; badge: string } {
  if (score >= 70) return { label: 'High Match', badge: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' };
  if (score >= 40) return { label: 'Possible', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' };
  return { label: 'Low Match', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' };
}

export const OBSERVATION_VALUES = OBSERVATION_VALUE;

// ---------------------------------------------------------------------------
// Non-infectious causes — advisory only, never scored (spec §5)
// ---------------------------------------------------------------------------

export const FD_NONINFECTIOUS: { label: string; hint: string }[] = [
  { label: 'Nutrient deficiency', hint: 'General or interveinal chlorosis, leaf-margin scorch, stunting — check fertilizer history before blaming a pathogen.' },
  { label: 'Abiotic stress', hint: 'Drought, waterlogging, heat, cold, salinity, or soil compaction can mimic disease symptoms.' },
  { label: 'Herbicide injury', hint: 'Leaf cupping, twisting, strapping, or distorted new growth after recent spray.' },
  { label: 'Insect / mite damage', hint: 'Leaf curling, stippling, honeydew, sooty mould, feeding punctures, or damaged squares and bolls.' },
];
