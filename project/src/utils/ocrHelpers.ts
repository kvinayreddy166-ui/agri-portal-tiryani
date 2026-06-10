/**
 * OCR helper utilities using Tesseract.js
 */

import Tesseract from 'tesseract.js';

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
  const worker = await Tesseract.createWorker(language);
  
  try {
    const result = await worker.recognize(file, {}, {
      logger: (m: any) => {
        if (onProgress) {
          onProgress({
            status: m.status,
            progress: m.progress * 100,
          });
        }
      },
    });
    
    const pages = result.data.pages.map((page: any) => ({
      text: page.text,
      confidence: page.confidence,
    }));
    
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      pages,
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
  const worker = await Tesseract.createWorker(language);
  
  try {
    const result = await worker.recognize(imageData, {}, {
      logger: (m: any) => {
        if (onProgress) {
          onProgress({
            status: m.status,
            progress: m.progress * 100,
          });
        }
      },
    });
    
    const pages = result.data.pages.map((page: any) => ({
      text: page.text,
      confidence: page.confidence,
    }));
    
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      pages,
    };
  } finally {
    await worker.terminate();
  }
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
