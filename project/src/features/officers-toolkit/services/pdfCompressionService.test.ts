import { describe, it, expect } from 'vitest';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { compressPdfSafely } from './pdfCompressionService';
import { computeSha256, detectDigitalSignature } from './documentCryptoService';

describe('PDF Compression & Hashing Service', () => {
  it('computes consistent SHA-256 hashes for binary buffers', async () => {
    const data = new TextEncoder().encode('AGRONIX Telangana Agriculture');
    const hash1 = await computeSha256(data);
    const hash2 = await computeSha256(data);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('detects digital signatures and prevents compression invalidation', async () => {
    // Regular PDF without signature
    const unsignedDoc = await PDFDocument.create();
    unsignedDoc.addPage([595, 842]);
    const unsignedBytes = await unsignedDoc.save();
    expect(detectDigitalSignature(unsignedBytes)).toBe(false);

    // Mocked PDF byte stream containing /ByteRange and /Sig
    const dummySignedPdf = new TextEncoder().encode(
      '%PDF-1.7\n1 0 obj\n<< /Type /Sig /ByteRange [0 100 200 300] /Contents <3082> >>\nendobj\n%%EOF'
    );
    expect(detectDigitalSignature(dummySignedPdf)).toBe(true);

    // Run compressPdfSafely on digitally signed PDF
    const result = await compressPdfSafely(dummySignedPdf);
    expect(result.status).toBe('skipped');
    expect(result.compressed).toBe(false);
    expect(result.reason).toContain('Digitally signed');
    expect(result.bytes).toEqual(dummySignedPdf);
  });

  it('compresses a multi-page PDF while preserving vector pages and dimensions', async () => {
    const doc = await PDFDocument.create();
    const timesFont = await doc.embedFont(StandardFonts.TimesRoman);
    
    // Add Page 1
    const page1 = doc.addPage([595.28, 841.89]); // A4
    page1.drawText('GOVERNMENT OF TELANGANA - AGRICULTURE DEPARTMENT', {
      x: 50,
      y: 800,
      size: 14,
      font: timesFont,
      color: rgb(0, 0.4, 0.2),
    });
    page1.drawRectangle({
      x: 50,
      y: 780,
      width: 495,
      height: 2,
      color: rgb(0.8, 0.6, 0.2),
    });

    // Add Page 2
    const page2 = doc.addPage([595.28, 841.89]);
    page2.drawText('Page 2: Inspection proforma and statutory annexure', {
      x: 50,
      y: 800,
      size: 12,
      font: timesFont,
    });

    // Save with no object stream compression first to simulate larger initial file
    const uncompressedBytes = await doc.save({ useObjectStreams: false });

    // Run safe compression
    const result = await compressPdfSafely(uncompressedBytes);

    expect(result.originalSize).toBe(uncompressedBytes.byteLength);
    expect(result.storedSize).toBeLessThanOrEqual(result.originalSize);
    expect(result.contentHash).toBeDefined();

    // Verify compressed PDF is completely valid by reloading it
    const reloaded = await PDFDocument.load(result.bytes);
    expect(reloaded.getPageCount()).toBe(2);
    expect(reloaded.getPage(0).getWidth()).toBeCloseTo(595.28, 1);
    expect(reloaded.getPage(0).getHeight()).toBeCloseTo(841.89, 1);
  });

  it('safely falls back to original bytes if compression fails on corrupted data', async () => {
    const corruptData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const result = await compressPdfSafely(corruptData);

    expect(result.compressed).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.storedSize).toBe(corruptData.byteLength);
    expect(result.bytes).toEqual(corruptData);
    expect(result.error).toBeDefined();
  });
});
