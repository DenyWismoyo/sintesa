---
name: sintesa-ai-integration
description: >
  Panduan dan standar integrasi Clario AI di ekosistem Sintesa/Teknopark.
  Mencakup katalog 15 model Clario dan spesialisasi keunggulannya, standar
  wrapper src/lib/clario.ts, penanganan JSON structured output, multimodal
  vision (OCR kuitansi & inspeksi fisik), image generation, serta proteksi
  kuota model restricted. Gunakan skill ini saat membuat atau memperbarui fitur AI.
---

# 🤖 Sintesa AI Integration — Clario AI Architecture & Standards

Sistem Sintesa / Solo Technopark menggunakan **CLARIO_API_KEY** sebagai satu-satunya
penyedia kecerdasan buatan (AI) terpusat. Seluruh penggunaan Gemini API telah
dihentikan dan digantikan sepenuhnya oleh model-model Clario terpilih sesuai dengan
keunggulan spesifik masing-masing.

---

## 🎯 1. Katalog & Matriks Spesialisasi 15 Model Clario

Berikut adalah matriks resmi pemilihan model AI di lingkungan Sintesa/Teknopark:

| Kategori | Model ID | Keunggulan & Karakteristik | Kasus Penggunaan di Sintesa |
| :--- | :--- | :--- | :--- |
| **Conversational (Fast)** | `clario/glm-5.3-flash` | Latensi sangat rendah, ramah, respons instan | **Chatbot Pemandu Pameran KRENOVA (`/api/ask-ai`)**, customer service publik, live onboarding |
| **Conversational (Flagship)** | `clario/glm-5.3` | Flagship NLP terbaru, pemahaman konteks mendalam | Ringkasan profil tenant, asisten konsultasi bisnis publik, FAQ dinamis |
| **Conversational (Stable)** | `clario/glm-5.2` | Generasi stabil sebelumnya | Failover / backup saat GLM-5.3 mengalami rate limit |
| **Fast Reasoning & JSON** | `clario/deepseek-v4-flash` | Perhitungan cepat, logika presisi, JSON murni | **AI Curation Scoring (`/api/curation-ai`)**, evaluasi form registrasi, kalkulasi skor KPI |
| **Deep Reasoning & Finance** | `clario/deepseek-v4-pro-0813` | Deep reasoning, pemahaman akuntansi & audit tingkat tinggi | **Smart COA Recommender (`/api/ai/suggest-coa`)**, Tenant Financial Health Score, deteksi anomali jurnal |
| **Fast Extraction** | `clario/deepseek-v4-flash-0731` | Logika ekstraksi terstruktur cepat | Ekstraksi entitas dari formulir registrasi tenant |
| **Multimodal / Vision OCR** | `clario/qwen3-vl-235b-a22b-instruct` | Vision-Language 235B MoE, pembaca teks & gambar resolusi tinggi | **OCR Kuitansi/Nota Pengeluaran**, Verifikasi Foto Kerusakan Aset/Gedung, Validasi NIB/KTP |
| **Multimodal Alternative** | `clario/ernie-4.5-vl-424b-a47b` | Model Vision 424B berskala masif | Analisis denah kawasan fisik / site plan 2D/3D teknopark |
| **Indonesian Native Quality** | `clario/qwen3.8-27b` | Pemahaman regulasi & Bahasa Indonesia baku luar biasa | Notula rapat pendampingan, ringkasan laporan BLUD ke Pemda |
| **Long Context Synthesis** | `clario/mimo-v2.5-pro` | Penalaran dokumen panjang & perencanaan terstruktur | **Kurikulum Inkubasi Personal (`/api/ai/generate-curriculum`)**, sintesis laporan tahunan kawasan |
| **Creative Storytelling** | `clario/minimax-m3` | Bahasa persuasif, emosional & memikat | Pembuat rilis pers produk tenant, copywriting landing page event & workshop |
| **Executive / High-Stakes** | `clario/claude-opus-5` *(Quota Terbatas)* | Penalaran tingkat institusional, analisis hukum | **Review Draft MoU / Kontrak Tenant**, evaluasi proposal pendanaan besar (Wajib role `super_admin`) |
| **Complex Problem Solver** | `clario/gpt-5.6-sol` *(Quota Terbatas)* | Solver permasalahan rumit | Algoritma matching investor-startup skala lanjut |
| **Image Gen (Banners & Art)**| `clario/flux-2-pro` | Tipografi gambar rapi, estetika grafis modern | **Generator Poster Event/Workshop**, Banner Krenova, Header Katalog Produk |
| **Image Gen (Photorealistic)**| `clario/imagen-4.0-ultra` | Realisme foto ultra-tajam | Mockup produk fisik inovasi tenant, visualisasi render ruang coworking |

