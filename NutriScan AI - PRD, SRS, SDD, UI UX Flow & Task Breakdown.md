# NutriScan AI

### Food & Drink Calorie Scanner

Sep 26, 2026 · Disusun oleh @nabil

**NutriScan AI** adalah aplikasi (web/mobile) yang memungkinkan pengguna memindai foto makanan, minuman, buah, atau sayur, lalu secara otomatis mendapatkan estimasi kalori dan kandungan gizi (protein, karbohidrat, lemak, serat, dll) dari objek tersebut — tanpa perlu input manual satu per satu.

Tujuan utamanya: membantu siapa saja memantau asupan gizi harian secara cepat dan praktis, sekaligus menjadi portofolio project AI/computer vision yang punya nilai guna nyata dan bisa dipakai orang lain, bukan sekadar demo internal.

---

## 1. PRD (Product Requirements Document)

### 1.1 Tujuan Produk

- Memudahkan pengguna mengetahui kandungan kalori & gizi makanan/minuman hanya lewat foto, tanpa cari manual di internet atau kemasan.
- Mendorong kebiasaan makan yang lebih sadar (mindful eating) dengan data yang cepat didapat.
- Jadi produk nyata yang bisa dipakai publik (bukan hanya proyek kuliah/bootcamp), sehingga bisa jadi portofolio kuat.

### 1.2 Target User

- **Primary:** individu yang sedang diet/jaga berat badan dan ingin tracking kalori harian tanpa ribet.
- **Secondary:** atlet/gym-goers yang perlu tracking makro (protein, karbo, lemak) untuk bulking/cutting.
- **Tertiary:** masyarakat umum yang penasaran kandungan gizi makanan sehari-hari.

### 1.3 Fitur

**MVP (v1):**

- Scan foto makanan/minuman via kamera atau upload galeri
- Deteksi jenis makanan + estimasi porsi
- Hasil kalori & makro nutrisi (protein, karbo, lemak, serat)
- Koreksi manual jika hasil deteksi salah (user bisa pilih dari daftar alternatif)
- Riwayat scan harian (log makanan)
- Dashboard ringkasan kalori harian vs target

**Next version (v2+):**

- Scan barcode untuk minuman/makanan kemasan (data dari Open Food Facts/Nutritionix)
- Rekomendasi menu berdasarkan sisa kalori harian
- Target kalori & makro personal (berdasarkan berat badan, tinggi, aktivitas)
- Fitur share progress ke teman / sosial media
- Multi-item detection (beberapa makanan dalam satu piring)

### 1.4 High-Level User Flow

1. User buka app → onboarding singkat (opsional set target kalori)
2. Login/Register (atau guest mode untuk MVP awal)
3. Halaman Home → tombol "Scan Makanan"
4. Ambil foto / upload → sistem proses (loading beberapa detik)
5. Tampilkan hasil: nama makanan terdeteksi, estimasi porsi, kalori & makro
6. User bisa koreksi/konfirmasi → simpan ke log harian
7. User lihat riwayat & dashboard ringkasan (grafik kalori per hari/minggu)

---

## 2. SRS (System Requirements Specification)

### 2.1 Validasi

- Format file gambar: hanya JPG/PNG/WEBP, maks ukuran 8MB.
- Resolusi minimum gambar: 300x300px (di bawah itu, tolak & minta foto ulang).
- Confidence score dari model/API < 60% → sistem tidak langsung tampilkan hasil, tapi tampilkan 2-3 kandidat alternatif untuk dipilih user.
- Input target kalori manual (jika ada): harus angka positif, range wajar 800–6000 kkal/hari.
- Rate limit: maksimum 1 scan per 3 detik per user (mencegah spam ke API pihak ketiga).

### 2.2 Behavior

