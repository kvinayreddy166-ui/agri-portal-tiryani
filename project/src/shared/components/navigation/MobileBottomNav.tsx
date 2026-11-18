import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, Home, Scale, TestTubes, Store, LayoutGrid, Gavel, ClipboardCheck } from 'lucide-react';
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

const ENFORCEMENT_VIEWS = [
  {
    label: 'Tracker',
    labelTe: 'ట్రాకర్',
    desc: 'Deadlines & risk',
    descTe: 'గడువులు & రిస్క్',
    icon: Gavel,
    target: 'enforcement-tracker',
  },
  {
    label: 'Action',
    labelTe: 'చర్య',
    desc: 'Notices & orders',
    descTe: 'నోటీసులు & ఆర్డర్లు',
    icon: ClipboardCheck,
    target: 'inspection-enforcement',
  },
];

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
  const [enforcementOpen, setEnforcementOpen] = useState(false);

  useEffect(() => {
    if (!enforcementOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEnforcementOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enforcementOpen]);

  const tabs: { id: TabId; label: string; labelTe: string; icon: typeof Home; target: string }[] = [
    { id: 'dealers', label: 'Dealers', labelTe: 'డీలర్లు', icon: Store, target: isAdminUser ? 'dealer-management' : 'dealers' },
    { id: 'sampling', label: 'Sampling', labelTe: 'సాంప్లింగ్', icon: TestTubes, target: 'forms' },
    { id: 'home', label: 'Home', labelTe: 'హోమ్', icon: Home, target: 'dashboard' },
    { id: 'enforcement', label: 'Enforcement', labelTe: 'ఎన్‌ఫోర్స్‌మెంట్', icon: Scale, target: 'enforcement-tracker' },
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
            const isEnforcement = tab.id === 'enforcement';
            return (
              <div key={tab.id} className="relative flex min-w-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  if (isEnforcement) {
                    setEnforcementOpen((open) => !open);
                  } else {
                    setEnforcementOpen(false);
                    onNavigate(tab.target);
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-haspopup={isEnforcement ? 'menu' : undefined}
                aria-expanded={isEnforcement ? enforcementOpen : undefined}
                className="group relative flex min-w-0 flex-1 select-none flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 active:scale-[0.96]"
              >
                <span
                  className={`flex h-8 w-16 items-center justify-center rounded-full transition-all duration-300 ease-out ${
                    isActive || (isEnforcement && enforcementOpen)
                      ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/30 ring-2 ring-emerald-700/15 dark:bg-emerald-500 dark:shadow-emerald-950/50'
                      : 'text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:bg-slate-800/70 dark:group-hover:text-emerald-400'
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] transition-transform duration-300 ease-out ${isActive || (isEnforcement && enforcementOpen) ? 'scale-110' : 'group-hover:-translate-y-px'}`}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                </span>
                <span
                  className={`max-w-full truncate text-[10px] font-bold leading-none tracking-wide transition-colors duration-200 ${
                    isActive || (isEnforcement && enforcementOpen) ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
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
              {isEnforcement && enforcementOpen && (
                <>
                  <div
                    className="animate-overlay-in fixed inset-0 z-40 bg-slate-950/20 dark:bg-slate-950/45"
                    onClick={() => setEnforcementOpen(false)}
                    aria-hidden
                  />
                  <div
                    role="menu"
                    aria-label={t('Enforcement views', 'అమలు వీక్షణలు')}
                    className="animate-pop-in absolute bottom-[calc(100%+12px)] right-0 z-50 w-56 origin-bottom-right overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
                  >
                    {/* Sheet grip — signals a transient sheet, not a permanent panel */}
                    <div className="flex justify-center pb-1 pt-2.5" aria-hidden>
                      <span className="h-1 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="flex items-center gap-2.5 px-4 pb-2 pt-0.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm">
                        <Scale className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black leading-tight text-slate-900 dark:text-white">
                          {t('Enforcement', 'ఎన్‌ఫోర్స్‌మెంట్')}
                        </p>
                        <p className="text-[10px] font-semibold leading-tight text-slate-400 dark:text-slate-500">
                          {t('Choose a view', 'వీక్షణను ఎంచుకోండి')}
                        </p>
                      </div>
                    </div>
                    <div className="mx-3.5 h-px bg-slate-100 dark:bg-slate-800" aria-hidden />
                    <div className="p-1.5">
                      {ENFORCEMENT_VIEWS.map((view) => {
                        const ViewIcon = view.icon;
                        const viewActive = currentPage === view.target;
                        return (
                          <button
                            key={view.target}
                            type="button"
                            role="menuitem"
                            aria-current={viewActive ? 'page' : undefined}
                            onClick={() => {
                              setEnforcementOpen(false);
                              onNavigate(view.target);
                            }}
                            className={`group/view flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                              viewActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/60'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                viewActive
                                  ? 'bg-emerald-700 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-500 group-hover/view:bg-emerald-100 group-hover/view:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover/view:bg-emerald-950/60 dark:group-hover/view:text-emerald-300'
                              }`}
                            >
                              <ViewIcon className="h-4 w-4" strokeWidth={2.1} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-xs font-black leading-tight ${viewActive ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-900 dark:text-slate-100'}`}>
                                {t(view.label, view.labelTe)}
                              </span>
                              <span className="block truncate text-[10px] font-semibold leading-tight text-slate-400 dark:text-slate-500">
                                {t(view.desc, view.descTe)}
                              </span>
                            </span>
                            {viewActive ? (
                              <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} aria-hidden />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover/view:translate-x-0.5 group-hover/view:text-slate-500 dark:text-slate-600 dark:group-hover/view:text-slate-300" strokeWidth={2.2} aria-hidden />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
