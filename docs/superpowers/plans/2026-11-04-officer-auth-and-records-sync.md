# Agricultural Officer Authentication (OTP & Registration) and Cloud Records Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide Agricultural Officers (AEO, MAO, ADA, DAO) with self-registration, OTP authentication, and automated cloud synchronization for statutory orders (Stop Sale, Seizure, Revocation, Show Cause Notices), dealer inspections, and sampling memos/covering letters in Supabase with offline-first support.

**Architecture:** 
1. Database Layer: 4 new Supabase PostgreSQL 17 tables (`officer_profiles`, `officer_inspections`, `officer_statutory_orders`, `officer_samples`) secured by Row Level Security (RLS) guaranteeing officer data isolation and administrative supervision.
2. Auth Layer: Supabase Auth integration supporting both Email OTP and password sign-in, with officer self-registration capturing designation, Telangana district, and mandal.
3. Sync & Persistence Layer: An offline-first `officerCloudSyncService` that mirrors local `safeStorage` drafts with Supabase, enabling field officers to work seamlessly offline and auto-sync when online.
4. UI Layer: Modernized bilingual (English/Telugu) login screen with dedicated "Officer" portal, and a "My Records & Cloud History" viewer in the Officer Toolkit.

**Tech Stack:** React 18, TypeScript, Supabase (Auth + Postgres 17 + RLS), Tailwind CSS, Lucide Icons, Vitest.

---

## Global Constraints
- Preserve full bilingual support (`t('...', '...')`) in English and Telugu across all new auth and sync views.
- Strict offline resilience: all operations must continue functioning with `safeStorage` when network connectivity is absent or unstable.
- Row Level Security: Officers must only read/write their own records; portal admins retain supervisory oversight.
- TypeScript compiler compliance: Zero unused variables, zero implicit any, full type safety.
- High-contrast dark mode support across all modals, badges, cards, and tables.

---

## Tasks

### Task 1: Supabase Database Migration for Officer Hub and Records
- [x] Create `supabase/migrations/20261105000000_create_officer_hub_and_records.sql`.
- [x] Define `public.officer_profiles` table with foreign key to `auth.users(id)` ON DELETE CASCADE.
- [x] Define `public.officer_inspections`, `public.officer_statutory_orders`, and `public.officer_samples` tables.
- [x] Implement RLS policies for officer ownership (`auth.uid() = officer_id`) and admin access.
- [x] Add `handle_updated_at()` trigger for automated timestamp updates.

### Task 2: Officer Auth Types & Context Integration
- [x] Create `project/src/features/auth/types/officerAuth.ts` defining data contracts for profile, registration, and records.
- [x] Update `project/src/shared/context/AuthContext.tsx` with:
  - `isOfficerUser` and `officerProfile` state.
  - `signInOfficerOtp(email)` and `verifyOfficerOtp(email, token)`.
  - `registerOfficer(data)` for officer self-registration.
  - Automated officer profile loading on session initialization and state changes.

### Task 3: Officer Cloud Synchronization Service & Tests
- [x] Create `project/src/features/officers-toolkit/services/officerCloudSyncService.ts`.
  - Map local statutory orders, inspection drafts, and sampling memos to database models.
  - Implement bidirectional sync: save locally to `safeStorage`, upsert to Supabase if authenticated and online.
  - Implement batch sync (`syncAllPendingToCloud`) to flush offline records on reconnect.
  - Implement cloud history retrieval (`fetchOfficerRecords`).
- [x] Create `project/src/features/officers-toolkit/services/officerCloudSyncService.test.ts` with unit tests verifying sync, error recovery, and offline fallback.

### Task 4: Modernize Login Page with Officer Portal & OTP UI
- [x] Update `project/src/features/auth/pages/Login.tsx` to add "Officer / అధికారి" mode tab.
- [x] Build Officer Login UI:
  - OTP mode: email input, "Send OTP" button, countdown timer, 6-digit verification code input.
  - Password mode toggle for officers with existing passwords.
- [x] Build Officer Self-Registration UI:
  - Inputs for Full Name, HRMS ID, Designation (AEO, MAO, ADA, DAO), Telangana District & Mandal dropdowns, Phone, Email, and Password.
  - Seamless submission with validation and clear bilingual feedback.

### Task 5: Integrate Cloud Sync into Statutory Forms & Inspections
- [x] Connect `FertilizerStopSaleEntry.tsx`, `PesticideStopSaleEntry.tsx`, `SeedStopSaleEntry.tsx`, `FertilizerSeizureOrderEntry.tsx`, and `ShowCauseNoticeEntry.tsx` to call `officerCloudSyncService.saveOrder()`.
- [x] Add visual cloud indicator badge to statutory form headers (e.g., "🟢 Cloud Synced" / "📱 Saved Locally").

### Task 6: Build "My Records & Cloud History" Hub in Officer Toolkit
- [x] Create `project/src/features/officers-toolkit/components/OfficerRecordsHub.tsx`.
  - Tabbed viewer for Statutory Orders, Inspections, and Sampling Memos.
  - Search, filter by commodity, and quick actions (view/print, download JSON, delete).
  - Sync All button to trigger immediate batch synchronization.
- [x] Register `OfficerRecordsHub` in `OfficersToolkit.tsx` so authenticated officers have immediate 1-click access to all their saved field records.

### Task 7: Full Verification & Test Suite
- [x] Run `npx vitest run` across the entire project and ensure all tests pass (19 test files, 119 tests passed).
- [x] Run `npm run typecheck` to verify zero TypeScript errors.
- [x] Run `npm run build` to verify production bundle validity.
