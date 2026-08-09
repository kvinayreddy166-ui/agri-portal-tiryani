import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type PdfViewerProps = {
  pdfData: string | ArrayBuffer | Uint8Array;
  onError?: (error: Error) => void;
  onLoadComplete?: () => void;
};

export function PdfViewer({ pdfData, onError, onLoadComplete }: PdfViewerProps) {
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    let isMounted = true;
    let renderTasks: pdfjsLib.RenderTask[] = [];

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(0);

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;
        
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);

        // Render all pages
        const container = document.getElementById('pdf-viewer-container');
        if (!container) return;

        // Clear previous content
        container.innerHTML = '';
        canvasRefs.current = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (!isMounted) break;

          const page = await pdf.getPage(pageNum);
          
          // Create canvas for this page
          const canvas = document.createElement('canvas');
          canvas.className = 'pdf-page-canvas';
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.marginBottom = '16px';
          canvas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          
          const context = canvas.getContext('2d');
          if (!context) continue;

          // Calculate scale to fit viewport width
          const viewport = page.getViewport({ scale: 1 });
          const containerWidth = container.clientWidth;
          const scale = containerWidth / viewport.width;
          const scaledViewport = page.getViewport({ scale });

          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;

          // Render page
          const renderTask = page.render({
            canvasContext: context,
            viewport: scaledViewport,
            canvas: canvas,
          });

          renderTasks.push(renderTask);
          await renderTask.promise;

          if (!isMounted) break;

          container.appendChild(canvas);
          canvasRefs.current.push(canvas);
          setCurrentPage(pageNum);
        }

        if (isMounted) {
          setLoading(false);
          onLoadComplete?.();
        }
      } catch (err) {
        if (!isMounted) return;
        
        const error = err as Error;
        console.error('Error loading PDF:', error);
        setError(error.message || 'Failed to load PDF');
        setLoading(false);
        onError?.(error);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      // Cancel any ongoing render tasks
      renderTasks.forEach(task => {
        if (task) task.cancel();
      });
      // Clean up PDF document reference
      pdfDocRef.current = null;
    };
  }, [pdfData, onError, onLoadComplete]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to display PDF preview</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-sm text-gray-600">
          {numPages > 0 ? `Rendering page ${currentPage} of ${numPages}...` : 'Generating preview...'}
        </p>
      </div>
    );
  }

  return (
    <div 
      id="pdf-viewer-container" 
      className="w-full h-full overflow-y-auto p-4 bg-gray-100"
      style={{ height: '100%' }}
    >
      {/* PDF pages will be rendered here by useEffect */}
    </div>
  );
}
