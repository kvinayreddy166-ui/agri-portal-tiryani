import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Bug,
  Calendar,
  CheckCircle2,
  ChevronUp,
  Clock,
  FileText,
  Hammer,
  Heart,
  HelpCircle,
  ImagePlus,
  KeyRound,
  Lightbulb,
  Loader2,
  Map,
  MessageSquarePlus,
  Palette,
  Paperclip,
  Rocket,
  Send,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { useBackButtonOverlay } from '../../../shared/hooks/useBackButtonOverlay';
import { MODULE_MENU_ITEMS } from '../../../shared/data/modules';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_MAX_FILE_SIZE,
  FEEDBACK_PRIORITIES,
  feedbackCategoryMeta,
  feedbackStatusMeta,
  type FeedbackCategory,
  type FeedbackDetail,
  type FeedbackPriority,
  type FeedbackStatus,
  type FeedbackTicket,
} from '../types';
import {
  deleteMyFeedback,
  getMyFeedbackDetail,
  listFeatureRequests,
  listMyFeedback,
  submitFeedback,
  toggleVote,
  type FeatureRequestBoard,
} from '../services/feedbackService';

const CATEGORY_ICONS: Record<FeedbackCategory, React.ComponentType<{ className?: string }>> = {
  bug_report: Bug,
  feature_request: Lightbulb,
  improvement: Wrench,
  content_correction: BookOpen,
  ui_ux: Palette,
  account_login: KeyRound,
  general_query: HelpCircle,
  appreciation: Heart,
};

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-emerald-500/20';

const MODULE_OPTIONS = MODULE_MENU_ITEMS.map((m) => m.label);

