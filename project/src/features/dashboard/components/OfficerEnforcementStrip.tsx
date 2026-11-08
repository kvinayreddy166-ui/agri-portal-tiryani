import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, BellOff, Briefcase, CalendarClock, FlaskConical, Loader2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { useAuth } from '../../../shared/context/AuthContext';
import {
  EnforcementTrackerService,
  type EnforcementData,
} from '../../officers-toolkit/services/enforcementTrackerService';

const NOTIFIED_KEY = 'agri-deadline-notified-date';

function requestNotificationPermission(): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }
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
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable
  }
}

/**
 * Compact enforcement summary strip shown only to officers on the dashboard.
 * Shows open cases, urgent deadlines, active samples and high-risk dealers,
 * plus optional browser notifications for approaching show-cause deadlines.
 */
export function OfficerEnforcementStrip() {
  const { t } = useLanguage();
  const { isOfficerUser, user } = useAuth();
  const [data, setData] = useState<EnforcementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
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
    const openCases = data.cases.filter((c) => c.stage !== 'CLOSED').length;
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
    return { openCases, urgentDeadlines: pendingDeadlines.length, urgentCount, activeSamples, highRiskDealers };
  }, [data]);

  // Fire a once-per-day browser notification for urgent deadlines
  useEffect(() => {
    if (!stats || notifiedRef.current || stats.urgentCount === 0) return;
    notifiedRef.current = true;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      fireDeadlineNotification(stats.urgentCount, stats.urgentDeadlines);
    }
  }, [stats]);

  if (!isOfficerUser) return null;

  const notificationSupported = typeof Notification !== 'undefined';
  const notificationGranted = notificationSupported && Notification.permission === 'granted';

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
            onClick={requestNotificationPermission}
            className="flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            <Bell className="h-3 w-3" />
            {t('Enable deadline alerts', 'గడువు హెచ్చరికలు ప్రారంభించండి')}
          </button>
        )}
        {notificationGranted && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <Bell className="h-3 w-3" />
            {t('Alerts on', 'హెచ్చరికలు ఆన్')}
          </span>
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link
            to="/officer-toolkit/enforcement-tracker?tab=cases"
            className="group rounded-xl border border-slate-200 bg-white/80 p-3 transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
          >
            <Briefcase className="mb-1 h-4 w-4 text-emerald-600" />
            <p className="text-xl font-black text-slate-900 dark:text-white">{stats.openCases}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {t('Open cases', 'ఓపెన్ కేసులు')}
            </p>
          </Link>
          <Link
            to="/officer-toolkit/enforcement-tracker?tab=deadlines"
            className={`group rounded-xl border p-3 transition hover:shadow-sm ${
              stats.urgentCount > 0
                ? 'border-red-200 bg-red-50/70 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/30'
                : 'border-slate-200 bg-white/80 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800/60'
            }`}
          >
            <CalendarClock className={`mb-1 h-4 w-4 ${stats.urgentCount > 0 ? 'text-red-500' : 'text-emerald-600'}`} />
            <p className={`text-xl font-black ${stats.urgentCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>
              {stats.urgentDeadlines}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {stats.urgentCount > 0
                ? `${stats.urgentCount} ${t('urgent', 'అత్యవసరం')}`
                : t('Deadlines due', 'గడువులు')}
            </p>
          </Link>
          <Link
            to="/officer-toolkit/enforcement-tracker?tab=samples"
            className="group rounded-xl border border-slate-200 bg-white/80 p-3 transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
          >
            <FlaskConical className="mb-1 h-4 w-4 text-emerald-600" />
            <p className="text-xl font-black text-slate-900 dark:text-white">{stats.activeSamples}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {t('Active samples', 'యాక్టివ్ నమూనాలు')}
            </p>
          </Link>
          <Link
            to="/officer-toolkit/enforcement-tracker?tab=scorecards"
            className={`group rounded-xl border p-3 transition hover:shadow-sm ${
              stats.highRiskDealers > 0
                ? 'border-amber-200 bg-amber-50/70 hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/30'
                : 'border-slate-200 bg-white/80 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className={`mb-1 h-4 w-4 ${stats.highRiskDealers > 0 ? 'text-amber-500' : 'text-emerald-600'}`} />
            <p className={`text-xl font-black ${stats.highRiskDealers > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
              {stats.highRiskDealers}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {t('High-risk dealers', 'అధిక ప్రమాద డీలర్లు')}
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
