import { supabase } from '../../../shared/lib/supabase';
import { APP_VERSION } from '../../../shared/lib/appVersion';
import { downloadCsv } from '../../../shared/utils/csvExport';
import {
  FEEDBACK_ATTACHMENT_BUCKET,
  FEEDBACK_MAX_FILE_SIZE,
  type AdminFeedbackFilters,
  type AppNotification,
  type FeedbackActivity,
  type FeedbackDetail,
  type FeedbackResponse,
  type FeedbackStatus,
  type FeedbackTicket,
  type SubmitFeedbackInput,
} from '../types';

// The feedback tables are new and not yet in the generated Database types —
// use an untyped handle (same pattern as client_errors in errorDrain.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as unknown as { from: (table: string) => any }).from.bind(supabase);

const TERMINAL_STATUSES: FeedbackStatus[] = ['resolved', 'rejected', 'closed', 'implemented'];

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: `${window.screen?.width}x${window.screen?.height}`,
    online: navigator.onLine,
    appVersion: APP_VERSION,
    capturedAt: new Date().toISOString(),
  };
}

async function uploadAttachment(file: File, userId: string): Promise<string> {
  if (file.size > FEEDBACK_MAX_FILE_SIZE) {
    throw new Error('Attachment is too large. Maximum size is 5 MB.');
  }
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `tickets/${userId}/${Date.now()}_${cleanName}`;
  const { error } = await supabase.storage
    .from(FEEDBACK_ATTACHMENT_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message || 'Failed to upload attachment.');
  return path;
}

export async function submitFeedback(input: SubmitFeedbackInput) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error('You must be signed in to submit feedback.');

  let attachmentPath: string | null = null;
  if (input.file) {
    attachmentPath = await uploadAttachment(input.file, user.id);
  }

  const { data, error } = await db()('feedback')
    .insert({
      user_id: user.id,
      submitter_name: input.submitter.name || null,
      submitter_designation: input.submitter.designation || null,
      submitter_district: input.submitter.district || null,
      submitter_mandal: input.submitter.mandal || null,
      submitter_phone: input.submitter.phone || null,
      submitter_email: input.submitter.email || user.email || null,
      category: input.category,
      subject: input.subject.trim(),
      description: input.description.trim(),
      module: input.module?.trim() || null,
      priority: input.priority || 'normal',
      status: 'submitted',
      attachment_path: attachmentPath,
      app_version: APP_VERSION,
      device_info: getDeviceInfo(),
    })
    .select('id, ticket_number')
    .single();

  if (error) throw new Error(error.message || 'Failed to submit feedback.');
  return data as { id: string; ticket_number: string };
}

export async function listMyFeedback(): Promise<FeedbackTicket[]> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return [];

  const { data, error } = await db()('feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to load your feedback.');
  return (data ?? []) as FeedbackTicket[];
}

