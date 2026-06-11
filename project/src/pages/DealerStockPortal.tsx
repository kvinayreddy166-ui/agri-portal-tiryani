import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Calendar, ChevronDown, FileSpreadsheet, Menu, Save, Table2, Truck, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import {
  CATEGORY_UNITS,
  FINANCIAL_YEARS,
  StockCategory,
  StockInventoryLine,
  computeStockRow,
  currentReportDate,
  financialYearForDate,
  financialYearRange,
  productTypesForCategory,
} from '../lib/stockInventory';
import { supabase } from '../lib/supabase';
import { bagsToMt, formatBags, formatMt, mtToBags } from '../utils/fertilizerUnits';
import { currentFinancialYear } from '../utils/financialYear';

type Section = 'analytics' | 'saved';
type ExportUnit = 'MT' | 'Bags' | 'Both';

type DealerProfile = {
  dealer_name?: string;
  ifms_id?: string;
  license_number?: string;
  fertilizer_license_number?: string;
  seed_license_number?: string;
  pesticide_license_number?: string;
};

type ReceiptForm = {
  date: string;
  product: string;
  quantityMt: number;
  quantity: number;
  invoiceNo: string;
  invoiceDate: string;
  source: string;
  remarks: string;
  batchNo: string;
};

type DailyForm = {
  date: string;
  product: string;
  openingMt: number;
  receiptsMt: number;
  salesMt: number;
  opening: number;
  receipts: number;
  sales: number;
};

type SavedFilter = {
  financialYear: string;
  fromDate: string;
  toDate: string;
  product: string;
  invoiceNo: string;
  source: string;
};

const COLORS = {
  primary: '#0B7A5C',
  secondary: '#0F9D58',
  danger: '#C62828',
  bg: '#F4F8F5',
  text: '#0F172A',
  muted: '#64748B',
};

const CATEGORY_LABELS: Record<StockCategory, string> = {
  fertilizer: 'Fertilizer',
  seed: 'Seed',
  pesticide: 'Pesticide',
};

const FERTILIZER_PRODUCTS = ['Urea', 'DAP', 'MOP', 'SSP', '20:20:0:13', '10:26:26', '14:35:14', '17:17:17', '19:19:19', '28:28:0', 'Other'];
const WHOLESALERS = ['Markfed', 'Coromandel', 'M/s. Laxmi Narasimha Traders, Karimnagar', 'M/s. FR Lahoti & Sons', 'M/s. Vaibhav Traders, Karimnagar', 'Jahnavi Agro Agencies', 'M/s. Sai Rama Trading Company, Karimnagar', 'M/s. Meher Sai Seeds & Fertilizers', 'Sri Rajarajeshwari Traders, Mancherial', 'Kanaka Durga Trading Company', 'Sri Laxmi Fertilizers', 'Rama Trading Company'];

function productsFor(category: StockCategory) {
  return category === 'fertilizer' ? FERTILIZER_PRODUCTS : productTypesForCategory(category);
}

function emptyReceipt(category: StockCategory): ReceiptForm {
  return {
    date: currentReportDate(),
    product: productsFor(category)[0] || '',
    quantityMt: 0,
    quantity: 0,
    invoiceNo: '',
    invoiceDate: currentReportDate(),
    source: category === 'fertilizer' ? 'Markfed' : '',
    remarks: '',
    batchNo: '',
  };
}

function emptyDaily(category: StockCategory): DailyForm {
  return {
    date: currentReportDate(),
    product: productsFor(category)[0] || '',
    openingMt: 0,
    receiptsMt: 0,
    salesMt: 0,
    opening: 0,
    receipts: 0,
    sales: 0,
  };
}

