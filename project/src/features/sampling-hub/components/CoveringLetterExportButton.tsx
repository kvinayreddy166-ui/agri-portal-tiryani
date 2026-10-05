import React, { useState } from 'react';
import { ChevronDown, FileText, FileType, Loader2 } from 'lucide-react';

export type CoveringLetterExportFormat = 'pdf' | 'word';

type CoveringLetterExportButtonProps = {
  onExport: (format: CoveringLetterExportFormat) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  className: string;
};

export function CoveringLetterExportButton({ onExport, disabled, isGenerating, className }: CoveringLetterExportButtonProps) {
  const [open, setOpen] = useState(false);

  const choose = (format: CoveringLetterExportFormat) => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div className="relative flex-1 sm:flex-none sm:w-auto min-w-0 flex">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className={className}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Export
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      {open && !disabled && (
        <>
          <button
            type="button"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div role="menu" className="absolute bottom-full right-0 z-50 mb-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <button
              type="button"
              role="menuitem"
              onClick={() => choose('pdf')}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => choose('word')}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              <FileType className="h-4 w-4" />
              WORD
            </button>
          </div>
        </>
      )}
    </div>
  );
}
