import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Upload,
  X,
  MessageSquare,
  Phone,
  Save,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  FarmerImportRow,
  farmerIdentityKey,
  farmerTemplateRows,
  normalizeCode,
  normalizeDigits,
  parseFarmerWorkbook,
  searchableText,
} from '../lib/farmerImport';

type FarmerRow = Partial<FarmerImportRow> & {
  id?: string;
  s_no: number;
  farmer_name_english: string;
  farmer_name_telugu: string;
  father_or_husband_name_english: string;
  father_or_husband_name_telugu: string;
  aadhaar_no: string;
  ppb_no: string;
  survey_no: string;
  extent: number;
  crop: string;
  village_english: string;
  village_telugu: string;
  phone_number: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
};

type FarmerGroup = {
  key: string;
  identityKey: string;
  surveyNo: string;
  farmerNameEnglish: string;
  farmerNameTelugu: string;
  fatherEnglish: string;
  fatherTelugu: string;
  villageEnglish: string;
  villageTelugu: string;
  phoneNumber: string;
  aadhaarNo: string;
  aadhaarLast4: string;
  ppbNo: string;
  remarks: string;
  rows: FarmerRow[];
  cropRows: { crop: string; extent: number }[];
  totalExtent: number;
};

const PAGE_SIZE = 50;
const ANALYTICS_BATCH_SIZE = 1000;
const ANALYTICS_MAX_ROWS = 25000;

const emptyStateText = 'No farmer records found. Try name, phone number, PPB or village.';
let localFarmerSeedCache: FarmerRow[] | null = null;

