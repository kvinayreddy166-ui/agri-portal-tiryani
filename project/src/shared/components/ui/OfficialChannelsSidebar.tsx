import { Fragment } from 'react';
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
    className="h-5 w-5 shrink-0"
    aria-hidden="true"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

interface OfficialChannelsSidebarProps {
  whatsappLink?: string;
  youtubeLink?: string;
  twitterLink?: string;
  inline?: boolean;
}

type Channel = {
  href: string;
  label: string;
  labelTe: string;
  ariaLabel: string;
  ariaLabelTe: string;
  dotClass: string;
  iconClass: string;
  icon: React.ReactNode;
};

function ChannelButton({ channel, placement }: { channel: Channel; placement: 'left' | 'top' }) {
  const { t } = useLanguage();
  const isTop = placement === 'top';
  return (
    <div className="group/btn relative">
      <a
        href={channel.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 ${channel.iconClass}`}
        aria-label={t(channel.ariaLabel, channel.ariaLabelTe)}
      >
        {channel.icon}
      </a>
      <div
        role="tooltip"
        className={`pointer-events-none absolute z-50 hidden items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-2xl backdrop-blur-sm transition-all duration-200 group-hover/btn:opacity-100 group-hover/btn:flex ${
          isTop
            ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
            : 'right-full top-1/2 mr-3 -translate-y-1/2'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${channel.dotClass}`} />
        <span>{t(channel.label, channel.labelTe)}</span>
        <div
          className={`absolute border-4 border-transparent ${
            isTop
              ? 'left-1/2 top-full -translate-x-1/2 border-t-slate-950'
              : 'left-full top-1/2 -ml-1 -translate-y-1/2 border-l-slate-950'
          }`}
        />
      </div>
    </div>
  );
}

export function OfficialChannelsSidebar({
  whatsappLink = 'https://www.whatsapp.com/channel/0029Vb61tsc59PwZEKYH3A0A',
  youtubeLink = 'https://www.youtube.com/@AgricultureDepartmentTelangana',
  twitterLink = 'https://x.com/DirectorAgriTS',
  inline = false,
}: OfficialChannelsSidebarProps) {
  const { t } = useLanguage();

  const channels: Channel[] = [
    {
      href: whatsappLink,
      label: 'WhatsApp Channel',
      labelTe: 'వాట్సాప్ ఛానల్',
      ariaLabel: 'WhatsApp Channel',
      ariaLabelTe: 'వాట్సాప్ ఛానల్',
      dotClass: 'bg-[#25D366]',
      iconClass: 'text-[#25D366] hover:bg-emerald-50 focus-visible:ring-emerald-400 dark:hover:bg-emerald-950/50',
      icon: WHATSAPP_SVG,
    },
    {
      href: youtubeLink,
      label: 'YouTube Channel',
      labelTe: 'యూట్యూబ్ ఛానల్',
      ariaLabel: 'YouTube Channel - Agriculture Department Telangana',
      ariaLabelTe: 'తెలంగాణ వ్యవసాయ శాఖ యూట్యూబ్ ఛానల్',
      dotClass: 'bg-[#FF0000]',
      iconClass: 'text-[#FF0000] hover:bg-red-50 focus-visible:ring-red-400 dark:hover:bg-red-950/50',
      icon: <Youtube className="h-5 w-5" />,
    },
    {
      href: twitterLink,
      label: 'X (Twitter) - @DirectorAgriTS',
      labelTe: 'ఎక్స్ (ట్విట్టర్) - @DirectorAgriTS',
      ariaLabel: 'X (Twitter) - @DirectorAgriTS',
      ariaLabelTe: 'ఎక్స్ (ట్విట్టర్) - @DirectorAgriTS',
      dotClass: 'bg-slate-900 dark:bg-slate-100',
      iconClass: 'text-slate-950 dark:text-white hover:bg-slate-100 focus-visible:ring-slate-400 dark:hover:bg-slate-800/80',
      icon: X_TWITTER_SVG,
    },
  ];

  const buttons = channels.map((channel, index) => (
    <Fragment key={channel.href}>
      {!inline && index > 0 && <div className="my-0.5 h-px w-6 bg-slate-200/80 dark:bg-slate-700/60" />}
      <ChannelButton channel={channel} placement={inline ? 'top' : 'left'} />
    </Fragment>
  ));

  if (inline) {
    return (
      <div
        aria-label={t('Official Channels', 'అధికారిక ఛానెల్స్')}
        className="mt-3 flex items-center justify-center gap-1.5"
      >
        {buttons}
      </div>
    );
  }

  return (
    <aside
      aria-label={t('Official Channels', 'అధికారిక ఛానెల్స్')}
      className="fixed right-3 top-1/2 z-40 -translate-y-1/2 select-none"
    >
      <div className="animate-dock-in flex flex-col items-center gap-0.5 rounded-2xl border border-emerald-500/25 bg-white/90 p-1.5 shadow-xl shadow-emerald-950/10 backdrop-blur-md dark:border-emerald-400/20 dark:bg-slate-900/90">
        {buttons}
      </div>
    </aside>
  );
}
