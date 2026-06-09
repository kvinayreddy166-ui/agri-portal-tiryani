import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Copy, Download, Menu, PackageCheck, Plus, RotateCcw, Save, Search, Trash2, Truck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FERTILIZER_TYPES } from '../lib/constants';
import { upsertDealerStockAllocation } from '../lib/dealerStockAllocation';
import { fetchDealerFertilizerAllocation } from '../lib/fertilizerStock';
import {
  StockCategory,
  StockInventoryLine,
  computeStockRow,
  currentReportDate,
  emptyInventoryRow,
  fertilizerBagWeightMts,
  formatFertilizerQuantity,
  formatReportDateLabel,
  productTypesForCategory,
  reportDateToMonth,
  shiftReportDate,
} from '../lib/stockInventory';
import { supabase } from '../lib/supabase';

const wholesalerOptions = [
  'M/s. Laxmi Narasimha Traders, Karimnagar',
  'M/s. FR Lahoti & Sons',
  'M/s. Vaibhav Traders, Karimnagar',
  'Jahnavi Agro Agencies',
  'M/s. Sai Rama Trading Company, Karimnagar',
  'M/s. Meher Sai Seeds & Fertilizers',
  'Sri Rajarajeshwari Traders, Mancherial',
  'Markfed',
  'Kanaka Durga Trading Company',
  'M/s. Hanuman Agro Bellampally',
  'Sri Laxmi Fertilizers',
  'Rama Trading Company',
  'Sri Ganesh Pesticides',
  'Maheshwara Fertilizers & Seeds',
  'Others provide description',
];

type FertilizerUnit = 'mts' | 'bags';
type LoadForm = {
  fertilizer_type: string;
  wholesaler_name: string;
  wholesaler_description: string;
  invoice_number: string;
  invoice_date: string;
  quantity: number;
};

type DealerReceipt = {
  id: string;
  dealer_id: string;
  fertilizer_type: string;
  quantity_mts: number;
  quantity_unit?: string;
  quantity_bags?: number;
  wholesaler_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  last_updated: string;
  created_at: string;
};

