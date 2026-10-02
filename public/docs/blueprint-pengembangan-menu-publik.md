# 🗺️ Blueprint Pengembangan Menu Publik — Sintesa / KST Solo Technopark
**Versi:** 1.0 · **Dibuat:** Oktober 2026 · **Status:** Draft untuk Review

> Dokumen ini merupakan hasil analisa mendalam seluruh halaman publik (`src/app/(public)/`)
> dan rencana penyempurnaannya secara terintegrasi. **Tidak ada eksekusi di sini — hanya blueprint.**

---

## 🔍 Peta Kondisi Saat Ini (Current State Audit)

### Route yang Sudah Ada

| Route | Kondisi | Integrasi Afiliasi | Rating UX |
|-------|---------|-------------------|-----------|
| `/` (Beranda) | ✅ Hero + Stats + Nav | ❌ Belum | ⭐⭐⭐ |
| `/e-katalog` | ✅ Grid + Filter pill | ❌ Belum | ⭐⭐⭐⭐ |
| `/e-katalog/[id]` | ✅ Detail produk | ❌ Belum | ⭐⭐⭐ |
| `/fasilitas` | ✅ List + Kalender + Booking Wizard | ❌ Belum | ⭐⭐⭐⭐ |
| `/program-pelatihan` | ✅ Grid + Filter multi-dimensi | ❌ Belum | ⭐⭐⭐⭐ |
| `/program-pelatihan/[id]` | ✅ Detail + Kurikulum Timeline | ❌ Belum | ⭐⭐⭐⭐ |
| `/program-pelatihan/[id]/daftar` | ✅ Form Pendaftaran + Bayar | ❌ Belum | ⭐⭐⭐ |
| `/ekosistem` | ✅ Directory + Smart Hub Thread | ❌ Belum | ⭐⭐⭐⭐ |
| `/ruang-belajar` | ✅ My Courses Dashboard | ❌ Belum | ⭐⭐⭐ |
| `/artikel` | ✅ List + Search + CTA | ❌ Belum | ⭐⭐⭐ |
| `/event` | ✅ Hero + Grid + Kalender | ❌ Belum | ⭐⭐⭐⭐ |
| `/faq` | ✅ Accordion + Vote | ❌ Belum | ⭐⭐⭐⭐ |
| `/profil` | ✅ 5 Tab (incl. Afiliasi baru) | ✅ TabAfiliasi | ⭐⭐⭐⭐ |
| `/explore` | ✅ AI Chat Krenova | ❌ Belum | ⭐⭐⭐ |
| `/curation` | ✅ AI Scoring Startup Wizard | ❌ N/A | ⭐⭐⭐⭐ |
| `/bukti-bayar` | ✅ Upload bukti manual | ❌ N/A | ⭐⭐⭐ |
| `/peta-kawasan` | ✅ Interactive Map | ❌ N/A | ⭐⭐⭐⭐ |
| `/portal` | ⚠️ Placeholder belum aktif | ❌ N/A | ⭐ |

### Menu Navbar Publik Saat Ini
```
Katalog · Fasilitas · Pelatihan · Ekosistem · Artikel · Event · Ruang Belajar · FAQ
```

---

## 🎯 Prinsip Desain & Integrasi

Seluruh pengembangan mengikuti **4 Pilar Integrasi**:

