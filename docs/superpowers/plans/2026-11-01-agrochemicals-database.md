# Agrochemicals Database Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a comprehensive, offline-first Agrochemicals Database module for Fertilizers, Insecticides, Fungicides, and Weedicides, featuring instant search, A–Z letter filtering, IRAC/FRAC/HRAC mode of action classifications, CIB-RC toxicity indicators, dosage, target pests/crops, waiting periods, and WhatsApp advisory sharing.

**Architecture:** Pure TypeScript domain data and filtering engine (`agrochemicalService.ts`), backed by a curated offline-ready dataset of registered Indian agrochemicals with bilingual metadata. The UI is built using responsive interactive cards (`AgrochemicalCard.tsx`), a deep-dive detail modal (`AgrochemicalDetailModal.tsx`), and a full page (`AgrochemicalDatabase.tsx`) linked via the main navigation and Officer Toolkit.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide icons, Vitest, Vite.

**Spec:** User requirements for registered chemicals A–Z, IRAC group, FRAC code, HRAC group, Mode of Action, target crops/pests, dosage per acre/litre, waiting period, toxicity color bands, responsive cards, and dedicated module placement.

## Global Constraints
- **Offline-first**: Pure client-side dataset; zero mandatory server/cloud dependencies for lookup.
- **Bilingual**: Full English and Telugu (`t(...)`) localization across all names, chemical families, modes of action, and labels.
- **Design System**: Compact header with `LanguageToggle` in upper-right corner; clean cards with responsive layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
- **Safety**: Preserve all statutory guidelines (CIB-RC toxicity classifications, pre-harvest interval days, safe application advice).

## Review Focus
1. **Search across multiple fields**: Searching by brand name (e.g. "Coragen"), active ingredient (e.g. "Chlorantraniliprole"), target pest (e.g. "Stem borer"), or IRAC group (e.g. "Group 28") must all match accurately.
2. **A–Z Alphabet filter edge cases**: Clicking 'C' must filter items starting with 'C'; selecting 'All' or a category must keep alphabet filter responsive.
3. **Category tab switching**: Switching between All, Insecticides, Fungicides, Weedicides, and Fertilizers must correctly adjust counts and filter results without lag.
4. **Modal accessibility & body scroll**: Opening and closing the detail modal must manage focus, prevent backdrop scroll bleed, and render cleanly on mobile.
5. **WhatsApp advisory formatting**: Exporting to WhatsApp must produce clean, readable markdown with emoji bullets and bilingual labels.

---

### Task 1: Agrochemicals Types & Service Engine with Unit Tests

**Files:**
- Create: `project/src/features/agrochemicals/types/index.ts`
- Create: `project/src/features/agrochemicals/data/agrochemicalsData.ts`
- Create: `project/src/features/agrochemicals/services/agrochemicalService.ts`
- Create: `project/src/features/agrochemicals/services/agrochemicalService.test.ts`

**Steps:**
- [ ] Define `AgrochemicalItem`, `AgrochemicalCategory`, `ToxicityBand`, and filter types in `types/index.ts`.
- [ ] Create curated dataset in `data/agrochemicalsData.ts` containing:
  - 25+ Insecticides (with IRAC MoA groups e.g. 1B, 2B, 3A, 4A, 4C, 5, 6, 9D, 12A, 15, 22A, 23, 28)
  - 18+ Fungicides (with FRAC codes e.g. 1, 3, 4, 11, 26, 40, M01, M02, M03)
  - 15+ Weedicides / Herbicides (with HRAC groups e.g. 1/A, 2/B, 3/K1, 4/O, 9/G, 10/H, 14/E, 15/K3, 27/F2)
  - 15+ Fertilizers & Nutrients (Straight N/P/K, NP/NPK complexes, 100% water-soluble grades, micronutrients, FCO ratios).
- [ ] Implement search, filter, and sorting utilities in `agrochemicalService.ts`.
- [ ] Write unit tests in `agrochemicalService.test.ts` verifying:
  - Search by common name, trade brand, target pest, crop, and IRAC/FRAC group.
  - Category filtering and count calculation.
  - Alphabetical sorting and initial letter filtering.
  - WhatsApp share text generation.
- [ ] Run vitest: `cd project; npx vitest run src/features/agrochemicals/services/agrochemicalService.test.ts`.

