import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { isTurnstileEnabled, loadTurnstileScript, TURNSTILE_SITE_KEY } from '../../lib/turnstile';

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

/**
 * Cloudflare Turnstile widget. Renders nothing when VITE_TURNSTILE_SITE_KEY
 * is not configured, so the app keeps working before the key is set up.
 * Tokens are single-use — call ref.reset() after every submit attempt.
 */
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, onExpire, onError, theme = 'auto', className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });
    callbacksRef.current = { onVerify, onExpire, onError };

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch {
            // Widget may already be gone — ignore.
          }
        }
      },
    }));

    useEffect(() => {
      if (!isTurnstileEnabled()) return;
      let cancelled = false;

      loadTurnstileScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return;
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            theme,
            callback: (token) => callbacksRef.current.onVerify(token),
            'expired-callback': () => callbacksRef.current.onExpire?.(),
            'timeout-callback': () => callbacksRef.current.onExpire?.(),
            'error-callback': () => callbacksRef.current.onError?.(),
          });
        })
        .catch(() => callbacksRef.current.onError?.());

      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }
      };
    }, [theme]);

    if (!isTurnstileEnabled()) return null;
    return <div ref={containerRef} className={className} />;
  }
);
