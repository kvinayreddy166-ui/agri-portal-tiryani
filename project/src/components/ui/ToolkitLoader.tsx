import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ToolkitLoaderProps {
  message?: string;
}

export function ToolkitLoader({ message = 'Loading Officer Toolkit...' }: ToolkitLoaderProps) {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo with Animation */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl animate-scale-in">
          <ShieldCheck className="h-12 w-12" />
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 blur-xl animate-pulse" />
        </div>

        {/* Loading Spinner */}
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Loading Message */}
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-white animate-fade-in">
            {message}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400 animate-fade-in delay-200">
            Initializing Agriculture Tools...
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-64 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full animate-loading-bar" />
      </div>
    </div>
  );
}
