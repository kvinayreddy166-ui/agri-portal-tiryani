import { supabase } from '../lib/supabase';

export type CropProtectionCategory = 'weed' | 'pest' | 'disease' | 'nutrient';
export type ControlType = 'cultural' | 'mechanical' | 'biological' | 'chemical' | 'general_ipm';
export type SeverityLevel = 'low' | 'medium' | 'high';
export type LanguageCode = 'en' | 'te';

export type CropProtectionRecommendation = {
  id: string;
  item_id?: string;
  control_type: ControlType;
  severity_level: SeverityLevel;
  recommendation_en: string;
  recommendation_te?: string;
  chemical_name?: string | null;
  formulation?: string | null;
  dose_per_litre?: string | null;
  dose_per_acre?: string | null;
  dose_per_tank_16l?: string | null;
  dose_per_tank_20l?: string | null;
  waiting_period?: string | null;
  safety_note_en?: string | null;
  safety_note_te?: string | null;
  source_url?: string | null;
  active?: boolean;
};

export type CropProtectionItem = {
  id: string;
  crop_id?: string;
  category: CropProtectionCategory;
  name_en: string;
  name_te?: string;
  scientific_name?: string | null;
  symptoms_en?: string | null;
  symptoms_te?: string | null;
  damage_en?: string | null;
  damage_te?: string | null;
  favourable_conditions_en?: string | null;
  favourable_conditions_te?: string | null;
  etl?: string | null;
  stage?: string | null;
  severity_level: SeverityLevel;
  image_urls?: string[];
  source_name?: string | null;
  source_url?: string | null;
  source_priority?: number;
  is_verified?: boolean;
  active?: boolean;
  recommendations?: CropProtectionRecommendation[];
};

export type CropProtectionCrop = {
  id: string;
  crop_key: string;
  name_en: string;
  name_te?: string;
  image_url?: string | null;
  display_order: number;
  active?: boolean;
  items: CropProtectionItem[];
};

const CACHE_KEY = 'tiryani-crop-protection-cache-v2';
const FALLBACK_MESSAGE = 'Official recommendation will be updated soon. Please follow local PJTSAU/Department advisory.';
const SUPABASE_LOAD_TIMEOUT_MS = 2200;

export async function loadCropProtectionData(): Promise<CropProtectionCrop[]> {
  try {
    const { data, error } = await withTimeout(loadSupabaseCropProtectionData(), SUPABASE_LOAD_TIMEOUT_MS);

    if (error) throw error;
    const normalized = normalizeSupabaseRows(data || []);
    if (normalized.length) {
      cacheCropProtectionData(normalized);
      return normalizeNeverEmpty(normalized);
    }
  } catch (error) {
    console.warn('Crop protection Supabase data unavailable, using cache/seed:', error);
  }

  const cached = readCachedCropProtectionData();
  if (cached.length) return normalizeNeverEmpty(cached);
  const seed = await loadSeedData().catch(() => defaultSeedData());
  cacheCropProtectionData(seed);
  return normalizeNeverEmpty(seed);
}

async function loadSupabaseCropProtectionData() {
  return supabase
    .from('crop_protection_crops')
    .select(`
      id,
      crop_key,
      name_en,
      name_te,
      image_url,
      display_order,
      active,
      crop_protection_items (
        id,
        crop_id,
        category,
        name_en,
        name_te,
        scientific_name,
        symptoms_en,
        symptoms_te,
        damage_en,
        damage_te,
        favourable_conditions_en,
        favourable_conditions_te,
        etl,
        stage,
        severity_level,
        image_urls,
        source_name,
        source_url,
        source_priority,
        is_verified,
        active,
        crop_protection_recommendations (
          id,
          item_id,
          control_type,
          severity_level,
          recommendation_en,
          recommendation_te,
          chemical_name,
          formulation,
          dose_per_litre,
          dose_per_acre,
          dose_per_tank_16l,
          dose_per_tank_20l,
          waiting_period,
          safety_note_en,
          safety_note_te,
          source_url,
          active
        )
      )
    `)
    .eq('active', true)
    .order('display_order');
}

