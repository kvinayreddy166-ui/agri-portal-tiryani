import React, { useState } from 'react';
import { Download, Eye, FileSpreadsheet, Loader2 } from 'lucide-react';
import { resolveFileIdentity } from '../../lib/fileTypes';
import { downloadFileFromUrl } from '../../lib/fileBlob';
import { FilePreviewModal } from './FilePreviewModal';

interface FileActionButtonsProps {
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  className?: string;
  size?: 'sm' | 'md';
  onView?: () => void;
}

export function FileActionButtons({
  fileUrl,
  fileName,
  fileType,
  className = '',
  size = 'md',
  onView,
}: FileActionButtonsProps) {
  const [downloading, setDownloading] = useState(false);
  const [showInternalPreview, setShowInternalPreview] = useState(false);
  const iconClass = 'h-4 w-4';
  const btnClass = size === 'sm' ? 'h-8 w-8 rounded-md' : 'h-9 w-9 rounded-lg';
  const resolvedType = resolveFileIdentity(fileName, fileType, fileUrl).resolvedType;
  const DownloadIcon = resolvedType === 'excel' ? FileSpreadsheet : Download;

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // If onView callback is provided, use it for inline preview (for components that have their own preview logic)
    if (onView) {
      onView();
    } else {
      // Use internal preview modal for uploaded/stored files
      setShowInternalPreview(true);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadFileFromUrl(fileUrl, fileName);
    } catch {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className={`inline-flex shrink-0 items-center gap-1 ${className}`}>
        <button
          type="button"
          onClick={handleView}
          className={`inline-flex items-center justify-center ${btnClass} text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800`}
          aria-label="View file"
          title="Preview"
        >
          <Eye className={iconClass} />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className={`inline-flex items-center justify-center ${btnClass} text-sky-700 transition hover:bg-sky-50 disabled:opacity-50 dark:text-sky-400 dark:hover:bg-slate-800`}
          aria-label="Download file"
          title="Download"
        >
          {downloading ? (
            <Loader2 className={`${iconClass} animate-spin`} />
          ) : (
            <DownloadIcon className={iconClass} />
          )}
        </button>
      </div>
      {showInternalPreview && (
        <FilePreviewModal
          fileUrl={fileUrl}
          fileName={fileName}
          fileType={fileType}
          onClose={() => setShowInternalPreview(false)}
        />
      )}
    </>
  );
}
