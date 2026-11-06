// =====================================================================
// User Location Service — GPS detection & reverse geocoding
// =====================================================================
// Requests browser geolocation once, reverse-geocodes the coordinates
// to a readable place/district via BigDataCloud (free, no API key), and
// caches the result in safeStorage so weather & mandi widgets share it.
// Falls back to Tiryani coordinates when permission is denied, the
// device has no GPS, or geocoding fails.
// =====================================================================

import { safeStorage } from '../../../shared/lib/safeStorage';
import { TIRYANI_COORDINATES } from './weatherService';

const STORAGE_KEY = 'agronix_user_location_v1';
const GEOLOCATION_TIMEOUT_MS = 10000;

export interface UserLocation {
  lat: number;
  lon: number;
  /** Human-readable label, e.g. "Tiryani, Kumram Bheem Asifabad" */
  name: string;
  /** Best-effort district for mandi filtering */
  district: string;
  state: string;
  /** 'gps' = device location, 'default' = Tiryani fallback */
  source: 'gps' | 'default';
  detectedAt: number;
  /** Set when detection failed — explains why the Tiryani default is shown */
  error?: 'denied' | 'unavailable' | 'timeout' | 'unsupported';
}

export function getDefaultUserLocation(): UserLocation {
  return {
    lat: TIRYANI_COORDINATES?.lat ?? 19.4167,
    lon: TIRYANI_COORDINATES?.lon ?? 79.3333,
    name: TIRYANI_COORDINATES?.name ?? 'Tiryani Mandal, Kumram Bheem Asifabad',
    district: TIRYANI_COORDINATES?.district ?? 'Kumram Bheem Asifabad',
    state: TIRYANI_COORDINATES?.state ?? 'Telangana',
    source: 'default',
    detectedAt: 0,
  };
}

export function getStoredUserLocation(): UserLocation | null {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    if (!Number.isFinite(parsed?.lat) || !Number.isFinite(parsed?.lon)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveUserLocation(loc: UserLocation): void {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // best effort
  }
}

/**
 * Reverse-geocode coordinates to place names.
 * BigDataCloud reverse-geocode-client is free and requires no API key.
 */
async function reverseGeocode(lat: number, lon: number): Promise<{ name: string; district: string; state: string }> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Reverse geocode HTTP ${res.status}`);
  const data = await res.json();

  const locality = String(data.locality || '').trim();
  const city = String(data.city || '').trim();
  const sub = String(data.principalSubdivision || '').trim();
  const country = String(data.countryName || '').trim();

  const place = locality || city || '';
  const name = [place, sub].filter(Boolean).join(', ') || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  const district = city || locality || '';
  const state = sub || country || '';

  return { name, district, state };
}

function requestPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

let pendingDetection: Promise<UserLocation> | null = null;

/**
 * Detect the user's location via GPS + reverse geocoding.
 * Concurrent callers share a single in-flight request so the browser
 * only shows one permission prompt.
 */
export function detectUserLocation(): Promise<UserLocation> {
  if (pendingDetection) return pendingDetection;

  pendingDetection = (async (): Promise<UserLocation> => {
    try {
      const pos = await requestPosition();
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const geo = await reverseGeocode(lat, lon);
        const loc: UserLocation = {
          lat,
          lon,
          name: geo.name,
          district: geo.district,
          state: geo.state,
          source: 'gps',
          detectedAt: Date.now(),
        };
        saveUserLocation(loc);
        return loc;
      } catch {
        // GPS ok but geocoding failed — still use raw coords with generic label
        const loc: UserLocation = {
          lat,
          lon,
          name: `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`,
          district: '',
          state: '',
          source: 'gps',
          detectedAt: Date.now(),
        };
        saveUserLocation(loc);
        return loc;
      }
    } catch (err) {
      const code = (err as GeolocationPositionError)?.code;
      const error: UserLocation['error'] =
        code === 1 ? 'denied' : code === 2 ? 'unavailable' : code === 3 ? 'timeout' : 'unsupported';
      return { ...getDefaultUserLocation(), error };
    } finally {
      pendingDetection = null;
    }
  })();

  return pendingDetection;
}

/**
 * Resolve the effective location: cached GPS fix if fresh (<24h),
 * otherwise the Tiryani default. Does NOT trigger a permission prompt —
 * call detectUserLocation() explicitly to request GPS.
 */
export function resolveUserLocation(): UserLocation {
  const stored = getStoredUserLocation();
  if (stored && stored.source === 'gps' && Date.now() - stored.detectedAt < 24 * 60 * 60 * 1000) {
    return stored;
  }
  // Never return an invalid fix — fall back to Tiryani defaults
  if (stored && Number.isFinite(stored.lat) && Number.isFinite(stored.lon)) {
    return stored;
  }
  return getDefaultUserLocation();
}
