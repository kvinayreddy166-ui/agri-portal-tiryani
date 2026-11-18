// Captures the browser's `beforeinstallprompt` event at module load (imported
// early from main.tsx) so the deferred prompt is available to any install UI —
// previously it was only listened for inside FloatingActions, so taps before
// that component mounted (or after a remount) fell back to "use browser menu".

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedFlag = false;
const promptWaiters: Array<(event: BeforeInstallPromptEvent) => void> = [];

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    (window.navigator as Navigator & { standalone?: boolean })?.standalone
  );
}

if (typeof window !== 'undefined') {
  installedFlag = isStandalone();
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    while (promptWaiters.length) {
      promptWaiters.shift()?.(deferredPrompt);
    }
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installedFlag = true;
  });
}

export function isAppInstalled(): boolean {
  return installedFlag || isStandalone();
}

export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

/**
 * Resolves with the deferred prompt as soon as `beforeinstallprompt` fires,
 * or with the already-captured prompt immediately. Returns null on timeout.
 * Use this when the user taps install before the browser has finished its
 * installability checks (service worker still installing/activating).
 */
export function waitForInstallPrompt(timeoutMs = 8000): Promise<BeforeInstallPromptEvent | null> {
  if (deferredPrompt) return Promise.resolve(deferredPrompt);
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      const index = promptWaiters.indexOf(onPrompt);
      if (index !== -1) promptWaiters.splice(index, 1);
      resolve(null);
    }, timeoutMs);
    const onPrompt = (event: BeforeInstallPromptEvent) => {
      window.clearTimeout(timer);
      resolve(event);
    };
    promptWaiters.push(onPrompt);
  });
}

/**
 * Fires the native install dialog. The beforeinstallprompt event is
 * single-use, so it is consumed up front. Returns 'unavailable' when the
 * browser has not offered an install prompt (e.g. iOS Safari, or the PWA
 * doesn't currently meet installability criteria).
 */
export async function promptAppInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const promptEvent = deferredPrompt;
  if (!promptEvent) return 'unavailable';
  deferredPrompt = null;
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    return choice.outcome;
  } catch {
    return 'unavailable';
  }
}

export default { isAppInstalled, getInstallPrompt, waitForInstallPrompt, promptAppInstall };
