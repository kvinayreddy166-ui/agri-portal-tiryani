import React, { lazy, Suspense, useCallback, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Users,
  UserCog,
  Droplets,
  CloudRain,
  Layers,
  TrendingUp,
  PackageCheck,
  CalendarDays,
  Target,
  Store,
} from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { DailyFertilizerStockSummary, fetchDailyFertilizerStockSummary } from '../../dealer-stock/lib/fertilizerStock';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { MandalOverview } from '../../../shared/types/database';
import { MandiPricesWidget } from '../components/MandiPricesWidget';
import { WeatherWidget } from '../components/WeatherWidget';
import { OfficerEnforcementStrip } from '../components/OfficerEnforcementStrip';
import { OfficerTargetsCard } from '../components/OfficerTargetsCard';
import { TargetAllocationModal } from '../components/TargetAllocationModal';
import { PortalLogo } from '../../../shared/components/ui/PortalLogo';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { cachedSupabaseValue } from '../../../shared/lib/offlineCache';
import { groupDistrictCounts } from '../../../shared/utils/districts';
import { normalizeDistrictName, TELANGANA_DISTRICT_MANDAL_MAPPING } from '../../../shared/data/telanganaDistrictMandalData';

// mandal (squashed: lowercase alphanumeric, markers removed) -> district,
// used to correct district when the stored district conflicts with the
// dealer's mandal. Squashing tolerates '(V)'/'(M)' markers and spacing.
const squashPlace = (value: string) =>
  value.replace(/\([^)]*\)/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const MANDAL_TO_DISTRICT = (() => {
  const map = new Map<string, string>();
  for (const [district, mandals] of Object.entries(TELANGANA_DISTRICT_MANDAL_MAPPING)) {
    for (const mandal of mandals) map.set(squashPlace(mandal), district);
  }
  return map;
})();
const MANDAL_CANONICAL = (() => {
  const map = new Map<string, string>();
  for (const mandals of Object.values(TELANGANA_DISTRICT_MANDAL_MAPPING)) {
    for (const mandal of mandals) map.set(squashPlace(mandal), mandal);
  }
  return map;
})();

const LazySimpleBarChart = lazy(() =>
  import('../../../shared/components/charts/SimpleBarChart').then((module) => ({ default: module.SimpleBarChart }))
);
const LazyCategoryDonutChart = lazy(() =>
  import('../../../shared/components/charts/CategoryDonutChart').then((module) => ({ default: module.CategoryDonutChart }))
);
const LazyStackedBarChart = lazy(() =>
  import('../../../shared/components/charts/StackedBarChart').then((module) => ({ default: module.StackedBarChart }))
);

type FarmerDashboardRow = {
  s_no?: number;
  farmer_name_english?: string;
  father_or_husband_name_english?: string;
  aadhaar_no?: string;
  ppb_no?: string;
  phone_number?: string;
  extent?: number;
  village_english?: string;
};

type FarmerDashboardStats = {
  totalFarmers: number;
  totalExtent: number;
};

let farmerDashboardStatsCache: FarmerDashboardStats | null = null;

