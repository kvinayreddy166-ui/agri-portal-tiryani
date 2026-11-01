# Water & Irrigation Requirement Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, bilingual (Telugu & English) Water & Irrigation Requirement Calculator for agricultural officers and farmers to compute daily pump run hours, discharge rates, and water volume for both Drip and Sprinkler irrigation systems.

**Architecture:** A pure TypeScript calculation engine (`irrigationEngine.ts`) with unit tests (`irrigationEngine.test.ts`), paired with a responsive UI component (`IrrigationCalculator.tsx`) adhering to the AGRONIX design system (unified title card, compact language toggle, Telangana crop presets, WhatsApp advisory sharing, and PDF export). Integrated into the Farm Calculators suite and application router.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide icons, Vitest.

**Spec:** User requirements for Drip (crop, area, row-to-row, plant-to-plant, emitter spacing, emitter discharge, crop water requirement) and Sprinkler (crop, area, sprinkler spacing, nozzle discharge, number of sprinklers, crop water depth/requirement).

## Global Constraints

- Must work offline with client-side mathematics (zero external API calls).
- Bilingual: Full support for English and Telugu (`t(...)` localization).
- Compact title card with language toggle in the upper right corner matching established Officer Toolkit design.
- Zero disturbance to existing modules; all vitest tests and TypeScript typechecks must pass cleanly.

## Review Focus

1. **Zero and Negative inputs**: Division by zero in spacing, emitter discharge, or zero emitters must return clean error states without crashing or returning `Infinity` / `NaN`.
2. **Unit Conversion Accuracy**: Row spacing in cm/m/feet, emitter discharge in LPH, sprinkler spacing in meters, area in Acres/Guntas/Hectares must convert accurately.
3. **Format of Output Time**: Pump run hours must be presented both as decimal hours (e.g. `2.25 hrs`) and human-readable time (e.g. `2 hrs 15 mins`).
4. **Preset Integrity**: Switching between Drip presets (Cotton, Chilli, Maize, Vegetables, Orchard) and Sprinkler presets (Groundnut, Maize, Pulses, Wheat) must populate standard agronomic defaults instantly without stale state.
5. **Mobile Responsiveness**: Sliders and input fields must be tap-friendly on mobile screens without horizontal scroll.

---

### Task 1: Irrigation Engine & Unit Tests

**Files:**
- Create: `project/src/features/calculators/engine/irrigationEngine.ts`
- Create: `project/src/features/calculators/engine/irrigationEngine.test.ts`

- [ ] **Step 1: Write failing unit tests for Drip and Sprinkler calculations**
  Define tests covering:
  - Acre to m² conversions.
  - Drip lateral length, emitter count, system discharge, daily water requirement, and pump run hours.
  - Sprinkler application rate (mm/hr), run hours per shift, number of shifts, and total water volume.
  - Boundary cases: zero area, zero discharge, invalid spacing.

- [ ] **Step 2: Run test suite to verify failures**
  Run `npx vitest run src/features/calculators/engine/irrigationEngine.test.ts`.

- [ ] **Step 3: Implement `irrigationEngine.ts`**
  Implement:
  - Types (`DripIrrigationInput`, `DripIrrigationResult`, `SprinklerIrrigationInput`, `SprinklerIrrigationResult`, `IrrigationPreset`).
  - Unit conversion helpers (acres, guntas, hectares to m²; feet/inches/cm to meters).
  - `calculateDripIrrigation(...)` function.
  - `calculateSprinklerIrrigation(...)` function.
  - Standard Telangana agronomic presets:
    - Drip: Bt Cotton (90×60cm, 2 LPH), Chilli (60×45cm, 2 LPH), Maize (60×20cm, 2 LPH), Tomato/Vegetables (60×45cm, 2 LPH), Orchard (Fruit Trees 5×5m, 4 LPH online).
    - Sprinkler: Groundnut (12×12m, 1800 LPH, 25mm), Maize (12×12m, 1800 LPH, 30mm), Pulses/Bengal Gram (12×12m, 1500 LPH, 25mm), Wheat (12×12m, 1800 LPH, 30mm).

- [ ] **Step 4: Run tests and verify all pass**
  Run `npx vitest run src/features/calculators/engine/irrigationEngine.test.ts`.

---

### Task 2: Irrigation Calculator UI Component

**Files:**
- Create: `project/src/features/calculators/pages/IrrigationCalculator.tsx`

- [ ] **Step 1: Build the UI skeleton**
  - Mode switcher tabs: `💧 Drip Irrigation` / `💦 Sprinkler Irrigation`.
  - Title card with compact LanguageToggle in the upper right corner (matching the newly standardized layout).
  - Crop & Spacing preset pills (using responsive gapless grid).
  - Dynamic Form Inputs for active mode (Area, Spacings, Discharges, Water needs).
  - Live calculation cards:
    - Primary Big Stat: **Required Pump Run Hours** (e.g. `2 hrs 15 mins / day` or `3 hrs / shift`).
    - Secondary Stats: Total Emitters / Sprinklers, System Discharge (m³/hr & LPH), Total Water Volume (Litres), Application Rate (mm/hr).
    - Practical Field Advisory tips (e.g., operating pressure, filter cleaning, shift scheduling).
  - 1-Click WhatsApp Advisory generator with Telugu/English text.
  - Print / Export friendly view.

- [ ] **Step 2: Verify typecheck on the component**
  Run `npm run typecheck`.

---

### Task 3: Router & Application Integration

**Files:**
- Modify: `project/src/app/router/paths.ts`
- Modify: `project/src/app/router/lazyPages.ts`
- Modify: `project/src/app/router/PageSwitch.tsx`
- Modify: `project/src/app/Layout.tsx`
- Modify: `project/src/features/calculators/pages/FarmCalculators.tsx`
- Modify: `project/src/shared/components/seo/SEO.tsx`

- [ ] **Step 1: Register route in `paths.ts`**
  Add `'irrigation-calculator'` to valid pages, path mappings (`/officer-toolkit/irrigation-calculator`), and fallback.

- [ ] **Step 2: Add lazy import in `lazyPages.ts` and case in `PageSwitch.tsx`**
  Wire `IrrigationCalculator` component into router.

- [ ] **Step 3: Add breadcrumbs in `Layout.tsx` & SEO metadata in `SEO.tsx`**
  Register page title: *Water & Irrigation Calculator* / *నీటి పారుదల కాలిక్యులేటర్*.

- [ ] **Step 4: Add card to Farm Calculators Hub (`FarmCalculators.tsx`)**
  Add an interactive card with `Droplets` icon, cyan/blue theme, and localized description in `calculatorItems`.

---

### Task 4: Verification & Polish

**Files:**
- Review: all modified and created files.

- [ ] **Step 1: Run full TypeScript check**
  `cd project && npm run typecheck`.

- [ ] **Step 2: Run all Vitest test suites**
  `cd project && npx vitest run`.

- [ ] **Step 3: Verify browser functionality on local dev server**
  Verify page loading at `http://localhost:5173/officer-toolkit/irrigation-calculator` and navigation from `FarmCalculators`.