---

## 🏗️ 2. Standar Wrapper: `src/lib/clario.ts`

Semua pemanggilan AI **WAJIB** melalui helper terpusat di `src/lib/clario.ts`. Dilarang melakukan `fetch` langsung ke URL eksternal di dalam komponen UI atau service tanpa melewati modul ini.

### Konstanta Model Resmi:
```typescript
import { CLARIO_MODELS, callClarioChat, callClarioVision, callClarioImage } from '@/lib/clario';
```

---

## 📋 3. Pola Pemanggilan Sesuai Kebutuhan

### A. Pola 1: Chat Interaktif / Assistant (Krenova)
```typescript
import { CLARIO_MODELS, callClarioChat } from '@/lib/clario';

const response = await callClarioChat({
  model: CLARIO_MODELS.CHAT_FAST, // clario/glm-5.3-flash
  messages: [
    { role: 'system', content: 'Kamu adalah Sintesa, asisten virtual KRENOVA...' },
    ...history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: userQuery }
  ],
  temperature: 0.7,
  jsonMode: true, // jika membutuhkan respons JSON terstruktur
});
```

### B. Pola 2: Analisis & Scoring JSON (Kurasi & Finansial)
```typescript
import { CLARIO_MODELS, callClarioChat } from '@/lib/clario';

const analysis = await callClarioChat({
  model: CLARIO_MODELS.FAST_REASONING, // clario/deepseek-v4-flash
  // atau CLARIO_MODELS.FINANCIAL_PRO (clario/deepseek-v4-pro-0813) untuk audit COA
  messages: [
    { role: 'system', content: 'Analisis profil bisnis berikut dan kembalikan JSON...' },
    { role: 'user', content: JSON.stringify(tenantData) }
  ],
  temperature: 0.2, // rendah untuk konsistensi evaluasi
  jsonMode: true,
});

const result = JSON.parse(analysis);
```

### C. Pola 3: Multimodal Vision & OCR (Kuitansi / Kerusakan Aset)
```typescript
import { CLARIO_MODELS, callClarioVision } from '@/lib/clario';

const ocrResult = await callClarioVision({
  model: CLARIO_MODELS.VISION_PRIMARY, // clario/qwen3-vl-235b-a22b-instruct
  prompt: 'Ekstrak total nominal, tanggal, nomor nota, dan rincian barang dari foto kuitansi ini dalam format JSON.',
  imageUrl: 'https://storage.googleapis.com/.../receipt.jpg',
  jsonMode: true,
});
```

### D. Pola 4: Pembuatan Banner / Mockup Gambar
```typescript
import { CLARIO_MODELS, callClarioImage } from '@/lib/clario';

const image = await callClarioImage({
  model: CLARIO_MODELS.IMAGE_BANNER, // clario/flux-2-pro
  prompt: 'Modern technological exhibition banner for Solo Technopark Krenova 2026, vibrant neon accents, futuristic, high resolution',
  size: '1024x1024',
});
```

---

## 🔒 4. Aturan Keamanan & Best Practice

1. **Jangan Ekspos Key ke Client:**
   `CLARIO_API_KEY` **TIDAK BOLEH** memiliki prefix `NEXT_PUBLIC_`. Kunci ini hanya boleh diakses di sisi server (API Routes `src/app/api/` atau Cloud Functions).