function getTimeGreeting(): { en: string; te: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { en: 'Good morning', te: 'శుభోదయం', emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { en: 'Good afternoon', te: 'శుభ మధ్యాహ్నం', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { en: 'Good evening', te: 'శుభ సాయంత్రం', emoji: '🌆' };
  return { en: 'Good night', te: 'శుభ రాత్రి', emoji: '🌙' };
}

export const Dashboard = React.memo(function Dashboard() {
  const { isAdminUser, isElevatedOfficerUser, officerProfile, user } = useAuth();
  const { t } = useLanguage();
  const greeting = useMemo(() => getTimeGreeting(), []);
  const [fertilizers, setFertilizers] = useState<DailyFertilizerStockSummary[]>([]);
  const [mandalData, setMandalData] = useState<MandalOverview | null>(null);
  const [farmerStats, setFarmerStats] = useState<FarmerDashboardStats | null>(null);
  const [districtUserCounts, setDistrictUserCounts] = useState<{ district: string; count: number }[]>([]);
  const [designationCounts, setDesignationCounts] = useState<{ name: string; count: number }[]>([]);
  const [dealerCategoryData, setDealerCategoryData] = useState<{ name: string; count: number }[]>([]);
  const [dealerLocationChart, setDealerLocationChart] = useState<{
    rows: Record<string, string | number>[];
    bars: { key: string; label: string }[];
  } | null>(null);
  const [dashboardCacheBuster, setDashboardCacheBuster] = useState(0);
  const [targetsModalOpen, setTargetsModalOpen] = useState(false);
  const [loading, setLoading] = useState(isAdminUser || isElevatedOfficerUser);
  const fetchDashboardData = useCallback(async () => {
    const wantsOfficerWidgets = isElevatedOfficerUser;
    const wantsAdminCounts = isAdminUser;
    if (!wantsOfficerWidgets && !wantsAdminCounts) {
      setLoading(false);
      return;
    }
    try {
      const [contentRes, officersRes, dealersRes] = await Promise.all([
        wantsOfficerWidgets
          ? cachedSupabaseValue<{ content: MandalOverview }>(
              'dashboard:mandal-overview:v2',
              () => supabase.from('site_content').select('content').eq('section_name', 'mandal_overview').maybeSingle(),
              null
            )
          : Promise.resolve(null),
        wantsAdminCounts
          ? supabase.from('officer_profiles').select('id, district, designation').limit(10000)
          : Promise.resolve({ data: [] as { id?: string; district?: string; designation?: string }[] }),
        wantsAdminCounts
          ? supabase.from('dealers').select('dealer_category, created_by, district, mandal').limit(10000)
          : Promise.resolve({ data: [] as { dealer_category?: string | null; created_by?: string | null; district?: string | null; mandal?: string | null }[] }),
      ]);

      setMandalData(contentRes?.content || null);

      const districtNames: string[] = [];
      const desigCounts = new Map<string, number>();
      (officersRes.data || [])
        .filter((row) => row.id !== user?.id)
        .forEach((row) => {
          districtNames.push(String(row.district ?? ''));
          const designation = String(row.designation || '').trim().toUpperCase() || 'Other';
          desigCounts.set(designation, (desigCounts.get(designation) || 0) + 1);
        });
      setDistrictUserCounts(
        groupDistrictCounts(districtNames).map(({ name, count }) => ({ district: name, count }))
      );
      setDesignationCounts(
        Array.from(desigCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      );

      const catCounts = new Map<string, number>();
      (dealersRes.data || []).forEach((row) => {
        const category = dealerCategoryLabel(row.dealer_category);
        catCounts.set(category, (catCounts.get(category) || 0) + 1);
      });
      setDealerCategoryData(
        Array.from(catCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      );

      // District x Mandal dealer distribution for the stacked chart.
      const mandalTotals = new Map<string, number>();
      const byDistrict = new Map<string, Map<string, number>>();
      (dealersRes.data || []).forEach((row) => {
        const mandal = String(row.mandal || '').trim();
        // Prefer the district that actually contains the mandal — stored
        // district may be wrong/missing for imported or legacy rows.
        const district =
          (mandal && MANDAL_TO_DISTRICT.get(squashPlace(mandal))) ||
          normalizeDistrictName(row.district) ||
          'Not Set';
        const mandalLabel = (mandal && MANDAL_CANONICAL.get(squashPlace(mandal))) || mandal || 'Not Set';
        mandalTotals.set(mandalLabel, (mandalTotals.get(mandalLabel) || 0) + 1);
        if (!byDistrict.has(district)) byDistrict.set(district, new Map());
        const m = byDistrict.get(district)!;
        m.set(mandalLabel, (m.get(mandalLabel) || 0) + 1);
      });
      if (byDistrict.size > 0) {
        // Build the union of all mandals that actually have dealers in any district.
        const usedMandals = new Set<string>();
        byDistrict.forEach((mandals) => {
          mandals.forEach((count, mandal) => {
            if (count > 0 && mandal !== 'Not Set') usedMandals.add(mandal);
          });
        });
        const hasNotSet = Array.from(byDistrict.values()).some((m) => m.has('Not Set'));
        // Sort by total dealer count across all districts.
        const sortedMandals = Array.from(usedMandals).sort((a, b) => {
          const aTotal = Array.from(byDistrict.values()).reduce((sum, m) => sum + (m.get(a) || 0), 0);
          const bTotal = Array.from(byDistrict.values()).reduce((sum, m) => sum + (m.get(b) || 0), 0);
          return bTotal - aTotal || a.localeCompare(b);
        });
        const topMandals = sortedMandals.slice(0, 7);
        const hasOthers = usedMandals.size > topMandals.length;
        const barKeys = [...topMandals.map((_, i) => `m${i}`), ...(hasOthers ? ['mOthers'] : []), ...(hasNotSet ? ['mNotSet'] : [])];
        const barLabels = [
          ...topMandals,
          ...(hasOthers ? ['__OTHER_MANDALS__'] : []),
          ...(hasNotSet ? ['__NOT_SET__'] : []),
        ];
        const rows = Array.from(byDistrict.entries())
          .map(([district, mandals]: [string, Map<string, number>]) => {
            const row: Record<string, string | number> = { name: district };
            barKeys.forEach((k) => (row[k] = 0));
            mandals.forEach((count, mandal) => {
              if (count === 0) return;
              let key: string;
              if (mandal === 'Not Set') key = 'mNotSet';
              else if (topMandals.includes(mandal)) key = `m${topMandals.indexOf(mandal)}`;
              else key = 'mOthers';
              row[key] = (row[key] as number) + count;
            });
            return row;
          })
          .sort((a, b) => String(a.name).localeCompare(String(b.name)));
        setDealerLocationChart({
          rows,
          bars: barKeys.map((key, i) => ({ key, label: barLabels[i] })),
        });
        setDashboardCacheBuster((b) => b + 1);
      } else {
        setDealerLocationChart(null);
      }
      setLoading(false);

      if (wantsOfficerWidgets) {
        const [dailyFertilizers, farmerStatsRes] = await Promise.all([
          fetchDailyFertilizerStockSummary().catch(() => []),
          fetchFarmerDashboardStats().catch(() => null),
        ]);
        setFertilizers(dailyFertilizers);
        setFarmerStats(farmerStatsRes);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdminUser, isElevatedOfficerUser, dashboardCacheBuster]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const dashboardTotalFarmers = farmerStats?.totalFarmers ?? mandalData?.total_farmers ?? 0;
  const dashboardCultivableArea = farmerStats?.totalExtent ?? mandalData?.cultivable_area ?? 0;
  const dashboardRevenueVillages = 39;
  const highestFertilizerStock = Math.max(...fertilizers.map((item) => item.quantity_available), 1);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#f2f7f3] dark:bg-slate-950">
        <PortalLogo size="xl" />
        <Spinner size="xl" className="text-emerald-700 dark:text-emerald-400" label="Loading AGRONIX" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('Loading AGRONIX...', 'AGRONIX లోడ్ అవుతోంది...')}</p>
      </div>
    );
  }

  const hasAnyDashboardData =
    isElevatedOfficerUser ||
    Boolean(mandalData) ||
    fertilizers.length > 0 ||
    districtUserCounts.length > 0 ||
    dealerCategoryData.length > 0 ||
    Boolean(dealerLocationChart);

  return (
    <div className="dashboard-shell space-y-6">
      <div className="dashboard-rise flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-3xl">
              <span aria-hidden="true" className="mr-1.5">{greeting.emoji}</span>
              {t(greeting.en, greeting.te)}
            </h1>
            <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {isAdminUser
                ? t('Admin', 'అడ్మిన్')
                : officerProfile
                ? `${officerProfile.full_name} • ${officerProfile.designation}${officerProfile.mandal ? ` • ${officerProfile.mandal}` : ''}`
                : t('Officer', 'అధికారి')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isAdminUser && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <MapPin className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                {officerProfile?.district || 'Kumurambheem Asifabad'}
              </span>
            )}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/60 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs dark:border-emerald-900/60 dark:bg-slate-900 dark:text-emerald-300">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
      </div>
      <div className="dashboard-rise dashboard-delay-1 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <WeatherWidget />
        <MandiPricesWidget />
      </div>

      <div className="dashboard-rise dashboard-delay-2">
        <OfficerEnforcementStrip />
      </div>

      {!isAdminUser && officerProfile && (
        <div className="dashboard-rise dashboard-delay-2 space-y-4">
          {(officerProfile.designation || '').toUpperCase() === 'DNO' && (
            <button
              type="button"
              onClick={() => setTargetsModalOpen(true)}
              className="group flex w-full items-center gap-3 rounded-xl border border-emerald-200/60 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-emerald-400 dark:border-emerald-800/50 dark:bg-slate-900/80 dark:hover:border-emerald-600"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Target className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {t('Allocate Targets to Officers', 'అధికారులకు లక్ష్యాలు కేటాయించండి')}
                </h3>
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t('Assign numeric targets & sample codes to MAO/ADA officers by mandal', 'మండలం వారీగా MAO/ADA అధికారి లక్ష్యాలు & నమూనా కోడ్‌లు కేటాయించండి')}
                </p>
              </div>
            </button>
          )}
          <OfficerTargetsCard />
          <TargetAllocationModal
            open={targetsModalOpen}
            onClose={() => setTargetsModalOpen(false)}
          />
        </div>
      )}

      {!hasAnyDashboardData ? (
        isAdminUser ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t('No data available', 'డేటా అందుబాటులో లేదు')}
          </div>
        ) : null
      ) : (
        <>
          {/* Mandal Overview — officer-side widget, shown to the elevated officer only */}
          {isElevatedOfficerUser && (mandalData ? (
            <div className="dashboard-rise dashboard-delay-2 portal-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-[var(--font-heading)]">
                  <MapPin className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  {t('Mandal Overview', 'మండల వివరాలు')}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-700 to-emerald-600" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Gram Panchayats', 'గ్రామ పంచాయతీలు')}</p>
                    <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-[var(--font-heading)]">{mandalData.total_gram_panchayats}</p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-700 to-emerald-600" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Revenue Villages', 'రెవెన్యూ గ్రామాలు')}</p>
                    <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Layers className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-[var(--font-heading)]">{dashboardRevenueVillages}</p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-500 to-gold-600" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Total Farmers', 'మొత్తం రైతులు')}</p>
                    <div className="rounded-lg bg-gold-50 p-1.5 text-gold-700 dark:bg-gold-950/60 dark:text-gold-300">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-[var(--font-heading)]">{dashboardTotalFarmers.toLocaleString('en-IN')}</p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-700 to-emerald-600" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Cultivable Area', 'సాగు విస్తీర్ణం')}</p>
                    <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-[var(--font-heading)]">{formatDashboardNumber(dashboardCultivableArea)}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2 text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Geographical Area', 'భౌగోళిక విస్తీర్ణం')}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{mandalData.geographical_area.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{mandalData.area_unit}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3.5 dark:border-emerald-800/40 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2 text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
                      <CloudRain className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Normal Rainfall', 'సాధారణ వర్షపాతం')}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{mandalData.normal_rainfall}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{mandalData.rainfall_unit}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2 text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                      <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Soil Types', 'నేల రకాలు')}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {mandalData.soil_types.map((soil, i) => (
                          <span key={i} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
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
            <DashboardEmptyState message={t('No mandal overview data available', 'మండల వివరాల డేటా అందుబాటులో లేదు')} />
          ))}

          {/* Officer Analytics (Admin) */}
          {isAdminUser && (districtUserCounts.length > 0 || designationCounts.length > 0) && (
            <div className="dashboard-rise dashboard-delay-2 portal-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-[var(--font-heading)]">
                    {t('Officer Analytics', 'అధికారి విశ్లేషణలు')}
                  </h2>
                </div>
                <Link
                  to="/admin/user-management"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                >
                  <UserCog className="h-3.5 w-3.5" />
                  <span>{t('User Management', 'వినియోగదారు నిర్వహణ')}</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {districtUserCounts.length > 0 && (
                <div className="lg:col-span-3">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <Users className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  {t('Registered Officers by District', 'జిల్లా వారీగా నమోదు చేసినmektedir')}
                </h2>
                <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {t('Total', 'మొత్తం')}: {districtUserCounts.reduce((sum, d) => sum + d.count, 0)}
                </span>
              </div>
              <div className="px-2 py-2">
                <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
                  <LazySimpleBarChart
                    data={districtUserCounts.slice(0, 15).map(({ district, count }) => ({ name: district, count }))}
                    dataKey="count"
                    nameKey="name"
                  />
                </Suspense>
              </div>
                </div>
              )}

              {designationCounts.length > 0 && (
                <div className="lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Users className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                      {t('Officers by Designation', 'హోదాల వారీగా అధికారి')}
                    </h2>
                    <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {designationCounts.length} {t('roles', 'పాత్రలు')}
                    </span>
                  </div>
                  <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
                    <LazyCategoryDonutChart
                      data={designationCounts}
                      centerLabel={t('officers', 'అధికారులు')}
                    />
                  </Suspense>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Dealer Analytics (Admin) */}
          {isAdminUser && dealerCategoryData.length > 0 && (
            <div className="dashboard-rise dashboard-delay-3 portal-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-[var(--font-heading)]">
                    {t('Dealer Analytics', 'డీలర్ విశ్లేషణలు')}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {t('Total', 'మొత్తం')}: {dealerCategoryData.reduce((sum, d) => sum + d.count, 0)}
                  </span>
                  <Link
                    to="/dealer-management"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                  >
                    <Store className="h-3.5 w-3.5" />
                    <span>{t('Dealer Management', 'డీలర్ నిర్వహణ')}</span>
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {dealerLocationChart && dealerLocationChart.rows.length > 0 && (
                  <div className="lg:col-span-3">
                    <h3 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                      {t('Dealers by District & Mandal', 'జిల్లా & మండలం వారీగా డీలర్లు')}
                    </h3>
                    <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
                      <LazyStackedBarChart
                        data={dealerLocationChart.rows}
                        xKey="name"
                        bars={dealerLocationChart.bars.map((b) => ({
                          ...b,
                          label:
                            b.label === '__OTHER_MANDALS__'
                              ? t('Other Mandals', 'ఇతర మండలాలు')
                              : b.label === '__NOT_SET__'
                                ? t('Not Set', 'సెట్ కాలేదు')
                                : b.label,
                        }))}
                      />
                    </Suspense>
                  </div>
                )}
                {dealerCategoryData.length > 0 && (
                  <div className={dealerLocationChart?.rows.length ? 'lg:col-span-2' : 'lg:col-span-5'}>
                    <h3 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                      {t('Dealers by Category', 'వర్గం వారీగా డీలర్లు')}
                    </h3>
                    <Suspense fallback={<div className="h-56 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
                      <LazyCategoryDonutChart
                        data={dealerCategoryData}
                        centerLabel={t('dealers', 'డీలర్లు')}
                      />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>
          )}

          {isElevatedOfficerUser && (fertilizers.length > 0 ? (
            <div className="dashboard-rise dashboard-delay-3 portal-card p-3">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-gray-900 dark:text-white">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              {t('Fertilizer Availability', 'ఎరువుల లభ్యత')}
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-400">
              {t(
                'Fertilizer availability from dealer daily closing balance in MT',
                'Fertilizer availability from dealer daily closing balance in MT'
              )}
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {fertilizers.length} {t('fertilizer types', 'ఎరువుల రకాలు')}
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
                ? t('Well stocked', 'సరిపడా స్టాక్')
                : percentage >= 35
                  ? t('Moderate stock', 'మధ్యస్థ స్టాక్')
                  : t('Low stock', 'తక్కువ స్టాక్');
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
                      {t('Fertilizer', 'ఎరువు')}
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
                    className="dashboard-bar h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
            </div>
          ) : (
            <DashboardEmptyState message={t('No fertilizer availability data available', 'ఎరువుల లభ్యత డేటా అందుబాటులో లేదు')} />
          ))}

        </>
      )}
    </div>
  );
});

function DashboardEmptyState({ message }: { message: string }) {
  return (
    <div className="dashboard-rise rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      {message}
    </div>
  );
}

const FALLBACK_DASHBOARD_STATS: FarmerDashboardStats = {
  totalFarmers: 8493,
  totalExtent: 25995.36,
};

async function fetchFarmerDashboardStats(): Promise<FarmerDashboardStats | null> {
  const { data, error } = await supabase
    .from('farmer_database')
    .select('s_no, farmer_name_english, father_or_husband_name_english, aadhaar_no, ppb_no, phone_number, extent, village_english')
    .limit(25000);

  if (!error && data?.length) return buildFarmerDashboardStats(data as FarmerDashboardRow[]);
  return loadFarmerDashboardStatsFallback();
}

async function loadFarmerDashboardStatsFallback(): Promise<FarmerDashboardStats | null> {
  if (farmerDashboardStatsCache) return farmerDashboardStatsCache;
  try {
    const response = await fetch('/data/farmer-dashboard-summary-seed.json', { cache: 'force-cache' });
    if (!response.ok) return FALLBACK_DASHBOARD_STATS;
    const stats = (await response.json()) as FarmerDashboardStats;
    farmerDashboardStatsCache = stats;
    return stats;
  } catch {
    return FALLBACK_DASHBOARD_STATS;
  }
}

function buildFarmerDashboardStats(rows: FarmerDashboardRow[]): FarmerDashboardStats {
  const farmers = new Set<string>();
  let totalExtent = 0;

  rows.forEach((row) => {
    farmers.add(farmerDashboardIdentity(row));
    totalExtent += extentToGuntas(safeDashboardNumber(row.extent));
  });

  return {
    totalFarmers: farmers.size,
    totalExtent: guntasToExtent(totalExtent),
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

function dealerCategoryLabel(value: string | null | undefined) {
  switch (value) {
    case 'fertilizer':
      return 'Fertilizer';
    case 'seed':
      return 'Seed';
    case 'pesticide':
      return 'Pesticides';
    default:
      return 'Other';
  }
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

