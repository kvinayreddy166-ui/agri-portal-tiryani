import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getWindCompass,
  getOpenWeatherApiKey,
  setOpenWeatherApiKey,
  clearOpenWeatherApiKey,
  hasOpenWeatherApiKey,
  getOfflineFallbackWeatherData,
  getRealtimeWeather,
  fetchOpenWeatherData,
  validateOpenWeatherApiKey,
} from './weatherService';

describe('weatherService', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubEnv('VITE_OPENWEATHER_API_KEY', '');
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
          return true;
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
        clear: () => {
          store.clear();
        },
      },
    });
    clearOpenWeatherApiKey();
    vi.restoreAllMocks();
  });

  describe('getWindCompass', () => {
    it('converts cardinal degrees correctly', () => {
      expect(getWindCompass(0)).toBe('N');
      expect(getWindCompass(360)).toBe('N');
      expect(getWindCompass(90)).toBe('E');
      expect(getWindCompass(180)).toBe('S');
      expect(getWindCompass(270)).toBe('W');
      expect(getWindCompass(45)).toBe('NE');
      expect(getWindCompass(135)).toBe('SE');
    });

    it('handles undefined or invalid degrees safely', () => {
      expect(getWindCompass(undefined)).toBe('—');
      expect(getWindCompass(NaN)).toBe('—');
    });
  });

  describe('API key management', () => {
    it('stores, retrieves, and clears the OpenWeather API key', () => {
      expect(hasOpenWeatherApiKey()).toBe(false);
      setOpenWeatherApiKey('test_key_12345');
      expect(hasOpenWeatherApiKey()).toBe(true);
      expect(getOpenWeatherApiKey()).toBe('test_key_12345');

      clearOpenWeatherApiKey();
      expect(hasOpenWeatherApiKey()).toBe(false);
      expect(getOpenWeatherApiKey()).toBe(null);
    });

    it('validates an API key correctly with OpenWeather API endpoint', async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('appid=valid_key')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ name: 'Tiryani' }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        });
      });

      vi.stubGlobal('fetch', fetchMock);

      const validResult = await validateOpenWeatherApiKey('valid_key');
      expect(validResult.valid).toBe(true);
      expect(validResult.cityName).toBe('Tiryani');

      const invalidResult = await validateOpenWeatherApiKey('bad_key');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.message).toContain('Invalid API Key');
    });
  });

  describe('getOfflineFallbackWeatherData', () => {
    it('returns a complete fallback dataset for Tiryani Mandal', () => {
      const fallback = getOfflineFallbackWeatherData();
      expect(fallback.source).toBe('fallback');
      expect(fallback.temp).toBeGreaterThan(0);
      expect(fallback.humidity).toBeGreaterThan(0);
      expect(fallback.locationName).toContain('Tiryani');
      expect(fallback.forecast.length).toBe(5);
      expect(fallback.forecast[0].dayLabel).toBe('Today');
    });
  });

  describe('fetchOpenWeatherData', () => {
    it('parses real-time weather and 5-day forecast correctly from OpenWeather response', async () => {
      const mockCurrent = {
        name: 'Tiryani',
        main: {
          temp: 31.4,
          feels_like: 33.1,
          temp_min: 28.0,
          temp_max: 33.0,
          pressure: 1011,
          humidity: 58,
        },
        weather: [
          {
            id: 801,
            main: 'Clouds',
            description: 'few clouds',
            icon: '02d',
          },
        ],
        wind: { speed: 3.5, deg: 110 },
        clouds: { all: 20 },
        visibility: 9000,
        sys: {
          sunrise: 1730767200,
          sunset: 1730809200,
        },
      };

      const mockForecast = {
        list: [
          {
            dt: 1730782800,
            dt_txt: '2026-11-05 09:00:00',
            main: { temp: 30, temp_min: 28, temp_max: 32, humidity: 60 },
            weather: [{ description: 'few clouds', icon: '02d', main: 'Clouds' }],
            pop: 0.15,
            rain: { '3h': 0 },
          },
          {
            dt: 1730793600,
            dt_txt: '2026-11-05 12:00:00',
            main: { temp: 32, temp_min: 29, temp_max: 33, humidity: 55 },
            weather: [{ description: 'clear sky', icon: '01d', main: 'Clear' }],
            pop: 0.2,
            rain: { '3h': 0 },
          },
          {
            dt: 1730869200,
            dt_txt: '2026-11-06 12:00:00',
            main: { temp: 29, temp_min: 26, temp_max: 30, humidity: 70 },
            weather: [{ description: 'light rain', icon: '10d', main: 'Rain' }],
            pop: 0.65,
            rain: { '3h': 3.2 },
          },
        ],
      };

      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/data/2.5/weather')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockCurrent),
          });
        }
        if (url.includes('/data/2.5/forecast')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockForecast),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      vi.stubGlobal('fetch', fetchMock);

      const data = await fetchOpenWeatherData('valid_api_key_xyz');

      expect(data.source).toBe('openweather');
      expect(data.temp).toBe(31);
      expect(data.feelsLike).toBe(33);
      expect(data.humidity).toBe(58);
      expect(data.pressure).toBe(1011);
      expect(data.windSpeed).toBe(Math.round(3.5 * 3.6));
      expect(data.description).toBe('few clouds');
      expect(data.iconCode).toBe('02d');
      expect(data.iconUrl).toContain('02d@2x.png');
      expect(data.locationName).toContain('Tiryani');
      expect(data.forecast.length).toBe(2);
      expect(data.forecast[1].rainMm).toBe(3.2);
      expect(data.forecast[1].probability).toBe(65);
    });
  });

  describe('getRealtimeWeather error recovery', () => {
    it('gracefully falls back to Open-Meteo or fallback when OpenWeather fails', async () => {
      setOpenWeatherApiKey('faulty_key');

      // Force fetch to reject on OpenWeather
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('openweathermap.org')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
          });
        }
        if (url.includes('open-meteo.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                current: {
                  temperature_2m: 27.5,
                  relative_humidity_2m: 65,
                  precipitation: 0.5,
                  wind_speed_10m: 10,
                  weather_code: 61,
                },
                daily: {
                  time: ['2026-11-05', '2026-11-06'],
                  precipitation_sum: [0.5, 2.0],
                  precipitation_probability_max: [40, 70],
                  weather_code: [61, 63],
                },
              }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      vi.stubGlobal('fetch', fetchMock);

      const weather = await getRealtimeWeather();
      expect(weather.source).toBe('openmeteo');
      expect(weather.temp).toBe(28);
      expect(weather.description).toBe('Slight rain');
    });
  });
});
