# NutriScan AI

Food & Drink Calorie Scanner — scan foto makanan/minuman, dapat estimasi kalori & gizi otomatis.

Dokumen produk lengkap (PRD, SRS, SDD, UI/UX Flow, Task Breakdown) ada di [`NutriScan AI - PRD, SRS, SDD, UI UX Flow & Task Breakdown.md`](<NutriScan AI - PRD, SRS, SDD, UI UX Flow & Task Breakdown.md>).

## Struktur Repo

```
backend/     Node.js + Express + TypeScript API (proxy ke food recognition provider, business logic, DB)
frontend/    Next.js + TypeScript + Tailwind web app
docs/        Dokumentasi progres per fase
```

## Stack

- **Backend:** Node.js, Express, TypeScript
- **Database & Storage:** Supabase (PostgreSQL + Storage)
- **Auth:** JWT + guest mode
- **Food recognition:** provider `mock` (default, dev) atau `logmeal` (LogMeal API, produksi) — bisa ganti lewat `FOOD_RECOGNITION_PROVIDER` tanpa ubah struktur database
- **Frontend:** Next.js (App Router) + Tailwind CSS

## Menjalankan Lokal

### Backend

```bash
cd backend
cp .env.example .env   # isi SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev             # http://localhost:4000
```

> Belum punya Supabase project? Jalankan `cd supabase-docker && ./setup.sh` — stack Postgres +
> PostgREST + Storage self-hosted via Docker, gratis, jalan lokal. Lihat [`supabase-docker/README.md`](supabase-docker/README.md).

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev             # http://localhost:3000
```

### Database & Storage

Kalau pakai Supabase Cloud:

1. Jalankan migration `backend/supabase/migrations/0001_init.sql` lalu `0002_photo_retention.sql` (urut) di Supabase SQL editor project kamu.
2. Buat Storage bucket bernama `scan-photos` (public), sesuai `SUPABASE_STORAGE_BUCKET` di `.env`.

Kalau pakai `supabase-docker/setup.sh` (lokal), migration `0001` + langkah bucket sudah otomatis. Migration `0002` perlu dijalankan manual sekali (`docker exec -i <db-container> psql -U postgres -d postgres < backend/supabase/migrations/0002_photo_retention.sql`) kalau volume dibuat sebelum migration ini ada.

### Retensi Foto (SRS 2.3)

Foto scan gak disimpan permanen lebih dari 30 hari (`PHOTO_RETENTION_DAYS` di `.env`), cuma hasil analisis teksnya yang persist. Jalankan pembersihan manual:

```bash
cd backend
npm run cleanup:photos
```

Di production, jadwalkan ini lewat cron job hosting (Render Cron Job, Railway Cron, GitHub Actions scheduled workflow, dll) — misal tiap hari sekali. Belum diotomatisasi di repo ini karena belum ada target deploy yang fix.

### Testing End-to-End

```bash
cd backend
npm run dev          # di terminal lain, backend harus jalan dulu
npm run test:e2e     # smoke test: register -> scan -> confirm -> log -> dashboard -> update target -> delete log
```

Butuh DB yang hidup (Supabase Cloud atau `supabase-docker`), bukan mock — lihat [`docs/PHASE-5-POLISH-TESTING.md`](docs/PHASE-5-POLISH-TESTING.md).

## Progres Pengerjaan

Lihat [`docs/`](docs/) untuk dokumentasi tiap fase (sesuai Task Breakdown di dokumen PRD/SRS/SDD).

| Fase | Status |
| --- | --- |
| Fase 0 — Setup | Selesai |
| Fase 1 — Auth | Selesai |
| Fase 2 — Core Scan | Selesai |
| Fase 3 — Frontend Scan Flow | Selesai |
| Fase 4 — Log & Dashboard | Selesai |
| Fase 5 — Polish & Testing | Selesai (deploy & LogMeal asli sengaja ditunda) |
