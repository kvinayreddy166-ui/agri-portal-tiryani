import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { PdfUploadBox } from './PdfUploadBox';
import {
  ColorMode,
  CompressionLevel,
  CompressionStats,
  PdfInfo,
  compressPdf,
} from '../../utils/pdfHelpers';
import { cleanupObjectUrl, downloadBlob, formatFileSize, makeSafeFileName } from '../../utils/fileCleanup';

const levels: Array<{ value: CompressionLevel; label: string; detail: string }> = [
  { value: 'recommended', label: 'Recommended', detail: '150 DPI, JPEG 0.70' },
  { value: 'small', label: 'Small Size', detail: '120 DPI, JPEG 0.50' },
  { value: 'extreme', label: 'Extreme', detail: '82 DPI, destructive raster compression' },
  { value: 'ultra', label: 'Ultra Extreme', detail: '58 DPI, adaptive B&W capable' },
  { value: 'maximum', label: 'Maximum', detail: '34 DPI, adaptive B&W/JPEG/PNG' },
  { value: 'extreme100', label: 'Under 100 KB', detail: 'Auto target below 100 KB' },
];

const targetPresets = [100, 200, 500];

export function PdfCompressionTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState<CompressionStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('recommended');
  const [colorMode, setColorMode] = useState<ColorMode>('color');
  const [targetMode, setTargetMode] = useState(false);
  const [targetSizeKB, setTargetSizeKB] = useState(200);
  const [forceRasterize, setForceRasterize] = useState(false);
  const [progress, setProgress] = useState({ message: '', percent: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => () => cleanupObjectUrl(previewUrl || undefined), [previewUrl]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setProgress({ message: '', percent: 0 });
    cleanupObjectUrl(previewUrl || undefined);
    setPreviewUrl(null);
  };

  const handleClear = () => {
    setFile(null);
    setPdfInfo(null);
    setResult(null);
    setError(null);
    setProgress({ message: '', percent: 0 });
    cleanupObjectUrl(previewUrl || undefined);
    setPreviewUrl(null);
  };

  const handleCompress = async () => {
    if (!file || compressing) return;
    setCompressing(true);
    setError(null);
    setResult(null);
    setProgress({ message: 'Starting compression', percent: 5 });

    try {
      const activeTarget = level === 'extreme100' ? 100 : targetMode ? targetSizeKB : undefined;
      const compressionResult = await compressPdf(file, {
        level,
        colorMode: level === 'maximum' || level === 'extreme100' ? 'bw' : level === 'ultra' && colorMode === 'color' ? 'grayscale' : colorMode,
        targetSizeKB: activeTarget,
        forceRasterize: forceRasterize || ['extreme', 'ultra', 'maximum', 'extreme100'].includes(level),
        enhance: colorMode !== 'color',
        onProgress: (message, percent) => setProgress({ message, percent }),
      });

      setResult(compressionResult);
      setProgress({ message: 'Completed', percent: 100 });
      const url = URL.createObjectURL(compressionResult.blob);
      setPreviewUrl(url);
      if (compressionResult.warning) setError(compressionResult.warning);
    } catch (err) {
      console.error('Compression error:', err);
      setError(err instanceof Error ? err.message : 'Failed to compress PDF. Please try again.');
    } finally {
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, makeSafeFileName(file.name, result.level.replace(/\s+/g, '_').toLowerCase(), 'pdf'));
  };

  const handleResetResult = () => {
    setResult(null);
    setError(null);
    setProgress({ message: '', percent: 0 });
    cleanupObjectUrl(previewUrl || undefined);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-base font-black text-slate-900">Compress PDF</h3>
        <p className="text-xs font-semibold text-slate-600">
          Text PDFs are cleaned without rasterizing. Scanned and extreme modes are rebuilt page by page.
        </p>
      </div>

      <PdfUploadBox
        onFileSelect={handleFileSelect}
        onInfo={setPdfInfo}
        currentFile={file}
        onClear={handleClear}
        disabled={compressing}
        accept="application/pdf"
        maxSizeMB={80}
      />

      {file && !result && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {pdfInfo && (
            <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              Detected: {pdfInfo.kind === 'text' ? 'Text PDF, searchable text can be preserved.' : 'Scanned/image PDF, raster compression recommended.'}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
              Compression Level
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {levels.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setLevel(item.value);
                    if (item.value === 'maximum') {
                      setColorMode('bw');
                    }
                    if (item.value === 'extreme100') {
                      setTargetMode(true);
                      setTargetSizeKB(100);
                      setColorMode('bw');
                    }
                  }}
                  disabled={compressing}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    level === item.value
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  <span className="block text-xs font-black">{item.label}</span>
                  <span className="text-[10px] font-semibold opacity-75">{item.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
              Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['color', 'Preserve Color'],
                ['grayscale', 'Grayscale'],
                ['bw', 'Black & White'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColorMode(value as ColorMode)}
                  className={`rounded-lg border px-2 py-2 text-xs font-black ${
                    colorMode === value ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <label className="flex items-center gap-2 text-xs font-black text-slate-800">
              <input
                type="checkbox"
                checked={targetMode}
                onChange={(event) => setTargetMode(event.target.checked)}
                className="h-4 w-4 accent-emerald-700"
              />
              Target Size Compression
            </label>
            {targetMode && (
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="grid grid-cols-3 gap-2">
                  {targetPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetSizeKB(preset)}
                      className={`rounded-lg border px-2 py-2 text-xs font-black ${
                        targetSizeKB === preset ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      {preset} KB
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    min={50}
                    max={20000}
                    value={targetSizeKB}
                    onChange={(event) => setTargetSizeKB(Math.max(50, Number(event.target.value) || 50))}
                    className="w-24 bg-transparent py-2 text-xs font-black outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500">KB</span>
                </label>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
            <input
              type="checkbox"
              checked={forceRasterize}
              onChange={(event) => setForceRasterize(event.target.checked)}
              className="h-4 w-4 accent-amber-700"
            />
            Extreme, Ultra, Maximum, and Under 100 KB modes rasterize automatically. Use Recommended or Small Size to preserve selectable text.
          </label>

          {compressing && (
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
            onClick={handleCompress}
            disabled={compressing}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {compressing ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              'Compress PDF'
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-700" />
          <p className="text-xs font-semibold text-amber-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Original Size" value={formatFileSize(result.originalSize)} />
            <Stat label="Compressed Size" value={formatFileSize(result.compressedSize)} strong />
            <Stat label="Reduction" value={`${result.reduction.toFixed(1)}%`} strong />
            <Stat label="Pages" value={String(result.pages)} />
            <Stat label="Level" value={result.level} />
            <Stat label="DPI Used" value={result.dpi ? String(result.dpi) : 'Not rasterized'} />
            <Stat label="Image Quality" value={result.quality ? result.quality.toFixed(2) : 'Original'} />
            <Stat label="Text Preserved?" value={result.textPreserved ? 'Yes' : 'No'} />
            <Stat label="Rasterized?" value={result.rasterized ? 'Yes' : 'No'} />
            <Stat label="Processing Time" value={`${(result.processingTimeMs / 1000).toFixed(1)}s`} />
            <Stat label="Target" value={result.targetAchieved === undefined ? 'Not set' : result.targetAchieved ? 'Achieved' : 'Best readable'} />
          </div>

          {previewUrl && (
            <iframe title="Compressed PDF preview" src={previewUrl} className="mb-3 h-72 w-full rounded-lg border border-emerald-200 bg-white" />
          )}

          <div className="flex flex-wrap gap-2">
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
              onClick={handleResetResult}
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

function Stat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/80 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 text-xs font-black ${strong ? 'text-emerald-800' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}