- Jika API food recognition gagal/timeout (>10 detik) → tampilkan pesan error + tombol "coba lagi", jangan biarkan user menunggu tanpa feedback.
- Jika objek dalam foto terdeteksi bukan makanan/minuman → tampilkan pesan "Tidak terdeteksi makanan, coba foto ulang".
- Hasil scan otomatis tersimpan sebagai draft, baru masuk ke log resmi setelah user konfirmasi (supaya user bisa koreksi dulu).
- Riwayat harian direset tampilannya tiap jam 00:00 waktu lokal user, tapi data tetap tersimpan di database.
- Kalau kuota API pihak ketiga (mis. LogMeal) habis → sistem fallback ke pesan "layanan sedang penuh, coba beberapa saat lagi", bukan crash.

### 2.3 Aturan Aplikasi

- Satu akun = satu profil nutrisi (tidak ada multi-profile di MVP).
- Data foto yang diupload tidak disimpan permanen di server lebih dari 30 hari (hanya hasil analisis/teks yang disimpan permanen) — pertimbangan privasi & biaya storage.
- User tanpa akun (guest mode) hanya bisa scan tapi riwayat tidak tersimpan lintas sesi.
- Unit yang dipakai konsisten: gram untuk berat, kkal untuk energi (bukan kJ).

### 2.4 Non-Functional Requirements

- **Performance:** hasil scan tampil maksimal 5 detik (termasuk waktu request ke API eksternal).
- **Availability:** target uptime backend 99% (untuk MVP, tanpa SLA formal).
- **Security:** komunikasi via HTTPS, API key pihak ketiga disimpan di environment variable (server-side), tidak pernah expose ke client.
- **Scalability:** arsitektur harus bisa ganti provider food-recognition (LogMeal → model sendiri) tanpa ubah struktur database utama.
- **Usability:** flow dari buka app sampai dapat hasil kalori maksimal 3 tap/klik.

---

## 3. SDD (System Design Document)

### 3.1 Arsitektur Sistem

```
[Client: Web/Mobile App]
        |
        v (HTTPS/REST)
[Backend API Server] --- [Database (User, Scan, Log)]
        |
        v
[Food Recognition Service]
   - MVP: LogMeal API (pihak ke-3)
   - Future: Model sendiri (ViT/CNN) di server terpisah
        |
        v
[Nutrition Data Source]
   - Response nutrisi dari LogMeal, atau
   - Database nutrisi lokal (hasil scrape USDA FoodData Central) sebagai cache/fallback
```

Pola: **Client → Backend (proxy + business logic) → 3rd-party AI API → balik ke Backend → simpan ke DB → response ke Client.** Client tidak pernah panggil API pihak ketiga langsung (supaya API key aman & bisa ganti provider tanpa update app).

### 3.2 Database Schema (garis besar)

**users**

- id, name, email, password\_hash, daily\_calorie\_target, created\_at

**scans**

- id, user\_id (FK), image\_url, detected\_food\_name, confidence\_score, portion\_estimate\_g, status (pending/confirmed/rejected), created\_at

**scan\_nutrition**

- id, scan\_id (FK), calories, protein\_g, carbs\_g, fat\_g, fiber\_g, sugar\_g

**daily\_logs**

- id, user\_id (FK), scan\_id (FK), log\_date, meal\_type (breakfast/lunch/dinner/snack)

**food\_reference** (cache lokal, opsional)

- id, food\_name, calories\_per\_100g, protein\_per\_100g, carbs\_per\_100g, fat\_per\_100g, source

### 3.3 API Endpoints (contoh)

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | /auth/register | Daftar akun baru |
| POST | /auth/login | Login, dapat token |
| POST | /scan | Upload foto, trigger deteksi + nutrisi |
| GET | /scan/:id | Ambil detail hasil scan |
| PATCH | /scan/:id/confirm | Konfirmasi/koreksi hasil scan → masuk log |
| GET | /logs?date= | Riwayat log per tanggal |
| GET | /dashboard/summary | Ringkasan kalori harian/mingguan |
| PATCH | /users/me/target | Update target kalori harian |

