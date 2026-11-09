import React, { useCallback, useRef, useState } from 'react';
import { FileCheck } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface ConfirmRequest {
  title: string;
  message?: string;
  confirmLabel?: string;
}

interface PendingConfirm extends ConfirmRequest {
  resolve: (value: boolean) => void;
}

/**
 * Promise-based confirmation dialog — drop-in replacement for window.confirm
 * that works inside the installed PWA (where native dialogs are suppressed).
 *
 * Usage:
 *   const { askConfirm, confirmDialog } = useConfirmDialog();
 *   if (!(await askConfirm({ title: 'Issue order?', message: '...' }))) return;
 *   ...and render {confirmDialog} in the JSX.
 */
export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const settle = useCallback((value: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    current?.resolve(value);
  }, []);

  const askConfirm = useCallback(
    (request: ConfirmRequest): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        const next: PendingConfirm = { ...request, resolve };
        pendingRef.current = next;
        setPending(next);
      }),
    []
  );

  const confirmDialog = pending ? (
    <ConfirmDialog
      open
      title={pending.title}
      message={pending.message}
      confirmLabel={pending.confirmLabel ?? 'Confirm'}
      cancelLabel="Cancel"
      icon={<FileCheck className="h-5 w-5" aria-hidden="true" />}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return { askConfirm, confirmDialog };
}
