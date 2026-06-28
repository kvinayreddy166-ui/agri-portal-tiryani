// Vite/React helper: load .geojson.gz from public/data
// Place package folders under public/data/remote-sensing/...

export async function loadGzipJson<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const stream = response.body?.pipeThrough(new DecompressionStream('gzip'));
  if (!stream) throw new Error('This browser does not support DecompressionStream. Use uncompressed GeoJSON or pako fallback.');
  const text = await new Response(stream).text();
  return JSON.parse(text) as T;
}

export async function loadRemoteSensingBaseLayers() {
  const villageMap = await loadGzipJson('/data/remote-sensing/01_boundaries/admin/telangana_village_boundaries_map_simplified_50m.geojson.gz');
  const mandals = await loadGzipJson('/data/remote-sensing/01_boundaries/admin/telangana_mandal_block_boundaries.geojson.gz');
  const districts = await loadGzipJson('/data/remote-sensing/01_boundaries/admin/telangana_district_boundaries.geojson.gz');
  return { villageMap, mandals, districts };
}

export type VillageDashboardRow = {
  admin_village_code: string;
  admin_village_name: string;
  admin_old_block_mandal_name: string;
  admin_old_district_name: string;
  sample_farms: number;
  unhealthy_pct: number;
  avg_health_risk_score: number;
  dashboard_risk_class: 'Low' | 'Moderate' | 'High' | 'Very High';
  primary_sample_crop: string;
};