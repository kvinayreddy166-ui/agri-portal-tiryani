# Refactoring Log

Feature-based reorganization of `project/src`, executed in reversible git-checkpointed phases. No UI, styling, business logic, schema, or data changes. `main` history:

| Commit | Phase | Scope |
|--------|-------|-------|
| `585eba61` | 1 | Consolidate loose root files into `assets/`; ignore `.supabase-home/` |
| `ba51a06d` | 2 | `src/` → `app/` + `shared/` layers (152 files) |
| `75a8adb1` | 3a | `officers-toolkit` feature |
| `f42a6e10` | 3b | `statutory-forms` feature |
| `bd533caa` | 3c | `crop-doctor` + `crop-management` |
| `2cfb2dcc` | 3d | `dealer-stock` + `farmer-database` + `dashboard` |
| `18a70861` | 3e | `auth`, `tour-diary`, `documents`, `quality-control`, `contacts`, `settings`, `schemes`, `calculators`, shared data |
| `a5fea0fd` | 4 | Extract router from `App.tsx` → `app/router/` |
| `ba4d1e31` | 5 | Delete approved unused files; convert `.jsx`/`.js` → `.tsx`/`.ts` |

## Phase 1 — root consolidation

- `project/{json,database,sql}/*`, `mao_contacts.csv`, `images/crop-image-references.json` → `project/assets/data/`
- `TOUR DAIRY FORMAT.xlsx`, `crop-doctor-*.png` → `project/assets/reference/`
- `scripts/import-mao-contacts.js`, `generate_crop_intelligence_assets.mjs` paths updated
- `.supabase-home/` untracked + `.gitignore`d; `vite-dev.log` deleted
- Verified: typecheck ✅

## Phase 2 — `app/` + `shared/`

- `App.tsx`, `main.tsx`, `index.css`, `Layout.tsx` → `app/`; `index.html` entry path updated
- `context/` → `shared/context/`; `hooks/` → `shared/hooks/`; `utils/` → `shared/utils/`; `types/` → `shared/types/`; `styles/` → `shared/styles/`; `services/translationService` → `shared/services/`
- `components/{ui,pdf,preview,seo,charts}` + `ErrorBoundary`, `PopupHint`, `UpdateBanner` → `shared/components/`
- Core `lib/` files → `shared/lib/`; feature-bound `lib/` files stayed for Phase 3
- Rewrote imports in 83 files via `scripts/refactor-move.mjs`; fixed one CSS `@import`
- Verified: typecheck ✅, build ✅ (3503 modules)

## Phase 3 — feature moves

All `pages/*`, `components/*`, `data/*`, feature `lib/*`, `services/*` relocated into `features/<module>/{pages,components,lib,services,data}/`. Batches a–e, each committed after typecheck. Final: build ✅ (3503 modules).

## Phase 4 — router extraction

`App.tsx` ~1195 → ~255 lines. Extracted:

- `app/router/paths.ts` — `PAGE_PATHS`, `PUBLIC_PAGES`/`PUBLIC_AUTH_ROUTES`/`PUBLIC_VIEW_PAGES`, route↔page resolution, back fallbacks
- `app/router/lazyPages.ts` — 48 `lazy()` imports
- `app/router/loading.tsx` — `GlobalAppLoader`, `PageLoader`, `LazyLoadBoundary` (stale-chunk recovery), `SafeSuspense`, `PublicReadOnlyShell`, `AppVersionBadge`
- `app/router/navigation.ts` — scroll restoration, boot readiness, history helpers
- `app/router/PageSwitch.tsx` — public + authenticated dispatch

Bug caught: unconditional `<PublicPageSwitch/>` element is always truthy → fixed with `PUBLIC_PAGES` gate so unauthenticated users reach `Login`.

Verified: typecheck ✅, build ✅ (3508 modules).

## Phase 5 — cleanup + JS→TS

- Deleted 7 approved unused files (see `FILE_INVENTORY.md`)
- Converted 5 `.jsx`/`.js` → `.tsx`/`.ts` under strict mode; removed 3 `.d.ts` shims
- Codemod `scripts/ts-annotate.mjs` auto-inserted ~335 `: any` annotations from `tsc` output; hand-fixed `useState`/`useRef` generics, `Record` index signatures, `catch` unknown narrowing
- Removed dead code inside `SeedForms.tsx` (`fetchMandalsForDivision`, `download`, `isDuplicateSeedGeneration`, `DuplicateDownloadModal` + stale imports)
- Verified: typecheck ✅ (0 errors), build ✅ (3508 modules)

## Validation history

| Gate | Result |
|------|--------|
| `npm run typecheck` | ✅ after every phase |
| `npm run build` | ✅ after each phase (3503 → 3508 modules) |
| `npm run lint` | not run — no lint script wired into CI |
| Tests | none exist in the project |
| `npx supabase migration list` | remote matches root `supabase/` tree exactly |

## Post-log cleanup

- `project/supabase/` (61 stale migrations + empty `functions/`) **removed** — canonical tree is repo-root `supabase/migrations` (remote-verified). Generator scripts redirected to `assets/data/` so the tree won't regenerate. The 12 never-deployed migrations (officer contacts, `20260901145651_tour_diary`, `20260923000000_update_test_user_password`) remain recoverable from git history.

## Known caveats
- `typecheck`/`build` OOM on this machine at default heap — run with `NODE_OPTIONS=--max-old-space-size=6144` if needed (see README).
- Build warnings only: outdated Browserslist db, `eval` in bluebird, chunks >650 kB.
- No `.jsx`/`.js` source files remain; no path aliases (relative imports).
