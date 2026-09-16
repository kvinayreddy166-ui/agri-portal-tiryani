import React, { useEffect, useRef, useState } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import type { FertilizerFormEntry } from '../../data/fertilizerForms';

export function FertilizerFormPdfGenerator({ form, onClose }: { form: FertilizerFormEntry; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let pdfDoc: PDFDocumentProxy | null = null;

    const renderPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        setRenderedPages(0);

        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.min.mjs');
        if (cancelled) return;

        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
            import.meta.url
          ).toString();
        }

        const response = await fetch(form.pdfPath);
        if (!response.ok) throw new Error(`Unable to load PDF (HTTP ${response.status}).`);
        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;

        loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer), useWorkerFetch: false });
        pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        const numPages = pdfDoc.numPages;
        setTotalPages(numPages);

        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '';

        for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
          if (cancelled) break;

          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) break;

          const baseViewport = page.getViewport({ scale: 1 });
          const containerWidth = container.clientWidth || 800;
          const scale = Math.max(0.5, containerWidth / baseViewport.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.className = 'fertilizer-form-pdf-page';
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.style.marginBottom = pageNum < numPages ? '12px' : '0';
          canvas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
          canvas.style.background = '#ffffff';

          await page.render({ canvas, viewport, background: '#ffffff' }).promise;
          if (cancelled) break;

          container.appendChild(canvas);
          setRenderedPages(pageNum);
        }

        if (!cancelled) {
          const targetPage = Math.max(1, Math.min(form.page || 1, numPages));
          if (targetPage > 1) {
            const canvases = container.querySelectorAll('canvas.fertilizer-form-pdf-page');
            const targetCanvas = canvases[targetPage - 1] as HTMLCanvasElement | undefined;
            if (targetCanvas) {
              targetCanvas.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
          }
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Error rendering fertilizer form PDF:', err);
        setError('Unable to render the PDF preview. You can still download the PDF.');
        setLoading(false);
      }
    };

    void renderPdf();

    return () => {
      cancelled = true;
      if (loadingTask) {
        loadingTask.destroy().catch(() => {});
      }
    };
  }, [form.pdfPath, form.page]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <section className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-950">
        <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{form.category}</p>
            <h2 className="max-w-full whitespace-normal text-sm font-black leading-snug text-slate-950 dark:text-white sm:text-base">
              {form.formNo} - {form.title}
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <a
              href={form.pdfPath}
              download
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </a>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-auto bg-slate-200 dark:bg-slate-900" style={{ minHeight: '60vh' }}>
          {loading && (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {totalPages > 0
                  ? `Rendering page ${renderedPages} of ${totalPages}...`
                  : 'Loading PDF...'}
              </p>
            </div>
          )}

          {error && (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="max-w-md text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
              <a
                href={form.pdfPath}
                download
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </a>
            </div>
          )}

          <div
            ref={containerRef}
            className="mx-auto w-full max-w-[820px] p-3 sm:p-4"
            style={{ display: loading || error ? 'none' : 'block' }}
          />
        </div>
      </section>
    </div>
  );
}
