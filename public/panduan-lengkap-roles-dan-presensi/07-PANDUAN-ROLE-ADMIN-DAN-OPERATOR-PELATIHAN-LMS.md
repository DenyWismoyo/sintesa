---
title: Panduan Penggunaan Role Admin Pelatihan & Operator Pelatihan (LMS, Alumni & Bursa Karir RSKB)
roles: admin_pelatihan, operator_pelatihan
system: SINTESA — Solo Technopark
---

# 🎓 PANDUAN PENGGUNAAN: ADMIN & OPERATOR PELATIHAN (LMS & RSKB)
**Role Terkait:** `admin_pelatihan` (Admin Pelatihan & LMS) & `operator_pelatihan` (Operator Pelatihan)

---

## 1. Perbedaan Hak Akses `admin_pelatihan` vs `operator_pelatihan`

| Modul / Kewenangan | `admin_pelatihan` | `operator_pelatihan` |
|---|:---:|:---:|
| Manajemen Pelatihan, LMS, Alumni & Talent (`/pelatihan`, `/lms`) | ✅ | ✅ |
| Review Program Pelatihan (`/manajemen-review-pelatihan`) | ✅ | ✅ |
| Bursa Karir, Pelamar, Moderasi Forum & Tracer Study (`/manajemen-karir`) | ✅ | ✅ |
| **Kurasi & Asesmen AI (`/manajemen-kurasi`), Artikel, FAQ & Kemitraan** | ✅ **Ya** | ❌ |

---

## 2. Manajemen Pelatihan Vokasi & LMS (`/pelatihan` & `/lms`)

Menu **Pelatihan** (`/pelatihan`) terdiri dari 4 sub-tab utama:
1. **Manajemen LMS (`lms`):**
   - Buat batch program pelatihan baru (Welding, CNC, Automasi, IT/Coding, SMK Go Global/P3MI, dll.).
   - Susun kurikulum, silabus, modul belajar, video/dokumen materi, dan tugas melalui **Course Builder** (`/pelatihan/builder` & `/lms`).
   - Kelola peserta per batch (`/pelatihan/[id]/peserta`): verifikasi kehadiran/kelulusan tugas dan terbitkan **E-Sertifikat** berkode unik `STP-CERT` yang dapat diverifikasi publik di `/verifikasi-sertifikat`.
2. **Database Alumni (`alumni`):**
   - Kelola data lulusan diklat vokasi Solo Technopark & program khusus (seperti P3MI Welder).
   - Terbitkan **Kode Klaim Alumni** agar lulusan dapat mengklaim status alumni pada akun mereka (`alumniClaim`) dan membuka akses eksklusif Bursa Karir & Forum Zona A.
3. **Direktori Talent (`talent`):**
   - Kumpulan profil talenta lulusan yang telah disanitasi dari PII sensitif (`cache_talent_pool`) untuk ditawarkan kepada mitra industri.
4. **Tagihan Diklat (`tagihan`):**
   - Pantau otomatis tagihan pendaftaran kelas berbayar via `DivisionInvoiceTracker`. *(Kelas gratis langsung aktif ke `/ruang-belajar`; kelas berbayar otomatis aktif setelah Kasir memverifikasi pembayaran lunas).*

---

## 3. Modul Review Program Pelatihan (`/manajemen-review-pelatihan`)

1. **Tab Program & Kriteria (`programs`):** Atur daftar program vokasi yang aktif menerima evaluasi dan kriteria penilaian (kualitas instruktur, fasilitas bengkel, relevansi industri).
2. **Tab Kotak Masuk Ulasan (`reviews`):** Tinjau ulasan peserta yang masuk dari halaman publik `/review-pelatihan` (termasuk dukungan mode anonim untuk objektivitas evaluasi program P3MI/SMK Go Global).

---

## 4. Bursa Karir RSKB, Mini-ATS, Moderasi Forum & Tracer Study (`/manajemen-karir`)

Modul ini mengintegrasikan 7 sub-tab penyaluran kerja alumni (Rumah Solusi Kemitraan Bekerja):
1. **Master Lowongan (`LIST`):** Tambah, edit, atau arsipkan lowongan kerja resmi Solo Technopark.
2. **Pelamar & Seleksi (`APPLICATIONS`):** Pantau seluruh lamaran alumni yang masuk via Mini-ATS, ubah tahap seleksi (*Applied → Screening → Interview → Accepted/Rejected*), dan picu email undangan wawancara otomatis.
3. **Mitra & Antrean Loker (`MITRA`):** Verifikasi onboarding perusahaan mitra baru (`partnerOnboarding`) dan tinjau lowongan yang diajukan mitra dari `/mitra/*` sebelum tayang.
4. **Moderasi Forum (`FORUM`):** Moderasi diskusi pada Forum Alumni Zona A & Zona B (dibantu deteksi otomatis AI `/api/forum/moderate`).
5. **Kontrol Agregator API (`SYNC`):** Jalankan sinkronisasi manual atau pantau cron mingguan (`weeklyJobSync`) agregator lowongan zero-cost (Greenhouse, Lever, Ashby) yang sudah menyaring PII sesuai UU PDP dan menjaga rasio 60% Indonesia : 40% Internasional.
6. **Penyaluran Alumni (`TALENT`):** Gunakan **AI Smart Talent Matchmaking** (`/api/jobs/ai-match`) untuk merekomendasikan alumni terbaik pada lowongan mitra & ekspor paket kemitraan.
7. **Tracer Study Alumni (`TRACER`):** Pantau grafik serapan kerja lulusan (bekerja, wirausaha, lanjut studi, mencari kerja) untuk laporan kinerja UPTD.
