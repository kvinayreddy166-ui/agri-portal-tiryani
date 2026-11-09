# 001 — Landing page logo entrance animation

- **Status**: TODO
- **Commit**: 1be43c37
- **Severity**: LOW
- **Category**: Missed opportunities / Cohesion
- **Estimated scope**: 2 files, ~15 lines

## Problem

The AGRONIX logo on the landing page is completely static. The login page already
has a polished logo treatment — `loginLogoHero` (entrance) + `loginLogoBreathe`
(idle loop) keyframes defined in `project/src/app/index.css:944-979` and applied
via `.login-logo-hero` — but the landing page, which is the first thing every
visitor sees, renders the bare `PortalLogo` with only a hover scale:

`project/src/features/auth/pages/LandingPage.tsx:234-241` (current):

```tsx
<button
  type="button"
  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
  className="group flex min-w-0 items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
>
  <div className="shrink-0 transition-transform group-hover:scale-105">
    <PortalLogo size="sm" />
  </div>
```

A marketing/landing page is exactly the "rare, high-emotion" surface allowed a
delight budget (AUDIT.md §1, §8). The brand mark should introduce itself once on
load — and then stay out of the way, because the header logo sits in a
high-frequency region (always visible, clicked often).

## Target

A **one-time** entrance on the header logo only. Reuse the existing
`loginLogoHero` keyframes (they already end at the natural state
`translateY(0) scale(1) rotate(0)`), but do NOT include the infinite
`loginLogoBreathe` loop — an always-visible navbar element must not idle-animate
(AUDIT.md §1: frequency decides).

End state:

1. New CSS class `.landing-logo-entrance` in `project/src/app/index.css`,
   placed immediately after the `.login-logo-hero` rule (~line 979):

```css
.landing-logo-entrance {
  animation: loginLogoHero 0.7s cubic-bezier(0.23, 1, 0.32, 1) both;
  transform-origin: center;
}
```

2. Add `.landing-logo-entrance` to the `prefers-reduced-motion` kill list in
   `project/src/app/index.css` (~line 1104-1115), alongside `.login-logo-hero`:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fadeIn,
  .animate-slide-up,
  .animate-scale-in,
  .animate-overlay-in,
  .animate-pop-in,
  .animate-shake,
  .dashboard-float,
  .login-logo-hero,
  .landing-logo-entrance,
  .pulse-border-animation {
    animation: none !important;
  }
```

3. In `project/src/features/auth/pages/LandingPage.tsx`, wrap the logo in a new
   outer div carrying the entrance class, and keep the existing hover scale on
   the inner div. This split is required: the `both` fill mode of the entrance
   animation retains its final `transform` values, which would permanently
   override a hover transform on the same element.

Replace lines ~239-241:

```tsx
<div className="shrink-0 transition-transform group-hover:scale-105">
  <PortalLogo size="sm" />
</div>
```

with:

```tsx
<div className="landing-logo-entrance shrink-0">
  <div className="transition-transform group-hover:scale-105">
    <PortalLogo size="sm" />
  </div>
</div>
```

## Repo conventions to follow

- Keyframes and animation utility classes live in `project/src/app/index.css`.
  The easing token `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` is already
  defined in `project/src/shared/styles/design-system.css:88`; the literal
  cubic-bezier above is used so the rule works even if that file's variables
  are not loaded on this page.
- Exemplar of correct reduced-motion handling:
  `project/src/app/index.css:1104-1115` (existing kill list).
- Exemplar of entrance-then-rest motion: `.login-logo-hero` at
  `project/src/app/index.css:976-979` — entrance keyframes with `both`, idle
  state is the element's natural transform.

## Steps

1. `project/src/app/index.css` — insert the `.landing-logo-entrance` rule
   directly after the `.login-logo-hero` block (after line 979).
2. `project/src/app/index.css` — add `.landing-logo-entrance` to the selector
   list inside the `@media (prefers-reduced-motion: reduce)` block (~line 1112).
3. `project/src/features/auth/pages/LandingPage.tsx` — apply the wrapper change
   shown in Target step 3 to the header brand logo (~line 239).

## Boundaries

- Do NOT add the infinite `loginLogoBreathe` animation to the landing page.
- Do NOT animate the footer `PortalLogo` (line ~808) — it renders below the
  fold; an on-load animation would be invisible and wasteful.
- Do NOT modify `PortalLogo.tsx`, `Login.tsx`, or any other page.
- Do NOT change markup structure beyond the single wrapper div in step 3.
- Do NOT add dependencies or new keyframes — reuse `loginLogoHero` verbatim.
- If the cited lines have drifted, locate the code by the quoted snippets
  (`.login-logo-hero` rule, reduced-motion block, header brand button) and STOP
  if the surrounding code no longer matches.

## Verification

- **Mechanical**: `cd project && npx tsc --noEmit -p tsconfig.json` — no new
  errors; `npm run build` succeeds.
- **Feel check**: run `npm run dev`, open `/` (landing page):
  - On load, the header logo plays a single ~0.7s entrance: fades in while
    rising ~12px, slight overshoot scale/rotate, settles to rest. It must NOT
    loop or breathe afterwards.
  - Hovering the logo still scales it to 1.05 smoothly (hover transform must
    work — if the logo stays frozen at scale(1), the fill-mode conflict was
    not resolved; re-check the wrapper split).
  - In DevTools Animations panel at 10% playback, confirm the motion is a
    single pass ending at identity transform.
  - Rendering panel → emulate `prefers-reduced-motion: reduce`: the logo
    appears instantly with no movement.
- **Done when**: logo plays exactly one entrance on landing load, hover scale
  still works, reduced-motion users see no animation.
