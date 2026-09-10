---
name: sintesa-dev-roadmap
description: >
  Roadmap pengembangan komprehensif sistem Sintesa/Teknopark berdasarkan
  audit mendalam kode yang berjalan. Berisi fase-fase prioritas, integrasi
  AI terpusat dengan CLARIO_API_KEY (15 model spesialisasi), dan checklist eksekusi per
  sprint. Gunakan skill ini sebelum merencanakan fitur baru atau sprint.
---

# 🗺️ Roadmap Pengembangan Sintesa — Berdasarkan Audit Kode (Audit: 2026-09-09)

## 🔍 Temuan Audit Mendalam

Audit dilakukan terhadap seluruh layer kode: Next.js 14 App Router, Firebase
Functions v2, Firestore Security Rules, Types/Schemas, Services, Hooks, dan
API Routes yang sedang berjalan.

---

### ✅ Yang Sudah Baik (Kekuatan Saat Ini)

| Area | Status | Keterangan |
|------|--------|------------|
| `lib/appId.ts` | ✅ Selesai | Sudah terpusat, 1 sumber kebenaran |
| `getDashboardStats` | ✅ Selesai | Sudah pakai custom claims (`request.auth.token.role`) |
| Booking → `BookingSchema` | ✅ Selesai | Sudah dimigrasi ke Zod Schema |
| `addPaymentBatch` balance validation | ✅ Selesai | Guard DEBIT === KREDIT sudah ada |
| `firestore.rules` | ✅ Selesai | Security Rules komprehensif sudah deploy |
| Cache Invalidation Trigger | ✅ Selesai | Auto-rebuild cache saat tenant/aset berubah |
| `syncBackToOrigin` guard | ✅ Selesai | Guard `status === 'PAID'` sudah ada |
| `formatRupiah` | ✅ Selesai | Sudah di `src/utils/format.ts` |
| Dead code `invoiceAutomation.ts` | ✅ Selesai | Sudah dihapus dari index.ts |
| `error.tsx` di route groups | ✅ Selesai | Ada di (admin)/ dan (public)/ |
| Firestore indexes | ✅ Selesai | `firestore.indexes.json` sudah lengkap |
| AI Curation | ✅ Aktif | `/api/curation-ai` (Migrasi ke Clario `deepseek-v4-flash`) |
| AI Krenova Assistant | ✅ Aktif | `/api/ask-ai` (Migrasi ke Clario `glm-5.3-flash`) |
| Global Options Functions | ✅ Selesai | Region `asia-southeast2`, maxInstances: 10 |

---

### 🟢 Issue yang Telah Diselesaikan (Audit 2026-09-10)

| Issue | Solusi yang Diimplementasikan | Referensi |
|---|---|---|
| **Issue 1: `AuthContext.tsx` Firestore Role Read** | ✅ Selesai: Membaca `idTokenResult.claims.role` terlebih dahulu dari JWT token. Firestore read hanya sebagai fallback. | `src/lib/AuthContext.tsx` |
| **Issue 2: Edge Proxy Cookie Spoofing** | ✅ Selesai: `src/proxy.ts` memverifikasi struktur & expiry JWT dari cookie `__session` (R-036). | `src/proxy.ts` |
| **Issue 3: Sync Token & Session Cookie** | ✅ Selesai: `AuthContext.tsx` mensinkronkan `userRole` dan `__session` saat login dan membersihkannya saat logout. | `src/lib/AuthContext.tsx` |
| **Issue 4: AI API Route Rate Limiting** | ✅ Selesai: `/api/ask-ai` dan `/api/curation-ai` diproteksi sliding window rate limiter (R-037). | `src/app/api/ask-ai`, `src/app/api/curation-ai` |