### 3.4 Struktur Backend (contoh, Node.js/Express)

```
src/
  controllers/   → auth.controller.js, scan.controller.js, log.controller.js
  services/      → foodRecognition.service.js (wrapper ke LogMeal API), nutrition.service.js
  models/        → User.js, Scan.js, DailyLog.js
  routes/        → auth.routes.js, scan.routes.js, log.routes.js
  middlewares/   → auth.middleware.js, upload.middleware.js, rateLimit.middleware.js
  config/        → db.js, env.js
  utils/         → response.js, logger.js
```

Stack yang disarankan untuk kecepatan development: **Backend** Node.js (Express) atau Laravel; **Database** PostgreSQL/MySQL; **Storage foto** S3-compatible (Cloudflare R2/Supabase Storage) dengan auto-delete setelah 30 hari; **Frontend** React/Next.js (web) atau Flutter (kalau mau langsung mobile).

---

## 4. UI/UX Flow

### 4.1 Daftar Screen

1. **Splash/Onboarding** — logo, penjelasan singkat 2-3 slide, tombol "Mulai"
2. **Login/Register** — email+password, atau opsi "Lanjut sebagai Guest"
3. **Home** — greeting, ringkasan kalori hari ini (progress bar), tombol besar "Scan Makanan"
4. **Camera/Upload** — live camera preview + tombol upload dari galeri
5. **Loading/Processing** — animasi singkat sambil menunggu hasil API
6. **Scan Result** — foto, nama makanan terdeteksi, porsi estimasi, kalori & makro (chart sederhana), tombol "Ini benar" / "Bukan ini, pilih lain"
7. **Manual Correction** — daftar alternatif makanan mirip (dari confidence score API) atau search manual
8. **History/Log** — list makanan yang di-log per hari, bisa filter tanggal, swipe untuk hapus
9. **Dashboard** — grafik kalori & makro mingguan/bulanan, perbandingan vs target
10. **Profile/Settings** — set target kalori, ganti unit, logout, hapus akun

### 4.2 Alur Utama (Happy Path)

```
Splash → Login/Guest → Home
   → tap "Scan Makanan" → Camera/Upload
   → ambil/pilih foto → Loading (≤5 detik)
   → Scan Result
        ├─ user tap "Ini benar" → tersimpan ke Log → balik ke Home (progress kalori update)
        └─ user tap "Bukan ini" → Manual Correction → pilih yang benar → tersimpan ke Log → Home
```

### 4.3 Alur Alternatif (Error/Edge Case)

- Foto bukan makanan → tampil pesan error di layar Scan Result, tombol "Foto Ulang" balik ke Camera.
- API timeout/gagal → tampil pesan error + tombol "Coba Lagi" (retry request tanpa foto ulang selama foto masih ada di cache).
- Guest mode coba akses History/Dashboard → prompt "Buat akun untuk simpan riwayat".

---

## 5. Task Breakdown