2. **Proteksi Model Limited Quota:**
   Model bertanda `LIMITED QUOTA` (`clario/claude-opus-5` dan `clario/gpt-5.6-sol`) hanya boleh dipanggil pada route yang terlindungi autentikasi dengan role minimal `admin` atau `super_admin`. Jangan pernah mengeksposnya ke endpoint publik terbuka.
3. **Structured Output Fallback:**
   Selalu bungkus `JSON.parse()` dengan `try...catch` dan sediakan nilai fallback yang anggun (*graceful degradation*) jika model mengembalikan teks non-JSON atau respons terpotong.
4. **Rate Limiting & Caching:**
   Untuk hasil analisis berat seperti kesehatan finansial tenant atau analisis kurasi, simpan hasilnya di Firestore (misal subkoleksi `ai_analyses`) agar tidak memanggil AI berulang kali untuk data yang sama.

---

## 📚 5. Pola Knowledge-Grounded AI (RAG via Markdown)

Untuk fitur asisten informasi publik (seperti `/explore`), sistem menggunakan pendekatan **Retrieval-Augmented Generation (RAG)** berbasis berkas Markdown (`.md`) lokal tanpa memerlukan vector database eksternal yang kompleks.

### Struktur Direktori:
```
src/content/knowledge/
├── 01-profil-kawasan.md      → Profil, sejarah, visi misi, zona kawasan
├── 02-fasilitas-layanan.md   → Auditorium, coworking space, tarif & alur sewa
├── 03-program-inkubasi.md    → Startup & UMKM track, mentoring, kurasi
├── 04-program-pelatihan.md   → Pelatihan vokasi, coding, las bawah air, BNSP
├── 05-inovasi-krenova.md     → Pameran inovasi Krenova, direktori inovator
└── 06-faq-prosedur.md        → Izin kunjungan, pembayaran VA BLUD, kontak PIC
```

### Retrieval & Resilient Fallback Engine (`src/lib/knowledge.ts`):
1. **Pencocokan Cerdas:** Query pengguna dinormalisasi dan dicocokkan terhadap metadata keyword, judul, dan frekuensi token dokumen (`searchKnowledge(query, limit)`).
2. **Context Injection:** Dokumen yang cocok diinjeksikan ke system instruction model Clario (`clario/glm-5.3-flash`).
3. **Offline Resilience:** Jika koneksi API Clario mengalami gangguan jaringan atau timeout, fungsi `generateOfflineFallback(query, matchedDocs)` langsung mengembalikan ringkasan terstruktur dari dokumen lokal. Antarmuka pengguna **TIDAK PERNAH CRASH ATAU MENAMPILKAN PESAN ERROR KOSONG**.

---

## 🌐 6. Pola Dual Mode: Arsip Kawasan vs. Percakapan Bebas

Fitur AI Explorer mendukung dua mode operasional yang dapat diganti secara dinamis oleh pengguna melalui parameter `mode: 'knowledge' | 'free'`:

| Parameter | Mode | Perilaku Prompt & Grounding | Kasus Penggunaan |
| :--- | :--- | :--- | :--- |
| `mode: 'knowledge'` | **Arsip Kawasan** | Menginjeksikan dokumen `.md` dari `src/content/knowledge/`, mengembalikan `sources: ['02-fasilitas-layanan.md']` dan `quickActions`. | Pertanyaan resmi seputar fasilitas, tarif sewa, inkubasi bisnis, pelatihan, dan pameran Krenova. |
| `mode: 'free'` | **Percakapan Bebas** | Tidak membaca `.md`. Prompt sistem terbuka untuk general assistant cerdas, `sources: []`. | Diskusi ide startup bebas, brainstorming teknologi, konsultasi coding, penulisan kreatif, atau edukasi umum. |

---

## ⚡ 7. Arsitektur 100% Clario Cloud API Gateway (Resilient Direct Port Failover)

