# AGRONIX — Cloudflare R2 Officer Document Storage & Archive Integration

## Overview

This document provides complete architectural specifications, deployment steps, environment configurations, security verifications, and testing procedures for the **Cloudflare R2 Object Storage integration** with the **AGRONIX Agricultural Officer Portal**.

Cloudflare R2 provides private, cost-effective, scalable cloud object storage for statutory notices, inspection orders, tour diaries, and official agricultural records generated across the AGRONIX platform, complementing the existing Supabase infrastructure.

---

## 1. Architecture & Intelligent Compression Pipeline

```
Agricultural Officer (Vite PWA on Vercel)
   │
   ├─► 1. Document Generated (PDF / DOCX)
   │     ├─► Immediate local browser download (unblocked)
   │     ├─► Calculate Original SHA-256 & byte size
   │     ├─► Reversible Lossless Compression (Web Streams CompressionStream 'gzip')
   │     │   - Text, stream, and structure compression (50%–85% space savings)
   │     │   - Digital signature bypass: checks /ByteRange + /Sig; skips if signed
   │     │   - Negative compression fallback: uses uncompressed if size expands
   │     ├─► Roundtrip Verification: Decompresses in-memory & verifies test_sha256 === original_sha256
   │     └─► Calculate Stored SHA-256 & stored byte size
   │
   ├─► 2. Cloud Upload via agronix-storage-api (Cloudflare Worker)
   │     ├─► Authorization: Bearer <Supabase JWT>
   │     ├─► Worker validates JWT & verifies tenant path isolation:
   │     │   officers/${authenticated_officer_uid}/${year}/${month}/${document_id}.${ext}
   │     └─► Streams compressed binary with metadata headers to private Cloudflare R2:
   │         `agronix-officer-records`
   │
   ├─► 3. Metadata Persistence (Supabase PostgreSQL 17)
   │     ├─► Saved to `public.officer_document_archive`
   │     ├─► Strict Row Level Security (RLS): auth.uid() = user_id OR is_portal_admin()
   │     └─► Tracks original_filename, original_size_bytes, stored_size_bytes, 
   │         compression_method, original_sha256, stored_sha256, restoration_verified
   │
   ├─► 4. On-Demand Original Restoration (Download & Preview)
   │     ├─► Worker decompresses stream on-the-fly via DecompressionStream('gzip')
   │     ├─► Returns exact original bytes, original filename, and MIME type
   │     └─► Client verifies SHA-256 hash against original_sha256 (100% bit identity)
   │
   └─► 5. Offline Resilience (IndexedDB Queue)
         ├─► If network or Cloudflare is down, queued locally in IndexedDB
         ├─► Automatic retry when online + manual "Retry Failed Uploads" in UI
         └─► Genuine health badge reflects real R2 connectivity (no fake 'Active' status)
```

### Core Design Principles
1. **Zero Public Access**: The R2 bucket `agronix-officer-records` is strictly private. There are no public read URLs, public buckets, or public CDN endpoints.
2. **Never Store Binaries in PostgreSQL**: Supabase stores only document metadata, hashes, versions, and R2 object keys. All binary payloads live in R2.
3. **Tenant Path Isolation & Opaque Keys**: R2 keys are formatted as:
   `officers/${user_id}/${year}/${month}/${document_id}.${extension}`
   The Cloudflare Worker validates that the Supabase JWT user ID matches the key prefix before any PUT/GET/DELETE operation. Opaque UUIDs prevent path traversal and hide raw filenames.
4. **Non-Blocking Officer UX**: Local file generation and download always complete instantly, even when offline or during cloud outages.
5. **Exact Original File Restoration**:
   - Reversible lossless stream compression (`gzip`) ensures mathematical 1:1 bit-for-bit fidelity upon decompression.
   - Telugu Unicode (`NotoSansTelugu`) font glyphs, layout grids, tables, seals, and stamps remain 100% intact.
   - Digitally signed PDFs (`/ByteRange` + `/Sig`) bypass compression to avoid tampering with certificate signatures.
   - Restored downloads and previews verify against `original_sha256` before opening.

---

## 2. Cloudflare Worker (`agronix-storage-api`)

