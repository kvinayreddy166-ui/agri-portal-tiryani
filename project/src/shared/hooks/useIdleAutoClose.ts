import { useCallback, useEffect, useRef } from 'react';

/**
 * Calls `onClose` after `ms` milliseconds without interaction. Attach the
 * returned `resetIdle` handler to the floating surface's pointer events
 * (onPointerMove / onPointerDown) so any activity inside it postpones the
 * close. The timer starts when `isOpen` becomes true and is cleared when it
 * closes or the component unmounts.
 */
export function useIdleAutoClose(isOpen: boolean, onClose: () => void, ms = 5000) {
  const timerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetIdle = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => onCloseRef.current(), ms);
  }, [clearTimer, ms]);

  useEffect(() => {
    if (!isOpen) {
      clearTimer();
      return;
    }
    resetIdle();
    return clearTimer;
  }, [isOpen, resetIdle, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return resetIdle;
}

export default useIdleAutoClose;
