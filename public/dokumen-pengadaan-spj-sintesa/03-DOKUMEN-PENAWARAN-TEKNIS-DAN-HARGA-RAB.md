---
title: Dokumen Penawaran Teknis dan Harga (RAB / Bill of Quantities)
project: Pengembangan dan Integrasi Sistem Informasi Manajemen Terpadu (SINTESA) Solo Technopark
client: UPTD Kawasan Sains dan Teknologi Solo Technopark — Pemerintah Kota Surakarta
offer_number: 012/PNW-SINTESA/STP/2026
total_offer_idr: 80.000.000
validity_days: 30 Hari Kalender
---

# 📄 DOKUMEN PENAWARAN TEKNIS DAN HARGA (RAB)
## PENGEMBANGAN DAN INTEGRASI SISTEM INFORMASI MANAJEMEN TERPADU (SINTESA)
### UPTD KAWASAN SAINS DAN TEKNOLOGI SOLO TECHNOPARK

---

## BAGIAN I — SURAT PENAWARAN RESMI

**Nomor:** `012/PNW-SINTESA/STP/2026`  
**Lampiran:** 1 (Satu) Berkas Proposal Teknis, Pakta Integritas & Rincian RAB/BoQ  
**Perihal:** Penawaran Pekerjaan Pengembangan dan Integrasi Sistem Informasi Manajemen Terpadu (SINTESA) Solo Technopark

**Kepada Yth.**  
**Pejabat Pengadaan / Pejabat Pembuat Komitmen (PPK)**  
UPTD Kawasan Sains dan Teknologi Solo Technopark  
Jl. Ki Hajar Dewantara No. 19, Jebres, Kota Surakarta, Jawa Tengah 57126

Dengan hormat,

Sehubungan dengan Kerangka Acuan Kerja (KAK) dan Undangan Pengadaan Langsung untuk pekerjaan **Pengembangan dan Integrasi Sistem Informasi Manajemen Terpadu (SINTESA): Sistem Presensi Pegawai (Techno Sign), E-Katalog Layanan, dan Manajemen Operasional BLUD Solo Technopark**, setelah mempelajari dengan saksama seluruh persyaratan teknis dan administratif, dengan ini kami:

- **Nama Penyedia:** `[NAMA_PENYEDIA]`
- **Alamat:** `[ALAMAT_PENYEDIA]`
- **NPWP:** `[NPWP_PENYEDIA]`
- **NIB / Legalitas:** `[NIB_PENYEDIA]`

mengajukan penawaran untuk melaksanakan pekerjaan tersebut dengan nilai penawaran sebesar:

$$\mathbf{Rp\ 80.000.000,-\ (Delapan\ Puluh\ Juta\ Rupiah)}$$

Penawaran ini berlaku selama **30 (tiga puluh) hari kalender** sejak tanggal surat penawaran ini dan mengikat kami untuk menyelesaikan seluruh lingkup pekerjaan dalam jangka waktu **60 (enam puluh) hari kalender**, disertai **masa garansi pemeliharaan & SLA selama 90 (sembilan puluh) hari kalender** terhitung sejak Berita Acara Serah Terima (BAST).

Kami menyatakan tunduk pada seluruh ketentuan dalam KAK, peraturan pengadaan barang/jasa pemerintah, serta tata kelola keuangan BLUD Pemerintah Kota Surakarta.

Surakarta, `[TANGGAL_PENAWARAN]`  
Hormat kami,  
**`[NAMA_PENYEDIA]`**

*(Meterai Rp 10.000,- & Stempel)*

**`[NAMA_PIMPINAN_PENYEDIA]`**  
`[JABATAN_PENYEDIA]`

---

## BAGIAN II — PAKTA INTEGRITAS PENYEDIA

Saya yang bertanda tangan di bawah ini:
- **Nama:** `[NAMA_PIMPINAN_PENYEDIA]`
- **Jabatan:** `[JABATAN_PENYEDIA]`
- **Bertindak untuk dan atas nama:** `[NAMA_PENYEDIA]`

dalam rangka pengadaan pekerjaan **Pengembangan dan Integrasi Sistem Informasi Manajemen Terpadu (SINTESA) UPTD KST Solo Technopark**, dengan ini menyatakan bahwa:
1. Tidak akan melakukan praktik Korupsi, Kolusi, dan Nepotisme (KKN).
2. Akan melaporkan kepada PA/KPA/APIP apabila mengetahui terdapat indikasi praktik KKN dalam proses pengadaan ini.
3. Akan mengikuti proses pengadaan secara bersih, transparan, dan profesional untuk memberikan hasil kerja terbaik sesuai ketentuan peraturan perundang-undangan.
4. Seluruh perangkat lunak dan *source code* yang diserahkan adalah karya orisinal bebas sengketa Hak Kekayaan Intelektual (HKI) dan tidak mengandung *backdoor* atau kode berbahaya.
5. Apabila melanggar hal-hal yang dinyatakan dalam Pakta Integritas ini, bersedia menerima sanksi administratif, daftar hitam, dan/atau gugatan hukum sesuai peraturan perundang-undangan.

