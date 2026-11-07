import React from 'react';
import { Navigate } from 'react-router-dom';
import { PageLoader, PublicReadOnlyShell, SafeSuspense } from './loading';
import { AgronixBrandMark } from '../../shared/components/ui/AgronixBrandMark';
import {
  AgrochemicalDatabase,
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
  Disclaimer,
  EnforcementTracker,
  ExcelUploads,
  FarmCalculators,
  FarmerDatabase,
  FarmMechanization,
  FertilizerCalculator,
  FieldDiagnosis,
  FertilizerDealerInspection,
  FileDirectory,
  GosCirculars,
  InsecticideDealerInspection,
  InspectionEnforcementHub,
  IrrigationCalculator,
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
  FieldToolsPage,
  GovernmentPortalsPage,
  OfficerSignUp,
  ForgotPassword,
  PesticideCalculator,
  PlantPopulationCalculator,
  PrivacyPolicy,
  ProfitabilityCalculator,
  QualityControl,
  QualityControlHub,
  SeedDealerInspection,
  SeedRateCalculator,
  SoilHealthMeter,
  Settings,
  StockAnalytics,
  StockReceiptsSales,
  SamplingHub,
  FormsLibrary,
  PublicOfficerTools,
  SubsidyTracking,
  TermsConditions,
  TourDiary,
} from './lazyPages';

interface PageSwitchProps {
  currentPage: string;
  isAdminUser: boolean;
  isTestUser: boolean;
}

export function PageSwitch({ currentPage, isAdminUser, isTestUser }: PageSwitchProps) {
  switch (currentPage) {
    case 'register':
    case 'officer-register':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <OfficerSignUp />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'forgot-password':
    case 'reset-password':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <ForgotPassword />
          <AgronixBrandMark />
        </SafeSuspense>
      );
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
      return <SamplingHub />;
    case 'forms-library':
      return <FormsLibrary />;
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
      return <OfficersToolkit isAdmin={isAdminUser} isTestUser={isTestUser} isPublic={false} />;
    case 'officer-records':
      return <OfficersToolkit isAdmin={isAdminUser} isTestUser={isTestUser} isPublic={false} initialTab="records" fixedTab="records" />;
    case 'field-tools':
      return <FieldToolsPage />;
    case 'government-portals':
      return <GovernmentPortalsPage />;
    case 'license-services':
      return <LicenseServices />;
    case 'agrochemicals':
      return <AgrochemicalDatabase />;
    case 'farm-calculators':
      return <FarmCalculators />;
    case 'acreage-calculator':
      return <AcreageCalculator />;
    case 'fertilizer-calculator':
      return <FertilizerCalculator />;
    case 'crop-doctor':
      return <CropProtectionTool />;
    case 'pesticide-calculator':
      return <PesticideCalculator />;
    case 'plant-population-calculator':
      return <PlantPopulationCalculator />;
    case 'seed-rate-calculator':
      return <SeedRateCalculator />;
    case 'irrigation-calculator':
      return <IrrigationCalculator />;
    case 'profitability-calculator':
      return <ProfitabilityCalculator />;
    case 'soil-health-meter':
      return <SoilHealthMeter />;
    case 'acts-and-orders':
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
    case 'inspection-enforcement':
      return <InspectionEnforcementHub />;
    case 'enforcement-tracker':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <EnforcementTracker />
        </SafeSuspense>
      );
    case 'field-diagnosis':
      if (import.meta.env.PROD) {
        return <Navigate to="/officer-toolkit" replace />;
      }
      return <FieldDiagnosis />;
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
    case 'disclaimer':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <Disclaimer />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'privacy-policy':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <PrivacyPolicy />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'terms-conditions':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <TermsConditions />
          <AgronixBrandMark />
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
    case 'register':
    case 'officer-register':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <OfficerSignUp />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'forgot-password':
    case 'reset-password':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <ForgotPassword />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'dealers':
      return (
        <PublicReadOnlyShell title="Dealers Directory" onHome={onPublicShellHome}>
          <DealerManagement />
        </PublicReadOnlyShell>
      );
    case 'officer-toolkit':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <OfficersToolkit isAdmin={false} isTestUser={false} isPublic={true} />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'forms':
    case 'forms-library':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <PublicOfficerTools />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'license-services':
      return <PublicToolkitPage><LicenseServices /></PublicToolkitPage>;
    case 'agrochemicals':
      return <PublicToolkitPage><AgrochemicalDatabase /></PublicToolkitPage>;
    case 'farm-calculators':
      return <PublicToolkitPage><FarmCalculators /></PublicToolkitPage>;
    case 'acreage-calculator':
      return <PublicToolkitPage hideLogo><AcreageCalculator /></PublicToolkitPage>;
    case 'fertilizer-calculator':
      return <PublicToolkitPage hideLogo><FertilizerCalculator /></PublicToolkitPage>;
    case 'crop-doctor':
      return <PublicToolkitPage><CropProtectionTool /></PublicToolkitPage>;
    case 'pesticide-calculator':
      return <PublicToolkitPage><PesticideCalculator /></PublicToolkitPage>;
    case 'plant-population-calculator':
      return <PublicToolkitPage><PlantPopulationCalculator /></PublicToolkitPage>;
    case 'seed-rate-calculator':
      return <PublicToolkitPage><SeedRateCalculator /></PublicToolkitPage>;
    case 'irrigation-calculator':
      return <PublicToolkitPage><IrrigationCalculator /></PublicToolkitPage>;
    case 'profitability-calculator':
      return <PublicToolkitPage><ProfitabilityCalculator /></PublicToolkitPage>;
    case 'soil-health-meter':
      return <PublicToolkitPage><SoilHealthMeter /></PublicToolkitPage>;
    case 'acts-and-orders':
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
    case 'inspection-enforcement':
      return <PublicToolkitPage><InspectionEnforcementHub /></PublicToolkitPage>;
    case 'field-diagnosis':
      if (import.meta.env.PROD) {
        return <Navigate to="/officer-toolkit" replace />;
      }
      return <PublicToolkitPage><FieldDiagnosis /></PublicToolkitPage>;
    case 'disclaimer':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <Disclaimer />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'privacy-policy':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <PrivacyPolicy />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    case 'terms-conditions':
      return (
        <SafeSuspense fallback={<PageLoader />}>
          <TermsConditions />
          <AgronixBrandMark />
        </SafeSuspense>
      );
    default:
      return null;
  }
}
