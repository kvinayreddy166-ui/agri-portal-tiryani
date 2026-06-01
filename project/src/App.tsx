import React, { Suspense, lazy, useState, useEffect } from 'react';
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

function AppContent() {
  const { user, loading, isAdminUser, isDealerUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (user && isDealerUser) {
      setCurrentPage('dealer-portal');
      return;
    }

    if (user && isAdminUser) {
      const requestedPage = window.localStorage.getItem('tiryani-post-login-page');
      if (requestedPage) {
        window.localStorage.removeItem('tiryani-post-login-page');
        setCurrentPage(requestedPage);
      }
    }
  }, [user, isAdminUser, isDealerUser]);

  const navigateToPage = (page: string) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eef6f0] dark:bg-slate-950">
        <PortalLogo size="xl" />
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading portal…</p>
      </div>
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
        return isAdminUser ? <StockInventory /> : <Dashboard />;
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
