import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  buildUreaSummary,
  exportUreaReportExcel,
  exportUreaReportPDF,
  getUreaDealerStock,
  getUreaFarmerBookings,
  getUreaSyncLogs,
  importManualUreaRows,
  parseUreaUploadFile,
  syncUreaReports,
  UreaDealerStock,
  UreaFarmerBooking,
  UreaFilters,
  UreaReportType,
  UreaSyncLog,
} from '../services/ureaDashboardSyncService';

const SimpleBarChart = lazy(() =>
  import('../components/charts/SimpleBarChart').then((module) => ({ default: module.SimpleBarChart }))
);

const reportOptions: { value: UreaReportType; label: string }[] = [
  { value: 'farmer_booking', label: 'Farmer-wise Urea Booking Report' },
  { value: 'village_booking', label: 'Village-wise Urea Booking Report' },
  { value: 'dealer_stock', label: 'Dealer-wise Urea Stock Report' },
  { value: 'dealer_sales', label: 'Dealer-wise Urea Sales Report' },
  { value: 'pending_farmers', label: 'Pending/Unserved Farmers Report' },
  { value: 'nds_non_ppb', label: 'NDS / Non-PPB Farmer Report' },
  { value: 'daily_booking', label: 'Daily Booking Report' },
  { value: 'mandal_summary', label: 'Mandal Summary Report' },
  { value: 'detected', label: 'Other detected reports' },
];

const emptyFilters: UreaFilters = {
  reportType: 'farmer_booking',
  village: '',
  farmerName: '',
  mobileNumber: '',
  aadhaar: '',
  ppbNumber: '',
  dealerName: '',
  dateFrom: '',
  dateTo: '',
  bookingStatus: '',
  search: '',
};