export function DealerStockPortal() {
  const { dealerId, dealerName, user } = useAuth();
  const [section, setSection] = useState<Section>('analytics');
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState<StockCategory>('fertilizer');
  const [unit, setUnit] = useState(CATEGORY_UNITS.fertilizer[0]);
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [records, setRecords] = useState<StockInventoryLine[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [receiptForm, setReceiptForm] = useState<ReceiptForm>(() => emptyReceipt('fertilizer'));
  const [dailyForm, setDailyForm] = useState<DailyForm>(() => emptyDaily('fertilizer'));
  const [receiptFilter, setReceiptFilter] = useState<SavedFilter>(() => emptyFilter());
  const [dailyFilter, setDailyFilter] = useState<SavedFilter>(() => emptyFilter());
  const [receiptFiltersOpen, setReceiptFiltersOpen] = useState(false);
  const [dailyFiltersOpen, setDailyFiltersOpen] = useState(false);
  const [exportUnit, setExportUnit] = useState<ExportUnit>('Both');

  const firmName = dealerProfile?.dealer_name || dealerName || 'Dealer Firm';
  const ifmsId = dealerProfile?.ifms_id || '';
  const licenseNumber = getCategoryLicense(dealerProfile, category);
  const fyForQuery = section === 'saved' ? receiptFilter.financialYear : currentFinancialYear();

  const loadDealerProfile = useCallback(async () => {
    if (!dealerId) return;
    const { data } = await supabase.from('dealers').select('*').eq('id', dealerId).maybeSingle();
    setDealerProfile((data || null) as DealerProfile | null);
  }, [dealerId]);

  const loadRecords = useCallback(async (financialYear = fyForQuery) => {
    if (!dealerId) return;
    setLoading(true);
    const range = financialYearRange(financialYear);
    let query = supabase
      .from('stock_inventory_lines')
      .select('*')
      .eq('dealer_id', dealerId)
      .eq('category', category)
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false });

    query = query.or(`financial_year.eq.${financialYear},and(financial_year.is.null,report_date.gte.${range.start},report_date.lte.${range.end})`);

    const { data, error } = await query;
    if (error) {
      console.error(error);
      setRecords([]);
    } else {
      setRecords((data || []) as StockInventoryLine[]);
    }
    setRecordsLoaded(true);
    setLoading(false);
  }, [category, dealerId, fyForQuery]);

  useEffect(() => {
    void loadDealerProfile();
  }, [loadDealerProfile]);

  useEffect(() => {
    setRecords([]);
    setRecordsLoaded(false);
    setReceiptForm(emptyReceipt(category));
    setDailyForm(emptyDaily(category));
    setUnit(CATEGORY_UNITS[category][0]);
    if (section === 'saved') void loadRecords(receiptFilter.financialYear);
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === 'saved' && !recordsLoaded) void loadRecords(receiptFilter.financialYear);
  }, [loadRecords, recordsLoaded, receiptFilter.financialYear, section]);

  useEffect(() => {
    if (section === 'saved') void loadRecords(receiptFilter.financialYear);
  }, [receiptFilter.financialYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveReceipt = async () => {
    if (!dealerId || saving) return;
    const quantity = category === 'fertilizer' ? receiptForm.quantityMt : receiptForm.quantity;
    if (quantity <= 0 || !receiptForm.invoiceNo.trim()) {
      alert('Enter quantity and invoice number.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        dealer_id: dealerId,
        category,
        serial_no: 1,
        product_type: receiptForm.product.trim(),
        financial_year: financialYearForDate(receiptForm.date),
        entry_type: 'receipt',
        firm_name: firmName,
        ifms_id: category === 'fertilizer' ? ifmsId : '',
        batch_number: category === 'pesticide' ? receiptForm.batchNo.trim() : '',
        opening_balance: 0,
        receipts: quantity,
        total: quantity,
        sales: 0,
        closing_balance: quantity,
        unit: category === 'fertilizer' ? 'MT' : unit,
        invoice_no: receiptForm.invoiceNo.trim(),
        invoice_date: receiptForm.invoiceDate,
        supplier: receiptForm.source.trim(),
        remarks: receiptForm.remarks.trim(),
        report_date: receiptForm.date,
        report_month: receiptForm.date.slice(0, 7),
        submitted_by: user?.email || '',
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('stock_inventory_lines').insert(payload);
      if (error) throw error;
      setMessage('Receipt saved.');
      setReceiptForm(emptyReceipt(category));
      setRecordsLoaded(false);
    } catch (error) {
      alert(`Could not save receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const saveDaily = async () => {
    if (!dealerId || saving) return;
    const computed = category === 'fertilizer'
      ? computeStockRow(dailyForm.openingMt, dailyForm.receiptsMt, dailyForm.salesMt)
      : computeStockRow(dailyForm.opening, dailyForm.receipts, dailyForm.sales);

    if (computed.closing_balance < 0) {
      alert('Closing stock cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        dealer_id: dealerId,
        category,
        serial_no: 1,
        product_type: dailyForm.product.trim(),
        financial_year: financialYearForDate(dailyForm.date),
        entry_type: 'daily_stock',
        firm_name: firmName,
        ifms_id: category === 'fertilizer' ? ifmsId : '',
        opening_balance: computed.opening_balance,
        receipts: computed.receipts,
        total: computed.total,
        sales: computed.sales,
        closing_balance: computed.closing_balance,
        unit: category === 'fertilizer' ? 'MT' : unit,
        report_date: dailyForm.date,
        report_month: dailyForm.date.slice(0, 7),
        submitted_by: user?.email || '',
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('stock_inventory_lines').insert(payload);
      if (error) throw error;
      setMessage('Daily stock saved.');
      setDailyForm(emptyDaily(category));
      setRecordsLoaded(false);
    } catch (error) {
      alert(`Could not save daily stock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!dealerId) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">Dealer account not linked. Please sign in with your registered phone number.</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: COLORS.bg, color: COLORS.text }}>
      <div className="sticky top-0 z-30 border-b border-emerald-900/10 bg-[#F4F8F5]/95 p-3 backdrop-blur">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-black uppercase sm:text-lg">{firmName}</h1>
              {category === 'fertilizer' && ifmsId && <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-black text-white">IFMS ID: {ifmsId}</span>}
            </div>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: COLORS.muted }}>{licenseNumber || 'License No. Not Updated'}</p>
          </div>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="rounded-xl border border-emerald-200 bg-white p-2 text-emerald-900 shadow-sm">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <MenuButton icon={<BarChart3 className="h-4 w-4" />} label="Stock Analytics" active={section === 'analytics'} onClick={() => { setSection('analytics'); setMenuOpen(false); }} />
                <MenuButton icon={<Table2 className="h-4 w-4" />} label="Saved Entries" active={section === 'saved'} onClick={() => { setSection('saved'); setMenuOpen(false); void loadRecords(receiptFilter.financialYear); }} />
              </div>
            )}
          </div>
        </div>
        <CategoryTabs category={category} onChange={setCategory} />
      </div>

      <main className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black">{section === 'analytics' ? 'Stock Analytics' : 'Saved Entries'}</h2>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black shadow-sm">
            Unit
            <select value={unit} onChange={(event) => setUnit(event.target.value)} className="bg-transparent outline-none">
              {CATEGORY_UNITS[category].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</div>}

        {section === 'analytics' ? (
          <div className="grid gap-3 xl:grid-cols-[minmax(280px,0.8fr)_minmax(520px,1.2fr)]">
            <ReceiptEntryCard category={category} unit={unit} form={receiptForm} setForm={setReceiptForm} saving={saving} onSave={saveReceipt} />
            <DailyEntryCard category={category} unit={unit} form={dailyForm} setForm={setDailyForm} saving={saving} onSave={saveDaily} />
          </div>
        ) : (
          <SavedEntries
            category={category}
            unit={unit}
            records={records}
            loading={loading}
            firmName={firmName}
            ifmsId={ifmsId}
            receiptFilter={receiptFilter}
            setReceiptFilter={setReceiptFilter}
            dailyFilter={dailyFilter}
            setDailyFilter={setDailyFilter}
            exportUnit={exportUnit}
            setExportUnit={setExportUnit}
            receiptFiltersOpen={receiptFiltersOpen}
            setReceiptFiltersOpen={setReceiptFiltersOpen}
            dailyFiltersOpen={dailyFiltersOpen}
            setDailyFiltersOpen={setDailyFiltersOpen}
          />
        )}
      </main>
    </div>
  );
}

