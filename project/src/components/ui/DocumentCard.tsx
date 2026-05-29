import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { FileActionButtons } from './FileActionButtons';
import { FilePreviewModal } from './FilePreviewModal';
import { getFileTypeIcon, getFileTypeLabel } from '../../lib/fileTypes';

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const Icon = getFileTypeIcon(fileType || 'file');
  const isImage = fileType === 'image';

  return (
    <article className="portal-card group flex h-full flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-lg">
      {isImage ? (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="block w-full cursor-zoom-in"
          aria-label="View image"
        >
          <img src={fileUrl} alt="" className="h-36 w-full object-cover" />
        </button>
      ) : (
        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/50 dark:to-slate-900">
          <Icon className="h-12 w-12 text-emerald-700 dark:text-emerald-400" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          {fileType && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {getFileTypeLabel(fileType)}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        )}
        {meta && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{meta}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <FileActionButtons fileUrl={fileUrl} fileName={title} fileType={fileType} />
          {showDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-red-200 p-2.5 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
              aria-label="Delete document"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      {previewOpen && (
        <FilePreviewModal
          fileUrl={fileUrl}
          fileName={title}
          fileType={fileType}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </article>
  );
}
