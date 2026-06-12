import { PDFDocument } from 'pdf-lib';

export type PdfKind = 'text' | 'scanned';
export type CompressionLevel = 'recommended' | 'small' | 'extreme' | 'ultra' | 'maximum' | 'extreme100';
export type ColorMode = 'color' | 'grayscale' | 'bw';

export interface PdfInfo {
  pageCount: number;
  size: number;
  hasText: boolean;
  kind: PdfKind;
}

export interface CompressionOptions {
  level: CompressionLevel;
  colorMode: ColorMode;
  targetSizeKB?: number;
  forceRasterize?: boolean;
  enhance?: boolean;
  onProgress?: (message: string, percent: number) => void;
}

export interface CompressionStats {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  reduction: number;
  level: string;
  dpi: number | null;
  quality: number | null;
  textPreserved: boolean;
  rasterized: boolean;
  pages: number;
  processingTimeMs: number;
  targetAchieved?: boolean;
  warning?: string;
}

interface RasterPreset {
  label: string;
  dpi: number;
  quality: number;
}

const RASTER_PRESETS: Record<CompressionLevel, RasterPreset> = {
  recommended: { label: 'Recommended', dpi: 150, quality: 0.7 },
  small: { label: 'Small Size', dpi: 120, quality: 0.5 },
  extreme: { label: 'Extreme', dpi: 82, quality: 0.28 },
  ultra: { label: 'Ultra Extreme', dpi: 58, quality: 0.16 },
  maximum: { label: 'Maximum Compression', dpi: 34, quality: 0.08 },
  extreme100: { label: 'Under 100 KB', dpi: 30, quality: 0.06 },
};

const TARGET_READABLE_PRESETS: RasterPreset[] = [
  { label: 'Target 150 DPI', dpi: 150, quality: 0.68 },
  { label: 'Target 120 DPI', dpi: 120, quality: 0.5 },
  { label: 'Target 96 DPI', dpi: 96, quality: 0.35 },
  { label: 'Target 72 DPI', dpi: 72, quality: 0.25 },
  { label: 'Target 50 DPI', dpi: 50, quality: 0.15 },
  { label: 'Target 40 DPI', dpi: 40, quality: 0.1 },
  { label: 'Target 32 DPI', dpi: 32, quality: 0.07 },
  { label: 'Target 24 DPI', dpi: 24, quality: 0.05 },
];

const RASTERIZING_LEVELS = new Set<CompressionLevel>(['extreme', 'ultra', 'maximum', 'extreme100']);

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
  return pdfjs;
}

function copyBuffer(buffer: ArrayBuffer) {
  return new Uint8Array(buffer.slice(0));
}

function isPdfComputedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  const normalized = message.toLowerCase().replace(/\s+/g, '');
  return normalized.includes('getorinsert') || normalized.includes('getorinsertcomputed');
}

function tryFlattenForm(pdfDoc: PDFDocument) {
  try {
    const form = pdfDoc.getForm();
    form.flatten({ updateFieldAppearances: false });
  } catch {
    // Some PDFs do not have AcroForm data or contain malformed form dictionaries.
  }
}

async function savePdfSafely(pdfDoc: PDFDocument, options: { useObjectStreams?: boolean; addDefaultPage?: boolean } = {}) {
  try {
    return await pdfDoc.save({
      useObjectStreams: options.useObjectStreams ?? true,
      addDefaultPage: options.addDefaultPage,
      updateFieldAppearances: false,
    });
  } catch (error) {
    if (!isPdfComputedError(error)) throw error;
    tryFlattenForm(pdfDoc);
    try {
      return await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: options.addDefaultPage,
        updateFieldAppearances: false,
      });
    } catch (fallbackError) {
      if (!isPdfComputedError(fallbackError)) throw fallbackError;
      throw new Error('This PDF has incompatible form data. Flatten the form fields or use scanned PDF optimization, then try again.');
    }
  }
}

export async function validatePdf(file: File): Promise<PdfInfo> {
  if (!file) throw new Error('Please select a PDF file.');
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF files are supported in this tool.');
  }
  if (file.size === 0) throw new Error('This PDF is empty.');

  const arrayBuffer = await file.arrayBuffer();
  try {
    const pdfDoc = await PDFDocument.load(copyBuffer(arrayBuffer), { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    if (pageCount < 1) throw new Error('This PDF does not contain any pages.');

    const text = await extractPdfText(file, 3);
    const hasText = text.trim().length > 20;
    return { pageCount, size: file.size, hasText, kind: hasText ? 'text' : 'scanned' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The PDF could not be opened.';
    throw new Error(message.includes('encrypted') ? 'Password protected PDFs are not supported.' : message);
  }
}

export const getPdfInfo = validatePdf;

export function formatPdfDate(file: File) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(file.lastModified));
}

