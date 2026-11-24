---
title: Panduan Penggunaan Role Super Administrator & Administrator Umum
roles: super_admin, admin
system: SINTESA — Solo Technopark
---

# 👑 PANDUAN PENGGUNAAN: SUPER ADMINISTRATOR & ADMINISTRATOR
**Role Terkait:** `super_admin` (Super Administrator) & `admin` (Administrator Umum)

---

## 1. Perbedaan Kewenangan `super_admin` vs `admin`

| Kewenangan / Menu | `super_admin` | `admin` |
|---|:---:|:---:|
| Akses seluruh rute sistem (`*`) termasuk seluruh modul & `/eksekutif` | ✅ Penuh | ✅ Penuh (kecuali pembatasan RBAC) |
| Pengaturan Profil Instansi, Konfigurasi Sistem & Notifikasi Email | ✅ Ya | ✅ Ya |
| Pengaturan Keuangan BAS (`/pengaturan?tab=Keuangan`) | ✅ Ya | ❌ Khusus `super_admin` & `admin_keuangan` |
| **Manajemen Role, Hak Akses User & Hapus Akun (`/pengaturan?tab=Keamanan`)** | ✅ **Eksklusif** | ❌ Tidak |
| Inspeksi langsung ke Sistem Presensi (`/presensi`) tanpa login terpisah | ✅ Ya | ✅ Ya |
| Menghapus data master kritis (User, Aset, Invoice, Tenant) | ✅ Penuh | ✅ Kecuali Hapus User |

---

## 2. Navigasi Panel Admin & Fitur Produktivitas

- **Sidebar Pintasan Sub-Tab:** Klik tanda panah pada menu utama (contoh: *Billing & Invoice*, *Inkubasi Tenant*, *Kurasi & Asesmen AI*, *Bursa Karir*) untuk langsung menuju sub-tab tertentu via URL `?tab=...`.
- **Mode Mini-Rail:** Klik tombol lipat sidebar di pojok kiri atas untuk memperluas area kerja tabel pada layar laptop kecil.
- **Command Palette (`Ctrl + K`):** Cari menu atau sub-tab apa pun tanpa menggulir sidebar.
- **Lonceng Notifikasi:** Pantau pengajuan booking baru, konfirmasi bukti bayar, pendaftaran tenant, dan tiket Service Desk secara *real-time*.

---

## 3. Tugas Utama Super Admin & Administrator

### A. Manajemen Pengguna & Hak Akses RBAC (Khusus `super_admin`)
1. Buka **Pengaturan Sistem → Tab Keamanan (RBAC)** (`/pengaturan?tab=Keamanan`).
2. Cari akun berdasarkan nama atau email.
3. Pilih role baru dari 21 daftar peran resmi (`direktur`, `admin_keuangan`, `kasir`, `admin_aset`, `admin_produksi`, `admin_tenant`, `admin_pelatihan`, `pegawai`, dll.).
4. Klik **Simpan Perubahan**. Cloud Function `customClaims.ts` akan otomatis menyinkronkan klaim JWT Firebase Auth user tersebut.
5. Informasikan kepada user agar melakukan **Logout dan Login ulang** untuk menerapkan hak akses baru.

### B. Konfigurasi Profil Instansi, Email SMTP & Sistem
1. Buka **Pengaturan Sistem** (`/pengaturan`):
   - **Tab Profil Instansi:** Atur nama resmi UPTD, alamat, nomor telepon, nama penandatangan default, dan kop surat yang dipakai oleh engine PDF `stpDocumentKit`.
   - **Tab Billing & Keuangan** (`super_admin`): Konfigurasi format penomoran invoice (`INV/STP/...`), nomor rekening bank BLUD, dan Bagan Akun Standar (BAS).
   - **Tab Konfigurasi Sistem:** Atur toggle fitur sistem, maintenance notice, dan parameter operasional kawasan.
   - **Tab Notifikasi Email:** Konfigurasi alamat pengirim SMTP Hostinger resmi (`marketing@solotechnopark.id`) dan notifikasi otomatis (booking, invoice, kuitansi, wawancara).

### C. Pemantauan Kesehatan Sistem, Cache & Konten Publik
- **Rebuild Master Cache (1-Read Cache):** Bila data daftar tenant, aset, katalog, alumni, atau lowongan baru saja diimpor massal dan belum tampil di publik, gunakan tombol **Sinkronisasi / Refresh Cache** pada modul terkait (memicu Cloud Functions `rebuild*MasterCache`).
- **Manajemen Konten Publik:** Kelola berita di **Artikel & Warta** (`/manajemen-artikel`), jadwal kegiatan di **Manajemen Event** (`/manajemen-event`), serta tanya-jawab di **Pusat Bantuan** (`/manajemen-faq`).
- **Audit Lintas Divisi:** Super Admin dan Admin dapat meninjau seluruh modul operasional (Aset, Booking, Jasa Produksi, Service Desk, Katalog, Billing, Kemitraan, Afiliasi, Inkubasi Tenant, Kurasi AI, Pelatihan, Bursa Karir, Krenova, IKM) serta menginspeksi `/presensi`.

---

## 4. SOP Penanganan Insiden & Keamanan

| Kondisi Insiden | Langkah Cepat Penanganan |
|---|---|
| Pegawai/Admin tidak bisa masuk ke halaman divisi | Cek role user di `/pengaturan?tab=Keamanan` → pastikan role sesuai → minta user Logout & Login ulang. |
| Layanan AI (OCR / Chat / Kurasi) lambat atau limit | Rate limiter IP aktif (10–15 req/menit). Tunggu 1 menit; cek kuota `CLARIO_API_KEY` pada environment server. |
| Bukti bayar tidak muncul di Kasir | Cek di `/billing?tab=KONFIRMASI` dan pastikan status invoice `WAITING_VERIFICATION`. |
| Dugaan akses mencurigakan / manipulasi presensi | Periksa `auditLogs` di sistem presensi (immutable, tidak dapat diubah user) dan segera nonaktifkan akun terkait jika perlu. |
