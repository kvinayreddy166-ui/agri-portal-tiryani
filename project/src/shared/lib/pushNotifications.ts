import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? '';

const db = () => (supabase as unknown as { from: (table: string) => any }).from.bind(supabase);

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

export function getPushPermissionState(): PushPermissionState {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PushPermissionState;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getPushRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  // Fallback: register the SW ourselves if the app hasn't yet (rare).
  try {
    return await navigator.serviceWorker.register('/service-worker.js');
  } catch {
    return null;
  }
}

async function saveSubscription(userId: string, subscription: PushSubscription): Promise<boolean> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

  const payload = {
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
    last_seen_at: new Date().toISOString(),
  };

  const { error } = await db()('push_subscriptions')
    .upsert(payload, { onConflict: 'endpoint' });

  return !error;
}

async function removeSubscriptionRow(endpoint: string): Promise<void> {
  await db()('push_subscriptions').delete().eq('endpoint', endpoint);
}

// Concurrent sync calls (StrictMode double-mount, multiple NotificationBell
// instances) must share one in-flight subscribe — parallel pushManager.subscribe()
// calls each mint a NEW endpoint, which is how duplicate push_subscriptions rows
// pile up and users get the same alert once per stale endpoint.
let syncInFlight: Promise<boolean> | null = null;

async function syncPushSubscriptionInner(userId: string): Promise<boolean> {
  if (getPushPermissionState() !== 'granted' || !VAPID_PUBLIC_KEY) return false;

  try {
    const registration = await getPushRegistration();
    if (!registration) return false;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    return await saveSubscription(userId, subscription);
  } catch {
    // Push is best-effort — never break the app for it.
    return false;
  }
}

/**
 * Ensures the current browser has an active push subscription for the user.
 * Safe to call on every login/session restore — it is idempotent and cheap
 * (reuses the existing subscription when present). Returns true when this
 * device holds a subscription row in push_subscriptions.
 */
export function syncPushSubscription(userId: string): Promise<boolean> {
  if (!syncInFlight) {
    syncInFlight = syncPushSubscriptionInner(userId).finally(() => {
      syncInFlight = null;
    });
  }
  return syncInFlight;
}

/**
 * Requests notification permission and subscribes to Web Push.
 * Returns true only when the device is actually subscribed AND saved.
 */
export async function enablePushNotifications(userId: string): Promise<boolean> {
  if (getPushPermissionState() === 'unsupported' || !VAPID_PUBLIC_KEY) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    return await syncPushSubscription(userId);
  } catch {
    return false;
  }
}

/**
 * Unsubscribes this device and removes its row from push_subscriptions.
 */
export async function disablePushNotifications(): Promise<void> {
  try {
    const registration = await getPushRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe().catch(() => {});
      await removeSubscriptionRow(endpoint);
    }
  } catch {
    // best-effort cleanup
  }
}

/**
 * Checks whether this device currently holds an active push subscription.
 */
export async function hasActivePushSubscription(): Promise<boolean> {
  try {
    const registration = await getPushRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}

export { VAPID_PUBLIC_KEY };
export default {
  getPushPermissionState,
  syncPushSubscription,
  enablePushNotifications,
  disablePushNotifications,
  hasActivePushSubscription,
};
