import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { getContentType, validateImageUploadFile } from '../lib/fileTypes';

let cropDatasetCache = null;
let cropListCache = null;
const CROP_CACHE_PREFIX = 'tiryani-crop-cache:';
const CROP_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const RELATIONS = `
  *,
  crop_varieties(*),
  crop_production(*),
  crop_fertilizers(*),
  crop_irrigation(*),
  crop_weeds(*),
  crop_pests(*),
  crop_diseases(*),
  crop_deficiencies(*),
  crop_advisories(*),
  crop_faqs(*),
  crop_images(*)
`;

const CROP_SLUG_ALIASES = {
  paddy: ['paddy', 'rice'],
  rice: ['rice', 'paddy'],
};

export async function fetchCrops({ search = '', slug = '', category = '' } = {}) {
  const canUseCache = !search && !slug && !category && cropListCache;
  if (canUseCache) return cropListCache;

  const cacheKey = buildCropCacheKey('list', { search, slug, category });
  const cachedRows = readCropCache(cacheKey);
  if (cachedRows) {
    if (!search && !slug && !category) cropListCache = cachedRows;
    return cachedRows;
  }

  if (!category) {
    const intelligenceRows = await fetchCropIntelligenceList({ search, slug });
    if (intelligenceRows.length) {
      if (!search && !slug) cropListCache = intelligenceRows;
      writeCropCache(cacheKey, intelligenceRows);
      return intelligenceRows;
    }
  }

  try {
    const slugCandidates = getCropSlugCandidates(slug);
    let query = supabase
      .from('crops')
      .select('id, slug, crop_name, name_en, name_te, scientific_name, description, image_url, acreage, profile, created_at')
      .order('crop_name');

    if (slug) query = slugCandidates.length > 1 ? query.in('slug', slugCandidates) : query.eq('slug', slug);
    if (search) query = query.or(`crop_name.ilike.%${search}%,name_en.ilike.%${search}%,name_te.ilike.%${search}%`);
    if (category) query = query.contains('profile', { category });

    const { data, error } = await query;
    if (error) throw error;
    if (data?.length) {
      if (!search && !slug && !category) cropListCache = data;
      writeCropCache(cacheKey, data);
      return data;
    }
  } catch (error) {
    console.warn('Trying crop_intelligence crop list fallback:', error);
    const intelligenceRows = await fetchCropIntelligenceList({ search, slug });
    if (intelligenceRows.length) {
      writeCropCache(cacheKey, intelligenceRows);
      return intelligenceRows;
    }
  }

  const localRows = localCrops(await loadLocalCropDataset(), { search, slug });
  writeCropCache(cacheKey, localRows);
  return localRows;
}

export async function fetchCropBySlug(slug) {
  const cacheKey = buildCropCacheKey('detail', { slug });
  const cachedCrop = readCropCache(cacheKey);
  if (cachedCrop) return cachedCrop;

  const intelligenceCrop = await fetchCropIntelligenceBySlug(slug);
  if (intelligenceCrop) {
    writeCropCache(cacheKey, intelligenceCrop);
    return intelligenceCrop;
  }

  let normalizedError = null;
  try {
    const slugCandidates = getCropSlugCandidates(slug);
    const { data, error } = await supabase
      .from('crops')
      .select(RELATIONS)
      .in('slug', slugCandidates)
      .limit(slugCandidates.length || 1);

    if (error) throw error;
    const crop = pickPreferredSlugRow(data, slug, slugCandidates);
    if (crop) {
      if (hasCropDetailRows(crop)) {
        writeCropCache(cacheKey, crop);
        return crop;
      }
      console.warn('Normalized crop detail rows are empty; using local crop detail fallback.');
    }
  } catch (error) {
    normalizedError = error;
    console.warn('Trying crop_intelligence detail fallback:', error);
  }

  if (normalizedError) {
    console.warn('Using local crop detail fallback:', normalizedError);
  }
  const localCrop = localCropBySlug(await loadLocalCropDataset(), slug);
  if (localCrop) writeCropCache(cacheKey, localCrop);
  return localCrop;
}

