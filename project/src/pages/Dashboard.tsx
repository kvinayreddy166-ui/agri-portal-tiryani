import React, { useCallback, useState, useEffect } from 'react';
import { Building2, MapPin, Users, Droplets, CloudRain, Layers, TrendingUp, Edit2, PackageCheck, Plus, Save, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DailyFertilizerStockSummary, fetchDailyFertilizerStockSummary } from '../lib/fertilizerStock';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Crop, Scheme, SchemeBeneficiary, MandalOverview } from '../types/database';
import { GoogleMapWidget } from '../components/dashboard/GoogleMapWidget';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { PortalLogo } from '../components/ui/PortalLogo';
import { cachedSupabaseRows, cachedSupabaseValue } from '../lib/offlineCache';

type FarmerDashboardRow = {
  s_no?: number;
  farmer_name_english?: string;
  father_or_husband_name_english?: string;
  aadhaar_no?: string;
  ppb_no?: string;
  phone_number?: string;
  crop?: string;
  extent?: number;
  village_english?: string;
};

type FarmerDashboardCrop = {
  id: string;
  crop_name: string;
  acreage: number;
};

type FarmerDashboardStats = {
  totalFarmers: number;
  totalExtent: number;
  cropRows: FarmerDashboardCrop[];
};

let farmerDashboardSeedCache: FarmerDashboardRow[] | null = null;

