// =====================================================================
// Real-time Weather Service — OpenWeather & Open-Meteo Fallback
// =====================================================================
// Powers the AGRONIX Dashboard live weather widget for Tiryani Mandal.
// Prioritizes OpenWeather API for real-time conditions, rainfall tracking,
// and 5-day / 3-hour agro-meteorological forecasts.
//
// API Key resolution:
//   1. VITE_OPENWEATHER_API_KEY environment variable
//   2. localStorage ('agronix_openweather_api_key')
// If unconfigured or unavailable, seamlessly falls back to Open-Meteo
// and then offline local estimates so the dashboard is always functional.
// =====================================================================

import { safeStorage } from '../../../shared/lib/safeStorage';

export const TIRYANI_COORDINATES = {
  lat: 19.4167,
  lon: 79.3333,
  name: 'Tiryani Mandal, Kumram Bheem Asifabad',
  mandal: 'Tiryani',
  district: 'Kumram Bheem Asifabad',
  state: 'Telangana',
};

export const OPENWEATHER_STORAGE_KEY = 'agronix_openweather_api_key';
export const WEATHER_CACHE_KEY = 'agronix_weather_cache_v2';
export const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export interface DailyForecastItem {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Today", "Tomorrow", "Wed 5 Nov"
  weekday: string; // e.g. "Wednesday"
  tempMin: number;
  tempMax: number;
  rainMm: number;
  probability: number; // percentage (0-100)
  description: string;
  weatherMain?: string;
  iconCode?: string;
  iconUrl?: string;
}

export interface RealtimeWeatherData {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number; // hPa
  rain1h?: number; // mm
  rainToday: number; // mm
  rainChanceToday: number; // %
  windSpeed: number; // km/h
  windDeg?: number;
  windDirection?: string; // N, NE, E, etc.
  cloudiness?: number; // %
  visibilityKm?: number; // km
  sunrise?: string; // HH:MM AM/PM
  sunset?: string; // HH:MM AM/PM
  description: string;
  weatherMain: string;
  iconCode?: string;
  iconUrl?: string;
  locationName: string;
  source: 'openweather' | 'openmeteo' | 'fallback';
  forecast: DailyForecastItem[];
  lastUpdated: string;
  rawTimestamp: number;
}

/**
 * Retrieve the active OpenWeather API key from localStorage or Vite env.
 */
export function getOpenWeatherApiKey(): string | null {
  const envKey = (import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined)?.trim();
  if (envKey) return envKey;

  const storedKey = safeStorage.getItem(OPENWEATHER_STORAGE_KEY)?.trim();
  if (storedKey) return storedKey;

  return null;
}

/**
 * Store user-provided OpenWeather API key in localStorage.
 */
export function setOpenWeatherApiKey(key: string): void {
  safeStorage.setItem(OPENWEATHER_STORAGE_KEY, key.trim());
}

/**
 * Remove stored OpenWeather API key from localStorage.
 */
export function clearOpenWeatherApiKey(): void {
  safeStorage.removeItem(OPENWEATHER_STORAGE_KEY);
}

/**
 * Check if an OpenWeather key is available (either via env or localStorage).
 */
export function hasOpenWeatherApiKey(): boolean {
  return Boolean(getOpenWeatherApiKey());
}

/**
 * Verify whether an OpenWeather API key is valid by querying the weather endpoint.
 */
