import React, { useState, useRef, useEffect } from 'react';
import { Youtube } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const WHATSAPP_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const X_TWITTER_SVG = (
  <svg
    viewBox="-2.5 -2.5 29 29"
    fill="currentColor"
    width="20"
    height="20"
    className="h-5 w-5 shrink-0 text-black dark:text-white"
    aria-hidden="true"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

interface OfficialChannelsSidebarProps {
  whatsappLink?: string;
  youtubeLink?: string;
  twitterLink?: string;
  defaultCollapsed?: boolean;
}

export function OfficialChannelsSidebar({
  whatsappLink = 'https://www.whatsapp.com/channel/0029Vb61tsc59PwZEKYH3A0A',
  youtubeLink = 'https://www.youtube.com/@AgricultureDepartmentTelangana',
  twitterLink = 'https://x.com/DirectorAgriTS',
  defaultCollapsed = true,
}: OfficialChannelsSidebarProps) {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const containerRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close on click outside when expanded
  useEffect(() => {
    if (isCollapsed) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isCollapsed]);

  // Close on Escape key
  useEffect(() => {
    if (isCollapsed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsCollapsed(true);
    }, 400);
  };

  const toggleCollapse = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsCollapsed((prev) => !prev);
  };

  return (
    <aside
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={t('Official Channels', 'అధికారిక ఛానెల్స్')}
      className="fixed right-0 bottom-20 sm:bottom-24 z-40 flex items-center select-none"
    >
      <style>{`
        @keyframes channelNudge {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-3px); }
        }
      `}</style>

      {/* Pull / Toggle Tab */}
      <button
        type="button"
        onClick={toggleCollapse}
        aria-expanded={!isCollapsed}
        aria-label={
          isCollapsed
            ? t('Open Official Channels', 'అధికారిక ఛానెల్స్ తెరవండి')
            : t('Collapse Channels', 'ఛానెల్స్ మూసివేయండి')
        }
        title={
          isCollapsed
            ? t('Official Channels', 'అధికారిక ఛానెల్స్')
            : t('Collapse Channels', 'ఛానెల్స్ మూసివేయండి')
        }
        className={`group flex items-center justify-center rounded-l-2xl border-l border-y border-emerald-500/40 dark:border-emerald-400/30 bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950 py-3.5 px-2.5 shadow-xl shadow-emerald-950/30 backdrop-blur-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          isCollapsed
            ? 'hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-900 hover:-translate-x-0.5 hover:shadow-emerald-900/40 cursor-pointer'
            : 'border-r-0 rounded-r-none'
        }`}
      >
        <div
          className={`flex items-center justify-center transition-transform duration-300 ease-out ${
            isCollapsed ? '' : 'rotate-180'
          }`}
          style={{
            animation: isCollapsed ? 'channelNudge 1.8s ease-in-out infinite' : 'none',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 drop-shadow-sm"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="channelsGradientChevron" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#25D366" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            <path
              d="M15 19l-7-7 7-7"
              stroke="url(#channelsGradientChevron)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Expandable Channels Dock */}
      <div
        className={`flex flex-col items-center border-y border-r border-emerald-500/40 dark:border-emerald-400/30 bg-white/95 dark:bg-slate-900/95 shadow-2xl shadow-slate-950/15 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isCollapsed
            ? 'max-w-0 opacity-0 pointer-events-none p-0 border-l-0 overflow-hidden'
            : 'max-w-[75px] opacity-100 p-1.5 border-l border-emerald-500/30 dark:border-emerald-500/20 overflow-visible'
        }`}
      >
        {/* WhatsApp Link */}
        <div className="relative group/btn">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#25D366] transition-all duration-200 hover:bg-emerald-50 hover:scale-105 active:scale-95 dark:hover:bg-emerald-950/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label={t('WhatsApp Channel', 'వాట్సాప్ ఛానల్')}
          >
            {WHATSAPP_SVG}
          </a>
          <div
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden group-hover/btn:flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-500/30 bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-white shadow-2xl animate-fadeIn z-50 backdrop-blur-sm"
          >
            <span className="h-2 w-2 rounded-full bg-[#25D366]" />
            <span>{t('WhatsApp Channel', 'వాట్సాప్ ఛానల్')}</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-slate-950" />
          </div>
        </div>

        {/* Micro-divider */}
        <div className="my-1 h-px w-5 bg-slate-200/80 dark:bg-slate-700/60" />

        {/* YouTube Link */}
        <div className="relative group/btn">
          <a
            href={youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#FF0000] transition-all duration-200 hover:bg-red-50 hover:scale-105 active:scale-95 dark:hover:bg-red-950/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label={t('YouTube Channel - Agriculture Department Telangana', 'తెలంగాణ వ్యవసాయ శాఖ యూట్యూబ్ ఛానల్')}
          >
            <Youtube className="h-5 w-5" />
          </a>
          <div
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden group-hover/btn:flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-500/30 bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-white shadow-2xl animate-fadeIn z-50 backdrop-blur-sm"
          >
            <span className="h-2 w-2 rounded-full bg-[#FF0000]" />
            <span>{t('YouTube Channel', 'యూట్యూబ్ ఛానల్')}</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-slate-950" />
          </div>
        </div>

        {/* Micro-divider */}
        <div className="my-1 h-px w-5 bg-slate-200/80 dark:bg-slate-700/60" />

        {/* X / Twitter Link */}
        <div className="relative group/btn">
          <a
            href={twitterLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-black dark:text-white transition-all duration-200 hover:bg-slate-100 hover:scale-105 active:scale-95 dark:hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label={t('X (Twitter) - @DirectorAgriTS', 'ఎక్స్ (ట్విట్టర్) - @DirectorAgriTS')}
          >
            {X_TWITTER_SVG}
          </a>
          <div
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden group-hover/btn:flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-white shadow-2xl animate-fadeIn z-50 backdrop-blur-sm"
          >
            <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-100" />
            <span>{t('X (Twitter) - @DirectorAgriTS', 'ఎక్స్ (ట్విట్టర్) - @DirectorAgriTS')}</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-slate-950" />
          </div>
        </div>
      </div>
    </aside>
  );
}
