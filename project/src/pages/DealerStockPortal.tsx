import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown, FileSpreadsheet, Menu, Plus, Save, Table2, Trash2, Truck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
import { IconButton } from '../components/ui/DesignSystem';
import { appendSummarySheet, totalValue } from '../utils/excelTotals';

type Section = 'entry' | 'saved';

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
  id: string;
  date: string;
  product: string;
  variety: string;
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

type ProductStat = {
  product: string;
  receipts: number;
  sales: number;
  stock: number;
  receiptBags: number;
  salesBags: number;
  stockBags: number;
};

function splitDealerUnitLabel(label: string) {
  const match = label.match(/^(.*) \((.*)\)$/);
  return match ? { base: match[1], suffix: ' (' + match[2] + ')' } : { base: label, suffix: '' };
}

function translateDealerUi(label: string) {
  const labels: Record<string, string> = {
    Fertilizer: 'ఎరువులు',
    Seed: 'విత్తనాలు',
    Pesticide: 'పురుగుమందులు',
    'Receipts Entry': 'రసీదు ఎంట్రీ',
    'Daily Stock / Sales Entry': 'రోజువారీ స్టాక్ / అమ్మకాల ఎంట్రీ',
    Date: 'తేదీ',
    Product: 'ఉత్పత్తి',
    'Variety / Hybrid': 'రకం / హైబ్రిడ్',
    Opening: 'ప్రారంభ స్టాక్',
    Receipts: 'రసీదులు',
    Total: 'మొత్తం',
    Sales: 'అమ్మకాలు',
    Closing: 'ముగింపు స్టాక్',
    Delete: 'తొలగించు',
    'Save Daily Entry': 'రోజువారీ ఎంట్రీ సేవ్ చేయండి',
    'Saved Receipts': 'సేవ్ చేసిన రసీదులు',
    'Saved Daily Stock / Sales': 'సేవ్ చేసిన రోజువారీ స్టాక్ / అమ్మకాలు',
    'Export Excel': 'Excel ఎగుమతి',
    'S.No': 'క్ర.సం.',
    'Invoice No': 'ఇన్వాయిస్ నంబర్',
    'Invoice Date': 'ఇన్వాయిస్ తేదీ',
    Source: 'మూలం',
    Remarks: 'గమనికలు',
    Stock: 'స్టాక్',
    'Product-wise Receipts, Sales & Stock': 'ఉత్పత్తి వారీ రసీదులు, అమ్మకాలు & స్టాక్',
    'Manual Entry': 'మాన్యువల్ ఎంట్రీ',
  };
  return labels[label] || label;
}

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

type StockLinePayload = Omit<StockInventoryLine, 'id'> & {
  dealer_id: string;
  updated_at: string;
  submitted_by: string;
};

type SupabaseLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type ReceiptDetails = {
  invoiceNo: string;
  invoiceDate: string;
  source: string;
  remarks: string;
};

const DEALER_PROFILE_COLUMNS = 'id, dealer_name, ifms_id, phone_number, license_number, location, dealer_category';
const STOCK_COLUMNS =
  'id, dealer_id, category, serial_no, product_type, opening_balance, receipts, total, sales, closing_balance, report_date, report_month, updated_at, created_at, submitted_by, financial_year, entry_type, firm_name, ifms_id, variety, batch_number, unit, invoice_no, invoice_date, supplier, remarks';
const LEGACY_STOCK_COLUMNS =
  'id, dealer_id, category, product_name, product_type, opening_stock, receipts, sales, closing_stock, report_date, last_updated, invoice_no, invoice_date, source, supplier, remarks, entry_type, submitted_by, financial_year, total, opening_balance, closing_balance';
const MINIMAL_STOCK_COLUMNS =
  'id, dealer_id, category, serial_no, product_type, opening_balance, receipts, total, sales, closing_balance, report_date, report_month, created_at, submitted_by';

function productsFor(category: StockCategory) {
  return category === 'fertilizer' ? FERTILIZER_PRODUCTS : productTypesForCategory(category);
}

async function saveStockLine(payload: StockLinePayload) {
  const { error: rpcError } = await supabase.rpc('save_dealer_stock_line', { p_line: payload });
  if (!rpcError) return;

  const errors: string[] = [`Save helper: ${errorMessage(rpcError)}`];
  const rpcMissing =
    rpcError.message?.toLowerCase().includes('function') ||
    rpcError.message?.toLowerCase().includes('schema cache') ||
    rpcError.code === 'PGRST202';

  if (!rpcMissing) {
    throw new Error(errors.join('\n'));
  }

  const { error } = await supabase.from('stock_inventory_lines').insert(payload);
  if (!error) return;
  errors.push(`Full save: ${errorMessage(error)}`);

  const { error: compatibilityError } = await supabase.from('stock_inventory_lines').insert(toCompatibilityStockPayload(payload));
  if (!compatibilityError) return;
  errors.push(`Receipt details save: ${errorMessage(compatibilityError)}`);

  const { error: legacyError } = await supabase.from('stock_inventory_lines').insert(toLegacyStockPayload(payload));
  if (!legacyError) return;
  errors.push(`Basic save: ${errorMessage(legacyError)}`);
  throw new Error(errors.join('\n'));
}

async function deleteStockLine(id: string) {
  const { error: rpcError } = await supabase.rpc('delete_dealer_stock_line', { p_line_id: id });
  if (!rpcError) return;

  const rpcMissing =
    rpcError.message?.toLowerCase().includes('function') ||
    rpcError.message?.toLowerCase().includes('schema cache');

  if (!rpcMissing) throw rpcError;

  const { error } = await supabase.from('stock_inventory_lines').delete().eq('id', id);
  if (error) throw error;
}

function toLegacyStockPayload(payload: StockLinePayload) {
  return {
    dealer_id: payload.dealer_id,
    category: payload.category,
    serial_no: payload.serial_no,
    product_type: payload.product_type,
    opening_balance: payload.opening_balance,
    receipts: payload.receipts,
    total: payload.total,
    sales: payload.sales,
    closing_balance: payload.closing_balance,
    report_month: payload.report_month || currentReportDate().slice(0, 7),
    report_date: payload.report_date || currentReportDate(),
    submitted_by: legacySubmittedBy(payload),
    updated_at: payload.updated_at,
  };
}

