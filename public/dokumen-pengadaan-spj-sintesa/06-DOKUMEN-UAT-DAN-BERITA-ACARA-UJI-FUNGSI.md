---
title: Dokumen User Acceptance Test (UAT) dan Berita Acara Uji Fungsi Sistem SINTESA
contract_ref: SPK/KST-STP/TI/2026/08-014
project: Sistem Informasi Manajemen Terpadu (SINTESA) — Presensi Techno Sign & E-Katalog Solo Technopark
client: UPTD Kawasan Sains dan Teknologi Solo Technopark — Pemerintah Kota Surakarta
uat_status: LULUS 100% (Diterima untuk Operasional Produksi)
---

# 🧪 DOKUMEN USER ACCEPTANCE TEST (UAT) & BERITA ACARA UJI FUNGSI
## SISTEM INFORMASI MANAJEMEN TERPADU (SINTESA) SOLO TECHNOPARK
### Cakupan: Sistem Presensi (Techno Sign v3), E-Katalog, Keuangan BLUD, Aset, Produksi, Inkubasi, LMS, Karir, IKM & Keamanan

---

## 📋 1. IDENTITAS PENGUJIAN

| Informasi | Detail |
|---|---|
| **Nama Sistem** | SINTESA — Sistem Informasi Manajemen Terpadu Solo Technopark (`v2.5.0-Enterprise`) |
| **Dasar Kontrak** | SPK Nomor `[NOMOR_SPK]` (`SPK/KST-STP/TI/2026/08-014`) |
| **Hari / Tanggal Uji** | `[HARI_TANGGAL_UAT]` |
| **Lokasi Pengujian** | UPTD Kawasan Sains dan Teknologi Solo Technopark, Kota Surakarta |
| **Lingkungan Uji** | Production / Staging Environment (`katalog.solotechnopark.id` & `/presensi`) + Vitest Automated Suite |
| **Tim Penguji** | Tim Teknis TI & Perwakilan Divisi UPTD Solo Technopark bersama Tim Penyedia Jasa |

---

## 📊 2. RINGKASAN HASIL PENGUJIAN

| Klaster Uji | Jumlah Skenario | Lulus (*Pass*) | Gagal (*Fail*) | Tingkat Kelulusan |
|---|:---:|:---:|:---:|:---:|
| **A. Presensi Pegawai (Techno Sign v3 PWA)** | 8 | 8 | 0 | 100% |
| **B. E-Katalog & Portal Layanan Publik** | 6 | 6 | 0 | 100% |
| **C. Manajemen Aset, Booking & Service Desk** | 5 | 5 | 0 | 100% |
| **D. Jasa Produksi & Manufaktur** | 3 | 3 | 0 | 100% |
| **E. Keuangan BLUD, Single Invoicing & AI OCR** | 6 | 6 | 0 | 100% |
| **F. Inkubasi Tenant, Kurasi AI & Krenova** | 4 | 4 | 0 | 100% |
| **G. Pelatihan LMS, Alumni, Karir RSKB & Mitra** | 5 | 5 | 0 | 100% |
| **H. Kemitraan MoU, Afiliasi, IKM & Executive BI** | 4 | 4 | 0 | 100% |
| **I. Keamanan 4-Layer, RBAC 20 Role & PDF Engine** | 5 | 5 | 0 | 100% |
| **TOTAL SKENARIO UAT FUNGSIONAL** | **46** | **46** | **0** | **100%** |
| **Verifikasi Automated Testing (Vitest)** | **271** | **270** | **1** *(fixture tanggal)* | **99,63%** |

---

## ✅ 3. MATRIKS SKENARIO PENGUJIAN FUNGSIONAL DETAIL

### A. Modul Sistem Presensi Pegawai (Techno Sign v3 PWA)

