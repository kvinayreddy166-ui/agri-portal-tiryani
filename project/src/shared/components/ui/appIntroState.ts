export const AGRONIX_INTRO_DISABLED_KEY = 'agronix_intro_disabled';
export const AGRONIX_INTRO_PLAYED_SESSION_KEY = 'agronix_intro_session_played';
export const AGRONIX_PLAY_INTRO_EVENT = 'agronix:play-intro';

/**
 * Triggers replaying the intro video from anywhere in the app.
 */
export function playIntroVideo() {
  window.dispatchEvent(new CustomEvent(AGRONIX_PLAY_INTRO_EVENT));
}

/**
 * Checks whether the current page load is a browser refresh / reload.
 */
export function isPageReload(): boolean {
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length > 0) {
      return (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
    }
    // Fallback for older browsers
    return (performance as unknown as { navigation?: { type?: number } })?.navigation?.type === 1;
  } catch {
    return false;
  }
}

/**
 * Determines whether the intro video should play on this launch.
 * Plays only on initial opening, never on page refresh / reload.
 */
export function shouldPlayOnInitialOpen(): boolean {
  try {
    if (typeof window === 'undefined') return false;

    // Force play if requested via query parameter
    if (window.location.search.includes('intro')) {
      return true;
    }

    // Respect user setting if disabled
    if (localStorage.getItem(AGRONIX_INTRO_DISABLED_KEY) === 'true') {
      return false;
    }

    // Do NOT play if this is a page refresh/reload
    if (isPageReload()) {
      return false;
    }

    // Do NOT play if already played in this app session
    if (sessionStorage.getItem(AGRONIX_INTRO_PLAYED_SESSION_KEY) === 'true') {
      return false;
    }

    // Mark as played for this session so subsequent refreshes won't replay
    sessionStorage.setItem(AGRONIX_INTRO_PLAYED_SESSION_KEY, 'true');
    return true;
  } catch {
    return false;
  }
}