function toCompatibilityStockPayload(payload: StockLinePayload) {
  return {
    ...toLegacyStockPayload(payload),
    financial_year: payload.financial_year,
    entry_type: payload.entry_type,
    firm_name: payload.firm_name,
    ifms_id: payload.ifms_id,
    variety: payload.variety,
    batch_number: payload.batch_number,
    unit: payload.unit,
    invoice_no: payload.invoice_no,
    invoice_date: payload.invoice_date || null,
    supplier: payload.supplier,
    remarks: payload.remarks,
  };
}

function legacySubmittedBy(payload: StockLinePayload) {
  if (payload.entry_type !== 'receipt') return payload.submitted_by;
  return `receipt-details:${JSON.stringify({
    by: payload.submitted_by,
    invoiceNo: payload.invoice_no || '',
    invoiceDate: payload.invoice_date || '',
    source: payload.supplier || '',
    remarks: payload.remarks || '',
  })}`;
}

function receiptDetails(row: StockInventoryLine): ReceiptDetails {
  const fallback = parseLegacyReceiptDetails(row.submitted_by);
  return {
    invoiceNo: row.invoice_no || fallback.invoiceNo,
    invoiceDate: row.invoice_date || fallback.invoiceDate,
    source: row.source || row.supplier || fallback.source,
    remarks: row.remarks || fallback.remarks,
  };
}

function parseLegacyReceiptDetails(value?: string): ReceiptDetails {
  const empty = { invoiceNo: '', invoiceDate: '', source: '', remarks: '' };
  if (!value?.startsWith('receipt-details:')) return empty;
  try {
    const parsed = JSON.parse(value.slice('receipt-details:'.length)) as Partial<ReceiptDetails>;
    return {
      invoiceNo: String(parsed.invoiceNo || ''),
      invoiceDate: String(parsed.invoiceDate || ''),
      source: String(parsed.source || ''),
      remarks: String(parsed.remarks || ''),
    };
  } catch {
    return empty;
  }
}