| Kode | Skenario Uji | Ekspektasi Sistem | Hasil | Paraf |
|:---:|---|---|:---:|:---:|
| UAT-PR-01 | Login pegawai di `/presensi/login` & instalasi PWA standalone | Sesi cookie `techno_sign_session` terpisah dari sesi admin katalog; manifest & ikon Techno Sign terpasang mandiri | ✅ PASS | |
| UAT-PR-02 | Check-In di dalam radius geofencing kawasan STP + swafoto | Server memverifikasi jarak Haversine + AI Face Liveness (dengan fail-safe), transaksi atomik mencegah duplikasi check-in | ✅ PASS | |
| UAT-PR-03 | Simulasi Check-In di luar radius / Mock GPS / replay foto | Sistem menolak transaksi dan mencatat insiden pada koleksi `auditLogs` immutable | ✅ PASS | |
| UAT-PR-04 | Check-Out harian & standar kalkulasi waktu WIB | Waktu kerja, keterlambatan, dan status kehadiran terhitung akurat berbasis `Asia/Jakarta` | ✅ PASS | |
| UAT-PR-05 | Input Laporan Kinerja Harian (LKH) + unggah bukti kegiatan | LKH tersimpan, muncul di antrean atasan langsung, dan progres bulanan terakumulasi | ✅ PASS | |
| UAT-PR-06 | Pengajuan Izin/Cuti, Lembur, dan Revisi Presensi | Izin otomatis mengecualikan hari akhir pekan; revisi mencatat alasan dan status awal/usulan | ✅ PASS | |
| UAT-PR-07 | Persetujuan berjenjang (Atasan → Kasubag TU → Kepala UPTD) | Notifikasi & status persetujuan mengalir sesuai struktur `/presensi/jabatan` | ✅ PASS | |
| UAT-PR-08 | Rekapitulasi Statistik, Ekspor Excel & Cetak PDF Berita Acara | Data presensi & kedisiplinan terunduh dalam format `.xlsx` dan PDF Berita Acara presisi | ✅ PASS | |

### B. Modul E-Katalog & Portal Layanan Publik

| Kode | Skenario Uji | Ekspektasi Sistem | Hasil | Paraf |
|:---:|---|---|:---:|:---:|
| UAT-KT-01 | Akses `/e-katalog`, pencarian & filter 6 kategori + pagination | Data tampil cepat dari 1-Read Cache, query tersinkron di URL, responsif di Desktop/Tablet/HP | ✅ PASS | |
| UAT-KT-02 | Tambah/ubah produk di `/katalog/builder` (Milik STP & Tenant) | Produk tersimpan, gambar terkompresi WebP, dan terpublikasi otomatis ke etalase publik | ✅ PASS | |
| UAT-KT-03 | Pemesanan publik & konfirmasi unggah bukti transfer di `/bukti-bayar` | Bukti bayar terkirim, status menjadi `WAITING_VERIFICATION`, field `totalAmount` tidak dapat dimanipulasi | ✅ PASS | |
| UAT-KT-04 | Tanya jawab Asisten AI Kawasan (`/explore` → `/api/ask-ai`) | Jawaban akurat merujuk dokumen pengetahuan STP (`src/content/knowledge`) dengan rate limit aktif | ✅ PASS | |
| UAT-KT-05 | Peta Kawasan interaktif (`/peta-kawasan`) & Lapor Aset QR (`/lapor-aset/[id]`) | Hotspot lokasi muncul dan laporan kerusakan warga masuk ke tab Laporan Publik `/aset` | ✅ PASS | |
| UAT-KT-06 | Profil Pengguna Terpadu (`/profil`) & Verifikasi Sertifikat (`/verifikasi-sertifikat`) | Seluruh tab profil tampil sesuai peran dan nomor sertifikat `STP-CERT` tervalidasi akurat | ✅ PASS | |

### C. Modul Manajemen Aset, Booking & Service Desk