export async function searchCropKnowledge(search, filters = {}) {
  const term = (search || '').trim();
  if (!term && !filters.cropSlug && !filters.category) return [];

  const cacheKey = buildCropCacheKey('faqs', {
    term,
    cropSlug: filters.cropSlug || '',
    category: filters.category || '',
    limit: filters.limit || 50,
  });
  const cachedFaqs = readCropCache(cacheKey);
  if (cachedFaqs) return cachedFaqs;

  try {
    const crops = filters.cropSlug ? await fetchCrops({ slug: filters.cropSlug }) : [];
    const cropId = crops[0]?.id;

    let query = supabase
      .from('crop_faqs')
      .select('id, crop_id, category, question, answer, answer_te, crops(slug, crop_name, name_en, name_te)')
      .limit(filters.limit || 50);

    if (cropId && !String(cropId).startsWith('local-')) query = query.eq('crop_id', cropId);
    if (filters.category) query = query.eq('category', filters.category);
    if (term) query = query.or(`question.ilike.%${term}%,answer.ilike.%${term}%,answer_te.ilike.%${term}%`);

    const { data, error } = await query;
    if (error) throw error;
    if (data?.length) {
      writeCropCache(cacheKey, data);
      return data;
    }
  } catch (error) {
    console.warn('Using local FAQ fallback:', error);
  }

  const localRows = localFaqs(await loadLocalCropDataset(), { search: term, cropSlug: filters.cropSlug, category: filters.category, limit: filters.limit });
  writeCropCache(cacheKey, localRows);
  return localRows;
}

export async function fetchCropImages({ cropSlug, entityType, entityName } = {}) {
  const cacheKey = buildCropCacheKey('images', { cropSlug, entityType, entityName });
  const cachedImages = readCropCache(cacheKey);
  if (cachedImages) return cachedImages;

  try {
    let query = supabase
      .from('crop_images')
      .select('id, crop_id, entity_type, entity_name, image_url, caption, source_url, created_at, crops(slug, crop_name)');

    if (cropSlug) {
      const crops = await fetchCrops({ slug: cropSlug });
      if (crops[0]?.id && !String(crops[0].id).startsWith('local-')) query = query.eq('crop_id', crops[0].id);
    }
    if (entityType) query = query.eq('entity_type', entityType);
    if (entityName) query = query.ilike('entity_name', `%${entityName}%`);

    const { data, error } = await query.order('entity_type');
    if (error) throw error;
    if (data?.length) {
      writeCropCache(cacheKey, data);
      return data;
    }
  } catch (error) {
    console.warn('Using local image fallback:', error);
  }

  const localRows = localImages(await loadLocalCropDataset(), { cropSlug, entityType, entityName });
  writeCropCache(cacheKey, localRows);
  return localRows;
}

export async function createCropRecord(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  invalidateCropCaches();
  return data;
}

export async function updateCropRecord(table, id, payload) {
  const { data, error } = await supabase
    .from(table)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  invalidateCropCaches();
  return data;
}

export async function deleteCropRecord(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  invalidateCropCaches();
}

export async function saveCropIntelligenceCard(slug, table, record) {
  const row = await ensureCropIntelligenceRow(slug, record.crop_name || record.name_en || record.name || '');
  if (!row) throw new Error('Crop intelligence record was not found.');

  const content = { ...(row.content || {}) };
  const risks = Array.isArray(row.risks) ? [...row.risks] : [];
  const index = Number.isInteger(record._index) ? record._index : null;
  const cleanRecord = stripAdminFields(record);
  const targetSlug = row.slug || slug;

  if (table === 'ci_varieties') {
    content.varieties = upsertArrayItem(content.varieties, index, toIntelligenceVariety(cleanRecord));
  } else if (table === 'ci_practices') {
    content.practices = upsertArrayItem(content.practices, index, toIntelligencePractice(cleanRecord));
  } else if (table === 'ci_risks') {
    const nextRisk = toIntelligenceRisk(cleanRecord);
    const nextRisks = upsertArrayItem(risks, index, nextRisk);
    const { data, error } = await supabase
      .from('crop_intelligence')
      .update({ risks: nextRisks, updated_at: new Date().toISOString() })
      .eq('slug', targetSlug)
      .select()
      .single();
    if (error) throw error;
    invalidateCropCaches();
    return data;
  } else {
    throw new Error(`Unsupported crop intelligence section: ${table}`);
  }

  const { data, error } = await supabase
    .from('crop_intelligence')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('slug', targetSlug)
    .select()
    .single();
  if (error) throw error;
  invalidateCropCaches();
  return data;
}

