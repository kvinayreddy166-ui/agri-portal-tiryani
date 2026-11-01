import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { AGRONIX_INTRO_DISABLED_KEY, AGRONIX_PLAY_INTRO_EVENT } from './appIntroState';

interface AppIntroSplashProps {
  onFinish?: () => void;
}

export const AppIntroSplash: React.FC<AppIntroSplashProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      if (localStorage.getItem(AGRONIX_INTRO_DISABLED_KEY) === 'true') {
        return false;
      }
    } catch {
      // Storage access error fallback
    }
    return true;
  });

  const [isFading, setIsFading] = useState(false);
  // Default sound is ON
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isDismissingRef = useRef(false);
  const hasStartedRef = useRef(false);
  const dismissTimeoutRef = useRef<number | null>(null);
  const startupWatchdogRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    if (startupWatchdogRef.current) {
      window.clearTimeout(startupWatchdogRef.current);
      startupWatchdogRef.current = null;
    }
    if (dismissTimeoutRef.current) {
      window.clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    clearAllTimers();

    setIsFading(true);

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // Safe fallback
      }
    }

    dismissTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setIsFading(false);
      isDismissingRef.current = false;
      if (onFinish) {
        onFinish();
      }
    }, 450);
  }, [clearAllTimers, onFinish]);

  // Listen for programmatic replay events (e.g. from Settings or About dialog)
  useEffect(() => {
    const handleReplay = () => {
      clearAllTimers();
      isDismissingRef.current = false;
      hasStartedRef.current = false;
      setIsFading(false);
      setIsVisible(true);
      setProgress(0);

      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.muted = false;
        video.defaultMuted = false;
        setIsMuted(false);
        const p = video.play();
        if (p) {
          p.then(() => {
            hasStartedRef.current = true;
          }).catch((err) => {
            console.warn('Replay play error:', err);
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              void videoRef.current.play();
            }
          });
        }
      }
    };

    window.addEventListener(AGRONIX_PLAY_INTRO_EVENT, handleReplay);
    return () => {
      window.removeEventListener(AGRONIX_PLAY_INTRO_EVENT, handleReplay);
    };
  }, [clearAllTimers]);

  // Keyboard controls: Escape to skip, M to mute/unmute
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleDismiss]);

  // Video initialization & autoplay handling with default sound ON
  useEffect(() => {
    if (!isVisible) return;

    const video = videoRef.current;
    if (!video) return;

    // Default sound ON: Attempt unmuted playback
    video.muted = false;
    video.defaultMuted = false;
    setIsMuted(false);

    // 10s fallback watchdog only if video completely fails to play
    startupWatchdogRef.current = window.setTimeout(() => {
      if (!hasStartedRef.current) {
        console.warn('Intro video failed to start within 10s; skipping.');
        handleDismiss();
      }
    }, 10000);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Playback started successfully with sound!
          hasStartedRef.current = true;
          setIsMuted(false);
          if (startupWatchdogRef.current) {
            window.clearTimeout(startupWatchdogRef.current);
            startupWatchdogRef.current = null;
          }
        })
        .catch((err) => {
          console.warn('Browser autoplay policy blocked unmuted sound on cold start:', err);
          // If browser strictly blocks unmuted audio on cold start, play muted first so video is not blocked
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            const mutedPromise = videoRef.current.play();
            if (mutedPromise) {
              mutedPromise
                .then(() => {
                  hasStartedRef.current = true;
                  if (startupWatchdogRef.current) {
                    window.clearTimeout(startupWatchdogRef.current);
                    startupWatchdogRef.current = null;
                  }
                })
                .catch((mutedErr) => {
                  console.warn('Muted autoplay blocked or failed:', mutedErr);
                  handleDismiss();
                });
            }

            // Immediately unmute as soon as the user touches/clicks anywhere
            const enableSoundOnUserAction = () => {
              if (videoRef.current) {
                videoRef.current.muted = false;
                setIsMuted(false);
              }
              window.removeEventListener('pointerdown', enableSoundOnUserAction);
              window.removeEventListener('keydown', enableSoundOnUserAction);
            };

            window.addEventListener('pointerdown', enableSoundOnUserAction, { once: true });
            window.addEventListener('keydown', enableSoundOnUserAction, { once: true });
          }
        });
    }

    return () => {
      clearAllTimers();
    };
  }, [isVisible, handleDismiss, clearAllTimers]);

  const toggleSound = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    hasStartedRef.current = true;
    if (startupWatchdogRef.current) {
      window.clearTimeout(startupWatchdogRef.current);
      startupWatchdogRef.current = null;
    }

    const pct = Math.min(100, Math.max(0, (video.currentTime / video.duration) * 100));
    setProgress(pct);

    // When the video reaches the end (within 0.08s of duration), dismiss smoothly
    if (video.duration > 0 && video.currentTime >= video.duration - 0.08) {
      handleDismiss();
    }
  };

  const handlePlaying = () => {
    hasStartedRef.current = true;
    if (startupWatchdogRef.current) {
      window.clearTimeout(startupWatchdogRef.current);
      startupWatchdogRef.current = null;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="AGRONIX Intro Video"
      aria-modal="true"
      className={`fixed inset-0 z-[100000] flex items-center justify-center bg-black select-none overflow-hidden h-[100dvh] w-screen transition-opacity duration-500 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow for widescreen & portrait matching cinematic style */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(5,150,105,0.4) 0%, rgba(6,78,59,0.3) 45%, #000000 100%)',
        }}
      />

      {/* Main Video Element Container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-0 md:p-6">
        <video
          ref={videoRef}
          src="/agronix-intro.mp4"
          playsInline
          autoPlay
          preload="auto"
          muted={isMuted}
          onPlaying={handlePlaying}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleDismiss}
          onError={() => {
            console.warn('Intro video error event fired; dismissing.');
            handleDismiss();
          }}
          className="max-h-full max-w-full w-auto h-auto object-contain rounded-none md:rounded-2xl shadow-2xl"
          style={{ willChange: 'transform' }}
        />

        {/* Top-Right Control: Skip Button */}
        <div
          className="absolute z-20 flex items-center gap-2"
          style={{
            top: 'max(1rem, env(safe-area-inset-top, 1rem))',
            right: 'max(1rem, env(safe-area-inset-right, 1rem))',
          }}
        >
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Skip intro video"
            className="group flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 shadow-lg text-xs md:text-sm font-semibold tracking-wide transition-all active:scale-95 cursor-pointer"
          >
            <span>Skip</span>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Bottom-Left Control: Sound Toggle Button */}
        <div
          className="absolute z-20"
          style={{
            bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
            left: 'max(1rem, env(safe-area-inset-left, 1rem))',
          }}
        >
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs md:text-sm font-medium backdrop-blur-md border shadow-lg transition-all active:scale-95 cursor-pointer ${
              !isMuted
                ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border-emerald-400/40 shadow-emerald-900/50'
                : 'bg-emerald-950/85 hover:bg-emerald-900 text-emerald-200 border-emerald-500/50'
            }`}
          >
            {!isMuted ? (
              <>
                <Volume2 className="w-4 h-4 text-white" />
                <span className="font-semibold">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-semibold">Tap for Sound</span>
              </>
            )}
          </button>
        </div>

        {/* Sleek Progress Indicator at the bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <div
            className="h-full bg-emerald-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
