import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'info' | 'reset' | 'saved' | 'deleted' | 'loaded' | 'queue';

interface ToastProps {
  type: ToastType;
  title: string;
  subtitle?: string;
  duration?: number;
  onClose: () => void;
}

const toastConfig: Record<ToastType, { icon: string; bgColor: string; borderColor: string }> = {
  success: {
    icon: '📄',
    bgColor: 'bg-emerald-500/90',
    borderColor: 'border-emerald-400',
  },
  info: {
    icon: '👁️',
    bgColor: 'bg-blue-500/90',
    borderColor: 'border-blue-400',
  },
  reset: {
    icon: '🔄',
    bgColor: 'bg-amber-500/90',
    borderColor: 'border-amber-400',
  },
  saved: {
    icon: '💾',
    bgColor: 'bg-green-500/90',
    borderColor: 'border-green-400',
  },
  deleted: {
    icon: '🗑️',
    bgColor: 'bg-red-500/90',
    borderColor: 'border-red-400',
  },
  loaded: {
    icon: '📂',
    bgColor: 'bg-violet-500/90',
    borderColor: 'border-violet-400',
  },
  queue: {
    icon: '📋',
    bgColor: 'bg-indigo-500/90',
    borderColor: 'border-indigo-400',
  },
};

export function Toast({ type, title, subtitle, duration = 5000, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in animation
    setIsVisible(true);

    const interval = 50;
    const step = 100 / (duration / interval);
    
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(progressTimer);
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for fade-out animation
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(progressTimer);
  }, [duration, onClose]);

  const config = toastConfig[type];

  return (
    <div
      className={`max-w-sm overflow-hidden rounded-xl ${config.bgColor} backdrop-blur-md ${config.borderColor} border shadow-2xl transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{
        background: `linear-gradient(135deg, ${config.bgColor.replace('/90', '')}dd, ${config.bgColor.replace('/90', '')}99)`,
      }}
    >
      <div className="relative p-4">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
            {subtitle && (
              <p className="text-xs text-white/90 mt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
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

  const showToast = (type: ToastType, title: string, subtitle?: string, duration?: number) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, subtitle, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (title: string, subtitle?: string, duration?: number) => {
    showToast('success', title, subtitle, duration);
  };

  const showInfo = (title: string, subtitle?: string, duration?: number) => {
    showToast('info', title, subtitle, duration);
  };

  const showReset = (title: string, subtitle?: string, duration?: number) => {
    showToast('reset', title, subtitle, duration);
  };

  const showSaved = (title: string, subtitle?: string, duration?: number) => {
    showToast('saved', title, subtitle, duration);
  };

  const showDeleted = (title: string, subtitle?: string, duration?: number) => {
    showToast('deleted', title, subtitle, duration);
  };

  const showLoaded = (title: string, subtitle?: string, duration?: number) => {
    showToast('loaded', title, subtitle, duration);
  };

  const showQueue = (title: string, subtitle?: string, duration?: number) => {
    showToast('queue', title, subtitle, duration);
  };

  return { toasts, removeToast, showSuccess, showInfo, showReset, showSaved, showDeleted, showLoaded, showQueue };
}
