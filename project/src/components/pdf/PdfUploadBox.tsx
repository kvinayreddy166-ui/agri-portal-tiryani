import React, { useCallback, useState } from 'react';
import { CalendarDays, FileText, Image as ImageIcon, RotateCcw, Upload, X } from 'lucide-react';
import { validateFileSize, validateFileType, formatFileSize } from '../../utils/fileCleanup';
import { formatPdfDate, PdfInfo, validatePdf } from '../../utils/pdfHelpers';

interface PdfUploadBoxProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  currentFile?: File | null;
  onClear?: () => void;
  disabled?: boolean;
  onInfo?: (info: PdfInfo) => void;
}

export function PdfUploadBox({
  onFileSelect,
  accept = 'application/pdf,image/jpeg,image/jpg,image/png',
  maxSizeMB = 20,
  multiple = false,
  currentFile,
  onClear,
  disabled = false,
  onInfo,
}: PdfUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [validating, setValidating] = useState(false);

  const allowedTypes = accept.split(',').map(t => t.trim());

  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    const typeValidation = validateFileType(file, allowedTypes);
    if (!typeValidation.valid) {
      setError(typeValidation.error || 'Invalid file type');
      return false;
    }

    // Validate file size
    const sizeValidation = validateFileSize(file, maxSizeMB);
    if (!sizeValidation.valid) {
      setError(sizeValidation.error || 'File size exceeds limit');
      return false;
    }

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setValidating(true);
      try {
        const info = await validatePdf(file);
        setPdfInfo(info);
        onInfo?.(info);
      } catch (validationError) {
        setPdfInfo(null);
        setError(validationError instanceof Error ? validationError.message : 'This PDF could not be validated.');
        setValidating(false);
        return false;
      }
      setValidating(false);
    } else {
      setPdfInfo(null);
    }

    setError(null);
    return true;
  }, [allowedTypes, maxSizeMB, onInfo]);

  const handleFile = useCallback(async (file: File) => {
    if (await validateFile(file)) {
      onFileSelect(file);
    }
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      void handleFile(files[0]);
    }
    e.target.value = '';
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setError(null);
    setPdfInfo(null);
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  if (currentFile) {
    const isImage = currentFile.type.startsWith('image/');
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              {isImage ? (
                <ImageIcon className="h-5 w-5 text-emerald-700" />
              ) : (
                <FileText className="h-5 w-5 text-emerald-700" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{currentFile.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-700">
                <span className="rounded bg-white/80 px-2 py-1">{formatFileSize(currentFile.size)}</span>
                {pdfInfo && <span className="rounded bg-white/80 px-2 py-1">{pdfInfo.pageCount} pages</span>}
                {pdfInfo && <span className="rounded bg-white/80 px-2 py-1">{pdfInfo.hasText ? 'Text PDF' : 'Scanned PDF'}</span>}
              </div>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                <CalendarDays className="h-3 w-3" />
                Last modified {formatPdfDate(currentFile)}
              </p>
            </div>
          </div>
          {onClear && (
            <div className="flex shrink-0 gap-1">
              <label className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 has-[:disabled]:opacity-50" title="Replace file">
                <RotateCcw className="h-4 w-4" />
                <input type="file" accept={accept} className="hidden" disabled={disabled} onChange={handleFileInput} />
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                disabled={disabled}
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-emerald-100 p-3">
            <Upload className="h-6 w-6 text-emerald-700" />
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {validating ? 'Checking PDF...' : 'Drop file here or click to upload'}
          </p>
          <p className="text-xs font-semibold text-slate-600">
            PDF, JPG, JPEG, PNG (max {maxSizeMB} MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
        <p className="font-black text-emerald-800">Privacy Note:</p>
        <p>Files are processed temporarily and are not stored.</p>
      </div>
    </div>
  );
}
