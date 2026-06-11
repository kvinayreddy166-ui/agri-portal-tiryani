import React, { useState } from 'react';
import { Download, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { PdfUploadBox } from './PdfUploadBox';
import { PdfPreview } from './PdfPreview';
import { extractTextFromPdf, getPdfInfo } from '../../utils/pdfHelpers';
import { performOcrOnPdf, formatOcrText } from '../../utils/ocrHelpers';
import { createDocxFromText, downloadDocx } from '../../utils/docxHelpers';
import { downloadBlob, makeSafeFileName, formatFileSize } from '../../utils/fileCleanup';

export function PdfToDocTool() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<{
    docxBlob: Blob;
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanned, setIsScanned] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState('');

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setIsScanned(false);
    setShowPreview(false);
    setProgress('');

    try {
      const pdfInfo = await getPdfInfo(selectedFile);
      if (!pdfInfo.hasText) {
        setIsScanned(true);
        setError('This appears to be a scanned PDF. OCR is required to extract text.');
      }
    } catch (err) {
      console.error('Error checking PDF:', err);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setIsScanned(false);
    setShowPreview(false);
    setProgress('');
  };

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);

    try {
      const text = isScanned
        ? formatOcrText((await performOcrOnPdf(file, (state) => setProgress(state.status))).text)
        : await extractTextFromPdf(file);
      
      if (!text || text.trim().length === 0) {
        setError('No text found in PDF. Please use OCR Text Extraction for scanned documents.');
        setConverting(false);
        return;
      }

      const docxBlob = await createDocxFromText(text, file.name.replace('.pdf', ''));
      
      setResult({
        docxBlob,
        text,
      });
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert PDF to DOCX. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const fileName = makeSafeFileName(file.name, 'converted', 'docx');
    downloadDocx(result.docxBlob, fileName);
  };

  const handleSourceDownload = () => {
    if (!file) return;
    downloadBlob(file, makeSafeFileName(file.name, 'source', 'pdf'));
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-black text-slate-900">PDF to Word/DOCX</h3>
        <p className="mb-3 text-xs font-semibold text-slate-600">
          Convert selectable text PDF to editable DOCX document
        </p>
      </div>

      <PdfUploadBox
        onFileSelect={handleFileSelect}
        currentFile={file}
        onClear={handleClear}
        disabled={converting}
        accept="application/pdf"
      />

      {file && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
          <button
            type="button"
            onClick={() => setShowPreview((value) => !value)}
            disabled={converting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'Preview PDF'}
          </button>
          <button
            type="button"
            onClick={handleSourceDownload}
            disabled={converting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download Source
          </button>
        </div>
      )}

      {file && showPreview && (
        <PdfPreview file={file} className="h-[520px]" />
      )}

      {file && !result && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          {isScanned && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-700" />
              <div>
                <p className="text-xs font-bold text-amber-800">Scanned PDF Detected</p>
                <p className="text-xs font-semibold text-amber-700">
                  This appears to be a scanned PDF. It will be converted with OCR.
                </p>
              </div>
            </div>
          )}
          {progress && (
            <p className="mt-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800">
              {progress}
            </p>
          )}
          <button
            type="button"
            onClick={handleConvert}
            disabled={converting}
            className="mt-3 w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {converting ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Converting...
              </span>
            ) : (
              isScanned ? 'Convert with OCR to DOCX' : 'Convert to DOCX'
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-600">Original File</p>
            <p className="text-sm font-black text-slate-900">{file?.name}</p>
            <p className="text-xs font-semibold text-slate-600">{formatFileSize(file?.size || 0)}</p>
          </div>

          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-600">Extracted Text</p>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
              <p className="text-xs font-semibold text-slate-700 whitespace-pre-wrap">
                {result.text.substring(0, 500)}
                {result.text.length > 500 && '...'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-700" />
              <p className="text-xs font-semibold text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              Download DOCX
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