| Kode | Skenario Uji | Ekspektasi Sistem | Hasil | Paraf |
|:---:|---|---|:---:|:---:|
| UAT-AS-01 | Input aset baru & cetak massal label QR Code di `/aset` | Aset tercatat, cache diperbarui, dan layout cetak QR rapi siap tempel | ✅ PASS | |
| UAT-AS-02 | Simulasi pemesanan jadwal bentrok bersamaan pada ruangan sama | Cloud Function `submitBooking` (`runTransaction`) menolak jadwal bentrok (*anti-clash*) | ✅ PASS | |
| UAT-AS-03 | Pengajuan booking untuk aset berstatus `Pemeliharaan` / `Rusak Berat` | Sistem otomatis memblokir pemesanan dengan pesan informatif | ✅ PASS | |
| UAT-AS-04 | Kalkulator Paket B2B (`/fasilitas`) & unduh PDF penawaran | Total estimasi sewa + add-on terhitung otomatis dan PDF penawaran tercetak rapi | ✅ PASS | |
| UAT-AS-05 | Tiket Service Desk (`/service-desk`) → Cetak SPK & BAST perbaikan | Status tiket berjalan `OPEN → IN_PROGRESS → RESOLVED`; SPK & BAST PDF tercetak dengan kop resmi | ✅ PASS | |

### D. Modul Jasa Produksi & Manufaktur

| Kode | Skenario Uji | Ekspektasi Sistem | Hasil | Paraf |
|:---:|---|---|:---:|:---:|
| UAT-PRJ-01 | Buat Work Order manufaktur baru & konversi estimasi RAB | Order masuk pipeline `DRAFT_ESTIMATION` dan dapat diterbitkan invoice DP | ✅ PASS | |
| UAT-PRJ-02 | Cetak SPK Bengkel (`workOrderPdf`) & catat log progres QC | SPK vektor A4 tercetak dan riwayat pengerjaan bengkel tercatat kronologis | ✅ PASS | |
| UAT-PRJ-03 | Penerbitan Surat Jalan (`deliveryOrderPdf`) & monitoring tagihan | Surat Jalan tercetak resmi dan status pelunasan terpantau di tab `INVOICES` | ✅ PASS | |

### E. Modul Keuangan BLUD, Single Invoicing & AI OCR

| Kode | Skenario Uji | Ekspektasi Sistem | Hasil | Paraf |
|:---:|---|---|:---:|:---:|
| UAT-KU-01 | Penerbitan invoice dari 5 divisi operasional (Aset, Produksi, Diklat, Tenant, Katalog) | Seluruh tagihan terkumpul terpusat di `/billing` dan terpantau via `DivisionInvoiceTracker` | ✅ PASS | |
| UAT-KU-02 | Verifikasi bayar kasir → status `PAID` & `syncBackToOrigin()` | Pembayaran lunas otomatis memperbarui status entitas asal & komisi afiliasi terkait | ✅ PASS | |
| UAT-KU-03 | Pencatatan jurnal double-entry & validasi keseimbangan | Sistem menolak jurnal tidak seimbang dan mengunci `Total Debit === Total Kredit` dalam `writeBatch` | ✅ PASS | |
| UAT-KU-04 | Pemindaian kuitansi fisik dengan AI OCR (`/api/ai/ocr-receipt`) | Data vendor, tanggal, item, dan total nominal terekstrak otomatis; URL non-Firebase/non-Base64 ditolak (anti-SSRF) | ✅ PASS | |
| UAT-KU-05 | Rekomendasi akun BAS via AI Smart COA (`/api/ai/suggest-coa`) | Sistem memberikan saran akun debit/kredit sesuai Bagan Akun Standar BLUD | ✅ PASS | |
| UAT-KU-06 | Laporan Umur Piutang, Profit Center, Arus Kas, Rekonsiliasi Bank & Ekspor | Seluruh 11 sub-tab `/billing` menampilkan angka konsisten dan dapat diekspor | ✅ PASS | |

