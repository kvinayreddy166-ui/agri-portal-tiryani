import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X, Download, ExternalLink } from 'lucide-react';
import { renderPdfPage, validatePdf } from '../../utils/pdfHelpers';
import { cleanupObjectUrl, downloadBlob, makeSafeFileName } from '../../utils/fileCleanup';

interface PdfPreviewProps {
  file: File;
  onClose?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function PdfPreview({ file, onClose, onDownload, className = '' }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const renderPage = useCallback(async (pageNumber: number, nextScale = scale) => {
    if (!canvasRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const canvas = await renderPdfPage(file, pageNumber, nextScale);
      
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        }
      }
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render page. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [file, scale]);

  useEffect(() => {
    let mounted = true;
    let url: string | null = null;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        url = URL.createObjectURL(file);
        setFallbackUrl(url);

        const info = await validatePdf(file);

        if (mounted) {
          setTotalPages(info.pageCount);
          setCurrentPage(1);
        }

        // Render first page
        await renderPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (mounted) {
          setError('Failed to load PDF. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      mounted = false;
      if (url) {
        cleanupObjectUrl(url);
      }
      setFallbackUrl(null);
    };
  }, [file, renderPage]);

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    await renderPage(newPage);
  };

  const handleZoomIn = async () => {
    const newScale = Math.min(scale + 0.25, 3);
    setScale(newScale);
    await renderPage(currentPage, newScale);
  };

  const handleZoomOut = async () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    await renderPage(currentPage, newScale);
  };

  const handleDownload = () => {
    const fileName = makeSafeFileName(file.name, 'preview', 'pdf');
    downloadBlob(file, fileName);
    if (onDownload) onDownload();
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-900">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={loading}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-900">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={loading}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-semibold text-slate-600">Loading PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700">
              <p>{error}</p>
              {fallbackUrl && (
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-red-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              )}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full shadow-lg"
              style={{ maxHeight: '70vh' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