```
┌─────────────────────────────────────────────────────────┐
│                    INTEGRASI LINTAS DOMAIN               │
│                                                         │
│  Pelatihan ←──→ Katalog ←──→ Fasilitas                  │
│      ↕               ↕              ↕                   │
│  Ekosistem ←──→ Afiliasi ←──→ Artikel                   │
│      ↕               ↕              ↕                   │
│  Profil User ←──→ Ruang Belajar ←──→ Event              │
│                                                         │
│  Attribution: ?ref=CODE via AffiliateTracker (30 hari)  │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Rencana Per Halaman

---

### 1. `/` — Beranda (Landing Page)

**Kondisi saat ini:** Hero + Counter Stats + Pentahelix Grid + Nav ke domain lain

**Gap Teridentifikasi:**
- ❌ Tidak ada featured trainings (pelatihan terbaru/unggulan)
- ❌ Tidak ada event terdekat di Beranda
- ❌ Tidak ada artikel terbaru/featured
- ❌ Stats terasa statis, tidak ada visual real-time
- ❌ Tidak ada social proof (testimoni, alumni stats)
- ❌ Tidak ada CTA afiliasi (undangan bergabung program mitra)

**Rencana Penyempurnaan:**

```
SECTION ORDER IDEAL:
1. Hero Utama          → Tagline + 2 CTA utama (Jelajahi / Daftar Pelatihan)
2. Stats Counter       → Tenant, Pelatihan, Alumni, Fasilitas (animated)
3. Featured Trainings  → Carousel 3 pelatihan terpopuler + badge HOT
4. Upcoming Events     → 2-3 event terdekat + countdown timer
5. Layanan Unggulan    → 4 kartu: Katalog, Fasilitas, Ekosistem, Pelatihan
6. Artikel Terbaru     → 3 artikel dengan gambar
7. Alumni Testimonial  → Carousel quote alumni (dari koleksi alumni)
8. CTA Afiliasi Banner → "Jadilah Mitra — Dapatkan Komisi 5%" + link /profil#afiliasi
9. Peta Kawasan Teaser → Preview map interaktif kecil + tombol "Lihat Peta"
10. Footer + AI Chat   → Tombol floating Krenova AI assistant
```

**Integrasi Data:**
- `useTrainings({ featured: true, limit: 3 })` → 3 pelatihan terpopuler
- `useEvents({ upcoming: true, limit: 3 })` → Event terdekat
- `useArticles({ featured: true, limit: 3 })` → Artikel featured

---

### 2. `/e-katalog` — E-Katalog Produk & Layanan

**Kondisi saat ini:** Grid + Filter kategori pill + Search

**Gap Teridentifikasi:**
- ❌ Tidak ada filter harga (range slider)
- ❌ Tidak ada sorting (harga, nama, terbaru)
- ❌ Tidak ada view toggle (grid / list view)
- ❌ Produk Tenant tidak link ke profil tenant di `/ekosistem`
- ❌ Integrasi afiliasi belum ada
- ❌ Tidak ada featured/banner produk unggulan di atas
- ❌ Tidak ada CTA "Tanyakan ke AI" → `/explore`

**Rencana Penyempurnaan:**

```typescript
// Komponen baru:
<KatalogBanner />               // Produk unggulan featured di atas grid
<KatalogFilterSidebar />        // Filter: kategori, harga, ketersediaan
<KatalogSortControl />          // Sorting: relevan, harga, terbaru
<ViewToggle grid|list />        // Toggle tampilan grid/list
<AffiliateShareButton />        // Salin link afiliasi per produk

// Integrasi:
- Produk Tenant → badge + link ke /ekosistem/[tenantId]
- Attach ?ref=CODE saat user klik CTA beli/tanya
- Banner afiliasi kecil: "Bagikan → Dapat komisi 5%"
```

---

### 3. `/e-katalog/[id]` — Detail Produk

**Gap Teridentifikasi:**
- ❌ Belum ada galeri gambar (hanya 1 gambar)
- ❌ Tidak ada tab Deskripsi | Spesifikasi | Ulasan
- ❌ Tidak ada produk serupa/rekomendasi
- ❌ Tidak ada integrasi afiliasi share button

**Rencana Penyempurnaan:**
- Galeri gambar dengan carousel
- Tab: Deskripsi | Spesifikasi | Ulasan/Review
- Sidebar: Harga, stok, tombol "Hubungi / Pesan"
- Produk serupa di bagian bawah
- Share Button dengan link afiliasi otomatis jika user adalah mitra
- WhatsApp CTA langsung ke nomor KST

---

### 4. `/fasilitas` — Fasilitas & Peminjaman Ruangan

**Kondisi saat ini:** List rooms + Kalender + Booking Wizard Modal

**Gap Teridentifikasi:**
- ❌ Hanya tampil kategori Ruangan — peralatan tidak muncul
- ❌ Kalender tidak menampilkan available slots per jam secara visual
- ❌ Booking wizard tidak attach kode afiliasi ke data booking
- ❌ Tidak ada halaman detail ruangan `/fasilitas/[id]`
- ❌ Tidak ada testimoni pengguna per ruangan
- ❌ Tidak ada bundle promo (ruangan + peralatan)

**Rencana Penyempurnaan:**

```
STRUKTUR BARU:
/fasilitas                → List semua fasilitas (Ruangan + Peralatan)
/fasilitas/[id]           → Detail: galeri, kapasitas, fasilitas, jadwal, review
/fasilitas/[id]/pesan     → Booking form multi-step yang lebih lengkap

