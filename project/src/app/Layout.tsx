import React, { useEffect, useMemo, useState, ReactNode } from 'react';
import {
  ChevronLeft, ChevronRight, X, Moon, Sun, Globe, Check, LogOut, Settings,
} from 'lucide-react';
import { PortalLogo } from '../shared/components/ui/PortalLogo';
import { ConfirmDialog } from '../shared/components/ui/ConfirmDialog';
import { useAuth } from '../shared/context/AuthContext';
import { useLanguage } from '../shared/context/LanguageContext';
import { useTheme } from '../shared/context/ThemeContext';
import { useBackButtonOverlay } from '../shared/hooks/useBackButtonOverlay';
import { OfficerProfileAutofill } from '../features/auth/components/OfficerProfileAutofill';
import { MODULE_MENU_ITEMS, getVisibleModuleItems, moduleSections, translateMenu } from '../shared/data/modules';
import { MobileBottomNav } from '../shared/components/navigation/MobileBottomNav';
import { recordRecentModule } from '../shared/lib/modulePrefs';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string, options?: { replace?: boolean }) => void;
  onBack: () => void;
}

export function Layout({ children, currentPage, onNavigate, onBack }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const sidebarOverlay = useBackButtonOverlay('app-sidebar', () => setSidebarOpen(false));
  const profileOverlay = useBackButtonOverlay('profile-menu', () => setProfileOpen(false));
  const langOverlay = useBackButtonOverlay('lang-menu', () => setLangOpen(false));
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const signOutOverlay = useBackButtonOverlay('app-signout', () => setShowSignOutConfirm(false));

  const handleOpenSignOut = () => {
    profileOverlay.releaseOverlay();
    setProfileOpen(false);
    sidebarOverlay.releaseOverlay();
    setSidebarOpen(false);
    signOutOverlay.pushOverlay();
    setShowSignOutConfirm(true);
  };

  const handleCancelSignOut = () => {
    signOutOverlay.closeOverlay();
    setShowSignOutConfirm(false);
  };

  const handleConfirmSignOut = () => {
    signOutOverlay.releaseOverlay();
    setShowSignOutConfirm(false);
    void signOut();
  };
  const { user, isAdminUser, isDealerUser, isOfficerUser, officerProfile, dealerName, signOut } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const pageMeta = useMemo(() => getPageMeta(currentPage, t), [currentPage, t]);
  const hidePortalLogo = currentPage === 'fertilizer-calculator' || currentPage === 'acreage-calculator';
  const isOfficer = isOfficerUser || (!isAdminUser && !isDealerUser);

  const handleNavigation = (page: string) => {
    const replaceDrawerEntry = sidebarOpen;
    sidebarOverlay.releaseOverlay();
    setSidebarOpen(false);
    onNavigate(page, { replace: replaceDrawerEntry });
  };

  const toggleSidebar = () => {
    if (sidebarOpen) {
      sidebarOverlay.closeOverlay();
      return;
    }
    sidebarOverlay.pushOverlay();
    setSidebarOpen(true);
  };

  const toggleProfile = () => {
    if (profileOpen) {
      profileOverlay.closeOverlay();
      return;
    }
    profileOverlay.pushOverlay();
    setProfileOpen(true);
  };

  const toggleLangMenu = () => {
    if (langOpen) {
      langOverlay.closeOverlay();
      return;
    }
    langOverlay.pushOverlay();
    setLangOpen(true);
  };

  const selectLanguage = (lang: 'en' | 'te') => {
    if (language !== lang) toggleLanguage();
    langOverlay.closeOverlay();
  };

  const userMeta = (user?.user_metadata ?? {}) as { name?: string; full_name?: string; display_name?: string; designation?: string };
  const profileName = officerProfile?.full_name || userMeta.full_name || userMeta.name || userMeta.display_name || user?.email?.split('@')[0] || 'User';
  const profileRole = officerProfile?.designation || userMeta.designation || (isAdminUser ? t('Administrator', 'నిర్వాహకుడు') : isDealerUser ? dealerName || t('Dealer', 'డీలర్') : isOfficer ? t('Agriculture Officer', 'వ్యవసాయ అధికారి') : t('View access', 'చూడే ప్రవేశం'));

  const menuItemIds = useMemo(() => new Set(MODULE_MENU_ITEMS.map((item) => item.id)), []);

  useEffect(() => {
    if (menuItemIds.has(currentPage)) recordRecentModule(currentPage);
  }, [currentPage, menuItemIds]);

  const visibleMenuItems = isDealerUser ? [] : getVisibleModuleItems(isAdminUser, isOfficerUser);

  return (
    <div className="min-h-screen bg-[#f2f7f3] dark:bg-slate-950">
      <OfficerProfileAutofill />
      <header className="sticky top-0 z-50 border-b border-emerald-900/30 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white shadow-lg">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400/80 to-transparent" />
        <div className="relative flex min-w-0 items-center justify-between gap-2 px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-5 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm backdrop-blur-sm transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30 active:scale-90 ${
                sidebarOpen
                  ? 'border-white/40 bg-white text-emerald-800 shadow-md'
                  : 'border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/20'
              }`}
              aria-label={sidebarOpen ? t('Close menu', 'మెనూ మూసివేయండి') : t('Open menu', 'మెనూ తెరవండి')}
              aria-expanded={sidebarOpen}
            >
              <span className="absolute left-1/2 top-1/2 h-[14px] w-[18px] -translate-x-1/2 -translate-y-1/2" aria-hidden>
                <span
                  className={`absolute left-0 h-[2px] rounded-full bg-current transition-all duration-300 ease-out ${
                    sidebarOpen ? 'top-1/2 w-full -translate-y-1/2 rotate-45' : 'top-0 w-5/6'
                  }`}
                />
                <span
                  className={`absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-current transition-all duration-200 ${
                    sidebarOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 h-[2px] rounded-full bg-current transition-all duration-300 ease-out ${
                    sidebarOpen ? 'top-1/2 w-full -translate-y-1/2 -rotate-45' : 'bottom-0 w-4/6'
                  }`}
                />
              </span>
            </button>

            <div className="flex min-w-0 items-center gap-2">
              {!hidePortalLogo && <PortalLogo size="xs" />}
              <div className="min-w-0">
                <h1 className="truncate text-sm font-black tracking-tight sm:text-base text-gold-300 font-[var(--font-stylish)]">
                  {t('Agronix', 'తిర్యాని వ్యవసాయ పోర్టల్')}
                </h1>
                <p className="truncate text-[10px] font-semibold text-emerald-100">
                  {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90"
                aria-label={isDark ? 'Light mode' : 'Dark mode'}
                title={isDark ? t('Light mode', 'లైట్ మోడ్') : t('Dark mode', 'డార్క్ మోడ్')}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={toggleLangMenu}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90"
                aria-label={t('Change language', 'భాష మార్చండి')}
                aria-expanded={langOpen}
                aria-haspopup="menu"
                title={t('Change language', 'భాష మార్చండి')}
              >
                <Globe className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleProfile}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90"
                aria-label={t('Profile menu', 'ప్రొఫైల్ మెనూ')}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-[11px] font-black text-emerald-950 ring-2 ring-white/25">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
                {profileOpen && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden />}
              </button>
            </div>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={langOverlay.closeOverlay} aria-hidden />
                <div
                  className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  role="menu"
                >
                  {([
                    { id: 'en', label: 'English', sub: 'Default' },
                    { id: 'te', label: 'తెలుగు', sub: 'Telugu' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="menuitem"
                      onClick={() => selectLanguage(opt.id)}
                      className="flex w-full items-center justify-between gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span>
                        <span className="block">{opt.label}</span>
                        <span className="block text-[10px] font-semibold text-slate-400">{opt.sub}</span>
                      </span>
                      {language === opt.id && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={profileOverlay.closeOverlay} aria-hidden />

                <div
                  className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  role="menu"
                >
                  <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3 dark:border-slate-800">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-sm font-black text-emerald-950 ring-2 ring-emerald-100 dark:ring-slate-700">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{profileName}</p>
                      <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{profileRole}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      profileOverlay.closeOverlay();
                      handleNavigation('settings');
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Settings className="h-4 w-4 shrink-0 text-slate-400" />
                    {t('Settings', 'సెట్టింగులు')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleOpenSignOut}
                    className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 text-left text-[13px] font-bold text-red-600 transition hover:bg-red-50 dark:border-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {t('Sign Out', 'సైన్ అవుట్')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="animate-overlay-in fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[3px]"
          onClick={sidebarOverlay.closeOverlay}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[86vw] flex-col overflow-hidden rounded-r-3xl border-r border-emerald-100 bg-white text-slate-900 shadow-2xl shadow-slate-950/25 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:border-slate-800 dark:bg-slate-950 dark:text-white ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative border-b border-slate-200 bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 px-3.5 pb-3 pt-[calc(1rem_+_env(safe-area-inset-top))] text-white dark:border-slate-800">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <PortalLogo size="sm" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-black tracking-tight text-gold-300 font-[var(--font-stylish)]">{t('Agronix', 'తిర్యాని')}</h2>
                <p className="truncate text-[11px] font-semibold text-emerald-100">{t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={sidebarOverlay.closeOverlay}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/25"
              aria-label={t('Close menu', 'మెనూ మూసివేయండి')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-y-contain px-2.5 py-3">
          {moduleSections(visibleMenuItems, t).map((section) => (
            <div key={section.title} className="mb-3 last:mb-0">
              <p className="mb-1.5 px-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-gold-600 dark:text-gold-400">
                {t(section.title, translateMenu(section.title))}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = currentPage === item.id || (item.id === 'crops' && currentPage.startsWith('crop-'));
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigation(item.id)}
                      className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-[13px] font-bold transition focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 ${
                        isActive
                          ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/25 before:absolute before:left-0.5 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-gold-400 before:content-[\'\']'
                          : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-emerald-200'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-700 dark:bg-slate-900 dark:text-slate-400 dark:group-hover:bg-slate-800 dark:group-hover:text-emerald-200'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t(item.label, translateMenu(item.label))}</span>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition ${
                          isActive ? 'text-gold-300' : 'text-slate-300 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 bg-slate-50 p-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-white bg-white px-2.5 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-xs font-black text-white shadow-sm">
              {profileName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-900 dark:text-white">{profileName}</p>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                {profileRole}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenSignOut}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
              title={t('Sign Out', 'సైన్ అవుట్')}
              aria-label={t('Sign Out', 'సైన్ అవుట్')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-[calc(100vh-3rem)] max-w-full overflow-x-hidden pb-20 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl overflow-x-hidden p-3 sm:p-4 md:p-5 lg:p-6">
          {currentPage !== 'dashboard' && currentPage !== 'dealer-portal' && (
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
                aria-label={t('Back', 'వెనుకకు')}
                title={t('Back', 'వెనుకకు')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <nav className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
                {pageMeta.breadcrumbs.map((item, index) => {
                  const isLink = Boolean(item.page && item.page !== currentPage);
                  const isCurrent = !isLink && index === pageMeta.breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={`${item.label}-${index}`}>
                      {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                      {isLink ? (
                        <button
                          type="button"
                          onClick={() => onNavigate(item.page!)}
                          className="rounded-md px-1.5 py-1 text-emerald-700 transition-colors hover:bg-emerald-50 hover:underline hover:underline-offset-2 dark:text-emerald-300 dark:hover:bg-slate-800"
                        >
                          {t(item.label, translateMenu(item.label))}
                        </button>
                      ) : (
                        <span
                          aria-current={isCurrent ? 'page' : undefined}
                          className={`rounded-md px-1.5 py-1 ${isCurrent ? 'font-extrabold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          {t(item.label, translateMenu(item.label))}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>
          )}
          {children}
        </div>
      </main>

      {!isDealerUser && (
        <MobileBottomNav currentPage={currentPage} onNavigate={(page) => handleNavigation(page)} />
      )}

      <ConfirmDialog
        open={showSignOutConfirm}
        title={t('Sign Out of Agronix?', 'అగ్రోనిక్స్ నుండి సైన్ అవుట్ చేయాలా?')}
        message={t(
          'Are you sure you want to sign out? You will need to sign in again to access the portal.',
          'మీరు ఖచ్చితంగా సైన్ అవుట్ చేయాలనుకుంటున్నారా? పోర్టల్‌ను యాక్సెస్ చేయడానికి మీరు మళ్లీ సైన్ ఇన్ చేయాల్సి ఉంటుంది.'
        )}
        confirmLabel={t('Sign Out', 'సైన్ అవుట్')}
        cancelLabel={t('Cancel', 'రద్దు చేయండి')}
        icon={<LogOut className="h-5 w-5" aria-hidden="true" />}
        onConfirm={handleConfirmSignOut}
        onCancel={handleCancelSignOut}
      />
    </div>
  );
}

