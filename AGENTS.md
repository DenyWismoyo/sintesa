# AGENTS.md — Panduan untuk AI Agent di Proyek Teknopark/Sintesa

> File ini adalah panduan kerja untuk AI agent (Antigravity/Gemini) saat bekerja
> di repository ini. Baca file ini sebelum melakukan perubahan apapun.

## 🎯 Deskripsi Proyek

**Sintesa / Teknopark** adalah sistem manajemen kawasan teknologi (technopark) yang
mencakup: manajemen aset & booking, sistem billing & keuangan, inkubasi tenant startup,
program pelatihan (LMS), manajemen event, dan ekosistem startup.

**Stack:** Next.js 14 (App Router) + TypeScript + Firebase (Auth, Firestore, Storage, 
Cloud Functions v2) + TanStack Query + Zod + Tailwind CSS + shadcn/ui.

---

## 📋 Aturan Utama (Baca Sebelum Apapun)

1. **Baca skill `teknopark-architecture` terlebih dahulu** sebelum menambah fitur baru
   atau melakukan refactoring. Skill tersebut ada di `.agents/skills/teknopark-architecture/SKILL.md`

2. **Cek `.agents/rules/TEKNOPARK_RULES.md`** untuk konvensi coding dan aturan arsitektur
   yang harus diikuti.

3. **Semua entity baru WAJIB punya Zod Schema** di `src/types/index.ts`. Jangan buat
   plain TypeScript `interface` untuk entity Firestore.

4. **Jangan pernah bypass service layer** — akses Firestore selalu via `src/services/`.

5. **Role access hanya diubah di `src/config/roles.ts`** — jangan hardcode role/permission
   di tempat lain.

---

## 🗂️ Orientasi Cepat: Di Mana Saya Harus Edit?

| Saya ingin... | File yang diedit |
|---------------|-----------------|
| Menambah halaman admin baru | `src/app/(admin)/namahalaman/page.tsx` + update `roles.ts` |
| Menambah halaman publik | `src/app/(public)/namahalaman/page.tsx` |
| Menambah entity data baru | `src/types/index.ts` (Zod schema) + `src/services/nama.service.ts` + `src/hooks/useNama.ts` |
| Mengubah permission role | `src/config/roles.ts` |
| Menambah Cloud Function | `functions/src/callables/namaFungsi.ts` + export di `functions/src/index.ts` |
| Menambah Firestore trigger | `functions/src/triggers/namaTrigger.ts` + export di `functions/src/index.ts` |
| Mengubah tampilan navigasi admin | `src/app/(admin)/layout.tsx` → `MENU_GROUPS` |
| Mengubah auth logic | `src/lib/AuthContext.tsx` |

---

## 🔐 Keamanan — Selalu Perhatikan

### Struktur Auth Sistem
```
Firebase Auth (JWT) 
  → Custom Claims {role: 'kasir', isInstructor: false}
  → Middleware (Edge, cookie-based) 
  → Layout Guard (client, hasAccess())
  → Cloud Function Guard (server, custom claims)
```

### Saat Membuat Cloud Function Baru
```typescript
// TEMPLATE WAJIB untuk setiap callable:
export const namaFungsi = onCall(async (request) => {
  // 1. Auth check
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login diperlukan.');
  
  // 2. Role check (GUNAKAN custom claims, bukan Firestore read!)
  const role = request.auth.token?.role;
  if (!['admin', 'super_admin'].includes(role)) {
    throw new HttpsError('permission-denied', 'Hak akses tidak cukup.');
  }
  
  // 3. Input validation
  const { requiredField } = request.data;
  if (!requiredField) throw new HttpsError('invalid-argument', 'Data tidak lengkap.');
  
  // 4. Business logic...
  
  return { success: true };
});
```

---

## 📊 Skema Firestore — Dua Jenis Path

```
ROOT COLLECTIONS (data master):
  tenants/          → profil & data inkubasi tenant
  assets/           → aset fisik kawasan
  users/            → akun user & role
  trainings/        → program pelatihan
  catalogs/         → katalog produk
  alumni/           → data alumni

ARTIFACT PATH (data transaksional, multi-tenant):
  artifacts/{appId}/public/data/
    ├── invoices/       → tagihan
    ├── bookings/       → peminjaman aset
    ├── expenses/       → pengeluaran
    ├── accounts/       → Chart of Accounts
    ├── journals/       → buku besar
    ├── budgets/        → anggaran
    ├── orders/         → order dari e-katalog
    ├── cache_tenants/  → cache list tenant (doc: 'master')
    └── cache_assets/   → cache list aset (doc: 'master')
```

**appId:** Ambil dari `process.env.NEXT_PUBLIC_APP_ID` (client) atau `process.env.APP_ID` (Cloud Functions). Default fallback: `'blud-app-dev'`.

---

## 🛠️ Perintah Development

```bash
# Development
npm run dev          # Jalankan Next.js dev server

# Firebase Emulator (testing lokal)
firebase emulators:start

# Build untuk produksi
npm run build

# Deploy Firebase Functions (Codebase: sintesa, Region: asia-southeast2)
npm --prefix functions run build
firebase deploy --only functions:sintesa

# Deploy semua (hosting + functions:sintesa)
firebase deploy
```

---

## ⚠️ Issue Aktif Yang Diketahui (Audit 2026-09-09)

> Daftar ini diperbarui dari hasil audit mendalam sistem. Jangan close atau 
> ignore issue ini tanpa diskusi.

