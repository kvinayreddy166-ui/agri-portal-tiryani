import { useCallback, useEffect, useRef, useState } from 'react';

// window.confirm is suppressed in some contexts (installed PWA / WebView),
// which makes confirm-gated buttons appear dead. This hook replaces it with
// a two-tap confirm: first tap arms the action, second tap runs it.
export function useTwoStepConfirm(timeoutMs = 4000) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<number | null>(null);

  const disarm = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setArmed(false);
  }, []);

  useEffect(() => disarm, [disarm]);

  const requestConfirm = useCallback(
    (action: () => void) => {
      if (armed) {
        disarm();
        action();
        return;
      }
      setArmed(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setArmed(false), timeoutMs);
    },
    [armed, disarm, timeoutMs]
  );

  return { armed, requestConfirm, disarm };
}