const CategoryTabs = memo(function CategoryTabs({ category, onChange }: { category: StockCategory; onChange: (category: StockCategory) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(['fertilizer', 'seed', 'pesticide'] as StockCategory[]).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-xl border px-2 py-2.5 text-sm font-black transition ${category === item ? 'text-white' : 'bg-white text-emerald-800'}`}
          style={{ background: category === item ? COLORS.primary : '#FFFFFF', borderColor: COLORS.primary }}
        >
          {CATEGORY_LABELS[item]}
        </button>
      ))}
    </div>
  );
});

function MenuButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-black ${active ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'}`}>
      {icon}{label}
    </button>
  );
}

function ReceiptEntryCard({ category, unit, form, setForm, saving, onSave }: { category: StockCategory; unit: string; form: ReceiptForm; setForm: React.Dispatch<React.SetStateAction<ReceiptForm>>; saving: boolean; onSave: () => void }) {
  const update = (patch: Partial<ReceiptForm>) => setForm((current) => ({ ...current, ...patch }));
  const quantityBags = mtToBags(form.quantityMt, form.product);
  const displayQty = category === 'fertilizer' && unit === 'Bags' ? Math.round(quantityBags) : form.quantityMt;

  return (
    <section className="rounded-[14px] border border-red-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-red-800"><Truck className="h-4 w-4" /> Receipts Entry</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Date" type="date" value={form.date} onChange={(value) => update({ date: value })} />
        <ProductInput category={category} label={category === 'fertilizer' ? 'Fertilizer Name' : category === 'seed' ? 'Seed / Hybrid Name' : 'Pesticide Name'} value={form.product} onChange={(value) => update({ product: value })} />
        {category === 'fertilizer' ? (
          <>
            <Field label={`Quantity Received (${unit})`} type="number" value={String(displayQty)} onChange={(value) => update({ quantityMt: unit === 'Bags' ? bagsToMt(Number(value) || 0, form.product) : Number(value) || 0 })} />
            <Readonly label="Auto Conversion" value={`${formatMt(form.quantityMt)} MT / ${formatBags(quantityBags)} Bags`} />
          </>
        ) : (
          <>
            <Field label="Quantity Received" type="number" value={String(form.quantity)} onChange={(value) => update({ quantity: Number(value) || 0 })} />
            <Readonly label="Unit" value={unit} />
          </>
        )}
        {category === 'pesticide' && <Field label="Batch Number" value={form.batchNo} onChange={(value) => update({ batchNo: value })} />}
        <Field label="Invoice Number" value={form.invoiceNo} onChange={(value) => update({ invoiceNo: value })} />
        <Field label="Invoice Date" type="date" value={form.invoiceDate} onChange={(value) => update({ invoiceDate: value })} />
        {category === 'fertilizer'
          ? <SelectField label="Wholesaler / Source" value={form.source} onChange={(value) => update({ source: value })} options={WHOLESALERS} />
          : <Field label="Source" value={form.source} onChange={(value) => update({ source: value })} />}
        <Field label="Remarks" value={form.remarks} onChange={(value) => update({ remarks: value })} />
      </div>
      <button type="button" onClick={onSave} disabled={saving} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white disabled:opacity-60" style={{ background: COLORS.danger }}>
        <Save className="h-4 w-4" /> Save Receipt
      </button>
    </section>
  );
}