Kalender Upgrade:
- Tampilan per jam (06:00-22:00)
- Kode warna: Tersedia (hijau) / Dipesan (merah) / Maintenance (abu)
- Klik slot kosong → langsung buka Booking Wizard

Integrasi Afiliasi:
- Field hidden referralCode di BookingWizardModal
- Populate dari getActiveRefCode() → simpan ke bookingData
```

---

### 5. `/program-pelatihan` — Daftar Pelatihan

**Kondisi saat ini:** Grid + Filter tipe + Harga + Kategori + Search

**Gap Teridentifikasi:**
- ❌ Tidak ada sort by: terpopuler, terbaru, harga terendah
- ❌ Tidak ada filter instruktur
- ❌ Tidak ada filter ada/tidak sertifikasi
- ❌ Tidak ada banner pelatihan unggulan di atas
- ❌ Tidak ada statistik mini (total peserta, rating avg)
- ❌ Tidak ada integrasi afiliasi di card/CTA

**Rencana Penyempurnaan:**

```typescript
// Komponen baru:
<FeaturedTrainingBanner />     // Banner 1 pelatihan unggulan (full-width)
<TrainingStatsBar />           // "5.200+ alumni · 47 program · 98% kepuasan"
<TrainingFilterPanel />        // Filter: tipe, harga, sertifikasi, instruktur
<AffiliateShareButton />       // Salin link afiliasi per card (jika mitra)

// Tambahan di TrainingCard:
- Badge "Popular" / "New" / "Hampir Penuh"
- Quota counter (X kursi tersisa)
- Rating bintang singkat
```

---

### 6. `/program-pelatihan/[id]` — Detail Pelatihan

**Kondisi saat ini:** Hero + Instruktur + Kurikulum Timeline + Info

**Gap Teridentifikasi:**
- ❌ Tidak ada Review / Rating dari alumni
- ❌ Tidak ada video preview/teaser
- ❌ Tidak ada sticky CTA bar saat scroll
- ❌ Tidak ada counter quota real-time
- ❌ Tidak ada artikel terkait
- ❌ Tidak ada social share dengan link afiliasi

**Rencana Penyempurnaan:**
- Reviews: Rating bintang + 3-5 ulasan alumni terverifikasi
- Sticky CTA Bar: muncul setelah scroll 200px → "Daftar — Rp X"
- Quota real-time: `registeredCount / maxParticipants` sebagai progress bar
- Related Articles: artikel dengan CTA tipe TRAINING & itemId sama
- Video teaser embed (YouTube/GDrive)
- Share button: auto-attach `?ref=CODE` jika user mitra aktif

---

### 7. `/program-pelatihan/[id]/daftar` — Form Pendaftaran

**Gap Teridentifikasi:**
- ❌ **Kode referral tidak di-capture** → komisi tidak pernah tercatat!
- ❌ Tidak ada promo/voucher code field
- ❌ Progress indicator kurang jelas
- ❌ Tidak ada WhatsApp confirmation otomatis

**Rencana Penyempurnaan:**

```typescript
// KUNCI: Integrasi Afiliasi di form pendaftaran
import { getActiveRefCode } from '@/components/common/AffiliateTracker';

const refCode = getActiveRefCode(); // dari cookie/localStorage

await trainingService.registerForTraining(trainingId, {
  ...registrationData,
  referralCode: refCode || null,   // ← WAJIB untuk komisi afiliasi
});

// Cloud Function trigger saat invoice PAID:
// → affiliateService.clearPendingCommission(commissionId)
```

Tambahan:
- Promo code field (diskon khusus user tertentu)
- Progress steps visual: `Isi Data → Pilih Pembayaran → Konfirmasi`
- After submit: trigger WhatsApp message konfirmasi ke nomor peserta

---

### 8. `/ekosistem` — Direktori Tenant & Smart Hub

**Kondisi saat ini:** Directory tenant cards + Hub forum threads

**Gap Teridentifikasi:**
- ❌ `/ekosistem/[id]` detail tenant perlu audit kelengkapan
- ❌ Hub Thread tidak ada reply/comment publik
- ❌ Tidak ada filter sektor (Teknologi, Pangan, Fashion, dll)
- ❌ Tidak ada showcase produk tenant di profil
- ❌ Tidak ada link ke katalog untuk produk dari tenant
- ❌ CTA inkubasi tidak cukup menonjol

**Rencana Penyempurnaan:**

```
HALAMAN DETAIL TENANT (/ekosistem/[id]):
- Header: Logo + Nama + Sektor + Stage inkubasi badge
- Tab 1 "Tentang": Profil lengkap, elevator pitch, problem/solution, timeline
- Tab 2 "Produk": Grid produk tenant dari /e-katalog (filter tenantId)
- Tab 3 "Tim": Founder cards dengan LinkedIn
- Tab 4 "Kontak": Website, LinkedIn, email, WhatsApp