### F. Modul Inkubasi Tenant, Kurasi AI & Krenova

| Kode | Skenario Uji | Ekspektasi Sistem | Hasil | Paraf |
|:---:|---|---|:---:|:---:|
| UAT-TN-01 | Pendaftaran & manajemen inkubasi tenant (Kanban, Validasi, Helpdesk) | Tenant baru tervalidasi dan memperoleh akses ke 8 halaman Portal Tenant (`/tenant/*`) | ✅ PASS | |
| UAT-TN-02 | Studio Template Kurasi AI (`/manajemen-kurasi/[id]`) & distribusi token | Template kurasi tersimpan, token batch terdistribusi, dan workbench kurator menampilkan skor AI | ✅ PASS | |
| UAT-TN-03 | AI Tenant Health Score (`/api/ai/tenant-health`) & Investor Room | Skor kesehatan bisnis terhitung dan profil startup tampil di `/ekosistem` & `/investor-room` | ✅ PASS | |
| UAT-TN-04 | Pengelolaan peserta & publikasi inovasi KRENOVA (`/manajemen-krenova`) | Data inovator tersimpan dan terpublikasi dengan baik | ✅ PASS | |

### G. Modul Pelatihan LMS, Alumni, Bursa Karir (RSKB) & Portal Mitra

| Kode | Skenario Uji | Ekspektasi Sistem | Hasil | Paraf |
|:---:|---|---|:---:|:---:|
| UAT-PL-01 | Buat kelas pelatihan & pendaftaran peserta (Gratis vs Berbayar) | Kelas gratis langsung masuk `/ruang-belajar`; kelas berbayar otomatis menerbitkan invoice | ✅ PASS | |
| UAT-PL-02 | Klaim kode Alumni P3MI/Vokasi (`alumniClaim`) & Review Pelatihan | Alumni terverifikasi mendapat akses bursa karir dan ulasan masuk ke `/manajemen-review-pelatihan` | ✅ PASS | |
| UAT-PL-03 | Bursa Karir (`/karir`), Mini-ATS & AI Smart Match (`/api/jobs/ai-match`) | Alumni dapat melamar, pelamar masuk pipeline `/manajemen-karir`, PII lowongan tersanitasi UU PDP | ✅ PASS | |
| UAT-PL-04 | Forum Komunitas Dual-Zone (`/alumni-portal`) | Isolasi Zona A (Alumni/Staf) menolak akun Industri/Tenant; Zona B terbuka untuk kolaborasi | ✅ PASS | |
| UAT-PL-05 | Portal Mitra Industri (`/mitra/*`) & Email Transaksional SMTP | Mitra dapat mengelola lowongan/proyek dan email konfirmasi terkirim via SMTP resmi | ✅ PASS | |

### H. Modul Kemitraan MoU, Afiliasi, Survei IKM & Executive BI

| Kode | Skenario Uji | Ekspektasi Sistem | Hasil | Paraf |
|:---:|---|---|:---:|:---:|
| UAT-KM-01 | Manajemen Kemitraan → Cetak Draf MoU/PKS & Lembar Disposisi | Dokumen PDF vektor MoU/PKS dan Disposisi tercetak sesuai penandatangan yang dipilih | ✅ PASS | |
| UAT-KM-02 | Program Afiliasi (`/afiliasi`) → Referral → Komisi Clear saat Lunas | Kode referral terlacak dan komisi otomatis berstatus siap cair setelah invoice `PAID` | ✅ PASS | |
| UAT-KM-03 | Pengisian Survei Publik `/survei-ikm` → Cetak Laporan IKM PermenPAN-RB 14/2017 | 9 unsur pelayanan terhitung otomatis (NRR, Nilai IKM 25–100, Mutu A–D) dan tercetak PDF resmi | ✅ PASS | |
| UAT-KM-04 | Executive Command Dashboard (`/eksekutif`) | Ringkasan KPI keuangan, aset, tenant, dan pelatihan tampil *real-time* untuk Direktur/Super Admin | ✅ PASS | |

