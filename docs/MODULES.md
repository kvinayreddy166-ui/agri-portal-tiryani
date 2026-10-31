# Modules

Functional modules under `project/src/features/`, with responsibilities and key dependencies. Every module's pages are routed via `app/router/lazyPages.ts` + `PageSwitch.tsx`.

| Module | Pages / Components | Responsibility | Key Dependencies |
|--------|--------------------|----------------|------------------|
| `auth` | `Login` | Officer login (Supabase Auth), dealer login flow, inactivity timeout | `dealerAuth.ts`, `provisionDealerLogins.ts`, `shared/lib/supabase` |
| `dashboard` | `Dashboard`, `Analytics` | Mandal overview, crop acreage, live weather (Open-Meteo/OpenWeather), 3D Google Maps widget | `shared/context/*`, `shared/components/charts` |
| `officers-toolkit` | `OfficersToolkit`, `InspectionsNoticesHub`, `ActsAndOrders`, `ShowCauseNoticeEntry`, `SeedDealerInspection`, `FertilizerDealerInspection`, `InsecticideDealerInspection`, `StopSale/Seizure` | Statutory Show Cause Notices (1.15 line spacing), Stop Sale/Seizure orders, dealer inspection audit sheets, FCO/Seeds/Insecticides legal explorer | `data/` (fcoClauses, violation data, offences), `inspection/` helpers, `shared/lib/pdfWatermark`, `pdfUnicodeFonts` |
| `sampling-hub` | `SamplingHub`, `PesticideStatutoryPdfTool`, `FertilizerStatutoryPdfTool`, `SeedForms`, `PesticideCoveringLetterModal` | Statutory dual-coding sampling, Form J/K/L (Fertilizer), Form XX/XXI (Pesticides with 65 CIBRC formulation sanitization), Form VIII (Seed), multi-format covering letters (PDF/DOCX) | `lib/*Pdf.ts`, `statutoryPesticidePdf.ts`, `pesticideCoveringLetterPdf.ts`, `docx`, `jsPDF` |
| `knowledge-base` | 10 pages (Dashboard, Library, Upload, Categories, Queue, Analytics, Settings, Assistant, Search, Viewer) | Hybrid vector (pgvector) + FTS RAG engine, document chunking pipeline, Ollama LLM Q&A, internal cited PDF viewer | `services/knowledgeService` → Supabase Edge Functions (`knowledge-ask`, `knowledge-search`, `knowledge-process`) |
| `calculators` | `FarmCalculators`, `AcreageCalculator`, `SeedRateCalculator`, `PlantPopulationCalculator`, `FertilizerCalculator`, `PesticideCalculator` | Precision agronomic calculators: crop-specific NPK dosages, multi-unit acreage conversion, knapsack tank-load sprays | `engine/fertilizerEngine`, `fertilizerData`, `farmCalculators` |
| `crop-doctor` | `CropProtectionTool`, `CropAdminDashboard`, `CropIntelligencePage` | On-device TensorFlow.js leaf disease classification, crop intelligence content manager | `lib/cropDiseaseModel`, `cropIntelligence`, `cropProtectionService`, `useCropData` |
| `field-diagnosis` | `FieldDiagnosis` | Symptom-based field diagnostic wizard, natural language pest assessment, crop vulnerability index | `data/fieldDiagnosisData.ts`, `shared/components/ui` |
| `crop-management` | `CropManagement`, `CropPage` | Crop master records CRUD, acreage targets, seasonal planning | `services/cropService.ts` |
| `dealer-stock` | `DealerStockPortal` (public), `StockManagement`, `StockInventory`, `StockReceiptsSales`, `StockAnalytics`, `DealerManagement` | Public & authenticated dealer inventory portal, sales registers, opening balance reconciliation, buffer stock analytics | `lib/stockInventory`, `fertilizerStock`, `dealerStockAllocation` |
| `farmer-database` | `FarmerDatabase`, `ExcelUploads` | Farmer registry, survey numbers, Aadhaar/bank validation, PM-KISAN & Rythu Bandhu statuses, batch Excel importer | `lib/farmerImport`, `shared/lib/excelParser` |
| `tour-diary` | `TourDiary` | Monthly tour diary entries, purpose classification, automated official Tour Diary PDF generator | `lib/diaryStorage`, `diaryPdfStorage`, `tourDiaryPdf` |
| `documents` | `FileDirectory`, `GosCirculars` | Unified file directory, Government Orders (GOs), circulars library, multi-file upload | `lib/documentActions`, `shared/lib/filePreviewUrls` |
| `quality-control` | `QualityControl`, `QualityControlHub` | Statutory sampling quotas, target vs. achievement progress tracking, lab dispatch tracking | shared components |
| `contacts` | `OfficerContacts`, `OfficerContactsAdmin` | Hierarchical department contacts directory (mandal, division, district) with admin CRUD | `data/aeoDistricts`, `shared/data/telanganaDistrictMandalData` |
| `schemes` | `SubsidyTracking`, `FarmMechanization` | NFSM & State Seed Cell subsidy tracking, beneficiary distribution lists, farm machinery registry | Supabase tables |
| `settings` | `Settings` | User preferences, theme, local caching options | shared contexts |

## Public (unauthenticated) routes

Defined in `app/router/paths.ts` (`PUBLIC_PAGES` / `PUBLIC_AUTH_ROUTES` / `PUBLIC_VIEW_PAGES`):

- **Login** page (`/login`)
- **Dealer Stock Portal** (`/dealer-stock-portal`) — input dealers sign in within the portal UI
- **Officer-toolkit public views** — read-only statutory reference pages wrapped in `PublicReadOnlyShell`

## Shared layer (`src/shared/`)

Everything reusable and feature-agnostic. Dependency direction: `features → shared`, never the reverse.

- `context/` — `AuthContext` (session, inactivity timeout), `LanguageContext` (EN/TE + `t()`), `ThemeContext`
- `lib/` — `supabase` client + helpers, `fileTypes`/`uploadFile`/`filePreviewUrls`, `excelParser`, `offlineCache`/`pwaRecovery`/`networkStatus`, `pdfText`/`pdfWatermark`, `pdfUnicodeFonts`, `siteHits`, `appVersion`
- `components/` — `ui/` (headers, cards, toasts, modals, viewers), `pdf/` (merge/split/compress/convert tools), `preview/` (docx/xlsx/pptx), `seo/`, `charts/`, `ErrorBoundary`, `PopupHint`, `UpdateBanner`
- `hooks/`, `utils/`, `services/`, `data/`, `types/`, `styles/`
