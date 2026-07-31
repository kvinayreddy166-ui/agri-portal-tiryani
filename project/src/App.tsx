import React, { Component, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { PortalLogo } from './components/ui/PortalLogo';
import { OfflineScreen } from './components/ui/OfflineScreen';
import { APP_BUILD_LABEL, clearAppCacheAndReload, dismissUpdateBanner, hasNewAppVersion, rememberCurrentAppVersion } from './lib/appVersion';
import { isRecoverableChunkError } from './lib/pwaRecovery';
import { BrowserRouter, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SEO, OrganizationSchema } from './components/seo/SEO';

const Login = lazy(() => import('./components/Login').then((m) => ({ default: m.Login })));
const Layout = lazy(() => import('./components/Layout').then((m) => ({ default: m.Layout })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const DealerManagement = lazy(() => import('./pages/DealerManagement').then((m) => ({ default: m.DealerManagement })));
const CropPage = lazy(() => import('./pages/CropPage').then((m) => ({ default: m.CropPage })));
const CropManagement = lazy(() => import('./pages/CropManagement').then((m) => ({ default: m.CropManagement })));
const FormsDownloads = lazy(() => import('./pages/FormsDownloads').then((m) => ({ default: m.FormsDownloads })));
const ExcelUploads = lazy(() => import('./pages/ExcelUploads').then((m) => ({ default: m.ExcelUploads })));
const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })));
const FarmerDatabase = lazy(() => import('./pages/FarmerDatabase').then((m) => ({ default: m.FarmerDatabase })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const QualityControl = lazy(() => import('./pages/QualityControl').then((m) => ({ default: m.QualityControl })));
const QualityControlHub = lazy(() => import('./pages/QualityControlHub').then((m) => ({ default: m.QualityControlHub })));
const FarmMechanization = lazy(() => import('./pages/FarmMechanization').then((m) => ({ default: m.FarmMechanization })));
const GosCirculars = lazy(() => import('./pages/GosCirculars').then((m) => ({ default: m.GosCirculars })));
const FileDirectory = lazy(() => import('./pages/FileDirectory').then((m) => ({ default: m.FileDirectory })));
const SubsidyTracking = lazy(() => import('./pages/SubsidyTracking').then((m) => ({ default: m.SubsidyTracking })));
const DealerStockPortal = lazy(() => import('./pages/DealerStockPortal').then((m) => ({ default: m.DealerStockPortal })));
const AcreageCalculator = lazy(() => import('./pages/AcreageCalculator').then((m) => ({ default: m.AcreageCalculator })));
const FertilizerCalculator = lazy(() => import('./features/fertilizerCalculator/FertilizerCalculatorCore').then((m) => ({ default: m.FertilizerCalculatorCore })));
const OfficersToolkit = lazy(() => import('./pages/OfficersToolkit').then((m) => ({ default: m.OfficersToolkit })));
const FarmCalculators = lazy(() => import('./pages/FarmCalculators').then((m) => ({ default: m.FarmCalculators })));
const CropProtectionTool = lazy(() => import('./pages/CropProtectionTool').then((m) => ({ default: m.CropProtectionTool })));
const PesticideCalculator = lazy(() => import('./pages/PesticideCalculator').then((m) => ({ default: m.PesticideCalculator })));
const PlantPopulationCalculator = lazy(() => import('./pages/PlantPopulationCalculator').then((m) => ({ default: m.PlantPopulationCalculator })));
const SeedRateCalculator = lazy(() => import('./pages/SeedRateCalculator').then((m) => ({ default: m.SeedRateCalculator }))); 
const AgriLegalReadyReckoner = lazy(() => import('./components/AgriLegalReadyReckoner').then((m) => ({ default: m.AgriLegalReadyReckoner })));
const StockAnalytics = lazy(() => import('./pages/StockAnalytics'));
const StockReceiptsSales = lazy(() => import('./pages/StockReceiptsSales'));
const CropAdminDashboard = lazy(() =>
  import('./pages/admin/CropAdminDashboard.jsx').then((m) => ({ default: m.CropAdminDashboard }))
);
function GlobalAppLoader({ hideLogo = false }: { hideLogo?: boolean }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#eef6f0] p-6 text-center dark:bg-slate-950">
      {!hideLogo && <PortalLogo size="xl" />}
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
      {!hideLogo && (
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading AGRONIX...
        </p>
      )}
      {slow && (
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white/90 p-4 shadow-sm dark:border-amber-900 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">App is taking longer than expected.</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
            A stale deployment cache or slow auth check may be blocking startup. Clearing cache and reloading...
          </p>
          <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">App Version: {APP_BUILD_LABEL}</p>
        </div>
      )}
    </div>
  );
}

function PageLoader({ hideLogo = false }: { hideLogo?: boolean }) {
  return <GlobalAppLoader hideLogo={hideLogo} />;
}


type LazyLoadBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type LazyLoadBoundaryState = {
  error: Error | null;
};

class LazyLoadBoundary extends Component<LazyLoadBoundaryProps, LazyLoadBoundaryState> {
  state: LazyLoadBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): LazyLoadBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Page failed to load:', error);
    // Automatically clear cache and reload on chunk load errors
    if (isRecoverableChunkError(error.message)) {
      void clearAppCacheAndReload();
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#eef6f0] p-6 text-center dark:bg-slate-950">
        <PortalLogo size="xl" />
        <div className="max-w-md rounded-2xl border border-red-200 bg-white/95 p-5 shadow-sm dark:border-red-900 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">App files could not load.</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            This usually happens when an old deployment cache points to deleted JavaScript files.
          </p>
          <p className="mt-2 break-words text-xs font-bold text-red-700 dark:text-red-300">{this.state.error.message}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800">
              Retry
            </button>
            <button type="button" onClick={() => void clearAppCacheAndReload()} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50">
              Clear cache and reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

function SafeSuspense({ children, fallback }: LazyLoadBoundaryProps) {
  return (
    <LazyLoadBoundary fallback={fallback}>
      <Suspense fallback={fallback || <PageLoader />}>{children}</Suspense>
    </LazyLoadBoundary>
  );
}

function useAppBootReady(ready: boolean) {
  useEffect(() => {
    window.__TIRYANI_APP_BOOTED__ = ready;
  }, [ready]);
}

const PUBLIC_VIEW_PAGES = new Set(['dealers']);
const PUBLIC_AUTH_ROUTES = new Set([
  '/login',
  '/officer-toolkit',
  '/officer-toolkit/statutory-forms',
  '/officer-toolkit/acreage-calculator',
  '/officer-toolkit/farm-calculators',
  '/officer-toolkit/fertilizer-calculator',
  '/officer-toolkit/crop-protection',
  '/officer-toolkit/pesticide-calculator',
  '/officer-toolkit/plant-population-calculator',
  '/officer-toolkit/seed-rate-calculator',
  '/officer-toolkit/legal-ready-reckoner',
]);
const INACTIVITY_SIGN_OUT_MS = 5 * 60 * 1000;

const PAGE_PATHS: Record<string, string> = {
  dashboard: '/dashboard',
  'stock-analytics': '/stock-analytics',
  'stock-receipts-sales': '/stock-receipts-sales',
  'dealer-portal': '/dealer-portal',
  dealers: '/dealers',
  'farmer-database': '/farmer-database',
  crops: '/crops',
  'crop-admin': '/crop-admin',
  'crop-cotton': '/crop-cotton',
  'crop-paddy': '/crop-paddy',
  'crop-maize': '/crop-maize',
  'crop-pulses': '/crop-pulses',
  'crop-oilseeds': '/crop-oilseeds',
  forms: '/forms',
  'gos-circulars': '/gos-circulars',
  quality: '/quality',
  'quality-seeds': '/quality-seeds',
  'quality-pesticides': '/quality-pesticides',
  'quality-fertilizers': '/quality-fertilizers',
  'farm-mechanization': '/farm-mechanization',
  excel: '/excel',
  'file-directory': '/file-directory',
  subsidy: '/subsidy',
  'subsidy-nfsm': '/subsidy-nfsm',
  'subsidy-state-seed': '/subsidy-state-seed',
  'officer-toolkit': '/officer-toolkit',
  'acreage-calculator': '/acreage-calculator',
  'farm-calculators': '/officer-toolkit/farm-calculators',
  'fertilizer-calculator': '/officer-toolkit/fertilizer-calculator',
  'crop-protection': '/officer-toolkit/crop-protection',
  'pesticide-calculator': '/officer-toolkit/pesticide-calculator',
  'plant-population-calculator': '/officer-toolkit/plant-population-calculator',
  'seed-rate-calculator': '/officer-toolkit/seed-rate-calculator',
  'legal-ready-reckoner': '/officer-toolkit/legal-ready-reckoner',
  analytics: '/analytics',
  settings: '/settings',
};

function pageToPath(page: string) {
  return PAGE_PATHS[page] || '/dashboard';
}

const SCROLL_POSITIONS_KEY = 'tiryani-route-scroll-positions';

function getRouteUrl(location: ReturnType<typeof useLocation>) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function getHistoryIndex() {
  const state = window.history.state as { idx?: number } | null;
  return typeof state?.idx === 'number' ? state.idx : 0;
}

function getRouteBackFallback(pathname: string, isAuthenticated: boolean) {
  if (pathname === '/officer-toolkit/legal-ready-reckoner') {
    return '/officer-toolkit';
  }
  if (
    pathname === '/officer-toolkit/acreage-calculator' ||
    pathname === '/officer-toolkit/fertilizer-calculator' ||
    pathname === '/officer-toolkit/pesticide-calculator' ||
    pathname === '/officer-toolkit/plant-population-calculator' ||
    pathname === '/officer-toolkit/seed-rate-calculator'
  ) {
    return '/officer-toolkit/farm-calculators';
  }
  if (
    pathname === '/officer-toolkit/statutory-forms' ||
    pathname === '/officer-toolkit/acreage-calculator' ||
    pathname === '/officer-toolkit/farm-calculators' ||
    pathname === '/officer-toolkit/crop-protection'
  ) {
    return '/officer-toolkit';
  }
  if (pathname === '/forms' || pathname === '/acreage-calculator') {
    return '/officer-toolkit';
  }
  if (pathname === '/officer-toolkit') {
    return isAuthenticated ? '/dashboard' : '/login';
  }
  if (isAuthenticated && pathname !== '/dashboard' && pathname !== '/' && pathname !== '/login') {
    return '/dashboard';
  }
  return null;
}

function getPageBackFallback(page: string, isDealerUser: boolean) {
  if (page === 'forms' || page === 'acreage-calculator' || page === 'crop-protection') return '/officer-toolkit';
  if (page === 'farm-calculators') return '/officer-toolkit';
  if (page === 'fertilizer-calculator' || page === 'pesticide-calculator' || page === 'plant-population-calculator' || page === 'seed-rate-calculator') return '/officer-toolkit/farm-calculators';
  if (page === 'legal-ready-reckoner') return '/officer-toolkit';
  if (page === 'officer-toolkit') return '/dashboard';
  if (page.startsWith('crop-')) return '/crops';
  if (page.startsWith('quality-')) return '/quality';
  if (page.startsWith('subsidy-')) return '/subsidy';
  return isDealerUser ? '/dealer-portal' : '/dashboard';
}
function useAppScrollRestoration(location: ReturnType<typeof useLocation>, navigationType: ReturnType<typeof useNavigationType>) {
  useEffect(() => {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = original;
    };
  }, []);

  useLayoutEffect(() => {
    const scrollKey = location.key || getRouteUrl(location);
    const positions = readScrollPositions();
    const restoreY = navigationType === 'POP' ? positions[scrollKey] || 0 : 0;
    const restoreTimer = window.setTimeout(() => {
      window.scrollTo({ top: restoreY, left: 0 });
    }, 0);

    return () => {
      window.clearTimeout(restoreTimer);
      writeScrollPosition(scrollKey, window.scrollY);
    };
  }, [location, navigationType]);
}

function readScrollPositions(): Record<string, number> {
  try {
    return JSON.parse(window.sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function writeScrollPosition(key: string, value: number) {
  try {
    const positions = readScrollPositions();
    positions[key] = value;
    window.sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
  } catch {
    // Scroll restoration is a progressive enhancement.
  }
}

function useInitialBackFallback(
  location: ReturnType<typeof useLocation>,
  loading: boolean,
  isAuthenticated: boolean
) {
  const guardedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const currentUrl = getRouteUrl(location);
    const fallbackPath = getRouteBackFallback(location.pathname, isAuthenticated);
    if (!fallbackPath || fallbackPath === currentUrl || guardedUrlRef.current === currentUrl) return;
    if (getHistoryIndex() > 0) return;

    const currentState = window.history.state && typeof window.history.state === 'object'
      ? { ...window.history.state }
      : {};
    const currentKey = typeof currentState.key === 'string' ? currentState.key : location.key;
    const fallbackKey = `fallback-${Date.now()}`;

    window.history.replaceState(
      { ...currentState, idx: 0, key: fallbackKey, usr: { tiryaniFallback: true } },
      '',
      fallbackPath
    );
    window.history.pushState(
      { ...currentState, idx: 1, key: currentKey, usr: currentState.usr },
      '',
      currentUrl
    );
    guardedUrlRef.current = currentUrl;
  }, [isAuthenticated, loading, location]);
}

function PublicReadOnlyShell({
  title,
  onHome,
  children,
}: {
  title: string;
  onHome: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#eef6f0] dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <PortalLogo size="sm" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black sm:text-base font-[var(--font-stylish)]">AGRONIX</h1>
              <p className="truncate text-xs font-semibold text-emerald-100">{title} - Public view</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onHome}
            className="shrink-0 rounded-lg bg-white/15 px-3 py-2 text-sm font-black transition hover:bg-white/25"
          >
            Login
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <SafeSuspense fallback={<PageLoader />}>{children}</SafeSuspense>
      </main>
    </div>
  );
}

function AppUpdateBanner() {
  const [visible, setVisible] = useState(() => hasNewAppVersion());
  const [isOnlineTransition, setIsOnlineTransition] = useState(false);

  useEffect(() => {
    if (!hasNewAppVersion()) rememberCurrentAppVersion();
  }, []);

  useEffect(() => {
    const show = () => {
      // Don't show banner during online/offline transition
      if (!isOnlineTransition) setVisible(true);
    };
    window.addEventListener('tiryani:update-available', show);
    return () => window.removeEventListener('tiryani:update-available', show);
  }, [isOnlineTransition]);

  // Handle online/offline transitions
  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineTransition(true);
      // Clear transition flag after 5 seconds
      setTimeout(() => setIsOnlineTransition(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Show on all pages when update is available
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[10000] max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 text-sm shadow-2xl dark:border-emerald-900 dark:bg-slate-950">
      <div className="mb-3">
        <p className="font-black text-slate-950 dark:text-white">New update available</p>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Reload to use the latest deployed version.</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => { dismissUpdateBanner(); setVisible(false); }} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">
          Later
        </button>
        <button type="button" onClick={() => { rememberCurrentAppVersion(); setTimeout(() => window.location.reload(), 100); }} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800">
          Update
        </button>
      </div>
    </div>
  );
}

function AppVersionBadge() {
  return (
    <div className="pointer-events-none fixed bottom-1 right-2 z-[60] rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-950/70 dark:text-slate-400 dark:ring-slate-800">
      App Version: {APP_BUILD_LABEL}
    </div>
  );
}
function AppContent() {
  const { user, loading, authChecked, appReady, isAdminUser, isTestUser, isDealerUser, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const [isHydrated, setIsHydrated] = useState(false);
  const [forceAppShell, setForceAppShell] = useState(false);
  const currentPathIsPublic = PUBLIC_AUTH_ROUTES.has(location.pathname) || location.pathname === '/' || location.pathname === '/login';
  const hideCalculatorLogo =
    location.pathname === '/officer-toolkit/fertilizer-calculator' ||
    location.pathname === '/officer-toolkit/acreage-calculator' ||
    location.pathname === '/fertilizer-calculator' ||
    location.pathname === '/acreage-calculator';
  useAppScrollRestoration(location, navigationType);
  useInitialBackFallback(location, loading, Boolean(user));

  // Wait for hydration to complete before rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (authChecked && appReady && isHydrated) {
      setForceAppShell(false);
      return;
    }

    const timer = window.setTimeout(() => {
      console.warn('App startup took too long. Showing portal shell instead of keeping the full-page loader.');
      setForceAppShell(true);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [appReady, authChecked, isHydrated]);

  const validPages = useMemo(
    () =>
      new Set([
        'dashboard',
        'stock-analytics',
        'stock-receipts-sales',
        'dealer-portal',
        'dealers',
        'farmer-database',
        'crops',
        'crop-admin',
        'crop-cotton',
        'crop-paddy',
        'crop-maize',
        'crop-pulses',
        'crop-oilseeds',
        'forms',
        'gos-circulars',
        'quality',
        'quality-seeds',
        'quality-pesticides',
        'quality-fertilizers',
        'farm-mechanization',
        'excel',
        'file-directory',
        'subsidy',
        'subsidy-nfsm',
        'subsidy-state-seed',
        'officer-toolkit',
        'farm-calculators',
        'acreage-calculator',
        'fertilizer-calculator',
        'crop-protection',
        'pesticide-calculator',
        'plant-population-calculator',
        'seed-rate-calculator',
        'legal-ready-reckoner',
        'analytics',
        'settings',
      ]),
    []
  );
  const getPageFromLocation = useCallback(() => {
    try {
      const legacyPage = new URLSearchParams(location.search).get('page');
      const routePage = location.pathname.replace(/^\/+/, '') || 'dashboard';
      const hashPage = location.hash.replace(/^#\/?/, '');
      
      // Handle nested routes for officer toolkit
      let page = routePage !== 'dashboard' ? routePage : legacyPage || routePage || hashPage;
      if (page === 'officer-toolkit/farm-calculators') {
        page = 'farm-calculators';
      }
      if (page === 'officer-toolkit/acreage-calculator') {
        page = 'acreage-calculator';
      }
      if (page === 'officer-toolkit/statutory-forms') {
        page = 'forms';
      }
      if (page === 'officer-toolkit/fertilizer-calculator') {
        page = 'fertilizer-calculator';
      }
      if (page === 'officer-toolkit/crop-protection') {
        page = 'crop-protection';
      }
      if (page === 'officer-toolkit/pesticide-calculator') {
        page = 'pesticide-calculator';
      }
      if (page === 'officer-toolkit/plant-population-calculator') {
        page = 'plant-population-calculator';
      }
      if (page === 'officer-toolkit/seed-rate-calculator') {
        page = 'seed-rate-calculator';
      }
      if (page === 'officer-toolkit/legal-ready-reckoner') {
        page = 'legal-ready-reckoner';
      }
      
      return validPages.has(page) ? page : 'dashboard';
    } catch (error) {
      console.error('Error getting page from location:', error);
      return 'dashboard';
    }
  }, [location.hash, location.pathname, location.search, validPages]);
  const [currentPage, setCurrentPage] = useState(() => getPageFromLocation());
  const pageRef = useRef(currentPage);

  const returnToLoginPage = useCallback(() => {
    pageRef.current = 'dashboard';
    setCurrentPage('dashboard');
    window.localStorage.removeItem('tiryani-post-login-page');
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleSignOut = useCallback(() => {
    returnToLoginPage();
    void signOut();
  }, [returnToLoginPage, signOut]);

  const navigateToPage = useCallback(
    (page: string, options: { replace?: boolean } = {}) => {
      if (!validPages.has(page)) return;
      setCurrentPage(page);
      navigate(pageToPath(page), {
        replace: options.replace,
        state: { tiryaniPage: page, from: pageRef.current },
      });
    },
    [navigate, validPages]
  );

  useEffect(() => {
    pageRef.current = currentPage;
    window.localStorage.setItem('tiryani-current-page', currentPage);
  }, [currentPage]);

  const handleBack = useCallback(() => {
    const fallbackPage = getPageBackFallback(currentPage, isDealerUser);
    navigate(pageToPath(fallbackPage), { replace: true });
  }, [currentPage, isDealerUser, navigate]);

  useEffect(() => {
    const nextPage = getPageFromLocation();
    setCurrentPage(nextPage);
  }, [getPageFromLocation]);

  useEffect(() => {
    if ((location.pathname === '/' || location.pathname === '/login') && !location.search && user) {
      const page = isDealerUser ? 'dealer-portal' : 'dashboard';
      navigate(pageToPath(page), { replace: true, state: { tiryaniPage: page } });
    }
  }, [isDealerUser, location.pathname, location.search, navigate, user]);

  useEffect(() => {
    if (user && isDealerUser && currentPage === 'dashboard') {
      navigateToPage('dealer-portal', { replace: true });
    }
  }, [currentPage, isDealerUser, navigateToPage, user]);

  useEffect(() => {
    if (!user) return;

    let timeoutId = 0;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        handleSignOut();
      }, INACTIVITY_SIGN_OUT_MS);
    };

    const activityEvents = ['click', 'keydown', 'mousemove', 'pointerdown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [handleSignOut, user]);

  useEffect(() => {
    const isDefaultAuthRoute = location.pathname === '/' || location.pathname === '/login';

    if (user && isDealerUser && isDefaultAuthRoute) {
      navigateToPage('dealer-portal', { replace: true });
      return;
    }

    if (user && isAdminUser && isDefaultAuthRoute) {
      window.localStorage.removeItem('tiryani-post-login-page');
      navigateToPage('dashboard', { replace: true });
    }
  }, [location.pathname, user, isAdminUser, isDealerUser, navigateToPage]);

  useEffect(() => {
    if (
      loading ||
      user ||
      currentPage === 'dashboard' ||
      PUBLIC_VIEW_PAGES.has(currentPage) ||
      location.pathname === '/officer-toolkit' ||
      PUBLIC_AUTH_ROUTES.has(location.pathname)
    ) return;
    navigateToPage('dashboard', { replace: true });
  }, [currentPage, loading, location.pathname, navigateToPage, user]);

  useEffect(() => {
    if (loading || user) return;
    if (
      location.pathname.startsWith('/officer-toolkit/') &&
      location.pathname !== '/officer-toolkit/statutory-forms' &&
      location.pathname !== '/officer-toolkit/acreage-calculator' &&
    location.pathname !== '/officer-toolkit/farm-calculators' &&
      location.pathname !== '/officer-toolkit/fertilizer-calculator' &&
      location.pathname !== '/officer-toolkit/crop-protection' &&
      location.pathname !== '/officer-toolkit/pesticide-calculator' &&
      location.pathname !== '/officer-toolkit/plant-population-calculator' &&
      location.pathname !== '/officer-toolkit/seed-rate-calculator' &&
      location.pathname !== '/officer-toolkit/legal-ready-reckoner'
    ) {
      navigate('/officer-toolkit', { replace: true });
    }
  }, [loading, location.pathname, navigate, user]);

  const shellReady = isHydrated && (authChecked || currentPathIsPublic || forceAppShell) && (appReady || currentPathIsPublic || forceAppShell);
  useAppBootReady(shellReady);

  // Show loader during initial load or hydration (must be after all hooks). Public/officer toolkit routes are allowed to render even if auth is slow.
  if (!shellReady) {
    return <GlobalAppLoader hideLogo={hideCalculatorLogo} />;
  }

  if (!user && PUBLIC_VIEW_PAGES.has(currentPage)) {
    return (
      <PublicReadOnlyShell
        title={currentPage === 'dealers' ? 'Dealers Directory' : 'Stock Inventory'}
        onHome={() => navigateToPage('dashboard')}
      >
        {currentPage === 'dealers' ? <DealerManagement /> : null}
      </PublicReadOnlyShell>
    );
  }

  if (!user && currentPage === 'officer-toolkit') {
    return (
      <SafeSuspense fallback={<GlobalAppLoader />}>
        <OfficersToolkit isAdmin={false} isTestUser={false} />
      </SafeSuspense>
    );
  }

  if (!user && currentPage === 'farm-calculators') {
    return (
      <SafeSuspense fallback={<GlobalAppLoader />}>
        <FarmCalculators />
      </SafeSuspense>
    );
  }

  if (!user && currentPage === 'acreage-calculator') {
    return (
      <SafeSuspense fallback={<GlobalAppLoader hideLogo />}>
        <AcreageCalculator />
      </SafeSuspense>
    );
  }

  if (!user && currentPage === 'fertilizer-calculator') {
    return (
      <SafeSuspense fallback={<GlobalAppLoader hideLogo />}>
        <FertilizerCalculator />
      </SafeSuspense>
    );
  }

  if (!user && currentPage === 'crop-protection') {
    return (
      <SafeSuspense fallback={<GlobalAppLoader />}>
        <CropProtectionTool />
      </SafeSuspense>
    );
  }

  if (!user && currentPage === 'pesticide-calculator') {
    return (
      <SafeSuspense fallback={<GlobalAppLoader />}>
        <PesticideCalculator />
      </SafeSuspense>
    );
  }

  if (!user && currentPage === 'plant-population-calculator') {
    return (
      <SafeSuspense fallback={<GlobalAppLoader />}>
        <PlantPopulationCalculator />
      </SafeSuspense>
    );
  }

  if (!user && currentPage === 'seed-rate-calculator') {
    return (
      <SafeSuspense fallback={<GlobalAppLoader />}>
        <SeedRateCalculator />
      </SafeSuspense>
    );
  }

  if (!user && currentPage === 'legal-ready-reckoner') {
    return (
      <SafeSuspense fallback={<GlobalAppLoader />}>
        <AgriLegalReadyReckoner />
      </SafeSuspense>
    );
  }

  if (
    !user &&
    location.pathname.startsWith('/officer-toolkit/') &&
    location.pathname !== '/officer-toolkit/statutory-forms' &&
    location.pathname !== '/officer-toolkit/acreage-calculator' &&
    location.pathname !== '/officer-toolkit/farm-calculators' &&
    location.pathname !== '/officer-toolkit/fertilizer-calculator' &&
    location.pathname !== '/officer-toolkit/crop-protection'
  ) {
    return <PageLoader hideLogo={hideCalculatorLogo} />;
  }

  if (!user) {
    return (
      <SafeSuspense fallback={<PageLoader hideLogo={hideCalculatorLogo} />}>
        <Login />
      </SafeSuspense>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'stock-analytics':
        return (
          <SafeSuspense fallback={<PageLoader />}>
            <StockAnalytics />
          </SafeSuspense>
        );
      case 'stock-receipts-sales':
        return (
          <SafeSuspense fallback={<PageLoader />}>
            <StockReceiptsSales />
          </SafeSuspense>
        );
      case 'dealer-portal':
        return <DealerStockPortal />;
      case 'dealers':
        return <DealerManagement />;
      case 'farmer-database':
        return <FarmerDatabase />;
      case 'crops':
        return <CropManagement />;
      case 'crop-admin':
        return isAdminUser ? <CropAdminDashboard /> : <CropManagement />;
      case 'crop-cotton':
        return <CropPage cropType="cotton" />;
      case 'crop-paddy':
        return <CropPage cropType="paddy" />;
      case 'crop-maize':
        return <CropPage cropType="maize" />;
      case 'crop-pulses':
        return <CropPage cropType="pulses" />;
      case 'crop-oilseeds':
        return <CropPage cropType="oilseeds" />;
      case 'forms':
        return <FormsDownloads />;
      case 'gos-circulars':
        return <GosCirculars />;
      case 'quality':
        return <QualityControlHub />;
      case 'quality-seeds':
        return <QualityControl category="seeds" />;
      case 'quality-pesticides':
        return <QualityControl category="pesticides" />;
      case 'quality-fertilizers':
        return <QualityControl category="fertilizers" />;
      case 'farm-mechanization':
        return <FarmMechanization />;
      case 'excel':
        return isAdminUser ? <ExcelUploads /> : <Dashboard />;
      case 'file-directory':
        return isAdminUser ? <FileDirectory /> : <Dashboard />;
      case 'subsidy':
      case 'subsidy-nfsm':
      case 'subsidy-state-seed':
        return (
          <SubsidyTracking
            initialProgram={currentPage === 'subsidy-state-seed' ? 'state_seed_cell' : 'nfsm'}
          />
        );
      case 'officer-toolkit':
        return <OfficersToolkit isAdmin={isAdminUser} isTestUser={isTestUser} />;
      case 'farm-calculators':
        return <FarmCalculators />;
      case 'acreage-calculator':
        return <AcreageCalculator />;
      case 'fertilizer-calculator':
        return <FertilizerCalculator />;
      case 'crop-protection':
        return <CropProtectionTool />;
      case 'pesticide-calculator':
        return <PesticideCalculator />;
      case 'plant-population-calculator':
        return <PlantPopulationCalculator />;
      case 'seed-rate-calculator':
        return <SeedRateCalculator />;
      case 'legal-ready-reckoner':
        return <AgriLegalReadyReckoner />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SafeSuspense fallback={<PageLoader hideLogo={hideCalculatorLogo} />}>
      <Layout currentPage={currentPage} onNavigate={navigateToPage} onBack={handleBack} onSignOut={handleSignOut}>
        {renderPage()}
      </Layout>
    </SafeSuspense>
  );
}

function languageSectionFromPath(pathname: string) {
  const normalized = pathname.replace(/^\/+|\/+$/g, '') || 'login';
  return normalized.replace(/\/+ /g, ':').replace(/\/+/g, ':');
}

function LanguageScope({ children }: { children: React.ReactNode }) {
  const { user, dealerId } = useAuth();
  const location = useLocation();
  const userKey = dealerId || user?.id || user?.email || 'public';
  const sectionKey = languageSectionFromPath(location.pathname);

  return (
    <LanguageProvider userKey={userKey} sectionKey={sectionKey}>
      {children}
    </LanguageProvider>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <LanguageScope>
              <SEO />
              <OrganizationSchema />
              <OfflineScreen />
              <AppUpdateBanner />
              <AppContent />
              <AppVersionBadge />
            </LanguageScope>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;


















