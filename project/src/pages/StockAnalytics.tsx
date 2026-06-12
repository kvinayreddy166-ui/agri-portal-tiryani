import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ClipboardList, Filter, PackageCheck } from 'lucide-react';
import { StockManagement } from './StockManagement';
import { StockInventory } from './StockInventory';
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
            <h2 className="text-lg font-black text-slate-950">Dealer Stock Monitoring</h2>
          </div>
          <ChevronDown className={`h-5 w-5 text-emerald-800 transition ${commandOpen ? 'rotate-180' : ''}`} />
        </button>

        {commandOpen && (
          <div className="space-y-3 border-t border-emerald-50 p-2 sm:p-3">
            <CommandCenter />

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
        .select('id, dealer_name, dealer_category, expiry_date, location, phone_number')
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

  const dealerMap = useMemo(() => new Map(dealers.map((dealer) => [dealer.id, dealer])), [dealers]);
  const productOptions = useMemo(() => unique(stockRows.map((row) => row.product_type).filter(Boolean)), [stockRows]);
  const dealerOptions = useMemo(() => dealers.map((dealer) => ({ id: dealer.id, name: dealer.dealer_name })).sort((a, b) => a.name.localeCompare(b.name)), [dealers]);
  const villageOptions = useMemo(() => unique(dealers.map((dealer) => dealer.location || '').filter(Boolean)), [dealers]);
  const submittedToday = useMemo(() => new Set(stockRows.filter((row) => row.report_date === today()).map((row) => row.dealer_id || '')), [stockRows]);

  const filteredDealers = useMemo(() => dealers.filter((dealer) => (
    (filters.category === 'all' || (dealer.dealer_category || 'fertilizer') === filters.category) &&
    (filters.dealer === 'all' || dealer.id === filters.dealer) &&
    (filters.village === 'all' || dealer.location === filters.village) &&
    (filters.submissionStatus === 'all' ||
      (filters.submissionStatus === 'updated' ? submittedToday.has(dealer.id) : !submittedToday.has(dealer.id)))
  )), [dealers, filters.category, filters.dealer, filters.submissionStatus, filters.village, submittedToday]);

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
        (filters.submissionStatus === 'updated' ? submittedToday.has(row.dealer_id || '') : !submittedToday.has(row.dealer_id || '')))
    );
  }), [dealerMap, filters, stockRows, submittedToday]);

  const lastByDealer = useMemo(() => buildLastByDealer(stockRows), [stockRows]);
  const licenseRows = useMemo(() => buildLicenseRows(filteredDealers), [filteredDealers]);
  const licenseCounters = useMemo(() => buildLicenseCounters(filteredDealers), [filteredDealers]);
  const expiredLicenses = useMemo(() => licenseRows.filter((row) => row.status === 'Expired'), [licenseRows]);
  const expiringLicenses = useMemo(() => licenseRows.filter((row) => row.status === 'Expiring in 60 days'), [licenseRows]);
  const submissionRows = useMemo(() => buildSubmissionRows(filteredDealers, lastByDealer, submittedToday, submissionTab), [filteredDealers, lastByDealer, submissionTab, submittedToday]);
  const nilStockRows = useMemo(() => buildNilStockRows(filteredDealers, lastByDealer), [filteredDealers, lastByDealer]);
  const idleRows = useMemo(() => buildIdleRows(filteredDealers, lastByDealer, filters.idleDays), [filteredDealers, filters.idleDays, lastByDealer]);
  const ureaNoSalesRows = useMemo(() => buildUreaNoSalesRows(filteredDealers, stockRows, filters.idleDays), [filteredDealers, filters.idleDays, stockRows]);
  const ureaStockRows = useMemo(() => buildUreaStockRanking(filteredDealers, stockRows), [filteredDealers, stockRows]);
  const ureaSalesRows = useMemo(() => buildUreaSalesRanking(filteredDealers, filteredRows), [filteredDealers, filteredRows]);
  const weeklyReceipts = useMemo(() => buildWeeklyReceiptRanking(filteredRows, dealerMap), [dealerMap, filteredRows]);
  const weeklyTopSellers = useMemo(() => buildWeeklyTopSellers(filteredRows, dealerMap), [dealerMap, filteredRows]);

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Filters</p>
            <h1 className="text-base font-black text-slate-950">Monitoring Filters</h1>
          </div>
          <button type="button" onClick={() => setFiltersOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black">
            <Filter className="h-3.5 w-3.5" /> Filters <ChevronDown className={`h-3.5 w-3.5 transition ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
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

      {loading && <div className="rounded-xl bg-white p-4 text-sm font-bold text-slate-500">Loading command center...</div>}

      <section className="grid gap-3 xl:grid-cols-2">
        <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-3">
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
          rows={nilStockRows.map((row) => [row.name, <DayPill key={row.name} days={row.daysIdle} tone="redSoft" />])}
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
        <WeeklyTopSellersCard data={weeklyTopSellers} />
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
    <section className="rounded-[22px] border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-blue-700">License Counter</h2>
      <div className="space-y-3">
        {counters.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm">
            <span>{item.label}</span>
            <span className="text-lg font-black">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardListCard({ title, tone, headers, rows }: { title: string; tone: 'red' | 'green' | 'blue'; headers?: string[]; rows: React.ReactNode[][] }) {
  const toneClass = cardTone(tone);
  return (
    <section className={`overflow-hidden rounded-[22px] border p-4 shadow-sm ${toneClass.card}`}>
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-current/10 pb-3">
        <h2 className={`text-sm font-black uppercase tracking-wide ${toneClass.title}`}>{title}</h2>
        {rows.length > 0 && tone === 'red' && <span className="rounded-lg bg-red-600 px-3 py-1 text-xs font-black text-white">{rows.length} Dealers</span>}
      </div>
      {headers && (
        <div className="mb-2 grid grid-cols-[1fr_auto] gap-3 px-1 text-xs font-black uppercase text-slate-500">
          <span>{headers[0]}</span>
          <span className="text-right">{headers[1]}</span>
        </div>
      )}
      <div className="max-h-[28rem] overflow-y-auto pr-1">
        {rows.length ? rows.map((row, index) => (
          <div key={index} className={`grid grid-cols-[1fr_auto] items-center gap-3 px-1 py-2.5 text-sm ${index % 8 === 7 ? 'bg-slate-200/60' : ''}`}>
            <div className="min-w-0 font-black text-slate-900">
              {row[0]}
              {row[2] && <div className="mt-0.5 text-xs font-bold text-slate-500">{row[1]}</div>}
            </div>
            <div className="shrink-0 text-right font-black">{row[2] || row[1]}</div>
          </div>
        )) : <EmptyCardMessage />}
      </div>
    </section>
  );
}

function UreaNoSalesCard({ rows }: { rows: ReturnType<typeof buildUreaNoSalesRows> }) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-red-200 bg-red-50/40 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-red-100 pb-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-red-600">Urea: No Sales Alert</h2>
        <span className="rounded-lg bg-red-600 px-3 py-1 text-xs font-black text-white">{rows.length} Dealers</span>
      </div>
      <div className="grid grid-cols-[1.4fr_0.55fr_0.65fr_0.75fr] gap-2 px-1 pb-2 text-xs font-black text-slate-950">
        <span>Dealer Name</span>
        <span className="text-right">Current Stock</span>
        <span className="text-center">Last Sale Date</span>
        <span className="text-right">Days Idle</span>
      </div>
      <div className="max-h-[36rem] overflow-y-auto pr-1">
        {rows.length ? rows.map((row, index) => (
          <div key={row.id} className={`grid grid-cols-[1.4fr_0.55fr_0.65fr_0.75fr] items-center gap-2 px-1 py-2.5 text-sm ${index % 8 === 7 ? 'bg-slate-200/60' : ''}`}>
            <div className="min-w-0">
              <p className="break-words font-black text-slate-950">{row.name}</p>
              <p className="text-xs font-bold text-slate-500">{row.mobile || '-'}</p>
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

function WeeklyTopSellersCard({ data }: { data: ReturnType<typeof buildWeeklyTopSellers> }) {
  const productRows = (['Urea', 'DAP', 'SSP', 'MOP', 'Complexes'] as const).map((product) => {
    const all = Object.values(data).flat();
    const match = all.find((row) => product === 'Complexes' ? !['urea', 'dap', 'ssp', 'mop'].includes(row.product.toLowerCase()) : row.product.toLowerCase().includes(product.toLowerCase()));
    return { product, name: match?.name || 'No Sales', sales: match?.sales || 0 };
  });

  return (
    <section className="rounded-[22px] border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
      <h2 className="mb-4 border-b border-emerald-100 pb-3 text-sm font-black uppercase tracking-wide text-emerald-700">Week&apos;s Top Sellers By Category</h2>
      <div className="space-y-1">
        {productRows.map((row, index) => (
          <div key={row.product} className="grid grid-cols-[1fr_1.3fr] items-center gap-3 border-b border-white/80 px-1 py-3 last:border-b-0">
            <div className="flex items-center gap-2 font-black text-emerald-700">
              <span className={`h-2.5 w-2.5 rounded-full ${['bg-blue-500', 'bg-emerald-600', 'bg-cyan-500', 'bg-yellow-400', 'bg-slate-500'][index]}`} />
              {row.product}
            </div>
            <div className="text-right">
              <p className="font-black text-emerald-700">{row.name}</p>
              <p className="text-sm font-bold text-slate-500">{formatWhole(row.sales)} Bags</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BlueNumber({ value }: { value: number }) {
  return <span className="text-right text-base font-black text-blue-600">{formatWhole(value)}</span>;
}

function DayPill({ days, tone }: { days: number; tone: 'red' | 'redSoft' | 'blue' }) {
  const cls = tone === 'blue' ? 'bg-blue-100 text-blue-700' : tone === 'redSoft' ? 'bg-red-100 text-red-600' : 'bg-red-600 text-white';
  return <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black ${cls}`}>{days} Days</span>;
}

