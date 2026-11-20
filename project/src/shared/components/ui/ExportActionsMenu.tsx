import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Download, FileText, FileType, Printer } from 'lucide-react';
import { ActionButton, type ActionAccent } from './DesignSystem';

const MENU_WIDTH = 160;
const MENU_HEIGHT = 140;
const EDGE = 8;

/**
 * Export dropdown (PDF / WORD / PRINT) for notice & order entry forms.
 * The menu is rendered in a portal with viewport-clamped fixed positioning so
 * it never overflows the screen on mobile, regardless of where the trigger sits.
 */
export function ExportActionsMenu({
  accent = 'emerald',
  onPdf,
  onWord,
  onPrint,
}: {
  accent?: ActionAccent;
  onPdf: () => void | Promise<void>;
  onWord: () => void | Promise<void>;
  onPrint: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) {
      const fitsBelow = window.innerHeight - rect.bottom >= MENU_HEIGHT + EDGE;
      const top = fitsBelow
        ? rect.bottom + 4
        : Math.max(EDGE, rect.top - MENU_HEIGHT - 4);
      const left = Math.min(
        Math.max(EDGE, rect.left),
        Math.max(EDGE, window.innerWidth - MENU_WIDTH - EDGE),
      );
      setPosition({ top, left });
    }
    setOpen(true);
  };

  const choose = (action: () => void | Promise<void>) => {
    setOpen(false);
    void action();
  };

  const itemClass =
    'flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-black transition sm:text-sm';

  return (
    <div ref={wrapRef} className="relative">
      <ActionButton
        tone="primary"
        accent={accent}
        onClick={toggle}
        icon={Download}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Export
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </ActionButton>
      {open && position && createPortal(
        <>
          <button
            type="button"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[200] cursor-default"
          />
          <div
            role="menu"
            style={{ position: 'fixed', top: position.top, left: position.left }}
            className="z-[210] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(onPdf)}
              className={`${itemClass} text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800`}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              PDF
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(onWord)}
              className={`${itemClass} border-t border-slate-100 text-blue-700 hover:bg-blue-50 dark:border-slate-800 dark:text-blue-300 dark:hover:bg-slate-800`}
            >
              <FileType className="h-4 w-4" aria-hidden="true" />
              WORD
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(onPrint)}
              className={`${itemClass} border-t border-slate-100 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800`}
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              PRINT
            </button>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
