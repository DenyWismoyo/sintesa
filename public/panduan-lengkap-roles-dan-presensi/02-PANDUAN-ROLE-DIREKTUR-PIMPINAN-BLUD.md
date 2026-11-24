---
title: Panduan Penggunaan Role Direktur / Kepala UPTD BLUD
roles: direktur
system: SINTESA — Solo Technopark
---

# 🏛️ PANDUAN PENGGUNAAN: DIREKTUR / KEPALA UPTD BLUD
**Role Terkait:** `direktur` (Direktur / Kepala UPTD Kawasan Sains & Teknologi Solo Technopark)

---

## 1. Peran & Cakupan Akses Eksekutif

Role `direktur` dirancang sebagai **Pusat Kendali Pengambilan Keputusan Strategis (*Executive Oversight*)** dengan akses baca-pantau lintas divisi tanpa dibebani input transaksi teknis harian:

- **Menu Utama yang Tersedia:**
  1. **Executive Command (`/eksekutif`)** — Dasbor ringkasan eksekutif real-time lintas seluruh pilar BLUD.
  2. **Dashboard (`/dashboard`)** — Ringkasan aktivitas harian kawasan.
  3. **Monitoring Keuangan (`/billing`)** — Pantau realisasi pendapatan, pengeluaran AP, umur piutang, profit center per divisi, arus kas, dan laporan BAS (*read-only / laporan*).
  4. **Monitoring Operasional:** Manajemen Aset (`/aset`), Booking & Jadwal (`/booking`), Jasa Produksi (`/jasa-produksi`), dan Service Desk (`/service-desk`).
  5. **Monitoring Ekosistem & Pendidikan:** Inkubasi Tenant (`/tenant`), Kurasi & Asesmen AI (`/manajemen-kurasi`), Kemitraan & MoU (`/manajemen-kemitraan`), Pelatihan (`/pelatihan`), Review Pelatihan (`/manajemen-review-pelatihan`), Bursa Karir (`/karir`), serta Evaluasi Survei IKM (`/manajemen-ikm`).
  6. **Presensi Pegawai (`/presensi`)** — Akses pengesahan akhir (Level Tertinggi) pada persetujuan cuti/izin, lembur, LKH pejabat struktural, dan rekap disiplin organisasi.

---

## 2. Panduan Menggunakan Executive Command (`/eksekutif`)

1. Login melalui `/login` menggunakan akun resmi Direktur/Kepala UPTD.
2. Pilih menu **Executive Command** (`/eksekutif`) di sidebar kiri.
3. Pantau indikator utama (*Key Performance Indicators / KPI*):
   - **Pendapatan & Realisasi BLUD:** Total tagihan terbit, total penerimaan lunas (*paid*), total piutang berjalan, dan kontribusi pendapatan per divisi (*Profit Center*).
   - **Utilisasi Aset & Produksi:** Tingkat keterisian ruangan/fasilitas sewa, status tiket Service Desk, dan jumlah *Work Order* manufaktur aktif.
   - **Kesehatan Inkubasi & Pelatihan:** Jumlah tenant aktif, traksi omzet binaan, total lulusan vokasi, serta serapan kerja alumni RSKB.
   - **Indeks Kepuasan Masyarakat (IKM):** Nilai konversi IKM (skala 25–100) dan kategori mutu pelayanan (A/B/C/D) standar PermenPAN-RB No. 14/2017.

---

## 3. Peninjauan & Pengesahan Dokumen Strategis

| Dokumen / Proses | Lokasi Menu | Aksi Direktur / KPA |
|---|---|---|
| **Laporan Resmi IKM (PermenPAN-RB 14/2017)** | `/manajemen-ikm` | Tinjau nilai 9 unsur pelayanan, klik **Cetak Laporan IKM PDF**, pilih penandatangan Kepala UPTD, pratinjau di *Document Preview Drawer*, dan unduh untuk pelaporan Pemkot Surakarta. |
| **Draf MoU / PKS & Lembar Disposisi Kemitraan** | `/manajemen-kemitraan` | Tinjau pipeline calon mitra, telaah staf, analisis finansial BLUD, dan cetak Draf MoU/PKS resmi. |
| **Laporan Keuangan Laba/Rugi Divisi & Arus Kas** | `/billing?tab=PROFIT_CENTER` & `CASH_FLOW` | Evaluasi kinerja keuangan tiap unit layanan (Aset, Produksi, Diklat, Tenant, Katalog) sebagai bahan rapat RBA BLUD. |
| **Hasil Kurasi Startup & Produk Unggulan** | `/manajemen-kurasi` | Pantau skor evaluasi AI & kurator untuk seleksi tenant baru atau produk unggulan e-katalog. |
| **Disiplin & Persetujuan Akhir Kepegawaian** | `/presensi/approval` & `/presensi/statistik` | Lihat panduan lengkap di [`13-PANDUAN-PRESENSI-ATASAN-APPROVER.md`](./13-PANDUAN-PRESENSI-ATASAN-APPROVER.md). |