export async function compressTextPdf(
  file: File,
  onProgress?: CompressionOptions['onProgress']
): Promise<CompressionStats> {
  const started = performance.now();
  onProgress?.('Cleaning metadata and unused objects', 20);
  const original = await file.arrayBuffer();
  const source = await PDFDocument.load(copyBuffer(original), { ignoreEncryption: true });
  tryFlattenForm(source);
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, source.getPageIndices());
  pages.forEach((page) => output.addPage(page));

  output.setTitle('');
  output.setAuthor('');
  output.setSubject('');
  output.setKeywords([]);
  output.setProducer('Tiryani Agriculture PDF Tools');
  output.setCreator('Tiryani Agriculture PDF Tools');
  output.setCreationDate(new Date(0));
  output.setModificationDate(new Date(0));

  onProgress?.('Rebuilding optimized PDF streams', 75);
  const bytes = await savePdfSafely(output, { useObjectStreams: true, addDefaultPage: false });
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return buildStats(blob, file.size, source.getPageCount(), 'Text PDF cleanup', null, null, true, false, started);
}

export async function compressScannedPdf(
  file: File,
  options: CompressionOptions
): Promise<CompressionStats> {
  const preset = RASTER_PRESETS[options.level];
  return rasterizePdf(file, {
    label: preset.label,
    dpi: preset.dpi,
    quality: preset.quality,
    colorMode: options.colorMode,
    enhance: options.enhance,
    onProgress: options.onProgress,
  });
}

export async function compressPdf(file: File, optionsOrTarget: CompressionOptions | number): Promise<CompressionStats> {
  const options: CompressionOptions =
    typeof optionsOrTarget === 'number'
      ? {
          level: optionsOrTarget <= 100 ? 'extreme100' : 'recommended',
          colorMode: optionsOrTarget <= 100 ? 'grayscale' : 'color',
          targetSizeKB: optionsOrTarget,
          forceRasterize: optionsOrTarget <= 100,
        }
      : optionsOrTarget;

  if (options.targetSizeKB) {
    return targetSizeCompression(file, options.targetSizeKB, options);
  }

  const info = await validatePdf(file);
  if (info.kind === 'text' && !options.forceRasterize && !RASTERIZING_LEVELS.has(options.level)) {
    try {
      return await compressTextPdf(file, options.onProgress);
    } catch (error) {
      if (!isPdfComputedError(error)) throw error;
      options.onProgress?.('PDF has incompatible form data. Rebuilding pages safely.', 35);
      return compressScannedPdf(file, { ...options, forceRasterize: true });
    }
  }
  return compressScannedPdf(file, options);
}

export async function targetSizeCompression(
  file: File,
  targetSizeKB: number,
  options: CompressionOptions
): Promise<CompressionStats> {
  const targetBytes = targetSizeKB * 1024;
  const started = performance.now();
  let best: CompressionStats | null = null;

  try {
    const textPass = await compressTextPdf(file, options.onProgress);
    best = textPass;
    if (!options.forceRasterize && textPass.compressedSize <= targetBytes) {
      return { ...textPass, targetAchieved: true, level: `Target ${targetSizeKB} KB` };
    }
  } catch (error) {
    if (!isPdfComputedError(error)) throw error;
    options.onProgress?.('PDF has incompatible form data. Trying raster compression.', 30);
  }

  for (let index = 0; index < TARGET_READABLE_PRESETS.length; index += 1) {
    const preset = targetSizeKB <= 100 && index < 2 ? TARGET_READABLE_PRESETS[index + 2] : TARGET_READABLE_PRESETS[index];
    if (!preset) continue;
    const result = await rasterizePdf(file, {
      label: targetSizeKB <= 100 ? 'Under 100 KB' : preset.label,
      dpi: preset.dpi,
      quality: targetSizeKB <= 100 ? Math.min(preset.quality, 0.12) : preset.quality,
      colorMode: targetSizeKB <= 200 ? 'bw' : options.colorMode,
      enhance: options.enhance,
      onProgress: (message, percent) => {
        const roundProgress = Math.round((index / TARGET_READABLE_PRESETS.length) * 100 + percent / TARGET_READABLE_PRESETS.length);
        options.onProgress?.(message, Math.min(roundProgress, 98));
      },
    });
    if (!best || result.compressedSize < best.compressedSize) best = result;
    if (result.compressedSize <= targetBytes) {
      return {
        ...result,
        targetAchieved: true,
        processingTimeMs: performance.now() - started,
      };
    }
  }

  return {
    ...(best as CompressionStats),
    targetAchieved: false,
    processingTimeMs: performance.now() - started,
    warning: 'Target size could not be achieved without making the document unreadable.',
  };
}

export async function enhanceScannedPdf(
  file: File,
  mode: ColorMode,
  onProgress?: CompressionOptions['onProgress']
): Promise<CompressionStats> {
  return rasterizePdf(file, {
    label: 'Enhanced scanned PDF',
    dpi: 150,
    quality: 0.78,
    colorMode: mode,
    enhance: true,
    onProgress,
  });
}