export async function deleteCropIntelligenceCard(slug, table, index) {
  const row = await ensureCropIntelligenceRow(slug);
  if (!row) throw new Error('Crop intelligence record was not found.');

  const content = { ...(row.content || {}) };
  const risks = Array.isArray(row.risks) ? [...row.risks] : [];
  const targetSlug = row.slug || slug;

  if (table === 'ci_varieties') {
    content.varieties = removeArrayItem(content.varieties, index);
  } else if (table === 'ci_practices') {
    content.practices = removeArrayItem(content.practices, index);
  } else if (table === 'ci_risks') {
    const nextRisks = removeArrayItem(risks, index);
    const { error } = await supabase
      .from('crop_intelligence')
      .update({ risks: nextRisks, updated_at: new Date().toISOString() })
      .eq('slug', targetSlug);
    if (error) throw error;
    invalidateCropCaches();
    return;
  } else {
    throw new Error(`Unsupported crop intelligence section: ${table}`);
  }

  const { error } = await supabase
    .from('crop_intelligence')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('slug', targetSlug);
  if (error) throw error;
  invalidateCropCaches();
}

export async function uploadCropImage(file, cropSlug, entityType = 'crop') {
  const validationError = validateImageUploadFile(file);
  if (validationError) throw new Error(validationError);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeEntityType = String(entityType || 'crop').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const path = `crop-intelligence/${cropSlug}/${safeEntityType}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('uploads').upload(path, file, {
    cacheControl: '31536000',
    contentType: getContentType(file),
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  invalidateCropCaches();
  return data.publicUrl;
}

export async function deleteUploadedCropImage(imageUrl) {
  if (!imageUrl || !imageUrl.includes('/storage/v1/object/public/uploads/')) return;
  const path = decodeURIComponent(imageUrl.split('/storage/v1/object/public/uploads/')[1]?.split('?')[0] || '');
  if (!path.startsWith('crop-intelligence/')) return;
  const { error } = await supabase.storage.from('uploads').remove([path]);
  if (error) throw error;
  invalidateCropCaches();
}

export async function bulkImportCropJson(records) {
  const items = Array.isArray(records) ? records : [records];
  const results = [];

  for (const item of items) {
    const crop = item.crop_profile ? item : null;
    if (!crop?.slug) continue;

    const { data: cropRow, error } = await supabase
      .from('crops')
      .upsert({
        crop_name: crop.crop_profile.name_en?.split('/')[0]?.trim() || crop.slug,
        slug: crop.slug,
        name_en: crop.crop_profile.name_en,
        name_te: crop.crop_profile.name_te,
        scientific_name: crop.crop_profile.scientific_name,
        image_url: crop.crop_profile.image,
        source_pdf_name: crop.crop_profile.source_pdf_name,
        description: crop.crop_profile.description_en,
        profile: crop.crop_profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'crop_name' })
      .select()
      .single();

    if (error) throw error;
    invalidateCropCaches();
    results.push(cropRow);
  }

  return results;
}

function buildCropCacheKey(type, parts = {}) {
  return `${type}:${JSON.stringify(parts)}`;
}

function readCropCache(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const storageKey = `${CROP_CACHE_PREFIX}${key}`;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached || cached.expiresAt < Date.now()) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return cached.value;
  } catch {
    return null;
  }
}

function writeCropCache(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(
      `${CROP_CACHE_PREFIX}${key}`,
      JSON.stringify({
        value,
        expiresAt: Date.now() + CROP_CACHE_TTL_MS,
      })
    );
  } catch {
    // Storage can be unavailable or full; normal live fetching still works.
  }
}

function invalidateCropCaches() {
  cropListCache = null;

  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(CROP_CACHE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Cache invalidation should never block data changes.
  }
}

function getCropSlugCandidates(slug) {
  const cleanSlug = String(slug || '').trim().toLowerCase();
  if (!cleanSlug) return [];
  return Array.from(new Set(CROP_SLUG_ALIASES[cleanSlug] || [cleanSlug]));
}

function pickPreferredSlugRow(rows, slug, candidates = getCropSlugCandidates(slug)) {
  const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
  if (!list.length) return null;

  for (const candidate of candidates) {
    const match = list.find((row) => String(row?.slug || '').toLowerCase() === candidate);
    if (match) return match;
  }

  return list[0] || null;
}

function hasCropDetailRows(crop) {
  return [
    'crop_varieties',
    'crop_production',
    'crop_fertilizers',
    'crop_irrigation',
    'crop_weeds',
    'crop_pests',
    'crop_diseases',
    'crop_deficiencies',
    'crop_advisories',
    'crop_faqs',
    'crop_practices',
    'ci_risks',
  ].some((key) => Array.isArray(crop?.[key]) && crop[key].length > 0);
}

function findLocalCropItem(cropDataset, slug) {
  const candidates = getCropSlugCandidates(slug);
  return cropDataset.find((crop) => candidates.includes(String(crop.slug || '').toLowerCase()));
}

export function exportCropWorkbook(crop) {
  const workbook = XLSX.utils.book_new();
  const sheets = {
    profile: [crop],
    varieties: crop.crop_varieties || [],
    pests: crop.crop_pests || [],
    diseases: crop.crop_diseases || [],
    weeds: crop.crop_weeds || [],
    fertilizers: crop.crop_fertilizers || [],
    faqs: crop.crop_faqs || [],
  };

  Object.entries(sheets).forEach(([name, rows]) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name.slice(0, 31));
  });

  XLSX.writeFile(workbook, `${crop.slug || crop.crop_name}-crop-intelligence.xlsx`);
}

async function loadLocalCropDataset() {
  if (cropDatasetCache) return cropDatasetCache;

  try {
    const response = await fetch('/data/crop-intelligence.json');
    if (!response.ok) throw new Error(`Unable to load local crop dataset: ${response.status}`);
    cropDatasetCache = await response.json();
  } catch (error) {
    console.warn('Local crop dataset is unavailable:', error);
    cropDatasetCache = [];
  }

  return cropDatasetCache;
}

function localCrops(cropDataset, { search = '', slug = '' } = {}) {
  const needle = search.toLowerCase();
  const slugCandidates = getCropSlugCandidates(slug);
  return cropDataset
    .filter((item) => !slug || slugCandidates.includes(String(item.slug || '').toLowerCase()))
    .filter((item) => {
      if (!needle) return true;
      return `${item.crop_profile.name_en} ${item.crop_profile.name_te} ${item.slug}`.toLowerCase().includes(needle);
    })
    .map((item) => ({
      id: `local-${item.slug}`,
      crop_name: item.crop_profile.name_en.split('/')[0].trim(),
      acreage: 0,
      description: item.crop_profile.description_en,
      image_url: item.crop_profile.image,
      slug: item.slug,
      name_en: item.crop_profile.name_en,
      name_te: item.crop_profile.name_te,
      scientific_name: item.crop_profile.scientific_name,
      source_pdf_name: item.crop_profile.source_pdf_name,
      profile: {
        crop_profile: item.crop_profile.description_en,
        crop_profile_te: item.crop_profile.description_te,
        soil_requirements: item.soil_requirements.description_en,
        soil_requirements_te: item.soil_requirements.description_te,
        climate_requirements: item.climate_requirements.description_en,
        climate_requirements_te: item.climate_requirements.description_te,
        seed_rate_seed_treatment: item.seed_rate_seed_treatment,
        sowing_time_spacing_land_preparation: item.sowing_time_spacing_land_preparation,
        harvesting_yield: item.harvesting,
      },
    }));
}

async function fetchCropIntelligenceList({ search = '', slug = '' } = {}) {
  try {
    const slugCandidates = getCropSlugCandidates(slug);
    let query = supabase
      .from('crop_intelligence')
      .select('id, slug, name_en, name_te, scientific_name, crop_image_url, source_pdf_name, updated_at')
      .order('name_en');
    if (slug) query = query.in('slug', slugCandidates);
    if (search) query = query.or(`name_en.ilike.%${search}%,name_te.ilike.%${search}%,slug.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    const rows = slug ? [pickPreferredSlugRow(data, slug, slugCandidates)].filter(Boolean) : data || [];
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      crop_name: row.name_en,
      name_en: row.name_en,
      name_te: row.name_te,
      scientific_name: row.scientific_name,
      image_url: row.crop_image_url,
      source_pdf_name: row.source_pdf_name,
      __source: 'crop_intelligence',
    }));
  } catch (error) {
    console.warn('crop_intelligence crop list fallback failed:', error);
    return [];
  }
}

