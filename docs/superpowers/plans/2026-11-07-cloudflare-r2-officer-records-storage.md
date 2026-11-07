# Cloudflare R2 Object Storage Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Cloudflare R2 Object Storage (`agronix-officer-records`) into AGRONIX via a dedicated Cloudflare Worker (`agronix-storage-api`), a Supabase metadata archive table (`officer_document_archive`) with strict RLS, safe Telugu-preserving PDF compression, duplicate/version control, offline queueing, auto-archiving from document-generation modules, and an enhanced `OfficerRecordsHub` interface.

**Architecture:** 
1. **Cloudflare Worker Layer (`agronix-storage-api`):** Secure private intermediary connected to R2 bucket `agronix-officer-records`. Validates Supabase JWTs, enforces officer tenant isolation (`officers/${userId}/${docId}/...`), streams binary uploads/downloads/previews, deletes objects, and provides a health check for genuine connectivity verification.
2. **Supabase Database Layer (`officer_document_archive`):** Stores document metadata, SHA-256 hash, R2 object key, sizes, compression status, upload status, and versioning. Protected by strict RLS where officers only access their own documents (portal admin oversight). Never stores binaries in PostgreSQL.
3. **Safe PDF Compression & Hashing Layer:** Compresses PDFs via `pdf-lib` without rasterizing text or invalidating Telugu Unicode fonts (`NotoSansTelugu`), logos, tables, or digital signatures. Calculates SHA-256 hashes, prevents duplicates, and tracks version history.
4. **Offline Resilience & Persistent Queue Layer:** IndexedDB-backed upload queue preserving files locally if offline or if Cloudflare is unreachable; performs automatic and manual retries without blocking officer downloads.
5. **Frontend UI Layer (`OfficerRecordsHub`):** Enhances the existing Records & Cloud Archive interface with storage metrics, real-time connectivity status, search/filter, preview/download/rename/delete actions, and retry management. Auto-archives documents generated across officer modules.

**Tech Stack:** React 18, TypeScript, Supabase (PostgreSQL 17, Auth, RLS), Cloudflare Workers & R2, Wrangler, `pdf-lib`, IndexedDB, Tailwind CSS, Lucide Icons, Vitest.

---

## Global Constraints
- R2 Bucket: `agronix-officer-records` (Standard storage class, private bucket, zero public access, no public URLs).
- Worker Name: `agronix-storage-api`.
- Officer Isolation: Officer A must never access or modify Officer B's documents.
- Safe PDF Compression: Preserve Telugu Unicode text, embedded fonts, vector layouts, and digital signatures; compare original vs compressed size and fallback to original if larger.
- No Binary Storage in PostgreSQL: Database only stores document metadata, hashes, and R2 object keys.
- Preserve Existing Functionality: Enhance the existing `OfficerRecordsHub.tsx`; do not create duplicate modules or break existing routes/deployments.
- Accurate Statuses: Never show "Cloud Backup Active" unless actual connectivity to R2 succeeds.
- Zero Unnecessary Dependencies: Reuse `pdf-lib` already in `package.json`, native Web Crypto API, and native IndexedDB.

---

## Review Focus
1. **Officer Tenant Isolation:** Requests with valid JWT for Officer A attempting to read/download/delete Officer B's R2 object key must receive HTTP 403 Forbidden.
2. **Telugu Text & Font Preservation:** Compressed PDFs must retain all Telugu Unicode glyphs and embedded TTF fonts without rasterization or corrupted glyphs.
3. **Digitally Signed PDF Integrity:** PDFs containing digital signatures (`/ByteRange`, `/Sig`) must bypass compression completely to prevent signature invalidation.
4. **Duplicate & Version Handling:** Uploading the exact same document must return existing metadata (idempotent); uploading an edited document with the same document number must increment `version_number` and retain prior versions.
5. **Offline & Network Resiliency:** If R2 or the network is unavailable during generation, local file download must succeed immediately, document must be stored in IndexedDB queue, and UI must display `Pending Retry` without freezing.

