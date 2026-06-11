/**
 * PDF helper utilities using pdf-lib and pdfjs-dist
 */

import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PdfInfo {
  pageCount: number;
  size: number;
  hasText: boolean;
}

export async function getPdfInfo(file: File): Promise<PdfInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pageCount = pdfDoc.getPageCount();
  
  // Check if PDF has selectable text
  let hasText = false;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    for (let i = 1; i <= Math.min(pageCount, 3); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      if (textContent.items.length > 0) {
        hasText = true;
        break;
      }
    }
  } catch (error) {
    console.error('Error checking PDF text:', error);
  }
  
  return {
    pageCount,
    size: file.size,
    hasText,
  };
}

export async function compressPdf(
  file: File,
  targetSizeKB: number
): Promise<{ blob: Blob; originalSize: number; compressedSize: number; reduction: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const originalSize = file.size;
  
  // Load PDF with pdf.js to render pages
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  
  // Calculate scale factor based on target size
  // For 100KB target: use very aggressive downsampling (scale 0.5)
  // For 2MB target: use moderate downsampling (scale 0.8)
  const isExtremeTarget = targetSizeKB <= 100;
  const baseScale = isExtremeTarget ? 0.5 : 0.8;
  
  // Calculate JPEG quality based on target
  const quality = isExtremeTarget ? 0.3 : 0.6;
  
  // Create new PDF
  const newPdf = await PDFDocument.create();
  
  // Process each page
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: baseScale });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;
      
      // Convert canvas to JPEG blob with compression
      const jpegBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob());
        }, 'image/jpeg', quality);
      });
      
      // Convert blob to array buffer
      const imageBuffer = await jpegBlob.arrayBuffer();
      
      // Embed image in PDF
      let image;
      try {
        image = await newPdf.embedJpg(imageBuffer);
      } catch {
        // If JPEG fails, try PNG
        const pngBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob || new Blob());
          }, 'image/png');
        });
        const pngBuffer = await pngBlob.arrayBuffer();
        image = await newPdf.embedPng(pngBuffer);
      }
      
      // Calculate PDF page size
      const pdfPage = newPdf.addPage([image.width, image.height]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }
  }
  
  // Save compressed PDF
  const compressedPdf = await newPdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });
  
  const compressedBlob = new Blob([compressedPdf.buffer as ArrayBuffer], { type: 'application/pdf' });
  const compressedSize = compressedBlob.size;
  const reduction = ((originalSize - compressedSize) / originalSize) * 100;
  
  return {
    blob: compressedBlob,
    originalSize,
    compressedSize,
    reduction: Number.isFinite(reduction) ? reduction : 0,
  };
}

export async function mergePdfs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  
  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

export async function splitPdf(
  file: File,
  pageRanges: Array<{ start: number; end: number }>
): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const blobs: Blob[] = [];
  
  for (const range of pageRanges) {
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(
      pdfDoc,
      Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i - 1)
    );
    pages.forEach((page) => newPdf.addPage(page));
    
    const pdfBytes = await newPdf.save();
    blobs.push(new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
  }
  
  return blobs;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
}

export async function renderPdfPage(
  file: File,
  pageNumber: number,
  scale: number = 1.5
): Promise<HTMLCanvasElement> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  if (context) {
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    };
    
    await page.render(renderContext).promise;
  }
  
  return canvas;
}