INTEGRASI:
- Produk Tenant di katalog → badge + link "Lihat Profil Tenant" → /ekosistem/[id]
- /curation CTA: banner "Bergabung jadi Tenant KST" di atas directory
- Filter sektor: Tech, Pangan, Fashion, Agritech, Edu, Lainnya
```

---

### 9. `/ruang-belajar` — Dashboard Belajar (My Courses)

**Kondisi saat ini:** List kursus terdaftar + filter status

**Gap Teridentifikasi:**
- ❌ Tidak ada progress bar per kursus (% materi selesai)
- ❌ Tidak ada sertifikat yang bisa didownload
- ❌ Tidak ada kursus rekomendasi
- ❌ Tidak ada countdown ujian/deadline
- ❌ Tidak ada link ke `/program-pelatihan` untuk quick-add

**Rencana Penyempurnaan:**

```
SECTIONS BARU:
1. Summary Bar         → Total kursus, selesai, in-progress, sertifikat
2. Active Courses      → Progress bar %, tombol "Lanjutkan"
3. Pending/Waiting     → Pelatihan menunggu konfirmasi/pembayaran
4. Completed + Cert    → Kursus selesai + tombol download sertifikat
5. Rekomendasi        → "Karena Anda ikut X, coba juga Y"

SERTIFIKAT:
- Generate PDF sertifikat dengan nama peserta setelah lulus
- Download button → /lms/[id]/sertifikat
- Share ke LinkedIn (LinkedIn share URL builder)
```

---

### 10. `/artikel` — Warta, Berita & Panduan

**Kondisi saat ini:** List artikel + Search + Filter kategori

**Gap Teridentifikasi:**
- ❌ Tidak ada artikel featured/pinned di atas
- ❌ Tidak ada artikel terpopuler (berdasarkan viewCount)
- ❌ Tidak ada tag cloud
- ❌ Tidak ada newsletter subscription CTA
- ❌ Artikel detail tidak ada artikel terkait / next article
- ❌ Tidak ada share button per artikel

**Rencana Penyempurnaan:**

```
LAYOUT BARU:
┌─────────────────────────────────────────────────────┐
│  [FEATURED ARTICLE — Full Width Hero Card]          │
│  [TERPOPULER — 3 mini cards horizontal]             │
├────────────────────────┬────────────────────────────┤
│  Semua Artikel (Grid)  │  Sidebar:                  │
│  + Filter kategori     │  - Kategori Quick Filter   │
│  + Load more / paging  │  - Tag Cloud               │
│                        │  - Newsletter CTA          │
│                        │  - Pelatihan Terkait CTA   │
└────────────────────────┴────────────────────────────┘

