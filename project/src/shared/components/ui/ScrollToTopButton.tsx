import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const SHOW_AFTER_PX = 420;
const RADIUS = 15.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY || document.documentElement.scrollTop;
      setVisible(y > SHOW_AFTER_PX);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(y / max, 1) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className={`fixed bottom-20 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white shadow-xl shadow-emerald-900/30 ring-1 ring-emerald-500/50 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-700 active:scale-95 ${
        visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <ArrowUp className="relative h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}

export default ScrollToTopButton;
