# File Inventory

Disposition of notable files after the refactor. Legend: **KEEP** in place · **MOVED** (new path noted) · **REMOVED** (deleted with approval) · **REVIEW** (needs decision).

## Removed (approved, Phase 5)

| File | Why |
|------|-----|
| `src/components/CropCards.jsx` | Unreferenced — superseded by `features/crop-doctor/pages/CropAdminDashboard` |
| `src/components/DiseaseCards.jsx` | Unreferenced — same |
| `src/components/FertilizerTable.jsx` | Unreferenced — same |
| `src/components/PestCards.jsx` | Unreferenced — same |
| `src/pages/DealerHistory.tsx` | Unreferenced page, no route |
| `src/pages/DealerStockTracking.tsx` | Unreferenced page, no route |
| `src/data/essentialCommoditiesActData.ts` | 331-line act data, no imports |
| `src/features/crop-doctor/pages/CropAdminDashboard.d.ts` | Shim — file converted to `.tsx` |
| `src/features/statutory-forms/pages/SeedForms.d.ts` | Shim — file converted to `.tsx` |
| `src/shared/types/jsx-modules.d.ts` | `*.jsx` module shim — no `.jsx` files remain |
| `vite-dev.log` | Dev log junk |

## Dead code removed inside `SeedForms.tsx`

Not executed and unreferenced: `fetchMandalsForDivision`, `download` (duplicate of `completeGenerate`), `isDuplicateSeedGeneration`, `DuplicateDownloadModal` (referenced undefined `DUPLICATE_WARNING_MESSAGE`), unused imports (`supabase`, `getDivisionsForDistrict`, `getAssistantDirectorLocationError`), unused `isMandalAO`/`showReset`/`kind`.

## Renamed `.js/.jsx` → `.ts/.tsx` (Phase 5)

| Old | New |
|-----|-----|
| `shared/hooks/useCropData.js` | `useCropData.ts` |
| `features/crop-management/services/cropService.js` | `cropService.ts` |
| `features/statutory-forms/pages/SeedForms.jsx` | `SeedForms.tsx` |
| `features/crop-doctor/pages/CropAdminDashboard.jsx` | `CropAdminDashboard.tsx` |
| `features/crop-doctor/pages/CropIntelligencePage.jsx` | `CropIntelligencePage.tsx` |

## REVIEW — outstanding items

| Path | Status | Note |
|------|--------|------|
| `project/supabase/` | **REMOVED** | Stale divergent tree (61 migrations + empty functions/) deleted — canonical is repo-root `supabase/migrations` (remote-verified). Recoverable from git history |
| `handbook.txt` (root) | KEEP | 252 KB reference doc, not imported by code |
| `project/assets/data/crop_intelligence_database*.sql` | KEEP | Two SQL dumps (slightly different image paths) kept intentionally |
| `project/dist/` | generated | Build output, gitignored |
| `project/android/` | KEEP | Capacitor wrapper |

## Oversized files (future split candidates — not touched)

`features/tour-diary/pages/TourDiary.tsx` (~177 KB), `statutory-forms/components/FertilizerStatutoryPdfTool.tsx` (~120 KB), `officers-toolkit/data/fcoClauses.ts` (~116 KB), `calculators/pages/FertilizerCalculator.tsx` (~116 KB), `officers-toolkit/components/ShowCauseNoticeEntry.tsx` (~83 KB), `auth/pages/Login.tsx` (~67 KB).

## Directory map

See `PROJECT_STRUCTURE.md` for the complete tree. Every `.tsx` under `features/*/pages/` is routed through `app/router/lazyPages.ts`.
