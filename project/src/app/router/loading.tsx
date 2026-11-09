import React, { Component, Suspense, useEffect, useState } from 'react';
import { PortalLogo } from '../../shared/components/ui/PortalLogo';
import { Spinner } from '../../shared/components/ui/Spinner';
import { APP_BUILD_LABEL, clearAppCacheAndReload } from '../../shared/lib/appVersion';
import { isRecoverableChunkError, recoverFromStaleAssets } from '../../shared/lib/pwaRecovery';

const BOOT_SLOW_ERROR_CODE = 'AGRX-BOOT-001';

export function GlobalAppLoader({ hideLogo = false }: { hideLogo?: boolean }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#f2f7f3] p-6 text-center dark:bg-slate-950">
      {!hideLogo && <PortalLogo size="xl" />}
      <Spinner size="xl" className="text-emerald-700 dark:text-emerald-400" label="Loading AGRONIX" />
      {!hideLogo && (
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading AGRONIX...
        </p>
      )}
      {slow && (
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white/90 p-4 shadow-sm dark:border-amber-900 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">App is taking longer than expected.</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
            A stale deployment cache or slow connection may be blocking startup.
          </p>
          <button
            type="button"
            onClick={() => void clearAppCacheAndReload()}
            className="mt-3 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-black text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Clear cache &amp; reload
          </button>
          <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            App Version: {APP_BUILD_LABEL} · Error Code: {BOOT_SLOW_ERROR_CODE}
          </p>
        </div>
      )}
    </div>
  );
}

export function PageLoader({ hideLogo = false }: { hideLogo?: boolean }) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 p-8 text-center">
      {!hideLogo && <PortalLogo size="lg" />}
      <Spinner size="lg" className="text-emerald-700 dark:text-emerald-400" label="Loading page" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Loading...
      </p>
    </div>
  );
}

export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/85 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <PortalLogo size="sm" />
            <div>
              <span className="block text-lg font-black tracking-tight text-emerald-800 dark:text-gold-300 font-[var(--font-stylish)]">
                AGRONIX
              </span>
              <p className="text-[10px] font-medium italic tracking-wide text-gold-600 dark:text-gold-400">
                Agriculture Meets Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block h-8 w-24 rounded-xl bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
            <div className="h-9 w-24 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 animate-pulse" />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white min-h-[520px]">
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="h-7 w-64 rounded-full bg-emerald-900/80 border border-gold-400/20 animate-pulse" />
              <div className="space-y-3">
                <div className="h-10 sm:h-12 w-4/5 rounded-xl bg-white/10 animate-pulse" />
                <div className="h-10 sm:h-12 w-3/5 rounded-xl bg-gold-400/20 animate-pulse" />
              </div>
              <div className="h-20 w-full max-w-2xl rounded-xl bg-emerald-100/10 animate-pulse" />
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="h-12 w-48 rounded-2xl bg-gold-400/30 animate-pulse" />
                <div className="h-12 w-40 rounded-2xl bg-white/10 animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 sm:p-6 min-h-[300px] animate-pulse">
                <div className="h-6 w-3/4 rounded-lg bg-white/20 mb-4" />
                <div className="space-y-3">
                  <div className="h-12 w-full rounded-xl bg-white/10" />
                  <div className="h-12 w-full rounded-xl bg-white/10" />
                  <div className="h-12 w-full rounded-xl bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


type LazyLoadBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type LazyLoadBoundaryState = {
  error: Error | null;
  showUpdateScreen: boolean;
};

const RELOAD_ATTEMPT_KEY = 'agronix-lazy-reload-attempt';

class LazyLoadBoundary extends Component<LazyLoadBoundaryProps, LazyLoadBoundaryState> {
  state: LazyLoadBoundaryState = { error: null, showUpdateScreen: false };

  static getDerivedStateFromError(error: Error): LazyLoadBoundaryState {
    return { error, showUpdateScreen: isRecoverableChunkError(error.message) };
  }

  componentDidCatch(error: Error) {
    console.error('Page failed to load:', error);

    if (isRecoverableChunkError(error.message)) {
      // Try automatic recovery first
      void this.attemptAutomaticRecovery();
    }
  }

  async attemptAutomaticRecovery() {
    try {
      // Check if we've already attempted recovery to prevent infinite loops
      const lastAttempt = window.sessionStorage.getItem(RELOAD_ATTEMPT_KEY);
      if (lastAttempt && Date.now() - Number(lastAttempt) < 30000) {
        // Already attempted within last 30 seconds, show update screen
        this.setState({ showUpdateScreen: true });
        return;
      }

      window.sessionStorage.setItem(RELOAD_ATTEMPT_KEY, String(Date.now()));

      // Attempt automatic recovery with cache-busting
      await recoverFromStaleAssets();

      // If recovery succeeds, the page will reload automatically
    } catch {
      // If automatic recovery fails, show the update screen
      this.setState({ showUpdateScreen: true });
    }
  }

  handleRefreshNow = async () => {
    try {
      // Clear all caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      // Unregister all service workers
      const registrations = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((registrations || []).map((registration) => registration.unregister()));

      // Clear the reload attempt flag
      window.sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);

      // Hard reload with cache-busting
      const url = new URL(window.location.href);
      url.searchParams.set('v', String(Date.now()));
      window.location.replace(url.toString());
    } catch {
      // Fallback to simple reload
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    if (this.state.showUpdateScreen) {
      return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f2f7f3] p-6 text-center dark:bg-slate-950">
          <PortalLogo size="lg" />
          <div className="mt-8 max-w-md">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              AGRONIX
            </h1>
            <p className="mt-4 text-base font-bold text-slate-700 dark:text-slate-200">
              A new version of AGRONIX is available.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              Please refresh the application to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleRefreshNow}
            className="mt-8 rounded-xl bg-emerald-700 px-8 py-3 text-base font-bold text-white hover:bg-emerald-800 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Refresh Now
          </button>
        </div>
      );
    }

    // Non-recoverable errors show a generic error message without technical details
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#f2f7f3] p-6 text-center dark:bg-slate-950">
        <PortalLogo size="xl" />
        <div className="max-w-md rounded-2xl border border-red-200 bg-white/95 p-5 shadow-sm dark:border-red-900 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">Something went wrong</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            The page could not load. Please try refreshing.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              Retry
            </button>
            <button type="button" onClick={() => void clearAppCacheAndReload()} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700">
              Clear cache and reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export function SafeSuspense({ children, fallback }: LazyLoadBoundaryProps) {
  return (
    <LazyLoadBoundary fallback={fallback}>
      <Suspense fallback={fallback || <PageLoader />}>{children}</Suspense>
    </LazyLoadBoundary>
  );
}

export function PublicReadOnlyShell({
  title,
  onHome,
  children,
}: {
  title: string;
  onHome: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f2f7f3] dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-700 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <PortalLogo size="sm" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black sm:text-base font-[var(--font-stylish)]">AGRONIX</h1>
              <p className="truncate text-xs font-semibold text-emerald-100">{title} - Public view</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onHome}
            className="shrink-0 rounded-lg bg-white/15 px-3 py-2 text-sm font-black transition hover:bg-white/25"
          >
            Login
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <SafeSuspense fallback={<PageLoader />}>{children}</SafeSuspense>
      </main>
    </div>
  );
}


