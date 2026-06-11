import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, ChevronLeft, ChevronRight, Copy, FileSpreadsheet, Plus, Save, Search, Trash2, Truck } from 'lucide-react';
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
  formatReportDateLabel,
  productTypesForCategory,
  shiftReportDate,
} from '../lib/stockInventory';
import { supabase } from '../lib/supabase';
import { bagsToMt, formatBags, formatFertilizerDual, formatMt, mtToBags } from '../utils/fertilizerUnits';
import { currentFinancialYear } from '../utils/financialYear';

type ViewMode = 'dashboard' | 'stock';
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
  productName: string;
  crop: string;
  variety: string;
  lotNo: string;
  technicalName: string;
  batchNo: string;
  quantityMt: number;
  quantity: number;
  invoiceNo: string;
  invoiceDate: string;
  source: string;
  remarks: string;
};

type DailyForm = {
  date: string;
  productName: string;
  crop: string;
  variety: string;
  lotNo: string;
  technicalName: string;
  batchNo: string;
  openingMt: number;
  receiptsMt: number;
  salesMt: number;
  opening: number;
  receipts: number;
  sales: number;
  remarks: string;
};

type SavedFilters = {
  financialYear: string;
  fromDate: string;
  toDate: string;
  product: string;
  invoiceNo: string;
  source: string;
};

const CATEGORY_LABELS: Record<StockCategory, string> = {
  fertilizer: 'Fertilizer',
  seed: 'Seed',
  pesticide: 'Pesticide',
};

const WHOLESALERS = [
  'Markfed',
  'Coromandel',
  'M/s. Laxmi Narasimha Traders, Karimnagar',
  'M/s. FR Lahoti & Sons',
  'M/s. Vaibhav Traders, Karimnagar',
  'Jahnavi Agro Agencies',
  'M/s. Sai Rama Trading Company, Karimnagar',
  'M/s. Meher Sai Seeds & Fertilizers',
  'Sri Rajarajeshwari Traders, Mancherial',
  'Kanaka Durga Trading Company',
  'Sri Laxmi Fertilizers',
  'Rama Trading Company',
];

function emptyReceipt(category: StockCategory): ReceiptForm {
  const product = productTypesForCategory(category)[0] || '';
  return {
    date: currentReportDate(),
    productName: product,
    crop: category === 'seed' ? product : '',
    variety: '',
    lotNo: '',
    technicalName: '',
    batchNo: '',
    quantityMt: 0,
    quantity: 0,
    invoiceNo: '',
    invoiceDate: currentReportDate(),
    source: category === 'fertilizer' ? 'Markfed' : '',
    remarks: '',
  };
}

function emptyDaily(category: StockCategory): DailyForm {
  const product = productTypesForCategory(category)[0] || '';
  return {
    date: currentReportDate(),
    productName: product,
    crop: category === 'seed' ? product : '',
    variety: '',
    lotNo: '',
    technicalName: '',
    batchNo: '',
    openingMt: 0,
    receiptsMt: 0,
    salesMt: 0,
    opening: 0,
    receipts: 0,
    sales: 0,
    remarks: '',
  };
}

