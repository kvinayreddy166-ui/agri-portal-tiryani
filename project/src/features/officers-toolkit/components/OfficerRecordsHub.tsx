import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Archive,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Cloud,
  CloudOff,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import {
  OfficerCloudSyncService,
  type UnifiedOfficerRecord,
} from '../services/officerCloudSyncService';
import { OfficerDocumentArchiveService } from '../services/officerDocumentArchiveService';
import {
  OfficerReportExportService,
  type ReportExportOptions,
} from '../services/officerReportExportService';
import type {
  OfficerDocumentArchiveRecord,
  StorageOverviewStats,
  UploadStatus,
} from '../types/officerArchiveTypes';
import type { StatutoryCommodity } from '../../auth/types/officerAuth';

type DocumentCommodity = StatutoryCommodity;

const COMMODITY_BADGE_STYLES: Record<DocumentCommodity, string> = {
  fertilizer: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800/60',
  pesticide: 'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-800/60',
  seed: 'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800/60',
};

const COMMODITY_LABELS: Record<DocumentCommodity, { en: string; te: string }> = {
  fertilizer: { en: 'Fertilizer', te: 'ఎరువు' },
  pesticide: { en: 'Pesticide', te: 'పురుగుమందు' },
  seed: { en: 'Seed', te: 'విత్తనం' },
};

/** Resolves the commodity for a sample document from archive metadata or source module. */
function getDocumentCommodity(doc: OfficerDocumentArchiveRecord): DocumentCommodity | null {
  const metaCommodity = String((doc.metadata_json as Record<string, unknown> | undefined)?.commodity ?? '').toLowerCase();
  if (metaCommodity === 'fertilizer' || metaCommodity === 'pesticide' || metaCommodity === 'seed') {
    return metaCommodity;
  }
  const moduleName = String(doc.source_module || '').toLowerCase();
  if (moduleName.includes('pesticide') || moduleName.includes('insecticide')) return 'pesticide';
  if (moduleName.includes('seed')) return 'seed';
  if (moduleName.includes('fertilizer') || moduleName.includes('fertiliser') || moduleName === 'covering_letter') return 'fertilizer';
  return null;
}

/** Product labels for a sample document: covering-letter sampleProducts, crop+variety, or statutory productName. */
function getSampleProductLabels(doc: OfficerDocumentArchiveRecord): string[] {
  const meta = doc.metadata_json as Record<string, unknown> | undefined;
  if (!meta) return [];
  const products = meta.sampleProducts;
  if (Array.isArray(products)) {
    const labels = products
      .map((p) => String((p as Record<string, unknown>)?.label ?? '').trim())
      .filter(Boolean);
    if (labels.length > 0) return labels;
  }
  // Statutory forms keep the full form payload — build "Crop — Variety" like covering-letter badges
  const payload = (meta.payload || {}) as Record<string, unknown>;
  const pick = (...vals: unknown[]) => vals.map((v) => String(v ?? '').trim()).find(Boolean) || '';
  const crop = pick(meta.cropName, meta.crop, meta.seedName, payload.crop, payload.seedName, payload.cropName);
  const variety = pick(meta.variety, meta.varietyName, meta.kindVariety, payload.variety, payload.varietyName, payload.kindVariety);
  if (crop) return [variety ? `${crop} (${variety})` : crop];
  if (variety) return [variety];
  const tradeName = pick(meta.tradeName, payload.tradeName);
  const pesticideParts = [meta.technicalName ?? payload.technicalName, meta.activeIngredient ?? payload.activeIngredient, meta.formulationType ?? payload.formulationType]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean);
  const pesticideLabel = tradeName
    ? (pesticideParts.length ? `${tradeName} (${pesticideParts.join(', ')})` : tradeName)
    : pesticideParts.join(', ');
  if (pesticideLabel) return [pesticideLabel];
  const productName = String(meta.productName ?? '').trim();
  return productName ? [productName] : [];
}

