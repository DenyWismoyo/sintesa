---
title: Panduan Penggunaan Sistem Presensi Techno Sign v3 — Peran Admin Presensi & Kepegawaian (Subbag TU)
roles: presensiRole admin, super_admin, admin
system: Techno Sign v3 PWA — Solo Technopark
---

# 🛠️ PANDUAN SISTEM PRESENSI TECHNO SIGN V3: ADMIN PRESENSI & KEPEGAWAIAN
**Peran Terkait:** Admin Kepegawaian / Subbag Tata Usaha (`presensiRole: admin`) serta `super_admin` & `admin`

---

## 1. Menu Administrasi Penuh yang Terbuka untuk Admin Presensi

Admin Presensi memiliki kendali penuh atas tata kelola kepegawaian Techno Sign melalui **3 menu konfigurasi khusus** di luar menu Pegawai & Approver:

| Menu Administrasi | Rute URL | Tanggung Jawab Utama |
|---|---|---|
| **Data Pegawai STP** | `/presensi/pegawai` | Tambah, ubah, nonaktifkan akun pegawai (ASN & Non-ASN BLUD), penempatan unit kerja, & assign atasan |
| **Hierarki Jabatan** | `/presensi/jabatan` | Atur struktur organisasi, `rankLevel` (1–9), dan pemetaan rantai persetujuan (*approval chain*) |
| **Pengaturan Kantor** | `/presensi/pengaturan` | Tentukan titik koordinat GPS kantor (peta interaktif), radius geofencing (meter), & jam masuk/pulang |
| **Rekap, Statistik AI & Ekspor** | `/presensi/statistik` | Analisis disiplin AI, ekspor Excel bulanan (`.xlsx`), cetak PDF Berita Acara, & Koreksi Presensi Langsung |

---

## 2. Pengelolaan Data Pegawai & Hierarki Jabatan

### A. Menambah & Mengelola Master Pegawai (`/presensi/pegawai`)
1. Buka **Data Pegawai STP (`/presensi/pegawai`)**.
2. Klik **Tambah Pegawai Baru** → isi Nama Lengkap, NIP/NIK Kontrak, Email Kedinasan (`@solotechnopark.id`), Jabatan, Unit/Divisi, Role Presensi (`pegawai` atau `admin`), dan pilih **Atasan Langsung (`atasanId`)**.
3. Pastikan setiap pegawai terhubung ke `atasanId` yang tepat agar pengajuan LKH, Izin, Lembur, dan Revisi mengalir ke meja persetujuan yang benar.

### B. Mengatur Hierarki Jabatan (`/presensi/jabatan`)
1. Buka **Hierarki Jabatan (`/presensi/jabatan`)**.
2. Kelola daftar jabatan beserta tingkat **`rankLevel`**:
   - **`rankLevel 1–4`** (Kepala UPTD, Kasubag TU / Pejabat Teknis, Manager, Kepala Divisi): otomatis memperoleh akses menu **Approval Atasan** & **Rekap Statistik**.
   - **`rankLevel >= 5`** (Staf Pelaksana, Teknisi, Operator, Instruktur): memperoleh menu standar Pegawai.

---

## 3. Konfigurasi Geofencing Kantor & Jam Kerja (`/presensi/pengaturan`)

1. Buka **Pengaturan Kantor (`/presensi/pengaturan`)**.
2. Gunakan peta interaktif **`OfficeLocationPicker`** & **`OfficeOverviewMap`** (berbasis Leaflet) untuk:
   - Menentukan titik koordinat pusat gedung kawasan UPTD Solo Technopark (Jl. Ki Hajar Dewantara No. 19, Surakarta) atau lokasi cabang/pos dinas tertentu.
   - Menentukan **radius toleransi geofencing** (misal 100–250 meter) yang diverifikasi ulang secara ketat oleh server (*Zero-Trust Haversine*).
3. Atur **Jam Masuk Maksimal** (default WIB `07:30`), **Jam Pulang Standar**, dan aturan toleransi keterlambatan.
4. Simpan perubahan — berlaku instan untuk seluruh sesi presensi pegawai berikutnya.

---

## 4. Koreksi Langsung, Rekap Statistik AI, Ekspor Excel & PDF Berita Acara

1. **Koreksi Presensi Langsung (`koreksiPresensiLangsungAction`):**
   - Jika terdapat penugasan khusus, gangguan jaringan massal, atau putusan pimpinan, Admin Presensi dapat melakukan koreksi status kehadiran pegawai pada tanggal tertentu secara langsung.
   - Setiap aksi koreksi otomatis mencatat identitas admin, waktu, nilai lama, dan nilai baru pada `auditLogs` untuk akuntabilitas pemeriksaan.
2. **Analisis Disiplin Berbasis AI (`ai-analisis.ts`):**
   - Pada halaman **Rekap & Statistik (`/presensi/statistik`)**, jalankan fitur analisis AI untuk merangkum tren keterlambatan, pola ketidakhadiran divisi, dan rekomendasi pembinaan pegawai.
3. **Ekspor Rekap Bulanan untuk Lampiran Tunjangan / Penggajian BLUD:**
   - Klik **Ekspor Excel (`.xlsx`)** (`excelExport.ts`) untuk mengunduh tabel lengkap jam masuk, jam pulang, total hadir, terlambat, izin/sakit/cuti, lembur, dan persentase kehadiran seluruh pegawai.
   - Klik **Cetak PDF Berita Acara Rekapitulasi** (`beritaAcaraPdf.ts`) sebagai lampiran resmi SPJ tunjangan kinerja / penggajian bulanan Subbag Tata Usaha.

---

## 5. Pengawasan Keamanan & Audit Log Forensik Anti-Fraud

- Seluruh percobaan kecurangan (deteksi Mock GPS, jarak di luar geofence, *Impossible Travel*, indikasi spoof swafoto, serta perubahan/koreksi data oleh admin) terekam pada koleksi Firestore **`auditLogs`**.
- Sesuai aturan keamanan `firestore.rules` (baris 902–905), koleksi `auditLogs` bersifat **Immutable (Hanya Baca oleh Admin, Dilarang Ubah/Hapus oleh Siapa Pun dari Client)** sehingga sah dijadikan bukti forensik kepegawaian jika terjadi pelanggaran disiplin berat.
