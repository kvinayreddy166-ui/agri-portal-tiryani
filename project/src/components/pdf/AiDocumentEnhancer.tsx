import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Sparkles } from 'lucide-react';
import { PdfUploadBox } from './PdfUploadBox';
import { PdfPreview } from './PdfPreview';
import { ColorMode, CompressionStats, enhanceScannedPdf } from '../../utils/pdfHelpers';
import { cleanupObjectUrl, downloadBlob, formatFileSize, makeSafeFileName } from '../../utils/fileCleanup';

const modes: Array<{ value: ColorMode; label: string; detail: string }> = [
  { value: 'color', label: 'Sharpen + Contrast', detail: 'Preserve color and improve readability' },
  { value: 'grayscale', label: 'Grayscale Clean', detail: 'Reduce color noise for official copies' },
  { value: 'bw', label: 'Black & White', detail: 'Smallest, high-contrast scanned output' },
];

export function AiDocumentEnhancer() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CompressionStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ColorMode>('grayscale');
  const [progress, setProgress] = useState({ message: '', percent: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => () => cleanupObjectUrl(previewUrl || undefined), [previewUrl]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    cleanupObjectUrl(previewUrl || undefined);
    setPreviewUrl(null);
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress({ message: '', percent: 0 });
    cleanupObjectUrl(previewUrl || undefined);
    setPreviewUrl(null);
  };

  const handleEnhance = async () => {
    if (!file || processing) return;
    setProcessing(true);
    setError(null);
    setProgress({ message: 'Starting enhancement', percent: 5 });
    try {
      const enhanced = await enhanceScannedPdf(file, mode, (message, percent) => setProgress({ message, percent }));
      setResult(enhanced);
      setProgress({ message: 'Completed', percent: 100 });
      setPreviewUrl(URL.createObjectURL(enhanced.blob));
    } catch (err) {
      console.error('Enhancement error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enhance PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, makeSafeFileName(file.name, `enhanced_${mode}`, 'pdf'));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-base font-black text-slate-900">PDF Enhancement</h3>
        <p className="text-xs font-semibold text-slate-600">
          Improve low-quality scans with contrast, denoise-style cleanup, grayscale, and black-and-white rebuilds.
        </p>
      </div>

      <PdfUploadBox
        onFileSelect={handleFileSelect}
        currentFile={file}
        onClear={handleClear}
        disabled={processing}
        accept="application/pdf"
        maxSizeMB={80}
      />

      {file && !result && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {modes.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setMode(item.value)}
                disabled={processing}
                className={`rounded-lg border px-3 py-2 text-left ${
                  mode === item.value ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-white'
                } disabled:opacity-50`}
              >
                <p className="text-xs font-black text-slate-900">{item.label}</p>
                <p className="text-[10px] font-semibold text-slate-600">{item.detail}</p>
              </button>
            ))}
          </div>

          {processing && (
            <div className="rounded-lg border border-emerald-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-emerald-900">
                <span>{progress.message}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                <div className="h-full bg-emerald-700 transition-all" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleEnhance}
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {processing ? 'Enhancing...' : 'Enhance PDF'}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {result && file && (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Original" value={formatFileSize(result.originalSize)} />
            <Stat label="Enhanced" value={formatFileSize(result.compressedSize)} />
            <Stat label="DPI" value={String(result.dpi || 150)} />
            <Stat label="Pages" value={String(result.pages)} />
          </div>
          {previewUrl && <PdfPreview file={new File([result.blob], 'enhanced.pdf', { type: 'application/pdf' })} className="h-[520px]" />}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/80 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xs font-black text-slate-900">{value}</p>
    </div>
  );
}
