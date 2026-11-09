import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { localTodayDate } from '../../../shared/utils/dateUtils';
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
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
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import {
  EnforcementTrackerService,
  type EnforcementData,
  type DealerScorecard,
  type SamplePipelineItem,
  type ReplyStatus,
  type OrderRow,
  getStatutoryNonComplianceInfo,
} from '../services/enforcementTrackerService';
import type { StatutoryCommodity } from '../../auth/types/officerAuth';
import { DealerProfileDrawer } from '../components/DealerProfileDrawer';

type TrackerTab = 'deadlines' | 'scorecards' | 'samples';

const RISK_STYLES: Record<DealerScorecard['riskLevel'], string> = {
  LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TrackerTab>(() => {
    const tabParam = searchParams.get('tab') as TrackerTab | null;
    if (tabParam && ['deadlines', 'scorecards', 'samples'].includes(tabParam)) {
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

  const filteredScorecards = useMemo(() => {
    if (!searchQuery.trim()) return scorecards;
    const q = searchQuery.toLowerCase();
    return scorecards.filter((s) => s.dealerName.toLowerCase().includes(q));
  }, [scorecards, searchQuery]);

  const filteredSamples = useMemo(() => {
    if (!searchQuery.trim()) return samplePipeline;
    const q = searchQuery.toLowerCase();
    return samplePipeline.filter((s) =>
      s.dealerName.toLowerCase().includes(q) ||
      s.sampleCode.toLowerCase().includes(q) ||
      s.productLabel.toLowerCase().includes(q)
    );
  }, [samplePipeline, searchQuery]);

  const stats = useMemo(() => {
    const urgentDeadlines = deadlineItems.filter((d) => d.status === 'URGENT').length;
    const criticalDealers = scorecards.filter((s) => s.riskLevel === 'CRITICAL' || s.riskLevel === 'HIGH').length;
    const activeSamples = samplePipeline.filter((s) => s.labStatus !== 'TEST_PASSED' && s.labStatus !== 'TEST_FAILED').length;
    const stopSaleOrders = (data?.orders ?? []).filter((o) => o.order_type === 'stop_sale').length;
    const seizureOrders = (data?.orders ?? []).filter((o) => o.order_type === 'seizure').length;
    return { urgentDeadlines, criticalDealers, activeSamples, stopSaleOrders, seizureOrders };
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

  const tabs: { id: TrackerTab; label: string; te: string; icon: typeof CalendarClock; badge?: number }[] = [
    { id: 'scorecards', label: 'Dealer Scorecards', te: 'డీలర్ స్కోర్‌కార్డులు', icon: Scale, badge: stats.criticalDealers },
    { id: 'samples', label: 'Sample Pipeline', te: 'నమూనా పైప్‌లైన్', icon: FlaskConical, badge: stats.activeSamples },
    { id: 'deadlines', label: 'Deadlines', te: 'గడువులు', icon: CalendarClock, badge: stats.urgentDeadlines },
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
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {[
          { label: t('Urgent Deadlines', 'అత్యవసర గడువులు'), value: stats.urgentDeadlines, icon: AlertTriangle, tone: 'text-rose-700 bg-rose-50 ring-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800/40', bar: 'bg-rose-600' },
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
      <div className="mb-4 inline-flex w-full max-w-2xl items-stretch gap-1 rounded-2xl border border-slate-200/90 bg-white/90 p-1 shadow-2xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold transition sm:text-xs ${
              activeTab === tab.id
                ? 'bg-emerald-700 text-white shadow-2xs hover:bg-emerald-600 dark:bg-emerald-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-300'
            }`}
          >
            <tab.icon className={`h-3.5 w-3.5 shrink-0 ${activeTab === tab.id ? 'text-gold-300' : ''}`} />
            <span className="truncate">{t(tab.label, tab.te)}</span>
            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none ${activeTab === tab.id ? 'bg-white/20 text-emerald-50' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {tab.badge}
              </span>
            )}
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

      {/* ============ DEADLINES TAB ============ */}
      {activeTab === 'deadlines' && (
        <div className="space-y-2">
          {deadlineItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <CalendarClock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-bold text-slate-500">{t('No show cause notices yet.', 'ఇంకా షో కారణ నోటీసులు లేవు.')}</p>
            </div>
          )}
          {deadlineItems.map(({ order, daysLeft, status }) => (
            <div key={order.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setDealer360Name(order.firm_name)}
                    className="truncate text-sm font-black text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-2 transition hover:text-emerald-700 hover:decoration-emerald-500 dark:text-white dark:hover:text-emerald-300"
                    title={t('View dealer 360° profile', 'డీలర్ 360° ప్రొఫైల్ చూడండి')}
                  >
                    {order.firm_name}
                  </button>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {order.order_number} · {t(COMMODITY_LABELS[order.commodity].en, COMMODITY_LABELS[order.commodity].te)} · {order.order_date}
                    {order._local && (
                      <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {t('local', 'లోకల్')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  {status === 'URGENT' && daysLeft !== null && (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-700 dark:bg-red-950 dark:text-red-300">
                      {daysLeft < 0 ? `${Math.abs(daysLeft)} ${t('d overdue', 'రోజులు ఆలస్యం')}` : `${daysLeft} ${t('d left', 'రోజులు మిగిలాయి')}`}
                    </span>
                  )}
                  {status === 'DUE_SOON' && daysLeft !== null && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {daysLeft} {t('d left', 'రోజులు మిగిలాయి')}
                    </span>
                  )}
                  {status === 'OK' && daysLeft !== null && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {daysLeft} {t('d left', 'రోజులు మిగిలాయి')}
                    </span>
                  )}
                  {status === 'UNSET' && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {t('No deadline', 'గడువు లేదు')}
                    </span>
                  )}
                  {status === 'CLOSED' && order.reply_status && order.reply_status !== 'PENDING' && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {order.reply_status}
                    </span>
                  )}
                </div>
              </div>

              {/* Deadline setter */}
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

      {/* ============ SCORECARDS TAB ============ */}
      {activeTab === 'scorecards' && (
        <div className="space-y-2">
          {filteredScorecards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <Scale className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-bold text-slate-500">{t('No dealer activity recorded yet.', 'ఇంకా డీలర్ యాక్టివిటీ రికార్డ్ కాలేదు.')}</p>
            </div>
          )}
          {filteredScorecards.map((s, i) => (
            <div key={s.dealerName} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${RISK_STYLES[s.riskLevel]}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setDealer360Name(s.dealerName)}
                      className="truncate text-sm font-black text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-2 transition hover:text-emerald-700 hover:decoration-emerald-500 dark:text-white dark:hover:text-emerald-300"
                      title={t('View dealer 360° profile', 'డీలర్ 360° ప్రొఫైల్ చూడండి')}
                    >
                      {s.dealerName}
                    </button>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                      {t(COMMODITY_LABELS[s.commodity].en, COMMODITY_LABELS[s.commodity].te)} · {t('last activity', 'చివరి యాక్టివిటీ')} {s.lastActivity || '—'}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${RISK_STYLES[s.riskLevel]}`}>
                  {s.riskLevel} · {s.riskScore}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
                {[
                  { label: t('Inspections', 'తనిఖీలు'), value: s.inspections, cls: 'text-sky-600' },
                  { label: t('Stop Sale', 'స్టాప్ సేల్'), value: s.stopSale, cls: 'text-orange-600' },
                  { label: t('Show Cause', 'షో కారణం'), value: s.showCause, cls: 'text-amber-600' },
                  { label: t('Seizures', 'సీజర్లు'), value: s.seizures, cls: 'text-red-600' },
                  { label: t('Samples', 'నమూనాలు'), value: s.samplesTotal, cls: s.samplesFailed > 0 ? 'text-red-600' : 'text-violet-600' },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-slate-50 px-1 py-1.5 dark:bg-slate-800/60">
                    <p className={`text-sm font-black ${m.cls}`}>{m.value}</p>
                    <p className="text-slate-400">{m.label}</p>
                  </div>
                ))}
              </div>
              {s.samplesTotal > 0 && (
                <p className="mt-2 text-[11px] font-bold text-slate-500">
                  {t('Samples', 'నమూనాలు')}: {s.samplesTotal} · {t('failed', 'ఫెయిల్')}: <span className={s.samplesFailed > 0 ? 'text-red-600' : 'text-emerald-600'}>{s.samplesFailed}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ============ SAMPLES TAB ============ */}
      {activeTab === 'samples' && (
        <div className="space-y-3">
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
                          className="truncate text-xs font-black text-slate-800 underline decoration-dotted decoration-slate-300 underline-offset-2 transition hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-300"
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
