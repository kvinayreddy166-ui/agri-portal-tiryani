/** Fetch remote file as blob URL for inline preview (avoids cross-origin download behavior). */
import { supabase } from './supabase';
import { getContentType } from './fileTypes';

function extractSupabaseStoragePath(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/uploads\/(.+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function mimeFromFileName(fileName?: string): string | undefined {
  if (!fileName) return undefined;
  const ext = fileName.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  if (!ext) return undefined;
  const fakeFile = { name: `file.${ext}`, type: 'application/octet-stream' } as File;
  const ct = getContentType(fakeFile);
  return ct === 'application/octet-stream' ? undefined : ct;
}

function normalizeBlob(blob: Blob, fileName?: string): Blob {
  if (blob.type && blob.type !== 'application/octet-stream') return blob;
  const mime = mimeFromFileName(fileName);
  if (!mime) return blob;
  return new Blob([blob], { type: mime });
}

async function downloadBlob(fileUrl: string, fileName?: string): Promise<Blob> {
  const errors: string[] = [];

  try {
    const res = await fetch(fileUrl, { mode: 'cors', credentials: 'omit' });
    if (res.ok) return normalizeBlob(await res.blob(), fileName);
    errors.push(`fetch ${res.status}`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'fetch failed');
  }

  const storagePath = extractSupabaseStoragePath(fileUrl);
  if (storagePath) {
    const { data, error } = await supabase.storage.from('uploads').download(storagePath);
    if (!error && data) return normalizeBlob(data, fileName || storagePath);

    const { data: signed, error: signError } = await supabase.storage
      .from('uploads')
      .createSignedUrl(storagePath, 3600);
    if (!signError && signed?.signedUrl) {
      try {
        const res = await fetch(signed.signedUrl, { credentials: 'omit' });
        if (res.ok) return normalizeBlob(await res.blob(), fileName || storagePath);
        errors.push(`signed fetch ${res.status}`);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'signed fetch failed');
      }
    } else if (signError) {
      errors.push(signError.message);
    }
  }

  throw new Error(errors.join('; ') || 'Failed to load file for preview');
}

export async function fetchFileBuffer(fileUrl: string, fileName?: string): Promise<ArrayBuffer> {
  const blob = await downloadBlob(fileUrl, fileName);
  return blob.arrayBuffer();
}

export async function fetchBlobUrl(fileUrl: string, fileName?: string): Promise<string> {
  const blob = await downloadBlob(fileUrl, fileName);
  return URL.createObjectURL(blob);
}

export function revokeBlobUrl(url: string | null | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

/** Programmatic download that works for cross-origin Supabase public URLs. */
export async function downloadFileFromUrl(fileUrl: string, fileName?: string) {
  try {
    const blob = await downloadBlob(fileUrl, fileName);
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName || 'download';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Blob download failed, falling back to direct URL:', error);
    // Fallback: open in new tab if blob download fails
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    throw error;
  }
}
