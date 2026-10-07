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

const toastConfig: Record<ToastType, { icon: LucideIcon; gradient: string; borderColor: string }> = {
  success: {
    icon: FileCheck2,
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(5,150,105,0.88))',
    borderColor: 'border-emerald-400',
  },
  info: {
    icon: Info,
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.92), rgba(37,99,235,0.88))',
    borderColor: 'border-blue-400',
  },
  reset: {
    icon: RotateCcw,
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.92), rgba(217,119,6,0.88))',
    borderColor: 'border-amber-400',
  },
  saved: {
    icon: Save,
    gradient: 'linear-gradient(135deg, rgba(34,197,94,0.92), rgba(22,163,74,0.88))',
    borderColor: 'border-green-400',
  },
  deleted: {
    icon: Trash2,
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.92), rgba(220,38,38,0.88))',
    borderColor: 'border-red-400',
  },
  loaded: {
    icon: FolderOpen,
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.92), rgba(124,58,237,0.88))',
    borderColor: 'border-violet-400',
  },
  queue: {
    icon: ClipboardList,
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.92), rgba(79,70,229,0.88))',
    borderColor: 'border-indigo-400',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.92), rgba(234,88,12,0.88))',
    borderColor: 'border-orange-400',
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
      className={`max-w-sm overflow-hidden rounded-xl backdrop-blur-md ${config.borderColor} border shadow-2xl transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ background: config.gradient }}
    >
      <div className="relative p-4">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1 w-full bg-white/20 dark:bg-slate-900/30 overflow-hidden">
          <div
            className="h-full bg-white/80 dark:bg-slate-900/80 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
            <Icon className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
            {subtitle && (
              <p className="text-xs text-white/90 mt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onCloseRef.current(), 300);
            }}
            className="flex-shrink-0 rounded-md p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95"
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
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
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
