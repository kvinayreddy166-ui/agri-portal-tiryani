// Agronix Field Diagnosis — crop-wise disease & symptom dataset.
// Seed records compiled from the TNAU Agritech Crop Protection Portal.
// Where the source does not specify a growth stage, the record uses 'UNKNOWN'
// rather than an inferred value.

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
// Symptoms (shared per crop; diseases map weights onto these)
// ---------------------------------------------------------------------------

export const FD_SYMPTOMS: Record<string, FdSymptomDef[]> = {
  paddy: [
    { id: 'pdy-spindle', label: 'Spindle-shaped lesions', parts: ['LEAF'] },
    { id: 'pdy-grey-ashy', label: 'Grey or ashy lesion centre', parts: ['LEAF'] },
    { id: 'pdy-round-oval-brown', label: 'Round to oval brown spots', parts: ['LEAF'] },
    { id: 'pdy-water-streaks', label: 'Water-soaked streaks', parts: ['LEAF'] },
    { id: 'pdy-yellowing', label: 'Yellowing of leaves', parts: ['LEAF', 'WHOLE_PLANT'] },
    { id: 'pdy-leaf-drying', label: 'Leaf blight (complete drying)', parts: ['LEAF'] },
    { id: 'pdy-chlorotic-stripes', label: 'Chlorotic stripes', parts: ['LEAF'] },
    { id: 'pdy-white-powder', label: 'White powdery growth', parts: ['LEAF'] },
    { id: 'pdy-neck-black', label: 'Neck turns black and shrivels', parts: ['NECK'] },
    { id: 'pdy-glume-spots', label: 'Black or brown spots on glumes', parts: ['GRAIN'] },
    { id: 'pdy-smut-balls', label: 'Smut balls on grains', parts: ['GRAIN'] },
    { id: 'pdy-grain-discolor', label: 'Grain discoloration', parts: ['GRAIN'] },
    { id: 'pdy-sheath-lesions', label: 'Irregular lesions on leaf sheath', parts: ['LEAF_SHEATH'] },
    { id: 'pdy-panicle-trapped', label: 'Panicle trapped inside sheath', parts: ['PANICLE'] },
    { id: 'pdy-stunting', label: 'Stunting and reduced growth', parts: ['WHOLE_PLANT'] },
  ],
  cotton: [
    { id: 'ctn-yellowing', label: 'Yellowing of leaves', parts: ['LEAF'] },
    { id: 'ctn-leaf-drop', label: 'Browning and leaf drop', parts: ['LEAF'] },
    { id: 'ctn-wilt-droop', label: 'Wilting / loss of turgidity', parts: ['LEAF', 'WHOLE_PLANT'] },
    { id: 'ctn-round-spots', label: 'Round or irregular brown spots', parts: ['LEAF'] },
    { id: 'ctn-angular-spots', label: 'Angular pale spots bounded by veins', parts: ['LEAF'] },
    { id: 'ctn-reddish-spots', label: 'Small reddish / light-coloured spots', parts: ['LEAF'] },
    { id: 'ctn-stem-canker', label: 'Canker-like lesions on stem', parts: ['STEM'] },
    { id: 'ctn-boll-spots', label: 'Water-soaked reddish-brown boll spots', parts: ['BOLL'] },
    { id: 'ctn-boll-rot', label: 'Boll rot / discoloured bolls', parts: ['BOLL'] },
    { id: 'ctn-root-decay', label: 'Root decay and weak plants', parts: ['ROOT'] },
    { id: 'ctn-stunted-root', label: 'Stunted taproot, fewer lateral roots', parts: ['ROOT'] },
  ],
  maize: [
    { id: 'mze-diamond-lesions', label: 'Diamond-shaped elongated lesions', parts: ['LEAF'] },
    { id: 'mze-leaf-burning', label: 'Large areas of leaf burning', parts: ['LEAF'] },
    { id: 'mze-chlorotic-base', label: 'Chlorotic areas including leaf base', parts: ['LEAF'] },
    { id: 'mze-downy-growth', label: 'White downy growth on leaf surfaces', parts: ['LEAF'] },
    { id: 'mze-tassel-abnormal', label: 'Abnormal tassel / floral development', parts: ['FLOWER'] },
  ],
  greengram: [
    { id: 'ggm-concentric-spots', label: 'Circular brown spots with concentric rings', parts: ['LEAF'] },
    { id: 'ggm-shot-holes', label: 'Shot holes in leaves', parts: ['LEAF'] },
    { id: 'ggm-sunken-black', label: 'Circular black sunken spots', parts: ['LEAF', 'POD'] },
    { id: 'ggm-orange-margins', label: 'Bright reddish-orange spot margins', parts: ['LEAF', 'POD'] },
    { id: 'ggm-white-cankers', label: 'Raised white cankers at stem base', parts: ['STEM_BASE'] },
    { id: 'ggm-mottled-leaves', label: 'Mottled, dark green, reduced leaves', parts: ['LEAF'] },
    { id: 'ggm-yellow-mottling', label: 'Bright yellow mottling of leaves', parts: ['LEAF'] },
    { id: 'ggm-powdery', label: 'White powdery patches on leaves', parts: ['LEAF'] },
    { id: 'ggm-root-black', label: 'Root and basal stem blackening', parts: ['ROOT', 'STEM_BASE'] },
    { id: 'ggm-rust-pustules', label: 'Reddish-brown pustules on lower leaf surface', parts: ['LEAF'] },
    { id: 'ggm-seedling-death', label: 'Sudden drying and death of seedlings', parts: ['SEEDLING', 'WHOLE_PLANT'] },
  ],
  soybean: [
    { id: 'sbn-concentric', label: 'Brown spots with concentric rings', parts: ['LEAF'] },
    { id: 'sbn-irregular-lesions', label: 'Irregular brown lesions / vein necrosis', parts: ['LEAF'] },
    { id: 'sbn-angular-spots', label: 'Small angular water-soaked spots', parts: ['LEAF'] },
    { id: 'sbn-frogeye', label: 'Circular lesions with grey centres, dark margins', parts: ['LEAF'] },
    { id: 'sbn-powdery', label: 'White powdery patches', parts: ['LEAF'] },
    { id: 'sbn-rust', label: 'Tan to reddish-brown lesions (lower surface)', parts: ['LEAF'] },
    { id: 'sbn-mosaic', label: 'Distorted, puckered or crinkled leaves', parts: ['LEAF'] },
    { id: 'sbn-stem-lesions', label: 'Brown lesions / cankers on stem', parts: ['STEM'] },
    { id: 'sbn-pod-lesions', label: 'Brown lesions on pods / discoloured seeds', parts: ['POD', 'SEED'] },
    { id: 'sbn-webblight', label: 'Water-soaked lesions turning dark brown', parts: ['LEAF'] },
  ],
};