> 📖 **Dokumen Master Blueprint Arsitektur:**  
> Untuk rujukan arsitektur menyeluruh 5 fase pengembangan, lihat [`public/docs/audit-arsitektur-roadmap-blueprint.md`](file:///d:/Project/teknopark/public/docs/audit-arsitektur-roadmap-blueprint.md).

---

### 🟡 Status Perbaikan Issue Prioritas (100% Resolved)

| Issue | File | Action & Resolusi | Status |
|-------|------|-------------------|:---:|
| Modularisasi Types Monolitik | `src/types/*.types.ts` | Dipecah ke 7 modul domain + barrel re-export | ✅ Selesai |
| `staleTime: 0` pada hooks | `useAssets.ts`, `useTenants.ts`, dll | Distandarisasi `staleTime: 5 menit` di QueryClient | ✅ Selesai |
| Automated Unit Tests | `src/__tests__/*.test.ts` | Vitest terpasang + 12/12 unit tests passed | ✅ Selesai |
| `curation-ai/route.ts` migrasi AI | `src/lib/clario.ts` | Menggunakan 100% Clario AI DeepSeek V4 | ✅ Selesai |
| Warm-Up Pool Cloud Functions | `functions/src/callables/` | `minInstances: 1` pada `dashboardStats` & `bookingManager` | ✅ Selesai |
| OCR Nota & Kuitansi Fisik | `src/app/api/ai/ocr-receipt/` | Vision OCR via Clario Qwen3-VL 235B | ✅ Selesai |
| Centralized Cloud Logger | `src/lib/logger.ts` | Audit logging, error tracking & webhook alert | ✅ Selesai |

---

## 🤖 Arsitektur AI Terpusat: CLARIO_API_KEY (100% Clario)

Sistem Sintesa / Solo Technopark menggunakan **CLARIO_API_KEY** sebagai satu-satunya
penyedia kecerdasan buatan (AI) terpusat. Seluruh penggunaan Gemini API telah
dihentikan dan digantikan sepenuhnya oleh model-model Clario terpilih sesuai keunggulan
masing-masing.

### Matriks 15 Model Clario yang Tersedia & Spesialisasinya

| Kategori | Model ID Clario | Keunggulan Spesifik | Fitur / Endpoint Target di Sintesa |
| :--- | :--- | :--- | :--- |
| **Conversational (Fast)** | `clario/glm-5.3-flash` | Latensi sangat rendah, ramah, respons instan | **Chatbot Pemandu Pameran KRENOVA (`/api/ask-ai`)**, customer service publik |
| **Conversational (Flagship)** | `clario/glm-5.3` (NEW) | Sintesis teks mendalam, penalaran umum solid | Rekap profil tenant, asisten konsultasi bisnis publik, FAQ dinamis |
| **Conversational (Stable)** | `clario/glm-5.2` | Generasi stabil sebelumnya | Backup saat GLM-5.3 mengalami rate limit |
| **Fast Reasoning & JSON** | `clario/deepseek-v4-flash` | Komputasi cepat, parsing JSON presisi | **AI Curation Scoring (`/api/curation-ai`)**, kalkulasi skor KPI |
| **Deep Reasoning & Finance** | `clario/deepseek-v4-pro-0813` | Deep reasoning, pemahaman akuntansi & audit | **Smart COA Recommender (`/api/ai/suggest-coa`)**, Tenant Financial Health Score |
| **Fast Extraction** | `clario/deepseek-v4-flash-0731` | Logika ekstraksi terstruktur cepat | Ekstraksi entitas dari formulir registrasi tenant |
| **Multimodal / Vision OCR** | `clario/qwen3-vl-235b-a22b-instruct` | Vision-Language 235B MoE, pembaca teks & gambar | **OCR Kuitansi/Nota Pengeluaran**, Verifikasi Foto Kerusakan Aset/Gedung |
| **Multimodal Alternative** | `clario/ernie-4.5-vl-424b-a47b` | Model Vision 424B berskala masif | Analisis denah kawasan fisik / site plan 2D/3D teknopark |
| **Indonesian Native Quality** | `clario/qwen3.8-27b` | Pemahaman regulasi & Bahasa Indonesia baku | Notula rapat pendampingan, ringkasan laporan BLUD ke Pemda |
| **Long Context Synthesis** | `clario/mimo-v2.5-pro` | Penalaran dokumen panjang & kurikulum | **Kurikulum Inkubasi Personal (`/api/ai/generate-curriculum`)**, sintesis laporan tahunan |
| **Creative Storytelling** | `clario/minimax-m3` | Bahasa persuasif & emosional | Copywriting rilis pers tenant, deskripsi event & workshop |
| **Executive / High-Stakes** | `clario/claude-opus-5` *(Quota Terbatas)* | Penalaran tingkat institusional, analisis hukum | **Review Draft MoU / Kontrak Tenant** (Wajib role `super_admin`) |
| **Complex Solver** | `clario/gpt-5.6-sol` *(Quota Terbatas)* | Solver permasalahan rumit | Investor-Startup Matching Engine skala lanjut |
| **Image Gen (Banners)** | `clario/flux-2-pro` *(Image)* | Estetika tinggi, tipografi banner rapi | **Generator Banner Event/Workshop**, Poster Pameran Krenova |
| **Image Gen (Photorealistic)**| `clario/imagen-4.0-ultra` *(Image)* | Realisme foto ultra-tajam | Mockup produk fisik inovasi tenant, render ruang coworking |

---

## 📋 Roadmap Fase per Fase

### Phase 1 — AI Intelligence Layer (1-2 Sprint) 🎯 PRIORITAS TERTINGGI

**Goal:** Integrasikan CLARIO_API_KEY secara penuh dan migrasikan endpoint yang ada.

#### Sprint 1A: Setup Infrastructure AI Clario
- [x] Buat `src/lib/clario.ts` — wrapper Clario API client dengan model constants
- [x] Migrasi `/api/ask-ai` ke Clario `clario/glm-5.3-flash`
- [x] Migrasi `/api/curation-ai` ke Clario `clario/deepseek-v4-flash`
- [x] Buat `src/types/ai.ts` — Zod schema untuk request/response AI
- [x] Tambah rate limiting di API routes AI (RPM protection via `src/lib/rateLimit.ts`)

#### Sprint 1B: Smart COA Suggestion
- [x] Buat `/api/ai/suggest-coa/route.ts` — AI COA recommender via `clario/deepseek-v4-pro-0813`
- [x] Integrasi ke alokasi billing invoice (`ModalAllocateInvoice.tsx`) dengan tombol saran AI & auto-select
- [x] Evaluasi deterministik fallback offline berbasis aturan kata kunci BAS
- [x] Test dengan variasi item sewa auditorium, coworking, pelatihan, lab, dsb.

#### Sprint 1C: Tenant Health Score AI
- [x] Buat `/api/ai/tenant-health/route.ts` via `clario/deepseek-v4-pro-0813`
- [x] Buat `TenantHealthRequest` & `TenantHealthResponse` Zod schema di `src/types/ai.ts`
- [x] Tampilkan di panel tenant admin (tab baru "Kesehatan Bisnis (AI)" di `DrawerProfilTenant.tsx`)
- [x] Dukungan visualisasi skor 3 dimensi (Finansial, Traksi Pasar, Eksekusi Tim) dan penyimpanan ke Firestore

---

### Phase 2 — Auth & Security Hardening (1 Sprint)

**Goal:** Tutup celah security yang tersisa.

#### Checklist:
- [ ] **Fix AuthContext** — Baca role dari custom claims dulu, Firestore sebagai fallback
- [ ] **Set cookie dari AuthContext** — Pastikan `userRole` cookie di-set/clear via API route server-side
- [ ] **Centralize admin.initializeApp()** — Buat `functions/src/admin.ts` sebagai singleton
- [ ] **Migrasi curation-ai route** — Sudah migrasi ke Clario wrapper `src/lib/clario.ts`
- [ ] **Audit Booking read rules** — Ubah `allow read: if true` menjadi lebih restrictive

Template `functions/src/admin.ts`:
```typescript
import * as admin from 'firebase-admin';
if (!admin.apps.length) {
  admin.initializeApp();
}
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
```

---

### Phase 3 — Data Consistency & Performance (1-2 Sprint)

**Goal:** Perbaiki konsistensi data dan performa query.

#### Checklist:
- [ ] **Standardize timestamps** — Semua entity baru wajib `serverTimestamp()`, bukan `Date.now()`
- [ ] **Sync FundingRound.roundName ↔ Tenant.fundingStage** — Tambah missing enum values
- [ ] **Fix staleTime** — Audit semua hooks, gunakan min 5 menit
- [ ] **Types splitting** — Split `src/types/index.ts` per domain:
  - `types/asset.ts`, `types/tenant.ts`, `types/finance.ts`, `types/training.ts`
- [ ] **Booking audit trail** — Tambah field `updatedBy` dan `approvedAt` di BookingSchema

#### Performance Wins:
```typescript
// Ganti ini di hooks yang sering dipanggil:
staleTime: 0  // ❌

// Dengan ini:
staleTime: 1000 * 60 * 5,    // ✅ 5 menit untuk data operasional
gcTime: 1000 * 60 * 30,      // ✅ 30 menit cache di memori
```

---

### Phase 4 — Testing & Code Quality (Ongoing)

**Goal:** Baseline testing untuk fungsi kritis keuangan.

#### Priority Tests (Vitest):
```
src/__tests__/
  ├── finance.service.test.ts    → addPaymentBatch, balance validation
  ├── billing.service.test.ts    → syncBackToOrigin, createInvoice
  ├── roles.test.ts              → hasAccess, canPerformAction
  └── ai-curation.test.ts       → prompt generation, JSON parsing
```

Setup:
```bash
npm install -D vitest @vitest/ui happy-dom
# Tambah ke package.json:
"test": "vitest",
"test:ui": "vitest --ui"
```

---

### Phase 5 — Feature Expansion (3-4 Sprint)

#### 5A: Smart Hub Intelligence
- [ ] Buat `/api/ai/match-investors` — Investor matching engine via Clario
- [ ] Notifikasi email saat ada match baru (via Firebase Extensions atau Cloud Functions)
- [ ] Dashboard analytics hub (active connections, popular threads)

#### 5B: LMS AI Enhancement
- [ ] AI-powered quiz generator dari konten lesson (`clario/glm-5.3-flash`)
- [ ] Auto-grade text submissions via `clario/deepseek-v4-flash`
- [ ] Learning path recommendation berdasarkan profil peserta (`clario/mimo-v2.5-pro`)

#### 5C: Financial Intelligence
- [ ] AI Budget Planning — Clario analisis tren pengeluaran & rekomendasi anggaran
- [ ] Cash flow forecasting 3 bulan ke depan
- [ ] Auto-detect anomali transaksi (unusual spending patterns)

#### 5D: Event Intelligence
- [ ] QR Code attendance system (generate & scan)
- [ ] Post-event feedback analysis via AI
- [ ] Auto-generate certificate PDF setelah event selesai

---

## 🏗️ Arsitektur AI yang Direkomendasikan (100% Clario)

```
CLARIO_API_KEY (Single Provider, Specialized Models)
  ├── Conversational (Fast)   : clario/glm-5.3-flash       → /api/ask-ai (Krenova Assistant)
  ├── Fast Reasoning & JSON   : clario/deepseek-v4-flash   → /api/curation-ai (Startup Scoring)
  ├── Deep Financial Reasoning: clario/deepseek-v4-pro-0813→ /api/ai/suggest-coa & tenant-health
  ├── Multimodal Vision OCR   : clario/qwen3-vl-235b-a22b  → OCR Kuitansi & Kerusakan Aset
  ├── Long Context Synthesis  : clario/mimo-v2.5-pro       → Kurikulum Inkubasi Personal
  ├── Creative Copywriting    : clario/minimax-m3          → Copywriting Event & Rilis Pers
  ├── High-Stakes / Executive : clario/claude-opus-5       → Review MoU & Legal Kontrak (Restricted)
  └── Image Generation        : clario/flux-2-pro          → Banner Event & Poster Pameran
```

### Wrapper Pattern yang Digunakan:

Seluruh route wajib mengimpor helper dari `src/lib/clario.ts`:
```typescript
import { CLARIO_MODELS, callClarioChat } from '@/lib/clario';
```

---

## 📊 Metrik Keberhasilan per Phase

| Phase | KPI | Target |
|-------|-----|--------|
| Phase 1 (AI) | COA suggestion acceptance rate | > 70% |
| Phase 1 (AI) | Tenant health score accuracy | User satisfaction > 80% |
| Phase 2 (Security) | Auth latency improvement | < 200ms (vs current ~400ms) |
| Phase 3 (Performance) | Invoice list load time | < 500ms |
| Phase 3 (Performance) | Dashboard stats render | < 1s |
| Phase 4 (Testing) | Code coverage finance services | > 60% |

---

## 🔗 File Referensi Cepat

| Task | File yang Relevan |
|------|-------------------|
| Tambah AI endpoint | `src/app/api/[nama]/route.ts` |
| Tambah AI types | `src/types/ai.ts` (buat baru) |
| Konfigurasi AI keys | `.env.local` — `CLARIO_API_KEY` (Tanpa NEXT_PUBLIC_) |
| Fix Auth | `src/lib/AuthContext.tsx` |
| Fix Functions singleton | `functions/src/admin.ts` (buat baru) |
| Split types | `src/types/index.ts` → domain files |
| Test setup | `vitest.config.ts` (buat baru) |
