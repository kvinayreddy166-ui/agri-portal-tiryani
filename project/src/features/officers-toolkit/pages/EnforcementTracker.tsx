import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { localTodayDate } from '../../../shared/utils/dateUtils';
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  Gavel,
  Loader2,
  PackageX,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { useAuth } from '../../../shared/context/AuthContext';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import {
  EnforcementTrackerService,
  type EnforcementData,
  type DealerScorecard,
  type SamplePipelineItem,
  type ReplyStatus,
  type OrderRow,
  type InspectionRow,
  getStatutoryNonComplianceInfo,
} from '../services/enforcementTrackerService';
import type { StatutoryCommodity, StatutoryOrderType } from '../../auth/types/officerAuth';
import { DealerProfileDrawer } from '../components/DealerProfileDrawer';

type TrackerTab = 'inspections' | 'scorecards' | 'samples' | 'stop_sale' | 'seizure' | 'scn';

const ORDER_TAB_TYPES: Record<'stop_sale' | 'seizure' | 'scn', StatutoryOrderType[]> = {
  stop_sale: ['stop_sale', 'revocation'],
  seizure: ['seizure'],
  scn: ['show_cause'],
};

const RISK_META: Record<DealerScorecard['riskLevel'], { bar: string; avatar: string; pill: string; dot: string }> = {
  LOW: {
    bar: 'bg-emerald-500',
    avatar: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800/60',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800/60',
    dot: 'bg-emerald-500',
  },
  MEDIUM: {
    bar: 'bg-amber-500',
    avatar: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800/60',
    pill: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800/60',
    dot: 'bg-amber-500',
  },
  HIGH: {
    bar: 'bg-orange-500',
    avatar: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-800/60',
    pill: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-800/60',
    dot: 'bg-orange-500',
  },
  CRITICAL: {
    bar: 'bg-red-500',
    avatar: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800/60',
    pill: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800/60',
    dot: 'bg-red-500',
  },
};

const LAB_STATUS_ORDER = ['DRAFT', 'DISPATCHED', 'RECEIVED_LAB', 'TEST_PASSED', 'TEST_FAILED'] as const;
const LAB_STATUS_LABELS: Record<string, { en: string; te: string }> = {
  DRAFT: { en: 'Draft', te: 'డ్రాఫ్ట్' },
  DISPATCHED: { en: 'Dispatched', te: 'పంపబడింది' },
  RECEIVED_LAB: { en: 'At Lab', te: 'ల్యాబ్‌లో' },
  TEST_PASSED: { en: 'Passed', te: 'పాస్' },
  TEST_FAILED: { en: 'Failed', te: 'ఫెయిల్' },
};

const LAB_STATUS_STYLES: Record<string, { icon: string; text: string; count: string; accent: string }> = {
  DRAFT: {
    icon: 'text-slate-400 dark:text-slate-500',
    text: 'text-slate-600 dark:text-slate-300',
    count: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    accent: 'border-l-slate-300 dark:border-l-slate-600',
  },
  DISPATCHED: {
    icon: 'text-sky-500 dark:text-sky-400',
    text: 'text-sky-700 dark:text-sky-300',
    count: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    accent: 'border-l-sky-400 dark:border-l-sky-500',
  },
  RECEIVED_LAB: {
    icon: 'text-amber-500 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-300',
    count: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    accent: 'border-l-amber-400 dark:border-l-amber-500',
  },
  TEST_PASSED: {
    icon: 'text-emerald-500 dark:text-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300',
    count: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    accent: 'border-l-emerald-400 dark:border-l-emerald-500',
  },
  TEST_FAILED: {
    icon: 'text-red-500 dark:text-red-400',
    text: 'text-red-700 dark:text-red-300',
    count: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    accent: 'border-l-red-400 dark:border-l-red-500',
  },
};

const COMMODITY_LABELS: Record<StatutoryCommodity | 'mixed', { en: string; te: string }> = {
  fertilizer: { en: 'Fertilizer', te: 'ఎరువు' },
  pesticide: { en: 'Pesticide', te: 'పురుగుమందు' },
  seed: { en: 'Seed', te: 'విత్తనం' },
  mixed: { en: 'Mixed', te: 'మిశ్రమం' },
};

