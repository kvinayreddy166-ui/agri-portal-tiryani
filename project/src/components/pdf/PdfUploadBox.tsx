import React, { useCallback, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { validateFileSize, validateFileType, formatFileSize } from '../../utils/fileCleanup';

interface PdfUploadBoxProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  currentFile?: File | null;
  onClear?: () => void;
  disabled?: boolean;
}

export function PdfUploadBox({
  onFileSelect,
  accept = 'application/pdf,image/jpeg,image/jpg,image/png',
  maxSizeMB = 20,
  multiple = false,
  currentFile,
  onClear,
  disabled = false,
}: PdfUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = accept.split(',').map(t => t.trim());

  const validateFile = useCallback((file: File): boolean => {
    // Validate file type
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

    setError(null);
    return true;
  }, [allowedTypes, maxSizeMB]);

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
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
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setError(null);
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  if (currentFile) {
    const isImage = currentFile.type.startsWith('image/');
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              {isImage ? (
                <ImageIcon className="h-5 w-5 text-emerald-700" />
              ) : (
                <FileText className="h-5 w-5 text-emerald-700" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{currentFile.name}</p>
              <p className="text-xs font-semibold text-slate-600">{formatFileSize(currentFile.size)}</p>
            </div>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
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
            Drop file here or click to upload
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
        <p>Files are processed temporarily only. This app does not store your documents.</p>
      </div>
    </div>
  );
}
