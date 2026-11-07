import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { localTodayDate } from '../../../shared/utils/dateUtils';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileWarning,
  FlaskConical,
  Gavel,
  Loader2,
  Plus,
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
  type CaseStage,
  type CasePriority,
  type EnforcementData,
  type OfficerCase,
  type CaseSuggestion,
  type DealerScorecard,
  type SamplePipelineItem,
  type ReplyStatus,
  type OrderRow,
  getStatutoryNonComplianceInfo,
} from '../services/enforcementTrackerService';
import type { StatutoryCommodity } from '../../auth/types/officerAuth';

type TrackerTab = 'cases' | 'deadlines' | 'scorecards' | 'samples';

const STAGE_ORDER: CaseStage[] = ['INSPECTION', 'SAMPLING', 'LAB_TEST', 'SHOW_CAUSE', 'ENFORCEMENT', 'CLOSED'];
const STAGE_LABELS: Record<CaseStage, { en: string; te: string }> = {
  INSPECTION: { en: 'Inspection', te: 'తనిఖీ' },
  SAMPLING: { en: 'Sampling', te: 'నమూనా సేకరణ' },
  LAB_TEST: { en: 'Lab Test', te: 'ల్యాబ్ పరీక్ష' },
  SHOW_CAUSE: { en: 'Show Cause', te: 'షో కారణం' },
  ENFORCEMENT: { en: 'Enforcement', te: 'అమలు' },
  CLOSED: { en: 'Closed', te: 'మూసివేయబడింది' },
};

const PRIORITY_STYLES: Record<CasePriority, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  NORMAL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

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

const COMMODITY_LABELS: Record<StatutoryCommodity | 'mixed', { en: string; te: string }> = {
  fertilizer: { en: 'Fertilizer', te: 'ఎరువు' },
  pesticide: { en: 'Pesticide', te: 'పురుగుమందు' },
  seed: { en: 'Seed', te: 'విత్తనం' },
  mixed: { en: 'Mixed', te: 'మిశ్రమం' },
};

