import React, { useState } from 'react';
import { Download, Eye, Loader2 } from 'lucide-react';
import { FilePreviewModal } from './FilePreviewModal';
import { resolveFileIdentity } from '../../lib/fileTypes';
import { downloadFileFromUrl } from '../../lib/fileBlob';

interface FileActionButtonsProps {
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function FileActionButtons({
  fileUrl,
  fileName,
  fileType,
  className = '',
  size = 'md',
}: FileActionButtonsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const btnClass = size === 'sm' ? 'rounded-md p-1' : 'rounded-lg p-1.5';
  const resolvedType = resolveFileIdentity(fileName, fileType, fileUrl).resolvedType;

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewOpen(true);
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
      <div className={`inline-flex items-center gap-0.5 ${className}`}>
        <button
          type="button"
          onClick={handleView}
          className={`${btnClass} text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800`}
          aria-label="View file"
          title="View"
        >
          <Eye className={iconClass} />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className={`${btnClass} text-sky-700 transition hover:bg-sky-50 disabled:opacity-50 dark:text-sky-400 dark:hover:bg-slate-800`}
          aria-label="Download file"
          title="Download"
        >
          {downloading ? (
            <Loader2 className={`${iconClass} animate-spin`} />
          ) : (
            <Download className={iconClass} />
          )}
        </button>
      </div>
      {previewOpen && (
        <FilePreviewModal
          fileUrl={fileUrl}
          fileName={fileName}
          fileType={resolvedType}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