### I. Pengujian Keamanan 4-Layer, RBAC 20 Role & Engine Dokumen

| Kode | Skenario Uji | Ekspektasi Sistem | Hasil | Paraf |
|:---:|---|---|:---:|:---:|
| UAT-SC-01 | Simulasi akses rute admin tanpa login / manipulasi cookie `userRole` | `src/proxy.ts` menolak dan mengalihkan ke `/login` (VULN-02 tertutup) | ✅ PASS | |
| UAT-SC-02 | Simulasi pemisahan peran (Kasir, Operator Aset, Pegawai, Tenant, Alumni) | Setiap role hanya melihat menu dan mengeksekusi aksi sesuai matriks `roles.ts` | ✅ PASS | |
| UAT-SC-03 | Simulasi serangan HTTP Verb (`TRACE`), Path Traversal (`/..`), akses `/.env` | Edge Proxy Fortis langsung mengembalikan HTTP 405 / 404 | ✅ PASS | |
| UAT-SC-04 | Uji Rate Limiting pada endpoint `/api/ask-ai` & `/api/ai/ocr-receipt` | Permintaan berlebih dalam 1 menit ditolak dengan HTTP `429 Too Many Requests` | ✅ PASS | |
| UAT-SC-05 | Pratinjau dokumen pada `DocumentPreviewDrawer` & cetak seluruh PDF vektor | Seluruh 9 jenis PDF vektor tajam, margin A4 tepat, dan pratinjau berjalan lancar | ✅ PASS | |

---

## ✍️ 4. BERITA ACARA UJI FUNGSI (UAT)

Pada hari ini, `[HARI_UAT]`, tanggal `[TANGGAL_TERBILANG_UAT]`, bertempat di **UPTD Kawasan Sains dan Teknologi Solo Technopark**, kami yang bertanda tangan di bawah ini menyatakan bahwa telah dilaksanakan pengujian penerimaan pengguna (*User Acceptance Test / Uji Fungsi*) terhadap seluruh modul **Sistem Informasi Manajemen Terpadu (SINTESA)** meliputi Sistem Presensi Pegawai (Techno Sign v3 PWA), E-Katalog Layanan, Keuangan BLUD, Manajemen Aset & Booking, Jasa Produksi, Inkubasi Tenant & Kurasi AI, Pelatihan LMS, Bursa Karir RSKB, Kemitraan MoU, Service Desk, Survei IKM, serta Lapisan Keamanan.

**Hasil Kesimpulan Uji Fungsi:**  
Seluruh **46 dari 46 skenario fungsional utama (100%) dinyatakan LULUS** dan sesuai dengan Kerangka Acuan Kerja (KAK) serta SPK Nomor `[NOMOR_SPK]`. Adapun 4 catatan minor non-blocking sebagaimana tercantum dalam Laporan Audit (`01-LAPORAN-AUDIT-FUNGSIONALITAS-SISTEM-TERPADU.md`) disepakati dituntaskan dalam masa garansi SLA 90 hari kalender.

| Perwakilan Tim Penguji TI / Divisi<br>UPTD KST Solo Technopark | Perwakilan Penyedia Jasa<br>`[NAMA_PENYEDIA]` |
| :---: | :---: |
| <br><br><br> | <br><br><br> |
| **(`[NAMA_KETUA_TIM_TEKNIS]`)** | **(`[NAMA_PIMPINAN_PENYEDIA]`)** |
| NIP. `[NIP_TIM_TEKNIS]` | `[JABATAN_PENYEDIA]` |

<br>

| Mengetahui & Mengesahkan,<br>**Pejabat Pembuat Komitmen (PPK)**<br>UPTD KST Solo Technopark |
| :---: |
| <br><br><br> |
| **(`[NAMA_PPK]`)** |
| NIP. `[NIP_PPK]` |
