import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, FolderOpen, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { FERTILIZER_TYPES } from '../lib/constants';
import {
  STOCK_CATEGORIES,
  StockCategory,
  currentReportDate,
  formatFertilizerQuantity,
  formatReportDateLabel,
} from '../lib/stockInventory';

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
  report_date: string;
  report_month: string;
  dealers?: { dealer_name: string; location: string; phone_number: string };
}

export function StockInventory() {
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<StockCategory | 'all'>('all');
  const [reportDate, setReportDate] = useState(currentReportDate());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [reportMonth, setReportMonth] = useState(reportDate.slice(0, 7));
  const [expandedDealer, setExpandedDealer] = useState<string | null>(null);
  const [fertilizerQtyUnit, setFertilizerQtyUnit] = useState<'mts' | 'bags'>('mts');
  const [fertilizerFilter, setFertilizerFilter] = useState('all');
  const dateLocale = language === 'te' ? 'te-IN' : 'en-IN';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stock_inventory_lines')
        .select('*, dealers(dealer_name, location, phone_number)')
        .order('report_date', { ascending: false })
        .order('serial_no');

      if (viewMode === 'day') {
        query = query.eq('report_date', reportDate);
      } else {
        query = query.eq('report_month', reportMonth);
      }

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRows((data as InventoryRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, reportDate, reportMonth, viewMode]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    if (fertilizerFilter === 'all') return rows;
    return rows.filter((row) => row.category !== 'fertilizer' || row.product_type === fertilizerFilter);
  }, [fertilizerFilter, rows]);

  const fertilizerSummary = useMemo(() => {
    return FERTILIZER_TYPES.map((fertilizer) => {
      const lines = rows.filter((row) => row.category === 'fertilizer' && row.product_type === fertilizer);
      return {
        fertilizer,
        sales: lines.reduce((sum, row) => sum + Number(row.sales || 0), 0),
        closing: lines.reduce((sum, row) => sum + Number(row.closing_balance || 0), 0),
      };
    });
  }, [rows]);

  const highestFertilizerValue = Math.max(
    ...fertilizerSummary.flatMap((item) => [item.sales, item.closing]),
    1
  );

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { dealerName: string; location: string; phone: string; lines: InventoryRow[] }
    >();
    for (const row of filteredRows) {
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
  }, [filteredRows]);

  const formatQuantity = (line: InventoryRow, value: number) => {
    if (line.category !== 'fertilizer') return Number(value || 0).toFixed(2);
    return formatFertilizerQuantity(value, line.product_type, fertilizerQtyUnit);
  };

  const unitLabelForLine = (line: InventoryRow) => {
    if (line.category !== 'fertilizer') return '';
    return fertilizerQtyUnit === 'bags' ? 'Bags' : 'MTS';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black text-slate-950 dark:text-white">
            <FolderOpen className="h-8 w-8 text-emerald-600" />
            {t('Dealer Daily Stock', 'డీలర్ రోజువారీ స్టాక్')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {t(
              'View dealer daily stock submissions (fertilizer, seed, pesticide).',
              'డీలర్ల రోజువారీ స్టాక్ సమర్పణలు (ఎరువు, విత్తనం, మందు).'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-bold dark:border-slate-600"
        >
          <RefreshCw className="h-4 w-4" />
          {t('Refresh', 'రిఫ్రెష్')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setViewMode('day')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            viewMode === 'day' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {t('By day', 'రోజు వారీగా')}
        </button>
        <button
          type="button"
          onClick={() => setViewMode('month')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            viewMode === 'month' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {t('By month', 'నెల వారీగా')}
        </button>
        {viewMode === 'day' ? (
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        ) : (
          <input
            type="month"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        )}
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
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
        {(category === 'all' || category === 'fertilizer') && (
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">
            {t('Fertilizer unit', 'Fertilizer unit')}
            <select
              value={fertilizerQtyUnit}
              onChange={(e) => setFertilizerQtyUnit(e.target.value as 'mts' | 'bags')}
              className="bg-transparent font-black text-slate-950 outline-none dark:text-white"
            >
              <option value="mts">MTS</option>
              <option value="bags">Bags</option>
            </select>
          </label>
        )}
        {(category === 'all' || category === 'fertilizer') && (
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">
            {t('Fertilizer', 'Fertilizer')}
            <select
              value={fertilizerFilter}
              onChange={(e) => setFertilizerFilter(e.target.value)}
              className="bg-transparent font-black text-slate-950 outline-none dark:text-white"
            >
              <option value="all">All</option>
              {FERTILIZER_TYPES.map((fertilizer) => (
                <option key={fertilizer} value={fertilizer}>{fertilizer}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {(category === 'all' || category === 'fertilizer') && (
        <section className="space-y-3">
          <div className="grid gap-2 md:grid-cols-5">
            {fertilizerSummary.map((item) => (
              <div key={item.fertilizer} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{item.fertilizer}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Sales</p>
                    <p className="text-base font-black text-slate-950 dark:text-white">
                      {formatFertilizerQuantity(item.sales, item.fertilizer, fertilizerQtyUnit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Closing</p>
                    <p className="text-base font-black text-emerald-700 dark:text-emerald-300">
                      {formatFertilizerQuantity(item.closing, item.fertilizer, fertilizerQtyUnit)}
                    </p>
                  </div>
                </div>
                <p className="mt-1 text-[10px] font-bold text-slate-400">{fertilizerQtyUnit === 'bags' ? 'Bags' : 'MTS'}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Fertilizer Sales and Closing Chart
            </h2>
            <div className="space-y-2">
              {fertilizerSummary.map((item) => {
                const salesWidth = Math.max(2, Math.round((item.sales / highestFertilizerValue) * 100));
                const closingWidth = Math.max(2, Math.round((item.closing / highestFertilizerValue) * 100));
                return (
                  <div key={item.fertilizer} className="grid gap-2 md:grid-cols-[5rem_1fr] md:items-center">
                    <p className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">{item.fertilizer}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[10px] font-bold text-slate-500">Sales</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${salesWidth}%` }} />
                        </div>
                        <span className="w-16 text-right text-[10px] font-bold text-slate-500">
                          {formatFertilizerQuantity(item.sales, item.fertilizer, fertilizerQtyUnit)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[10px] font-bold text-slate-500">Closing</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${closingWidth}%` }} />
                        </div>
                        <span className="w-16 text-right text-[10px] font-bold text-slate-500">
                          {formatFertilizerQuantity(item.closing, item.fertilizer, fertilizerQtyUnit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-600">
          {viewMode === 'day'
            ? t(
                `No dealer stock submitted for ${formatReportDateLabel(reportDate, dateLocale)}.`,
                `${formatReportDateLabel(reportDate, dateLocale)} నాటికి డీలర్ స్టాక్ లేదు.`
              )
            : t('No dealer stock submitted for this month yet.', 'ఈ నెలకు ఇంకా డీలర్ స్టాక్ సమర్పించలేదు.')}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dealerId, group]) => {
            const open = expandedDealer === dealerId;
            return (
              <section
                key={dealerId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => setExpandedDealer(open ? null : dealerId)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{group.dealerName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {group.location} · {group.phone} · {group.lines.length} {t('rows', 'వరుసలు')}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    {open ? t('Close', 'మూసివేయి') : t('Open', 'తెరవండి')}
                  </span>
                </button>
                {open && (
                  <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full min-w-[880px] text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-2 text-left">{t('Date', 'తేదీ')}</th>
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
                            <td className="px-4 py-2 whitespace-nowrap">{line.report_date}</td>
                            <td className="px-4 py-2">{line.serial_no}</td>
                            <td className="px-4 py-2 capitalize">{line.category}</td>
                            <td className="px-4 py-2 font-semibold">
                              {line.product_type}
                              {unitLabelForLine(line) ? ` (${unitLabelForLine(line)})` : ''}
                            </td>
                            <td className="px-4 py-2 text-right">{formatQuantity(line, line.opening_balance)}</td>
                            <td className="px-4 py-2 text-right">{formatQuantity(line, line.receipts)}</td>
                            <td className="px-4 py-2 text-right font-bold">{formatQuantity(line, line.total)}</td>
                            <td className="px-4 py-2 text-right">{formatQuantity(line, line.sales)}</td>
                            <td className="px-4 py-2 text-right font-black text-emerald-700 dark:text-emerald-400">
                              {formatQuantity(line, line.closing_balance)}
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
