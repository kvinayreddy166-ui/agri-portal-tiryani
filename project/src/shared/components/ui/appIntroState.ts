export const AGRONIX_INTRO_DISABLED_KEY = 'agronix_intro_disabled';
export const AGRONIX_INTRO_PLAYED_SESSION_KEY = 'agronix_intro_session_played';
export const AGRONIX_PLAY_INTRO_EVENT = 'agronix:play-intro';

/**
 * Triggers replaying the intro video from anywhere in the app (e.g. Settings).
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
 * Disabled by default - video does NOT play automatically at starting of website.
 */
export function shouldPlayOnInitialOpen(): boolean {
  return false;
}
