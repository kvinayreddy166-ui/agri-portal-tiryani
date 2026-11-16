import { supabase } from './supabase';
import { APP_BUILD_LABEL } from './appVersion';

type ErrorSource =
  | 'error-boundary'
  | 'window-error'
  | 'unhandled-rejection'
  | 'manual';

interface ClientErrorInput {
  source: ErrorSource;
  error?: unknown;
  message?: string;
  stack?: string;
  componentStack?: string;
  level?: 'error' | 'warning';
  extra?: Record<string, unknown>;
}

const MAX_SESSION_ERRORS = 25;
const MIN_SEND_INTERVAL_MS = 500;
const FLUSH_DELAY_MS = 1500;

let sessionCount = 0;
let installed = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lastSentAt = 0;
let currentUserId: string | null = null;
const seenKeys = new Set<string>();
const pending: Record<string, unknown>[] = [];

const truncate = (value: unknown, max: number): string | null => {
  if (value == null) return null;
  const text = value instanceof Error ? value.message : String(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const errorStack = (error: unknown): string | null => {
  if (error instanceof Error && error.stack) return truncate(error.stack, 8000);
  return null;
};

const sanitizeExtra = (extra?: Record<string, unknown>): Record<string, unknown> | null => {
  if (!extra) return null;
  try {
    const json = JSON.stringify(extra);
    if (json.length > 4000) return { truncated: true };
    return extra;
  } catch {
    return { truncated: true };
  }
};

const errorMessage = (error: unknown, fallback?: string): string => {
  if (error instanceof Error && error.message) return truncate(error.message, 1000) || 'Unknown error';
  const text = truncate(error ?? fallback, 1000);
  return text || 'Unknown error';
};

// Untyped table access — client_errors is new and not yet in generated types.
const clientErrorsTable = () =>
  (
    supabase as unknown as {
      from: (table: string) => {
        insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => Promise<{ error: { message?: string } | null }>;
      };
    }
  ).from('client_errors');

const flush = async () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pending.length === 0) return;
  const wait = Math.max(0, MIN_SEND_INTERVAL_MS - (Date.now() - lastSentAt));
  if (wait > 0) {
    flushTimer = setTimeout(() => void flush(), wait);
    return;
  }
  const batch = pending.splice(0, pending.length);
  lastSentAt = Date.now();
  try {
    await clientErrorsTable().insert(batch);
  } catch {
    // Error reporting must never break the app.
  }
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => void flush(), FLUSH_DELAY_MS);
};

/** Report a client-side error to the Supabase `client_errors` drain. Fire-and-forget. */
export function logClientError(input: ClientErrorInput): void {
  try {
    if (import.meta.env.MODE === 'test') return;
    if (sessionCount >= MAX_SESSION_ERRORS) return;

    const message = errorMessage(input.error, input.message);
    const dedupeKey = `${input.source}|${message}`;
    if (seenKeys.has(dedupeKey)) return;
    seenKeys.add(dedupeKey);
    if (seenKeys.size > 200) seenKeys.clear();

    sessionCount += 1;
    pending.push({
      source: input.source,
      level: input.level ?? 'error',
      message,
      stack: input.stack ?? errorStack(input.error),
      component_stack: truncate(input.componentStack, 4000),
      url: truncate(window.location.href, 1000),
      user_agent: truncate(navigator.userAgent, 500),
      user_id: currentUserId,
      app_version: APP_BUILD_LABEL,
      extra: sanitizeExtra(input.extra),
    });
    scheduleFlush();
  } catch {
    // Never let error reporting throw.
  }
}

/** Install global window error + unhandled rejection handlers. Call once at startup. */
export function installGlobalErrorHandlers(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  try {
    supabase.auth.onAuthStateChange((_event, session) => {
      currentUserId = session?.user?.id ?? null;
    });
    void supabase.auth.getSession().then(({ data }) => {
      currentUserId = data.session?.user?.id ?? null;
    });
  } catch {
    // Auth tracking is best-effort.
  }

  window.addEventListener('error', (event) => {
    logClientError({
      source: 'window-error',
      message: event.message || 'Window error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logClientError({
      source: 'unhandled-rejection',
      error: reason,
      message: reason instanceof Error ? undefined : String(reason ?? 'Unhandled promise rejection'),
    });
  });
}
