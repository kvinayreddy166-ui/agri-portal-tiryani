import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Heart,
  HelpCircle,
  Inbox,
  KeyRound,
  Lightbulb,
  Link2,
  ListChecks,
  Loader2,
  Lock,
  MessageSquareReply,
  Palette,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Unlink,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { useConfirmDialog } from '../../../shared/components/ui/useConfirmDialog';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { useBackButtonOverlay } from '../../../shared/hooks/useBackButtonOverlay';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  feedbackCategoryMeta,
  feedbackStatusMeta,
  type FeedbackCategory,
  type FeedbackDetail,
  type FeedbackPriority,
  type FeedbackStatus,
  type FeedbackTicket,
} from '../types';
import {
  adminAddResponse,
  adminDeleteFeedback,
  adminGetFeedbackDetail,
  adminGetStats,
  adminListAssignees,
  adminListFeedback,
  adminListTicketOptions,
  adminSetDuplicate,
  adminUpdateTicket,
  exportFeedbackExcel,
  type AssigneeOption,
  type FeedbackStats,
} from '../services/feedbackService';

const CATEGORY_ICONS: Record<FeedbackCategory, React.ComponentType<{ className?: string }>> = {
  bug_report: Bug,
  feature_request: Lightbulb,
  improvement: Wrench,
  content_correction: ClipboardList,
  ui_ux: Palette,
  account_login: KeyRound,
  general_query: HelpCircle,
  appreciation: Heart,
};

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-emerald-500/20';

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const meta = feedbackStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${meta.badgeClass}`}>
      {meta.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === 'urgent'
      ? 'bg-red-100 text-red-700 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800'
      : priority === 'high'
        ? 'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-800'
        : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ring-1 ${cls}`}>{priority}</span>;
}

