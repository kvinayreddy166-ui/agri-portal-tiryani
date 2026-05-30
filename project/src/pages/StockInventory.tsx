import React, { useEffect, useMemo, useState } from 'react';
import { FolderOpen, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { STOCK_CATEGORIES, StockCategory, currentReportMonth } from '../lib/stockInventory';
import { syncFertilizerStockTable } from '../lib/fertilizerStock';

interface InventoryRow {
  id: string;
  dealer_id: string;
  category: StockCategory;
  serial_no: number;
  product_type: string;
  opening_balance: number;
  receipts: number;
  total: number;
  sales: number;
  closing_balance: number;
  report_month: string;
  dealers?: { dealer_name: string; location: string; phone_number: string };
}

export function StockInventory() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<StockCategory | 'all'>('all');
  const [reportMonth, setReportMonth] = useState(currentReportMonth());
  const [expandedDealer, setExpandedDealer] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stock_inventory_lines')
        .select('*, dealers(dealer_name, location, phone_number)')
        .eq('report_month', reportMonth)
        .order('serial_no');

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRows((data as InventoryRow[]) || []);
      await syncFertilizerStockTable();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, reportMonth]);

  const grouped = useMemo(() => {
    const map = new Map<string, { dealerName: string; location: string; phone: string; lines: InventoryRow[] }>();
    for (const row of rows) {
      const dealer = row.dealers;
      const key = row.dealer_id;
      if (!map.has(key)) {
        map.set(key, {
          dealerName: dealer?.dealer_name || 'Unknown',
          location: dealer?.location || '',
          phone: dealer?.phone_number || '',
          lines: [],
        });
      }
      map.get(key)!.lines.push(row);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].dealerName.localeCompare(b[1].dealerName));
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black text-slate-950 dark:text-white">
            <FolderOpen className="h-8 w-8 text-emerald-600" />
            {t('Stock Inventory', 'స్టాక్ ఇన్వెంటరీ')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {t('Dealer-submitted stock by category (fertilizer, seed, pesticide).', 'డీలర్లు సమర్పించిన స్టాక్ (ఎరువు, విత్తనం, మందు).')}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-bold"
        >
          <RefreshCw className="h-4 w-4" />
          {t('Refresh', 'రిఫ్రెష్')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          value={reportMonth}
          onChange={(e) => setReportMonth(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-800"
        />
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-100'}`}
        >
          {t('All', 'అన్నీ')}
        </button>
        {STOCK_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              category === item.id ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800'
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
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          {t('No dealer stock submitted for this month yet.', 'ఈ నెలకు ఇంకా డీలర్ స్టాక్ సమర్పించలేదు.')}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dealerId, group]) => {
            const open = expandedDealer === dealerId;
            return (
              <section key={dealerId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setExpandedDealer(open ? null : dealerId)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{group.dealerName}</p>
                    <p className="text-sm text-slate-500">
                      {group.location} · {group.phone} · {group.lines.length} {t('rows', 'వరుసలు')}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {open ? t('Close', 'మూసివేయి') : t('Open folder', 'ఫోల్డర్ తెరవండి')}
                  </span>
                </button>
                {open && (
                  <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full min-w-[800px] text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-2 text-left">{t('S.No', 'క్ర.సం.')}</th>
                          <th className="px-4 py-2 text-left">{t('Category', 'వర్గం')}</th>
                          <th className="px-4 py-2 text-left">{t('Type', 'రకం')}</th>
                          <th className="px-4 py-2 text-right">{t('Opening', 'ప్రారంభ')}</th>
                          <th className="px-4 py-2 text-right">{t('Receipts', 'రసీదులు')}</th>
                          <th className="px-4 py-2 text-right">{t('Total', 'మొత్తం')}</th>
                          <th className="px-4 py-2 text-right">{t('Sales', 'అమ్మకాలు')}</th>
                          <th className="px-4 py-2 text-right">{t('Closing', 'మిగిలిన')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {group.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-4 py-2">{line.serial_no}</td>
                            <td className="px-4 py-2 capitalize">{line.category}</td>
                            <td className="px-4 py-2 font-semibold">{line.product_type}</td>
                            <td className="px-4 py-2 text-right">{Number(line.opening_balance).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{Number(line.receipts).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-bold">{Number(line.total).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{Number(line.sales).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-black text-emerald-700">
                              {Number(line.closing_balance).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
