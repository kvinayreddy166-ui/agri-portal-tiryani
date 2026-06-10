import React, { useState } from 'react';
import { Download, RefreshCw, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { mergePdfs } from '../../utils/pdfHelpers';
import { downloadBlob, formatFileSize, validateFileSize, validateFileType } from '../../utils/fileCleanup';

export function PdfMergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file
    const typeValidation = validateFileType(selectedFile, ['application/pdf']);
    if (!typeValidation.valid) {
      setError(typeValidation.error || 'Invalid file type');
      return;
    }

    const sizeValidation = validateFileSize(selectedFile, 20);
    if (!sizeValidation.valid) {
      setError(sizeValidation.error || 'File size exceeds limit');
      return;
    }

    setError(null);
    setFiles([...files, selectedFile]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
    setFiles(newFiles);
    setResult(null);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
    setResult(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge.');
      return;
    }

    setMerging(true);
    setError(null);

    try {
      const mergedBlob = await mergePdfs(files);
      setResult(mergedBlob);
    } catch (err) {
      console.error('Merge error:', err);
      setError('Failed to merge PDFs. Please try again.');
    } finally {
      setMerging(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadBlob(result, 'Merged.pdf');
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-black text-slate-900">Merge PDF</h3>
        <p className="mb-3 text-xs font-semibold text-slate-600">
          Combine multiple PDF files into a single document
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files || []);
            selectedFiles.forEach(handleFileSelect);
            e.target.value = '';
          }}
          disabled={merging}
          className="w-full text-xs font-semibold text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1 file:text-xs file:font-black file:text-emerald-800 hover:file:bg-emerald-100 disabled:opacity-50"
        />
        <p className="mt-2 text-xs font-semibold text-slate-600">
          Select multiple PDF files to merge (max 20 MB each)
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-slate-600">
              Selected Files ({files.length})
            </p>
            <button
              type="button"
              onClick={handleReset}
              disabled={merging}
              className="rounded-lg border border-red-200 px-2 py-1 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{file.name}</p>
                  <p className="text-[10px] font-semibold text-slate-600">{formatFileSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || merging}
                    className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === files.length - 1 || merging}
                    className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    disabled={merging}
                    className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleMerge}
            disabled={files.length < 2 || merging}
            className="mt-3 w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {merging ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Merging...
              </span>
            ) : (
              'Merge PDFs'
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-600">Merge Complete</p>
            <p className="text-sm font-black text-emerald-800">
              Successfully merged {files.length} PDF files
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              Download Merged PDF
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
