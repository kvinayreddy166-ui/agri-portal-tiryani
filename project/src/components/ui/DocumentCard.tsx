import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { FileActionButtons } from './FileActionButtons';

interface DocumentCardProps {
  title: string;
  description?: string;
  fileUrl: string;
  meta?: string;
  fileType?: string;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function DocumentCard({
  title,
  description,
  fileUrl,
  meta,
  fileType,
  onDelete,
  showDelete = false,
}: DocumentCardProps) {
  return (
    <article className="portal-card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 p-3 text-emerald-700">
          <FileText className="h-6 w-6" />
        </div>
        {fileType && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            {fileType}
          </span>
        )}
      </div>
      <h3 className="line-clamp-2 text-lg font-black text-slate-950">{title}</h3>
      {description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{description}</p>}
      {meta && <p className="mt-3 text-xs text-slate-500">{meta}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-5">
        <FileActionButtons fileUrl={fileUrl} />
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-red-200 p-2.5 text-red-600 transition hover:bg-red-50"
            aria-label="Delete document"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </article>
  );
}
