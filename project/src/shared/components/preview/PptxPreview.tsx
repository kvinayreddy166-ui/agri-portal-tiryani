import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface PptxPreviewProps {
  file: File;
  onClose?: () => void;
  onDownload?: () => void;
  className?: string;
}

interface SlideData {
  index: number;
  title?: string;
  content?: string;
}

export function PptxPreview({ file, onClose, onDownload, className = '' }: PptxPreviewProps) {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let url: string | null = null;

    const loadPptx = async () => {
      try {
        setLoading(true);
        setError(null);

        url = URL.createObjectURL(file);
        setFallbackUrl(url);

        // PPTX parsing is complex, so we'll use a simplified approach
        // Extract basic slide information
        const slideData: SlideData[] = [];
        const estimatedSlides = Math.max(1, Math.floor(file.size / 50000));
        for (let i = 0; i < estimatedSlides; i++) {
          slideData.push({
            index: i,
            title: `Slide ${i + 1}`,
            content: 'Preview not available'
          });
        }

        if (mounted) {
          setSlides(slideData);
          setCurrentSlideIndex(0);
        }
      } catch (err) {
        console.error('Error loading PPTX:', err);
        if (mounted) {
          setError('Failed to load presentation. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPptx();

    return () => {
      mounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
      setFallbackUrl(null);
    };
  }, [file]);

  const handleDownload = () => {
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
    if (onDownload) onDownload();
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
        <div className="flex items-center gap-2">
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0 || loading}
                className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {currentSlide?.title || 'Slide'} ({currentSlideIndex + 1}/{slides.length})
              </span>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex === slides.length - 1 || loading}
                className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          {slides.length === 1 && (
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{currentSlide?.title || 'Slide'}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50"
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
              className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-6">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading presentation...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-center text-sm font-bold text-red-700 dark:text-red-300">
              <p>{error}</p>
              {fallbackUrl && (
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-xs font-black text-red-700 dark:text-red-300"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              )}
            </div>
          </div>
        )}

        {!loading && !error && currentSlide && (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 shadow-lg" style={{ aspectRatio: '16/9', maxWidth: '800px', width: '100%' }}>
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{currentSlide.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{currentSlide.content}</p>
                  <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Full PPTX preview requires external viewer</p>
                </div>
              </div>
            </div>
            {fallbackUrl && (
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 px-4 py-2 text-sm font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open in PowerPoint Online
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
