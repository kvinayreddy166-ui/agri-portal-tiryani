import React, { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { PortalLogo } from './components/ui/PortalLogo';
import { OfflineStatus } from './components/ui/OfflineStatus';
import { BrowserRouter, useLocation, useNavigate, useNavigationType } from 'react-router-dom';

const Login = lazy(() => import('./components/Login').then((m) => ({ default: m.Login })));
const Layout = lazy(() => import('./components/Layout').then((m) => ({ default: m.Layout })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const DealerManagement = lazy(() => import('./pages/DealerManagement').then((m) => ({ default: m.DealerManagement })));
const CropPage = lazy(() => import('./pages/CropPage').then((m) => ({ default: m.CropPage })));
const CropManagement = lazy(() => import('./pages/CropManagement').then((m) => ({ default: m.CropManagement })));
const FormsDownloads = lazy(() => import('./pages/FormsDownloads').then((m) => ({ default: m.FormsDownloads })));
const ExcelUploads = lazy(() => import('./pages/ExcelUploads').then((m) => ({ default: m.ExcelUploads })));
const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const QualityControl = lazy(() => import('./pages/QualityControl').then((m) => ({ default: m.QualityControl })));
const QualityControlHub = lazy(() => import('./pages/QualityControlHub').then((m) => ({ default: m.QualityControlHub })));
const FarmMechanization = lazy(() => import('./pages/FarmMechanization').then((m) => ({ default: m.FarmMechanization })));
const GosCirculars = lazy(() => import('./pages/GosCirculars').then((m) => ({ default: m.GosCirculars })));
const FileDirectory = lazy(() => import('./pages/FileDirectory').then((m) => ({ default: m.FileDirectory })));
const SubsidyTracking = lazy(() => import('./pages/SubsidyTracking').then((m) => ({ default: m.SubsidyTracking })));
const DealerStockPortal = lazy(() => import('./pages/DealerStockPortal').then((m) => ({ default: m.DealerStockPortal })));
const AcreageCalculator = lazy(() => import('./pages/AcreageCalculator').then((m) => ({ default: m.AcreageCalculator })));
const OfficersToolkit = lazy(() => import('./pages/OfficersToolkit').then((m) => ({ default: m.OfficersToolkit })));
const OfficialDraftAutomation = lazy(() => import('./pages/OfficialDraftAutomation'));
const StockAnalytics = lazy(() => import('./pages/StockAnalytics'));
const StockReceiptsSales = lazy(() => import('./pages/StockReceiptsSales'));
const CropDiagnosis = lazy(() =>
  import('./pages/CropDiagnosis').then((m) => ({ default: m.CropDiagnosis }))
);
const CropAdminDashboard = lazy(() =>
  import('./pages/admin/CropAdminDashboard.jsx').then((m) => ({ default: m.CropAdminDashboard }))
);
const PdfToolsPage = lazy(() =>
  import('./pages/PdfToolsPage').then((m) => ({ default: m.PdfToolsPage }))
);

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
    </div>
  );
}

const PUBLIC_VIEW_PAGES = new Set(['dealers']);
const PUBLIC_AUTH_ROUTES = new Set(['/login', '/officer-toolkit/statutory-forms', '/officer-toolkit/acreage-calculator', '/officer-toolkit/official-drafts', '/pdf-tools']);
const INACTIVITY_SIGN_OUT_MS = 5 * 60 * 1000;

const PAGE_PATHS: Record<string, string> = {
  dashboard: '/dashboard',
  'stock-analytics': '/stock-analytics',
  'stock-receipts-sales': '/stock-receipts-sales',
  'dealer-portal': '/dealer-portal',
  dealers: '/dealers',
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
  'crop-diagnosis': '/crop-diagnosis',
  'officer-toolkit': '/officer-toolkit',
  'official-drafts': '/officer-toolkit/official-drafts',
  'acreage-calculator': '/acreage-calculator',
  'pdf-tools': '/pdf-tools',
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
  if (pathname === '/officer-toolkit/statutory-forms' || pathname === '/officer-toolkit/acreage-calculator' || pathname === '/officer-toolkit/official-drafts') {
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
  if (page === 'forms' || page === 'acreage-calculator') return '/officer-toolkit';
  if (page === 'officer-toolkit') return '/dashboard';
  if (page.startsWith('crop-') && page !== 'crop-diagnosis') return '/crops';
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
              <h1 className="truncate text-sm font-black sm:text-base">Tiryani Agriculture Portal</h1>
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
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, loading, isAdminUser, isDealerUser, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  useAppScrollRestoration(location, navigationType);
  useInitialBackFallback(location, loading, Boolean(user));
  const validPages = useMemo(
    () =>
      new Set([
        'dashboard',
        'stock-analytics',
        'stock-receipts-sales',
        'dealer-portal',
        'dealers',
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
        'crop-diagnosis',
        'officer-toolkit',
        'official-drafts',
        'acreage-calculator',
        'pdf-tools',
        'analytics',
        'settings',
      ]),
    []
  );
  const getPageFromLocation = useCallback(() => {
    if (PUBLIC_AUTH_ROUTES.has(location.pathname)) return 'dashboard';
    const legacyPage = new URLSearchParams(location.search).get('page');
    const routePage = location.pathname.replace(/^\/+/, '') || 'dashboard';
    const hashPage = location.hash.replace(/^#\/?/, '');
    const page = legacyPage || routePage || hashPage;
    return validPages.has(page) ? page : 'dashboard';
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

  useEffect(() => {
    pageRef.current = currentPage;
    window.localStorage.setItem('tiryani-current-page', currentPage);
  }, [currentPage]);

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

  const handleBack = useCallback(() => {
    if (getHistoryIndex() > 0) {
      navigate(-1);
      return;
    }
    navigate(getPageBackFallback(currentPage, isDealerUser), { replace: true });
  }, [currentPage, isDealerUser, navigate]);

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
      PUBLIC_AUTH_ROUTES.has(location.pathname) ||
      location.pathname === '/pdf-tools'
    ) return;
    navigateToPage('dashboard', { replace: true });
  }, [currentPage, loading, location.pathname, navigateToPage, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eef6f0] dark:bg-slate-950">
        <PortalLogo size="xl" />
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading portal…</p>
      </div>
    );
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

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'stock-analytics':
        return (
          <Suspense fallback={<PageLoader />}>
            <StockAnalytics />
          </Suspense>
        );
      case 'stock-receipts-sales':
        return (
          <Suspense fallback={<PageLoader />}>
            <StockReceiptsSales />
          </Suspense>
        );
      case 'dealer-portal':
        return <DealerStockPortal />;
      case 'dealers':
        return <DealerManagement />;
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
      case 'crop-diagnosis':
        return (
          <Suspense fallback={<PageLoader />}>
            <CropDiagnosis />
          </Suspense>
        );
      case 'officer-toolkit':
        return <OfficersToolkit />;
      case 'official-drafts':
        return (
          <Suspense fallback={<PageLoader />}>
            <OfficialDraftAutomation />
          </Suspense>
        );
      case 'acreage-calculator':
        return <AcreageCalculator />;
      case 'pdf-tools':
        return (
          <Suspense fallback={<PageLoader />}>
            <PdfToolsPage />
          </Suspense>
        );
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Layout currentPage={currentPage} onNavigate={navigateToPage} onBack={handleBack} onSignOut={handleSignOut}>
        {renderPage()}
      </Layout>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <OfflineStatus />
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
