// =====================================================================
// SoilGrids Service — ISRIC SoilGrids v2.0 (free, no API key)
// =====================================================================
// Queries modeled topsoil (0-5 cm) properties at a GPS point:
//   pH (phh2o), soil organic carbon (soc), sand / silt / clay %.
// Used to pre-fill the Soil Health Meter's lab-test tab so officers get
// a first estimate before a lab report is available.
// Docs: https://rest.isric.org/soilgrids/v2.0/docs
// =====================================================================

import { TIRYANI_COORDINATES } from '../../dashboard/services/weatherService';

const SOILGRIDS_ENDPOINT = 'https://rest.isric.org/soilgrids/v2.0/properties/query';
const TOPSOIL_DEPTH = '0-5cm';
const FETCH_TIMEOUT_MS = 15000;

export interface SoilGridsEstimate {
  latitude: number;
  longitude: number;
  /** Soil pH in water (0-14 scale) */
  ph?: number;
  /** Soil organic carbon, % by weight */
  organicCarbonPct?: number;
  sandPct?: number;
  siltPct?: number;
  clayPct?: number;
  /** Simplified USDA-style texture class */
  textureClass?: 'Sandy' | 'Loamy' | 'Silty' | 'Clayey';
}

interface SoilGridsLayer {
  name?: string;
  depths?: { label?: string; values?: { mean?: number } }[];
}

function meanForLayer(layers: SoilGridsLayer[] | undefined, name: string): number | undefined {
  const layer = layers?.find((l) => l.name === name);
  const mean = layer?.depths?.[0]?.values?.mean;
  return typeof mean === 'number' && Number.isFinite(mean) ? mean : undefined;
}

/** g/kg -> weight percent */
function gkgToPct(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Math.round((value / 10) * 10) / 10;
}

function classifyTexture(sand?: number, silt?: number, clay?: number): SoilGridsEstimate['textureClass'] {
  if (clay === undefined || sand === undefined || silt === undefined) return undefined;
  if (clay >= 35) return 'Clayey';
  if (silt >= 70) return 'Silty';
  if (sand >= 70) return 'Sandy';
  return 'Loamy';
}

export async function fetchSoilGridsEstimate(
  latitude: number = TIRYANI_COORDINATES.lat,
  longitude: number = TIRYANI_COORDINATES.lon
): Promise<SoilGridsEstimate> {
  const params = new URLSearchParams({
    lon: String(longitude),
    lat: String(latitude),
    property: 'phh2o',
    depth: TOPSOIL_DEPTH,
    value: 'mean',
    format: 'json',
  });
  // URLSearchParams collapses repeated keys; append the rest explicitly
  for (const property of ['soc', 'sand', 'silt', 'clay']) params.append('property', property);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${SOILGRIDS_ENDPOINT}?${params.toString()}`, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`SoilGrids API error: HTTP ${res.status}`);

  const data = await res.json();
  const layers = data?.properties?.layers as SoilGridsLayer[] | undefined;

  const phRaw = meanForLayer(layers, 'phh2o');
  const socRaw = meanForLayer(layers, 'soc'); // dg/kg
  const sand = gkgToPct(meanForLayer(layers, 'sand'));
  const silt = gkgToPct(meanForLayer(layers, 'silt'));
  const clay = gkgToPct(meanForLayer(layers, 'clay'));

  return {
    latitude,
    longitude,
    ph: phRaw !== undefined ? Math.round((phRaw / 10) * 100) / 100 : undefined,
    organicCarbonPct: socRaw !== undefined ? Math.round((socRaw / 100) * 100) / 100 : undefined,
    sandPct: sand,
    siltPct: silt,
    clayPct: clay,
    textureClass: classifyTexture(sand, silt, clay),
  };
}
