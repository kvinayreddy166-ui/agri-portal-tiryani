import React, { useMemo, useState, ReactNode } from 'react';
import {
  ChevronRight, Menu, X, LayoutDashboard, PackageCheck, UsersRound, BrainCircuit, FileStack,
  Archive, BarChart3, Settings, LogOut, Globe2, ShieldCheck, Tractor, ScrollText,
  FolderOpen, Moon, Sun, Landmark, Database, MessageCircle,
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
  { id: 'officer-toolkit', label: 'Officers Toolkit', icon: FileStack },
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

export function Layout({ children, currentPage, onNavigate, onSignOut }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarOverlay = useBackButtonOverlay('app-sidebar', () => setSidebarOpen(false));
  const { user, isAdminUser, isDealerUser, dealerName } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const pageMeta = useMemo(() => getPageMeta(currentPage), [currentPage]);

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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 transition hover:bg-white/20"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <PortalLogo size="sm" />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-black tracking-tight sm:text-base">
                  {t('Tiryani Agriculture Portal', 'తిర్యాని వ్యవసాయ పోర్టల్')}
                </h1>
                <p className="truncate text-[10px] font-medium text-emerald-100 sm:text-xs">
                  {t('Information Management System', 'సమాచార నిర్వహణ వ్యవస్థ')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <a
              href="https://whatsapp.com/channel/0029Vb61tsc59PwZEKYH3A0A"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label="WhatsApp Channel"
              title={t('WhatsApp Channel', 'వాట్సప్ ఛానెల్')}
            >
              <MessageCircle className="h-4 w-4" />
            </a>
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
              {language === 'en' ? 'త' : 'E'}
            </button>
            <span
              className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-block sm:text-xs ${
                isAdminUser ? 'bg-amber-200 text-amber-950' : 'bg-cyan-200 text-cyan-950'
              }`}
            >
              {isAdminUser ? t('Admin', 'అడ్మిన్') : isDealerUser ? t('Dealer', 'డీలర్') : t('Test User', 'టెస్ట్')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
          onClick={sidebarOverlay.closeOverlay}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-emerald-900/30 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 pt-[4.25rem] text-white shadow-2xl transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleMenuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigation(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                currentPage === item.id || (item.id === 'crops' && currentPage.startsWith('crop-'))
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {t(item.label, translateMenu(item.label))}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user?.email}</p>
              <p className="text-[10px] text-emerald-300">
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/90 py-2.5 text-sm font-bold transition hover:bg-red-500"
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

function getPageMeta(page: string): { title: string; breadcrumbs: BreadcrumbItem[] } {
  const dashboard = { label: 'Dashboard', page: 'dashboard' };
  const toolkit = { label: 'Officers Toolkit', page: 'officer-toolkit' };

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
    crops: { title: 'Crop Intelligence', breadcrumbs: [dashboard] },
    'officer-toolkit': { title: 'Officers Toolkit', breadcrumbs: [dashboard] },
    forms: { title: 'Statutory Forms', breadcrumbs: [dashboard, toolkit] },
    'acreage-calculator': { title: 'Acerage Calculator', breadcrumbs: [dashboard, toolkit] },
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
    Dashboard: 'డ్యాష్ బోర్డ్',
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
    'Officers Toolkit': 'Officers Toolkit',
    'Statutory Forms': 'చట్టబద్ధ ఫారాలు',
    'Acerage Calculator': 'ఎకరాల కాలిక్యులేటర్',
    'GOs & Circulars': 'జీ.ఓలు & సర్క్యులర్లు',
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
