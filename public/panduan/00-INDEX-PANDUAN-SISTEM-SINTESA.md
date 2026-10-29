# 📚 Peta Induk & Matriks Panduan Pengguna Sistem Sintesa
## Kawasan Sains & Teknologi Solo Technopark

> **Versi Panduan:** 1.0 (Oktober 2026)  
> **Target Pengguna:** Seluruh Pengelola Kawasan, Instruktur, Startup, Alumni, Mitra Industri, & Masyarakat Umum

---

## 🧭 Pengantar Sistem Sintesa

**Sintesa (Solo Technopark Technopark Management System)** adalah platform terpadu pengelolaan kawasan teknologi yang menghubungkan seluruh pilar Solo Technopark:
1. **Layanan Komersial & Pemanfaatan Aset Fisik** (Gedung, Ruang Rapat, Coworking, Mesin Laboratorium).
2. **Layanan Jasa Manufaktur & Fabrikasi Prototipe** (Bengkel Mesin CNC, Bubut, 3D Printing).
3. **Inkubasi Bisnis & Akselerasi Startup** (Monitoring Traksi, Cap Table, VDR, & Kompetisi Krenova).
4. **Pusat Pelatihan Vokasi & LMS Terintegrasi** (Kurikulum Industri, Sertifikasi Kompetensi, RSKB Surakarta).
5. **Bursa Karir & Ekosistem Alumni Terpadu** (Mini-ATS, Job Matchmaking, Forum Eksklusif, Tracer Study).
6. **Sistem Kepegawaian & Disiplin Kerja** (Presensi Techno Sign berbasis AI Liveness & GPS Geofencing).

---

## 🗺️ Matriks Perbandingan Hak Akses 20 Role

