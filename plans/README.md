# Animation Plans

Plans produced by the `improve-animations` skill. Execute top-down; each plan is
self-contained.

| # | Title | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 001 | Landing page logo entrance animation | LOW | Missed opportunities | TODO |
| 002 | Unify loading spinner language | MEDIUM | Cohesion & tokens | DONE |

## Recommended order

1. **002** — mechanical, high-leverage: one CSS line + ~18 spinner swaps.
2. **001** — standalone, no dependencies. Safe to run alone.

## Notes

- Commit stamped at plan time: `1be43c37`.
- Scope is deliberately narrow: a one-time entrance on the landing header logo,
  reusing the existing `loginLogoHero` keyframes. No infinite idle animation
  (navbar is high-frequency UI).
