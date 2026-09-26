# Fase 1 — Auth

Status: **Selesai**

## Tujuan

Endpoint register/login dengan JWT, plus dukungan guest mode (sesuai Task Breakdown Fase 1 dan SRS 2.3: "User tanpa akun (guest mode) hanya bisa scan tapi riwayat tidak tersimpan lintas sesi").

## Yang Dikerjakan

- `POST /api/auth/register` — daftar akun baru (nama, email, password, opsional `dailyCalorieTarget` 800–6000 kkal sesuai SRS 2.1). Password di-hash pakai bcrypt, respons langsung berisi JWT supaya user tidak perlu login ulang.
- `POST /api/auth/login` — verifikasi email + password, dapat JWT.
- `GET /api/auth/me` — ambil profil user dari token (butuh `Authorization: Bearer <token>`).
- Validasi request body pakai `zod` (`src/utils/validation.ts`) — respons `422 VALIDATION_ERROR` kalau input tidak valid.
- Rate limit khusus endpoint auth (20 request/15 menit) untuk mencegah brute-force login.
- Dua middleware auth:
  - `requireAuth` — wajib token valid, dipakai untuk endpoint yang butuh akun asli (History/Dashboard nanti di Fase 4).
  - `optionalAuth` — token opsional, dipakai untuk endpoint scan supaya guest tetap bisa scan tanpa akun (Fase 2).
- `src/models/types.ts` — tipe TypeScript untuk semua entity DB (`User`, `Scan`, `ScanNutrition`, `DailyLog`, `FoodReference`) sesuai SDD 3.2.
- Perbaikan `config/supabase.ts` supaya server tetap bisa jalan tanpa kredensial Supabase asli (fallback + warning log) — memudahkan development sebelum project Supabase dibuat.

## Keputusan Teknis

- **Password hashing:** `bcryptjs` (pure JS, tanpa native binding) supaya tidak ada masalah build di Windows.
- **Token:** JWT stateless (`jsonwebtoken`), expiry default 7 hari (`JWT_EXPIRES_IN`).
- **Guest mode:** tidak ada tabel/endpoint terpisah untuk guest — cukup tidak mengirim token. Backend membedakan lewat `req.auth` (ada/tidaknya) di endpoint scan, bukan lewat akun dummy di database.

## Belum Dikerjakan

- Endpoint scan yang benar-benar memakai `optionalAuth` untuk membedakan guest vs user — masuk Fase 2.
- Testing end-to-end dengan Supabase project asli (perlu `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` diisi manual).