function DailyEntryCard({ category, unit, form, setForm, saving, onSave }: { category: StockCategory; unit: string; form: DailyForm; setForm: React.Dispatch<React.SetStateAction<DailyForm>>; saving: boolean; onSave: () => void }) {
  const update = (patch: Partial<DailyForm>) => setForm((current) => ({ ...current, ...patch }));
  const computed = category === 'fertilizer'
    ? computeStockRow(form.openingMt, form.receiptsMt, form.salesMt)
    : computeStockRow(form.opening, form.receipts, form.sales);
  const display = (value: number) => category === 'fertilizer' && unit === 'Bags' ? Math.round(mtToBags(value, form.product)) : Number(formatMt(value));
  const parse = (value: number) => category === 'fertilizer' && unit === 'Bags' ? bagsToMt(value, form.product) : value;

  return (
    <section className="rounded-[14px] border border-emerald-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-black text-emerald-900"><Calendar className="h-4 w-4" /> Daily Stock / Sales Entry</h3>
        <input type="date" value={form.date} onChange={(event) => update({ date: event.target.value })} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-black" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="sticky top-0 text-white" style={{ background: COLORS.text }}>
            <tr>
              {['Product', `Opening (${unit})`, `Receipts (${unit})`, `Total (${unit})`, `Sales (${unit})`, `Closing (${unit})`].map((head) => <th key={head} className="px-2 py-2 text-left">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="px-2 py-2"><ProductInput category={category} label="" value={form.product} onChange={(value) => update({ product: value })} /></td>
              <td className="px-2 py-2"><NumberInput value={category === 'fertilizer' ? display(form.openingMt) : form.opening} onChange={(value) => category === 'fertilizer' ? update({ openingMt: parse(value) }) : update({ opening: value })} /></td>
              <td className="px-2 py-2"><NumberInput value={category === 'fertilizer' ? display(form.receiptsMt) : form.receipts} onChange={(value) => category === 'fertilizer' ? update({ receiptsMt: parse(value) }) : update({ receipts: value })} /></td>
              <td className="px-2 py-2 font-black text-emerald-800">{category === 'fertilizer' ? display(computed.total) : computed.total}</td>
              <td className="px-2 py-2"><NumberInput value={category === 'fertilizer' ? display(form.salesMt) : form.sales} onChange={(value) => category === 'fertilizer' ? update({ salesMt: parse(value) }) : update({ sales: value })} /></td>
              <td className="px-2 py-2 font-black">{category === 'fertilizer' ? display(computed.closing_balance) : computed.closing_balance}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {category === 'fertilizer' && <p className="mt-2 text-xs font-bold text-slate-500">Auto Conversion: {formatMt(computed.closing_balance)} MT / {formatBags(mtToBags(computed.closing_balance, form.product))} Bags</p>}
      <button type="button" onClick={onSave} disabled={saving} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white disabled:opacity-60" style={{ background: COLORS.primary }}>
        <Save className="h-4 w-4" /> Save Daily Entry
      </button>
    </section>
  );
}

function SavedEntries(props: {
  category: StockCategory;
  unit: string;
  records: StockInventoryLine[];
  loading: boolean;
  firmName: string;
  ifmsId: string;
  receiptFilter: SavedFilter;
  setReceiptFilter: React.Dispatch<React.SetStateAction<SavedFilter>>;
  dailyFilter: SavedFilter;
  setDailyFilter: React.Dispatch<React.SetStateAction<SavedFilter>>;
  exportUnit: ExportUnit;
  setExportUnit: (unit: ExportUnit) => void;
  receiptFiltersOpen: boolean;
  setReceiptFiltersOpen: (open: boolean) => void;
  dailyFiltersOpen: boolean;
  setDailyFiltersOpen: (open: boolean) => void;
}) {
  const { category, unit, records, loading, receiptFilter, setReceiptFilter, dailyFilter, setDailyFilter } = props;
  const receiptRows = useFilteredRows(records, category, receiptFilter, 'receipt');
  const dailyRows = useFilteredRows(records, category, dailyFilter, 'daily_stock');
  const receiptProducts = useOptions(records, category, 'receipt', 'product');
  const receiptSources = useOptions(records, category, 'receipt', 'source');
  const dailyProducts = useOptions(records, category, 'daily_stock', 'product');
  const summary = useMemo(() => buildSummary(dailyRows, receiptRows), [dailyRows, receiptRows]);

  return (
    <div className="space-y-3">
      {loading && <div className="rounded-xl bg-white p-3 text-sm font-bold text-slate-500">Loading saved entries...</div>}
      <SummaryCards summary={summary} category={category} unit={unit} />
      <SavedTableSection
        title="Saved Receipts"
        category={category}
        unit={unit}
        rows={receiptRows}
        type="receipt"
        filter={receiptFilter}
        setFilter={setReceiptFilter}
        productOptions={receiptProducts}
        sourceOptions={receiptSources}
        filtersOpen={props.receiptFiltersOpen}
        setFiltersOpen={props.setReceiptFiltersOpen}
        exportUnit={props.exportUnit}
        setExportUnit={props.setExportUnit}
        onExport={() => exportSavedRows('receipts', receiptRows, category, unit, props.exportUnit, props.firmName, props.ifmsId)}
      />
      <SavedTableSection
        title="Saved Daily Stock / Sales"
        category={category}
        unit={unit}
        rows={dailyRows}
        type="daily_stock"
        filter={dailyFilter}
        setFilter={setDailyFilter}
        productOptions={dailyProducts}
        sourceOptions={[]}
        filtersOpen={props.dailyFiltersOpen}
        setFiltersOpen={props.setDailyFiltersOpen}
        exportUnit={props.exportUnit}
        setExportUnit={props.setExportUnit}
        onExport={() => exportSavedRows('daily', dailyRows, category, unit, props.exportUnit, props.firmName, props.ifmsId)}
      />
    </div>
  );
}

function SavedTableSection(props: {
  title: string;
  category: StockCategory;
  unit: string;
  rows: StockInventoryLine[];
  type: 'receipt' | 'daily_stock';
  filter: SavedFilter;
  setFilter: React.Dispatch<React.SetStateAction<SavedFilter>>;
  productOptions: string[];
  sourceOptions: string[];
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  exportUnit: ExportUnit;
  setExportUnit: (unit: ExportUnit) => void;
  onExport: () => void;
}) {
  return (
    <section className="rounded-[14px] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black">{props.title}</h3>
          <p className="text-xs font-bold text-slate-500">{props.rows.length} records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {props.category === 'fertilizer' && (
            <select value={props.exportUnit} onChange={(event) => props.setExportUnit(event.target.value as ExportUnit)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-black">
              {['MT', 'Bags', 'Both'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          )}
          <button type="button" onClick={() => props.setFiltersOpen(!props.filtersOpen)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black">
            Filters <ChevronDown className={`h-3 w-3 transition ${props.filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          <button type="button" onClick={props.onExport} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white">
            <FileSpreadsheet className="h-3 w-3" /> Export Excel
          </button>
        </div>
      </div>
      <div className={`${props.filtersOpen ? 'grid' : 'hidden md:grid'} mb-2 gap-2 md:grid-cols-6`}>
        <SelectField label="Financial Year" value={props.filter.financialYear} onChange={(value) => props.setFilter((current) => ({ ...current, financialYear: value }))} options={FINANCIAL_YEARS} />
        <Field label="From Date" type="date" value={props.filter.fromDate} onChange={(value) => props.setFilter((current) => ({ ...current, fromDate: value }))} />
        <Field label="To Date" type="date" value={props.filter.toDate} onChange={(value) => props.setFilter((current) => ({ ...current, toDate: value }))} />
        <SelectField label="Product" value={props.filter.product || 'all'} onChange={(value) => props.setFilter((current) => ({ ...current, product: value }))} options={['all', ...props.productOptions]} display={(value) => value === 'all' ? 'All' : value} />
        {props.type === 'receipt' && <Field label="Invoice Number" value={props.filter.invoiceNo} onChange={(value) => props.setFilter((current) => ({ ...current, invoiceNo: value }))} />}
        {props.type === 'receipt' && <SelectField label="Source / Wholesaler" value={props.filter.source || 'all'} onChange={(value) => props.setFilter((current) => ({ ...current, source: value }))} options={['all', ...props.sourceOptions]} display={(value) => value === 'all' ? 'All' : value} />}
      </div>
      <SavedTable rows={props.rows} category={props.category} unit={props.unit} type={props.type} />
    </section>
  );
}

function SavedTable({ rows, category, unit, type }: { rows: StockInventoryLine[]; category: StockCategory; unit: string; type: 'receipt' | 'daily_stock' }) {
  const headers = type === 'receipt'
    ? ['S.No', 'Date', 'Product', 'Quantity (MT)', 'Quantity (Bags)', 'Invoice No', 'Invoice Date', 'Source', 'Remarks']
    : category === 'fertilizer'
      ? ['S.No', 'Date', 'Product', 'Opening', 'Receipts', 'Sales', 'Closing', 'Opening Bags', 'Receipts Bags', 'Sales Bags', 'Closing Bags', 'Unit']
      : ['S.No', 'Date', 'Product', 'Opening', 'Receipts', 'Sales', 'Closing', 'Unit'];

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full min-w-[760px] text-xs">
        <thead className="sticky top-0 text-white" style={{ background: COLORS.text }}>
          <tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-2 py-2 text-left">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {!rows.length && <tr><td colSpan={headers.length} className="px-2 py-5 text-center font-bold text-slate-500">No saved entries found.</td></tr>}
          {rows.map((row, index) => (
            <tr key={row.id || `${row.report_date}-${row.product_type}-${index}`} className="bg-white">
              {tableCells(row, index, category, unit, type).map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-2 py-2 font-semibold text-slate-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function tableCells(row: StockInventoryLine, index: number, category: StockCategory, unit: string, type: 'receipt' | 'daily_stock') {
  const product = row.product_type || '-';
  if (type === 'receipt') {
    return [
      index + 1,
      displayDate(row.report_date),
      product,
      category === 'fertilizer' ? formatMt(Number(row.receipts || 0)) : Number(row.receipts || 0),
      category === 'fertilizer' ? formatBags(mtToBags(Number(row.receipts || 0), product)) : row.unit || unit,
      row.invoice_no || '-',
      displayDate(row.invoice_date),
      row.supplier || '-',
      row.remarks || '-',
    ];
  }
  const base = [index + 1, displayDate(row.report_date), product, Number(row.opening_balance || 0), Number(row.receipts || 0), Number(row.sales || 0), Number(row.closing_balance || 0)];
  if (category !== 'fertilizer') return [...base, row.unit || unit];
  return [
    ...base,
    formatBags(mtToBags(Number(row.opening_balance || 0), product)),
    formatBags(mtToBags(Number(row.receipts || 0), product)),
    formatBags(mtToBags(Number(row.sales || 0), product)),
    formatBags(mtToBags(Number(row.closing_balance || 0), product)),
    'MT',
  ];
}

function SummaryCards({ summary, category, unit }: { summary: { receipts: number; sales: number; stock: number; products: number }; category: StockCategory; unit: string }) {
  const display = (value: number) => category === 'fertilizer' ? `${formatMt(value)} MT` : `${Number(value || 0).toFixed(2)} ${unit}`;
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <Summary label="Receipts" value={display(summary.receipts)} />
      <Summary label="Sales" value={display(summary.sales)} />
      <Summary label="Stock" value={display(summary.stock)} />
      <Summary label="Products" value={String(summary.products)} />
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[14px] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.08)]"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div>;
}

function ProductInput({ category, label, value, onChange }: { category: StockCategory; label: string; value: string; onChange: (value: string) => void }) {
  const [manual, setManual] = useState(!productsFor(category).includes(value));
  useEffect(() => setManual(!productsFor(category).includes(value)), [category, value]);
  if (manual) {
    return <Field label={label || 'Product'} value={value} onChange={onChange} />;
  }
  return (
    <div className="grid gap-1">
      <SelectField label={label || 'Product'} value={value} onChange={(next) => next === '__manual__' ? setManual(true) : onChange(next)} options={[...productsFor(category), '__manual__']} display={(option) => option === '__manual__' ? 'Manual Entry' : option} />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block min-w-0">
      {label && <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{label}</span>}
      <input type={type} value={value} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.001' : undefined} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-bold outline-none focus:border-emerald-600" />
    </label>
  );
}

function Readonly({ label, value }: { label: string; value: string }) {
  return <div><span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{label}</span><div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-black text-slate-900">{value}</div></div>;
}

function SelectField({ label, value, onChange, options, display }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[]; display?: (value: string) => string }) {
  return (
    <label className="block min-w-0">
      {label && <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{label}</span>}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-bold outline-none focus:border-emerald-600">
        {options.map((option) => <option key={option} value={option}>{display ? display(option) : option}</option>)}
      </select>
    </label>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <input type="number" min={0} step="0.001" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value) || 0)} className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-xs font-bold outline-none focus:border-emerald-600" />;
}

function useFilteredRows(rows: StockInventoryLine[], category: StockCategory, filter: SavedFilter, type: 'receipt' | 'daily_stock') {
  return useMemo(() => {
    const range = financialYearRange(filter.financialYear);
    return rows.filter((row) => {
      const date = row.report_date || '';
      const title = row.product_type.toLowerCase();
      const isType = type === 'receipt' ? (row.entry_type || 'daily_stock') === 'receipt' : (row.entry_type || 'daily_stock') !== 'receipt';
      return (
        row.category === category &&
        isType &&
        date >= range.start &&
        date <= range.end &&
        (!filter.fromDate || date >= filter.fromDate) &&
        (!filter.toDate || date <= filter.toDate) &&
        (!filter.product || filter.product === 'all' || title === filter.product.toLowerCase()) &&
        (!filter.invoiceNo || (row.invoice_no || '').toLowerCase().includes(filter.invoiceNo.toLowerCase())) &&
        (!filter.source || filter.source === 'all' || (row.supplier || '').toLowerCase() === filter.source.toLowerCase())
      );
    });
  }, [category, filter, rows, type]);
}

function useOptions(rows: StockInventoryLine[], category: StockCategory, type: 'receipt' | 'daily_stock', field: 'product' | 'source') {
  return useMemo(() => {
    const values = rows
      .filter((row) => row.category === category && (type === 'receipt' ? (row.entry_type || 'daily_stock') === 'receipt' : (row.entry_type || 'daily_stock') !== 'receipt'))
      .map((row) => field === 'product' ? row.product_type : row.supplier || '')
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [category, field, rows, type]);
}

function buildSummary(dailyRows: StockInventoryLine[], receiptRows: StockInventoryLine[]) {
  const receipts = receiptRows.reduce((sum, row) => sum + Number(row.receipts || 0), 0) + dailyRows.reduce((sum, row) => sum + Number(row.receipts || 0), 0);
  const sales = dailyRows.reduce((sum, row) => sum + Number(row.sales || 0), 0);
  const stock = receipts - sales;
  const products = new Set([...receiptRows, ...dailyRows].map((row) => row.product_type).filter(Boolean)).size;
  return { receipts, sales, stock, products };
}

function exportSavedRows(type: 'receipts' | 'daily', rows: StockInventoryLine[], category: StockCategory, unit: string, exportUnit: ExportUnit, firmName: string, ifmsId: string) {
  if (!rows.length) {
    alert('No records to export.');
    return;
  }
  const excelRows = rows.map((row, index) => type === 'receipts'
    ? receiptExcelRow(row, index, category, exportUnit)
    : dailyExcelRow(row, index, category, unit, exportUnit));
  const metadata = [['Firm Name', firmName], ['Category', CATEGORY_LABELS[category]], ['Generated Date', new Date().toLocaleString('en-IN')]];
  if (category === 'fertilizer') metadata.splice(2, 0, ['IFMS ID', ifmsId || '']);
  const headers = Object.keys(excelRows[0]);
  const worksheet = XLSX.utils.aoa_to_sheet([...metadata, [], headers, ...excelRows.map((row) => headers.map((header) => row[header]))]);
  worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, header.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, type === 'receipts' ? 'Saved Receipts' : 'Daily Stock');
  XLSX.writeFile(workbook, `${CATEGORY_LABELS[category].toLowerCase()}-${type}-${Date.now()}.xlsx`);
}

function receiptExcelRow(row: StockInventoryLine, index: number, category: StockCategory, exportUnit: ExportUnit): Record<string, string | number> {
  const mt = Number(row.receipts || 0);
  const bags = mtToBags(mt, row.product_type);
  const base: Record<string, string | number> = { 'S.No': index + 1, Date: displayDate(row.report_date), Product: row.product_type };
  if (category === 'fertilizer') {
    if (exportUnit !== 'Bags') base['Quantity MT'] = formatMt(mt);
    if (exportUnit !== 'MT') base['Quantity Bags'] = formatBags(bags);
  } else {
    base.Quantity = Number(row.receipts || 0);
    base.Unit = row.unit || '';
  }
  return { ...base, 'Invoice No': row.invoice_no || '', 'Invoice Date': displayDate(row.invoice_date), Source: row.supplier || '', Remarks: row.remarks || '', 'Financial Year': row.financial_year || financialYearForDate(row.report_date || currentReportDate()) };
}

function dailyExcelRow(row: StockInventoryLine, index: number, category: StockCategory, unit: string, exportUnit: ExportUnit): Record<string, string | number> {
  const base: Record<string, string | number> = { 'S.No': index + 1, Date: displayDate(row.report_date), Product: row.product_type };
  if (category === 'fertilizer') {
    if (exportUnit !== 'Bags') {
      base['Opening MT'] = formatMt(Number(row.opening_balance || 0));
      base['Receipts MT'] = formatMt(Number(row.receipts || 0));
      base['Sales MT'] = formatMt(Number(row.sales || 0));
      base['Closing MT'] = formatMt(Number(row.closing_balance || 0));
    }
    if (exportUnit !== 'MT') {
      base['Opening Bags'] = formatBags(mtToBags(Number(row.opening_balance || 0), row.product_type));
      base['Receipts Bags'] = formatBags(mtToBags(Number(row.receipts || 0), row.product_type));
      base['Sales Bags'] = formatBags(mtToBags(Number(row.sales || 0), row.product_type));
      base['Closing Bags'] = formatBags(mtToBags(Number(row.closing_balance || 0), row.product_type));
    }
  } else {
    base.Opening = Number(row.opening_balance || 0);
    base.Receipts = Number(row.receipts || 0);
    base.Sales = Number(row.sales || 0);
    base.Closing = Number(row.closing_balance || 0);
    base.Unit = row.unit || unit;
  }
  base['Financial Year'] = row.financial_year || financialYearForDate(row.report_date || currentReportDate());
  return base;
}

function getCategoryLicense(profile: DealerProfile | null, category: StockCategory): string {
  if (!profile) return '';
  if (category === 'fertilizer') return profile.fertilizer_license_number || profile.license_number || '';
  if (category === 'seed') return profile.seed_license_number || profile.license_number || '';
  return profile.pesticide_license_number || profile.license_number || '';
}

function emptyFilter(): SavedFilter {
  return { financialYear: currentFinancialYear(), fromDate: '', toDate: '', product: 'all', invoiceNo: '', source: 'all' };
}

function displayDate(value?: string) {
  if (!value) return '-';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}