function StatCard({ icon: Icon, label, value, tone, style }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: string; style?: React.CSSProperties }) {
  return (
    <div className="portal-card animate-card-in flex items-center gap-3 p-4" style={style}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black leading-tight text-slate-900 dark:text-white">{value}</p>
        <p className="truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function FeedbackAdmin() {
  const { isAdminUser, user, officerProfile } = useAuth();
  const { t } = useLanguage();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const toast = { showSuccess, showError };
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { askConfirm, confirmDialog } = useConfirmDialog();

  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [ticketOptions, setTicketOptions] = useState<Array<{ id: string; ticket_number: string | null; subject: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<FeedbackDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const detailOverlay = useBackButtonOverlay('feedback-admin-detail', () => {
    setDetail(null);
    setResponseText('');
  });

  const filters = useMemo(
    () => ({ status: statusFilter, category: categoryFilter, module: moduleFilter, search }),
    [statusFilter, categoryFilter, moduleFilter, search]
  );

  const loadAll = useCallback(async () => {
    if (!isAdminUser) return;
    setLoading(true);
    try {
      const [list, s] = await Promise.all([adminListFeedback(filters), adminGetStats()]);
      setTickets(list);
      setStats(s);
    } catch (err) {
      toastRef.current.showError('Load failed', err instanceof Error ? err.message : 'Could not load feedback.');
    } finally {
      setLoading(false);
    }
  }, [isAdminUser, filters]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (isAdminUser) {
      void adminListAssignees().then(setAssignees);
      void adminListTicketOptions().then(setTicketOptions);
    }
  }, [isAdminUser]);

  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => t.module && set.add(t.module));
    return Array.from(set).sort();
  }, [tickets]);

  const openDetail = async (ticket: FeedbackTicket) => {
    detailOverlay.pushOverlay();
    setDetailLoading(true);
    setDetail(null);
    setResponseText('');
    try {
      const d = await adminGetFeedbackDetail(ticket.id);
      setDetail(d);
    } catch (err) {
      toast.showError('Load failed', err instanceof Error ? err.message : 'Could not load ticket.');
      detailOverlay.closeOverlay();
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    detailOverlay.closeOverlay();
    setDetail(null);
    setResponseText('');
  };

  const refreshDetail = async (id: string) => {
    const d = await adminGetFeedbackDetail(id);
    setDetail(d);
    await loadAll();
  };

  const handleStatusChange = async (status: FeedbackStatus) => {
    if (!detail) return;
    setSaving(true);
    try {
      await adminUpdateTicket(detail.ticket.id, { status });
      await refreshDetail(detail.ticket.id);
      toast.showSuccess('Status updated', `${detail.ticket.ticket_number} → ${feedbackStatusMeta(status).label}`);
    } catch (err) {
      toast.showError('Update failed', err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setSaving(false);
    }
  };

  const handlePriorityChange = async (priority: FeedbackPriority) => {
    if (!detail) return;
    setSaving(true);
    try {
      await adminUpdateTicket(detail.ticket.id, { priority });
      await refreshDetail(detail.ticket.id);
    } catch (err) {
      toast.showError('Update failed', err instanceof Error ? err.message : 'Could not update priority.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (assigneeId: string) => {
    if (!detail) return;
    setSaving(true);
    try {
      if (!assigneeId) {
        await adminUpdateTicket(detail.ticket.id, { assigned_to: null, assigned_label: null });
      } else {
        const opt = assignees.find((a) => a.id === assigneeId);
        await adminUpdateTicket(detail.ticket.id, { assigned_to: assigneeId, assigned_label: opt?.label ?? assigneeId });
      }
      await refreshDetail(detail.ticket.id);
      toast.showSuccess('Assignment updated');
    } catch (err) {
      toast.showError('Update failed', err instanceof Error ? err.message : 'Could not assign ticket.');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateChange = async (duplicateOfId: string) => {
    if (!detail) return;
    setSaving(true);
    try {
      await adminSetDuplicate(detail.ticket.id, duplicateOfId || null);
      await refreshDetail(detail.ticket.id);
      toast.showSuccess(duplicateOfId ? 'Linked as duplicate' : 'Duplicate link removed');
    } catch (err) {
      toast.showError('Update failed', err instanceof Error ? err.message : 'Could not link duplicate.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendResponse = async () => {
    if (!detail || !responseText.trim()) return;
    setSendingResponse(true);
    try {
      await adminAddResponse(detail.ticket.id, responseText, {
        id: user?.id ?? '',
        name: officerProfile?.full_name || user?.email || 'Administrator',
      });
      setResponseText('');
      await refreshDetail(detail.ticket.id);
      toast.showSuccess('Response sent', 'The user can now see your reply on their ticket.');
    } catch (err) {
      toast.showError('Send failed', err instanceof Error ? err.message : 'Could not send response.');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    const ok = await askConfirm({
      title: 'Delete feedback?',
      message: `Ticket ${detail.ticket.ticket_number ?? ''} and all its responses will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await adminDeleteFeedback(detail.ticket.id);
      toast.showSuccess('Feedback deleted', `${detail.ticket.ticket_number} was permanently removed.`);
      closeDetail();
      await loadAll();
    } catch (err) {
      toast.showError('Delete failed', err instanceof Error ? err.message : 'Could not delete feedback.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportFeedbackExcel(tickets);
      toast.showSuccess('Export ready', `${tickets.length} ticket(s) exported to Excel.`);
    } catch {
      toast.showError('Export failed', 'Could not export feedback.');
    }
  };

  if (!isAdminUser) {
    return (
      <div className="portal-card flex flex-col items-center gap-3 p-10 text-center">
        <Lock className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="text-base font-black text-slate-800 dark:text-white">{t('Administrators only', 'నిర్వాహకులకు మాత్రమే')}</p>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {t('The feedback management console is restricted to portal administrators.', 'ఫీడ్‌బ్యాక్ నిర్వహణ కన్సోల్ పోర్టల్ నిర్వాహకులకు మాత్రమే పరిమితం.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('Administration', 'నిర్వహణ')}
        title={t('Feedback Management', 'ఫీడ్‌బ్యాక్ నిర్వహణ')}
        description={t('Review, prioritise and respond to feedback submitted by officers and users.', 'అధికారులు మరియు వినియోగదారులు సమర్పించిన ఫీడ్‌బ్యాక్‌ను సమీక్షించండి, ప్రాధాన్యత ఇవ్వండి మరియు ప్రతిస్పందించండి.')}
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={tickets.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            {t('Export Excel', 'ఎక్సెల్ ఎగుమతి')}
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Inbox} label={t('Total Feedback', 'మొత్తం ఫీడ్‌బ్యాక్')} value={stats?.total ?? 0} tone="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" style={{ animationDelay: '0ms' }} />
        <StatCard icon={Sparkles} label={t('New', 'కొత్తవి')} value={stats?.submitted ?? 0} tone="bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300" style={{ animationDelay: '60ms' }} />
        <StatCard icon={AlertTriangle} label={t('Pending Review', 'సమీక్ష పెండింగ్')} value={stats?.underReview ?? 0} tone="bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300" style={{ animationDelay: '120ms' }} />
        <StatCard icon={ListChecks} label={t('In Progress', 'పురోగతిలో ఉంది')} value={stats?.inProgress ?? 0} tone="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300" style={{ animationDelay: '180ms' }} />
        <StatCard icon={Lightbulb} label={t('Feature Requests', 'ఫీచర్ అభ్యర్థనలు')} value={stats?.featureRequests ?? 0} tone="bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300" style={{ animationDelay: '240ms' }} />
        <StatCard icon={CheckCircle2} label={t('Resolved', 'పరిష్కరించబడింది')} value={stats?.resolved ?? 0} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Filters */}
      <div className="portal-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-10`}
            placeholder={t('Search ticket ID, subject or officer…', 'టికెట్ ఐడీ, విషయం లేదా అధికారి పేరు వెతకండి…')}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
          <option value="all">{t('All statuses', 'అన్ని స్థితులు')}</option>
          {FEEDBACK_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{t(s.label, s.label)}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputCls}>
          <option value="all">{t('All categories', 'అన్ని వర్గాలు')}</option>
          {FEEDBACK_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{t(c.label, c.label)}</option>
          ))}
        </select>
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className={inputCls}>
          <option value="all">{t('All modules', 'అన్ని మాడ్యూల్‌లు')}</option>
          {moduleOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="portal-card flex items-center justify-center gap-3 p-12">
          <Spinner size="lg" className="text-emerald-700" />
          <span className="text-sm font-bold text-slate-500">{t('Loading feedback…', 'ఫీడ్‌బ్యాక్ లోడ్ అవుతోంది…')}</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="portal-card flex flex-col items-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('No feedback matches the current filters.', 'ప్రస్తుత ఫిల్టర్లకు సరిపోలే ఫీడ్‌బ్యాక్ లేదు.')}</p>
        </div>
      ) : (
        <div className="portal-card overflow-hidden">
          <div className="hidden grid-cols-[110px_1fr_140px_120px_120px_150px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 lg:grid">
            <span>{t('Ticket', 'టికెట్')}</span>
            <span>{t('Subject / Submitter', 'విషయం / సమర్పించినవారు')}</span>
            <span>{t('Category', 'వర్గం')}</span>
            <span>{t('Priority', 'ప్రాధాన్యత')}</span>
            <span>{t('Status', 'స్థితి')}</span>
            <span>{t('Date', 'తేదీ')}</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((ticket) => {
              const cat = feedbackCategoryMeta(ticket.category);
              const CatIcon = CATEGORY_ICONS[cat.id as FeedbackCategory] ?? MessageSquareReply;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => void openDetail(ticket)}
                  className="grid w-full grid-cols-1 gap-2 px-4 py-3.5 text-left transition hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 lg:grid-cols-[110px_1fr_140px_120px_120px_150px] lg:items-center lg:gap-3"
                >
                  <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-300">
                    {ticket.ticket_number ?? '—'}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-black text-slate-900 dark:text-white">{ticket.subject}</span>
                      {ticket.duplicate_of && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-800" title="Linked as duplicate">
                          <Link2 className="h-3 w-3" /> dup
                        </span>
                      )}
                      {ticket.category === 'feature_request' && ticket.vote_count > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-black text-amber-700 ring-1 ring-gold-200 dark:bg-gold-900/40 dark:text-gold-300 dark:ring-gold-700">
                          ▲ {ticket.vote_count}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {ticket.submitter_name || 'Unknown'}
                      {ticket.submitter_designation ? ` · ${ticket.submitter_designation}` : ''}
                      {ticket.module ? ` · ${ticket.module}` : ''}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <CatIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <span><PriorityBadge priority={ticket.priority} /></span>
                  <span><StatusBadge status={ticket.status} /></span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatDate(ticket.created_at)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {(detailLoading || detail) && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={closeDetail}>
          <div
            className="max-h-[92vh] w-full max-w-3xl animate-pop-in overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !detail ? (
              <div className="flex items-center justify-center gap-3 p-12">
                <Spinner size="lg" className="text-emerald-700" />
                <span className="text-sm font-bold text-slate-500">Loading ticket…</span>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 px-6 pb-5 pt-6 text-white sm:rounded-t-3xl">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/20 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-black text-gold-300">{detail.ticket.ticket_number}</p>
                      <h3 className="mt-1 text-lg font-black tracking-tight">{detail.ticket.subject}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={detail.ticket.status} />
                        <PriorityBadge priority={detail.ticket.priority} />
                        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black ring-1 ring-white/20">
                          {feedbackCategoryMeta(detail.ticket.category).label}
                        </span>
                        {detail.ticket.vote_count > 0 && (
                          <span className="rounded-full bg-gold-400/20 px-2.5 py-1 text-[11px] font-black text-gold-200 ring-1 ring-gold-300/30">
                            {detail.ticket.vote_count} vote{detail.ticket.vote_count === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeDetail}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  {/* Submitter info */}
                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/60 sm:grid-cols-3">
                    {[
                      [t('Name', 'పేరు'), detail.ticket.submitter_name],
                      [t('Designation', 'హోదా'), detail.ticket.submitter_designation],
                      [t('District', 'జిల్లా'), detail.ticket.submitter_district],
                      [t('Mandal', 'మండలం'), detail.ticket.submitter_mandal],
                      [t('Phone', 'ఫోన్'), detail.ticket.submitter_phone],
                      [t('Email', 'ఈమెయిల్'), detail.ticket.submitter_email],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
                        <p className="truncate font-bold text-slate-800 dark:text-slate-100">{value || '—'}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-slate-400">{t('Description', 'వివరణ')}</p>
                    <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                      {detail.ticket.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{t('Submitted', 'సమర్పించబడింది')} {formatDate(detail.ticket.created_at)}</span>
                      {detail.ticket.module && <span>{t('Module:', 'మాడ్యూల్:')} {detail.ticket.module}</span>}
                      {detail.ticket.app_version && <span>{t('App v', 'యాప్ వెర్షన్')} {detail.ticket.app_version}</span>}
                    </div>
                  </div>

                  {detail.attachmentUrl && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-slate-400">{t('Attachment', 'జతపరిచిన పత్రం')}</p>
                      <a
                        href={detail.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                      >
                        <Paperclip className="h-4 w-4" />
                        {t('Open attachment', 'పత్రాన్ని తెరవండి')}
                      </a>
                    </div>
                  )}

                  {/* Admin controls */}
                  <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">{t('Status', 'స్థితి')}</label>
                      <select
                        value={detail.ticket.status}
                        disabled={saving}
                        onChange={(e) => void handleStatusChange(e.target.value as FeedbackStatus)}
                        className={inputCls}
                      >
                        {FEEDBACK_STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id === 'submitted' && t('Submitted', 'సమర్పించబడింది')}
                            {s.id === 'under_review' && t('Under Review', 'పరిశీలనలో ఉంది')}
                            {s.id === 'in_progress' && t('In Progress', 'పురోగతిలో ఉంది')}
                            {s.id === 'planned' && t('Planned', 'ప్రణాళిక చేయబడింది')}
                            {s.id === 'resolved' && t('Resolved', 'పరిష్కరించబడింది')}
                            {s.id === 'rejected' && t('Rejected', 'తిరస్కరించబడింది')}
                            {s.id === 'closed' && t('Closed', 'మూసివేయబడింది')}
                            {s.id === 'implemented' && t('Added to AGRONIX', 'AGRONIX కి జోడించబడింది')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">{t('Priority', 'ప్రాధాన్యత')}</label>
                      <select
                        value={detail.ticket.priority}
                        disabled={saving}
                        onChange={(e) => void handlePriorityChange(e.target.value as FeedbackPriority)}
                        className={inputCls}
                      >
                        {FEEDBACK_PRIORITIES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id === 'low' && t('Low', 'తక్కువ')}
                            {p.id === 'normal' && t('Normal', 'సాధారణ')}
                            {p.id === 'high' && t('High', 'ఎక్కువ')}
                            {p.id === 'urgent' && t('Urgent', 'అత్యవసరం')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">{t('Assign to', 'బాధ్యత అప్పగించండి')}</label>
                      <select
                        value={detail.ticket.assigned_to ?? ''}
                        disabled={saving}
                        onChange={(e) => void handleAssign(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">{t('Unassigned', 'అప్పగించలేదు')}</option>
                        {assignees.map((a) => (
                          <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                        {detail.ticket.duplicate_of ? <Unlink className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                        {t('Duplicate of', 'నకలు')}
                      </label>
                      <select
                        value={detail.ticket.duplicate_of ?? ''}
                        disabled={saving}
                        onChange={(e) => void handleDuplicateChange(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">{t('Not a duplicate', 'నకలు కాదు')}</option>
                        {ticketOptions
                          .filter((o) => o.id !== detail.ticket.id)
                          .map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.ticket_number ?? '—'} · {o.subject.length > 40 ? `${o.subject.slice(0, 40)}…` : o.subject}
                            </option>
                          ))}
                      </select>
                      {detail.ticket.duplicate_of && (
                        <p className="mt-1 text-[10px] font-bold text-violet-600 dark:text-violet-300">
                          {t('Linked:', 'లింక్ చేయబడింది:')}{' '}
                          {(() => {
                            const canon = ticketOptions.find((o) => o.id === detail.ticket.duplicate_of);
                            return canon ? `${canon.ticket_number ?? '—'} · ${canon.subject}` : t('another ticket', 'మరొక టికెట్');
                          })()}
                        </p>
                      )}
                    </div>
                    {detail.ticket.category === 'feature_request' && detail.ticket.status !== 'implemented' && (
                      <div className="sm:col-span-2 lg:col-span-4">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleStatusChange('implemented')}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 px-4 py-2.5 text-sm font-black text-emerald-950 shadow-md transition hover:from-gold-300 hover:to-amber-400 disabled:opacity-60"
                        >
                          <Sparkles className="h-4 w-4" />
                          {t('Mark as Added to AGRONIX', 'AGRONIX కి జోడించినట్లు గుర్తించండి')}
                        </button>
                      </div>
                    )}
                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={saving || deleting}
                        onClick={() => void handleDelete()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800/60 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {t('Delete ticket', 'టికెట్‌ను తొలగించండి')}
                      </button>
                    </div>
                  </div>

                  {/* Responses */}
                  <div>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
                      {t('Responses', 'సమాధానాలు')} {detail.responses.length > 0 && `(${detail.responses.length})`}
                    </p>
                    {detail.responses.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {detail.responses.map((r) => (
                          <div key={r.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                            <div className="flex items-center justify-between gap-2">
                              <p className="flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-200">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {r.responder_name || t('Administrator', 'నిర్వాహకుడు')}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-400">{formatDate(r.created_at)}</p>
                            </div>
                            <p className="mt-1.5 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={2}
                        className={`${inputCls} flex-1 resize-none`}
                        placeholder={t('Write an official response to the user…', 'వినియోగదారునికి అధికారిక సమాధానం రాయండి…')}
                        maxLength={3000}
                      />
                      <button
                        type="button"
                        onClick={() => void handleSendResponse()}
                        disabled={sendingResponse || !responseText.trim()}
                        className="flex h-auto w-12 shrink-0 items-center justify-center self-stretch rounded-xl bg-emerald-700 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={t('Send response', 'సమాధానం పంపండి')}
                      >
                        {sendingResponse ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Activity timeline */}
                  {detail.activity.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">{t('Activity', 'కార్యాచరణ')}</p>
                      <ol className="space-y-2 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                        {detail.activity.map((a) => (
                          <li key={a.id} className="relative">
                            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {a.action === 'submitted' && t('Feedback submitted', 'అభిప్రాయం సమర్పించబడింది')}
                              {a.action === 'status_changed' && t('Status updated', 'స్థితి నవీకరించబడింది')}
                              {a.action === 'assigned' && t('Assignment updated', 'బాధ్యత నవీకరించబడింది')}
                              {a.action === 'response_added' && t('Response added', 'సమాధానం జోడించబడింది')}
                              {a.action === 'resolved' && t('Marked resolved', 'పరిష్కరించినట్లు గుర్తించబడింది')}
                              {!['submitted', 'status_changed', 'assigned', 'response_added', 'resolved'].includes(a.action) && a.action}
                            </p>
                            {a.details && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{a.details}</p>}
                            <p className="text-[11px] font-semibold text-slate-400">{formatDate(a.created_at)}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {confirmDialog}
    </div>
  );
}

export default FeedbackAdmin;
