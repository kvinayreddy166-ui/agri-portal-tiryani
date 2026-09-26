import React, { Component, Suspense, useEffect, useState } from 'react';
import { PortalLogo } from '../../shared/components/ui/PortalLogo';
import { APP_BUILD_LABEL, clearAppCacheAndReload } from '../../shared/lib/appVersion';
import { isRecoverableChunkError, recoverFromStaleAssets } from '../../shared/lib/pwaRecovery';

export function GlobalAppLoader({ hideLogo = false }: { hideLogo?: boolean }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#eef6f0] p-6 text-center dark:bg-slate-950">
      {!hideLogo && <PortalLogo size="xl" />}
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
      {!hideLogo && (
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading AGRONIX...
        </p>
      )}
      {slow && (
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white/90 p-4 shadow-sm dark:border-amber-900 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">App is taking longer than expected.</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
            A stale deployment cache or slow auth check may be blocking startup. Clearing cache and reloading...
          </p>
          <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">App Version: {APP_BUILD_LABEL}</p>
        </div>
      )}
    </div>
  );
}

export function PageLoader({ hideLogo = false }: { hideLogo?: boolean }) {
  return <GlobalAppLoader hideLogo={hideLogo} />;
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
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#eef6f0] p-6 text-center">
          <PortalLogo size="lg" />
          <div className="mt-8 max-w-md">
            <h1 className="text-2xl font-black text-slate-900">
              AGRONIX
            </h1>
            <p className="mt-4 text-base font-bold text-slate-700">
              A new version of AGRONIX is available.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Please refresh the application to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleRefreshNow}
            className="mt-8 rounded-xl bg-emerald-700 px-8 py-3 text-base font-bold text-white hover:bg-emerald-800 transition-colors"
          >
            Refresh Now
          </button>
        </div>
      );
    }

    // Non-recoverable errors show a generic error message without technical details
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#eef6f0] p-6 text-center dark:bg-slate-950">
        <PortalLogo size="xl" />
        <div className="max-w-md rounded-2xl border border-red-200 bg-white/95 p-5 shadow-sm dark:border-red-900 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">Something went wrong</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            The page could not load. Please try refreshing.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800">
              Retry
            </button>
            <button type="button" onClick={() => void clearAppCacheAndReload()} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50">
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
    <div className="min-h-screen bg-[#eef6f0] dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white shadow-lg">
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

export function AppVersionBadge() {
  return (
    <div className="pointer-events-none fixed bottom-1 right-2 z-[60] rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-950/70 dark:text-slate-400 dark:ring-slate-800">
      App Version: {APP_BUILD_LABEL}
    </div>
  );
}