function normalizeStockRows(rows: StockInventoryLine[]): StockInventoryLine[] {
  return rows.map((row) => {
    const opening = row.opening_balance ?? row.opening_stock ?? 0;
    const receipts = Number(row.receipts || 0);
    const sales = Number(row.sales || 0);
    const total = row.total ?? Number(opening || 0) + receipts;
    const closing = row.closing_balance ?? row.closing_stock ?? Number(total || 0) - sales;

    return {
      ...row,
      product_type: row.product_type || row.product_name || '',
      opening_balance: Number(opening || 0),
      receipts,
      total: Number(total || 0),
      sales,
      closing_balance: Number(closing || 0),
      report_date: row.report_date || row.invoice_date || row.created_at?.slice(0, 10),
      financial_year: row.financial_year || financialYearForDate(row.report_date || row.invoice_date || row.created_at?.slice(0, 10) || currentReportDate()),
      supplier: row.supplier || row.source || '',
    };
  });
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const typed = error as SupabaseLikeError;
    return [typed.message, typed.details, typed.hint, typed.code].filter(Boolean).join(' | ') || JSON.stringify(error);
  }
  return 'Unknown error';
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
    id: crypto.randomUUID(),
    date: currentReportDate(),
    product: productsFor(category)[0] || '',
    variety: '',
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
  const { t } = useLanguage();
  const [section, setSection] = useState<Section>('entry');
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState<StockCategory>('fertilizer');
  const [unit, setUnit] = useState(CATEGORY_UNITS.fertilizer[0]);
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [records, setRecords] = useState<StockInventoryLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [message, setMessage] = useState('');
  const [receiptForm, setReceiptForm] = useState<ReceiptForm>(() => emptyReceipt('fertilizer'));
  const [dailyRows, setDailyRows] = useState<DailyForm[]>(() => [emptyDaily('fertilizer')]);
  const [receiptFilter, setReceiptFilter] = useState<SavedFilter>(() => emptyFilter());
  const [dailyFilter, setDailyFilter] = useState<SavedFilter>(() => emptyFilter());
  const [receiptFiltersOpen, setReceiptFiltersOpen] = useState(false);
  const [dailyFiltersOpen, setDailyFiltersOpen] = useState(false);

  const firmName = dealerProfile?.dealer_name || dealerName || 'Dealer Firm';
  const ifmsId = dealerProfile?.ifms_id || '';
  const licenseNumber = getCategoryLicense(dealerProfile, category);

  const loadDealerProfile = useCallback(async () => {
    if (!dealerId) return;

    const primary = await supabase
      .from('dealers')
      .select(DEALER_PROFILE_COLUMNS)
      .eq('id', dealerId)
      .maybeSingle();

    if (!primary.error) {
      setDealerProfile((primary.data || null) as DealerProfile | null);
      return;
    }

    const fallback = await supabase
      .from('dealers')
      .select('id, dealer_name')
      .eq('id', dealerId)
      .maybeSingle();

    if (fallback.error) console.error(fallback.error);
    setDealerProfile((fallback.data || null) as DealerProfile | null);
  }, [dealerId]);

  const loadRecords = useCallback(async () => {
    if (!dealerId) return;
    setLoading(true);

    const fetchRows = (columns: string, includeUpdatedOrder: boolean) => {
      let query = supabase
        .from('stock_inventory_lines')
        .select(columns)
        .eq('dealer_id', dealerId)
        .eq('category', category)
        .order('report_date', { ascending: false });

      if (includeUpdatedOrder) {
        query = query.order('updated_at', { ascending: false, nullsFirst: false });
      }

      return query.order('created_at', { ascending: false, nullsFirst: false });
    };

    const attempts = [
      () => fetchRows(STOCK_COLUMNS, true),
      () => fetchRows(STOCK_COLUMNS, false),
      () => fetchRows(LEGACY_STOCK_COLUMNS, false),
      () => fetchRows(MINIMAL_STOCK_COLUMNS, false),
    ];

    let lastError: unknown = null;
    for (const attempt of attempts) {
      const { data, error } = await attempt();
      if (!error) {
        setRecords(normalizeStockRows((data || []) as unknown as StockInventoryLine[]));
        setLoading(false);
        return;
      }
      lastError = error;
    }

    console.error(lastError);
    setRecords([]);
    setLoading(false);
  }, [category, dealerId]);

  useEffect(() => {
    void loadDealerProfile();
  }, [loadDealerProfile]);

  useEffect(() => {
    setRecords([]);
    setReceiptForm(emptyReceipt(category));
    setDailyRows([emptyDaily(category)]);
    setUnit(CATEGORY_UNITS[category][0]);
    void loadRecords();
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadRecords();
  }, [loadRecords, category, dealerId]);

  useEffect(() => {
    if (section === 'saved') void loadRecords();
  }, [receiptFilter.financialYear, section]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveReceipt = async () => {
    if (!dealerId || saving) return;
    const quantity = category === 'fertilizer' ? receiptForm.quantityMt : receiptForm.quantity;
    if (quantity <= 0 || !receiptForm.invoiceNo.trim()) {
      alert(t('Enter quantity and invoice number.', 'పరిమాణం మరియు ఇన్వాయిస్ నంబర్ నమోదు చేయండి.'));
      return;
    }

    setSaving(true);
    try {
      const payload: StockLinePayload = {
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
      await saveStockLine(payload);
      setMessage(t('Receipt saved.', 'రసీదు సేవ్ అయింది.'));
      setReceiptForm(emptyReceipt(category));
    } catch (error) {
      alert(`${t('Could not save receipt', 'రసీదు సేవ్ చేయలేకపోయాం')}: ${error instanceof Error ? error.message : t('Unknown error', 'తెలియని లోపం')}`);
    } finally {
      setSaving(false);
    }
  };

  const saveDaily = async () => {
    if (!dealerId || saving) return;
    const preparedRows = dailyRows
      .filter((row) => row.product.trim())
      .map((row, index) => {
        const computed = category === 'fertilizer'
          ? computeStockRow(row.openingMt, row.receiptsMt, row.salesMt)
          : computeStockRow(row.opening, row.receipts, row.sales);
        return { row, computed, serialNo: index + 1 };
      });

    if (!preparedRows.length) {
      alert(t('Add at least one daily stock row.', 'కనీసం ఒక రోజువారీ స్టాక్ వరుసను జోడించండి.'));
      return;
    }

    if (preparedRows.some(({ computed }) => computed.sales > computed.total || computed.closing_balance < 0)) {
      alert(t('Sales cannot be more than available stock (Opening + Receipts). Closing stock must be Total - Sales.', 'అమ్మకాలు అందుబాటులో ఉన్న స్టాక్‌ కంటే ఎక్కువగా ఉండకూడదు (ప్రారంభం + రసీదులు). ముగింపు స్టాక్ మొత్తం - అమ్మకాలు కావాలి.'));
      return;
    }

    setSaving(true);
    try {
      const payloads: StockLinePayload[] = preparedRows.map(({ row, computed, serialNo }) => ({
        dealer_id: dealerId,
        category,
        serial_no: serialNo,
        product_type: row.product.trim(),
        financial_year: financialYearForDate(row.date),
        entry_type: 'daily_stock',
        firm_name: firmName,
        ifms_id: category === 'fertilizer' ? ifmsId : '',
        variety: category === 'seed' ? row.variety.trim() : '',
        opening_balance: computed.opening_balance,
        receipts: computed.receipts,
        total: computed.total,
        sales: computed.sales,
        closing_balance: computed.closing_balance,
        unit: category === 'fertilizer' ? 'MT' : unit,
        report_date: row.date,
        report_month: row.date.slice(0, 7),
        submitted_by: user?.email || '',
        updated_at: new Date().toISOString(),
      }));
      await Promise.all(payloads.map((payload) => saveStockLine(payload)));
      setMessage(t('Daily stock saved.', 'రోజువారీ స్టాక్ సేవ్ అయింది.'));
      setDailyRows([emptyDaily(category)]);
    } catch (error) {
      alert(`${t('Could not save daily stock', 'రోజువారీ స్టాక్ సేవ్ చేయలేకపోయాం')}: ${error instanceof Error ? error.message : t('Unknown error', 'తెలియని లోపం')}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (row: StockInventoryLine) => {
    if (!row.id || deletingId) return;
    const confirmed = window.confirm(t('Delete this saved entry?', 'ఈ సేవ్ చేసిన ఎంట్రీని తొలగించాలా?'));
    if (!confirmed) return;

    setDeletingId(row.id);
    try {
      await deleteStockLine(row.id);
      setRecords((current) => current.filter((item) => item.id !== row.id));
      setMessage(t('Saved entry deleted.', 'సేవ్ చేసిన ఎంట్రీ తొలగించబడింది.'));
    } catch (error) {
      alert(`${t('Could not delete entry', 'ఎంట్రీని తొలగించలేకపోయాం')}: ${error instanceof Error ? error.message : t('Unknown error', 'తెలియని లోపం')}`);
    } finally {
      setDeletingId('');
    }
  };

  if (!dealerId) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">{t('Dealer account not linked. Please sign in with your registered phone number.', 'డీలర్ ఖాతా లింక్ కాలేదు. దయచేసి మీ నమోదిత ఫోన్ నంబర్‌తో సైన్ ఇన్ చేయండి.')}</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: COLORS.bg, color: COLORS.text }}>
      <div className="sticky top-0 z-30 border-b border-emerald-900/10 bg-[#F4F8F5]/95 px-2 py-2 backdrop-blur sm:px-3">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">{t('Welcome', 'స్వాగతం')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-black uppercase sm:text-lg">{firmName}</h1>
              {category === 'fertilizer' && ifmsId && <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-black text-white">IFMS ID: {ifmsId}</span>}
            </div>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: COLORS.muted }}>{licenseNumber || t('License No. Not Updated', 'లైసెన్స్ నంబర్ నవీకరించబడలేదు')}</p>
          </div>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="rounded-xl border border-emerald-200 bg-white p-2 text-emerald-900 shadow-sm">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <MenuButton icon={<Truck className="h-4 w-4" />} label={t('Receipts & Daily Stock', 'రసీదులు & రోజువారీ స్టాక్')} active={section === 'entry'} onClick={() => { setSection('entry'); setMenuOpen(false); }} />
                <MenuButton icon={<Table2 className="h-4 w-4" />} label={t('Saved Entries', 'సేవ్ చేసిన ఎంట్రీలు')} active={section === 'saved'} onClick={() => { setSection('saved'); setMenuOpen(false); void loadRecords(); }} />
              </div>
            )}
          </div>
        </div>
        <CategoryTabs category={category} onChange={setCategory} />
      </div>

      <main className="w-full max-w-full space-y-2 overflow-hidden px-1.5 py-2 sm:px-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black">{section === 'entry' ? t('Receipts & Daily Stock', 'రసీదులు & రోజువారీ స్టాక్') : t('Saved Entries', 'సేవ్ చేసిన ఎంట్రీలు')}</h2>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black shadow-sm">
            Unit
            <select value={unit} onChange={(event) => setUnit(event.target.value)} className="bg-transparent outline-none">
              {CATEGORY_UNITS[category].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</div>}

        {section === 'entry' ? (
          <DealerEntryWorkArea
            category={category}
            unit={unit}
            receiptForm={receiptForm}
            setReceiptForm={setReceiptForm}
            dailyRows={dailyRows}
            setDailyRows={setDailyRows}
            records={records}
            saving={saving}
            onSaveReceipt={saveReceipt}
            onSaveDaily={saveDaily}
          />
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
            receiptFiltersOpen={receiptFiltersOpen}
            setReceiptFiltersOpen={setReceiptFiltersOpen}
            dailyFiltersOpen={dailyFiltersOpen}
            setDailyFiltersOpen={setDailyFiltersOpen}
            deletingId={deletingId}
            onDelete={deleteEntry}
          />
        )}
      </main>
    </div>
  );
}

const CategoryTabs = memo(function CategoryTabs({ category, onChange }: { category: StockCategory; onChange: (category: StockCategory) => void }) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {(['fertilizer', 'seed', 'pesticide'] as StockCategory[]).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-xl border px-2 py-2 text-sm font-black transition ${category === item ? 'text-white' : 'bg-white text-emerald-800'}`}
          style={{ background: category === item ? COLORS.primary : '#FFFFFF', borderColor: COLORS.primary }}
        >
          {t(CATEGORY_LABELS[item], translateDealerUi(CATEGORY_LABELS[item]))}
        </button>
      ))}
    </div>
  );
});

