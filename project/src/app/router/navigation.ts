import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Location, NavigationType } from 'react-router-dom';
import { getRouteBackFallback } from './paths';

const SCROLL_POSITIONS_KEY = 'tiryani-route-scroll-positions';

export function getRouteUrl(location: Pick<Location, 'pathname' | 'search' | 'hash'>) {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function getHistoryIndex() {
  const state = window.history.state as { idx?: number } | null;
  return typeof state?.idx === 'number' ? state.idx : 0;
}

export function useAppScrollRestoration(location: Location, navigationType: NavigationType) {
  useEffect(() => {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = original;
    };
  }, []);

  useLayoutEffect(() => {
    const scrollKey = location.key || getRouteUrl(location);
    const positions = readScrollPositions();
    const restoreY = navigationType === 'POP' ? positions[scrollKey] || 0 : 0;
    const restoreTimer = window.setTimeout(() => {
      window.scrollTo({ top: restoreY, left: 0 });
    }, 0);

    return () => {
      window.clearTimeout(restoreTimer);
      writeScrollPosition(scrollKey, window.scrollY);
    };
  }, [location, navigationType]);
}

function readScrollPositions(): Record<string, number> {
  try {
    return JSON.parse(window.sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function writeScrollPosition(key: string, value: number) {
  try {
    const positions = readScrollPositions();
    positions[key] = value;
    window.sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
  } catch {
    // Scroll restoration is a progressive enhancement.
  }
}

export function useInitialBackFallback(
  location: Location,
  loading: boolean,
  isAuthenticated: boolean
) {
  const guardedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    // Skip history manipulation for public officer-toolkit routes
    if (location.pathname.startsWith('/officer-toolkit/')) return;

    const currentUrl = getRouteUrl(location);
    const fallbackPath = getRouteBackFallback(location.pathname, isAuthenticated);
    if (!fallbackPath || fallbackPath === currentUrl || guardedUrlRef.current === currentUrl) return;
    if (getHistoryIndex() > 0) return;

    const currentState = window.history.state && typeof window.history.state === 'object'
      ? { ...window.history.state }
      : {};
    const currentKey = typeof currentState.key === 'string' ? currentState.key : location.key;
    const fallbackKey = `fallback-${Date.now()}`;

    window.history.replaceState(
      { ...currentState, idx: 0, key: fallbackKey, usr: { tiryaniFallback: true } },
      '',
      fallbackPath
    );
    window.history.pushState(
      { ...currentState, idx: 1, key: currentKey, usr: currentState.usr },
      '',
      currentUrl
    );
    guardedUrlRef.current = currentUrl;
  }, [isAuthenticated, loading, location]);
}

export function useAppBootReady(ready: boolean) {
  useEffect(() => {
    window.__TIRYANI_APP_BOOTED__ = ready;
  }, [ready]);
}
