---
title: Panduan Penggunaan Role Alumni KST / RSKB
roles: alumni
system: SINTESA — Solo Technopark
---

# 🎖️ PANDUAN PENGGUNAAN: ALUMNI SOLO TECHNOPARK (KST & RSKB)
**Role Terkait:** `alumni` (Lulusan Diklat Vokasi & Program RSKB / P3MI Solo Technopark)

---

## 1. Aktivasi & Klaim Status Alumni

Jika Anda lulusan pelatihan Solo Technopark dan akun Anda masih berstatus Pengguna Umum (`public`):
1. Login melalui **`/login`**, lalu buka halaman **Profil Saya (`/profil`)**.
2. Pilih tab **Status Alumni (`TabAlumni`)**.
3. Masukkan **Kode Klaim Alumni** resmi yang diterbitkan Divisi Pelatihan (misal kode batch P3MI / Welder / Vokasi).
4. Klik **Verifikasi & Klaim Alumni** (memanggil Cloud Function `alumniClaim`).
5. **Logout dan Login ulang** — peran akun Anda otomatis naik menjadi `alumni` dan membuka akses eksklusif **Bursa Karir (`/karir`)** serta **Forum Alumni Zona A (`/alumni-portal`)**.

---

## 2. Menggunakan Bursa Karir Eksklusif (`/karir`)

1. Buka **`/karir`** — halaman ini menampilkan lowongan terverifikasi dari **Mitra Industri STP** maupun lowongan global/nasional hasil kurasi agregator (rasio 60% Indonesia : 40% ASEAN/Asia Timur/Global).
2. Gunakan **Alumni Quick Match Banner** & **AI Smart Match** untuk melihat persentase kecocokan profil keahlian Anda dengan tiap lowongan.
3. Saring lowongan berdasarkan wilayah (Indonesia, ASEAN, Jepang/Korea, Remote), program pelatihan terkait, atau kata kunci.
4. Klik lowongan yang diminati → baca detail kualifikasi → klik **Lamar Sekarang (`/karir/[id]/lamar`)**.
5. Pantau perkembangan status lamaran Anda (*Applied → Screening → Interview → Accepted*) melalui tombol **Lamaran Saya (`MyApplicationsModal`)** atau tab **Karir Alumni** di `/profil`.

---

## 3. Forum Komunitas Dual-Zone (`/alumni-portal`)

Role `alumni` memiliki keistimewaan mengakses **kedua zona forum**:
- **Zona A (`ZONE_A_ALUMNI_ONLY` — Khusus Alumni & Staf STP):** Ruang aman untuk berbagi pengalaman kerja, informasi lapangan, gaji, dan diskusi sesama lulusan tanpa dapat dibaca oleh pihak perusahaan/industri eksternal.
- **Zona B (`ZONE_B_INDUSTRY_BRIDGE` — Jembatan Industri):** Ruang kolaborasi terbuka bersama HRD Mitra Industri dan Startup Tenant untuk tanya-jawab lowongan, portofolio, dan peluang kerja sama.

---

## 4. LMS, E-Sertifikat & Tracer Study

- **Ruang Belajar (`/lms` & `/ruang-belajar`):** Akses kembali materi pelatihan yang pernah diikuti dan daftar kelas *upskilling* lanjutan.
- **Verifikasi E-Sertifikat (`/verifikasi-sertifikat`):** Bagikan nomor sertifikat `STP-CERT` atau tautan verifikasi resmi ke CV/LinkedIn agar HRD dapat memvalidasi keaslian sertifikat Anda.
- **Pengisian Tracer Study (`/profil` → Tab Karir Alumni):** Perbarui status pekerjaan terkini Anda untuk membantu Solo Technopark meningkatkan kualitas program penyaluran kerja RSKB.