function DealerEntryWorkArea(props: {
  category: StockCategory;
  unit: string;
  receiptForm: ReceiptForm;
  setReceiptForm: React.Dispatch<React.SetStateAction<ReceiptForm>>;
  dailyRows: DailyForm[];
  setDailyRows: React.Dispatch<React.SetStateAction<DailyForm[]>>;
  records: StockInventoryLine[];
  saving: boolean;
  onSaveReceipt: () => void;
  onSaveDaily: () => void;
}) {
  return (
    <div className="space-y-2">
      <ReceiptEntryCard category={props.category} unit={props.unit} form={props.receiptForm} setForm={props.setReceiptForm} saving={props.saving} onSave={props.onSaveReceipt} />
      <DailyEntryCard category={props.category} unit={props.unit} rows={props.dailyRows} setRows={props.setDailyRows} records={props.records} saving={props.saving} onSave={props.onSaveDaily} />
    </div>
  );
}

function MenuButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-black ${active ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'}`}>
      {icon}{label}
    </button>
  );
}

function ReceiptEntryCard({ category, unit, form, setForm, saving, onSave }: { category: StockCategory; unit: string; form: ReceiptForm; setForm: React.Dispatch<React.SetStateAction<ReceiptForm>>; saving: boolean; onSave: () => void }) {
  const { t } = useLanguage();
  const update = (patch: Partial<ReceiptForm>) => setForm((current) => ({ ...current, ...patch }));
  const [open, setOpen] = useState(category !== 'fertilizer');
  const quantityBags = mtToBags(form.quantityMt, form.product);
  const displayQty = category === 'fertilizer' && unit === 'Bags' ? Math.round(quantityBags) : form.quantityMt;

  useEffect(() => {
    setOpen(category !== 'fertilizer');
  }, [category]);

  return (
    <section className="rounded-[14px] border border-red-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-2 text-left text-sm font-black text-red-800">
        <span className="flex items-center gap-2"><Truck className="h-4 w-4" /> {t('Receipts Entry', translateDealerUi('Receipts Entry'))}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
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
        </>
      )}
    </section>
  );
}