export function EnforcementTracker() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TrackerTab>(() => {
    const tabParam = searchParams.get('tab') as TrackerTab | null;
    if (tabParam && ['cases', 'deadlines', 'scorecards', 'samples'].includes(tabParam)) {
      return tabParam;
    }
    return 'cases';
  });
  const [data, setData] = useState<EnforcementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | CaseStage>('all');
  const [selectedCase, setSelectedCase] = useState<OfficerCase | null>(null);
  const [caseToClose, setCaseToClose] = useState<OfficerCase | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<OfficerCase | null>(null);
  const [suggestionToOpen, setSuggestionToOpen] = useState<CaseSuggestion | null>(null);
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({ dealerName: '', commodity: 'fertilizer' as StatutoryCommodity, priority: 'NORMAL' as CasePriority, notes: '' });
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [markingSample, setMarkingSample] = useState<{
    sample: SamplePipelineItem;
    finding: ReturnType<typeof getStatutoryNonComplianceInfo>;
  } | null>(null);
  const [reportRefInput, setReportRefInput] = useState('');
  const [reportDateInput, setReportDateInput] = useState(localTodayDate());
  const [reportRemarksInput, setReportRemarksInput] = useState('');
  const [submittingLabReport, setSubmittingLabReport] = useState(false);

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

  const suggestions = useMemo(() => (data ? EnforcementTrackerService.buildCaseSuggestions(data) : []), [data]);
  const deadlineItems = useMemo(() => (data ? EnforcementTrackerService.buildDeadlineItems(data.orders) : []), [data]);
  const scorecards = useMemo(() => (data ? EnforcementTrackerService.buildDealerScorecards(data) : []), [data]);
  const samplePipeline = useMemo(() => (data ? EnforcementTrackerService.buildSamplePipeline(data.samples) : []), [data]);

  const filteredCases = useMemo(() => {
    if (!data) return [];
    return data.cases.filter((c) => {
      if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.dealer_name.toLowerCase().includes(q) || c.case_number.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, stageFilter, searchQuery]);

  const filteredScorecards = useMemo(() => {
    if (!searchQuery.trim()) return scorecards;
    const q = searchQuery.toLowerCase();
    return scorecards.filter((s) => s.dealerName.toLowerCase().includes(q));
  }, [scorecards, searchQuery]);

  const filteredSamples = useMemo(() => {
    if (!searchQuery.trim()) return samplePipeline;
    const q = searchQuery.toLowerCase();
    return samplePipeline.filter((s) => s.dealerName.toLowerCase().includes(q) || s.sampleCode.toLowerCase().includes(q));
  }, [samplePipeline, searchQuery]);

  const stats = useMemo(() => {
    const openCases = data?.cases.filter((c) => c.stage !== 'CLOSED').length ?? 0;
    const urgentDeadlines = deadlineItems.filter((d) => d.status === 'URGENT').length;
    const criticalDealers = scorecards.filter((s) => s.riskLevel === 'CRITICAL' || s.riskLevel === 'HIGH').length;
    const activeSamples = samplePipeline.filter((s) => s.labStatus !== 'TEST_PASSED' && s.labStatus !== 'TEST_FAILED').length;
    return { openCases, urgentDeadlines, criticalDealers, activeSamples };
  }, [data, deadlineItems, scorecards, samplePipeline]);

  const handleCreateCase = async () => {
    if (!newCaseForm.dealerName.trim()) return;
    setSaving(true);
    const result = await EnforcementTrackerService.createCase({
      dealerName: newCaseForm.dealerName.trim(),
      commodity: newCaseForm.commodity,
      priority: newCaseForm.priority,
      notes: newCaseForm.notes || undefined,
    });
    setSaving(false);
    if (result.success) {
      setNewCaseOpen(false);
      setNewCaseForm({ dealerName: '', commodity: 'fertilizer', priority: 'NORMAL', notes: '' });
      void load(true);
    }
  };

  const handleOpenSuggestion = async () => {
    if (!suggestionToOpen) return;
    setSaving(true);
    await EnforcementTrackerService.createCase({
      dealerName: suggestionToOpen.dealerName,
      commodity: suggestionToOpen.commodity,
      stage: suggestionToOpen.hasSample ? 'SAMPLING' : suggestionToOpen.hasOrder ? 'SHOW_CAUSE' : 'INSPECTION',
    });
    setSaving(false);
    setSuggestionToOpen(null);
    void load(true);
  };

  const handleAdvanceStage = async (caseItem: OfficerCase) => {
    const idx = STAGE_ORDER.indexOf(caseItem.stage);
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) return;
    const next = STAGE_ORDER[idx + 1];
    await EnforcementTrackerService.updateCaseStage(caseItem.id, next);
    setSelectedCase(null);
    void load(true);
  };

  const handleCloseCase = async () => {
    if (!caseToClose) return;
    await EnforcementTrackerService.updateCaseStage(caseToClose.id, 'CLOSED');
    setCaseToClose(null);
    setSelectedCase(null);
    void load(true);
  };

  const handleDeleteCase = async () => {
    if (!caseToDelete) return;
    await EnforcementTrackerService.deleteCase(caseToDelete.id);
    setCaseToDelete(null);
    setSelectedCase(null);
    void load(true);
  };

  const handleSetDeadline = async (order: OrderRow, deadline: string | null) => {
    await EnforcementTrackerService.updateOrderReply(order, deadline);
    void load(true);
  };

  const handleUpdateReplyStatus = async (order: OrderRow, status: ReplyStatus) => {
    await EnforcementTrackerService.updateOrderReply(order, null, status);
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

  const handleAddNote = async () => {
    if (!selectedCase || !noteText.trim()) return;
    await EnforcementTrackerService.addCaseNote(selectedCase.id, noteText.trim());
    setNoteText('');
    void load(true);
  };

  const tabs: { id: TrackerTab; label: string; te: string; icon: typeof Briefcase; badge?: number }[] = [
    { id: 'cases', label: 'Cases', te: 'కేసులు', icon: Briefcase, badge: stats.openCases },
    { id: 'deadlines', label: 'Deadlines', te: 'గడువులు', icon: CalendarClock, badge: stats.urgentDeadlines },
    { id: 'scorecards', label: 'Dealer Scorecards', te: 'డీలర్ స్కోర్‌కార్డులు', icon: Scale, badge: stats.criticalDealers },
    { id: 'samples', label: 'Sample Pipeline', te: 'నమూనా పైప్‌లైన్', icon: FlaskConical, badge: stats.activeSamples },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-2 sm:p-3">
      <ModulePageHeader
        className="mb-4"
        title={t('Enforcement Tracker', 'అమలు ట్రాకర్')}
        subtitle={t('Cases, deadlines, dealer risk & sample pipeline', 'కేసులు, గడువులు, డీలర్ రిస్క్ & నమూనా పైప్‌లైన్')}
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

      {/* Summary stat cards */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: t('Open Cases', 'ఓపెన్ కేసులు'), value: stats.openCases, icon: Briefcase, tone: 'text-emerald-700 bg-emerald-50 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/40', bar: 'bg-emerald-600' },
          { label: t('Urgent Deadlines', 'అత్యవసర గడువులు'), value: stats.urgentDeadlines, icon: AlertTriangle, tone: 'text-rose-700 bg-rose-50 ring-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800/40', bar: 'bg-rose-600' },
          { label: t('High-Risk Dealers', 'అధిక రిస్క్ డీలర్లు'), value: stats.criticalDealers, icon: ShieldAlert, tone: 'text-amber-700 bg-amber-50 ring-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/40', bar: 'bg-amber-500' },
          { label: t('Active Samples', 'యాక్టివ్ నమూనాలు'), value: stats.activeSamples, icon: FlaskConical, tone: 'text-sky-700 bg-sky-50 ring-sky-200/60 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800/40', bar: 'bg-sky-600' },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 ${(s as any).bar}`} />
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
          placeholder={t('Search dealer, case no, sample code...', 'డీలర్, కేసు నం, నమూనా కోడ్ వెతకండి...')}
          className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* ============ CASES TAB ============ */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', ...STAGE_ORDER] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStageFilter(s as 'all' | CaseStage)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                    stageFilter === s
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {s === 'all' ? t('All', 'అన్నీ') : t(STAGE_LABELS[s as CaseStage].en, STAGE_LABELS[s as CaseStage].te)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setNewCaseOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('New Case', 'కొత్త కేసు')}
            </button>
          </div>

          {filteredCases.length === 0 && suggestions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <Briefcase className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                {t('No cases yet. Activity with samples or orders will appear as suggestions.', 'ఇంకా కేసులు లేవు. నమూనాలు లేదా ఆర్డర్లతో ఉన్న యాక్టివిటీ సూచనలుగా కనిపిస్తుంది.')}
              </p>
            </div>
          )}

          {/* Suggested cases from existing records */}
          {suggestions.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">
                <FileWarning className="h-3.5 w-3.5" />
                {t('Suggested cases from records', 'రికార్డుల నుండి సూచించిన కేసులు')}
              </p>
              <div className="space-y-1.5">
                {suggestions.slice(0, 5).map((s) => (
                  <button
                    key={`${s.dealerName}-${s.commodity}`}
                    type="button"
                    onClick={() => setSuggestionToOpen(s)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-amber-200/70 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-amber-400 dark:border-amber-800/60 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <span className="min-w-0 truncate">{s.dealerName} · {t(COMMODITY_LABELS[s.commodity].en, COMMODITY_LABELS[s.commodity].te)}</span>
                    <span className="flex shrink-0 items-center gap-1 text-amber-700 dark:text-amber-300">
                      {s.recordCount} {t('records', 'రికార్డులు')}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Case cards */}
          <div className="grid gap-3">
            {filteredCases.map((c) => {
              const stageIdx = STAGE_ORDER.indexOf(c.stage);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCase(c)}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-slate-400">{c.case_number}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${PRIORITY_STYLES[c.priority]}`}>{c.priority}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {t(COMMODITY_LABELS[c.commodity].en, COMMODITY_LABELS[c.commodity].te)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-black text-slate-900 dark:text-white">{c.dealer_name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {t('Opened', 'తెరిచినది')} {c.opened_date}
                        {c.target_close_date ? ` · ${t('Target', 'లక్ష్యం')} ${c.target_close_date}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </div>
                  {/* Stage stepper */}
                  <div className="mt-3 flex items-center gap-1">
                    {STAGE_ORDER.map((s, i) => (
                      <span
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= stageIdx ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                        } ${s === 'CLOSED' && i === stageIdx ? 'bg-slate-400' : ''}`}
                        title={t(STAGE_LABELS[s].en, STAGE_LABELS[s].te)}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    {t(STAGE_LABELS[c.stage].en, STAGE_LABELS[c.stage].te)}
                    {c.stage !== 'CLOSED' && stageIdx < STAGE_ORDER.length - 1 && (
                      <span className="ml-1 text-slate-400">→ {t(STAGE_LABELS[STAGE_ORDER[stageIdx + 1]].en, STAGE_LABELS[STAGE_ORDER[stageIdx + 1]].te)}</span>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
                  <p className="truncate text-sm font-black text-slate-900 dark:text-white">{order.firm_name}</p>
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
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">{s.dealerName}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                      {t(COMMODITY_LABELS[s.commodity].en, COMMODITY_LABELS[s.commodity].te)} · {t('last activity', 'చివరి యాక్టివిటీ')} {s.lastActivity || '—'}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${RISK_STYLES[s.riskLevel]}`}>
                  {s.riskLevel} · {s.riskScore}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                {[
                  { label: t('Inspections', 'తనిఖీలు'), value: s.inspections, cls: 'text-sky-600' },
                  { label: t('Orders', 'ఆర్డర్లు'), value: s.orders, cls: 'text-slate-600 dark:text-slate-300' },
                  { label: t('Show Cause', 'షో కారణం'), value: s.showCause, cls: 'text-amber-600' },
                  { label: t('Seizures', 'సీజర్లు'), value: s.seizures, cls: 'text-red-600' },
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
            return (
              <div key={status} className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
                  <FlaskConical className="h-3.5 w-3.5" />
                  {t(LAB_STATUS_LABELS[status].en, LAB_STATUS_LABELS[status].te)} ({items.length})
                </p>
                <div className="space-y-1.5">
                  {items.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-slate-800 dark:text-slate-100">{s.dealerName}</p>
                        <p className="text-[10px] font-semibold text-slate-500">
                          {s.sampleCode} · {t(COMMODITY_LABELS[s.commodity].en, COMMODITY_LABELS[s.commodity].te)} · {s.sampledDate} · {s.daysInStage}d {t('in stage', 'స్టేజ్‌లో')}
                        </p>
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
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('Standard / Passed', 'ప్రమాణాల ప్రకారం ఉంది')}
                          </span>
                        )}
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

      {/* ============ CASE DETAIL MODAL ============ */}
      {selectedCase && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[11px] font-bold text-slate-400">{selectedCase.case_number}</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedCase.dealer_name}</h3>
                <p className="text-xs font-semibold text-slate-500">
                  {t(COMMODITY_LABELS[selectedCase.commodity].en, COMMODITY_LABELS[selectedCase.commodity].te)} · {t('opened', 'తెరిచినది')} {selectedCase.opened_date}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedCase(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stage stepper detail */}
            <div className="mb-4 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">{t('Case stage', 'కేసు దశ')}</p>
              <div className="flex items-center gap-1">
                {STAGE_ORDER.map((s) => {
                  const idx = STAGE_ORDER.indexOf(s);
                  const current = STAGE_ORDER.indexOf(selectedCase.stage);
                  const done = idx <= current;
                  return (
                    <React.Fragment key={s}>
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${done ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                        {idx + 1}
                      </span>
                      {idx < STAGE_ORDER.length - 1 && <span className={`h-0.5 flex-1 ${idx < current ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {t(STAGE_LABELS[selectedCase.stage].en, STAGE_LABELS[selectedCase.stage].te)}
              </p>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">{t('Priority', 'ప్రాధాన్యత')}:</span>
              {(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as CasePriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={async () => { await EnforcementTrackerService.updateCasePriority(selectedCase.id, p); void load(true); }}
                  className={`rounded-full px-2 py-1 text-[10px] font-black transition ${selectedCase.priority === p ? PRIORITY_STYLES[p] + ' ring-2 ring-offset-1' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            {selectedCase.stage !== 'CLOSED' && (
              <button
                type="button"
                onClick={() => void handleAdvanceStage(selectedCase)}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                {t('Advance to', 'తదుపరి దశకు')}{' '}
                {t(STAGE_LABELS[STAGE_ORDER[Math.min(STAGE_ORDER.indexOf(selectedCase.stage) + 1, STAGE_ORDER.length - 1)]].en, STAGE_LABELS[STAGE_ORDER[Math.min(STAGE_ORDER.indexOf(selectedCase.stage) + 1, STAGE_ORDER.length - 1)]].te)}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {selectedCase.stage !== 'CLOSED' && (
              <button
                type="button"
                onClick={() => setCaseToClose(selectedCase)}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {t('Close Case', 'కేసు మూసివేయండి')}
              </button>
            )}

            <button
              type="button"
              onClick={() => setCaseToDelete(selectedCase)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-800/60 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-4 w-4" />
              {t('Delete Case', 'కేసు తొలగించండి')}
            </button>

            {/* Notes */}
            <div className="mb-2">
              <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">{t('Notes', 'గమనికలు')}</p>
              {selectedCase.notes && (
                <pre className="mb-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-[11px] font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{selectedCase.notes}</pre>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleAddNote()}
                  placeholder={t('Add note...', 'గమనిక జోడించండి...')}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <button type="button" onClick={() => void handleAddNote()} className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:bg-slate-700">
                  {t('Add', 'జోడించు')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ NEW CASE MODAL ============ */}
      {newCaseOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                <Briefcase className="h-5 w-5 text-emerald-600" />
                {t('New Enforcement Case', 'కొత్త అమలు కేసు')}
              </h3>
              <button type="button" onClick={() => setNewCaseOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">{t('Dealer / Firm Name', 'డీలర్ / ఫర్మ్ పేరు')}</label>
                <input
                  type="text"
                  value={newCaseForm.dealerName}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, dealerName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder={t('Enter dealer name', 'డీలర్ పేరు నమోదు చేయండి')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">{t('Commodity', 'వస్తువు')}</label>
                  <select
                    value={newCaseForm.commodity}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, commodity: e.target.value as StatutoryCommodity })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="fertilizer">{t('Fertilizer', 'ఎరువు')}</option>
                    <option value="pesticide">{t('Pesticide', 'పురుగుమందు')}</option>
                    <option value="seed">{t('Seed', 'విత్తనం')}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">{t('Priority', 'ప్రాధాన్యత')}</label>
                  <select
                    value={newCaseForm.priority}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, priority: e.target.value as CasePriority })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">{t('Notes (optional)', 'గమనికలు (ఐచ్ఛికం)')}</label>
                <textarea
                  value={newCaseForm.notes}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleCreateCase()}
                disabled={saving || !newCaseForm.dealerName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t('Create Case', 'కేసు సృష్టించండి')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion confirm */}
      <ConfirmDialog
        open={Boolean(suggestionToOpen)}
        title={t('Open Case?', 'కేసు తెరవాలా?')}
        message={suggestionToOpen ? `${suggestionToOpen.dealerName} — ${suggestionToOpen.recordCount} ${t('records', 'రికార్డులు')} (${t(COMMODITY_LABELS[suggestionToOpen.commodity].en, COMMODITY_LABELS[suggestionToOpen.commodity].te)})` : ''}
        confirmLabel={t('Open Case', 'కేసు తెరవండి')}
        cancelLabel={t('Cancel', 'రద్దు చేయండి')}
        onConfirm={() => void handleOpenSuggestion()}
        onCancel={() => setSuggestionToOpen(null)}
      />

      <ConfirmDialog
        open={Boolean(caseToClose)}
        title={t('Close this case?', 'ఈ కేసు మూసివేయాలా?')}
        message={caseToClose ? `${caseToClose.case_number} — ${caseToClose.dealer_name}` : ''}
        confirmLabel={t('Close Case', 'మూసివేయండి')}
        cancelLabel={t('Cancel', 'రద్దు చేయండి')}
        onConfirm={() => void handleCloseCase()}
        onCancel={() => setCaseToClose(null)}
      />

      <ConfirmDialog
        open={Boolean(caseToDelete)}
        title={t('Delete this case?', 'ఈ కేసు తొలగించాలా?')}
        message={caseToDelete ? `${caseToDelete.case_number} — ${caseToDelete.dealer_name}` : ''}
        confirmLabel={t('Delete Permanently', 'శాశ్వతంగా తొలగించు')}
        cancelLabel={t('Cancel', 'రద్దు చేయండి')}
        onConfirm={() => void handleDeleteCase()}
        onCancel={() => setCaseToDelete(null)}
      />
    </div>
  );
}
