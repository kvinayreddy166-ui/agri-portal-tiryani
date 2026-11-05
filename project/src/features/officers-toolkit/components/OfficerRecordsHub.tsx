import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  Cloud,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import {
  OfficerCloudSyncService,
  type UnifiedOfficerRecord,
} from '../services/officerCloudSyncService';
import type { StatutoryCommodity } from '../../auth/types/officerAuth';

export function OfficerRecordsHub() {
  const { user, officerProfile, isOfficerUser, isAdminUser } = useAuth();
  const { t } = useLanguage();

  const [records, setRecords] = useState<UnifiedOfficerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'order' | 'inspection' | 'sample'>('all');
  const [commodityFilter, setCommodityFilter] = useState<'all' | StatutoryCommodity>('all');
  const [selectedRecord, setSelectedRecord] = useState<UnifiedOfficerRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<UnifiedOfficerRecord | null>(null);

  const loadRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await OfficerCloudSyncService.fetchAllOfficerRecords();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load officer records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      await OfficerCloudSyncService.deleteRecord(recordToDelete);
      setRecords((curr) => curr.filter((r) => r.id !== recordToDelete.id));
      if (selectedRecord?.id === recordToDelete.id) {
        setSelectedRecord(null);
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
    } finally {
      setRecordToDelete(null);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (categoryFilter !== 'all' && rec.category !== categoryFilter) return false;
      if (commodityFilter !== 'all' && rec.commodity !== commodityFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = rec.referenceNumber.toLowerCase().includes(query);
        const matchesEntity = rec.entityName.toLowerCase().includes(query);
        const matchesTitle = rec.title.toLowerCase().includes(query);
        const matchesLoc = rec.location.toLowerCase().includes(query);
        return matchesRef || matchesEntity || matchesTitle || matchesLoc;
      }
      return true;
    });
  }, [records, categoryFilter, commodityFilter, searchQuery]);

  const stats = useMemo(() => {
    const ordersCount = records.filter((r) => r.category === 'order').length;
    const inspectionsCount = records.filter((r) => r.category === 'inspection').length;
    const samplesCount = records.filter((r) => r.category === 'sample').length;
    const cloudCount = records.filter((r) => r.synced).length;
    const localCount = records.length - cloudCount;
    return {
      total: records.length,
      orders: ordersCount,
      inspections: inspectionsCount,
      samples: samplesCount,
      cloud: cloudCount,
      local: localCount,
    };
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Header and Officer Jurisdiction Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xs">
                <Archive className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('Officer Records & Cloud Archive', 'అధికారుల రికార్డులు & క్లౌడ్ భాండాగారం')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('Unified repository of your statutory notices, dealer inspection reports, and sampling memos.', 'మీ అధికారిక నోటీసులు, డీలర్ తనిఖీ నివేదికలు & సాంప్లింగ్ మెమోల రికార్డులు.')}
                </p>
              </div>
            </div>

            {/* Officer jurisdiction details */}
            {(officerProfile || isOfficerUser || isAdminUser) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {officerProfile?.designation || (isAdminUser ? 'MAO' : 'Agricultural Officer')} &middot; {officerProfile?.full_name || user?.email}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <MapPin className="h-3 w-3" />
                  {officerProfile?.mandal || 'Tiryani'}, {officerProfile?.district || 'Kumuram Bheem Asifabad'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  <Cloud className="h-3 w-3" />
                  {t('Cloud Backup Active', 'క్లౌడ్ బ్యాకప్ యాక్టివ్')}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadRecords(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t('Syncing...', 'సింక్ అవుతోంది...') : t('Sync / Refresh', 'సింక్ / రిఫ్రెష్')}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-xl font-black text-slate-900 dark:text-white">{stats.total}</div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t('Total Records', 'మొత్తం రికార్డులు')}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">{stats.orders}</div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t('Statutory Orders', 'చట్టబద్ధ ఉత్తర్వులు')}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-xl font-black text-blue-700 dark:text-blue-400">{stats.inspections}</div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t('Dealer Inspections', 'డీలర్ తనిఖీలు')}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-xl font-black text-amber-700 dark:text-amber-400">{stats.samples}</div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t('Sample Memos', 'సాంప్లింగ్ మెమోలు')}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search by firm, order number, or location...', 'డీలర్ పేరు, ఆర్డర్ నంబర్ లేదా ప్రాంతం ద్వారా వెతకండి...')}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">{t('All Categories', 'అన్ని విభాగాలు')}</option>
            <option value="order">{t('Orders & Notices', 'ఉత్తర్వులు & నోటీసులు')}</option>
            <option value="inspection">{t('Inspections', 'తనిఖీలు')}</option>
            <option value="sample">{t('Sample Memos', 'సాంప్లింగ్ మెమోలు')}</option>
          </select>

          {/* Commodity Filter */}
          <select
            value={commodityFilter}
            onChange={(e) => setCommodityFilter(e.target.value as typeof commodityFilter)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">{t('All Commodities', 'అన్ని వస్తువులు')}</option>
            <option value="fertilizer">{t('Fertilizer', 'ఎరువులు')}</option>
            <option value="seed">{t('Seed', 'విత్తనాలు')}</option>
            <option value="pesticide">{t('Pesticide', 'పురుగుమందులు')}</option>
          </select>
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 dark:border-slate-800 dark:bg-slate-900/30">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
            {t('Retrieving officer records from cloud and local cache...', 'రికార్డులను లోడ్ చేస్తోంది...')}
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Archive className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-100">
            {searchQuery ? t('No matching records found', 'సరిపోలే రికార్డులు కనుగొనబడలేదు') : t('No official records saved yet', 'ఇంకా ఎటువంటి రికార్డులు భద్రపరచబడలేదు')}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            {t('Statutory orders, notices, dealer inspections, and sampling memos created in the toolkit will appear here with automated cloud backup.', 'టూల్‌కిట్‌లో రూపొందించబడిన స్టాప్ సేల్ ఆర్డర్లు, తనిఖీలు & మెమోలు ఇక్కడ ఆటోమేటిక్‌గా కనిపిస్తాయి.')}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecords.map((record) => {
            const isOrder = record.category === 'order';
            const isInspection = record.category === 'inspection';

            return (
              <div
                key={record.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700/60"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                        isOrder
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : isInspection
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {record.title}
                    </span>

                    {record.synced ? (
                      <span
                        title={t('Backed up to cloud', 'క్లౌడ్‌కు బ్యాకప్ చేయబడింది')}
                        className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Cloud</span>
                      </span>
                    ) : (
                      <span
                        title={t('Saved locally on device', 'పరికరంలో స్థానికంగా ఉంది')}
                        className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        <Smartphone className="h-3 w-3" />
                        <span>Local</span>
                      </span>
                    )}
                  </div>

                  <h4 className="mt-2.5 truncate text-sm font-bold text-slate-900 dark:text-white" title={record.entityName}>
                    {record.entityName}
                  </h4>

                  <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-400">{t('Ref / No:', 'రిఫరెన్స్:')}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={record.referenceNumber}>
                        {record.referenceNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-400">{t('Date:', 'తేదీ:')}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{record.recordDate}</span>
                    </div>
                    {record.location && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">{t('Location:', 'ప్రాంతం:')}</span>
                        <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-300">{record.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(record)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                  >
                    <span>{t('View Details', 'వివరాలు చూడండి')}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordToDelete(record)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    title={t('Delete Record', 'రికార్డు తొలగించండి')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedRecord.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedRecord.referenceNumber} &middot; {selectedRecord.recordDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-xs">
                <div>
                  <span className="block font-semibold text-slate-400">{t('Entity / Firm Name', 'సంస్థ / డీలర్ పేరు')}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedRecord.entityName}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-400">{t('Jurisdiction / Location', 'పరిధి / ప్రాంతం')}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedRecord.location}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-400">{t('Record Type', 'రికార్డు రకం')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{selectedRecord.subType} ({selectedRecord.commodity})</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-400">{t('Storage Status', 'నిల్వ స్థితి')}</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {selectedRecord.synced ? t('Synced with Supabase Cloud', 'క్లౌడ్ సింక్ చేయబడింది') : t('Cached locally', 'పరికరంలో భద్రపరచబడింది')}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t('Payload Data / Form Entries', 'ఫారమ్ వివరాలు')}
                </h4>
                <pre className="max-h-72 overflow-y-auto rounded-xl bg-slate-900 p-4 text-[11px] font-mono text-emerald-300 leading-relaxed">
                  {JSON.stringify(selectedRecord.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {t('Close', 'మూసివేయి')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(recordToDelete)}
        title={t('Delete Officer Record', 'రికార్డును తొలగించాలా?')}
        message={t(
          `Are you sure you want to delete ${recordToDelete?.referenceNumber || 'this record'}? This will remove it from both cloud and local cache.`,
          `ఈ రికార్డును తొలగించాలనుకుంటున్నారా? ఇది క్లౌడ్ మరియు స్థానిక కాష్ నుండి తొలగించబడుతుంది.`
        )}
        confirmLabel={t('Delete Permanently', 'శాశ్వతంగా తొలగించు')}
        cancelLabel={t('Cancel', 'రద్దు')}
        onConfirm={() => void handleDeleteRecord()}
        onCancel={() => setRecordToDelete(null)}
      />
    </div>
  );
}
