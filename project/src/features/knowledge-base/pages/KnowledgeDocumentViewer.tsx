import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useAuth } from '../../../context/AuthContext';
import { useKnowledgeNav } from '../hooks/useKnowledgeNav';
import { fetchDocument, getDocumentSignedUrl } from '../services/knowledgeService';
import type { KnowledgeDocument } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function KnowledgeDocumentViewer() {
  const location = useLocation();
  const go = useKnowledgeNav();
  const { isAdminUser } = useAuth();
  const state = (location.state ?? {}) as { documentId?: string; page?: number };
  const documentId = state.documentId;

  const [doc, setDoc] = useState<KnowledgeDocument | null>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(state.page ?? 1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Load document metadata + file
  useEffect(() => {
    if (!documentId) { setError('No document selected.'); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchDocument(documentId);
        if (cancelled || !d) { if (!cancelled) setError('Document not found.'); setLoading(false); return; }
        setDoc(d);
        const signedUrl = await getDocumentSignedUrl(d.file_path);
        const res = await fetch(signedUrl);
        if (!res.ok) throw new Error('Could not download document file.');
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const loadingTask = pdfjsLib.getDocument({ data: buf });
        const pdfDoc = await loadingTask.promise;
        if (cancelled) return;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setError((e as Error).message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [documentId]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current) return;
    try {
      renderTaskRef.current?.cancel();
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const task = page.render({ canvasContext: ctx, viewport, canvas });
      renderTaskRef.current = task;
      await task.promise;
    } catch (e) {
      // cancelled render tasks throw — ignore
      if ((e as Error).name !== 'RenderingCancelledException') console.warn('render error', e);
    }
  }, [pdf, pageNum, scale]);

  useEffect(() => { renderPage(); }, [renderPage]);

  const jumpTo = (p: number) => {
    const target = Math.max(1, Math.min(numPages || p, p));
    setPageNum(target);
  };

  // If a citation page arrives via state after load, jump to it
  useEffect(() => {
    if (state.page && numPages) setPageNum(Math.max(1, Math.min(numPages, state.page)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages]);

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>;
  }

  if (error) {
    return (
      <div className="portal-card modern-card p-6 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <p className="mt-2 font-bold text-slate-700 dark:text-slate-200">{error}</p>
        <button onClick={() => go('library')} className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Back to Library</button>
      </div>
    );
  }

  const isPdf = doc?.file_name.toLowerCase().endsWith('.pdf');

  return (
    <div>
      <PageHeader eyebrow="Knowledge Base" title={doc?.title ?? 'Document'} description={doc?.description ?? undefined} />
      <button onClick={() => go(isAdminUser ? 'library' : 'search')} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:underline">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      {isPdf ? (
        <div className="portal-card modern-card p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button disabled={pageNum <= 1} onClick={() => jumpTo(pageNum - 1)} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-2 text-sm font-bold text-slate-600">Page {pageNum} of {numPages}</span>
              <button disabled={pageNum >= numPages} onClick={() => jumpTo(pageNum + 1)} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setScale((s) => Math.max(0.6, s - 0.2))} className="rounded-lg border border-slate-300 p-2"><ZoomOut className="h-4 w-4" /></button>
              <span className="px-2 text-xs font-bold text-slate-500">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale((s) => Math.min(3, s + 0.2))} className="rounded-lg border border-slate-300 p-2"><ZoomIn className="h-4 w-4" /></button>
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNum}
                onChange={(e) => jumpTo(Number(e.target.value))}
                className="ml-2 w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex justify-center overflow-auto bg-slate-100 p-4 dark:bg-slate-900">
            <canvas ref={canvasRef} className="shadow-lg" />
          </div>
        </div>
      ) : (
        <div className="portal-card modern-card p-6 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-600">In-app preview is available for PDF documents. This file type ({doc?.file_name.split('.').pop()}) can be downloaded for viewing.</p>
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              if (doc) {
                const url = await getDocumentSignedUrl(doc.file_path);
                window.open(url, '_blank');
              }
            }}
            className="mt-3 inline-block rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
          >
            Open file
          </a>
        </div>
      )}
    </div>
  );
}
