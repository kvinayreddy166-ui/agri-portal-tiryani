import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useBackButtonOverlay } from '../../hooks/useBackButtonOverlay';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../features/feedback/services/feedbackService';
import type { AppNotification } from '../../../features/feedback/types';

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
  const overlay = useBackButtonOverlay('notification-bell', () => setOpen(false));
  const pollRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    const [list, count] = await Promise.all([listNotifications(30), getUnreadNotificationCount()]);
    setNotifications(list);
    setUnread(count);
  }, []);

  useEffect(() => {
    if (!user) return;
    void refresh();
    pollRef.current = window.setInterval(() => void refresh(), 60_000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [user, refresh]);

  if (!user) return null;

  const toggle = () => {
    if (open) {
      overlay.closeOverlay();
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
    overlay.closeOverlay();
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? now })));
    setUnread(0);
    await markAllNotificationsRead();
  };

  return (
    <div className="relative">
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
          <div className="fixed inset-0 z-40" onClick={overlay.closeOverlay} aria-hidden />
          <div
            className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:w-96"
            role="menu"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-black">{t('Notifications', 'నోటిఫికేషన్లు')}</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMarkAll()}
                  className="flex items-center gap-1 text-[11px] font-black text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {t('Mark all read', 'Mark all read')}
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs font-bold text-slate-400">
                  {t('No notifications yet.', 'ఇంకా నోటిఫికేషన్లు లేవు.')}
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void handleClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-emerald-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/60 ${
                      n.read_at ? 'opacity-60' : ''
                    }`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-slate-300 dark:bg-slate-600' : 'bg-emerald-500'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-black text-slate-800 dark:text-slate-100">{n.title}</span>
                      {n.message && (
                        <span className="mt-0.5 line-clamp-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">{n.message}</span>
                      )}
                      <span className="mt-1 block text-[10px] font-bold text-slate-400">{timeAgo(n.created_at)}</span>
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
