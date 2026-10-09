import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  FileCheck2,
  FolderOpen,
  Info,
  RotateCcw,
  Save,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

export type ToastType = 'success' | 'info' | 'reset' | 'saved' | 'deleted' | 'loaded' | 'queue' | 'warning';

interface ToastProps {
  type: ToastType;
  title: string;
  subtitle?: string;
  duration?: number;
  onClose: () => void;
}

const toastConfig: Record<ToastType, { icon: LucideIcon; accent: string; chip: string }> = {
  success: {
    icon: FileCheck2,
    accent: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/60',
  },
  info: {
    icon: Info,
    accent: 'bg-blue-500',
    chip: 'bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900/60',
  },
  reset: {
    icon: RotateCcw,
    accent: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900/60',
  },
  saved: {
    icon: Save,
    accent: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/60',
  },
  deleted: {
    icon: Trash2,
    accent: 'bg-red-500',
    chip: 'bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900/60',
  },
  loaded: {
    icon: FolderOpen,
    accent: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-600 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900/60',
  },
  queue: {
    icon: ClipboardList,
    accent: 'bg-indigo-500',
    chip: 'bg-indigo-50 text-indigo-600 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-900/60',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-orange-500',
    chip: 'bg-orange-50 text-orange-600 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-900/60',
  },
};

export function Toast({ type, title, subtitle, duration = 4000, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Trigger slide-in animation
    setIsVisible(true);

    const interval = 50;
    const step = 100 / (duration / interval);
    
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - step;
        if (newProgress <= 0) {
          clearInterval(progressTimer);
          setIsVisible(false);
          setTimeout(() => onCloseRef.current(), 300); // Wait for fade-out animation
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(progressTimer);
  }, [duration]);

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div
      role="status"
      className={`max-w-sm overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-950/10 backdrop-blur-md transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] dark:border-slate-800 dark:bg-slate-900/95 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="relative p-4">
        {/* Type accent bar */}
        <span className={`absolute inset-y-0 left-0 w-1 ${config.accent}`} aria-hidden="true" />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full opacity-70 transition-[width] duration-100 ease-linear ${config.accent}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${config.chip}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold tracking-wide text-slate-900 dark:text-white">{title}</h4>
            {subtitle && (
              <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onCloseRef.current(), 300);
            }}
            className="flex-shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:scale-95 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast container to manage multiple toasts
interface ToastContainerProps {
  toasts: Array<{ id: string; type: ToastType; title: string; subtitle?: string; duration?: number }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed right-4 top-[calc(1rem_+_env(safe-area-inset-top))] z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            type={toast.type}
            title={toast.title}
            subtitle={toast.subtitle}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; type: ToastType; title: string; subtitle?: string; duration?: number }>>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, subtitle?: string, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, title, subtitle, duration }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), duration + 300);
  }, [removeToast]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
      timersRef.current = {};
    };
  }, []);

  const showSuccess = useCallback((title: string, subtitle?: string, duration?: number) => {
    showToast('success', title, subtitle, duration);
  }, [showToast]);

  const showInfo = useCallback((title: string, subtitle?: string, duration?: number) => {
    showToast('info', title, subtitle, duration);
  }, [showToast]);

  const showReset = useCallback((title: string, subtitle?: string, duration?: number) => {
    showToast('reset', title, subtitle, duration);
  }, [showToast]);

  const showSaved = useCallback((title: string, subtitle?: string, duration?: number) => {
    showToast('saved', title, subtitle, duration);
  }, [showToast]);

  const showDeleted = useCallback((title: string, subtitle?: string, duration?: number) => {
    showToast('deleted', title, subtitle, duration);
  }, [showToast]);

  const showLoaded = useCallback((title: string, subtitle?: string, duration?: number) => {
    showToast('loaded', title, subtitle, duration);
  }, [showToast]);

  const showQueue = useCallback((title: string, subtitle?: string, duration?: number) => {
    showToast('queue', title, subtitle, duration);
  }, [showToast]);

  const showWarning = useCallback((title: string, subtitle?: string, duration?: number) => {
    showToast('warning', title, subtitle, duration);
  }, [showToast]);

  return { toasts, removeToast, showSuccess, showInfo, showReset, showSaved, showDeleted, showLoaded, showQueue, showWarning };
}