async function fetchRawCropIntelligence(slug) {
  const slugCandidates = getCropSlugCandidates(slug);
  const { data, error } = await supabase
    .from('crop_intelligence')
    .select('id, slug, name_en, name_te, scientific_name, crop_image_url, source_pdf_name, source_pdf_url, content, risks')
    .in('slug', slugCandidates)
    .limit(slugCandidates.length || 1);
  if (error) throw error;
  return pickPreferredSlugRow(data, slug, slugCandidates);
}

async function ensureCropIntelligenceRow(slug, cropName = '') {
  const existingRow = await fetchRawCropIntelligence(slug);
  if (existingRow) return existingRow;

  const payload = buildCropIntelligencePayload(await loadLocalCropDataset(), slug, cropName);
  const { data, error } = await supabase
    .from('crop_intelligence')
    .upsert(payload, { onConflict: 'slug' })
    .select()
    .single();

  if (error) throw error;
  invalidateCropCaches();
  return data;
}

async function fetchCropIntelligenceBySlug(slug) {
  try {
    const data = await fetchRawCropIntelligence(slug);
    return data ? mapCropIntelligenceRow(data) : null;
  } catch (error) {
    console.warn('crop_intelligence detail fallback failed:', error);
    return null;
  }
}

function mapCropIntelligenceRow(row) {
  const content = row.content || {};
  const risks = Array.isArray(row.risks) ? row.risks : [];
  const varieties = Array.isArray(content.varieties) ? content.varieties : [];
  const practices = Array.isArray(content.practices) ? content.practices : [];

  return {
    id: row.id,
    __source: 'crop_intelligence',
    slug: row.slug,
    crop_name: row.name_en,
    name_en: row.name_en,
    name_te: row.name_te,
    scientific_name: row.scientific_name,
    source_pdf_name: row.source_pdf_name,
    image_url: row.crop_image_url,
    crop_image_url: row.crop_image_url,
    description: getLocalized(content.soil) || getLocalized(content.duration) || '',
    profile: {
      crop_profile: getLocalized(content.soil),
      crop_profile_te: getLocalized(content.soil, 'te'),
      soil_requirements: getLocalized(content.soil),
      soil_requirements_te: getLocalized(content.soil, 'te'),
      seed_rate_seed_treatment: getLocalized(content.duration),
    },
    crop_varieties: varieties.map((item, index) => ({
      id: `ci_varieties:${index}`,
      _table: 'ci_varieties',
      _index: index,
      variety: item.name || '',
      name: item.name || '',
      duration: item.duration || '',
      expected_yield: item.expected_yield || '',
      special_features: getLocalized(item.notes),
      notes_en: getLocalized(item.notes),
      notes_te: getLocalized(item.notes, 'te'),
      image_url: item.image_url || '',
    })),
    crop_practices: practices.map((item, index) => ({
      id: `ci_practices:${index}`,
      _table: 'ci_practices',
      _index: index,
      key: item.key || `practice-${index + 1}`,
      title_en: getLocalized(item.title),
      title_te: getLocalized(item.title, 'te'),
      body_en: getLocalized(item.body),
      body_te: getLocalized(item.body, 'te'),
    })),
    crop_pests: risks
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => String(item.type || '').toLowerCase() === 'pest')
      .map(({ item, index }) => mapRiskToCard(item, index, 'pest')),
    crop_diseases: risks
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => String(item.type || '').toLowerCase() === 'disease')
      .map(({ item, index }) => mapRiskToCard(item, index, 'disease')),
    ci_risks: risks.map((item, index) => mapRiskToCard(item, index, 'risk')),
  };
}