Sesuai arahan resmi dan dokumentasi `https://clario.apicloud.my.id/docs`:
1. **Penyedia AI Tunggal:** 100% menggunakan Clario Cloud API. Tidak ada modul atau dependensi ke Google Gemini.
2. **Kredensial Resmi di `.env.local`:**
   ```bash
   CLARIO_API_KEY=your-clario-api-key-here
   CLARIO_BASE_URL=https://clario.apicloud.my.id/v1
   CLARIO_BACKUP_BASE_URL=http://api-direct.apicloud.my.id:8088/v1
   ```
3. **Mekanisme Otomatis Failover & Anti-WAF:**
   - Gateway di `src/lib/clario.ts` secara otomatis mencoba Base URL utama (`https://clario.apicloud.my.id/v1`).
   - Jika endpoint utama terblokir HTTP 403 / WAF atau mengalami timeout jaringan, gateway secara otomatis beralih ke Direct Port cadangan (`http://api-direct.apicloud.my.id:8088/v1`).
   - Jika model spesifik mengalami antrean/503 upstream, gateway secara cerdas beralih ke model cepat berdaya tahan tinggi (`clario/glm-5.3-flash`).
4. **Resilience Level:** Respons aman ditopang oleh rule-based fallback cerdas jika seluruh jaringan internet offline, menjamin antarmuka UI tidak pernah error/blank.

---

## 📊 8. Arsitektur Audit Kesehatan Bisnis Tenant (Adopsi `ai-curation-app`)

Endpoint: `/api/ai/tenant-health` & UI: `DrawerProfilTenant.tsx`.

### A. Ekstraksi Data Nyata Tenant (100% Real Database Grounding)
Setiap pemanggilan audit kesehatan bisnis tenant mengekstrak data riil dari Firestore:
- **Katalog Produk:** Nama produk, kategori, deskripsi, model bisnis, dan kesiapan pasar.
- **Arus Kas & Omzet:** Riwayat nominal pendapatan bulanan aktual (`revenues`).
- **Survival Metrics (KPI):** Burn rate bulanan, sisa runway kas (bulan), traksi pengguna aktif.
- **Catatan Monev Lapangan:** Hambatan aktual dan pencapaian milestone.
- **Log Mentoring:** Rekomendasi mentor dan tantangan bisnis yang dibahas.
- **Kurikulum Inkubasi:** Jumlah modul yang telah diselesaikan vs tertunda.
- **Data Pendaftaran (Self-Assessment):** NIB, legalitas, kapasitas produksi, dan kanal penjualan.

### B. Segment-Aware Evaluation (StartUp vs UMKM)
- **StartUp Track:** Dievaluasi berdasar Product-Market Fit (PMF), Tech Moat, Scalability, Unit Economics (LTV/CAC), Monthly Burn Rate, Runway, dan Kesiapan Investasi (Seed/Series-A).
- **UMKM Track:** Dievaluasi berdasar Cash Flow Stability, HPP (COGS), Izin & Sertifikasi (P-IRT, Halal, BPOM), Branding/Kemasan, Kapasitas Produksi, dan Saluran Pemasaran.

### C. Kerangka Hasil Evaluasi Multi-Dimensi:
1. **Executive Auditor Synthesis:** Ulasan naratif 2-3 paragraf berdasar data fakta riil tenant.
2. **5-Axis Radar Dimensions:**
   - Kelayakan Produk & Inovasi (Product & Tech)
   - Keberlanjutan Arus Kas & Runway (Financial Viability)
   - Traksi Pasar & Validasi Pengguna (Market Traction)
   - Kapabilitas Eksekusi Tim (Team Execution)
   - Kesiapan Legalitas & Tata Kelola (Legal & Compliance)
3. **Matriks Analisis SWOT Komprehensif:** 4 kuadran fakta riil (Strengths, Weaknesses, Opportunities di kawasan Solo Technopark, Threats).
4. **Tactical Action Roadmap:** Rencana aksi terarah berbatas waktu:
   - **30 Hari (Quick-Win):** Perbaikan mendesak titik kritis.
   - **90 Hari (Horizon):** Akselerasi traksi dan pertumbuhan penjualan.
   - **180 Hari (Strategis):** Kesiapan skala bisnis dan ekspansi/investasi.


