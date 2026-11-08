import React from "react";
import { Navigate } from "react-router-dom";
import { PageLoader, PublicReadOnlyShell, SafeSuspense } from "./loading";
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
  ModuleDirectory,
  OfficerContacts,
  OfficerContactsAdmin,
  OfficersToolkit,
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
  TourDiary
} from "./lazyPages";
export function PageSwitch({ currentPage, isAdminUser, isTestUser, isOfficerUser = false, onNavigate }) {
  switch (currentPage) {
    case "register":
    case "officer-register":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(OfficerSignUp, null));
    case "forgot-password":
    case "reset-password":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(ForgotPassword, null));
    case "dashboard":
      return /* @__PURE__ */ React.createElement(Dashboard, null);
    case "stock-analytics":
      return isAdminUser ? /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(StockAnalytics, null)) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "stock-receipts-sales":
      return isAdminUser ? /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(StockReceiptsSales, null)) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "dealer-portal":
      return /* @__PURE__ */ React.createElement(DealerStockPortal, null);
    case "dealers":
      return isAdminUser || isOfficerUser ? /* @__PURE__ */ React.createElement(DealerManagement, null) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "farmer-database":
      return isAdminUser ? /* @__PURE__ */ React.createElement(FarmerDatabase, null) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "crops":
      return /* @__PURE__ */ React.createElement(CropManagement, null);
    case "crop-admin":
      return isAdminUser ? /* @__PURE__ */ React.createElement(CropAdminDashboard, null) : /* @__PURE__ */ React.createElement(CropManagement, null);
    case "crop-cotton":
      return /* @__PURE__ */ React.createElement(CropPage, { cropType: "cotton" });
    case "crop-paddy":
      return /* @__PURE__ */ React.createElement(CropPage, { cropType: "paddy" });
    case "crop-maize":
      return /* @__PURE__ */ React.createElement(CropPage, { cropType: "maize" });
    case "crop-pulses":
      return /* @__PURE__ */ React.createElement(CropPage, { cropType: "pulses" });
    case "crop-oilseeds":
      return /* @__PURE__ */ React.createElement(CropPage, { cropType: "oilseeds" });
    case "forms":
      return /* @__PURE__ */ React.createElement(SamplingHub, null);
    case "forms-library":
      return /* @__PURE__ */ React.createElement(FormsLibrary, null);
    case "gos-circulars":
      return /* @__PURE__ */ React.createElement(GosCirculars, null);
    case "quality":
      return isAdminUser ? /* @__PURE__ */ React.createElement(QualityControlHub, null) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "quality-seeds":
      return isAdminUser ? /* @__PURE__ */ React.createElement(QualityControl, { category: "seeds" }) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "quality-pesticides":
      return isAdminUser ? /* @__PURE__ */ React.createElement(QualityControl, { category: "pesticides" }) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "quality-fertilizers":
      return isAdminUser ? /* @__PURE__ */ React.createElement(QualityControl, { category: "fertilizers" }) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "farm-mechanization":
      return isAdminUser ? /* @__PURE__ */ React.createElement(FarmMechanization, null) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "excel":
      return isAdminUser ? /* @__PURE__ */ React.createElement(ExcelUploads, null) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "file-directory":
      return isAdminUser ? /* @__PURE__ */ React.createElement(FileDirectory, null) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "subsidy":
    case "subsidy-nfsm":
    case "subsidy-state-seed":
      return isAdminUser ? /* @__PURE__ */ React.createElement(
        SubsidyTracking,
        {
          initialProgram: currentPage === "subsidy-state-seed" ? "state_seed_cell" : "nfsm"
        }
      ) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "officer-toolkit":
    case "field-tools":
      return /* @__PURE__ */ React.createElement(Navigate, { to: "/dashboard", replace: true });
    case "officer-records":
      return /* @__PURE__ */ React.createElement(OfficersToolkit, { isAdmin: isAdminUser, isTestUser, isPublic: false, initialTab: "records", fixedTab: "records" });
    case "government-portals":
      return /* @__PURE__ */ React.createElement(GovernmentPortalsPage, null);
    case "license-services":
      return /* @__PURE__ */ React.createElement(LicenseServices, null);
    case "agrochemicals":
      return /* @__PURE__ */ React.createElement(AgrochemicalDatabase, null);
    case "farm-calculators":
      return /* @__PURE__ */ React.createElement(FarmCalculators, null);
    case "acreage-calculator":
      return /* @__PURE__ */ React.createElement(AcreageCalculator, null);
    case "fertilizer-calculator":
      return /* @__PURE__ */ React.createElement(FertilizerCalculator, null);
    case "crop-doctor":
      return /* @__PURE__ */ React.createElement(CropProtectionTool, null);
    case "pesticide-calculator":
      return /* @__PURE__ */ React.createElement(PesticideCalculator, null);
    case "plant-population-calculator":
      return /* @__PURE__ */ React.createElement(PlantPopulationCalculator, null);
    case "seed-rate-calculator":
      return /* @__PURE__ */ React.createElement(SeedRateCalculator, null);
    case "irrigation-calculator":
      return /* @__PURE__ */ React.createElement(IrrigationCalculator, null);
    case "profitability-calculator":
      return /* @__PURE__ */ React.createElement(ProfitabilityCalculator, null);
    case "soil-health-meter":
      return /* @__PURE__ */ React.createElement(SoilHealthMeter, null);
    case "acts-and-orders":
      return /* @__PURE__ */ React.createElement(ActsAndOrders, null);
    case "officer-contacts":
      return /* @__PURE__ */ React.createElement(OfficerContacts, null);
    case "officer-contacts-admin":
      return isAdminUser ? /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(OfficerContactsAdmin, null)) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "tour-diary":
      return /* @__PURE__ */ React.createElement(TourDiary, null);
    case "seed-dealer-inspection":
      return /* @__PURE__ */ React.createElement(SeedDealerInspection, null);
    case "fertilizer-dealer-inspection":
      return /* @__PURE__ */ React.createElement(FertilizerDealerInspection, null);
    case "insecticide-dealer-inspection":
      return /* @__PURE__ */ React.createElement(InsecticideDealerInspection, null);
    case "inspection-enforcement":
      return /* @__PURE__ */ React.createElement(InspectionEnforcementHub, null);
    case "enforcement-tracker":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(EnforcementTracker, null));
    case "analytics":
      return isAdminUser ? /* @__PURE__ */ React.createElement(Analytics, null) : /* @__PURE__ */ React.createElement(Dashboard, null);
    case "settings":
      return /* @__PURE__ */ React.createElement(Settings, null);
    case "all-modules":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(ModuleDirectory, { currentPage, isAdminUser, isOfficerUser, onNavigate }));
    case "knowledge":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeDashboard, null));
    case "knowledge-library":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeDocumentLibrary, null));
    case "knowledge-upload":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeUpload, null));
    case "knowledge-categories":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeCategories, null));
    case "knowledge-queue":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeProcessingQueue, null));
    case "knowledge-analytics":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeAnalytics, null));
    case "knowledge-settings":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeSettings, null));
    case "knowledge-assistant":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeAssistant, null));
    case "knowledge-search":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeSearch, null));
    case "knowledge-viewer":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(KnowledgeDocumentViewer, null));
    case "disclaimer":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(Disclaimer, null));
    case "privacy-policy":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(PrivacyPolicy, null));
    case "terms-conditions":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(TermsConditions, null));
    default:
      return /* @__PURE__ */ React.createElement(Dashboard, null);
  }
}
function PublicToolkitPage({ children, hideLogo = false }) {
  return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, { hideLogo }) }, children);
}
export function PublicPageSwitch({ currentPage, onPublicShellHome }) {
  switch (currentPage) {
    case "register":
    case "officer-register":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(OfficerSignUp, null));
    case "forgot-password":
    case "reset-password":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(ForgotPassword, null));
    case "dealers":
      return /* @__PURE__ */ React.createElement(PublicReadOnlyShell, { title: "Dealers Directory", onHome: onPublicShellHome }, /* @__PURE__ */ React.createElement(DealerManagement, null));
    case "officer-toolkit":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(OfficersToolkit, { isAdmin: false, isTestUser: false, isPublic: true }));
    case "forms":
    case "forms-library":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(PublicOfficerTools, null));
    case "license-services":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(LicenseServices, null));
    case "agrochemicals":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(AgrochemicalDatabase, null));
    case "farm-calculators":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(FarmCalculators, null));
    case "acreage-calculator":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, { hideLogo: true }, /* @__PURE__ */ React.createElement(AcreageCalculator, null));
    case "fertilizer-calculator":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, { hideLogo: true }, /* @__PURE__ */ React.createElement(FertilizerCalculator, null));
    case "crop-doctor":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(CropProtectionTool, null));
    case "pesticide-calculator":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(PesticideCalculator, null));
    case "plant-population-calculator":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(PlantPopulationCalculator, null));
    case "seed-rate-calculator":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(SeedRateCalculator, null));
    case "irrigation-calculator":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(IrrigationCalculator, null));
    case "profitability-calculator":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(ProfitabilityCalculator, null));
    case "soil-health-meter":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(SoilHealthMeter, null));
    case "acts-and-orders":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(ActsAndOrders, null));
    case "officer-contacts":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(OfficerContacts, null));
    case "tour-diary":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(TourDiary, null));
    case "seed-dealer-inspection":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(SeedDealerInspection, null));
    case "fertilizer-dealer-inspection":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(FertilizerDealerInspection, null));
    case "insecticide-dealer-inspection":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(InsecticideDealerInspection, null));
    case "inspection-enforcement":
      return /* @__PURE__ */ React.createElement(PublicToolkitPage, null, /* @__PURE__ */ React.createElement(InspectionEnforcementHub, null));
    case "disclaimer":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(Disclaimer, null));
    case "privacy-policy":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(PrivacyPolicy, null));
    case "terms-conditions":
      return /* @__PURE__ */ React.createElement(SafeSuspense, { fallback: /* @__PURE__ */ React.createElement(PageLoader, null) }, /* @__PURE__ */ React.createElement(TermsConditions, null));
    default:
      return null;
  }
}
