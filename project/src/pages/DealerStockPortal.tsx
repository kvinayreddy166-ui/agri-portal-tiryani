import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Home, PackageCheck, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translateDealerText } from '../lib/dealerTranslations';
import {
  CATEGORY_UNITS,
  FINANCIAL_YEARS,
  StockCategory,
  StockInventoryLine,
  computeStockRow,
  currentReportDate,
  financialYearForDate,
  financialYearRange,
  formatReportDateLabel,
  productTypesForCategory,
} from '../lib/stockInventory';
import { supabase } from '../lib/supabase';

type ActiveSection = 'dashboard' | 'entry' | 'history';

type DealerProfile = {
  dealer_name: string;
  ifms_id: string;
  phone_number: string;
  license_number: string;
  location: string;
};

type StockForm = {
  entry_date: string;
  product_name: string;
  grade: string;
  crop: string;
  variety: string;
  lot_number: string;
  batch_number: string;
  company_name: string;
  technical_name: string;
  formulation: string;
  opening_stock: number;
  received_quantity: number;
  sold_quantity: number;
  unit: string;
  remarks: string;
};

const categoryLabels: Record<StockCategory, string> = {
  fertilizer: 'Fertilizer',
  seed: 'Seed',
  pesticide: 'Pesticide',
};

function initialForm(category: StockCategory, date = currentReportDate()): StockForm {
  return {
    entry_date: date,
    product_name: productTypesForCategory(category)[0] || '',
    grade: '',
    crop: productTypesForCategory(category)[0] || '',
    variety: '',
    lot_number: '',
    batch_number: '',
    company_name: '',
    technical_name: '',
    formulation: '',
    opening_stock: 0,
    received_quantity: 0,
    sold_quantity: 0,
    unit: CATEGORY_UNITS[category][0],
    remarks: '',
  };
}

