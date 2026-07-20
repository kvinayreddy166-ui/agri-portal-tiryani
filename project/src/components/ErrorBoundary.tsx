import React, { Component, ReactNode } from 'react';
import { clearAppCacheAndReload, APP_BUILD_LABEL } from '../lib/appVersion';
import { PortalLogo } from './ui/PortalLogo';
import { isRecoverableChunkError, recoverFromStaleAssets } from '../lib/pwaRecovery';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) console.error('App error:', error, info.componentStack);
    if (isRecoverableChunkError(error.message)) {
      void recoverFromStaleAssets();
      // Automatically clear cache and reload for recoverable errors
      void clearAppCacheAndReload();
    }
  }

  render() {
    if (this.state.error) {
      const recoverable = isRecoverableChunkError(this.state.error.message);

      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eef6f0] p-6 text-center dark:bg-slate-950">
          <PortalLogo size="md" />
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {recoverable ? 'App update needs a refresh' : 'Something went wrong'}
            </h1>
            <p className="mt-2 max-w-md text-sm font-semibold text-slate-600 dark:text-slate-300">
              {recoverable
                ? 'A cached app file is older than the current deployment. Reload or clear app cache to fetch the latest files.'
                : this.state.error.message}
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