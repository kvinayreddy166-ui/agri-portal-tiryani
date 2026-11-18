// =====================================================================
// push-notify — fan out Web Push notifications to officers (Edge Function)
// =====================================================================
// Admin-only POST { user_ids, title, body?, message?, link?, tag? }.
// Looks up push_subscriptions for the recipients and delivers via VAPID.
// Stale endpoints (404/410 from the push service) are deleted automatically.
//
// Server-to-server path (notifications DB trigger -> pg_net): POST with
// header x-push-notify-secret matching PUSH_NOTIFY_SECRET, body
// { user_id | user_ids, title, message?, link?, tag? }.
//
// Setup:
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:admin@example.com
//   supabase secrets set PUSH_NOTIFY_SECRET=<random long string>
//   supabase functions deploy push-notify
// =====================================================================
import webpush from 'npm:web-push@3.6.7';
import { corsHeaders, createAdminClient, errorResponse, json, verifyUser } from '../_shared/knowledge.ts';

const MAX_RECIPIENTS = 5000;
const SEND_CONCURRENCY = 50;

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchSubscriptions(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<PushSubscriptionRow[]> {
  const rows: PushSubscriptionRow[] = [];
  for (const ids of chunk(userIds, 200)) {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', ids);
    if (error) throw error;
    if (data) rows.push(...(data as PushSubscriptionRow[]));
  }
  return rows;
}

async function sendOne(
  supabase: ReturnType<typeof createAdminClient>,
  sub: PushSubscriptionRow,
  payload: string,
): Promise<'sent' | 'gone' | 'failed'> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      payload,
      { TTL: 3600 },
    );
    return 'sent';
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      return 'gone';
    }
    console.warn('[push-notify] delivery failed:', statusCode ?? (err as Error).message);
    return 'failed';
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('POST only.', 405);

  try {
    const supabase = createAdminClient();

    // Two auth paths:
    //  1. Server-to-server: x-push-notify-secret matches PUSH_NOTIFY_SECRET
    //     (used by the notifications DB trigger via pg_net).
    //  2. Admin user JWT (portal admin manual fan-out).
    const pushSecret = Deno.env.get('PUSH_NOTIFY_SECRET') ?? '';
    const providedSecret = req.headers.get('x-push-notify-secret') ?? '';
    const isServerCall = pushSecret.length > 0 && providedSecret === pushSecret;

    let isAdmin = false;
    if (!isServerCall) {
      const verified = await verifyUser(req, supabase);
      isAdmin = verified.isAdmin;
    }
    if (!isAdmin && !isServerCall) return errorResponse('Admin access required.', 403);

    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@agronix.local';
    if (!vapidPublic || !vapidPrivate) {
      return errorResponse('Web Push is not configured on the server (missing VAPID keys).', 503);
    }
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const body = await req.json().catch(() => null);
    const rawIds = Array.isArray(body?.user_ids)
      ? body.user_ids
      : typeof body?.user_id === 'string'
        ? [body.user_id]
        : [];
    const userIds = [...new Set(rawIds.filter((id: unknown) => typeof id === 'string'))].slice(0, MAX_RECIPIENTS);
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) : '';
    const message = typeof body?.message === 'string'
      ? body.message.trim().slice(0, 300)
      : typeof body?.body === 'string'
        ? body.body.trim().slice(0, 300)
        : '';
    const link = typeof body?.link === 'string' ? body.link.slice(0, 300) : undefined;
    const tag = typeof body?.tag === 'string' ? body.tag.slice(0, 80) : undefined;

    if (userIds.length === 0) return errorResponse('user_ids is required.', 400);
    if (!title) return errorResponse('title is required.', 400);

    const subscriptions = await fetchSubscriptions(supabase, userIds);
    if (subscriptions.length === 0) {
      return json({ ok: true, recipients: userIds.length, subscriptions: 0, sent: 0, removed: 0, failed: 0 });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      message,
      link,
      tag,
    });

    let sent = 0;
    let removed = 0;
    let failed = 0;

    for (const group of chunk(subscriptions, SEND_CONCURRENCY)) {
      const results = await Promise.allSettled(group.map((sub) => sendOne(supabase, sub, payload)));
      for (const result of results) {
        if (result.status !== 'fulfilled') {
          failed += 1;
          continue;
        }
        if (result.value === 'sent') sent += 1;
        else if (result.value === 'gone') removed += 1;
        else failed += 1;
      }
    }

    return json({
      ok: true,
      recipients: userIds.length,
      subscriptions: subscriptions.length,
      sent,
      removed,
      failed,
    });
  } catch (err) {
    console.error('push-notify error:', err);
    return errorResponse((err as Error).message || 'Push fan-out failed.', 500);
  }
});
