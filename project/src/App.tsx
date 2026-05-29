import React, { Suspense, lazy, useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StockManagement } from './pages/StockManagement';
import { DealerManagement } from './pages/DealerManagement';
import { DealerStockTracking } from './pages/DealerStockTracking';
import { CropPage } from './pages/CropPage';
import { CropManagement } from './pages/CropManagement';
import { FormsDownloads } from './pages/FormsDownloads';
import { ExcelUploads } from './pages/ExcelUploads';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { QualityControl } from './pages/QualityControl';
import { QualityControlHub } from './pages/QualityControlHub';
import { FarmMechanization } from './pages/FarmMechanization';
import { GosCirculars } from './pages/GosCirculars';
import { FileDirectory } from './pages/FileDirectory';
import { SubsidyTracking } from './pages/SubsidyTracking';
const CropDiagnosis = lazy(() =>
  import('./pages/CropDiagnosis').then((m) => ({ default: m.CropDiagnosis }))
);

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
    </div>
  );
}

function AppContent() {
  const { user, loading, isAdminUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const navigateToPage = (page: string) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eef6f0] dark:bg-slate-950">
        <img
          src="/images/agri-emblem-192.png"
          alt="Tiryani Agriculture Portal"
          className="h-24 w-24 rounded-3xl bg-white p-1.5 shadow-xl"
        />
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
        return <StockManagement />;
      case 'dealers':
        return <DealerManagement />;
      case 'dealer-stock':
        return <DealerStockTracking />;
      case 'crops':
        return <CropManagement />;
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
      case 'subsidy-nfsm':
        return <SubsidyTracking program="nfsm" onProgramChange={(program) => navigateToPage(program === 'nfsm' ? 'subsidy-nfsm' : 'subsidy-state-seed')} />;
      case 'subsidy-state-seed':
        return <SubsidyTracking program="state_seed_cell" onProgramChange={(program) => navigateToPage(program === 'nfsm' ? 'subsidy-nfsm' : 'subsidy-state-seed')} />;
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
      {renderPage()}
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
