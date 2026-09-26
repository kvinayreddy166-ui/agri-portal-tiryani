import React from 'react';
import { PageLoader, PublicReadOnlyShell, SafeSuspense } from './loading';
import { AgronixBrandMark } from '../../shared/components/ui/AgronixBrandMark';
import {
  ActsAndOrders,
  AcreageCalculator,
  Analytics,
  CropAdminDashboard,
  CropManagement,
  CropPage,
  CropProtectionTool,
  Dashboard,
  DealerManagement,
  DealerStockPortal,
  ExcelUploads,
  FarmCalculators,
  FarmerDatabase,
  FarmMechanization,
  FertilizerCalculator,
  FertilizerDealerInspection,
  FileDirectory,
  GosCirculars,
  InsecticideDealerInspection,
  InspectionsNoticesHub,
  KnowledgeAnalytics,
  KnowledgeAssistant,
  KnowledgeCategories,
  KnowledgeDashboard,
  KnowledgeDocumentLibrary,
  KnowledgeDocumentViewer,
  KnowledgeProcessingQueue,
  KnowledgeSearch,
  KnowledgeSettings,
  KnowledgeUpload,
  LicenseServices,
  OfficerContacts,
  OfficerContactsAdmin,
  OfficersToolkit,
  PesticideCalculator,
  PlantPopulationCalculator,
  QualityControl,
  QualityControlHub,
  SeedDealerInspection,
  SeedRateCalculator,
  Settings,
  StockAnalytics,
  StockReceiptsSales,
  StatutoryForms,
  SubsidyTracking,
  TourDiary,
} from './lazyPages';

interface PageSwitchProps {
  currentPage: string;
  isAdminUser: boolean;
  isTestUser: boolean;
}

export function PageSwitch({ currentPage, isAdminUser, isTestUser }: PageSwitchProps) {
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
      return <StatutoryForms />;
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
    case 'license-application-generator':
      return <LicenseServices />;
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
      return <ActsAndOrders />;
    case 'officer-contacts':
      return <OfficerContacts />;
    case 'officer-contacts-admin':
      return isAdminUser ? (
        <SafeSuspense fallback={<PageLoader />}>
          <OfficerContactsAdmin />
        </SafeSuspense>
      ) : (
        <Dashboard />
      );
    case 'tour-diary':
      return <TourDiary />;
    case 'seed-dealer-inspection':
      return <SeedDealerInspection />;
    case 'fertilizer-dealer-inspection':
      return <FertilizerDealerInspection />;
    case 'insecticide-dealer-inspection':
      return <InsecticideDealerInspection />;
    case 'inspections-notices':
      return <InspectionsNoticesHub />;
    case 'analytics':
      return <Analytics />;
    case 'settings':
      return <Settings />;
    case 'knowledge':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeDashboard />
        </SafeSuspense>
      );
    case 'knowledge-library':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeDocumentLibrary />
        </SafeSuspense>
      );
    case 'knowledge-upload':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeUpload />
        </SafeSuspense>
      );
    case 'knowledge-categories':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeCategories />
        </SafeSuspense>
      );
    case 'knowledge-queue':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeProcessingQueue />
        </SafeSuspense>
      );
    case 'knowledge-analytics':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeAnalytics />
        </SafeSuspense>
      );
    case 'knowledge-settings':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeSettings />
        </SafeSuspense>
      );
    case 'knowledge-assistant':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeAssistant />
        </SafeSuspense>
      );
    case 'knowledge-search':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeSearch />
        </SafeSuspense>
      );
    case 'knowledge-viewer':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <KnowledgeDocumentViewer />
        </SafeSuspense>
      );
    default:
      return <Dashboard />;
  }
}

interface PublicPageSwitchProps {
  currentPage: string;
  onPublicShellHome: () => void;
}

function PublicToolkitPage({ children, hideLogo = false }: { children: React.ReactNode; hideLogo?: boolean }) {
  return (
    <SafeSuspense fallback={<PageLoader hideLogo={hideLogo} />}>
      {children}
      <AgronixBrandMark />
    </SafeSuspense>
  );
}

// Pages reachable without authentication. Returns null when the page is not public.
export function PublicPageSwitch({ currentPage, onPublicShellHome }: PublicPageSwitchProps) {
  switch (currentPage) {
    case 'dealers':
      return (
        <PublicReadOnlyShell title="Dealers Directory" onHome={onPublicShellHome}>
          <DealerManagement />
        </PublicReadOnlyShell>
      );
    case 'officer-toolkit':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <OfficersToolkit isAdmin={false} isTestUser={false} />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'license-application-generator':
      return <PublicToolkitPage><LicenseServices /></PublicToolkitPage>;
    case 'farm-calculators':
      return <PublicToolkitPage><FarmCalculators /></PublicToolkitPage>;
    case 'acreage-calculator':
      return <PublicToolkitPage hideLogo><AcreageCalculator /></PublicToolkitPage>;
    case 'fertilizer-calculator':
      return <PublicToolkitPage hideLogo><FertilizerCalculator /></PublicToolkitPage>;
    case 'crop-protection':
      return <PublicToolkitPage><CropProtectionTool /></PublicToolkitPage>;
    case 'pesticide-calculator':
      return <PublicToolkitPage><PesticideCalculator /></PublicToolkitPage>;
    case 'plant-population-calculator':
      return <PublicToolkitPage><PlantPopulationCalculator /></PublicToolkitPage>;
    case 'seed-rate-calculator':
      return <PublicToolkitPage><SeedRateCalculator /></PublicToolkitPage>;
    case 'legal-ready-reckoner':
      return <PublicToolkitPage><ActsAndOrders /></PublicToolkitPage>;
    case 'officer-contacts':
      return <PublicToolkitPage><OfficerContacts /></PublicToolkitPage>;
    case 'tour-diary':
      return <PublicToolkitPage><TourDiary /></PublicToolkitPage>;
    case 'seed-dealer-inspection':
      return <PublicToolkitPage><SeedDealerInspection /></PublicToolkitPage>;
    case 'fertilizer-dealer-inspection':
      return <PublicToolkitPage><FertilizerDealerInspection /></PublicToolkitPage>;
    case 'insecticide-dealer-inspection':
      return <PublicToolkitPage><InsecticideDealerInspection /></PublicToolkitPage>;
    case 'inspections-notices':
      return <PublicToolkitPage><InspectionsNoticesHub /></PublicToolkitPage>;
    default:
      return null;
  }
}
