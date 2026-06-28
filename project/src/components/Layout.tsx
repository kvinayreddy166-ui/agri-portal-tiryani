import React, { useMemo, useState, ReactNode } from 'react';
import {
  ArrowLeft, ChevronRight, Menu, X, LayoutDashboard, PackageCheck, UsersRound, BrainCircuit, FileStack,
  Archive, BarChart3, Settings, LogOut, Globe2, ShieldCheck, Tractor, ScrollText,
  FolderOpen, Moon, Sun, Landmark, Database, Satellite,
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
  { id: 'remote-sensing', label: 'Remote Sensing / Crop Health', icon: Satellite },
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
  const pageMeta = useMemo(() => getPageMeta(currentPage), [currentPage]);
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
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
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
                aria-label="Back"
                title="Back"
              >
                <span className="absolute inset-1 rounded-xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
                <ArrowLeft className="relative h-5 w-5" />
              </button>
            )}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {!hidePortalLogo && <PortalLogo size="sm" />}
              <div className="min-w-0">
                <h1 className="truncate text-sm font-black tracking-tight sm:text-base">
                  {t('Tiryani Agriculture Portal', 'Ã Â°Â¤Ã Â°Â¿Ã Â°Â°Ã Â±ÂÃ Â°Â¯Ã Â°Â¾Ã Â°Â¨Ã Â°Â¿ Ã Â°ÂµÃ Â±ÂÃ Â°Â¯Ã Â°ÂµÃ Â°Â¸Ã Â°Â¾Ã Â°Â¯ Ã Â°ÂªÃ Â±â€¹Ã Â°Â°Ã Â±ÂÃ Â°Å¸Ã Â°Â²Ã Â±Â')}
                </h1>
                <p className="truncate text-[10px] font-medium text-emerald-100 sm:text-xs">
                  {t('Information Management System', 'Ã Â°Â¸Ã Â°Â®Ã Â°Â¾Ã Â°Å¡Ã Â°Â¾Ã Â°Â° Ã Â°Â¨Ã Â°Â¿Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â°Â¹Ã Â°Â£ Ã Â°ÂµÃ Â±ÂÃ Â°Â¯Ã Â°ÂµÃ Â°Â¸Ã Â±ÂÃ Â°Â¥')}
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
              title={isDark ? t('Light mode', 'Ã Â°Â²Ã Â±Ë†Ã Â°Å¸Ã Â±Â Ã Â°Â®Ã Â±â€¹Ã Â°Â¡Ã Â±Â') : t('Dark mode', 'Ã Â°Â¡Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°â€¢Ã Â±Â Ã Â°Â®Ã Â±â€¹Ã Â°Â¡Ã Â±Â')}
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
              {isAdminUser ? t('Admin', 'Ã Â°â€¦Ã Â°Â¡Ã Â±ÂÃ Â°Â®Ã Â°Â¿Ã Â°Â¨Ã Â±Â') : isDealerUser ? t('Dealer', 'Ã Â°Â¡Ã Â±â‚¬Ã Â°Â²Ã Â°Â°Ã Â±Â') : t('Test User', 'Ã Â°Å¸Ã Â±â€ Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â±Â')}
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
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">Navigation</p>
              <h2 className="mt-0.5 truncate text-base font-black tracking-tight">Tiryani Portal</h2>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-emerald-100">{pageMeta.title}</p>
            </div>
            <button
              type="button"
              onClick={sidebarOverlay.closeOverlay}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/25"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {menuSections(visibleMenuItems).map((section) => (
            <div key={section.title} className="mb-3 last:mb-0">
              <p className="mb-1.5 px-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {section.title}
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
                  ? t('Administrator', 'Ã Â°Â¨Ã Â°Â¿Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â°Â¾Ã Â°Â¹Ã Â°â€¢Ã Â±ÂÃ Â°Â¡Ã Â±Â')
                  : isDealerUser
                    ? dealerName || t('Dealer', 'Ã Â°Â¡Ã Â±â‚¬Ã Â°Â²Ã Â°Â°Ã Â±Â')
                    : t('View access', 'Ã Â°Å¡Ã Â±â€šÃ Â°Â¡Ã Â±â€¡ Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â°ÂµÃ Â±â€¡Ã Â°Â¶Ã Â°â€š')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
          >
            <LogOut className="h-4 w-4" />
            {t('Sign Out', 'Ã Â°Â¸Ã Â±Ë†Ã Â°Â¨Ã Â±Â Ã Â°â€¦Ã Â°ÂµÃ Â±ÂÃ Â°Å¸Ã Â±Â')}
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

