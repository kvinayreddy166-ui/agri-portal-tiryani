// Cloudflare Turnstile helpers (client-side).
// The site key is public by design; the secret key never reaches the browser —
// it is verified server-side (Supabase Auth CAPTCHA or Edge Functions).

export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').toString().trim();

export function isTurnstileEnabled(): boolean {
  return TURNSTILE_SITE_KEY.length > 0;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          'timeout-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

export function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Turnstile script failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}