export function DealerStockPortal() {
  const { dealerId, dealerName, user } = useAuth();
  const { language, t } = useLanguage();
  const category: StockCategory = 'fertilizer';
  const [activeSection, setActiveSection] = useState<'receipts' | 'sales'>('receipts');
  const [reportDate, setReportDate] = useState(currentReportDate());
  const [rows, setRows] = useState<StockInventoryLine[]>([emptyInventoryRow(1, 'fertilizer')]);
  const [recentDates, setRecentDates] = useState<string[]>([]);
  const [allocation, setAllocation] = useState<{ fertilizer_type: string; quantity_mts: number }[]>([]);
  const [dealerReceipts, setDealerReceipts] = useState<DealerReceipt[]>([]);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptFromDate, setReceiptFromDate] = useState('');
  const [receiptToDate, setReceiptToDate] = useState('');
  const [dealerIfmsId, setDealerIfmsId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fertilizerQtyUnit, setFertilizerQtyUnit] = useState<FertilizerUnit>('mts');
  const [message, setMessage] = useState('');
  const [loadForm, setLoadForm] = useState<LoadForm>({
    fertilizer_type: 'Urea',
    wholesaler_name: 'Markfed',
    wholesaler_description: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    quantity: 0,
  });

  const isFertilizer = category === 'fertilizer';
  const dateLocale = language === 'te' ? 'te-IN' : 'en-IN';
  const qtyUnit = isFertilizer ? (fertilizerQtyUnit === 'bags' ? 'Bags' : 'MT') : '';

  const loadRecentDates = useCallback(async (cat: StockCategory) => {
    if (!dealerId) return;
    const { data } = await supabase
      .from('stock_inventory_lines')
      .select('report_date')
      .eq('dealer_id', dealerId)
      .eq('category', cat)
      .order('report_date', { ascending: false })
      .limit(30);

    setRecentDates([...new Set((data || []).map((row) => row.report_date as string))]);
  }, [dealerId]);

  const buildRowsFromPreviousClosing = useCallback(async (cat: StockCategory, date: string) => {
    if (!dealerId) return [emptyInventoryRow(1, cat, date)];
    const prevDate = shiftReportDate(date, -1);
    const { data } = await supabase
      .from('stock_inventory_lines')
      .select('product_type, closing_balance')
      .eq('dealer_id', dealerId)
      .eq('category', cat)
      .eq('report_date', prevDate)
      .order('serial_no');

    if (!data?.length) return [emptyInventoryRow(1, cat, date)];

    return data.map((item, index) => ({
      ...emptyInventoryRow(index + 1, cat, date),
      product_type: String(item.product_type || ''),
      ...computeStockRow(Number(item.closing_balance || 0), 0, 0),
    }));
  }, [dealerId]);

  const loadRows = useCallback(async (cat: StockCategory, date: string) => {
    if (!dealerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_inventory_lines')
        .select('id, dealer_id, category, serial_no, product_type, opening_balance, receipts, total, sales, closing_balance, report_date, report_month')
        .eq('dealer_id', dealerId)
        .eq('category', cat)
        .eq('report_date', date)
        .order('serial_no');

      if (error) throw error;
      setRows(data?.length ? data as StockInventoryLine[] : await buildRowsFromPreviousClosing(cat, date));
    } catch (error) {
      console.error(error);
      setRows([emptyInventoryRow(1, cat, date)]);
    } finally {
      setLoading(false);
    }
  }, [buildRowsFromPreviousClosing, dealerId]);

  const loadAllocation = useCallback(async () => {
    if (!dealerId) return;
    const [allocationRows, dealerRow] = await Promise.all([
      fetchDealerFertilizerAllocation(dealerId).catch(() => []),
      supabase.from('dealers').select('ifms_id').eq('id', dealerId).maybeSingle(),
    ]);
    setAllocation(allocationRows);
    setDealerIfmsId(String(dealerRow.data?.ifms_id || ''));
  }, [dealerId]);

  const loadDealerReceipts = useCallback(async () => {
    if (!dealerId) return;
    const { data, error } = await supabase
      .from('dealer_stock_allocation')
      .select('id, dealer_id, fertilizer_type, quantity_mts, quantity_unit, quantity_bags, wholesaler_name, invoice_number, invoice_date, last_updated, created_at')
      .eq('dealer_id', dealerId)
      .order('invoice_date', { ascending: false, nullsFirst: false })
      .order('last_updated', { ascending: false })
      .range(0, 999);

    if (error) {
      console.error(error);
      setDealerReceipts([]);
      return;
    }
    setDealerReceipts((data || []) as DealerReceipt[]);
  }, [dealerId]);

  useEffect(() => {
    if (!dealerId) return;
    void loadRecentDates(category);
    void loadRows(category, reportDate);
    void loadAllocation();
    void loadDealerReceipts();
  }, [dealerId, category, reportDate, loadAllocation, loadDealerReceipts, loadRecentDates, loadRows]);

  const types = productTypesForCategory(category);
  const isToday = reportDate === currentReportDate();

  const toDisplayQuantity = (valueMts: number, productType: string) => {
    if (!isFertilizer || fertilizerQtyUnit === 'mts') return Number(valueMts) || 0;
    return (Number(valueMts) || 0) / fertilizerBagWeightMts(productType);
  };

  const fromDisplayQuantity = (value: number, productType: string) => {
    if (!isFertilizer || fertilizerQtyUnit === 'mts') return Number(value) || 0;
    return (Number(value) || 0) * fertilizerBagWeightMts(productType);
  };

  const formatDisplayQuantity = (valueMts: number, productType: string) =>
    isFertilizer && fertilizerQtyUnit === 'bags'
      ? formatFertilizerQuantity(valueMts, productType, 'bags')
      : (Number(valueMts) || 0).toFixed(2);

  const filteredDealerReceipts = dealerReceipts.filter((item) => {
    const search = receiptSearch.trim().toLowerCase();
    const invoiceDate = item.invoice_date || '';
    return (
      (!search ||
        item.fertilizer_type.toLowerCase().includes(search) ||
        (item.invoice_number || '').toLowerCase().includes(search) ||
        (item.wholesaler_name || '').toLowerCase().includes(search) ||
        invoiceDate.includes(search)) &&
      (!receiptFromDate || invoiceDate >= receiptFromDate) &&
      (!receiptToDate || invoiceDate <= receiptToDate)
    );
  });

  const dailyReceiptTotal = dealerReceipts
    .filter((item) => item.invoice_date === reportDate)
    .reduce((sum, item) => sum + Number(item.quantity_mts || 0), 0);
  const dailySalesTotal = rows.reduce((sum, row) => sum + Number(row.sales || 0), 0);
  const dailyEntryReceiptsTotal = rows.reduce((sum, row) => sum + Number(row.receipts || 0), 0);

  const resetReceiptFilters = () => {
    setReceiptSearch('');
    setReceiptFromDate('');
    setReceiptToDate('');
  };

  const exportDealerData = () => {
    if (!filteredDealerReceipts.length && !rows.length) return;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(filteredDealerReceipts.map((item, index) => ({
        'S.No': index + 1,
        Dealer: dealerName || '',
        Fertilizer: item.fertilizer_type,
        'Receipts (MT)': Number(item.quantity_mts || 0),
        Bags: Number(item.quantity_bags || 0),
        Wholesaler: item.wholesaler_name || '',
        'Invoice No.': item.invoice_number || '',
        'Invoice Date': item.invoice_date || '',
      }))),
      'Receipts'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows.map((row, index) => ({
        'S.No': index + 1,
        Date: reportDate,
        Category: category,
        Type: row.product_type,
        Opening: Number(row.opening_balance || 0),
        Receipts: Number(row.receipts || 0),
        Total: Number(row.total || 0),
        Sales: Number(row.sales || 0),
        Closing: Number(row.closing_balance || 0),
      }))),
      'Daily Stock'
    );
    XLSX.writeFile(workbook, `dealer-fertilizer-data-${reportDate}.xlsx`);
  };

  const updateRow = (index: number, patch: Partial<StockInventoryLine>) => {
    setRows((current) =>
      current.map((row, i) => {
        if (i !== index) return row;
        const merged = { ...row, ...patch };
        return { ...merged, ...computeStockRow(merged.opening_balance, merged.receipts, merged.sales) };
      })
    );
  };

  const addRow = () => setRows((current) => [...current, emptyInventoryRow(current.length + 1, category, reportDate)]);

  const removeRow = (index: number) => {
    setRows((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length ? next.map((row, i) => ({ ...row, serial_no: i + 1 })) : [emptyInventoryRow(1, category, reportDate)];
    });
  };

  const applyYesterdayClosingAsOpening = async () => {
    setRows(await buildRowsFromPreviousClosing(category, reportDate));
  };

  const handleSaveDailyEntry = async () => {
    if (!dealerId) return;
    setSaving(true);
    try {
      await supabase
        .from('stock_inventory_lines')
        .delete()
        .eq('dealer_id', dealerId)
        .eq('category', category)
        .eq('report_date', reportDate);

      const payload = rows.map((row, index) => {
        const computed = computeStockRow(row.opening_balance, row.receipts, row.sales);
        return {
          dealer_id: dealerId,
          category,
          serial_no: index + 1,
          product_type: row.product_type,
          opening_balance: computed.opening_balance,
          receipts: computed.receipts,
          total: computed.total,
          sales: computed.sales,
          closing_balance: computed.closing_balance,
          report_date: reportDate,
          report_month: reportDateToMonth(reportDate),
          submitted_by: user?.email || '',
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('stock_inventory_lines').insert(payload);
      if (error) throw error;
      setMessage(`Daily stock saved for ${formatReportDateLabel(reportDate, dateLocale)}.`);
      await loadRecentDates(category);
      await loadRows(category, reportDate);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Save failed';
      alert(`Could not save: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLoad = async () => {
    if (!dealerId) return;
    const fertilizerType = loadForm.fertilizer_type;
    const loadMts = fertilizerQtyUnit === 'bags'
      ? (Number(loadForm.quantity) || 0) * fertilizerBagWeightMts(fertilizerType)
      : Number(loadForm.quantity) || 0;

    const wholesalerName =
      loadForm.wholesaler_name === 'Others provide description'
        ? loadForm.wholesaler_description.trim()
        : loadForm.wholesaler_name;

    if (!wholesalerName || !loadForm.invoice_number.trim() || loadMts <= 0) {
      alert('Enter wholesaler, invoice number and valid quantity.');
      return;
    }

    setSaving(true);
    try {
      await upsertDealerStockAllocation({
        dealer_id: dealerId,
        fertilizer_type: fertilizerType,
        quantity_mts: loadMts,
        wholesaler_name: wholesalerName,
        invoice_number: loadForm.invoice_number.trim(),
        invoice_date: loadForm.invoice_date,
        quantity_unit: fertilizerQtyUnit === 'bags' ? 'Bags' : 'MT',
        quantity_bags: fertilizerQtyUnit === 'bags'
          ? Number(loadForm.quantity) || 0
          : loadMts / fertilizerBagWeightMts(fertilizerType),
      });
      setMessage(`${fertilizerType} Fertilizer Receipt saved.`);
      setLoadForm((current) => ({ ...current, invoice_number: '', quantity: 0 }));
      await loadAllocation();
      await loadDealerReceipts();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save load';
      alert(`Could not save load: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (!dealerId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {t('Dealer account not linked. Please sign in with your registered phone number.', 'Dealer account not linked. Please sign in with your registered phone number.')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-950 dark:text-white">
            <PackageCheck className="h-7 w-7 text-emerald-600" />
            Daily Stock Entry
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {dealerIfmsId && (
              <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-black tracking-wide text-white dark:bg-white dark:text-slate-950">
                IFMS ID: {dealerIfmsId}
              </span>
            )}
          </div>
        </div>
        {isFertilizer && (
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">
            Unit
            <select
              value={fertilizerQtyUnit}
              onChange={(event) => setFertilizerQtyUnit(event.target.value as FertilizerUnit)}
              className="bg-transparent font-black text-slate-950 outline-none dark:text-white"
            >
              <option value="mts">MT</option>
              <option value="bags">Bags</option>
            </select>
          </label>
        )}
      </div>

      <div className="rounded-xl border border-red-100 bg-white p-4 text-center shadow-sm shadow-red-100/70 dark:border-red-900/60 dark:bg-slate-900">
        <p className="text-2xl font-black text-red-700 md:text-3xl">{dealerName || 'Dealer Firm'}</p>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <SectionButton
          active={activeSection === 'receipts'}
          title="Fertilizer Receipts"
          subtitle="Invoice-wise receipt entry and receipt list"
          tone="red"
          onClick={() => setActiveSection('receipts')}
        />
        <SectionButton
          active={activeSection === 'sales'}
          title="Daily Stock / Sales"
          subtitle="Opening, receipts, sales and closing entry"
          tone="emerald"
          onClick={() => setActiveSection('sales')}
        />
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Receipt invoices today" value={`${dailyReceiptTotal.toFixed(2)} MT`} tone="emerald" />
        <SummaryCard label="Daily entry receipts" value={`${dailyEntryReceiptsTotal.toFixed(2)} MT`} tone="sky" />
        <SummaryCard label="Daily sales" value={`${dailySalesTotal.toFixed(2)} MT`} tone="amber" />
        <button
          type="button"
          onClick={exportDealerData}
          className="inline-flex min-h-24 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300"
        >
          <Download className="h-5 w-5" />
          Export Excel
        </button>
      </section>

      {activeSection === 'receipts' && (
        <section className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm dark:border-red-900/70 dark:bg-slate-900">
          <div className="flex w-full items-center justify-between gap-3 bg-red-50 p-3 text-left text-red-900 dark:bg-red-950/30 dark:text-red-100">
            <span className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <span className="text-sm font-black text-red-700 dark:text-red-200">Fertilizer Receipts</span>
            </span>
          </div>
          <div className="p-3">
              <div className="grid gap-2 md:grid-cols-3">
                <CompactSelect
                  label="Fertilizer Type"
                  value={loadForm.fertilizer_type}
                  onChange={(value) => setLoadForm({ ...loadForm, fertilizer_type: value })}
                  options={[...FERTILIZER_TYPES]}
                />
                <CompactSelect
                  label="Wholesaler"
                  value={loadForm.wholesaler_name}
                  onChange={(value) => setLoadForm({ ...loadForm, wholesaler_name: value, wholesaler_description: '' })}
                  options={wholesalerOptions}
                />
                {loadForm.wholesaler_name === 'Others provide description' && (
                  <CompactInput
                    label="Wholesaler Description"
                    value={loadForm.wholesaler_description}
                    onChange={(value) => setLoadForm({ ...loadForm, wholesaler_description: value })}
                  />
                )}
                <CompactInput
                  label="Invoice No."
                  value={loadForm.invoice_number}
                  onChange={(value) => setLoadForm({ ...loadForm, invoice_number: value })}
                />
                <CompactInput
                  label="Date"
                  type="date"
                  value={loadForm.invoice_date}
                  onChange={(value) => setLoadForm({ ...loadForm, invoice_date: value })}
                />
                <CompactInput
                  label={`Quantity (${qtyUnit})`}
                  type="number"
                  value={String(loadForm.quantity)}
                  onChange={(value) => setLoadForm({ ...loadForm, quantity: Number(value) || 0 })}
                />
                <div className="rounded-lg bg-white/75 p-2 dark:bg-slate-950/30">
                  <p className="text-[10px] font-black uppercase text-red-700 dark:text-red-200">Current Balance</p>
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {Number(allocation.find((item) => item.fertilizer_type === loadForm.fertilizer_type)?.quantity_mts || 0).toFixed(2)} MT
                  </p>
                  <p className="text-xs font-bold text-red-700 dark:text-red-200">
                    {formatFertilizerQuantity(
                      Number(allocation.find((item) => item.fertilizer_type === loadForm.fertilizer_type)?.quantity_mts || 0),
                      loadForm.fertilizer_type,
                      'bags'
                    )} Bags
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold text-red-800 dark:text-red-200">
                  Receipt unit follows the selected page unit: {qtyUnit}. Converted MT: {
                    (fertilizerQtyUnit === 'bags'
                      ? (Number(loadForm.quantity) || 0) * fertilizerBagWeightMts(loadForm.fertilizer_type)
                      : Number(loadForm.quantity) || 0
                    ).toFixed(2)
                  }
                </p>
                <button
                  type="button"
                  onClick={handleSaveLoad}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-700 px-3 py-2 text-xs font-black text-white hover:bg-red-800 disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Receipt
                </button>
              </div>
            </div>
        </section>
      )}

      {activeSection === 'receipts' && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-black text-slate-950 dark:text-white">
                  <Truck className="h-5 w-5 text-red-600" />
                  My Fertilizer Receipts
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Showing only receipts saved for this dealer login.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={receiptSearch}
                    onChange={(event) => setReceiptSearch(event.target.value)}
                    placeholder="Search invoice, fertilizer, wholesaler"
                    className="w-64 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <input
                  type="date"
                  value={receiptFromDate}
                  onChange={(event) => setReceiptFromDate(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="date"
                  value={receiptToDate}
                  onChange={(event) => setReceiptToDate(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={resetReceiptFilters}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-900 text-xs uppercase text-white">
                <tr>
                  <th className="px-4 py-3 text-left">S.No</th>
                  <th className="px-4 py-3 text-left">Fertilizer</th>
                  <th className="px-4 py-3 text-right">Receipts (MT)</th>
                  <th className="px-4 py-3 text-right">Bags</th>
                  <th className="px-4 py-3 text-left">Wholesaler</th>
                  <th className="px-4 py-3 text-left">Invoice No.</th>
                  <th className="px-4 py-3 text-left">Invoice Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDealerReceipts.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-bold">{index + 1}</td>
                    <td className="px-4 py-3 font-black text-slate-950 dark:text-white">{item.fertilizer_type}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-300">
                      {Number(item.quantity_mts || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">{Number(item.quantity_bags || 0).toFixed(0)}</td>
                    <td className="px-4 py-3">{item.wholesaler_name || '-'}</td>
                    <td className="px-4 py-3">{item.invoice_number || '-'}</td>
                    <td className="px-4 py-3">{item.invoice_date || '-'}</td>
                  </tr>
                ))}
                {filteredDealerReceipts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No receipts match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeSection === 'sales' && (
        <>
          <div className="portal-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <button type="button" onClick={() => setReportDate(shiftReportDate(reportDate, -1))} className="rounded-lg border border-slate-300 p-2 dark:border-slate-600">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={reportDate}
                max={currentReportDate()}
                onChange={(event) => setReportDate(event.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <button type="button" onClick={() => setReportDate(shiftReportDate(reportDate, 1))} disabled={reportDate >= currentReportDate()} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40 dark:border-slate-600">
                <ChevronRight className="h-4 w-4" />
              </button>
              {!isToday && (
                <button type="button" onClick={() => setReportDate(currentReportDate())} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                  Today
                </button>
              )}
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              {formatReportDateLabel(reportDate, dateLocale)}
              {recentDates.includes(reportDate) && <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">Saved</span>}
            </p>
          </div>

          {loading ? (
            <div className="flex h-36 items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">S.No</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Opening{qtyUnit ? ` (${qtyUnit})` : ''}</th>
                      <th className="px-3 py-2 text-left">Receipts{qtyUnit ? ` (${qtyUnit})` : ''}</th>
                      <th className="px-3 py-2 text-left">Total{qtyUnit ? ` (${qtyUnit})` : ''}</th>
                      <th className="px-3 py-2 text-left">Sales{qtyUnit ? ` (${qtyUnit})` : ''}</th>
                      <th className="px-3 py-2 text-left">Closing{qtyUnit ? ` (${qtyUnit})` : ''}</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((row, index) => (
                      <tr key={row.id || `${reportDate}-${index}`}>
                        <td className="px-3 py-2 font-bold">{index + 1}</td>
                        <td className="px-3 py-2">
                          <select value={row.product_type} onChange={(event) => updateRow(index, { product_type: event.target.value })} className="w-full min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                            {types.map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </td>
                        <QuantityCell value={toDisplayQuantity(row.opening_balance, row.product_type)} isBags={isFertilizer && fertilizerQtyUnit === 'bags'} onChange={(value) => updateRow(index, { opening_balance: fromDisplayQuantity(value, row.product_type) })} />
                        <QuantityCell value={toDisplayQuantity(row.receipts, row.product_type)} isBags={isFertilizer && fertilizerQtyUnit === 'bags'} onChange={(value) => updateRow(index, { receipts: fromDisplayQuantity(value, row.product_type) })} />
                        <td className="px-3 py-2 font-bold text-emerald-700 dark:text-emerald-400">{formatDisplayQuantity(row.total, row.product_type)} {qtyUnit}</td>
                        <QuantityCell value={toDisplayQuantity(row.sales, row.product_type)} isBags={isFertilizer && fertilizerQtyUnit === 'bags'} onChange={(value) => updateRow(index, { sales: fromDisplayQuantity(value, row.product_type) })} />
                        <td className="px-3 py-2 font-black text-slate-900 dark:text-white">{formatDisplayQuantity(row.closing_balance, row.product_type)} {qtyUnit}</td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => removeRow(index)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
                <button type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold dark:border-slate-600">
                  <Plus className="h-4 w-4" /> Add row
                </button>
                <button type="button" onClick={applyYesterdayClosingAsOpening} className="inline-flex items-center gap-2 rounded-xl border border-amber-400 px-3 py-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                  <Copy className="h-4 w-4" /> Opening from yesterday
                </button>
                <button type="button" onClick={handleSaveDailyEntry} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save daily entry'}
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'sky' | 'amber' }) {
  const classes = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200',
    sky: 'border-sky-100 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200',
    amber: 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
  }[tone];

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${classes}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function QuantityCell({ value, isBags, onChange }: { value: number; isBags: boolean; onChange: (value: number) => void }) {
  return (
    <td className="px-3 py-2">
      <input
        type="number"
        min={0}
        step={isBags ? '1' : '0.01'}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      />
    </td>
  );
}

function CompactInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type={type}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.01' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-950 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      />
    </label>
  );
}

function CompactSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-950 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