function menuSections(items: typeof adminMenuItems) {
  const sections = [
    { title: 'Overview', ids: ['dashboard', 'stock-analytics', 'analytics'] },
    { title: 'Field Operations', ids: ['dealers', 'farmer-database', 'remote-sensing', 'subsidy', 'farm-mechanization', 'quality'] },
    { title: 'Knowledge', ids: ['crops', 'officer-toolkit', 'gos-circulars'] },
    { title: 'Records', ids: ['file-directory', 'excel', 'settings'] },
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
  if (remaining.length) grouped.push({ title: 'More', items: remaining });
  return grouped;
}

function getPageMeta(page: string): { title: string; breadcrumbs: BreadcrumbItem[] } {
  const dashboard = { label: 'Dashboard', page: 'dashboard' };
  const toolkit = { label: 'Officer Toolkit', page: 'officer-toolkit' };
  const farmCalculators = { label: 'Farm Calculators', page: 'farm-calculators' };

  if (page.startsWith('crop-')) {
    const title = page === 'crop-admin' ? 'Crop Admin' : cropTitle(page);
    return {
      title,
      breadcrumbs: [dashboard, { label: 'Crop Intelligence', page: 'crops' }],
    };
  }

  if (page.startsWith('quality-')) {
    const title = qualityTitle(page);
    return {
      title,
      breadcrumbs: [dashboard, { label: 'Quality Control', page: 'quality' }],
    };
  }

  if (page.startsWith('subsidy-')) {
    const title = subsidyTitle(page);
    return {
      title,
      breadcrumbs: [dashboard, { label: 'Subsidy & Schemes', page: 'subsidy' }],
    };
  }

  const meta: Record<string, { title: string; breadcrumbs: BreadcrumbItem[] }> = {
    'stock-analytics': { title: 'Command Center', breadcrumbs: [dashboard] },
    'stock-receipts-sales': { title: 'Stock Receipts & Sales', breadcrumbs: [dashboard] },
    'dealer-portal': { title: 'Stock Analytics', breadcrumbs: [dashboard] },
    dealers: { title: 'Dealers Directory', breadcrumbs: [dashboard] },
    'farmer-database': { title: 'Farmer Database', breadcrumbs: [dashboard] },
    'remote-sensing': { title: 'Remote Sensing / Crop Health', breadcrumbs: [dashboard] },
    crops: { title: 'Crop Intelligence', breadcrumbs: [dashboard] },
    'officer-toolkit': { title: 'Officer Toolkit', breadcrumbs: [dashboard] },
    forms: { title: 'Statutory Forms', breadcrumbs: [dashboard, toolkit] },
    'acreage-calculator': { title: 'Acerage Calculator', breadcrumbs: [dashboard, toolkit] },
    'farm-calculators': { title: 'Farm Calculators', breadcrumbs: [dashboard, toolkit] },
    'crop-protection': { title: 'Crop Doctor', breadcrumbs: [dashboard, toolkit] },
    'fertilizer-calculator': { title: 'Fertilizer Calculator', breadcrumbs: [dashboard, toolkit, farmCalculators] },
    'pesticide-calculator': { title: 'Pesticide Calculator', breadcrumbs: [dashboard, toolkit, farmCalculators] },
    'plant-population-calculator': { title: 'Plant Population Calculator', breadcrumbs: [dashboard, toolkit, farmCalculators] },
    'seed-rate-calculator': { title: 'Seed Rate Calculator', breadcrumbs: [dashboard, toolkit, farmCalculators] },
    'legal-ready-reckoner': { title: 'Legal Ready Reckoner', breadcrumbs: [dashboard, toolkit] },
    'gos-circulars': { title: 'GOs & Circulars', breadcrumbs: [dashboard] },
    quality: { title: 'Quality Control', breadcrumbs: [dashboard] },
    'farm-mechanization': { title: 'Farm Mechanization', breadcrumbs: [dashboard] },
    excel: { title: 'Office Records', breadcrumbs: [dashboard] },
    'file-directory': { title: 'Document Repository', breadcrumbs: [dashboard] },
    subsidy: { title: 'Subsidy & Schemes', breadcrumbs: [dashboard] },
    analytics: { title: 'Reports', breadcrumbs: [dashboard] },
    settings: { title: 'Settings', breadcrumbs: [dashboard] },
  };

  return meta[page] || { title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }] };
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
    Dashboard: 'Ã Â°Â¡Ã Â±ÂÃ Â°Â¯Ã Â°Â¾Ã Â°Â·Ã Â±Â Ã Â°Â¬Ã Â±â€¹Ã Â°Â°Ã Â±ÂÃ Â°Â¡Ã Â±Â',
    'Command Center': 'Ã Â°â€¢Ã Â°Â®Ã Â°Â¾Ã Â°â€šÃ Â°Â¡Ã Â±Â Ã Â°Â¸Ã Â±â€ Ã Â°â€šÃ Â°Å¸Ã Â°Â°Ã Â±Â',
    'Stock Analytics': 'Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â°Â¾Ã Â°â€¢Ã Â±Â Ã Â°ÂµÃ Â°Â¿Ã Â°Â¶Ã Â±ÂÃ Â°Â²Ã Â±â€¡Ã Â°Â·Ã Â°Â£Ã Â°Â²Ã Â±Â',
    'Stock Receipts & Sales': 'Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â°Â¾Ã Â°â€¢Ã Â±Â Ã Â°Â°Ã Â°Â¸Ã Â±â‚¬Ã Â°Å¸Ã Â±ÂÃ Â°Â²Ã Â±Â & Ã Â°â€¦Ã Â°Â®Ã Â±ÂÃ Â°Â®Ã Â°â€¢Ã Â°Â¾Ã Â°Â²Ã Â±Â',
    'Stock Inventory': 'Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â°Â¾Ã Â°â€¢Ã Â±Â Ã Â°â€¡Ã Â°Â¨Ã Â±ÂÃ Â°ÂµÃ Â±â€ Ã Â°â€šÃ Â°Å¸Ã Â°Â°Ã Â±â‚¬',
    'My Stock Entry': 'Ã Â°Â¨Ã Â°Â¾ Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â°Â¾Ã Â°â€¢Ã Â±Â Ã Â°Å½Ã Â°â€šÃ Â°Å¸Ã Â±ÂÃ Â°Â°Ã Â±â‚¬',
    'Dealers Directory': 'Ã Â°Â¡Ã Â±â‚¬Ã Â°Â²Ã Â°Â°Ã Â±ÂÃ Â°Â² Ã Â°Â¡Ã Â±Ë†Ã Â°Â°Ã Â±â€ Ã Â°â€¢Ã Â±ÂÃ Â°Å¸Ã Â°Â°Ã Â±â‚¬',
    'Dealer Stock Tracking': 'Ã Â°Â¡Ã Â±â‚¬Ã Â°Â²Ã Â°Â°Ã Â±Â Ã Â°Â¸Ã Â±ÂÃ Â°Å¸Ã Â°Â¾Ã Â°â€¢Ã Â±Â Ã Â°Å¸Ã Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°â€¢Ã Â°Â¿Ã Â°â€šÃ Â°â€”Ã Â±Â',
    'Remote Sensing / Crop Health': 'Remote Sensing / Crop Health',
    'Farmer Database': 'Ã Â°Â°Ã Â±Ë†Ã Â°Â¤Ã Â±ÂÃ Â°Â² Ã Â°Â¡Ã Â±â€¡Ã Â°Å¸Ã Â°Â¾Ã Â°Â¬Ã Â±â€¡Ã Â°Â¸Ã Â±Â',
    'Crop Intelligence': 'Ã Â°ÂªÃ Â°â€šÃ Â°Å¸ Ã Â°â€¡Ã Â°â€šÃ Â°Å¸Ã Â±â€ Ã Â°Â²Ã Â°Â¿Ã Â°Å“Ã Â±â€ Ã Â°Â¨Ã Â±ÂÃ Â°Â¸Ã Â±Â',
    'Crop Admin': 'Ã Â°ÂªÃ Â°â€šÃ Â°Å¸ Ã Â°â€¦Ã Â°Â¡Ã Â±ÂÃ Â°Â®Ã Â°Â¿Ã Â°Â¨Ã Â±Â',
    'Officer Toolkit': 'Officer Toolkit',
    'Statutory Forms': 'Ã Â°Å¡Ã Â°Å¸Ã Â±ÂÃ Â°Å¸Ã Â°Â¬Ã Â°Â¦Ã Â±ÂÃ Â°Â§ Ã Â°Â«Ã Â°Â¾Ã Â°Â°Ã Â°Â¾Ã Â°Â²Ã Â±Â',
    'Farm Calculators': 'à°µà±à°¯à°µà°¸à°¾à°¯ à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±à°²à±',
    'Fertilizer Calculator': 'à°Žà°°à±à°µà±à°² à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    'Legal Ready Reckoner': 'Legal Ready Reckoner',
    'Seed Rate Calculator': 'à°µà°¿à°¤à±à°¤à°¨ à°®à±‹à°¤à°¾à°¦à± à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    'Plant Population Calculator': 'à°®à±Šà°•à±à°•à°² à°œà°¨à°¾à°­à°¾ à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    'Pesticide Calculator': 'à°ªà±à°°à±à°—à±à°®à°‚à°¦à± à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    'Acerage Calculator': 'à°Žà°•à°°à°¾à°² à°•à°¾à°²à°¿à°•à±à°¯à±à°²à±‡à°Ÿà°°à±',
    'GOs & Circulars': 'Ã Â°Å“Ã Â±â‚¬.Ã Â°â€œÃ Â°Â²Ã Â±Â & Ã Â°Â¸Ã Â°Â°Ã Â±ÂÃ Â°â€¢Ã Â±ÂÃ Â°Â¯Ã Â±ÂÃ Â°Â²Ã Â°Â°Ã Â±ÂÃ Â°Â²Ã Â±Â',
    'Quality Control': 'Ã Â°Â¨Ã Â°Â¾Ã Â°Â£Ã Â±ÂÃ Â°Â¯Ã Â°Â¤ Ã Â°Â¨Ã Â°Â¿Ã Â°Â¯Ã Â°â€šÃ Â°Â¤Ã Â±ÂÃ Â°Â°Ã Â°Â£',
    'Farm Mechanization': 'Ã Â°ÂµÃ Â±ÂÃ Â°Â¯Ã Â°ÂµÃ Â°Â¸Ã Â°Â¾Ã Â°Â¯ Ã Â°Â¯Ã Â°Â¾Ã Â°â€šÃ Â°Â¤Ã Â±ÂÃ Â°Â°Ã Â±â‚¬Ã Â°â€¢Ã Â°Â°Ã Â°Â£',
    'Office Records': 'Ã Â°â€¢Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°Â¯Ã Â°Â¾Ã Â°Â²Ã Â°Â¯ Ã Â°Â°Ã Â°Â¿Ã Â°â€¢Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°Â¡Ã Â±ÂÃ Â°Â²Ã Â±Â',
    'Document Repository': 'Ã Â°ÂªÃ Â°Â¤Ã Â±ÂÃ Â°Â°Ã Â°Â¾Ã Â°Â² Ã Â°Â­Ã Â°Â¾Ã Â°â€šÃ Â°Â¡Ã Â°Â¾Ã Â°â€”Ã Â°Â¾Ã Â°Â°Ã Â°â€š',
    'Subsidy & Schemes': 'Ã Â°Â¸Ã Â°Â¬Ã Â±ÂÃ Â°Â¸Ã Â°Â¿Ã Â°Â¡Ã Â±â‚¬ & Ã Â°ÂªÃ Â°Â¥Ã Â°â€¢Ã Â°Â¾Ã Â°Â²Ã Â±Â',
    NFSM: 'Ã Â°Å½Ã Â°Â¨Ã Â±Â.Ã Â°Å½Ã Â°Â«Ã Â±Â.Ã Â°Å½Ã Â°Â¸Ã Â±Â.Ã Â°Å½Ã Â°â€š',
    'State Seed Cell': 'Ã Â°Â°Ã Â°Â¾Ã Â°Â·Ã Â±ÂÃ Â°Å¸Ã Â±ÂÃ Â°Â° Ã Â°ÂµÃ Â°Â¿Ã Â°Â¤Ã Â±ÂÃ Â°Â¤Ã Â°Â¨ Ã Â°â€¢Ã Â°Â¾Ã Â°Â°Ã Â±ÂÃ Â°Â¯Ã Â°Â¾Ã Â°Â²Ã Â°Â¯Ã Â°â€š',
    Seeds: 'Ã Â°ÂµÃ Â°Â¿Ã Â°Â¤Ã Â±ÂÃ Â°Â¤Ã Â°Â¨Ã Â°Â¾Ã Â°Â²Ã Â±Â',
    Pesticides: 'Ã Â°ÂªÃ Â±ÂÃ Â°Â°Ã Â±ÂÃ Â°â€”Ã Â±ÂÃ Â°Â®Ã Â°â€šÃ Â°Â¦Ã Â±ÂÃ Â°Â²Ã Â±Â',
    Fertilizers: 'Ã Â°Å½Ã Â°Â°Ã Â±ÂÃ Â°ÂµÃ Â±ÂÃ Â°Â²Ã Â±Â',
    Analytics: 'Ã Â°ÂµÃ Â°Â¿Ã Â°Â¶Ã Â±ÂÃ Â°Â²Ã Â±â€¡Ã Â°Â·Ã Â°Â£Ã Â°Â²Ã Â±Â',
    Settings: 'Ã Â°Â¸Ã Â±â€ Ã Â°Å¸Ã Â±ÂÃ Â°Å¸Ã Â°Â¿Ã Â°â€šÃ Â°â€”Ã Â±ÂÃ Â°Â²Ã Â±Â',
    Cotton: 'Ã Â°ÂªÃ Â°Â¤Ã Â±ÂÃ Â°Â¤Ã Â°Â¿',
    Paddy: 'Ã Â°ÂµÃ Â°Â°Ã Â°Â¿',
    Maize: 'Ã Â°Â®Ã Â±Å Ã Â°â€¢Ã Â±ÂÃ Â°â€¢Ã Â°Å“Ã Â±Å Ã Â°Â¨Ã Â±ÂÃ Â°Â¨',
    Pulses: 'Ã Â°ÂªÃ Â°ÂªÃ Â±ÂÃ Â°ÂªÃ Â±ÂÃ Â°Â§Ã Â°Â¾Ã Â°Â¨Ã Â±ÂÃ Â°Â¯Ã Â°Â¾Ã Â°Â²Ã Â±Â',
    Oilseeds: 'Ã Â°Â¨Ã Â±â€šÃ Â°Â¨Ã Â±â€  Ã Â°â€”Ã Â°Â¿Ã Â°â€šÃ Â°Å“Ã Â°Â²Ã Â±Â',
  };
  return labels[label] ?? label;
}