export function getSymptoms(cropId: string): FdSymptomDef[] {
  return FD_SYMPTOMS[cropId] || [];
}

// ---------------------------------------------------------------------------
// Diagnostic questions (symptom characteristics — step 5)
// ---------------------------------------------------------------------------

export const FD_TRAIT_QUESTIONS: { key: FdTraitKey; label: string; options: string[] }[] = [
  { key: 'lesionShape', label: 'Lesion shape', options: ['Spindle-shaped', 'Round', 'Irregular', 'Unknown'] },
  { key: 'lesionCentre', label: 'Lesion centre colour', options: ['Grey / Ashy', 'Brown', 'Black', 'Unknown'] },
  { key: 'distribution', label: 'Distribution in field', options: ['Few plants', 'Many plants', 'Patchy', 'Throughout field'] },
  { key: 'severity', label: 'Severity', options: ['Mild', 'Moderate', 'Severe'] },
];

const TRAIT_WEIGHT = 3;

// ---------------------------------------------------------------------------
// Diseases
// ---------------------------------------------------------------------------

const TNAU_MAIN = 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_diseases_agri.html';
const TNAU_RICE = 'https://www.agritech.tnau.ac.in/crop_protection/crop_prot_crop%20diseases_cereals_rice_main.html';
const TNAU_COTTON = 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop%20diseases_cash%20crops_cotton.html';
const TNAU_MGMT = 'https://www.agritech.tnau.ac.in/org_farm/orgfarm_agridiseases.html';

const ALL_PADDY_STAGES = PADDY_STAGES.map((s) => s.code);
const ALL_COTTON_STAGES = COTTON_STAGES.map((s) => s.code);

