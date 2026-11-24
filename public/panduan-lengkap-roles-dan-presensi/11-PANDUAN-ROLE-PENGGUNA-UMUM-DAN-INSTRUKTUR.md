---
title: Panduan Penggunaan Role Pengguna Umum & Instruktur
roles: public
system: SINTESA — Solo Technopark
---

# 🌐 PANDUAN PENGGUNAAN: PENGGUNA UMUM & INSTRUKTUR
**Role Terkait:** `public` (Masyarakat Umum, Calon Peserta Diklat, Penyewa Fasilitas, Pembeli E-Katalog, & Instruktur Pelatihan)

---

## 1. Peta Layanan Portal Publik Solo Technopark

Tanpa atau dengan membuat akun di **`/daftar`**, masyarakat umum dapat mengakses seluruh layanan digital berikut:

| Layanan Publik | Rute URL | Kegunaan Utama |
|---|---|---|
| **Beranda & Portal Utama** | `/` & `/portal` | Ringkasan kawasan, statistik publik, berita terbaru, & navigasi cepat |
| **E-Katalog Resmi** | `/e-katalog` | Jelajahi & pesan produk STP, peralatan, layanan teknis, dan produk inovasi tenant (6 kategori) |
| **Sewa Fasilitas & Ruangan** | `/fasilitas` | Cek kalender ketersediaan real-time, hitung paket di **Kalkulator B2B**, & ajukan booking |
| **Layanan Jasa Produksi** | `/layanan-produksi` | Informasi kapasitas bengkel CNC, bubut, welding, 3D printing & pengajuan estimasi |
| **Program Pelatihan Vokasi** | `/program-pelatihan` | Daftar kelas diklat gratis maupun berbayar & akses materi di `/ruang-belajar` |
| **Konfirmasi Bukti Bayar** | `/bukti-bayar` | Unggah foto bukti transfer menggunakan nomor invoice/kode bayar untuk verifikasi kasir |
| **Asisten AI Kawasan** | `/explore` | Tanya jawab interaktif seputar layanan, tarif, prosedur, dan program Solo Technopark |
| **Peta Kawasan & Lapor Aset** | `/peta-kawasan` & `/lapor-aset/[id]` | Peta gedung interaktif Leaflet & lapor kerusakan fasilitas via scan QR di lokasi |
| **Self-Assessment Kurasi** | `/curation` | Mengisi formulir kurasi/seleksi produk atau calon tenant menggunakan token batch |
| **Verifikasi E-Sertifikat** | `/verifikasi-sertifikat` | Cek keaslian sertifikat pelatihan Solo Technopark berdasarkan nomor `STP-CERT` |
| **Review Pelatihan & Survei IKM** | `/review-pelatihan` & `/survei-ikm` | Berikan ulasan program pelatihan & isi Survei Kepuasan Masyarakat (PermenPAN-RB 14/2017) |
| **Event, Artikel & FAQ** | `/event`, `/artikel`, `/faq`, `/tentang` | Pendaftaran event kawasan, berita warta, pusat bantuan, & pencarian global `/search` |

---

## 2. Alur Transaksi Publik (Sewa Fasilitas, E-Katalog & Pelatihan)

### A. Menyewa Fasilitas / Ruangan (`/fasilitas`)
1. Login melalui `/login` (atau daftar akun baru di `/daftar`).
2. Buka `/fasilitas`, pilih ruangan/gedung, cek tanggal kosong pada **Facility Calendar**.
3. Klik **Ajukan Sewa** → isi tanggal, jam, instansi, dan add-on teknis (bila perlu). *(Sistem otomatis mencegah bentrok jadwal).*
4. Tunggu persetujuan Admin Aset → Anda akan menerima email berisi nomor Invoice resmi.

### B. Mendaftar Pelatihan Vokasi (`/program-pelatihan`)
1. Pilih program pelatihan yang diminati → klik **Daftar Sekarang** (`/program-pelatihan/[id]/daftar`).
2. **Kelas Gratis:** Langsung aktif dan dapat segera diakses di **`/ruang-belajar`**.
3. **Kelas Berbayar:** Sistem otomatis menerbitkan Invoice → lanjutkan pembayaran lalu konfirmasi di **`/bukti-bayar`**.

### C. Mengunggah Bukti Pembayaran (`/bukti-bayar`)
1. Buka **`/bukti-bayar`** dan masukkan nomor invoice Anda.
2. Periksa detail tagihan dan nominal yang tertera.
3. Unggah foto/screenshot bukti transfer yang jelas → klik **Kirim Konfirmasi**.
4. Status berubah menjadi **`WAITING_VERIFICATION`** sampai Kasir BLUD menyetujui pembayaran (kwitansi lunas otomatis dikirim ke email Anda).

---

## 3. Halaman Profil Pengguna (`/profil`) & Program Afiliasi

Setelah login, klik menu **Profil Saya (`/profil`)** yang menyediakan 5 tab terpadu:
- **Data Diri:** Perbarui biodata, nomor WhatsApp, instansi, dan foto profil + pintasan cepat sesuai peran (*Role Quick Access*).
- **Riwayat:** Lihat histori pendaftaran kelas, booking fasilitas, dan pesanan katalog.
- **Tagihan:** Pantau seluruh invoice aktif maupun lunas milik Anda.
- **Status Alumni & Karir:** Masukkan kode klaim alumni (bila lulusan STP) untuk naik menjadi role `alumni`.
- **Program Afiliasi (`TabAfiliasi`):** Daftar sebagai mitra afiliasi STP, dapatkan kode referral pribadi untuk dibagikan pada booking/pelatihan, pantau komisi yang otomatis *clear* saat invoice lunas, dan ajukan pencairan komisi.

---

## 4. Akses Khusus Instruktur (`public` dengan flag `isInstructor`)
Pengguna yang diberi penugasan sebagai **Instruktur Pelatihan** tetap menggunakan akun reguler namun mendapatkan akses tambahan ke **`/lms`**, **`/pelatihan/builder`** (menyusun silabus/materi modul), serta **`/pelatihan/[id]/peserta`** (memeriksa kehadiran & meluluskan tugas peserta kelas yang diampu).
