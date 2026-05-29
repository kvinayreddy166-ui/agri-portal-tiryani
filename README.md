# Tiryani Agriculture Portal

Bilingual (English / Telugu) **Information Management System** for the **Mandal Agricultural Office (MAO), Tiryani**, Kumram Bheem Asifabad District, Telangana. Developed and maintained for field operations, farmer services, dealer regulation, subsidy tracking, and document management.

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Mandal overview, crop acreage, schemes, fertilizer stock, **3D Google Map** of Tiryani, **live weather** (temperature, humidity, rainfall, wind) |
| **Office Files** | Multi-file upload (PDF, Word, Excel, images); list view with type badges; Excel auto-imports dealers |
| **File Directory** | Unified list of all portal uploads with type filter (PDF / Excel / Image / Word) |
| **Dealer Management** | Tabs: **Fertilizer** (with IFMS ID), **Seed**, **Pesticides** (permanent validity, no IFMS); Excel import |
| **Subsidy Cell** | **NFSM** and **State Seed Cell** — year-wise quantity allotted, crop variety, sales, beneficiary list upload |
| **Crop Disease AI** | Camera capture + photo upload; TensorFlow.js or heuristic analysis with management tips |
| **Dark mode** | Toggle in header (saved in browser) |
| **Quality Control, Crops, GOs, Farm Mechanization** | Category-wise documents with view/download |

## Quick start

```bash
cd project
cp .env.example .env
# Edit .env — set VITE_SUPABASE_ANON_KEY (required for your project)
npm install
npm run dev
```

### If `npm install` or Vite fails (`@supabase/postgrest-js` error)

This often happens when the project lives in **OneDrive** and `node_modules` files are incomplete. Fix:

```bash
cd project
# Close VS Code / dev server first
Remove-Item -Recurse -Force node_modules, .vite -ErrorAction SilentlyContinue
npm install
npm run dev
```

**Best practice:** clone or copy the project to a local folder outside OneDrive (e.g. `C:\dev\agri-portal-tiryani`) for development.

Apply Supabase migrations from `supabase/migrations/` or `project/supabase/migrations/` (including storage policies and subsidy tables).

## Environment variables (`project/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes* | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Interactive 3D map (satellite + tilt); iframe fallback if unset |
| `VITE_OPENWEATHER_API_KEY` | Optional | OpenWeather data; **Open-Meteo** used automatically if unset |
| `VITE_CROP_MODEL_URL` | Optional | URL to TensorFlow.js model JSON for crop disease detection |

\*A fallback project is embedded in code for demo; use your own keys in production.

## Image uploads

- Supported: **JPG, PNG, WebP, GIF** (max 50 MB).
- **HEIC** (iPhone) is not supported by storage policy — save as JPG/PNG before upload.
- Uploads require **admin** login (`k.vinayreddy166@gmail.com` per current RLS policies).
- **View** opens an in-app preview; **Download** saves the file (fixed for Supabase cross-origin URLs).

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS, Supabase (Auth, Postgres, Storage), TensorFlow.js, SheetJS (`xlsx`).

## Contact

**K. Vinay Reddy**, MAO, Tiryani — Kumram Bheem Asifabad Division.