ARTIKEL DETAIL (/artikel/[slug]):
- Reading progress bar (top of page)
- Estimated reading time
- Author bio section di bawah artikel
- Smart CTA dari artikel (TRAINING/CATALOG/FACILITY → deeplink)
- Related articles (berdasarkan kategori/CTA itemId)
- Share buttons: WhatsApp, Twitter/X, Copy Link, LinkedIn
```

---

### 11. `/event` — Agenda & Acara Teknologi

**Kondisi saat ini:** Hero Event + Grid cards + Filter + Search

**Gap Teridentifikasi:**
- ❌ Halaman detail event tidak memadai
- ❌ Pendaftaran event berbayar belum terintegrasi billing
- ❌ Tidak ada countdown timer untuk event upcoming
- ❌ Tidak ada share ke media sosial
- ❌ Tidak ada Google Calendar export

**Rencana Penyempurnaan:**

```
HALAMAN DETAIL EVENT (/event/[id]):
- Hero: Gambar fullscreen + countdown timer + status badge LIVE/UPCOMING
- Info: Tanggal, waktu, lokasi (Google Maps embed jika offline)
- Speakers: Foto + nama + jabatan + LinkedIn
- Agenda/Rundown: Timeline per sesi
- Tiket: Pilih tier + form pendaftaran → Billing invoice terintegrasi
- Share: WhatsApp, Copy Link, Google Calendar (.ics export)
- Post-event: Galeri foto + rekaman video
- Related events: Event serupa yang akan datang
```

---

### 12. `/faq` — Pusat Bantuan

**Kondisi saat ini:** Accordion + Filter + Vote (hanya local state)

**Gap Teridentifikasi:**
- ❌ Vote tidak tersimpan ke Firestore
- ❌ Tidak ada form kirim pertanyaan baru
- ❌ Tidak ada AI FAQ (chat langsung ke Krenova AI)
- ❌ Tidak ada kategorisasi visual per domain

**Rencana Penyempurnaan:**
- Vote simpan ke Firestore (dengan user fingerprint anti-spam)
- Form "Ajukan Pertanyaan Baru" → simpan sebagai draft, notif ke admin
- CTA: "Tidak ketemu jawaban? → Tanya Asisten AI" → `/explore`
- Pengelompokan visual per domain (Pelatihan, Fasilitas, Katalog, dll) dengan icon warna berbeda

---

### 13. `/profil` — Dashboard Akun Publik

**Kondisi saat ini:** 5 Tab (Data Diri, Riwayat, Tagihan, Alumni, Afiliasi)

**Gap Teridentifikasi:**
- ❌ Tab Riwayat tidak ada link ke `/ruang-belajar` untuk kursus aktif
- ❌ Tab Tagihan tidak ada tombol upload ulang bukti bayar
- ❌ Tidak ada notifikasi dalam profil (inbox sederhana)
- ❌ Tidak ada preferensi user
- ❌ TabAfiliasi belum ada chart tren klik per minggu

**Rencana Penyempurnaan:**
- Tambah Tab "Notifikasi": list notif sistem (booking dikonfirmasi, pelatihan dimulai)
- Tab Riwayat: tambah "Lanjutkan Belajar" button jika course masih aktif
- TabAfiliasi: tambah chart tren klik mingguan (chart.js/recharts)
- Quick Edit nama/foto profil inline (tanpa modal terpisah)

---

## 🆕 Halaman Baru yang Perlu Ditambahkan

---

### 14. `/portal` — Dashboard Personalisasi Post-Login ⭐ PRIORITAS TINGGI

**Deskripsi:** Halaman utama setelah login — menampilkan semua hal relevan dengan user.

```
SECTIONS (personalized):
┌──────────────────────────────────────────────────────────┐
│  GREETING HERO: "Selamat datang, [Nama]!"               │
│  AI Tip hari ini (dari Krenova AI)                      │
├─────────────────┬────────────────────────────────────────┤
│  My Courses     │  Upcoming Events yang Saya Daftarkan  │
│  (progress %)   │  Tagihan Jatuh Tempo                  │
├─────────────────┼────────────────────────────────────────┤
│  Pelatihan      │  Artikel Terbaru Sesuai Minat          │
│  Rekomendasi    │  Quick Links: Fasilitas, Katalog       │
├─────────────────┴────────────────────────────────────────┤
│  [AFILIASI BANNER] Jika mitra: Saldo + Link Share       │
└──────────────────────────────────────────────────────────┘
```

**Integrasi:** Auth → useAuth() → role-aware (alumni, tenant, public berbeda tampilan)

---

### 15. `/tentang` — Profil Institusi & Sejarah

```
SECTIONS:
1. Hero: Foto kawasan + tagline institusi
2. Visi & Misi + Nilai Utama
3. Timeline Milestone (2006 → sekarang)
4. Struktur Organisasi (foto + jabatan)
5. Mitra & Sponsor (logo grid)
6. Kontak & Lokasi (Google Maps embed)
7. CTA: "Bergabunglah dengan ekosistem kami"
```

---

### 16. `/search` — Halaman Search Global

```
FITUR:
- Input search global dengan hasil dari semua domain
- Tabs hasil: Semua | Pelatihan | Katalog | Fasilitas | Artikel | Event | Tenant
- Highlight keyword di hasil
- Filter tambahan per tab
- "Tidak ketemu? Tanya AI" → /explore
```

---

## 🔗 Integration Map — Bagaimana Semuanya Terhubung

```
Beranda (/)
├──→ Featured Pelatihan → /program-pelatihan
├──→ Upcoming Event → /event
├──→ Artikel Terbaru → /artikel
├──→ CTA Afiliasi → /profil (Tab Afiliasi)
└──→ AI Assistant → /explore

