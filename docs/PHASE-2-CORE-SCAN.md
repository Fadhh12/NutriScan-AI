# Fase 2 — Core Scan

Status: **Selesai**

## Tujuan

Endpoint upload foto + deteksi makanan + nutrisi, dengan handling error/timeout/low-confidence sesuai SRS.

## Yang Dikerjakan

- `POST /api/scan` — upload foto (`multipart/form-data`, field `photo`):
  - Validasi tipe file (JPG/PNG/WEBP) & ukuran maks 8MB lewat `multer` (SRS 2.1).
  - Validasi resolusi minimum 300x300px pakai `sharp` — di bawah itu ditolak `422 IMAGE_RESOLUTION_TOO_LOW` (SRS 2.1).
  - Upload foto ke Supabase Storage (`services/storage.service.ts`), lalu foto dikirim ke food recognition provider.
  - Timeout 10 detik untuk provider (`recognizeWithTimeout`, SRS 2.2) — kalau lewat, respons `504 PROVIDER_TIMEOUT`, bukan hang tanpa feedback.
  - Kalau bukan makanan terdeteksi → `422 NOT_FOOD` ("Tidak terdeteksi makanan, coba foto ulang").
  - Kalau confidence score top candidate < 60% → response menyertakan `candidates` (2-3 alternatif + nutrisi masing-masing) supaya user pilih manual, bukan langsung tampilkan satu hasil (SRS 2.1).
  - Hasil scan selalu tersimpan dengan status `pending` dulu (draft) — baru masuk log resmi setelah dikonfirmasi (SRS 2.2). *(Endpoint penulisan ke `daily_logs` sendiri baru dibuat di Fase 4.)*
  - Rate limit 1 request / 3 detik per user (per `user_id` kalau login, per IP kalau guest) untuk melindungi kuota API pihak ketiga (SRS 2.1).
- `GET /api/scan/:id` — ambil detail scan + nutrisi. Guest scan (`user_id` null) bisa diakses siapa saja yang tahu id-nya; scan milik akun hanya bisa diakses pemiliknya (`403 SCAN_FORBIDDEN`).
- `PATCH /api/scan/:id/confirm` — tiga mode:
  - `{ confirmed: true }` — terima hasil deteksi apa adanya.
  - `{ foodName, portionEstimateG? }` — koreksi manual (pilih dari alternatif atau nama lain), nutrisi dihitung ulang.
  - `{ rejected: true }` — buang hasil scan (foto salah total, user akan foto ulang dari sisi client).
- `services/foodRecognition.service.ts` — abstraksi provider (`FoodRecognitionProvider` interface):
  - Provider `mock` (default): deterministik berdasarkan hash byte foto, supaya foto yang sama selalu menghasilkan hasil yang sama saat demo/testing. Confidence bervariasi 0.4–0.97 supaya kedua alur (langsung confirm vs pilih alternatif) bisa dites.
  - Provider `logmeal`: scaffold mengikuti bentuk API LogMeal v2 (docs.logmeal.com) — **belum diverifikasi** dengan API key asli, tinggal aktifkan lewat `FOOD_RECOGNITION_PROVIDER=logmeal` + `LOGMEAL_API_KEY` saat sudah ada akun, sesuai requirement scalability di SRS 2.4 (ganti provider tanpa ubah struktur database).
- `services/nutrition.service.ts` — resolve kalori/makro dari cache `food_reference` dulu, fallback ke dataset lokal (`src/data/foodDataset.ts`, 12 makanan umum Indonesia), lalu cache hasil dataset lokal ke `food_reference` supaya lookup berikutnya lebih cepat.

## Keputusan Teknis

- **Kenapa mock provider deterministik (bukan random murni):** supaya demo dan automated testing bisa reproducible — foto yang sama selalu menampilkan hasil yang sama, tapi tetap ada variasi confidence untuk menguji jalur low-confidence.
- **Retensi foto 30 hari (SRS 2.3):** belum diimplementasi sebagai job otomatis di fase ini — perlu scheduled cleanup (cron/Supabase Edge Function) yang akan ditambahkan di Fase 5 (Polish).
- **Ownership scan untuk guest:** guest scan (`user_id = null`) sengaja bisa diakses tanpa auth check ketat, karena guest memang tidak py akun untuk dicocokkan — sesuai model "riwayat tidak tersimpan lintas sesi" (client cukup tidak menyimpan id scan setelah sesi berakhir).

## Cara Uji Manual

```bash
curl -X POST http://localhost:4000/api/scan -F "photo=@contoh.jpg;type=image/jpeg"
curl -X PATCH http://localhost:4000/api/scan/<id>/confirm -H "Content-Type: application/json" -d '{"confirmed": true}'
```

Perlu `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` (project asli + bucket storage `scan-photos` dibuat public) supaya upload & simpan ke DB berhasil — sudah dicoba dan tervalidasi jalur validasi/error-nya tanpa kredensial asli (upload akan gagal terkontrol dengan pesan jelas, bukan crash).

## Belum Dikerjakan

- Penulisan ke `daily_logs` saat confirm — Fase 4.
- Job pembersihan foto lama (retensi 30 hari) — Fase 5.
- Verifikasi nyata provider LogMeal dengan API key asli.
