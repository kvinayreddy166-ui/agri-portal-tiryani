import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, Loader2 } from 'lucide-react';
import { inferFileTypeFromName } from '../../lib/fileTypes';
import {
  getGoogleViewerEmbedUrl,
  getGoogleViewerTabUrl,
  getOfficeViewerEmbedUrl,
} from '../../lib/filePreviewUrls';
import { downloadFileFromUrl, fetchBlobUrl, revokeBlobUrl } from '../../lib/fileBlob';

interface FilePreviewModalProps {
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  onClose: () => void;
}

export function FilePreviewModal({ fileUrl, fileName, fileType, onClose }: FilePreviewModalProps) {
  const type = fileType || inferFileTypeFromName(fileName || fileUrl);
  const isImage = type === 'image' || /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i.test(fileUrl);

  const officeViewerSrc = getOfficeViewerEmbedUrl(fileUrl);
  const googleViewerEmbedSrc = getGoogleViewerEmbedUrl(fileUrl);
  const googleViewerTabSrc = getGoogleViewerTabUrl(fileUrl);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(isImage);
  const [imageFailed, setImageFailed] = useState(false);
  const [viewerMode, setViewerMode] = useState<'office' | 'google'>('office');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isImage) {
      setLoadingImage(false);
      return;
    }

    let cancelled = false;
    setLoadingImage(true);
    setImageFailed(false);

    fetchBlobUrl(fileUrl)
      .then((blobUrl) => {
        if (!cancelled) setPreviewSrc(blobUrl);
      })
      .catch(() => {
        if (!cancelled) setImageFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingImage(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, isImage]);

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

  const activeIframeSrc = viewerMode === 'office' ? officeViewerSrc : googleViewerEmbedSrc;
  const showImageInline = isImage && !imageFailed && previewSrc && !loadingImage;

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
          <div className="flex shrink-0 items-center gap-0.5">
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
              href={googleViewerTabSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
              title="Open preview in new tab"
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

        <div className="flex min-h-[50vh] flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
          {loadingImage && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="text-sm">Loading preview…</p>
            </div>
          )}

          {!loadingImage && showImageInline && (
            <div className="flex max-h-[38vh] shrink-0 items-center justify-center overflow-auto p-4">
              <img
                src={previewSrc}
                alt={fileName || 'Preview'}
                className="max-h-[36vh] max-w-full rounded-lg object-contain shadow-lg"
                onError={() => setImageFailed(true)}
              />
            </div>
          )}

          {!loadingImage && (
            <div className={`flex min-h-0 flex-1 flex-col p-4 ${showImageInline ? 'pt-0' : ''}`}>
              <iframe
                key={activeIframeSrc}
                src={activeIframeSrc}
                title={fileName || 'Document preview'}
                className="min-h-[42vh] flex-1 rounded-lg border-0 bg-white shadow-lg"
              />
            </div>
          )}

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>Preview uses the online Office viewer.</span>
              <button
                type="button"
                onClick={() => setViewerMode((m) => (m === 'office' ? 'google' : 'office'))}
                className="font-bold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Try Google preview
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="font-bold text-sky-700 hover:underline dark:text-sky-400"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
