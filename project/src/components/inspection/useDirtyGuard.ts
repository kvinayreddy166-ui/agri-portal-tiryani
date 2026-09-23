import { useEffect } from 'react';

const CONFIRM_MESSAGE = 'You have unsaved changes. Leave this page without saving?';
const CONFIRM_GRACE_MS = 750;

let globalDirty = false;
let lastConfirmedAt = 0;

/**
 * Returns true when it is safe to navigate away (nothing unsaved, or user confirmed discard).
 * When called without arguments it checks the globally tracked dirty flag.
 */
export function confirmDiscardIfDirty(dirty?: boolean): boolean {
  const isDirty = dirty === undefined ? globalDirty : dirty;
  if (!isDirty) return true;
  const ok = window.confirm(CONFIRM_MESSAGE);
  if (ok) lastConfirmedAt = Date.now();
  return ok;
}

/**
 * Warns before leaving a page with unsaved changes:
 * - browser/tab close (beforeunload)
 * - browser back/forward (popstate, navigates back if cancelled)
 * - in-app navigation via confirmDiscardIfDirty() checks (global dirty flag)
 */
export function useDirtyGuard(dirty: boolean): void {
  useEffect(() => {
    globalDirty = dirty;
    return () => { globalDirty = false; };
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const onPopState = () => {
      // Skip when the pop was triggered right after an explicit confirm (avoids double prompts).
      if (Date.now() - lastConfirmedAt < CONFIRM_GRACE_MS) return;
      if (window.confirm(CONFIRM_MESSAGE)) {
        lastConfirmedAt = Date.now();
      } else {
        window.history.go(1);
      }
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, [dirty]);
}