export function FarmerDatabase() {
  const { isAdminUser, user } = useAuth();
  const [rows, setRows] = useState<FarmerRow[]>([]);
  const [analyticsRows, setAnalyticsRows] = useState<FarmerRow[]>([]);
  const [filterOptionRows, setFilterOptionRows] = useState<FarmerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [villageFilter, setVillageFilter] = useState('all');
  const [cropFilter, setCropFilter] = useState('all');
  const [surveyFilter, setSurveyFilter] = useState('');
  const [showTelugu, setShowTelugu] = useState(false);
  const [selected, setSelected] = useState<FarmerGroup | null>(null);
  const [previewRows, setPreviewRows] = useState<FarmerImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadLocalFarmerSeed().then(setFilterOptionRows).catch(() => setFilterOptionRows([]));
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('farmer_database')
        .select(farmerSelectColumns(true, true))
        .order('village_english')
        .order('farmer_name_english')
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      query = applyFarmerSearch(query, debouncedSearch);
      if (villageFilter !== 'all') query = query.eq('village_english', villageFilter);
      if (cropFilter !== 'all') query = query.eq('crop', cropFilter);
      if (surveyFilter.trim()) query = query.ilike('survey_no', `%${normalizeCode(surveyFilter)}%`);

      let { data, error } = await query;
      if (error && isMissingColumnError(error)) {
        query = supabase
          .from('farmer_database')
          .select(farmerSelectColumns(true, false))
          .order('village_english')
          .order('farmer_name_english')
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
        query = applyFarmerSearch(query, debouncedSearch);
        if (villageFilter !== 'all') query = query.eq('village_english', villageFilter);
        if (cropFilter !== 'all') query = query.eq('crop', cropFilter);
        if (surveyFilter.trim()) query = query.ilike('survey_no', `%${normalizeCode(surveyFilter)}%`);
        const fallback = await query;
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      let nextRows = (data || []) as unknown as FarmerRow[];
      if (!nextRows.length) {
        const localRows = await loadLocalFarmerSeed();
        const localFiltered = filterLocalFarmerRows(localRows, {
          search: debouncedSearch,
          village: villageFilter,
          crop: cropFilter,
          survey: surveyFilter,
        });
        nextRows = localFiltered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
        setHasMore(localFiltered.length > (page + 1) * PAGE_SIZE);
      } else {
        const localRows = await loadLocalFarmerSeed();
        nextRows = enrichRowsWithLocalTelugu(nextRows, localRows);
        setHasMore(nextRows.length === PAGE_SIZE);
      }
      setRows(nextRows);
    } catch (error) {
      console.error('Farmer database search failed:', error);
      const localRows = await loadLocalFarmerSeed();
      const localFiltered = filterLocalFarmerRows(localRows, {
        search: debouncedSearch,
        village: villageFilter,
        crop: cropFilter,
        survey: surveyFilter,
      });
      setRows(localFiltered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE));
      setHasMore(localFiltered.length > (page + 1) * PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [cropFilter, debouncedSearch, page, surveyFilter, villageFilter]);

  const loadAnalyticsRows = useCallback(async () => {
    const collected: FarmerRow[] = [];
    for (let from = 0; from < ANALYTICS_MAX_ROWS; from += ANALYTICS_BATCH_SIZE) {
      let query = supabase
        .from('farmer_database')
        .select(farmerSelectColumns(false, true))
        .order('village_english')
        .range(from, from + ANALYTICS_BATCH_SIZE - 1);
      if (villageFilter !== 'all') query = query.eq('village_english', villageFilter);
      if (cropFilter !== 'all') query = query.eq('crop', cropFilter);
      if (surveyFilter.trim()) query = query.ilike('survey_no', `%${normalizeCode(surveyFilter)}%`);
      let { data, error } = await query;
      if (error && isMissingColumnError(error)) {
        query = supabase
          .from('farmer_database')
          .select(farmerSelectColumns(false, false))
          .order('village_english')
          .range(from, from + ANALYTICS_BATCH_SIZE - 1);
        if (villageFilter !== 'all') query = query.eq('village_english', villageFilter);
        if (cropFilter !== 'all') query = query.eq('crop', cropFilter);
        if (surveyFilter.trim()) query = query.ilike('survey_no', `%${normalizeCode(surveyFilter)}%`);
        const fallback = await query;
        data = fallback.data;
        error = fallback.error;
      }
      if (error) break;
      const batch = (data || []) as unknown as FarmerRow[];
      collected.push(...batch);
      if (batch.length < ANALYTICS_BATCH_SIZE) break;
    }
    if (!collected.length) {
      const localRows = await loadLocalFarmerSeed();
      setAnalyticsRows(filterLocalFarmerRows(localRows, {
        search: '',
        village: villageFilter,
        crop: cropFilter,
        survey: surveyFilter,
      }));
      return;
    }
    const localRows = await loadLocalFarmerSeed();
    setAnalyticsRows(enrichRowsWithLocalTelugu(collected, localRows));
  }, [cropFilter, surveyFilter, villageFilter]);

  useEffect(() => {
    void loadRows();
    void loadAnalyticsRows();
  }, [loadAnalyticsRows, loadRows]);

  useEffect(() => {
    setPage(0);
  }, [cropFilter, debouncedSearch, surveyFilter, villageFilter]);

  const optionRows = filterOptionRows.length ? filterOptionRows : analyticsRows.length ? analyticsRows : rows;
  const villageOptions = useMemo(() => unique(optionRows.map((row) => row.village_english).filter(Boolean)), [optionRows]);
  const cropOptions = useMemo(() => unique(optionRows.map((row) => row.crop).filter(Boolean)), [optionRows]);
  const villageLabelMap = useMemo(() => optionLabelMap(optionRows, 'village_english', 'village_telugu'), [optionRows]);
  const groups = useMemo(() => groupFarmerRows(rows), [rows]);
  const analytics = useMemo(() => buildAnalytics(analyticsRows), [analyticsRows]);
  const villageFarmerChart = useMemo(
    () => localizeChartRows(analytics.villageFarmers, villageLabelMap, showTelugu),
    [analytics.villageFarmers, showTelugu, villageLabelMap]
  );
  const villageExtentChart = useMemo(
    () => localizeChartRows(analytics.villageExtent, villageLabelMap, showTelugu),
    [analytics.villageExtent, showTelugu, villageLabelMap]
  );
  const cropExtentChart = useMemo(
    () => localizeCropChartRows(analytics.cropExtent.slice(0, 10), showTelugu),
    [analytics.cropExtent, showTelugu]
  );
  const cropFarmerChart = useMemo(
    () => localizeCropChartRows(analytics.cropFarmers.slice(0, 10), showTelugu),
    [analytics.cropFarmers, showTelugu]
  );
  const previewStats = useMemo(() => importStats(previewRows), [previewRows]);

  const openDetails = (group: FarmerGroup) => {
    setSelected(group);
    setEditPhone(group.phoneNumber || '');
    setEditRemarks(group.remarks || '');
  };

  const handleImportFile = async (file: File) => {
    setImportMessage('');
    const parsed = await parseFarmerWorkbook(file);
    setPreviewRows(parsed);
  };

  const replaceDatabase = async () => {
    if (!isAdminUser || previewRows.length === 0) return;
    if (!confirm(`Replace farmer database with ${previewRows.length.toLocaleString('en-IN')} rows?`)) return;
    setImporting(true);
    setImportMessage('Importing farmer database...');
    try {
      const { error: deleteError } = await supabase.from('farmer_database').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteError) throw deleteError;
      for (let index = 0; index < previewRows.length; index += 500) {
      const batch = previewRows.slice(index, index + 500).map((row) => ({
          ...farmerInsertRow(row),
          created_by: user?.email || 'admin',
          updated_by: user?.email || 'admin',
        }));
        const { error } = await supabase.from('farmer_database').insert(batch);
        if (error) throw error;
      }
      setImportMessage(`Imported ${previewRows.length.toLocaleString('en-IN')} rows successfully.`);
      setPreviewRows([]);
      setPage(0);
      void loadRows();
      void loadAnalyticsRows();
    } catch (error) {
      console.error('Farmer import failed:', error);
      setImportMessage('Import failed. Please confirm the migration is applied and you are logged in as admin.');
    } finally {
      setImporting(false);
    }
  };

  const saveFarmerNotes = async () => {
    if (!selected || !isAdminUser) return;
    const ids = selected.rows.map((row) => row.id).filter(Boolean) as string[];
    if (!ids.length) return;
    const { error } = await supabase
      .from('farmer_database')
      .update({
        phone_number: normalizeDigits(editPhone),
        remarks: editRemarks.trim(),
        updated_by: user?.email || 'admin',
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);
    if (error) {
      alert('Could not update phone/remarks.');
      return;
    }
    setSelected(null);
    void loadRows();
    void loadAnalyticsRows();
  };

  const exportFiltered = async () => {
    if (!analyticsRows.length) {
      alert(emptyStateText);
      return;
    }
    const exportRows = analyticsRows.map((row, index) => ({
      'S.No': index + 1,
      'Farmer Name English': row.farmer_name_english,
      'Farmer Name Telugu': row.farmer_name_telugu,
      'Father/Husband English': row.father_or_husband_name_english,
      'Father/Husband Telugu': row.father_or_husband_name_telugu,
      Aadhaar: row.aadhaar_no,
      PPB: row.ppb_no,
      'Survey No': row.survey_no,
      Extent: Number(row.extent || 0),
      Crop: row.crop,
      Village: row.village_english,
      'Village Telugu': row.village_telugu,
      Phone: row.phone_number,
      Remarks: row.remarks,
    }));
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = Object.keys(exportRows[0]).map((key) => ({ wch: Math.max(12, Math.min(34, key.length + 2)) }));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Farmer Database');
    XLSX.writeFile(workbook, 'farmer_database_filtered.xlsx');
  };

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(farmerTemplateRows()), 'Farmer_Database_Template');
    XLSX.writeFile(workbook, 'farmer_database_template.xlsx');
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{uiLabel('Farmer Database', showTelugu)}</p>
            <h1 className="text-xl font-black text-slate-950">{uiLabel('Farmer Search Database', showTelugu)}</h1>
            <p className="text-xs font-semibold text-slate-500">{uiLabel('Search by farmer, family name, phone, PPB, Aadhaar, survey number, or village.', showTelugu)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowTelugu((value) => !value)}
              className="action-button bg-white text-emerald-700"
            >
              {showTelugu ? 'English' : 'తెలుగు'}
            </button>
            <button type="button" onClick={loadRows} className="icon-action" aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button type="button" onClick={exportFiltered} className="icon-action bg-emerald-700 text-white" aria-label="Export Excel"><FileSpreadsheet className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder={uiLabel('Search by farmer name, phone, PPB, Aadhaar, survey no or village', showTelugu)}
            />
          </div>
          <select value={villageFilter} onChange={(event) => setVillageFilter(event.target.value)} className="filter-select">
            <option value="all">{uiLabel('All villages', showTelugu)}</option>
            {villageOptions.map((village) => <option key={village} value={village}>{showTelugu ? villageLabelMap.get(village) || village : village}</option>)}
          </select>
          <select value={cropFilter} onChange={(event) => setCropFilter(event.target.value)} className="filter-select">
            <option value="all">{uiLabel('All crops', showTelugu)}</option>
            {cropOptions.map((crop) => <option key={crop} value={crop}>{cropDisplay(crop, showTelugu)}</option>)}
          </select>
          <input value={surveyFilter} onChange={(event) => setSurveyFilter(event.target.value)} className="filter-select" placeholder={uiLabel('Survey Number', showTelugu)} />
        </div>
      </section>

      {isAdminUser && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950">Admin Import Tools</h2>
              <p className="text-xs font-semibold text-slate-600">Upload CSV/XLSX, preview, then replace the farmer database.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadTemplate} className="action-button"><Download className="h-4 w-4" /> Template</button>
              <label className="action-button cursor-pointer">
                <Upload className="h-4 w-4" />
                Upload XLSX/CSV
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => event.target.files?.[0] && void handleImportFile(event.target.files[0])} />
              </label>
              <button type="button" onClick={replaceDatabase} disabled={!previewRows.length || importing} className="action-button bg-emerald-700 text-white disabled:opacity-50">
                <Save className="h-4 w-4" /> Replace
              </button>
            </div>
          </div>
          {previewRows.length > 0 && (
            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-700 sm:grid-cols-4">
              <PreviewMetric label="Records" value={previewRows.length} />
              <PreviewMetric label="Villages" value={previewStats.villages} />
              <PreviewMetric label="Crops" value={previewStats.crops} />
              <PreviewMetric label="Unique Farmers" value={previewStats.farmers} />
            </div>
          )}
          {importMessage && <p className="mt-2 text-xs font-bold text-slate-700">{importMessage}</p>}
        </section>
      )}

      <section className="grid gap-3 xl:grid-cols-3">
        <ChartCard title={uiLabel('Village-wise Total Farmers', showTelugu)}>
          <SimpleBarChart data={villageFarmerChart} dataKey="farmers" nameKey="name" />
        </ChartCard>
        <ChartCard title={uiLabel('Crop-wise Total Extent', showTelugu)}>
          <SimpleBarChart data={cropExtentChart} dataKey="extent" nameKey="name" />
        </ChartCard>
        <ChartCard title={uiLabel('Crop-wise Farmer Count', showTelugu)}>
          <SimpleBarChart data={cropFarmerChart} dataKey="farmers" nameKey="name" />
        </ChartCard>
        <ChartCard title={uiLabel('Village-wise Cultivated Extent', showTelugu)}>
          <SimpleBarChart data={villageExtentChart} dataKey="extent" nameKey="name" />
        </ChartCard>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <LoadingSkeleton />
        ) : groups.length ? (
          <div className="divide-y divide-slate-100">
            {groups.map((group) => (
              <div key={group.key} className="grid gap-2 px-3 py-2 text-xs sm:grid-cols-[1.3fr_1fr_1.4fr_auto] sm:items-center">
                <button type="button" onClick={() => openDetails(group)} className="min-w-0 text-left">
                  <p className="truncate text-sm font-black text-slate-950">{farmerDisplay(group.farmerNameEnglish, group.farmerNameTelugu, showTelugu)}</p>
                  <p className="truncate font-bold text-slate-500">{farmerDisplay(group.fatherEnglish, group.fatherTelugu, showTelugu)}</p>
                </button>
                <div className="min-w-0 font-bold text-slate-700">
                  <p className="truncate">{farmerDisplay(group.villageEnglish, group.villageTelugu, showTelugu)}</p>
                  <p className="truncate text-slate-500">{uiLabel('Survey', showTelugu)}: {group.surveyNo || '-'}</p>
                </div>
                <div className="min-w-0 text-slate-600">
                  <p className="truncate">{uiLabel('Phone', showTelugu)}: {group.phoneNumber || '-'} | {uiLabel('Aadhaar', showTelugu)}: {group.aadhaarNo || '-'}</p>
                  <p className="truncate">{uiLabel('PPB', showTelugu)}: {group.ppbNo || '-'} | {group.cropRows.map((item) => `${cropDisplay(item.crop, showTelugu)}: ${formatExtent(item.extent)}`).join(', ')}</p>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 font-black text-emerald-700">{formatExtent(group.totalExtent)} ac</span>
                  <button type="button" onClick={() => openDetails(group)} className="icon-action" aria-label="View details"><Eye className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm font-bold text-slate-500">{emptyStateText}</div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs font-black">
          <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} className="rounded-md border px-3 py-1.5 disabled:opacity-50">Previous</button>
          <span>Page {page + 1}</span>
          <button type="button" onClick={() => setPage((value) => value + 1)} disabled={!hasMore} className="rounded-md border px-3 py-1.5 disabled:opacity-50">Next</button>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-950">{farmerDisplay(selected.farmerNameEnglish, selected.farmerNameTelugu, showTelugu)}</h2>
                <p className="text-sm font-bold text-slate-500">{showTelugu ? selected.farmerNameEnglish : selected.farmerNameTelugu}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="icon-action"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <Detail label={uiLabel('Father/Husband', showTelugu)} value={farmerDisplay(selected.fatherEnglish, selected.fatherTelugu, showTelugu)} />
              <Detail label={uiLabel('Village', showTelugu)} value={farmerDisplay(selected.villageEnglish, selected.villageTelugu, showTelugu)} />
              <Detail label={uiLabel('Phone Number', showTelugu)} value={selected.phoneNumber || '-'} />
              <Detail label={uiLabel('Aadhaar', showTelugu)} value={selected.aadhaarNo || '-'} />
              <Detail label={uiLabel('PPB Number', showTelugu)} value={selected.ppbNo || '-'} />
              <Detail label={uiLabel('Survey Number', showTelugu)} value={selected.surveyNo || '-'} />
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-white"><tr><th className="px-3 py-2 text-left">{uiLabel('Crop', showTelugu)}</th><th className="px-3 py-2 text-right">{uiLabel('Extent', showTelugu)}</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {selected.cropRows.map((row) => <tr key={row.crop}><td className="px-3 py-2 font-bold">{cropDisplay(row.crop, showTelugu)}</td><td className="px-3 py-2 text-right font-black">{formatExtent(row.extent)} acres</td></tr>)}
                  <tr><td className="px-3 py-2 font-black">{uiLabel('Total', showTelugu)}</td><td className="px-3 py-2 text-right font-black text-emerald-700">{formatExtent(selected.totalExtent)} acres</td></tr>
                </tbody>
              </table>
            </div>
            {isAdminUser && (
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                <label className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm font-bold" placeholder="Update phone number" />
                </label>
                <label className="relative">
                  <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input value={editRemarks} onChange={(event) => setEditRemarks(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm font-bold" placeholder="Add remarks" />
                </label>
                <button type="button" onClick={saveFarmerNotes} className="action-button bg-emerald-700 text-white"><Save className="h-4 w-4" /> Save</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function groupFarmerRows(rows: FarmerRow[]): FarmerGroup[] {
  const map = new Map<string, FarmerGroup>();
  rows.forEach((row) => {
    const identityKey = row.identity_key || farmerIdentityKey(row);
    const key = `${identityKey}:${row.survey_no}`;
    const current = map.get(key) || {
      key,
      identityKey,
      surveyNo: row.survey_no,
      farmerNameEnglish: row.farmer_name_english,
      farmerNameTelugu: row.farmer_name_telugu,
      fatherEnglish: row.father_or_husband_name_english,
      fatherTelugu: row.father_or_husband_name_telugu,
      villageEnglish: row.village_english,
      villageTelugu: row.village_telugu,
      phoneNumber: row.phone_number,
      aadhaarNo: row.aadhaar_no || '',
      aadhaarLast4: row.aadhaar_last4 || normalizeDigits(row.aadhaar_no).slice(-4),
      ppbNo: row.ppb_no,
      remarks: row.remarks || '',
      rows: [],
      cropRows: [],
      totalExtent: 0,
    };
    current.rows.push(row);
    current.totalExtent += Number(row.extent || 0);
    const crop = current.cropRows.find((item) => item.crop === row.crop);
    if (crop) crop.extent += Number(row.extent || 0);
    else current.cropRows.push({ crop: row.crop || 'Not specified', extent: Number(row.extent || 0) });
    map.set(key, current);
  });
  return Array.from(map.values());
}

function buildAnalytics(rows: FarmerRow[]) {
  const villageFarmers = new Map<string, Set<string>>();
  const villageExtent = new Map<string, number>();
  const cropExtent = new Map<string, number>();
  const cropFarmers = new Map<string, Set<string>>();
  rows.forEach((row) => {
    const identity = row.identity_key || farmerIdentityKey(row);
    const village = row.village_english || 'Unknown';
    const crop = row.crop || 'Unknown';
    addSet(villageFarmers, village, identity);
    addSet(cropFarmers, crop, identity);
    villageExtent.set(village, (villageExtent.get(village) || 0) + Number(row.extent || 0));
    cropExtent.set(crop, (cropExtent.get(crop) || 0) + Number(row.extent || 0));
  });
  return {
    villageFarmers: setMapRows(villageFarmers, 'farmers'),
    villageExtent: valueMapRows(villageExtent, 'extent'),
    cropExtent: valueMapRows(cropExtent, 'extent'),
    cropFarmers: setMapRows(cropFarmers, 'farmers'),
  };
}

function SimpleBarChart({ data, dataKey, nameKey }: { data: Record<string, string | number>[]; dataKey: string; nameKey: string }) {
  const width = Math.max(420, data.length * 64);
  return (
    <div className="overflow-x-auto">
      <div style={{ width, height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={64} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill="#0b7a5c" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><h2 className="mb-2 text-sm font-black text-slate-950">{title}</h2>{children}</section>;
}

function PreviewMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-white/80 p-2"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="text-lg font-black">{value.toLocaleString('en-IN')}</p></div>;
}

function LoadingSkeleton() {
  return <div className="space-y-2 p-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div>;
}

function addSet(map: Map<string, Set<string>>, key: string, value: string) {
  const set = map.get(key) || new Set<string>();
  set.add(value);
  map.set(key, set);
}

function setMapRows(map: Map<string, Set<string>>, key: string) {
  return Array.from(map.entries()).map(([name, set]) => ({ name, [key]: set.size })).sort((a, b) => Number(b[key]) - Number(a[key]));
}

function valueMapRows(map: Map<string, number>, key: string) {
  return Array.from(map.entries()).map(([name, value]) => ({ name, [key]: Math.round(value * 100) / 100 })).sort((a, b) => Number(b[key]) - Number(a[key]));
}

function importStats(rows: FarmerImportRow[]) {
  return {
    villages: new Set(rows.map((row) => row.village_english).filter(Boolean)).size,
    crops: new Set(rows.map((row) => row.crop).filter(Boolean)).size,
    farmers: new Set(rows.map((row) => row.identity_key).filter(Boolean)).size,
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function optionLabelMap(rows: FarmerRow[], key: 'village_english', labelKey: 'village_telugu') {
  const labels = new Map<string, string>();
  rows.forEach((row) => {
    const value = row[key];
    const label = row[labelKey];
    if (value && label && !labels.has(value)) labels.set(value, label);
  });
  return labels;
}

function farmerDisplay(english: string, telugu: string, showTelugu: boolean) {
  if (showTelugu) return telugu || english || '-';
  return english || telugu || '-';
}

function cropDisplay(crop: string, showTelugu: boolean) {
  if (!showTelugu) return crop || '-';
  const labels: Record<string, string> = {
    'Anumulu (Hyacinth Bean)': 'అనుములు',
    Banana: 'అరటి',
    'Bhendi/ Benda Kaya': 'బెండకాయ',
    'Brinjal / Vankaya': 'వంకాయ',
    Castor: 'ఆముదం',
    Cotton: 'పత్తి',
    Cowpea: 'అలసంద',
    'Dolichos Bean (Teega Chikkudu)': 'తీగ చిక్కుడు',
    'Fodder Jowar': 'మేత జొన్న',
    'Greenchilli / Pacchi Mirapa': 'పచ్చి మిరప',
    Greengram: 'పెసర',
    'Greengram(Green Manure)': 'పెసర పచ్చి ఎరువు',
    Guava: 'జామ',
    Jowar: 'జొన్న',
    Maize: 'మొక్కజొన్న',
    Mango: 'మామిడి',
    Oilpalm: 'ఆయిల్ పామ్',
    Paddy: 'వరి',
    Redgram: 'కంది',
    'Ridge Gourd (Beera Kaya)': 'బీరకాయ',
    Sandalwood: 'చందనం',
    Sesamum: 'నువ్వులు',
    Subabul: 'సుబబుల్',
    Teak: 'టేకు',
    Tomato: 'టమాట',
    Turmeric: 'పసుపు',
  };
  return labels[crop] || crop || '-';
}

function localizeChartRows(rows: Record<string, string | number>[], labels: Map<string, string>, showTelugu: boolean) {
  if (!showTelugu) return rows;
  return rows.map((row) => ({
    ...row,
    name: labels.get(String(row.name)) || row.name,
  }));
}

function localizeCropChartRows(rows: Record<string, string | number>[], showTelugu: boolean) {
  if (!showTelugu) return rows;
  return rows.map((row) => ({
    ...row,
    name: cropDisplay(String(row.name), true),
  }));
}

function uiLabel(label: string, showTelugu: boolean) {
  if (!showTelugu) return label;
  const labels: Record<string, string> = {
    'Farmer Database': 'రైతుల డేటాబేస్',
    'Farmer Search Database': 'రైతుల శోధన డేటాబేస్',
    'Search by farmer, family name, phone, PPB, Aadhaar, survey number, or village.': 'రైతు పేరు, కుటుంబ పేరు, ఫోన్, పిపిబి, ఆధార్, సర్వే నంబర్ లేదా గ్రామం ద్వారా వెతకండి.',
    'Search by farmer name, phone, PPB, Aadhaar, survey no or village': 'రైతు పేరు, ఫోన్, పిపిబి, ఆధార్, సర్వే నంబర్ లేదా గ్రామం ద్వారా వెతకండి',
    'All villages': 'అన్ని గ్రామాలు',
    'All crops': 'అన్ని పంటలు',
    'Village-wise Total Farmers': 'గ్రామాల వారీ మొత్తం రైతులు',
    'Crop-wise Total Extent': 'పంటల వారీ మొత్తం విస్తీర్ణం',
    'Crop-wise Farmer Count': 'పంటల వారీ రైతుల సంఖ్య',
    'Village-wise Cultivated Extent': 'గ్రామాల వారీ సాగు విస్తీర్ణం',
    Survey: 'సర్వే',
    Phone: 'ఫోన్',
    Aadhaar: 'ఆధార్',
    PPB: 'పిపిబి',
    'Father/Husband': 'తండ్రి/భర్త పేరు',
    Village: 'గ్రామం',
    'Phone Number': 'ఫోన్ నంబర్',
    'PPB Number': 'పిపిబి నంబర్',
    'Survey Number': 'సర్వే నంబర్',
    Crop: 'పంట',
    Extent: 'విస్తీర్ణం',
    Total: 'మొత్తం',
  };
  return labels[label] || label;
}

function enrichRowsWithLocalTelugu(rows: FarmerRow[], localRows: FarmerRow[]) {
  if (!localRows.length) return rows;
  const bySerial = new Map(localRows.map((row) => [String(row.s_no), row]));
  const byComposite = new Map(localRows.map((row) => [farmerLocalKey(row), row]));
  return rows.map((row) => {
    if (row.farmer_name_telugu && row.father_or_husband_name_telugu && row.village_telugu) return row;
    const local = bySerial.get(String(row.s_no)) || byComposite.get(farmerLocalKey(row));
    if (!local) return row;
    return {
      ...row,
      farmer_name_telugu: row.farmer_name_telugu || local.farmer_name_telugu,
      father_or_husband_name_telugu: row.father_or_husband_name_telugu || local.father_or_husband_name_telugu,
      village_telugu: row.village_telugu || local.village_telugu,
    };
  });
}

function farmerLocalKey(row: FarmerRow) {
  return [
    row.ppb_no,
    row.survey_no,
    row.crop,
    row.farmer_name_english,
    row.father_or_husband_name_english,
  ].map(searchableText).join('|');
}

async function loadLocalFarmerSeed() {
  if (localFarmerSeedCache) return localFarmerSeedCache;
  try {
    const response = await fetch('/farmer_database_seed.json', { cache: 'force-cache' });
    if (!response.ok) return [];
    const rows = (await response.json()) as FarmerRow[];
    localFarmerSeedCache = rows;
    return rows;
  } catch {
    return [];
  }
}

function filterLocalFarmerRows(
  rows: FarmerRow[],
  filters: { search: string; village: string; crop: string; survey: string }
) {
  const search = searchableText(filters.search);
  const digits = normalizeDigits(filters.search);
  const code = normalizeCode(filters.search);
  const survey = normalizeCode(filters.survey);
  return rows.filter((row) => {
    if (filters.village !== 'all' && row.village_english !== filters.village) return false;
    if (filters.crop !== 'all' && row.crop !== filters.crop) return false;
    if (survey && !normalizeCode(row.survey_no).includes(survey)) return false;
    if (!search && !digits && !code) return true;
    const textHaystack = [
      row.farmer_name_english,
      row.farmer_name_telugu,
      row.father_or_husband_name_english,
      row.father_or_husband_name_telugu,
      row.village_english,
      row.village_telugu,
      row.crop,
      row.survey_no,
      row.ppb_no,
    ].map(searchableText).join(' ');
    const digitHaystack = [
      row.phone_number,
      row.aadhaar_no,
      row.ppb_no,
      row.survey_no,
    ].map(normalizeDigits).join(' ');
    const codeHaystack = [
      row.ppb_no,
      row.survey_no,
    ].map(normalizeCode).join(' ');
    return (
      (search ? textHaystack.includes(search) : false) ||
      (digits ? digitHaystack.includes(digits) : false) ||
      (code ? codeHaystack.includes(code) : false)
    );
  });
}

function applyFarmerSearch(query: any, value: string) {
  const raw = value.trim();
  if (!raw) return query;
  const text = sanitizeFilterValue(searchableText(raw));
  const digits = normalizeDigits(raw);
  const code = sanitizeFilterValue(normalizeCode(raw));
  const textFields = [
    'farmer_name_english',
    'farmer_name_telugu',
    'father_or_husband_name_english',
    'father_or_husband_name_telugu',
    'village_english',
    'village_telugu',
    'crop',
  ];
  const clauses = textFields.map((field) => `${field}.ilike.%${text}%`);
  if (digits) {
    clauses.push(
      `phone_number.ilike.%${digits}%`,
      `aadhaar_no.ilike.%${digits}%`,
      `ppb_no.ilike.%${digits}%`,
      `survey_no.ilike.%${digits}%`
    );
  }
  if (code) {
    clauses.push(`ppb_no.ilike.%${code}%`, `survey_no.ilike.%${code}%`);
  }
  return query.or(clauses.join(','));
}

function sanitizeFilterValue(value: string) {
  return value.replace(/[%*_(),]/g, '').trim();
}

function farmerSelectColumns(includeDates: boolean, includeRemarks: boolean) {
  const columns = [
    'id',
    's_no',
    'farmer_name_english',
    'farmer_name_telugu',
    'father_or_husband_name_english',
    'father_or_husband_name_telugu',
    'aadhaar_no',
    'ppb_no',
    'survey_no',
    'extent',
    'crop',
    'village_english',
    'village_telugu',
    'phone_number',
    ...(includeRemarks ? ['remarks'] : []),
    ...(includeDates ? ['created_at', 'updated_at'] : []),
  ];
  return columns.join(', ');
}

function isMissingColumnError(error: unknown) {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  const code = String((error as { code?: string })?.code || '');
  return code === '42703' || message.includes('column') || message.includes('could not find');
}

function farmerInsertRow(row: FarmerImportRow) {
  return {
    s_no: row.s_no,
    farmer_name_english: row.farmer_name_english,
    farmer_name_telugu: row.farmer_name_telugu,
    father_or_husband_name_english: row.father_or_husband_name_english,
    father_or_husband_name_telugu: row.father_or_husband_name_telugu,
    aadhaar_no: row.aadhaar_no,
    aadhaar_last4: row.aadhaar_last4,
    ppb_no: row.ppb_no,
    survey_no: row.survey_no,
    extent: row.extent,
    crop: row.crop,
    village_english: row.village_english,
    village_telugu: row.village_telugu,
    phone_number: row.phone_number,
    remarks: row.remarks,
    search_text: row.search_text,
    identity_key: row.identity_key,
    row_hash: row.row_hash,
  };
}

function formatExtent(value: number) {
  return Number(value || 0).toFixed(2);
}
