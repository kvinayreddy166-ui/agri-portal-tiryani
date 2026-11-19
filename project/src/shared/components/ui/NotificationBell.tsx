import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useBackButtonOverlay } from '../../hooks/useBackButtonOverlay';
import { useIdleAutoClose } from '../../hooks/useIdleAutoClose';
import {
  clearAllNotifications,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../features/feedback/services/feedbackService';
import type { AppNotification } from '../../../features/feedback/types';
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushPermissionState,
  hasActivePushSubscription,
  syncPushSubscription,
  VAPID_PUBLIC_KEY,
} from '../../lib/pushNotifications';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [pushOn, setPushOn] = useState(false);
  const overlay = useBackButtonOverlay('notification-bell', () => setOpen(false));
  const pollRef = useRef<number | null>(null);

  const closeDropdown = useCallback(() => {
    overlay.closeOverlay();
    setOpen(false);
  }, [overlay.closeOverlay]);

  // Auto-close the dropdown after 5s of inactivity inside it.
  const resetIdleTimer = useIdleAutoClose(open, closeDropdown);

  const refresh = useCallback(async () => {
    const [list, count] = await Promise.all([listNotifications(30), getUnreadNotificationCount()]);
    setNotifications(list);
    setUnread(count);
  }, []);

  useEffect(() => {
    if (!user) return;
    void refresh();
    void syncPushSubscription(user.id);
    void hasActivePushSubscription().then(setPushOn);
    pollRef.current = window.setInterval(() => void refresh(), 60_000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [user, refresh]);

  if (!user) return null;

  const toggle = () => {
    if (open) {
      closeDropdown();
      return;
    }
    overlay.pushOverlay();
    setOpen(true);
    void refresh();
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.read_at) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnread((c) => Math.max(0, c - 1));
      void markNotificationRead(n.id);
    }
    closeDropdown();
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? now })));
    setUnread(0);
    await markAllNotificationsRead();
  };

  const handleClearAll = async () => {
    if (!user) return;
    setNotifications([]);
    setUnread(0);
    await clearAllNotifications(user.id);
  };

  const handlePushToggle = async () => {
    if (!user) return;
    if (pushOn) {
      await disablePushNotifications();
      setPushOn(false);
    } else {
      setPushOn(await enablePushNotifications(user.id));
    }
  };

  const pushSupported = getPushPermissionState() !== 'unsupported' && Boolean(VAPID_PUBLIC_KEY);
  const pushDenied = getPushPermissionState() === 'denied';

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90"
        aria-label={t('Notifications', 'నోటిఫికేషన్లు')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell className={`h-4 w-4 ${open ? 'animate-bell-swing' : ''}`} />
        {unread > 0 && (
          <span
            key={unread}
            className="animate-badge-pop absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[9px] font-black text-emerald-950 ring-2 ring-emerald-900"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeDropdown} aria-hidden />
          <div
            className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:w-80"
            role="menu"
            onPointerMove={resetIdleTimer}
            onPointerDown={resetIdleTimer}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
              <p className="font-[var(--font-stylish)] text-[13px] font-black tracking-tight">{t('Notifications', 'నోటిఫికేషన్లు')}</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleMarkAll()}
                    className="flex items-center gap-1 text-[10px] font-black text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300"
                  >
                    <CheckCheck className="h-3 w-3" />
                    {t('Mark all read', 'అన్నీ చదివినట్లు గుర్తించండి')}
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleClearAll()}
                    className="flex items-center gap-1 text-[10px] font-black text-red-600 transition hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t('Clear all', 'అన్నీ తొలగించండి')}
                  </button>
                )}
              </div>
            </div>
            {pushSupported && (
              <button
                type="button"
                onClick={() => void handlePushToggle()}
                className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-left transition hover:bg-emerald-50/60 dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <BellRing className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="flex-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                  {t('Phone alerts', 'ఫోన్ అలర్ట్స్')}
                </span>
                {pushOn ? (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3 w-3" />
                    {t('On', 'ఆన్')}
                  </span>
                ) : pushDenied ? (
                  <span className="text-[10px] font-bold text-slate-400">{t('Blocked', 'నిరోధించబడింది')}</span>
                ) : (
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">{t('Enable', 'ఆన్ చేయండి')}</span>
                )}
              </button>
            )}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-[11px] font-bold text-slate-400">
                  {t('No notifications yet.', 'ఇంకా నోటిఫికేషన్లు లేవు.')}
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void handleClick(n)}
                    className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-3.5 py-2.5 text-left transition last:border-0 hover:bg-emerald-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/60 ${
                      n.read_at ? 'opacity-60' : ''
                    }`}
                  >
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${n.read_at ? 'bg-slate-300 dark:bg-slate-600' : 'bg-emerald-500'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">{n.title}</span>
                      {n.message && (
                        <span className="mt-0.5 line-clamp-2 block text-[11px] font-semibold leading-snug text-slate-500 dark:text-slate-400">{n.message}</span>
                      )}
                      <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
