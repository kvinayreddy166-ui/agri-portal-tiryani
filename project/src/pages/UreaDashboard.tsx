import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  RefreshCw,
  Upload,
  Filter,
  X,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  MapPin,
  Truck,
  Copy,
  FileText,
} from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Debounce hook for performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const LazySimpleBarChart = lazy(() =>
  import('../components/charts/SimpleBarChart').then((module) => ({ default: module.SimpleBarChart }))
);

type UreaBooking = {
  id: string;
  sync_id: string;
  farmer_name: string;
  father_name: string;
  aadhaar_no: string;
  ppb_no: string;
  mobile_no: string;
  village: string;
  survey_no: string;
  extent: number;
  crop: string;
  dealer_name: string;
  booking_id: string;
  booking_date: string | null;
  urea_qty: number;
  status: string;
  created_at: string;
};

type SyncLog = {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  records_imported: number;
  records_matched: number;
  records_unmatched: number;
  records_duplicate: number;
  error_message: string | null;
  login_status: string | null;
  api_status: string | null;
  http_code: number | null;
  records_fetched: number | null;
  records_inserted: number | null;
  records_updated: number | null;
  detailed_error_message: string | null;
};

type Analytics = {
  total_farmers: number;
  total_urea_booked_farmers: number;
  not_booked_farmers: number;
  booking_percentage: number;
  total_booked_urea_qty: number;
  matched_count: number;
  unmatched_count: number;
  duplicate_count: number;
  last_sync: string | null;
};

const PAGE_SIZE = 50;

