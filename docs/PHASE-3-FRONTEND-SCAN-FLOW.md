# Fase 3 — Frontend Scan Flow

Status: **Selesai**

## Tujuan

Bangun UI scan lengkap (Camera/Upload → Loading → Scan Result → Manual Correction) dengan desain rapi, plus Home sebagai entry point, sesuai UI/UX Flow di dokumen produk.

## Desain

- **Palet:** aksen emerald (bukan ungu/gradient generik ala AI) di atas neutral stone/zinc — asosiasi kesehatan & nutrisi, kontras WCAG AA terjaga di light & dark mode.
- **Tipografi:** Geist Sans (UI) + Geist Mono (angka kalori/makro, `tabular-nums`) — sudah bawaan scaffold Next.js, di-self-host lewat `next/font`.
- **Ikon:** `@phosphor-icons/react` (satu keluarga ikon konsisten, bukan SVG hand-rolled).
- **Bentuk:** radius terkunci — kartu `rounded-card` (20px), tombol pill (`rounded-full`), konsisten di semua komponen.
- **Layout:** mobile-first, shell `max-w-md` di tengah (app terasa seperti aplikasi kesehatan mobile, bukan landing page desktop).
- **Dark mode:** otomatis ikut `prefers-color-scheme`, token warna didefinisikan di `globals.css` (`@theme inline`).

## Yang Dikerjakan

- `app/page.tsx` — Home: greeting, `CalorieRing` (progress kalori harian vs target), CTA besar "Scan Makanan".
- `app/scan/page.tsx` — orkestrator state machine untuk seluruh alur scan (client component), state: `capture → loading → result | correction → confirmed`, plus `error` di setiap titik yang bisa gagal.
- Komponen per step (`components/scan/`):
  - `CaptureStep` — pilih dari kamera (`capture="environment"`) atau galeri, preview sebelum submit.
  - `LoadingStep` — foto preview + spinner, bukan generic centered spinner kosong.
  - `ResultStep` — foto, nama makanan, confidence %, kalori besar, breakdown makro (`MacroBreakdown`), tombol "Ini benar" / "Bukan ini, pilih lain".
  - `CorrectionStep` — daftar 2-3 alternatif (dari `candidates` response low-confidence) + form cari manual (nama + porsi gram) sebagai fallback, sesuai UI/UX Flow 4.1 poin 7.
  - `ConfirmedStep` — konfirmasi tersimpan + CTA scan lagi / kembali Home.
  - `ErrorStep` — pesan jelas + tombol aksi kontekstual (`Coba Lagi` vs `Foto Ulang`/`Pilih Foto Lain`), lihat `lib/errorMessages.ts`.
- `lib/api.ts` — client fetch wrapper ke backend (`submitScan`, `confirmScan`), melempar `ApiError` terstruktur (message + code) supaya UI bisa menampilkan pesan yang tepat, bukan generic "something went wrong".
- `lib/errorMessages.ts` — pemetaan kode error backend → pesan Indonesia + aksi (retry vs pilih ulang foto), mengikuti SRS 2.2 (timeout → "coba lagi", kuota habis → "layanan sedang penuh").
- Komponen dasar (`components/ui/Button.tsx`, `Card.tsx`) dan komponen nutrisi (`CalorieRing.tsx`, `MacroBreakdown.tsx`) yang dipakai ulang di Home & Result.

## Keputusan Teknis

- **Satu route `/scan` untuk seluruh wizard** (bukan halaman terpisah per step) — state (file foto, hasil scan) tetap ada di memori client selama proses, jadi retry setelah error tidak perlu foto ulang (SRS 2.2: "retry request tanpa foto ulang selama foto masih ada di cache").
- **Home belum terhubung ke data log sungguhan** — `CalorieRing` masih pakai `consumedToday = 0` statis karena endpoint ringkasan kalori harian baru dibuat di Fase 4. Begitu endpoint dashboard tersedia, tinggal ganti sumber datanya, UI-nya sudah siap.
- **Belum ada screen Login/Register** — MVP frontend saat ini guest-only (konsisten dengan backend `optionalAuth`), sesuai fokus Task Breakdown Fase 3 yang tidak eksplisit meminta layar auth. Layar login akan ditambahkan bersamaan History/Dashboard di Fase 4, karena itu titik di mana akun sungguhan mulai dibutuhkan (guest tidak bisa akses riwayat, SRS 2.3).

## Verifikasi

- `npx tsc --noEmit` — bersih.
- `npm run lint` — bersih (0 warning setelah cleanup).
- `npm run build` — berhasil, 3 route ter-generate (`/`, `/scan`, `/_not-found`).
- `npm run start` + `curl` ke `/` dan `/scan` — keduanya HTTP 200 dan mengandung teks yang diharapkan ("Scan Makanan", "Scan Sekarang").
- **Belum diverifikasi visual di browser sungguhan** — sesi ini tidak punya akses tool browser (Chrome extension / built-in browser tidak terhubung). Rekomendasi: jalankan `npm run dev` di kedua folder lalu cek manual di browser sebelum anggap tampilannya final, terutama proporsi CalorieRing dan crop foto kamera di HP asli.

## Belum Dikerjakan

- Koneksi ke data log/dashboard sungguhan — Fase 4.
- Layar Login/Register/Guest banner — Fase 4 (bersamaan History/Dashboard).
