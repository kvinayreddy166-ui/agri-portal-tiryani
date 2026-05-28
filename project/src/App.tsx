import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StockManagement } from './pages/StockManagement';
import { DealerManagement } from './pages/DealerManagement';
import { DealerStockTracking } from './pages/DealerStockTracking';
import { CropPage } from './pages/CropPage';
import { FormsDownloads } from './pages/FormsDownloads';
import { ExcelUploads } from './pages/ExcelUploads';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { QualityControl } from './pages/QualityControl';
import { FarmMechanization } from './pages/FarmMechanization';
import { GosCirculars } from './pages/GosCirculars';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eef6f0]">
        <img src="/images/agri-emblem.png" alt="" className="h-16 w-16 rounded-2xl bg-white p-1 shadow-lg" />
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
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
      case 'quality-seeds':
        return <QualityControl category="seeds" />;
      case 'quality-pesticides':
        return <QualityControl category="pesticides" />;
      case 'quality-fertilizers':
        return <QualityControl category="fertilizers" />;
      case 'farm-mechanization':
        return <FarmMechanization />;
      case 'excel':
        return <ExcelUploads />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