export function EnforcementTracker({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLanguage();
  const { isAdminUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TrackerTab>(() => {
    const tabParam = searchParams.get('tab') as TrackerTab | null;
    if (tabParam && ['inspections', 'scorecards', 'samples', 'stop_sale', 'seizure', 'scn'].includes(tabParam)) {
      return tabParam;
    }
    return 'scorecards';
  });
  const [data, setData] = useState<EnforcementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sampleToDelete, setSampleToDelete] = useState<SamplePipelineItem | null>(null);
  const [markingSample, setMarkingSample] = useState<{
    sample: SamplePipelineItem;
    finding: ReturnType<typeof getStatutoryNonComplianceInfo>;
  } | null>(null);
  const [reportRefInput, setReportRefInput] = useState('');
  const [reportDateInput, setReportDateInput] = useState(localTodayDate());
  const [reportRemarksInput, setReportRemarksInput] = useState('');
  const [submittingLabReport, setSubmittingLabReport] = useState(false);
  const [dealer360Name, setDealer360Name] = useState<string | null>(null);
  const [inspectionCommodityFilter, setInspectionCommodityFilter] = useState<'all' | StatutoryCommodity>('all');
  const [inspectionYearFilter, setInspectionYearFilter] = useState<string>('all');
  const [sampleCommodityFilter, setSampleCommodityFilter] = useState<'all' | StatutoryCommodity>('all');
  const [sampleYearFilter, setSampleYearFilter] = useState<string>('all');
  const [sampleStatusFilter, setSampleStatusFilter] = useState<'all' | SamplePipelineItem['labStatus']>('all');
  const [sampleOverdueFilter, setSampleOverdueFilter] = useState(false);
  const [scoreRiskFilter, setScoreRiskFilter] = useState<'all' | DealerScorecard['riskLevel']>('all');
  const [scoreCommodityFilter, setScoreCommodityFilter] = useState<'all' | StatutoryCommodity | 'mixed'>('all');
  const [orderCommodityFilter, setOrderCommodityFilter] = useState<'all' | StatutoryCommodity>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [orderReplyFilter, setOrderReplyFilter] = useState<'all' | ReplyStatus>('all');
  const [orderYearFilter, setOrderYearFilter] = useState<string>('all');
  const [locationDistrict, setLocationDistrict] = useState<string>('all');
  const [locationMandal, setLocationMandal] = useState<string>('all');

  const handleConfirmNonCompliance = async () => {
    if (!markingSample) return;
    setSubmittingLabReport(true);
    try {
      const { sample, finding } = markingSample;
      const fullRef = reportRefInput.trim()
        ? `${finding.label}: ${reportRefInput.trim()}`
        : finding.label;
      await EnforcementTrackerService.updateSampleLab(sample.id, {
        labStatus: 'TEST_FAILED',
        reportReceivedAt: reportDateInput || new Date().toISOString(),
        labReportRef: fullRef,
        failureFinding: finding.label,
      });
      setMarkingSample(null);
      setReportRefInput('');
      setReportRemarksInput('');
      void load(true);
    } catch (err) {
      console.error('Failed to mark sample non-compliance:', err);
    } finally {
      setSubmittingLabReport(false);
    }
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await EnforcementTrackerService.fetchAll();
      setData(result);
    } catch (err) {
      console.error('Failed to load enforcement data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const deadlineItems = useMemo(() => (data ? EnforcementTrackerService.buildDeadlineItems(data.orders) : []), [data]);
  const scorecards = useMemo(() => (data ? EnforcementTrackerService.buildDealerScorecards(data) : []), [data]);
  const samplePipeline = useMemo(() => (data ? EnforcementTrackerService.buildSamplePipeline(data.samples) : []), [data]);

  const normLoc = (v?: string | null) => (v ?? '').trim().toLowerCase();

  // Orders store district/mandal both as columns and inside payload_json; the
  // 'Others' sentinel means the real value sits in manualDistrict/manualMandal.
  const orderLocation = useCallback((o: OrderRow) => {
    const payload = (o.payload_json ?? {}) as Record<string, unknown>;
    const nested = (payload.form && typeof payload.form === 'object' ? payload.form : {}) as Record<string, unknown>;
    const locVal = (...vals: unknown[]) => {
      for (const v of vals) {
        const s = typeof v === 'string' ? v.trim() : '';
        if (s && s.toLowerCase() !== 'others') return s;
      }
      return '';
    };
    return {
      district: locVal(o.district, payload.district, payload.manualDistrict, nested.district, nested.manualDistrict),
      mandal: locVal(o.mandal, payload.mandal, payload.manualMandal, nested.mandal, nested.manualMandal),
    };
  }, []);

  // Inspections keep their form payload inside findings_json (optionally nested
  // under `form` for local drafts). Location keys vary by form, so resolve
  // defensively and skip the 'Others' sentinel like orders do.
  const inspectionLocation = useCallback((i: InspectionRow) => {
    const fj = (i.findings_json ?? {}) as Record<string, unknown>;
    const form = (fj.form && typeof fj.form === 'object' ? fj.form : {}) as Record<string, unknown>;
    const src = { ...fj, ...form };
    const locVal = (...vals: unknown[]) => {
      for (const v of vals) {
        const s = typeof v === 'string' ? v.trim() : '';
        if (s && s.toLowerCase() !== 'others') return s;
      }
      return '';
    };
    return {
      district: locVal(src.district, src.manualDistrict),
      mandal: locVal(
        src.mandal, src.manualMandal,
        src.placeOfCollectionMandal, src.manualPlaceOfCollection,
        src.placeOfCollection, src.collectionPlace
      ),
    };
  }, []);

  const locationDistricts = useMemo(() => {
    const set = new Set<string>();
    for (const o of data?.orders ?? []) {
      const d = orderLocation(o).district;
      if (d) set.add(d);
    }
    for (const s of samplePipeline) {
      const d = (s.district ?? '').trim();
      if (d) set.add(d);
    }
    for (const i of data?.inspections ?? []) {
      const d = inspectionLocation(i).district;
      if (d) set.add(d);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data, samplePipeline, orderLocation, inspectionLocation]);
  const locationMandals = useMemo(() => {
    const set = new Set<string>();
    const districtFilter = locationDistrict === 'all' ? null : normLoc(locationDistrict);
    const addIfMatch = (district: string | undefined, mandal: string | undefined) => {
      if (districtFilter && normLoc(district) !== districtFilter) return;
      const m = (mandal ?? '').trim();
      if (m) set.add(m);
    };
    for (const o of data?.orders ?? []) {
      const loc = orderLocation(o);
      addIfMatch(loc.district, loc.mandal);
    }
    for (const s of samplePipeline) {
      addIfMatch(s.district, s.mandal);
    }
    for (const i of data?.inspections ?? []) {
      const loc = inspectionLocation(i);
      addIfMatch(loc.district, loc.mandal);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data, samplePipeline, locationDistrict, orderLocation, inspectionLocation]);
  const matchesLocation = useCallback((district?: string | null, mandal?: string | null) => {
    if (locationDistrict !== 'all' && normLoc(district) !== normLoc(locationDistrict)) return false;
    if (locationMandal !== 'all' && normLoc(mandal) !== normLoc(locationMandal)) return false;
    return true;
  }, [locationDistrict, locationMandal]);
  const locationDealerNames = useMemo(() => {
    if (locationDistrict === 'all' && locationMandal === 'all') return null;
    const names = new Set<string>();
    for (const o of data?.orders ?? []) {
      const loc = orderLocation(o);
      if (matchesLocation(loc.district, loc.mandal)) names.add(o.firm_name.trim().toLowerCase());
    }
    for (const s of samplePipeline) {
      if (matchesLocation(s.district, s.mandal)) names.add(s.dealerName.trim().toLowerCase());
    }
    for (const i of data?.inspections ?? []) {
      const loc = inspectionLocation(i);
      if (matchesLocation(loc.district, loc.mandal)) names.add(i.firm_name.trim().toLowerCase());
    }
    return names;
  }, [data, samplePipeline, locationDistrict, locationMandal, matchesLocation, orderLocation, inspectionLocation]);

  const inspectionItems = useMemo(() => (data?.inspections ?? []).map((i) => {
    const fj = (i.findings_json ?? {}) as Record<string, unknown>;
    const form = (fj.form && typeof fj.form === 'object' ? fj.form : {}) as Record<string, unknown>;
    const src = { ...fj, ...form };
    const loc = inspectionLocation(i);
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');
    return {
      id: i.id,
      dealerName: i.firm_name,
      commodity: i.inspection_type,
      licenseNumber: i.license_number,
      date: i.inspection_date,
      local: i.id.startsWith('local-'),
      district: loc.district,
      mandal: loc.mandal,
      inspectorName: str(src.inspectorName),
      address: str(src.salePointAddress) || str(src.dealerAddress) || str(src.premisesLocation),
    };
  }), [data, inspectionLocation]);

  const filteredScorecards = useMemo(() => {
    let list = scorecards;
    if (locationDealerNames) list = list.filter((s) => locationDealerNames.has(s.dealerName.trim().toLowerCase()));
    if (scoreRiskFilter !== 'all') list = list.filter((s) => s.riskLevel === scoreRiskFilter);
    if (scoreCommodityFilter !== 'all') list = list.filter((s) => s.commodity === scoreCommodityFilter);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((s) => s.dealerName.toLowerCase().includes(q));
  }, [scorecards, searchQuery, scoreRiskFilter, scoreCommodityFilter, locationDealerNames]);

  const sampleYears = useMemo(() => {
    const years = new Set<string>();
    for (const s of samplePipeline) {
      for (const d of [s.sampledDate, s.dispatchedAt, s.reportReceivedAt]) {
        const y = typeof d === 'string' ? d.slice(0, 4) : '';
        if (/^\d{4}$/.test(y)) years.add(y);
      }
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [samplePipeline]);

  const filteredSamples = useMemo(() => {
    let list = samplePipeline;
    if (locationDistrict !== 'all' || locationMandal !== 'all') {
      list = list.filter((s) => matchesLocation(s.district, s.mandal));
    }
    if (sampleCommodityFilter !== 'all') {
      list = list.filter((s) => s.commodity === sampleCommodityFilter);
    }
    if (sampleStatusFilter !== 'all') {
      list = list.filter((s) => s.labStatus === sampleStatusFilter);
    }
    if (sampleYearFilter !== 'all') {
      list = list.filter((s) =>
        [s.sampledDate, s.dispatchedAt, s.reportReceivedAt].some(
          (d) => typeof d === 'string' && d.slice(0, 4) === sampleYearFilter
        )
      );
    }
    if (sampleOverdueFilter) {
      list = list.filter((s) => s.daysInStage >= 7);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((s) =>
      s.dealerName.toLowerCase().includes(q) ||
      s.sampleCode.toLowerCase().includes(q) ||
      s.productLabel.toLowerCase().includes(q)
    );
  }, [samplePipeline, searchQuery, sampleCommodityFilter, sampleYearFilter, sampleStatusFilter, sampleOverdueFilter, locationDistrict, locationMandal, matchesLocation]);

  const orderYears = useMemo(() => {
    const years = new Set<string>();
    for (const o of data?.orders ?? []) {
      const y = (o.order_date ?? '').slice(0, 4);
      if (/^\d{4}$/.test(y)) years.add(y);
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [data]);

  const filteredOrders = useMemo(() => {
    const types = activeTab === 'stop_sale' || activeTab === 'seizure' || activeTab === 'scn'
      ? ORDER_TAB_TYPES[activeTab]
      : [];
    let list = (data?.orders ?? []).filter((o) => types.includes(o.order_type));
    if (locationDistrict !== 'all' || locationMandal !== 'all') {
      list = list.filter((o) => {
        const loc = orderLocation(o);
        return matchesLocation(loc.district, loc.mandal);
      });
    }
    if (orderTypeFilter !== 'all') {
      list = list.filter((o) => o.order_type === orderTypeFilter);
    }
    if (orderCommodityFilter !== 'all') {
      list = list.filter((o) => o.commodity === orderCommodityFilter);
    }
    if (orderReplyFilter !== 'all') {
      list = list.filter((o) => (o.reply_status ?? 'PENDING') === orderReplyFilter);
    }
    if (orderYearFilter !== 'all') {
      list = list.filter((o) => (o.order_date ?? '').slice(0, 4) === orderYearFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) =>
        o.firm_name.toLowerCase().includes(q) ||
        o.order_number.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, activeTab, searchQuery, orderTypeFilter, orderCommodityFilter, orderReplyFilter, orderYearFilter, locationDistrict, locationMandal, matchesLocation, orderLocation]);

  const activeTabOrderTotal = useMemo(() => {
    if (activeTab !== 'stop_sale' && activeTab !== 'seizure' && activeTab !== 'scn') return 0;
    const types = ORDER_TAB_TYPES[activeTab];
    return (data?.orders ?? []).filter((o) => types.includes(o.order_type)).length;
  }, [data, activeTab]);

  const inspectionYears = useMemo(() => {
    const years = new Set<string>();
    for (const i of inspectionItems) {
      const y = (i.date ?? '').slice(0, 4);
      if (/^\d{4}$/.test(y)) years.add(y);
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [inspectionItems]);

  const filteredInspections = useMemo(() => {
    let list = inspectionItems;
    if (locationDistrict !== 'all' || locationMandal !== 'all') {
      list = list.filter((i) => matchesLocation(i.district, i.mandal));
    }
    if (inspectionCommodityFilter !== 'all') {
      list = list.filter((i) => i.commodity === inspectionCommodityFilter);
    }
    if (inspectionYearFilter !== 'all') {
      list = list.filter((i) => (i.date ?? '').slice(0, 4) === inspectionYearFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) =>
        i.dealerName.toLowerCase().includes(q) ||
        (i.licenseNumber ?? '').toLowerCase().includes(q) ||
        (i.inspectorName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [inspectionItems, locationDistrict, locationMandal, matchesLocation, inspectionCommodityFilter, inspectionYearFilter, searchQuery]);

  const stats = useMemo(() => {
    const urgentDeadlines = deadlineItems.filter((d) => d.status === 'URGENT').length;
    const criticalDealers = scorecards.filter((s) => s.riskLevel === 'CRITICAL' || s.riskLevel === 'HIGH').length;
    const activeSamples = samplePipeline.filter((s) => s.labStatus !== 'TEST_PASSED' && s.labStatus !== 'TEST_FAILED').length;
    const stopSaleOrders = (data?.orders ?? []).filter((o) => o.order_type === 'stop_sale' || o.order_type === 'revocation').length;
    const seizureOrders = (data?.orders ?? []).filter((o) => o.order_type === 'seizure').length;
    const scnOrders = (data?.orders ?? []).filter((o) => o.order_type === 'show_cause').length;
    const inspections = (data?.inspections ?? []).length;
    return { urgentDeadlines, criticalDealers, activeSamples, stopSaleOrders, seizureOrders, scnOrders, inspections };
  }, [data, deadlineItems, scorecards, samplePipeline]);

  const handleSetDeadline = async (order: OrderRow, deadline: string | null) => {
    await EnforcementTrackerService.updateOrderReply(order, deadline);
    void load(true);
  };

  const handleUpdateReplyStatus = async (order: OrderRow, status: ReplyStatus) => {
    await EnforcementTrackerService.updateOrderReply(order, null, status);
    void load(true);
  };

  const handleDeleteSample = async () => {
    if (!sampleToDelete) return;
    await EnforcementTrackerService.deleteSample(sampleToDelete.id);
    setSampleToDelete(null);
    void load(true);
  };

  const handleUpdateSampleStatus = async (sampleId: string, labStatus: SamplePipelineItem['labStatus'], markDispatched = false, markReport = false) => {
    const now = new Date().toISOString();
    await EnforcementTrackerService.updateSampleLab(sampleId, {
      labStatus,
      ...(markDispatched ? { dispatchedAt: now } : {}),
      ...(markReport ? { reportReceivedAt: now } : {}),
    });
    void load(true);
  };

  const tabs: { id: TrackerTab; label: string; te: string; icon: typeof CalendarClock }[] = [
    { id: 'scorecards', label: 'Dealer Scorecards', te: 'డీలర్ స్కోర్‌కార్డులు', icon: Scale },
    { id: 'inspections', label: 'Inspections', te: 'తనిఖీలు', icon: ClipboardCheck },
    { id: 'samples', label: 'Sample Pipeline', te: 'నమూనా పైప్‌లైన్', icon: FlaskConical },
    { id: 'stop_sale', label: 'Stop Sale', te: 'స్టాప్ సేల్', icon: Ban },
    { id: 'seizure', label: 'Seizures', te: 'సీజర్లు', icon: PackageX },
    { id: 'scn', label: 'SCN / Memos', te: 'షోకాజ్ నోటీసులు', icon: ShieldAlert },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className={embedded ? 'w-full' : 'mx-auto w-full max-w-7xl p-2 sm:p-3'}>
      {!embedded && (
      <ModulePageHeader
        className="mb-4"
        title={t('Enforcement Tracker', 'అమలు ట్రాకర్')}
        subtitle={t('Deadlines, dealer risk & sample pipeline', 'గడువులు, డీలర్ రిస్క్ & నమూనా పైప్‌లైన్')}
        icon={Gavel}
        actions={
          <button
            type="button"
            onClick={() => void load(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />
      )}

      {/* Summary stat cards */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
        {[
          { label: t('Inspections', 'తనిఖీలు'), value: stats.inspections, icon: ClipboardCheck, tone: 'text-teal-700 bg-teal-50 ring-teal-200/60 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-800/40', bar: 'bg-teal-600' },
          { label: t('SCN / Memos', 'షోకాజ్ నోటీసులు'), value: stats.scnOrders, icon: ShieldAlert, tone: 'text-rose-700 bg-rose-50 ring-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800/40', bar: 'bg-rose-600' },
          { label: t('High-Risk Dealers', 'అధిక రిస్క్ డీలర్లు'), value: stats.criticalDealers, icon: ShieldAlert, tone: 'text-amber-700 bg-amber-50 ring-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/40', bar: 'bg-amber-500' },
          { label: t('Active Samples', 'యాక్టివ్ నమూనాలు'), value: stats.activeSamples, icon: FlaskConical, tone: 'text-sky-700 bg-sky-50 ring-sky-200/60 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800/40', bar: 'bg-sky-600' },
          { label: t('Stop Sale Orders', 'స్టాప్ సేల్ ఆర్డర్లు'), value: stats.stopSaleOrders, icon: Ban, tone: 'text-violet-700 bg-violet-50 ring-violet-200/60 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800/40', bar: 'bg-violet-600' },
          { label: t('Seizure Orders', 'జబ్తు ఆర్డర్లు'), value: stats.seizureOrders, icon: PackageX, tone: 'text-orange-700 bg-orange-50 ring-orange-200/60 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-800/40', bar: 'bg-orange-600' },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 ${s.bar}`} />
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${s.tone} shadow-2xs`}>
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-black leading-none text-slate-900 dark:text-white">{s.value}</p>
              <p className="mt-1 truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex w-full max-w-2xl items-stretch gap-1 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white/90 p-1 shadow-2xs backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-slate-800 dark:bg-slate-900/90">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveTab(tab.id); setOrderTypeFilter('all'); }}
            className={`flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition sm:text-xs ${
              activeTab === tab.id
                ? 'bg-emerald-700 text-white shadow-2xs hover:bg-emerald-600 dark:bg-emerald-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-300'
            }`}
          >
            <tab.icon className={`h-3.5 w-3.5 shrink-0 ${activeTab === tab.id ? 'text-gold-300' : ''}`} />
            <span className="truncate">{t(tab.label, tab.te)}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('Search dealer or sample code...', 'డీలర్ లేదా నమూనా కోడ్ వెతకండి...')}
          className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {isAdminUser && locationDistricts.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            value={locationDistrict}
            onChange={(e) => { setLocationDistrict(e.target.value); setLocationMandal('all'); }}
            className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            aria-label={t('Filter by district', 'జిల్లా ప్రకారం వడపోత')}
          >
            <option value="all">{t('All Districts', 'అన్ని జిల్లా')}</option>
            {locationDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={locationMandal}
            onChange={(e) => setLocationMandal(e.target.value)}
            disabled={locationMandals.length === 0}
            className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            aria-label={t('Filter by mandal', 'మండలం ప్రకారం వడపోత')}
          >
            <option value="all">{t('All Mandals', 'అన్ని మండలాలు')}</option>
            {locationMandals.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* ============ ORDER TABS (Stop Sale / Seizures / SCN-Memos) ============ */}
      {(activeTab === 'stop_sale' || activeTab === 'seizure' || activeTab === 'scn') && (
        <div className="space-y-2">
          {/* Order filters */}
          <div className="mb-3 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'fertilizer', 'pesticide', 'seed'] as const).map((commodity) => (
                <button
                  key={commodity}
                  type="button"
                  onClick={() => setOrderCommodityFilter(commodity)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                    orderCommodityFilter === commodity
                      ? 'bg-emerald-700 text-white shadow-2xs hover:bg-emerald-600 dark:bg-emerald-600'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-emerald-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  {commodity === 'all'
                    ? t('All Commodities', 'అన్ని వస్తువులు')
                    : t(COMMODITY_LABELS[commodity].en, COMMODITY_LABELS[commodity].te)}
                </button>
              ))}
              {activeTab === 'stop_sale' && (['all', 'stop_sale', 'revocation'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderTypeFilter(type)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                    orderTypeFilter === type
                      ? 'bg-violet-700 text-white shadow-2xs hover:bg-violet-600 dark:bg-violet-600'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-violet-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  {type === 'all'
                    ? t('All Types', 'అన్ని రకాలు')
                    : type === 'stop_sale' ? t('Stop Sale', 'స్టాప్ సేల్') : t('Revocation', 'రద్దు ఆర్డర్')}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOrderReplyFilter('all')}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                  orderReplyFilter === 'all'
                    ? 'bg-sky-700 text-white shadow-2xs hover:bg-sky-600 dark:bg-sky-600'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-sky-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                {t('All Replies', 'అన్ని సమాధానాలు')}
              </button>
              {(['PENDING', 'REPLIED', 'NO_REPLY', 'EXPIRED', 'WAIVED'] as ReplyStatus[]).map((rs) => (
                <button
                  key={rs}
                  type="button"
                  onClick={() => setOrderReplyFilter(orderReplyFilter === rs ? 'all' : rs)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                    orderReplyFilter === rs
                      ? 'bg-sky-700 text-white shadow-2xs hover:bg-sky-600 dark:bg-sky-600'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-sky-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  {rs.replace('_', ' ')}
                </button>
              ))}
              <select
                value={orderYearFilter}
                onChange={(e) => setOrderYearFilter(e.target.value)}
                className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                aria-label={t('Filter orders by year', 'సంవత్సరం ప్రకారం ఆర్డర్లు ఫిల్టర్ చేయండి')}
              >
                <option value="all">{t('All Years', 'అన్ని సంవత్సరాలు')}</option>
                {orderYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                {filteredOrders.length} {t('orders', 'ఆర్డర్లు')}
                {filteredOrders.length !== activeTabOrderTotal && ` / ${activeTabOrderTotal}`}
              </span>
            </div>
          </div>
          {filteredOrders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <Gavel className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-bold text-slate-500">{t('No orders found.', 'ఆర్డర్లు కనుగొనబడలేదు.')}</p>
            </div>
          )}
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setDealer360Name(order.firm_name)}
                    className="block max-w-full truncate text-sm font-black text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-2 transition hover:text-emerald-700 hover:decoration-emerald-500 dark:text-white dark:hover:text-emerald-300"
                    title={t('View dealer 360° profile', 'డీలర్ 360° ప్రొఫైల్ చూడండి')}
                  >
                    {order.firm_name}
                  </button>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {order.order_number} · {t(COMMODITY_LABELS[order.commodity].en, COMMODITY_LABELS[order.commodity].te)} · {order.order_date}
                    <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {order.order_type.replace('_', ' ')}
                    </span>
                    {order._local && (
                      <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {t('local', 'లోకల్')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  {(order.reply_status ?? 'PENDING') !== 'PENDING' && order.reply_status && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {order.reply_status}
                    </span>
                  )}
                </div>
              </div>

              {/* Reply-by controls */}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-500">{t('Reply by', 'సమాధానం గడువు')}: </label>
                <input
                  type="date"
                  defaultValue={order.reply_deadline ?? ''}
                  onChange={(e) => void handleSetDeadline(order, e.target.value || null)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <div className="ml-auto flex items-center gap-1">
                  {(['PENDING', 'REPLIED', 'NO_REPLY', 'EXPIRED', 'WAIVED'] as ReplyStatus[]).map((rs) => (
                    <button
                      key={rs}
                      type="button"
                      onClick={() => void handleUpdateReplyStatus(order, rs)}
                      className={`rounded-full px-2 py-1 text-[10px] font-black transition ${
                        (order.reply_status ?? 'PENDING') === rs
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {rs.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ INSPECTIONS TAB ============ */}
      {activeTab === 'inspections' && (
        <div className="space-y-2">
          {/* Inspection filters */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {(['all', 'fertilizer', 'pesticide', 'seed'] as const).map((commodity) => (
              <button
                key={commodity}
                type="button"
                onClick={() => setInspectionCommodityFilter(commodity)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                  inspectionCommodityFilter === commodity
                    ? 'bg-emerald-700 text-white shadow-2xs hover:bg-emerald-600 dark:bg-emerald-600'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-emerald-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                {commodity === 'all'
                  ? t('All Commodities', 'అన్ని వస్తువులు')
                  : t(COMMODITY_LABELS[commodity].en, COMMODITY_LABELS[commodity].te)}
              </button>
            ))}
            <select
              value={inspectionYearFilter}
              onChange={(e) => setInspectionYearFilter(e.target.value)}
              className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label={t('Filter inspections by year', 'సంవత్సరం ప్రకారం తనిఖీలు ఫిల్టర్ చేయండి')}
            >
              <option value="all">{t('All Years', 'అన్ని సంవత్సరాలు')}</option>
              {inspectionYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              {filteredInspections.length} {t('inspections', 'తనిఖీలు')}
              {filteredInspections.length !== inspectionItems.length && ` / ${inspectionItems.length}`}
            </span>
          </div>
          {filteredInspections.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <ClipboardCheck className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-bold text-slate-500">{t('No inspections found.', 'తనిఖీలు కనుగొనబడలేదు.')}</p>
            </div>
          )}
          {filteredInspections.map((insp) => (
            <div key={insp.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setDealer360Name(insp.dealerName)}
                    className="block max-w-full truncate text-sm font-black text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-2 transition hover:text-emerald-700 hover:decoration-emerald-500 dark:text-white dark:hover:text-emerald-300"
                    title={t('View dealer 360° profile', 'డీలర్ 360° ప్రొఫైల్ చూడండి')}
                  >
                    {insp.dealerName}
                  </button>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {t(COMMODITY_LABELS[insp.commodity].en, COMMODITY_LABELS[insp.commodity].te)} · {insp.date}
                    {insp.local && (
                      <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {t('local', 'లోకల్')}
                      </span>
                    )}
                  </p>
                  {(insp.licenseNumber || insp.inspectorName || insp.mandal || insp.district) && (
                    <p className="mt-1 truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {[insp.licenseNumber ? `Lic: ${insp.licenseNumber}` : '', insp.inspectorName, [insp.mandal, insp.district].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {insp.address && (
                    <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400 dark:text-slate-500" title={insp.address}>
                      {insp.address}
                    </p>
                  )}
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-800/60">
                  <ClipboardCheck className="h-4 w-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ SCORECARDS TAB ============ */}
      {activeTab === 'scorecards' && (
        <div className="space-y-2">
          {/* Scorecard filters */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={scoreRiskFilter}
              onChange={(e) => setScoreRiskFilter(e.target.value as 'all' | DealerScorecard['riskLevel'])}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label={t('Filter by risk level', 'రిస్క్ స్థాయి ప్రకారం ఫిల్టర్ చేయండి')}
            >
              <option value="all">{t('All Risk Levels', 'అన్ని రిస్క్ స్థాయిలు')}</option>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <select
              value={scoreCommodityFilter}
              onChange={(e) => setScoreCommodityFilter(e.target.value as 'all' | StatutoryCommodity | 'mixed')}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label={t('Filter by commodity', 'వస్తువు ప్రకారం ఫిల్టర్ చేయండి')}
            >
              <option value="all">{t('All Commodities', 'అన్ని వస్తువులు')}</option>
              {(['fertilizer', 'pesticide', 'seed', 'mixed'] as const).map((commodity) => (
                <option key={commodity} value={commodity}>{t(COMMODITY_LABELS[commodity].en, COMMODITY_LABELS[commodity].te)}</option>
              ))}
            </select>
            <span className="ml-auto rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              {filteredScorecards.length} {t('scorecards', 'స్కోర్‌కార్డులు')}
              {filteredScorecards.length !== scorecards.length && ` / ${scorecards.length}`}
            </span>
          </div>
          {filteredScorecards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <Scale className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-bold text-slate-500">{t('No dealer activity recorded yet.', 'ఇంకా డీలర్ యాక్టివిటీ రికార్డ్ కాలేదు.')}</p>
            </div>
          )}
          {filteredScorecards.map((s) => {
            const meta = RISK_META[s.riskLevel];
            const initials = s.dealerName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();
            return (
              <div
                key={s.dealerName}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${meta.bar}`} aria-hidden />
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black ring-1 ${meta.avatar}`}>
                      {initials || '—'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setDealer360Name(s.dealerName)}
                        className="block max-w-full truncate text-sm font-black text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-2 transition hover:text-emerald-700 hover:decoration-emerald-500 dark:text-white dark:hover:text-emerald-300"
                        title={t('View dealer 360° profile', 'డీలర్ 360° ప్రొఫైల్ చూడండి')}
                      >
                        {s.dealerName}
                      </button>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <CalendarClock className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {t(COMMODITY_LABELS[s.commodity].en, COMMODITY_LABELS[s.commodity].te)} · {t('last activity', 'చివరి యాక్టివిటీ')} {s.lastActivity || '—'}
                        </span>
                      </p>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ring-1 ${meta.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
                      {s.riskLevel} · {s.riskScore}
                    </span>
                  </div>
                  <div className="mt-3.5 flex divide-x divide-slate-100 overflow-hidden rounded-xl bg-slate-50/80 ring-1 ring-slate-100 dark:divide-slate-800 dark:bg-slate-800/40 dark:ring-slate-800">
                    {[
                      { label: t('Inspections', 'తనిఖీలు'), value: s.inspections, cls: 'text-sky-600 dark:text-sky-400' },
                      { label: t('Stop Sale', 'స్టాప్ సేల్'), value: s.stopSale, cls: 'text-orange-600 dark:text-orange-400' },
                      { label: t('Show Cause', 'షో కారణం'), value: s.showCause, cls: 'text-amber-600 dark:text-amber-400' },
                      { label: t('Seizures', 'సీజర్లు'), value: s.seizures, cls: 'text-red-600 dark:text-red-400' },
                      { label: t('Samples', 'నమూనాలు'), value: s.samplesTotal, cls: s.samplesFailed > 0 ? 'text-red-600 dark:text-red-400' : 'text-violet-600 dark:text-violet-400' },
                    ].map((m) => (
                      <div key={m.label} className="min-w-0 flex-1 px-1.5 py-2 text-center">
                        <p className={`text-base font-black leading-none ${m.cls}`}>{m.value}</p>
                        <p className="mt-1 truncate text-[9px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  {s.samplesFailed > 0 && (
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {s.samplesFailed} {t('sample(s) failed lab testing', 'నమూనా/లు ల్యాబ్ పరీక్షలో ఫెయిల్')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============ SAMPLES TAB ============ */}
      {activeTab === 'samples' && (
        <div className="space-y-3">
          {/* Commodity filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'fertilizer', 'pesticide', 'seed'] as const).map((commodity) => (
              <button
                key={commodity}
                type="button"
                onClick={() => setSampleCommodityFilter(commodity)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                  sampleCommodityFilter === commodity
                    ? 'bg-emerald-700 text-white shadow-2xs hover:bg-emerald-600 dark:bg-emerald-600'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-emerald-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                {commodity === 'all'
                  ? t('All Commodities', 'అన్ని వస్తువులు')
                  : t(COMMODITY_LABELS[commodity].en, COMMODITY_LABELS[commodity].te)}
              </button>
            ))}
          </div>

          {/* Status + Year filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSampleStatusFilter('all')}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                sampleStatusFilter === 'all'
                  ? 'bg-sky-700 text-white shadow-2xs hover:bg-sky-600 dark:bg-sky-600'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-sky-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {t('All Status', 'అన్ని స్థితులు')}
            </button>
            {LAB_STATUS_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSampleStatusFilter(sampleStatusFilter === status ? 'all' : status)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                  sampleStatusFilter === status
                    ? `${LAB_STATUS_STYLES[status].count} ring-1 ring-current`
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                {t(LAB_STATUS_LABELS[status].en, LAB_STATUS_LABELS[status].te)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSampleOverdueFilter((v) => !v)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                sampleOverdueFilter
                  ? 'bg-red-600 text-white shadow-2xs hover:bg-red-500 dark:bg-red-600'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-red-700 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {t('Overdue 7d+', 'గడువు దాటిన (7+)')}
            </button>
            <select
              value={sampleYearFilter}
              onChange={(e) => setSampleYearFilter(e.target.value)}
              className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label={t('Filter by year', 'సంవత్సరంలో ఫిల్టర్ చేయండి')}
            >
              <option value="all">{t('All Years', 'అన్ని సంవత్సరాలు')}</option>
              {sampleYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              {filteredSamples.length} {t('samples', 'నమూనాలు')}
              {filteredSamples.length !== samplePipeline.length && ` / ${samplePipeline.length}`}
            </span>
          </div>
          {LAB_STATUS_ORDER.map((status) => {
            const items = filteredSamples.filter((s) => s.labStatus === status);
            if (items.length === 0) return null;
            const statusStyle = LAB_STATUS_STYLES[status] ?? LAB_STATUS_STYLES.DRAFT;
            return (
              <div key={status} className={`rounded-2xl border border-slate-200/80 border-l-4 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${statusStyle.accent}`}>
                <p className={`mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${statusStyle.text}`}>
                  <FlaskConical className={`h-3.5 w-3.5 ${statusStyle.icon}`} />
                  {t(LAB_STATUS_LABELS[status].en, LAB_STATUS_LABELS[status].te)}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black normal-case ${statusStyle.count}`}>{items.length}</span>
                </p>
                <div className="space-y-1.5">
                  {items.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setDealer360Name(s.dealerName)}
                          className="block max-w-full truncate text-xs font-black text-slate-800 underline decoration-dotted decoration-slate-300 underline-offset-2 transition hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-300"
                          title={t('View dealer 360° profile', 'డీలర్ 360° ప్రొఫైల్ చూడండి')}
                        >
                          {s.dealerName}
                        </button>
                        <p className="text-[10px] font-semibold text-slate-500">
                          {s.sampleCode} · {t(COMMODITY_LABELS[s.commodity].en, COMMODITY_LABELS[s.commodity].te)} · {s.sampledDate} · {s.daysInStage}d {t('in stage', 'స్టేజ్‌లో')}
                        </p>
                        {s.productLabel && (
                          <p className="mt-0.5 truncate text-[10px] font-bold text-violet-600 dark:text-violet-300" title={s.productLabel}>
                            {s.productLabel}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {status === 'DRAFT' && (
                          <button type="button" onClick={() => void handleUpdateSampleStatus(s.id, 'DISPATCHED', true)} className="rounded-lg bg-emerald-700 px-2 py-1 text-[10px] font-black text-white hover:bg-emerald-600">
                            {t('Mark Dispatched', 'పంపబడింది మార్క్')}
                          </button>
                        )}
                        {status === 'DISPATCHED' && (
                          <>
                            <button type="button" onClick={() => void handleUpdateSampleStatus(s.id, 'RECEIVED_LAB')} className="rounded-lg bg-sky-600 px-2 py-1 text-[10px] font-black text-white hover:bg-sky-500">
                              {t('Reached Lab', 'ల్యాబ్‌కు చేరింది')}
                            </button>
                            <button type="button" onClick={() => void handleUpdateSampleStatus(s.id, 'TEST_PASSED', false, true)} className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-black text-white hover:bg-emerald-500">
                              {t('Pass', 'పాస్')}
                            </button>
                            {(() => {
                              const finding = getStatutoryNonComplianceInfo(s.commodity);
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMarkingSample({ sample: s, finding });
                                    setReportDateInput(localTodayDate());
                                    setReportRefInput('');
                                    setReportRemarksInput('');
                                  }}
                                  className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition shadow-xs ${finding.buttonCls}`}
                                  title={t(`Mark dispatched sample as ${finding.label}`, finding.buttonTelugu)}
                                >
                                  <span className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {t(finding.buttonText, finding.buttonTelugu)}
                                  </span>
                                </button>
                              );
                            })()}
                            <button
                              type="button"
                              onClick={() => void handleUpdateSampleStatus(s.id, 'DRAFT')}
                              className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-slate-700"
                              title={t('Revert to Draft', 'డ్రాఫ్ట్‌కు రీవర్ట్ చేయండి')}
                            >
                              {t('Revert', 'రీవర్ట్')}
                            </button>
                          </>
                        )}
                        {status === 'RECEIVED_LAB' && (
                          <>
                            <button type="button" onClick={() => void handleUpdateSampleStatus(s.id, 'TEST_PASSED', false, true)} className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-black text-white hover:bg-emerald-500">
                              {t('Pass', 'పాస్')}
                            </button>
                            {(() => {
                              const finding = getStatutoryNonComplianceInfo(s.commodity);
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMarkingSample({ sample: s, finding });
                                    setReportDateInput(localTodayDate());
                                    setReportRefInput('');
                                    setReportRemarksInput('');
                                  }}
                                  className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition shadow-xs ${finding.buttonCls}`}
                                  title={t(`Mark sample as ${finding.label}`, finding.buttonTelugu)}
                                >
                                  <span className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {t(finding.buttonText, finding.buttonTelugu)}
                                  </span>
                                </button>
                              );
                            })()}
                            <button
                              type="button"
                              onClick={() => void handleUpdateSampleStatus(s.id, 'DISPATCHED')}
                              className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-slate-700"
                              title={t('Revert to Dispatched', 'డిస్పాచ్డ్‌కు రీవర్ట్ చేయండి')}
                            >
                              {t('Revert', 'రీవర్ట్')}
                            </button>
                          </>
                        )}
                        {status === 'TEST_FAILED' && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(() => {
                              const finding = getStatutoryNonComplianceInfo(s.commodity);
                              const displayLabel = s.failureFinding || finding.label;
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${finding.badgeCls}`}
                                  title={finding.description}
                                >
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  {displayLabel}
                                </span>
                              );
                            })()}
                            {s.labReportRef && (
                              <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                                {s.labReportRef}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => navigate('/officer-toolkit/inspection-enforcement')}
                              className="rounded-lg bg-emerald-700 px-2 py-1 text-[10px] font-black text-white hover:bg-emerald-600"
                              title={t('Issue statutory show cause notice', 'షోకాజ్ నోటీస్ జారీ')}
                            >
                              {t('Issue SCN', 'నోటీస్ జారీ')}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleUpdateSampleStatus(s.id, 'DISPATCHED')}
                              className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-slate-700"
                              title={t('Revert to Dispatched', 'డిస్పాచ్డ్‌కు రీవర్ట్ చేయండి')}
                            >
                              {t('Revert', 'రీవర్ట్')}
                            </button>
                          </div>
                        )}
                        {status === 'TEST_PASSED' && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('Standard / Passed', 'ప్రమాణాల ప్రకారం ఉంది')}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleUpdateSampleStatus(s.id, 'RECEIVED_LAB')}
                              className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-slate-700"
                              title={t('Revert to Received at Lab', 'ల్యాబ్‌కుrio RECEIVEDకు రీవర్ట్ చేయండి')}
                            >
                              {t('Revert', 'రీవర్ట్')}
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setSampleToDelete(s)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/40"
                          aria-label={t('Delete sample', 'నమూనాను తొలగించు')}
                          title={t('Delete sample', 'నమూనాను తొలగించు')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredSamples.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <FlaskConical className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-bold text-slate-500">{t('No samples found.', 'నమూనాలు కనుగొనబడలేదు.')}</p>
            </div>
          )}
        </div>
      )}


      {/* ============ MARK STATUTORY NON-COMPLIANCE MODAL ============ */}
      {markingSample && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t(`Mark Sample as ${markingSample.finding.label}`, markingSample.finding.buttonTelugu)}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {markingSample.finding.actRef}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMarkingSample(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sample summary */}
            <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">{t('Sample Code', 'నమూనా కోడ్')}:</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{markingSample.sample.sampleCode}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">{t('Commodity', 'వస్తువు')}:</span>
                  <p className="font-bold text-slate-900 dark:text-white capitalize">{markingSample.sample.commodity}</p>
                </div>
                {markingSample.sample.productLabel && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">{t('Product / Crop & Variety', 'ఉత్పత్తి / పంట & రకం')}:</span>
                    <p className="font-bold text-slate-900 dark:text-white truncate">{markingSample.sample.productLabel}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">{t('Firm / Dealer', 'డీలర్ / సంస్థ')}:</span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{markingSample.sample.dealerName}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                {markingSample.finding.description}
              </p>
            </div>

            {/* Form fields */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  {t('Lab Analysis / Test Report No.', 'ల్యాబ్ రిపోర్ట్ / టెస్ట్ నంబర్')}
                </label>
                <input
                  type="text"
                  value={reportRefInput}
                  onChange={(e) => setReportRefInput(e.target.value)}
                  placeholder="e.g. CTL/RPT/2026/042 or Memorandum No."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    {t('Report Date', 'రిపోర్ట్ తేదీ')}
                  </label>
                  <input
                    type="date"
                    value={reportDateInput}
                    onChange={(e) => setReportDateInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    {t('Finding Classification', 'చట్టబద్ధ వర్గీకరణ')}
                  </label>
                  <div className={`rounded-xl border px-3 py-2 text-xs font-black ${markingSample.finding.badgeCls}`}>
                    {markingSample.finding.label}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  {t('Non-compliance Remarks / Test Parameters (Optional)', 'రిమార్కులు / విఫలమైన పారామితులు')}
                </label>
                <input
                  type="text"
                  value={reportRemarksInput}
                  onChange={(e) => setReportRemarksInput(e.target.value)}
                  placeholder="e.g. Active ingredient below tolerance, Germination % below minimum standard"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMarkingSample(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'రద్దు చేయండి')}
              </button>
              <button
                type="button"
                disabled={submittingLabReport}
                onClick={() => void handleConfirmNonCompliance()}
                className={`rounded-xl px-4 py-2 text-xs font-black shadow-md transition disabled:opacity-60 ${markingSample.finding.buttonCls}`}
              >
                {submittingLabReport ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('Saving...', 'సేవ్ అవుతోంది...')}
                  </span>
                ) : (
                  <span>
                    {t(`Confirm as ${markingSample.finding.label}`, markingSample.finding.buttonTelugu)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(sampleToDelete)}
        title={t('Delete this sample?', 'ఈ నమూనా తొలగించాలా?')}
        message={sampleToDelete ? `${sampleToDelete.sampleCode} — ${sampleToDelete.dealerName}` : ''}
        confirmLabel={t('Delete Permanently', 'శాశ్వతంగా తొలగించు')}
        cancelLabel={t('Cancel', 'రద్దు చేయండి')}
        onConfirm={() => void handleDeleteSample()}
        onCancel={() => setSampleToDelete(null)}
      />

      {dealer360Name && data && (
        <DealerProfileDrawer dealerName={dealer360Name} data={data} onClose={() => setDealer360Name(null)} />
      )}
    </div>
  );
}
