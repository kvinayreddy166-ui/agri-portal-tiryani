import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, X, Download } from 'lucide-react';

interface ImagePreviewProps {
  fileUrl: string;
  fileName?: string;
  onClose?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function ImagePreview({ fileUrl, fileName, onClose, onDownload, className = '' }: ImagePreviewProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'image';
    link.click();
    if (onDownload) onDownload();
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setLoading(false);
    setError('Failed to load image. Please try again.');
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setScale(1);
    setRotation(0);
  }, [fileUrl]);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={loading}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-900">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={loading}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            disabled={loading}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || scale === 1 && rotation === 0}
            className="rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              title="Download"
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
              title="Close"
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
              <p className="text-sm font-semibold text-slate-600">Loading image...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700">
              <p>{error}</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-red-700"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="flex justify-center">
            <img
              ref={imgRef}
              src={fileUrl}
              alt={fileName || 'Preview'}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="max-w-full shadow-lg transition-transform"
              style={{
                maxHeight: '70vh',
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
