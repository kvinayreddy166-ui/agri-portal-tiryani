import React, { useState, useEffect } from 'react';
import { Download, Search, Calendar, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

interface Receipt {
  id: string;
  dealer_name: string;
  fertilizer_type: string;
  quantity_mts: number;
  wholesaler_name: string;
  invoice_number: string;
  invoice_date: string;
  last_updated: string;
}

interface Sale {
  id: string;
  dealer_name: string;
  fertilizer_type: string;
  quantity_mts: number;
  customer_name: string;
  invoice_number: string;
  sale_date: string;
  last_updated: string;
}

export default function StockReceiptsSales() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'receipts' | 'sales'>('receipts');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [financialYear, setFinancialYear] = useState('2024-25');

  useEffect(() => {
    fetchData();
  }, [financialYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch receipts for the dealer
      const receiptsResponse = await fetch(`/api/dealer-stock?dealer_id=${user?.email}&financial_year=${financialYear}`);
      if (receiptsResponse.ok) {
        const receiptsData = await receiptsResponse.json();
        setReceipts(receiptsData);
      }

      // Fetch sales for the dealer
      const salesResponse = await fetch(`/api/dealer-sales?dealer_id=${user?.email}&financial_year=${financialYear}`);
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        setSales(salesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(
    (item) =>
      item.dealer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fertilizer_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.wholesaler_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.invoice_number && item.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSales = sales.filter(
    (item) =>
      item.dealer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fertilizer_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.invoice_number && item.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportReceiptsToExcel = () => {
    const data = filteredReceipts.map((item, index) => ({
      'S.No': index + 1,
      'Dealer': item.dealer_name,
      'Fertilizer': item.fertilizer_type,
      'Quantity (MT)': item.quantity_mts,
      'Wholesaler': item.wholesaler_name,
      'Invoice No.': item.invoice_number,
      'Invoice Date': item.invoice_date,
      'Last Updated': item.last_updated,
    }));
    downloadWorkbook(data, `stock-receipts-${financialYear}.xlsx`, 'Receipts');
  };

  const exportSalesToExcel = () => {
    const data = filteredSales.map((item, index) => ({
      'S.No': index + 1,
      'Dealer': item.dealer_name,
      'Fertilizer': item.fertilizer_type,
      'Quantity (MT)': item.quantity_mts,
      'Customer': item.customer_name,
      'Invoice No.': item.invoice_number,
      'Sale Date': item.sale_date,
      'Last Updated': item.last_updated,
    }));
    downloadWorkbook(data, `stock-sales-${financialYear}.xlsx`, 'Sales');
  };

  const downloadWorkbook = (rows: Record<string, string | number>[], fileName: string, sheetName: string) => {
    if (!rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="page-title">Stock Receipts & Sales</h1>
          <p className="page-subtitle">View your fertilizer receipts and sales with export options.</p>
        </div>
      </div>

      {/* Tab Switching */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 text-sm font-black transition ${
            activeTab === 'receipts'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Receipts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 text-sm font-black transition ${
            activeTab === 'sales'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Sales
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-emerald-900/40"
              placeholder={activeTab === 'receipts' ? 'Search fertilizer, wholesaler, or invoice' : 'Search fertilizer, customer, or invoice'}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Calendar className="h-4 w-4" />
              Financial Year
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="bg-transparent text-slate-950 outline-none dark:text-white"
              >
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
            </label>
            <button
              type="button"
              onClick={activeTab === 'receipts' ? exportReceiptsToExcel : exportSalesToExcel}
              disabled={activeTab === 'receipts' ? filteredReceipts.length === 0 : filteredSales.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'receipts' ? (
        filteredReceipts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No receipt entries found.</p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Stock Receipts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-slate-900 text-xs uppercase text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">S.No</th>
                    <th className="px-4 py-3 text-left">Fertilizer</th>
                    <th className="px-4 py-3 text-right">Quantity (MT)</th>
                    <th className="px-4 py-3 text-left">Wholesaler</th>
                    <th className="px-4 py-3 text-left">Invoice No.</th>
                    <th className="px-4 py-3 text-left">Invoice Date</th>
                    <th className="px-4 py-3 text-left">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReceipts.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-bold">{index + 1}</td>
                      <td className="px-4 py-3 font-black text-slate-950 dark:text-white">{item.fertilizer_type}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-300">{item.quantity_mts.toFixed(2)}</td>
                      <td className="px-4 py-3">{item.wholesaler_name || '-'}</td>
                      <td className="px-4 py-3">{item.invoice_number || '-'}</td>
                      <td className="px-4 py-3">{formatDate(item.invoice_date)}</td>
                      <td className="px-4 py-3">{formatDate(item.last_updated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      ) : (
        filteredSales.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No sales entries found.</p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Stock Sales</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-slate-900 text-xs uppercase text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">S.No</th>
                    <th className="px-4 py-3 text-left">Fertilizer</th>
                    <th className="px-4 py-3 text-right">Quantity (MT)</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Invoice No.</th>
                    <th className="px-4 py-3 text-left">Sale Date</th>
                    <th className="px-4 py-3 text-left">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSales.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-bold">{index + 1}</td>
                      <td className="px-4 py-3 font-black text-slate-950 dark:text-white">{item.fertilizer_type}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-300">{item.quantity_mts.toFixed(2)}</td>
                      <td className="px-4 py-3">{item.customer_name || '-'}</td>
                      <td className="px-4 py-3">{item.invoice_number || '-'}</td>
                      <td className="px-4 py-3">{formatDate(item.sale_date)}</td>
                      <td className="px-4 py-3">{formatDate(item.last_updated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      )}
    </div>
  );
}