export function DealerStockPortal() {
  const { dealerId, dealerName, user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [category, setCategory] = useState<StockCategory>('fertilizer');
  const [unit, setUnit] = useState(CATEGORY_UNITS.fertilizer[0]);
  const [financialYear, setFinancialYear] = useState(currentFinancialYear());
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [records, setRecords] = useState<StockInventoryLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showReceipts, setShowReceipts] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const [receiptForm, setReceiptForm] = useState<ReceiptForm>(() => emptyReceipt('fertilizer'));
  const [dailyForm, setDailyForm] = useState<DailyForm>(() => emptyDaily('fertilizer'));

  const firmName = dealerProfile?.dealer_name || dealerName || 'Dealer Firm';
  const ifmsId = dealerProfile?.ifms_id || '';
  const licenseNumber = getCategoryLicense(dealerProfile, category);
  const dailyClosing = category === 'fertilizer'
    ? dailyForm.openingMt + dailyForm.receiptsMt - dailyForm.salesMt
    : dailyForm.opening + dailyForm.receipts - dailyForm.sales;

  const loadDealerProfile = useCallback(async () => {
    if (!dealerId) return;
    const { data, error } = await supabase.from('dealers').select('*').eq('id', dealerId).maybeSingle();
    if (!error) setDealerProfile((data || null) as DealerProfile | null);
  }, [dealerId]);

  const loadRecords = useCallback(async () => {
    if (!dealerId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('stock_inventory_lines')
      .select('*')
      .eq('dealer_id', dealerId)
      .eq('category', category)
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setRecords([]);
    } else {
      setRecords((data || []) as StockInventoryLine[]);
    }
    setLoading(false);
  }, [category, dealerId]);

  useEffect(() => {
    void loadDealerProfile();
  }, [loadDealerProfile]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const onPop = () => {
      if (viewMode === 'stock') setViewMode('dashboard');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [viewMode]);

  const switchCategory = (next: StockCategory) => {
    setCategory(next);
    setUnit(CATEGORY_UNITS[next][0]);
    setReceiptForm(emptyReceipt(next));
    setDailyForm(emptyDaily(next));
    setMessage('');
  };

  const openStockModule = (next: StockCategory) => {
    switchCategory(next);
    setViewMode('stock');
    window.history.pushState({ dealerStockModule: true }, '', window.location.href);
  };

  const saveReceipt = async () => {
    if (!dealerId || saving) return;
    const quantity = category === 'fertilizer' ? receiptForm.quantityMt : receiptForm.quantity;
    if (quantity <= 0 || !receiptForm.invoiceNo.trim()) {
      alert('Enter quantity and invoice number.');
      return;
    }
    if (isDuplicateReceipt(records, receiptForm, category)) {
      alert('Duplicate receipt found for same date, product and invoice number.');
      return;
    }

    setSaving(true);
    try {
      const productName = category === 'seed' ? receiptForm.crop : receiptForm.productName;
      const payload = {
        dealer_id: dealerId,
        category,
        serial_no: 1,
        product_type: productName.trim(),
        financial_year: financialYearForDate(receiptForm.date),
        entry_type: 'receipt',
        firm_name: firmName,
        ifms_id: category === 'fertilizer' ? ifmsId : '',
        crop: category === 'seed' ? receiptForm.crop.trim() : '',
        variety: category === 'seed' ? receiptForm.variety.trim() : '',
        lot_number: category === 'seed' ? receiptForm.lotNo.trim() : '',
        batch_number: category === 'pesticide' ? receiptForm.batchNo.trim() : '',
        technical_name: category === 'pesticide' ? receiptForm.technicalName.trim() : '',
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
      setMessage(`${CATEGORY_LABELS[category]} receipt saved.`);
      setReceiptForm(emptyReceipt(category));
      setShowSaved(true);
      await loadRecords();
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
    if (isDuplicateDaily(records, dailyForm, category)) {
      alert('Duplicate daily stock entry found for same date and product.');
      return;
    }

    setSaving(true);
    try {
      const productName = category === 'seed' ? dailyForm.crop : dailyForm.productName;
      const payload = {
        dealer_id: dealerId,
        category,
        serial_no: 1,
        product_type: productName.trim(),
        financial_year: financialYearForDate(dailyForm.date),
        entry_type: 'daily_stock',
        firm_name: firmName,
        ifms_id: category === 'fertilizer' ? ifmsId : '',
        crop: category === 'seed' ? dailyForm.crop.trim() : '',
        variety: category === 'seed' ? dailyForm.variety.trim() : '',
        lot_number: category === 'seed' ? dailyForm.lotNo.trim() : '',
        batch_number: category === 'pesticide' ? dailyForm.batchNo.trim() : '',
        technical_name: category === 'pesticide' ? dailyForm.technicalName.trim() : '',
        opening_balance: computed.opening_balance,
        receipts: computed.receipts,
        total: computed.total,
        sales: computed.sales,
        closing_balance: computed.closing_balance,
        unit: category === 'fertilizer' ? 'MT' : unit,
        remarks: dailyForm.remarks.trim(),
        report_date: dailyForm.date,
        report_month: dailyForm.date.slice(0, 7),
        submitted_by: user?.email || '',
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('stock_inventory_lines').insert(payload);
      if (error) throw error;
      setMessage(`${CATEGORY_LABELS[category]} daily stock saved.`);
      setDailyForm(emptyDaily(category));
      setShowSaved(true);
      await loadRecords();
    } catch (error) {
      alert(`Could not save daily stock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!dealerId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
        Dealer account not linked. Please sign in with your registered phone number.
      </div>
    );
  }

  if (viewMode === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#eef8f2] p-3 sm:p-4">
        <HeaderLine category={category} firmName={firmName} ifmsId={ifmsId} licenseNumber={licenseNumber} unit={unit} setUnit={setUnit} />
        <CategoryCards category={category} onChange={openStockModule} />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 bg-[#eef8f2] p-3 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setViewMode('dashboard')}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Dealer Dashboard
        </button>
      </div>

      <HeaderLine category={category} firmName={firmName} ifmsId={ifmsId} licenseNumber={licenseNumber} unit={unit} setUnit={setUnit} />
      <CategoryCards category={category} onChange={switchCategory} />

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
          {message}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.85fr)_minmax(560px,1.15fr)]">
        <section className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowReceipts((value) => !value)}
            className="flex w-full items-center justify-between bg-red-50 px-4 py-3 text-left text-red-800"
          >
            <span className="inline-flex items-center gap-2 text-sm font-black">
              <Truck className="h-5 w-5" /> {CATEGORY_LABELS[category]} Receipts
            </span>
            <ChevronDown className={`h-5 w-5 transition ${showReceipts ? 'rotate-180' : ''}`} />
          </button>
          {showReceipts && (
            <div className="p-3">
              <ReceiptEntryForm
                category={category}
                unit={unit}
                form={receiptForm}
                setForm={setReceiptForm}
                saving={saving}
                onSave={saveReceipt}
              />
            </div>
          )}
        </section>

        <div className="space-y-3">
          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-700" />
                <button type="button" onClick={() => setDailyForm((current) => ({ ...current, date: shiftReportDate(current.date, -1) }))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <input
                  type="date"
                  value={dailyForm.date}
                  onChange={(event) => setDailyForm((current) => ({ ...current, date: event.target.value }))}
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-base font-black text-slate-950"
                />
                <button type="button" onClick={() => setDailyForm((current) => ({ ...current, date: shiftReportDate(current.date, 1) }))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm font-black text-slate-700">{formatReportDateLabel(dailyForm.date, 'en-IN')}</p>
            </div>
          </section>

          <DailyStockTable
            category={category}
            unit={unit}
            form={dailyForm}
            setForm={setDailyForm}
            closing={dailyClosing}
            saving={saving}
            onSave={saveDaily}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowSaved((value) => !value)}
          className="flex w-full items-center justify-between bg-white px-4 py-3 text-left text-slate-950"
        >
          <span className="inline-flex items-center gap-2 text-sm font-black">
            <Search className="h-4 w-4 text-emerald-700" /> View Saved Entries
          </span>
          <ChevronDown className={`h-4 w-4 transition ${showSaved ? 'rotate-180' : ''}`} />
        </button>
        {showSaved && (
          <SavedEntriesPanel
            loading={loading}
            category={category}
            unit={unit}
            records={records}
            financialYear={financialYear}
            setFinancialYear={setFinancialYear}
            firmName={firmName}
            ifmsId={ifmsId}
          />
        )}
      </section>
    </div>
  );
}

function HeaderLine({
  category,
  firmName,
  ifmsId,
  licenseNumber,
  unit,
  setUnit,
}: {
  category: StockCategory;
  firmName: string;
  ifmsId: string;
  licenseNumber: string;
  unit: string;
  setUnit: (unit: string) => void;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-black uppercase text-slate-950 sm:text-xl">{firmName}</h1>
          {category === 'fertilizer' && ifmsId && (
            <span className="rounded-md bg-slate-950 px-3 py-1 text-xs font-black text-white sm:text-sm">IFMS ID: {ifmsId}</span>
          )}
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {licenseNumber ? `${CATEGORY_LABELS[category]} License: ${licenseNumber}` : 'License No. Not Updated'}
        </p>
      </div>
      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm">
        Unit
        <select value={unit} onChange={(event) => setUnit(event.target.value)} className="bg-transparent font-black outline-none">
          {CATEGORY_UNITS[category].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
    </header>
  );
}

function CategoryCards({ category, onChange }: { category: StockCategory; onChange: (category: StockCategory) => void }) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {(['fertilizer', 'seed', 'pesticide'] as StockCategory[]).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`min-h-16 rounded-xl border p-4 text-left text-lg shadow-sm transition ${
            category === item
              ? 'border-emerald-700 bg-emerald-700 text-white shadow-lg shadow-emerald-900/20'
              : 'border-slate-200 bg-white text-slate-950 hover:border-emerald-300'
          }`}
        >
          <p className="font-black">{CATEGORY_LABELS[item]}</p>
        </button>
      ))}
    </section>
  );
}

function ReceiptEntryForm({ category, unit, form, setForm, saving, onSave }: { category: StockCategory; unit: string; form: ReceiptForm; setForm: React.Dispatch<React.SetStateAction<ReceiptForm>>; saving: boolean; onSave: () => void }) {
  const update = (patch: Partial<ReceiptForm>) => setForm((current) => ({ ...current, ...patch }));
  const displayFertilizerQty = unit === 'Bags' ? Math.round(mtToBags(form.quantityMt, form.productName)) : Number(formatMt(form.quantityMt));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Date" type="date" value={form.date} onChange={(value) => update({ date: value })} />
      {category === 'seed' ? (
        <>
          <SelectField label="Crop" value={form.crop} onChange={(value) => update({ crop: value, productName: value })} options={productTypesForCategory('seed')} />
          <Field label="Variety / Hybrid" value={form.variety} onChange={(value) => update({ variety: value })} />
          <Field label="Lot No." value={form.lotNo} onChange={(value) => update({ lotNo: value })} />
        </>
      ) : category === 'pesticide' ? (
        <>
          <SelectField label="Product Name" value={form.productName} onChange={(value) => update({ productName: value })} options={productTypesForCategory('pesticide')} />
          <Field label="Technical Name" value={form.technicalName} onChange={(value) => update({ technicalName: value })} />
          <Field label="Batch No." value={form.batchNo} onChange={(value) => update({ batchNo: value })} />
        </>
      ) : (
        <SelectField label="Product Name" value={form.productName} onChange={(value) => update({ productName: value })} options={productTypesForCategory('fertilizer')} />
      )}

      {category === 'fertilizer' ? (
        <>
          <Field
            label={`Quantity Received (${unit})`}
            type="number"
            value={String(displayFertilizerQty)}
            onChange={(value) => update({ quantityMt: unit === 'Bags' ? bagsToMt(Number(value) || 0, form.productName) : Number(value) || 0 })}
          />
          <Field label="Auto Conversion" value={formatFertilizerDual(form.quantityMt, form.productName)} readOnly />
        </>
      ) : (
        <Field label={`Quantity Received (${unit})`} type="number" value={String(form.quantity)} onChange={(value) => update({ quantity: Number(value) || 0 })} />
      )}

      <Field label="Invoice No." value={form.invoiceNo} onChange={(value) => update({ invoiceNo: value })} />
      <Field label="Invoice Date" type="date" value={form.invoiceDate} onChange={(value) => update({ invoiceDate: value })} />
      {category === 'fertilizer' ? (
        <SelectField label="Wholesaler / Source" value={form.source} onChange={(value) => update({ source: value })} options={WHOLESALERS} />
      ) : (
        <Field label="Source Company" value={form.source} onChange={(value) => update({ source: value })} />
      )}
      <Field label="Remarks" value={form.remarks} onChange={(value) => update({ remarks: value })} />
      <div className="flex items-end">
        <button type="button" onClick={onSave} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Receipt'}
        </button>
      </div>
    </div>
  );
}

function DailyStockTable({
  category,
  unit,
  form,
  setForm,
  closing,
  saving,
  onSave,
}: {
  category: StockCategory;
  unit: string;
  form: DailyForm;
  setForm: React.Dispatch<React.SetStateAction<DailyForm>>;
  closing: number;
  saving: boolean;
  onSave: () => void;
}) {
  const update = (patch: Partial<DailyForm>) => setForm((current) => ({ ...current, ...patch }));
  const total = category === 'fertilizer' ? form.openingMt + form.receiptsMt : form.opening + form.receipts;

  const fertilizerValue = (valueMt: number) => unit === 'Bags' ? Math.round(mtToBags(valueMt, form.productName)) : Number(formatMt(valueMt));
  const fromFertilizerUnit = (value: number) => unit === 'Bags' ? bagsToMt(value, form.productName) : value;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-slate-950 text-white">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Opening ({unit})</th>
              <th className="px-4 py-3 text-left">Receipts ({unit})</th>
              <th className="px-4 py-3 text-left">Total ({unit})</th>
              <th className="px-4 py-3 text-left">Sales ({unit})</th>
              <th className="px-4 py-3 text-left">Closing ({unit})</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="px-4 py-3 text-base font-black">1</td>
              <td className="px-4 py-3">
                {category === 'seed' ? (
                  <SelectField label="" value={form.crop} onChange={(value) => update({ crop: value, productName: value })} options={productTypesForCategory('seed')} />
                ) : (
                  <SelectField label="" value={form.productName} onChange={(value) => update({ productName: value })} options={productTypesForCategory(category)} />
                )}
              </td>
              <td className="px-4 py-3">
                <TableNumber value={category === 'fertilizer' ? fertilizerValue(form.openingMt) : form.opening} onChange={(value) => category === 'fertilizer' ? update({ openingMt: fromFertilizerUnit(value) }) : update({ opening: value })} />
              </td>
              <td className="px-4 py-3">
                <TableNumber value={category === 'fertilizer' ? fertilizerValue(form.receiptsMt) : form.receipts} onChange={(value) => category === 'fertilizer' ? update({ receiptsMt: fromFertilizerUnit(value) }) : update({ receipts: value })} />
              </td>
              <td className="px-4 py-3 font-black text-emerald-700">{formatDisplayQuantity(total, category, unit, form.productName)}</td>
              <td className="px-4 py-3">
                <TableNumber value={category === 'fertilizer' ? fertilizerValue(form.salesMt) : form.sales} onChange={(value) => category === 'fertilizer' ? update({ salesMt: fromFertilizerUnit(value) }) : update({ sales: value })} />
              </td>
              <td className="px-4 py-3 font-black text-slate-950">{formatDisplayQuantity(closing, category, unit, form.productName)}</td>
              <td className="px-4 py-3 text-right"><Trash2 className="inline h-5 w-5 text-red-500" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      {category !== 'fertilizer' && (
        <div className="grid gap-3 border-t border-slate-100 p-3 sm:grid-cols-3">
          {category === 'seed' ? (
            <>
              <Field label="Variety / Hybrid" value={form.variety} onChange={(value) => update({ variety: value })} />
              <Field label="Lot No." value={form.lotNo} onChange={(value) => update({ lotNo: value })} />
            </>
          ) : (
            <>
              <Field label="Technical Name" value={form.technicalName} onChange={(value) => update({ technicalName: value })} />
              <Field label="Batch No." value={form.batchNo} onChange={(value) => update({ batchNo: value })} />
            </>
          )}
          <Field label="Remarks" value={form.remarks} onChange={(value) => update({ remarks: value })} />
        </div>
      )}
      {category === 'fertilizer' && (
        <div className="border-t border-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
          Auto conversion: {formatFertilizerDual(closing, form.productName)}
        </div>
      )}
      <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
        <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950">
          <Plus className="h-4 w-4" /> Add row
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-amber-400 bg-white px-4 py-2 text-sm font-black text-amber-900">
          <Copy className="h-4 w-4" /> Opening from yesterday
        </button>
        <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-black text-white disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save daily entry'}
        </button>
      </div>
    </section>
  );
}

function SavedEntriesPanel({
  loading,
  category,
  unit,
  records,
  financialYear,
  setFinancialYear,
  firmName,
  ifmsId,
}: {
  loading: boolean;
  category: StockCategory;
  unit: string;
  records: StockInventoryLine[];
  financialYear: string;
  setFinancialYear: (financialYear: string) => void;
  firmName: string;
  ifmsId: string;
}) {
  const [receiptFilters, setReceiptFilters] = useState<SavedFilters>({
    financialYear,
    fromDate: '',
    toDate: '',
    product: '',
    invoiceNo: '',
    source: '',
  });
  const [dailyFilters, setDailyFilters] = useState<SavedFilters>({
    financialYear,
    fromDate: '',
    toDate: '',
    product: '',
    invoiceNo: '',
    source: '',
  });

  useEffect(() => {
    setReceiptFilters((current) => ({ ...current, financialYear }));
    setDailyFilters((current) => ({ ...current, financialYear }));
  }, [financialYear]);

  const receipts = useMemo(() => {
    const range = financialYearRange(receiptFilters.financialYear);
    const productQuery = receiptFilters.product === 'all' ? '' : receiptFilters.product.trim().toLowerCase();
    const invoiceQuery = receiptFilters.invoiceNo.trim().toLowerCase();
    const sourceQuery = receiptFilters.source === 'all' ? '' : receiptFilters.source.trim().toLowerCase();
    return records.filter((record) => {
      const date = record.report_date || '';
      const label = savedRecordTitle(record, category).toLowerCase();
      const isReceipt = (record.entry_type || 'daily_stock') === 'receipt';
      return (
        isReceipt &&
        date >= range.start &&
        date <= range.end &&
        (!receiptFilters.fromDate || date >= receiptFilters.fromDate) &&
        (!receiptFilters.toDate || date <= receiptFilters.toDate) &&
        (!productQuery || label.includes(productQuery)) &&
        (!invoiceQuery || (record.invoice_no || '').toLowerCase().includes(invoiceQuery)) &&
        (!sourceQuery || (record.supplier || '').toLowerCase().includes(sourceQuery))
      );
    });
  }, [category, receiptFilters, records]);

  const daily = useMemo(() => {
    const range = financialYearRange(dailyFilters.financialYear);
    const productQuery = dailyFilters.product === 'all' ? '' : dailyFilters.product.trim().toLowerCase();
    return records.filter((record) => {
      const date = record.report_date || '';
      const label = savedRecordTitle(record, category).toLowerCase();
      const isDaily = (record.entry_type || 'daily_stock') !== 'receipt';
      return (
        isDaily &&
        date >= range.start &&
        date <= range.end &&
        (!dailyFilters.fromDate || date >= dailyFilters.fromDate) &&
        (!dailyFilters.toDate || date <= dailyFilters.toDate) &&
        (!productQuery || label.includes(productQuery))
      );
    });
  }, [category, dailyFilters, records]);

  const exportReceipts = () => {
    exportRowsToExcel({
      filename: `${CATEGORY_LABELS[category].toLowerCase()}-receipts-${receiptFilters.financialYear}.xlsx`,
      sheetName: 'Receipts',
      category,
      firmName,
      ifmsId,
      financialYear: receiptFilters.financialYear,
      rows: receipts.map((record) => receiptExportRow(record, category, unit)),
    });
  };

  const exportDaily = () => {
    exportRowsToExcel({
      filename: `${CATEGORY_LABELS[category].toLowerCase()}-daily-stock-${dailyFilters.financialYear}.xlsx`,
      sheetName: 'Daily Stock',
      category,
      firmName,
      ifmsId,
      financialYear: dailyFilters.financialYear,
      rows: daily.map((record) => dailyExportRow(record, category, unit)),
    });
  };

  const receiptProductOptions = useMemo(
    () => ['all', ...uniqueOptions(records.filter((record) => (record.entry_type || 'daily_stock') === 'receipt').map((record) => savedRecordTitle(record, category)))],
    [category, records]
  );
  const receiptSourceOptions = useMemo(
    () => ['all', ...uniqueOptions(records.filter((record) => (record.entry_type || 'daily_stock') === 'receipt').map((record) => record.supplier || '').filter(Boolean))],
    [records]
  );
  const dailyProductOptions = useMemo(
    () => ['all', ...uniqueOptions(records.filter((record) => (record.entry_type || 'daily_stock') !== 'receipt').map((record) => savedRecordTitle(record, category)))],
    [category, records]
  );

  return (
    <div className="space-y-4 border-t border-slate-100 bg-[#f6fbf8] p-3">
      {loading && <div className="rounded-lg bg-white p-4 text-center text-sm font-bold text-slate-500">Loading saved entries...</div>}

      <section className="rounded-xl border border-red-200 bg-red-50/70 p-2">
        <SavedSectionHeader title="Saved Receipts" count={receipts.length} onExport={exportReceipts} />
        <div className="mt-2 grid gap-2 rounded-lg bg-white/75 p-2 sm:grid-cols-2 lg:grid-cols-6">
          <SelectField label="Financial Year" value={receiptFilters.financialYear} onChange={(value) => { setReceiptFilters((current) => ({ ...current, financialYear: value })); setFinancialYear(value); }} options={FINANCIAL_YEARS} />
          <Field label="From Date" type="date" value={receiptFilters.fromDate} onChange={(value) => setReceiptFilters((current) => ({ ...current, fromDate: value }))} />
          <Field label="To Date" type="date" value={receiptFilters.toDate} onChange={(value) => setReceiptFilters((current) => ({ ...current, toDate: value }))} />
          <SelectField label={category === 'seed' ? 'Crop / Variety / Lot' : category === 'pesticide' ? 'Product / Technical / Batch' : 'Fertilizer Name'} value={receiptFilters.product || 'all'} onChange={(value) => setReceiptFilters((current) => ({ ...current, product: value }))} options={receiptProductOptions} display={(value) => value === 'all' ? 'All' : value} />
          <Field label="Invoice No." value={receiptFilters.invoiceNo} onChange={(value) => setReceiptFilters((current) => ({ ...current, invoiceNo: value }))} />
          <SelectField label={category === 'fertilizer' ? 'Wholesaler' : 'Source Company'} value={receiptFilters.source || 'all'} onChange={(value) => setReceiptFilters((current) => ({ ...current, source: value }))} options={receiptSourceOptions} display={(value) => value === 'all' ? 'All' : value} />
        </div>
        <SavedGroup rows={receipts} category={category} unit={unit} empty="No saved receipts found." tone="receipt" />
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2">
        <SavedSectionHeader title="Saved Daily Stock / Sales" count={daily.length} onExport={exportDaily} />
        <div className="mt-2 grid gap-2 rounded-lg bg-white/75 p-2 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField label="Financial Year" value={dailyFilters.financialYear} onChange={(value) => { setDailyFilters((current) => ({ ...current, financialYear: value })); setFinancialYear(value); }} options={FINANCIAL_YEARS} />
          <Field label="From Date" type="date" value={dailyFilters.fromDate} onChange={(value) => setDailyFilters((current) => ({ ...current, fromDate: value }))} />
          <Field label="To Date" type="date" value={dailyFilters.toDate} onChange={(value) => setDailyFilters((current) => ({ ...current, toDate: value }))} />
          <SelectField label={category === 'seed' ? 'Crop / Variety / Lot' : category === 'pesticide' ? 'Product / Technical / Batch' : 'Fertilizer Name'} value={dailyFilters.product || 'all'} onChange={(value) => setDailyFilters((current) => ({ ...current, product: value }))} options={dailyProductOptions} display={(value) => value === 'all' ? 'All' : value} />
        </div>
        <SavedGroup rows={daily} category={category} unit={unit} empty="No daily stock entries found." tone="daily" />
      </section>
    </div>
  );
}

function SavedSectionHeader({ title, count, onExport }: { title: string; count: number; onExport: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
      <div>
        <h3 className="text-sm font-black text-slate-950 sm:text-base">{title}</h3>
        <p className="text-xs font-bold text-slate-500">{count} entries shown</p>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm"
      >
        <FileSpreadsheet className="h-4 w-4" /> Export Excel
      </button>
    </div>
  );
}

function SavedGroup({ rows, category, unit, empty, tone }: { rows: StockInventoryLine[]; category: StockCategory; unit: string; empty: string; tone: 'receipt' | 'daily' }) {
  const rowTone = tone === 'receipt'
    ? 'border-red-100 bg-white'
    : 'border-emerald-100 bg-white';
  const badgeTone = tone === 'receipt'
    ? 'bg-red-100 text-red-800'
    : 'bg-emerald-100 text-emerald-800';

  return (
    <div className="space-y-2 p-1 pt-2">
        {!rows.length && <EmptyText text={empty} />}
        {rows.map((record) => (
          <div key={record.id || `${record.report_date}-${record.product_type}`} className={`rounded-lg border px-3 py-2 ${rowTone}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black leading-tight text-slate-950">{savedRecordTitle(record, category)}</p>
                <p className="mt-0.5 text-[11px] font-bold text-slate-500">{record.report_date || '-'}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${badgeTone}`}>
                {(record.entry_type || 'daily_stock') === 'receipt' ? 'Receipt' : 'Daily Stock'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              {savedRecordFields(record, category, unit).map(([label, value]) => (
                <span key={label} className="rounded-md bg-slate-50 px-2 py-1 font-bold text-slate-700">
                  <span className="font-black text-slate-500">{label}: </span>{value}
                </span>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function savedRecordFields(record: StockInventoryLine, category: StockCategory, unit: string): [string, string][] {
  const isReceipt = (record.entry_type || 'daily_stock') === 'receipt';
  const quantity = (value: number) => formatDisplayQuantity(value, category, unit, record.product_type);
  const common: [string, string][] = [['Date', record.report_date || '-']];
  if (isReceipt) {
    common.push(['Received', quantity(Number(record.receipts || 0))], ['Invoice No.', record.invoice_no || '-'], ['Invoice Date', record.invoice_date || '-']);
    if (record.supplier) common.push([category === 'fertilizer' ? 'Wholesaler / Source' : 'Source Company', record.supplier]);
  } else {
    common.push(
      ['Opening', quantity(Number(record.opening_balance || 0))],
      ['Receipts', quantity(Number(record.receipts || 0))],
      ['Sales', quantity(Number(record.sales || 0))],
      ['Closing', quantity(Number(record.closing_balance || 0))]
    );
  }
  if (category === 'seed') {
    common.push(['Variety / Hybrid', record.variety || '-'], ['Lot No.', record.lot_number || '-']);
  }
  if (category === 'pesticide') {
    common.push(['Technical Name', record.technical_name || '-'], ['Batch No.', record.batch_number || '-']);
  }
  if (record.remarks) common.push(['Remarks', record.remarks]);
  return common;
}

function receiptExportRow(record: StockInventoryLine, category: StockCategory, unit: string): Record<string, string | number> {
  const base: Record<string, string | number> = {
    Date: record.report_date || '',
    Category: CATEGORY_LABELS[category],
  };

  if (category === 'seed') {
    base.Crop = record.crop || record.product_type;
    base['Variety / Hybrid'] = record.variety || '';
    base['Lot No.'] = record.lot_number || '';
  } else if (category === 'pesticide') {
    base['Product Name'] = record.product_type;
    base['Technical Name'] = record.technical_name || '';
    base['Batch No.'] = record.batch_number || '';
  } else {
    base['Product Name'] = record.product_type;
  }

  if (category === 'fertilizer') {
    base['Quantity Received'] = formatDisplayQuantity(Number(record.receipts || 0), category, unit, record.product_type);
    base['Quantity MT'] = formatMt(Number(record.receipts || 0));
    base['Quantity Bags'] = formatBags(mtToBags(Number(record.receipts || 0), record.product_type));
  } else {
    base['Quantity Received'] = Number(record.receipts || 0);
    base.Unit = record.unit || unit;
  }

  base['Invoice No.'] = record.invoice_no || '';
  base['Invoice Date'] = record.invoice_date || '';
  base[category === 'fertilizer' ? 'Wholesaler / Source' : 'Source Company'] = record.supplier || '';
  base.Remarks = record.remarks || '';
  return base;
}

function dailyExportRow(record: StockInventoryLine, category: StockCategory, unit: string): Record<string, string | number> {
  const base: Record<string, string | number> = {
    Date: record.report_date || '',
    Category: CATEGORY_LABELS[category],
  };

  if (category === 'seed') {
    base.Crop = record.crop || record.product_type;
    base['Variety / Hybrid'] = record.variety || '';
    base['Lot No.'] = record.lot_number || '';
  } else if (category === 'pesticide') {
    base['Product Name'] = record.product_type;
    base['Technical Name'] = record.technical_name || '';
    base['Batch No.'] = record.batch_number || '';
  } else {
    base['Product Name'] = record.product_type;
  }

  if (category === 'fertilizer') {
    base['Opening Stock'] = formatDisplayQuantity(Number(record.opening_balance || 0), category, unit, record.product_type);
    base['Opening Stock MT'] = formatMt(Number(record.opening_balance || 0));
    base['Opening Stock Bags'] = formatBags(mtToBags(Number(record.opening_balance || 0), record.product_type));
    base.Receipts = formatDisplayQuantity(Number(record.receipts || 0), category, unit, record.product_type);
    base['Receipts MT'] = formatMt(Number(record.receipts || 0));
    base['Receipts Bags'] = formatBags(mtToBags(Number(record.receipts || 0), record.product_type));
    base.Sales = formatDisplayQuantity(Number(record.sales || 0), category, unit, record.product_type);
    base['Sales MT'] = formatMt(Number(record.sales || 0));
    base['Sales Bags'] = formatBags(mtToBags(Number(record.sales || 0), record.product_type));
    base['Closing Stock'] = formatDisplayQuantity(Number(record.closing_balance || 0), category, unit, record.product_type);
    base['Closing Stock MT'] = formatMt(Number(record.closing_balance || 0));
    base['Closing Stock Bags'] = formatBags(mtToBags(Number(record.closing_balance || 0), record.product_type));
  } else {
    base['Opening Stock'] = Number(record.opening_balance || 0);
    base.Receipts = Number(record.receipts || 0);
    base.Sales = Number(record.sales || 0);
    base['Closing Stock'] = Number(record.closing_balance || 0);
    base.Unit = record.unit || unit;
  }

  base.Remarks = record.remarks || '';
  return base;
}

function exportRowsToExcel({
  filename,
  sheetName,
  category,
  firmName,
  ifmsId,
  financialYear,
  rows,
}: {
  filename: string;
  sheetName: string;
  category: StockCategory;
  firmName: string;
  ifmsId: string;
  financialYear: string;
  rows: Record<string, string | number>[];
}) {
  if (!rows.length) {
    alert('No records to export.');
    return;
  }

  const metadata: unknown[][] = [
    ['Firm Name', firmName],
    ['Category', CATEGORY_LABELS[category]],
    ['Financial Year', financialYear],
    ['Generated Date', new Date().toLocaleString('en-IN')],
  ];
  if (category === 'fertilizer') metadata.splice(2, 0, ['IFMS ID', ifmsId || '']);

  const headers = Object.keys(rows[0]);
  const sheetRows = [...metadata, [], headers, ...rows.map((row) => headers.map((header) => row[header]))];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(14, header.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}

function Field({ label, value, onChange, type = 'text', readOnly = false }: { label: string; value: string; onChange?: (value: string) => void; type?: string; readOnly?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase text-slate-500">{label}</span>
      <input
        type={type}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.001' : undefined}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-emerald-500 read-only:bg-slate-50"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, display }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[]; display?: (value: string) => string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-[11px] font-black uppercase text-slate-500">{label}</span>}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-emerald-500">
        {options.map((option) => <option key={option} value={option}>{display ? display(option) : option}</option>)}
      </select>
    </label>
  );
}

function TableNumber({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step="0.001"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value) || 0)}
      className="h-11 w-28 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-emerald-500"
    />
  );
}

function EmptyText({ text }: { text: string }) {
  return <div className="rounded-lg bg-white p-4 text-center text-sm font-bold text-slate-500">{text}</div>;
}

function getCategoryLicense(profile: DealerProfile | null, category: StockCategory): string {
  if (!profile) return '';
  if (category === 'fertilizer') return profile.fertilizer_license_number || profile.license_number || '';
  if (category === 'seed') return profile.seed_license_number || profile.license_number || '';
  return profile.pesticide_license_number || profile.license_number || '';
}

function isDuplicateReceipt(records: StockInventoryLine[], form: ReceiptForm, category: StockCategory): boolean {
  const product = category === 'seed' ? form.crop : form.productName;
  return records.some((record) =>
    (record.entry_type || 'daily_stock') === 'receipt' &&
    record.report_date === form.date &&
    record.product_type.toLowerCase() === product.trim().toLowerCase() &&
    (record.invoice_no || '').trim().toLowerCase() === form.invoiceNo.trim().toLowerCase()
  );
}

function isDuplicateDaily(records: StockInventoryLine[], form: DailyForm, category: StockCategory): boolean {
  const product = category === 'seed' ? form.crop : form.productName;
  return records.some((record) =>
    (record.entry_type || 'daily_stock') !== 'receipt' &&
    record.report_date === form.date &&
    record.product_type.toLowerCase() === product.trim().toLowerCase() &&
    (record.lot_number || '') === (category === 'seed' ? form.lotNo.trim() : '') &&
    (record.batch_number || '') === (category === 'pesticide' ? form.batchNo.trim() : '')
  );
}

function savedRecordTitle(record: StockInventoryLine, category: StockCategory): string {
  if (category === 'seed') return [record.crop || record.product_type, record.variety, record.lot_number].filter(Boolean).join(' / ');
  if (category === 'pesticide') return [record.product_type, record.technical_name, record.batch_number].filter(Boolean).join(' / ');
  return record.product_type || 'Product';
}

function uniqueOptions(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function formatDisplayQuantity(value: number, category: StockCategory, unit: string, productName: string): string {
  if (category === 'fertilizer') {
    if (unit === 'Bags') return `${formatBags(mtToBags(value, productName))} Bags`;
    return `${formatMt(value)} MT`;
  }
  return `${Number(value || 0).toFixed(3).replace(/\.?0+$/, '')} ${unit}`;
}
