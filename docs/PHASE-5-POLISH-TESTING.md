# Fase 5 — Polish & Testing

Status: **Sebagian jalan** (testing end-to-end backend selesai; deploy & verifikasi visual browser masih ketahan blocker eksternal)

## Yang Dikerjakan

### Testing end-to-end (backend)

`backend/src/scripts/e2eSmoke.ts` (`npm run test:e2e`) — script smoke test yang jalanin flow penuh lawan backend + DB yang benar-benar hidup (bukan mock): register → scan (foto asli ke-upload ke Storage, URL-nya dicek balik bisa di-fetch) → confirm → cek log muncul di `/logs` → cek `/dashboard/summary` kebentuk bener → update target kalori → hapus log. 10/10 assertion lolos waktu dites lawan `supabase-docker` stack.

Ini bukan pengganti unit test (repo belum punya test framework/Jest/Vitest) — cuma jaring pengaman cepat buat mastiin wiring antar service (auth, scan, storage, logs, dashboard) gak putus setelah ada perubahan.

### Verifikasi frontend (level HTTP, bukan visual)

Gak ada tool browser (Chrome extension / built-in browser) yang connect di sesi ini, jadi screenshot/visual check asli belum bisa dilakuin. Yang udah dicek:

- `npm run build` — bersih, 7 route ter-generate.
- `npm run start` + curl ke tiap route (`/`, `/login`, `/history`, `/dashboard`, `/profile`, `/scan`) — semua HTTP 200, dan HTML-nya mengandung teks kunci yang benar (bukan halaman kosong/error boundary).

**Belum diverifikasi:** tampilan visual sungguhan (proporsi layout, dark mode, crop foto kamera di device asli) — perlu dicek manual oleh yang punya akses browser/device, atau lewat sesi Claude Code yang punya Chrome extension / built-in browser aktif.

## Belum Dikerjakan (blocker eksternal, butuh keputusan/kredensial user)

- **Deploy backend + frontend** — perlu pilih hosting (Render/Railway/Fly untuk backend, Vercel untuk frontend, dst) dan kredensial akun. Belum dilakuin karena belum ada keputusan platform dari user.
- **Verifikasi provider LogMeal asli** — perlu API key LogMeal (akun pihak ketiga). Backend masih pakai provider `mock` (deterministik, lihat Fase 2 doc).
- **Optimasi loading time & UX kecil** — belum digarap detail; kandidat: skeleton loading di History/Dashboard saat fetch, debounce input manual correction, dsb.
- **Job retensi foto otomatis (cron)** — job-nya sendiri sudah selesai & teruji (Fase 2 doc bagian Update), tapi belum dijadwalkan otomatis karena belum ada host untuk cron-nya.
