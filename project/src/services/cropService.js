import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

let cropDatasetCache = null;

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

export async function fetchCrops({ search = '', slug = '', category = '' } = {}) {
  try {
    let query = supabase.from('crops').select('*').order('crop_name');

    if (slug) query = query.eq('slug', slug);
    if (search) query = query.or(`crop_name.ilike.%${search}%,name_en.ilike.%${search}%,name_te.ilike.%${search}%`);
    if (category) query = query.contains('profile', { category });

    const { data, error } = await query;
    if (error) throw error;
    if (data?.length) return data;
  } catch (error) {
    console.warn('Using local crop dataset fallback:', error);
  }

  return localCrops(await loadLocalCropDataset(), { search, slug });
}

export async function fetchCropBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from('crops')
      .select(RELATIONS)
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  } catch (error) {
    console.warn('Using local crop detail fallback:', error);
  }

  return localCropBySlug(await loadLocalCropDataset(), slug);
}

export async function searchCropKnowledge(search, filters = {}) {
  const term = (search || '').trim();
  if (!term && !filters.cropSlug && !filters.category) return [];

  try {
    const crops = filters.cropSlug ? await fetchCrops({ slug: filters.cropSlug }) : [];
    const cropId = crops[0]?.id;

    let query = supabase
      .from('crop_faqs')
      .select('*, crops(slug, crop_name, name_en, name_te)')
      .limit(filters.limit || 50);

    if (cropId && !String(cropId).startsWith('local-')) query = query.eq('crop_id', cropId);
    if (filters.category) query = query.eq('category', filters.category);
    if (term) query = query.or(`question.ilike.%${term}%,answer.ilike.%${term}%,answer_te.ilike.%${term}%`);

    const { data, error } = await query;
    if (error) throw error;
    if (data?.length) return data;
  } catch (error) {
    console.warn('Using local FAQ fallback:', error);
  }

  return localFaqs(await loadLocalCropDataset(), { search: term, cropSlug: filters.cropSlug, category: filters.category, limit: filters.limit });
}

export async function fetchCropImages({ cropSlug, entityType, entityName } = {}) {
  try {
    let query = supabase.from('crop_images').select('*, crops(slug, crop_name)');

    if (cropSlug) {
      const crops = await fetchCrops({ slug: cropSlug });
      if (crops[0]?.id && !String(crops[0].id).startsWith('local-')) query = query.eq('crop_id', crops[0].id);
    }
    if (entityType) query = query.eq('entity_type', entityType);
    if (entityName) query = query.ilike('entity_name', `%${entityName}%`);

    const { data, error } = await query.order('entity_type');
    if (error) throw error;
    if (data?.length) return data;
  } catch (error) {
    console.warn('Using local image fallback:', error);
  }

  return localImages(await loadLocalCropDataset(), { cropSlug, entityType, entityName });
}

export async function createCropRecord(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
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
  return data;
}

export async function deleteCropRecord(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function uploadCropImage(file, cropSlug, entityType = 'crop') {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `crop-intelligence/${cropSlug}/${entityType}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('uploads').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
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
    results.push(cropRow);
  }

  return results;
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
  return cropDataset
    .filter((item) => !slug || item.slug === slug)
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

function localCropBySlug(cropDataset, slug) {
  const item = cropDataset.find((crop) => crop.slug === slug);
  if (!item) return null;
  const [base] = localCrops(cropDataset, { slug });
  return {
    ...base,
    crop_varieties: item.recommended_varieties.map((row) => ({
      id: row.id,
      crop_id: base.id,
      variety: row.variety,
      duration: row.duration,
      expected_yield: row.yield,
      special_features: row.special_features,
      image_url: row.image,
    })),
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
