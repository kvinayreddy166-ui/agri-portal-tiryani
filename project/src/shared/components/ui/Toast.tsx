import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastProps {
  type: ToastType;
  title: string;
  subtitle?: string;
  duration?: number;
  onClose: () => void;
}

const toastConfig: Record<ToastType, { icon: LucideIcon; bgColor: string; textColor: string; borderColor: string }> = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800/50',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
  },
  error: {
    icon: Trash2,
    bgColor: 'bg-red-50 dark:bg-red-950/50',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-800/50',
  },
};

export function Toast({ type, title, subtitle, duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onCloseRef.current(), 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div
      role="status"
      className={`max-w-sm overflow-hidden rounded-lg border ${config.borderColor} ${config.bgColor} shadow-lg transition-[transform,opacity] duration-300 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${config.textColor}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${config.textColor}`}>{title}</h4>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onCloseRef.current(), 200);
          }}
          className="flex-shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none dark:text-slate-500 dark:hover:text-slate-300"
          aria-label="Close notification"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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

  const removeToast = (id: string) => {
    const timer = timersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showToast = (type: ToastType, title: string, subtitle?: string, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, title, subtitle, duration }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), duration + 200);
  };

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
      timersRef.current = {};
    };
  }, []);

  const showSuccess = (title: string, subtitle?: string, duration?: number) => {
    showToast('success', title, subtitle, duration);
  };

  const showInfo = (title: string, subtitle?: string, duration?: number) => {
    showToast('info', title, subtitle, duration);
  };

  const showWarning = (title: string, subtitle?: string, duration?: number) => {
    showToast('warning', title, subtitle, duration);
  };

  const showError = (title: string, subtitle?: string, duration?: number) => {
    showToast('error', title, subtitle, duration);
  };

  // Backward-compatible methods (map to new types)
  const showReset = (title: string, subtitle?: string, duration?: number) => {
    showToast('warning', title, subtitle, duration);
  };

  const showSaved = (title: string, subtitle?: string, duration?: number) => {
    showToast('success', title, subtitle, duration);
  };

  const showDeleted = (title: string, subtitle?: string, duration?: number) => {
    showToast('error', title, subtitle, duration);
  };

  const showLoaded = (title: string, subtitle?: string, duration?: number) => {
    showToast('info', title, subtitle, duration);
  };

  const showQueue = (title: string, subtitle?: string, duration?: number) => {
    showToast('info', title, subtitle, duration);
  };

  return { toasts, removeToast, showSuccess, showInfo, showWarning, showError, showReset, showSaved, showDeleted, showLoaded, showQueue };
}
