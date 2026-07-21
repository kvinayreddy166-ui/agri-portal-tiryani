import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { FileActionButtons } from './FileActionButtons';
import { FilePreviewModal } from './FilePreviewModal';
import { FileTypeIcon } from './FileTypeIcon';
import { resolveFileType } from '../../lib/fileTypes';

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
  const resolvedType = resolveFileType(title, fileType, fileUrl);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <article className="portal-card group flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-md">
        <FileTypeIcon fileName={title} fileType={fileType} fileUrl={fileUrl} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black text-slate-950 dark:text-white">{title}</h3>
          {meta && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{meta}</p>}
          {description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-600 dark:text-slate-400">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <FileActionButtons 
            fileUrl={fileUrl} 
            fileName={title} 
            fileType={resolvedType} 
            size="sm" 
            onView={() => setShowPreview(true)}
          />
          {showDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
              aria-label="Delete document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </article>

      {showPreview && (
        <FilePreviewModal
          fileUrl={fileUrl}
          fileName={title}
          fileType={resolvedType}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
