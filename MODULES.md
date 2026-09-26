# Modules

Functional modules under `project/src/features/`, with responsibilities and key dependencies. Every module's pages are routed via `app/router/lazyPages.ts` + `PageSwitch.tsx`.

| Module | Pages | Responsibility | Depends on |
|--------|-------|----------------|------------|
| `auth` | `Login` | Officer login (Supabase Auth), dealer login flow | `dealerAuth.ts`, `provisionDealerLogins.ts`, `shared/lib/supabase` |
| `dashboard` | `Dashboard`, `Analytics` | Mandal overview, charts, live weather (OpenWeather/Open-Meteo), Google Maps widget | `shared/context/*`, `shared/components/charts` |
| `officers-toolkit` | `OfficersToolkit`, `InspectionsNoticesHub`, `ActsAndOrders`, `ShowCauseNoticeEntry`, `Seed/Fertilizer/InsecticideDealerInspection` | Govt memos & show-cause notices, dealer inspection forms, FCO/legal reference | `data/` (fcoClauses, ready-reckoner, violation data), `inspection/` helpers, `shared/lib/pdfWatermark` |
| `statutory-forms` | `StatutoryForms`, `SeedForms`, `LicenseServices` | Statutory seed/fertilizer/pesticide forms, covering letters, statutory PDF generators | `lib/*Pdf.ts`, `data/fertilizer*`, jsPDF |
| `crop-doctor` | `CropProtectionTool`, `CropAdminDashboard`, `CropIntelligencePage` | TF.js/heuristic disease detection, crop-intelligence content admin | `lib/cropDiseaseModel`, `cropIntelligence`, `cropProtectionService`, `useCropData` |
| `crop-management` | `CropManagement`, `CropPage` | Crop records CRUD, knowledge search, image upload | `services/cropService.ts` (Supabase + local fallback) |
| `dealer-stock` | `DealerStockPortal` (public), `StockManagement`, `StockInventory`, `StockReceiptsSales`, `StockAnalytics`, `DealerManagement` | Dealer stock entry portal + office analytics | `lib/stockInventory`, `fertilizerStock`, `dealerStockAllocation` |
| `farmer-database` | `FarmerDatabase`, `ExcelUploads` | Farmer registry, Excel import | `lib/farmerImport`, `shared/lib/excelParser` |
| `tour-diary` | `TourDiary` | Monthly tour diary entries + PDF export | `lib/diaryStorage`, `diaryPdfStorage` |
| `documents` | `FileDirectory`, `GosCirculars` | Unified file directory, GO/circular library | `lib/documentActions`, `shared/lib/filePreviewUrls` |
| `quality-control` | `QualityControl`, `QualityControlHub` | Sample drawal/QC document lists | shared components |
| `contacts` | `OfficerContacts`, `OfficerContactsAdmin` | Officer directory + admin CRUD | `data/aeoDistricts`, `shared/data/telanganaDistrictMandalData` |
| `calculators` | `FarmCalculators`, `Acreage`, `SeedRate`, `PlantPopulation`, `FertilizerCalculator`, `PesticideCalculator` | Agronomy calculators | `engine/fertilizerEngine` + `fertilizerData` |
| `schemes` | `SubsidyTracking`, `FarmMechanization` | NFSM/State Seed Cell subsidy tracking, mechanization info | Supabase tables |
| `settings` | `Settings` | App preferences | shared contexts |
| `knowledge-base` | 10 pages (Dashboard, Library, Upload, Categories, Queue, Analytics, Settings, Assistant, Search, Viewer) | RAG knowledge base — see `AGENTS.md` | `services/knowledgeService` → Edge Functions |

## Public (unauthenticated) routes

Defined in `app/router/paths.ts` (`PUBLIC_PAGES` / `PUBLIC_AUTH_ROUTES` / `PUBLIC_VIEW_PAGES`):

- **Login** page
- **Dealer Stock Portal** — dealers sign in within the portal UI itself
- **Officer-toolkit public views** — read-only statutory reference pages wrapped in `PublicReadOnlyShell`

## Shared layer (`src/shared/`)

Everything reusable and feature-agnostic. Dependency direction: `features → shared`, never the reverse.

- `context/` — `AuthContext` (session, inactivity timeout), `LanguageContext` (EN/TE + `t()`), `ThemeContext`
- `lib/` — `supabase` client + helpers, `fileTypes`/`uploadFile`/`filePreviewUrls`, `excelParser`, `offlineCache`/`pwaRecovery`/`networkStatus`, `pdfText`/`pdfWatermark`, `siteHits`, `appVersion`
- `components/` — `ui/` (headers, cards, toasts, modals, viewers), `pdf/` (merge/split/compress/convert tools), `preview/` (docx/xlsx/pptx), `seo/`, `charts/`, `ErrorBoundary`, `PopupHint`, `UpdateBanner`
- `hooks/`, `utils/`, `services/`, `data/`, `types/`, `styles/`
