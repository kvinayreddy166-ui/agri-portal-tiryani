import { supabase } from '../lib/supabase';

export type CropProtectionCategory = 'weed' | 'pest' | 'disease';
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

const CACHE_KEY = 'tiryani-crop-protection-cache-v1';
const FALLBACK_MESSAGE = 'Official recommendation will be updated soon. Please follow local PJTSAU/Department advisory.';

export async function loadCropProtectionData(): Promise<CropProtectionCrop[]> {
  try {
    const { data, error } = await supabase
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
  const seed = await loadSeedData();
  cacheCropProtectionData(seed);
  return normalizeNeverEmpty(seed);
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
  const categoryName = category === 'weed' ? 'Weed' : category === 'pest' ? 'Pest' : 'Disease';
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
  if (language === 'te') return te?.trim() || en?.trim() || FALLBACK_MESSAGE;
  return en?.trim() || te?.trim() || FALLBACK_MESSAGE;
}

export function hasTelugu(value?: string | null) {
  return Boolean(value?.trim());
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

function normalizeSupabaseRows(rows: any[]): CropProtectionCrop[] {
  return rows.map((crop) => ({
    ...crop,
    items: (crop.crop_protection_items || [])
      .filter((item: CropProtectionItem) => item.active !== false)
      .map((item: any) => ({
        ...item,
        image_urls: Array.isArray(item.image_urls) ? item.image_urls : [],
        recommendations: (item.crop_protection_recommendations || []).filter(
          (rec: CropProtectionRecommendation) => rec.active !== false
        ),
      })),
  }));
}

function normalizeNeverEmpty(crops: CropProtectionCrop[]) {
  return crops.map((crop) => ({
    ...crop,
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
  const json = await response.json();
  return json.crops || [];
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
