---
title: Panduan Penggunaan Role Admin Aset & Operator Aset
roles: admin_aset, operator_aset
system: SINTESA — Solo Technopark
---

# 🏢 PANDUAN PENGGUNAAN: ADMIN ASET & OPERATOR ASET
**Role Terkait:** `admin_aset` (Admin Aset, Booking & Service Desk) & `operator_aset` (Operator Aset Lapangan)

---

## 1. Perbedaan Hak Akses `admin_aset` vs `operator_aset`

| Fitur / Aksi | `admin_aset` | `operator_aset` |
|---|:---:|:---:|
| Lihat, Tambah & Edit Database Aset (`/aset`) | ✅ | ✅ |
| Hapus Aset & Ubah Konfigurasi Kemitraan/FAQ/IKM | ✅ | ❌ |
| Kelola Antrean Booking, Kalender & Ruangan (`/booking`) | ✅ | ✅ (Kelola jadwal) |
| **Menyetujui (`Approve`) Booking → Auto-Generate Invoice** | ✅ **Ya** | ❌ Hanya Admin |
| Kelola Tiket Service Desk (`/service-desk`) | ✅ | ✅ |
| **Menyetujui Work Order / Cetak SPK & BAST Resmi** | ✅ **Ya** | ❌ |

---

## 2. Manajemen Aset & Cetak QR Code Massal (`/aset`)

### A. Menambah & Memperbarui Inventaris Aset
1. Buka menu **Manajemen Aset → Database Aset** (`/aset?tab=Daftar%20Aset`).
2. Klik **Tambah Aset** untuk mendaftarkan gedung, ruang rapat, coworking, aula, atau mesin laboratorium.
3. Lengkapi kategori, kapasitas, tarif sewa (per jam/hari/paket), foto fasilitas, status operasional (`Tersedia`, `Pemeliharaan`), dan kondisi (`Baik`, `Rusak Ringan`, `Rusak Berat`).
4. **Penting (Proteksi Anti-Booking):** Jika sebuah aset diubah statusnya menjadi **`Pemeliharaan`** atau kondisi **`Rusak Berat`**, mesin reservasi publik otomatis memblokir pemesanan aset tersebut sampai status kembali `Tersedia`.

### B. Cetak Stiker QR Code Massal
1. Centang beberapa aset pada daftar, maka **Floating Print Bar** muncul di bagian bawah layar.
2. Klik **Cetak QR Code** untuk membuka layout cetak stiker QR siap tempel di fisik ruangan/alat.
3. Ketika pengunjung atau staf memindai QR tersebut, halaman publik `/lapor-aset/[id]` terbuka untuk pelaporan kerusakan cepat.

### C. Menindaklanjuti Laporan Kerusakan Publik
1. Buka tab **Laporan Kerusakan** (`/aset?tab=Laporan%20Publik`).
2. Tinjau foto kerusakan dan lokasi dari pelapor, lalu konversi menjadi tiket perbaikan di **Service Desk**.

---

## 3. Manajemen Booking & Jadwal Fasilitas (`/booking`)

Modul Booking memiliki 5 sub-tab terintegrasi:
1. **Antrean Persetujuan (`Antrean`):** Daftar pengajuan sewa ruangan yang masuk dari halaman publik `/fasilitas`.
   - `admin_aset` memeriksa kelengkapan surat/keperluan, lalu klik **Setujui (Approve)**.
   - Persetujuan otomatis menerbitkan tagihan sewa ke `/billing` dengan kode referensi `BOOKING` (bisa dipantau langsung di *Division Invoice Tracker*).
2. **Kalender Master (`Kalender`):** Tampilan visual seluruh jadwal terkonfirmasi untuk memastikan nol bentrok. *(Backend Cloud Function `submitBooking` menggunakan `db.runTransaction` sehingga bentrok jadwal secara teknis mustahil terjadi).*
3. **Manajemen Ruangan (`Ruangan`):** Pengaturan ketersediaan ruangan, blokir jadwal internal dinas, atau input booking manual oleh admin (`ModalAdminCreateBooking`).
4. **Fasilitas Teknis (`Fasilitas Teknis`):** Mengelola add-on peralatan teknis (sound system, proyektor, LED videotron, konsumsi) yang dihitung otomatis pada **Kalkulator Paket B2B**.
5. **Kemitraan B2B & RFP (`Kemitraan`):** Memantau permintaan penawaran paket event/sewa korporasi dan mencetak dokumen penawaran PDF (`b2bQuotationPdf`).

---

## 4. Service Desk Pemeliharaan, Cetak SPK & BAST (`/service-desk`)

1. Buka menu **Service Desk & SPK** (`/service-desk`) dengan 4 tab status: `Semua Tiket`, `Menunggu Teknisi (OPEN)`, `Dalam Pengerjaan (IN_PROGRESS)`, dan `Selesai & BAST (RESOLVED)`.
2. **Alur Penanganan Tiket:**
   - Catat tiket baru atau terima dari laporan QR aset → tugaskan teknisi/vendor.
   - `admin_aset` menyetujui pengerjaan dan klik **Cetak SPK Pemeliharaan**: pilih nama penandatangan dari database pegawai (`stpEmployeeService`), sesuaikan instruksi K3, pratinjau pada *Document Preview Drawer*, lalu unduh PDF vektor A4.
   - Setelah perbaikan selesai dan diuji lapangan oleh `operator_aset`, ubah status ke `RESOLVED`, masukkan rincian suku cadang/biaya (jika ada), lalu klik **Cetak BAST Pemeliharaan** sebagai bukti serah terima perbaikan.
3. **Evaluasi IKM (`admin_aset`):** Pantau umpan balik kepuasan penyewa fasilitas pada menu **Survei IKM** (`/manajemen-ikm`).