function DailyEntryCard({ category, unit, rows, setRows, records, saving, onSave }: { category: StockCategory; unit: string; rows: DailyForm[]; setRows: React.Dispatch<React.SetStateAction<DailyForm[]>>; records: StockInventoryLine[]; saving: boolean; onSave: () => void }) {
  const { t } = useLanguage();
  const withCarriedOpening = (row: DailyForm) => {
    const previousClosing = previousDailyClosing(records, category, row.product, row.date);
    if (previousClosing === null) return row;
    return category === 'fertilizer'
      ? { ...row, openingMt: previousClosing }
      : { ...row, opening: previousClosing };
  };
  const updateRow = (id: string, patch: Partial<DailyForm>) => setRows((current) => current.map((row) => {
    if (row.id !== id) return row;
    const next = { ...row, ...patch };
    return patch.date !== undefined || patch.product !== undefined ? withCarriedOpening(next) : next;
  }));
  const addRow = () => setRows((current) => [...current, withCarriedOpening(emptyDaily(category))]);
  const removeRow = (id: string) => setRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== id));
  const display = (value: number, product: string) => category === 'fertilizer' && unit === 'Bags' ? Math.round(mtToBags(value, product)) : Number(formatMt(value));
  const parse = (value: number, product: string) => category === 'fertilizer' && unit === 'Bags' ? bagsToMt(value, product) : value;

  useEffect(() => {
    setRows((current) => current.map((row) => {
      const isEmptyOpening = category === 'fertilizer' ? Number(row.openingMt || 0) === 0 : Number(row.opening || 0) === 0;
      return isEmptyOpening ? withCarriedOpening(row) : row;
    }));
  }, [category, records]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="rounded-[14px] border border-emerald-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-black text-emerald-900"><Calendar className="h-4 w-4" /> {t('Daily Stock / Sales Entry', translateDealerUi('Daily Stock / Sales Entry'))}</h3>
        <button type="button" onClick={addRow} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          <Plus className="h-3.5 w-3.5" /> Add row
        </button>
      </div>
      <div className="grid gap-2 md:hidden">
        {rows.map((row) => {
          const computed = category === 'fertilizer'
            ? computeStockRow(row.openingMt, row.receiptsMt, row.salesMt)
            : computeStockRow(row.opening, row.receipts, row.sales);
          return (
            <div key={row.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <input type="date" value={row.date} onChange={(event) => updateRow(row.id, { date: event.target.value })} className="min-w-0 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-bold" />
                <button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} className="shrink-0 rounded-lg border border-red-200 bg-white p-2 text-red-600 disabled:opacity-40">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <ProductInput category={category} label="Product" value={row.product} onChange={(value) => updateRow(row.id, { product: value })} />
              {category === 'seed' && <div className="mt-2"><Field label="Variety / Hybrid" value={row.variety} onChange={(value) => updateRow(row.id, { variety: value })} /></div>}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <MobileNumber label={`Opening (${unit})`} value={category === 'fertilizer' ? display(row.openingMt, row.product) : row.opening} onChange={(value) => category === 'fertilizer' ? updateRow(row.id, { openingMt: parse(value, row.product) }) : updateRow(row.id, { opening: value })} />
                <MobileNumber label={`${t('Receipts', translateDealerUi('Receipts'))} (${unit})`} value={category === 'fertilizer' ? display(row.receiptsMt, row.product) : row.receipts} onChange={(value) => category === 'fertilizer' ? updateRow(row.id, { receiptsMt: parse(value, row.product) }) : updateRow(row.id, { receipts: value })} />
                <Readonly label={`Total (${unit})`} value={String(category === 'fertilizer' ? display(computed.total, row.product) : computed.total)} />
                <MobileNumber label={`${t('Sales', translateDealerUi('Sales'))} (${unit})`} value={category === 'fertilizer' ? display(row.salesMt, row.product) : row.sales} onChange={(value) => category === 'fertilizer' ? updateRow(row.id, { salesMt: parse(value, row.product) }) : updateRow(row.id, { sales: value })} />
                <div className="col-span-2"><Readonly label={`Closing (${unit})`} value={String(category === 'fertilizer' ? display(computed.closing_balance, row.product) : computed.closing_balance)} /></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="table-scroll hidden md:block">
        <table className="w-full min-w-[860px] text-xs">
          <thead className="sticky top-0 text-white" style={{ background: COLORS.text }}>
            <tr>
              {['Date', 'Product', ...(category === 'seed' ? ['Variety / Hybrid'] : []), `Opening (${unit})`, `Receipts (${unit})`, `Total (${unit})`, `Sales (${unit})`, `Closing (${unit})`, 'Delete'].map((head) => { const label = splitDealerUnitLabel(head); return <th key={head} className="px-2 py-2 text-left">{t(label.base, translateDealerUi(label.base))}{label.suffix}</th>; })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const computed = category === 'fertilizer'
                ? computeStockRow(row.openingMt, row.receiptsMt, row.salesMt)
                : computeStockRow(row.opening, row.receipts, row.sales);
              return (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-2 py-2"><input type="date" value={row.date} onChange={(event) => updateRow(row.id, { date: event.target.value })} className="h-9 rounded-lg border border-slate-300 px-2 text-xs font-bold" /></td>
                  <td className="px-2 py-2"><ProductInput category={category} label="" value={row.product} onChange={(value) => updateRow(row.id, { product: value })} /></td>
                  {category === 'seed' && <td className="px-2 py-2"><input value={row.variety} onChange={(event) => updateRow(row.id, { variety: event.target.value })} className="h-9 w-36 rounded-lg border border-slate-300 px-2 text-xs font-bold outline-none focus:border-emerald-600" placeholder="Variety" /></td>}
                  <td className="px-2 py-2"><NumberInput value={category === 'fertilizer' ? display(row.openingMt, row.product) : row.opening} onChange={(value) => category === 'fertilizer' ? updateRow(row.id, { openingMt: parse(value, row.product) }) : updateRow(row.id, { opening: value })} /></td>
                  <td className="px-2 py-2"><NumberInput value={category === 'fertilizer' ? display(row.receiptsMt, row.product) : row.receipts} onChange={(value) => category === 'fertilizer' ? updateRow(row.id, { receiptsMt: parse(value, row.product) }) : updateRow(row.id, { receipts: value })} /></td>
                  <td className="px-2 py-2 font-black text-emerald-800">{category === 'fertilizer' ? display(computed.total, row.product) : computed.total}</td>
                  <td className="px-2 py-2"><NumberInput value={category === 'fertilizer' ? display(row.salesMt, row.product) : row.sales} onChange={(value) => category === 'fertilizer' ? updateRow(row.id, { salesMt: parse(value, row.product) }) : updateRow(row.id, { sales: value })} /></td>
                  <td className="px-2 py-2 font-black">{category === 'fertilizer' ? display(computed.closing_balance, row.product) : computed.closing_balance}</td>
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} className="rounded-lg border border-red-200 bg-white p-2 text-red-600 disabled:opacity-40">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {category === 'fertilizer' && <p className="mt-2 text-xs font-bold text-slate-500">Fertilizer values are saved in MT. Display follows selected unit.</p>}
      <button type="button" onClick={onSave} disabled={saving} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white disabled:opacity-60" style={{ background: COLORS.primary }}>
        <Save className="h-4 w-4" /> {t('Save Daily Entry', translateDealerUi('Save Daily Entry'))}
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
  receiptFiltersOpen: boolean;
  setReceiptFiltersOpen: (open: boolean) => void;
  dailyFiltersOpen: boolean;
  setDailyFiltersOpen: (open: boolean) => void;
  deletingId: string;
  onDelete: (row: StockInventoryLine) => void;
}) {
  const { t } = useLanguage();
  const { category, unit, records, loading, receiptFilter, setReceiptFilter, dailyFilter, setDailyFilter } = props;
  const receiptRows = useFilteredRows(records, category, receiptFilter, 'receipt');
  const dailyRows = useFilteredRows(records, category, dailyFilter, 'daily_stock');
  const receiptProducts = useOptions(records, category, 'receipt', 'product');
  const receiptSources = useOptions(records, category, 'receipt', 'source');
  const dailyProducts = useOptions(records, category, 'daily_stock', 'product');
  const summary = useMemo(() => buildSummary(dailyRows, receiptRows), [dailyRows, receiptRows]);
  const productStats = useMemo(() => buildProductStats(dailyRows, receiptRows), [dailyRows, receiptRows]);

  return (
    <div className="space-y-3">
      {loading && <div className="rounded-xl bg-white p-3 text-sm font-bold text-slate-500">Loading saved entries...</div>}
      <SummaryCards summary={summary} category={category} unit={unit} />
      <ProductWiseBars stats={productStats} category={category} unit={unit} />
      <SavedTableSection
        title={t('Saved Receipts', translateDealerUi('Saved Receipts'))}
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
        onExport={() => exportSavedRows('receipts', receiptRows, category, unit, props.firmName, props.ifmsId)}
        deletingId={props.deletingId}
        onDelete={props.onDelete}
      />
      <SavedTableSection
        title={t('Saved Daily Stock / Sales', translateDealerUi('Saved Daily Stock / Sales'))}
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
        onExport={() => exportSavedRows('daily', dailyRows, category, unit, props.firmName, props.ifmsId)}
        deletingId={props.deletingId}
        onDelete={props.onDelete}
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
  onExport: () => void;
  deletingId: string;
  onDelete: (row: StockInventoryLine) => void;
}) {
  const { t } = useLanguage();

  return (
    <section className="border border-slate-200 bg-white">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="px-2 pt-2">
          <h3 className="text-sm font-black">{props.title}</h3>
          <p className="text-xs font-bold text-slate-500">{props.rows.length} records</p>
        </div>
        <div className="flex flex-wrap gap-2 px-2 pt-2">
          <button type="button" onClick={() => props.setFiltersOpen(!props.filtersOpen)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black">
            Filters <ChevronDown className={`h-3 w-3 transition ${props.filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          <IconButton label={t('Export Excel', translateDealerUi('Export Excel'))} tone="excel" onClick={props.onExport} className="h-9 w-9">
            <FileSpreadsheet className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
      <div className={`${props.filtersOpen ? 'grid' : 'hidden md:grid'} mb-2 gap-2 px-2 md:grid-cols-6`}>
        <SelectField label="Financial Year" value={props.filter.financialYear} onChange={(value) => props.setFilter((current) => ({ ...current, financialYear: value }))} options={FINANCIAL_YEARS} />
        <Field label="From Date" type="date" value={props.filter.fromDate} onChange={(value) => props.setFilter((current) => ({ ...current, fromDate: value }))} />
        <Field label="To Date" type="date" value={props.filter.toDate} onChange={(value) => props.setFilter((current) => ({ ...current, toDate: value }))} />
        <SelectField label="Product" value={props.filter.product || 'all'} onChange={(value) => props.setFilter((current) => ({ ...current, product: value }))} options={['all', ...props.productOptions]} display={(value) => value === 'all' ? 'All' : value} />
        {props.type === 'receipt' && <Field label="Invoice Number" value={props.filter.invoiceNo} onChange={(value) => props.setFilter((current) => ({ ...current, invoiceNo: value }))} />}
        {props.type === 'receipt' && <SelectField label="Source / Wholesaler" value={props.filter.source || 'all'} onChange={(value) => props.setFilter((current) => ({ ...current, source: value }))} options={['all', ...props.sourceOptions]} display={(value) => value === 'all' ? 'All' : value} />}
      </div>
      <SavedTable rows={props.rows} category={props.category} unit={props.unit} type={props.type} deletingId={props.deletingId} onDelete={props.onDelete} />
    </section>
  );
}

function SavedTable({ rows, category, unit, type, deletingId, onDelete }: { rows: StockInventoryLine[]; category: StockCategory; unit: string; type: 'receipt' | 'daily_stock'; deletingId: string; onDelete: (row: StockInventoryLine) => void }) {
  if (!rows.length) {
    return <div className="border-t border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">No saved entries found.</div>;
  }

  const headers = type === 'receipt'
    ? ['S.No', 'Date', 'Product', `Quantity (${unit})`, 'Invoice No', 'Invoice Date', 'Wholesaler / Source', 'Remarks', 'Delete']
    : ['S.No', 'Date', 'Product', `Opening (${unit})`, `Receipts (${unit})`, `Total (${unit})`, `Sales (${unit})`, `Closing (${unit})`, 'Delete'];

  return (
    <div className="table-scroll border-t border-slate-200">
      <table className={`w-full text-xs ${type === 'receipt' ? 'min-w-[1080px]' : 'min-w-[900px]'}`}>
        <thead className={type === 'receipt' ? 'bg-red-800 text-white' : 'bg-emerald-900 text-white'}>
          <tr>
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-2.5 py-2 text-left font-black">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={row.id || `${row.report_date}-${row.product_type}-${index}`} className={type === 'receipt' ? 'hover:bg-red-50/70' : 'hover:bg-emerald-50/70'}>
              {savedTableCells(row, index, category, unit, type).map((cell, cellIndex) => (
                <td key={`${row.id || index}-${cellIndex}`} className="whitespace-nowrap px-2.5 py-2 align-top font-bold text-slate-700">
                  {cell}
                </td>
              ))}
              <td className="whitespace-nowrap px-2.5 py-2">
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  disabled={!row.id || deletingId === row.id}
                  className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  title="Delete entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function savedTableCells(row: StockInventoryLine, index: number, category: StockCategory, unit: string, type: 'receipt' | 'daily_stock') {
  const product = displayProduct(row);
  if (type === 'receipt') {
    const details = receiptDetails(row);
    return [
      index + 1,
      displayDate(row.report_date),
      product,
      displayQuantity(Number(row.receipts || 0), product, category, unit),
      details.invoiceNo || '-',
      displayDate(details.invoiceDate),
      details.source || '-',
      details.remarks || '-',
    ];
  }
  return [
    index + 1,
    displayDate(row.report_date),
    product,
    displayQuantity(Number(row.opening_balance || 0), product, category, unit),
    displayQuantity(Number(row.receipts || 0), product, category, unit),
    displayQuantity(Number(row.total || 0), product, category, unit),
    displayQuantity(Number(row.sales || 0), product, category, unit),
    displayQuantity(Number(row.closing_balance || 0), product, category, unit),
  ];
}

function displayQuantity(value: number, product: string, category: StockCategory, unit: string) {
  if (category === 'fertilizer') {
    return unit === 'Bags'
      ? `${formatBags(mtToBags(value, product))} Bags`
      : `${formatMt(value)} MT`;
  }
  return `${Number(value || 0).toFixed(2)} ${unit}`;
}

function SummaryCards({ summary, category, unit }: { summary: { receipts: number; sales: number; stock: number; receiptBags: number; salesBags: number; stockBags: number }; category: StockCategory; unit: string }) {
  const { t } = useLanguage();
  const display = (value: number, bags: number) => category === 'fertilizer' && unit === 'Bags'
    ? `${formatBags(bags)} Bags`
    : category === 'fertilizer'
      ? `${formatMt(value)} MT`
      : `${Number(value || 0).toFixed(2)} ${unit}`;
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Summary label={t('Receipts', translateDealerUi('Receipts'))} value={display(summary.receipts, summary.receiptBags)} />
      <Summary label={t('Sales', translateDealerUi('Sales'))} value={display(summary.sales, summary.salesBags)} />
      <Summary label={t('Stock', translateDealerUi('Stock'))} value={display(summary.stock, summary.stockBags)} />
    </div>
  );
}

function ProductWiseBars({ stats, category, unit }: { stats: ProductStat[]; category: StockCategory; unit: string }) {
  const { t } = useLanguage();
  if (!stats.length) return null;
  const max = Math.max(...stats.map((item) => Math.max(item.receipts, item.sales, Math.abs(item.stock))), 1);
  const display = (value: number, bags: number) => category === 'fertilizer' && unit === 'Bags'
    ? `${formatBags(bags)} Bags`
    : category === 'fertilizer'
      ? `${formatMt(value)} MT`
      : `${Number(value || 0).toFixed(2)} ${unit}`;
  return (
    <section className="rounded-[14px] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
      <h3 className="mb-2 text-sm font-black text-slate-950">{t('Product-wise Receipts, Sales & Stock', translateDealerUi('Product-wise Receipts, Sales & Stock'))}</h3>
      <div className="grid gap-2 lg:grid-cols-2">
        {stats.map((item) => (
          <div key={item.product} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
            <p className="mb-2 truncate text-xs font-black text-slate-900">{item.product}</p>
            <BarLine label={t('Receipts', translateDealerUi('Receipts'))} color="bg-emerald-600" width={(item.receipts / max) * 100} value={display(item.receipts, item.receiptBags)} />
            <BarLine label={t('Sales', translateDealerUi('Sales'))} color="bg-red-600" width={(item.sales / max) * 100} value={display(item.sales, item.salesBags)} />
            <BarLine label={t('Stock', translateDealerUi('Stock'))} color="bg-slate-800" width={(Math.abs(item.stock) / max) * 100} value={display(item.stock, item.stockBags)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BarLine({ label, value, color, width }: { label: string; value: string; color: string; width: number }) {
  return (
    <div className="mb-2 grid min-w-0 grid-cols-[4.25rem_1fr] items-center gap-2 text-[11px] font-bold sm:grid-cols-[4.5rem_1fr_auto]">
      <span className="text-slate-500">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-white">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${Math.max(4, Math.min(100, width))}%` }} />
      </span>
      <span className="col-start-2 break-words text-slate-800 sm:col-start-auto">{value}</span>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[14px] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.08)]"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div>;
}

function ProductInput({ category, label, value, onChange }: { category: StockCategory; label: string; value: string; onChange: (value: string) => void }) {
  const { t } = useLanguage();
  const [manual, setManual] = useState(!productsFor(category).includes(value));
  useEffect(() => setManual(!productsFor(category).includes(value)), [category, value]);
  if (manual) {
    return <Field label={label || 'Product'} value={value} onChange={onChange} />;
  }
  return (
    <div className="grid gap-1">
      <SelectField label={label || 'Product'} value={value} onChange={(next) => next === '__manual__' ? setManual(true) : onChange(next)} options={[...productsFor(category), '__manual__']} display={(option) => option === '__manual__' ? t('Manual Entry', translateDealerUi('Manual Entry')) : option} />
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

function MobileNumber({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{label}</span>
      <input type="number" min={0} step="0.001" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value) || 0)} className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold outline-none focus:border-emerald-600" />
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
      const isType = type === 'receipt' ? isReceiptRow(row) : !isReceiptRow(row);
      return (
        row.category === category &&
        isType &&
        date >= range.start &&
        date <= range.end &&
        (!filter.fromDate || date >= filter.fromDate) &&
        (!filter.toDate || date <= filter.toDate) &&
        (!filter.product || filter.product === 'all' || title === filter.product.toLowerCase()) &&
        (!filter.invoiceNo || receiptDetails(row).invoiceNo.toLowerCase().includes(filter.invoiceNo.toLowerCase())) &&
        (!filter.source || filter.source === 'all' || receiptDetails(row).source.toLowerCase() === filter.source.toLowerCase())
      );
    });
  }, [category, filter, rows, type]);
}

