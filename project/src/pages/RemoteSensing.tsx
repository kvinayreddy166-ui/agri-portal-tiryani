import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  Download,
  Droplets,
  Layers,
  MapPin,
  Radar,
  Satellite,
  Search,
  Sprout,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Geometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};

type BoundaryFeature = {
  type: 'Feature';
  properties: Record<string, string | number | null>;
  geometry: Geometry;
};

type FeatureCollection = {
  type: 'FeatureCollection';
  features: BoundaryFeature[];
};

type DashboardRow = {
  admin_old_district_code: string;
  admin_old_district_name: string;
  admin_old_block_mandal_code: string;
  admin_old_block_mandal_name: string;
  admin_village_code: string;
  admin_village_name: string;
  sample_farms: number;
  labelled_farms: number;
  unknown_health_farms: number;
  healthy_farms: number;
  stressed_farms: number;
  diseased_farms: number;
  pest_farms: number;
  unhealthy_farms: number;
  avg_health_risk_score: number | null;
  avg_crop_height: number | null;
  avg_water_coverage: number | null;
  avg_irrigation_count: number | null;
  avg_expected_yield: number | null;
  avg_field_area_ha: number | null;
  total_sample_area_ha: number | null;
  unhealthy_pct_of_labelled: number | null;
  label_coverage_pct: number | null;
  primary_sample_crop: string;
  primary_crop_sample_farms: number;
  dominant_health_status: string;
  dominant_status_labelled_farms: number;
  dashboard_risk_class: string;
  live?: LiveObservation;
};

type FormulaRow = {
  parameter: string;
  index: string;
  formula: string;
  sensor: string;
  bands: string;
  use_in_app: string;
};

type LiveObservation = {
  villageCode: string;
  villageName?: string;
  acquisitionStart?: string;
  acquisitionEnd?: string;
  ndvi: number | null;
  ndre: number | null;
  ndmi: number | null;
  ndwi: number | null;
  savi: number | null;
  sentinel1Vv: number | null;
  sentinel1Vh: number | null;
  sentinel1VhVv: number | null;
  rainfallMm: number | null;
  rainfallNormalMm: number | null;
  rainfallAnomalyMm: number | null;
};

type LiveResponse = {
  ok: boolean;
  notConfigured?: boolean;
  error?: string;
  observations?: LiveObservation[];
};

type MapLayer = 'districts' | 'mandals' | 'villages';

const DATA_ROOT = '/data/remote-sensing';
const DISTRICT_GEOJSON = `${DATA_ROOT}/01_boundaries/admin/telangana_district_boundaries.geojson.gz`;
const MANDAL_GEOJSON = `${DATA_ROOT}/01_boundaries/admin/telangana_mandal_block_boundaries.geojson.gz`;
const VILLAGE_GEOJSON = `${DATA_ROOT}/01_boundaries/admin/telangana_village_boundaries_map_simplified_50m.geojson.gz`;
const DASHBOARD_CSV = `${DATA_ROOT}/03_dashboard_summaries/village_dashboard_seed_table.csv`;
const FORMULAS_CSV = `${DATA_ROOT}/04_remote_sensing_feature_plan/remote_sensing_index_formulas_for_app.csv`;
const LIVE_FETCH_LIMIT = 25;