| Kode Role | Nama Peran | Klaster | Rute Utama | File Panduan Terkait |
| :--- | :--- | :--- | :--- | :--- |
| `super_admin` | Super Administrator | Pimpinan | `*` (Seluruh Halaman) | [`01-PANDUAN-SUPER-ADMIN-DAN-PIMPINAN.md`](./01-PANDUAN-SUPER-ADMIN-DAN-PIMPINAN.md) |
| `admin` | Administrator Umum | Pimpinan | `/dashboard`, `/aset`, `/tenant`, dll. | [`01-PANDUAN-SUPER-ADMIN-DAN-PIMPINAN.md`](./01-PANDUAN-SUPER-ADMIN-DAN-PIMPINAN.md) |
| `admin_keuangan`| Admin Keuangan & BAS | Finansial | `/dashboard`, `/billing`, `/katalog` | [`02-PANDUAN-KEUANGAN-BILLING-KASIR.md`](./02-PANDUAN-KEUANGAN-BILLING-KASIR.md) |
| `kasir` | Kasir Pendapatan (POS) | Finansial | `/dashboard`, `/billing` | [`02-PANDUAN-KEUANGAN-BILLING-KASIR.md`](./02-PANDUAN-KEUANGAN-BILLING-KASIR.md) |
| `kasir_pengeluaran`| Kasir Pengeluaran (AP) | Finansial | `/dashboard`, `/billing` | [`02-PANDUAN-KEUANGAN-BILLING-KASIR.md`](./02-PANDUAN-KEUANGAN-BILLING-KASIR.md) |
| `admin_aset` | Admin Aset & Booking | Fasilitas | `/dashboard`, `/aset`, `/booking` | [`03-PANDUAN-ASET-DAN-RESERVASI.md`](./03-PANDUAN-ASET-DAN-RESERVASI.md) |
| `operator_aset` | Operator Lapangan Aset | Fasilitas | `/dashboard`, `/aset`, `/booking` | [`03-PANDUAN-ASET-DAN-RESERVASI.md`](./03-PANDUAN-ASET-DAN-RESERVASI.md) |
| `admin_produksi`| Admin Jasa Produksi | Manufaktur | `/dashboard`, `/jasa-produksi` | [`04-PANDUAN-JASA-PRODUKSI-MANUFAKTUR.md`](./04-PANDUAN-JASA-PRODUKSI-MANUFAKTUR.md) |
| `operator_produksi`| Operator Bengkel Mesin | Manufaktur | `/dashboard`, `/jasa-produksi` | [`04-PANDUAN-JASA-PRODUKSI-MANUFAKTUR.md`](./04-PANDUAN-JASA-PRODUKSI-MANUFAKTUR.md) |
| `admin_tenant` | Admin Inkubasi Tenant | Ekosistem | `/dashboard`, `/tenant`, `/krenova` | [`05-PANDUAN-INKUBASI-TENANT-KRENOVA.md`](./05-PANDUAN-INKUBASI-TENANT-KRENOVA.md) |
| `operator_tenant`| Operator Tenant | Ekosistem | `/dashboard`, `/tenant` | [`05-PANDUAN-INKUBASI-TENANT-KRENOVA.md`](./05-PANDUAN-INKUBASI-TENANT-KRENOVA.md) |
| `admin_pelatihan`| Admin Pelatihan (LMS) | Pendidikan | `/dashboard`, `/pelatihan`, `/lms` | [`06-PANDUAN-PELATIHAN-LMS-TRACER-STUDY.md`](./06-PANDUAN-PELATIHAN-LMS-TRACER-STUDY.md) |
| `operator_pelatihan`| Operator Pelatihan | Pendidikan | `/dashboard`, `/pelatihan`, `/lms` | [`06-PANDUAN-PELATIHAN-LMS-TRACER-STUDY.md`](./06-PANDUAN-PELATIHAN-LMS-TRACER-STUDY.md) |
| `pegawai` | Pegawai & Instruktur | Kepegawaian | `/presensi/*`, `/karir` | [`07-PANDUAN-PEGAWAI-PRESENSI-TECHNO-SIGN.md`](./07-PANDUAN-PEGAWAI-PRESENSI-TECHNO-SIGN.md) |
| `tenant` | Tenant Startup Binaan | Pengguna Binaan | `/tenant/*`, `/ekosistem` | [`08-PANDUAN-TENANT-STARTUP-BINAAN.md`](./08-PANDUAN-TENANT-STARTUP-BINAAN.md) |
| `alumni` | Alumni Diklat (STP/RSKB)| Pengguna Lulusan | `/alumni-portal`, `/karir`, `/portal` | [`09-PANDUAN-ALUMNI-DAN-BURSA-KARIR.md`](./09-PANDUAN-ALUMNI-DAN-BURSA-KARIR.md) |
| `industri` | Mitra Industri / HR | Mitra Luar | `/mitra/*`, `/ekosistem` | [`10-PANDUAN-MITRA-INDUSTRI-DAN-ATS.md`](./10-PANDUAN-MITRA-INDUSTRI-DAN-ATS.md) |
| `investor` | Mitra Investor / VC | Mitra Luar | `/ekosistem`, `/portfolio` | [`11-PANDUAN-INVESTOR-DAN-KAMPUS.md`](./11-PANDUAN-INVESTOR-DAN-KAMPUS.md) |
| `kampus` | Mitra Perguruan Tinggi | Mitra Luar | `/ekosistem`, `/riset` | [`11-PANDUAN-INVESTOR-DAN-KAMPUS.md`](./11-PANDUAN-INVESTOR-DAN-KAMPUS.md) |
| `public` | Pengguna Umum | Publik | `/`, `/portal`, `/fasilitas`, dll. | [`12-PANDUAN-PENGGUNA-UMUM-DAN-PORTAL.md`](./12-PANDUAN-PENGGUNA-UMUM-DAN-PORTAL.md) |

---

## 📂 Direktori Seluruh Berkas Panduan

Klik pada judul panduan di bawah ini untuk membaca pedoman operasional lengkap:

1. **[01. Panduan Super Administrator & Pimpinan Eksekutif](./01-PANDUAN-SUPER-ADMIN-DAN-PIMPINAN.md)**  
   *Tata kelola hak akses RBAC, konfigurasi sistem pengumuman/operasional, pemantauan dashboard eksekutif, dan penanganan insiden.*
