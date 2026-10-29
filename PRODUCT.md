# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Mandal Agriculture Officers (MAO), Agricultural Extension Officers (AEO), and field officers in Telangana State (specifically Tiryani Mandal and surrounding districts). Secondary authenticated users include licensed input dealers (Fertilizer, Seed, and Pesticides) accessing inventory compliance, memos, and notices. Tertiary public/farmer users access crop calculators, subsidy information, and field diagnosis advisories.

## Product Purpose

AGRONIX is an official agricultural operations and information management platform built to digitize field inspections, statutory enforcement, regulatory sample drawals (under FCO 1985, Seeds Act 1966, Insecticides Act 1968), dealer directory governance, farmer crop analytics, and departmental knowledge retrieval. It replaces slow manual paper registers with instant statutory PDF generation, verified audit trails, and data-driven command center dashboards.

## Positioning

Unlike generic ERPs or disconnected government spreadsheets, AGRONIX combines statutory compliance automation (legal sample memos, Form J/K/M, Form II/III/IV/VIII, Form XX/XXI, 6A memos, Stop Sale, and Seizure orders) with bilingual Telugu/English field workflows, offline-ready mobile PWA performance, and local AI-powered agricultural knowledge search.

## Operating Context

Used by agriculture officers under high-glare outdoor farm conditions, rural dealer inspection sites with intermittent connectivity, and desktop office environments. Activities include:
- On-site statutory dealer inspections and non-compliance notice issuance.
- Chemical & seed sample drawals requiring exact legal wording, seal numbers, and covering letters.
- Real-time fertilizer buffer and rake point monitoring.
- Village-level farmer crop profiling and acreage computation.

## Capabilities and Constraints

- **Stack:** Vite SPA with React 18, TypeScript, Tailwind CSS, Lucide icons, Supabase (Postgres 17, Auth, Storage, Edge Functions), Capacitor Android wrapper.
- **Languages:** Complete bilingual English and Telugu (`t(en, te)`) across all UI elements, labels, tooltips, and statutory document titles.
- **Accessibility:** WCAG AA compliance, minimum 4.5:1 text contrast on light/dark themes, accessible keyboard navigation and hardware back-button overlay support.
- **Layout Constraints:** Desktop screens constrained to 1100px–1280px scan-friendly containers; mobile views optimized for single-hand touch interaction (44px+ min touch targets).
- **Integrations:** Direct official communication channels (WhatsApp, YouTube, X/Twitter), Supabase vector RAG search, and internal PDF rendering engines.

## Brand Commitments

- **Name:** AGRONIX — Information Management System (తిర్యాని వ్యవసాయ పోర్టల్).
- **Color Palette:** Modern GovTech Enterprise — Deep agricultural emerald (`#065f46`, `#022c22`), Agronix harvest gold (`#f59e0b`, `#d97706`), crisp warm neutral cards (`#f8fafc`, `#ffffff`), and dark mode obsidian emerald (`#022c22`, `#0b1411`).
- **Tone & Voice:** Authoritative, clean, professional, legally precise, yet accessible to field officers and rural dealers.

## Evidence on Hand

- Verified statutory PDF generation templates in `project/src/features/sampling-hub/`.
- Live inspection order modules (Stop Sale, Seizure, Show Cause) in `project/src/features/officers-toolkit/`.
- Localized bilingual dictionary and UI translation bindings across all feature modules.
- Deployed and active Supabase schema with role-based policies (MAO Admin vs. Dealer Portal).

## Product Principles

1. **Statutory Accuracy First:** Every legal form, code, and notice must adhere strictly to statutory agricultural acts without visual ambiguity.
2. **Adaptive Density:** Compact, scan-friendly grids on desktop workstations; thumb-comfortable touch targets for mobile in-field inspections.
3. **Clarity Over Clutter:** Eliminate unnecessary decoration; use clean borders, subtle elevation, and purposeful brand accents.
4. **Bilingual Parity:** Telugu translations must never be clipped, distorted, or second-class to English text.
5. **Rock-Solid Ergonomics:** Actions must confirm destructive steps, auto-save drafts, and load instant previews without modal thrashing.