Surakarta, `[TANGGAL_PENAWARAN]`  
Yang menyatakan,  
**`[NAMA_PIMPINAN_PENYEDIA]`** (`[JABATAN_PENYEDIA]`)

---

## BAGIAN III — PROPOSAL TEKNIS & METODOLOGI PELAKSANAAN

### 1. Pendekatan Arsitektur Solusi Terpadu
Kami membangun **SINTESA** di atas arsitektur *Unified Cloud-Native Web & PWA* yang modern, efisien biaya operasional (*serverless pay-as-you-go*), dan mudah dikelola oleh tim internal Solo Technopark:
- **Frontend & Edge Security:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, serta Edge Proxy JWT & Fortis Hardening (`src/proxy.ts`).
- **Backend & Database:** Firebase Authentication (Custom Claims), Cloud Firestore (Dual-Path + 1-Read Cache), Cloud Storage, dan Cloud Functions v2 (region `asia-southeast2` Jakarta).
- **Kecerdasan Buatan Terpusat:** Clario AI Unified Wrapper (`src/lib/clario.ts`) dengan 15 model spesialisasi untuk OCR Nota Keuangan, Smart COA, AI Liveness Presensi, Kurasi Multi-Agen Startup/Produk, Job Smart Match, dan RAG Chatbot Kawasan.
- **Standalone PWA Presensi (Techno Sign v3):** Aplikasi presensi terisolasi pada rute `/presensi/*` dengan cookie sesi terpisah, Service Worker khusus, IndexedDB offline resilience, geofencing server-side, dan approval berjenjang.
- **Mesin Dokumen Vektor (`stpDocumentKit`):** Generator dokumen legal/operasional PDF presisi A4 untuk SPK, BAST, Surat Jalan, Draf MoU/PKS, Lembar Disposisi, Invoice/Kwitansi, dan Laporan IKM PermenPAN-RB 14/2017.

### 2. Metodologi Pengembangan (*Agile-Iterative + DevSecOps*)
1. **Fase Inisiasi & Audit Kebutuhan:** Pemetaan proses bisnis 9 divisi, sinkronisasi Bagan Akun Standar (BAS) BLUD, dan penyusunan skema Zod.
2. **Fase Implementasi Modular (5 Paket):** Pengembangan paralel berbasis komponen reusable (Admin UI Gen-2 & Public UI Standard) dan service layer terpisah.
3. **Fase Verifikasi Otomatis & Penetration Testing:** Pembuatan *automated test suite* (Vitest) mencakup logika akuntansi, anti-clash booking, alur presensi, RBAC 20 role, dan simulasi celah keamanan (VULN-01 s.d. VULN-06 + Fortis).
4. **Fase UAT, Deployment & Transfer of Knowledge:** Uji fungsi langsung bersama perwakilan setiap divisi, pelatihan operator, penyerahan dokumentasi 12 role, dan *go-live production*.

### 3. Komposisi Tim Pelaksana

| No. | Nama Personel | Posisi dalam Proyek | Alokasi | Pengalaman Inti |
|:---:|---|---|:---:|---|
| 1 | `[NAMA_LEAD_ARCHITECT]` | Lead Enterprise Architect & Project Manager | 100% | Arsitektur Next.js/Firebase, Keuangan BLUD, Security Hardening |
| 2 | `[NAMA_FULLSTACK_DEV]` | Senior Full-Stack & Cloud Functions Engineer | 100% | PWA Presensi, E-Katalog, LMS, Mini-ATS, Cloud Functions v2 |
| 3 | `[NAMA_UI_QA_ENGINEER]` | UI/UX Engineer & QA Automation Specialist | 100% | Design System 3 Perangkat, Vitest Automation, UAT & Dokumentasi |

---

## BAGIAN IV — RINCIAN ANGGARAN BIAYA (RAB / BILL OF QUANTITIES)

### A. Ringkasan Rekapitulasi Penawaran per Paket Pekerjaan