function mapRiskToCard(item, index, kind) {
  const chemicals = Array.isArray(item.chemicals) ? item.chemicals : [];
  const newChemicals = Array.isArray(item.newChemicals) ? item.newChemicals : [];
  const base = {
    id: `ci_risks:${index}`,
    _table: 'ci_risks',
    _index: index,
    type: item.type || (kind === 'disease' ? 'Disease' : 'Pest'),
    name_en: getLocalized(item.name),
    name_te: getLocalized(item.name, 'te'),
    symptoms_en: getLocalized(item.symptoms),
    symptoms_te: getLocalized(item.symptoms, 'te'),
    control_en: getLocalized(item.control),
    control_te: getLocalized(item.control, 'te'),
    chemicals,
    newChemicals,
    chemicals_text: chemicals.join(', '),
    new_chemicals_text: newChemicals.join(', '),
    image_url: item.image_url || '',
    image_source_url: item.image_source_url || '',
  };
  return {
    ...base,
    pest_name: base.name_en,
    disease_name: base.name_en,
    scientific_name: '',
    causal_organism: '',
    symptoms: base.symptoms_en,
    management: base.control_en,
    chemical_control: chemicals.join(', '),
    fungicide: chemicals.join(', '),
  };
}

function getLocalized(value, lang = 'en') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.en || value.te || '';
}

