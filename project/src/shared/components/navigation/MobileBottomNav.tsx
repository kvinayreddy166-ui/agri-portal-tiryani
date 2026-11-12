import React from 'react';
import { Home, Scale, TestTubes, Store, LayoutGrid } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdminUser?: boolean;
}

const ENFORCEMENT_PAGES = new Set([
  'acts-and-orders',
  'enforcement-tracker',
  'inspection-enforcement',
  'license-services',
  'seed-dealer-inspection',
  'fertilizer-dealer-inspection',
  'insecticide-dealer-inspection',
]);

const SAMPLING_PAGES = new Set(['forms']);

const DEALER_PAGES = new Set(['dealers', 'dealer-management']);

type TabId = 'home' | 'enforcement' | 'sampling' | 'dealers' | 'more';

function activeTabFor(page: string): TabId {
  if (page === 'dashboard' || page === 'dealer-portal') return 'home';
  if (ENFORCEMENT_PAGES.has(page)) return 'enforcement';
  if (SAMPLING_PAGES.has(page)) return 'sampling';
  if (DEALER_PAGES.has(page)) return 'dealers';
  return 'more';
}

export function MobileBottomNav({ currentPage, onNavigate, isAdminUser = false }: MobileBottomNavProps) {
  const { t } = useLanguage();
  const active = activeTabFor(currentPage);

  const tabs: { id: TabId; label: string; labelTe: string; icon: typeof Home; target: string }[] = [
    { id: 'dealers', label: 'Dealers', labelTe: 'డీలర్లు', icon: Store, target: isAdminUser ? 'dealer-management' : 'dealers' },
    { id: 'sampling', label: 'Sampling', labelTe: 'సాంప్లింగ్', icon: TestTubes, target: 'forms' },
    { id: 'home', label: 'Home', labelTe: 'హోమ్', icon: Home, target: 'dashboard' },
    { id: 'enforcement', label: 'Enforcement', labelTe: 'ఎన్‌ఫోర్స్‌మెంట్', icon: Scale, target: 'inspection-enforcement' },
    { id: 'more', label: 'More', labelTe: 'మరిన్ని', icon: LayoutGrid, target: 'all-modules' },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      aria-label={t('Primary navigation', 'ప్రాథమిక నావిగేషన్')}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Gold accent hairline — mirrors the header's bottom gold line */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" aria-hidden />
      <div className="border-t border-emerald-900/10 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_32px_rgba(6,60,45,0.12)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[62px] max-w-lg items-stretch justify-around px-2">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.target)}
                aria-current={isActive ? 'page' : undefined}
                className="group relative flex min-w-0 flex-1 select-none flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 active:scale-[0.96]"
              >
                <span
                  className={`flex h-8 w-16 items-center justify-center rounded-full transition-all duration-300 ease-out ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/30 ring-2 ring-emerald-700/15 dark:bg-emerald-500 dark:shadow-emerald-950/50'
                      : 'text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:bg-slate-800/70 dark:group-hover:text-emerald-400'
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] transition-transform duration-300 ease-out ${isActive ? 'scale-110' : 'group-hover:-translate-y-px'}`}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                </span>
                <span
                  className={`max-w-full truncate text-[10px] font-bold leading-none tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t(tab.label, tab.labelTe)}
                </span>
                {/* Active gold tick — echoes the header accent */}
                <span
                  className={`absolute -bottom-0.5 h-1 w-6 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
