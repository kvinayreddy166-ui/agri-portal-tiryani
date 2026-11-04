import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  Cloud,
  CloudRain,
  Droplets,
  ExternalLink,
  Eye,
  Key,
  RefreshCw,
  Sun,
  Sunset,
  Sunrise,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import {
  clearOpenWeatherApiKey,
  getOpenWeatherApiKey,
  getRealtimeWeather,
  hasOpenWeatherApiKey,
  RealtimeWeatherData,
  setOpenWeatherApiKey,
  TIRYANI_COORDINATES,
  validateOpenWeatherApiKey,
} from '../services/weatherService';

export function WeatherWidget() {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<RealtimeWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadWeather = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await getRealtimeWeather(isManualRefresh);
      setWeather(data);
    } catch (err) {
      console.error('Weather load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      loadWeather(false);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadWeather]);

  const handleOpenConfig = () => {
    const currentKey = getOpenWeatherApiKey() || '';
    setInputKey(currentKey);
    setConfigFeedback(null);
    setIsConfigOpen(true);
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed) {
      clearOpenWeatherApiKey();
      setConfigFeedback({
        type: 'success',
        message: t('OpenWeather key removed. Operating with Open-Meteo backup.', 'OpenWeather కీ తొలగించబడింది. Open-Meteo బ్యాకప్ సక్రియం.'),
      });
      loadWeather(true);
      return;
    }

    setValidating(true);
    setConfigFeedback(null);

    const validation = await validateOpenWeatherApiKey(trimmed);
    setValidating(false);

    if (validation.valid) {
      setOpenWeatherApiKey(trimmed);
      setConfigFeedback({
        type: 'success',
        message: t(
          `OpenWeather API key verified for ${validation.cityName || 'Tiryani'}! Loading real-time data...`,
          `OpenWeather API కీ విజయవంతంగా ధృవీకరించబడింది (${validation.cityName || 'తిర్యాని'})! ప్రత్యక్ష డేటా లోడ్ అవుతోంది...`
        ),
      });
      setTimeout(() => {
        setIsConfigOpen(false);
        loadWeather(true);
      }, 1000);
    } else {
      setConfigFeedback({
        type: 'error',
        message: validation.message,
      });
    }
  };

  const handleClearApiKey = () => {
    clearOpenWeatherApiKey();
    setInputKey('');
    setConfigFeedback({
      type: 'success',
      message: t('OpenWeather key cleared. Using live backup feed.', 'OpenWeather కీ తీసివేయబడింది. బ్యాకప్ ఫీడ్ ఉపయోగిస్తున్నాం.'),
    });
    loadWeather(true);
  };

  if (loading) {
    return (
      <div className="portal-card flex h-64 items-center justify-center rounded-2xl p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-600" />
          <p className="text-xs font-semibold text-slate-500">
            {t('Connecting to real-time weather feed...', 'లైవ్ వాతావరణ సమాచారం సేకరిస్తున్నాం...')}
          </p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="portal-card rounded-2xl p-5 text-sm text-red-600 dark:text-red-400">
        <p className="font-semibold">{t('Unable to load weather data.', 'వాతావరణ డేటా లోడ్ కాలేదు.')}</p>
        <button
          onClick={() => loadWeather(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('Retry', 'మళ్ళీ ప్రయత్నించండి')}
        </button>
      </div>
    );
  }

  const isUsingOpenWeather = weather.source === 'openweather';
  const hasConfiguredKey = hasOpenWeatherApiKey();

  return (
    <div className="portal-card overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm dark:border-slate-800">
      {/* Header */}
      <div className="relative rounded-t-2xl bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-900 px-5 py-4 text-white">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400/80 to-transparent" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-white/10 p-2 ring-1 ring-white/15 backdrop-blur-sm">
              <CloudRain className="h-5 w-5 text-gold-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight sm:text-lg">
                {t('Live Weather — Tiryani Mandal', 'లైవ్ వాతావరణం — తిర్యాని మండలం')}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {TIRYANI_COORDINATES.district}, {TIRYANI_COORDINATES.state} (19.42° N, 79.33° E)
              </p>
            </div>
          </div>

          {/* Badges & Actions */}
          <div className="flex items-center gap-2">
            {isUsingOpenWeather ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-200 backdrop-blur-sm shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('OpenWeather Live', 'ఓపెన్‌వెదర్ లైవ్')}
              </span>
            ) : weather.source === 'openmeteo' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/20 px-2.5 py-1 text-xs font-bold text-sky-200 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                {t('Open-Meteo Feed', 'ఓపెన్-మీటియో ఫీడ్')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-200">
                {t('Local Estimate', 'స్థానిక అంచనా')}
              </span>
            )}

            <button
              onClick={() => loadWeather(true)}
              disabled={refreshing}
              title={t('Refresh live weather data', 'లైవ్ వాతావరణాన్ని రీఫ్రెష్ చేయండి')}
              aria-label={t('Refresh weather', 'వాతావరణం రిఫ్రెష్')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenConfig}
              title={t('Configure OpenWeather API Key', 'OpenWeather API కీ సెట్ చేయండి')}
              aria-label={t('OpenWeather Settings', 'ఓపెన్‌వెదర్ సెట్టింగ్‌లు')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition active:scale-95 ${
                hasConfiguredKey
                  ? 'bg-emerald-600/60 text-emerald-100 hover:bg-emerald-600 ring-1 ring-emerald-400/40'
                  : 'bg-gold-500/20 text-gold-200 hover:bg-gold-500/30 ring-1 ring-gold-400/50'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {hasConfiguredKey ? t('API Key Active', 'కీ సక్రియం') : t('Set Key', 'కీ సెట్ చేయండి')}
              </span>
            </button>
          </div>
        </div>

        {/* Current Weather Overview Banner */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white/10 p-3.5 ring-1 ring-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            {weather.iconUrl ? (
              <img
                src={weather.iconUrl}
                alt={weather.description}
                className="h-14 w-14 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] filter"
                loading="eager"
              />
            ) : (
              <Sun className="h-12 w-12 text-gold-300" />
            )}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white sm:text-4xl">{weather.temp}°C</span>
                <span className="text-xs font-semibold text-emerald-100/90">
                  {t('Feels like', 'అనుభూతి')} {weather.feelsLike}°C
                </span>
              </div>
              <p className="text-sm font-semibold capitalize text-emerald-100">
                {weather.description}
              </p>
              <p className="text-xs text-emerald-200/70">
                {t('Today range', 'ఈరోజు పరిధి')}: {weather.tempMax}°C / {weather.tempMin}°C
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-emerald-100/80">
            <p className="font-semibold text-white">
              {weather.locationName}
            </p>
            <p className="mt-0.5">
              {t('Updated', 'అప్‌డేట్')}: {weather.lastUpdated}
            </p>
          </div>
        </div>

        {/* Informational Callout when OpenWeather key is not configured */}
        {!hasConfiguredKey && (
          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-950/60 px-3 py-1.5 text-xs text-emerald-200 ring-1 ring-emerald-500/20">
            <span className="truncate">
              {t(
                'Operating on Open-Meteo. Want official OpenWeather real-time radar?',
                'Open-Meteo ఫీడ్ నడుస్తోంది. అధికారిక OpenWeather కీని జోడించాలనుకుంటున్నారా?'
              )}
            </span>
            <button
              onClick={handleOpenConfig}
              className="ml-2 shrink-0 font-bold text-gold-300 underline hover:text-gold-200"
            >
              {t('Connect Key', 'కీ కలపండి')}
            </button>
          </div>
        )}
      </div>

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-4">
        {/* Metric 1: Temperature */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 transition-all hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800/80">
          <div className="rounded-lg bg-orange-500/10 p-2 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
            <Thermometer className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Temperature', 'ఉష్ణోగ్రత')}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{weather.temp}°C</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('Feels', 'అనుభవం')} {weather.feelsLike}°C
            </p>
          </div>
        </div>

        {/* Metric 2: Humidity & Pressure */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 transition-all hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800/80">
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Droplets className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Humidity', 'తేమ')}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{weather.humidity}%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {weather.pressure} hPa
            </p>
          </div>
        </div>

        {/* Metric 3: Rain & Precipitation */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 transition-all hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800/80">
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
            <CloudRain className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Rain Today', 'ఈరోజు వర్షం')}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {weather.rainToday} mm
            </p>
            <p className="text-xs font-bold text-sky-700 dark:text-sky-300">
              {weather.rainChanceToday}% {t('chance', 'అవకాశం')}
            </p>
          </div>
        </div>

        {/* Metric 4: Wind & Direction */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 transition-all hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800/80">
          <div className="rounded-lg bg-teal-500/10 p-2 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
            <Wind className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Wind Speed', 'గాలి వేగం')}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{weather.windSpeed} km/h</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {weather.windDirection ? `${weather.windDirection} (${weather.windDeg ?? 0}°)` : 'Calm'}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar (Sunrise, Sunset, Cloudiness, Visibility) */}
      {(weather.sunrise || weather.visibilityKm || weather.cloudiness != null) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400">
          {weather.sunrise && (
            <div className="flex items-center gap-1.5">
              <Sunrise className="h-4 w-4 text-amber-500" />
              <span>{t('Sunrise', 'సూర్యోదయం')}: <strong className="text-slate-800 dark:text-slate-200">{weather.sunrise}</strong></span>
            </div>
          )}
          {weather.sunset && (
            <div className="flex items-center gap-1.5">
              <Sunset className="h-4 w-4 text-orange-500" />
              <span>{t('Sunset', 'సూర్యాస్తమయం')}: <strong className="text-slate-800 dark:text-slate-200">{weather.sunset}</strong></span>
            </div>
          )}
          {weather.cloudiness != null && (
            <div className="flex items-center gap-1.5">
              <Cloud className="h-4 w-4 text-sky-500" />
              <span>{t('Clouds', 'మేఘాలు')}: <strong className="text-slate-800 dark:text-slate-200">{weather.cloudiness}%</strong></span>
            </div>
          )}
          {weather.visibilityKm != null && (
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-indigo-500" />
              <span>{t('Visibility', 'దృశ్యత')}: <strong className="text-slate-800 dark:text-slate-200">{weather.visibilityKm} km</strong></span>
            </div>
          )}
        </div>
      )}

      {/* 5-Day Agro-Meteorological Forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="border-t border-slate-100 p-4 sm:p-5 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {t('5-Day Agro Weather Forecast', '5-రోజుల వ్యవసాయ వాతావరణ అంచనా')}
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {isUsingOpenWeather ? t('OpenWeather 3h aggregated', 'ఓపెన్‌వెదర్ 3గంటల సమీకృతం') : t('Forecast feed', 'అంచనా ఫీడ్')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {weather.forecast.slice(0, 5).map((day, index) => {
              const label =
                index === 0
                  ? t('Today', 'ఈరోజు')
                  : index === 1
                    ? t('Tomorrow', 'రేపు')
                    : day.dayLabel;

              return (
                <article
                  key={day.date}
                  className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 text-center transition hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:border-slate-700/80 dark:bg-slate-950/70 dark:hover:border-emerald-600/40"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      {label}
                    </p>
                    <div className="my-1.5 flex justify-center">
                      {day.iconUrl ? (
                        <img
                          src={day.iconUrl}
                          alt={day.description}
                          className="h-10 w-10 drop-shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <CloudRain className="h-8 w-8 text-cyan-600" />
                      )}
                    </div>
                    <p className="text-xs font-semibold capitalize line-clamp-1 text-slate-700 dark:text-slate-300" title={day.description}>
                      {day.description}
                    </p>
                  </div>

                  <div className="mt-2 border-t border-slate-200/60 pt-2 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      <span className="text-slate-950 dark:text-white">{day.tempMax}°</span>
                      <span className="mx-1 text-slate-400">/</span>
                      <span className="text-slate-500 dark:text-slate-400">{day.tempMin}°</span>
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                      <Droplets className="h-3 w-3" />
                      <span>{day.rainMm} mm</span>
                      <span>({day.probability}%)</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* OpenWeather API Key Configuration Modal */}
      {isConfigOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Key className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('OpenWeather API Configuration', 'OpenWeather API కాన్ఫిగరేషన్')}
                </h4>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                {t(
                  'AGRONIX connects to OpenWeather to deliver real-time temperatures, hourly rainfall tracking, and 5-day agro-meteorological forecasts for Tiryani Mandal.',
                  'తిర్యాని మండలం కోసం రియల్-టైమ్ వాతావరణం, వర్షపాతం మరియు 5-రోజుల వ్యవసాయ అంచనాలను పొందడానికి OpenWeather APIని ఉపయోగించండి.'
                )}
              </p>

              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-emerald-900 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-200">
                <p className="font-bold">
                  {t('How to get a FREE API key (1 min):', 'ఉచిత API కీని ఎలా పొందాలి (1 నిమిషం):')}
                </p>
                <ol className="mt-1.5 list-decimal pl-4 space-y-1">
                  <li>
                    <a
                      href="https://openweathermap.org/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold underline hover:text-emerald-700 dark:hover:text-emerald-300"
                    >
                      {t('Register on openweathermap.org', 'openweathermap.org లో రిజిస్టర్ అవ్వండి')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>{t('Generate a free API key under "My API Keys".', '"My API Keys" క్రింద ఉచిత API కీని రూపొందించండి.')}</li>
                  <li>{t('Paste it below and click "Test & Save".', 'దాన్ని క్రింద పేస్ట్ చేసి "టెస్ట్ & సేవ్" పై క్లిక్ చేయండి.')}</li>
                </ol>
                <p className="mt-2 text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  {t(
                    '*Note: Newly registered OpenWeather keys take 10–15 minutes to activate on OpenWeather servers.',
                    '*గమనిక: కొత్త OpenWeather కీలు సర్వర్‌లో యాక్టివేట్ కావడానికి 10-15 నిమిషాలు పడుతుంది.'
                  )}
                </p>
              </div>

              <form onSubmit={handleSaveApiKey} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    {t('OpenWeather API Key (AppID)', 'OpenWeather API కీ')}
                  </label>
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="e.g. 8f6b21c430a9e7123456789abcdef012"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-xs text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {t('Stored securely in your browser cache or configured via VITE_OPENWEATHER_API_KEY in .env', 'బ్రౌజర్‌లో సురక్షితంగా నిల్వ చేయబడుతుంది లేదా .env లో సెట్ చేయవచ్చు')}
                  </p>
                </div>

                {configFeedback && (
                  <div
                    className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
                      configFeedback.type === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200'
                        : 'border border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/70 dark:text-red-200'
                    }`}
                  >
                    {configFeedback.type === 'success' ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <span>{configFeedback.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  {hasConfiguredKey && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {t('Remove Key', 'కీ తొలగించు')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {t('Close', 'మూసివేయి')}
                  </button>
                  <button
                    type="submit"
                    disabled={validating}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    {validating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        {t('Verifying Key...', 'ధృవీకరిస్తున్నాం...')}
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {t('Test & Save', 'టెస్ట్ చేసి సేవ్ చేయండి')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