| Fase | Task | Estimasi | Prioritas |
| --- | --- | --- | --- |
| **Fase 0 — Setup** | Setup repo, struktur folder backend & frontend, env config | 1 hari | Wajib |
|  | Setup database (schema di atas) + migration | 1 hari | Wajib |
|  | Daftar & konfigurasi API key LogMeal (free tier) | 0.5 hari | Wajib |
| **Fase 1 — Auth** | Endpoint register/login + JWT auth | 1-2 hari | Wajib |
|  | Guest mode (tanpa akun) | 0.5 hari | Nice-to-have |
| **Fase 2 — Core Scan** | Endpoint upload foto + integrasi LogMeal API | 2-3 hari | Wajib |
|  | Simpan hasil scan + nutrisi ke DB | 1 hari | Wajib |
|  | Handle error/timeout/low-confidence (sesuai SRS) | 1 hari | Wajib |
| **Fase 3 — Frontend Scan Flow** | Screen Camera/Upload | 1-2 hari | Wajib |
|  | Screen Scan Result + Manual Correction | 2 hari | Wajib |
|  | Loading state & error state UI | 1 hari | Wajib |
| **Fase 4 — Log & Dashboard** | Endpoint + screen History/Log harian | 1-2 hari | Wajib |
|  | Endpoint + screen Dashboard (grafik mingguan) | 2 hari | Wajib |
|  | Set target kalori personal | 0.5 hari | Nice-to-have |
| **Fase 5 — Polish & Testing** | Testing end-to-end semua flow | 1-2 hari | Wajib |
|  | Optimasi loading time & UX kecil | 1 hari | Nice-to-have |
|  | Deploy (backend + frontend) | 1 hari | Wajib |
| **Fase 6 — v2 (opsional)** | Barcode scan minuman kemasan | 3+ hari | Later |
|  | Rekomendasi menu otomatis | 3+ hari | Later |
|  | Model recognition sendiri (ganti LogMeal) | 2+ minggu | Later |

**Total estimasi MVP (Fase 0-5): \~3-4 minggu** kerja part-time (realistis untuk dikerjakan sambil kuliah/kerja).

---

## 6. Rekomendasi & Referensi Teknis

### 6.1 Kenapa pakai API pihak ketiga dulu (bukan model sendiri)

Untuk project yang mau "terbukti works" dan bisa langsung dipakai orang lain, membangun model deep learning food-recognition dari nol butuh waktu lama (training, dataset besar, tuning akurasi) dan hasilnya belum tentu reliable di awal. Pendekatan yang sudah terbukti berjalan di industri: pakai API food-recognition yang sudah matang, fokus effort di produk & pengalaman user.

### 6.2 API yang direkomendasikan

- **LogMeal API** — API food recognition paling matang untuk kasus ini: dari foto langsung dapat nama dish, ingredients, dan hingga 39 indikator nutrisi (kalori, protein, karbo, lemak, serat, vitamin, mineral). Ada free tier untuk mulai development. Dokumentasi: docs.logmeal.com
- **USDA FoodData Central** — database nutrisi resmi pemerintah AS, gratis, bagus sebagai fallback/cache lokal kalau mau kurangi ketergantungan API berbayar.
- **Open Food Facts API** — gratis, database produk kemasan (bagus untuk fitur barcode scan minuman/makanan kemasan di v2).

### 6.3 Referensi project GitHub (kalau nanti mau bangun model sendiri)

- `Gopi1603/Food-Recognition-and-Calorie-Estimation` — Vision Transformer + Mask R-CNN, 251 kategori makanan, sekaligus estimasi porsi & kalori. Referensi paling relevan kalau serius ke arah model sendiri.
- `meghanamreddy/Calorie-estimation-from-food-images-OpenCV` — pendekatan classical CV (edge detection, segmentation) dengan objek kalibrasi untuk estimasi volume, tanpa perlu GPU besar. Bagus untuk belajar konsep dasar sebelum masuk deep learning.
- Dataset yang umum dipakai: **Food-101**, **FoodX-251**, **Nutrition5k** (khusus Nutrition5k, sudah ada ground-truth kalori & makro per gambar — dari Google Research).

### 6.4 Saran Urutan Eksekusi

1. Bangun MVP dengan LogMeal API dulu (fokus ke UX, database, dan flow lengkap dari scan → log → dashboard).
2. Rilis ke beberapa teman/user awal untuk validasi apakah orang benar-benar mau pakai.
3. Kalau traksi bagus dan mau kurangi biaya API/tingkatkan kontrol, baru investasi waktu bangun model sendiri (pakai referensi GitHub di atas) sebagai pengganti LogMeal — arsitektur backend di atas sudah didesain supaya swap ini tidak perlu ubah struktur database.