function EmptyCardMessage() {
  return <div className="rounded-xl bg-white/70 p-4 text-center text-sm font-bold text-slate-500">No records found.</div>;
}

function cardTone(tone: 'red' | 'green' | 'blue') {
  if (tone === 'red') return { card: 'border-red-200 bg-red-50/40', title: 'text-red-600' };
  if (tone === 'blue') return { card: 'border-blue-200 bg-blue-50/60', title: 'text-blue-700' };
  return { card: 'border-emerald-200 bg-emerald-50/60', title: 'text-emerald-700' };
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

function buildSubmissionRows(dealers: DealerRow[], lastByDealer: Map<string, StockRow>, submittedToday: Set<string>, tab: SubmissionTab) {
  return dealers
    .filter((dealer) => tab === 'updated' ? submittedToday.has(dealer.id) : !submittedToday.has(dealer.id))
    .map((dealer) => ({ name: dealer.dealer_name, lastDate: lastByDealer.get(dealer.id)?.report_date || '', status: tab === 'updated' ? 'Updated' : 'Pending' }));
}

function buildNilStockRows(dealers: DealerRow[], lastByDealer: Map<string, StockRow>) {
  return dealers
    .map((dealer) => {
      const lastDate = lastByDealer.get(dealer.id)?.report_date || '';
      return { name: dealer.dealer_name, stock: Number(lastByDealer.get(dealer.id)?.closing_balance || 0), lastDate, daysIdle: daysBetween(lastDate) };
    })
    .filter((row) => row.stock === 0);
}

function buildIdleRows(dealers: DealerRow[], lastByDealer: Map<string, StockRow>, idleDays: number) {
  return dealers
    .map((dealer) => {
      const lastDate = lastByDealer.get(dealer.id)?.report_date || '';
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
      const ureaRows = rows.filter((row) => row.dealer_id === dealer.id && row.product_type?.toLowerCase() === 'urea');
      const latest = ureaRows.sort((a, b) => (b.report_date || '').localeCompare(a.report_date || ''))[0];
      return { id: dealer.id, name: dealer.dealer_name, stock: Number(latest?.closing_balance || 0), lastDate: latest?.report_date || '' };
    })
    .filter((row) => row.stock > 0)
    .sort((a, b) => b.stock - a.stock);
}

function buildUreaSalesRanking(dealers: DealerRow[], rows: StockRow[]) {
  return dealers
    .map((dealer) => ({
      name: dealer.dealer_name,
      sales: rows.filter((row) => row.dealer_id === dealer.id && row.product_type?.toLowerCase() === 'urea').reduce((sum, row) => sum + Number(row.sales || 0), 0),
    }))
    .filter((row) => row.sales > 0)
    .sort((a, b) => b.sales - a.sales);
}

function buildWeeklyReceiptRanking(rows: StockRow[], dealerMap: Map<string, DealerRow>) {
  return rows
    .filter((row) => Number(row.receipts || 0) > 0)
    .map((row) => ({ name: dealerMap.get(row.dealer_id || '')?.dealer_name || 'Unknown dealer', product: row.product_type || '-', receipts: Number(row.receipts || 0), week: weekLabel(row.report_date) }))
    .sort((a, b) => b.receipts - a.receipts)
    .slice(0, 12);
}

function buildWeeklyTopSellers(rows: StockRow[], dealerMap: Map<string, DealerRow>) {
  const result: Record<StockCategory, { name: string; product: string; sales: number; week: string }[]> = { fertilizer: [], seed: [], pesticide: [] };
  (['fertilizer', 'seed', 'pesticide'] as StockCategory[]).forEach((category) => {
    result[category] = rows
      .filter((row) => row.category === category && Number(row.sales || 0) > 0)
      .map((row) => ({ name: dealerMap.get(row.dealer_id || '')?.dealer_name || 'Unknown dealer', product: row.product_type || '-', sales: Number(row.sales || 0), week: weekLabel(row.report_date) }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8);
  });
  return result;
}
