export type FeedbackCategory =
  | 'bug_report'
  | 'feature_request'
  | 'improvement'
  | 'content_correction'
  | 'ui_ux'
  | 'account_login'
  | 'general_query'
  | 'appreciation';

export type FeedbackStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'planned'
  | 'resolved'
  | 'rejected'
  | 'closed'
  | 'implemented';

export type FeedbackPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface FeedbackTicket {
  id: string;
  ticket_number: string | null;
  user_id: string;
  submitter_name: string | null;
  submitter_designation: string | null;
  submitter_district: string | null;
  submitter_mandal: string | null;
  submitter_phone: string | null;
  submitter_email: string | null;
  category: FeedbackCategory;
  subject: string;
  description: string;
  module: string | null;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  attachment_path: string | null;
  app_version: string | null;
  device_info: Record<string, unknown> | null;
  assigned_to: string | null;
  assigned_label: string | null;
  duplicate_of: string | null;
  vote_count: number;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackResponse {
  id: string;
  feedback_id: string;
  responder_id: string | null;
  responder_name: string | null;
  message: string;
  is_official: boolean;
  created_at: string;
}

export interface FeedbackActivity {
  id: string;
  feedback_id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  details: string | null;
  created_at: string;
}

export interface FeedbackDetail {
  ticket: FeedbackTicket;
  responses: FeedbackResponse[];
  activity: FeedbackActivity[];
  attachmentUrl: string | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface SubmitFeedbackInput {
  category: FeedbackCategory;
  subject: string;
  description: string;
  module?: string;
  priority?: FeedbackPriority;
  file?: File | null;
  submitter: {
    name: string;
    designation: string;
    district: string;
    mandal: string;
    phone: string;
    email: string;
  };
}

export interface AdminFeedbackFilters {
  status?: string;
  category?: string;
  module?: string;
  search?: string;
}

export const FEEDBACK_ATTACHMENT_BUCKET = 'feedback-attachments';
export const FEEDBACK_MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface FeedbackCategoryMeta {
  id: FeedbackCategory;
  label: string;
  description: string;
}

export const FEEDBACK_CATEGORIES: FeedbackCategoryMeta[] = [
  { id: 'bug_report', label: 'Bug Report', description: 'Errors or malfunctioning features' },
  { id: 'feature_request', label: 'Feature Request', description: 'Suggest a new feature' },
  { id: 'improvement', label: 'Improvement', description: 'Improve an existing module' },
  { id: 'content_correction', label: 'Content Correction', description: 'Incorrect agricultural information' },
  { id: 'ui_ux', label: 'UI/UX Feedback', description: 'Design and usability suggestions' },
  { id: 'account_login', label: 'Account & Login', description: 'OTP, registration or login problems' },
  { id: 'general_query', label: 'General Query', description: 'Other questions or feedback' },
  { id: 'appreciation', label: 'Appreciation', description: 'Appreciate a useful feature' },
];

export interface FeedbackStatusMeta {
  id: FeedbackStatus;
  label: string;
  badgeClass: string;
}

export const FEEDBACK_STATUSES: FeedbackStatusMeta[] = [
  { id: 'submitted', label: 'Submitted', badgeClass: 'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800' },
  { id: 'under_review', label: 'Under Review', badgeClass: 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800' },
  { id: 'in_progress', label: 'In Progress', badgeClass: 'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800' },
  { id: 'planned', label: 'Planned', badgeClass: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-800' },
  { id: 'resolved', label: 'Resolved', badgeClass: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800' },
  { id: 'rejected', label: 'Rejected', badgeClass: 'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800' },
  { id: 'closed', label: 'Closed', badgeClass: 'bg-slate-200 text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700' },
  { id: 'implemented', label: 'Added to AGRONIX', badgeClass: 'bg-gradient-to-r from-gold-200 to-amber-200 text-amber-800 ring-amber-300 dark:from-gold-900/60 dark:to-amber-900/60 dark:text-gold-300 dark:ring-amber-700' },
];

export const FEEDBACK_PRIORITIES: Array<{ id: FeedbackPriority; label: string }> = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

export function feedbackStatusMeta(status: string): FeedbackStatusMeta {
  return FEEDBACK_STATUSES.find((s) => s.id === status) ?? FEEDBACK_STATUSES[0];
}

export function feedbackCategoryMeta(category: string): FeedbackCategoryMeta {
  return FEEDBACK_CATEGORIES.find((c) => c.id === category) ?? FEEDBACK_CATEGORIES[FEEDBACK_CATEGORIES.length - 1];
}