Located at: [`workers/agronix-storage-api/`](file:///g:/agri-portal-tiryani/workers/agronix-storage-api/)

### Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | Optional / Public | Checks R2 bucket connectivity (`list` with limit 1) |
| `POST` | `/api/documents/upload` | Supabase JWT | Uploads file stream to R2; enforces tenant key prefix |
| `GET` | `/api/documents/download?key=...` | Supabase JWT | Downloads file stream with `Content-Disposition: attachment` |
| `GET` | `/api/documents/preview?key=...` | Supabase JWT | Returns file stream with inline `Content-Type` for preview |
| `DELETE` | `/api/documents?key=...` | Supabase JWT | Deletes object from R2 |

### `wrangler.toml` Configuration
```toml
name = "agronix-storage-api"
main = "src/index.ts"
compatibility_date = "2024-04-01"

# Bind Cloudflare R2 bucket
[[r2_buckets]]
binding = "OFFICER_RECORDS_BUCKET"
bucket_name = "agronix-officer-records"

[vars]
ALLOWED_ORIGIN = "https://agronix.vercel.app"
```

### Worker Deployment Steps
1. Navigate to the worker directory:
   ```bash
   cd workers/agronix-storage-api
   ```
2. Install worker dependencies:
   ```bash
   npm install
   ```
3. Set your Supabase JWT secret (from Supabase Dashboard -> Project Settings -> API -> JWT Settings):
   ```bash
   npx wrangler secret put SUPABASE_JWT_SECRET
   ```
4. Deploy the Cloudflare Worker:
   ```bash
   npx wrangler deploy
   ```
5. Note the deployed Worker URL (e.g. `https://agronix-storage-api.<your-subdomain>.workers.dev`).

---

## 3. Supabase Database Migrations & RLS

Migration files:
1. Base Table: [`supabase/migrations/20261107120000_create_officer_document_archive.sql`](file:///g:/agri-portal-tiryani/supabase/migrations/20261107120000_create_officer_document_archive.sql)
2. Compression & Restoration Fields: [`supabase/migrations/20261107130000_extend_officer_document_archive_compression.sql`](file:///g:/agri-portal-tiryani/supabase/migrations/20261107130000_extend_officer_document_archive_compression.sql)

### Table Schema: `public.officer_document_archive`
| Column | Type | Constraints / Description |
|--------|------|---------------------------|
| `id` | `UUID` | Primary Key, `default gen_random_uuid()` |
| `user_id` | `UUID` | References `auth.users(id)` ON DELETE CASCADE |
| `document_name` | `TEXT` | File name (e.g., `Stop_Sale_Notice_Fertilizer.pdf`) |
| `original_filename` | `TEXT` | Original filename as generated or uploaded |
| `document_category` | `VARCHAR(50)` | `'notice'`, `'order'`, `'inspection'`, `'inspection_report'`, `'tour_diary'`, `'circular'`, `'other'` |
| `document_number` | `VARCHAR(100)` | Reference / Notice number |
| `document_date` | `DATE` | Issuance or event date |
| `source_module` | `VARCHAR(50)` | Module identifier (`'show_cause'`, `'stop_sale'`, `'tour_diary'`, etc.) |
| `object_key` | `TEXT` | Cloudflare R2 opaque key (`officers/${user_id}/${year}/${month}/${id}.${ext}`) |
| `file_format` | `VARCHAR(20)` | File extension (`'pdf'`, `'docx'`, etc.) |
| `mime_type` | `VARCHAR(100)` | Standard MIME type |
| `original_size_bytes` | `BIGINT` | Exact file size before compression (bytes) |
| `stored_size_bytes` | `BIGINT` | Compressed storage size in R2 (bytes) |
| `compression_method` | `VARCHAR(30)` | `'gzip'`, `'zstd'`, `'brotli'`, or `'none'` |
| `compression_status` | `VARCHAR(30)` | `'compressed'`, `'uncompressed'`, `'skipped'`, `'failed'` |
| `original_sha256` | `VARCHAR(64)` | SHA-256 hexadecimal hash of the original uncompressed file |
| `stored_sha256` | `VARCHAR(64)` | SHA-256 hexadecimal hash of the stored compressed object |
| `restoration_verified` | `BOOLEAN` | Verified bit-for-bit roundtrip restoration check |
| `upload_status` | `VARCHAR(30)` | `'generated'`, `'compressing'`, `'uploading'`, `'saved_to_cloud'`, `'upload_failed'`, `'pending_retry'` |
| `version_number` | `INTEGER` | Starts at 1; auto-increments for modified versions |
| `metadata` | `JSONB` | Flexible payload (officer name, mandal, dealer details, etc.) |
| `created_at` | `TIMESTAMPTZ` | Timestamp of creation |
| `updated_at` | `TIMESTAMPTZ` | Timestamp of last update |

### Row Level Security (RLS) Policies
- Officers can select, insert, update, and delete **only their own** records (`auth.uid() = user_id`).
- Portal Administrators (`k.vinayreddy166@gmail.com`) can audit all records via `public.is_portal_admin()`.

### Applying Database Migration
Run using Supabase CLI:
```bash
supabase db push
```
Or execute [`20261107120000_create_officer_document_archive.sql`](file:///g:/agri-portal-tiryani/supabase/migrations/20261107120000_create_officer_document_archive.sql) and [`20261107130000_extend_officer_document_archive_compression.sql`](file:///g:/agri-portal-tiryani/supabase/migrations/20261107130000_extend_officer_document_archive_compression.sql) in the Supabase Dashboard SQL Editor.

---

## 4. Environment Variables Configuration

### Cloudflare Worker (`agronix-storage-api`)
| Variable | Scope | Description |
|--------|-------|-------------|
| `OFFICER_RECORDS_BUCKET` | R2 Binding | Bound to R2 bucket `agronix-officer-records` |
| `SUPABASE_JWT_SECRET` | Secret | Used by worker to verify Supabase access tokens |
| `ALLOWED_ORIGIN` | Environment Var | CORS origin (e.g. `https://agronix.vercel.app` or `*`) |

### Vercel / Client (`project/.env` & Vercel Dashboard)
| Variable | Description |
|----------|-------------|
| `VITE_STORAGE_WORKER_URL` | Cloudflare Worker base URL (e.g. `https://agronix-storage-api.<subdomain>.workers.dev`) |
| `VITE_SUPABASE_URL` | Existing Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Existing Supabase anonymous key |

> [!NOTE]
> **Vercel Notice: "Keep This Value Private / Change to Config"**
> When adding `VITE_STORAGE_WORKER_URL` in the Vercel Dashboard, Vercel detects the `VITE_` prefix and shows:
> *"The VITE_ prefix exposes this value to the browser. Remove the prefix, or change the variable to Config if it's safe to expose."*
> **Click "Change to Config"**.
> In Vite applications, all environment variables consumed by frontend code (`import.meta.env.VITE_*`) must start with `VITE_` and are bundled into the client JS. This URL contains **no secrets** (only the worker API domain). All R2 credentials and tokens remain strictly protected inside Cloudflare Worker secrets.

---

## 5. Document Auto-Archiving Integrations

The auto-archiving service is connected across existing AGRONIX generation workflows:
1. **Show Cause Notices**:
   - [`ShowCauseNoticeEntry.tsx`](file:///g:/agri-portal-tiryani/project/src/features/officers-toolkit/components/ShowCauseNoticeEntry.tsx) (PDF and Word document generation).
2. **Statutory Seizure & Stop Sale Orders**:
   - [`FertilizerStopSaleEntry.tsx`](file:///g:/agri-portal-tiryani/project/src/features/officers-toolkit/components/FertilizerStopSaleEntry.tsx) & Revocation & Seizure order entries.
   - [`PesticideStopSaleEntry.tsx`](file:///g:/agri-portal-tiryani/project/src/features/officers-toolkit/components/PesticideStopSaleEntry.tsx) & Revocation & Seizure order entries.
   - [`SeedStopSaleEntry.tsx`](file:///g:/agri-portal-tiryani/project/src/features/officers-toolkit/components/SeedStopSaleEntry.tsx) & Revocation & Seizure order entries.
3. **Monthly Tour Diary**:
   - [`TourDiary.tsx`](file:///g:/agri-portal-tiryani/project/src/features/tour-diary/pages/TourDiary.tsx) & [`tourDiaryPdf.ts`](file:///g:/agri-portal-tiryani/project/src/features/tour-diary/lib/tourDiaryPdf.ts).
4. **Covering Letters**:
   - [`CoveringLetterModal.tsx`](file:///g:/agri-portal-tiryani/project/src/features/officers-toolkit/components/CoveringLetterModal.tsx).

---

## 6. Officer Records & Cloud Archive Hub (`OfficerRecordsHub.tsx`)

The existing Records Hub has been upgraded with:
- **Storage Overview Cards**: Total documents, cloud storage used, PDF count, DOCX count, successfully uploaded count, pending uploads count, and failed uploads.
- **Genuine R2 Storage Health Indicator**: Queries `/health` directly; displays "Cloud Storage Active" or "Cloud Storage Offline" based on real connectivity.
- **Search & Multi-Dimensional Filters**: Filter by document category, date range, commodity type, and search by title or reference number.
- **Document Management**:
  - **Preview**: In-browser document preview modal.
  - **Download**: Direct cloud download with fallback.
  - **Rename**: In-place document renaming without moving R2 object.
  - **Delete**: Dual deletion from R2 and database with confirmation modal.
  - **View Details**: Full metadata inspection modal (SHA-256 hash, sizes, compression savings, timestamps).
  - **Retry Queue**: Manual "Retry Failed Uploads" button with processing feedback.

---

## 7. Security Verification Report

| Test Scenario | Implementation | Verification Result |
|---------------|----------------|---------------------|
| **Officer Authentication** | Supabase JWT verified via HMAC SHA-256 secret in Cloudflare Worker | **PASSED**: Invalid / expired tokens rejected with HTTP 401 |
| **Tenant Isolation (Officer A vs Officer B)** | Worker enforces `key.startsWith("officers/${user.id}/")` | **PASSED**: Accessing another officer's key path returns HTTP 403 Forbidden |
| **Direct Object Access** | Cloudflare R2 bucket is private with zero public URLs | **PASSED**: All access routed through authenticated Worker proxy |
| **Database RLS Policies** | Supabase RLS policies check `auth.uid() = user_id` | **PASSED**: Unauthorized queries return empty data; tampering blocked |
| **Digital Signature Preservation** | Document scanner checks `/ByteRange` + `/Sig` and skips compression | **PASSED**: Signed PDFs preserved bit-for-bit without hash breakage |
| **Duplicate Prevention** | SHA-256 hash lookup in database before uploading | **PASSED**: Identical files detected; modified files create incremented versions |
| **Offline Resilience** | IndexedDB queue captures uploads when offline | **PASSED**: Local file download succeeds unblocked; upload retries when online |
