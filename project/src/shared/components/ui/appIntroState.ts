export const AGRONIX_INTRO_DISABLED_KEY = 'agronix_intro_disabled';
export const AGRONIX_PLAY_INTRO_EVENT = 'agronix:play-intro';

/**
 * Triggers replaying the intro video from anywhere in the app.
 */
export function playIntroVideo() {
  window.dispatchEvent(new CustomEvent(AGRONIX_PLAY_INTRO_EVENT));
}
