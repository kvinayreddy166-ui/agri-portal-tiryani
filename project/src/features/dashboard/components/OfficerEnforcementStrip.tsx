import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Ban, Bell, BellOff, CalendarClock, FlaskConical, Loader2, PackageX, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { useAuth } from '../../../shared/context/AuthContext';
import { safeStorage } from '../../../shared/lib/safeStorage';
import {
  EnforcementTrackerService,
  type EnforcementData,
} from '../../officers-toolkit/services/enforcementTrackerService';

const NOTIFIED_KEY = 'agri-deadline-notified-date';
const MUTED_KEY = 'agri-deadline-alerts-muted';

async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof Notification === 'undefined') return null;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function readMuted(): boolean {
  return safeGet(MUTED_KEY) === '1';
}

function writeMuted(muted: boolean): void {
  safeSet(MUTED_KEY, muted ? '1' : '0');
}

function fireDeadlineNotification(urgentCount: number, totalDue: number): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (safeGet(NOTIFIED_KEY) === today) return;
    safeSet(NOTIFIED_KEY, today);
    new Notification('AGRONIX — Enforcement deadlines', {
      body: `${urgentCount} urgent and ${totalDue} total show-cause reply deadline(s) need attention.`,
      tag: 'agri-deadline-reminder',
    });
  } catch {
    // Notifications unavailable (e.g. unsupported browser)
  }
}

function safeGet(key: string): string | null {
  return safeStorage.getItem(key);
}

function safeSet(key: string, value: string): void {
  safeStorage.setItem(key, value);
}

/**
 * Compact enforcement summary strip shown only to officers on the dashboard.
 * Shows urgent deadlines, active samples and high-risk dealers,
 * plus optional browser notifications for approaching show-cause deadlines.
 */