export function UreaDashboard() {
  const { isAdminUser } = useAuth();
  const [bookings, setBookings] = useState<UreaBooking[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [villageFilter, setVillageFilter] = useState('all');
  const [cropFilter, setCropFilter] = useState('all');
  const [dealerFilter, setDealerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input for performance
  const debouncedSearch = useDebounce(searchInput, 300);

  // Manual upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Report generation
  const [generatingReport, setGeneratingReport] = useState(false);

  const uniqueVillages = useMemo(() => {
    const villages = new Set(bookings.map(b => b.village).filter(Boolean));
    return Array.from(villages).sort();
  }, [bookings]);

  const uniqueCrops = useMemo(() => {
    const crops = new Set(bookings.map(b => b.crop).filter(Boolean));
    return Array.from(crops).sort();
  }, [bookings]);

  const uniqueDealers = useMemo(() => {
    const dealers = new Set(bookings.map(b => b.dealer_name).filter(Boolean));
    return Array.from(dealers).sort();
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      if (villageFilter !== 'all' && booking.village !== villageFilter) return false;
      if (cropFilter !== 'all' && booking.crop !== cropFilter) return false;
      if (dealerFilter !== 'all' && booking.dealer_name !== dealerFilter) return false;
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
      if (dateFrom && booking.booking_date && booking.booking_date < dateFrom) return false;
      if (dateTo && booking.booking_date && booking.booking_date > dateTo) return false;
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        return (
          booking.farmer_name.toLowerCase().includes(search) ||
          booking.father_name.toLowerCase().includes(search) ||
          booking.aadhaar_no.includes(search) ||
          booking.ppb_no.includes(search) ||
          booking.mobile_no.includes(search) ||
          booking.village.toLowerCase().includes(search) ||
          booking.booking_id.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [bookings, villageFilter, cropFilter, dealerFilter, statusFilter, dateFrom, dateTo, debouncedSearch]);

  const paginatedBookings = useMemo(() => {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredBookings.slice(start, end);
  }, [filteredBookings, page]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_urea_analytics');
      if (error) throw error;
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  const fetchBookings = useCallback(async (pageNum = 0, append = false) => {
    try {
      setLoading(true);
      const start = pageNum * PAGE_SIZE;
      const end = start + PAGE_SIZE;

      let query = supabase
        .from('external_urea_bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      if (villageFilter !== 'all') query = query.eq('village', villageFilter);
      if (cropFilter !== 'all') query = query.eq('crop', cropFilter);
      if (dealerFilter !== 'all') query = query.eq('dealer_name', dealerFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (dateFrom) query = query.gte('booking_date', dateFrom);
      if (dateTo) query = query.lte('booking_date', dateTo);
      if (searchInput) {
        query = query.or(`farmer_name.ilike.%${searchInput}%,father_name.ilike.%${searchInput}%,aadhaar_no.ilike.%${searchInput}%,ppb_no.ilike.%${searchInput}%,mobile_no.ilike.%${searchInput}%,village.ilike.%${searchInput}%,booking_id.ilike.%${searchInput}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      if (append) {
        setBookings(prev => [...prev, ...(data || [])]);
      } else {
        setBookings(data || []);
      }

      setHasMore((count || 0) > end);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [villageFilter, cropFilter, dealerFilter, statusFilter, dateFrom, dateTo, searchInput]);

  const fetchSyncLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('external_urea_sync_logs')
        .select('id, sync_type, started_at, completed_at, status, records_imported, records_matched, records_unmatched, records_duplicate, error_message, login_status, api_status, http_code, records_fetched, records_inserted, records_updated, detailed_error_message')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  }, []);

  useEffect(() => {
    if (isAdminUser) {
      fetchAnalytics();
      fetchBookings();
      fetchSyncLogs();
    }
  }, [isAdminUser, fetchAnalytics, fetchBookings, fetchSyncLogs]);

  const handleSync = async () => {
    if (!isAdminUser) return;

    try {
      setSyncing(true);
      setSyncMessage('Starting sync...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sync-urea-dashboard-reports`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'auto'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed');
      }

      setSyncMessage(`Synced successfully! Records: ${result.recordsImported}, Matched: ${result.recordsMatched}, Unmatched: ${result.recordsUnmatched}, Duplicate: ${result.recordsDuplicate}`);
      
      // Refresh data
      await Promise.all([fetchAnalytics(), fetchBookings(), fetchSyncLogs()]);
      
      setTimeout(() => setSyncMessage(''), 5000);
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncMessage(`Sync failed: ${error.message}`);
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualUpload = async () => {
    if (!uploadFile || !isAdminUser) return;

    try {
      setUploading(true);
      setSyncMessage('Processing upload...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const fileData = await readFileAsDataUrl(uploadFile);

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sync-urea-dashboard-reports`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'manual_upload',
          fileData,
          fileName: uploadFile.name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setSyncMessage(`Upload successful! Records: ${result.recordsImported}, Matched: ${result.recordsMatched}, Unmatched: ${result.recordsUnmatched}, Duplicate: ${result.recordsDuplicate}`);
      
      // Refresh data
      await Promise.all([fetchAnalytics(), fetchBookings(), fetchSyncLogs()]);
      
      setShowUploadModal(false);
      setUploadFile(null);
      setTimeout(() => setSyncMessage(''), 5000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setSyncMessage(`Upload failed: ${error.message}`);
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setUploading(false);
    }
  };

  const generateExcelReport = async (reportType: string) => {
    try {
      setGeneratingReport(true);

      let data: any[] = [];
      let fileName = '';

      switch (reportType) {
        case 'village_not_booked':
          // Get village-wise not booked farmers
          const { data: villageData } = await supabase
            .from('farmer_database')
            .select('village_english, farmer_name_english, father_or_husband_name_english, aadhaar_no, ppb_no, phone_number, crop, extent')
            .order('village_english');
          
          const bookedAadhaars = new Set(bookings.map(b => b.aadhaar_no).filter(Boolean));
          data = (villageData || []).filter(f => !bookedAadhaars.has(f.aadhaar_no));
          fileName = 'village_not_booked_farmers.xlsx';
          break;

        case 'farmer_booking_status':
          data = bookings.map(b => ({
            farmer_name: b.farmer_name,
            father_name: b.father_name,
            aadhaar_no: b.aadhaar_no,
            ppb_no: b.ppb_no,
            mobile_no: b.mobile_no,
            village: b.village,
            crop: b.crop,
            extent: b.extent,
            dealer_name: b.dealer_name,
            booking_id: b.booking_id,
            booking_date: b.booking_date,
            urea_qty: b.urea_qty,
            status: b.status
          }));
          fileName = 'farmer_urea_booking_status.xlsx';
          break;

        case 'crop_wise_demand':
          // Group by crop
          const cropDemand: Record<string, any> = {};
          bookings.forEach(b => {
            if (!cropDemand[b.crop]) {
              cropDemand[b.crop] = { crop: b.crop, total_extent: 0, total_urea_qty: 0, booking_count: 0 };
            }
            cropDemand[b.crop].total_extent += b.extent || 0;
            cropDemand[b.crop].total_urea_qty += b.urea_qty || 0;
            cropDemand[b.crop].booking_count += 1;
          });
          data = Object.values(cropDemand);
          fileName = 'crop_wise_urea_demand.xlsx';
          break;

        case 'dealer_wise_booking':
          // Group by dealer
          const dealerBookings: Record<string, any> = {};
          bookings.forEach(b => {
            if (!dealerBookings[b.dealer_name]) {
              dealerBookings[b.dealer_name] = { dealer_name: b.dealer_name, booking_count: 0, total_urea_qty: 0 };
            }
            dealerBookings[b.dealer_name].booking_count += 1;
            dealerBookings[b.dealer_name].total_urea_qty += b.urea_qty || 0;
          });
          data = Object.values(dealerBookings);
          fileName = 'dealer_wise_booking_report.xlsx';
          break;

        case 'mismatch_report':
          data = bookings.filter(b => b.status === 'unmatched' || b.status === 'duplicate').map(b => ({
            farmer_name: b.farmer_name,
            father_name: b.father_name,
            aadhaar_no: b.aadhaar_no,
            ppb_no: b.ppb_no,
            mobile_no: b.mobile_no,
            village: b.village,
            status: b.status,
            booking_id: b.booking_id
          }));
          fileName = 'aadhaar_ppb_mismatch_report.xlsx';
          break;

        default:
          throw new Error('Invalid report type');
      }

      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, fileName);

    } catch (error: any) {
      console.error('Report generation error:', error);
      alert(`Failed to generate report: ${error.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const clearFilters = () => {
    setVillageFilter('all');
    setCropFilter('all');
    setDealerFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchInput('');
    setPage(0);
  };

  if (!isAdminUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">This module is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Urea Dashboard Sync & Analytics</h1>
              <p className="text-green-100 text-sm">
                External dashboard integration and farmer booking analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              {syncMessage && (
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  syncMessage.includes('failed') ? 'bg-red-500' : 'bg-green-500'
                }`}>
                  {syncMessage}
                </div>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                disabled={syncing || uploading}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
              <button
                onClick={handleSync}
                disabled={syncing || uploading}
                className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Urea Dashboard'}</span>
              </button>
            </div>
          </div>
          {analytics?.last_sync && (
            <div className="mt-3 text-sm text-green-100 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last synced: {new Date(analytics.last_sync).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <StatCard
              icon={Users}
              label="Total Farmers"
              value={analytics.total_farmers.toLocaleString()}
              color="blue"
            />
            <StatCard
              icon={CheckCircle}
              label="Booked Farmers"
              value={analytics.total_urea_booked_farmers.toLocaleString()}
              color="green"
            />
            <StatCard
              icon={AlertCircle}
              label="Not Booked"
              value={analytics.not_booked_farmers.toLocaleString()}
              color="orange"
            />
            <StatCard
              icon={TrendingUp}
              label="Booking %"
              value={`${analytics.booking_percentage.toFixed(1)}%`}
              color="purple"
            />
            <StatCard
              icon={Package}
              label="Total Urea (MT)"
              value={analytics.total_booked_urea_qty.toFixed(2)}
              color="emerald"
            />
            <StatCard
              icon={Copy}
              label="Matched"
              value={analytics.matched_count.toLocaleString()}
              color="green"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Filters</h3>
            </div>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Village</label>
              <select
                value={villageFilter}
                onChange={(e) => { setVillageFilter(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Villages</option>
                {uniqueVillages.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Crop</label>
              <select
                value={cropFilter}
                onChange={(e) => { setCropFilter(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Crops</option>
                {uniqueCrops.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dealer</label>
              <select
                value={dealerFilter}
                onChange={(e) => { setDealerFilter(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Dealers</option>
                {uniqueDealers.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="matched">Matched</option>
                <option value="unmatched">Unmatched</option>
                <option value="duplicate">Duplicate</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, Aadhaar, PPB, mobile, village, or booking ID..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Reports Section */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Generate Reports</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <ReportButton
              label="Village Not Booked"
              onClick={() => generateExcelReport('village_not_booked')}
              loading={generatingReport}
            />
            <ReportButton
              label="Farmer Status"
              onClick={() => generateExcelReport('farmer_booking_status')}
              loading={generatingReport}
            />
            <ReportButton
              label="Crop Demand"
              onClick={() => generateExcelReport('crop_wise_demand')}
              loading={generatingReport}
            />
            <ReportButton
              label="Dealer Report"
              onClick={() => generateExcelReport('dealer_wise_booking')}
              loading={generatingReport}
            />
            <ReportButton
              label="Mismatch Report"
              onClick={() => generateExcelReport('mismatch_report')}
              loading={generatingReport}
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Village-wise Bookings Chart */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Village-wise Bookings</h3>
            </div>
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-500">Loading chart...</div>}>
              <LazySimpleBarChart 
                data={(() => {
                  const villageData: Record<string, { booked: number; notBooked: number }> = {};
                  bookings.forEach(b => {
                    if (!villageData[b.village]) {
                      villageData[b.village] = { booked: 0, notBooked: 0 };
                    }
                    villageData[b.village].booked += 1;
                  });
                  return Object.entries(villageData)
                    .slice(0, 10)
                    .map(([village, data]) => ({
                      name: village,
                      booked: data.booked,
                      notBooked: data.notBooked
                    }));
                })()}
                dataKey="booked"
                nameKey="name"
              />
            </Suspense>
          </div>

          {/* Crop-wise Urea Demand Chart */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Crop-wise Urea Demand</h3>
            </div>
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-500">Loading chart...</div>}>
              <LazySimpleBarChart 
                data={(() => {
                  const cropData: Record<string, number> = {};
                  bookings.forEach(b => {
                    if (!cropData[b.crop]) {
                      cropData[b.crop] = 0;
                    }
                    cropData[b.crop] += b.urea_qty || 0;
                  });
                  return Object.entries(cropData)
                    .slice(0, 10)
                    .map(([crop, qty]) => ({
                      name: crop,
                      urea_qty: qty
                    }));
                })()}
                dataKey="urea_qty"
                nameKey="name"
              />
            </Suspense>
          </div>

          {/* Dealer-wise Booking Chart */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Dealer-wise Bookings</h3>
            </div>
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-500">Loading chart...</div>}>
              <LazySimpleBarChart 
                data={(() => {
                  const dealerData: Record<string, number> = {};
                  bookings.forEach(b => {
                    if (!dealerData[b.dealer_name]) {
                      dealerData[b.dealer_name] = 0;
                    }
                    dealerData[b.dealer_name] += 1;
                  });
                  return Object.entries(dealerData)
                    .slice(0, 10)
                    .map(([dealer, count]) => ({
                      name: dealer,
                      bookings: count
                    }));
                })()}
                dataKey="bookings"
                nameKey="name"
              />
            </Suspense>
          </div>

          {/* Match Status Distribution */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Match Status Distribution</h3>
            </div>
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-500">Loading chart...</div>}>
              <LazySimpleBarChart 
                data={(() => {
                  const statusData: Record<string, number> = {};
                  bookings.forEach(b => {
                    if (!statusData[b.status]) {
                      statusData[b.status] = 0;
                    }
                    statusData[b.status] += 1;
                  });
                  return Object.entries(statusData).map(([status, count]) => ({
                    name: status,
                    count: count
                  }));
                })()}
                dataKey="count"
                nameKey="name"
              />
            </Suspense>
          </div>
        </div>

        {/* Sync Logs */}
        {syncLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Recent Sync Logs</h3>
            </div>
            <div className="space-y-2">
              {syncLogs.slice(0, 5).map(log => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={log.status} />
                      <div>
                        <div className="font-medium">{log.sync_type === 'auto' ? 'Auto Sync' : 'Manual Upload'}</div>
                        <div className="text-gray-500 text-xs">
                          {new Date(log.started_at).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {log.status === 'completed' ? `${log.records_imported} imported` : log.status}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {log.status === 'completed' && `Matched: ${log.records_matched}, Unmatched: ${log.records_unmatched}`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed sync information */}
                  {(log.login_status || log.api_status || log.http_code || log.records_fetched !== null || log.records_inserted !== null || log.records_updated !== null || log.detailed_error_message) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {log.login_status && (
                        <div>
                          <span className="text-gray-500">Login:</span>
                          <span className={`ml-1 ${log.login_status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {log.login_status}
                          </span>
                        </div>
                      )}
                      {log.api_status && (
                        <div>
                          <span className="text-gray-500">API:</span>
                          <span className={`ml-1 ${log.api_status === 'success' ? 'text-green-600' : log.api_status === 'no_data' ? 'text-orange-600' : 'text-red-600'}`}>
                            {log.api_status}
                          </span>
                        </div>
                      )}
                      {log.http_code && (
                        <div>
                          <span className="text-gray-500">HTTP:</span>
                          <span className="ml-1">{log.http_code}</span>
                        </div>
                      )}
                      {log.records_fetched !== null && (
                        <div>
                          <span className="text-gray-500">Fetched:</span>
                          <span className="ml-1">{log.records_fetched}</span>
                        </div>
                      )}
                      {log.records_inserted !== null && (
                        <div>
                          <span className="text-gray-500">Inserted:</span>
                          <span className="ml-1">{log.records_inserted}</span>
                        </div>
                      )}
                      {log.records_updated !== null && (
                        <div>
                          <span className="text-gray-500">Updated:</span>
                          <span className="ml-1">{log.records_updated}</span>
                        </div>
                      )}
                      {log.detailed_error_message && (
                        <div className="col-span-2 md:col-span-4">
                          <span className="text-gray-500">Error:</span>
                          <span className="ml-1 text-red-600">{log.detailed_error_message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Urea Bookings</h3>
                <span className="text-sm text-gray-500">({filteredBookings.length} records)</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Farmer Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Father Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Aadhaar</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">PPB</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mobile</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Village</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Crop</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Dealer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Booking ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Qty (MT)</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{booking.farmer_name}</td>
                      <td className="px-4 py-3">{booking.father_name}</td>
                      <td className="px-4 py-3">{booking.aadhaar_no || '-'}</td>
                      <td className="px-4 py-3">{booking.ppb_no || '-'}</td>
                      <td className="px-4 py-3">{booking.mobile_no || '-'}</td>
                      <td className="px-4 py-3">{booking.village}</td>
                      <td className="px-4 py-3">{booking.crop}</td>
                      <td className="px-4 py-3">{booking.dealer_name}</td>
                      <td className="px-4 py-3">{booking.booking_id}</td>
                      <td className="px-4 py-3">{booking.booking_date || '-'}</td>
                      <td className="px-4 py-3">{booking.urea_qty.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {filteredBookings.length > PAGE_SIZE && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {Math.ceil(filteredBookings.length / PAGE_SIZE)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload Urea Report</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Upload CSV or Excel file with urea booking data
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>
              {uploadFile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">{uploadFile.name}</p>
                  <p className="text-xs text-gray-500">{(uploadFile.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualUpload}
                  disabled={!uploadFile || uploading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {uploading ? 'Processing...' : 'Upload & Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read selected file.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    matched: { bg: 'bg-green-100', text: 'text-green-700', label: 'Matched' },
    unmatched: { bg: 'bg-red-100', text: 'text-red-700', label: 'Unmatched' },
    duplicate: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Duplicate' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  const statusConfig = {
    completed: { color: 'text-green-500', icon: CheckCircle },
    failed: { color: 'text-red-500', icon: AlertCircle },
    running: { color: 'text-blue-500', icon: RefreshCw },
    pending: { color: 'text-gray-500', icon: Clock },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return <Icon className={`w-5 h-5 ${config.color} ${status === 'running' ? 'animate-spin' : ''}`} />;
}

function ReportButton({ label, onClick, loading }: { label: string, onClick: () => void, loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      <span>{loading ? 'Generating...' : label}</span>
    </button>
  );
}
