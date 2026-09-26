# Supabase (self-hosted, Docker) — dev only

Bukan clone stack resmi Supabase (Auth/Realtime/Edge Functions gak kepake, karena backend
punya JWT auth sendiri — lihat `backend/src/services/auth.service.ts`). Ini stack minimal
buatan sendiri, cuma 3 service + 1 gateway, cukup buat kebutuhan backend:

- **db** — Postgres 15, otomatis jalanin `00-roles.sql` (role `anon`/`authenticated`/`service_role`/`authenticator`) + `backend/supabase/migrations/0001_init.sql` saat pertama kali start.
- **rest** — PostgREST, expose tabel `public.*` sebagai REST API (yang dipanggil `@supabase/supabase-js` di backend).
- **storage** — `supabase/storage-api`, nyimpen foto scan. Self-migrate schema `storage` sendiri saat start.
- **gateway** — nginx, satu-satunya port yang diexpose (`55321`), routing `/rest/v1/*` → rest, `/storage/v1/*` → storage. Ini yang jadi `SUPABASE_URL`.

## Pakai

```bash
cd supabase-docker
./setup.sh          # docker compose up -d + grant storage schema + bikin bucket scan-photos
```

Setelah selesai, `backend/.env` sudah otomatis diisi (lihat root README). Kalau reset volume
(`docker compose down -v`), jalankan `setup.sh` lagi — grant schema `storage` & bucket harus
dibuat ulang karena `storage` schema baru ada setelah container `storage` jalan (bukan pas
`db` init pertama kali).

## Kenapa perlu grant manual ke schema `storage`

`storage-api` connect ke Postgres pakai role `postgres` (superuser), tapi tetap `SET ROLE
service_role` per-request buat konsisten sama RLS Supabase asli. Role `service_role` cuma
di-grant ke schema `public` di `00-roles.sql` (dibuat sebelum `storage` schema ada), makanya
butuh grant tambahan setelah `storage-api` bikin schema-nya sendiri — itu yang dilakukan
`setup.sh`.

## Port

- `55321` — gateway (REST + Storage), ini `SUPABASE_URL`
- `55432` — Postgres langsung (buat psql/DB client kalau perlu debug)

Port non-standar (bukan 54321/54322 default Supabase CLI) karena port itu kebentur izin
socket di environment ini.

## Secrets

`.env` di folder ini (gitignored) isi `JWT_SECRET`, `POSTGRES_PASSWORD`, `ANON_KEY`,
`SERVICE_ROLE_KEY` — dev-only, jangan dipakai di production.
