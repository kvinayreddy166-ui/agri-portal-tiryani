import { supabase } from './supabase';

// The security RPCs are added by migration 20261240000000_security_framework.sql.
// database.generated.ts is regenerated from the live schema; until then the
// typed client does not know these function names, so we call rpc() loosely.
type LooseRpc = (
  fn: string,
  args: Record<string, unknown>
) => Promise<{ data: unknown; error: { message: string } | null }>;
const looseRpc = supabase.rpc.bind(supabase) as unknown as LooseRpc;

/**
 * Centralized client-side security audit logging.
 * All calls are fire-and-forget: they never throw and never block UX.
 * Rows land in public.security_audit_logs via the log_security_event RPC
 * (server timestamp + IP captured server-side when available).
 */

export type SecurityAuditModule =
  | 'auth'
  | 'documents'
  | 'statutory_orders'
  | 'inspections'
  | 'samples'
  | 'enforcement_cases'
  | 'dealers'
  | 'dealer_stock'
  | 'stock_inventory'
  | 'officer_profiles'
  | 'other';

export interface SecurityAuditEvent {
  module: SecurityAuditModule | string;
  action: string;
  recordId?: string | null;
  recordLabel?: string | null;
  actorEmail?: string | null;
  details?: Record<string, unknown>;
}

export async function logSecurityEvent(event: SecurityAuditEvent): Promise<void> {
  try {
    await looseRpc('log_security_event', {
      p_module: event.module,
      p_action: event.action,
      p_record_id: event.recordId ?? null,
      p_record_label: event.recordLabel ?? null,
      p_details: event.details ?? {},
      p_actor_email: event.actorEmail ?? null,
    });
  } catch {
    // Audit logging must never break the user-facing flow.
  }
}

export interface LoginThrottleResult {
  allowed: boolean;
  retryAfterSeconds: number;
  failures: number;
}

/**
 * Pre-login throttle check backed by public.login_attempts.
 * Fails OPEN if the migration/RPC is not yet deployed so logins never break.
 */
export async function checkLoginThrottle(identifier: string): Promise<LoginThrottleResult> {
  try {
    const { data, error } = await looseRpc('check_login_throttle', {
      p_identifier: identifier,
    });
    if (error || !data) return { allowed: true, retryAfterSeconds: 0, failures: 0 };
    const row = Array.isArray(data) ? data[0] : data;
    const payload = typeof row === 'string' ? JSON.parse(row) : row;
    return {
      allowed: payload?.allowed !== false,
      retryAfterSeconds: Number(payload?.retry_after_seconds ?? 0) || 0,
      failures: Number(payload?.failures ?? 0) || 0,
    };
  } catch {
    return { allowed: true, retryAfterSeconds: 0, failures: 0 };
  }
}

/** Records a login attempt outcome. Fire-and-forget safe. */
export async function recordLoginAttempt(identifier: string, success: boolean): Promise<void> {
  try {
    await looseRpc('record_login_attempt', {
      p_identifier: identifier,
      p_success: success,
    });
  } catch {
    // ignore — throttle is best-effort until migration is applied
  }
}