export function OfficerEnforcementStrip() {
  const { t } = useLanguage();
  const { isOfficerUser, user } = useAuth();
  const [data, setData] = useState<EnforcementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [alertsMuted, setAlertsMuted] = useState<boolean>(() => readMuted());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!isOfficerUser || !user) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    EnforcementTrackerService.fetchAll()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOfficerUser, user]);

  const stats = useMemo(() => {
    if (!data) return null;
    const deadlineItems = EnforcementTrackerService.buildDeadlineItems(data.orders);
    const pendingDeadlines = deadlineItems.filter(
      (d) => d.order.reply_status !== 'REPLIED' && d.order.reply_status !== 'WAIVED' && d.status !== 'CLOSED'
    );
    const urgentCount = pendingDeadlines.filter((d) => d.status === 'URGENT').length;
    const pipeline = EnforcementTrackerService.buildSamplePipeline(data.samples);
    const activeSamples = pipeline.filter((s) => s.labStatus !== 'TEST_PASSED' && s.labStatus !== 'TEST_FAILED').length;
    const highRiskDealers = EnforcementTrackerService.buildDealerScorecards(data).filter(
      (s) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL'
    ).length;
    const stopSaleOrders = data.orders.filter((o) => o.order_type === 'stop_sale').length;
    const seizureOrders = data.orders.filter((o) => o.order_type === 'seizure').length;
    return { urgentDeadlines: pendingDeadlines.length, urgentCount, activeSamples, highRiskDealers, stopSaleOrders, seizureOrders };
  }, [data]);

  // Fire a once-per-day browser notification for urgent deadlines
  useEffect(() => {
    if (!stats || notifiedRef.current || stats.urgentCount === 0 || alertsMuted) return;
    notifiedRef.current = true;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      fireDeadlineNotification(stats.urgentCount, stats.urgentDeadlines);
    }
  }, [stats, alertsMuted]);

  if (!isOfficerUser) return null;

  const notificationSupported = permission !== 'unsupported';
  const notificationGranted = permission === 'granted';

  const enableAlerts = async () => {
    const result = await requestNotificationPermission();
    if (result) setPermission(result);
    if (result === 'granted') {
      try {
        new Notification('AGRONIX — Deadline alerts on', {
          body: 'You will be notified about urgent enforcement deadlines.',
          tag: 'agri-alerts-test',
        });
      } catch {
        // notification test failed silently
      }
    }
  };

  const toggleAlerts = () => {
    setAlertsMuted((prev) => {
      const next = !prev;
      writeMuted(next);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-slate-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-black text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          {t('Enforcement at a glance', 'అమలు సారాంశం')}
        </h3>
        {notificationSupported && !notificationGranted && (
          <button
            type="button"
            onClick={enableAlerts}
            className="flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            <Bell className="h-3 w-3" />
            {t('Enable deadline alerts', 'గడువు హెచ్చరికలు ప్రారంభించండి')}
          </button>
        )}
        {notificationGranted && alertsMuted && (
          <button
            type="button"
            onClick={toggleAlerts}
            className="flex items-center gap-1 text-[10px] font-bold text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title={t('Alerts off — click to re-enable', 'హెచ్చరికలు ఆఫ్ — మళ్లీ ప్రారంభించడానికి క్లిక్ చేయండి')}
          >
            <BellOff className="h-3 w-3" />
            {t('Alerts off', 'హెచ్చరికలు ఆఫ్')}
          </button>
        )}
        {notificationGranted && !alertsMuted && (
          <button
            type="button"
            onClick={toggleAlerts}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            title={t('Click to turn off alerts', 'హెచ్చరికలను ఆఫ్ చేయడానికి క్లిక్ చేయండి')}
          >
            <Bell className="h-3 w-3" />
            {t('Alerts on', 'హెచ్చరికలు ఆన్')}
          </button>
        )}
        {!notificationSupported && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <BellOff className="h-3 w-3" />
            {t('Notifications unsupported', 'హెచ్చరికలు అందుబాటులో లేవు')}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-xs font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('Loading enforcement data…', 'అమలు డేటా లోడ్ అవుతోంది…')}
        </div>
      ) : loadError || !stats ? (
        <p className="py-3 text-xs font-semibold text-slate-500">
          {t('Could not load enforcement summary.', 'అమలు సారాంశం లోడ్ కాలేదు.')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              to: '/officer-toolkit/enforcement-tracker?tab=deadlines',
              icon: CalendarClock,
              value: stats.urgentDeadlines,
              sub: stats.urgentCount > 0
                ? `${stats.urgentCount} ${t('urgent', 'అత్యవసరం')}`
                : t('Deadlines due', 'గడువులు'),
              iconCls: 'text-red-500',
              numCls: 'text-red-700 dark:text-red-300',
              hoverCls: 'hover:border-red-300 dark:hover:border-red-700',
            },
            {
              to: '/officer-toolkit/enforcement-tracker?tab=samples',
              icon: FlaskConical,
              value: stats.activeSamples,
              sub: t('Active samples', 'యాక్టివ్ నమూనాలు'),
              iconCls: 'text-sky-500',
              numCls: 'text-sky-700 dark:text-sky-300',
              hoverCls: 'hover:border-sky-300 dark:hover:border-sky-700',
            },
            {
              to: '/officer-toolkit/enforcement-tracker?tab=scorecards',
              icon: AlertTriangle,
              value: stats.highRiskDealers,
              sub: t('High-risk dealers', 'అధిక ప్రమాద డీలర్లు'),
              iconCls: 'text-amber-500',
              numCls: 'text-amber-700 dark:text-amber-300',
              hoverCls: 'hover:border-amber-300 dark:hover:border-amber-700',
            },
            {
              to: '/officer-toolkit/enforcement-tracker?tab=scorecards',
              icon: Ban,
              value: stats.stopSaleOrders,
              sub: t('Stop sale orders', 'స్టాప్ సేల్ ఆర్డర్లు'),
              iconCls: 'text-violet-500',
              numCls: 'text-violet-700 dark:text-violet-300',
              hoverCls: 'hover:border-violet-300 dark:hover:border-violet-700',
            },
            {
              to: '/officer-toolkit/enforcement-tracker?tab=scorecards',
              icon: PackageX,
              value: stats.seizureOrders,
              sub: t('Seizure orders', 'జబ్తు ఆర్డర్లు'),
              iconCls: 'text-orange-500',
              numCls: 'text-orange-700 dark:text-orange-300',
              hoverCls: 'hover:border-orange-300 dark:hover:border-orange-700',
            },
          ].map((card) => (
            <Link
              key={card.to + card.sub}
              to={card.to}
              className={`group rounded-xl border border-slate-200 bg-white/80 p-3 transition hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60 ${card.hoverCls}`}
            >
              <card.icon className={`mb-1 h-4 w-4 ${card.iconCls}`} />
              <p className={`text-xl font-black ${card.numCls}`}>{card.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {card.sub}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
