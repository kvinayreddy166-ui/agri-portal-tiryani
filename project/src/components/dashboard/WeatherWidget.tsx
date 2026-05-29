import React, { useEffect, useState } from 'react';
import { CloudRain, Droplets, Thermometer, Wind } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/** Tiryani Mandal approximate center */
const LAT = 19.4167;
const LON = 79.3333;

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  rain1h?: number;
  rainToday?: number;
  description: string;
  windSpeed: number;
  source: 'openweather' | 'openmeteo';
}

export function WeatherWidget() {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;

  useEffect(() => {
    const fetchOpenWeather = async (): Promise<WeatherData | null> => {
      if (!openWeatherKey) return null;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${openWeatherKey}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        rain1h: data.rain?.['1h'] ?? data.rain?.['3h'],
        description: data.weather?.[0]?.description ?? '',
        windSpeed: data.wind?.speed ?? 0,
        source: 'openweather',
      };
    };

    const fetchOpenMeteo = async (): Promise<WeatherData> => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=precipitation_sum&timezone=Asia%2FKolkata`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      const current = data.current;
      const codes: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        61: 'Light rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        80: 'Rain showers',
        95: 'Thunderstorm',
      };
      const desc = codes[current.weather_code as number] || 'Tiryani Mandal';
      return {
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.temperature_2m),
        humidity: current.relative_humidity_2m,
        rain1h: current.precipitation > 0 ? current.precipitation : undefined,
        rainToday: data.daily?.precipitation_sum?.[0],
        description: desc,
        windSpeed: current.wind_speed_10m,
        source: 'openmeteo',
      };
    };

    const load = async () => {
      try {
        const ow = await fetchOpenWeather();
        if (ow) {
          setWeather(ow);
          return;
        }
        setWeather(await fetchOpenMeteo());
      } catch {
        setError('fetch_failed');
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [openWeatherKey]);

  if (loading) {
    return (
      <div className="portal-card flex h-48 items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="portal-card p-5 text-sm text-red-600 dark:text-red-400">
        {t('Unable to load weather data.', 'వాతావరణ డేటా లోడ్ కాలేదు.')}
      </div>
    );
  }

  return (
    <div className="portal-card overflow-hidden">
      <div className="bg-gradient-to-r from-sky-600 to-cyan-600 px-5 py-4 text-white">
        <h3 className="flex items-center gap-2 text-lg font-black">
          <CloudRain className="h-6 w-6" />
          {t('Live Weather — Tiryani Mandal', 'లైవ్ వాతావరణం — తిర్యాని మండలం')}
        </h3>
        <p className="mt-1 text-sm capitalize text-sky-100">{weather.description}</p>
        {!openWeatherKey && (
          <p className="mt-1 text-xs text-sky-200/80">
            {t('Powered by Open-Meteo (free). Add VITE_OPENWEATHER_API_KEY for OpenWeather.', 'Open-Meteo ద్వారా. OpenWeather కోసం API కీ జోడించండి.')}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <div className="flex items-center gap-3">
          <Thermometer className="h-8 w-8 text-orange-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('Temperature', 'ఉష్ణోగ్రత')}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{weather.temp}°C</p>
            <p className="text-xs text-slate-400">
              {t('Feels', 'అనుభవం')} {weather.feelsLike}°C
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Droplets className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('Humidity', 'తేమ')}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CloudRain className="h-8 w-8 text-cyan-600" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {weather.rainToday != null ? t('Rain today', 'ఈరోజు వర్షం') : t('Rain (now)', 'వర్షం')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {weather.rainToday != null
                ? `${weather.rainToday} mm`
                : weather.rain1h != null
                  ? `${weather.rain1h} mm`
                  : '0 mm'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Wind className="h-8 w-8 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('Wind', 'గాలి')}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{weather.windSpeed} m/s</p>
          </div>
        </div>
      </div>
    </div>
  );
}
