import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ClipboardList, Filter, PackageCheck, RefreshCw } from 'lucide-react';
import { StockManagement } from './StockManagement';
import { StockInventory } from './StockInventory';
import { IconButton } from '../components/ui/DesignSystem';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  FINANCIAL_YEARS,
  StockCategory,
  StockInventoryLine,
  financialYearForDate,
  financialYearRange,
} from '../lib/stockInventory';

type StockTab = 'fertilizer' | 'inventory';
type SubmissionTab = 'updated' | 'pending';
type CategoryFilter = 'all' | StockCategory;

type DealerRow = {
  id: string;
  dealer_name: string;
  dealer_category?: StockCategory | null;
  expiry_date?: string | null;
  location?: string | null;
  phone_number?: string | null;
  last_login_at?: string | null;
};

type StockRow = StockInventoryLine & {
  created_at?: string;
  updated_at?: string;
};

type AdminFilters = {
  category: CategoryFilter;
  financialYear: string;
  fromDate: string;
  toDate: string;
  product: string;
  dealer: string;
  village: string;
  submissionStatus: 'all' | 'updated' | 'pending';
  idleDays: number;
};

const THEME = {
  primary: '#0B7A5C',
  secondary: '#0F9D58',
  danger: '#C62828',
  warning: '#F59E0B',
  bg: '#F4F8F5',
  text: '#0F172A',
  muted: '#64748B',
};

