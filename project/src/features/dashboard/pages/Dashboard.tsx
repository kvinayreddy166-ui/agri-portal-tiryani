import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Droplets,
  CloudRain,
  Layers,
  TrendingUp,
  PackageCheck,
  CalendarDays,
  Target,
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
      const [contentRes, officersRes] = await Promise.all([
        wantsOfficerWidgets
          ? cachedSupabaseValue<{ content: MandalOverview }>(
              'dashboard:mandal-overview:v2',
              () => supabase.from('site_content').select('content').eq('section_name', 'mandal_overview').maybeSingle(),
              null
            )
          : Promise.resolve(null),
        wantsAdminCounts
          ? supabase.from('officer_profiles').select('id, district').limit(10000)
          : Promise.resolve({ data: [] as { id?: string; district?: string }[] }),
      ]);

      setMandalData(contentRes?.content || null);

      const counts = new Map<string, number>();
      (officersRes.data || [])
        .filter((row) => row.id !== user?.id)
        .forEach((row) => {
          const district = String(row.district || '').trim() || 'Not specified';
          counts.set(district, (counts.get(district) || 0) + 1);
        });
      setDistrictUserCounts(
        Array.from(counts.entries())
          .map(([district, count]) => ({ district, count }))
          .sort((a, b) => b.count - a.count || a.district.localeCompare(b.district))
      );
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
  }, [user?.id, isAdminUser, isElevatedOfficerUser]);

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
    districtUserCounts.length > 0;

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

          {/* Registered Officers by District (Admin) */}
          {isAdminUser && districtUserCounts.length > 0 && (
            <div className="dashboard-rise dashboard-delay-2 portal-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-[var(--font-heading)]">
                  <Users className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  {t('Registered Officers by District', 'జిల్లా వారీగా నమోదు చేసినmektedir')}
                </h2>
                <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {t('Total', 'మొత్తం')}: {districtUserCounts.reduce((sum, d) => sum + d.count, 0)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {districtUserCounts.map(({ district, count }) => (
                  <div
                    key={district}
                    className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90"
                  >
                    <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {district}
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-[var(--font-heading)]">
                      {count}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      {t('officers', 'అధికారులు')}
                    </p>
                  </div>
                ))}
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

