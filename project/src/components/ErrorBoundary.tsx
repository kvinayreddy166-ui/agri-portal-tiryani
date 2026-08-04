import React, { Component, ReactNode } from 'react';
import { clearAppCacheAndReload, APP_BUILD_LABEL } from '../lib/appVersion';
import { PortalLogo } from './ui/PortalLogo';
import { isRecoverableChunkError, recoverFromStaleAssets } from '../lib/pwaRecovery';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  showUpdateScreen: boolean;
}

const RELOAD_ATTEMPT_KEY = 'agronix-update-reload-attempt';

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, showUpdateScreen: false };

  static getDerivedStateFromError(error: Error) {
    return { error, showUpdateScreen: isRecoverableChunkError(error.message) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) console.error('App error:', error, info.componentStack);
    
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
    if (this.state.error) {
      if (this.state.showUpdateScreen) {
        return (
          <div className="flex min-h-screen flex-col items-center justify-center bg-[#eef6f0] p-6 text-center">
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

      // Non-recoverable errors still show the original error page
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eef6f0] p-6 text-center dark:bg-slate-950">
          <PortalLogo size="md" />
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="mt-2 max-w-md text-sm font-semibold text-slate-600 dark:text-slate-300">
              {this.state.error.message}
            </p>
            <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">App Version: {APP_BUILD_LABEL}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => void clearAppCacheAndReload()}
              className="rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
            >
              Clear cache
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}