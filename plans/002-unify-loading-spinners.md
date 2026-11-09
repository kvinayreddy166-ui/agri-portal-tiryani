# 002 — Unify loading spinner language

- **Commit at plan time:** `7b6a857`
- **Severity:** MEDIUM
- **Category:** Cohesion & tokens
- **Status:** DONE

## Problem

The app has two spinner visual languages running at different speeds:

1. **Shared `Spinner` component** — `project/src/shared/components/ui/Spinner.tsx`.
   SVG arc (track circle + round-cap dash arc), animated by `.animate-spinner`
   = `spinnerRotate 0.8s linear infinite` (`project/src/app/index.css:884-893`).
   Used by `GlobalAppLoader`, `PageLoader`, `ToolkitLoader`.

2. **Tailwind `animate-spin`** — 1s linear infinite. Used by `Loader2` icons in
   ~63 files (button submit spinners) and by ~20 ad-hoc border-ring spinners
   (`border-2 border-emerald-600 border-t-transparent`, `border-b-2`,
   `border-t-emerald-700` variants) scattered across feature pages.

3. A third ad-hoc style in `project/src/features/auth/pages/Login.tsx:133`
   (Suspense fallback) uses `border-2 border-emerald-600 border-t-transparent`.

Result: full-page loaders use the arc spinner at 0.8s while inline/button
spinners use rings at 1s — visibly different cadence and stroke style.

## Goal

One spinner feel across the app: same 0.8s rotation speed everywhere, and all
standalone loading indicators routed through the shared `Spinner` component
(or its exact SVG) instead of hand-rolled border rings.

## Steps

### 1. Normalize `animate-spin` duration to the shared token (index.css)

File: `project/src/app/index.css`

After the existing `.animate-spinner` block (around line 893), add:

```css
/* Keep Tailwind animate-spin (Loader2 icons, misc) in sync with .animate-spinner */
.animate-spin {
  animation-duration: 0.8s;
}
```

This makes every `Loader2 animate-spin` button spinner rotate at the same
0.8s cadence as the shared arc spinner — no per-file edits needed.

### 2. Replace ad-hoc border-ring spinners with the shared `Spinner`

For each occurrence below, replace the `<div className="... animate-spin ... border ..." />`
with:

```tsx
<Spinner size="<mapped>" className="text-emerald-600 dark:text-emerald-400" label="Loading" />
```

Size mapping: `h-6/h-8` → `size="md"` or `"lg"`; `h-10/h-12` → `size="xl"`;
`h-14` → `size="2xl"`. Preserve each site's surrounding layout classes
(flex centering wrappers stay).

Add the import where missing:
`import { Spinner } from '<relative path>/shared/components/ui/Spinner';`

Sites (verify each before editing — line numbers may drift):

- `project/src/features/auth/pages/Login.tsx:133` — Suspense fallback; the
  whole fallback div can become
  `<Spinner size="lg" className="text-emerald-600" label="Loading" />` inside
  the existing centered flex wrapper.
- `project/src/features/crop-doctor/pages/CropIntelligencePage.tsx:123`
- `project/src/features/crop-management/pages/CropPage.tsx:210`
- `project/src/features/dealer-stock/pages/StockInventory.tsx:513,521`
- `project/src/features/dealer-stock/pages/StockManagement.tsx:309,557`
- `project/src/features/dealer-stock/pages/StockReceiptsSales.tsx:272`
- `project/src/features/documents/pages/FileDirectory.tsx:262`
- `project/src/features/documents/pages/GosCirculars.tsx:231`
- `project/src/features/farmer-database/pages/ExcelUploads.tsx:324`
- `project/src/features/officers-toolkit/pages/InspectionEnforcementHub.tsx:26`
- `project/src/features/quality-control/pages/QualityControl.tsx:263`
- `project/src/features/sampling-hub/pages/FormsLibrary.tsx:519`
- `project/src/features/schemes/pages/FarmMechanization.tsx:134`
- `project/src/features/schemes/pages/SubsidyTracking.tsx:145`
- `project/src/features/settings/pages/Settings.tsx:382`
- `project/src/features/tour-diary/pages/TourDiary.tsx:1776`
- `project/src/shared/components/pdf/PdfPreview.tsx:188`
- `project/src/shared/components/preview/DocxPreview.tsx:111`

Sweep command to catch any missed sites:

```bash
grep -rn "animate-spin rounded-full\|rounded-full.*animate-spin" project/src --include="*.tsx"
```

Leave `Loader2 ... animate-spin` usages untouched — step 1 already unifies
their speed, and swapping ~63 icon spinners is out of scope.

### 3. Do NOT touch

- `Spinner.tsx` itself (already correct: `transform-box: fill-box`,
  `transform-origin: center`, linear rotation, reduced-motion slowdown).
- `animate-pulse`, `animate-ping`, skeleton styles (separate findings).
- `ToolkitLoader.tsx` — dead code, handled by a different plan/finding.

## Verification

1. `cd project && npm run typecheck` — clean.
2. `npm run build` — clean.
3. Visual check on `/login` (Suspense fallback is hard to trigger; check a
   lazy route like `/officer-toolkit/crop-doctor` with throttled network):
   the arc spinner should look identical in stroke style to inline spinners.
4. Open any form (e.g., Login → sign in) and confirm the `Loader2` button
   spinner now rotates at the same 0.8s cadence as page loaders.
5. Feel-check: open DevTools → Rendering → `prefers-reduced-motion: reduce`;
   `.animate-spin` inherits Tailwind's own behavior — acceptable since step 1
   only changes duration (reduced-motion coverage is finding 002's sibling).
