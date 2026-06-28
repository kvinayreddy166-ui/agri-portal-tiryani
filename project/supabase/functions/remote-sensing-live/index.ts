// Supabase Edge Function: remote-sensing-live
// Server-side Google Earth Engine integration for Sentinel-2, Sentinel-1 and rainfall anomaly.
// Required secrets:
//   GEE_SERVICE_ACCOUNT_JSON={"client_email":"...","private_key":"...","project_id":"..."}
// or:
//   GEE_CLIENT_EMAIL=...
//   GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
//   GEE_PROJECT_ID=...
// Optional:
//   GEE_ASSET_PROJECT=your-earth-engine-project-id
// Deploy with: supabase functions deploy remote-sensing-live
// Set secrets with: supabase secrets set GEE_SERVICE_ACCOUNT_JSON='...'

// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import ee from 'npm:@google/earthengine@0.1.390';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FEATURES = 25;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'POST required' }, 405);
  }

  try {
    const payload = await req.json();
    const features = Array.isArray(payload.features) ? payload.features.slice(0, MAX_FEATURES) : [];
    const startDate = String(payload.startDate || '').slice(0, 10);
    const endDate = String(payload.endDate || '').slice(0, 10);

    if (!features.length) {
      return json({ ok: false, error: 'No village features supplied' }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return json({ ok: false, error: 'startDate and endDate must be YYYY-MM-DD' }, 400);
    }

    const serviceAccount = readServiceAccount();
    if (!serviceAccount) {
      return json({
        ok: false,
        notConfigured: true,
        error: 'Google Earth Engine service account secrets are not configured for remote-sensing-live.',
      }, 200);
    }

    await initializeEarthEngine(serviceAccount);
    const observations = await computeVillageObservations({ features, startDate, endDate });
    return json({ ok: true, source: 'Google Earth Engine', startDate, endDate, observations }, 200);
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: error?.message || 'Remote sensing live integration failed' }, 500);
  }
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function readServiceAccount() {
  const jsonSecret = Deno.env.get('GEE_SERVICE_ACCOUNT_JSON');
  if (jsonSecret) {
    const parsed = JSON.parse(jsonSecret);
    return {
      client_email: parsed.client_email,
      private_key: normalizePrivateKey(parsed.private_key),
      project_id: parsed.project_id || Deno.env.get('GEE_PROJECT_ID') || Deno.env.get('GEE_ASSET_PROJECT'),
    };
  }

  const clientEmail = Deno.env.get('GEE_CLIENT_EMAIL');
  const privateKey = Deno.env.get('GEE_PRIVATE_KEY');
  if (!clientEmail || !privateKey) return null;

  return {
    client_email: clientEmail,
    private_key: normalizePrivateKey(privateKey),
    project_id: Deno.env.get('GEE_PROJECT_ID') || Deno.env.get('GEE_ASSET_PROJECT'),
  };
}

function normalizePrivateKey(value) {
  return String(value || '').replace(/\\n/g, '\n');
}

function initializeEarthEngine(serviceAccount) {
  return new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      serviceAccount,
      () => {
        if (serviceAccount.project_id && typeof ee.data.setCloudApiUserProject === 'function') {
          ee.data.setCloudApiUserProject(serviceAccount.project_id);
        }
        ee.initialize(null, null, resolve, reject);
      },
      reject
    );
  });
}

