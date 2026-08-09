import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelPreviewProps {
  file: File;
  onClose?: () => void;
  onDownload?: () => void;
  className?: string;
}

interface SheetData {
  name: string;
  data: (string | number)[][];
  headers: string[];
}

export function ExcelPreview({ file, onClose, onDownload, className = '' }: ExcelPreviewProps) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let url: string | null = null;

    const loadExcel = async () => {
      try {
        setLoading(true);
        setError(null);

        url = URL.createObjectURL(file);
        setFallbackUrl(url);

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const sheetData: SheetData[] = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
          
          if (jsonData.length === 0) {
            return { name: sheetName, data: [], headers: [] };
          }

          const headers = jsonData[0] as string[];
          const data = jsonData.slice(1);

          return { name: sheetName, data, headers };
        });

        if (mounted) {
          setSheets(sheetData);
          setCurrentSheetIndex(0);
        }
      } catch (err) {
        console.error('Error loading Excel:', err);
        if (mounted) {
          setError('Failed to load spreadsheet. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadExcel();

    return () => {
      mounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
      setFallbackUrl(null);
    };
  }, [file]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onDownload) onDownload();
  };

  const currentSheet = sheets[currentSheetIndex];

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
        <div className="flex items-center gap-2">
          {sheets.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentSheetIndex(Math.max(0, currentSheetIndex - 1))}
                disabled={currentSheetIndex === 0 || loading}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-900">
                {currentSheet?.name || 'Sheet'} ({currentSheetIndex + 1}/{sheets.length})
              </span>
              <button
                type="button"
                onClick={() => setCurrentSheetIndex(Math.min(sheets.length - 1, currentSheetIndex + 1))}
                disabled={currentSheetIndex === sheets.length - 1 || loading}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          {sheets.length === 1 && (
            <span className="text-sm font-semibold text-slate-900">{currentSheet?.name || 'Sheet'}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-semibold text-slate-600">Loading spreadsheet...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700">
              <p>{error}</p>
              {fallbackUrl && (
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-red-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              )}
            </div>
          </div>
        )}

        {!loading && !error && currentSheet && (
          <div className="overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {currentSheet.headers.map((header, index) => (
                    <th
                      key={index}
                      className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-900"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentSheet.data.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border border-slate-300 px-3 py-2 text-slate-700"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {currentSheet.data.length === 0 && (
              <div className="flex h-32 items-center justify-center text-slate-500">
                This sheet is empty
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
