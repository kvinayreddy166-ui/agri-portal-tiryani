import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, TrendingUp, Package, Clock, Users, Shield, ArrowUpDown, Calendar, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { currentReportDate, financialYearForDate, fertilizerMtsToBags, fertilizerBagWeightMts } from '../lib/stockInventory';

interface CommandCenterFilters {
  category: string;
  financialYear: string;
  fromDate: string;
  toDate: string;
  product: string;
  dealer: string;
  village: string;
  submissionStatus: string;
}

interface Dealer {
  id: string;
  dealer_name: string;
  ifms_id: string;
  phone_number: string;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  location: string;
  dealer_category?: 'fertilizer' | 'seed' | 'pesticide';
  portal_email?: string;
}

interface StockInventoryLine {
  id: string;
  dealer_id: string;
  category: string;
  product_type: string;
  opening_balance: number;
  receipts: number;
  sales: number;
  closing_balance: number;
  report_date: string;
  report_month: string;
  created_at: string;
}

interface DealerStockAllocation {
  id: string;
  dealer_id: string;
  fertilizer_type: string;
  quantity_mts: number;
  quantity_bags?: number;
  created_at: string;
}

export function CommandCenter() {
  const { isAdminUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CommandCenterFilters>({
    category: 'all',
    financialYear: financialYearForDate(),
    fromDate: '',
    toDate: '',
    product: 'all',
    dealer: 'all',
    village: 'all',
    submissionStatus: 'all',
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Data states for all sections
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [stockInventory, setStockInventory] = useState<StockInventoryLine[]>([]);
  const [stockAllocations, setStockAllocations] = useState<DealerStockAllocation[]>([]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dealersRes, stockRes, allocationRes] = await Promise.all([
        supabase.from('dealers').select('*').order('dealer_name'),
        supabase.from('stock_inventory_lines').select('*').order('report_date', { ascending: false }).limit(1000),
        supabase.from('dealer_stock_allocation').select('*').order('created_at', { ascending: false }).limit(1000),
      ]);

      if (dealersRes.data) setDealers(dealersRes.data);
      if (stockRes.data) setStockInventory(stockRes.data);
      if (allocationRes.data) setStockAllocations(allocationRes.data);
    } catch (error) {
      console.error('Error fetching Command Center data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Filtered data based on current filters
  const filteredDealers = useMemo(() => {
    let result = dealers;
    
    if (filters.category !== 'all') {
      result = result.filter(d => d.dealer_category === filters.category);
    }
    
    if (filters.village !== 'all') {
      result = result.filter(d => d.location.toLowerCase().includes(filters.village.toLowerCase()));
    }
    
    if (filters.dealer !== 'all') {
      result = result.filter(d => d.id === filters.dealer);
    }
    
    return result;
  }, [dealers, filters]);

  const filteredStock = useMemo(() => {
    let result = stockInventory;
    
    if (filters.category !== 'all') {
      result = result.filter(s => s.category === filters.category);
    }
    
    if (filters.product !== 'all') {
      result = result.filter(s => s.product_type === filters.product);
    }
    
    if (filters.financialYear) {
      const fyRange = financialYearRange(filters.financialYear);
      result = result.filter(s => s.report_date >= fyRange.start && s.report_date <= fyRange.end);
    }
    
    if (filters.fromDate) {
      result = result.filter(s => s.report_date >= filters.fromDate);
    }
    
    if (filters.toDate) {
      result = result.filter(s => s.report_date <= filters.toDate);
    }
    
    return result;
  }, [stockInventory, filters]);

  const filteredAllocations = useMemo(() => {
    let result = stockAllocations;
    
    if (filters.product !== 'all') {
      result = result.filter(a => a.fertilizer_type === filters.product);
    }
    
    if (filters.dealer !== 'all') {
      result = result.filter(a => a.dealer_id === filters.dealer);
    }
    
    return result;
  }, [stockAllocations, filters]);

  // Helper function to get dealer name by ID
  const getDealerName = useCallback((dealerId: string) => {
    const dealer = dealers.find(d => d.id === dealerId);
    return dealer?.dealer_name || 'Unknown';
  }, [dealers]);

  // Helper function to calculate days between dates
  const daysBetween = useCallback((date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Helper function for financial year range
  const financialYearRange = useCallback((fy: string) => {
    const startYear = Number(fy.slice(0, 4));
    return {
      start: `${startYear}-04-01`,
      end: `${startYear + 1}-03-31`,
    };
  }, []);

  // SECTION 1: License Counter
  const licenseCounts = useMemo(() => {
    return {
      fertilizer: dealers.filter(d => d.dealer_category === 'fertilizer').length,
      seed: dealers.filter(d => d.dealer_category === 'seed').length,
      pesticide: dealers.filter(d => d.dealer_category === 'pesticide').length,
    };
  }, [dealers]);

  // SECTION 2: Expired Licenses
  const expiredLicenses = useMemo(() => {
    const today = new Date();
    return dealers.filter(d => new Date(d.expiry_date) < today);
  }, [dealers]);

  // SECTION 3: Expiring Soon (60 Days)
  const expiringSoonLicenses = useMemo(() => {
    const today = new Date();
    const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    return dealers.filter(d => {
      const expiry = new Date(d.expiry_date);
      return expiry >= today && expiry <= sixtyDaysLater;
    });
  }, [dealers]);

  // SECTION 4: Active Dealers Summary
  const activeDealersSummary = useMemo(() => {
    const categories = ['fertilizer', 'seed', 'pesticide'] as const;
    const today = currentReportDate();
    
    return categories.map(category => {
      const categoryDealers = dealers.filter(d => d.dealer_category === category);
      const total = categoryDealers.length;
      
      // Active = license not expired
      const active = categoryDealers.filter(d => new Date(d.expiry_date) >= new Date()).length;
      
      // Submitted today = has stock inventory entry for today
      const submittedToday = filteredStock.filter(s => 
        s.category === category && s.report_date === today
      ).length;
      
      // Pending today = total active - submitted today
      const pendingToday = active - submittedToday;
      
      return { category, total, active, submittedToday, pendingToday };
    });
  }, [dealers, filteredStock]);

  // SECTION 5: Not Logged In > 48 Hrs
  // Note: Since we don't have explicit login activity tracking, we'll use last stock submission as proxy
  const notLoggedInDealers = useMemo(() => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    return dealers.map(dealer => {
      const lastSubmission = filteredStock
        .filter(s => s.dealer_id === dealer.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      const lastActivityDate = lastSubmission?.created_at || dealer.created_at;
      const daysIdle = daysBetween(lastActivityDate, new Date().toISOString());
      
      return {
        dealer: dealer.dealer_name,
        mobile: dealer.phone_number,
        daysIdle,
      };
    }).filter(d => d.daysIdle > 2).sort((a, b) => b.daysIdle - a.daysIdle);
  }, [dealers, filteredStock, daysBetween]);

  // SECTION 6: Current Nil Stock
  const currentNilStock = useMemo(() => {
    const today = currentReportDate();
    const todayStock = filteredStock.filter(s => s.report_date === today && s.closing_balance === 0);
    
    // Group by dealer and get days since update
    const dealerStockMap = new Map<string, { dealer: string; daysSinceUpdate: number }>();
    
    todayStock.forEach(stock => {
      const existing = dealerStockMap.get(stock.dealer_id);
      if (!existing) {
        const daysSince = daysBetween(stock.report_date, new Date().toISOString());
        dealerStockMap.set(stock.dealer_id, {
          dealer: getDealerName(stock.dealer_id),
          daysSinceUpdate: daysSince,
        });
      }
    });
    
    return Array.from(dealerStockMap.values())
      .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
  }, [filteredStock, getDealerName, daysBetween]);

  // SECTION 7: Urea Stock Ranking
  const ureaStockRanking = useMemo(() => {
    const today = currentReportDate();
    const todayUreaStock = filteredStock.filter(s => 
      s.report_date === today && s.product_type === 'Urea' && s.closing_balance > 0
    );
    
    const dealerStockMap = new Map<string, { dealer: string; stock: number }>();
    
    todayUreaStock.forEach(stock => {
      const existing = dealerStockMap.get(stock.dealer_id);
      const stockValue = existing ? existing.stock + stock.closing_balance : stock.closing_balance;
      dealerStockMap.set(stock.dealer_id, {
        dealer: getDealerName(stock.dealer_id),
        stock: stockValue,
      });
    });
    
    return Array.from(dealerStockMap.values())
      .sort((a, b) => b.stock - a.stock);
  }, [filteredStock, getDealerName]);

  // SECTION 8: Urea No Sales Alert
  const ureaNoSalesAlert = useMemo(() => {
    const today = currentReportDate();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get dealers with current urea stock > 0
    const dealersWithUrea = filteredStock.filter(s => 
      s.report_date === today && s.product_type === 'Urea' && s.closing_balance > 0
    );
    
    // Check for sales in the last 3 days
    const result = dealersWithUrea.map(stock => {
      const recentSales = filteredStock.filter(s =>
        s.dealer_id === stock.dealer_id &&
        s.product_type === 'Urea' &&
        s.sales > 0 &&
        s.report_date >= threeDaysAgo
      );
      
      const lastSale = recentSales.length > 0 
        ? recentSales.sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())[0].report_date
        : null;
      
      const daysIdle = lastSale ? daysBetween(lastSale, today) : 999;
      
      return {
        dealerName: getDealerName(stock.dealer_id),
        currentStock: stock.closing_balance,
        lastSaleDate: lastSale || 'Never',
        daysIdle,
      };
    }).filter(d => d.daysIdle >= 3).sort((a, b) => b.daysIdle - a.daysIdle);
    
    return result;
  }, [filteredStock, getDealerName, daysBetween]);

  // SECTION 9: Highest Stock Received (7 Days)
  const highestStockReceived = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const recentReceipts = filteredStock.filter(s => 
      s.report_date >= sevenDaysAgo && s.receipts > 0
    );
    
    const dealerReceiptsMap = new Map<string, { dealer: string; bags: number }>();
    
    recentReceipts.forEach(stock => {
      const isUrea = stock.product_type.toLowerCase() === 'urea';
      const bagWeight = isUrea ? fertilizerBagWeightMts(stock.product_type) : 0.05;
      const bags = fertilizerMtsToBags(stock.receipts, stock.product_type);
      
      const existing = dealerReceiptsMap.get(stock.dealer_id);
      const totalBags = existing ? existing.bags + bags : bags;
      
      dealerReceiptsMap.set(stock.dealer_id, {
        dealer: getDealerName(stock.dealer_id),
        bags: totalBags,
      });
    });
    
    return Array.from(dealerReceiptsMap.values())
      .sort((a, b) => b.bags - a.bags);
  }, [filteredStock, getDealerName, fertilizerMtsToBags, fertilizerBagWeightMts]);

  // SECTION 10: Week's Top Sellers by Category
  const weekTopSellers = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const products = ['Urea', 'DAP', 'SSP', 'MOP', 'Complexes'];
    
    return products.map(product => {
      const productSales = filteredStock.filter(s =>
        s.product_type === product &&
        s.report_date >= sevenDaysAgo &&
        s.sales > 0
      );
      
      const dealerSalesMap = new Map<string, number>();
      productSales.forEach(s => {
        const existing = dealerSalesMap.get(s.dealer_id) || 0;
        dealerSalesMap.set(s.dealer_id, existing + s.sales);
      });
      
      let topDealer = { dealer: 'None', bags: 0 };
      dealerSalesMap.forEach((bags, dealerId) => {
        if (bags > topDealer.bags) {
          topDealer = {
            dealer: getDealerName(dealerId),
            bags,
          };
        }
      });
      
      return { product, ...topDealer };
    });
  }, [filteredStock, getDealerName]);

  // SECTION 11: Dealer Submission Status
  const dealerSubmissionStatus = useMemo(() => {
    const today = currentReportDate();
    const showUpdated = filters.submissionStatus === 'updated' || filters.submissionStatus === 'all';
    const showPending = filters.submissionStatus === 'pending' || filters.submissionStatus === 'all';
    
    const todaySubmissions = new Set(
      filteredStock.filter(s => s.report_date === today).map(s => s.dealer_id)
    );
    
    return dealers.map(dealer => {
      const hasSubmittedToday = todaySubmissions.has(dealer.id);
      const status = hasSubmittedToday ? 'Updated' : 'Pending';
      
      if ((status === 'Updated' && !showUpdated) || (status === 'Pending' && !showPending)) {
        return null;
      }
      
      const lastSubmission = filteredStock
        .filter(s => s.dealer_id === dealer.id)
        .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())[0];
      
      return {
        dealer: dealer.dealer_name,
        lastSubmittedDate: lastSubmission?.report_date || 'Never',
        status,
      };
    }).filter((d): d is NonNullable<typeof d> => d !== null);
  }, [dealers, filteredStock, filters.submissionStatus]);

  // SECTION 12: Current Nil Stock Dealers
  const currentNilStockDealers = useMemo(() => {
    const today = currentReportDate();
    const todayStock = filteredStock.filter(s => s.report_date === today);
    
    const dealerStockMap = new Map<string, { dealer: string; currentStock: number; lastUpdated: string }>();
    
    todayStock.forEach(stock => {
      const existing = dealerStockMap.get(stock.dealer_id);
      const totalStock = existing ? existing.currentStock + stock.closing_balance : stock.closing_balance;
      
      dealerStockMap.set(stock.dealer_id, {
        dealer: getDealerName(stock.dealer_id),
        currentStock: totalStock,
        lastUpdated: stock.report_date,
      });
    });
    
    return Array.from(dealerStockMap.values())
      .filter(d => d.currentStock === 0);
  }, [filteredStock, getDealerName]);

  // SECTION 13: Top Urea Sales Ranking
  const topUreaSalesRanking = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const ureaSales = filteredStock.filter(s =>
      s.product_type === 'Urea' &&
      s.report_date >= sevenDaysAgo &&
      s.sales > 0
    );
    
    const dealerSalesMap = new Map<string, number>();
    ureaSales.forEach(s => {
      const existing = dealerSalesMap.get(s.dealer_id) || 0;
      dealerSalesMap.set(s.dealer_id, existing + s.sales);
    });
    
    return Array.from(dealerSalesMap.entries())
      .map(([dealerId, sales], index) => ({
        rank: index + 1,
        dealer: getDealerName(dealerId),
        ureaSales: sales,
        period: 'Last 7 Days',
      }))
      .sort((a, b) => b.ureaSales - a.ureaSales);
  }, [filteredStock, getDealerName]);

  // SECTION 14: Highest Receipts This Week
  const highestReceiptsThisWeek = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const recentReceipts = filteredStock.filter(s =>
      s.report_date >= sevenDaysAgo && s.receipts > 0
    );
    
    const dealerReceiptsMap = new Map<string, { dealer: string; product: string; quantity: number }>();
    
    recentReceipts.forEach(s => {
      const key = `${s.dealer_id}-${s.product_type}`;
      const existing = dealerReceiptsMap.get(key);
      const totalQuantity = existing ? existing.quantity + s.receipts : s.receipts;
      
      dealerReceiptsMap.set(key, {
        dealer: getDealerName(s.dealer_id),
        product: s.product_type,
        quantity: totalQuantity,
      });
    });
    
    return Array.from(dealerReceiptsMap.values())
      .map((item, index) => ({
        rank: index + 1,
        ...item,
        week: 'This Week',
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredStock, getDealerName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8F5] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
          <h1 className="text-3xl font-black text-[#0B7A5C] flex items-center gap-3">
            <Shield className="w-8 h-8" />
            COMMAND CENTER
          </h1>
          <p className="mt-2 text-[#64748B] font-semibold">Agriculture Monitoring Dashboard</p>
        </div>

        {/* Filter Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-[#0B7A5C]" />
              <span className="font-bold text-[#0F172A]">Filters</span>
            </div>
            {filtersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {filtersExpanded && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#64748B] mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  >
                    <option value="all">All Categories</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="seed">Seed</option>
                    <option value="pesticide">Pesticide</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#64748B] mb-1">Financial Year</label>
                  <select
                    value={filters.financialYear}
                    onChange={(e) => setFilters({ ...filters, financialYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  >
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2026-27">2026-27</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#64748B] mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#64748B] mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#64748B] mb-1">Product</label>
                  <select
                    value={filters.product}
                    onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  >
                    <option value="all">All Products</option>
                    <option value="Urea">Urea</option>
                    <option value="DAP">DAP</option>
                    <option value="SSP">SSP</option>
                    <option value="MOP">MOP</option>
                    <option value="Complex">Complex</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#64748B] mb-1">Dealer</label>
                  <select
                    value={filters.dealer}
                    onChange={(e) => setFilters({ ...filters, dealer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  >
                    <option value="all">All Dealers</option>
                    {dealers.map(d => (
                      <option key={d.id} value={d.id}>{d.dealer_name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#64748B] mb-1">Village</label>
                  <input
                    type="text"
                    value={filters.village}
                    onChange={(e) => setFilters({ ...filters, village: e.target.value })}
                    placeholder="Enter village name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#64748B] mb-1">Submission Status</label>
                  <select
                    value={filters.submissionStatus}
                    onChange={(e) => setFilters({ ...filters, submissionStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
                  >
                    <option value="all">All Status</option>
                    <option value="updated">Updated Today</option>
                    <option value="pending">Pending Today</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setFilters({
                    category: 'all',
                    financialYear: financialYearForDate(),
                    fromDate: '',
                    toDate: '',
                    product: 'all',
                    dealer: 'all',
                    village: 'all',
                    submissionStatus: 'all',
                  })}
                  className="px-4 py-2 bg-[#0B7A5C] text-white rounded-lg font-bold hover:bg-[#0a6b50] transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: License Counter */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#2563EB]" />
            LICENSE COUNTER
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#2563EB]/10 rounded-xl p-4 border border-[#2563EB]/20">
              <p className="text-sm font-bold text-[#64748B]">Fertilizer</p>
              <p className="text-3xl font-black text-[#2563EB] mt-2">{licenseCounts.fertilizer}</p>
            </div>
            <div className="bg-[#2563EB]/10 rounded-xl p-4 border border-[#2563EB]/20">
              <p className="text-sm font-bold text-[#64748B]">Seeds</p>
              <p className="text-3xl font-black text-[#2563EB] mt-2">{licenseCounts.seed}</p>
            </div>
            <div className="bg-[#2563EB]/10 rounded-xl p-4 border border-[#2563EB]/20">
              <p className="text-sm font-bold text-[#64748B]">Pesticides</p>
              <p className="text-3xl font-black text-[#2563EB] mt-2">{licenseCounts.pesticide}</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Expired Licenses */}
        <div className="bg-red-50 rounded-2xl p-6 border border-red-200 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-[#DC2626]" />
            EXPIRED LICENSES
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-red-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Valid Upto</th>
                </tr>
              </thead>
              <tbody>
                {expiredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 px-4 text-center text-[#64748B]">No expired licenses</td>
                  </tr>
                ) : (
                  expiredLicenses.map(license => (
                    <tr key={license.id} className="border-b border-red-100">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{license.dealer_name}</td>
                      <td className="py-3 px-4 font-semibold text-[#DC2626]">{new Date(license.expiry_date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: Expiring Soon (60 Days) */}
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#16A34A]" />
            EXPIRING SOON (60 DAYS)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Valid Upto</th>
                </tr>
              </thead>
              <tbody>
                {expiringSoonLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 px-4 text-center text-[#64748B]">No licenses expiring soon</td>
                  </tr>
                ) : (
                  expiringSoonLicenses.map(license => (
                    <tr key={license.id} className="border-b border-green-100">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{license.dealer_name}</td>
                      <td className="py-3 px-4 font-semibold text-[#16A34A]">{new Date(license.expiry_date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Active Dealers Summary */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0B7A5C]" />
            ACTIVE DEALERS SUMMARY
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeDealersSummary.map(summary => (
              <div key={summary.category} className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-black text-[#0B7A5C] capitalize mb-3">{summary.category} Dealers</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-[#64748B]">Total Dealers</span>
                    <span className="text-sm font-black text-[#0F172A]">{summary.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-[#64748B]">Active Dealers</span>
                    <span className="text-sm font-black text-[#16A34A]">{summary.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-[#64748B]">Submitted Today</span>
                    <span className="text-sm font-black text-[#2563EB]">{summary.submittedToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-[#64748B]">Pending Today</span>
                    <span className="text-sm font-black text-[#F59E0B]">{summary.pendingToday}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Not Logged In > 48 Hrs */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#F59E0B]" />
            NOT LOGGED IN > 48 HRS
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer/Firm</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Mobile/Login</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Days Idle</th>
                </tr>
              </thead>
              <tbody>
                {notLoggedInDealers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 px-4 text-center text-[#64748B]">All dealers active</td>
                  </tr>
                ) : (
                  notLoggedInDealers.map((dealer, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{dealer.dealer}</td>
                      <td className="py-3 px-4 font-semibold text-[#64748B]">{dealer.mobile}</td>
                      <td className="py-3 px-4">
                        <span className="bg-[#F59E0B] text-white px-2 py-1 rounded-full text-xs font-bold">
                          {dealer.daysIdle} Days
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 6: Current Nil Stock */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#DC2626]" />
            CURRENT NIL STOCK
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer/Firm</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Days Since Update</th>
                </tr>
              </thead>
              <tbody>
                {currentNilStock.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 px-4 text-center text-[#64748B]">No nil stock dealers</td>
                  </tr>
                ) : (
                  currentNilStock.map((dealer, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{dealer.dealer}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          dealer.daysSinceUpdate >= 30 ? 'bg-[#DC2626] text-white' :
                          dealer.daysSinceUpdate >= 20 ? 'bg-[#F59E0B] text-white' :
                          dealer.daysSinceUpdate >= 10 ? 'bg-[#2563EB] text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {dealer.daysSinceUpdate} Days
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 7: Urea Stock Ranking */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#2563EB]" />
            UREA STOCK (RANKING)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer/Firm</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Current Urea Stock</th>
                </tr>
              </thead>
              <tbody>
                {ureaStockRanking.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 px-4 text-center text-[#64748B]">No urea stock data</td>
                  </tr>
                ) : (
                  ureaStockRanking.map((dealer, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{dealer.dealer}</td>
                      <td className="py-3 px-4 font-black text-[#2563EB]">{dealer.stock.toFixed(2)} MT</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 8: Urea No Sales Alert */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-[#DC2626]" />
              UREA: NO SALES ALERT
            </h2>
            <span className="bg-[#DC2626] text-white px-3 py-1 rounded-full text-sm font-bold">
              {ureaNoSalesAlert.length} DEALERS
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer Name</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Current Stock</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Last Sale Date</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Days Idle</th>
                </tr>
              </thead>
              <tbody>
                {ureaNoSalesAlert.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-center text-[#64748B]">All dealers with urea stock have recent sales</td>
                  </tr>
                ) : (
                  ureaNoSalesAlert.map((dealer, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{dealer.dealerName}</td>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{dealer.currentStock.toFixed(2)} MT</td>
                      <td className="py-3 px-4 font-semibold text-[#64748B]">{dealer.lastSaleDate}</td>
                      <td className="py-3 px-4">
                        <span className="bg-[#DC2626] text-white px-2 py-1 rounded-full text-xs font-bold">
                          {dealer.daysIdle} Days
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 9: Highest Stock Received (7 Days) */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-[#16A34A]" />
            HIGHEST STOCK RECEIVED (7 DAYS)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Bags</th>
                </tr>
              </thead>
              <tbody>
                {highestStockReceived.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 px-4 text-center text-[#64748B]">No stock received in last 7 days</td>
                  </tr>
                ) : (
                  highestStockReceived.slice(0, 10).map((dealer, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{dealer.dealer}</td>
                      <td className="py-3 px-4 font-black text-[#16A34A]">{Math.round(dealer.bags)} Bags</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 10: Week's Top Sellers by Category */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#0B7A5C]" />
            WEEK'S TOP SELLERS BY CATEGORY
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weekTopSellers.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    item.product === 'Urea' ? 'bg-blue-500' :
                    item.product === 'DAP' ? 'bg-green-500' :
                    item.product === 'SSP' ? 'bg-yellow-500' :
                    item.product === 'MOP' ? 'bg-red-500' :
                    'bg-purple-500'
                  }`} />
                  <span className="text-sm font-bold text-[#64748B]">{item.product}</span>
                </div>
                <p className="font-semibold text-[#0F172A] text-sm">{item.dealer}</p>
                <p className="font-black text-[#0B7A5C] text-lg mt-1">{Math.round(item.bags)} Bags</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 11: Dealer Submission Status */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#0B7A5C]" />
            DEALER SUBMISSION STATUS
          </h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilters({ ...filters, submissionStatus: 'updated' })}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                filters.submissionStatus === 'updated' ? 'bg-[#16A34A] text-white' : 'bg-gray-100 text-[#64748B]'
              }`}
            >
              Updated
            </button>
            <button
              onClick={() => setFilters({ ...filters, submissionStatus: 'pending' })}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                filters.submissionStatus === 'pending' ? 'bg-[#F59E0B] text-white' : 'bg-gray-100 text-[#64748B]'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilters({ ...filters, submissionStatus: 'all' })}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                filters.submissionStatus === 'all' ? 'bg-[#0B7A5C] text-white' : 'bg-gray-100 text-[#64748B]'
              }`}
            >
              All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Last Submitted Date</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {dealerSubmissionStatus.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 px-4 text-center text-[#64748B]">No dealers found</td>
                  </tr>
                ) : (
                  dealerSubmissionStatus.slice(0, 20).map((dealer, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{dealer.dealer}</td>
                      <td className="py-3 px-4 font-semibold text-[#64748B]">{dealer.lastSubmittedDate}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          dealer.status === 'Updated' ? 'bg-[#16A34A] text-white' : 'bg-[#F59E0B] text-white'
                        }`}>
                          {dealer.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 12: Current Nil Stock Dealers */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#DC2626]" />
            CURRENT NIL STOCK DEALERS
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Current Stock</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {currentNilStockDealers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 px-4 text-center text-[#64748B]">No nil stock dealers</td>
                  </tr>
                ) : (
                  currentNilStockDealers.map((dealer, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{dealer.dealer}</td>
                      <td className="py-3 px-4 font-semibold text-[#DC2626]">{dealer.currentStock.toFixed(2)} MT</td>
                      <td className="py-3 px-4 font-semibold text-[#64748B]">{dealer.lastUpdated}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 13: Top Urea Sales Ranking */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#0B7A5C]" />
            UREA SALES RANKING
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Rank</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Urea Sales</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Period</th>
                </tr>
              </thead>
              <tbody>
                {topUreaSalesRanking.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-center text-[#64748B]">No urea sales data</td>
                  </tr>
                ) : (
                  topUreaSalesRanking.slice(0, 10).map((dealer, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-black text-[#0B7A5C]">#{dealer.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{dealer.dealer}</td>
                      <td className="py-3 px-4 font-black text-[#2563EB]">{dealer.ureaSales.toFixed(2)} MT</td>
                      <td className="py-3 px-4 font-semibold text-[#64748B]">{dealer.period}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 14: Highest Receipts This Week */}
        <div className="bg-[#F8FBFA] rounded-2xl p-6 border border-[#0B7A5C]/15 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-[#16A34A]" />
            HIGHEST RECEIPTS THIS WEEK
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Rank</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Dealer</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Product</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Quantity</th>
                  <th className="text-left py-3 px-4 font-bold text-[#64748B] text-sm">Week</th>
                </tr>
              </thead>
              <tbody>
                {highestReceiptsThisWeek.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-[#64748B]">No receipts this week</td>
                  </tr>
                ) : (
                  highestReceiptsThisWeek.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-black text-[#0B7A5C]">#{item.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{item.dealer}</td>
                      <td className="py-3 px-4 font-semibold text-[#64748B]">{item.product}</td>
                      <td className="py-3 px-4 font-black text-[#16A34A]">{item.quantity.toFixed(2)} MT</td>
                      <td className="py-3 px-4 font-semibold text-[#64748B]">{item.week}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