export function Dashboard() {
  const { isAdminUser } = useAuth();
  const { t } = useLanguage();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fertilizers, setFertilizers] = useState<DailyFertilizerStockSummary[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [schemeBeneficiaries, setSchemeBeneficiaries] = useState<SchemeBeneficiary[]>([]);
  const [mandalData, setMandalData] = useState<MandalOverview | null>(null);
  const [farmerStats, setFarmerStats] = useState<FarmerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCrop, setEditingCrop] = useState<string | null>(null);
  const [editingScheme, setEditingScheme] = useState<string | null>(null);
  const [editingSchemeDetails, setEditingSchemeDetails] = useState<string | null>(null);
  const [schemeForm, setSchemeForm] = useState({
    scheme_name: '',
    description: '',
    benefits: '',
    eligibility: '',
  });
  const [beneficiaryForm, setBeneficiaryForm] = useState({
    scheme_id: '',
    financial_year: '2025-26',
    beneficiaries_count: '',
    notes: '',
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const [cropsRes, schemesRes, contentRes, beneficiariesRes] = await Promise.all([
        cachedSupabaseRows<Crop>(
          'dashboard:crops:v2',
          () => supabase.from('crops').select('id, crop_name, acreage, description, image_url, created_at').order('crop_name'),
          []
        ),
        cachedSupabaseRows<Scheme>(
          'dashboard:schemes:v2',
          () => supabase.from('schemes').select('id, scheme_name, description, benefits, eligibility, created_at, updated_at').order('scheme_name'),
          []
        ),
        cachedSupabaseValue<{ content: MandalOverview }>(
          'dashboard:mandal-overview:v2',
          () => supabase.from('site_content').select('content').eq('section_name', 'mandal_overview').maybeSingle(),
          null
        ),
        cachedSupabaseRows<SchemeBeneficiary>(
          'dashboard:scheme-beneficiaries:v2',
          () => supabase.from('scheme_beneficiaries').select('id, scheme_id, financial_year, beneficiaries_count, notes, created_at, created_by').order('financial_year', { ascending: false }).limit(80),
          []
        ),
      ]);

      setCrops(cropsRes);
      setSchemes(schemesRes);
      setSchemeBeneficiaries(beneficiariesRes);
      setMandalData(contentRes?.content || null);
      setLoading(false);

      const [dailyFertilizers, farmerStatsRes] = await Promise.all([
        fetchDailyFertilizerStockSummary().catch(() => []),
        fetchFarmerDashboardStats().catch(() => null),
      ]);
      setFertilizers(dailyFertilizers);
      setFarmerStats(farmerStatsRes);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const dashboardCrops = farmerStats?.cropRows.length ? farmerStats.cropRows : crops;
  const totalAcreage = farmerStats ? farmerStats.totalExtent : crops.reduce((sum, crop) => sum + extentToGuntas(crop.acreage), 0);
  const dashboardTotalFarmers = farmerStats?.totalFarmers ?? mandalData?.total_farmers ?? 0;
  const dashboardCultivableArea = farmerStats?.totalExtent ?? mandalData?.cultivable_area ?? 0;
  const dashboardRevenueVillages = 39;
  const highestFertilizerStock = Math.max(...fertilizers.map((item) => item.quantity_available), 1);
  const openBeneficiaryForm = (schemeId: string) => {
    setEditingScheme(schemeId);
    setBeneficiaryForm({
      scheme_id: schemeId,
      financial_year: '2025-26',
      beneficiaries_count: '',
      notes: '',
    });
  };

  const openSchemeEdit = (scheme: Scheme) => {
    setEditingSchemeDetails(scheme.id);
    setSchemeForm({
      scheme_name: scheme.scheme_name,
      description: scheme.description,
      benefits: scheme.benefits,
      eligibility: scheme.eligibility,
    });
  };

  const saveSchemeDetails = async () => {
    if (!editingSchemeDetails || !schemeForm.scheme_name.trim()) return;
    const { error } = await supabase
      .from('schemes')
      .update({
        scheme_name: schemeForm.scheme_name.trim(),
        description: schemeForm.description.trim(),
        benefits: schemeForm.benefits.trim(),
        eligibility: schemeForm.eligibility.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingSchemeDetails);

    if (error) {
      alert(error.message);
      return;
    }
    setEditingSchemeDetails(null);
    void fetchDashboardData();
  };

  const deleteScheme = async (schemeId: string, schemeName: string) => {
    if (!confirm(t(`Delete scheme "${schemeName}"?`, `"${schemeName}" à°ªà°¥à°•à°¾à°¨à±à°¨à°¿ à°¤à±Šà°²à°—à°¿à°‚à°šà°¾à°²à°¾?`))) return;
    await supabase.from('scheme_beneficiaries').delete().eq('scheme_id', schemeId);
    const { error } = await supabase.from('schemes').delete().eq('id', schemeId);
    if (error) {
      alert(error.message);
      return;
    }
    void fetchDashboardData();
  };

  const deleteBeneficiary = async (id: string) => {
    if (!confirm(t('Delete this beneficiary record?', 'à°ˆ à°²à°¬à±à°§à°¿à°¦à°¾à°°à± à°°à°¿à°•à°¾à°°à±à°¡à±à°¨à± à°¤à±Šà°²à°—à°¿à°‚à°šà°¾à°²à°¾?'))) return;
    await supabase.from('scheme_beneficiaries').delete().eq('id', id);
    void fetchDashboardData();
  };

  const saveBeneficiaryRecord = async () => {
    if (!beneficiaryForm.scheme_id || !beneficiaryForm.financial_year.trim()) return;
    const count = Number(beneficiaryForm.beneficiaries_count);
    if (!Number.isFinite(count) || count < 0) {
      alert('Please enter a valid beneficiary count');
      return;
    }

    const { error } = await supabase.from('scheme_beneficiaries').insert([{
      scheme_id: beneficiaryForm.scheme_id,
      financial_year: beneficiaryForm.financial_year.trim(),
      beneficiaries_count: count,
      notes: beneficiaryForm.notes.trim(),
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingScheme(null);
    setBeneficiaryForm({ scheme_id: '', financial_year: '2025-26', beneficiaries_count: '', notes: '' });
    void fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#eef6f0] dark:bg-slate-950">
        <PortalLogo size="xl" />
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading Tiryani Agriculture Portal...</p>
      </div>
    );
  }

  const hasAnyDashboardData =
    Boolean(mandalData) ||
    dashboardCrops.length > 0 ||
    fertilizers.length > 0 ||
    schemes.length > 0;

  return (
    <div className="dashboard-shell space-y-6">
      <div className="dashboard-rise relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 text-slate-950 shadow-sm shadow-emerald-100/70 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[url('/images/rice.webp')] bg-cover bg-center opacity-10 md:block" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="dashboard-float">
            <PortalLogo size="lg" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {t('Tiryani Agriculture Portal', 'à°¤à°¿à°°à±à°¯à°¾à°¨à°¿ à°µà±à°¯à°µà°¸à°¾à°¯ à°ªà±‹à°°à±à°Ÿà°²à±')}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {t(
                'Kumram Bheem Asifabad District - Asifabad Division',
                'à°•à±à°®à±à°°à°‚ à°­à±€à°‚ à°†à°¸à°¿à°«à°¾à°¬à°¾à°¦à± à°œà°¿à°²à±à°²à°¾ - à°†à°¸à°¿à°«à°¾à°¬à°¾à°¦à± à°¡à°¿à°µà°¿à°œà°¨à±'
              )}
            </p>
            <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {t(
                'Developed and maintained by K. Vinay Reddy, MAO, Tiryani',
                'à°…à°­à°¿à°µà±ƒà°¦à±à°§à°¿ à°®à°°à°¿à°¯à± à°¨à°¿à°°à±à°µà°¹à°£: à°•à±†. à°µà°¿à°¨à°¯à± à°°à±†à°¡à±à°¡à°¿, à°Žà°‚.à°.à°“, à°¤à°¿à°°à±à°¯à°¾à°¨à°¿'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-rise dashboard-delay-1 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GoogleMapWidget />
        <WeatherWidget />
      </div>


      {!hasAnyDashboardData ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t('No data available', 'No data available')}
        </div>
      ) : (
        <>
          {/* Mandal Overview */}
          {mandalData ? (
            <div className="dashboard-rise dashboard-delay-2 portal-card p-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            {t('Mandal Overview', 'à°®à°‚à°¡à°² à°µà°¿à°µà°°à°¾à°²à±')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute top-0 right-0 opacity-10 -mr-3 -mt-3">
                <Building2 className="w-14 h-14" />
              </div>
              <p className="text-xs opacity-90 relative z-10">{t('Gram Panchayats', 'à°—à±à°°à°¾à°® à°ªà°‚à°šà°¾à°¯à°¤à±€à°²à±')}</p>
              <p className="text-2xl font-bold mt-1 relative z-10">{mandalData.total_gram_panchayats}</p>
            </div>
            <div className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute top-0 right-0 opacity-10 -mr-3 -mt-3">
                <Layers className="w-14 h-14" />
              </div>
              <p className="text-xs opacity-90 relative z-10">{t('Revenue Villages', 'à°°à±†à°µà±†à°¨à±à°¯à±‚ à°—à±à°°à°¾à°®à°¾à°²à±')}</p>
              <p className="text-2xl font-bold mt-1 relative z-10">{dashboardRevenueVillages}</p>
            </div>
            <div className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute top-0 right-0 opacity-10 -mr-3 -mt-3">
                <Users className="w-14 h-14" />
              </div>
              <p className="text-xs opacity-90 relative z-10">{t('Total Farmers', 'à°®à±Šà°¤à±à°¤à°‚ à°°à±ˆà°¤à±à°²à±')}</p>
              <p className="text-2xl font-bold mt-1 relative z-10">{dashboardTotalFarmers.toLocaleString('en-IN')}</p>
            </div>
            <div className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute top-0 right-0 opacity-10 -mr-3 -mt-3">
                <TrendingUp className="w-14 h-14" />
              </div>
              <p className="text-xs opacity-90 relative z-10">{t('Cultivable Area', 'à°¸à°¾à°—à± à°µà°¿à°¸à±à°¤à±€à°°à±à°£à°‚')}</p>
              <p className="text-2xl font-bold mt-1 relative z-10">{formatDashboardNumber(dashboardCultivableArea)}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div className="rounded-lg p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">{t('Geographical Area', 'à°­à±Œà°—à±‹à°³à°¿à°• à°µà°¿à°¸à±à°¤à±€à°°à±à°£à°‚')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{mandalData.geographical_area.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{mandalData.area_unit}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg p-3 bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-950/60 dark:to-cyan-900/40">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-cyan-700 dark:text-cyan-300" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">{t('Normal Rainfall', 'à°¸à°¾à°§à°¾à°°à°£ à°µà°°à±à°·à°ªà°¾à°¤à°‚')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{mandalData.normal_rainfall}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{mandalData.rainfall_unit}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg p-3 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-900/50 dark:to-stone-800/50">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">{t('Soil Types', 'à°¨à±‡à°² à°°à°•à°¾à°²à±')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mandalData.soil_types.map((soil, i) => (
                      <span key={i} className="bg-white/90 text-stone-700 dark:bg-slate-700 dark:text-slate-100 px-2 py-0.5 rounded text-xs font-medium">
                        {soil}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          ) : (
            <DashboardEmptyState message={t('No mandal overview data available', 'No mandal overview data available')} />
          )}

          {/* Crop Statistics */}
          {dashboardCrops.length > 0 ? (
            <div className="dashboard-rise dashboard-delay-2 portal-card p-4">
          <div className="mb-4 flex items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              {t('Major Crops', 'à°ªà±à°°à°§à°¾à°¨ à°ªà°‚à°Ÿà°²à±')} - {t('Total', 'à°®à±Šà°¤à±à°¤à°‚')}: {formatDashboardNumber(totalAcreage)} {t('acres', 'à°Žà°•à°°à°¾à°²à±')}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {dashboardCrops.map((crop, idx) => {
            const gradients = [
              'from-emerald-500 to-emerald-600',
              'from-teal-500 to-teal-600',
              'from-cyan-500 to-cyan-600',
              'from-blue-500 to-blue-600',
              'from-purple-500 to-purple-600'
            ];
            return (
              <div key={crop.id} className={`group relative overflow-hidden rounded-lg bg-gradient-to-br ${gradients[idx % gradients.length]} p-3 text-white shadow-md cursor-pointer hover:shadow-lg transition-all`}>
                {isAdminUser && !farmerStats?.cropRows.length && (
                  <button
                    onClick={() => setEditingCrop(editingCrop === crop.id ? null : crop.id)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-white/20 p-1 rounded transition-opacity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <p className="text-xs opacity-90">{crop.crop_name}</p>
                <p className="text-2xl font-bold mt-1">{formatDashboardNumber(crop.acreage)}</p>
                <p className="text-[10px] opacity-75">{t('acres', 'à°Žà°•à°°à°¾à°²à±')}</p>
              </div>
            );
          })}
        </div>
            </div>
          ) : (
            <DashboardEmptyState message={t('No crop data available', 'No crop data available')} />
          )}

          {fertilizers.length > 0 ? (
            <div className="dashboard-rise dashboard-delay-3 portal-card p-3">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-gray-900 dark:text-white">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              {t('Fertilizer Availability', 'à°Žà°°à±à°µà±à°² à°²à°­à±à°¯à°¤')}
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-400">
              {t(
                'Fertilizer availability from dealer daily closing balance in MT',
                'Fertilizer availability from dealer daily closing balance in MT'
              )}
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {fertilizers.length} {t('fertilizer types', 'à°Žà°°à±à°µà±à°² à°°à°•à°¾à°²à±')}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {fertilizers.map((fertilizer) => {
            const percentage = Math.max(
              8,
              Math.round((fertilizer.quantity_available / highestFertilizerStock) * 100)
            );
            const status =
              percentage >= 70
                ? t('Well stocked', 'à°¸à°°à°¿à°ªà°¡à°¾ à°¸à±à°Ÿà°¾à°•à±')
                : percentage >= 35
                  ? t('Moderate stock', 'à°®à°§à±à°¯à°¸à±à°¥ à°¸à±à°Ÿà°¾à°•à±')
                  : t('Low stock', 'à°¤à°•à±à°•à±à°µ à°¸à±à°Ÿà°¾à°•à±');
            const statusClass =
              percentage >= 70
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : percentage >= 35
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300';

            return (
              <div
                key={fertilizer.id}
                className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-emerald-50/50 p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/80"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      {t('Fertilizer', 'à°Žà°°à±à°µà±')}
                    </p>
                    <h3 className="mt-0.5 truncate text-sm font-black text-gray-950 dark:text-white">
                      {fertilizer.fertilizer_type}
                    </h3>
                  </div>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${statusClass}`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-lg font-black tracking-tight text-gray-950 dark:text-white">
                    {fertilizer.quantity_available.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="mb-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">MT</p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                  <div
                    className="dashboard-bar h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
            </div>
          ) : (
            <DashboardEmptyState message={t('No fertilizer availability data available', 'No fertilizer availability data available')} />
          )}

          {/* Government Schemes */}
          {schemes.length > 0 ? (
            <div className="dashboard-rise dashboard-delay-3 portal-card p-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          {t('Government Schemes', 'à°ªà±à°°à°­à±à°¤à±à°µ à°ªà°¥à°•à°¾à°²à±')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schemes.map((scheme, idx) => {
            const schemeColors = [
              'border-l-4 border-l-emerald-500',
              'border-l-4 border-l-blue-500',
              'border-l-4 border-l-orange-500',
              'border-l-4 border-l-purple-500'
            ];
            const eligibility =
              scheme.scheme_name.trim().toLowerCase() === 'rythu bhima'
                ? 'Age between 18-59 years'
                : scheme.eligibility;
            return (
              <div key={scheme.id} className={`${schemeColors[idx % 4]} bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 hover:shadow-md transition-all group`}>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">{scheme.scheme_name}</h3>
                  {isAdminUser && (
                    <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => openBeneficiaryForm(scheme.id)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                        title={t('Add beneficiaries', 'à°²à°¬à±à°§à°¿à°¦à°¾à°°à±à°²à°¨à± à°œà±‹à°¡à°¿à°‚à°šà°‚à°¡à°¿')}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openSchemeEdit(scheme)}
                        className="text-amber-600 hover:bg-amber-50 p-2 rounded"
                        title={t('Edit scheme', 'à°ªà°¥à°•à°‚ à°¸à°µà°°à°¿à°‚à°šà±')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteScheme(scheme.id, scheme.scheme_name)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                        title={t('Delete scheme', 'à°ªà°¥à°•à°‚ à°¤à±Šà°²à°—à°¿à°‚à°šà±')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {isAdminUser && editingSchemeDetails === scheme.id ? (
                  <div className="mt-3 space-y-2">
                    <input
                      value={schemeForm.scheme_name}
                      onChange={(e) => setSchemeForm({ ...schemeForm, scheme_name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      placeholder={t('Scheme name', 'à°ªà°¥à°•à°‚ à°ªà±‡à°°à±')}
                    />
                    <textarea
                      value={schemeForm.description}
                      onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      placeholder={t('Description', 'à°µà°¿à°µà°°à°£')}
                    />
                    <textarea
                      value={schemeForm.benefits}
                      onChange={(e) => setSchemeForm({ ...schemeForm, benefits: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      placeholder={t('Benefits', 'à°ªà±à°°à°¯à±‹à°œà°¨à°¾à°²à±')}
                    />
                    <textarea
                      value={schemeForm.eligibility}
                      onChange={(e) => setSchemeForm({ ...schemeForm, eligibility: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      placeholder={t('Eligibility', 'à°…à°°à±à°¹à°¤')}
                    />
                    <div className="flex gap-1">
                      <button type="button" onClick={saveSchemeDetails} className="rounded-lg bg-emerald-700 p-2 text-white">
                        <Save className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setEditingSchemeDetails(null)} className="rounded-lg border border-slate-300 p-2 text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 dark:text-slate-300 text-sm mt-1.5">{scheme.description}</p>
                    <div className="space-y-1.5 mt-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-fit">{t('Benefits:', 'à°ªà±à°°à°¯à±‹à°œà°¨à°¾à°²à±:')}</span>
                        <span className="text-gray-700 dark:text-slate-200">{scheme.benefits}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-fit">{t('Eligibility:', 'à°…à°°à±à°¹à°¤:')}</span>
                        <span className="text-gray-700 dark:text-slate-200">{eligibility}</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="mt-3 rounded-lg border border-slate-200 bg-white/80 p-2.5 dark:border-slate-600 dark:bg-slate-800/80">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('Financial year beneficiaries', 'à°†à°°à±à°¥à°¿à°• à°¸à°‚à°µà°¤à±à°¸à°°à°‚ à°²à°¬à±à°§à°¿à°¦à°¾à°°à±à°²à±')}
                  </p>
                  <div className="space-y-2">
                    {schemeBeneficiaries.filter((row) => row.scheme_id === scheme.id).length === 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('No beneficiary records yet', 'à°‡à°‚à°•à°¾ à°²à°¬à±à°§à°¿à°¦à°¾à°°à±à°² à°°à°¿à°•à°¾à°°à±à°¡à±à°²à± à°²à±‡à°µà±')}</p>
                    )}
                    {schemeBeneficiaries
                      .filter((row) => row.scheme_id === scheme.id)
                      .map((row) => (
                        <div key={row.id} className="flex items-start justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{row.financial_year}</p>
                            {row.notes && <p className="text-xs text-slate-500 dark:text-slate-400">{row.notes}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {row.beneficiaries_count.toLocaleString()}
                            </span>
                            {isAdminUser && (
                              <button
                                type="button"
                                onClick={() => deleteBeneficiary(row.id)}
                                className="rounded p-1 text-red-500 hover:bg-red-50"
                                title={t('Delete record', 'à°°à°¿à°•à°¾à°°à±à°¡à± à°¤à±Šà°²à°—à°¿à°‚à°šà±')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  {isAdminUser && editingScheme === scheme.id && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        type="text"
                        value={beneficiaryForm.financial_year}
                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, financial_year: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        placeholder={t('Financial year', 'à°†à°°à±à°¥à°¿à°• à°¸à°‚à°µà°¤à±à°¸à°°à°‚')}
                      />
                      <input
                        type="number"
                        min="0"
                        value={beneficiaryForm.beneficiaries_count}
                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, beneficiaries_count: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        placeholder={t('Beneficiaries', 'à°²à°¬à±à°§à°¿à°¦à°¾à°°à±à°²à±')}
                      />
                      <div className="flex gap-1">
                        <button type="button" onClick={saveBeneficiaryRecord} className="rounded-lg bg-emerald-700 p-2 text-white">
                          <Save className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setEditingScheme(null)} className="rounded-lg border border-slate-300 p-2 text-slate-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={beneficiaryForm.notes}
                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, notes: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-3 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        placeholder={t('Notes / village / category', 'à°—à°®à°¨à°¿à°•à°²à± / à°—à±à°°à°¾à°®à°‚ / à°µà°°à±à°—à°‚')}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
            </div>
          ) : (
            <DashboardEmptyState message={t('No schemes data available', 'No schemes data available')} />
          )}
        </>
      )}
    </div>
  );
}

function DashboardEmptyState({ message }: { message: string }) {
  return (
    <div className="dashboard-rise rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      {message}
    </div>
  );
}

async function fetchFarmerDashboardStats(): Promise<FarmerDashboardStats | null> {
  let rows: FarmerDashboardRow[] = [];
  const { data, error } = await supabase
    .from('farmer_database')
    .select('s_no, farmer_name_english, father_or_husband_name_english, aadhaar_no, ppb_no, phone_number, crop, extent, village_english')
    .limit(25000);

  if (!error && data?.length) rows = data as FarmerDashboardRow[];
  if (!rows.length) rows = await loadFarmerDashboardSeed();
  return rows.length ? buildFarmerDashboardStats(rows) : null;
}

async function loadFarmerDashboardSeed(): Promise<FarmerDashboardRow[]> {
  if (farmerDashboardSeedCache) return farmerDashboardSeedCache;
  try {
    const response = await fetch('/farmer_database_seed.json', { cache: 'force-cache' });
    if (!response.ok) return [];
    const rows = await response.json() as FarmerDashboardRow[];
    farmerDashboardSeedCache = rows;
    return rows;
  } catch {
    return [];
  }
}

function buildFarmerDashboardStats(rows: FarmerDashboardRow[]): FarmerDashboardStats {
  const farmers = new Set<string>();
  const cropExtent = new Map<string, number>();
  let totalExtent = 0;

  rows.forEach((row) => {
    farmers.add(farmerDashboardIdentity(row));
    const extent = extentToGuntas(safeDashboardNumber(row.extent));
    totalExtent += extent;
    const crop = String(row.crop || 'Not specified').trim() || 'Not specified';
    cropExtent.set(crop, (cropExtent.get(crop) || 0) + extent);
  });

  const cropRows = Array.from(cropExtent.entries())
    .map(([crop_name, acreage]) => ({
      id: `farmer-crop-${crop_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      crop_name,
      acreage: guntasToExtent(acreage),
    }))
    .sort((a, b) => b.acreage - a.acreage)
    .slice(0, 5);

  return {
    totalFarmers: farmers.size,
    totalExtent: guntasToExtent(totalExtent),
    cropRows,
  };
}

function farmerDashboardIdentity(row: FarmerDashboardRow) {
  if (row.ppb_no) return `ppb:${normalizeDashboardCode(row.ppb_no)}`;
  if (row.aadhaar_no) return `aadhaar:${normalizeDashboardDigits(row.aadhaar_no)}`;
  if (row.phone_number) return `phone:${normalizeDashboardDigits(row.phone_number)}`;
  return [
    'name',
    searchableDashboardText(row.farmer_name_english),
    searchableDashboardText(row.father_or_husband_name_english),
    searchableDashboardText(row.village_english),
  ].join(':');
}

function normalizeDashboardDigits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function normalizeDashboardCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

function searchableDashboardText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function safeDashboardNumber(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDashboardNumber(value: number) {
  const num = Number(value || 0);
  const acrePart = Math.floor(num);
  const guntaPart = Math.round((num - acrePart) * 100);
  return `${acrePart}.${String(guntaPart).padStart(2, '0')}`;
}

function extentToGuntas(value: number): number {
  const num = Number(value || 0);
  const acrePart = Math.floor(num);
  const guntaPart = Math.round((num - acrePart) * 100);
  return acrePart * 40 + guntaPart;
}

function guntasToExtent(totalGuntas: number): number {
  const acres = Math.floor(totalGuntas / 40);
  const guntas = totalGuntas % 40;
  return acres + (guntas / 100);
}