export async function saveCropProtectionItem(item: Partial<CropProtectionItem> & { crop_id: string }) {
  const payload = {
    crop_id: item.crop_id,
    category: item.category || 'pest',
    name_en: item.name_en || 'New official item',
    name_te: item.name_te || '',
    scientific_name: item.scientific_name || '',
    symptoms_en: item.symptoms_en || FALLBACK_MESSAGE,
    symptoms_te: item.symptoms_te || '',
    damage_en: item.damage_en || FALLBACK_MESSAGE,
    damage_te: item.damage_te || '',
    favourable_conditions_en: item.favourable_conditions_en || FALLBACK_MESSAGE,
    favourable_conditions_te: item.favourable_conditions_te || '',
    etl: item.etl || '',
    stage: item.stage || '',
    severity_level: item.severity_level || 'medium',
    image_urls: item.image_urls || [],
    source_name: item.source_name || 'Official source pending',
    source_url: item.source_url || '',
    source_priority: item.source_priority || 100,
    is_verified: Boolean(item.is_verified),
    active: item.active ?? true,
  };

  if (item.id) {
    return supabase.from('crop_protection_items').update(payload).eq('id', item.id);
  }
  return supabase.from('crop_protection_items').insert(payload);
}

export function buildGeneralIpmItem(crop: CropProtectionCrop, category: CropProtectionCategory): CropProtectionItem {
  const categoryName = category === 'weed' ? 'Weed' : category === 'pest' ? 'Pest' : category === 'disease' ? 'Disease' : 'Nutrient deficiency';
  return {
    id: `${crop.crop_key}-${category}-general-ipm`,
    category,
    name_en: `${categoryName} guidance pending`,
    name_te: '',
    symptoms_en: 'Identify by field symptoms and compare with official crop protection advisory.',
    damage_en: FALLBACK_MESSAGE,
    favourable_conditions_en: FALLBACK_MESSAGE,
    etl: 'Refer latest local Department/PJTSAU advisory.',
    stage: 'All stages',
    severity_level: 'medium',
    image_urls: [],
    source_name: 'General IPM fallback',
    source_url: 'https://www.pjtsau.edu.in/',
    is_verified: false,
    active: true,
    recommendations: [
      {
        id: `${crop.crop_key}-${category}-general-ipm-rec`,
        control_type: 'general_ipm',
        severity_level: 'medium',
        recommendation_en:
          'General IPM: scout fields regularly, remove affected plant parts, avoid excess nitrogen, maintain spacing, use pheromone/light/yellow sticky traps where applicable, and follow local PJTSAU/Department advisory for chemical spray.',
        recommendation_te: '',
        safety_note_en:
          'Use chemicals only as per latest CIBRC label and local Department/PJTSAU recommendation.',
        source_url: 'https://www.pjtsau.edu.in/',
      },
    ],
  };
}

