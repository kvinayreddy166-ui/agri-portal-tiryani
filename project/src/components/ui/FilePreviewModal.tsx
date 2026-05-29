import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, Loader2 } from 'lucide-react';
import { inferFileTypeFromName, isPreviewable } from '../../lib/fileTypes';
import { downloadFileFromUrl, fetchBlobUrl, revokeBlobUrl } from '../../lib/fileBlob';

interface FilePreviewModalProps {
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  onClose: () => void;
}

export function FilePreviewModal({ fileUrl, fileName, fileType, onClose }: FilePreviewModalProps) {
  const type = fileType || inferFileTypeFromName(fileName || fileUrl);
  const canPreview = isPreviewable(fileUrl, type);
  const isImage = type === 'image' || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(fileUrl);
  const isPdf = type === 'pdf' || /\.pdf(\?|$)/i.test(fileUrl);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(canPreview && (isImage || isPdf));
  const [previewError, setPreviewError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!canPreview || (!isImage && !isPdf)) return;

    let cancelled = false;
    setLoadingPreview(true);
    setPreviewError(false);

    fetchBlobUrl(fileUrl)
      .then((blobUrl) => {
        if (!cancelled) setPreviewSrc(blobUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewError(true);
          setPreviewSrc(fileUrl);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, canPreview, isImage, isPdf]);

  useEffect(() => {
    return () => revokeBlobUrl(previewSrc);
  }, [previewSrc]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);
    try {
      await downloadFileFromUrl(fileUrl, fileName);
    } catch {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  const displaySrc = previewSrc || fileUrl;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="File preview"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {fileName || 'File preview'}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50 disabled:opacity-50 dark:text-sky-400 dark:hover:bg-slate-800"
              title="Download"
            >
              {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
              title="Open in new tab"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-[50vh] flex-1 items-center justify-center overflow-auto bg-slate-100 p-4 dark:bg-slate-950">
          {loadingPreview && (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="text-sm">Loading preview…</p>
            </div>
          )}

          {!loadingPreview && canPreview && isImage && (
            <img
              src={displaySrc}
              alt={fileName || 'Preview'}
              className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-lg"
              onError={() => setPreviewError(true)}
            />
          )}

          {!loadingPreview && canPreview && isPdf && !isImage && (
            <iframe
              src={displaySrc}
              title={fileName || 'PDF preview'}
              className="h-[75vh] w-full rounded-lg border-0 bg-white shadow-lg"
            />
          )}

          {!loadingPreview && previewError && canPreview && (
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400">
                Preview could not be loaded inline.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </a>
            </div>
          )}

          {!loadingPreview && !canPreview && (
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400">
                Inline preview is not available for this file type (Excel/Word). Use Download.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
