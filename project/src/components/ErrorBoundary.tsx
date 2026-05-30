import React, { Component, ReactNode } from 'react';
import { PortalLogo } from './ui/PortalLogo';

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
    console.error('App error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eef6f0] p-6 text-center">
          <PortalLogo size="md" />
          <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
          <p className="max-w-md text-sm text-slate-600">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
