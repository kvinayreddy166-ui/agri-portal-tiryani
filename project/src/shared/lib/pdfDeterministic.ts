import type { jsPDF as JsPdfInstance } from 'jspdf';

/**
 * Makes jsPDF output byte-deterministic for identical document content.
 *
 * jsPDF writes a random /ID into the trailer and the current time into
 * /CreationDate for every file, so two downloads of the same document
 * produce different bytes and different SHA-256 hashes — which defeats the
 * content-hash deduplication in OfficerDocumentArchiveService and creates a
 * new cloud copy on every download.
 *
 * Call this right after `new jsPDF(...)`, before rendering content. Pass a
 * stable seed (document number, title, etc.) so distinct documents still get
 * distinct trailer IDs; the seed only affects metadata, never the content.
 */
export function applyDeterministicPdfMetadata(doc: JsPdfInstance, seed = ''): void {
  // Fixed PDF date: D:YYYYMMDDHHmmSS+HH'mm' (UTC). Guarded for partial
  // jsPDF mocks used in tests.
  doc.setCreationDate?.("D:20200101000000+00'00'");
  doc.setFileId?.(deterministicFileId(seed));
}

/**
 * Derives a stable 32-hex-char file ID from a seed string using FNV-1a.
 * Deterministic across runs and devices; not cryptographic (uniqueness only).
 */
function deterministicFileId(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0x9e3779b9;
  const input = `agronix-pdf:${seed}`;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (c + i), 0x01000193) >>> 0;
  }
  // Mix once more so short seeds still avalanche.
  h1 = Math.imul(h1 ^ (h1 >>> 16), 0x85ebca6b) >>> 0;
  h2 = Math.imul(h2 ^ (h2 >>> 16), 0xc2b2ae35) >>> 0;
  return (
    h1.toString(16).padStart(8, '0') +
    h2.toString(16).padStart(8, '0') +
    (h1 ^ h2).toString(16).padStart(8, '0') +
    (h2 ^ Math.imul(h1, 0x27d4eb2f)).toString(16).padStart(8, '0')
  ).toUpperCase();
}
