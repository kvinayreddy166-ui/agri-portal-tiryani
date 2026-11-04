import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { WeatherWidget } from './WeatherWidget';
import { LanguageProvider } from '../../../shared/context/LanguageContext';
import * as weatherService from '../services/weatherService';

const mockWeatherData: weatherService.RealtimeWeatherData = {
  temp: 29,
  feelsLike: 31,
  tempMin: 22,
  tempMax: 32,
  humidity: 62,
  pressure: 1012,
  rain1h: 0,
  rainToday: 1.5,
  rainChanceToday: 45,
  windSpeed: 12,
  windDeg: 80,
  windDirection: 'ENE',
  cloudiness: 35,
  visibilityKm: 10,
  sunrise: '06:14 AM',
  sunset: '05:42 PM',
  description: 'Scattered clouds',
  weatherMain: 'Clouds',
  iconCode: '03d',
  iconUrl: 'https://openweathermap.org/img/wn/03d@2x.png',
  locationName: 'Tiryani Mandal, Kumram Bheem Asifabad',
  source: 'openweather',
  forecast: [
    {
      date: '2026-11-05',
      dayLabel: 'Today',
      weekday: 'Thu',
      tempMin: 22,
      tempMax: 32,
      rainMm: 1.5,
      probability: 45,
      description: 'Scattered clouds',
      iconCode: '03d',
      iconUrl: 'https://openweathermap.org/img/wn/03d@2x.png',
    },
    {
      date: '2026-11-06',
      dayLabel: 'Tomorrow',
      weekday: 'Fri',
      tempMin: 21,
      tempMax: 30,
      rainMm: 4.2,
      probability: 70,
      description: 'Moderate rain',
      iconCode: '10d',
      iconUrl: 'https://openweathermap.org/img/wn/10d@2x.png',
    },
  ],
  lastUpdated: '10:30 PM',
  rawTimestamp: Date.now(),
};

describe('WeatherWidget SSR / Render', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state or widget markup without throwing', () => {
    vi.spyOn(weatherService, 'getRealtimeWeather').mockResolvedValue(mockWeatherData);

    const html = renderToString(
      <LanguageProvider>
        <WeatherWidget />
      </LanguageProvider>
    );

    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(50);
  });
});
