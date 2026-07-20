const PROBE_URL = '/service-worker.js';
const PROBE_TIMEOUT_MS = 4000;

export async function checkNetworkOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const response = await fetch(`${PROBE_URL}?net=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    window.clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}