---

## Tasks

### Task 1: Supabase Database Migration for Dedicated Document Archive Table
**Files:**
- Create: `supabase/migrations/20261107120000_create_officer_document_archive.sql`
- Test: `project/src/features/officers-toolkit/services/officerDocumentArchiveDb.test.ts`

**Interfaces:**
- Consumes: Supabase `auth.users`, `public.is_portal_admin()`
- Produces: `public.officer_document_archive` table, indexes, RLS policies, `handle_updated_at` trigger

- [ ] **Step 1: Write the migration file `supabase/migrations/20261107120000_create_officer_document_archive.sql`**
  - Fields: `id`, `user_id`, `document_name`, `document_category`, `document_number`, `document_date`, `source_module`, `object_key`, `file_format`, `mime_type`, `original_size`, `stored_size`, `compression_status`, `content_hash`, `upload_status`, `version_number`, `parent_document_id`, `metadata_json`, `created_at`, `updated_at`.
  - Indexes: `user_id`, `document_category`, `created_at`, `(user_id, content_hash)`, `(user_id, document_number)`.
  - RLS policies: SELECT, INSERT, UPDATE, DELETE for `auth.uid() = user_id OR public.is_portal_admin()`.
  - Trigger: `handle_updated_at_officer_document_archive`.

- [ ] **Step 2: Write tests in `officerDocumentArchiveDb.test.ts` verifying SQL schema fields, constraints, and RLS expectations**

- [ ] **Step 3: Run Vitest to verify tests pass**

---

### Task 2: Cloudflare Worker (`agronix-storage-api`) Implementation & Wrangler Config
**Files:**
- Create: `workers/agronix-storage-api/wrangler.toml`
- Create: `workers/agronix-storage-api/package.json`
- Create: `workers/agronix-storage-api/tsconfig.json`
- Create: `workers/agronix-storage-api/src/index.ts`
- Create: `workers/agronix-storage-api/src/auth.ts`
- Create: `workers/agronix-storage-api/src/r2.ts`
- Test: `workers/agronix-storage-api/test/worker.test.ts`

**Interfaces:**
- Consumes: R2 binding `OFFICER_RECORDS_BUCKET`, Supabase JWT Bearer token
- Produces: REST endpoints:
  - `GET /health` -> `{ status: 'healthy', connected: boolean, bucket: string }`
  - `POST /api/documents/upload` -> `{ success: boolean, objectKey: string, storedSize: number, contentHash: string }`
  - `GET /api/documents/:objectKey/download` -> Streams binary with `Content-Disposition: attachment`
  - `GET /api/documents/:objectKey/preview` -> Streams binary with `Content-Disposition: inline`
  - `DELETE /api/documents/:objectKey` -> `{ success: boolean }`

- [ ] **Step 1: Write worker tests in `workers/agronix-storage-api/test/worker.test.ts` covering JWT auth, tenant isolation, health check, upload, download, and delete**
- [ ] **Step 2: Implement `src/auth.ts` (JWT verification with Supabase secret, expiration validation, user extraction)**
- [ ] **Step 3: Implement `src/r2.ts` (R2 operations, stream handling, headers, tenant path validation `officers/${userId}/`)**
- [ ] **Step 4: Implement `src/index.ts` (CORS handling, routing, error handling)**
- [ ] **Step 5: Run tests to verify all worker tests pass**

---

### Task 3: Safe PDF Compression & Hashing Service
**Files:**
- Create: `project/src/features/officers-toolkit/services/pdfCompressionService.ts`
- Create: `project/src/features/officers-toolkit/services/documentCryptoService.ts`
- Test: `project/src/features/officers-toolkit/services/pdfCompressionService.test.ts`

**Interfaces:**
- Consumes: `pdf-lib`, Web Crypto API (`crypto.subtle`)
- Produces:
  - `compressPdfSafely(pdfBytes: Uint8Array): Promise<{ bytes: Uint8Array; compressed: boolean; status: CompressionStatus; originalSize: number; storedSize: number; savingsPercent: number }>`
  - `computeSha256(data: ArrayBuffer | Uint8Array): Promise<string>`
  - `detectDigitalSignature(bytes: Uint8Array): boolean`

