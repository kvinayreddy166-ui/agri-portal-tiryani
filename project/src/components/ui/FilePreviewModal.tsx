import React, { useEffect, useRef, useState } from 'react';
import { X, Download, ExternalLink, FileSpreadsheet, Loader2, RefreshCw } from 'lucide-react';
import { resolveFileIdentity } from '../../lib/fileTypes';
import {
  getGoogleViewerEmbedUrl,
  getGoogleViewerTabUrl,
  getOfficeViewerEmbedUrl,
  getViewerFileUrl,
  isGoogleDriveUrl,
} from '../../lib/filePreviewUrls';
import { downloadFileFromUrl, fetchBlobUrl, revokeBlobUrl } from '../../lib/fileBlob';
import { fetchExcelPreviewFromUrl, type ExcelPreviewData } from '../../lib/excelParser';

interface FilePreviewModalProps {
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  hideOpenInNewTab?: boolean;
  onClose: () => void;
}

type EmbedViewer = 'office' | 'google';

const EMBED_TIMEOUT_MS = 12000;

export function FilePreviewModal({ fileUrl, fileName, fileType, hideOpenInNewTab = false, onClose }: FilePreviewModalProps) {
  const { displayName, resolvedType } = resolveFileIdentity(fileName, fileType, fileUrl);

  const isImage = resolvedType === 'image';
  const isPdf = resolvedType === 'pdf';
  const isSpreadsheet = resolvedType === 'excel';
  const isOfficeDoc = resolvedType === 'doc';
  const isDriveLink = isGoogleDriveUrl(fileUrl);

  const googleViewerTabSrc = getGoogleViewerTabUrl(fileUrl);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [excelData, setExcelData] = useState<ExcelPreviewData | null>(null);
  const [embedViewer, setEmbedViewer] = useState<EmbedViewer>('google');
  const [embedFailed, setEmbedFailed] = useState(false);
  const [pdfUseEmbed, setPdfUseEmbed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const embedTimerRef = useRef<number | null>(null);

  const useExcelPreview = isSpreadsheet;
  const useEmbedPreview = isOfficeDoc || isDriveLink || pdfUseEmbed;

  const officeEmbedSrc = getOfficeViewerEmbedUrl(fileUrl);
  const googleEmbedSrc = getGoogleViewerEmbedUrl(fileUrl);
  const activeEmbedSrc = embedViewer === 'google' ? googleEmbedSrc : officeEmbedSrc;

  const showImageInline = isImage && previewSrc && !loading && !loadFailed;
  const showPdfInline = isPdf && previewSrc && !loading && !loadFailed && !pdfUseEmbed;
  const showExcelTable = useExcelPreview && excelData && !loading && !loadFailed;
  const DownloadIcon = isSpreadsheet ? FileSpreadsheet : Download;
  const showEmbed =
    !loading &&
    !loadFailed &&
    !showImageInline &&
    !showPdfInline &&
    !showExcelTable &&
    useEmbedPreview &&
    !embedFailed;
  const showDownloadFallback =
    !loading &&
    (loadFailed || embedFailed || (!showImageInline && !showPdfInline && !showExcelTable && !showEmbed));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setPreviewSrc(null);
    setExcelData(null);
    setEmbedFailed(false);
    setEmbedViewer('google');
    setPdfUseEmbed(false);

    const load = async () => {
      try {
        if (isSpreadsheet) {
          const data = await fetchExcelPreviewFromUrl(fileUrl, displayName);
          if (!cancelled) setExcelData(data);
          return;
        }

        if (isImage || isPdf) {
          try {
            const blobUrl = await fetchBlobUrl(fileUrl, displayName);
            if (!cancelled) setPreviewSrc(blobUrl);
          } catch {
            if (isImage && !cancelled) {
              setPreviewSrc(fileUrl);
            } else if (isPdf && !cancelled) {
              setPdfUseEmbed(true);
            } else if (!cancelled) {
              setLoadFailed(true);
            }
          }
          return;
        }
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, displayName, isImage, isPdf, isSpreadsheet]);

  useEffect(() => {
    return () => revokeBlobUrl(previewSrc);
  }, [previewSrc]);

  useEffect(() => {
    if (!showEmbed) {
      if (embedTimerRef.current) window.clearTimeout(embedTimerRef.current);
      return;
    }

    embedTimerRef.current = window.setTimeout(() => {
      if (embedViewer === 'google') {
        setEmbedViewer('office');
      } else {
        setEmbedFailed(true);
      }
    }, EMBED_TIMEOUT_MS);

    return () => {
      if (embedTimerRef.current) window.clearTimeout(embedTimerRef.current);
    };
  }, [showEmbed, activeEmbedSrc, embedViewer]);

  const handleEmbedLoad = () => {
    if (embedTimerRef.current) window.clearTimeout(embedTimerRef.current);
  };

  const switchEmbedViewer = () => {
    setEmbedFailed(false);
    setEmbedViewer((current) => (current === 'office' ? 'google' : 'office'));
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setDownloading(true);
    try {
      await downloadFileFromUrl(fileUrl, displayName);
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
            {fileName || displayName || 'File preview'}
          </h2>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white transition hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
              title="Download file"
              aria-label="Download file"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadIcon className="h-4 w-4" />}
            </button>
            {!hideOpenInNewTab && !isSpreadsheet && (
              <a
                href={googleViewerTabSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-slate-800"
                title="Open in new tab"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
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
          {loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="text-sm">Loading preview…</p>
            </div>
          )}

          {!loading && showImageInline && (
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              <img
                src={previewSrc}
                alt={fileName || 'Preview'}
                decoding="async"
                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-lg"
                onError={() => {
                  if (previewSrc !== fileUrl) {
                    setPreviewSrc(fileUrl);
                  } else {
                    setLoadFailed(true);
                  }
                }}
              />
            </div>
          )}

          {!loading && showPdfInline && previewSrc && (
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <embed
                src={previewSrc}
                type="application/pdf"
                title={fileName || 'PDF preview'}
                className="min-h-[65vh] flex-1 rounded-lg border-0 bg-white shadow-lg"
              />
            </div>
          )}

          {!loading && showExcelTable && excelData && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
              <p className="mb-2 shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {excelData.sheetName}
                {excelData.rows.length >= 50 ? ' · first 50 rows' : ''}
              </p>
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-emerald-700 text-white">
                    <tr>
                      {excelData.headers.map((header, i) => (
                        <th key={i} className="border border-emerald-600 whitespace-nowrap px-3 py-2 font-bold">
                          {header || `Col ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={Math.max(excelData.headers.length, 1)}
                          className="px-3 py-6 text-center text-slate-500 dark:text-slate-400"
                        >
                          No data rows in this sheet.
                        </td>
                      </tr>
                    ) : (
                      excelData.rows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={rowIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/60'}
                        >
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="border border-slate-200 whitespace-nowrap px-3 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && showEmbed && (
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {embedViewer === 'office' ? 'Office Online viewer' : 'Google Docs viewer'}
                </p>
                <button
                  type="button"
                  onClick={switchEmbedViewer}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Switch viewer
                </button>
              </div>
              <iframe
                key={activeEmbedSrc}
                src={activeEmbedSrc}
                title={fileName || 'Document preview'}
                className="min-h-[60vh] flex-1 rounded-lg border-0 bg-white shadow-lg"
                onLoad={handleEmbedLoad}
              />
            </div>
          )}

          {showDownloadFallback && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
                {isSpreadsheet
                  ? 'Could not load the Excel preview. Download the file to open in Excel.'
                  : 'Inline preview could not load. Download the file or try opening in a new tab.'}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <DownloadIcon className="h-5 w-5" />}
                  Download file
                </button>
                {!hideOpenInNewTab && !isSpreadsheet && (
                  <a
                    href={googleViewerTabSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 px-5 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Open in new tab
                  </a>
                )}
                {(isOfficeDoc || isDriveLink || isPdf) && !isSpreadsheet && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoadFailed(false);
                      setEmbedFailed(false);
                      setPdfUseEmbed(true);
                      setEmbedViewer('google');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-600 px-5 py-3 text-sm font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-300 dark:hover:bg-violet-950/40"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Retry preview
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            {showExcelTable && <span>Excel spreadsheet preview</span>}
            {showEmbed && <span>Document viewer embed</span>}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="font-bold text-sky-700 hover:underline dark:text-sky-300"
            >
              Download
            </button>
            {!hideOpenInNewTab && isDriveLink && (
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
