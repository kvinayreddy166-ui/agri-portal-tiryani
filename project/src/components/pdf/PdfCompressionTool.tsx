import React, { useState } from 'react';
import { Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { PdfUploadBox } from './PdfUploadBox';
import { compressPdf } from '../../utils/pdfHelpers';
import { downloadBlob, makeSafeFileName, formatFileSize, cleanupObjectUrl } from '../../utils/fileCleanup';

export function PdfCompressionTool() {
  const [file, setFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    originalSize: number;
    compressedSize: number;
    reduction: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetSize, setTargetSize] = useState<'100KB' | '2MB'>('2MB');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    if (previewUrl) {
      cleanupObjectUrl(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (previewUrl) {
      cleanupObjectUrl(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setCompressing(true);
    setError(null);

    try {
      const targetKB = targetSize === '100KB' ? 100 : 2048;
      const compressionResult = await compressPdf(file, targetKB);
      
      setResult(compressionResult);
      
      // Create preview URL
      const url = URL.createObjectURL(compressionResult.blob);
      setPreviewUrl(url);

      // Check if target was achieved
      const targetBytes = targetKB * 1024;
      if (compressionResult.compressedSize > targetBytes) {
        setError(
          'Best possible compression completed. Target size could not be achieved without severe quality loss.'
        );
      }
    } catch (err) {
      console.error('Compression error:', err);
      setError('Failed to compress PDF. Please try again.');
    } finally {
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const fileName = makeSafeFileName(file.name, `compressed_${targetSize}`, 'pdf');
    downloadBlob(result.blob, fileName);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    if (previewUrl) {
      cleanupObjectUrl(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-black text-slate-900">Compress PDF</h3>
        <p className="mb-3 text-xs font-semibold text-slate-600">
          Reduce PDF file size while maintaining readability
        </p>
      </div>

      <PdfUploadBox
        onFileSelect={handleFileSelect}
        currentFile={file}
        onClear={handleClear}
        disabled={compressing}
      />

      {file && !result && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
              Target Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetSize('100KB')}
                disabled={compressing}
                className={`rounded-lg border px-3 py-2 text-xs font-black transition-colors ${
                  targetSize === '100KB'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                Below 100 KB
              </button>
              <button
                type="button"
                onClick={() => setTargetSize('2MB')}
                disabled={compressing}
                className={`rounded-lg border px-3 py-2 text-xs font-black transition-colors ${
                  targetSize === '2MB'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                Below 2 MB
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCompress}
            disabled={compressing}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {compressing ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Compressing...
              </span>
            ) : (
              'Compress PDF'
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Original</p>
              <p className="text-sm font-black text-slate-900">{formatFileSize(result.originalSize)}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Compressed</p>
              <p className="text-sm font-black text-emerald-800">{formatFileSize(result.compressedSize)}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Reduction</p>
              <p className="text-sm font-black text-emerald-800">{result.reduction.toFixed(1)}%</p>
            </div>
          </div>

          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-700" />
              <p className="text-xs font-semibold text-amber-800">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              Download
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