| No. | Kode Paket | Uraian Paket Pekerjaan & Lingkup Utama | Bobot | Jumlah Biaya (Rp) |
|:---:|:---:|---|:---:|---:|
| 1 | **PKT-01** | **Core Engine, Arsitektur Hybrid Firestore & Security Hardening Berlapis** | 18,75% | Rp 15.000.000 |
| 2 | **PKT-02** | **Sistem Keuangan BLUD, E-Katalog & Single Invoicing Gateway Lintas Divisi** | 23,75% | Rp 19.000.000 |
| 3 | **PKT-03** | **Ekosistem Kemitraan B2B, Bursa Karir (RSKB), LMS, Inkubasi Tenant & Kurasi AI** | 20,00% | Rp 16.000.000 |
| 4 | **PKT-04** | **Platform Presensi Pegawai Mandiri, LKH & Disiplin (Techno Sign v3 PWA)** | 18,75% | Rp 15.000.000 |
| 5 | **PKT-05** | **Mesin Dokumen Vektor (stpDocumentKit), Service Desk, MoU & Evaluasi IKM** | 18,75% | Rp 15.000.000 |
| | | **TOTAL PENAWARAN PEKERJAAN (NETTO / SEBELUM PPN OPSIONAL)** | **100,00%** | **Rp 80.000.000** |

**Terbilang:** *# Delapan Puluh Juta Rupiah #*

---

### B. Rincian Detail *Bill of Quantities* (BoQ) per Sub-Komponen

| Kode | Uraian Item Pekerjaan / Deliverables | Vol | Satuan | Harga Satuan (Rp) | Total (Rp) |
|:---:|---|:---:|:---:|---:|---:|
| **1.0** | **PKT-01: Core Engine, Arsitektur Hybrid & Security Hardening** | | | | **15.000.000** |
| 1.1 | Setup Next.js 16 App Router, Design System 3 Perangkat (14 Admin + 7 Public Shared Components) & Dual-Path Firestore (`appId.ts`) | 1 | Paket | 4.000.000 | 4.000.000 |
| 1.2 | Implementasi RBAC 20 Role × 44 Permissions (`roles.ts`), Edge Proxy JWT + Fortis Hardening (`src/proxy.ts`), & 923 baris `firestore.rules` | 1 | Paket | 4.500.000 | 4.500.000 |
| 1.3 | Pembangunan & Migrasi 21 Modul Cloud Functions v2 (`asia-southeast2`, Custom Claims, 1-Read Cache, Composite Indexes) | 1 | Paket | 3.500.000 | 3.500.000 |
| 1.4 | Audit Penetrasi Keamanan (Remediasi VULN-01 s.d. VULN-06), Rate Limiting API AI, & Automated Test Suite (Vitest) | 1 | Paket | 3.000.000 | 3.000.000 |
| **2.0** | **PKT-02: Sistem Keuangan BLUD, E-Katalog, Aset/Booking & Jasa Produksi** | | | | **19.000.000** |
| 2.1 | Modul E-Katalog Publik & Admin Builder (`/e-katalog`, `/katalog/builder`, multi-owner STP & Tenant, Portal `/bukti-bayar`) | 1 | Paket | 4.000.000 | 4.000.000 |
| 2.2 | Single Invoicing Gateway & `DivisionInvoiceTracker` terintegrasi pada 5 Divisi Operasional + `syncBackToOrigin` | 1 | Paket | 4.000.000 | 4.000.000 |
| 2.3 | Sistem Akuntansi Double-Entry BLUD (BAS Kemendagri, 11 Sub-Tab Billing, Aging Piutang, Profit Center, Rekonsiliasi Bank) | 1 | Paket | 4.500.000 | 4.500.000 |
| 2.4 | Integrasi AI OCR Vision Pembaca Nota (`/api/ai/ocr-receipt`) & AI Smart COA Classifier (`/api/ai/suggest-coa`) | 1 | Paket | 2.500.000 | 2.500.000 |
| 2.5 | Modul Manajemen Aset (QR Massal), Booking Anti-Clash (`submitBooking` Tx) & Jasa Produksi Manufaktur (Work Order 7 Tahap) | 1 | Paket | 4.000.000 | 4.000.000 |
| **3.0** | **PKT-03: Ekosistem Inkubasi, Kurasi AI, Pelatihan LMS, Karir RSKB & Mitra** | | | | **16.000.000** |
| 3.1 | Manajemen Inkubasi Tenant, Portal Mandiri Tenant (8 Halaman), Investor Room, Krenova & Universal AI Curation Studio (`/manajemen-kurasi`) | 1 | Paket | 5.000.000 | 5.000.000 |
| 3.2 | Modul Pelatihan Vokasi, LMS (`/lms`, `/ruang-belajar`), Verifikasi E-Sertifikat, Review Diklat & Klaim Alumni P3MI | 1 | Paket | 4.000.000 | 4.000.000 |
| 3.3 | Bursa Karir RSKB, Zero-Cost ATS Crawler (UU PDP Sanitizer), AI Smart Matchmaking, Mini-ATS & Tracer Study Alumni | 1 | Paket | 3.500.000 | 3.500.000 |
| 3.4 | Portal Mitra Industri (5 Halaman), Forum Komunitas Dual-Zone, Afiliasi, Explore AI RAG Chat & Otomasi Email SMTP | 1 | Paket | 3.500.000 | 3.500.000 |
| **4.0** | **PKT-04: Platform Presensi Pegawai Mandiri & Disiplin (Techno Sign v3 PWA)** | | | | **15.000.000** |
| 4.1 | Arsitektur PWA Mandiri Terisolasi (`/presensi/*`, Cookie Sesi Terpisah, Service Worker, Offline IndexedDB & Network Sentinel) | 1 | Paket | 3.500.000 | 3.500.000 |
| 4.2 | Mesin Check-In/Out Atomic Transaction, Zero-Trust Geofencing Haversine, Deteksi Mock GPS/Impossible Travel & AI Face Liveness | 1 | Paket | 4.500.000 | 4.500.000 |
| 4.3 | Modul LKH (Logbook Harian), Izin/Cuti, Lembur, Revisi Presensi & Approval Berjenjang (Atasan → TU → Kepala UPTD) | 1 | Paket | 4.000.000 | 4.000.000 |
| 4.4 | Manajemen Pegawai & Jabatan, Kalender, Statistik AI, Ekspor Excel, PDF Berita Acara & Audit Log Forensik Immutable | 1 | Paket | 3.000.000 | 3.000.000 |
| **5.0** | **PKT-05: Mesin Dokumen Vektor (stpDocumentKit), Service Desk, MoU & IKM** | | | | **15.000.000** |
| 5.1 | Engine PDF Vektor A4 (`stpDocumentKit` — 9 Generator Dokumen Resmi + Modal Penandatangan + In-App Preview Drawer) | 1 | Paket | 4.000.000 | 4.000.000 |
| 5.2 | Modul Service Desk Pemeliharaan Aset (Cetak SPK & BAST) + Laporan Kerusakan Publik QR (`/lapor-aset`) | 1 | Paket | 3.000.000 | 3.000.000 |
| 5.3 | Modul Manajemen Kemitraan (Cetak Draf MoU/PKS, Disposisi, AI Partnership Match, Open Project & Simulasi Pembiayaan) | 1 | Paket | 3.000.000 | 3.000.000 |
| 5.4 | Modul Survei & Laporan Resmi IKM Standar PermenPAN-RB No. 14/2017 + Executive Command Dashboard (`/eksekutif`) | 1 | Paket | 2.500.000 | 2.500.000 |
| 5.5 | Penyusunan 12 Buku Panduan Role (MD & PDF), Pelatihan Operator (ToK), Deployment Produksi & Garansi SLA 90 Hari | 1 | Paket | 2.500.000 | 2.500.000 |
| | **JUMLAH TOTAL PENAWARAN** | | | | **80.000.000** |