Program Pelatihan (/program-pelatihan/[id])
├──→ Artikel Smart CTA (type: TRAINING, itemId)
├──→ Daftar: referralCode dari AffiliateTracker cookie
├──→ Share: ?ref=CODE untuk mitra afiliasi
└──→ Ruang Belajar setelah terdaftar & dikonfirmasi

E-Katalog (/e-katalog/[id])
├──→ Produk Tenant → Profil Tenant di /ekosistem/[id]
├──→ Share: ?ref=CODE afiliasi
└──→ Artikel Smart CTA (type: CATALOG)

Fasilitas (/fasilitas)
├──→ Booking → referralCode dari cookie → disimpan ke bookingData
├──→ Artikel Smart CTA (type: FACILITY)
└──→ Share: ?ref=CODE afiliasi

Afiliasi (di /profil Tab Afiliasi)
├──→ Deep Link Generator: Pelatihan, Fasilitas, Katalog
├──→ Commission ← Invoice PAID Cloud Function trigger
└──→ Admin /afiliasi: verifikasi, komisi, pencairan

Ekosistem (/ekosistem/[id])
├──→ Produk Tenant → /e-katalog (filter by tenantId)
└──→ Inkubasi CTA → /curation

Ruang Belajar (/ruang-belajar)
├──→ Progress → /lms/[id] untuk akses materi
├──→ Sertifikat → Download PDF
└──→ Rekomendasi → /program-pelatihan (filter kategori sama)

Artikel (/artikel/[slug])
├──→ Smart CTA: Pelatihan / Katalog / Fasilitas / WhatsApp
└──→ Related Articles berdasarkan kategori

Event (/event/[id])
├──→ Pendaftaran → Billing Invoice (event berbayar)
├──→ Google Calendar export (.ics)
└──→ Share → WhatsApp deeplink

FAQ (/faq)
├──→ Tidak ketemu? → /explore (Krenova AI)
└──→ Ajukan Pertanyaan → Admin Queue di dashboard
```

---

## 📊 Matriks Integrasi Afiliasi per Domain

| Halaman | Capture `?ref=` | Attach ke Transaksi | Share Generator | Status |
|---------|----------------|---------------------|-----------------|--------|
| `/e-katalog` | ✅ Auto (Tracker) | 🔲 Belum | 🔲 Perlu | ❌ |
| `/fasilitas` | ✅ Auto (Tracker) | 🔲 BookingWizard perlu update | 🔲 Perlu | ❌ |
| `/program-pelatihan/[id]/daftar` | ✅ Auto (Tracker) | 🔲 **Urgent: `getActiveRefCode()`** | 🔲 Di detail page | ❌ |
| `/event/[id]` | ✅ Auto (Tracker) | 🔲 Pendaftaran event perlu update | 🔲 Perlu | ❌ |
| `/profil` Tab Afiliasi | — | — | ✅ Deep Link Generator | ✅ |
| Admin `/afiliasi` | — | — | ✅ Dashboard | ✅ |

---

## 🏗️ Komponen Reusable yang Perlu Dibuat

```typescript
// src/components/common/
AffiliateTracker.tsx       ✅ Sudah ada
AffiliateShareButton.tsx   🔲 Tombol salin link dengan ref code otomatis
SocialShareBar.tsx         🔲 WhatsApp, Twitter/X, Copy Link, LinkedIn
CountdownTimer.tsx         🔲 Countdown ke event/deadline pelatihan
ProgressBar.tsx            🔲 Progress course/quota bar
VideoPreview.tsx           🔲 Teaser video embed (YouTube/GDrive)
NewsletterCTA.tsx          🔲 Form subscribe newsletter

