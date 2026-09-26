# Fase 5 — Polish & Testing

Status: **Selesai untuk scope MVP** (deploy & LogMeal asli sengaja ditunda — keputusan user, bukan blocker)

## Yang Dikerjakan

### Testing end-to-end (backend)

`backend/src/scripts/e2eSmoke.ts` (`npm run test:e2e`) — script smoke test yang jalanin flow penuh lawan backend + DB yang benar-benar hidup (bukan mock): register → scan (foto asli ke-upload ke Storage, URL-nya dicek balik bisa di-fetch) → confirm → cek log muncul di `/logs` → cek `/dashboard/summary` kebentuk bener → update target kalori → hapus log. 10/10 assertion lolos waktu dites lawan `supabase-docker` stack.

Ini bukan pengganti unit test (repo belum punya test framework/Jest/Vitest) — cuma jaring pengaman cepat buat mastiin wiring antar service (auth, scan, storage, logs, dashboard) gak putus setelah ada perubahan.

### Verifikasi frontend (level HTTP, bukan visual)

Gak ada tool browser (Chrome extension / built-in browser) yang connect di sesi ini, jadi screenshot/visual check asli belum bisa dilakuin. Yang udah dicek:

- `npm run build` — bersih, 7 route ter-generate.
- `npm run start` + curl ke tiap route (`/`, `/login`, `/history`, `/dashboard`, `/profile`, `/scan`) — semua HTTP 200, dan HTML-nya mengandung teks kunci yang benar (bukan halaman kosong/error boundary).

**Belum diverifikasi:** tampilan visual sungguhan (proporsi layout, dark mode, crop foto kamera di device asli) — perlu dicek manual oleh yang punya akses browser/device, atau lewat sesi Claude Code yang punya Chrome extension / built-in browser aktif.

## Sengaja Ditunda (keputusan user, 2026-09-26)

- **Deploy backend + frontend** — ditunda. App udah full jalan lokal (Docker Supabase + dev server), cukup buat demo/portofolio dulu. Kalau nanti mau deploy: backend butuh host yang support long-running Node process + cron (Render/Railway/Fly), frontend ke Vercel. Job retensi foto (`npm run cleanup:photos`) juga baru bisa dijadwalkan otomatis setelah ada host.
- **Provider LogMeal asli** — ditunda, tetap pakai provider `mock` (deterministik, lihat Fase 2 doc). Sesuai rekomendasi PRD 6.4: validasi produk dulu sebelum invest ke API pihak ketiga berbayar. Tinggal set `FOOD_RECOGNITION_PROVIDER=logmeal` + `LOGMEAL_API_KEY` kapan pun mau aktifin, tanpa ubah struktur database (itu emang tujuan arsitektur ini dari awal).

## Belum Dikerjakan

- **Optimasi loading time & UX kecil** — belum digarap detail; kandidat: skeleton loading di History/Dashboard saat fetch, debounce input manual correction, dsb.
