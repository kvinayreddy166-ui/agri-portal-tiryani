const PROBE_URLS = ['/service-worker.js', '/'];
const PROBE_TIMEOUT_MS = 6000;

export async function checkNetworkOnline(): Promise<boolean> {
  // First check navigator.onLine as a quick baseline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  // Try multiple probe URLs with fallback
  for (const probeUrl of PROBE_URLS) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
      const response = await fetch(`${probeUrl}?net=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      if (response.ok) return true;
    } catch (error) {
      // Continue to next probe URL
      continue;
    }
  }

  // If all probes fail, fall back to navigator.onLine
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