type BreadcrumbItem = {
  label: string;
  page?: string;
};

function getPageMeta(page: string, t: (key: string, telugu: string) => string): { title: string; breadcrumbs: BreadcrumbItem[] } {
  const dashboard = { label: t('Dashboard', 'డ్యాష్‌బోర్డ్'), page: 'dashboard' };
  const farmCalculators = { label: t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు'), page: 'farm-calculators' };
  const inspectionsHub = { label: t('Inspection & Enforcement', 'తనిఖీ & అమలు'), page: 'inspection-enforcement' };

  if (page.startsWith('quality-')) {
    const title = qualityTitle(page);
    return {
      title,
      breadcrumbs: [dashboard, { label: t('Quality Control', 'నాణ్యత నియంత్రణ'), page: 'quality' }],
    };
  }

  if (page.startsWith('subsidy-')) {
    const title = subsidyTitle(page);
    return {
      title,
      breadcrumbs: [dashboard, { label: t('Subsidy & Schemes', 'సబ్సిడీ & పథకాలు'), page: 'subsidy' }],
    };
  }

  if (page.startsWith('knowledge-')) {
    const knowledgeTitles: Record<string, string> = {
      'knowledge-library': 'Document Library',
      'knowledge-upload': 'Upload Document',
      'knowledge-categories': 'Categories',
      'knowledge-queue': 'Processing Queue',
      'knowledge-analytics': 'Query Analytics',
      'knowledge-settings': 'Settings',
      'knowledge-assistant': 'Knowledge Assistant',
      'knowledge-search': 'Search Documents',
      'knowledge-viewer': 'Document Viewer',
    };
    return {
      title: t(knowledgeTitles[page] ?? 'Knowledge Base', 'జ్ఞాన భాండాగారం'),
      breadcrumbs: [dashboard, { label: t('Knowledge Base', 'జ్ఞాన భాండాగారం'), page: 'knowledge' }],
    };
  }

  const meta: Record<string, { title: string; breadcrumbs: BreadcrumbItem[] }> = {
    'stock-analytics': { title: t('Command Center', 'కమాండ్ సెంటర్'), breadcrumbs: [dashboard] },
    'stock-receipts-sales': { title: t('Stock Receipts & Sales', 'స్టాక్ రసీట్లు & అమ్మకాలు'), breadcrumbs: [dashboard] },
    'dealer-portal': { title: t('Stock Analytics', 'స్టాక్ విశ్లేషణలు'), breadcrumbs: [dashboard] },
    dealers: { title: t('Dealers Directory', 'డీలర్ల డైరెక్టరీ'), breadcrumbs: [dashboard] },
    'farmer-database': { title: t('Farmer Database', 'రైతుల డేటాబేస్'), breadcrumbs: [dashboard] },
    'officer-toolkit': { title: t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్'), breadcrumbs: [dashboard] },
    'field-tools': { title: t('Field Tools Hub', 'క్షేత్ర పరికరాల హబ్'), breadcrumbs: [dashboard] },
    'government-portals': { title: t('Government Portals', 'ప్రభుత్వ పోర్టల్స్'), breadcrumbs: [dashboard] },
    'officer-records': { title: t('Saved Records & Storage', 'సేవ్ చేసిన రికార్డులు & స్టోరేజ్'), breadcrumbs: [dashboard] },
    knowledge: { title: t('Knowledge Base', 'జ్ఞాన భాండాగారం'), breadcrumbs: [dashboard] },
    forms: { title: t('Smart Sampling', 'స్మార్ట్ సాంప్లింగ్'), breadcrumbs: [dashboard] },
    'forms-library': { title: t('Forms & Library', 'ఫారాలు & లైబ్రరీ'), breadcrumbs: [dashboard] },
    'acreage-calculator': { title: t('Area Calculator', 'ఎకరాల కాలిక్యులేటర్'), breadcrumbs: [dashboard, farmCalculators] },
    agrochemicals: { title: t('Agrochemicals Database', 'వ్యవసాయ రసాయనాల భాండాగారం'), breadcrumbs: [dashboard] },
    'farm-calculators': { title: t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు'), breadcrumbs: [dashboard] },
    'crop-doctor': { title: t('Crop Doctor', 'పంట డాక్టర్'), breadcrumbs: [dashboard] },
    'fertilizer-calculator': { title: t('Fertilizer Calculator', 'ఎరువుల కాలిక్యులేటర్'), breadcrumbs: [dashboard, farmCalculators] },
    'pesticide-calculator': { title: t('Pesticide Calculator', 'పురుగుమందుల కాలిక్యులేటర్'), breadcrumbs: [dashboard, farmCalculators] },
    'plant-population-calculator': { title: t('Plant Population Calculator', 'మొక్కల జనాభా కాలిక్యులేటర్'), breadcrumbs: [dashboard, farmCalculators] },
    'seed-rate-calculator': { title: t('Seed Rate Calculator', 'విత్తన మోతాదు కాలిక్యులేటర్'), breadcrumbs: [dashboard, farmCalculators] },
    'irrigation-calculator': { title: t('Irrigation Calculator', 'నీటిపారుదల కాలిక్యులేటర్'), breadcrumbs: [dashboard, farmCalculators] },
    'profitability-calculator': { title: t('Profit Calculator', 'లాభదాయకత కాలిక్యులేటర్'), breadcrumbs: [dashboard, farmCalculators] },
    'soil-health-meter': { title: t('Soil Health Meter', 'మట్టి ఆరోగ్య మీటర్'), breadcrumbs: [dashboard, farmCalculators] },
    'acts-and-orders': { title: t('Acts & Orders', 'చట్టాలు & ఉత్తర్వులు'), breadcrumbs: [dashboard] },
    'seed-dealer-inspection': { title: t('Seed Dealer Inspection', 'విత్తన డీలర్ తనిఖీ'), breadcrumbs: [dashboard, inspectionsHub] },
    'fertilizer-dealer-inspection': { title: t('Fertilizer Dealer Inspection', 'ఎరువుల డీలర్ తనిఖీ'), breadcrumbs: [dashboard, inspectionsHub] },
    'insecticide-dealer-inspection': { title: t('Pesticide Dealer Inspection', 'పురుగుమందుల డీలర్ తనిఖీ'), breadcrumbs: [dashboard, inspectionsHub] },
    'inspection-enforcement': { title: t('Inspection & Enforcement', 'తనిఖీ & అమలు'), breadcrumbs: [dashboard] },
    'enforcement-tracker': { title: t('Enforcement Tracker', 'ఎన్‌ఫోర్స్‌మెంట్ ట్రాకర్'), breadcrumbs: [dashboard] },
    'license-services': { title: t('License Services', 'లైసెన్స్ సేవలు'), breadcrumbs: [dashboard] },
    'tour-diary': { title: t('Tour Diary', 'టూర్ డైరీ'), breadcrumbs: [dashboard] },
    'officer-contacts': { title: t('Officer Contacts', 'అధికారుల పరిచయాలు'), breadcrumbs: [dashboard] },
    'officer-contacts-admin': { title: t('Officer Contacts Admin', 'అధికారుల పరిచయాల నిర్వహణ'), breadcrumbs: [dashboard, { label: t('Officer Contacts', 'అధికారుల పరిచయాలు'), page: 'officer-contacts' }] },

    'gos-circulars': { title: t('GOs & Circulars', 'జి.ఓ.లు & సర్క్యులర్లు'), breadcrumbs: [dashboard] },
    quality: { title: t('Quality Control', 'నాణ్యత నియంత్రణ'), breadcrumbs: [dashboard] },
    'farm-mechanization': { title: t('Farm Mechanization', 'వ్యవసాయ యాంత్రీకరణ'), breadcrumbs: [dashboard] },
    excel: { title: t('Office Records', 'కార్యాలయ రికార్డులు'), breadcrumbs: [dashboard] },
    'file-directory': { title: t('Document Repository', 'పత్రాల భాండాగారం'), breadcrumbs: [dashboard] },
    subsidy: { title: t('Subsidy & Schemes', 'సబ్సిడీ & పథకాలు'), breadcrumbs: [dashboard] },
    analytics: { title: t('Reports', 'నివేదికలు'), breadcrumbs: [dashboard] },
    settings: { title: t('Settings', 'సెట్టింగులు'), breadcrumbs: [dashboard] },
    'all-modules': { title: t('All Modules', 'అన్ని మాడ్యూల్‌లు'), breadcrumbs: [dashboard] },
  };

  return meta[page] || { title: t('Dashboard', 'డ్యాష్‌బోర్డ్'), breadcrumbs: [{ label: t('Dashboard', 'డ్యాష్‌బోర్డ్') }] };
}

function qualityTitle(page: string) {
  const titles: Record<string, string> = {
    'quality-seeds': 'Seeds',
    'quality-pesticides': 'Pesticides',
    'quality-fertilizers': 'Fertilizers',
  };
  return titles[page] || 'Quality Control';
}

function subsidyTitle(page: string) {
  const titles: Record<string, string> = {
    'subsidy-nfsm': 'NFSM',
    'subsidy-state-seed': 'State Seed Cell',
  };
  return titles[page] || 'Subsidy & Schemes';
}
