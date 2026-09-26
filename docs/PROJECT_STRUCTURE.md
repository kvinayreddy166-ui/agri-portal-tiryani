# Project Structure

AGRONIX / Tiryani AgriPortal — repository layout after the 2026 refactor.

## Repository root

```
agri-portal-tiryani/
├── supabase/                  # CANONICAL Supabase project (linked: agri-portal-tiryani)
│   ├── migrations/            # SQL migrations applied to remote (verified via `supabase migration list`)
│   ├── functions/             # Edge Functions (Deno)
│   │   ├── _shared/           #   shared helpers (knowledge.ts)
│   │   ├── knowledge-process/ #   RAG ingestion: extract → clean → chunk → embed
│   │   ├── knowledge-search/  #   hybrid vector + FTS search
│   │   ├── knowledge-ask/     #   RAG pipeline with citations
│   │   └── sync-urea-dashboard-reports/
│   └── config.toml
├── project/                   # The Vite SPA (all application code lives here)
├── .github/workflows/ci.yml   # CI: npm ci → typecheck → build (from project/)
├── vercel.json                # SPA rewrites + cache headers
├── package.json               # Root deps for scripts (supabase-js, xlsx)
├── AGENTS.md                  # Knowledge Base module docs
├── README.md
├── PROJECT_STRUCTURE.md       # this file
├── ARCHITECTURE.md
├── MODULES.md
├── FILE_INVENTORY.md
├── REFACTORING_LOG.md
└── handbook.txt               # Reference document (not used by code)
```

## `project/` — application package

```
project/
├── index.html                 # Vite entry (loads /src/app/main.tsx)
├── package.json               # app deps + scripts (dev/build/typecheck)
├── vite.config.js · tailwind.config.js · postcss.config.js
├── tsconfig.json · tsconfig.app.json · tsconfig.node.json   # strict TS
├── capacitor.config.ts        # Android wrapper config
├── vercel.json
├── android/                   # Capacitor Android project
├── dist/                      # build output (generated)
├── public/                    # static assets (icons, fonts, forms, images,
│                              #   data/, service-worker.js, manifest, sitemap)
├── assets/
│   ├── data/                  # crop-intelligence JSON/SQL datasets, mao_contacts.csv
│   └── reference/             # Tour Diary format .xlsx, crop-doctor screenshots
├── scripts/                   # Node utilities: data importers, icon generators,
│                              #   refactor codemods (refactor-move, move-batch, ts-annotate)
└── src/                       # application source (see below)
```

## `project/src/` — source layout

```
src/
├── app/                       # application shell
│   ├── main.tsx               #   entry point
│   ├── App.tsx                #   providers + auth gate + navigation state
│   ├── Layout.tsx             #   sidebar/menu shell, page chrome
│   ├── index.css              #   Tailwind + global styles
│   └── router/                #   extracted routing layer (Phase 4)
│       ├── paths.ts           #     route↔page maps, public routes, back fallbacks
│       ├── lazyPages.ts       #     all lazy() page imports
│       ├── PageSwitch.tsx     #     public + authenticated page dispatch
│       ├── loading.tsx        #     loaders, lazy error boundary, version badge
│       └── navigation.ts      #     scroll restore, boot readiness, URL helpers
│
├── features/                  # business modules (pages + components + lib + data)
│   ├── auth/                  #   Login page, dealer auth/provisioning RPCs
│   ├── dashboard/             #   Dashboard, Analytics, weather/map widgets
│   ├── officers-toolkit/      #   Inspections & Notices, Acts & Orders,
│   │                          #   Show-Cause/Memo generator, FCO legal data,
│   │                          #   3 dealer-inspection flows, inspection helpers
│   ├── statutory-forms/       #   Seed Forms II/V/VI/I/VIII, License Services,
│   │                          #   covering-letter modals, statutory PDF tools
│   ├── crop-doctor/           #   disease-detection tool, crop intelligence
│   │                          #   pages, admin dashboard, advisory PDFs
│   ├── crop-management/       #   CropManagement, CropPage, cropService
│   ├── dealer-stock/          #   dealer portal, stock inventory/receipts/
│   │                          #   analytics/management + stock libs
│   ├── farmer-database/       #   FarmerDatabase, ExcelUploads, farmerImport
│   ├── tour-diary/            #   TourDiary + diary storage/PDF libs
│   ├── documents/             #   FileDirectory, GOs & Circulars, doc actions
│   ├── quality-control/       #   QualityControl + QC Hub
│   ├── contacts/              #   OfficerContacts + admin + AEO district data
│   ├── calculators/           #   6 calculator pages + fertilizer engine
│   ├── schemes/               #   SubsidyTracking (NFSM/seed cell), FarmMechanization
│   ├── settings/              #   Settings
│   └── knowledge-base/        #   RAG module (see AGENTS.md)
│
└── shared/                    # cross-feature infrastructure
    ├── components/            #   ui/ (23 components), pdf/ tools, preview/,
    │                          #   charts/, seo/, ErrorBoundary, PopupHint, UpdateBanner
    ├── context/               #   AuthContext, LanguageContext, ThemeContext
    ├── data/                  #   Telangana district/mandal data, ADA location helpers
    ├── hooks/                 #   useBackButtonOverlay, useCropData, useVirtualRows
    ├── lib/                   #   supabase client, fileTypes, uploadFile, excelParser,
    │                          #   offlineCache, pwaRecovery, networkStatus, pdfWatermark…
    ├── services/              #   translationService
    ├── styles/                #   design-system.css
    ├── types/                 #   database.ts
    └── utils/                 #   excelExport, docxHelpers, pdfHelpers, stockAnalytics…
```

## Conventions

- **Feature modules** own their pages, components, data and libs. Import between features is allowed but `shared/` is the dependency-free layer everything can use.
- **No path aliases** — imports are relative (`../../shared/...`).
- All source is TypeScript (`.ts`/`.tsx`); strict mode is on.
- Pages are lazy-loaded via `app/router/lazyPages.ts`; route keys live in `app/router/paths.ts`.