---

## BAGIAN V — KETENTUAN LAYANAN, PEMBAYARAN & GARANSI

1. **Sifat Harga:** Harga bersifat *lumpsum* (pasti dan tetap) mencakup seluruh jasa pengembangan, pengujian, dokumentasi, deployment, dan pelatihan (*Transfer of Knowledge*), tidak termasuk biaya langganan infrastruktur pihak ketiga (domain, cloud hosting/Firebase Blaze, kuota API AI, SMTP email) yang dimiliki langsung atas nama akun resmi Solo Technopark.
2. **Perpajakan:** Pemotongan/pemungutan pajak (PPh Pasal 23 / PPh Final UMKM / PPh 21 / PPN sesuai status legal Penyedia) mengikuti ketentuan perpajakan bendahara pengeluaran BLUD Pemerintah Kota Surakarta.
3. **Garansi & SLA (90 Hari Kalender):**
   - Perbaikan *bug/error* fungsionalitas gratis selama 90 hari kalender sejak tanggal BAST.
   - Waktu respons insiden kritis (*system down / billing error*): ≤ 4 jam kerja; insiden minor: ≤ 24 jam kerja.
4. **Hak Kekayaan Intelektual:** Diserahkan 100% kepada UPTD Kawasan Sains dan Teknologi Solo Technopark setelah pelunasan pembayaran.

---

Surakarta, `[TANGGAL_PENAWARAN]`  
**`[NAMA_PENYEDIA]`**

<br><br><br>

**`[NAMA_PIMPINAN_PENYEDIA]`**  
`[JABATAN_PENYEDIA]`
