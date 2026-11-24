# Backup & Restore — AGRONIX

## What exists today

| Asset | Storage | Backup mechanism |
|---|---|---|
| Application data (officers, dealers, stock, statutory records, feedback, knowledge base) | Supabase Postgres | Supabase-managed backups — **retention depends on your plan** (Free: none/daily limited; Pro: daily + PITR optional). Verify in Dashboard → Database → Backups. |
| Auth users | Supabase Auth (GoTrue) | Included in database backups; also manageable via Dashboard → Authentication → Users. |
| Officer document archive / R2 objects | Cloudflare R2 (`OFFICER_RECORDS_BUCKET` via `agronix-storage-api` worker) | **No automated backup in repo.** R2 is durable but single-copy — see below. |
| Officer offline copies | IndexedDB on each officer's device | Automatic per-device redundancy. |
| Uploaded statutory forms (Supabase Storage `uploads` bucket) | Supabase Storage | Covered by Supabase backups for metadata; file bytes need separate handling on lower plans. |

## Recommended backup strategy (free / low-cost)

### 1. Database

- **Verify plan**: Supabase Dashboard → Project Settings → Add-ons / Database → Backups. On Pro, enable PITR if budget allows.
- **Manual snapshot before risky migrations**:
  ```bash
  supabase db dump --linked -f backup-$(date +%F).sql
  ```
  Store dumps outside the repo (e.g., encrypted cloud drive). Never commit dumps — they contain personal data.
- **Scheduled export (free alternative)**: a weekly GitHub Action running `pg_dump` via `SUPABASE_DB_PASSWORD` secret, uploading to a private R2 bucket or artifact storage.

### 2. R2 documents

R2 has no built-in versioning on the free tier. Options:

- **`rclone` sync to a second R2 bucket or Backblaze B2** (both have free tiers):
  ```bash
  rclone sync r2:agronix-records b2:agronix-backup --checksum
  ```
  Run weekly via cron/GitHub Action with R2 + B2 API tokens stored as secrets.
- **Integrity spot-check**: the archive stores `original_sha256`/`stored_sha256` per object — periodically re-hash a sample of objects and compare.

### 3. Supabase Storage (`uploads` bucket)

Same `rclone`/S3-sync approach against the Supabase Storage S3 endpoint, or rely on plan backups for smaller datasets.

## Restore procedures

### Database restore (Supabase)

1. Dashboard → Database → Backups → select snapshot → **Restore** (creates a new project or restores in place per plan).
2. For PITR: Dashboard → Database → Point in Time Recovery → choose timestamp.
3. For a `pg_dump` file:
   ```bash
   psql "$SUPABASE_DB_URL" -f backup-YYYY-MM-DD.sql
   ```
   Or `supabase db reset` + `psql` import on a fresh project, then re-point `VITE_SUPABASE_URL`/keys.
4. **Post-restore checks**: row counts on `dealers`, `officer_profiles`, `officer_statutory_orders`, `security_audit_logs`; test one officer login and one dealer login; verify an R2 document download.

### R2 / file restore

1. Identify missing/corrupt object key from `officer_document_archive.object_key`.
2. `rclone copy b2:agronix-backup/<key> r2:agronix-records/<key>` (or reverse direction).
3. Verify by downloading through the app — the worker serves `x-original-sha256`; client-side restoration verifies SHA-256 automatically.
4. If the object is unrecoverable but the officer has the file on-device (IndexedDB queue), they can re-upload from **Records & Storage**.

## Verification checklist (run quarterly)

- [ ] Confirm latest Supabase backup timestamp < 24 h old.
- [ ] Restore a backup into a scratch project and run smoke queries.
- [ ] `rclone check` R2 vs backup bucket — zero differences.
- [ ] Download 3 random archived documents and confirm SHA-256 verification passes.
- [ ] Confirm `security_audit_logs` is receiving rows (admin query).
