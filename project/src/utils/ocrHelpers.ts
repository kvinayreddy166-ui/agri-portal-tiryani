/**
 * OCR helper utilities using Tesseract.js
 */

import Tesseract from 'tesseract.js';
import { renderPdfPage, validatePdf } from './pdfHelpers';

export interface OcrResult {
  text: string;
  confidence: number;
  pages: Array<{
    text: string;
    confidence: number;
  }>;
}

export interface OcrProgress {
  status: string;
  progress: number;
}

export async function performOcr(
  file: File,
  language: 'eng' | 'tel' | 'eng+tel' = 'eng+tel',
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  const worker = await Tesseract.createWorker(language, undefined, {
    logger: (message) => {
      onProgress?.({
        status: message.status,
        progress: message.progress * 100,
      });
    },
  });
  
  try {
    const result = await worker.recognize(file);
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      pages: [{ text: result.data.text, confidence: result.data.confidence }],
    };
  } finally {
    await worker.terminate();
  }
}

export async function performOcrOnImage(
  imageData: ImageData | string,
  language: 'eng' | 'tel' | 'eng+tel' = 'eng+tel',
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  const worker = await Tesseract.createWorker(language, undefined, {
    logger: (message) => {
      onProgress?.({
        status: message.status,
        progress: message.progress * 100,
      });
    },
  });
  
  try {
    const image = typeof imageData === 'string' ? imageData : imageDataToCanvas(imageData);
    const result = await worker.recognize(image);
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      pages: [{ text: result.data.text, confidence: result.data.confidence }],
    };
  } finally {
    await worker.terminate();
  }
}

export async function performOcrOnPdf(
  file: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  const info = await validatePdf(file);
  const worker = await Tesseract.createWorker('eng', undefined, {
    logger: (message) => {
      onProgress?.({
        status: message.status,
        progress: message.progress * 100,
      });
    },
  });

  try {
    const pages: OcrResult['pages'] = [];
    for (let pageNumber = 1; pageNumber <= info.pageCount; pageNumber += 1) {
      onProgress?.({
        status: `Preparing page ${pageNumber}/${info.pageCount}`,
        progress: ((pageNumber - 1) / info.pageCount) * 100,
      });
      const canvas = await renderPdfPage(file, pageNumber, 2.75);
      prepareCanvasForOcr(canvas);
      const result = await worker.recognize(canvas);
      pages.push({
        text: result.data.text,
        confidence: result.data.confidence,
      });
      canvas.width = 1;
      canvas.height = 1;
    }

    const text = pages.map((page, index) => `Page ${index + 1}\n${page.text.trim()}`).join('\n\n');
    const confidence = pages.length
      ? pages.reduce((total, page) => total + page.confidence, 0) / pages.length
      : 0;

    return { text, confidence, pages };
  } finally {
    await worker.terminate();
  }
}

function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext('2d');
  context?.putImageData(imageData, 0, 0);
  return canvas;
}

function prepareCanvasForOcr(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    const boosted = Math.max(0, Math.min(255, (gray - 128) * 1.45 + 140));
    const value = boosted > 185 ? 255 : boosted < 90 ? 0 : boosted;
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
}

export function formatOcrText(text: string): string {
  // Clean up OCR output
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Preserve paragraph breaks
    .trim();
}

export function extractKeyFields(text: string): {
  dates: string[];
  referenceNumbers: string[];
  serialNumbers: string[];
} {
  const dates = text.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{2,4}[-/]\d{1,2}[-/]\d{1,2}/g) || [];
  const referenceNumbers = text.match(/(?:Ref|Reference|No\.?|Number)\s*[:#]?\s*[A-Za-z0-9-]+/gi) || [];
  const serialNumbers = text.match(/(?:Serial|S\.No\.?|S\/No)\s*[:#]?\s*[A-Za-z0-9-]+/gi) || [];
  
  return {
    dates: dates.map(d => d.trim()),
    referenceNumbers: referenceNumbers.map(r => r.trim()),
    serialNumbers: serialNumbers.map(s => s.trim()),
  };
}
