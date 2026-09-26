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

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev             # http://localhost:3000
```

### Database & Storage

1. Jalankan migration `backend/supabase/migrations/0001_init.sql` di Supabase SQL editor project kamu.
2. Buat Storage bucket bernama `scan-photos` (public), sesuai `SUPABASE_STORAGE_BUCKET` di `.env`.

## Progres Pengerjaan

Lihat [`docs/`](docs/) untuk dokumentasi tiap fase (sesuai Task Breakdown di dokumen PRD/SRS/SDD).

| Fase | Status |
| --- | --- |
| Fase 0 — Setup | Selesai |
| Fase 1 — Auth | Selesai |
| Fase 2 — Core Scan | Selesai |
| Fase 3 — Frontend Scan Flow | Belum |
| Fase 4 — Log & Dashboard | Belum |
| Fase 5 — Polish & Testing | Belum |
