import { PDFDocument } from 'pdf-lib';
import { computeSha256, detectDigitalSignature } from './documentCryptoService';
import type { CompressionStatus } from '../types/officerArchiveTypes';

export interface PdfCompressionResult {
  bytes: Uint8Array;
  compressed: boolean;
  status: CompressionStatus;
  originalSize: number;
  storedSize: number;
  savingsPercent: number;
  contentHash: string;
  reason?: string;
  error?: string;
}

/**
 * Safely compresses a PDF using pdf-lib object stream optimization.
 * 
 * Guarantees:
 * - Preserves Telugu Unicode text and embedded TTF fonts.
 * - Preserves logos, vector emblems, signatures, and form formatting.
 * - Preserves page dimensions (never alters cropbox/mediabox).
 * - Avoids rasterizing text: all vector content and text layers are retained.
 * - Bypasses compression if the PDF has a digital signature (/ByteRange & /Sig)
 *   to avoid invalidating cryptographic signatures.
 * - Compares original size vs compressed size: If compressed is larger or fails,
 *   falls back to original bytes.
 */
export async function compressPdfSafely(
  input: Uint8Array | ArrayBuffer
): Promise<PdfCompressionResult> {
  const originalBytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const originalSize = originalBytes.byteLength;
  const originalHash = await computeSha256(originalBytes);

  // 1. Digital Signature Check: Never invalidate digitally signed PDFs
  if (detectDigitalSignature(originalBytes)) {
    return {
      bytes: originalBytes,
      compressed: false,
      status: 'skipped',
      originalSize,
      storedSize: originalSize,
      savingsPercent: 0,
      contentHash: originalHash,
      reason: 'Digitally signed PDF detected; compression skipped to protect signature validity',
    };
  }

  // 2. Safe Vector Stream Optimization with pdf-lib
  try {
    const pdfDoc = await PDFDocument.load(originalBytes, {
      ignoreEncryption: true,
      parseSpeed: 1, // Full parsing
    });

    // Save with object streams enabled (compresses cross-reference tables and non-stream objects)
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const compressedSize = compressedBytes.byteLength;

    // 3. Size Comparison: Only accept if smaller than original
    if (compressedSize < originalSize) {
      const savings = originalSize - compressedSize;
      const savingsPercent = Math.round((savings / originalSize) * 100);
      const compressedHash = await computeSha256(compressedBytes);

      return {
        bytes: compressedBytes,
        compressed: true,
        status: 'compressed',
        originalSize,
        storedSize: compressedSize,
        savingsPercent,
        contentHash: compressedHash,
      };
    } else {
      // Compressed version was larger or identical
      return {
        bytes: originalBytes,
        compressed: false,
        status: 'skipped',
        originalSize,
        storedSize: originalSize,
        savingsPercent: 0,
        contentHash: originalHash,
        reason: 'Compressed file was larger than or equal to original',
      };
    }
  } catch (err) {
    console.warn('PDF compression error, falling back to original:', err);
    return {
      bytes: originalBytes,
      compressed: false,
      status: 'failed',
      originalSize,
      storedSize: originalSize,
      savingsPercent: 0,
      contentHash: originalHash,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
