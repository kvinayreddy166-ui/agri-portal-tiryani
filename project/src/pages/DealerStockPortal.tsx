import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Copy, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  STOCK_CATEGORIES,
  StockCategory,
  StockInventoryLine,
  computeStockRow,
  currentReportDate,
  emptyInventoryRow,
  formatReportDateLabel,
  productTypesForCategory,
  reportDateToMonth,
  shiftReportDate,
} from '../lib/stockInventory';
import { fetchDealerFertilizerAllocation } from '../lib/fertilizerStock';

export function DealerStockPortal() {
  const { dealerId, dealerName, user } = useAuth();
  const { language, t } = useLanguage();
  const [category, setCategory] = useState<StockCategory>('fertilizer');
  const [reportDate, setReportDate] = useState(currentReportDate());
  const [rows, setRows] = useState<StockInventoryLine[]>([emptyInventoryRow(1, 'fertilizer')]);
  const [recentDates, setRecentDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fertilizerAllocationMts, setFertilizerAllocationMts] = useState<
    { fertilizer_type: string; quantity_mts: number }[]
  >([]);
  const isFertilizer = category === 'fertilizer';
  const qtyUnit = isFertilizer ? 'MTS' : '';
  const dateLocale = language === 'te' ? 'te-IN' : 'en-IN';

  useEffect(() => {
    if (!dealerId) return;
    loadRecentDates(category);
    if (category === 'fertilizer') {
      fetchDealerFertilizerAllocation(dealerId)
        .then(setFertilizerAllocationMts)
        .catch(() => setFertilizerAllocationMts([]));
    } else {
      setFertilizerAllocationMts([]);
    }
  }, [dealerId, category]);

  useEffect(() => {
    if (!dealerId) return;
    loadRows(category, reportDate);
  }, [dealerId, category, reportDate]);

  const loadRecentDates = async (cat: StockCategory) => {
    if (!dealerId) return;
    const { data } = await supabase
      .from('stock_inventory_lines')
      .select('report_date')
      .eq('dealer_id', dealerId)
      .eq('category', cat)
      .order('report_date', { ascending: false })
      .limit(30);

    const unique = [...new Set((data || []).map((r) => r.report_date as string))];
    setRecentDates(unique);
  };

  const loadRows = async (cat: StockCategory, date: string) => {
    if (!dealerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_inventory_lines')
        .select('*')
        .eq('dealer_id', dealerId)
        .eq('category', cat)
        .eq('report_date', date)
        .order('serial_no');

      if (error) throw error;

      if (data?.length) {
        setRows(data as StockInventoryLine[]);
      } else {
        setRows([emptyInventoryRow(1, cat, date)]);
      }
    } catch (err) {
      console.error(err);
      setRows([emptyInventoryRow(1, cat, date)]);
    } finally {
      setLoading(false);
    }
  };

  const applyYesterdayClosingAsOpening = async () => {
    if (!dealerId) return;
    const prevDate = shiftReportDate(reportDate, -1);
    const { data } = await supabase
      .from('stock_inventory_lines')
      .select('product_type, closing_balance')
      .eq('dealer_id', dealerId)
      .eq('category', category)
      .eq('report_date', prevDate);

    if (!data?.length) {
      alert(
        t(
          `No entry found for ${formatReportDateLabel(prevDate, dateLocale)}.`,
          `${formatReportDateLabel(prevDate, dateLocale)} నాటికి ఎంట్రీ లేదు.`
        )
      );
      return;
    }

    const closingMap = new Map(data.map((r) => [r.product_type, Number(r.closing_balance || 0)]));
    setRows((current) =>
      current.map((row) => {
        const opening = closingMap.get(row.product_type) ?? row.opening_balance;
        const computed = computeStockRow(opening, row.receipts, row.sales);
        return { ...row, ...computed };
      })
    );
  };

  const updateRow = (index: number, patch: Partial<StockInventoryLine>) => {
    setRows((current) =>
      current.map((row, i) => {
        if (i !== index) return row;
        const merged = { ...row, ...patch };
        const computed = computeStockRow(merged.opening_balance, merged.receipts, merged.sales);
        return { ...merged, ...computed };
      })
    );
  };

  const addRow = () => {
    setRows((current) => [...current, emptyInventoryRow(current.length + 1, category, reportDate)]);
  };

  const removeRow = (index: number) => {
    setRows((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length
        ? next.map((row, i) => ({ ...row, serial_no: i + 1 }))
        : [emptyInventoryRow(1, category, reportDate)];
    });
  };

  const handleSave = async () => {
    if (!dealerId) return;
    setSaving(true);
    try {
      await supabase
        .from('stock_inventory_lines')
        .delete()
        .eq('dealer_id', dealerId)
        .eq('category', category)
        .eq('report_date', reportDate);

      const month = reportDateToMonth(reportDate);
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
          report_month: month,
          submitted_by: user?.email || '',
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('stock_inventory_lines').insert(payload);
      if (error) throw error;

      alert(
        t(
          `Daily stock saved for ${formatReportDateLabel(reportDate, dateLocale)}.`,
          `${formatReportDateLabel(reportDate, dateLocale)} నాటి స్టాక్ సేవ్ అయింది.`
        )
      );
      await loadRecentDates(category);
      loadRows(category, reportDate);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      alert(t(`Could not save: ${msg}`, `సేవ్ చేయలేకపోయాం: ${msg}`));
    } finally {
      setSaving(false);
    }
  };

  const types = productTypesForCategory(category);
  const isToday = reportDate === currentReportDate();

  if (!dealerId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {t('Dealer account not linked. Please sign in with your registered phone number.', 'డీలర్ ఖాతా లింక్ కాలేదు. నమోదైన ఫోన్ నంబర్‌తో లాగిన్ అవండి.')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">
          {t('Daily Stock Entry', 'రోజువారీ స్టాక్ ఎంట్రీ')}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {dealerName} · {t('Submit stock every day', 'ప్రతి రోజు స్టాక్ సమర్పించండి')}
        </p>
      </div>

      {isFertilizer && fertilizerAllocationMts.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
            {t('Your fertilizer allocation (Fertilizer Allocation)', 'మీ ఎరువుల కేటాయింపు (ఎరువుల కేటాయింపు)')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {fertilizerAllocationMts.map((item) => (
              <span
                key={item.fertilizer_type}
                className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm dark:bg-slate-900 dark:text-white"
              >
                {item.fertilizer_type}: {item.quantity_mts.toFixed(2)} MTS
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="portal-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {t('Entry date', 'ఎంట్రీ తేదీ')}
          </label>
          <button
            type="button"
            onClick={() => setReportDate(shiftReportDate(reportDate, -1))}
            className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="date"
            value={reportDate}
            max={currentReportDate()}
            onChange={(e) => setReportDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setReportDate(shiftReportDate(reportDate, 1))}
            disabled={reportDate >= currentReportDate()}
            className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setReportDate(currentReportDate())}
              className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
            >
              {t('Today', 'ఈ రోజు')}
            </button>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {formatReportDateLabel(reportDate, dateLocale)}
          {recentDates.includes(reportDate) && (
            <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
              {t('Saved', 'సేవ్')}
            </span>
          )}
        </p>
      </div>

      {recentDates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-bold uppercase text-slate-500">{t('Recent days', 'ఇటీవలి రోజులు')}:</span>
          {recentDates.slice(0, 14).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setReportDate(d)}
              className={`rounded-lg px-3 py-1 text-xs font-bold ${
                d === reportDate
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {isFertilizer && (
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t('All quantities below are in MTS (Metric Tons).', 'క్రింది అన్ని మోతాదులు MTS (మెట్రిక్ టన్నులు).')}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {STOCK_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={`rounded-2xl border p-4 text-left font-bold transition ${
              category === item.id
                ? 'border-emerald-400 bg-emerald-700 text-white shadow-lg'
                : 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
            }`}
          >
            {t(item.label, item.telugu)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-3 py-3 text-left">{t('S.No', 'క్ర.సం.')}</th>
                  <th className="px-3 py-3 text-left">{t('Type', 'రకం')}</th>
                  <th className="px-3 py-3 text-left">
                    {t('Opening', 'ప్రారంభ')}
                    {qtyUnit ? ` (${qtyUnit})` : ''}
                  </th>
                  <th className="px-3 py-3 text-left">
                    {t('Receipts', 'రసీదులు')}
                    {qtyUnit ? ` (${qtyUnit})` : ''}
                  </th>
                  <th className="px-3 py-3 text-left">
                    {t('Total', 'మొత్తం')}
                    {qtyUnit ? ` (${qtyUnit})` : ''}
                  </th>
                  <th className="px-3 py-3 text-left">
                    {t('Sales', 'అమ్మకాలు')}
                    {qtyUnit ? ` (${qtyUnit})` : ''}
                  </th>
                  <th className="px-3 py-3 text-left">
                    {t('Closing', 'మిగిలిన')}
                    {qtyUnit ? ` (${qtyUnit})` : ''}
                  </th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row, index) => (
                  <tr key={row.id || `${reportDate}-${index}`}>
                    <td className="px-3 py-2 font-bold">{index + 1}</td>
                    <td className="px-3 py-2">
                      <select
                        value={row.product_type}
                        onChange={(e) => updateRow(index, { product_type: e.target.value })}
                        className="w-full min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      >
                        {types.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.opening_balance}
                        onChange={(e) =>
                          updateRow(index, { opening_balance: parseFloat(e.target.value) || 0 })
                        }
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.receipts}
                        onChange={(e) => updateRow(index, { receipts: parseFloat(e.target.value) || 0 })}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2 font-bold text-emerald-700 dark:text-emerald-400">
                      {row.total.toFixed(2)}
                      {qtyUnit ? ` ${qtyUnit}` : ''}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.sales}
                        onChange={(e) => updateRow(index, { sales: parseFloat(e.target.value) || 0 })}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2 font-black text-slate-900 dark:text-white">
                      {row.closing_balance.toFixed(2)}
                      {qtyUnit ? ` ${qtyUnit}` : ''}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-bold dark:border-slate-600"
            >
              <Plus className="h-4 w-4" />
              {t('Add row', 'వరుస జోడించు')}
            </button>
            <button
              type="button"
              onClick={applyYesterdayClosingAsOpening}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400 px-4 py-2 font-bold text-amber-900 dark:text-amber-200"
            >
              <Copy className="h-4 w-4" />
              {t('Opening from yesterday', 'నిన్నటి మిగిలినది ప్రారంభంగా')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? t('Saving…', 'సేవ్…') : t('Save daily entry', 'రోజువారీ ఎంట్రీ సేవ్')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
