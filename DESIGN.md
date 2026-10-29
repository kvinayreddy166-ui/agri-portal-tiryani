# AGRONIX Design System (DESIGN.md)

<!-- impeccable:design-schema 1 -->

## Core Philosophy: Modern GovTech Enterprise

AGRONIX is an enterprise agricultural operations platform. It adheres to **Operate Mode**: the tool disappears into the task. It avoids decorative fluff, oversized components, and cartoonish illustrations, providing:
1. **Earned Familiarity:** Instant usability for officers in the field and staff in offices.
2. **Adaptive Density:** Compact scan-friendly grids & tables on desktop (1100px–1280px containers) and comfortable thumb-driven touch targets on mobile.
3. **Statutory Integrity:** Legal notices, sample memos, and orders are clean, authoritative, and unambiguously legible.
4. **Bilingual Parity:** English and Telugu typography balance weight and baseline seamlessly without text truncation.

---

## Color Strategy: Restrained Agricultural GovTech

### Primary Brand
- **Emerald Deep (Primary Action & Brand):** `#166534` (Tailwind `emerald-800`), `#15803d` (`emerald-700`)
- **Emerald Forest (Header & Primary Surfaces):** `#052e16` (`emerald-950`), `#14532d` (`emerald-900`)
- **Emerald Mist (Active States & Badges):** `#f0fdf4` (`emerald-50`), `#dcfce7` (`emerald-100`)

### Brand Accent
- **Harvest Gold (Official Seals & Highlights):** `#d89b18` (`gold-500`), `#b77f14` (`gold-600`), `#fbf6e9` (`gold-50`)

### Neutral Scales
- **Surface Canvas:** Light `#f2f7f3` / Dark `#030712` (Slate-950)
- **Card Background:** Light `#ffffff` / Dark `#0f172a` (Slate-900)
- **Borders:** Light `rgba(15, 23, 42, 0.08)` / Dark `rgba(255, 255, 255, 0.08)`
- **Dividers:** Light `rgba(15, 23, 42, 0.06)` / Dark `rgba(255, 255, 255, 0.06)`

### Semantic Status
- **Success:** `#16a34a` (Emerald-600) / Soft: `#dcfce7`
- **Warning:** `#d97706` (Amber-600) / Soft: `#fef3c7`
- **Danger (Seizure / Revocation / Errors):** `#dc2626` (Red-600) / Soft: `#fee2e2`
- **Info / Neutral Accent:** `#2563eb` (Blue-600) / Soft: `#dbeafe`

---

## Typography System

- **Primary UI / Data Face:** `Inter`, `Noto Sans Telugu`, `system-ui`, sans-serif
- **Official Brand Display:** `Atkinson Hyperlegible Next`, `Inter`
- **Type Scale Ratio:** 1.125–1.2 (Tight enterprise ratio)
  - `xs`: 0.75rem (12px) — Badges, secondary metadata, helper text
  - `sm`: 0.875rem (14px) — Table cells, standard form inputs, list items
  - `base`: 1.0rem (16px) — Card titles, primary navigation labels, modal headers
  - `lg`: 1.125rem (18px) — Section headings, summary stat values
  - `xl`: 1.25rem (20px) — Major module titles
  - `2xl`: 1.5rem (24px) — Hero dashboard titles

---

## Component Specifications

### 1. Cards & Containers
- **Desktop Maximum Width:** `1200px` (or `max-w-7xl` with `mx-auto`)
- **Card Radius:** `rounded-2xl` (16px) for major panels, `rounded-xl` (12px) for item cards
- **Elevation:** Subtle single-layer shadow: `shadow-sm` or `shadow-[0_2px_10px_rgba(15,23,42,0.06)]`
- **Card Header Divider:** Subtle 1px divider matching outer border tone

### 2. Form Controls & Inputs
- **Height:** 40px–44px (touch accessible)
- **Border:** 1px `border-slate-200` dark:`border-slate-800`
- **Focus State:** `focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600`
- **Labels:** 12px–13px font-bold `text-slate-700` dark:`text-slate-300`

### 3. Buttons & Actions
- **Primary:** `bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition active:scale-[0.98]`
- **Secondary:** `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50`
- **Danger (Stop Sale, Seizure):** `bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl`

### 4. Tables & Data Lists
- **Header:** `bg-slate-50 dark:bg-slate-900/80 text-[11px] font-black uppercase tracking-wider text-slate-500`
- **Row Padding:** `py-2.5 px-3.5` (compact scan-friendly density)
- **Row Hover:** `hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition-colors`

---

## Responsive Breakpoints & Ergonomics

- **Desktop (≥ 1024px):** Max container width 1100px–1280px; 2 or 3-column structured grids; sticky topbar with concise breadcrumbs.
- **Tablet (768px - 1023px):** 2-column adaptive flow, collapsible panels.
- **Mobile (< 768px):** Single-column stacked layout; touch-friendly 44px+ minimum tap heights; pull-drawer navigation; fixed actions safe above system gesture bar.
