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

const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/json': '.json',
  'text/csv': '.csv',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

/**
 * Returns a valid, unique-ready filename: strips illegal characters and
 * appends an extension derived from the content when the name lacks one.
 */
export function sanitizeFileName(filename: string, blobType?: string, fallbackExtension?: string): string {
  const cleaned = (filename || 'download')
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\p{Cc}/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '') || 'download';
  if (/\.[A-Za-z0-9]{1,8}$/.test(cleaned)) return cleaned;
  const ext = fallbackExtension || (blobType ? EXTENSION_BY_MIME[blobType] : undefined);
  return ext ? `${cleaned}${ext}` : cleaned;
}

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

export type BlobPreviewResult = 'opened' | 'downloaded' | 'shared' | 'failed';

type ShareCapableNavigator = Navigator & {
  canShare?: (data?: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
};

function canShareFile(file: File): boolean {
  const nav = navigator as ShareCapableNavigator;
  try {
    return typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Delivers a generated file to the user.
 *
 * Mobile and installed PWAs show a real-tap save action after async generation.
 * Where file sharing is available, the user can choose an app or Save to Files;
 * the native download link remains available. Desktop uses an anchor download.
 */
export async function deliverGeneratedFile(blob: Blob, filename: string, fallbackExtension?: string): Promise<'shared' | 'downloaded'> {
  const safeName = sanitizeFileName(filename, blob.type, fallbackExtension);
  if (!isMobileDevice() && !isIOSDevice() && !isStandalonePwa()) {
    downloadBlobFile(blob, safeName);
    return 'downloaded';
  }

  const file = new File([blob], safeName, { type: blob.type || 'application/octet-stream' });
  const nav = navigator as ShareCapableNavigator;
  if (canShareFile(file) && navigator.userActivation?.isActive) {
    try {
      await nav.share!({ files: [file], title: safeName });
      return 'shared';
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') throw new DOMException('File sharing was cancelled. No file was saved.', 'AbortError');
    }
  }

  return new Promise<'shared' | 'downloaded'>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `Save ${safeName}`);
    const panel = document.createElement('div');
    panel.className = 'w-full max-w-sm space-y-4 rounded-xl bg-white p-5 text-slate-900 shadow-2xl';
    const title = document.createElement('h2');
    title.className = 'text-lg font-bold';
    title.textContent = 'Your file is ready';
    const name = document.createElement('p');
    name.className = 'break-all text-sm';
    name.textContent = safeName;
    const message = document.createElement('p');
    message.className = 'text-sm';
    message.textContent = 'Tap Save to Files, or use the download link below.';
    const finish = (result?: 'shared' | 'downloaded') => {
      overlay.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
      if (result) resolve(result);
      else reject(new DOMException('File save cancelled. No file was downloaded.', 'AbortError'));
    };
    panel.append(title, name, message);
    if (canShareFile(file)) {
      const share = document.createElement('button');
      share.type = 'button';
      share.className = 'block w-full rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white';
      share.textContent = 'Save to Files / Share';
      share.onclick = () => {
        void nav.share!({ files: [file], title: safeName })
          .then(() => finish('shared'))
          .catch((error: unknown) => {
            if ((error as Error)?.name !== 'AbortError') {
              message.textContent = 'Sharing failed. Try the download link below.';
            }
          });
      };
      panel.appendChild(share);
    }
    const download = document.createElement('a');
    download.href = url;
    download.download = safeName;
    download.className = 'block w-full rounded-lg border border-emerald-700 px-4 py-3 text-center font-bold text-emerald-800';
    download.textContent = 'Download file';
    download.onclick = () => { window.setTimeout(() => finish('downloaded'), 0); };
    panel.appendChild(download);
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'block w-full px-4 py-2 text-sm';
    cancel.textContent = 'Cancel';
    cancel.onclick = () => finish();
    panel.appendChild(cancel);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    (panel.querySelector('button, a') as HTMLElement).focus();
  });
}

/**
 * Replacement for jsPDF `doc.save(filename)`. `doc.save()` internally uses a
 * blob anchor click, which silently fails on iOS standalone PWA. This routes
 * the identical bytes through `deliverGeneratedFile` instead.
 */
export function savePdfDocument(doc: { output: (type: 'blob') => Blob }, filename: string) {
  return deliverGeneratedFile(doc.output('blob'), filename);
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type XlsxWriter = typeof import('xlsx');
type XlsxWorkbook = import('xlsx').WorkBook;

/**
 * Replacement for `XLSX.writeFile(workbook, filename)` — produces the same
 * .xlsx file but delivers it via `deliverGeneratedFile` so it works on
 * mobile/PWA where the library's internal anchor click does nothing.
 */
export function saveWorkbookFile(XLSX: XlsxWriter, workbook: XlsxWorkbook, filename: string) {
  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return deliverGeneratedFile(new Blob([data as ArrayBuffer], { type: XLSX_MIME }), filename);
}

/**
 * Opens a generated Blob (e.g. PDF) for preview.
 *
 * Desktop: opens the blob in a new tab via `window.open` (sync callers only —
 * after an `await`, popup blockers may reject it, so we fall back).
 * Mobile / installed PWA / popup blocked: delivers the file instead (native
 * share sheet on iOS, download elsewhere) — the OS viewer opens it, which is
 * the only reliable "preview" on those platforms.
 */
export async function openBlobPreview(blob: Blob, filename: string): Promise<BlobPreviewResult> {
  if (isMobileDevice() || isStandalonePwa()) {
    try {
      return await deliverGeneratedFile(blob, filename);
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
    return await deliverGeneratedFile(blob, filename);
  } catch (error) {
    console.error('Blob preview failed, falling back to download:', error);
    try {
      return await deliverGeneratedFile(blob, filename);
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
