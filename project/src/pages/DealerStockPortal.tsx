import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PackageCheck, Plus, ReceiptText, Save, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FERTILIZER_TYPES } from '../lib/constants';
import { upsertDealerStockAllocation } from '../lib/dealerStockAllocation';
import { fetchDealerFertilizerAllocation } from '../lib/fertilizerStock';
import { fertilizerBagWeightMts, formatFertilizerQuantity } from '../lib/stockInventory';
import { supabase } from '../lib/supabase';

const wholesalerOptions = [
  'MARKFED',
  'IFFCO',
  'KRIBHCO',
  'Coromandel',
  'NFL',
  'RCF',
  'Nagarjuna Fertilizers',
  'Private Wholesaler',
  'Other',
];

type LoadForm = {
  fertilizer_type: string;
  wholesaler_name: string;
  invoice_number: string;
  invoice_date: string;
  quantity: number;
  quantity_unit: 'MTS' | 'Bags';
};

export function DealerStockPortal() {
  const { dealerId, dealerName } = useAuth();
  const { t } = useLanguage();
  const [allocation, setAllocation] = useState<{ fertilizer_type: string; quantity_mts: number }[]>([]);
  const [dealerIfmsId, setDealerIfmsId] = useState('');
  const [showLoadForm, setShowLoadForm] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<LoadForm>({
    fertilizer_type: 'Urea',
    wholesaler_name: 'MARKFED',
    invoice_number: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    quantity: 0,
    quantity_unit: 'MTS',
  });

  const loadData = useCallback(async () => {
    if (!dealerId) return;
    const [allocationRows, dealerRow] = await Promise.all([
      fetchDealerFertilizerAllocation(dealerId).catch(() => []),
      supabase.from('dealers').select('ifms_id').eq('id', dealerId).maybeSingle(),
    ]);
    setAllocation(allocationRows);
    setDealerIfmsId(String(dealerRow.data?.ifms_id || ''));
  }, [dealerId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const currentMts = useMemo(() => {
    const row = allocation.find((item) => item.fertilizer_type === form.fertilizer_type);
    return Number(row?.quantity_mts || 0);
  }, [allocation, form.fertilizer_type]);

  const loadMts =
    form.quantity_unit === 'Bags'
      ? (Number(form.quantity) || 0) * fertilizerBagWeightMts(form.fertilizer_type)
      : Number(form.quantity) || 0;

  const handleSaveLoad = async () => {
    if (!dealerId) return;
    if (!form.fertilizer_type || !form.wholesaler_name || !form.invoice_number.trim() || loadMts <= 0) {
      alert('Enter wholesaler, invoice number, fertilizer and valid quantity.');
      return;
    }

    setSaving(true);
    try {
      const nextTotalMts = currentMts + loadMts;
      await upsertDealerStockAllocation({
        dealer_id: dealerId,
        fertilizer_type: form.fertilizer_type,
        quantity_mts: nextTotalMts,
        wholesaler_name: form.wholesaler_name,
        invoice_number: form.invoice_number.trim(),
        invoice_date: form.invoice_date,
        quantity_unit: form.quantity_unit,
        quantity_bags:
          form.quantity_unit === 'Bags'
            ? Number(form.quantity) || 0
            : loadMts / fertilizerBagWeightMts(form.fertilizer_type),
      });

      setMessage(`Load added. ${form.fertilizer_type} balance is now ${nextTotalMts.toFixed(2)} MTS.`);
      setForm((current) => ({ ...current, invoice_number: '', quantity: 0 }));
      await loadData();
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
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-950 dark:text-white">
            <PackageCheck className="h-7 w-7 text-emerald-600" />
            {t('Fertilizer Tracking', 'Fertilizer Tracking')}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-base font-black text-slate-900 dark:text-white">{dealerName}</span>
            {dealerIfmsId && (
              <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-black tracking-wide text-white dark:bg-white dark:text-slate-950">
                IFMS ID: {dealerIfmsId}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowLoadForm((current) => !current)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" />
          {showLoadForm ? 'Hide Load' : 'Add Load'}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      )}

      {showLoadForm && (
        <section className="portal-card p-3">
          <div className="mb-2 flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-950 dark:text-white">Load Entry</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <CompactSelect
              label="Fertilizer"
              value={form.fertilizer_type}
              onChange={(value) => setForm({ ...form, fertilizer_type: value })}
              options={[...FERTILIZER_TYPES]}
            />
            <CompactSelect
              label="Wholesaler Name"
              value={form.wholesaler_name}
              onChange={(value) => setForm({ ...form, wholesaler_name: value })}
              options={wholesalerOptions}
            />
            <CompactInput
              label="Invoice Number"
              value={form.invoice_number}
              onChange={(value) => setForm({ ...form, invoice_number: value })}
            />
            <CompactInput
              label="Invoice Date"
              type="date"
              value={form.invoice_date}
              onChange={(value) => setForm({ ...form, invoice_date: value })}
            />
            <CompactInput
              label={`Quantity (${form.quantity_unit})`}
              type="number"
              value={String(form.quantity)}
              onChange={(value) => setForm({ ...form, quantity: Number(value) || 0 })}
            />
            <CompactSelect
              label="Unit"
              value={form.quantity_unit}
              onChange={(value) => setForm({ ...form, quantity_unit: value as 'MTS' | 'Bags' })}
              options={['MTS', 'Bags']}
            />
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Load converts to {loadMts.toFixed(2)} MTS. Bags: Urea 45 kg, others 50 kg.
            </p>
            <button
              type="button"
              onClick={handleSaveLoad}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Load'}
            </button>
          </div>
        </section>
      )}

      <section className="portal-card overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
          <ReceiptText className="h-5 w-5 text-emerald-600" />
          <h2 className="text-sm font-black text-slate-950 dark:text-white">Current Fertilizer Balance</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-5">
          {FERTILIZER_TYPES.map((fertilizer) => {
            const row = allocation.find((item) => item.fertilizer_type === fertilizer);
            const mts = Number(row?.quantity_mts || 0);
            return (
              <div key={fertilizer} className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{fertilizer}</p>
                <p className="text-lg font-black text-slate-950 dark:text-white">{mts.toFixed(2)} MTS</p>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {formatFertilizerQuantity(mts, fertilizer, 'bags')} Bags
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function CompactInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type={type}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.01' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      />
    </label>
  );
}

function CompactSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