const RISK_STYLES: Record<string, { label: string; fill: string; text: string; badge: string }> = {
  High: { label: 'High risk', fill: '#ef4444', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  Medium: { label: 'Medium risk', fill: '#f59e0b', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  Low: { label: 'Low risk', fill: '#22c55e', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  Unknown: { label: 'Unknown', fill: '#94a3b8', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
};

const DEFAULT_BOUNDS = {
  minLon: 77.1,
  maxLon: 81.4,
  minLat: 15.6,
  maxLat: 19.95,
};

export function RemoteSensing() {
  const [districts, setDistricts] = useState<FeatureCollection | null>(null);
  const [mandals, setMandals] = useState<FeatureCollection | null>(null);
  const [villages, setVillages] = useState<FeatureCollection | null>(null);
  const [dashboardRows, setDashboardRows] = useState<DashboardRow[]>([]);
  const [formulaRows, setFormulaRows] = useState<FormulaRow[]>([]);
  const [mapLayer, setMapLayer] = useState<MapLayer>('villages');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [search, setSearch] = useState('');
  const [selectedVillageCode, setSelectedVillageCode] = useState<string | null>(null);
  const [liveStartDate, setLiveStartDate] = useState(() => formatDateInput(daysAgo(30)));
  const [liveEndDate, setLiveEndDate] = useState(() => formatDateInput(new Date()));
  const [liveDataByVillage, setLiveDataByVillage] = useState<Record<string, LiveObservation>>({});
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRemoteSensingData() {
      try {
        const [districtData, mandalData, villageData, dashboardCsv, formulasCsv] = await Promise.all([
          loadGzipJson<FeatureCollection>(DISTRICT_GEOJSON),
          loadGzipJson<FeatureCollection>(MANDAL_GEOJSON),
          loadGzipJson<FeatureCollection>(VILLAGE_GEOJSON),
          loadText(DASHBOARD_CSV),
          loadText(FORMULAS_CSV),
        ]);

        if (cancelled) return;
        setDistricts(districtData);
        setMandals(mandalData);
        setVillages(villageData);
        setDashboardRows(parseCsv(dashboardCsv).map(toDashboardRow));
        setFormulaRows(parseCsv(formulasCsv).map(toFormulaRow));
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError('Remote sensing prototype data could not be loaded.');
      }
    }

    void loadRemoteSensingData();
    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardByVillage = useMemo(() => {
    return new Map(dashboardRows.map((row) => [normalizeCode(row.admin_village_code), row]));
  }, [dashboardRows]);

  const villageFeatureByCode = useMemo(() => {
    return new Map((villages?.features || []).map((feature) => [normalizeCode(readString(feature.properties, 'village_code')), feature]));
  }, [villages]);

  const options = useMemo(() => {
    const fromRows = (selector: (row: DashboardRow) => string) =>
      Array.from(new Set(dashboardRows.map(selector).filter(Boolean))).sort((a, b) => a.localeCompare(b));

    return {
      districts: fromRows((row) => row.admin_old_district_name),
      mandals: fromRows((row) => row.admin_old_block_mandal_name),
      villages: fromRows((row) => row.admin_village_name),
      crops: fromRows((row) => row.primary_sample_crop),
      risks: fromRows((row) => row.dashboard_risk_class),
    };
  }, [dashboardRows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = dashboardRows.filter((row) => {
      if (selectedDistrict && row.admin_old_district_name !== selectedDistrict) return false;
      if (selectedMandal && row.admin_old_block_mandal_name !== selectedMandal) return false;
      if (selectedVillage && row.admin_village_name !== selectedVillage) return false;
      if (selectedCrop && row.primary_sample_crop !== selectedCrop) return false;
      if (selectedRisk && row.dashboard_risk_class !== selectedRisk) return false;
      if (!query) return true;
      return [
        row.admin_village_name,
        row.admin_old_block_mandal_name,
        row.admin_old_district_name,
        row.primary_sample_crop,
        row.dashboard_risk_class,
      ].some((value) => value.toLowerCase().includes(query));
    });

    return rows.map((row) => ({
      ...row,
      live: liveDataByVillage[normalizeCode(row.admin_village_code)],
    }));
  }, [dashboardRows, liveDataByVillage, search, selectedCrop, selectedDistrict, selectedMandal, selectedRisk, selectedVillage]);

  const selectedRow = useMemo(() => {
    if (selectedVillageCode) {
      const code = normalizeCode(selectedVillageCode);
      return filteredRows.find((row) => normalizeCode(row.admin_village_code) === code) || dashboardByVillage.get(code) || null;
    }
    return filteredRows[0] || null;
  }, [dashboardByVillage, filteredRows, selectedVillageCode]);

  const filteredVillageCodes = useMemo(() => new Set(filteredRows.map((row) => normalizeCode(row.admin_village_code))), [filteredRows]);
  const summary = useMemo(() => buildSummary(filteredRows), [filteredRows]);
  const liveRowCount = useMemo(() => Object.keys(liveDataByVillage).length, [liveDataByVillage]);
  const bounds = useMemo(() => computeBounds(villages || mandals || districts), [districts, mandals, villages]);

  const visibleFeatures = useMemo(() => {
    const source = mapLayer === 'districts' ? districts : mapLayer === 'mandals' ? mandals : villages;
    const features = source?.features || [];

    if (mapLayer === 'districts') return features;
    if (mapLayer === 'mandals') {
      return features.filter((feature) => {
        const district = readString(feature.properties, 'district_name');
        return !selectedDistrict || district === selectedDistrict;
      });
    }

    return features.filter((feature) => {
      const code = normalizeCode(readString(feature.properties, 'village_code'));
      if (!filteredVillageCodes.has(code)) return false;
      const row = dashboardByVillage.get(code);
      if (!row) return false;
      if (selectedDistrict && row.admin_old_district_name !== selectedDistrict) return false;
      if (selectedMandal && row.admin_old_block_mandal_name !== selectedMandal) return false;
      return true;
    });
  }, [dashboardByVillage, districts, filteredVillageCodes, mandals, mapLayer, selectedDistrict, selectedMandal, villages]);

  const clearFilters = () => {
    setSelectedDistrict('');
    setSelectedMandal('');
    setSelectedVillage('');
    setSelectedCrop('');
    setSelectedRisk('');
    setSearch('');
    setSelectedVillageCode(null);
  };

  const fetchLiveRemoteSensing = async () => {
    if (!villages) return;
    setLiveLoading(true);
    setLiveMessage(null);

    try {
      const selectedRows = selectedRow ? [selectedRow] : filteredRows.slice(0, LIVE_FETCH_LIMIT);
      const features = selectedRows
        .map((row) => {
          const feature = villageFeatureByCode.get(normalizeCode(row.admin_village_code));
          if (!feature) return null;
          return {
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
              village_code: row.admin_village_code,
              village_name: row.admin_village_name,
              district_name: row.admin_old_district_name,
              mandal_name: row.admin_old_block_mandal_name,
            },
          };
        })
        .filter(Boolean);

      if (!features.length) {
        setLiveMessage('No matching village geometry is available for the current selection.');
        return;
      }

      const { data, error: invokeError } = await supabase.functions.invoke<LiveResponse>('remote-sensing-live', {
        body: { startDate: liveStartDate, endDate: liveEndDate, features },
      });

      if (invokeError) throw invokeError;
      if (!data?.ok) {
        setLiveMessage(data?.error || 'Live Sentinel / GEE data is not available yet.');
        return;
      }

      const nextLiveRows: Record<string, LiveObservation> = {};
      (data.observations || []).forEach((observation) => {
        nextLiveRows[normalizeCode(observation.villageCode)] = observation;
      });
      setLiveDataByVillage((current) => ({ ...current, ...nextLiveRows }));
      setLiveMessage(`Live Sentinel / GEE values loaded for ${Object.keys(nextLiveRows).length} village(s).`);
    } catch (liveError) {
      console.error(liveError);
      setLiveMessage(liveError instanceof Error ? liveError.message : 'Live Sentinel / GEE request failed.');
    } finally {
      setLiveLoading(false);
    }
  };
  const exportCsv = () => {
    const headers = [
      'District',
      'Mandal',
      'Village',
      'Crop',
      'Risk class',
      'Sample farms',
      'Healthy',
      'Unhealthy',
      'Unhealthy % labelled',
      'Avg risk score',
      'Avg water coverage',
      'Avg expected yield',
      'Live NDVI',
      'Live NDMI',
      'Rainfall anomaly mm',
    ];
    const rows = filteredRows.map((row) => [
      row.admin_old_district_name,
      row.admin_old_block_mandal_name,
      row.admin_village_name,
      row.primary_sample_crop,
      row.dashboard_risk_class,
      row.sample_farms,
      row.healthy_farms,
      row.unhealthy_farms,
      row.unhealthy_pct_of_labelled ?? '',
      row.avg_health_risk_score ?? '',
      row.avg_water_coverage ?? '',
      row.avg_expected_yield ?? '',
      row.live?.ndvi ?? '',
      row.live?.ndmi ?? '',
      row.live?.rainfallAnomalyMm ?? '',
    ]);
    const csv = [headers, ...rows].map((line) => line.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'remote-sensing-village-dashboard.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  const loading = !districts || !mandals || !villages || !dashboardRows.length;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr] lg:p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <Satellite className="h-4 w-4" />
                Prototype dashboard
              </span>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                Sentinel / GEE ready when configured
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Remote Sensing / Crop Health
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              Village-wise crop health view for Telangana using packaged prototype data with optional live Sentinel-2, Sentinel-1 and CHIRPS rainfall anomaly values from Google Earth Engine.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <SummaryCard icon={MapPin} label="Villages" value={summary.villages.toLocaleString('en-IN')} tone="emerald" />
            <SummaryCard icon={Sprout} label="Sample farms" value={summary.sampleFarms.toLocaleString('en-IN')} tone="sky" />
            <SummaryCard icon={AlertTriangle} label="Risk villages" value={summary.riskVillages.toLocaleString('en-IN')} tone="amber" />
            <SummaryCard icon={Droplets} label="Avg water cover" value={`${formatNumber(summary.avgWaterCoverage, 1)}%`} tone="cyan" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <FilterSelect label="District" value={selectedDistrict} onChange={(value) => { setSelectedDistrict(value); setSelectedMandal(''); setSelectedVillage(''); }} options={options.districts} />
          <FilterSelect label="Mandal" value={selectedMandal} onChange={(value) => { setSelectedMandal(value); setSelectedVillage(''); }} options={options.mandals} />
          <FilterSelect label="Village" value={selectedVillage} onChange={setSelectedVillage} options={options.villages} />
          <FilterSelect label="Crop" value={selectedCrop} onChange={setSelectedCrop} options={options.crops} />
          <FilterSelect label="Risk" value={selectedRisk} onChange={setSelectedRisk} options={options.risks} />
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Search</span>
            <span className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none dark:text-white"
                placeholder="Village or crop"
              />
            </span>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {(['districts', 'mandals', 'villages'] as MapLayer[]).map((layer) => (
              <button
                key={layer}
                type="button"
                onClick={() => setMapLayer(layer)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black capitalize transition ${
                  mapLayer === layer
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <Layers className="h-4 w-4" />
                {layer}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        </div>
      </section>
      <section className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-950 dark:text-white">
              <Satellite className="h-5 w-5 text-cyan-700" />
              Live Sentinel / Google Earth Engine
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Fetches NDVI, NDRE, NDMI, NDWI, SAVI, Sentinel-1 VV/VH and rainfall anomaly for the selected village, or the first {LIVE_FETCH_LIMIT} filtered villages.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[auto_auto_auto] sm:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Start</span>
              <input
                type="date"
                value={liveStartDate}
                onChange={(event) => setLiveStartDate(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">End</span>
              <input
                type="date"
                value={liveEndDate}
                onChange={(event) => setLiveEndDate(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <button
              type="button"
              onClick={fetchLiveRemoteSensing}
              disabled={liveLoading || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 text-xs font-black text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Satellite className="h-4 w-4" />
              {liveLoading ? 'Fetching...' : 'Fetch live'}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Live rows loaded: {liveRowCount}
          </span>
          {liveMessage && (
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
              {liveMessage}
            </span>
          )}
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Telangana Map Layers</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Showing {visibleFeatures.length.toLocaleString('en-IN')} {mapLayer}
              </p>
            </div>
            <RiskLegend />
          </div>
          <div className="relative h-[460px] bg-slate-100 dark:bg-slate-950">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-500">
                Loading map data...
              </div>
            ) : (
              <svg viewBox="0 0 1000 720" className="h-full w-full" role="img" aria-label="Telangana remote sensing map">
                <rect width="1000" height="720" fill="transparent" />
                {visibleFeatures.map((feature, index) => {
                  const villageCode = normalizeCode(readString(feature.properties, 'village_code'));
                  const row = dashboardByVillage.get(villageCode);
                  const risk = row?.dashboard_risk_class || 'Unknown';
                  const isSelected = selectedVillageCode === villageCode;
                  const fill = mapLayer === 'villages' ? riskColor(risk) : mapLayer === 'mandals' ? '#86efac' : '#bae6fd';
                  const label = row?.admin_village_name || readString(feature.properties, 'village_name') || readString(feature.properties, 'district_name') || readString(feature.properties, 'block_mandal_name');

                  return (
                    <path
                      key={`${mapLayer}-${villageCode || index}`}
                      d={geometryToPath(feature.geometry, bounds)}
                      fill={fill}
                      stroke={isSelected ? '#111827' : '#ffffff'}
                      strokeWidth={isSelected ? 2.4 : mapLayer === 'villages' ? 0.45 : 1.3}
                      opacity={mapLayer === 'villages' && !row ? 0.28 : 0.88}
                      className={mapLayer === 'villages' ? 'cursor-pointer transition hover:opacity-100' : ''}
                      onClick={() => {
                        if (!villageCode) return;
                        setSelectedVillageCode(villageCode);
                        if (row) {
                          setSelectedVillage(row.admin_village_name);
                          setSelectedDistrict(row.admin_old_district_name);
                          setSelectedMandal(row.admin_old_block_mandal_name);
                        }
                      }}
                    >
                      <title>{label}</title>
                    </path>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        <VillageSidebar row={selectedRow} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Village-wise Crop Health Table</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {filteredRows.length.toLocaleString('en-IN')} rows after filters
              </p>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Village</th>
                  <th className="px-4 py-3">Mandal</th>
                  <th className="px-4 py-3">Crop</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3 text-right">Samples</th>
                  <th className="px-4 py-3 text-right">NDVI</th>
                  <th className="px-4 py-3 text-right">Rain anomaly</th>
                  <th className="px-4 py-3 text-right">Unhealthy %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.slice(0, 500).map((row) => (
                  <tr
                    key={row.admin_village_code}
                    className="cursor-pointer hover:bg-emerald-50/70 dark:hover:bg-slate-800"
                    onClick={() => setSelectedVillageCode(row.admin_village_code)}
                  >
                    <td className="px-4 py-3 font-black text-slate-900 dark:text-white">{row.admin_village_name}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{row.admin_old_block_mandal_name}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{row.primary_sample_crop}</td>
                    <td className="px-4 py-3">
                      <RiskBadge risk={row.dashboard_risk_class} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">{row.sample_farms}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">{formatMaybeNumber(row.live?.ndvi ?? null, 3)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">{formatMaybeNumber(row.live?.rainfallAnomalyMm ?? null, 1)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">
                      {formatMaybeNumber(row.unhealthy_pct_of_labelled, 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-base font-black text-slate-950 dark:text-white">
              <Radar className="h-5 w-5 text-emerald-700" />
              Remote Sensing Index Guide
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Formulas and use-cases for NDVI, NDRE, NDMI, NDWI, SAVI, Sentinel-1 VV/VH and rainfall anomaly.
            </p>
          </div>
          <div className="grid max-h-[520px] gap-3 overflow-auto p-4">
            {formulaRows
              .filter((row) => ['NDVI', 'NDRE', 'NDMI', 'NDWI', 'SAVI', 'VV, VH, VH/VV', 'Rainfall anomaly'].includes(row.index))
              .map((row) => (
                <div key={row.index} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-slate-950 dark:text-white">{row.index}</h3>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {row.sensor}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{row.parameter}</p>
                  <p className="mt-2 rounded-lg bg-white px-2 py-1.5 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {row.formula}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{row.use_in_app}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{row.bands}</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone: 'emerald' | 'sky' | 'amber' | 'cyan';
}) {
  const toneClasses = {
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-950"
        >
          <option value="">All {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
      </span>
    </label>
  );
}

function RiskLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(RISK_STYLES).map(([risk, style]) => (
        <span key={risk} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: style.fill }} />
          {style.label}
        </span>
      ))}
    </div>
  );
}

function VillageSidebar({ row }: { row: DashboardRow | null }) {
  if (!row) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        Select a village on the map or table to view crop health details.
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Village profile</p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{row.admin_village_name}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {row.admin_old_block_mandal_name}, {row.admin_old_district_name}
          </p>
        </div>
        <RiskBadge risk={row.dashboard_risk_class} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="Sample farms" value={row.sample_farms.toLocaleString('en-IN')} />
        <Metric label="Primary crop" value={row.primary_sample_crop || 'Unknown'} />
        <Metric label="Healthy farms" value={row.healthy_farms.toLocaleString('en-IN')} />
        <Metric label="Unhealthy farms" value={row.unhealthy_farms.toLocaleString('en-IN')} />
        <Metric label="Risk score" value={formatMaybeNumber(row.avg_health_risk_score, 2)} />
        <Metric label="Label coverage" value={`${formatMaybeNumber(row.label_coverage_pct, 1)}%`} />
        <Metric label="Water coverage" value={`${formatMaybeNumber(row.avg_water_coverage, 1)}%`} />
        <Metric label="Expected yield" value={formatMaybeNumber(row.avg_expected_yield, 1)} />
      </div>

      {row.live && (
        <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 p-3 dark:border-cyan-900 dark:bg-cyan-950/40">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-200">Live Sentinel / GEE</p>
          <p className="mt-1 text-[11px] font-semibold text-cyan-800 dark:text-cyan-200">
            {row.live.acquisitionStart} to {row.live.acquisitionEnd}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric label="NDVI" value={formatMaybeNumber(row.live.ndvi, 3)} />
            <Metric label="NDMI" value={formatMaybeNumber(row.live.ndmi, 3)} />
            <Metric label="NDWI" value={formatMaybeNumber(row.live.ndwi, 3)} />
            <Metric label="NDRE" value={formatMaybeNumber(row.live.ndre, 3)} />
            <Metric label="SAVI" value={formatMaybeNumber(row.live.savi, 3)} />
            <Metric label="VH/VV" value={formatMaybeNumber(row.live.sentinel1VhVv, 3)} />
            <Metric label="Rain mm" value={formatMaybeNumber(row.live.rainfallMm, 1)} />
            <Metric label="Normal mm" value={formatMaybeNumber(row.live.rainfallNormalMm, 1)} />
            <Metric label="Anomaly" value={formatMaybeNumber(row.live.rainfallAnomalyMm, 1)} />
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Dominant status</p>
        <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{row.dominant_health_status}</p>
        <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px] font-bold">
          <StatusPill label="Stressed" value={row.stressed_farms} tone="amber" />
          <StatusPill label="Diseased" value={row.diseased_farms} tone="red" />
          <StatusPill label="Pest" value={row.pest_farms} tone="orange" />
          <StatusPill label="Unknown" value={row.unknown_health_farms} tone="slate" />
        </div>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function StatusPill({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'red' | 'orange' | 'slate' }) {
  const classes = {
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    slate: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  };
  return (
    <div className={`rounded-lg px-2 py-2 ${classes[tone]}`}>
      <p>{value}</p>
      <p className="truncate text-[9px]">{label}</p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const style = RISK_STYLES[risk] || RISK_STYLES.Unknown;
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${style.badge}`}>{style.label}</span>;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}
async function loadText(path: string) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
  return response.text();
}

async function loadGzipJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;

  if (!isGzip) {
    return JSON.parse(new TextDecoder().decode(buffer)) as T;
  }

  if (typeof DecompressionStream === 'undefined') {
    throw new Error(`This browser cannot decompress ${path}`);
  }

  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  const text = await new Response(stream).text();
  return JSON.parse(text) as T;
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);

  const [headers, ...records] = rows;
  return records.map((record) => {
    const output: Record<string, string> = {};
    headers.forEach((header, index) => {
      output[header] = record[index] || '';
    });
    return output;
  });
}

function toDashboardRow(row: Record<string, string>): DashboardRow {
  return {
    admin_old_district_code: row.admin_old_district_code,
    admin_old_district_name: row.admin_old_district_name,
    admin_old_block_mandal_code: row.admin_old_block_mandal_code,
    admin_old_block_mandal_name: row.admin_old_block_mandal_name,
    admin_village_code: row.admin_village_code,
    admin_village_name: row.admin_village_name,
    sample_farms: toNumber(row.sample_farms),
    labelled_farms: toNumber(row.labelled_farms),
    unknown_health_farms: toNumber(row.unknown_health_farms),
    healthy_farms: toNumber(row.healthy_farms),
    stressed_farms: toNumber(row.stressed_farms),
    diseased_farms: toNumber(row.diseased_farms),
    pest_farms: toNumber(row.pest_farms),
    unhealthy_farms: toNumber(row.unhealthy_farms),
    avg_health_risk_score: toOptionalNumber(row.avg_health_risk_score),
    avg_crop_height: toOptionalNumber(row.avg_crop_height),
    avg_water_coverage: toOptionalNumber(row.avg_water_coverage),
    avg_irrigation_count: toOptionalNumber(row.avg_irrigation_count),
    avg_expected_yield: toOptionalNumber(row.avg_expected_yield),
    avg_field_area_ha: toOptionalNumber(row.avg_field_area_ha),
    total_sample_area_ha: toOptionalNumber(row.total_sample_area_ha),
    unhealthy_pct_of_labelled: toOptionalNumber(row.unhealthy_pct_of_labelled),
    label_coverage_pct: toOptionalNumber(row.label_coverage_pct),
    primary_sample_crop: row.primary_sample_crop || 'Unknown',
    primary_crop_sample_farms: toNumber(row.primary_crop_sample_farms),
    dominant_health_status: row.dominant_health_status || 'Unknown',
    dominant_status_labelled_farms: toNumber(row.dominant_status_labelled_farms),
    dashboard_risk_class: row.dashboard_risk_class || 'Unknown',
  };
}

function toFormulaRow(row: Record<string, string>): FormulaRow {
  return {
    parameter: row.parameter,
    index: row.index,
    formula: row.formula,
    sensor: row.sensor,
    bands: row.bands,
    use_in_app: row.use_in_app,
  };
}

function buildSummary(rows: DashboardRow[]) {
  const totals = rows.reduce(
    (acc, row) => {
      acc.sampleFarms += row.sample_farms;
      acc.riskVillages += ['High', 'Medium'].includes(row.dashboard_risk_class) ? 1 : 0;
      if (row.avg_water_coverage !== null) {
        acc.waterTotal += row.avg_water_coverage;
        acc.waterRows += 1;
      }
      return acc;
    },
    { sampleFarms: 0, riskVillages: 0, waterTotal: 0, waterRows: 0 }
  );

  return {
    villages: rows.length,
    sampleFarms: totals.sampleFarms,
    riskVillages: totals.riskVillages,
    avgWaterCoverage: totals.waterRows ? totals.waterTotal / totals.waterRows : 0,
  };
}

function computeBounds(collection: FeatureCollection | null) {
  if (!collection?.features.length) return DEFAULT_BOUNDS;
  const bounds = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity };
  collection.features.forEach((feature) => {
    walkCoordinates(feature.geometry, ([lon, lat]) => {
      bounds.minLon = Math.min(bounds.minLon, lon);
      bounds.maxLon = Math.max(bounds.maxLon, lon);
      bounds.minLat = Math.min(bounds.minLat, lat);
      bounds.maxLat = Math.max(bounds.maxLat, lat);
    });
  });
  return Number.isFinite(bounds.minLon) ? bounds : DEFAULT_BOUNDS;
}

function geometryToPath(geometry: Geometry, bounds: typeof DEFAULT_BOUNDS) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates as number[][][]] : geometry.coordinates as number[][][][];
  return polygons
    .map((polygon) =>
      polygon
        .map((ring) =>
          ring
            .map(([lon, lat], index) => {
              const [x, y] = projectPoint(lon, lat, bounds);
              return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(' ') + ' Z'
        )
        .join(' ')
    )
    .join(' ');
}

function walkCoordinates(geometry: Geometry, visitor: (point: [number, number]) => void) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates as number[][][]] : geometry.coordinates as number[][][][];
  polygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach(([lon, lat]) => visitor([lon, lat]));
    });
  });
}

function projectPoint(lon: number, lat: number, bounds: typeof DEFAULT_BOUNDS): [number, number] {
  const padding = 28;
  const width = 1000 - padding * 2;
  const height = 720 - padding * 2;
  const x = padding + ((lon - bounds.minLon) / Math.max(bounds.maxLon - bounds.minLon, 0.01)) * width;
  const y = padding + (1 - (lat - bounds.minLat) / Math.max(bounds.maxLat - bounds.minLat, 0.01)) * height;
  return [x, y];
}

function readString(properties: Record<string, string | number | null>, key: string) {
  const value = properties[key];
  return value === null || value === undefined ? '' : String(value);
}

function normalizeCode(value: string) {
  return String(value || '').replace(/\D/g, '').padStart(7, '0');
}

function riskColor(risk: string) {
  return (RISK_STYLES[risk] || RISK_STYLES.Unknown).fill;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number, digits: number) {
  return value.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function formatMaybeNumber(value: number | null, digits: number) {
  if (value === null) return '-';
  return formatNumber(value, digits);
}

function csvEscape(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}