function formatDate(iso: string) {
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

function CategoryBadge({ category }: { category: string }) {
  const meta = feedbackCategoryMeta(category);
  const Icon = CATEGORY_ICONS[meta.id as FeedbackCategory] ?? MessageSquarePlus;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export function Feedback() {
  const { user, officerProfile } = useAuth();
  const { toasts, removeToast, showSuccess, showInfo, showWarning, showError } = useToast();
  const toast = { showSuccess, showInfo, showWarning, showError };
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [tab, setTab] = useState<'submit' | 'mine' | 'suggestions'>('submit');
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [board, setBoard] = useState<FeatureRequestBoard | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [loadingMine, setLoadingMine] = useState(false);
  const [detail, setDetail] = useState<FeedbackDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const detailOverlay = useBackButtonOverlay('feedback-detail', () => setDetail(null));

  const [category, setCategory] = useState<FeedbackCategory>('general_query');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [priority, setPriority] = useState<FeedbackPriority>('normal');
  const [file, setFile] = useState<File | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitter = useMemo(
    () => ({
      name: officerProfile?.full_name || (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'User',
      designation: officerProfile?.designation || (user?.user_metadata?.designation as string) || '',
      district: officerProfile?.district || (user?.user_metadata?.district as string) || '',
      mandal: officerProfile?.mandal || (user?.user_metadata?.mandal as string) || '',
      phone: officerProfile?.phone || (user?.user_metadata?.phone as string) || '',
      email: user?.email || officerProfile?.email || '',
    }),
    [officerProfile, user]
  );

  const loadMine = useCallback(async () => {
    setLoadingMine(true);
    try {
      setTickets(await listMyFeedback());
    } catch (err) {
      toastRef.current.showError('Load failed', err instanceof Error ? err.message : 'Could not load your feedback.');
    } finally {
      setLoadingMine(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'mine') void loadMine();
    if (tab === 'suggestions' && !board) {
      setBoardLoading(true);
      void listFeatureRequests()
        .then(setBoard)
        .catch((err) => toastRef.current.showError('Load failed', err instanceof Error ? err.message : 'Could not load suggestions.'))
        .finally(() => setBoardLoading(false));
    }
  }, [tab, loadMine, board]);

  const handleVote = async (ticket: FeedbackTicket) => {
    if (votingId) return;
    setVotingId(ticket.id);
    const wasVoted = board?.votedIds.has(ticket.id) ?? false;
    // Optimistic update
    setBoard((prev) =>
      prev
        ? {
            tickets: prev.tickets.map((t) =>
              t.id === ticket.id ? { ...t, vote_count: t.vote_count + (wasVoted ? -1 : 1) } : t
            ),
            votedIds: new Set(
              wasVoted ? [...prev.votedIds].filter((id) => id !== ticket.id) : [...prev.votedIds, ticket.id]
            ),
          }
        : prev
    );
    try {
      await toggleVote(ticket.id);
    } catch (err) {
      // Revert on failure
      setBoard((prev) =>
        prev
          ? {
              tickets: prev.tickets.map((t) =>
                t.id === ticket.id ? { ...t, vote_count: t.vote_count + (wasVoted ? 1 : -1) } : t
              ),
              votedIds: new Set(
                wasVoted ? [...prev.votedIds, ticket.id] : [...prev.votedIds].filter((id) => id !== ticket.id)
              ),
            }
          : prev
      );
      toast.showError('Vote failed', err instanceof Error ? err.message : 'Could not register your vote.');
    } finally {
      setVotingId(null);
    }
  };

  const openDetail = async (ticket: FeedbackTicket) => {
    detailOverlay.pushOverlay();
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await getMyFeedbackDetail(ticket.id);
      setDetail(d);
    } catch (err) {
      toast.showError('Load failed', err instanceof Error ? err.message : 'Could not load feedback details.');
      detailOverlay.closeOverlay();
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    detailOverlay.closeOverlay();
    setDetail(null);
  };

  const handleDelete = async (ticketId: string) => {
    if (!window.confirm('Delete this feedback permanently? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteMyFeedback(ticketId);
      toastRef.current.showSuccess('Deleted', 'Your feedback was deleted.');
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setBoard((prev) =>
        prev
          ? {
              tickets: prev.tickets.filter((t) => t.id !== ticketId),
              votedIds: new Set([...prev.votedIds].filter((id) => id !== ticketId)),
            }
          : prev
      );
      closeDetail();
    } catch (err) {
      toastRef.current.showError('Delete failed', err instanceof Error ? err.message : 'Could not delete feedback.');
    } finally {
      setDeleting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > FEEDBACK_MAX_FILE_SIZE) {
      toast.showWarning('File too large', 'Attachments must be 5 MB or smaller.');
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.showWarning('Missing details', 'Please enter a subject and description.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitFeedback({
        category,
        subject,
        description,
        module: moduleName.trim() || undefined,
        priority,
        file,
        submitter,
      });
      toast.showSuccess('Feedback submitted', `Ticket ${result.ticket_number} created successfully.`);
      setSubject('');
      setDescription('');
      setModuleName('');
      setPriority('normal');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTab('mine');
    } catch (err) {
      toast.showError('Submit failed', err instanceof Error ? err.message : 'Could not submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = FEEDBACK_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Support"
        title="Feedback & Suggestions"
        description="Report issues, request features or share ideas — track every ticket until it is resolved."
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {(
          [
            { id: 'submit', label: 'New Feedback', icon: MessageSquarePlus },
            { id: 'mine', label: `My Feedback${tickets.length ? ` (${tickets.length})` : ''}`, icon: FileText },
            { id: 'suggestions', label: 'Suggestions', icon: Map },
          ] as const
        ).map((tItem) => (
          <button
            key={tItem.id}
            type="button"
            onClick={() => setTab(tItem.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition active:scale-95 ${
              tab === tItem.id
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <tItem.icon className="h-4 w-4" />
            {tItem.label}
          </button>
        ))}
      </div>

      {tab === 'submit' && (
        <form onSubmit={handleSubmit} className="portal-card space-y-5 p-5 sm:p-6">
          {/* Category picker — compact scrollable chips */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              What is this about? <span className="text-red-500">*</span>
            </p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FEEDBACK_CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.id];
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-black transition active:scale-95 ${
                      active
                        ? 'animate-chip-select border-emerald-500 bg-emerald-700 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? 'text-gold-300' : 'text-slate-400'}`} />
                    {c.label}
                  </button>
                );
              })}
            </div>
            {selectedCategory && (
              <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{selectedCategory.description}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputCls}
              placeholder="e.g. OTP not received on login"
              maxLength={160}
              required
            />
          </div>

          {/* Optional details — collapsed by default to keep the form light */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowOptions((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              aria-expanded={showOptions}
            >
              <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                More options <span className="font-semibold normal-case text-slate-400">(module & priority — optional)</span>
              </span>
              <ChevronUp className={`h-4 w-4 text-slate-400 transition-transform ${showOptions ? '' : 'rotate-180'}`} />
            </button>
            {showOptions && (
              <div className="grid gap-4 border-t border-slate-100 px-4 py-4 sm:grid-cols-2 dark:border-slate-800">
                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400">Module</label>
                  <input
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Farm Calculators"
                    list="feedback-module-options"
                    maxLength={80}
                  />
                  <datalist id="feedback-module-options">
                    {MODULE_OPTIONS.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as FeedbackPriority)} className={inputCls}>
                    {FEEDBACK_PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className={inputCls}
              placeholder="Describe the issue or suggestion in detail. Mention steps to reproduce for bug reports."
              maxLength={5000}
              required
            />
            <p className="mt-1 text-right text-[11px] font-semibold text-slate-400">{description.length}/5000</p>
          </div>

          {/* Attachment */}
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Screenshot / Attachment <span className="font-semibold normal-case text-slate-400">(optional, max 5 MB)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/40">
                <Paperclip className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-emerald-800 dark:text-emerald-200">{file.name}</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">{(file.size / 1024).toFixed(0)} KB</span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                  aria-label="Remove attachment"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm font-bold text-slate-500 transition hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
              >
                <ImagePlus className="h-5 w-5" />
                Tap to attach a screenshot or PDF
              </button>
            )}
          </div>

          {/* Auto-captured info — single line */}
          <p className="text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Submitting as <span className="font-black text-slate-600 dark:text-slate-300">{submitter.name}</span>
            {submitter.designation && <> · {submitter.designation}</>}
            {submitter.district && <> · {submitter.district}</>}
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 py-3.5 font-black text-white shadow-lg shadow-emerald-900/25 transition hover:from-emerald-600 hover:to-emerald-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </form>
      )}

      {tab === 'mine' && (
        <div className="space-y-3">
          {loadingMine ? (
            <div className="portal-card flex items-center justify-center gap-3 p-10">
              <Spinner size="lg" className="text-emerald-700" />
              <span className="text-sm font-bold text-slate-500">Loading your feedback…</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="portal-card flex flex-col items-center gap-3 p-10 text-center">
              <MessageSquarePlus className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No feedback submitted yet.</p>
              <button
                type="button"
                onClick={() => setTab('submit')}
                className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-600"
              >
                Submit your first feedback
              </button>
            </div>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => void openDetail(ticket)}
                className="portal-card flex w-full items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 font-mono text-xs font-black text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800">
                      {ticket.ticket_number ?? '—'}
                    </span>
                    <CategoryBadge category={ticket.category} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="mt-2 truncate text-sm font-black text-slate-900 dark:text-white">{ticket.subject}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(ticket.created_at)}
                    {ticket.module && <span>· {ticket.module}</span>}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
              </button>
            ))
          )}
        </div>
      )}

      {tab === 'suggestions' && (
        <div className="space-y-4">
          <p className="portal-card flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Lightbulb className="h-4 w-4 shrink-0 text-gold-500" />
            Upvote feature ideas from officers — top-voted suggestions get built first.
          </p>

          {boardLoading ? (
            <div className="portal-card flex items-center justify-center gap-3 p-10">
              <Spinner size="lg" className="text-emerald-700" />
              <span className="text-sm font-bold text-slate-500">Loading suggestions…</span>
            </div>
          ) : !board || board.tickets.filter((t) => !t.duplicate_of).length === 0 ? (
            <div className="portal-card flex flex-col items-center gap-3 p-10 text-center">
              <Map className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No suggestions yet — be the first to request a feature!</p>
              <button
                type="button"
                onClick={() => setTab('submit')}
                className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-600"
              >
                Suggest a feature
              </button>
            </div>
          ) : (
            (() => {
              const visible = board.tickets.filter((t) => !t.duplicate_of);
              const columns: Array<{ title: string; hint: string; statuses: FeedbackStatus[]; accent: string; icon: React.ComponentType<{ className?: string }> }> = [
                { title: 'Under Consideration', hint: 'Received & being reviewed', statuses: ['submitted', 'under_review'], accent: 'border-slate-300 dark:border-slate-600', icon: Clock },
                { title: 'Planned', hint: 'Approved for a future release', statuses: ['planned'], accent: 'border-blue-300 dark:border-blue-800', icon: Calendar },
                { title: 'In Development', hint: 'Currently being built', statuses: ['in_progress'], accent: 'border-amber-300 dark:border-amber-800', icon: Hammer },
                { title: 'Released', hint: 'Live in AGRONIX', statuses: ['implemented', 'resolved'], accent: 'border-emerald-300 dark:border-emerald-800', icon: Rocket },
              ];
              const grouped = columns.map((col) => ({
                ...col,
                items: visible.filter((t) => col.statuses.includes(t.status)),
              }));
              const closed = visible.filter((t) => ['rejected', 'closed'].includes(t.status));

              const VoteCard = ({ t, delay = 0 }: { t: FeedbackTicket; delay?: number }) => {
                const voted = board.votedIds.has(t.id);
                return (
                  <div
                    className="animate-card-in rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-emerald-700"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => void handleVote(t)}
                        disabled={votingId === t.id}
                        aria-pressed={voted}
                        aria-label={voted ? 'Remove vote' : 'Upvote suggestion'}
                        className={`group flex shrink-0 flex-col items-center rounded-lg border px-2 py-1.5 transition active:scale-90 disabled:opacity-50 ${
                          voted
                            ? 'animate-vote-pop border-emerald-500 bg-emerald-600 text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300'
                        }`}
                      >
                        {votingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />}
                        <span key={t.vote_count} className="animate-vote-pop text-xs font-black">{t.vote_count}</span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black leading-snug text-slate-900 dark:text-white">{t.subject}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-400">
                          <span className="font-mono">{t.ticket_number}</span>
                          {t.submitter_name && <span>· {t.submitter_name}</span>}
                          {t.module && <span>· {t.module}</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {grouped.map((col, colIndex) => (
                      <div
                        key={col.title}
                        className={`animate-card-in rounded-2xl border-t-4 bg-slate-50/60 p-3 dark:bg-slate-800/30 ${col.accent}`}
                        style={{ animationDelay: `${colIndex * 80}ms` }}
                      >
                        <div className="mb-2 flex items-center gap-2 px-1">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                            <col.icon className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">{col.title}</p>
                            <p className="text-[10px] font-semibold text-slate-400">{col.hint}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {col.items.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] font-bold text-slate-400 dark:border-slate-700">
                              Nothing here yet
                            </p>
                          ) : (
                            col.items.map((t, i) => <VoteCard key={t.id} t={t} delay={colIndex * 80 + 120 + i * 50} />)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {closed.length > 0 && (
                    <div className="portal-card p-4">
                      <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Closed / Not Planned ({closed.length})
                      </p>
                      <div className="space-y-2">
                        {closed.map((t) => (
                          <div key={t.id} className="flex items-center gap-3 opacity-70">
                            <StatusBadge status={t.status} />
                            <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-600 dark:text-slate-300">{t.subject}</p>
                            <span className="shrink-0 text-xs font-black text-slate-400">{t.vote_count} votes</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>
      )}

      {/* Detail modal */}
      {(detailLoading || detail) && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={closeDetail}>
          <div
            className="max-h-[92vh] w-full max-w-2xl animate-pop-in overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
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
                    <div>
                      <p className="font-mono text-xs font-black text-gold-300">{detail.ticket.ticket_number}</p>
                      <h3 className="mt-1 text-lg font-black tracking-tight">{detail.ticket.subject}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <CategoryBadge category={detail.ticket.category} />
                        <StatusBadge status={detail.ticket.status} />
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
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Submitted</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{formatDate(detail.ticket.created_at)}</p>
                    </div>
                    {detail.ticket.module && (
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Module</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{detail.ticket.module}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Priority</p>
                      <p className="font-bold capitalize text-slate-800 dark:text-slate-100">{detail.ticket.priority}</p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-slate-400">Description</p>
                    <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                      {detail.ticket.description}
                    </p>
                  </div>

                  {detail.attachmentUrl && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-slate-400">Attachment</p>
                      <a
                        href={detail.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                      >
                        <Paperclip className="h-4 w-4" />
                        View attachment
                      </a>
                    </div>
                  )}

                  {/* Responses */}
                  <div>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Official Responses {detail.responses.length > 0 && `(${detail.responses.length})`}
                    </p>
                    {detail.responses.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        No responses yet — the team will reply here once your feedback is reviewed.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {detail.responses.map((r) => (
                          <div key={r.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                                {r.responder_name || 'Administrator'}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-400">{formatDate(r.created_at)}</p>
                            </div>
                            <p className="mt-1.5 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Activity timeline */}
                  {detail.activity.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Activity</p>
                      <ol className="space-y-2 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                        {detail.activity.map((a) => (
                          <li key={a.id} className="relative">
                            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {a.action === 'submitted' && 'Feedback submitted'}
                              {a.action === 'status_changed' && 'Status updated'}
                              {a.action === 'assigned' && 'Assignment updated'}
                              {a.action === 'response_added' && 'Response added'}
                              {a.action === 'resolved' && 'Marked resolved'}
                              {!['submitted', 'status_changed', 'assigned', 'response_added', 'resolved'].includes(a.action) && a.action}
                            </p>
                            {a.details && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{a.details}</p>}
                            <p className="text-[11px] font-semibold text-slate-400">{formatDate(a.created_at)}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => void handleDelete(detail.ticket.id)}
                      disabled={deleting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-100 active:scale-[0.98] disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {deleting ? 'Deleting…' : 'Delete this feedback'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Feedback;
