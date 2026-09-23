/**
 * Shared document action layer for the whole PWA.
 *
 * Goals:
 * - Downloads must work on desktop, Android Chrome, iOS Safari and installed
 *   PWA (standalone) mode.
 * - Blob/object URLs must live long enough for the browser to start the
 *   download or open the viewer (premature revoke = silent failure on mobile).
 * - `window.open` after an async gap is popup-blocked on mobile, so preview
 *   falls back to a real download when a new tab cannot be opened.
 * - Async failures must surface to the user instead of leaving a dead button.
 */

const REVOKE_DELAY_MS = 60_000;

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    nav.standalone === true
  );
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Downloads a Blob with a preserved filename. Uses a programmatic
 * `<a download>` click — reliable on all platforms, not popup-blocked.
 * The object URL stays alive for 60s so slow mobile browsers can fetch it.
 */
export function downloadBlobFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

export type BlobPreviewResult = 'opened' | 'downloaded' | 'failed';

/**
 * Opens a generated Blob (e.g. PDF) for preview.
 *
 * Desktop: opens the blob in a new tab via `window.open` (sync callers only —
 * after an `await`, popup blockers may reject it, so we fall back).
 * Mobile / installed PWA / popup blocked: downloads the file instead — the OS
 * viewer opens it, which is the only reliable "preview" on those platforms.
 */
export function openBlobPreview(blob: Blob, filename: string): BlobPreviewResult {
  if (isMobileDevice() || isStandalonePwa()) {
    try {
      downloadBlobFile(blob, filename);
      return 'downloaded';
    } catch (error) {
      console.error('Blob download fallback failed:', error);
      return 'failed';
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener');
    if (win) {
      window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
      return 'opened';
    }
    // Popup blocked — fall back to a real download.
    URL.revokeObjectURL(url);
    downloadBlobFile(blob, filename);
    return 'downloaded';
  } catch (error) {
    console.error('Blob preview failed, falling back to download:', error);
    try {
      downloadBlobFile(blob, filename);
      return 'downloaded';
    } catch (fallbackError) {
      console.error('Download fallback also failed:', fallbackError);
      return 'failed';
    }
  }
}

/**
 * Opens an external/remote URL in a new tab. Falls back to a same-tab
 * navigation-less anchor click when `window.open` is blocked (mobile/PWA).
 */
export function openExternalUrl(url: string): boolean {
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) return true;
  } catch (error) {
    console.warn('window.open blocked:', error);
  }
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch (error) {
    console.error('Anchor fallback failed:', error);
    return false;
  }
}

/**
 * Wraps an async document/export handler so rejections surface to the user
 * instead of failing silently. Apply at the call site:
 *   onClick={guardedDocumentAction(exportToExcel)}
 */
export function guardedDocumentAction(fn: () => Promise<unknown> | unknown): () => void {
  return () => {
    void Promise.resolve()
      .then(() => fn())
      .catch((error: unknown) => {
        console.error('Document action failed:', error);
        window.alert(documentActionErrorMessage(error));
      });
  };
}

/** Human-readable message for a failed document action. */
export function documentActionErrorMessage(error: unknown, fallback = 'The document could not be generated. Please check your connection and try again.'): string {
  if (error instanceof Error && error.message) return `${fallback} (${error.message})`;
  return fallback;
}
