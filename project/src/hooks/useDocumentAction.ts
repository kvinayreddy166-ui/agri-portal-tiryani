import { useCallback, useRef, useState } from 'react';
import { documentActionErrorMessage } from '../lib/documentActions';

export interface DocumentAction {
  /** True while the document action is running — use it to disable the button and show "Generating...". */
  busy: boolean;
  /**
   * Runs a document action (PDF/Excel/Word generation, download, preview).
   * - Ignores repeat taps while a previous run is in flight (no duplicates).
   * - Catches failures and reports them via `onError` (defaults to `alert`).
   */
  run: (fn: () => Promise<unknown> | unknown) => Promise<void>;
}

/**
 * Shared guard for every document-generation/download button in the PWA.
 * Prevents double-tap duplicate files and surfaces silent async failures.
 */
export function useDocumentAction(onError?: (message: string) => void): DocumentAction {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const run = useCallback(
    async (fn: () => Promise<unknown> | unknown) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        await fn();
      } catch (error) {
        console.error('Document action failed:', error);
        const message = documentActionErrorMessage(error);
        if (onError) onError(message);
        else window.alert(message);
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [onError],
  );

  return { busy, run };
}