- [ ] **Step 1: Write tests in `pdfCompressionService.test.ts` verifying compression of sample PDFs, preservation of Telugu Unicode text, digital signature bypass, and size comparison fallback**
- [ ] **Step 2: Implement `documentCryptoService.ts` for SHA-256 calculation and digital signature detection**
- [ ] **Step 3: Implement `pdfCompressionService.ts` with `pdf-lib` stream compression and size comparison**
- [ ] **Step 4: Run tests to verify all tests pass**

---

### Task 4: Persistent Offline Upload Queue (IndexedDB)
**Files:**
- Create: `project/src/features/officers-toolkit/services/officerDocumentQueue.ts`
- Test: `project/src/features/officers-toolkit/services/officerDocumentQueue.test.ts`

**Interfaces:**
- Consumes: IndexedDB native API
- Produces:
  - `enqueueDocument(doc: QueuedDocument): Promise<void>`
  - `getPendingDocuments(): Promise<QueuedDocument[]>`
  - `removeQueuedDocument(id: string): Promise<void>`
  - `updateQueuedDocumentStatus(id: string, status: UploadStatus, error?: string): Promise<void>`

- [ ] **Step 1: Write tests for `officerDocumentQueue.test.ts` verifying persistence, queue retrieval, status updates, and deletion**
- [ ] **Step 2: Implement `officerDocumentQueue.ts` with zero external dependencies using standard browser IndexedDB**
- [ ] **Step 3: Run tests to verify persistence and retrieval work properly**

---

### Task 5: Cloudflare R2 Client & Document Archive Service
**Files:**
- Create: `project/src/features/officers-toolkit/services/officerDocumentArchiveService.ts`
- Test: `project/src/features/officers-toolkit/services/officerDocumentArchiveService.test.ts`

**Interfaces:**
- Consumes: `pdfCompressionService`, `documentCryptoService`, `officerDocumentQueue`, `supabase`, Cloudflare Worker API
- Produces:
  - `archiveGeneratedDocument(blob: Blob, meta: DocumentArchiveInput): Promise<ArchiveResult>`
  - `fetchOfficerDocuments(): Promise<OfficerDocumentRecord[]>`
  - `previewDocument(doc: OfficerDocumentRecord): Promise<string>` (blob URL)
  - `downloadDocument(doc: OfficerDocumentRecord): Promise<void>`
  - `renameDocument(id: string, newName: string): Promise<boolean>`
  - `deleteDocument(id: string, objectKey: string): Promise<boolean>`
  - `checkR2StorageHealth(): Promise<{ online: boolean; message: string }>`
  - `retryFailedUploads(): Promise<{ total: number; succeeded: number; failed: number }>`
  - `getStorageOverview(): Promise<StorageOverviewStats>`

- [ ] **Step 1: Write tests in `officerDocumentArchiveService.test.ts` verifying archive flow, duplicate hash detection, version bumping, rename without R2 object movement, offline fallback to queue, and retry logic**
- [ ] **Step 2: Implement `officerDocumentArchiveService.ts` coordinating compression, hashing, R2 upload, Supabase metadata record creation, and error handling**
- [ ] **Step 3: Run tests to verify full service behavior**

---