function useOptions(rows: StockInventoryLine[], category: StockCategory, type: 'receipt' | 'daily_stock', field: 'product' | 'source') {
  return useMemo(() => {
    const values = rows
      .filter((row) => row.category === category && (type === 'receipt' ? isReceiptRow(row) : !isReceiptRow(row)))
      .map((row) => field === 'product' ? row.product_type : receiptDetails(row).source)
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [category, field, rows, type]);
}

function isReceiptRow(row: StockInventoryLine) {
  if (row.entry_type === 'receipt') return true;
  if (row.entry_type === 'daily_stock' || row.entry_type === 'sale') return false;
  const details = receiptDetails(row);
  if (details.invoiceNo || details.source) return true;

  const opening = Number(row.opening_balance || 0);
  const receipts = Number(row.receipts || 0);
  const total = Number(row.total || 0);
  const sales = Number(row.sales || 0);
  const closing = Number(row.closing_balance || 0);

  return receipts > 0 && opening === 0 && sales === 0 && total === receipts && closing === receipts;
}

function previousDailyClosing(records: StockInventoryLine[], category: StockCategory, product: string, date: string): number | null {
  const normalizedProduct = product.trim().toLowerCase();
  if (!normalizedProduct || !date) return null;

  const previous = records
    .filter((row) => (
      row.category === category &&
      !isReceiptRow(row) &&
      (row.product_type || '').trim().toLowerCase() === normalizedProduct &&
      (row.report_date || '') < date
    ))
    .sort((a, b) => (b.report_date || '').localeCompare(a.report_date || ''))[0];

  return previous ? Number(previous.closing_balance || 0) : null;
}

function buildSummary(dailyRows: StockInventoryLine[], receiptRows: StockInventoryLine[]) {
  const opening = dailyRows.reduce((sum, row) => sum + Number(row.opening_balance || 0), 0);
  const receipts = receiptRows.reduce((sum, row) => sum + Number(row.receipts || 0), 0) + dailyRows.reduce((sum, row) => sum + Number(row.receipts || 0), 0);
  const sales = dailyRows.reduce((sum, row) => sum + Number(row.sales || 0), 0);
  const stock = opening + receipts - sales;
  const openingBags = dailyRows.reduce((sum, row) => sum + mtToBags(Number(row.opening_balance || 0), row.product_type), 0);
  const receiptBags =
    receiptRows.reduce((sum, row) => sum + mtToBags(Number(row.receipts || 0), row.product_type), 0) +
    dailyRows.reduce((sum, row) => sum + mtToBags(Number(row.receipts || 0), row.product_type), 0);
  const salesBags = dailyRows.reduce((sum, row) => sum + mtToBags(Number(row.sales || 0), row.product_type), 0);
  const stockBags = openingBags + receiptBags - salesBags;
  return { receipts, sales, stock, receiptBags, salesBags, stockBags };
}

function buildProductStats(dailyRows: StockInventoryLine[], receiptRows: StockInventoryLine[]): ProductStat[] {
  const map = new Map<string, ProductStat>();
  const ensure = (row: StockInventoryLine) => {
    const product = displayProduct(row);
    const current = map.get(product) || { product, receipts: 0, sales: 0, stock: 0, receiptBags: 0, salesBags: 0, stockBags: 0 };
    map.set(product, current);
    return current;
  };

  receiptRows.forEach((row) => {
    const current = ensure(row);
    const receipts = Number(row.receipts || 0);
    current.receipts += receipts;
    current.stock += receipts;
    current.receiptBags += mtToBags(receipts, row.product_type);
    current.stockBags += mtToBags(receipts, row.product_type);
  });

  dailyRows.forEach((row) => {
    const current = ensure(row);
    const opening = Number(row.opening_balance || 0);
    const receipts = Number(row.receipts || 0);
    const sales = Number(row.sales || 0);
    current.receipts += receipts;
    current.sales += sales;
    current.stock += opening + receipts - sales;
    current.receiptBags += mtToBags(receipts, row.product_type);
    current.salesBags += mtToBags(sales, row.product_type);
    current.stockBags += mtToBags(opening + receipts - sales, row.product_type);
  });

  return [...map.values()].sort((a, b) => b.receipts + b.sales - (a.receipts + a.sales));
}

async function exportSavedRows(type: 'receipts' | 'daily', rows: StockInventoryLine[], category: StockCategory, unit: string, firmName: string, ifmsId: string) {
  if (!rows.length) {
    alert('No records to export.');
    return;
  }
  const excelRows = rows.map((row, index) => type === 'receipts'
    ? receiptExcelRow(row, index, category, unit)
    : dailyExcelRow(row, index, category, unit));
  const metadata = [
    ['TIRYANI PORTAL EMBLEM', '', '', '', 'AGRONIX'],
    ['Firm Name', firmName, '', '', 'Official Dealer Stock Register'],
    ['Category', CATEGORY_LABELS[category], '', '', `Generated: ${new Date().toLocaleString('en-IN')}`],
  ];
  if (category === 'fertilizer') metadata.push(['IFMS ID', ifmsId || '']);
  const headers = Object.keys(excelRows[0]);
  const totalColumns = type === 'receipts'
    ? headers.filter((header) => header.includes('Quantity'))
    : headers.filter((header) => ['Opening', 'Receipts', 'Total', 'Sales', 'Closing'].some((label) => header.includes(label)));
  const totalRow = headers.reduce((row, header) => {
    row[header] = header === 'S.No' ? 'TOTAL' : totalColumns.includes(header) ? totalValue(excelRows, header) : '';
    return row;
  }, {} as Record<string, string | number>);
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.aoa_to_sheet([...metadata, [], headers, ...[...excelRows, totalRow].map((row) => headers.map((header) => row[header]))]);
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 0, c: 4 }, e: { r: 0, c: Math.max(4, headers.length - 1) } },
  ];
  worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, header.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, type === 'receipts' ? 'Saved Receipts' : 'Daily Stock');
  appendSummarySheet(workbook, `${CATEGORY_LABELS[category]} ${type === 'receipts' ? 'Receipts' : 'Daily Stock'} Summary`, [
    ['Firm Name', firmName],
    ['Category', CATEGORY_LABELS[category]],
    ['IFMS ID', category === 'fertilizer' ? ifmsId || '' : ''],
    ['Unit', unit],
    ['Total Records', excelRows.length],
    ...totalColumns.map((column): [string, number] => [`Total ${column}`, totalValue(excelRows, column)]),
    ['Generated On', new Date().toLocaleString('en-IN')],
  ]);
  XLSX.writeFile(workbook, `${CATEGORY_LABELS[category].toLowerCase()}-${type}-${Date.now()}.xlsx`);
}