// src/components/ui/ (tambahan)
TestimonialCarousel.tsx    🔲 Quote + foto alumni
StatCounter.tsx            🔲 Animated counter (untuk Beranda)
FeaturedBanner.tsx         🔲 Banner hero produk/pelatihan featured
ReadingProgress.tsx        🔲 Reading progress bar untuk artikel
FloatingAIButton.tsx       🔲 Tombol floating Krenova AI assistant
StickyActionBar.tsx        🔲 Sticky bottom CTA saat scroll halaman detail
```

---

## 🛣️ Roadmap Prioritas Eksekusi (5 Sprint)

### 🔴 Sprint 1 — Integrasi Afiliasi ke Transaksi (Impact Tertinggi, 1-2 minggu)
1. Update `/program-pelatihan/[id]/daftar/page.tsx` → `getActiveRefCode()` → attach `referralCode`
2. Update `BookingWizardModal.tsx` (fasilitas) → attach `referralCode`
3. Buat Cloud Function `onInvoicePaid` → auto-clear commission via `affiliateService`
4. Buat `AffiliateShareButton.tsx` → pasang di detail pelatihan & katalog
5. End-to-end test: share link → daftar → bayar → komisi cleared → saldo bertambah

### 🟠 Sprint 2 — Beranda & Portal (Engagement, 2-3 minggu)
1. Rebuild Beranda (`/`) dengan featured sections + stats counter animated
2. Buat `/portal` — dashboard personalisasi post-login
3. Buat `/tentang` — profil institusi
4. `FloatingAIButton` di semua halaman publik → `/explore`

### 🟡 Sprint 3 — Detail Pages & Social Features (3-4 minggu)
1. Penyempurnaan `/program-pelatihan/[id]` (review, sticky CTA, quota counter, teaser video)
2. Penyempurnaan `/event/[id]` (countdown, speakers, tiket billing, Google Calendar .ics)
3. Penyempurnaan `/artikel/[slug]` (reading progress, share bar, smart CTA, related)
4. Buat `/fasilitas/[id]` halaman detail ruangan

### 🟢 Sprint 4 — Search, Discovery & Ekosistem (2-3 minggu)
1. Buat `/search` halaman hasil pencarian global (multi-domain)
2. Penyempurnaan `/ekosistem/[id]` (tab Produk linkage ke /e-katalog)
3. Rekomendasi kursus di `/ruang-belajar`
4. Download sertifikat PDF + LinkedIn share

### 🔵 Sprint 5 — Polish, SEO & Performance (2-3 minggu)
1. Sistem notifikasi sederhana di `/profil`
2. Newsletter subscription (`NewsletterCTA`)
3. FAQ voting persistent ke Firestore
4. Tambah `metadata` export ke seluruh halaman publik (SEO)
5. Structured data Schema.org (Course, Event) untuk SEO Google
6. Buat `sitemap.xml` otomatis dari Firestore
7. Audit Lighthouse Performance → target score >85

---

## 📝 Catatan Teknis

### Firestore Collections Baru yang Dibutuhkan
```
reviews/              → Ulasan alumni per pelatihan/produk
notifications/        → Notifikasi per user (inbox)
newsletter_subs/      → Email newsletter subscribers
event_registrations/  → Registrasi event (terpisah dari booking aset)
article_stats/        → viewCount, readTime per artikel
```

### Environment Variables Tambahan
```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=62812xxxxxxxx   # Nomor WA KST untuk CTA
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=xxx       # Google Maps embed di /tentang
```

### SEO Checklist per Halaman
- [ ] `metadata` export (title, description, og:image)
- [ ] Canonical URL
- [ ] Schema.org structured data (Course, Event, Organization)
- [ ] Alt text semua gambar
- [ ] Sitemap XML otomatis

---

## 📌 Ringkasan Eksekutif — 5 Hal Paling Urgent

> 1. 🔴 **Integrasi `referralCode` ke form daftar pelatihan & booking fasilitas** — agar sistem afiliasi benar-benar menghasilkan komisi nyata
> 2. 🔴 **Cloud Function `onInvoicePaid`** → auto-clear komisi afiliasi saat invoice lunas
> 3. 🟠 **Rebuild Beranda** dengan featured trainings, upcoming events, dan artikel — meningkatkan discovery konten
> 4. 🟠 **Halaman `/portal`** sebagai home post-login yang personalisasi — mengurangi bounce setelah login
> 5. 🟡 **`AffiliateShareButton`** di halaman detail pelatihan & katalog — memudahkan mitra menyebar link

---

*Blueprint ini akan diperbarui secara berkala seiring perkembangan sistem.*
*Untuk eksekusi masing-masing sprint, buat percakapan baru dengan referensi dokumen ini.*