function getInfo(eeObject) {
  return new Promise((resolve, reject) => {
    eeObject.getInfo((result, error) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

async function computeVillageObservations({ features, startDate, endDate }) {
  const villageFeatures = ee.FeatureCollection(features.map((feature) => {
    const properties = feature.properties || {};
    return ee.Feature(feature.geometry, {
      village_code: String(properties.village_code || properties.admin_village_code || ''),
      village_name: String(properties.village_name || properties.admin_village_name || ''),
      district_name: String(properties.district_name || properties.admin_old_district_name || ''),
      mandal_name: String(properties.mandal_name || properties.block_mandal_name || properties.admin_old_block_mandal_name || ''),
    });
  }));

  const sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterDate(startDate, endDate)
    .filterBounds(villageFeatures)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 60))
    .map(maskSentinel2)
    .map(addSentinel2Indices);

  const s2Image = sentinel2.median().select(['NDVI', 'NDRE', 'NDMI', 'NDWI', 'SAVI']);
  const s2Stats = await reduceImageByVillages(s2Image, villageFeatures, 10);

  const sentinel1Mean = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterDate(startDate, endDate)
    .filterBounds(villageFeatures)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .select(['VV', 'VH'])
    .mean();
  const sentinel1 = sentinel1Mean.addBands(
    sentinel1Mean.select('VH').divide(sentinel1Mean.select('VV')).rename('VH_VV')
  );
  const s1Stats = await reduceImageByVillages(sentinel1.select(['VV', 'VH', 'VH_VV']), villageFeatures, 10);

  const rainfall = buildRainfallAnomalyImage(startDate, endDate);
  const rainfallStats = await reduceImageByVillages(rainfall, villageFeatures, 5500);

  const byCode = new Map();
  mergeStats(byCode, s2Stats);
  mergeStats(byCode, s1Stats);
  mergeStats(byCode, rainfallStats);

  return Array.from(byCode.values()).map((row) => ({
    villageCode: row.village_code,
    villageName: row.village_name,
    districtName: row.district_name,
    mandalName: row.mandal_name,
    acquisitionStart: startDate,
    acquisitionEnd: endDate,
    ndvi: cleanNumber(row.NDVI),
    ndre: cleanNumber(row.NDRE),
    ndmi: cleanNumber(row.NDMI),
    ndwi: cleanNumber(row.NDWI),
    savi: cleanNumber(row.SAVI),
    sentinel1Vv: cleanNumber(row.VV),
    sentinel1Vh: cleanNumber(row.VH),
    sentinel1VhVv: cleanNumber(row.VH_VV),
    rainfallMm: cleanNumber(row.rainfall_mm),
    rainfallNormalMm: cleanNumber(row.rainfall_normal_mm),
    rainfallAnomalyMm: cleanNumber(row.rainfall_anomaly_mm),
  }));
}

function maskSentinel2(image) {
  const scl = image.select('SCL');
  const valid = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10)).and(scl.neq(11));
  return image.updateMask(valid).divide(10000).copyProperties(image, ['system:time_start']);
}

function addSentinel2Indices(image) {
  const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  const ndre = image.normalizedDifference(['B8A', 'B5']).rename('NDRE');
  const ndmi = image.normalizedDifference(['B8', 'B11']).rename('NDMI');
  const ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI');
  const savi = image.expression('((nir - red) / (nir + red + 0.5)) * 1.5', {
    nir: image.select('B8'),
    red: image.select('B4'),
  }).rename('SAVI');
  return image.addBands([ndvi, ndre, ndmi, ndwi, savi]);
}

function buildRainfallAnomalyImage(startDate, endDate) {
  const start = ee.Date(startDate);
  const end = ee.Date(endDate);
  const days = end.difference(start, 'day');
  const rainfall = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
    .filterDate(start, end)
    .sum()
    .rename('rainfall_mm');

  const normal = ee.ImageCollection(ee.List.sequence(2014, 2023).map((year) => {
    const normalStart = ee.Date.fromYMD(year, start.get('month'), start.get('day'));
    return ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
      .filterDate(normalStart, normalStart.advance(days, 'day'))
      .sum();
  })).mean().rename('rainfall_normal_mm');

  return rainfall.addBands(normal).addBands(rainfall.subtract(normal).rename('rainfall_anomaly_mm'));
}

async function reduceImageByVillages(image, villageFeatures, scale) {
  const reduced = image.reduceRegions({
    collection: villageFeatures,
    reducer: ee.Reducer.mean(),
    scale,
    tileScale: 4,
  });
  const result = await getInfo(reduced);
  return result?.features?.map((feature) => feature.properties || {}) || [];
}

function mergeStats(map, rows) {
  for (const row of rows) {
    const code = String(row.village_code || '');
    if (!code) continue;
    map.set(code, { ...(map.get(code) || {}), ...row });
  }
}

function cleanNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(4)) : null;
}
async function persistObservations(observations) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey || !observations.length) return 0;

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows = observations.map((observation) => ({
    village_code: observation.villageCode,
    village_name: observation.villageName,
    district_name: observation.districtName,
    mandal_name: observation.mandalName,
    acquisition_start: observation.acquisitionStart,
    acquisition_end: observation.acquisitionEnd,
    source: 'Google Earth Engine',
    ndvi: observation.ndvi,
    ndre: observation.ndre,
    ndmi: observation.ndmi,
    ndwi: observation.ndwi,
    savi: observation.savi,
    sentinel1_vv: observation.sentinel1Vv,
    sentinel1_vh: observation.sentinel1Vh,
    sentinel1_vh_vv: observation.sentinel1VhVv,
    rainfall_mm: observation.rainfallMm,
    rainfall_normal_mm: observation.rainfallNormalMm,
    rainfall_anomaly_mm: observation.rainfallAnomalyMm,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from('remote_sensing_observations')
    .upsert(rows, { onConflict: 'village_code,acquisition_start,acquisition_end,source' });

  if (error) {
    console.error('remote_sensing_observations upsert failed', error);
    return 0;
  }

  return rows.length;
}