const CATEGORY_LABELS: Record<StockCategory, string> = {
  fertilizer: 'Fertilizer',
  seed: 'Seed',
  pesticide: 'Pesticide',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function StockAnalytics() {
  const { isDealerUser } = useAuth();
  const [stockTab, setStockTab] = useState<StockTab>('fertilizer');
  const [commandOpen, setCommandOpen] = useState(true);
  const [dealerMonitoringOpen, setDealerMonitoringOpen] = useState(true);
  const [stockToolsOpen, setStockToolsOpen] = useState(false);

  if (isDealerUser) {
    return <StockManagement />;
  }

  return (
    <div className="max-w-full space-y-4 overflow-hidden" style={{ background: THEME.bg }}>
      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setCommandOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Command Center</p>
            <h2 className="text-lg font-black text-slate-950">Officer Command Center</h2>
          </div>
          <ChevronDown className={`h-5 w-5 text-emerald-800 transition ${commandOpen ? 'rotate-180' : ''}`} />
        </button>

        {commandOpen && (
          <div className="space-y-3 border-t border-emerald-50 p-2 sm:p-3">
            <section className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setDealerMonitoringOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-white to-emerald-50/70 px-3 py-3 text-left"
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Dealer Monitoring</p>
                  <h3 className="text-base font-black text-slate-950">Dealer Monitoring</h3>
                </div>
                <ChevronDown className={`h-5 w-5 text-emerald-800 transition ${dealerMonitoringOpen ? 'rotate-180' : ''}`} />
              </button>

              {dealerMonitoringOpen && (
                <div className="border-t border-emerald-100 bg-[#fbfdfb] p-2 sm:p-3">
                  <CommandCenter />
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setStockToolsOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Stock Analytics</p>
                  <h3 className="text-base font-black text-slate-950">Fertilizer Tracking & Stock Inventory</h3>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-700 transition ${stockToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {stockToolsOpen && (
                <div className="space-y-3 border-t border-slate-200 p-2 sm:p-3">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <StockSwitch
                      title="Fertilizer Tracking"
                      description="Track fertilizer stock and movements"
                      active={stockTab === 'fertilizer'}
                      tone="red"
                      icon={<PackageCheck className="h-5 w-5" />}
                      onClick={() => setStockTab('fertilizer')}
                    />
                    <StockSwitch
                      title="Stock Inventory"
                      description="View and manage stock inventory"
                      active={stockTab === 'inventory'}
                      tone="green"
                      icon={<ClipboardList className="h-5 w-5" />}
                      onClick={() => setStockTab('inventory')}
                    />
                  </div>
                  {stockTab === 'fertilizer' ? <StockManagement /> : <StockInventory />}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function CommandCenter() {
  const [dealers, setDealers] = useState<DealerRow[]>([]);
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [submissionTab, setSubmissionTab] = useState<SubmissionTab>('updated');
  const [filters, setFilters] = useState<AdminFilters>({
    category: 'all',
    financialYear: financialYearForDate(),
    fromDate: '',
    toDate: '',
    product: 'all',
    dealer: 'all',
    village: 'all',
    submissionStatus: 'all',
    idleDays: 3,
  });

  const loadData = useCallback(async () => {
    const range = financialYearRange(filters.financialYear);
    setLoading(true);
    const [dealersRes, stockRes] = await Promise.all([
      supabase
        .from('dealers')
        .select('id, dealer_name, dealer_category, expiry_date, location, phone_number, last_login_at')
        .order('dealer_name'),
      supabase
        .from('stock_inventory_lines')
        .select('id, dealer_id, category, product_type, entry_type, opening_balance, receipts, total, sales, closing_balance, report_date, report_month, financial_year, unit, created_at, updated_at')
        .gte('report_date', range.start)
        .lte('report_date', range.end)
        .order('report_date', { ascending: false }),
    ]);

    if (dealersRes.error) {
      console.error(dealersRes.error);
      setDealers([]);
    } else {
      setDealers((dealersRes.data || []) as DealerRow[]);
    }

    if (stockRes.error) {
      console.error(stockRes.error);
      setStockRows([]);
    } else {
      setStockRows((stockRes.data || []) as StockRow[]);
    }
    setLoading(false);
  }, [filters.financialYear]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel('command-center-stock-inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_inventory_lines' }, () => {
        void loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dealers' }, () => {
        void loadData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadData]);

  const dealerMap = useMemo(() => new Map(dealers.map((dealer) => [dealer.id, dealer])), [dealers]);
  const productOptions = useMemo(() => unique(stockRows.map((row) => row.product_type).filter(Boolean)), [stockRows]);
  const dealerOptions = useMemo(() => dealers.map((dealer) => ({ id: dealer.id, name: dealer.dealer_name })).sort((a, b) => a.name.localeCompare(b.name)), [dealers]);
  const villageOptions = useMemo(() => unique(dealers.map((dealer) => dealer.location || '').filter(Boolean)), [dealers]);
  const submittedToday = useMemo(() => new Set(stockRows.filter((row) => row.report_date === today()).map((row) => row.dealer_id || '')), [stockRows]);
  const loggedInToday = useMemo(() => new Set(dealers.filter((dealer) => dateOnly(dealer.last_login_at) === today()).map((dealer) => dealer.id)), [dealers]);
  const activeToday = useMemo(() => new Set([...submittedToday, ...loggedInToday]), [loggedInToday, submittedToday]);

  const filteredDealers = useMemo(() => dealers.filter((dealer) => (
    (filters.category === 'all' || (dealer.dealer_category || 'fertilizer') === filters.category) &&
    (filters.dealer === 'all' || dealer.id === filters.dealer) &&
    (filters.village === 'all' || dealer.location === filters.village) &&
    (filters.submissionStatus === 'all' ||
      (filters.submissionStatus === 'updated' ? activeToday.has(dealer.id) : !activeToday.has(dealer.id)))
  )), [activeToday, dealers, filters.category, filters.dealer, filters.submissionStatus, filters.village]);

  const filteredRows = useMemo(() => stockRows.filter((row) => {
    const dealer = dealerMap.get(row.dealer_id || '');
    const rowDate = row.report_date || '';
    return (
      (filters.category === 'all' || row.category === filters.category) &&
      (!filters.fromDate || rowDate >= filters.fromDate) &&
      (!filters.toDate || rowDate <= filters.toDate) &&
      (filters.product === 'all' || row.product_type === filters.product) &&
      (filters.dealer === 'all' || row.dealer_id === filters.dealer) &&
      (filters.village === 'all' || dealer?.location === filters.village) &&
      (filters.submissionStatus === 'all' ||
        (filters.submissionStatus === 'updated' ? activeToday.has(row.dealer_id || '') : !activeToday.has(row.dealer_id || '')))
    );
  }), [activeToday, dealerMap, filters, stockRows]);

  const lastByDealer = useMemo(() => buildLastByDealer(stockRows), [stockRows]);
  const licenseRows = useMemo(() => buildLicenseRows(filteredDealers), [filteredDealers]);
  const licenseCounters = useMemo(() => buildLicenseCounters(filteredDealers), [filteredDealers]);
  const expiredLicenses = useMemo(() => licenseRows.filter((row) => row.status === 'Expired'), [licenseRows]);
  const expiringLicenses = useMemo(() => licenseRows.filter((row) => row.status === 'Expiring in 60 days'), [licenseRows]);
  const submissionRows = useMemo(() => buildSubmissionRows(filteredDealers, lastByDealer, activeToday, submittedToday, submissionTab), [activeToday, filteredDealers, lastByDealer, submissionTab, submittedToday]);
  const nilStockRows = useMemo(() => buildNilStockRows(filteredDealers, filteredRows), [filteredDealers, filteredRows]);
  const idleRows = useMemo(() => buildIdleRows(filteredDealers, lastByDealer, filters.idleDays), [filteredDealers, filters.idleDays, lastByDealer]);
  const ureaNoSalesRows = useMemo(() => buildUreaNoSalesRows(filteredDealers, filteredRows, filters.idleDays), [filteredDealers, filteredRows, filters.idleDays]);
  const ureaStockRows = useMemo(() => buildUreaStockRanking(filteredDealers, filteredRows), [filteredDealers, filteredRows]);
  const ureaSalesRows = useMemo(() => buildUreaSalesRanking(filteredDealers, filteredRows), [filteredDealers, filteredRows]);
  const weeklyReceipts = useMemo(() => buildWeeklyReceiptRanking(filteredRows, dealerMap), [dealerMap, filteredRows]);
  const weeklyTopSellers = useMemo(() => buildWeeklyTopSellers(filteredRows, dealerMap), [dealerMap, filteredRows]);

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm shadow-emerald-100/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Filters</p>
            <h1 className="text-base font-black text-slate-950">Monitoring Filters</h1>
          </div>
          <div className="flex items-center gap-2">
            <IconButton label="Refresh command center" tone="secondary" onClick={loadData} className="h-9 w-9">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </IconButton>
            <IconButton label="Filters" tone="secondary" onClick={() => setFiltersOpen((value) => !value)} className="h-9 w-9">
              {filtersOpen ? <ChevronDown className="h-3.5 w-3.5 rotate-180 transition" /> : <Filter className="h-3.5 w-3.5" />}
            </IconButton>
          </div>
        </div>
        <div className={`${filtersOpen ? 'grid' : 'hidden'} mt-3 gap-2 md:grid-cols-4 xl:grid-cols-8`}>
          <Select label="Category" value={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value as CategoryFilter }))} options={['all', 'fertilizer', 'seed', 'pesticide']} />
          <Select label="Financial Year" value={filters.financialYear} onChange={(value) => setFilters((current) => ({ ...current, financialYear: value }))} options={[...FINANCIAL_YEARS]} />
          <Input label="From Date" type="date" value={filters.fromDate} onChange={(value) => setFilters((current) => ({ ...current, fromDate: value }))} />
          <Input label="To Date" type="date" value={filters.toDate} onChange={(value) => setFilters((current) => ({ ...current, toDate: value }))} />
          <Select label="Product" value={filters.product} onChange={(value) => setFilters((current) => ({ ...current, product: value }))} options={['all', ...productOptions]} />
          <Select label="Dealer" value={filters.dealer} onChange={(value) => setFilters((current) => ({ ...current, dealer: value }))} options={['all', ...dealerOptions.map((dealer) => dealer.id)]} display={(value) => value === 'all' ? 'All dealers' : dealerOptions.find((dealer) => dealer.id === value)?.name || value} />
          <Select label="Village" value={filters.village} onChange={(value) => setFilters((current) => ({ ...current, village: value }))} options={['all', ...villageOptions]} />
          <Select label="Submission" value={filters.submissionStatus} onChange={(value) => setFilters((current) => ({ ...current, submissionStatus: value as AdminFilters['submissionStatus'] }))} options={['all', 'updated', 'pending']} />
        </div>
      </section>

      {loading && <div className="rounded-xl border border-emerald-100 bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">Loading command center...</div>}

      <section className="grid gap-3 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm shadow-emerald-100/40">
          <div className="flex items-center justify-between border-b border-emerald-50 bg-emerald-50/50 px-3 py-2">
            <div>
              <h2 className="text-sm font-black text-slate-950">Dealer Submission List</h2>
              <p className="text-xs font-bold text-slate-500">Today: {today()}</p>
            </div>
            <div className="grid grid-cols-2 rounded-lg border border-slate-200 p-1 text-xs font-black">
              <button className={`rounded-md px-3 py-1.5 ${submissionTab === 'updated' ? 'bg-emerald-700 text-white' : 'text-slate-600'}`} onClick={() => setSubmissionTab('updated')}>Updated</button>
              <button className={`rounded-md px-3 py-1.5 ${submissionTab === 'pending' ? 'bg-red-700 text-white' : 'text-slate-600'}`} onClick={() => setSubmissionTab('pending')}>Pending</button>
            </div>
          </div>
          <SimpleTable headers={['S.No', 'Dealer/Firm', 'Last Submitted Date', 'Status']} rows={submissionRows.map((row, index) => [index + 1, row.name, row.lastDate || '-', row.status])} />
        </section>
        <LicenseCounterCard counters={licenseCounters} />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DashboardListCard
          title="Expired Licenses"
          tone="red"
          headers={['Dealer', 'Valid Upto']}
          rows={expiredLicenses.map((row) => [row.name, formatShortDate(row.date)])}
        />
        <DashboardListCard
          title="Expiring Soon (60 Days)"
          tone="green"
          headers={['Dealer', 'Valid Upto']}
          rows={expiringLicenses.map((row) => [row.name, formatShortDate(row.date)])}
        />
        <DashboardListCard
          title={`Not Logged In > ${filters.idleDays * 24} Hrs`}
          tone="blue"
          rows={idleRows.map((row) => [row.name, row.mobile || '-', <DayPill key={row.name} days={row.daysIdle} tone="blue" />])}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DashboardListCard
          title="Current Nil Stock"
          tone="red"
          rows={nilStockRows.map((row) => [row.name, row.product, <DayPill key={`${row.id}-${row.product}`} days={row.daysIdle} tone="redSoft" />])}
        />
        <DashboardListCard
          title="Urea Stock (Ranking)"
          tone="green"
          rows={ureaStockRows.map((row) => [row.name, <BlueNumber key={row.name} value={row.stock} />])}
        />
      </section>

      <UreaNoSalesCard rows={ureaNoSalesRows} />

      <section className="grid gap-3 xl:grid-cols-2">
        <DashboardListCard
          title="Urea Sales Ranking"
          tone="green"
          headers={['Dealer', 'Sales']}
          rows={ureaSalesRows.map((row) => [row.name, <BlueNumber key={row.name} value={row.sales} />])}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DashboardListCard
          title="Highest Stock Received (7 Days)"
          tone="blue"
          headers={['Dealer', 'Quantity']}
          rows={weeklyReceipts.map((row) => [row.name, <BlueNumber key={`${row.name}-${row.product}`} value={row.receipts} />])}
        />
        <WeeklyTopSellersCard rows={weeklyTopSellers} />
      </section>
    </div>
  );
}

function StockSwitch({ title, description, active, tone, icon, onClick }: { title: string; description: string; active: boolean; tone: 'red' | 'green'; icon: React.ReactNode; onClick: () => void }) {
  const titleClass = tone === 'red' ? 'text-red-700' : 'text-emerald-700';
  const iconClass = tone === 'red'
    ? active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'
    : active ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700';
  return (
    <button type="button" onClick={onClick} className={`flex min-w-[16rem] flex-1 items-center gap-3 rounded-lg border p-3 text-left shadow-sm transition ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>{icon}</div>
      <div className="min-w-0">
        <h3 className={`truncate text-sm font-black ${titleClass}`}>{title}</h3>
        <p className="truncate text-xs font-semibold text-slate-500">{description}</p>
      </div>
    </button>
  );
}

function LicenseCounterCard({ counters }: { counters: { label: string; value: number }[] }) {
  return (
    <section className="rounded-xl border border-emerald-50 bg-white p-3 shadow-sm shadow-slate-100/70">
      <h2 className="mb-2 border-b border-emerald-50 pb-2 text-sm font-black text-slate-950">License Counter</h2>
      <div className="space-y-2">
        {counters.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-emerald-50 bg-emerald-50/30 px-3 py-1.5 text-xs font-bold text-slate-700">
            <span className="truncate">{item.label}</span>
            <span className="rounded-md bg-white px-2 py-0.5 text-sm font-black text-emerald-700 shadow-sm">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardListCard({ title, tone, headers, rows }: { title: string; tone: 'red' | 'green' | 'blue'; headers?: string[]; rows: React.ReactNode[][] }) {
  const toneClass = cardTone(tone);
  return (
    <section className={`overflow-hidden rounded-xl border bg-white p-3 shadow-sm shadow-slate-100/70 ${toneClass.card}`}>
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-wide ${toneClass.eyebrow}`}>Dealer Monitoring</p>
          <h2 className="truncate text-sm font-black text-slate-950">{title}</h2>
        </div>
        {rows.length > 0 && <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${toneClass.badge}`}>{rows.length}</span>}
      </div>
      {headers && (
        <div className="mb-1.5 grid grid-cols-[1fr_auto] gap-3 rounded-md bg-slate-50 px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
          <span>{headers[0]}</span>
          <span className="text-right">{headers[1]}</span>
        </div>
      )}
      <div className="max-h-72 overflow-y-auto pr-1">
        {rows.length ? rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-xs hover:border-emerald-50 hover:bg-emerald-50/30">
            <div className="min-w-0 break-words font-extrabold leading-snug text-slate-900">
              {row[0]}
              {row[2] && <div className="mt-0.5 break-words text-[11px] font-bold text-slate-500">{row[1]}</div>}
            </div>
            <div className="shrink-0 text-right font-black text-slate-800">{row[2] || row[1]}</div>
          </div>
        )) : <EmptyCardMessage />}
      </div>
    </section>
  );
}

function UreaNoSalesCard({ rows }: { rows: ReturnType<typeof buildUreaNoSalesRows> }) {
  return (
    <section className="overflow-hidden rounded-xl border border-rose-50 bg-white p-3 shadow-sm shadow-slate-100/70">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-rose-600">Dealer Monitoring</p>
          <h2 className="text-sm font-black text-slate-950">Urea: No Sales Alert</h2>
        </div>
        <span className="rounded-full bg-rose-50/70 px-2.5 py-1 text-[11px] font-black text-rose-600">{rows.length}</span>
      </div>
      <div className="grid grid-cols-[1.4fr_0.55fr_0.65fr_0.75fr] gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
        <span>Dealer Name</span>
        <span className="text-right">Current Stock</span>
        <span className="text-center">Last Sale Date</span>
        <span className="text-right">Days Idle</span>
      </div>
      <div className="mt-1.5 max-h-80 overflow-y-auto pr-1">
        {rows.length ? rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[1.4fr_0.55fr_0.65fr_0.75fr] items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-xs hover:border-emerald-50 hover:bg-emerald-50/30">
            <div className="min-w-0">
              <p className="break-words font-extrabold leading-snug text-slate-950">{row.name}</p>
              <p className="text-[11px] font-bold text-slate-500">{row.mobile || '-'}</p>
            </div>
            <BlueNumber value={row.stock} />
            <span className="text-center font-bold text-slate-900">{formatShortDate(row.lastSale)}</span>
            <div className="text-right"><DayPill days={row.daysIdle} tone="red" /></div>
          </div>
        )) : <EmptyCardMessage />}
      </div>
    </section>
  );
}

function WeeklyTopSellersCard({ rows }: { rows: ReturnType<typeof buildWeeklyTopSellers> }) {
  return (
    <section className="rounded-xl border border-emerald-50 bg-white p-3 shadow-sm shadow-slate-100/70">
      <div className="mb-2 border-b border-slate-100 pb-2">
        <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Dealer Monitoring</p>
        <h2 className="text-sm font-black text-slate-950">Week&apos;s Top Sellers By Category</h2>
      </div>
      <div className="space-y-1.5">
        {rows.length ? rows.map((row, index) => (
          <div key={`${row.category}-${row.product}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-emerald-50/30">
            <div className="flex min-w-0 items-center gap-2 font-extrabold text-slate-900">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${['bg-emerald-600', 'bg-teal-600', 'bg-lime-600', 'bg-cyan-600', 'bg-slate-500'][index % 5]}`} />
              <span className="break-words">
              {CATEGORY_LABELS[row.category]}: {row.product}
              </span>
            </div>
            <div className="text-right">
              <p className="break-words font-black text-emerald-700">{row.name}</p>
              <p className="text-[11px] font-bold text-slate-500">{formatWhole(row.sales)} Sales</p>
            </div>
          </div>
        )) : <EmptyCardMessage />}
      </div>
    </section>
  );
}

function BlueNumber({ value }: { value: number }) {
  return <span className="inline-flex justify-end rounded-md bg-sky-50/70 px-2 py-0.5 text-right text-sm font-black text-sky-700">{formatWhole(value)}</span>;
}

function DayPill({ days, tone }: { days: number; tone: 'red' | 'redSoft' | 'blue' }) {
  const cls = tone === 'blue' ? 'bg-sky-50/70 text-sky-700' : tone === 'redSoft' ? 'bg-rose-50/70 text-rose-600' : 'bg-rose-500 text-white';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${cls}`}>{days} Days</span>;
}

function EmptyCardMessage() {
  return <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs font-bold text-slate-500">No records found.</div>;
}

function cardTone(tone: 'red' | 'green' | 'blue') {
  if (tone === 'red') return { card: 'border-rose-50', eyebrow: 'text-rose-600', badge: 'bg-rose-50/70 text-rose-600' };
  if (tone === 'blue') return { card: 'border-sky-50', eyebrow: 'text-sky-700', badge: 'bg-sky-50/70 text-sky-700' };
  return { card: 'border-emerald-50', eyebrow: 'text-emerald-700', badge: 'bg-emerald-50/70 text-emerald-700' };
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="table-scroll">
      <table className="w-full min-w-[560px] text-xs">
        <thead className="bg-slate-900 text-white">
          <tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-2.5 py-2 text-left font-black">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-emerald-50/40">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-2.5 py-2 font-bold text-slate-700">{cell}</td>)}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={headers.length} className="px-3 py-8 text-center text-sm font-bold text-slate-500">No records found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Select({ label, value, onChange, options, display }: { label: string; value: string; onChange: (value: string) => void; options: string[]; display?: (value: string) => string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold">
        {options.map((option) => <option key={option} value={option}>{display ? display(option) : option === 'all' ? 'All' : option}</option>)}
      </select>
    </label>
  );
}

function Input({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold" />
    </label>
  );
}

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function formatWhole(value: number) {
  return Math.round(Number(value || 0)).toLocaleString('en-IN');
}

function formatShortDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value.slice(0, 10));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function daysBetween(date?: string | null) {
  if (!date) return 999;
  const start = new Date(date.slice(0, 10)).getTime();
  const end = new Date(today()).getTime();
  return Math.max(0, Math.floor((end - start) / 86400000));
}

function weekLabel(date?: string) {
  if (!date) return '-';
  const value = new Date(date);
  const first = new Date(value.getFullYear(), 0, 1);
  const week = Math.ceil((((value.getTime() - first.getTime()) / 86400000) + first.getDay() + 1) / 7);
  return `${value.getFullYear()} W${String(week).padStart(2, '0')}`;
}

function buildLastByDealer(rows: StockRow[]) {
  const map = new Map<string, StockRow>();
  rows.forEach((row) => {
    if (!row.dealer_id) return;
    const current = map.get(row.dealer_id);
    if (!current || (row.report_date || '') > (current.report_date || '')) map.set(row.dealer_id, row);
  });
  return map;
}

function buildLatestByDealerProduct(rows: StockRow[]) {
  const latestByDealerProduct = new Map<string, StockRow>();
  rows.forEach((row) => {
    if (!row.dealer_id) return;
    const key = `${row.dealer_id}:${row.category}:${(row.product_type || '').toLowerCase()}`;
    const current = latestByDealerProduct.get(key);
    if (!current || (row.report_date || '') > (current.report_date || '')) latestByDealerProduct.set(key, row);
  });
  return latestByDealerProduct;
}

function buildLicenseRows(dealers: DealerRow[]) {
  return dealers.map((dealer) => {
    const idle = daysBetween(dealer.expiry_date);
    const expiryTime = dealer.expiry_date ? new Date(dealer.expiry_date).getTime() : 0;
    const now = new Date(today()).getTime();
    const daysLeft = dealer.expiry_date ? Math.ceil((expiryTime - now) / 86400000) : -1;
    return {
      name: dealer.dealer_name,
      category: CATEGORY_LABELS[(dealer.dealer_category || 'fertilizer') as StockCategory],
      date: dealer.expiry_date || '',
      status: daysLeft < 0 || idle === 999 ? 'Expired' : daysLeft <= 60 ? 'Expiring in 60 days' : 'Valid',
    };
  }).sort((a, b) => a.status.localeCompare(b.status));
}

function buildLicenseCounters(dealers: DealerRow[]) {
  return [
    { label: 'Fertilizer', value: dealers.filter((dealer) => (dealer.dealer_category || 'fertilizer') === 'fertilizer').length },
    { label: 'Seeds', value: dealers.filter((dealer) => dealer.dealer_category === 'seed').length },
    { label: 'Pesticides', value: dealers.filter((dealer) => dealer.dealer_category === 'pesticide').length },
  ];
}

function buildSubmissionRows(dealers: DealerRow[], lastByDealer: Map<string, StockRow>, activeToday: Set<string>, submittedToday: Set<string>, tab: SubmissionTab) {
  return dealers
    .filter((dealer) => tab === 'updated' ? activeToday.has(dealer.id) : !activeToday.has(dealer.id))
    .map((dealer) => ({
      name: dealer.dealer_name,
      lastDate: lastByDealer.get(dealer.id)?.report_date || dateOnly(dealer.last_login_at),
      status: tab === 'updated' ? submittedToday.has(dealer.id) ? 'Updated' : 'Logged In' : 'Pending',
    }));
}

function buildNilStockRows(dealers: DealerRow[], rows: StockRow[]) {
  const dealerIds = new Set(dealers.map((dealer) => dealer.id));
  return Array.from(buildLatestByDealerProduct(rows).values())
    .filter((row) => dealerIds.has(row.dealer_id || '') && Number(row.closing_balance || 0) === 0)
    .map((row) => {
      const dealer = dealers.find((item) => item.id === row.dealer_id);
      return {
        id: row.dealer_id || '',
        name: dealer?.dealer_name || 'Unknown dealer',
        product: `${CATEGORY_LABELS[row.category]} - ${row.product_type || '-'}`,
        lastDate: row.report_date || '',
        daysIdle: daysBetween(row.report_date),
      };
    })
    .sort((a, b) => b.daysIdle - a.daysIdle || a.name.localeCompare(b.name));
}

function buildIdleRows(dealers: DealerRow[], lastByDealer: Map<string, StockRow>, idleDays: number) {
  return dealers
    .map((dealer) => {
      const lastDate = dealer.last_login_at || lastByDealer.get(dealer.id)?.report_date || '';
      return { name: dealer.dealer_name, lastDate, daysIdle: daysBetween(lastDate), mobile: dealer.phone_number || '' };
    })
    .filter((row) => row.daysIdle >= idleDays);
}

function buildUreaNoSalesRows(dealers: DealerRow[], rows: StockRow[], idleDays: number) {
  return buildUreaStockRanking(dealers, rows)
    .map((row) => {
      const dealerRows = rows.filter((item) => item.dealer_id === row.id && item.product_type?.toLowerCase() === 'urea' && Number(item.sales || 0) > 0);
      const lastSale = dealerRows[0]?.report_date || '';
      return { ...row, mobile: dealers.find((dealer) => dealer.id === row.id)?.phone_number || '', lastSale, daysIdle: daysBetween(lastSale) };
    })
    .filter((row) => row.stock > 0 && row.daysIdle >= idleDays);
}

function buildUreaStockRanking(dealers: DealerRow[], rows: StockRow[]) {
  return dealers
    .map((dealer) => {
      const ureaRows = rows.filter((row) => row.category === 'fertilizer' && row.dealer_id === dealer.id && row.product_type?.toLowerCase() === 'urea');
      const latest = ureaRows.sort((a, b) => (b.report_date || '').localeCompare(a.report_date || ''))[0];
      return { id: dealer.id, name: dealer.dealer_name, stock: Number(latest?.closing_balance || 0), lastDate: latest?.report_date || '' };
    })
    .filter((row) => row.stock > 0)
    .sort((a, b) => b.stock - a.stock);
}

function buildUreaSalesRanking(dealers: DealerRow[], rows: StockRow[]) {
  return dealers
    .filter((dealer) => (dealer.dealer_category || 'fertilizer') === 'fertilizer')
    .map((dealer) => ({
      name: dealer.dealer_name,
      sales: rows.filter((row) => row.category === 'fertilizer' && row.dealer_id === dealer.id && row.product_type?.toLowerCase() === 'urea').reduce((sum, row) => sum + Number(row.sales || 0), 0),
    }))
    .sort((a, b) => b.sales - a.sales);
}

function buildWeeklyReceiptRanking(rows: StockRow[], dealerMap: Map<string, DealerRow>) {
  const cutoff = shiftDate(today(), -6);
  const totals = new Map<string, { name: string; receipts: number; products: Set<string> }>();
  rows
    .filter((row) => isReceiptRow(row) && (row.report_date || '') >= cutoff && Number(row.receipts || 0) > 0)
    .forEach((row) => {
      const dealerId = row.dealer_id || 'unknown';
      const current = totals.get(dealerId) || {
        name: dealerMap.get(dealerId)?.dealer_name || 'Unknown dealer',
        receipts: 0,
        products: new Set<string>(),
      };
      current.receipts += Number(row.receipts || 0);
      current.products.add(row.product_type || '-');
      totals.set(dealerId, current);
    });
  return Array.from(totals.values())
    .map((row) => ({ name: row.name, product: Array.from(row.products).join(', '), receipts: row.receipts, week: weekLabel(today()) }))
    .sort((a, b) => b.receipts - a.receipts)
    .slice(0, 12);
}

function buildWeeklyTopSellers(rows: StockRow[], dealerMap: Map<string, DealerRow>) {
  const cutoff = shiftDate(today(), -6);
  const grouped = new Map<string, { category: StockCategory; product: string; dealerId: string; name: string; sales: number; week: string }>();
  rows
    .filter((row) => (row.report_date || '') >= cutoff && Number(row.sales || 0) > 0)
    .forEach((row) => {
      const dealerId = row.dealer_id || 'unknown';
      const product = row.product_type || '-';
      const key = `${row.category}:${product}:${dealerId}`;
      const current = grouped.get(key) || {
        category: row.category,
        product,
        dealerId,
        name: dealerMap.get(dealerId)?.dealer_name || 'Unknown dealer',
        sales: 0,
        week: weekLabel(row.report_date),
      };
      current.sales += Number(row.sales || 0);
      grouped.set(key, current);
    });

  const topByProduct = new Map<string, { category: StockCategory; product: string; name: string; sales: number; week: string }>();
  grouped.forEach((row) => {
    const key = `${row.category}:${row.product}`;
    const current = topByProduct.get(key);
    if (!current || row.sales > current.sales) {
      topByProduct.set(key, {
        category: row.category,
        product: row.product,
        name: row.name,
        sales: row.sales,
        week: row.week,
      });
    }
  });
  return Array.from(topByProduct.values()).sort((a, b) => a.category.localeCompare(b.category) || b.sales - a.sales);
}

function isReceiptRow(row: StockRow) {
  return row.entry_type === 'receipt' || (Number(row.receipts || 0) > 0 && Number(row.sales || 0) === 0 && Number(row.opening_balance || 0) === 0);
}

function shiftDate(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