export const FD_DISEASES: FdDisease[] = [
  // ---- Paddy ----
  {
    id: 'pdy-blast',
    cropId: 'paddy',
    name: 'Rice Blast',
    scientificName: 'Magnaporthe oryzae',
    type: 'Fungus',
    parts: ['LEAF', 'NECK', 'NODE', 'PANICLE'],
    stages: ALL_PADDY_STAGES,
    overview:
      'Small specks develop into spindle-shaped lesions with grey or ashy centres; lesions may merge. After ear emergence the neck turns black and shrivels and the panicle may break.',
    references: [
      { label: 'TNAU Rice Disease Reference', url: TNAU_RICE },
      { label: 'TNAU Crop Diseases Portal', url: TNAU_MAIN },
    ],
    symptomWeights: { 'pdy-spindle': 5, 'pdy-grey-ashy': 5, 'pdy-neck-black': 5, 'pdy-yellowing': 1 },
    traits: { lesionShape: ['Spindle-shaped'], lesionCentre: ['Grey / Ashy'], distribution: ['Many plants', 'Throughout field'] },
  },
  {
    id: 'pdy-brown-spot',
    cropId: 'paddy',
    name: 'Brown Spot',
    scientificName: 'Bipolaris oryzae',
    type: 'Fungus',
    parts: ['LEAF', 'GRAIN'],
    stages: ['NURSERY', 'SEEDLING', 'TILLERING', 'STEM_ELONGATION', 'BOOTING', 'HEADING', 'FLOWERING', 'GRAIN_FILLING', 'MATURITY'],
    overview:
      'Small, round to oval brown spots on leaves which may merge; black or brown spots may develop on the glumes during grain development.',
    references: [{ label: 'TNAU Rice Disease Reference', url: TNAU_RICE }],
    symptomWeights: { 'pdy-round-oval-brown': 5, 'pdy-glume-spots': 4 },
    traits: { lesionShape: ['Round'], lesionCentre: ['Brown'] },
  },
  {
    id: 'pdy-blb',
    cropId: 'paddy',
    name: 'Bacterial Leaf Blight',
    scientificName: 'Xanthomonas oryzae pv. oryzae',
    type: 'Bacteria',
    parts: ['LEAF', 'LEAF_TIP', 'LEAF_MARGIN'],
    stages: ['TILLERING', 'STEM_ELONGATION', 'BOOTING'],
    overview: 'Leaf lesions spread along the leaf and can result in complete drying of affected leaves.',
    references: [{ label: 'TNAU Rice Disease Reference', url: TNAU_RICE }],
    symptomWeights: { 'pdy-leaf-drying': 5, 'pdy-yellowing': 3, 'pdy-water-streaks': 2 },
    traits: { lesionShape: ['Irregular'], severity: ['Moderate', 'Severe'] },
  },
  {
    id: 'pdy-bls',
    cropId: 'paddy',
    name: 'Bacterial Leaf Streak',
    scientificName: 'Xanthomonas oryzae pv. oryzicola',
    type: 'Bacteria',
    parts: ['LEAF'],
    stages: ['TILLERING', 'STEM_ELONGATION', 'BOOTING'],
    overview: 'Small, dark-green, water-soaked streaks develop between the leaf veins.',
    references: [{ label: 'TNAU Rice Disease Reference', url: TNAU_RICE }],
    symptomWeights: { 'pdy-water-streaks': 5, 'pdy-chlorotic-stripes': 3 },
    traits: { lesionShape: ['Irregular'] },
  },
  {
    id: 'pdy-tungro',
    cropId: 'paddy',
    name: 'Rice Tungro',
    scientificName: 'RTSV / RTBV',
    type: 'Virus',
    parts: ['LEAF', 'WHOLE_PLANT'],
    stages: [UNKNOWN_STAGE],
    overview: 'Yellowing, stunting and reduced growth of the whole plant.',
    references: [{ label: 'TNAU Rice Disease Reference', url: TNAU_RICE }],
    symptomWeights: { 'pdy-yellowing': 4, 'pdy-stunting': 5, 'pdy-chlorotic-stripes': 2 },
    traits: { distribution: ['Throughout field', 'Patchy'] },
  },
  {
    id: 'pdy-sheath-rot',
    cropId: 'paddy',
    name: 'Sheath Rot',
    scientificName: 'Sarocladium oryzae',
    type: 'Fungus',
    parts: ['LEAF_SHEATH', 'PANICLE', 'GRAIN'],
    stages: ['HEADING', 'FLOWERING'],
    overview:
      'Irregular lesions on the leaf sheath with reddish-brown margins and grey centres; the panicle may remain trapped inside the sheath and florets may turn reddish-brown.',
    references: [{ label: 'TNAU Rice Disease Reference', url: TNAU_RICE }],
    symptomWeights: { 'pdy-sheath-lesions': 5, 'pdy-panicle-trapped': 4, 'pdy-grain-discolor': 3 },
    traits: { lesionShape: ['Irregular'], lesionCentre: ['Grey / Ashy'] },
  },
  {
    id: 'pdy-sheath-blight',
    cropId: 'paddy',
    name: 'Sheath Blight',
    scientificName: 'Rhizoctonia solani',
    type: 'Fungus',
    parts: ['LEAF_SHEATH'],
    stages: [UNKNOWN_STAGE],
    overview: 'Lesions develop on the leaf sheath and may spread upwards.',
    references: [{ label: 'TNAU Rice Disease Reference', url: TNAU_RICE }],
    symptomWeights: { 'pdy-sheath-lesions': 5 },
    traits: { lesionShape: ['Irregular'] },
  },
  {
    id: 'pdy-false-smut',
    cropId: 'paddy',
    name: 'False Smut',
    scientificName: 'Ustilaginoidea virens',
    type: 'Fungus',
    parts: ['GRAIN'],
    stages: ['GRAIN_FILLING'],
    overview: 'Individual grains develop characteristic smut balls.',
    references: [{ label: 'TNAU Rice Disease Reference', url: TNAU_RICE }],
    symptomWeights: { 'pdy-smut-balls': 5, 'pdy-grain-discolor': 2 },
    traits: {},
  },
  {
    id: 'pdy-bakanae',
    cropId: 'paddy',
    name: 'Bakanae',
    scientificName: 'Fusarium fujikuroi',
    type: 'Fungus',
    parts: ['WHOLE_PLANT', 'STEM'],
    stages: [UNKNOWN_STAGE],
    overview: 'Listed in the TNAU rice disease reference; detailed symptom mapping pending source verification.',
    references: [{ label: 'TNAU Rice Disease Reference', url: TNAU_RICE }],
    symptomWeights: { 'pdy-stunting': 2 },
    traits: {},
  },
  {
    id: 'pdy-grain-discolor',
    cropId: 'paddy',
    name: 'Grain Discoloration',
    scientificName: 'Multiple fungi',
    type: 'Fungus',
    parts: ['GRAIN'],
    stages: ['GRAIN_FILLING', 'MATURITY'],
    overview: 'Listed in the TNAU rice disease reference; detailed symptom mapping pending source verification.',
    references: [{ label: 'TNAU Rice Disease Reference', url: TNAU_RICE }],
    symptomWeights: { 'pdy-grain-discolor': 4, 'pdy-glume-spots': 2 },
    traits: {},
  },
  // ---- Cotton ----
  {
    id: 'ctn-fusarium',
    cropId: 'cotton',
    name: 'Fusarium Wilt',
    scientificName: 'Fusarium oxysporum f. sp. vasinfectum',
    type: 'Fungus',
    parts: ['LEAF', 'ROOT', 'WHOLE_PLANT'],
    stages: ALL_COTTON_STAGES,
    overview: 'Yellowing, loss of turgidity, browning and leaf drop; taproot stunted with fewer lateral roots.',
    references: [{ label: 'TNAU Cotton Disease Reference', url: TNAU_COTTON }],
    symptomWeights: { 'ctn-yellowing': 4, 'ctn-wilt-droop': 5, 'ctn-leaf-drop': 4, 'ctn-stunted-root': 4 },
    traits: { distribution: ['Patchy', 'Throughout field'], severity: ['Moderate', 'Severe'] },
  },
  {
    id: 'ctn-verticillium',
    cropId: 'cotton',
    name: 'Verticillium Wilt',
    scientificName: 'Verticillium dahliae',
    type: 'Fungus',
    parts: ['LEAF', 'WHOLE_PLANT'],
    stages: [UNKNOWN_STAGE],
    overview: 'Listed in the TNAU cotton disease reference; wilt symptoms with leaf yellowing and drop.',
    references: [{ label: 'TNAU Cotton Disease Reference', url: TNAU_COTTON }],
    symptomWeights: { 'ctn-yellowing': 3, 'ctn-wilt-droop': 4, 'ctn-leaf-drop': 3 },
    traits: {},
  },
  {
    id: 'ctn-alternaria',
    cropId: 'cotton',
    name: 'Alternaria Leaf Spot',
    scientificName: 'Alternaria spp.',
    type: 'Fungus',
    parts: ['LEAF', 'STEM', 'BOLL'],
    stages: [UNKNOWN_STAGE],
    overview:
      'Pale to brown, round or irregular spots with cracked centres; affected leaves dry and fall. Canker-like lesions may develop on stems and infection may spread to bolls.',
    references: [{ label: 'TNAU Cotton Disease Reference', url: TNAU_COTTON }],
    symptomWeights: { 'ctn-round-spots': 5, 'ctn-leaf-drop': 3, 'ctn-stem-canker': 4, 'ctn-boll-rot': 3 },
    traits: { lesionShape: ['Round', 'Irregular'], lesionCentre: ['Brown'] },
  },
  {
    id: 'ctn-anthracnose',
    cropId: 'cotton',
    name: 'Anthracnose',
    scientificName: 'Colletotrichum gossypii',
    type: 'Fungus',
    parts: ['LEAF', 'STEM', 'BOLL'],
    stages: ['SEEDLING', 'BOLL_FORMATION', 'BOLL_DEVELOPMENT'],
    overview:
      'Small reddish or light-coloured leaf spots at the seedling stage; stem infection through wounds weakens plants; water-soaked, circular, slightly depressed reddish-brown spots on bolls.',
    references: [{ label: 'TNAU Cotton Disease Reference', url: TNAU_COTTON }],
    symptomWeights: { 'ctn-reddish-spots': 4, 'ctn-stem-canker': 3, 'ctn-boll-spots': 5 },
    traits: { lesionShape: ['Round'], lesionCentre: ['Brown'] },
  },
  {
    id: 'ctn-grey-mildew',
    cropId: 'cotton',
    name: 'Grey Mildew',
    scientificName: 'Ramularia areola',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: ['MATURITY'],
    overview: 'Angular, pale, translucent spots bounded by leaf veins, appearing near maturity.',
    references: [{ label: 'TNAU Cotton Disease Reference', url: TNAU_COTTON }],
    symptomWeights: { 'ctn-angular-spots': 5 },
    traits: { lesionShape: ['Irregular'] },
  },
  {
    id: 'ctn-bacterial-blight',
    cropId: 'cotton',
    name: 'Bacterial Blight',
    scientificName: 'Xanthomonas citri pv. malvacearum',
    type: 'Bacteria',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'Leaf lesions and possible vein-associated symptoms.',
    references: [{ label: 'TNAU Cotton Disease Reference', url: TNAU_COTTON }],
    symptomWeights: { 'ctn-angular-spots': 4, 'ctn-reddish-spots': 2 },
    traits: {},
  },
  {
    id: 'ctn-root-rot',
    cropId: 'cotton',
    name: 'Root Rot',
    scientificName: 'Rhizoctonia solani / Macrophomina spp.',
    type: 'Fungus',
    parts: ['ROOT'],
    stages: [UNKNOWN_STAGE],
    overview: 'Root decay and loss of plant vigour.',
    references: [{ label: 'TNAU Cotton Disease Reference', url: TNAU_COTTON }],
    symptomWeights: { 'ctn-root-decay': 5, 'ctn-wilt-droop': 3 },
    traits: {},
  },
  {
    id: 'ctn-boll-rot',
    cropId: 'cotton',
    name: 'Boll Rot',
    scientificName: 'Multiple organisms',
    type: 'Fungus/Bacteria',
    parts: ['BOLL'],
    stages: ['BOLL_DEVELOPMENT'],
    overview: 'Listed in the TNAU cotton disease reference; rotting and discolouration of bolls.',
    references: [{ label: 'TNAU Cotton Disease Reference', url: TNAU_COTTON }],
    symptomWeights: { 'ctn-boll-rot': 5, 'ctn-boll-spots': 3 },
    traits: {},
  },
  // ---- Maize ----
  {
    id: 'mze-mlb',
    cropId: 'maize',
    name: 'Maydis Leaf Blight',
    scientificName: 'Bipolaris maydis',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'Young diamond-shaped lesions elongate and merge, causing large areas of leaf burning.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'mze-diamond-lesions': 5, 'mze-leaf-burning': 4 },
    traits: { lesionShape: ['Spindle-shaped', 'Irregular'] },
  },
  {
    id: 'mze-downy',
    cropId: 'maize',
    name: 'Sorghum Downy Mildew',
    scientificName: 'Peronosclerospora sorghi',
    type: 'Oomycete',
    parts: ['LEAF', 'FLOWER'],
    stages: [UNKNOWN_STAGE],
    overview:
      'Chlorotic areas include the base of the leaf blade with sharply defined margins; white downy growth may appear on both leaf surfaces; abnormal floral development may occur.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'mze-chlorotic-base': 4, 'mze-downy-growth': 5, 'mze-tassel-abnormal': 3 },
    traits: { lesionCentre: ['Grey / Ashy'] },
  },
  // ---- Greengram ----
  {
    id: 'ggm-alternaria',
    cropId: 'greengram',
    name: 'Alternaria Leaf Spot',
    scientificName: 'Alternaria spp.',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview:
      'Circular brown spots develop dark concentric rings; affected tissue may fall out, creating shot holes.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'ggm-concentric-spots': 5, 'ggm-shot-holes': 4 },
    traits: { lesionShape: ['Round'], lesionCentre: ['Brown'] },
  },
  {
    id: 'ggm-anthracnose',
    cropId: 'greengram',
    name: 'Anthracnose',
    scientificName: 'Colletotrichum spp.',
    type: 'Fungus',
    parts: ['LEAF', 'POD'],
    stages: GENERIC_STAGES.map((s) => s.code),
    overview: 'Circular black sunken spots with dark centres and bright reddish-orange margins on leaves and pods.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'ggm-sunken-black': 5, 'ggm-orange-margins': 5 },
    traits: { lesionShape: ['Round'], lesionCentre: ['Black'] },
  },
  {
    id: 'ggm-web-blight',
    cropId: 'greengram',
    name: 'Leaf Web Blight',
    scientificName: 'Rhizoctonia solani',
    type: 'Fungus',
    parts: ['STEM_BASE', 'LEAF'],
    stages: ['VEGETATIVE'],
    overview:
      'Raised white cankers develop at the stem base around four weeks and become brown streaks; leaves become mottled, dark green and reduced in size.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'ggm-white-cankers': 5, 'ggm-mottled-leaves': 4 },
    traits: {},
  },
  {
    id: 'ggm-yellow-mosaic',
    cropId: 'greengram',
    name: 'Yellow Mosaic',
    scientificName: 'Mungbean yellow mosaic virus',
    type: 'Virus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'Bright yellow mottling of leaves.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'ggm-yellow-mottling': 5, 'ggm-mottled-leaves': 3 },
    traits: { distribution: ['Patchy', 'Throughout field'] },
  },
  {
    id: 'ggm-powdery',
    cropId: 'greengram',
    name: 'Powdery Mildew',
    scientificName: 'Erysiphe polygoni',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'White powdery patches expand and may cover leaf surfaces.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'ggm-powdery': 5 },
    traits: {},
  },
  {
    id: 'ggm-root-rot',
    cropId: 'greengram',
    name: 'Root Rot',
    scientificName: 'Macrophomina phaseolina / Rhizoctonia spp.',
    type: 'Fungus',
    parts: ['ROOT', 'STEM_BASE'],
    stages: ['POD_FRUIT_FORMATION'],
    overview: 'Root and basal stem blackening; bark peels off; internal tissues may show reddish discoloration.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'ggm-root-black': 5, 'ggm-seedling-death': 2 },
    traits: {},
  },
  {
    id: 'ggm-rust',
    cropId: 'greengram',
    name: 'Rust',
    scientificName: 'Uromyces spp.',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'Reddish-brown pustules, especially on the lower leaf surface.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'ggm-rust-pustules': 5 },
    traits: { lesionCentre: ['Brown'] },
  },
  {
    id: 'ggm-seedling-rot',
    cropId: 'greengram',
    name: 'Seedling Rot',
    scientificName: 'Multiple organisms',
    type: 'Fungus',
    parts: ['SEEDLING', 'STEM_BASE'],
    stages: ['GERMINATION', 'SEEDLING'],
    overview: 'Sudden drying and death; basal stem weakens and turns brown.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'ggm-seedling-death': 5, 'ggm-root-black': 3 },
    traits: {},
  },
  // ---- Soybean ----
  {
    id: 'sbn-alternaria',
    cropId: 'soybean',
    name: 'Alternaria Leaf Spot',
    scientificName: 'Alternaria spp.',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'Brown necrotic spots with concentric rings; spots merge into larger necrotic areas.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'sbn-concentric': 5 },
    traits: { lesionShape: ['Round'], lesionCentre: ['Brown'] },
  },
  {
    id: 'sbn-anthracnose',
    cropId: 'soybean',
    name: 'Anthracnose',
    scientificName: 'Colletotrichum spp.',
    type: 'Fungus',
    parts: ['LEAF', 'STEM', 'POD'],
    stages: [UNKNOWN_STAGE],
    overview:
      'Irregular brown lesions and possible veinal necrosis on leaves; brown lesions and cankers on stems; infected pods and seeds may become discoloured.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'sbn-irregular-lesions': 4, 'sbn-stem-lesions': 4, 'sbn-pod-lesions': 4 },
    traits: { lesionShape: ['Irregular'], lesionCentre: ['Brown'] },
  },
  {
    id: 'sbn-bacterial-blight',
    cropId: 'soybean',
    name: 'Bacterial Blight',
    scientificName: 'Pseudomonas savastanoi pv. glycinea',
    type: 'Bacteria',
    parts: ['LEAF', 'STEM'],
    stages: [UNKNOWN_STAGE],
    overview: 'Small angular, translucent, water-soaked yellow to light-brown spots; dark lesions may develop on stems.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'sbn-angular-spots': 5, 'sbn-stem-lesions': 3 },
    traits: {},
  },
  {
    id: 'sbn-frogeye',
    cropId: 'soybean',
    name: 'Frog-eye Leaf Spot',
    scientificName: 'Cercospora sojina',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'Circular or angular lesions with grey centres and dark margins.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'sbn-frogeye': 5 },
    traits: { lesionShape: ['Round'], lesionCentre: ['Grey / Ashy'] },
  },
  {
    id: 'sbn-powdery',
    cropId: 'soybean',
    name: 'Powdery Mildew',
    scientificName: 'Microsphaera diffusa',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'White powdery patches on leaves.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'sbn-powdery': 5 },
    traits: {},
  },
  {
    id: 'sbn-rust',
    cropId: 'soybean',
    name: 'Rust',
    scientificName: 'Phakopsora pachyrhizi',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'Tan to dark-brown or reddish-brown lesions, particularly on the lower leaf surface.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'sbn-rust': 5 },
    traits: { lesionCentre: ['Brown'] },
  },
  {
    id: 'sbn-mosaic',
    cropId: 'soybean',
    name: 'Soybean Mosaic',
    scientificName: 'Soybean mosaic virus',
    type: 'Virus',
    parts: ['LEAF', 'WHOLE_PLANT'],
    stages: [UNKNOWN_STAGE],
    overview: 'Distorted, puckered, crinkled or narrow leaves; plants may be stunted.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'sbn-mosaic': 5 },
    traits: { distribution: ['Patchy', 'Throughout field'] },
  },
  {
    id: 'sbn-web-blight',
    cropId: 'soybean',
    name: 'Web Blight',
    scientificName: 'Rhizoctonia solani',
    type: 'Fungus',
    parts: ['LEAF'],
    stages: [UNKNOWN_STAGE],
    overview: 'Water-soaked lesions turn greenish-brown, reddish-brown or dark.',
    references: [{ label: 'TNAU Agricultural Crop Disease Management', url: TNAU_MGMT }],
    symptomWeights: { 'sbn-webblight': 5 },
    traits: { lesionCentre: ['Brown', 'Black'] },
  },
];

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

  for (const [symptomId, weight] of Object.entries(disease.symptomWeights)) {
    max += weight;
    if (input.selectedSymptomIds.includes(symptomId)) {
      const v = partial.has(symptomId) ? 0.5 : 1;
      raw += weight * v;
      matched.push(defById.get(symptomId)?.label || symptomId);
    } else {
      missing.push(defById.get(symptomId)?.label || symptomId);
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
