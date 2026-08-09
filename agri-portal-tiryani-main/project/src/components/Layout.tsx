import React, { useMemo, useState, ReactNode, useEffect } from 'react';
import {
  ArrowLeft, ChevronRight, Menu, X, LayoutDashboard, PackageCheck, UsersRound, BrainCircuit, FileStack,
  Archive, BarChart3, Settings, LogOut, Globe2, ShieldCheck, Tractor, ScrollText,
  FolderOpen, Moon, Sun, Landmark, Database, FileText,
} from 'lucide-react';
import { PortalLogo } from './ui/PortalLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useBackButtonOverlay } from '../hooks/useBackButtonOverlay';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string, options?: { replace?: boolean }) => void;
  onBack: () => void;
  onSignOut: () => void;
}

const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stock-analytics', label: 'Command Center', icon: PackageCheck },
  { id: 'dealers', label: 'Dealers Directory', icon: UsersRound },
  { id: 'farmer-database', label: 'Farmer Database', icon: Database },
  {
    id: 'crops',
    label: 'Crop Intelligence',
    icon: BrainCircuit,
  },
  { id: 'officer-toolkit', label: 'Officer Toolkit', icon: FileStack },
  { id: 'file-directory', label: 'Document Repository', icon: FolderOpen, adminOnly: true },
  { id: 'subsidy', label: 'Subsidy & Schemes', icon: Landmark },
  { id: 'gos-circulars', label: 'GOs & Circulars', icon: ScrollText },
  {
    id: 'quality',
    label: 'Quality Control',
    icon: ShieldCheck,
  },
  { id: 'farm-mechanization', label: 'Farm Mechanization', icon: Tractor },
  { id: 'excel', label: 'Office Records', icon: Archive, adminOnly: true },
  { id: 'analytics', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const dealerMenuItems = [] as typeof adminMenuItems;

const menuItems = adminMenuItems;

export function Layout({ children, currentPage, onNavigate, onBack, onSignOut }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarOverlay = useBackButtonOverlay('app-sidebar', () => setSidebarOpen(false));
  const { user, isAdminUser, isDealerUser, dealerName } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const pageMeta = useMemo(() => getPageMeta(currentPage, t), [currentPage, t]);
  const hidePortalLogo = currentPage === 'fertilizer-calculator' || currentPage === 'acreage-calculator';
  const showPageBackButton = currentPage !== 'dashboard' && currentPage !== 'dealer-portal';

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

  const visibleMenuItems = isDealerUser
    ? dealerMenuItems
    : menuItems.filter((item) => {
        if (item.id === 'stock') {
          return isAdminUser;
        }
        if (item.adminOnly) return isAdminUser;
        return true;
      });

  return (
    <div className="min-h-screen bg-[#eef6f0] dark:bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white shadow-lg">
        <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition focus:outline-none focus:ring-4 focus:ring-white/25 ${
                sidebarOpen
                  ? 'border-white/40 bg-white text-emerald-800'
                  : 'border-white/20 bg-white/15 text-white hover:border-white/35 hover:bg-white/25'
              }`}
              aria-label={sidebarOpen ? t('Close menu', 'మెనూ మూసివేయండి') : t('Open menu', 'మెనూ తెరవండి')}
              aria-expanded={sidebarOpen}
            >
              <span className="absolute inset-1 rounded-xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
              {sidebarOpen ? <X className="relative h-5 w-5" /> : <Menu className="relative h-5 w-5" />}
            </button>

            {showPageBackButton && (
              <button
                type="button"
                onClick={onBack}
                className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-sm transition hover:border-white/35 hover:bg-white/25 focus:outline-none focus:ring-4 focus:ring-white/25"
                aria-label={t('Back', 'వెనుకకు')}
                title={t('Back', 'వెనుకకు')}
              >
                <span className="absolute inset-1 rounded-xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
                <ArrowLeft className="relative h-5 w-5" />
              </button>
            )}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {!hidePortalLogo && <PortalLogo size="sm" />}
              <div className="min-w-0">
                <h1 className="truncate text-sm font-black tracking-tight sm:text-base font-[var(--font-stylish)]">
                  {t('Agronix', 'తిర్యాని వ్యవసాయ పోర్టల్')}
                </h1>
                <p className="truncate text-[10px] font-medium text-emerald-100 sm:text-xs">
                  {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
              title={isDark ? t('Light mode', 'లైట్ మోడ్') : t('Dark mode', 'డార్క్ మోడ్')}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold transition hover:bg-white/25 sm:text-sm"
            >
              <Globe2 className="h-4 w-4" />
              {language === 'en' ? '\u0C24\u0C46' : 'EN'}
            </button>
            <span
              className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-block sm:text-xs ${
                isAdminUser ? 'bg-amber-200 text-amber-950' : 'bg-cyan-200 text-cyan-950'
              }`}
            >
              {isAdminUser ? t('Admin', 'అడ్మిన్') : isDealerUser ? t('Dealer', 'డీలర్') : t('Test User', 'టెస్ట్ యూజర్')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[3px]"
          onClick={sidebarOverlay.closeOverlay}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[86vw] flex-col border-r border-emerald-100 bg-white text-slate-900 shadow-2xl shadow-slate-950/25 transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-950 dark:text-white ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-200 bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 px-3.5 pb-3 pt-4 text-white dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">{t('Navigation', 'నావిగేషన్')}</p>
              <h2 className="mt-0.5 truncate text-base font-black tracking-tight font-[var(--font-stylish)]">{t('Agronix', 'తిర్యాని')}</h2>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-emerald-100">{t(pageMeta.title, translateMenu(pageMeta.title))}</p>
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

        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {menuSections(visibleMenuItems, t).map((section) => (
            <div key={section.title} className="mb-3 last:mb-0">
              <p className="mb-1.5 px-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
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
                      className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-[13px] font-bold transition focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/15'
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
                          isActive ? 'text-white/80' : 'text-slate-300 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-white bg-white px-2.5 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-black text-white shadow-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-900 dark:text-white">{user?.email}</p>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                {isAdminUser
                  ? t('Administrator', 'నిర్వాహకుడు')
                  : isDealerUser
                    ? dealerName || t('Dealer', 'డీలర్')
                    : t('View access', 'చూడే ప్రవేశం')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
          >
            <LogOut className="h-4 w-4" />
            {t('Sign Out', 'సైన్ అవుట్')}
          </button>
        </div>
      </aside>

      <main className="min-h-[calc(100vh-4.25rem)] max-w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl overflow-x-hidden p-3 sm:p-4 md:p-5 lg:p-6">
          {currentPage !== 'dashboard' && currentPage !== 'dealer-portal' && (
            <div className="mb-4 flex flex-col gap-2">
              <nav className="flex flex-wrap items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
                {pageMeta.breadcrumbs.map((item, index) => (
                  <React.Fragment key={`${item.label}-${index}`}>
                    {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                    {item.page && item.page !== currentPage ? (
                      <button
                        type="button"
                        onClick={() => onNavigate(item.page!)}
                        className="rounded-md px-1.5 py-1 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-slate-800"
                      >
                        {t(item.label, translateMenu(item.label))}
                      </button>
                    ) : (
                      <span className="rounded-md px-1.5 py-1 text-slate-700 dark:text-slate-200">
                        {t(item.label, translateMenu(item.label))}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

type BreadcrumbItem = {
  label: string;
  page?: string;
};

function menuSections(items: typeof adminMenuItems, t: (key: string, telugu: string) => string) {
  const sections = [
    { title: t('Overview', 'అవలోకనం'), ids: ['dashboard', 'stock-analytics', 'analytics'] },
    { title: t('Field Operations', 'ఫీల్డ్ ఆపరేషన్స్'), ids: ['dealers', 'farmer-database', 'subsidy', 'farm-mechanization', 'quality'] },
    { title: t('Knowledge', 'జ్ఞానం'), ids: ['crops', 'officer-toolkit', 'gos-circulars'] },
    { title: t('Records', 'రికార్డులు'), ids: ['file-directory', 'excel', 'settings'] },
  ];

  const itemById = new Map(items.map((item) => [item.id, item]));
  const used = new Set<string>();
  const grouped = sections
    .map((section) => {
      const sectionItems = section.ids
        .map((id) => itemById.get(id))
        .filter((item): item is (typeof adminMenuItems)[number] => Boolean(item));
      sectionItems.forEach((item) => used.add(item.id));
      return { title: section.title, items: sectionItems };
    })
    .filter((section) => section.items.length > 0);

  const remaining = items.filter((item) => !used.has(item.id));
  if (remaining.length) grouped.push({ title: t('More', 'మరిన్ని'), items: remaining });
  return grouped;
}

function getPageMeta(page: string, t: (key: string, telugu: string) => string): { title: string; breadcrumbs: BreadcrumbItem[] } {
  const dashboard = { label: t('Dashboard', 'డ్యాష్‌బోర్డ్'), page: 'dashboard' };
  const toolkit = { label: t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్'), page: 'officer-toolkit' };
  const farmCalculators = { label: t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు'), page: 'farm-calculators' };

  if (page.startsWith('crop-')) {
    const title = page === 'crop-admin' ? t('Crop Admin', 'పంట అడ్మిన్') : cropTitle(page);
    return {
      title,
      breadcrumbs: [dashboard, { label: t('Crop Intelligence', 'పంట ఇంటెలిజెన్స్'), page: 'crops' }],
    };
  }

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

  const meta: Record<string, { title: string; breadcrumbs: BreadcrumbItem[] }> = {
    'stock-analytics': { title: t('Command Center', 'కమాండ్ సెంటర్'), breadcrumbs: [dashboard] },
    'stock-receipts-sales': { title: t('Stock Receipts & Sales', 'స్టాక్ రసీట్లు & అమ్మకాలు'), breadcrumbs: [dashboard] },
    'dealer-portal': { title: t('Stock Analytics', 'స్టాక్ విశ్లేషణలు'), breadcrumbs: [dashboard] },
    dealers: { title: t('Dealers Directory', 'డీలర్ల డైరెక్టరీ'), breadcrumbs: [dashboard] },
    'farmer-database': { title: t('Farmer Database', 'రైతుల డేటాబేస్'), breadcrumbs: [dashboard] },
    crops: { title: t('Crop Intelligence', 'పంట ఇంటెలిజెన్స్'), breadcrumbs: [dashboard] },
    'officer-toolkit': { title: t('Officer Toolkit', 'ఆఫీసర్ టూల్‌కిట్'), breadcrumbs: [dashboard] },
    forms: { title: t('Statutory Forms', 'చట్టబద్ధ ఫారాలు'), breadcrumbs: [dashboard, toolkit] },
    'acreage-calculator': { title: t('Area Calculator', 'ఎకరాల కాలిక్యులేటర్'), breadcrumbs: [dashboard, toolkit] },
    'farm-calculators': { title: t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు'), breadcrumbs: [dashboard, toolkit] },
    'crop-protection': { title: t('Crop Doctor', 'పంట డాక్టర్'), breadcrumbs: [dashboard, toolkit] },
    'fertilizer-calculator': { title: t('Fertilizer Calculator', 'ఎరువుల కాలిక్యులేటర్'), breadcrumbs: [dashboard, toolkit, farmCalculators] },
    'pesticide-calculator': { title: t('Pesticide Calculator', 'పురుగుమందుల కాలిక్యులేటర్'), breadcrumbs: [dashboard, toolkit, farmCalculators] },
    'plant-population-calculator': { title: t('Plant Population Calculator', 'మొక్కల జనాభా కాలిక్యులేటర్'), breadcrumbs: [dashboard, toolkit, farmCalculators] },
    'seed-rate-calculator': { title: t('Seed Rate Calculator', 'విత్తన మోతాదు కాలిక్యులేటర్'), breadcrumbs: [dashboard, toolkit, farmCalculators] },
    'legal-ready-reckoner': { title: t('Legal Ready Reckoner', 'లీగల్ రెడీ రెకనర్'), breadcrumbs: [dashboard, toolkit] },
    'gos-circulars': { title: t('GOs & Circulars', 'జి.ఓ.లు & సర్క్యులర్లు'), breadcrumbs: [dashboard] },
    quality: { title: t('Quality Control', 'నాణ్యత నియంత్రణ'), breadcrumbs: [dashboard] },
    'farm-mechanization': { title: t('Farm Mechanization', 'వ్యవసాయ యాంత్రీకరణ'), breadcrumbs: [dashboard] },
    excel: { title: t('Office Records', 'కార్యాలయ రికార్డులు'), breadcrumbs: [dashboard] },
    'file-directory': { title: t('Document Repository', 'పత్రాల భాండాగారం'), breadcrumbs: [dashboard] },
    subsidy: { title: t('Subsidy & Schemes', 'సబ్సిడీ & పథకాలు'), breadcrumbs: [dashboard] },
    analytics: { title: t('Reports', 'నివేదికలు'), breadcrumbs: [dashboard] },
    settings: { title: t('Settings', 'సెట్టింగులు'), breadcrumbs: [dashboard] },
  };

  return meta[page] || { title: t('Dashboard', 'డ్యాష్‌బోర్డ్'), breadcrumbs: [{ label: t('Dashboard', 'డ్యాష్‌బోర్డ్') }] };
}

function cropTitle(page: string) {
  const titles: Record<string, string> = {
    'crop-cotton': 'Cotton',
    'crop-paddy': 'Paddy',
    'crop-maize': 'Maize',
    'crop-pulses': 'Pulses',
    'crop-oilseeds': 'Oilseeds',
  };
  return titles[page] || 'Crop Intelligence';
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

function translateMenu(label: string) {
  const labels: Record<string, string> = {
    Dashboard: 'డ్యాష్‌బోర్డ్',
    'Command Center': 'కమాండ్ సెంటర్',
    'Stock Analytics': 'స్టాక్ విశ్లేషణలు',
    'Stock Receipts & Sales': 'స్టాక్ రసీట్లు & అమ్మకాలు',
    'Stock Inventory': 'స్టాక్ ఇన్వెంటరీ',
    'My Stock Entry': 'నా స్టాక్ ఎంట్రీ',
    'Dealers Directory': 'డీలర్ల డైరెక్టరీ',
    'Dealer Stock Tracking': 'డీలర్ స్టాక్ ట్రాకింగ్',
    'Farmer Database': 'రైతుల డేటాబేస్',
    'Crop Intelligence': 'పంట ఇంటెలిజెన్స్',
    'Crop Admin': 'పంట అడ్మిన్',
    'Officer Toolkit': 'ఆఫీసర్ టూల్‌కిట్',
    'Statutory Forms': 'చట్టబద్ధ ఫారాలు',
    'Farm Calculators': 'వ్యవసాయ కాలిక్యులేటర్లు',
    'Fertilizer Calculator': 'ఎరువుల కాలిక్యులేటర్',
    'Legal Ready Reckoner': 'లీగల్ రెడీ రెకనర్',
    'Seed Rate Calculator': 'విత్తన మోతాదు కాలిక్యులేటర్',
    'Plant Population Calculator': 'మొక్కల జనాభా కాలిక్యులేటర్',
    'Pesticide Calculator': 'పురుగుమందుల కాలిక్యులేటర్',
    'Area Calculator': 'ఎకరాల కాలిక్యులేటర్',
    'GOs & Circulars': 'జి.ఓ.లు & సర్క్యులర్లు',
    'Quality Control': 'నాణ్యత నియంత్రణ',
    'Farm Mechanization': 'వ్యవసాయ యాంత్రీకరణ',
    'Office Records': 'కార్యాలయ రికార్డులు',
    'Document Repository': 'పత్రాల భాండాగారం',
    'Subsidy & Schemes': 'సబ్సిడీ & పథకాలు',
    NFSM: 'ఎన్.ఎఫ్.ఎస్.ఎం',
    'State Seed Cell': 'రాష్ట్ర విత్తన కార్యాలయం',
    Seeds: 'విత్తనాలు',
    Pesticides: 'పురుగుమందులు',
    Fertilizers: 'ఎరువులు',
    Analytics: 'విశ్లేషణలు',
    Settings: 'సెట్టింగులు',
    Cotton: 'పత్తి',
    Paddy: 'వరి',
    Maize: 'మొక్కజొన్న',
    Pulses: 'పప్పుధాన్యాలు',
    Oilseeds: 'నూనె గింజలు',
  };
  return labels[label] ?? label;
}