async function rasterizePdf(
  file: File,
  options: RasterPreset & {
    colorMode: ColorMode;
    enhance?: boolean;
    onProgress?: CompressionOptions['onProgress'];
  }
): Promise<CompressionStats> {
  const started = performance.now();
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: copyBuffer(arrayBuffer), useWorkerFetch: false }).promise;
  const output = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    options.onProgress?.(`Page ${pageNumber}/${pdf.numPages}`, Math.round(((pageNumber - 1) / pdf.numPages) * 90));
    const page = await pdf.getPage(pageNumber);
    const viewportAtOne = page.getViewport({ scale: 1 });
    const scale = Math.max(0.1, options.dpi / 72);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas rendering is not available in this browser.');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    processCanvas(canvas, options.colorMode, Boolean(options.enhance));

    const encoded = await encodePageImage(canvas, options.colorMode, options.quality);
    const imageBytes = await encoded.blob.arrayBuffer();
    const image = encoded.mimeType === 'image/png'
      ? await output.embedPng(imageBytes)
      : await output.embedJpg(imageBytes);
    const pdfPage = output.addPage([viewportAtOne.width, viewportAtOne.height]);
    pdfPage.drawImage(image, { x: 0, y: 0, width: viewportAtOne.width, height: viewportAtOne.height });
    canvas.width = 1;
    canvas.height = 1;
  }

  options.onProgress?.('Finalizing PDF', 96);
  output.setProducer('Tiryani Agriculture PDF Tools');
  output.setCreator('Tiryani Agriculture PDF Tools');
  const bytes = await savePdfSafely(output, { useObjectStreams: true, addDefaultPage: false });
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return buildStats(blob, file.size, pdf.numPages, options.label, options.dpi, options.quality, false, true, started);
}

function processCanvas(canvas: HTMLCanvasElement, colorMode: ColorMode, enhance: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (enhance) {
      r = clamp((r - 128) * 1.18 + 136);
      g = clamp((g - 128) * 1.18 + 136);
      b = clamp((b - 128) * 1.18 + 136);
    }
    if (colorMode === 'grayscale' || colorMode === 'bw') {
      const gray = clamp(0.299 * r + 0.587 * g + 0.114 * b);
      const value = colorMode === 'bw' ? (gray > 170 ? 255 : 0) : gray;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    } else {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not generate compressed image data.'));
    }, type, quality);
  });
}

async function encodePageImage(canvas: HTMLCanvasElement, colorMode: ColorMode, quality: number) {
  if (colorMode !== 'bw') {
    return { blob: await canvasToBlob(canvas, 'image/jpeg', quality), mimeType: 'image/jpeg' as const };
  }

  const [jpegBlob, pngBlob] = await Promise.all([
    canvasToBlob(canvas, 'image/jpeg', Math.min(quality, 0.08)),
    canvasToBlob(canvas, 'image/png', quality),
  ]);

  return jpegBlob.size <= pngBlob.size
    ? { blob: jpegBlob, mimeType: 'image/jpeg' as const }
    : { blob: pngBlob, mimeType: 'image/png' as const };
}

function buildStats(
  blob: Blob,
  originalSize: number,
  pages: number,
  level: string,
  dpi: number | null,
  quality: number | null,
  textPreserved: boolean,
  rasterized: boolean,
  started: number
): CompressionStats {
  const reduction = originalSize > 0 ? ((originalSize - blob.size) / originalSize) * 100 : 0;
  return {
    blob,
    originalSize,
    compressedSize: blob.size,
    reduction,
    level,
    dpi,
    quality,
    textPreserved,
    rasterized,
    pages,
    processingTimeMs: performance.now() - started,
  };
}

export async function mergePdfs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(copyBuffer(arrayBuffer), { ignoreEncryption: true });
    tryFlattenForm(pdf);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  const mergedPdfBytes = await savePdfSafely(mergedPdf, { useObjectStreams: true });
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
}

export async function splitPdf(file: File, pageRanges: Array<{ start: number; end: number }>): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(copyBuffer(arrayBuffer), { ignoreEncryption: true });
  tryFlattenForm(pdfDoc);
  const blobs: Blob[] = [];
  for (const range of pageRanges) {
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(
      pdfDoc,
      Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i - 1)
    );
    pages.forEach((page) => newPdf.addPage(page));
    const pdfBytes = await savePdfSafely(newPdf, { useObjectStreams: true });
    blobs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
  }
  return blobs;
}

export async function extractPdfText(file: File, maxPages = Infinity): Promise<string> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: copyBuffer(arrayBuffer), useWorkerFetch: false }).promise;
  const pageLimit = Math.min(pdf.numPages, maxPages);
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: unknown) => {
        const textItem = item as { str?: string };
        return textItem.str || '';
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push(pageText);
  }
  return pages.filter(Boolean).join('\n\n');
}

export const extractTextFromPdf = extractPdfText;

export async function renderPdfPage(file: File, pageNumber: number, scale = 1.5): Promise<HTMLCanvasElement> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: copyBuffer(arrayBuffer), useWorkerFetch: false }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  canvas.height = Math.floor(viewport.height);
  canvas.width = Math.floor(viewport.width);
  if (context) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport, canvas }).promise;
  }
  return canvas;
}
