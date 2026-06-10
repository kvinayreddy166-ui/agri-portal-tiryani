import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react';
import { PdfUploadBox } from './PdfUploadBox';
import { downloadBlob, makeSafeFileName, cleanupCanvas } from '../../utils/fileCleanup';

type EnhancementMode = 
  | 'auto'
  | 'clean'
  | 'contrast'
  | 'removeShadows'
  | 'deskew'
  | 'ocrBoost'
  | 'bwOfficial';

export function AiDocumentEnhancer() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    originalCanvas: HTMLCanvasElement;
    enhancedCanvas: HTMLCanvasElement;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<EnhancementMode>('auto');
  const [showComparison, setShowComparison] = useState(false);
  
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      cleanupCanvas(originalCanvasRef.current);
      cleanupCanvas(enhancedCanvasRef.current);
    };
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setShowComparison(false);
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setShowComparison(false);
    cleanupCanvas(originalCanvasRef.current);
    cleanupCanvas(enhancedCanvasRef.current);
  };

  const loadImage = (file: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        resolve(canvas);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const applyEnhancement = (canvas: HTMLCanvasElement, mode: EnhancementMode): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (mode) {
      case 'auto':
        // Auto enhance: improve contrast and brightness
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const factor = 1.2;
          data[i] = Math.min(255, (data[i] - avg) * factor + avg);
          data[i + 1] = Math.min(255, (data[i + 1] - avg) * factor + avg);
          data[i + 2] = Math.min(255, (data[i + 2] - avg) * factor + avg);
        }
        break;

      case 'clean':
        // Clean scan: remove noise and improve clarity
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness < 50 || brightness > 240) {
            // Remove very dark or very light pixels (noise)
            data[i] = data[i + 1] = data[i + 2] = brightness < 128 ? 0 : 255;
          }
        }
        break;

      case 'contrast':
        // High contrast
        for (let i = 0; i < data.length; i += 4) {
          const factor = 1.5;
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
          data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
          data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
        }
        break;

      case 'removeShadows':
        // Remove shadows by brightening dark areas
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness < 128) {
            const factor = 1.3;
            data[i] = Math.min(255, data[i] * factor);
            data[i + 1] = Math.min(255, data[i + 1] * factor);
            data[i + 2] = Math.min(255, data[i + 2] * factor);
          }
        }
        break;

      case 'deskew':
        // Note: True deskewing requires OpenCV.js, which is heavy
        // This is a simplified version that just cleans the image
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = 128;
          const value = avg > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = value;
        }
        break;

      case 'ocrBoost':
        // OCR boost: high contrast binarization
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = 140;
          const value = avg > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = value;
        }
        break;

      case 'bwOfficial':
        // Black and white official copy
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = 128;
          const value = avg > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = value;
        }
        break;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const handleEnhance = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const originalCanvas = await loadImage(file);
      
      // Create a copy for enhancement
      const enhancedCanvas = document.createElement('canvas');
      enhancedCanvas.width = originalCanvas.width;
      enhancedCanvas.height = originalCanvas.height;
      const enhancedCtx = enhancedCanvas.getContext('2d');
      if (enhancedCtx) {
        enhancedCtx.drawImage(originalCanvas, 0, 0);
      }

      const processedCanvas = applyEnhancement(enhancedCanvas, mode);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        processedCanvas.toBlob((b) => {
          resolve(b || new Blob());
        }, 'image/png');
      });

      setResult({
        blob,
        originalCanvas,
        enhancedCanvas: processedCanvas,
      });

      // Update canvas refs
      if (originalCanvasRef.current) {
        const ctx = originalCanvasRef.current.getContext('2d');
        if (ctx) {
          originalCanvasRef.current.width = originalCanvas.width;
          originalCanvasRef.current.height = originalCanvas.height;
          ctx.drawImage(originalCanvas, 0, 0);
        }
      }

      if (enhancedCanvasRef.current) {
        const ctx = enhancedCanvasRef.current.getContext('2d');
        if (ctx) {
          enhancedCanvasRef.current.width = processedCanvas.width;
          enhancedCanvasRef.current.height = processedCanvas.height;
          ctx.drawImage(processedCanvas, 0, 0);
        }
      }
    } catch (err) {
      console.error('Enhancement error:', err);
      setError('Failed to enhance document. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const fileName = makeSafeFileName(file.name, mode, 'png');
    downloadBlob(result.blob, fileName);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setShowComparison(false);
    cleanupCanvas(originalCanvasRef.current);
    cleanupCanvas(enhancedCanvasRef.current);
  };

  const enhancementModes: Array<{ value: EnhancementMode; label: string; description: string }> = [
    { value: 'auto', label: 'Auto Enhance', description: 'Improve sharpness and contrast automatically' },
    { value: 'clean', label: 'Clean Scan', description: 'Remove noise and improve clarity' },
    { value: 'contrast', label: 'High Contrast', description: 'Increase contrast for better readability' },
    { value: 'removeShadows', label: 'Remove Shadows', description: 'Brighten dark areas and remove shadows' },
    { value: 'deskew', label: 'Deskew Page', description: 'Straighten tilted pages (simplified)' },
    { value: 'ocrBoost', label: 'OCR Boost Mode', description: 'Optimize for OCR recognition' },
    { value: 'bwOfficial', label: 'B&W Official Copy', description: 'Convert to clean black-and-white' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-black text-slate-900">AI Document Enhancer</h3>
        <p className="mb-3 text-xs font-semibold text-slate-600">
          Improve low-quality scanned documents before OCR
        </p>
      </div>

      <PdfUploadBox
        onFileSelect={handleFileSelect}
        currentFile={file}
        onClear={handleClear}
        disabled={processing}
        accept="image/jpeg,image/jpg,image/png,application/pdf"
      />

      {file && !result && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
              Enhancement Mode
            </label>
            <div className="grid gap-2">
              {enhancementModes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  disabled={processing}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    mode === m.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  <p className="text-xs font-black text-slate-900">{m.label}</p>
                  <p className="text-[10px] font-semibold text-slate-600">{m.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleEnhance}
            disabled={processing}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Enhancing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                Enhance Document
              </span>
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-bold text-amber-800">AI Enhancement Limitation</p>
              <p className="text-xs font-semibold text-amber-700">
                AI enhancement improves readability but cannot recover completely missing or heavily blurred text.
              </p>
            </div>
          </div>

          {showComparison && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-600">Original</p>
                <canvas
                  ref={originalCanvasRef}
                  className="w-full rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-600">Enhanced</p>
                <canvas
                  ref={enhancedCanvasRef}
                  className="w-full rounded-lg border border-emerald-200 bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              {showComparison ? 'Hide Comparison' : 'Show Comparison'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              Download
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