export function advisoryText(
  crop: CropProtectionCrop,
  item: CropProtectionItem,
  language: LanguageCode
) {
  const cropName = pickLang(crop.name_en, crop.name_te, language);
  const itemName = pickLang(item.name_en, item.name_te, language);
  const symptoms = pickLang(item.symptoms_en, item.symptoms_te, language);
  const damage = pickLang(item.damage_en, item.damage_te, language);
  const controls = (item.recommendations || [])
    .map((rec) => {
      const dose = [rec.dose_per_litre, rec.dose_per_acre, rec.dose_per_tank_16l, rec.dose_per_tank_20l]
        .filter(Boolean)
        .join(', ');
      return `${controlLabel(rec.control_type)}: ${pickLang(rec.recommendation_en, rec.recommendation_te, language)}${dose ? ` Dose: ${dose}` : ''}`;
    })
    .join('\n');

  return [
    `${cropName} - ${itemName}`,
    item.scientific_name ? `Scientific name: ${item.scientific_name}` : '',
    `Symptoms: ${symptoms}`,
    `Damage: ${damage}`,
    `ETL/Threshold: ${item.etl || 'Refer latest local advisory.'}`,
    `Control Measures:\n${controls || FALLBACK_MESSAGE}`,
    `Safety: Use chemicals only as per latest CIBRC label and local Department/PJTSAU recommendation.`,
    `Source: ${item.source_name || 'Official source pending'} ${item.source_url || ''}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function pickLang(en?: string | null, te?: string | null, language: LanguageCode = 'en') {
  const cleanTe = hasTelugu(te) ? te?.trim() : '';
  if (language === 'te') return cleanTe || en?.trim() || FALLBACK_MESSAGE;
  return en?.trim() || cleanTe || FALLBACK_MESSAGE;
}

export function hasTelugu(value?: string | null) {
  return Boolean(value?.trim() && /[\u0C00-\u0C7F]/.test(value));
}

export function controlLabel(type: ControlType) {
  const labels: Record<ControlType, string> = {
    cultural: 'Cultural Control',
    mechanical: 'Mechanical Control',
    biological: 'Biological Control',
    chemical: 'Chemical Control',
    general_ipm: 'General IPM',
  };
  return labels[type];
}

type SupabaseCropProtectionItem = CropProtectionItem & {
  crop_protection_recommendations?: CropProtectionRecommendation[];
};

type SupabaseCropProtectionCrop = Omit<CropProtectionCrop, 'items'> & {
  crop_protection_items?: SupabaseCropProtectionItem[];
};

function normalizeSupabaseRows(rows: SupabaseCropProtectionCrop[]): CropProtectionCrop[] {
  return rows.map((crop) => ({
    ...crop,
    items: (crop.crop_protection_items || [])
      .filter((item) => item.active !== false)
      .map((item) => ({
        ...item,
        image_urls: Array.isArray(item.image_urls) ? item.image_urls : [],
        recommendations: (item.crop_protection_recommendations || []).filter(
          (rec) => rec.active !== false
        ),
      })),
  }));
}
function normalizeNeverEmpty(crops: CropProtectionCrop[]) {
  return crops.map((crop) => ({
    ...crop,
    name_te: teluguCropName(crop.crop_key, crop.name_te),
    items: (crop.items || []).map((item) => ({
      ...item,
      symptoms_en: item.symptoms_en || FALLBACK_MESSAGE,
      damage_en: item.damage_en || FALLBACK_MESSAGE,
      favourable_conditions_en: item.favourable_conditions_en || FALLBACK_MESSAGE,
      recommendations: item.recommendations?.length
        ? item.recommendations
        : buildGeneralIpmItem(crop, item.category).recommendations,
    })),
  }));
}

async function loadSeedData(): Promise<CropProtectionCrop[]> {
  const response = await fetch('/data/crop-protection-seed.json', { cache: 'force-cache' });
  if (!response.ok) throw new Error('Crop protection seed file unavailable.');
  const json = await response.json();
  return json.crops || [];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Crop protection data request timed out.')), timeoutMs);
    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timer));
  });
}

function teluguCropName(cropKey: string, fallback?: string | null) {
  const names: Record<string, string> = {
    cotton: '\u0C2A\u0C24\u0C4D\u0C24\u0C3F',
    paddy: '\u0C35\u0C30\u0C3F',
    maize: '\u0C2E\u0C4A\u0C15\u0C4D\u0C15\u0C1C\u0C4A\u0C28\u0C4D\u0C28',
    redgram: '\u0C15\u0C02\u0C26\u0C3F',
    greengram: '\u0C2A\u0C46\u0C38\u0C30',
    blackgram: '\u0C2E\u0C3F\u0C28\u0C41\u0C2E\u0C41',
    groundnut: '\u0C35\u0C47\u0C30\u0C41\u0C36\u0C46\u0C28\u0C17',
    soybean: '\u0C38\u0C4B\u0C2F\u0C3E\u0C2C\u0C40\u0C28\u0C4D',
    sunflower: '\u0C2A\u0C4A\u0C26\u0C4D\u0C26\u0C41\u0C24\u0C3F\u0C30\u0C41\u0C17\u0C41\u0C21\u0C41',
    sesamum: '\u0C28\u0C41\u0C35\u0C4D\u0C35\u0C41\u0C32\u0C41',
  };
  return names[cropKey] || (hasTelugu(fallback) ? fallback || '' : '');
}
function defaultSeedData(): CropProtectionCrop[] {
  const crops = [
    ['cotton', 'Cotton', '', '/images/cotton.webp'],
    ['paddy', 'Paddy', '', '/images/paddy.webp'],
    ['maize', 'Maize', '', '/images/maize.webp'],
    ['redgram', 'Redgram', '', '/images/pulses.webp'],
    ['groundnut', 'Groundnut', '', '/images/oilseeds.webp'],
    ['greengram', 'Greengram', '', '/images/greengram.webp'],
    ['sunflower', 'Sunflower', '', '/images/oilseeds.webp'],
    ['sesamum', 'Sesamum', '', '/images/oilseeds.webp'],
  ];

  return crops.map(([key, name, nameTe, image], index) => {
    const crop: CropProtectionCrop = {
      id: key,
      crop_key: key,
      name_en: name,
      name_te: nameTe,
      image_url: image,
      display_order: index + 1,
      active: true,
      items: [],
    };
    return {
      ...crop,
      items: [
        buildGeneralIpmItem(crop, 'weed'),
        buildGeneralIpmItem(crop, 'pest'),
        buildGeneralIpmItem(crop, 'disease'),
        buildGeneralIpmItem(crop, 'nutrient'),
      ],
    };
  });
}

function cacheCropProtectionData(crops: CropProtectionCrop[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ crops, savedAt: Date.now() }));
  } catch {
    // Ignore storage quota/private mode failures.
  }
}

function readCachedCropProtectionData(): CropProtectionCrop[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHE_KEY) || '{}');
    return Array.isArray(parsed.crops) ? parsed.crops : [];
  } catch {
    return [];
  }
}