### Task 6: Auto-Archiving Integration into Existing Document Generation Modules
**Files:**
- Modify: `project/src/features/officers-toolkit/components/ShowCauseNoticeEntry.tsx`
- Modify: `project/src/features/officers-toolkit/components/FertilizerStopSaleEntry.tsx`
- Modify: `project/src/features/officers-toolkit/components/PesticideStopSaleEntry.tsx`
- Modify: `project/src/features/officers-toolkit/components/SeedStopSaleEntry.tsx`
- Modify: `project/src/features/officers-toolkit/components/FertilizerSeizureOrderEntry.tsx`
- Modify: `project/src/features/officers-toolkit/components/PesticideSeizureOrderEntry.tsx`
- Modify: `project/src/features/officers-toolkit/components/SeedSeizureOrderEntry.tsx`
- Modify: `project/src/features/officers-toolkit/components/FertilizerStopSaleRevokeEntry.tsx`
- Modify: `project/src/features/officers-toolkit/components/PesticideStopSaleRevokeEntry.tsx`
- Modify: `project/src/features/officers-toolkit/components/SeedStopSaleRevokeEntry.tsx`
- Modify: `project/src/features/tour-diary/pages/TourDiary.tsx`
- Modify: `project/src/features/sampling-hub/components/CoveringLetterModal.tsx`

**Interfaces:**
- Consumes: `OfficerDocumentArchiveService.archiveGeneratedDocument`
- Produces: Non-blocking automatic archive triggering on document download/export with background toast status

- [ ] **Step 1: In statutory order/notice entry files, connect `downloadPdf` and `downloadWord` to call `archiveGeneratedDocument`**
- [ ] **Step 2: In `TourDiary.tsx`, connect PDF export to call `archiveGeneratedDocument`**
- [ ] **Step 3: In `CoveringLetterModal.tsx`, connect covering letter PDF generation to call `archiveGeneratedDocument`**
- [ ] **Step 4: Verify that local user download completes immediately without waiting for network/cloud**

---

### Task 7: Enhance Existing `OfficerRecordsHub.tsx` Interface
**Files:**
- Modify: `project/src/features/officers-toolkit/components/OfficerRecordsHub.tsx`
- Test: `project/src/features/officers-toolkit/components/OfficerRecordsHub.test.tsx`

**Interfaces:**
- Consumes: `OfficerDocumentArchiveService`, `OfficerCloudSyncService`
- Produces: Enhanced Records & Cloud Archive UI

- [ ] **Step 1: Write tests in `OfficerRecordsHub.test.tsx` testing storage overview display, accurate R2 connectivity badge, search/filter, preview/download/rename/delete, and retry button**
- [ ] **Step 2: Update storage overview in `OfficerRecordsHub.tsx`:**
  - Total Documents, Total Storage Used, Total PDFs, Total DOCX, Saved to Cloud, Pending Uploads, Failed Uploads.
- [ ] **Step 3: Implement dynamic storage connectivity badge:**
  - Pings `/health`; shows "Cloud Storage Active" or "Cloud Storage Offline" (never static text).
- [ ] **Step 4: Add Document Archive tab / section alongside statutory form records:**
  - Search by document name / number.
  - Filter by category & date.
  - Action buttons: Preview, Download, Rename, Delete, Retry Failed, Refresh.
- [ ] **Step 5: Add Document Details Modal displaying:**
  - Document Name, Category, Number, Date, Original Size, Stored Size, Compression %, Upload Status, Version, Content Hash.
- [ ] **Step 6: Ensure full mobile responsiveness and Telugu translations**
- [ ] **Step 7: Run tests to verify all UI components and interactions work correctly**

---

### Task 8: Environment Configuration, Verification & Deliverables
**Files:**
- Modify: `project/.env.example`
- Modify: `project/src/features/dashboard/pages/Dashboard.tsx` (fix minor unused variable warnings so typecheck passes)
- Create: `docs/CLOUDFLARE_R2_INTEGRATION.md` (deployment guide, Vercel env instructions, security report)

- [ ] **Step 1: Document `VITE_STORAGE_WORKER_URL` in `project/.env.example` and `project/.env`**
- [ ] **Step 2: Run `npm run typecheck` in `project/` with 4096MB heap and ensure 0 errors**
- [ ] **Step 3: Run Vitest test suite and ensure all tests pass**
- [ ] **Step 4: Run `npm run build` in `project/` to confirm production build succeeds**
- [ ] **Step 5: Write comprehensive documentation in `docs/CLOUDFLARE_R2_INTEGRATION.md` detailing architecture, security verification, RLS policies, Wrangler deployment, and Vercel configuration**