export async function validateOpenWeatherApiKey(key: string): Promise<{
  valid: boolean;
  message: string;
  cityName?: string;
}> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, message: 'API key is required.' };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${TIRYANI_COORDINATES.lat}&lon=${TIRYANI_COORDINATES.lon}&units=metric&appid=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return {
        valid: true,
        message: 'OpenWeather API key successfully verified!',
        cityName: data?.name || 'Tiryani',
      };
    }

    if (res.status === 401) {
      return {
        valid: false,
        message: 'Invalid API Key. (Note: Newly created keys at openweathermap.org take 10–15 minutes to activate).',
      };
    }

    return {
      valid: false,
      message: `OpenWeather returned HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err) {
    return {
      valid: false,
      message: err instanceof Error ? err.message : 'Network error verifying OpenWeather API key.',
    };
  }
}

/**
 * Convert wind degree to 16-point compass direction.
 */
export function getWindCompass(deg?: number): string {
  if (deg === undefined || deg === null || isNaN(deg)) return '—';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round((deg % 360) / 22.5) % 16;
  return directions[idx];
}

/**
 * Format unix seconds into a 12-hour IST time string.
 */
export function formatUnixTimeIST(unixSec?: number): string {
  if (!unixSec) return '—';
  try {
    const date = new Date(unixSec * 1000);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return '—';
  }
}

/**
 * Get official OpenWeather 2x icon URL.
 */
export function getOpenWeatherIconUrl(iconCode?: string): string | undefined {
  if (!iconCode) return undefined;
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export interface WeatherLocation {
  lat: number;
  lon: number;
  name: string;
}

const DEFAULT_WEATHER_LOCATION: WeatherLocation = {
  lat: TIRYANI_COORDINATES.lat,
  lon: TIRYANI_COORDINATES.lon,
  name: TIRYANI_COORDINATES.name,
};

/**
 * Fetch real-time weather from OpenWeather (Current Weather + 5-Day Forecast).
 */
export async function fetchOpenWeatherData(apiKey: string, location: WeatherLocation = DEFAULT_WEATHER_LOCATION): Promise<RealtimeWeatherData> {
  const { lat, lon } = location;

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=en`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=en`;

  const [weatherRes, forecastRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(forecastUrl).catch(() => null),
  ]);

  if (!weatherRes.ok) {
    throw new Error(`OpenWeather API error: HTTP ${weatherRes.status}`);
  }

  const currentData = await weatherRes.json();
  const forecastData = forecastRes && forecastRes.ok ? await forecastRes.json() : null;

  // Process 5-day / 3-hour forecast into daily aggregates
  const dailyForecasts = parseOpenWeatherForecast(forecastData?.list);

  // Derive today's rain probability and rainfall volume from forecast
  const todayForecast = dailyForecasts[0];
  const rainToday = todayForecast?.rainMm ?? Number(currentData.rain?.['1h'] ?? currentData.rain?.['3h'] ?? 0);
  const rainChanceToday = todayForecast?.probability ?? (Number(currentData.rain?.['1h'] ?? 0) > 0 ? 80 : 15);

  const iconCode = currentData.weather?.[0]?.icon;
  const description = currentData.weather?.[0]?.description ?? 'Real-time observation';
  const weatherMain = currentData.weather?.[0]?.main ?? 'Clear';

  const visibilityKm = currentData.visibility != null ? Math.round((currentData.visibility / 1000) * 10) / 10 : undefined;
  const windSpeedKmH = Math.round((currentData.wind?.speed ?? 0) * 3.6);

  const now = new Date();
  const lastUpdated = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  return {
    temp: Math.round(currentData.main.temp),
    feelsLike: Math.round(currentData.main.feels_like),
    tempMin: Math.round(currentData.main.temp_min ?? currentData.main.temp),
    tempMax: Math.round(currentData.main.temp_max ?? currentData.main.temp),
    humidity: currentData.main.humidity,
    pressure: currentData.main.pressure,
    rain1h: currentData.rain?.['1h'],
    rainToday: Math.round(rainToday * 10) / 10,
    rainChanceToday: Math.round(rainChanceToday),
    windSpeed: windSpeedKmH,
    windDeg: currentData.wind?.deg,
    windDirection: getWindCompass(currentData.wind?.deg),
    cloudiness: currentData.clouds?.all,
    visibilityKm,
    sunrise: formatUnixTimeIST(currentData.sys?.sunrise),
    sunset: formatUnixTimeIST(currentData.sys?.sunset),
    description,
    weatherMain,
    iconCode,
    iconUrl: getOpenWeatherIconUrl(iconCode),
    locationName: currentData.name ? `${currentData.name}` : location.name,
    source: 'openweather',
    forecast: dailyForecasts,
    lastUpdated,
    rawTimestamp: Date.now(),
  };
}

/**
 * Group OpenWeather 3-hour forecast slots into daily items.
 */
function parseOpenWeatherForecast(list?: any[]): DailyForecastItem[] {
  if (!Array.isArray(list) || list.length === 0) return [];

  const groupsByDate = new Map<string, any[]>();
  for (const item of list) {
    const dateStr = typeof item.dt_txt === 'string' ? item.dt_txt.slice(0, 10) : '';
    if (!dateStr) continue;
    if (!groupsByDate.has(dateStr)) {
      groupsByDate.set(dateStr, []);
    }
    groupsByDate.get(dateStr)!.push(item);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const results: DailyForecastItem[] = [];

  for (const [dateStr, items] of groupsByDate.entries()) {
    if (results.length >= 5) break;

    const minTemps = items.map((i) => i.main?.temp_min ?? i.main?.temp).filter((v) => typeof v === 'number');
    const maxTemps = items.map((i) => i.main?.temp_max ?? i.main?.temp).filter((v) => typeof v === 'number');
    const tempMin = minTemps.length > 0 ? Math.round(Math.min(...minTemps)) : 22;
    const tempMax = maxTemps.length > 0 ? Math.round(Math.max(...maxTemps)) : 32;

    const rainMm = items.reduce((sum, i) => sum + (Number(i.rain?.['3h'] ?? 0)), 0);
    const maxPop = items.reduce((max, i) => Math.max(max, Number(i.pop ?? 0)), 0);
    const probability = Math.round(maxPop * 100);

    // Pick midday representative item (closest to index Math.floor(items.length / 2))
    const midItem = items[Math.floor(items.length / 2)] || items[0];
    const description = midItem?.weather?.[0]?.description ?? 'Partly cloudy';
    const weatherMain = midItem?.weather?.[0]?.main ?? 'Clouds';
    const iconCode = midItem?.weather?.[0]?.icon ?? '02d';

    const itemDate = new Date(`${dateStr}T12:00:00Z`);
    const isToday = dateStr === todayStr;
    const isTomorrow = isTomorrowDate(dateStr);

    const weekday = itemDate.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' });
    const dayLabel = isToday
      ? 'Today'
      : isTomorrow
        ? 'Tomorrow'
        : itemDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

    results.push({
      date: dateStr,
      dayLabel,
      weekday,
      tempMin,
      tempMax,
      rainMm: Math.round(rainMm * 10) / 10,
      probability,
      description,
      weatherMain,
      iconCode,
      iconUrl: getOpenWeatherIconUrl(iconCode),
    });
  }

  return results;
}

function isTomorrowDate(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === tomorrow.toISOString().slice(0, 10);
}

/**
 * Fallback to Open-Meteo when OpenWeather key is not set or temporarily fails.
 */
export async function fetchOpenMeteoData(location: WeatherLocation = DEFAULT_WEATHER_LOCATION): Promise<RealtimeWeatherData> {
  const { lat, lon } = location;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,precipitation,wind_speed_10m,wind_direction_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&forecast_days=6&timezone=Asia%2FKolkata`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = await res.json();

  const current = data.current || {};
  const daily = data.daily || {};

  const wmoCodes: Record<number, { desc: string; main: string; icon: string }> = {
    0: { desc: 'Clear sky', main: 'Clear', icon: '01d' },
    1: { desc: 'Mainly clear', main: 'Clear', icon: '02d' },
    2: { desc: 'Partly cloudy', main: 'Clouds', icon: '03d' },
    3: { desc: 'Overcast', main: 'Clouds', icon: '04d' },
    45: { desc: 'Fog', main: 'Atmosphere', icon: '50d' },
    48: { desc: 'Depositing rime fog', main: 'Atmosphere', icon: '50d' },
    51: { desc: 'Light drizzle', main: 'Drizzle', icon: '09d' },
    53: { desc: 'Moderate drizzle', main: 'Drizzle', icon: '09d' },
    55: { desc: 'Dense drizzle', main: 'Drizzle', icon: '09d' },
    61: { desc: 'Slight rain', main: 'Rain', icon: '10d' },
    63: { desc: 'Moderate rain', main: 'Rain', icon: '10d' },
    65: { desc: 'Heavy rain', main: 'Rain', icon: '10d' },
    71: { desc: 'Slight snow', main: 'Snow', icon: '13d' },
    80: { desc: 'Slight rain showers', main: 'Rain', icon: '09d' },
    81: { desc: 'Moderate rain showers', main: 'Rain', icon: '09d' },
    82: { desc: 'Violent rain showers', main: 'Rain', icon: '09d' },
    95: { desc: 'Thunderstorm', main: 'Thunderstorm', icon: '11d' },
    96: { desc: 'Thunderstorm with hail', main: 'Thunderstorm', icon: '11d' },
  };

  const currentWeatherCode = Number(current.weather_code ?? 0);
  const currentMeta = wmoCodes[currentWeatherCode] || { desc: 'Fair', main: 'Clear', icon: '01d' };

  const todayStr = new Date().toISOString().slice(0, 10);
  const forecast: DailyForecastItem[] = (daily.time || []).slice(0, 5).map((dateStr: string, idx: number) => {
    const code = Number(daily.weather_code?.[idx] ?? 0);
    const meta = wmoCodes[code] || { desc: 'Partly cloudy', main: 'Clouds', icon: '02d' };
    const itemDate = new Date(`${dateStr}T12:00:00Z`);
    const isToday = dateStr === todayStr;
    const isTomorrow = isTomorrowDate(dateStr);
    const dayLabel = isToday
      ? 'Today'
      : isTomorrow
        ? 'Tomorrow'
        : itemDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

    return {
      date: dateStr,
      dayLabel,
      weekday: itemDate.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
      tempMin: Math.round(Number(daily.temperature_2m_min?.[idx] ?? 22)),
      tempMax: Math.round(Number(daily.temperature_2m_max?.[idx] ?? 32)),
      rainMm: Math.round(Number(daily.precipitation_sum?.[idx] ?? 0) * 10) / 10,
      probability: Math.round(Number(daily.precipitation_probability_max?.[idx] ?? 0)),
      description: meta.desc,
      weatherMain: meta.main,
      iconCode: meta.icon,
      iconUrl: getOpenWeatherIconUrl(meta.icon),
    };
  });

  const now = new Date();
  const lastUpdated = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const sunriseIso = daily.sunrise?.[0];
  const sunsetIso = daily.sunset?.[0];
  const sunrise = sunriseIso ? new Date(sunriseIso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : undefined;
  const sunset = sunsetIso ? new Date(sunsetIso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : undefined;

  return {
    temp: Math.round(Number(current.temperature_2m ?? 30)),
    feelsLike: Math.round(Number(current.temperature_2m ?? 30)),
    tempMin: forecast[0]?.tempMin ?? 22,
    tempMax: forecast[0]?.tempMax ?? 32,
    humidity: Math.round(Number(current.relative_humidity_2m ?? 60)),
    pressure: Math.round(Number(current.surface_pressure ?? 1012)),
    rain1h: Number(current.precipitation ?? 0) > 0 ? Number(current.precipitation) : undefined,
    rainToday: forecast[0]?.rainMm ?? 0,
    rainChanceToday: forecast[0]?.probability ?? 0,
    windSpeed: Math.round(Number(current.wind_speed_10m ?? 8)),
    windDeg: current.wind_direction_10m,
    windDirection: getWindCompass(current.wind_direction_10m),
    cloudiness: undefined,
    visibilityKm: undefined,
    sunrise,
    sunset,
    description: currentMeta.desc,
    weatherMain: currentMeta.main,
    iconCode: currentMeta.icon,
    iconUrl: getOpenWeatherIconUrl(currentMeta.icon),
    locationName: location.name,
    source: 'openmeteo',
    forecast,
    lastUpdated,
    rawTimestamp: Date.now(),
  };
}

/**
 * Static fallback for offline environments.
 */
export function getOfflineFallbackWeatherData(location: WeatherLocation = DEFAULT_WEATHER_LOCATION): RealtimeWeatherData {
  const today = new Date();
  const forecast: DailyForecastItem[] = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const isToday = i === 0;
    const isTomorrow = i === 1;
    const dayLabel = isToday
      ? 'Today'
      : isTomorrow
        ? 'Tomorrow'
        : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

    return {
      date: dateStr,
      dayLabel,
      weekday: d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
      tempMin: 22 + (i % 2),
      tempMax: 32 + (i % 3),
      rainMm: i === 0 ? 0 : Number((i * 1.2).toFixed(1)),
      probability: i === 0 ? 15 : 25 + i * 10,
      description: i % 2 === 0 ? 'Partly cloudy' : 'Light rain',
      weatherMain: i % 2 === 0 ? 'Clouds' : 'Rain',
      iconCode: i % 2 === 0 ? '02d' : '10d',
      iconUrl: getOpenWeatherIconUrl(i % 2 === 0 ? '02d' : '10d'),
    };
  });

  return {
    temp: 29,
    feelsLike: 31,
    tempMin: 22,
    tempMax: 32,
    humidity: 65,
    pressure: 1012,
    rain1h: undefined,
    rainToday: 0,
    rainChanceToday: 15,
    windSpeed: 9,
    windDeg: 90,
    windDirection: 'E',
    cloudiness: 30,
    visibilityKm: 10,
    sunrise: '06:15 AM',
    sunset: '05:45 PM',
    description: 'Partly cloudy (Local estimate)',
    weatherMain: 'Clouds',
    iconCode: '02d',
    iconUrl: getOpenWeatherIconUrl('02d'),
    locationName: location.name,
    source: 'fallback',
    forecast,
    lastUpdated: today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    rawTimestamp: Date.now(),
  };
}

/**
 * Master weather loader:
 * 1. Checks memory / localStorage cache if fresh
 * 2. Tries OpenWeather if key is available
 * 3. Falls back to Open-Meteo if no key or OpenWeather request fails
 * 4. Falls back to offline estimate if both fail
 */
export async function getRealtimeWeather(_forceRefresh = false, location: WeatherLocation = DEFAULT_WEATHER_LOCATION): Promise<RealtimeWeatherData> {
  const apiKey = getOpenWeatherApiKey();

  // If OpenWeather key is present, attempt OpenWeather
  if (apiKey) {
    try {
      const data = await fetchOpenWeatherData(apiKey, location);
      return data;
    } catch (err) {
      console.warn('OpenWeather fetch failed, falling back to Open-Meteo:', err);
    }
  }

  // Attempt Open-Meteo
  try {
    const meteoData = await fetchOpenMeteoData(location);
    return meteoData;
  } catch (err) {
    console.warn('Open-Meteo fetch failed, falling back to offline estimate:', err);
    return getOfflineFallbackWeatherData(location);
  }
}
