import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronDown, ClipboardList, Filter, PackageCheck, ShieldAlert } from 'lucide-react';
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

type MainTab = 'command' | 'stock';
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

const today = () => new Date().toISOString().slice(0, 10);

export default function StockAnalytics() {
  const { isDealerUser } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('command');
  const [stockTab, setStockTab] = useState<StockTab>('fertilizer');

  if (isDealerUser) {
    return <StockManagement />;
  }

  return (
    <div className="max-w-full overflow-hidden" style={{ background: THEME.bg }}>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <TopSwitch title="Command Center" active={mainTab === 'command'} icon={<ShieldAlert className="h-4 w-4" />} onClick={() => setMainTab('command')} />
        <TopSwitch title="Stock Analytics" active={mainTab === 'stock'} icon={<BarChart3 className="h-4 w-4" />} onClick={() => setMainTab('stock')} />
      </div>

      {mainTab === 'command' ? (
        <CommandCenter />
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <StockSwitch
              title="Fertilizer Tracking"
              description="Track fertilizer stock and movements"
              active={stockTab === 'fertilizer'}
              icon={<PackageCheck className="h-5 w-5" />}
              onClick={() => setStockTab('fertilizer')}
            />
            <StockSwitch
              title="Stock Inventory"
              description="View and manage stock inventory"
              active={stockTab === 'inventory'}
              icon={<ClipboardList className="h-5 w-5" />}
              onClick={() => setStockTab('inventory')}
            />
          </div>
          {stockTab === 'fertilizer' ? <StockManagement /> : <StockInventory />}
        </div>
      )}
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
  const categoryStats = useMemo(() => buildCategoryStats(filteredDealers, stockRows, submittedToday, filters.idleDays), [filteredDealers, stockRows, submittedToday, filters.idleDays]);
  const licenseRows = useMemo(() => buildLicenseRows(filteredDealers), [filteredDealers]);
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
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Command Center</p>
            <h1 className="text-xl font-black text-slate-950">Dealer Stock Monitoring</h1>
          </div>
          <button type="button" onClick={() => setFiltersOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black">
            <Filter className="h-3.5 w-3.5" /> Filters <ChevronDown className={`h-3.5 w-3.5 transition ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className={`${filtersOpen ? 'grid' : 'hidden md:grid'} mt-3 gap-2 md:grid-cols-4 xl:grid-cols-8`}>
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

      <section className="grid gap-2 md:grid-cols-3">
        {categoryStats.map((item) => (
          <CategoryStatusCard key={item.category} item={item} />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DataTable title="License Expiry Alerts" headers={['S.No', 'Dealer Name', 'Category', 'Validity Date', 'Status']} rows={licenseRows.map((row, index) => [index + 1, row.name, row.category, row.date || '-', <StatusPill key={row.name} status={row.status} />])} />
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DataTable title="Current Nil Stock Dealers" headers={['S.No', 'Dealer/Firm', 'Current Stock', 'Last Updated']} rows={nilStockRows.map((row, index) => [index + 1, row.name, row.stock.toFixed(2), row.lastDate || '-'])} />
        <DataTable title={`Not Logged In / Submitted ${filters.idleDays} Days`} headers={['S.No', 'Dealer/Firm', 'Last Login', 'Days Idle', 'Mobile']} rows={idleRows.map((row, index) => [index + 1, row.name, row.lastDate || '-', row.daysIdle, row.mobile || '-'])} />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DataTable title="Urea No Sales Dealers Alert" headers={['S.No', 'Dealer/Firm', 'Current Urea Stock', 'Last Sale Date', 'Days Idle', 'Alert']} rows={ureaNoSalesRows.map((row, index) => [index + 1, row.name, row.stock.toFixed(2), row.lastSale || '-', row.daysIdle, 'No urea sales'])} />
        <DataTable title="Urea Stock Ranking" headers={['Rank', 'Dealer/Firm', 'Current Urea Stock', 'Last Updated']} rows={ureaStockRows.map((row, index) => [index + 1, row.name, row.stock.toFixed(2), row.lastDate || '-'])} />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DataTable title="Urea Sales Ranking" headers={['Rank', 'Dealer/Firm', 'Urea Sales', 'Period']} rows={ureaSalesRows.map((row, index) => [index + 1, row.name, row.sales.toFixed(2), filters.financialYear])} />
        <DataTable title="Highest Stock Received By Week" headers={['Rank', 'Dealer/Firm', 'Product', 'Quantity Received', 'Week']} rows={weeklyReceipts.map((row, index) => [index + 1, row.name, row.product, row.receipts.toFixed(2), row.week])} />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        {(['fertilizer', 'seed', 'pesticide'] as StockCategory[]).map((category) => (
          <DataTable
            key={category}
            title={`${CATEGORY_LABELS[category]} Top Seller`}
            headers={['Rank', 'Dealer/Firm', 'Product', 'Sales Quantity', 'Week']}
            rows={(weeklyTopSellers[category] || []).map((row, index) => [index + 1, row.name, row.product, row.sales.toFixed(2), row.week])}
          />
        ))}
      </section>
    </div>
  );
}

function TopSwitch({ title, active, icon, onClick }: { title: string; active: boolean; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm ${active ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
      {icon}{title}
    </button>
  );
}

function StockSwitch({ title, description, active, icon, onClick }: { title: string; description: string; active: boolean; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 rounded-lg border p-3 text-left shadow-sm transition ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{icon}</div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black text-slate-900">{title}</h3>
        <p className="truncate text-xs font-semibold text-slate-500">{description}</p>
      </div>
    </button>
  );
}

function CategoryStatusCard({ item }: { item: ReturnType<typeof buildCategoryStats>[number] }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
      <h3 className="text-sm font-black text-slate-950">{item.label} Dealers</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <Metric label="Total" value={item.total} />
        <Metric label="Active" value={item.active} />
        <Metric label="Submitted Today" value={item.submittedToday} />
        <Metric label="Pending Today" value={item.pendingToday} />
        <Metric label="Nil Stock" value={item.nilStock} />
        <Metric label="Idle 3 Days" value={item.idle} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-[#F4F8F5] p-2"><p className="font-black text-slate-950">{value}</p><p className="font-bold text-slate-500">{label}</p></div>;
}

function DataTable({ title, headers, rows }: { title: string; headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-3">
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
      </div>
      <SimpleTable headers={headers} rows={rows} />
    </section>
  );
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

function StatusPill({ status }: { status: string }) {
  const cls = status === 'Expired' ? 'bg-red-100 text-red-800' : status === 'Expiring in 60 days' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
  return <span className={`rounded-full px-2 py-1 text-[11px] font-black ${cls}`}>{status}</span>;
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

function buildCategoryStats(dealers: DealerRow[], rows: StockRow[], submittedToday: Set<string>, idleDays: number) {
  const lastByDealer = buildLastByDealer(rows);
  return (['fertilizer', 'seed', 'pesticide'] as StockCategory[]).map((category) => {
    const categoryDealers = dealers.filter((dealer) => (dealer.dealer_category || 'fertilizer') === category);
    return {
      category,
      label: CATEGORY_LABELS[category],
      total: categoryDealers.length,
      active: categoryDealers.filter((dealer) => lastByDealer.has(dealer.id)).length,
      submittedToday: categoryDealers.filter((dealer) => submittedToday.has(dealer.id)).length,
      pendingToday: categoryDealers.filter((dealer) => !submittedToday.has(dealer.id)).length,
      nilStock: categoryDealers.filter((dealer) => Number(lastByDealer.get(dealer.id)?.closing_balance || 0) === 0).length,
      idle: categoryDealers.filter((dealer) => daysBetween(lastByDealer.get(dealer.id)?.report_date) >= idleDays).length,
    };
  });
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

function buildSubmissionRows(dealers: DealerRow[], lastByDealer: Map<string, StockRow>, submittedToday: Set<string>, tab: SubmissionTab) {
  return dealers
    .filter((dealer) => tab === 'updated' ? submittedToday.has(dealer.id) : !submittedToday.has(dealer.id))
    .map((dealer) => ({ name: dealer.dealer_name, lastDate: lastByDealer.get(dealer.id)?.report_date || '', status: tab === 'updated' ? 'Updated' : 'Pending' }));
}

function buildNilStockRows(dealers: DealerRow[], lastByDealer: Map<string, StockRow>) {
  return dealers
    .map((dealer) => ({ name: dealer.dealer_name, stock: Number(lastByDealer.get(dealer.id)?.closing_balance || 0), lastDate: lastByDealer.get(dealer.id)?.report_date || '' }))
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
      return { ...row, lastSale, daysIdle: daysBetween(lastSale) };
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
