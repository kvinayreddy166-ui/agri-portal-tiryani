/**
 * File cleanup utilities for PDF Tools
 * Ensures privacy-first processing by clearing all temporary data
 */

export function cleanupObjectUrl(url?: string) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function cleanupCanvas(canvas: HTMLCanvasElement | null) {
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

export function cleanupBlob(blob: Blob | null) {
  // Blobs are automatically garbage collected when no longer referenced
  // This function exists for explicit cleanup in critical paths
  if (blob) {
    // Force cleanup by creating a temporary reference and releasing it
    // @ts-ignore - Intentional null assignment for cleanup
    blob = null;
  }
}

export function cleanupWorker(worker: Worker | null) {
  if (worker) {
    worker.terminate();
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function makeSafeFileName(originalName: string, suffix: string, ext: string): string {
  const base = originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 25);

  return `${base}_${suffix}.${ext}`.slice(0, 40);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateFileSize(file: File, maxSizeMB: number = 20): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB} MB limit. Current size: ${formatFileSize(file.size)}`,
    };
  }
  return { valid: true };
}

export function validateFileType(file: File, allowedTypes: string[]): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  return { valid: true };
}
