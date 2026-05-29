import React, { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/** Tiryani Mandal, Kumram Bheem Asifabad */
const TIRYANI_CENTER = { lat: 19.17631, lng: 79.27137 };
const TIRYANI_QUERY = 'Tiryani Mandal, Kumuram Bheem Asifabad, Telangana, India';

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
          setTilt: (t: number) => void;
          setHeading: (h: number) => void;
        };
        Marker: new (opts: Record<string, unknown>) => { setMap: (m: unknown | null) => void };
      };
    };
  }
}

export function GoogleMapWidget() {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ setTilt: (t: number) => void; setHeading: (h: number) => void } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    const initMap = () => {
      if (!window.google?.maps || !mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: TIRYANI_CENTER,
        zoom: 16,
        mapTypeId: 'hybrid',
        tilt: 67,
        heading: 25,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        rotateControl: true,
        gestureHandling: 'greedy',
      });
      mapInstanceRef.current = map;
      new window.google.maps.Marker({
        position: TIRYANI_CENTER,
        map,
        title: 'Tiryani Mandal — MAO Office Area',
      });
    };

    if (window.google?.maps) {
      initMap();
      return;
    }

    const scriptId = 'google-maps-script';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', initMap);
      return () => existing.removeEventListener('load', initMap);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = () => setLoadError(true);
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    let heading = 25;
    const id = window.setInterval(() => {
      heading = (heading + 2) % 360;
      map.setHeading(heading);
      map.setTilt(67);
    }, 4000);
    return () => window.clearInterval(id);
  }, [loadError, apiKey]);

  if (!apiKey || loadError) {
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(TIRYANI_QUERY)}&ll=${TIRYANI_CENTER.lat},${TIRYANI_CENTER.lng}&z=16&t=k&output=embed`;
    return (
      <div className="portal-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <MapPin className="h-5 w-5 text-emerald-600" />
          <h3 className="font-black text-slate-900 dark:text-white">
            {t('Tiryani Mandal — 3D Satellite', 'తిర్యాని మండలం — 3D ఉపగ్రహ')}
          </h3>
        </div>
        {!apiKey && (
          <p className="flex items-center gap-2 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t(
              'Set VITE_GOOGLE_MAPS_API_KEY in .env for interactive 3D terrain (tilt & rotate).',
              'ఇంటరాక్టివ్ 3D టెర్రైన్ కోసం .env లో VITE_GOOGLE_MAPS_API_KEY సెట్ చేయండి.'
            )}
          </p>
        )}
        <iframe
          title="Tiryani Mandal Map"
          src={embedUrl}
          className="h-80 w-full border-0 md:h-96"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  return (
    <div className="portal-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <MapPin className="h-5 w-5 text-emerald-600" />
        <h3 className="font-black text-slate-900 dark:text-white">
          {t('Tiryani Mandal — 3D Terrain', 'తిర్యాని మండలం — 3D భూమి')}
        </h3>
      </div>
      <p className="px-4 py-1 text-xs text-slate-500 dark:text-slate-400">
        {t('Drag to pan · Pinch or scroll to zoom · Ctrl+drag to rotate', 'డ్రాగ్ · జూమ్ · Ctrl+డ్రాగ్ తిప్పండి')}
      </p>
      <div ref={mapRef} className="h-80 w-full md:h-96" />
    </div>
  );
}
