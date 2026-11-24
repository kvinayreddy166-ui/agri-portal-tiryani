# AGRONIX Security Framework

This document describes the security controls implemented in the AGRONIX
portal, how they map to the OWASP-style requirements, and what still requires
external configuration or paid plans.

## Implemented controls

### Authentication (Phase 1)

| Control | Implementation |
|---|---|
| Password storage | Supabase Auth (GoTrue) — bcrypt hashing. No plaintext passwords anywhere. Dealer provisioning uses `crypt(pw, gen_salt('bf'))`. |
| Password policy | Min 8 chars + upper/lower/digit/symbol, enforced server-side in `register-officer` and `reset-password` Edge Functions (`_shared/passwordPolicy.ts`). |
| Login rate limiting | `public.login_attempts` + `check_login_throttle` / `record_login_attempt` RPCs. Client checks throttle before `signInWithPassword`/`signInDealer`; 5 failures in 15 min → 15 min lockout. Fails open if migration not applied. |
| OTP brute-force | `officer_email_otps.attempts` capped at 5 (RPC + `reset-password` Edge Function now enforce it). |
| OTP resend throttle | `send-email-otp` rejects a second code within 60 s per email+purpose. |
| Bot protection | Cloudflare Turnstile on login/sign-up/OTP/reset — **requires enabling in Supabase Dashboard → Auth → Attack Protection + `TURNSTILE_SECRET_KEY` secret** (currently optional; empty `VITE_TURNSTILE_SITE_KEY` disables it). |
| Session/token | PKCE flow, tokens in `safeStorage`, auto-refresh on. JWTs verified server-side by Supabase Auth and the R2 worker. |
| Suspension | Suspended `officer_profiles` blocked at password + OTP sign-in. |

### Access control (Phase 2)

- PostgreSQL RLS on all application tables.
- `is_portal_admin()` matches immutable `auth.uid()` OR admin email.
- Officer jurisdiction scoping (`current_officer_jurisdiction()`): ADA/DAO/DNO see district, MAO/AEO see mandal + own rows.
- Officer data silos via `created_by = auth.uid()`.
- Dealer siloing via `dealers.portal_email` / `current_dealer_id()`.
- **RBAC hardening (this migration):** role/`dealer_id` authorization claims moved from `user_metadata` (user-editable via `auth.updateUser`) to `app_metadata` (service-role only) plus authoritative table lookups. `is_officer_user()`, `is_dealer_portal_user()`, `current_dealer_id()`, `current_officer_jurisdiction()` updated; existing accounts backfilled; `register-officer` and `provision_dealer_portal_login` now write `app_metadata`.

### Data protection (Phase 3)

- TLS everywhere (Vercel + Supabase + Cloudflare defaults).
- Security headers via `vercel.json`: HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP (baseline — `script-src` still allows `'unsafe-inline'` because `index.html` ships inline bootstrap scripts; tighten with nonces/hashes later).
- Secrets server-side only: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `VAPID_PRIVATE_KEY`, `OLLAMA_*`, `GEE_*` live in Supabase Edge Function secrets. **Exception:** `VITE_GEMINI_API_KEY` and `VITE_RESEND_API_KEY` are optional client-side fallbacks — prefer leaving them empty.
- R2 documents: private bucket behind `workers/agronix-storage-api`, which verifies the Supabase JWT server-side, enforces `officers/{userId}/` path isolation, and **fails closed** if Supabase Auth is unreachable (previously fell back to unsigned JWT parsing).
- Document integrity: `original_sha256`/`stored_sha256` recorded on upload; client verifies after restore.
- CSP note: `connect-src 'self' https: wss:` is intentionally broad to avoid breaking Turnstile, Supabase Realtime, Google Maps, Gemini, Open-Meteo and push endpoints. Tighten per-domain once verified.

### Audit logging (Phase 4)

- `public.security_audit_logs`: user_id, actor_email, actor_role, module, action, record_id, record_label, ip_address, user_agent, details, server `created_at`.
- `log_security_event()` RPC — callable by anon+authenticated (needed for failed logins), SECURITY DEFINER insert; table writes revoked from clients; admin read-only RLS.
- DB triggers `audit_*` on: `officer_statutory_orders`, `officer_inspections`, `officer_samples`, `officer_cases`, `officer_document_archive`, `officer_profiles`, `dealers`, `dealer_stock_allocation`, `stock_inventory_lines` — capture INSERT/UPDATE/DELETE with actor from JWT.
- Client events: LOGIN, LOGIN_FAILED, OTP_LOGIN, DEALER_LOGIN, LOGOUT (`AuthContext`).
- Worker events: UPLOAD, DOWNLOAD, PREVIEW, DELETE on `/api/documents*` with real client IP (`cf-connecting-ip`) via `ctx.waitUntil`.

### Security testing (Phase 5)

- `.github/workflows/security.yml`: `npm audit --audit-level=high`, gitleaks secret scan, Semgrep (OWASP top-10 + default rules, informational) — on push/PR + weekly schedule.
- Existing CI: lint, typecheck, vitest, build.

### Privacy & compliance (Phase 7 — partial)

- Privacy Policy + Terms pages exist; Security & Trust page at `/security-trust`.
- Data residency: **global** (Vercel + Supabase default region). India-only access is NOT implemented — would require Cloudflare WAF geo-rules or Vercel firewall (paid/complex). Documented honestly on the Trust page.
- Data retention policies: not yet formalized — Supabase backup retention depends on plan.
- Laboratory blind sample coding: `officer_samples.sample_code` exists; formal blind-coding workflow not implemented.

## Still required / known gaps

1. **Dealer shared password** — all dealers use `Guest@123`. Per-dealer passwords or OTP is the top remaining risk; it is a product decision (dealers currently only know the shared password).
2. **Turnstile** must be enabled in Supabase dashboard + `TURNSTILE_SECRET_KEY` secret to activate bot protection.
3. **Single-active-session enforcement** — not implemented. Supabase supports `admin.signOut(jwt, 'others')`; needs a session registry to be meaningful.
4. **Device/session tracking** — `auth.sessions` exists in Supabase; no UI built on it.
5. **CSP tightening** — replace `'unsafe-inline'` scripts with hashes/nonces.
6. **HSTS preload** — not submitted; current header is 1-year includeSubDomains.
7. **OWASP ZAP** — not wired (needs a running target; can be added as scheduled DAST against preview deploys).
8. **Backups** — see `docs/BACKUP_RESTORE.md`; verify Supabase plan retention and test restores.
9. **Audit log retention** — no purge job yet; add a scheduled cleanup (e.g., 1-year retention) when volume grows.
10. **`signInOfficerOtp` `shouldCreateUser: true`** — allows auth-account creation for any email; downstream access is still gated by `officer_profiles`/RLS, but consider restricting.