/** Renders commodity + product badges for sample-category documents. */
function SampleDocumentBadges({ doc, t }: { doc: OfficerDocumentArchiveRecord; t: (en: string, te: string) => string }) {
  if (doc.document_category !== 'sample') return null;
  const commodity = getDocumentCommodity(doc);
  const products = getSampleProductLabels(doc);
  if (!commodity && products.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {commodity && (
        <span
          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ring-1 ${COMMODITY_BADGE_STYLES[commodity]}`}
          title={t('Sample commodity', 'నమూనా వస్తువు')}
        >
          {t(COMMODITY_LABELS[commodity].en, COMMODITY_LABELS[commodity].te)}
        </span>
      )}
      {products.map((label, index) => (
        <span
          key={`${doc.id}-product-${index}`}
          className="inline-flex max-w-[220px] items-center truncate rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-800 ring-1 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800/60"
          title={label}
        >
          {label}
        </span>
      ))}
    </span>
  );
}

/** Product labels for a form record: sampleProducts badges, crop+variety, or product fields in details. */
function getRecordProductLabels(record: UnifiedOfficerRecord): string[] {
  const details = (record.details || {}) as Record<string, unknown>;
  const products = details.sampleProducts;
  if (Array.isArray(products)) {
    const labels = products
      .map((p) => String((p as Record<string, unknown>)?.label ?? '').trim())
      .filter(Boolean);
    if (labels.length > 0) return labels;
  }
  const pick = (...vals: unknown[]) => vals.map((v) => String(v ?? '').trim()).find(Boolean) || '';
  const crop = pick(details.cropName, details.crop, details.seedName);
  const variety = pick(details.variety, details.varietyName, details.kindVariety);
  if (crop) return [variety ? `${crop} (${variety})` : crop];
  if (variety) return [variety];
  const tradeName = pick(details.tradeName);
  const pesticideParts = [details.technicalName, details.activeIngredient, details.formulationType]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean);
  const pesticideLabel = tradeName
    ? (pesticideParts.length ? `${tradeName} (${pesticideParts.join(', ')})` : tradeName)
    : pesticideParts.join(', ');
  const product = pick(
    details.productName,
    details.fertilizerName,
    pesticideLabel,
    details.activeIngredient,
    details.insecticideCommonName,
    details.nameGrade,
    details.insecticideName,
    details.product
  );
  return product ? [product] : [];
}

/** Renders product badges (crop — variety / fertilizer / technical name) on form-record cards. */
function RecordProductBadges({ record }: { record: UnifiedOfficerRecord }) {
  const labels = getRecordProductLabels(record);
  if (labels.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {labels.map((label, index) => (
        <span
          key={`${record.id}-product-${index}`}
          className="inline-flex max-w-[220px] items-center truncate rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-800 ring-1 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800/60"
          title={label}
        >
          {label}
        </span>
      ))}
    </span>
  );
}

/** Code number for a form record: statutory "Code No. of sample" fields, falling back to the reference number. */
function getRecordCodeNo(record: UnifiedOfficerRecord): string {
  const details = (record.details || {}) as Record<string, unknown>;
  const nested = (details.form || details.data || {}) as Record<string, unknown>;
  const pick = (...vals: unknown[]) =>
    vals.map((v) => String(v ?? '').trim()).find(Boolean) || '';
  return pick(
    details.codeNo,
    details.codeNumber,
    details.sampleCode,
    details.cdaCode,
    details.sampleSerialNumber,
    details.no,
    nested.codeNo,
    nested.codeNumber,
    nested.sampleCode,
    record.referenceNumber
  );
}

/** Batch / lot number for a form record: statutory batch fields, falling back to nested form payloads. */
function getRecordBatchNo(record: UnifiedOfficerRecord): string {
  const details = (record.details || {}) as Record<string, unknown>;
  const nested = (details.form || details.data || {}) as Record<string, unknown>;
  const pick = (...vals: unknown[]) =>
    vals.map((v) => String(v ?? '').trim()).find(Boolean) || '';
  return pick(
    details.batchNo,
    details.batchNumber,
    details.batchLotNumber,
    details.lotNo,
    details.batchDetails,
    nested.batchNo,
    nested.batchNumber,
    nested.batchLotNumber,
    nested.lotNo,
    nested.batchDetails
  );
}

/** Code number for an archived document: document_number first, then metadata code/sample fields. */
function getDocCodeNo(doc: OfficerDocumentArchiveRecord): string {
  const meta = (doc.metadata_json || {}) as Record<string, unknown>;
  const pick = (...vals: unknown[]) =>
    vals.map((v) => String(v ?? '').trim()).find(Boolean) || '';
  return pick(
    doc.document_number,
    meta.codeNo,
    meta.codeNumber,
    meta.sampleCode,
    meta.cdaCode,
    meta.sampleSerialNumber,
    meta.referenceNumber
  );
}

export function OfficerRecordsHub() {
  const { user, officerProfile } = useAuth();
  const { t } = useLanguage();

  // View tabs: documents (archived files) vs records (statutory form records)
  const [activeTab, setActiveTab] = useState<'documents' | 'records'>('documents');

  // Display Mode: 'list' (default as requested) vs 'grid'
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // R2 Document Archive State
  const [documents, setDocuments] = useState<OfficerDocumentArchiveRecord[]>([]);
  const [storageStats, setStorageStats] = useState<StorageOverviewStats>({
    totalDocuments: 0,
    totalStorageBytes: 0,
    totalOriginalBytes: 0,
    totalStoredBytes: 0,
    storageSavedBytes: 0,
    compressionPercentage: 0,
    totalPdfs: 0,
    totalDocx: 0,
    successfullyUploaded: 0,
    pendingUploads: 0,
    failedUploads: 0,
  });
  const [retryingQueue, setRetryingQueue] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  // Form Records State (existing)
  const [records, setRecords] = useState<UnifiedOfficerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingRecords, setSyncingRecords] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [commodityFilter, setCommodityFilter] = useState<'all' | StatutoryCommodity>('all');

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<UnifiedOfficerRecord | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ doc: OfficerDocumentArchiveRecord; url: string } | null>(null);

  // Mobile browsers (especially iOS Safari) cannot render PDFs/DOCX inside iframes
  const isMobileDevice = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (typeof window !== 'undefined' && window.innerWidth < 768)),
    []
  );
  const [renameDoc, setRenameDoc] = useState<OfficerDocumentArchiveRecord | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<UnifiedOfficerRecord | null>(null);
  const [docToDelete, setDocToDelete] = useState<OfficerDocumentArchiveRecord | null>(null);
  const [exportingType, setExportingType] = useState<'excel' | 'pdf' | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen]);

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Check genuine Cloudflare R2 health (never display static active)
      await OfficerDocumentArchiveService.checkR2StorageHealth();

      // 2. Fetch Archived Documents & Storage Overview
      const [docsData, statsData, formsData] = await Promise.all([
        OfficerDocumentArchiveService.fetchOfficerDocuments(),
        OfficerDocumentArchiveService.getStorageOverview(),
        OfficerCloudSyncService.fetchAllOfficerRecords(),
      ]);

      setDocuments(docsData);
      setStorageStats(statsData);
      setRecords(formsData);
    } catch (err) {
      console.error('Failed to load officer archives:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAllData();

    const handleDocumentArchived = () => {
      void loadAllData(true);
    };

    window.addEventListener('agronix:officer_document_archived', handleDocumentArchived);

    const handleLogout = () => {
      setDocuments([]);
      setRecords([]);
      setStorageStats({
        totalDocuments: 0,
        totalStorageBytes: 0,
        totalOriginalBytes: 0,
        totalStoredBytes: 0,
        storageSavedBytes: 0,
        compressionPercentage: 0,
        totalPdfs: 0,
        totalDocx: 0,
        successfullyUploaded: 0,
        pendingUploads: 0,
        failedUploads: 0,
      });
      void loadAllData(true);
    };

    window.addEventListener('agronix:officer_user_logout', handleLogout);

    return () => {
      window.removeEventListener('agronix:officer_document_archived', handleDocumentArchived);
      window.removeEventListener('agronix:officer_user_logout', handleLogout);
    };
  }, [loadAllData]);

  // Handle Retry of Failed Uploads
  const handleRetryFailedUploads = async () => {
    setRetryingQueue(true);
    try {
      const res = await OfficerDocumentArchiveService.retryFailedUploads();
      await loadAllData(true);
      const detail = res.errors && res.errors.length > 0 ? `\n\n${res.errors.slice(0, 3).join('\n')}` : '';
      alert(t(`Retry finished: ${res.succeeded} uploaded, ${res.failed} remaining.${detail}`, `రీట్రై ముగిసింది: ${res.succeeded} అప్‌లోడ్ అయ్యాయి, ${res.failed} మిగిలి ఉన్నాయి.${detail}`));
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetryingQueue(false);
    }
  };

  // Fallback jurisdiction for legacy records that predate stored mandal/district
  const officerLocationFallback = [officerProfile?.mandal, officerProfile?.district]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean)
    .join(', ');

  // Sync status for local (not-yet-cloud) form records
  const pendingSyncCount = useMemo(() => records.filter((r) => !r.synced).length, [records]);
  const cloudRecordCount = useMemo(() => records.filter((r) => r.synced).length, [records]);

  // Manual "Sync now" — re-push every local-only record to Supabase
  const handleSyncNow = async () => {
    const localRecords = records.filter((r) => !r.synced);
    if (localRecords.length === 0 || syncingRecords) return;
    setSyncingRecords(true);
    setSyncFeedback(null);
    let succeeded = 0;
    let failed = 0;
    for (const record of localRecords) {
      try {
        const res = await OfficerCloudSyncService.resyncLocalRecord(record);
        if (res?.syncedToCloud) succeeded += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }
    setSyncingRecords(false);
    setSyncFeedback(
      t(
        `Sync complete: ${succeeded} record(s) backed up to cloud${failed > 0 ? `, ${failed} still pending` : ''}.`,
        `సింక్ పూర్తయింది: ${succeeded} రికార్డులు క్లౌడ్‌కు బ్యాకప్ అయ్యాయి${failed > 0 ? `, ${failed} ఇంకా పెండింగ్` : ''}.`
      )
    );
    await loadAllData(true);
  };

  // Document Management Actions
  const handlePreview = async (doc: OfficerDocumentArchiveRecord) => {
    try {
      const url = await OfficerDocumentArchiveService.previewDocument(doc);
      setPreviewDoc({ doc, url });
    } catch (err) {
      alert(t('Unable to load document preview. You can still download the file.', 'పత్రం ప్రివ్యూ లోడ్ చేయడం సాధ్యపడలేదు. మీరు ఫైల్‌ను డౌన్‌లోడ్ చేసుకోవచ్చు.'));
    }
  };

  const handleDownload = async (doc: OfficerDocumentArchiveRecord) => {
    try {
      await OfficerDocumentArchiveService.downloadDocument(doc);
    } catch (err) {
      alert(t('Download failed. Please check network connection.', 'డౌన్‌లోడ్ విఫలమైంది. దయచేసి నెట్‌వర్క్ తనిఖీ చేయండి.'));
    }
  };

  // Upload a single locally stored document to the cloud on demand
  const handleUploadToCloud = async (doc: OfficerDocumentArchiveRecord) => {
    setUploadingDocId(doc.id);
    try {
      const res = await OfficerDocumentArchiveService.uploadDocumentToCloud(doc);
      if (res.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, upload_status: 'saved_to_cloud' as UploadStatus } : d))
        );
        const newStats = await OfficerDocumentArchiveService.getStorageOverview();
        setStorageStats(newStats);
      } else {
        alert(res.message || t('Upload to cloud failed. Please try again.', 'క్లౌడ్‌కు అప్‌లోడ్ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'));
      }
    } catch (err) {
      console.error('Upload to cloud failed:', err);
      alert(t('Upload to cloud failed. Please try again.', 'క్లౌడ్‌కు అప్‌లోడ్ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'));
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleSaveRename = async () => {
    if (!renameDoc || !renameInput.trim()) return;
    try {
      const success = await OfficerDocumentArchiveService.renameDocument(renameDoc.id, renameInput.trim());
      if (success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === renameDoc.id ? { ...d, document_name: renameInput.trim() } : d))
        );
      }
    } finally {
      setRenameDoc(null);
      setRenameInput('');
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      await OfficerDocumentArchiveService.deleteDocument(
        docToDelete.id,
        docToDelete.object_key,
        docToDelete.original_sha256 || docToDelete.content_hash
      );
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      // Refresh storage overview
      const newStats = await OfficerDocumentArchiveService.getStorageOverview();
      setStorageStats(newStats);
    } finally {
      setDocToDelete(null);
    }
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      await OfficerCloudSyncService.deleteRecord(recordToDelete);
      setRecords((curr) => curr.filter((r) => r.id !== recordToDelete.id));
      if (selectedRecord?.id === recordToDelete.id) {
        setSelectedRecord(null);
      }
    } finally {
      setRecordToDelete(null);
    }
  };

  // Available years extracted from document history
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    documents.forEach((d) => {
      if (d.document_date && d.document_date.length >= 4) {
        years.add(d.document_date.slice(0, 4));
      }
    });
    if (years.size === 0) years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [documents]);

  // Parse a record/document date string to a timestamp (supports ISO and DD-MM-YYYY / DD/MM/YYYY)
  const parseItemDate = useCallback((value?: string | null): number => {
    if (!value) return 0;
    const iso = new Date(value).getTime();
    if (!Number.isNaN(iso)) return iso;
    const m = value.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
    return 0;
  }, []);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (categoryFilter !== 'all' && doc.document_category !== categoryFilter) return false;

      // Commodity filter (sample documents only)
      if (commodityFilter !== 'all') {
        if (doc.document_category !== 'sample') return false;
        if (getDocumentCommodity(doc) !== commodityFilter) return false;
      }

      // Year Filter
      if (yearFilter !== 'all') {
        const docYear = doc.document_date ? doc.document_date.slice(0, 4) : '';
        if (docYear !== yearFilter) return false;
      }

      // Month Filter
      if (monthFilter !== 'all') {
        const docMonth = doc.document_date ? doc.document_date.slice(5, 7) : '';
        if (docMonth !== monthFilter) return false;
      }

      if (dateFilter !== 'all') {
        const docTime = new Date(doc.document_date).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateFilter === 'today' && now - docTime > oneDay) return false;
        if (dateFilter === '7days' && now - docTime > 7 * oneDay) return false;
        if (dateFilter === '30days' && now - docTime > 30 * oneDay) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = doc.document_name.toLowerCase().includes(q);
        const origMatch = doc.original_filename?.toLowerCase().includes(q);
        const numMatch = doc.document_number ? doc.document_number.toLowerCase().includes(q) : false;
        const modMatch = (doc.source_module || '').toLowerCase().includes(q);
        // Search metadata too: product/crop names, firm/dealer, sample codes, badges
        const metaMatch = JSON.stringify(doc.metadata_json || {}).toLowerCase().includes(q);
        return Boolean(nameMatch || origMatch || numMatch || modMatch || metaMatch);
      }

      return true;
    });
  }, [documents, categoryFilter, commodityFilter, yearFilter, monthFilter, dateFilter, searchQuery]);

  // Filtered Form Records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (categoryFilter !== 'all' && rec.category !== categoryFilter) return false;
      if (commodityFilter !== 'all' && rec.commodity !== commodityFilter) return false;

      // Year / Month / Quick-date filters (recordDate may be ISO or DD-MM-YYYY)
      const recTime = parseItemDate(rec.recordDate);
      if (yearFilter !== 'all' && recTime) {
        if (new Date(recTime).getFullYear().toString() !== yearFilter) return false;
      }
      if (monthFilter !== 'all' && recTime) {
        if ((new Date(recTime).getMonth() + 1).toString().padStart(2, '0') !== monthFilter) return false;
      }
      if (dateFilter !== 'all' && recTime) {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateFilter === 'today' && now - recTime > oneDay) return false;
        if (dateFilter === '7days' && now - recTime > 7 * oneDay) return false;
        if (dateFilter === '30days' && now - recTime > 30 * oneDay) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = (rec.referenceNumber || '').toLowerCase().includes(query);
        const matchesEntity = (rec.entityName || '').toLowerCase().includes(query);
        const matchesTitle = (rec.title || '').toLowerCase().includes(query);
        const matchesLoc = (rec.location || '').toLowerCase().includes(query);
        // Search record details too: product/crop names, firm, batch, sample code
        const detailsMatch = JSON.stringify(rec.details || {}).toLowerCase().includes(query);
        return matchesRef || matchesEntity || matchesTitle || matchesLoc || detailsMatch;
      }
      return true;
    });
  }, [records, categoryFilter, commodityFilter, yearFilter, monthFilter, dateFilter, searchQuery, parseItemDate]);

  // Merged view: documents + records interleaved, newest first
  const mergedItems = useMemo(() => {
    const docs = filteredDocuments.map((doc) => ({
      kind: 'document' as const,
      id: `doc-${doc.id}`,
      time: parseItemDate(doc.document_date) || new Date(doc.created_at).getTime() || 0,
      doc,
    }));
    const recs = filteredRecords.map((record) => ({
      kind: 'record' as const,
      id: `rec-${record.id}`,
      time: parseItemDate(record.recordDate) || new Date(record.createdAt).getTime() || 0,
      record,
    }));
    return [...docs, ...recs].sort((a, b) => b.time - a.time);
  }, [filteredDocuments, filteredRecords, parseItemDate]);

  // Items visible under the active tab
  const visibleItems = useMemo(() => {
    if (activeTab === 'documents') return mergedItems.filter((i) => i.kind === 'document');
    return mergedItems.filter((i) => i.kind === 'record');
  }, [mergedItems, activeTab]);

  // Export Report to Excel or PDF
  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      setExportingType(type);
      const options: ReportExportOptions = {
        activeTab: activeTab === 'records' ? 'forms' : activeTab,
        categoryFilter,
        commodityFilter,
        searchQuery,
        officerName: officerProfile?.full_name || user?.email || 'Agricultural Officer',
        designation: officerProfile?.designation || 'Agricultural Officer',
        qualification: officerProfile?.qualification,
        location: officerProfile?.mandal || officerProfile?.district || 'Telangana',
        district: officerProfile?.district,
      };

      const rows = OfficerReportExportService.extractRows(
        filteredDocuments,
        filteredRecords,
        options
      );

      if (rows.length === 0) {
        alert(t('No records found to export.', 'ఎగుమతి చేయడానికి రికార్డులు ఏవీ కనుగొనబడలేదు.'));
        return;
      }

      if (type === 'excel') {
        await OfficerReportExportService.exportToExcel(rows, options);
      } else {
        await OfficerReportExportService.exportToPdf(rows, options);
      }
    } catch (err) {
      console.error('Failed to export report:', err);
      alert(t('Failed to export report. Please try again.', 'నివేదిక ఎగుమతి విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'));
    } finally {
      setExportingType(null);
    }
  };

  // Format File Size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Render Status Badge
  const renderUploadStatusBadge = (status: UploadStatus) => {
    switch (status) {
      case 'saved_to_cloud':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            <span>Saved to Cloud</span>
          </span>
        );
      case 'uploading':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Uploading</span>
          </span>
        );
      case 'compressing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Compressing</span>
          </span>
        );
      case 'pending_retry':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200">
            <RefreshCw className="h-3 w-3" />
            <span>Pending Retry</span>
          </span>
        );
      case 'upload_failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Upload Failed</span>
          </span>
        );
      case 'local_only':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="h-3 w-3 text-slate-500" />
            <span>{t('Local Draft', 'స్థానిక డ్రాఫ్ట్')}</span>
          </span>
        );
      case 'generated':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <FileText className="h-3 w-3" />
            <span>Generated</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Officer Jurisdiction Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-600 via-gold-400 to-emerald-600" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-gold-300 shadow-xs ring-1 ring-emerald-800">
                <Archive className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('Saved Records & Storage', 'సేవ్ చేసిన రికార్డులు & స్టోరేజ్')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('Archived documents and statutory records for agricultural officers.', 'అధికారుల భద్రపరచిన పత్రాలు & చట్టబద్ధ రికార్డులు.')}
                </p>
              </div>
            </div>

                      </div>

          <div className="flex flex-wrap items-center gap-2">

            {storageStats.pendingUploads + storageStats.failedUploads > 0 && (
              <button
                type="button"
                onClick={() => void handleRetryFailedUploads()}
                disabled={retryingQueue}
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-300 bg-orange-50 px-3.5 py-2.5 text-xs font-bold text-orange-800 transition hover:bg-orange-100 disabled:opacity-50 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
              >
                <RefreshCw className={`h-4 w-4 ${retryingQueue ? 'animate-spin' : ''}`} />
                <span>{retryingQueue ? t('Retrying...', 'రీట్రై అవుతోంది...') : `${t('Retry Pending', 'పెండింగ్ అప్‌లోడ్స్')} (${storageStats.pendingUploads})`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void loadAllData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t('Refreshing...', 'రిఫ్రెష్ అవుతోంది...') : t('Refresh Records', 'రిఫ్రెష్')}</span>
            </button>
          </div>
        </div>

        {/* Comprehensive Storage Overview — Structured KPI Cards & File Pipeline Status */}
        <div className="mt-5 space-y-3">
          {/* Primary 3-card metric row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-600 to-teal-600" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('Total Documents', 'మొత్తం పత్రాలు')}</span>
                <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{storageStats.totalDocuments}</div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{t('Archived officer files', 'భద్రపరిచిన రికార్డులు')}</p>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-3.5 shadow-2xs dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-emerald-600" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">{t('Saved to Cloud', 'క్లౌడ్ లో భద్రపరిచినవి')}</span>
                <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200">
                  <Cloud className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-300">{storageStats.successfullyUploaded}</div>
              <p className="mt-0.5 text-[11px] text-emerald-700/80 dark:text-emerald-400">{t('Synced to cloud storage', 'క్లౌడ్ నిల్వకు సమించబడింది')}</p>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-600 to-blue-600" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('Total Storage Used', 'మొత్తం నిల్వ')}</span>
                <span className="rounded-lg bg-sky-50 p-1.5 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                  <Archive className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {formatBytes(storageStats.totalStoredBytes || storageStats.totalStorageBytes)}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {t('Compressed cloud footprint', 'కంప్రెస్డ్ నిల్వ')}
              </p>
              {storageStats.storageSavedBytes > 0 && (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {t(
                    `${formatBytes(storageStats.storageSavedBytes)} saved (${storageStats.compressionPercentage}%)`,
                    `${formatBytes(storageStats.storageSavedBytes)} ఆదా (${storageStats.compressionPercentage}%)`
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Secondary 4-metric row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 text-center dark:border-slate-800 dark:bg-slate-800/40">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Total PDFs', 'మొత్తం పీడీఎఫ్')}</div>
              <div className="mt-1 text-base font-black text-slate-800 dark:text-slate-200">{storageStats.totalPdfs}</div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 text-center dark:border-slate-800 dark:bg-slate-800/40">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Total DOCX', 'మొత్తం వర్డ్')}</div>
              <div className="mt-1 text-base font-black text-slate-800 dark:text-slate-200">{storageStats.totalDocx}</div>
            </div>

            <div className={`rounded-xl border p-2.5 text-center ${
              storageStats.pendingUploads > 0
                ? 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                : 'border-slate-200/80 bg-slate-50/60 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40'
            }`}>
              <div className="text-xs font-semibold">{t('Pending Uploads', 'పెండింగ్ అప్‌లోడ్లు')}</div>
              <div className="mt-1 text-base font-black">{storageStats.pendingUploads}</div>
            </div>

            <div className={`rounded-xl border p-2.5 text-center ${
              storageStats.failedUploads > 0
                ? 'border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                : 'border-slate-200/80 bg-slate-50/60 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40'
            }`}>
              <div className="text-xs font-semibold">{t('Failed Uploads', 'విఫలమైన అప్‌లోడ్లు')}</div>
              <div className="mt-1 text-base font-black">{storageStats.failedUploads}</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs: All / Documents / Records */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {([
          { key: 'documents', label: t('Documents', 'పత్రాలు') },
          { key: 'records', label: t('Records', 'రికార్డులు') },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              activeTab === tab.key
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
              activeTab === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {tab.key === 'documents' ? filteredDocuments.length : filteredRecords.length}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full md:w-1/2 lg:w-2/5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search by name, number, firm, product, or module...', 'పేరు, నంబర్, డీలర్, ఉత్పత్తి లేదా మాడ్యూల్ ద్వారా వెతకండి...')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-emerald-900/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">{t('All Categories', 'అన్ని విభాగాలు')}</option>
            <option value="order">{t('Statutory Orders', 'ఉత్తర్వులు')}</option>
            <option value="notice">{t('Show Cause Notices', 'నోటీసులు')}</option>
            <option value="inspection">{t('Inspections', 'తనిఖీలు')}</option>
            <option value="sample">{t('Sample Memos', 'సాంప్లింగ్ మెమోలు')}</option>
            <option value="tour_diary">{t('Tour Diaries', 'పర్యటన డైరీలు')}</option>
          </select>

          {/* Commodity filter — applies to sample documents and all form records */}
          <select
            value={commodityFilter}
            onChange={(e) => setCommodityFilter(e.target.value as typeof commodityFilter)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">{t('All Commodities', 'అన్ని వస్తువులు')}</option>
            <option value="fertilizer">{t('Fertilizer', 'ఎరువు')}</option>
            <option value="pesticide">{t('Pesticide', 'పురుగుమందు')}</option>
            <option value="seed">{t('Seed', 'విత్తనం')}</option>
          </select>

          {/* Year Filter */}
          {availableYears.length > 0 && (
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">{t('All Years', 'అన్ని సంవత్సరాలు')}</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          )}

          {/* Month Filter */}
          {(
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">{t('All Months', 'అన్ని నెలలు')}</option>
              <option value="01">01 - {t('Jan', 'జన')}</option>
              <option value="02">02 - {t('Feb', 'ఫిబ్ర')}</option>
              <option value="03">03 - {t('Mar', 'మార్చి')}</option>
              <option value="04">04 - {t('Apr', 'ఏప్రి')}</option>
              <option value="05">05 - {t('May', 'మే')}</option>
              <option value="06">06 - {t('Jun', 'జూన్')}</option>
              <option value="07">07 - {t('Jul', 'జూలై')}</option>
              <option value="08">08 - {t('Aug', 'ఆగ')}</option>
              <option value="09">09 - {t('Sep', 'సెప్టెం')}</option>
              <option value="10">10 - {t('Oct', 'అక్టో')}</option>
              <option value="11">11 - {t('Nov', 'నవం')}</option>
              <option value="12">12 - {t('Dec', 'డిసెం')}</option>
            </select>
          )}

          {/* Quick Date Filter — applies to both files and records */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">{t('All Quick Dates', 'అన్ని తేదీలు')}</option>
            <option value="today">{t('Today', 'ఈ రోజు')}</option>
            <option value="7days">{t('Last 7 Days', 'గత 7 రోజులు')}</option>
            <option value="30days">{t('Last 30 Days', 'గత 30 రోజులు')}</option>
          </select>

          {/* Export Dropdown Button (Tucks Excel & PDF inside) — records tab only */}
          {activeTab === 'records' && (
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              disabled={exportingType !== null || visibleItems.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title={t('Export Register & Reports', 'రిజిస్టర్ & నివేదికలను ఎగుమతి చేయండి')}
              aria-haspopup="true"
              aria-expanded={isExportMenuOpen}
            >
              {exportingType !== null ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{t('Export', 'ఎగుమతి')}</span>
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                  isExportMenuOpen ? 'rotate-180 text-emerald-600' : ''
                }`}
              />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-32 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-30 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    void handleExport('excel');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>EXCEL</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    void handleExport('pdf');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-800 dark:text-slate-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition border-t border-slate-100 dark:border-slate-700/60"
                >
                  <Printer className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>PDF</span>
                </button>

              </div>
            )}
          </div>
          )}

          {/* View Mode Toggle: List (default) vs Card Grid */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-2 transition ${
                viewMode === 'list'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title={t('List View', 'జాబితా దృశ్యం')}
              aria-label={t('List View', 'జాబితా దృశ్యం')}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-2 transition ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title={t('Card Grid View', 'కార్డ్ గ్రిడ్ దృశ్యం')}
              aria-label={t('Card Grid View', 'కార్డ్ గ్రిడ్ దృశ్యం')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 dark:border-slate-800 dark:bg-slate-900/30">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
            {t('Retrieving officer archives and storage stats...', 'రికార్డులను లోడ్ చేస్తోంది...')}
          </p>
        </div>
      ) : (
        <>
          {/* Sync status center — covers both form-record sync and manual document uploads */}
          {(() => {
            const pendingDocs = storageStats.pendingUploads + storageStats.failedUploads;
            const hasPending = pendingSyncCount > 0 || pendingDocs > 0;
            return (
              <div
                className={`mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 ${
                  hasPending
                    ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30'
                    : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  {hasPending ? (
                    <CloudOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className={hasPending ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-800 dark:text-emerald-200'}>
                    {hasPending
                      ? [
                          pendingSyncCount > 0
                            ? t(
                                `${pendingSyncCount} record(s) saved locally — not yet backed up to cloud`,
                                `${pendingSyncCount} రికార్డులు స్థానికంగా ఉన్నాయి — ఇంకా క్లౌడ్‌కు బ్యాకప్ కాలేదు`
                              )
                            : '',
                          pendingDocs > 0
                            ? t(
                                `${pendingDocs} document(s) pending cloud upload — upload manually from Documents tab`,
                                `${pendingDocs} పత్రాలు క్లౌడ్ అప్‌లోడ్ కోసం పెండింగ్ — పత్రాల ట్యాబ్ నుండి మాన్యువల్‌గా అప్‌లోడ్ చేయండి`
                              )
                            : '',
                        ].filter(Boolean).join(' · ')
                      : t('All records and documents are backed up to cloud', 'అన్ని రికార్డులు & పత్రాలు క్లౌడ్‌కు బ్యాకప్ అయ్యాయి')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    ({cloudRecordCount}/{records.length} {t('records', 'రికార్డులు')} · {storageStats.successfullyUploaded}/{documents.length} {t('docs', 'పత్రాలు')} {t('in cloud', 'క్లౌడ్‌లో')})
                  </span>
                </div>
                {pendingSyncCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleSyncNow()}
                    disabled={syncingRecords || refreshing}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {syncingRecords ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {syncingRecords ? t('Syncing…', 'సింక్ అవుతోంది…') : t('Sync now', 'ఇప్పుడు సింక్ చేయండి')}
                  </button>
                )}
              </div>
            );
          })()}
          {syncFeedback && (
            <p className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              {syncFeedback}
            </p>
          )}

        {visibleItems.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Archive className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-100">
              {searchQuery ? t('No matching records found', 'సరిపోలే రికార్డులు కనుగొనబడలేదు') : t('No records saved yet', 'ఇంకా రికార్డులు భద్రపరచబడలేదు')}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              {t('Statutory orders, notices, inspections, sampling memos, and generated documents created in the toolkit will appear here.', 'టూల్‌కిట్‌లో రూపొందించబడిన ఉత్తర్వులు, తనిఖీలు, మెమోలు & పత్రాలు ఇక్కడ ఆటోమేటిక్‌గా కనిపిస్తాయి.')}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          // Merged List View (Default)
          <div className="space-y-2.5">
            {visibleItems.map((item) => {
              if (item.kind === 'record') {
                const record = item.record;
                const isOrder = record.category === 'order';
                const isInspection = record.category === 'inspection';

                return (
                <div
                  key={item.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <ClipboardList className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isOrder
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : isInspection
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {record.title}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="font-bold text-left text-slate-900 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-400 truncate max-w-md text-sm sm:text-base cursor-pointer"
                          title={record.entityName}
                        >
                          {record.entityName}
                        </button>

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

                        <RecordProductBadges record={record} />
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {record.referenceNumber && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">{t('Code No:', 'కోడ్ నం:')}</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{getRecordCodeNo(record)}</span>
                          </div>
                        )}
                        {getRecordBatchNo(record) && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">{t('Batch/Lot:', 'బ్యాచ్/లాట్:')}</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{getRecordBatchNo(record)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">{t('Date:', 'తేదీ:')}</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{record.recordDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(record)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <span>{t('View Details', 'వివరాలు చూడండి')}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecordToDelete(record)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      title={t('Delete Record', 'రికార్డు తొలగించండి')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                );
              }

              const doc = item.doc;
              const origSize = Number(doc.original_size_bytes ?? doc.original_size) || 0;

              return (
                <div
                  key={doc.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700/60 lg:flex-row lg:items-center lg:justify-between"
                >
                  {/* Left: Icon + Doc Name + Metadata */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handlePreview(doc)}
                          className="font-bold text-left text-slate-900 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-400 truncate max-w-md text-sm sm:text-base cursor-pointer"
                          title={doc.document_name}
                        >
                          {doc.document_name}
                        </button>

                        <span className="inline-flex items-center uppercase rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {doc.document_category}
                        </span>

                        <span className="inline-flex items-center uppercase rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {doc.file_format}
                        </span>

                        <SampleDocumentBadges doc={doc} t={t} />

                        {renderUploadStatusBadge(doc.upload_status)}
                      </div>

                      {/* Sub-row details */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {getDocCodeNo(doc) && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">{t('Code No:', 'కోడ్ నం:')}</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{getDocCodeNo(doc)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">{t('Date:', 'తేదీ:')}</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{doc.document_date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">{t('Size:', 'సైజు:')}</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{formatBytes(origSize)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-1 shrink-0 border-t border-slate-100 pt-2.5 lg:border-t-0 lg:pt-0 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => void handlePreview(doc)}
                      className="rounded-xl bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                      title={t('Preview Document', 'పత్రం ప్రివ్యూ')}
                      aria-label={t('Preview Document', 'పత్రం ప్రివ్యూ')}
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDownload(doc)}
                      className="rounded-xl bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      title={t('Download Document', 'పత్రం డౌన్‌లోడ్')}
                      aria-label={t('Download Document', 'పత్రం డౌన్‌లోడ్')}
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    {doc.upload_status !== 'saved_to_cloud' && (
                      <button
                        type="button"
                        onClick={() => void handleUploadToCloud(doc)}
                        disabled={uploadingDocId === doc.id}
                        className="rounded-xl bg-sky-50 p-2 text-sky-700 transition hover:bg-sky-100 disabled:opacity-50 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/40"
                        title={t('Upload to Cloud', 'క్లౌడ్‌కు అప్‌లోడ్')}
                        aria-label={t('Upload to Cloud', 'క్లౌడ్‌కు అప్‌లోడ్')}
                      >
                        {uploadingDocId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setRenameDoc(doc);
                        setRenameInput(doc.document_name);
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={t('Rename Document', 'పేరు మార్చండి')}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      title={t('Delete Document', 'తొలగించండి')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => {
              if (item.kind === 'record') {
                const record = item.record;
                const isOrder = record.category === 'order';
                const isInspection = record.category === 'inspection';

                return (
                <div
                  key={item.id}
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

                    {getRecordProductLabels(record).length > 0 && (
                      <div className="mt-1.5">
                        <RecordProductBadges record={record} />
                      </div>
                    )}

                    <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">{t('Code No:', 'కోడ్ నం:')}</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={getRecordCodeNo(record)}>
                          {getRecordCodeNo(record)}
                        </span>
                      </div>
                      {getRecordBatchNo(record) && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-400">{t('Batch/Lot:', 'బ్యాచ్/లాట్:')}</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={getRecordBatchNo(record)}>
                            {getRecordBatchNo(record)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">{t('Date:', 'తేదీ:')}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{record.recordDate}</span>
                      </div>
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
              }

              const doc = item.doc;
              const origSize = Number(doc.original_size_bytes ?? doc.original_size) || 0;

              return (
                <div
                  key={doc.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700/60"
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center uppercase rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {doc.document_category}
                        </span>
                        <span className="inline-flex items-center uppercase rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {doc.file_format}
                        </span>
                        <SampleDocumentBadges doc={doc} t={t} />
                      </div>

                      {renderUploadStatusBadge(doc.upload_status)}
                    </div>

                    {/* Document title */}
                    <h4 className="mt-2.5 truncate text-sm font-bold text-slate-900 dark:text-white" title={doc.document_name}>
                      {doc.document_name}
                    </h4>

                    {/* Metadata lines */}
                    <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {getDocCodeNo(doc) && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-400">{t('Code No:', 'కోడ్ నం:')}</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={getDocCodeNo(doc)}>
                            {getDocCodeNo(doc)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">{t('Date:', 'తేదీ:')}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.document_date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-400">{t('Size:', 'సైజు:')}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatBytes(origSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Action Buttons (Preview, Download, Rename, Delete, Details) */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void handlePreview(doc)}
                        className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                        title={t('Preview Document', 'పత్రం ప్రివ్యూ')}
                        aria-label={t('Preview Document', 'పత్రం ప్రివ్యూ')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDownload(doc)}
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        title={t('Download Document', 'పత్రం డౌన్‌లోడ్')}
                        aria-label={t('Download Document', 'పత్రం డౌన్‌లోడ్')}
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      {doc.upload_status !== 'saved_to_cloud' && (
                        <button
                          type="button"
                          onClick={() => void handleUploadToCloud(doc)}
                          disabled={uploadingDocId === doc.id}
                          className="rounded-lg bg-sky-50 p-1.5 text-sky-700 transition hover:bg-sky-100 disabled:opacity-50 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/40"
                          title={t('Upload to Cloud', 'క్లౌడ్‌కు అప్‌లోడ్')}
                          aria-label={t('Upload to Cloud', 'క్లౌడ్‌కు అప్‌లోడ్')}
                        >
                          {uploadingDocId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setRenameDoc(doc);
                          setRenameInput(doc.document_name);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={t('Rename Document', 'పేరు మార్చండి')}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        title={t('Delete Document', 'తొలగించండి')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
      )}

      {/* Field Form Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs ${
                    selectedRecord.category === 'order'
                      ? 'bg-gradient-to-br from-rose-600 to-rose-800'
                      : selectedRecord.category === 'inspection'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-800'
                      : 'bg-gradient-to-br from-amber-600 to-amber-800'
                  }`}
                >
                  {selectedRecord.category === 'order' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : selectedRecord.category === 'inspection' ? (
                    <ClipboardList className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedRecord.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedRecord.entityName}
                    </span>
                    <span>&middot;</span>
                    <span className="font-mono text-xs">
                      {selectedRecord.referenceNumber}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={t('Close', 'మూసివేయి')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4">
              {/* Badges bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center uppercase rounded-lg px-2.5 py-1 text-xs font-bold ${
                    selectedRecord.category === 'order'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : selectedRecord.category === 'inspection'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  {t(selectedRecord.category.toUpperCase(), selectedRecord.category.toUpperCase())}
                </span>

                <span className="inline-flex items-center uppercase rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {selectedRecord.commodity}
                </span>

                {selectedRecord.synced ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t('Cloud Synced', 'క్లౌడ్ సమకాలీకరించబడింది')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>{t('Local Device Only', 'స్థానిక పరికరంలో మాత్రమే')}</span>
                  </span>
                )}
              </div>

              {/* Core Information Grid */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-xs">
                <div>
                  <span className="block font-semibold text-slate-400">{t('Dealer / Firm Name', 'డీలర్ / సంస్థ పేరు')}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedRecord.entityName || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-400">{t('Reference / Order Number', 'రిఫరెన్స్ / ఆర్డర్ సంఖ్య')}</span>
                  <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">{selectedRecord.referenceNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-400">{t('Record Date', 'తేదీ')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecord.recordDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-400">{t('Jurisdiction / Location', 'ప్రాంతం / మండలం')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecord.location || officerLocationFallback || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-400">{t('Record Type', 'రికార్డు రకం')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{selectedRecord.subType.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-400">{t('Created At', 'నమోదు సమయం')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Observations / Remarks / Specific Findings */}
              {(() => {
                const d = selectedRecord.details || {};
                const textObservations = (d.observations || d.remarks || d.reason || d.contravention_details || d.irregularities_observed || d.action_taken) as string | undefined;
                if (!textObservations) return null;
                return (
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs dark:border-amber-900/40 dark:bg-amber-950/20">
                    <span className="block font-bold text-amber-900 dark:text-amber-200 mb-1">
                      {t('Officer Observations & Grounds', 'కారణాలు & పరిశీలనలు')}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {textObservations}
                    </p>
                  </div>
                );
              })()}

              {/* Products / Stock Seized Table */}
              {(() => {
                const d = selectedRecord.details || {};
                const productsList = (Array.isArray(d.products) && d.products.length > 0
                  ? d.products
                  : Array.isArray(d.items) && d.items.length > 0
                  ? d.items
                  : Array.isArray(d.stock_details) && d.stock_details.length > 0
                  ? d.stock_details
                  : null) as Array<Record<string, unknown>> | null;

                if (!productsList || productsList.length === 0) return null;

                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t('Products / Stock Seized / Items List', 'వస్తువులు / నిల్వ వివరాలు')} ({productsList.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/60 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">{t('Product / Particulars', 'వస్తువు')}</th>
                            <th className="px-3 py-2">{t('Batch / Lot No', 'బ్యాచ్ సంఖ్య')}</th>
                            <th className="px-3 py-2">{t('Manufacturer / Source', 'తయారీదారు')}</th>
                            <th className="px-3 py-2">{t('Quantity', 'పరిమాణం')}</th>
                            <th className="px-3 py-2">{t('Remarks', 'రిమార్కులు')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {productsList.map((prod, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">
                                {String(prod.name || prod.productName || prod.commodity || prod.particulars || '—')}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                                {String(prod.batchNo || prod.batch_no || prod.lotNo || prod.lot_no || '—')}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                {String(prod.manufacturer || prod.mfg || prod.source || '—')}
                              </td>
                              <td className="px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-400">
                                {String(prod.quantityMt || prod.quantity || prod.qty || prod.bags || '—')}
                              </td>
                              <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                                {String(prod.remarks || '—')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Grouped Form Field Breakdown */}
              {(() => {
                const d = (selectedRecord.details || {}) as Record<string, unknown>;
                const excludedKeys = new Set([
                  'id', 'products', 'items', 'stock_details', 'savedAt', 'issuedAt', 'createdAt', 'updatedAt',
                  'observations', 'remarks', 'reason', 'contravention_details', 'irregularities_observed',
                  'action_taken', 'entityName', 'referenceNumber', 'recordDate', 'synced',
                  'dealerName', 'firmName', 'partyName', 'dealerManufacturerImporterName',
                  'manualDealerManufacturerImporterName', 'dealerManufacturerImporter',
                  'nameOfDealer', 'dealerFirmName',
                  'labStatus', 'labReportRef', 'dispatchedAt', 'reportReceivedAt', 'failureFinding',
                  'sampleProducts', 'covering_letter_json', 'payload_json'
                ]);
                const flattenKeys = new Set(['form', 'data', 'payload']);

                const flatEntries: [string, unknown][] = [];
                const pushEntry = (key: string, val: unknown) => {
                  if (excludedKeys.has(key) || val === '' || val === null || val === undefined) return;
                  if (typeof val === 'object') {
                    // Skip plain objects and arrays of objects (inspection
                    // checklist rows like detentions/defects) — they render as
                    // unreadable JSON. Arrays of primitives are kept.
                    if (!Array.isArray(val)) return;
                    if (val.some((v) => v !== null && typeof v === 'object')) return;
                  }
                  flatEntries.push([key, val]);
                };
                for (const [key, val] of Object.entries(d)) {
                  if (flattenKeys.has(key) && val && typeof val === 'object' && !Array.isArray(val)) {
                    for (const [nk, nv] of Object.entries(val as Record<string, unknown>)) pushEntry(nk, nv);
                  } else {
                    pushEntry(key, val);
                  }
                }

                if (flatEntries.length === 0) return null;

                const GROUP_DEFS: { title: string; te: string; pattern: RegExp }[] = [
                  {
                    title: 'Sample / Product Details',
                    te: 'నమూనా / ఉత్పత్తి వివరాలు',
                    pattern: /sample|batch|lot|code|product|fertiliz|pesticide|insecticide|seed|crop|variety|trade|technical|activeingredient|formulation|quantity|grade|stock|commodity|schedule|specification|invoice|memo|order|notice|seizure|stop|mrp|price|bag|packet|expiry|manufactur|regist|drawn|collection/i,
                  },
                  {
                    title: 'Dealer / Party Details',
                    te: 'డీలర్ / పార్టీ వివరాలు',
                    pattern: /dealer|firm|licen|party|owner|proprietor|address/i,
                  },
                  {
                    title: 'Location / Jurisdiction',
                    te: 'ప్రాంతం / మండలం',
                    pattern: /mandal|district|division|place|location|premises|office|zone|region|village|street|road|door/i,
                  },
                  {
                    title: 'Inspection / Enforcement',
                    te: 'తనిఖీ / అమలు',
                    pattern: /officer|inspector|designation|qualification|inspection|visit|sign|status|observ|finding|result|test|lab|report|dispatch|receiv|issue|deadline|enclosure|violation|clause|section|act/i,
                  },
                ];

                const grouped: { title: string; te: string; entries: [string, unknown][] }[] = GROUP_DEFS.map((g) => ({
                  ...g,
                  entries: [],
                }));
                const otherEntries: [string, unknown][] = [];

                for (const entry of flatEntries) {
                  const [key] = entry;
                  const group = grouped.find((g) => g.pattern.test(key));
                  if (group) group.entries.push(entry);
                  else otherEntries.push(entry);
                }

                const humanize = (key: string) =>
                  key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/_/g, ' ')
                    .replace(/^./, (s) => s.toUpperCase());

                const renderValue = (val: unknown) => {
                  if (typeof val === 'boolean') return val ? t('Yes', 'అవును') : t('No', 'కాదు');
                  if (Array.isArray(val)) {
                    return val.every((v) => typeof v !== 'object')
                      ? val.map((v) => String(v)).join(', ')
                      : JSON.stringify(val);
                  }
                  return String(val);
                };

                const sections = [
                  ...grouped.filter((g) => g.entries.length > 0),
                  ...(otherEntries.length > 0
                    ? [{ title: 'Other Details', te: 'ఇతర వివరాలు', entries: otherEntries }]
                    : []),
                ];

                return (
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div key={section.title} className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 text-xs">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 mb-2">
                          {t(section.title, section.te)}
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {section.entries.map(([key, val]) => {
                            const renderedVal = renderValue(val);
                            return (
                              <div key={key} className="flex flex-col">
                                <span className="text-[11px] font-medium text-slate-400">{humanize(key)}</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 break-words" title={renderedVal}>
                                  {renderedVal}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Printer className="h-4 w-4" />
                <span>{t('Print Summary', 'ప్రింట్ చేయండి')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                {t('Close', 'మూసివేయి')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {previewDoc.doc.document_name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(previewDoc.url, '_blank', 'noopener')}
                  className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  title={t('Open in Browser', 'బ్రౌజర్‌లో తెరవండి')}
                  aria-label={t('Open in Browser', 'బ్రౌజర్‌లో తెరవండి')}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownload(previewDoc.doc)}
                  className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700"
                  title={t('Download Document', 'పత్రం డౌన్‌లోడ్')}
                  aria-label={t('Download Document', 'పత్రం డౌన్‌లోడ్')}
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(previewDoc.url);
                    setPreviewDoc(null);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-950">
              {(() => {
                const mime = previewDoc.doc.mime_type || '';
                const canInlinePreview =
                  previewDoc.doc.file_format === 'pdf' ||
                  mime === 'application/pdf' ||
                  mime.startsWith('image/') ||
                  previewDoc.doc.file_format === 'txt' ||
                  mime.startsWith('text/');

                // Mobile browsers (iOS Safari) cannot render PDFs in iframes —
                // show a fallback card that opens the file in the browser viewer.
                if (!canInlinePreview || (isMobileDevice && previewDoc.doc.file_format === 'pdf')) {
                  return (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <FileText className="h-7 w-7" />
                      </div>
                      <p className="max-w-xs text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {isMobileDevice
                          ? t('Inline preview is not supported on this device for this file type.', 'ఈ పరికరంలో ఈ ఫైల్ రకానికి ప్రివ్యూ మద్దతు లేదు.')
                          : t('Preview is not supported for this file format.', 'ఈ ఫైల్ ఫార్మాట్‌కు ప్రివ్యూ మద్దతు లేదు.')}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(previewDoc.url, '_blank', 'noopener')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>{t('Open in Browser', 'బ్రౌజర్‌లో తెరవండి')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDownload(previewDoc.doc)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>{t('Download', 'డౌన్‌లోడ్')}</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <iframe
                    src={previewDoc.url}
                    title="Document Preview"
                    className="h-full w-full border-none"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Rename Document Modal */}
      {renameDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('Rename Document', 'పత్రం పేరు మార్చండి')}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('Updates the document name in your records. The stored file stays unchanged.', 'రికార్డులలో పత్రం పేరును అప్‌డేట్ చేస్తుంది. నిల్వ చేసిన ఫైల్ మారదు.')}
            </p>
            <div className="mt-4">
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameDoc(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {t('Cancel', 'రద్దు')}
              </button>
              <button
                type="button"
                onClick={() => void handleSaveRename()}
                disabled={!renameInput.trim()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {t('Save Changes', 'భద్రపరచు')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(docToDelete)}
        title={t('Delete Archived Document', 'పత్రాన్ని తొలగించాలా?')}
        message={t(
          `Are you sure you want to delete ${docToDelete?.document_name}? This action cannot be undone.`,
          `మీరు ఖచ్చితంగా ${docToDelete?.document_name}ని తొలగించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేరు.`
        )}
        confirmLabel={t('Delete Permanently', 'శాశ్వతంగా తొలగించు')}
        cancelLabel={t('Cancel', 'రద్దు')}
        onConfirm={() => void handleDeleteDocument()}
        onCancel={() => setDocToDelete(null)}
      />

      {/* Delete Form Record Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(recordToDelete)}
        title={t('Delete Officer Record', 'రికార్డును తొలగించాలా?')}
        message={t(
          `Are you sure you want to delete ${recordToDelete?.referenceNumber || 'this record'}? This action cannot be undone.`,
          `మీరు ఖచ్చితంగా ${recordToDelete?.referenceNumber || 'ఈ రికార్డును'} తొలగించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేరు.`
        )}
        confirmLabel={t('Delete Permanently', 'శాశ్వతంగా తొలగించు')}
        cancelLabel={t('Cancel', 'రద్దు')}
        onConfirm={() => void handleDeleteRecord()}
        onCancel={() => setRecordToDelete(null)}
      />
    </div>
  );
}