export async function getAttachmentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(FEEDBACK_ATTACHMENT_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function getMyFeedbackDetail(feedbackId: string): Promise<FeedbackDetail | null> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const [ticketRes, responsesRes, activityRes] = await Promise.all([
    db()('feedback').select('*').eq('id', feedbackId).eq('user_id', user.id).maybeSingle(),
    db()('feedback_responses').select('*').eq('feedback_id', feedbackId).order('created_at', { ascending: true }),
    db()('feedback_activity').select('*').eq('feedback_id', feedbackId).order('created_at', { ascending: true }),
  ]);

  if (ticketRes.error) throw new Error(ticketRes.error.message || 'Failed to load feedback.');
  const ticket = ticketRes.data as FeedbackTicket | null;
  if (!ticket) return null;

  const attachmentUrl = ticket.attachment_path ? await getAttachmentUrl(ticket.attachment_path) : null;

  return {
    ticket,
    responses: (responsesRes.data ?? []) as FeedbackResponse[],
    activity: (activityRes.data ?? []) as FeedbackActivity[],
    attachmentUrl,
  };
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export async function adminListFeedback(filters: AdminFeedbackFilters = {}): Promise<FeedbackTicket[]> {
  let query = db()('feedback').select('*').order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.category && filters.category !== 'all') query = query.eq('category', filters.category);
  if (filters.module && filters.module !== 'all') query = query.eq('module', filters.module);
  if (filters.search?.trim()) {
    const q = filters.search.trim().replace(/[%_,()]/g, '');
    if (q) {
      query = query.or(
        `ticket_number.ilike.%${q}%,subject.ilike.%${q}%,submitter_name.ilike.%${q}%,submitter_email.ilike.%${q}%`
      );
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message || 'Failed to load feedback.');
  return (data ?? []) as FeedbackTicket[];
}

export async function adminGetFeedbackDetail(feedbackId: string): Promise<FeedbackDetail | null> {
  const [ticketRes, responsesRes, activityRes] = await Promise.all([
    db()('feedback').select('*').eq('id', feedbackId).maybeSingle(),
    db()('feedback_responses').select('*').eq('feedback_id', feedbackId).order('created_at', { ascending: true }),
    db()('feedback_activity').select('*').eq('feedback_id', feedbackId).order('created_at', { ascending: true }),
  ]);

  if (ticketRes.error) throw new Error(ticketRes.error.message || 'Failed to load feedback.');
  const ticket = ticketRes.data as FeedbackTicket | null;
  if (!ticket) return null;

  const attachmentUrl = ticket.attachment_path ? await getAttachmentUrl(ticket.attachment_path) : null;

  return {
    ticket,
    responses: (responsesRes.data ?? []) as FeedbackResponse[],
    activity: (activityRes.data ?? []) as FeedbackActivity[],
    attachmentUrl,
  };
}

export interface FeedbackStats {
  total: number;
  submitted: number;
  underReview: number;
  inProgress: number;
  featureRequests: number;
  resolved: number;
}

export async function adminGetStats(): Promise<FeedbackStats> {
  const { data, error } = await db()('feedback').select('status, category');
  if (error) throw new Error(error.message || 'Failed to load feedback stats.');

  const rows = (data ?? []) as Array<Pick<FeedbackTicket, 'status' | 'category'>>;
  return {
    total: rows.length,
    submitted: rows.filter((r) => r.status === 'submitted').length,
    underReview: rows.filter((r) => r.status === 'under_review' || r.status === 'in_progress').length,
    inProgress: rows.filter((r) => r.status === 'in_progress').length,
    featureRequests: rows.filter((r) => r.category === 'feature_request').length,
    resolved: rows.filter((r) => TERMINAL_STATUSES.includes(r.status)).length,
  };
}

export async function adminUpdateTicket(
  feedbackId: string,
  patch: { status?: FeedbackStatus; priority?: string; assigned_to?: string | null; assigned_label?: string | null }
) {
  const update: Record<string, unknown> = { ...patch };
  if (patch.status) {
    update.resolved_at = TERMINAL_STATUSES.includes(patch.status) ? new Date().toISOString() : null;
  }
  const { error } = await db()('feedback').update(update).eq('id', feedbackId);
  if (error) throw new Error(error.message || 'Failed to update feedback.');
}

export async function adminAddResponse(feedbackId: string, message: string, responder: { id: string; name: string }) {
  const { error } = await db()('feedback_responses').insert({
    feedback_id: feedbackId,
    responder_id: responder.id,
    responder_name: responder.name || 'Administrator',
    message: message.trim(),
    is_official: true,
  });
  if (error) throw new Error(error.message || 'Failed to add response.');
}

export interface AssigneeOption {
  id: string;
  label: string;
}

export async function adminListAssignees(): Promise<AssigneeOption[]> {
  const { data, error } = await supabase
    .from('officer_profiles')
    .select('id, full_name, designation')
    .order('full_name', { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => {
    const r = row as { id: string; full_name: string | null; designation: string | null };
    return {
      id: r.id,
      label: [r.full_name, r.designation].filter(Boolean).join(' — ') || r.id,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Votes & public roadmap                                             */
/* ------------------------------------------------------------------ */

export interface FeatureRequestBoard {
  tickets: FeedbackTicket[];
  votedIds: Set<string>;
}

/** All feature-request tickets visible to authenticated users (roadmap). */
export async function listFeatureRequests(): Promise<FeatureRequestBoard> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const { data, error } = await db()('feedback')
    .select('*')
    .eq('category', 'feature_request')
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Failed to load suggestions.');

  const tickets = (data ?? []) as FeedbackTicket[];
  let votedIds = new Set<string>();
  if (user && tickets.length > 0) {
    const { data: votes } = await db()('feedback_votes')
      .select('feedback_id')
      .eq('user_id', user.id)
      .in('feedback_id', tickets.map((t) => t.id));
    votedIds = new Set(((votes ?? []) as Array<{ feedback_id: string }>).map((v) => v.feedback_id));
  }
  return { tickets, votedIds };
}

export async function toggleVote(feedbackId: string): Promise<boolean> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error('Sign in to vote.');

  const { data: existing } = await db()('feedback_votes')
    .select('id')
    .eq('feedback_id', feedbackId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await db()('feedback_votes').delete().eq('id', (existing as { id: string }).id);
    if (error) throw new Error(error.message || 'Failed to remove vote.');
    return false;
  }

  const { error } = await db()('feedback_votes').insert({ feedback_id: feedbackId, user_id: user.id });
  if (error) throw new Error(error.message || 'Failed to vote.');
  return true;
}

/* ------------------------------------------------------------------ */
/* Notifications                                                      */
/* ------------------------------------------------------------------ */

export async function listNotifications(limit = 30): Promise<AppNotification[]> {
  const { data, error } = await db()('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as AppNotification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { count, error } = await db()('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  await db()('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);
}

export async function markAllNotificationsRead() {
  await db()('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);
}

/** Deletes every notification owned by the given user (RLS-scoped). */
export async function clearAllNotifications(userId: string) {
  await db()('notifications').delete().eq('user_id', userId);
}

export interface NotificationRecipient {
  id: string;
  name: string;
  designation: string | null;
  district: string | null;
  status: string | null;
}

/** All officer profiles (active + suspended) for admin notification targeting. */
export async function adminListNotificationRecipients(): Promise<NotificationRecipient[]> {
  const { data, error } = await supabase
    .from('officer_profiles')
    .select('id, full_name, designation, district, status')
    .order('full_name', { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => {
    const r = row as { id: string; full_name: string | null; designation: string | null; district: string | null; status: string | null };
    return {
      id: r.id,
      name: r.full_name || 'Officer',
      designation: r.designation,
      district: r.district,
      status: r.status,
    };
  });
}

/** Admin broadcast: insert one notification row per recipient (chunked). */
export async function adminSendNotifications(
  userIds: string[],
  payload: { title: string; message?: string; link?: string; type?: string }
): Promise<number> {
  const rows = userIds.map((user_id) => ({
    user_id,
    type: payload.type || 'admin_message',
    title: payload.title.trim(),
    message: payload.message?.trim() || null,
    link: payload.link?.trim() || null,
  }));
  if (rows.length === 0) return 0;

  // Supabase insert payloads are safest in moderate chunks.
  const CHUNK = 200;
  let sent = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await db()('notifications').insert(chunk);
    if (error) throw new Error(error.message || 'Failed to send notifications.');
    sent += chunk.length;
  }

  // Web Push fan-out is handled by the notifications_dispatch_push_trigger
  // (DB -> push-notify Edge Function), so no client-side call is needed here.
  return sent;
}

/* ------------------------------------------------------------------ */
/* Admin — duplicate linking                                          */
/* ------------------------------------------------------------------ */

export async function adminSetDuplicate(feedbackId: string, duplicateOfId: string | null) {
  const { error } = await db()('feedback')
    .update({ duplicate_of: duplicateOfId })
    .eq('id', feedbackId);
  if (error) throw new Error(error.message || 'Failed to link duplicate.');
}

export async function adminListTicketOptions(): Promise<Array<{ id: string; ticket_number: string | null; subject: string }>> {
  const { data, error } = await db()('feedback')
    .select('id, ticket_number, subject')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []) as Array<{ id: string; ticket_number: string | null; subject: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  improvement: 'Improvement',
  content_correction: 'Content Correction',
  ui_ux: 'UI/UX Feedback',
  account_login: 'Account & Login',
  general_query: 'General Query',
  appreciation: 'Appreciation',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  planned: 'Planned',
  resolved: 'Resolved',
  rejected: 'Rejected',
  closed: 'Closed',
  implemented: 'Added to AGRONIX',
};

export function exportFeedbackCsv(tickets: FeedbackTicket[]) {
  const headers = [
    'Ticket',
    'Date',
    'Submitter',
    'Designation',
    'District',
    'Mandal',
    'Email',
    'Category',
    'Subject',
    'Module',
    'Priority',
    'Status',
    'Assigned To',
    'Description',
  ];
  const rows = tickets.map((t) => [
    t.ticket_number ?? '',
    t.created_at ? new Date(t.created_at).toLocaleString('en-IN') : '',
    t.submitter_name ?? '',
    t.submitter_designation ?? '',
    t.submitter_district ?? '',
    t.submitter_mandal ?? '',
    t.submitter_email ?? '',
    CATEGORY_LABELS[t.category] ?? t.category,
    t.subject,
    t.module ?? '',
    t.priority,
    STATUS_LABELS[t.status] ?? t.status,
    t.assigned_label ?? '',
    t.description,
  ]);
  downloadCsv(`agronix-feedback-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}