---

### Task 2: Interactive Components (Card, Badge & Modal)

**Files:**
- Create: `project/src/features/agrochemicals/components/ToxicityBadge.tsx`
- Create: `project/src/features/agrochemicals/components/AgrochemicalCard.tsx`
- Create: `project/src/features/agrochemicals/components/AgrochemicalDetailModal.tsx`

**Steps:**
- [ ] Build `ToxicityBadge.tsx` displaying the standard CIB-RC diamond/triangle toxicity classification (Red: Extremely Toxic, Yellow: Highly Toxic, Blue: Moderately Toxic, Green: Slightly Toxic).
- [ ] Build `AgrochemicalCard.tsx`:
  - Category pill (Insecticide / Fungicide / Weedicide / Fertilizer) with color accents.
  - Chemical name & Telugu translation.
  - Popular trade brands chips.
  - IRAC / FRAC / HRAC resistance group tag.
  - Key metrics: Dosage per acre, Target crops, Pre-Harvest Interval (PHI).
  - Hover effects, accessibility attributes, and click-to-open callback.
- [ ] Build `AgrochemicalDetailModal.tsx`:
  - Header with chemical name, category, and toxicity badge.
  - Tabbed or structured sections:
    - Overview & Formulations (Chemical family, formulations EC/SC/WG, trade names).
    - Agronomic Advisory (Target crops, controlled pests/diseases, dosage per acre and per 15L backpack pump).
    - Resistance Management & Mode of Action (IRAC/FRAC/HRAC Group, biological target site, action mechanism).
    - Safety, Waiting Period & Antidote (PHI days, first aid, toxicity band, FCO specification if fertilizer).
  - Actions: 1-click WhatsApp advisory share and close button.

---

### Task 3: Main Page Implementation (`AgrochemicalDatabase.tsx`)

**Files:**
- Create: `project/src/features/agrochemicals/pages/AgrochemicalDatabase.tsx`

**Steps:**
- [ ] Build the header card using `CompactToolkitHeader` for admin/officer view and hero gradient card for public view, with `LanguageToggle` in the upper right.
- [ ] Implement search bar with clear button and live result counter.
- [ ] Implement category filter pills with live counts (All, Insecticides, Fungicides, Weedicides, Fertilizers).
- [ ] Implement A–Z quick alphabet selector bar with active highlights.
- [ ] Render responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`).
- [ ] Add empty state view when no chemical matches search query, with "Reset filters" button.
- [ ] Wire up detail modal on card click.

---

### Task 4: Navigation, Routing & SEO Integration

**Files:**
- Modify: `project/src/app/router/paths.ts`
- Modify: `project/src/app/router/lazyPages.ts`
- Modify: `project/src/app/router/PageSwitch.tsx`
- Modify: `project/src/app/Layout.tsx`
- Modify: `project/src/features/officers-toolkit/pages/OfficersToolkit.tsx`
- Modify: `project/src/shared/components/seo/SEO.tsx`

**Steps:**
- [ ] In `paths.ts`:
  - Add `'agrochemicals'` and `'officer-toolkit/agrochemicals'` to `PUBLIC_AUTH_ROUTES`, `PUBLIC_PAGES`, `PAGE_PATHS`, `VALID_PAGES`, `OFFICER_TOOLKIT_SUBPAGES`.
  - Add back fallback routes.
- [ ] In `lazyPages.ts`: export lazy `AgrochemicalDatabase`.
- [ ] In `PageSwitch.tsx`: register cases in `PageSwitch` and `PublicPageSwitch`.
- [ ] In `Layout.tsx`:
  - Add **Agrochemicals** to `menuItems` (with `FlaskConical` icon) under Field Operations / Knowledge.
  - Add breadcrumbs and page title in `getPageMeta`.
- [ ] In `OfficersToolkit.tsx`:
  - Add **Agrochemicals Database** tool card linking to `/agrochemicals`.
- [ ] In `SEO.tsx`: Add SEO title and description.

---

### Task 5: End-to-End Verification

**Steps:**
- [ ] Run `npm run typecheck` to verify zero TypeScript errors.
- [ ] Run full Vitest suite: `npx vitest run`.
- [ ] Run `npm run build` to verify bundling and asset chunking.
- [ ] Verify hot module reloading and responsive layout in browser.
