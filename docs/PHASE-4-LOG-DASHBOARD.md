# Fase 4 — Log & Dashboard

Status: **Selesai**

## Tujuan

Sambungkan hasil scan yang dikonfirmasi ke `daily_logs`, tambah endpoint + screen History dan Dashboard, target kalori personal, dan layar Login/Register (guest banner) sesuai Task Breakdown Fase 4.

## Backend — Yang Dikerjakan

- `PATCH /api/scan/:id/confirm` sekarang menulis baris `daily_logs` setiap kali scan dikonfirmasi (`confirmed: true` atau `foodName`), **hanya untuk request yang login** (`req.auth` ada) — guest tetap bisa scan & confirm seperti Fase 2/3, tapi tidak ada baris log (SRS 2.3: guest tidak simpan riwayat lintas sesi).
  - `mealType` opsional di body (`breakfast|lunch|dinner|snack`). Kalau tidak dikirim, di-infer dari jam saat ini (`log.service.ts` → `inferMealType`) supaya UI tidak perlu tambahan step "pilih meal type" (kolom `meal_type` di schema tetap NOT NULL terisi otomatis).
- `GET /api/logs?date=YYYY-MM-DD` (requireAuth) — daftar log user pada satu tanggal, di-join ke `scans` + `scan_nutrition` lewat PostgREST embed. Default `date` = hari ini kalau query kosong.
- `DELETE /api/logs/:id` (requireAuth) — hapus satu baris log milik user sendiri (scoped by `user_id`, 404 kalau bukan milik user).
- `GET /api/dashboard/summary` (requireAuth) — agregat kalori & makro per hari untuk 7 hari terakhir (termasuk hari ini), plus `target` dari `users.daily_calorie_target` (default 2000 kalau belum diset).
- `PATCH /api/users/me/target` (requireAuth) — update `daily_calorie_target` (validasi 800–6000 kkal, sama seperti di register, SRS 2.1).
- File baru: `services/log.service.ts`, `services/user.service.ts`, `controllers/log.controller.ts`, `controllers/dashboard.controller.ts`, `controllers/user.controller.ts`, `routes/log.routes.ts`, `routes/dashboard.routes.ts`, `routes/user.routes.ts`.

## Frontend — Yang Dikerjakan

- `lib/auth.ts` — session guest/login berbasis `localStorage` (`useAuth()` hook: `token`, `user`, `ready`, `isGuest`), tanpa Context provider karena cukup dipakai langsung di tiap page/komponen yang butuh.
- `app/login/page.tsx` — form Login/Register toggle + tombol "Lanjut sebagai Guest".
- `app/history/page.tsx` — filter tanggal, list log (foto, nama makanan, meal type, kalori), hapus per item. Guest → prompt "Buat akun untuk simpan riwayat" (SRS 2.3 / UI-UX 4.3), tidak redirect paksa.
- `app/dashboard/page.tsx` — `CalorieRing` untuk hari ini + bar chart 7 hari (CSS bar, tanpa library chart tambahan) vs target. Guest → prompt sama seperti History.
- `app/profile/page.tsx` — set target kalori harian, logout. Guest → prompt buat akun.
- `components/ui/BottomNav.tsx` — nav Home/Riwayat/Dashboard/Profil, dipasang di keempat halaman itu (bukan di `/scan`, supaya wizard scan tetap full-screen seperti Fase 3).
- `app/page.tsx` (Home) — `CalorieRing` sekarang pakai data asli dari `/dashboard/summary` kalau login; guest tetap lihat 0 + banner ajakan buat akun.
- `app/scan/page.tsx` — `submitScan`/`confirmScan` sekarang kirim header `Authorization: Bearer <token>` kalau user login, supaya scan & log tersambung ke akun (sebelumnya field ini terkirim tanpa header sama sekali, jadi walau login pun scan selalu jadi guest scan).
- `ConfirmedStep` — tambah tombol "Lihat Riwayat" kalau user login.

## Keputusan Teknis

- **Tidak ada UI pilih meal type**: schema butuh `meal_type` NOT NULL, tapi menambah step baru di wizard scan (yang sudah punya banyak state) dianggap over-scope untuk MVP — backend infer otomatis dari jam (pagi→sarapan, dst). Bisa ditambah sebagai chip selector nanti kalau user minta kontrol manual.
- **Guest tetap bisa confirm scan tanpa log tersimpan** — konsisten dengan keputusan Fase 2 (`assertScanAccessible` mengizinkan scan `user_id = null` diakses siapa pun) dan SRS 2.3.
- **Dashboard chart pakai CSS bar manual**, bukan library (Recharts/dsb) — datanya cuma 7 titik per hari, tidak butuh dependency tambahan untuk itu.
- **`BottomNav` tidak dipasang di root layout** — kalau dipasang global, wizard `/scan` (yang statenya per-step penuh) akan kepotong nav bar di setiap step. Dipasang manual per halaman yang butuh.

## Verifikasi

- Backend: `npm run typecheck` — bersih.
- Frontend: `npx tsc --noEmit`, `npm run lint`, `npm run build` — semua bersih (7 route: `/`, `/login`, `/history`, `/dashboard`, `/profile`, `/scan`, `/_not-found`).
- **End-to-end sudah dicoba dengan Supabase asli** (self-hosted via Docker, lihat [`supabase-docker/`](../supabase-docker/)) — bukan mock:
  - `POST /auth/register` → `POST /scan` (foto asli, ke-upload ke Storage API, URL publik ke-fetch balik HTTP 200) → `PATCH /scan/:id/confirm` → baris `daily_logs` kebentuk otomatis.
  - `GET /logs` — embed PostgREST `daily_logs → scans → scan_nutrition` balik dengan struktur yang benar (sempat ada concern soal cardinality object vs array di tipe TypeScript, ternyata runtime PostgREST-nya sesuai ekspektasi: `scans` singular object, `scan_nutrition` array).
  - `GET /dashboard/summary` — agregat 7 hari benar, hari yang belum ada log tampil 0 bukan hilang dari array.
  - `PATCH /users/me/target` dan `DELETE /logs/:id` — berhasil.
  - Data uji sudah di-`truncate` lagi setelah verifikasi, `.env` lokal tetap terisi kredensial dev.
- Belum dicoba visual di browser sungguhan (sama seperti catatan Fase 3) — baru verifikasi API lewat curl.

## Belum Dikerjakan

- Verifikasi visual di browser sungguhan (Home/History/Dashboard/Profile/Login).
- Testing end-to-end semua flow — Fase 5.
- Deploy — Fase 5. *(Catatan: stack Supabase Docker di sini dev-only, untuk production perlu Supabase Cloud asli atau self-host yang lebih lengkap — lihat `supabase-docker/README.md`.)*
