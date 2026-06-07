import React, { useState } from 'react';
import { Download, Eye, Loader2 } from 'lucide-react';
import { FilePreviewModal } from './FilePreviewModal';
import { resolveFileIdentity } from '../../lib/fileTypes';
import { downloadFileFromUrl } from '../../lib/fileBlob';
import { useBackButtonOverlay } from '../../hooks/useBackButtonOverlay';

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
  const previewOverlay = useBackButtonOverlay('file-preview', () => setPreviewOpen(false));
  const [downloading, setDownloading] = useState(false);
  const iconClass = 'h-4 w-4';
  const btnClass = size === 'sm' ? 'h-8 w-8 rounded-md' : 'h-9 w-9 rounded-lg';
  const resolvedType = resolveFileIdentity(fileName, fileType, fileUrl).resolvedType;

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    previewOverlay.pushOverlay();
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
            <Download className={iconClass} />
          )}
        </button>
      </div>
      {previewOpen && (
        <FilePreviewModal
          fileUrl={fileUrl}
          fileName={fileName}
          fileType={resolvedType}
          onClose={previewOverlay.closeOverlay}
        />
      )}
    </>
  );
}
