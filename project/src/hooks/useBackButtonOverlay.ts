import { useCallback, useEffect, useRef } from 'react';

function getHistoryState() {
  const state = window.history.state;
  return state && typeof state === 'object' ? state : {};
}

function stripOverlayState(state: Record<string, unknown>, overlayKey: string) {
  const next = { ...state };
  if (next.tiryaniOverlay === overlayKey) {
    delete next.tiryaniOverlay;
  }
  return next;
}

export function useBackButtonOverlay(overlayKey: string, onBackClose: () => void) {
  const ownsHistoryRef = useRef(false);
  const onBackCloseRef = useRef(onBackClose);

  useEffect(() => {
    onBackCloseRef.current = onBackClose;
  }, [onBackClose]);

  const pushOverlay = useCallback(() => {
    if (ownsHistoryRef.current) return;
    window.history.pushState({ ...getHistoryState(), tiryaniOverlay: overlayKey }, '', window.location.href);
    ownsHistoryRef.current = true;
  }, [overlayKey]);

  const closeOverlay = useCallback(() => {
    if (ownsHistoryRef.current && getHistoryState().tiryaniOverlay === overlayKey) {
      window.history.back();
      return;
    }
    ownsHistoryRef.current = false;
    onBackCloseRef.current();
  }, [overlayKey]);

  const releaseOverlay = useCallback(() => {
    ownsHistoryRef.current = false;
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (!ownsHistoryRef.current) return;
      ownsHistoryRef.current = false;
      onBackCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    return () => {
      if (!ownsHistoryRef.current || getHistoryState().tiryaniOverlay !== overlayKey) return;
      window.history.replaceState(stripOverlayState(getHistoryState(), overlayKey), '', window.location.href);
      ownsHistoryRef.current = false;
    };
  }, [overlayKey]);

  return { pushOverlay, closeOverlay, releaseOverlay };
}
