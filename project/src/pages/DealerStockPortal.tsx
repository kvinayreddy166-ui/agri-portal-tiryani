import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  STOCK_CATEGORIES,
  StockCategory,
  StockInventoryLine,
  computeStockRow,
  currentReportMonth,
  emptyInventoryRow,
  productTypesForCategory,
} from '../lib/stockInventory';
import { syncFertilizerStockTable } from '../lib/fertilizerStock';

export function DealerStockPortal() {
  const { dealerId, dealerName, user } = useAuth();
  const { t } = useLanguage();
  const [category, setCategory] = useState<StockCategory>('fertilizer');
  const [rows, setRows] = useState<StockInventoryLine[]>([emptyInventoryRow(1, 'fertilizer')]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const reportMonth = currentReportMonth();

  useEffect(() => {
    if (!dealerId) return;
    loadRows(category);
  }, [dealerId, category]);

  const loadRows = async (cat: StockCategory) => {
    if (!dealerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_inventory_lines')
        .select('*')
        .eq('dealer_id', dealerId)
        .eq('category', cat)
        .eq('report_month', reportMonth)
        .order('serial_no');

      if (error) throw error;

      if (data?.length) {
        setRows(data);
      } else {
        setRows([emptyInventoryRow(1, cat)]);
      }
    } catch (err) {
      console.error(err);
      setRows([emptyInventoryRow(1, cat)]);
    } finally {
      setLoading(false);
    }
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
    setRows((current) => [...current, emptyInventoryRow(current.length + 1, category)]);
  };

  const removeRow = (index: number) => {
    setRows((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length ? next.map((row, i) => ({ ...row, serial_no: i + 1 })) : [emptyInventoryRow(1, category)];
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
        .eq('report_month', reportMonth);

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
          report_month: reportMonth,
          submitted_by: user?.email || '',
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('stock_inventory_lines').insert(payload);
      if (error) throw error;

      if (category === 'fertilizer') {
        await syncFertilizerStockTable();
      }

      alert(t('Stock saved successfully.', 'స్టాక్ విజయవంతంగా సేవ్ అయింది.'));
      loadRows(category);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      alert(t(`Could not save: ${msg}`, `సేవ్ చేయలేకపోయాం: ${msg}`));
    } finally {
      setSaving(false);
    }
  };

  const types = productTypesForCategory(category);

  if (!dealerId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        {t('Dealer account not linked. Please sign in with your registered phone number.', 'డీలర్ ఖాతా లింక్ కాలేదు. నమోదైన ఫోన్ నంబర్‌తో లాగిన్ అవండి.')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">
          {t('My Stock Entry', 'నా స్టాక్ ఎంట్రీ')}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {dealerName} · {t('Month', 'నెల')}: {reportMonth}
        </p>
      </div>

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
                  <th className="px-3 py-3 text-left">{t('Opening', 'ప్రారంభ')}</th>
                  <th className="px-3 py-3 text-left">{t('Receipts', 'రసీదులు')}</th>
                  <th className="px-3 py-3 text-left">{t('Total', 'మొత్తం')}</th>
                  <th className="px-3 py-3 text-left">{t('Sales', 'అమ్మకాలు')}</th>
                  <th className="px-3 py-3 text-left">{t('Closing', 'మిగిలిన')}</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row, index) => (
                  <tr key={row.id || index}>
                    <td className="px-3 py-2 font-bold">{index + 1}</td>
                    <td className="px-3 py-2">
                      <select
                        value={row.product_type}
                        onChange={(e) => updateRow(index, { product_type: e.target.value })}
                        className="w-full min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                      >
                        {types.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.opening_balance}
                        onChange={(e) => updateRow(index, { opening_balance: parseFloat(e.target.value) || 0 })}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.receipts}
                        onChange={(e) => updateRow(index, { receipts: parseFloat(e.target.value) || 0 })}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                      />
                    </td>
                    <td className="px-3 py-2 font-bold text-emerald-700">{row.total.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.sales}
                        onChange={(e) => updateRow(index, { sales: parseFloat(e.target.value) || 0 })}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                      />
                    </td>
                    <td className="px-3 py-2 font-black">{row.closing_balance.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeRow(index)} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
            <button type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-bold">
              <Plus className="h-4 w-4" />
              {t('Add row', 'వరుస జోడించు')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? t('Saving…', 'సేవ్…') : t('Submit stock', 'స్టాక్ సమర్పించు')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