### 🟢 Status Masalah Utama (Audit 2026-09-10: 100% Resolved)
1. **Dual-Path Inkonsistency** — ✅ Selesai: Dikonsolidasikan ke satu utility terpusat di `src/lib/appId.ts`.
2. **Middleware/Proxy Cookie Exploitable** — ✅ Selesai: `src/proxy.ts` memverifikasi struktur & masa aktif JWT dari cookie `__session` (R-036).
3. **Cloud Functions Tidak Pakai Custom Claims** — ✅ Selesai: Seluruh callable function menggunakan `request.auth.token.role`.
4. **Booking Entity Tanpa Zod Schema** — ✅ Selesai: Dimigrasi ke `BookingSchema` runtime Zod.
5. **Journal Entry Tanpa Balance Validation** — ✅ Selesai: Validasi mutlak `totalDebit === totalCredit` di `addPaymentBatch`.
6. **AI Route Protection** — ✅ Selesai: Rate limiting 10-15 req/menit per IP di `/api/ask-ai` dan `/api/curation-ai` (R-037).

> Dokumen rujukan lengkap: [`public/docs/audit-arsitektur-roadmap-blueprint.md`](file:///d:/Project/teknopark/public/docs/audit-arsitektur-roadmap-blueprint.md).

---

## 📈 Roadmap Optimalisasi

### Phase 1 — Security Hardening (Prioritas Tinggi)
- [x] Buat `src/lib/appId.ts` — satu sumber getAppId()
- [x] Fix `getDashboardStats` — gunakan custom claims
- [x] Fix semua cache callables — validasi role
- [x] Tambah balance validation ke `addPaymentBatch`
- [x] Buat `firestore.rules` dengan security rules proper
- [x] Edge Proxy JWT session verification (`src/proxy.ts`)
- [x] Rate limiting AI routes (`src/lib/rateLimit.ts`)

### Phase 2 — Data Consistency
- [x] Migrasi `Booking` interface → BookingSchema (Zod)
- [ ] Standardize timestamps (serverTimestamp vs Date.now)
- [ ] Sync `FundingRound.roundName` dengan `Tenant.fundingStage` enum
- [x] Auto-invalidate cache saat tenant & aset diupdate (Trigger Firestore)

### Phase 3 — Code Quality
- [x] Split `src/types/index.ts` per domain (`asset`, `tenant`, `finance`, `booking`, `catalog`, `learning`, `ecosystem`)
- [x] Hapus dead code `invoiceAutomation.ts`
- [x] Pindah `formatRupiah` ke `src/utils/format.ts`
- [x] Setup Vitest + testing untuk services (`roles.test.ts`, `finance.test.ts`)
- [x] Tambah `error.tsx` di setiap route group

### Phase 4 — Performance
- [x] Fix `staleTime` di TanStack Query hooks (default 5 menit)
- [x] Cloud Functions Warm-Up Pool (`minInstances: 1` pada `dashboardStats` & `bookingManager`)
- [x] Audit dan tambah Firestore composite indexes
- [x] Tambah guard di `syncBackToOrigin`

### Phase 5 — AI Intelligence Layer (100% Clario AI)
- [x] Buat `src/lib/clario.ts` — wrapper Clario API client (15 model spesialisasi)
- [x] Migrasi `/api/ask-ai` ke Clario `clario/glm-5.3-flash` (Krenova Assistant)
- [x] Migrasi `/api/curation-ai` ke Clario `clario/deepseek-v4-flash` (Scoring Startup)
- [x] Implementasi Smart COA Suggestion (`clario/deepseek-v4-pro-0813`)
- [x] Implementasi Tenant Business Health Score AI (`clario/deepseek-v4-pro-0813`)
- [x] Implementasi OCR Nota/Kuitansi Fisik (`/api/ai/ocr-receipt` via `clario/qwen3-vl-235b-a22b-instruct`)
- [x] Centralized Cloud Logger & Alerting (`src/lib/logger.ts`)

---

## 🧪 Testing Guidelines

Test suite resmi menggunakan **Vitest** (`npm test`):
- Test lokasi: `src/__tests__/*.test.ts`
- Suite aktif: `src/__tests__/roles.test.ts` (RBAC matrix) dan `src/__tests__/finance.test.ts` (integritas akuntansi double-entry).

---

## 📝 Konvensi Penting

| Item | Konvensi |
|------|----------|
| Koleksi Firestore | snake_case atau plural (tenants, cache_tenants) |
| Service methods | camelCase verb + noun (getTenants, createInvoice) |
| Hooks | camelCase dengan prefix `use` (useTenants) |
| Types/Schemas | PascalCase + Schema suffix (TenantSchema, Invoice) |
| Permissions | SCREAMING_SNAKE_CASE (MANAGE_TENANT) |
| Cloud Functions | camelCase (getDashboardStats) |
| Pages | kebab-case di URL (/manajemen-event) |
| Components | PascalCase files (TenantCard.tsx) |
| AI Integration | Terpusat di `src/lib/clario.ts` via `CLARIO_MODELS` (100% Clario) |

---

## 🔗 Skills yang Tersedia

- `teknopark-architecture` — Peta arsitektur lengkap, pola-pola standar, gotchas
- `firebase-security-patterns` — Security best practices, custom claims, security rules
- `sintesa-public-ui` — Standarisasi halaman publik & globals.css
- `sintesa-dev-roadmap` — Roadmap pengembangan komprehensif hasil audit
- `sintesa-ai-integration` — Standar & integrasi 15 model Clario AI

Baca skill yang relevan dengan `view_file` sebelum memulai task besar!
