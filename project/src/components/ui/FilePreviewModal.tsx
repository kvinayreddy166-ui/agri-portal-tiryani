import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, Loader2 } from 'lucide-react';
import { inferFileTypeFromName } from '../../lib/fileTypes';
import {
  getGoogleViewerTabUrl,
  getOfficeViewerEmbedUrl,
  getViewerFileUrl,
  isGoogleDriveUrl,
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
  const isPdf = type === 'pdf' || /\.pdf(\?|$)/i.test(fileUrl);
  const isOfficeDoc =
    type === 'doc' ||
    type === 'excel' ||
    /\.(docx?|xlsx?|xls|csv|pptx?)(\?|$)/i.test(fileName || fileUrl);
  const isDriveLink = isGoogleDriveUrl(fileUrl);

  const officeViewerEmbedSrc = getOfficeViewerEmbedUrl(fileUrl);
  const googleViewerTabSrc = getGoogleViewerTabUrl(fileUrl);

  const useOfficeViewer = isPdf || isOfficeDoc || isDriveLink;

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(isImage);
  const [blobFailed, setBlobFailed] = useState(false);
  const [officeFailed, setOfficeFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const showOfficeEmbed = useOfficeViewer && !officeFailed;
  const showImageInline = isImage && previewSrc && !loadingBlob && !blobFailed;
  const showDownloadFallback =
    !loadingBlob &&
    (blobFailed || officeFailed || (!showImageInline && !showOfficeEmbed));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isImage) {
      setLoadingBlob(false);
      return;
    }

    let cancelled = false;
    setLoadingBlob(true);
    setBlobFailed(false);

    fetchBlobUrl(fileUrl)
      .then((blobUrl) => {
        if (!cancelled) setPreviewSrc(blobUrl);
      })
      .catch(() => {
        if (!cancelled) setBlobFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingBlob(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, isImage]);

  useEffect(() => {
    setOfficeFailed(false);
  }, [fileUrl, officeViewerEmbedSrc]);

  useEffect(() => {
    return () => revokeBlobUrl(previewSrc);
  }, [previewSrc]);

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.preventDefault();
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
              title="Download file"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download
            </button>
            <a
              href={googleViewerTabSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-slate-800"
              title="Google preview (new tab)"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-[50vh] flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
          {loadingBlob && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="text-sm">Loading preview…</p>
            </div>
          )}

          {!loadingBlob && showImageInline && (
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              <img
                src={previewSrc}
                alt={fileName || 'Preview'}
                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-lg"
                onError={() => setBlobFailed(true)}
              />
            </div>
          )}

          {!loadingBlob && showOfficeEmbed && (
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <iframe
                key={officeViewerEmbedSrc}
                src={officeViewerEmbedSrc}
                title={fileName || 'Document preview'}
                className="min-h-[65vh] flex-1 rounded-lg border-0 bg-white shadow-lg"
                onError={() => setOfficeFailed(true)}
              />
            </div>
          )}

          {showDownloadFallback && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
                Inline preview could not load. Download the file or try Google preview.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  Download file
                </button>
                <a
                  href={googleViewerTabSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 px-5 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  <ExternalLink className="h-5 w-5" />
                  Google preview
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            {useOfficeViewer && !isImage && (
              <span>
                {isDriveLink
                  ? 'Preview uses Google Drive / Office viewer.'
                  : 'Preview uses Microsoft Office Online viewer.'}
              </span>
            )}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="font-bold text-sky-700 hover:underline dark:text-sky-300"
            >
              Download
            </button>
            <a
              href={googleViewerTabSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline dark:text-emerald-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Google preview
            </a>
            {isDriveLink && (
              <a
                href={getViewerFileUrl(fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-violet-700 hover:underline dark:text-violet-300"
              >
                Open Drive link
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
