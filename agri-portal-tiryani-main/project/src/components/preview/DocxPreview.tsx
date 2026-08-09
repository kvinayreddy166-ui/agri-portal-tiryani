import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import mammoth from 'mammoth';

interface DocxPreviewProps {
  file: File;
  onClose?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function DocxPreview({ file, onClose, onDownload, className = '' }: DocxPreviewProps) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let url: string | null = null;

    const loadDocx = async () => {
      try {
        setLoading(true);
        setError(null);

        url = URL.createObjectURL(file);
        setFallbackUrl(url);

        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer }, {
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Heading 1'] => h2:fresh",
            "p[style-name='Heading 2'] => h3:fresh",
            "p[style-name='Heading 3'] => h4:fresh",
          ],
          includeDefaultStyleMap: false,
        });

        if (mounted) {
          setHtml(result.value);
        }
      } catch (err) {
        console.error('Error loading DOCX:', err);
        if (mounted) {
          setError('Failed to load document. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDocx();

    return () => {
      mounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
      setFallbackUrl(null);
    };
  }, [file]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onDownload) onDownload();
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
        <span className="text-sm font-semibold text-slate-900">{file.name}</span>
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

      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white p-6">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-semibold text-slate-600">Loading document...</p>
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
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
