import { computeSha256, detectDigitalSignature } from './documentCryptoService';
import type { CompressionMethod, DocumentCompressionResult } from '../types/officerArchiveTypes';

/**
 * Compresses data using native Web Streams CompressionStream('gzip')
 */
export async function compressGzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });

  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const response = new Response(compressedStream);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Decompresses data using native Web Streams DecompressionStream('gzip')
 */
export async function decompressGzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });

  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
  const response = new Response(decompressedStream);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Determines whether a file type is a candidate for lossless reversible compression
 */
export function isCompressibleFormat(mimeType: string, filename: string): boolean {
  const lowerName = filename.toLowerCase();
  if (
    lowerName.endsWith('.pdf') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.xml')
  ) {
    return true;
  }

  const compressibleMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
  ];

  return compressibleMimes.some((m) => mimeType.toLowerCase().includes(m));
}

/**
 * Intelligent lossless archival compression with exact byte-for-byte restoration verification.
 * 
 * Guarantees:
 * - Uses 100% reversible RFC 1952 GZIP stream encoding.
 * - Decompresses the candidate in-memory and verifies that restored SHA-256 matches
 *   the original file byte-for-byte.
 * - If compressed file is larger or equal in size, or decompression verification fails,
 *   the uncompressed original is preserved.
 * - Detects cryptographically signed PDFs (/ByteRange + /Sig) and preserves original bytes.
 */
export async function compressForArchive(
  data: Uint8Array,
  mimeType: string,
  filename: string
): Promise<DocumentCompressionResult> {
  const originalSize = data.byteLength;
  const originalSha256 = await computeSha256(data);

  // If empty file, return as uncompressed
  if (originalSize === 0) {
    return {
      storedBytes: data,
      originalBytes: data,
      originalSize: 0,
      storedSize: 0,
      savingsBytes: 0,
      savingsPercent: 0,
      compressionMethod: 'none',
      compressionStatus: 'skipped',
      originalSha256,
      storedSha256: originalSha256,
      verifiedRestoration: true,
    };
  }

  // If PDF has digital signature, preserve uncompressed to ensure bit-level authenticity
  if (filename.toLowerCase().endsWith('.pdf') && detectDigitalSignature(data)) {
    return {
      storedBytes: data,
      originalBytes: data,
      originalSize,
      storedSize: originalSize,
      savingsBytes: 0,
      savingsPercent: 0,
      compressionMethod: 'none',
      compressionStatus: 'skipped',
      originalSha256,
      storedSha256: originalSha256,
      verifiedRestoration: true,
    };
  }

  // Attempt reversible compression if format is compressible
  if (isCompressibleFormat(mimeType, filename)) {
    try {
      const compressed = await compressGzip(data);

      // Verify exact byte restoration immediately
      const restored = await decompressGzip(compressed);
      const restoredSha256 = await computeSha256(restored);

      const isVerified = restoredSha256 === originalSha256;

      // Only adopt compressed form if byte verification succeeds AND size is smaller
      if (isVerified && compressed.byteLength < originalSize) {
        const storedSize = compressed.byteLength;
        const storedSha256 = await computeSha256(compressed);
        const savingsBytes = originalSize - storedSize;
        const savingsPercent = Number(((savingsBytes / originalSize) * 100).toFixed(1));

        return {
          storedBytes: compressed,
          originalBytes: data,
          originalSize,
          storedSize,
          savingsBytes,
          savingsPercent,
          compressionMethod: 'gzip',
          compressionStatus: 'compressed',
          originalSha256,
          storedSha256,
          verifiedRestoration: true,
        };
      }
    } catch (err) {
      console.warn('[DocumentCompression] Reversible compression failed, falling back to original:', err);
    }
  }

  // Fallback: Store original without modification
  return {
    storedBytes: data,
    originalBytes: data,
    originalSize,
    storedSize: originalSize,
    savingsBytes: 0,
    savingsPercent: 0,
    compressionMethod: 'none',
    compressionStatus: 'uncompressed',
    originalSha256,
    storedSha256: originalSha256,
    verifiedRestoration: true,
  };
}

/**
 * Restores an archived document back to its exact original binary form
 */
export async function restoreArchivedDocument(
  storedBytes: Uint8Array,
  method: CompressionMethod = 'none',
  expectedOriginalSha256?: string
): Promise<{ restoredBytes: Uint8Array; verified: boolean }> {
  let restoredBytes: Uint8Array;

  if (method === 'gzip') {
    restoredBytes = await decompressGzip(storedBytes);
  } else {
    restoredBytes = storedBytes;
  }

  let verified = true;
  if (expectedOriginalSha256) {
    const actualSha256 = await computeSha256(restoredBytes);
    verified = actualSha256 === expectedOriginalSha256;
    if (!verified) {
      console.error(
        `[DocumentRestoration] SHA-256 integrity check failed! Expected ${expectedOriginalSha256}, got ${actualSha256}`
      );
    }
  }

  return { restoredBytes, verified };
}
