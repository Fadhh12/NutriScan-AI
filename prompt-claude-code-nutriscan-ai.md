# Prompt untuk Claude Code — NutriScan AI

Aku mau kamu bantu bangun project bernama "NutriScan AI" — sebuah aplikasi web yang bisa scan foto makanan/minuman/buah/sayur lalu menampilkan estimasi kalori dan kandungan gizi (protein, karbohidrat, lemak, serat) secara otomatis.

Dokumen lengkap (PRD, SRS, SDD, UI/UX Flow, Task Breakdown) ada di sini, baca dan pahami dulu semuanya sebelum mulai kerja:
https://claude.ai/code/artifact/b9b58c2e-2962-4611-b653-f44069a9e1ba

Ringkasan penting dari dokumen itu:
- Target: MVP dulu, fokus di flow scan → hasil kalori/gizi → koreksi manual → log harian → dashboard ringkasan.
- Food recognition pakai LogMeal API (free tier) sebagai provider awal — jangan bangun model ML sendiri dulu.
- Arsitektur: Client → Backend (proxy + business logic) → LogMeal API → simpan ke DB → response ke client. API key LogMeal HARUS di server-side, jangan pernah expose ke client.
- Database: users, scans, scan_nutrition, daily_logs, food_reference (skema detail ada di SDD dokumen).
- Stack yang disarankan: Backend Node.js/Express, Database PostgreSQL, Storage foto S3-compatible (auto-delete setelah 30 hari), Frontend React/Next.js.
- Ikuti aturan di SRS: validasi upload (JPG/PNG/WEBP maks 8MB, resolusi min 300x300px), handle confidence score rendah (<60%) dengan kasih alternatif pilihan, handle timeout API (>10 detik) dengan pesan error + retry, guest mode tanpa akun (tanpa riwayat tersimpan).
- Ikuti Task Breakdown di dokumen untuk urutan pengerjaan: Setup → Auth → Core Scan → Frontend Scan Flow → Log & Dashboard → Polish & Testing. Kerjakan bertahap per fase, jangan loncat-loncat.

Untuk semua tampilan (UI) — landing/home, camera/upload screen, scan result, manual correction, history, dashboard — desain harus rapi dan profesional, bukan asal jadi. Gunakan kemampuan design terbaikmu: perhatikan spacing, tipografi, hierarki visual, konsistensi warna, dan buat terasa seperti produk nyata (mirip app kesehatan/fitness modern), bukan template default. Kalau ada tipe artifact "Design" yang bisa dipakai untuk mockup/UI sebelum coding, gunakan itu dulu untuk validasi tampilan sebelum diimplementasi jadi kode.

Sebelum mulai coding:
1. Konfirmasi ke aku dulu pemahamanmu terhadap PRD/SRS/SDD di atas dalam beberapa poin singkat.
2. Tanyakan kalau ada bagian yang ambigu atau perlu aku putuskan (misalnya pilihan hosting, apakah pakai TypeScript atau tidak, dll).
3. Setelah aku confirm, mulai kerjakan dari Fase 0 (Setup) sesuai Task Breakdown, dan update aku tiap fase selesai.

Tujuan akhirnya: project ini harus benar-benar bisa jalan (working demo) dan bisa dipakai orang lain, bukan cuma dummy/prototype kosong.
