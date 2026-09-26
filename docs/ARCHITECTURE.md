# Architecture

## Overview

AGRONIX is a **static single-page application** (React 18 + TypeScript + Vite) deployed to **Vercel**, with **Supabase** providing all backend services. There is no Node server and no separate backend tier — Supabase Edge Functions (Deno) are the backend.

```
Browser (Vite SPA on Vercel / Capacitor Android)
  │
  ├── Supabase Auth (email/password, custom dealer RPCs)
  ├── Supabase Postgres 17 (tables + RLS + RPC functions)
  ├── Supabase Storage (uploads, knowledge-documents buckets)
  ├── Supabase Edge Functions (Deno) ──► Ollama server (RAG)
  └── Public APIs: OpenWeather / Open-Meteo, Google Maps embed
```

## Frontend layers

```
app/main.tsx
  └── app/App.tsx                    providers (Auth/Theme/Language/Helmet) + Router
        └── app/router/              path mapping, lazy imports, page dispatch,
            │                        loaders, scroll restore, boot readiness
            └── app/Layout.tsx       navigation shell, menu, breadcrumbs
                  └── features/*/pages/*    routed screens
                        ├── features/*/components/*
                        ├── features/*/lib|services|data/*
                        └── shared/**         cross-cutting infra
```

- **Routing** is a page-key state machine, not route components: `paths.ts` maps URL ↔ page key, `PageSwitch.tsx` renders the active page. Public pages (login, dealer portal, officer-toolkit public views) render without auth; everything else requires a session.
- **Lazy loading**: every page is `React.lazy()` in `lazyPages.ts`; `LazyLoadBoundary` recovers from stale-chunk errors after deploys by clearing caches/service workers and reloading.
- **State**: React Context only — `AuthContext`, `LanguageContext` (EN/TE), `ThemeContext` (dark mode). No Redux/Zustand.
- **Offline/PWA**: `service-worker.js` + `shared/lib/offlineCache.ts`, `pwaRecovery.ts`, `networkStatus.ts` — offline screen, cached fallbacks, update banner.

## Backend (Supabase)

- **Auth**: email/password via Supabase Auth. Admin = `isAdmin(email)` check (`shared/lib/supabase.ts`). Dealer accounts use custom RPC flows (`features/auth/lib/dealerAuth.ts`, `provisionDealerLogins.ts`) with `dealer` role in `user_metadata`.
- **Database**: Postgres with RLS policies defined in `supabase/migrations/` (canonical tree at repo root). The client is untyped `createClient` — `shared/types/database.ts` documents shapes informally.
- **Storage**: `uploads` bucket for documents/images; `knowledge-documents` (private, signed URLs) for the RAG module.
- **Edge Functions** (Deno, in `supabase/functions/`):
  - `knowledge-process` — extract text (raw PDF parser / mammoth), clean, semantic-chunk, embed via Ollama, save chunks
  - `knowledge-search` — hybrid vector (`knowledge_vector_search` RPC) + FTS (`knowledge_keyword_search` RPC)
  - `knowledge-ask` — retrieval → no-answer detection → LLM with `[SOURCE_N]` context → citations
  - `sync-urea-dashboard-reports` — scheduled urea data sync
  - Ollama runs on an external VPS; keys/config only exist server-side as Supabase secrets (`OLLAMA_*`, `SUPABASE_SERVICE_ROLE_KEY`). No AI secrets reach the browser.

## Data flow

- Feature pages call Supabase directly through `shared/lib/supabase.ts` or feature services (`features/*/services|lib`).
- Heavy client-side work (PDF generation with jsPDF/docx, Excel parsing with xlsx, TF.js crop-disease inference) happens in the browser — no server processing.
- Crop intelligence has a **three-tier fallback**: `crop_intelligence`/`crops` tables → `/data/crop-intelligence.json` static dataset → localStorage cache (`cropService.ts`).

## Build & deploy

- `npm run build` → `scripts/build-vite.mjs` (bumped heap) → `vite build` → `project/dist`
- Vercel: install `cd project && npm ci`, build `cd project && npm run build`, output `project/dist`; SPA rewrites in `vercel.json`.
- Capacitor wraps the same `dist` for Android (`project/android/`).
- CI (`.github/workflows/ci.yml`): `npm ci` → `npm run typecheck` → `npm run build`. No test suite exists.

## Constraints & notes

- Strict TypeScript (`strict: true`), no path aliases, no tests, no linter wired into CI.
- Supabase client has embedded **fallback credentials** (anon key only — safe by design but the URL is fixed).
- `project/supabase/migrations/` is a stale divergent copy — see `REFACTORING_LOG.md`.