export function DealerStockPortal() {
  const { dealerId, dealerName, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useCallback((english: string) => translateDealerText(english, language), [language]);
  const dateLocale = language === 'te' ? 'te-IN' : 'en-IN';

  const [category, setCategory] = useState<StockCategory>('fertilizer');
  const [activeSection, setActiveSection] = useState<ActiveSection>('entry');
  const [financialYear, setFinancialYear] = useState(financialYearForDate());
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [records, setRecords] = useState<StockInventoryLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<StockForm>(() => initialForm('fertilizer'));

  const firmName = dealerProfile?.dealer_name || dealerName || 'Dealer Firm';
  const ifmsId = dealerProfile?.ifms_id || '-';
  const closingStock = form.opening_stock + form.received_quantity - form.sold_quantity;

  const loadDealerProfile = useCallback(async () => {
    if (!dealerId) return;
    const { data } = await supabase
      .from('dealers')
      .select('dealer_name, ifms_id, phone_number, license_number, location')
      .eq('id', dealerId)
      .maybeSingle();
    setDealerProfile((data || null) as DealerProfile | null);
  }, [dealerId]);

  const loadRecords = useCallback(async () => {
    if (!dealerId) return;
    const range = financialYearRange(financialYear);
    setLoading(true);
    const { data, error } = await supabase
      .from('stock_inventory_lines')
      .select('*')
      .eq('dealer_id', dealerId)
      .eq('category', category)
      .gte('report_date', range.start)
      .lte('report_date', range.end)
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setRecords([]);
    } else {
      setRecords((data || []) as StockInventoryLine[]);
    }
    setLoading(false);
  }, [category, dealerId, financialYear]);

  useEffect(() => {
    if (!dealerId) return;
    void loadDealerProfile();
  }, [dealerId, loadDealerProfile]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const switchCategory = (nextCategory: StockCategory) => {
    setCategory(nextCategory);
    setForm(initialForm(nextCategory, form.entry_date));
    setActiveSection('entry');
  };

  const updateForm = (patch: Partial<StockForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async () => {
    if (!dealerId || saving) return;
    const computed = computeStockRow(form.opening_stock, form.received_quantity, form.sold_quantity);
    if (computed.closing_balance < 0) {
      alert(t('Closing stock cannot be negative'));
      return;
    }
    if (!form.product_name.trim()) {
      alert('Select product name.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        dealer_id: dealerId,
        category,
        serial_no: 1,
        product_type: form.product_name.trim(),
        financial_year: financialYearForDate(form.entry_date),
        entry_type: 'daily_stock',
        firm_name: firmName,
        ifms_id: ifmsId === '-' ? '' : ifmsId,
        crop: category === 'seed' ? form.crop.trim() : '',
        variety: category === 'seed' ? form.variety.trim() : form.grade.trim(),
        lot_number: category === 'seed' ? form.lot_number.trim() : '',
        batch_number: category === 'pesticide' ? form.batch_number.trim() : '',
        company_name: category !== 'fertilizer' ? form.company_name.trim() : '',
        technical_name: category === 'pesticide' ? form.technical_name.trim() : '',
        formulation: category === 'pesticide' ? form.formulation.trim() : '',
        opening_balance: computed.opening_balance,
        receipts: computed.receipts,
        total: computed.total,
        sales: computed.sales,
        closing_balance: computed.closing_balance,
        unit: form.unit,
        remarks: form.remarks.trim(),
        report_date: form.entry_date,
        report_month: form.entry_date.slice(0, 7),
        submitted_by: user?.email || '',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('stock_inventory_lines').insert(payload);
      if (error) throw error;

      setMessage(`${categoryLabels[category]} daily stock saved for ${formatReportDateLabel(form.entry_date, dateLocale)}.`);
      setForm(initialForm(category, form.entry_date));
      await loadRecords();
      setActiveSection('history');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Save failed';
      alert(`Could not save: ${text}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBackToLogin = useCallback(async () => {
    await signOut();
    navigate('/login', { replace: true });
  }, [navigate, signOut]);

  const filteredRecords = useMemo(
    () => records.filter((record) => record.category === category),
    [category, records]
  );

  const summary = useMemo(() => {
    const opening = filteredRecords.reduce((sum, row) => sum + Number(row.opening_balance || 0), 0);
    const received = filteredRecords.reduce((sum, row) => sum + Number(row.receipts || 0), 0);
    const sold = filteredRecords.reduce((sum, row) => sum + Number(row.sales || 0), 0);
    return {
      opening,
      received,
      sold,
      closing: opening + received - sold,
      entries: filteredRecords.length,
    };
  }, [filteredRecords]);

  const exportRecords = () => {
    if (!filteredRecords.length) {
      alert('No data to export');
      return;
    }
    const rows = filteredRecords.map((record) => ({
      'Financial Year': record.financial_year || financialYearForDate(record.report_date),
      'Entry Date': record.report_date || '',
      Category: categoryLabels[record.category],
      'Entry Type': record.entry_type || 'daily_stock',
      'Firm Name': record.firm_name || firmName,
      'IFMS ID': record.ifms_id || ifmsId,
      'Product Name': record.product_type,
      Crop: record.crop || '',
      'Variety / Hybrid': record.variety || '',
      'Lot Number': record.lot_number || '',
      'Batch Number': record.batch_number || '',
      'Company Name': record.company_name || '',
      'Technical Name': record.technical_name || '',
      Formulation: record.formulation || '',
      'Opening Stock': record.opening_balance,
      'Received Quantity': record.receipts,
      'Sold Quantity': record.sales,
      'Closing Stock': record.closing_balance,
      Unit: record.unit || '',
      'Invoice No': record.invoice_no || '',
      'Invoice Date': record.invoice_date || '',
      Supplier: record.supplier || '',
      Remarks: record.remarks || '',
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Daily Stock');
    XLSX.writeFile(workbook, `dealer-${category}-stock-${financialYear}.xlsx`);
  };

  if (!dealerId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
        {t('Dealer account not linked. Please sign in with your registered phone number.')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="sticky top-0 z-30 rounded-lg bg-[#0B3D91] p-4 text-white shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-200">{t('Welcome')}</p>
            <h1 className="mt-1 text-xl font-black uppercase tracking-wide sm:text-2xl">{firmName}</h1>
            <p className="mt-1 text-sm font-semibold text-blue-100">IFMS ID: {ifmsId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeSection !== 'dashboard' && (
              <button type="button" onClick={() => setActiveSection('dashboard')} className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-black hover:bg-white/20">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button type="button" onClick={handleBackToLogin} className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-black hover:bg-white/20">
              <Home className="h-4 w-4" /> Login/Home
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
          {message}
        </div>
      )}

      <section className="grid gap-2 sm:grid-cols-3">
        {(['fertilizer', 'seed', 'pesticide'] as StockCategory[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => switchCategory(item)}
            className={`rounded-lg border p-3 text-left shadow-sm transition ${
              category === item
                ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
            }`}
          >
            <p className="text-sm font-black">{categoryLabels[item]}</p>
            <p className="mt-1 text-xs font-semibold opacity-70">Daily Stock Entry</p>
          </button>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        <SummaryCard label="Total Opening Stock" value={summary.opening.toFixed(2)} />
        <SummaryCard label="Total Received" value={summary.received.toFixed(2)} />
        <SummaryCard label="Total Sold" value={summary.sold.toFixed(2)} />
        <SummaryCard label="Current Closing Stock" value={summary.closing.toFixed(2)} />
        <SummaryCard label="Total Entries" value={String(summary.entries)} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <select value={financialYear} onChange={(event) => setFinancialYear(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold">
          {FINANCIAL_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="button" onClick={() => setActiveSection('entry')} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white">Daily Stock Entry</button>
          <button type="button" onClick={() => setActiveSection('history')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700">Stock Receipts & Sales</button>
          <button type="button" onClick={exportRecords} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-700">
            <Download className="h-4 w-4" /> Export to Excel
          </button>
        </div>
      </div>

      {activeSection === 'dashboard' && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600">
          Choose Fertilizer, Seed, or Pesticide and open Daily Stock Entry. All submitted rows are visible under Stock Receipts & Sales.
        </section>
      )}

      {activeSection === 'entry' && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-950">{categoryLabels[category]} Daily Stock Entry</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <CompactInput label="Entry Date" type="date" value={form.entry_date} onChange={(value) => updateForm({ entry_date: value })} />
            {category === 'fertilizer' && (
              <>
                <CompactSelect label="Fertilizer Name" value={form.product_name} onChange={(value) => updateForm({ product_name: value })} options={productTypesForCategory('fertilizer')} />
                <CompactInput label="Grade" value={form.grade} onChange={(value) => updateForm({ grade: value })} />
              </>
            )}
            {category === 'seed' && (
              <>
                <CompactSelect label="Crop" value={form.crop} onChange={(value) => updateForm({ crop: value, product_name: value })} options={productTypesForCategory('seed')} />
                <CompactInput label="Variety / Hybrid Name" value={form.variety} onChange={(value) => updateForm({ variety: value })} />
                <CompactInput label="Lot Number" value={form.lot_number} onChange={(value) => updateForm({ lot_number: value })} />
                <CompactInput label="Company Name" value={form.company_name} onChange={(value) => updateForm({ company_name: value })} />
              </>
            )}
            {category === 'pesticide' && (
              <>
                <CompactSelect label="Product Name" value={form.product_name} onChange={(value) => updateForm({ product_name: value })} options={productTypesForCategory('pesticide')} />
                <CompactInput label="Technical Name" value={form.technical_name} onChange={(value) => updateForm({ technical_name: value })} />
                <CompactInput label="Formulation" value={form.formulation} onChange={(value) => updateForm({ formulation: value })} />
                <CompactInput label="Batch Number" value={form.batch_number} onChange={(value) => updateForm({ batch_number: value })} />
                <CompactInput label="Company Name" value={form.company_name} onChange={(value) => updateForm({ company_name: value })} />
              </>
            )}
            <CompactSelect label="Unit" value={form.unit} onChange={(value) => updateForm({ unit: value })} options={CATEGORY_UNITS[category]} />
            <CompactInput label="Opening Stock" type="number" value={String(form.opening_stock)} onChange={(value) => updateForm({ opening_stock: Number(value) || 0 })} />
            <CompactInput label="Received Quantity" type="number" value={String(form.received_quantity)} onChange={(value) => updateForm({ received_quantity: Number(value) || 0 })} />
            <CompactInput label="Sold Quantity" type="number" value={String(form.sold_quantity)} onChange={(value) => updateForm({ sold_quantity: Number(value) || 0 })} />
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase text-slate-500">Closing Stock</span>
              <input readOnly value={closingStock.toFixed(2)} className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-black text-slate-950" />
            </label>
            <CompactInput label="Remarks" value={form.remarks} onChange={(value) => updateForm({ remarks: value })} />
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </section>
      )}

      {activeSection === 'history' && (
        <HistoryTable loading={loading} records={filteredRecords} category={category} firmName={firmName} ifmsId={ifmsId} />
      )}
    </div>
  );
}

function HistoryTable({ loading, records, category, firmName, ifmsId }: { loading: boolean; records: StockInventoryLine[]; category: StockCategory; firmName: string; ifmsId: string }) {
  if (loading) {
    return <div className="flex h-40 items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h2 className="text-base font-black text-slate-950">Stock Receipts & Sales</h2>
        <p className="text-xs font-semibold text-slate-500">Daily Stock History | Receipts History | Sales History</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1250px] text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              {['Financial Year', 'Entry Date', 'Category', 'Firm Name', 'IFMS ID', 'Product/Crop/Variety Name', 'Opening Stock', 'Received Quantity', 'Sold Quantity', 'Closing Stock', 'Unit', 'Batch/Lot/Invoice', 'Remarks'].map((head) => (
                <th key={head} className="px-3 py-2 text-left">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-3 py-2 font-bold">{record.financial_year || financialYearForDate(record.report_date)}</td>
                <td className="px-3 py-2">{record.report_date}</td>
                <td className="px-3 py-2">{categoryLabels[record.category]}</td>
                <td className="px-3 py-2">{record.firm_name || firmName}</td>
                <td className="px-3 py-2">{record.ifms_id || ifmsId}</td>
                <td className="px-3 py-2 font-black">{category === 'seed' ? `${record.crop || record.product_type} ${record.variety || ''}`.trim() : record.product_type}</td>
                <td className="px-3 py-2 text-right">{Number(record.opening_balance || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(record.receipts || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(record.sales || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-black">{Number(record.closing_balance || 0).toFixed(2)}</td>
                <td className="px-3 py-2">{record.unit || '-'}</td>
                <td className="px-3 py-2">{record.lot_number || record.batch_number || record.invoice_no || '-'}</td>
                <td className="px-3 py-2">{record.remarks || '-'}</td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td colSpan={13} className="px-3 py-8 text-center text-sm font-semibold text-slate-500">No saved entries found for this category and financial year.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-900 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function CompactInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase text-slate-500">{label}</span>
      <input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-emerald-500" />
    </label>
  );
}

function CompactSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-emerald-500">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
