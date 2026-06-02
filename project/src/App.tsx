import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { PortalLogo } from './components/ui/PortalLogo';
import { Login } from './components/Login';
import { Layout } from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const StockManagement = lazy(() => import('./pages/StockManagement').then((m) => ({ default: m.StockManagement })));
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
const StockInventory = lazy(() => import('./pages/StockInventory').then((m) => ({ default: m.StockInventory })));
const CropDiagnosis = lazy(() =>
  import('./pages/CropDiagnosis').then((m) => ({ default: m.CropDiagnosis }))
);
const CropAdminDashboard = lazy(() =>
  import('./pages/admin/CropAdminDashboard.jsx').then((m) => ({ default: m.CropAdminDashboard }))
);

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
    </div>
  );
}

const PUBLIC_VIEW_PAGES = new Set(['dealers', 'stock-inventory']);

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
  const { user, loading, isAdminUser, isDealerUser } = useAuth();
  const validPages = useMemo(
    () =>
      new Set([
        'dashboard',
        'stock',
        'stock-inventory',
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
        'analytics',
        'settings',
      ]),
    []
  );
  const getPageFromUrl = useCallback(() => {
    const page = new URLSearchParams(window.location.search).get('page') || window.location.hash.replace(/^#\/?/, '');
    return validPages.has(page) ? page : 'dashboard';
  }, [validPages]);
  const [currentPage, setCurrentPage] = useState(() => getPageFromUrl());
  const pageRef = useRef(currentPage);

  useEffect(() => {
    pageRef.current = currentPage;
    window.localStorage.setItem('tiryani-current-page', currentPage);
  }, [currentPage]);

  const buildPageUrl = useCallback((page: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    url.hash = '';
    return `${url.pathname}${url.search}${url.hash}`;
  }, []);

  const navigateToPage = useCallback(
    (page: string, options: { replace?: boolean } = {}) => {
      if (!validPages.has(page)) return;
      setCurrentPage(page);
      const state = { tiryaniPage: page };
      const url = buildPageUrl(page);
      if (options.replace) {
        window.history.replaceState(state, '', url);
      } else if (pageRef.current !== page) {
        window.history.pushState(state, '', url);
      }
    },
    [buildPageUrl, validPages]
  );

  useEffect(() => {
    const initialPage = getPageFromUrl();
    // Seed browser history with a dashboard entry before non-home pages so Android Back
    // navigates inside the portal before the browser can close the installed PWA.
    if (!window.history.state?.tiryaniPage) {
      window.history.replaceState({ tiryaniPage: 'dashboard' }, '', buildPageUrl('dashboard'));
      if (initialPage !== 'dashboard') {
        window.history.pushState({ tiryaniPage: initialPage }, '', buildPageUrl(initialPage));
      }
    }
    setCurrentPage(initialPage);

    const handlePopState = (event: PopStateEvent) => {
      const nextPage = event.state?.tiryaniPage;
      if (validPages.has(nextPage)) {
        setCurrentPage(nextPage);
        return;
      }

      if (pageRef.current !== 'dashboard') {
        window.history.replaceState({ tiryaniPage: 'dashboard' }, '', buildPageUrl('dashboard'));
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [buildPageUrl, getPageFromUrl, validPages]);

  useEffect(() => {
    if (user && isDealerUser) {
      navigateToPage('dealer-portal', { replace: true });
      return;
    }

    if (user && isAdminUser) {
      const requestedPage = window.localStorage.getItem('tiryani-post-login-page');
      if (requestedPage) {
        window.localStorage.removeItem('tiryani-post-login-page');
        navigateToPage(requestedPage);
      }
    }
  }, [user, isAdminUser, isDealerUser, navigateToPage]);

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
        {currentPage === 'dealers' ? <DealerManagement /> : <StockInventory />}
      </PublicReadOnlyShell>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'stock':
        return isAdminUser ? <StockManagement /> : <DealerStockPortal />;
      case 'stock-inventory':
        return <StockInventory />;
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
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={navigateToPage}>
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
