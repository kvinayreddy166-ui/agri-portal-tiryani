/**
 * Cryptographic and signature utilities for documents
 */

/**
 * Computes SHA-256 hash of binary data using Web Crypto
 */
export async function computeSha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Detects whether a PDF file contains a digital signature (/ByteRange and /Sig).
 * ISO 32000-1 specifications define digital signatures with /ByteRange and /Type /Sig.
 * Re-encoding or compressing a digitally signed PDF invalidates the signature's byte range hash.
 */
export function detectDigitalSignature(bytes: Uint8Array): boolean {
  try {
    // Scan PDF bytes for signature marker dictionaries
    // We check both raw ASCII decode and binary byte patterns
    const len = Math.min(bytes.length, 1024 * 1024); // check within reasonable byte window or full file
    const chunk = bytes.subarray(0, len);
    
    // Search for ASCII "/ByteRange" and "/Sig"
    const byteRangePattern = [47, 66, 121, 116, 101, 82, 97, 110, 103, 101]; // "/ByteRange"
    const sigPattern = [47, 83, 105, 103]; // "/Sig"
    
    const hasByteRange = containsSubsequence(chunk, byteRangePattern);
    const hasSig = containsSubsequence(chunk, sigPattern);
    
    return hasByteRange && hasSig;
  } catch {
    return false;
  }
}

/**
 * Content hash that is stable across regenerations of the same document.
 *
 * PDF generators embed volatile metadata (/ID trailer entry, /CreationDate,
 * /ModDate) so byte-identical content can still hash differently. This
 * normalizes those fields before hashing so re-downloads of an unchanged
 * document produce the same hash. Non-PDF payloads hash as-is.
 */
export async function computeCanonicalContentHash(data: Uint8Array): Promise<string> {
  const isPdf =
    data.length > 5 &&
    data[0] === 0x25 && // %
    data[1] === 0x50 && // P
    data[2] === 0x44 && // D
    data[3] === 0x46 && // F
    data[4] === 0x2d;   // -
  if (!isPdf) return computeSha256(data);

  let binary = '';
  for (let i = 0; i < data.length; i += 0x8000) {
    binary += String.fromCharCode(...data.subarray(i, i + 0x8000));
  }
  const normalized = binary
    .replace(
      /\/ID\s*\[\s*<[0-9A-Fa-f]+>\s*<[0-9A-Fa-f]+>\s*\]/g,
      '/ID[<00000000000000000000000000000000><00000000000000000000000000000000>]'
    )
    .replace(/\/CreationDate\s*\((?:\\.|[^\\)])*\)/g, "/CreationDate(D:19700101000000+00'00')")
    .replace(/\/ModDate\s*\((?:\\.|[^\\)])*\)/g, "/ModDate(D:19700101000000+00'00')");
  return computeSha256(new TextEncoder().encode(normalized));
}

function containsSubsequence(source: Uint8Array, pattern: number[]): boolean {
  const pLen = pattern.length;
  if (pLen === 0 || source.length < pLen) return false;

  const maxIndex = source.length - pLen;
  for (let i = 0; i <= maxIndex; i++) {
    let match = true;
    for (let j = 0; j < pLen; j++) {
      if (source[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}
