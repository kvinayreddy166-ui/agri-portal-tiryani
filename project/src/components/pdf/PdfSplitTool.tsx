import React, { useEffect, useState } from 'react';
import { Download, Eye, RefreshCw, FileText } from 'lucide-react';
import { PdfUploadBox } from './PdfUploadBox';
import { splitPdf, getPdfInfo } from '../../utils/pdfHelpers';
import { cleanupObjectUrl, downloadBlob, makeSafeFileName, formatFileSize } from '../../utils/fileCleanup';

type SplitMode = 'range' | 'every' | 'extract';

export function PdfSplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [results, setResults] = useState<Blob[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<SplitMode>('range');
  const [pageCount, setPageCount] = useState(0);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [extractPages, setExtractPages] = useState('');

  useEffect(() => () => previewUrls.forEach((url) => cleanupObjectUrl(url)), [previewUrls]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setResults([]);
    previewUrls.forEach((url) => cleanupObjectUrl(url));
    setPreviewUrls([]);
    setPreviewIndex(0);
    setError(null);

    try {
      const pdfInfo = await getPdfInfo(selectedFile);
      setPageCount(pdfInfo.pageCount);
    } catch (err) {
      console.error('Error getting PDF info:', err);
      setError('Failed to load PDF. Please try again.');
    }
  };

  const handleClear = () => {
    setFile(null);
    setResults([]);
    previewUrls.forEach((url) => cleanupObjectUrl(url));
    setPreviewUrls([]);
    setPreviewIndex(0);
    setError(null);
    setPageCount(0);
    setRangeStart('');
    setRangeEnd('');
    setExtractPages('');
  };

  const handleSplit = async () => {
    if (!file) return;

    setSplitting(true);
    setError(null);

    try {
      let pageRanges: Array<{ start: number; end: number }> = [];

      if (mode === 'range') {
        const start = parseInt(rangeStart);
        const end = parseInt(rangeEnd);

        if (isNaN(start) || isNaN(end) || start < 1 || end > pageCount || start > end) {
          setError(`Invalid page range. Please enter numbers between 1 and ${pageCount}.`);
          setSplitting(false);
          return;
        }

        pageRanges = [{ start, end }];
      } else if (mode === 'every') {
        for (let i = 1; i <= pageCount; i++) {
          pageRanges.push({ start: i, end: i });
        }
      } else if (mode === 'extract') {
        const pages = parsePageList(extractPages, pageCount);

        if (pages.length === 0) {
          setError('Please enter valid page numbers separated by commas.');
          setSplitting(false);
          return;
        }

        const sortedPages = [...new Set(pages)].sort((a, b) => a - b);
        let currentRange = { start: sortedPages[0], end: sortedPages[0] };

        for (let i = 1; i < sortedPages.length; i++) {
          if (sortedPages[i] === currentRange.end + 1) {
            currentRange.end = sortedPages[i];
          } else {
            pageRanges.push({ ...currentRange });
            currentRange = { start: sortedPages[i], end: sortedPages[i] };
          }
        }
        pageRanges.push(currentRange);
      }

      const splitBlobs = await splitPdf(file, pageRanges);
      setResults(splitBlobs);
      previewUrls.forEach((url) => cleanupObjectUrl(url));
      setPreviewUrls(splitBlobs.map((blob) => URL.createObjectURL(blob)));
      setPreviewIndex(0);
    } catch (err) {
      console.error('Split error:', err);
      setError('Failed to split PDF. Please try again.');
    } finally {
      setSplitting(false);
    }
  };

  const handleDownloadAll = () => {
    results.forEach((blob, index) => {
      const fileName = makeSafeFileName(file?.name || 'document', `part_${index + 1}`, 'pdf');
      downloadBlob(blob, fileName);
    });
  };

  const handleDownloadSingle = (blob: Blob, index: number) => {
    const fileName = makeSafeFileName(file?.name || 'document', `part_${index + 1}`, 'pdf');
    downloadBlob(blob, fileName);
  };

  const handleReset = () => {
    setResults([]);
    previewUrls.forEach((url) => cleanupObjectUrl(url));
    setPreviewUrls([]);
    setPreviewIndex(0);
    setError(null);
    setRangeStart('');
    setRangeEnd('');
    setExtractPages('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-black text-slate-900">Split PDF</h3>
        <p className="mb-3 text-xs font-semibold text-slate-600">
          Split PDF into multiple documents by page range or extract specific pages
        </p>
      </div>

      <PdfUploadBox
        onFileSelect={handleFileSelect}
        currentFile={file}
        onClear={handleClear}
        disabled={splitting}
        accept="application/pdf"
      />

      {file && !results.length && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-600">
              Total Pages: {pageCount}
            </p>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
              Split Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('range')}
                disabled={splitting}
                className={`rounded-lg border px-3 py-2 text-xs font-black transition-colors ${
                  mode === 'range'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                Page Range
              </button>
              <button
                type="button"
                onClick={() => setMode('every')}
                disabled={splitting}
                className={`rounded-lg border px-3 py-2 text-xs font-black transition-colors ${
                  mode === 'every'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                Every Page
              </button>
              <button
                type="button"
                onClick={() => setMode('extract')}
                disabled={splitting}
                className={`rounded-lg border px-3 py-2 text-xs font-black transition-colors ${
                  mode === 'extract'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                Extract Pages
              </button>
            </div>
          </div>

          {mode === 'range' && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Start Page
                </label>
                <input
                  type="number"
                  min="1"
                  max={pageCount}
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  disabled={splitting}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
                  End Page
                </label>
                <input
                  type="number"
                  min="1"
                  max={pageCount}
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  disabled={splitting}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                  placeholder={pageCount.toString()}
                />
              </div>
            </div>
          )}

          {mode === 'extract' && (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
                Page Numbers (comma-separated)
              </label>
              <input
                type="text"
                value={extractPages}
                onChange={(e) => setExtractPages(e.target.value)}
                disabled={splitting}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                placeholder="1,3,5,7-9"
              />
              <p className="mt-1 text-[10px] font-semibold text-slate-600">
                Example: 1,3,5 or 1-5,7,9
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSplit}
            disabled={splitting}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {splitting ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Splitting...
              </span>
            ) : (
              'Split PDF'
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-600">
              Split Complete
            </p>
            <p className="text-sm font-black text-emerald-800">
              Created {results.length} PDF file{results.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
            {results.map((blob, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-900">
                    Part {index + 1}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600">
                    ({formatFileSize(blob.size)})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-50"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(blob, index)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-50"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {previewUrls[previewIndex] && (
            <div className="mb-3">
              <p className="mb-1 flex items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-600">
                <Eye className="h-3 w-3" /> Preview Part {previewIndex + 1}
              </p>
              <iframe title={`Split PDF preview part ${previewIndex + 1}`} src={previewUrls[previewIndex]} className="h-72 w-full rounded-lg border border-emerald-200 bg-white" />
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadAll}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              Download All
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function parsePageList(value: string, pageCount: number): number[] {
  const pages = new Set<number>();
  value.split(',').forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      for (let page = Math.min(start, end); page <= Math.max(start, end); page += 1) {
        if (page >= 1 && page <= pageCount) pages.add(page);
      }
      return;
    }
    const page = Number(trimmed);
    if (Number.isInteger(page) && page >= 1 && page <= pageCount) pages.add(page);
  });
  return [...pages].sort((a, b) => a - b);
}