export function UreaDashboardReports() {
  const { isAdminUser } = useAuth();
  const [filters, setFilters] = useState<UreaFilters>(emptyFilters);
  const [logs, setLogs] = useState<UreaSyncLog[]>([]);
  const [bookings, setBookings] = useState<UreaFarmerBooking[]>([]);
  const [stocks, setStocks] = useState<UreaDealerStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadRows, setUploadRows] = useState<Record<string, unknown>[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAdminUser) return;
    setLoading(true);
    setError('');
    try {
      const [nextLogs, nextBookings, nextStocks] = await Promise.all([
        getUreaSyncLogs(),
        getUreaFarmerBookings(filters),
        getUreaDealerStock(filters),
      ]);
      setLogs(nextLogs);
      setBookings(nextBookings);
      setStocks(nextStocks);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Urea Dashboard reports.');
    } finally {
      setLoading(false);
    }
  }, [filters, isAdminUser]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary = useMemo(() => buildUreaSummary(bookings, stocks), [bookings, stocks]);
  const latestLog = logs[0];
  const villages = useMemo(() => unique(bookings.map((row) => row.village).filter(Boolean) as string[]), [bookings]);
  const statuses = useMemo(() => unique(bookings.map((row) => row.booking_status).filter(Boolean) as string[]), [bookings]);

  const runSync = async () => {
    setSyncing(true);
    setError('');
    setMessage('');
    try {
      const result = await syncUreaReports();
      setMessage(`Sync completed. Imported ${result.total_records || 0} records from ${result.total_reports || 0} reports.`);
      await loadData();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Urea Dashboard sync failed.');
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const rows = await parseUreaUploadFile(file);
      setUploadRows(rows);
      setMessage(`Detected ${rows.length.toLocaleString('en-IN')} rows. Review and import when ready.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to read uploaded file.');
    } finally {
      setUploading(false);
    }
  };

  const importUpload = async () => {
    if (!filters.reportType || uploadRows.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const result = await importManualUreaRows(filters.reportType, uploadRows);
      setMessage(`Manual import complete. Imported ${result.imported} rows. Failed/skipped ${result.failed}.`);
      setUploadRows([]);
      await loadData();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Manual import failed.');
    } finally {
      setUploading(false);
    }
  };

  if (!isAdminUser) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
        Admin access is required for Urea Dashboard Reports.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Officer Toolkit</p>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Urea Dashboard Reports</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Server-side sync, manual import, reports, summaries, and exports for Tiryani Mandal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton label="Sync Latest Urea Reports" icon={<RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />} onClick={runSync} disabled={syncing} primary />
            <ActionButton label="Refresh Status" icon={<RefreshCw className="h-4 w-4" />} onClick={loadData} disabled={loading} />
            <ActionButton label="Export to Excel" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => void exportUreaReportExcel(bookings, stocks, filters)} disabled={!bookings.length && !stocks.length} />
            <ActionButton label="Export to PDF" icon={<Download className="h-4 w-4" />} onClick={() => void exportUreaReportPDF(bookings, stocks, filters)} disabled={!bookings.length && !stocks.length} />
          </div>
        </div>
      </section>

      {(message || error) && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {error ? <AlertCircle className="mr-2 inline h-4 w-4" /> : null}
          {error || message}
        </div>
      )}

      <section className="grid gap-3 lg:grid-cols-6">
        <StatusCard label="Last sync date/time" value={formatDateTime(latestLog?.sync_completed_at || latestLog?.sync_started_at)} />
        <StatusCard label="Login status" value={latestLog?.status || 'Not synced'} tone={latestLog?.status === 'success' ? 'good' : latestLog?.status === 'failed' ? 'bad' : 'neutral'} />
        <StatusCard label="Total reports found" value={latestLog?.total_reports ?? 0} />
        <StatusCard label="Total records imported" value={latestLog?.total_records ?? 0} />
        <StatusCard label="Failed records" value={latestLog?.failed_records ?? 0} tone={latestLog?.failed_records ? 'bad' : 'neutral'} />
        <StatusCard label="Error message" value={latestLog?.error_message || 'None'} tone={latestLog?.error_message ? 'bad' : 'neutral'} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
          <Filter className="h-4 w-4 text-emerald-700" />
          Filters
        </div>
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
          <Select label="Report category" value={filters.reportType || 'farmer_booking'} onChange={(value) => setFilters({ ...filters, reportType: value as UreaReportType })} options={reportOptions} />
          <Input label="Search" icon={<Search className="h-4 w-4" />} value={filters.search || ''} onChange={(value) => setFilters({ ...filters, search: value })} placeholder="Name/mobile/Aadhaar/PPB/village" />
          <Select label="Village" value={filters.village || ''} onChange={(value) => setFilters({ ...filters, village: value })} options={[{ label: 'All villages', value: '' }, ...villages.map((village) => ({ label: village, value: village }))]} />
          <Input label="Farmer name" value={filters.farmerName || ''} onChange={(value) => setFilters({ ...filters, farmerName: value })} />
          <Input label="Mobile number" value={filters.mobileNumber || ''} onChange={(value) => setFilters({ ...filters, mobileNumber: value })} />
          <Input label="Aadhaar" value={filters.aadhaar || ''} onChange={(value) => setFilters({ ...filters, aadhaar: value })} />
          <Input label="PPB number" value={filters.ppbNumber || ''} onChange={(value) => setFilters({ ...filters, ppbNumber: value })} />
          <Input label="Dealer name" value={filters.dealerName || ''} onChange={(value) => setFilters({ ...filters, dealerName: value })} />
          <Input label="Date from" type="date" value={filters.dateFrom || ''} onChange={(value) => setFilters({ ...filters, dateFrom: value })} />
          <Input label="Date to" type="date" value={filters.dateTo || ''} onChange={(value) => setFilters({ ...filters, dateTo: value })} />
          <Select label="Booking status" value={filters.bookingStatus || ''} onChange={(value) => setFilters({ ...filters, bookingStatus: value })} options={[{ label: 'All statuses', value: '' }, ...statuses.map((status) => ({ label: status, value: status }))]} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Total farmers booked" value={summary.totalFarmersBooked} />
        <SummaryCard label="Total urea quantity booked" value={summary.totalUreaBooked} />
        <SummaryCard label="Total supplied" value={summary.totalSupplied} />
        <SummaryCard label="Pending quantity" value={summary.pendingQuantity} />
        <SummaryCard label="Dealer-wise stock" value={summary.dealerWiseStock.reduce((sum, row) => sum + row.stock, 0)} />
        <SummaryCard label="Village-wise bookings" value={summary.villageWiseBookings.length} />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Village-wise bookings">
          <Chart data={summary.villageWiseBookings.slice(0, 12)} dataKey="booked" />
        </ChartCard>
        <ChartCard title="Dealer-wise stock">
          <Chart data={summary.dealerWiseStock.slice(0, 12)} dataKey="stock" />
        </ChartCard>
        <ChartCard title="Daily booking trend">
          <Chart data={summary.dailyBookingTrend.slice(0, 14)} dataKey="booked" />
        </ChartCard>
        <ChartCard title="Pending vs supplied">
          <Chart data={summary.pendingVsSupplied} dataKey="quantity" />
        </ChartCard>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Manual upload fallback</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">Upload Excel/CSV exported from Urea Dashboard, validate Tiryani rows, then import without duplicates.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              {uploading ? 'Reading...' : 'Upload Excel/CSV'}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => event.target.files?.[0] && void handleUpload(event.target.files[0])} />
            </label>
            <button type="button" onClick={importUpload} disabled={uploading || !uploadRows.length} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white disabled:opacity-50">
              Import validated rows
            </button>
          </div>
        </div>
        {uploadRows.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
            {uploadRows.length.toLocaleString('en-IN')} rows detected. Current report category: {reportOptions.find((item) => item.value === filters.reportType)?.label}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <DataSection title="Farmer-wise bookings" loading={loading}>
          <FarmerTable rows={bookings} />
        </DataSection>
        <DataSection title="Dealer-wise stock" loading={loading}>
          <StockTable rows={stocks} />
        </DataSection>
      </section>
    </div>
  );
}

function ActionButton({ label, icon, onClick, disabled, primary }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black transition disabled:opacity-50 ${primary ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
      {icon}
      {label}
    </button>
  );
}

function StatusCard({ label, value, tone = 'neutral' }: { label: string; value: React.ReactNode; tone?: 'neutral' | 'good' | 'bad' }) {
  const toneClass = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : 'text-slate-950 dark:text-white';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-emerald-700">{Number(value || 0).toLocaleString('en-IN')}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-2 text-sm font-black text-slate-950 dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

function Chart({ data, dataKey }: { data: Record<string, string | number>[]; dataKey: string }) {
  if (!data.length) return <div className="flex h-60 items-center justify-center rounded-lg bg-slate-50 text-sm font-bold text-slate-500">No chart data</div>;
  return (
    <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-slate-100" />}>
      <SimpleBarChart data={data} dataKey={dataKey} nameKey="name" />
    </Suspense>
  );
}

function DataSection({ title, loading, children }: { title: string; loading: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-2 text-lg font-black text-slate-950 dark:text-white">{title}</h2>
      {loading ? <div className="flex h-28 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-700" /></div> : children}
    </section>
  );
}

function FarmerTable({ rows }: { rows: UreaFarmerBooking[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
          <tr>
            {['Farmer', 'Village', 'Mobile', 'Aadhaar', 'PPB', 'Survey', 'Dealer', 'Booked', 'Supplied', 'Pending', 'Date', 'Status'].map((header) => <th key={header} className="px-3 py-2">{header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? rows.map((row, index) => (
            <tr key={row.id || `${row.farmer_name}-${index}`}>
              <td className="px-3 py-2 font-bold">{row.farmer_name || '-'}</td>
              <td className="px-3 py-2">{row.village || '-'}</td>
              <td className="px-3 py-2">{row.mobile_number || '-'}</td>
              <td className="px-3 py-2">{maskId(row.aadhaar_number)}</td>
              <td className="px-3 py-2">{row.ppb_number || '-'}</td>
              <td className="px-3 py-2">{row.survey_number || '-'}</td>
              <td className="px-3 py-2">{row.dealer_name || '-'}</td>
              <td className="px-3 py-2">{row.urea_booked || 0}</td>
              <td className="px-3 py-2">{row.urea_supplied || 0}</td>
              <td className="px-3 py-2">{row.pending_quantity || 0}</td>
              <td className="px-3 py-2">{row.booking_date || '-'}</td>
              <td className="px-3 py-2">{row.booking_status || '-'}</td>
            </tr>
          )) : (
            <tr><td colSpan={12} className="px-3 py-8 text-center font-bold text-slate-500">No imported farmer booking records.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StockTable({ rows }: { rows: UreaDealerStock[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[860px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
          <tr>
            {['Dealer', 'Firm', 'IFMS', 'Village', 'Opening', 'Receipts', 'Sales', 'Closing', 'Date'].map((header) => <th key={header} className="px-3 py-2">{header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? rows.map((row, index) => (
            <tr key={row.id || `${row.dealer_name}-${index}`}>
              <td className="px-3 py-2 font-bold">{row.dealer_name || '-'}</td>
              <td className="px-3 py-2">{row.firm_name || '-'}</td>
              <td className="px-3 py-2">{row.ifms_id || '-'}</td>
              <td className="px-3 py-2">{row.village || '-'}</td>
              <td className="px-3 py-2">{row.opening_stock || 0}</td>
              <td className="px-3 py-2">{row.receipts || 0}</td>
              <td className="px-3 py-2">{row.sales || 0}</td>
              <td className="px-3 py-2">{row.closing_stock || 0}</td>
              <td className="px-3 py-2">{row.stock_date || '-'}</td>
            </tr>
          )) : (
            <tr><td colSpan={9} className="px-3 py-8 text-center font-bold text-slate-500">No imported dealer stock records.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, icon }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${icon ? 'pl-9' : ''}`} />
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
        {options.map((option) => <option key={option.value || option.label} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('en-IN') : 'Not synced';
}

function maskId(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `XXXX-XXXX-${digits.slice(-4)}` : '-';
}

export default UreaDashboardReports;