function receiptExcelRow(row: StockInventoryLine, index: number, category: StockCategory, unit: string): Record<string, string | number> {
  const mt = Number(row.receipts || 0);
  const bags = mtToBags(mt, row.product_type);
  const details = receiptDetails(row);
  const base: Record<string, string | number> = { 'S.No': index + 1, 'Financial Year': row.financial_year || financialYearForDate(row.report_date || currentReportDate()), Date: displayDate(row.report_date), Product: displayProduct(row) };
  if (category === 'fertilizer') {
    if (unit === 'Bags') {
      base['Quantity Bags'] = formatBags(bags);
    } else {
      base['Quantity MT'] = formatMt(mt);
    }
  } else {
    base.Quantity = Number(row.receipts || 0);
    base.Unit = row.unit || '';
  }
  return { ...base, 'Invoice No': details.invoiceNo, 'Invoice Date': displayDate(details.invoiceDate), Source: details.source, Remarks: details.remarks };
}

function dailyExcelRow(row: StockInventoryLine, index: number, category: StockCategory, unit: string): Record<string, string | number> {
  const base: Record<string, string | number> = { 'S.No': index + 1, 'Financial Year': row.financial_year || financialYearForDate(row.report_date || currentReportDate()), Date: displayDate(row.report_date), Product: displayProduct(row) };
  if (category === 'fertilizer') {
    if (unit === 'Bags') {
      base['Opening Bags'] = formatBags(mtToBags(Number(row.opening_balance || 0), row.product_type));
      base['Receipts Bags'] = formatBags(mtToBags(Number(row.receipts || 0), row.product_type));
      base['Total Bags'] = formatBags(mtToBags(Number(row.total || 0), row.product_type));
      base['Sales Bags'] = formatBags(mtToBags(Number(row.sales || 0), row.product_type));
      base['Closing Bags'] = formatBags(mtToBags(Number(row.closing_balance || 0), row.product_type));
    } else {
      base['Opening MT'] = formatMt(Number(row.opening_balance || 0));
      base['Receipts MT'] = formatMt(Number(row.receipts || 0));
      base['Total MT'] = formatMt(Number(row.total || 0));
      base['Sales MT'] = formatMt(Number(row.sales || 0));
      base['Closing MT'] = formatMt(Number(row.closing_balance || 0));
    }
  } else {
    base.Opening = Number(row.opening_balance || 0);
    base.Receipts = Number(row.receipts || 0);
    base.Total = Number(row.total || 0);
    base.Sales = Number(row.sales || 0);
    base.Closing = Number(row.closing_balance || 0);
    base.Unit = row.unit || unit;
  }
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

function displayProduct(row: StockInventoryLine) {
  const product = row.product_type || '-';
  return row.variety ? `${product} - ${row.variety}` : product;
}


