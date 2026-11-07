import { describe, it, expect } from 'vitest';
import {
  compressForArchive,
  restoreArchivedDocument,
  compressGzip,
  isCompressibleFormat,
} from './documentCompressionService';
import { computeSha256 } from './documentCryptoService';

describe('DocumentCompressionService (Reversible Lossless Archival)', () => {
  it('identifies compressible document formats correctly', () => {
    expect(isCompressibleFormat('application/pdf', 'notice.pdf')).toBe(true);
    expect(isCompressibleFormat('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'report.docx')).toBe(true);
    expect(isCompressibleFormat('text/plain', 'log.txt')).toBe(true);
    expect(isCompressibleFormat('image/jpeg', 'photo.jpg')).toBe(false);
  });

  it('compresses repetitive textual PDF/DOCX streams and achieves 100% byte-exact restoration', async () => {
    // Generate realistic repetitive document text (like Telugu statutory order tables and notices)
    const teluguDocumentText = `
      GOVERNMENT OF TELANGANA - AGRICULTURE DEPARTMENT
      మండల వ్యవసాయ అధికారి కార్యాలయం, తిర్యాణి, కొమరంభీమ్ ఆసిఫాబాద్ జిల్లా.
      FORM VIII - STOP SALE ORDER UNDER SEED (CONTROL) ORDER 1983
      ` + 'Repeated statutory clause text line for document testing.\n'.repeat(100);

    const encoder = new TextEncoder();
    const originalBytes = encoder.encode(teluguDocumentText);
    const originalHash = await computeSha256(originalBytes);

    const result = await compressForArchive(originalBytes, 'application/pdf', 'Stop_Sale_Notice.pdf');

    expect(result.compressionMethod).toBe('gzip');
    expect(result.compressionStatus).toBe('compressed');
    expect(result.storedSize).toBeLessThan(result.originalSize);
    expect(result.savingsBytes).toBeGreaterThan(0);
    expect(result.savingsPercent).toBeGreaterThan(50); // High compression ratio on text/xml/streams
    expect(result.originalSha256).toBe(originalHash);
    expect(result.verifiedRestoration).toBe(true);

    // Verify exact restoration
    const restored = await restoreArchivedDocument(result.storedBytes, result.compressionMethod, result.originalSha256);
    expect(restored.verified).toBe(true);
    expect(restored.restoredBytes.byteLength).toBe(originalBytes.byteLength);

    const restoredText = new TextDecoder().decode(restored.restoredBytes);
    expect(restoredText).toBe(teluguDocumentText);
  });

  it('safely bypasses compression on digitally signed PDFs', async () => {
    // Construct mock PDF header with /ByteRange and /Sig
    const signedPdfContent = '%PDF-1.4\n/Type /Sig /ByteRange [0 100 200 300] /Contents <hex>';
    const bytes = new TextEncoder().encode(signedPdfContent);

    const result = await compressForArchive(bytes, 'application/pdf', 'Signed_Order.pdf');

    expect(result.compressionMethod).toBe('none');
    expect(result.compressionStatus).toBe('skipped');
    expect(result.storedSize).toBe(bytes.byteLength);
    expect(result.storedBytes).toEqual(bytes);
  });

  it('falls back to uncompressed original if data expands during compression', async () => {
    // Very short high-entropy string that will expand with gzip headers
    const shortData = new Uint8Array([1, 2, 3, 4, 5]);
    const result = await compressForArchive(shortData, 'text/plain', 'tiny.txt');

    expect(result.compressionMethod).toBe('none');
    expect(result.compressionStatus).toBe('uncompressed');
    expect(result.storedSize).toBe(shortData.byteLength);
  });

  it('detects SHA-256 mismatch if restored data is tampered with', async () => {
    const original = new TextEncoder().encode('Statutory Order 2026');
    const originalHash = await computeSha256(original);
    expect(originalHash).toBeDefined();
    const compressed = await compressGzip(original);

    // Tamper with expected hash
    const fakeHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const restored = await restoreArchivedDocument(compressed, 'gzip', fakeHash);

    expect(restored.verified).toBe(false);
  });
});