function stripAdminFields(record) {
  const { id, _table, _index, created_at, updated_at, crops, ...rest } = record;
  void id;
  void _table;
  void _index;
  void created_at;
  void updated_at;
  void crops;
  return rest;
}

function upsertArrayItem(value, index, item) {
  const next = Array.isArray(value) ? [...value] : [];
  if (Number.isInteger(index) && index >= 0 && index < next.length) {
    next[index] = item;
  } else {
    next.push(item);
  }
  return next;
}

function removeArrayItem(value, index) {
  const next = Array.isArray(value) ? [...value] : [];
  if (Number.isInteger(index) && index >= 0) next.splice(index, 1);
  return next;
}

function csvToArray(value) {
  if (Array.isArray(value)) return value;
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toIntelligenceVariety(record) {
  return {
    name: record.name || record.variety || '',
    duration: record.duration || '',
    expected_yield: record.expected_yield || '',
    notes: {
      en: record.notes_en || record.special_features || '',
      te: record.notes_te || '',
    },
    image_url: record.image_url || '',
  };
}

function toIntelligencePractice(record) {
  return {
    key: record.key || (record.title_en || 'practice').toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    title: {
      en: record.title_en || '',
      te: record.title_te || '',
    },
    body: {
      en: record.body_en || '',
      te: record.body_te || '',
    },
  };
}

function toIntelligenceRisk(record) {
  return {
    type: record.type || 'Pest',
    name: {
      en: record.name_en || record.pest_name || record.disease_name || '',
      te: record.name_te || '',
    },
    symptoms: {
      en: record.symptoms_en || record.symptoms || '',
      te: record.symptoms_te || '',
    },
    control: {
      en: record.control_en || record.management || '',
      te: record.control_te || '',
    },
    chemicals: csvToArray(record.chemicals_text || record.chemicals || record.chemical_control || record.fungicide),
    newChemicals: csvToArray(record.new_chemicals_text || record.newChemicals),
    image_url: record.image_url || '',
    image_source_url: record.image_source_url || '',
  };
}

function buildCropIntelligencePayload(cropDataset, slug, cropName = '') {
  const item = findLocalCropItem(cropDataset, slug);
  const fallbackSlug = String(slug || 'crop').trim().toLowerCase() || 'crop';
  const displayName = String(cropName || fallbackSlug).trim() || fallbackSlug;

  if (!item) {
    return {
      slug: fallbackSlug,
      name_en: displayName,
      name_te: displayName,
      scientific_name: '',
      crop_image_url: '',
      source_pdf_name: '',
      content: {
        soil: { en: '', te: '' },
        duration: { en: '', te: '' },
        varieties: [],
        practices: [],
      },
      risks: [],
      updated_at: new Date().toISOString(),
    };
  }

  const profile = item.crop_profile || {};
  const soil = item.soil_requirements || {};
  return {
    slug: item.slug || fallbackSlug,
    name_en: profile.name_en || item.slug || fallbackSlug,
    name_te: profile.name_te || profile.name_en || item.slug || fallbackSlug,
    scientific_name: profile.scientific_name || '',
    crop_image_url: profile.image || '',
    source_pdf_name: profile.source_pdf_name || '',
    content: {
      soil: {
        en: soil.description_en || profile.description_en || '',
        te: soil.description_te || profile.description_te || soil.description_en || profile.description_en || '',
      },
      duration: {
        en: item.harvesting?.duration || item.harvesting_yield || item.seed_rate_seed_treatment || '',
        te: item.harvesting?.duration_te || item.harvesting_yield_te || item.seed_rate_seed_treatment || '',
      },
      varieties: item.recommended_varieties.map((row) => ({
        name: row.variety || '',
        duration: row.duration || '',
        expected_yield: row.yield || row.expected_yield || '',
        notes: {
          en: row.special_features || '',
          te: row.special_features_te || row.special_features || '',
        },
        image_url: row.image || row.image_url || '',
      })),
      practices: localPracticeCardsFromItem(item),
    },
    risks: localRiskCardsFromItem(item),
    updated_at: new Date().toISOString(),
  };
}

function localPracticeCardsFromItem(item) {
  return (item.crop_production_practices || []).map((row, index) => ({
    key: slugifyKey(row.stage, `practice_${index + 1}`),
    title: {
      en: row.stage || `Practice ${index + 1}`,
      te: row.stage_te || row.stage || `Practice ${index + 1}`,
    },
    body: {
      en: row.description_en || row.description || '',
      te: row.description_te || row.description_en || row.description || '',
    },
  }));
}

function localPracticeRowsFromItem(item) {
  return localPracticeCardsFromItem(item).map((practice, index) => ({
    id: `ci_practices:${index}`,
    _table: 'ci_practices',
    _index: index,
    key: practice.key,
    title_en: practice.title.en,
    title_te: practice.title.te,
    body_en: practice.body.en,
    body_te: practice.body.te,
  }));
}

function localRiskCardsFromItem(item) {
  const pests = (item.pest_management || []).map((row) => ({
    type: 'Pest',
    name: {
      en: row.pest_name || '',
      te: row.pest_name_te || row.pest_name || '',
    },
    symptoms: {
      en: row.symptoms || '',
      te: row.symptoms_te || row.symptoms || '',
    },
    control: {
      en: row.management || '',
      te: row.management_te || row.management || '',
    },
    chemicals: csvToArray(row.chemical_control),
    newChemicals: csvToArray(row.new_chemicals || row.newChemicals),
    image_url: row.image_url || row.image || '',
    image_source_url: row.image_source_url || '',
  }));

  const diseases = (item.disease_management || []).map((row) => ({
    type: 'Disease',
    name: {
      en: row.disease_name || '',
      te: row.disease_name_te || row.disease_name || '',
    },
    symptoms: {
      en: row.symptoms || '',
      te: row.symptoms_te || row.symptoms || '',
    },
    control: {
      en: row.management || '',
      te: row.management_te || row.management || '',
    },
    chemicals: csvToArray(row.fungicide || row.chemical_control),
    newChemicals: csvToArray(row.new_chemicals || row.newChemicals),
    image_url: row.image_url || row.image || '',
    image_source_url: row.image_source_url || '',
  }));

  return [...pests, ...diseases];
}

function slugifyKey(value, fallback) {
  const key = String(value || fallback || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return key || fallback;
}

function localCropBySlug(cropDataset, slug) {
  const item = findLocalCropItem(cropDataset, slug);
  if (!item) return null;
  const [base] = localCrops(cropDataset, { slug: item.slug });
  const riskCards = localRiskCardsFromItem(item);
  return {
    ...base,
    crop_varieties: item.recommended_varieties.map((row, index) => ({
      id: row.id,
      _table: 'ci_varieties',
      _index: index,
      crop_id: base.id,
      variety: row.variety,
      name: row.variety,
      duration: row.duration,
      expected_yield: row.yield,
      special_features: row.special_features,
      notes_en: row.special_features,
      notes_te: row.special_features_te || '',
      image_url: row.image,
    })),
    crop_practices: localPracticeRowsFromItem(item),
    crop_production: item.crop_production_practices,
    crop_fertilizers: item.fertilizer_recommendations.map((row) => ({
      id: row.id,
      crop_id: base.id,
      stage: row.stage,
      fertilizer: row.fertilizer,
      quantity: row.quantity,
      method: row.method,
      description_te: row.description_te,
    })),
    crop_irrigation: item.irrigation_management.map((row, index) => ({
      id: `${item.slug}-irrigation-${index + 1}`,
      crop_id: base.id,
      stage: row.stage,
      recommendation_en: row.recommendation,
      recommendation_te: row.recommendation_te || row.recommendation,
    })),
    crop_weeds: item.weed_management.map((row) => ({
      id: row.id,
      crop_id: base.id,
      weed_name: row.weed_name,
      scientific_name: row.scientific_name,
      control_measure: row.control_measure,
      herbicide: row.herbicide,
      dose: row.dose,
      image_url: row.image,
    })),
    crop_pests: item.pest_management.map((row) => ({
      id: row.id,
      crop_id: base.id,
      pest_name: row.pest_name,
      scientific_name: row.scientific_name,
      symptoms: row.symptoms,
      management: row.management,
      chemical_control: row.chemical_control,
      image_url: row.image,
      image_source_url: row.image_source_url,
    })),
    crop_diseases: item.disease_management.map((row) => ({
      id: row.id,
      crop_id: base.id,
      disease_name: row.disease_name,
      causal_organism: row.causal_organism,
      symptoms: row.symptoms,
      management: row.management,
      fungicide: row.fungicide,
      image_url: row.image,
      image_source_url: row.image_source_url,
    })),
    crop_deficiencies: item.deficiency_symptoms.map((row, index) => ({
      id: `${item.slug}-deficiency-${index + 1}`,
      crop_id: base.id,
      deficiency_name: row.deficiency,
      nutrient: row.nutrient,
      symptoms: row.symptoms,
      correction: row.correction,
      image_url: row.image,
    })),
    crop_advisories: item.advisories.map((row, index) => ({
      id: `${item.slug}-advisory-${index + 1}`,
      crop_id: base.id,
      category: row.category,
      advisory_en: row.description_en,
      advisory_te: row.description_te,
    })),
    crop_faqs: item.faqs.map((row, index) => ({
      id: `${item.slug}-faq-${index + 1}`,
      crop_id: base.id,
      ...row,
    })),
    crop_images: localImages(cropDataset, { cropSlug: item.slug }),
    ci_risks: riskCards.map((risk, index) => mapRiskToCard(risk, index, 'risk')),
  };
}

function localFaqs(cropDataset, { search = '', cropSlug = '', category = '', limit = 50 } = {}) {
  const needle = search.toLowerCase();
  return cropDataset
    .filter((crop) => !cropSlug || crop.slug === cropSlug)
    .flatMap((crop) => crop.faqs.map((faq, index) => ({
      id: `${crop.slug}-faq-${index + 1}`,
      crop_id: `local-${crop.slug}`,
      ...faq,
      crops: {
        slug: crop.slug,
        crop_name: crop.crop_profile.name_en,
        name_en: crop.crop_profile.name_en,
        name_te: crop.crop_profile.name_te,
      },
    })))
    .filter((faq) => !category || faq.category === category)
    .filter((faq) => !needle || `${faq.question} ${faq.answer} ${faq.answer_te}`.toLowerCase().includes(needle))
    .slice(0, limit);
}

function localImages(cropDataset, { cropSlug = '', entityType = '', entityName = '' } = {}) {
  const needle = entityName.toLowerCase();
  return cropDataset
    .filter((crop) => !cropSlug || crop.slug === cropSlug)
    .flatMap((crop) => {
      const rows = [
        { entity_type: 'crop', entity_name: crop.crop_profile.name_en, image_url: crop.crop_profile.image },
        ...crop.pest_management.map((item) => ({ entity_type: 'pest', entity_name: item.pest_name, image_url: item.image, source_url: item.image_source_url })),
        ...crop.disease_management.map((item) => ({ entity_type: 'disease', entity_name: item.disease_name, image_url: item.image, source_url: item.image_source_url })),
        ...crop.deficiency_symptoms.map((item) => ({ entity_type: 'deficiency', entity_name: item.deficiency, image_url: item.image })),
      ];
      return rows.map((row, index) => ({
        id: `local-${crop.slug}-image-${index + 1}`,
        crop_id: `local-${crop.slug}`,
        source_name: 'Generated crop intelligence dataset',
        alt_text: `${row.entity_name} image for ${crop.crop_profile.name_en}`,
        ...row,
      }));
    })
    .filter((row) => !entityType || row.entity_type === entityType)
    .filter((row) => !needle || row.entity_name.toLowerCase().includes(needle));
}
