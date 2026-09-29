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

1. Jalankan migration di `backend/supabase/migrations/` **urut nomor** (`0001`, `0002`, `0003`, dst) di Supabase SQL editor project kamu.
2. Buat Storage bucket bernama `scan-photos` (public), sesuai `SUPABASE_STORAGE_BUCKET` di `.env`.

Kalau pakai `supabase-docker/setup.sh` (lokal), migration `0001` + langkah bucket sudah otomatis. Migration setelahnya (`0002`, `0003`, ...) perlu dijalankan manual sekali per migration kalau volume dibuat sebelum migration itu ada: `docker exec -i <db-container> psql -U postgres -d postgres < backend/supabase/migrations/000X_nama.sql`.

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

### Data Demo

Biar History/Dashboard gak kosong pas pertama buka:

```bash
cd backend
npm run seed:demo
```

Bikin (atau reset kalau udah ada) akun `demo@nutriscan.ai` / `demo12345` dengan riwayat scan 7 hari terakhir (makanan asli dari `src/data/foodDataset.ts`, foto placeholder warna solid — bukan foto makanan asli, cuma biar thumbnail-nya keisi). Aman dijalankan berkali-kali, nge-reset riwayat demo user itu doang.

## AI Nutrition Insight

Dashboard nampilin insight harian dari LLM berdasarkan data 7 hari terakhir (kalori vs target, rata-rata protein), di-cache sekali per hari per user (`ai_insights` table) biar gak nge-hit API tiap buka halaman.

- `AI_INSIGHT_PROVIDER=mock` (default) — deterministik, jalan tanpa API key apapun.
- `AI_INSIGHT_PROVIDER=gemini` + `GEMINI_API_KEY` (gratis di [aistudio.google.com](https://aistudio.google.com/app/apikey)) — insight beneran dari Gemini.

## Deploy

### Backend + Cron (Render)

Repo punya [`render.yaml`](render.yaml) (Render Blueprint) yang bikin dua service sekaligus:

1. `nutriscan-backend` — web service, `npm run build` lalu `npm start`, health check di `/api/health`.
2. `nutriscan-photo-cleanup` — cron job harian (`0 19 * * *` UTC = 02:00 WIB) yang jalanin retensi foto (SRS 2.3), pengganti `npm run cleanup:photos` manual.

Cara pakai:

1. Push repo ini ke GitHub (udah).
2. Di [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**, pilih repo ini.
3. Render baca `render.yaml` otomatis, bikin kedua service. Env var yang ditandai `sync: false` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`, `GEMINI_API_KEY`) harus diisi manual di dashboard — isinya sama kayak `backend/.env` lokal. `JWT_SECRET` di-generate otomatis oleh Render.
4. Set `CORS_ORIGIN` ke URL frontend (langkah berikutnya) setelah itu ke-deploy.

### Frontend (Vercel)

Next.js paling gampang di Vercel (zero-config):

1. [Vercel Dashboard](https://vercel.com/new) → import repo ini, set **Root Directory** ke `frontend`.
2. Env var: `NEXT_PUBLIC_API_BASE_URL` = URL backend Render + `/api` (misal `https://nutriscan-backend.onrender.com/api`).
3. Deploy. Setelah dapet domain Vercel-nya, balik ke Render dan set `CORS_ORIGIN` backend ke domain itu.

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
