# Fase 0 — Setup

Status: **Selesai**

## Tujuan

Menyiapkan fondasi repo sebelum mulai fitur (sesuai Task Breakdown Fase 0 di dokumen PRD/SRS/SDD).

## Yang Dikerjakan

- Init git repo, connect remote ke `github.com/Fadhh12/NutriScan-AI`.
- Struktur monorepo: `backend/` (Node.js + Express + TypeScript) dan `frontend/` (Next.js + TypeScript + Tailwind).
- Struktur folder backend sesuai SDD 3.4: `controllers/`, `services/`, `models/`, `routes/`, `middlewares/`, `config/`, `utils/`.
- Konfigurasi environment (`env.ts`) untuk semua parameter bisnis dari SRS: batas ukuran upload (8MB), resolusi minimum gambar (300px), threshold confidence score (60%), timeout scan (10 detik), retensi foto (30 hari).
- Express server minimal dengan endpoint `GET /api/health`, error handler global, dan security middleware dasar (`helmet`, `cors`).
- Supabase client (`config/supabase.ts`) — dipakai untuk Postgres + Storage.
- Migration awal database (`backend/supabase/migrations/0001_init.sql`) — tabel `users`, `scans`, `scan_nutrition`, `daily_logs`, `food_reference` sesuai SDD 3.2.
- Scaffold frontend Next.js (App Router, TypeScript, Tailwind CSS).

## Keputusan Teknis

- **Bahasa:** TypeScript di backend & frontend (bukan JavaScript biasa) — lebih maintainable untuk portofolio.
- **Food recognition provider:** belum ada API key LogMeal, jadi arsitektur disiapkan dengan provider `mock` sebagai default (`FOOD_RECOGNITION_PROVIDER=mock`). Provider LogMeal asli tinggal diaktifkan lewat env var tanpa ubah struktur database — sesuai requirement scalability di SRS 2.4.
- **Database & Storage:** Supabase (PostgreSQL + Storage terkelola), dipilih supaya tidak perlu setup server database lokal dan langsung siap dipakai untuk deploy nanti.

## Belum Dikerjakan (lanjut di fase berikut)

- Implementasi service `foodRecognition.service.ts` (mock) — masuk Fase 2.
- Auth register/login/JWT — Fase 1.
- Endpoint scan, log, dashboard — Fase 2–4.

## Cara Setup Lokal

1. Buat project di [supabase.com](https://supabase.com), copy `Project URL` dan `service_role key`.
2. Jalankan SQL di `backend/supabase/migrations/0001_init.sql` lewat Supabase SQL Editor.
3. `cd backend && cp .env.example .env` lalu isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.
4. `npm install && npm run dev` di `backend/` dan `frontend/`.
