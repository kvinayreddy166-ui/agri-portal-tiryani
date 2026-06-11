import React, { useEffect, useState } from 'react';
import { Copy, Download, Eye, RefreshCw, FileText, File } from 'lucide-react';
import { PdfUploadBox } from './PdfUploadBox';
import { PdfPreview } from './PdfPreview';
import { performOcr, performOcrOnPdf, formatOcrText } from '../../utils/ocrHelpers';
import { createDocxFromStructuredText, downloadDocx } from '../../utils/docxHelpers';
import { cleanupObjectUrl, makeSafeFileName, formatFileSize, downloadBlob } from '../../utils/fileCleanup';

export function OcrPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ status: string; progress: number }>({ status: '', progress: 0 });
  const [result, setResult] = useState<{
    text: string;
    confidence: number;
    docxBlob?: Blob;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => () => cleanupObjectUrl(imagePreviewUrl || undefined), [imagePreviewUrl]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setProgress({ status: '', progress: 0 });
    setShowPreview(false);
    cleanupObjectUrl(imagePreviewUrl || undefined);
    setImagePreviewUrl(selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null);
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress({ status: '', progress: 0 });
    setShowPreview(false);
    cleanupObjectUrl(imagePreviewUrl || undefined);
    setImagePreviewUrl(null);
  };

  const handleOcr = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress({ status: 'Initializing OCR...', progress: 0 });

    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const ocrResult = isPdf
        ? await performOcrOnPdf(file, setProgress)
        : await performOcr(file, 'eng', setProgress);

      const formattedText = formatOcrText(ocrResult.text);
      
      // Create DOCX
      const docxBlob = await createDocxFromStructuredText(formattedText, {
        title: file.name.replace('.pdf', ''),
        date: new Date().toLocaleDateString('en-IN'),
      });

      setResult({
        text: formattedText,
        confidence: ocrResult.confidence,
        docxBlob,
      });
    } catch (err) {
      console.error('OCR error:', err);
      setError('Failed to perform OCR. Please try again.');
    } finally {
      setProcessing(false);
      setProgress({ status: '', progress: 0 });
    }
  };

  const handleCopyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result || !file) return;
    const fileName = makeSafeFileName(file.name, 'OCR_Text', 'txt');
    const blob = new Blob([result.text], { type: 'text/plain' });
    downloadBlob(blob, fileName);
  };

  const handleDownloadDocx = () => {
    if (!result?.docxBlob || !file) return;
    const fileName = makeSafeFileName(file.name, 'OCR', 'docx');
    downloadDocx(result.docxBlob, fileName);
  };

  const handleDownloadSource = () => {
    if (!file) return;
    const extension = file.name.split('.').pop() || (file.type.startsWith('image/') ? 'png' : 'pdf');
    downloadBlob(file, makeSafeFileName(file.name, 'source', extension));
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-black text-slate-900">OCR Text Extraction</h3>
        <p className="mb-3 text-xs font-semibold text-slate-600">
          Extract text from scanned PDFs with high-resolution page rendering and contrast cleanup.
        </p>
      </div>

      <PdfUploadBox
        onFileSelect={handleFileSelect}
        currentFile={file}
        onClear={handleClear}
        disabled={processing}
        accept="application/pdf,image/jpeg,image/jpg,image/png"
      />

      {file && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
          <button
            type="button"
            onClick={() => setShowPreview((value) => !value)}
            disabled={processing}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'Preview Source'}
          </button>
          <button
            type="button"
            onClick={handleDownloadSource}
            disabled={processing}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download Source
          </button>
        </div>
      )}

      {file && showPreview && (
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
          ? <PdfPreview file={file} className="h-[520px]" />
          : imagePreviewUrl && <img src={imagePreviewUrl} alt="OCR source preview" className="max-h-[520px] w-full rounded-lg border border-slate-200 object-contain" />
      )}

      {file && !result && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
            English OCR mode uses 2.75x rendering, grayscale contrast boost, and page-by-page extraction for better accuracy.
          </div>

          {processing && progress.progress > 0 && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{progress.status}</span>
                <span className="text-xs font-black text-slate-900">{Math.round(progress.progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleOcr}
            disabled={processing}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing OCR...
              </span>
            ) : (
              'Start OCR'
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Confidence</p>
              <p className="text-sm font-black text-emerald-800">{result.confidence.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">File Size</p>
              <p className="text-sm font-black text-slate-900">{formatFileSize(file?.size || 0)}</p>
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Extracted Text</p>
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                <Copy className="h-3 w-3" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              value={result.text}
              readOnly
              className="h-48 w-full rounded-lg border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              Download TXT
            </button>
            <button
              type="button"
              onClick={handleDownloadDocx}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <File className="h-4 w-4" />
              Download DOCX
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
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