2. **[02. Panduan Keuangan, Billing, & Meja Kasir](./02-PANDUAN-KEUANGAN-BILLING-KASIR.md)**  
   *SOP kasir POS validasi AI OCR, penagihan multi-termin, pencatatan kas kecil AP, dan akuntansi Bagan Akun Standar (BAS BLUD).*
3. **[03. Panduan Aset, Gedung, & Reservasi Jadwal](./03-PANDUAN-ASET-DAN-RESERVASI.md)**  
   *Pendaftaran aset & penentuan tarif sewa, approval booking bebas bentrok kalender, dan SOP cek fisik lapangan operator.*
4. **[04. Panduan Jasa Produksi & Manufaktur Fabrikasi](./04-PANDUAN-JASA-PRODUKSI-MANUFAKTUR.md)**  
   *Alur pemesanan Work Order manufaktur CNC/3D printing, perhitungan RAB pesanan, dan penerbitan Surat Jalan / Delivery Order.*
5. **[05. Panduan Inkubasi Startup, Tenant, & Krenova](./05-PANDUAN-INKUBASI-TENANT-KRENOVA.md)**  
   *Kurasi seleksi tenant, monitoring milestone inkubasi, pengelolaan VDR & Cap Table, serta penjurian kompetisi inovasi Krenova.*
6. **[06. Panduan Pelatihan Vokasi, LMS, & Tracer Study](./06-PANDUAN-PELATIHAN-LMS-TRACER-STUDY.md)**  
   *Pembukaan batch pelatihan, manajemen kurikulum modul LMS, penerbitan e-sertifikat STP-CERT, dan analitik serapan kerja RSKB.*
7. **[07. Panduan Pegawai & Presensi Techno Sign](./07-PANDUAN-PEGAWAI-PRESENSI-TECHNO-SIGN.md)**  
   *Presensi GPS geofencing & AI liveness, pengisian Lembar Kerja Harian (LKH), pengajuan izin/cuti/lembur, dan approval atasan.*
8. **[08. Panduan Tenant Startup & Wirausaha Binaan](./08-PANDUAN-TENANT-STARTUP-BINAAN.md)**  
   *Navigasi dashboard mandiri, input laporan omzet berkala, manajemen dokumen investor di VDR, bayar invoice, dan rekrutmen talenta.*
9. **[09. Panduan Alumni, Bursa Karir, & Forum Komunitas](./09-PANDUAN-ALUMNI-DAN-BURSA-KARIR.md)**  
   *Klaim kode alumni, melamar lowongan kerja mitra industri, keaktifan reputasi forum, dan verifikasi sertifikat mandiri.*
10. **[10. Panduan Mitra Industri & Mini-ATS Rekrutmen](./10-PANDUAN-MITRA-INDUSTRI-DAN-ATS.md)**  
    *Pemasangan lowongan kerja terverifikasi, manajemen pipeline kandidat via Mini-ATS, dan undangan langsung talenta diklat vokasi.*
11. **[11. Panduan Mitra Investor & Perguruan Tinggi](./11-PANDUAN-INVESTOR-DAN-KAMPUS.md)**  
    *Pencarian startup potensi investasi di Smart Hub, peninjauan pitch deck, serta pengajuan kemitraan riset & magang MBKM kampus.*
12. **[12. Panduan Pengguna Umum & Portal Layanan Publik](./12-PANDUAN-PENGGUNA-UMUM-DAN-PORTAL.md)**  
    *Pendaftaran akun publik, penyewaan fasilitas, pembayaran belanja e-katalog, konfirmasi bukti transfer, dan cek sertifikat.*

---

## 🔒 Standar Keamanan & Autentikasi Sistem

```
Pengguna Membuka Web 
  → Firebase Auth JWT Session (Cookie __session)
  → Edge Proxy Verification (src/proxy.ts)
  → Layout Role Guard (hasAccess)
  → Component Action Guard (canPerformAction)
  → Cloud Function Callable Guard (request.auth.token.role)
```

> [!NOTE]  
> Setiap peran memiliki masa aktif token autentikasi yang diawasi secara ketat. Jika terjadi perubahan hak akses oleh Super Admin di menu Pengaturan, pengguna terkait disarankan melakukan *logout* dan *login* ulang agar token claims ter-refresh secara instan.

