---
name: teknopark-architecture
description: >
  Cheatsheet arsitektur sistem Teknopark/Sintesa — Next.js 14 + Firebase.
  Gunakan skill ini sebelum menambahkan fitur, memperbaiki bug, atau 
  melakukan refactoring pada sistem ini. Berisi pola-pola yang sudah 
  terbukti, keputusan desain yang telah dibuat, dan daftar gotcha yang 
  perlu dihindari.
---

# 🏗️ Skill: Arsitektur Sistem Teknopark/Sintesa

## 📦 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (components.json) |
| State/Data Fetching | TanStack Query v5 |
| Schema Validation | Zod |
| Backend | Firebase (Auth, Firestore, Storage, Functions v2) |
| Language | TypeScript |

## 🗺️ Struktur Direktori Kunci

```
src/
├── app/
│   ├── (admin)/    → Admin panel (+ layout.tsx dengan auth guard)
│   ├── (public)/   → Website publik (landing, katalog, event, dll.)
│   └── tenant/     → Portal tenant (dashboard tenant)
│
├── config/roles.ts → SATU-SATUNYA sumber kebenaran permission matrix
├── content/
│   └── knowledge/      → Dokumen .md master fakta/pengetahuan kawasan (RAG AI)
├── hooks/          → React hooks (wrapper TanStack Query atas services)
│   └── use*.ts
│
├── lib/
│   ├── AuthContext.tsx  → React context: { user, role, isInstructor, loading }
│   ├── clario.ts        → Wrapper resmi 15 model Clario AI
│   ├── knowledge.ts     → Retriever dokumen RAG & offline resilience
│   ├── firebase.ts      → Inisialisasi Firebase app/auth/db/storage
│   └── QueryProvider.tsx → TanStack Query setup
│
├── services/       → Data layer (Firestore CRUD, TANPA React state)
│   └── *.service.ts
│
└── types/index.ts  → Zod schemas + TypeScript types (SEMUA entity di sini)

functions/
├── src/
│   ├── index.ts      → Export semua triggers & callables
│   ├── triggers/     → Firestore-triggered (event-driven)
│   └── callables/    → HTTP callable dari client
```

## 🔑 Pola Inti Yang Harus Diikuti

### 1. Skema Firestore — Dua Jenis Path

**ROOT PATH** — untuk data master/global yang tidak per-appId:
```
tenants/            → data tenant (document: tenantId)
assets/             → aset fisik
users/              → user accounts & roles
trainings/          → program pelatihan
catalogs/           → katalog produk
alumni/             → data alumni
```

**ARTIFACT PATH** — untuk data transaksional (multi-tenant ready):
```
artifacts/{appId}/public/data/
  ├── invoices/
  ├── bookings/
  ├── expenses/
  ├── accounts/
  ├── journals/
  ├── budgets/
  ├── orders/
  ├── cache_tenants/  (doc: 'master')
  └── cache_assets/   (doc: 'master')
```

> **PENTING:** `appId` diambil dari environment. Gunakan utility terpusat:
> ```typescript
> // lib/appId.ts (IDEALNYA)
> export const getAppId = () => process.env.NEXT_PUBLIC_APP_ID || 'blud-app-dev';
> ```

### 2. Pola Cache — Harus Dipahami

Sistem menggunakan "1-Read Cache Strategy" untuk data besar:
- **Tenant list** → dibaca dari `cache_tenants/master` (bukan koleksi `tenants`)
- **Asset list** → dibaca dari `cache_assets/master`
- Cache diperbarui dengan memanggil Cloud Function `rebuildTenantMasterCache` atau `rebuildAssetMasterCache`
- Bypass cache HANYA untuk data `status == 'Menunggu Review'`

**Jangan pernah membaca langsung koleksi `tenants` untuk daftar di UI — SELALU gunakan cache.**

### 3. Pola Role Access — 4 Layer (Single Source of Truth)

```
Layer 1: Edge Proxy (src/proxy.ts - Next.js 16) → blokir di edge sebelum page load via hasAccess(role, path)
Layer 2: Layout Guard (src/app/(admin)/layout.tsx) → blokir render di layout client
Layer 3: Action Guard (canPerformAction(role, permission)) → sembunyikan/disable tombol di UI
Layer 4: Server Guard (firestore.rules Dual-Lookup & Cloud Functions) → validasi di cloud server
```

> **Catatan Penting Otorisasi:**
> - `src/config/roles.ts` adalah **SATU-SATUNYA** sumber kebenaran (Single Source of Truth).
> - `src/proxy.ts` mengimpor langsung fungsi `hasAccess()` dari `roles.ts`, dilarang membuat kamus rute ganda.
> - `src/lib/AuthContext.tsx` secara otomatis menyinkronkan cookie `userRole` ke browser setiap kali status autentikasi aktif dari dokumen Firestore `/users/{uid}`.

**Untuk mengecek akses di komponen:**
```typescript
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/config/roles';

const canDelete = usePermission(PERMISSIONS.DELETE_ASSET);
```

**Untuk Cloud Function — SELALU gunakan custom claims:**
```typescript
// BENAR:
const role = request.auth?.token?.role;

// SALAH (buang 1 Firestore read):
const userDoc = await db.collection('users').doc(uid).get();
const role = userDoc.data()?.role;
```

### 4. Pola Service → Hook → Component

```typescript
// ❌ JANGAN: Langsung Firestore di komponen
const snap = await getDoc(doc(db, 'tenants', id));

// ✅ BENAR: Gunakan service
import { tenantService } from '@/services/tenant.service';
const tenant = await tenantService.getTenantById(id);

// ✅ LEBIH BENAR: Gunakan hook (TanStack Query + service)
import { useTenants } from '@/hooks/useTenants';
const { allTenants, loading } = useTenants();
```

### 5. Pola Batch Write untuk Operasi Finansial

Setiap operasi yang menyentuh lebih dari 1 dokumen HARUS menggunakan `writeBatch`:
```typescript
const batch = writeBatch(db);
batch.update(invoiceRef, { status: 'PAID', paidAmount: X });
batch.set(journalRef, { entries: [...] });
batch.update(accountRef, { balance: increment(amount) });
await batch.commit(); // Atomic!
```

### 6. Pola Integrasi Dua Arah: Menu Publik ↔ Menu Admin

Setiap aksi transaksi di halaman publik harus memiliki konektivitas fungsional penuh dengan menu admin:
1. **Pendaftaran Pelatihan (`/program-pelatihan/[id]/daftar`) ↔ Admin Pelatihan (`/pelatihan/[id]/peserta`) & Billing (`/billing`)**:
   - Pendaftaran berbayar otomatis membuat entri invoice di `artifacts/{appId}/public/data/invoices` dengan `referenceType: 'TRAINING'` dan `referralCode` (jika ada).
   - Kelas gratis langsung terkonfirmasi ke `/ruang-belajar`.
   - Admin dapat memverifikasi kelulusan tugas dan administrasi peserta di `/pelatihan/[id]/peserta`.
2. **Booking Fasilitas (`/fasilitas`) ↔ Admin Booking (`/booking`) & Aset (`/aset`)**:
   - Pengajuan publik masuk ke antrean persetujuan admin `/booking` dengan status `pending` dan membawa `referralCode`.
   - Approval admin otomatis meng-generate invoice sewa di `/billing` dengan `referenceType: 'BOOKING'`.
3. **Ekosistem Afiliasi ↔ Billing**:
   - Setiap pembayaran invoice berstatus `PAID` mentrigger `billingService.syncBackToOrigin()`.
   - `syncBackToOrigin()` tidak hanya memperbarui status entitas asal (booking/kelas), tetapi juga otomatis meng-clear komisi mitra afiliasi yang mereferensikan transaksi tersebut (`affiliateService.clearCommissionByInvoiceId`).

### 7. Standar Cloud Functions (Codebase "sintesa" & Region "asia-southeast2")

Sistem Sintesa hidup berdampingan dengan aplikasi lain di Firebase `teknopark-surakarta`:
- **Codebase:** WAJIB `"sintesa"` di `firebase.json`. Jangan gunakan `default`.
- **Region:** WAJIB `"asia-southeast2"` (Jakarta). Diatur global via `setGlobalOptions({ region: 'asia-southeast2', maxInstances: 10 })` di `functions/src/index.ts`.
- **Version:** WAJIB 100% Cloud Functions v2 (`firebase-functions/v2`). DILARANG menggunakan v1.
- **Client Access:** Selalu impor singleton `functions` dari `@/lib/firebase`. JANGAN panggil `getFunctions()` secara mandiri tanpa argumen region.
- **Deploy Command:** `firebase deploy --only functions:sintesa`

### 8. Menambah Role Baru — Checklist

Jika menambah role baru, update SEMUA lokasi ini:
- [ ] `src/config/roles.ts` → `APP_ROLES` const
- [ ] `src/config/roles.ts` → `ROLE_LABELS` record
- [ ] `src/config/roles.ts` → `ROLE_ACCESS_MAP` (halaman yang bisa diakses)
- [ ] `src/config/roles.ts` → `ACTION_PERMISSIONS` (aksi yang bisa dilakukan)
- [ ] `src/config/roles.ts` → `isInternalStaff()` jika perlu
*(Catatan: Edge Proxy di `src/proxy.ts` otomatis membaca `hasAccess` dari `roles.ts`, tidak perlu edit terpisah).*

## 🚨 GOTCHAS — Jangan Sampai Salah

### ❌ Gotcha 1: `NEXT_PUBLIC_` Env di Cloud Functions
```typescript
// ❌ SALAH: process.env.NEXT_PUBLIC_APP_ID tidak tersedia di Node.js runtime
const appId = process.env.NEXT_PUBLIC_APP_ID || 'blud-app-dev';

// ✅ BENAR di Cloud Functions:
const appId = process.env.APP_ID || request.data.appId || 'blud-app-dev';
```

### ❌ Gotcha 2: Multiple Firestore Indexes Required
Query yang menggunakan `where` + `orderBy` pada field berbeda MEMERLUKAN composite index di Firestore. Tanpa index, query gagal di production.

### ❌ Gotcha 3: Booking Sync-Back
`billingService.syncBackToOrigin(invoice)` memerlukan bahwa `invoice.status === 'PAID'` sebelum dipanggil. Pastikan validasi ini ada di caller!

### ❌ Gotcha 4: Training Registration Path
```
// Training registrations BUKAN di artifact path:
trainings/{trainingId}/registrations/{regId}  ← ROOT SUB-COLLECTION
// BUKAN:
artifacts/{appId}/... 
```

### ❌ Gotcha 5: `staleTime: 0` Menyebabkan Refetch Berlebihan
Hindari `staleTime: 0` di hooks. Gunakan minimal `1000 * 60` (1 menit) kecuali data benar-benar harus realtime.

### ❌ Gotcha 6: Jangan Gunakan Gemini SDK atau Prefix NEXT_PUBLIC_ untuk AI Key
Seluruh logika AI menggunakan **CLARIO_API_KEY** via wrapper terpusat `src/lib/clario.ts`.
- Dilarang mengimpor `@google/generative-ai` atau memakai `GEMINI_API_KEY`.
- API Key AI server-side tidak boleh menggunakan prefix `NEXT_PUBLIC_` agar tidak bocor ke client bundle.
- Selalu pilih model Clario sesuai matriks keunggulannya (misal `clario/glm-5.3-flash` untuk chat, `clario/deepseek-v4-pro-0813` untuk finansial/COA).

### ❌ Gotcha 7: Model Limited Quota Wajib Dijaga di Route Terproteksi
Model `clario/claude-opus-5` dan `clario/gpt-5.6-sol` memiliki kuota terbatas.
- Hanya boleh dipanggil di route terproteksi autentikasi (role `admin` atau `super_admin`).
- Dilarang keras menghubungkannya ke endpoint publik terbuka tanpa proteksi auth.

### ❌ Gotcha 8: Konvensi Next.js 16 Menggunakan `src/proxy.ts` (Bukan `middleware.ts`)
Next.js 16 secara resmi mendeprekasi `middleware.ts` dan menggantikannya dengan `src/proxy.ts` yang mengekspor fungsi `export function proxy(request: NextRequest)`. Dilarang menggunakan nama `middleware.ts` untuk menghindari pesan peringatan deprecation.

### ❌ Gotcha 9: Firestore Rules Wajib Menggunakan Pola Dual-Lookup Role
Jika role disimpan di dokumen `/users/{uid}`, Firestore rules yang hanya mengecek `request.auth.token.role` akan menganggap user `'public'`. Selalu gunakan helper `getRole()` yang memeriksa JWT claim dahulu, lalu fallback ke `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role`.

## 📝 Konvensi Penamaan

| Entitas | Konvensi | Contoh |
|---------|----------|--------|
| Cloud Functions | camelCase | `getDashboardStats`, `rebuildTenantMasterCache` |
| Firestore Collections | kebab-case / snake_case | `cache_tenants`, `asset_reports` |
| Service methods | camelCase verb+noun | `getTenants`, `createInvoice` |
| Hooks | camelCase dengan prefix `use` | `useTenants`, `useBilling` |
| Types | PascalCase | `Tenant`, `Invoice`, `TenantKPI` |
| Schemas | PascalCase + Schema suffix | `TenantSchema`, `InvoiceSchema` |
| Permissions | SCREAMING_SNAKE_CASE | `MANAGE_TENANT`, `DELETE_ASSET` |

## 📱 Standar UI/UX & Pemisahan Komponen Modular (Mobile & Desktop)

| Komponen | Lokasi | Kegunaan | Pola Responsif |
|----------|--------|----------|----------------|
| `PageHero` | `src/components/ui/PageHero.tsx` | Header terpadu seluruh halaman publik | Full-width title tanpa squeeze, breadcrumbs, ambient glow |
| `FilterDrawer` | `src/components/ui/FilterDrawer.tsx` | Filter multi-kategori & sorting | Drawer bottom-sheet di mobile, pill tabs di desktop |
| `StatusBadge` | `src/components/ui/StatusBadge.tsx` | Indikator status entitas terstandarisasi | Pill dengan pulsing dot untuk status live/aktif |
| `OptimizedImage` | `src/components/ui/OptimizedImage.tsx` | Render gambar WebP otomatis dari Firebase Storage | Rasio aspek responsif & fallback elegan |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | Status data kosong dengan CTA | Glassmorphism card & responsive spacing |

### Konvensi Pemisahan Komponen Modular:
1. **Dilarang Monolith >250 Baris:** Halaman publik harus menjadi orchestrator ringan (~100 baris).
2. **Folder Komponen Lokal Per Route:** Komponen seperti Hero khusus, Filter bar lokal, Kartu item, dan Modal form wajib dipisah ke `src/app/(public)/<route>/components/`.
3. **Anti-Duplikasi Filter:** Search bar dan pill filter harus menjadi satu komponen terpadu, dilarang menumpuk tombol modal filter dengan pill kategori yang sama.
4. **Navigasi Ponsel:** Berpusat pada Top Header dan Fullscreen Hamburger Drawer (dilarang dock floating melayang yang rentan tabrakan posisi).

### Konvensi Palet Aksen Per Modul:
- **Katalog (`/e-katalog`):** Emerald (`emerald-500`, `from-emerald-500/10`)
- **Fasilitas (`/fasilitas`):** Sky / Blue (`sky-500`, `from-sky-500/10`)
- **Pelatihan (`/program-pelatihan`):** Amber / Orange (`amber-500`, `from-amber-500/10`)
- **Ekosistem (`/ekosistem`):** Indigo (`indigo-500`, `from-indigo-500/10`)
- **Event (`/event`):** Violet / Rose (`violet-500`, `from-violet-500/10`)
- **Pusat Bantuan (`/faq`):** Slate / Blue (`slate-600`, `from-slate-500/10`)

## 🔗 File Referensi Cepat

- **Types & Schemas:** `src/types/index.ts`
- **Role Matrix:** `src/config/roles.ts`
- **Auth State:** `src/lib/AuthContext.tsx`
- **Route Guard / Proxy:** `src/proxy.ts`
- **Cloud Functions Entry:** `functions/src/index.ts`
- **UI Components:** `src/components/ui/`
- **Public UI Skill:** `.agents/skills/sintesa-public-ui/SKILL.md` (Standarisasi UI Publik & globals.css)
- **AI Integration Skill:** `.agents/skills/sintesa-ai-integration/SKILL.md` (Integrasi Clario AI Terpusat)
- **Development Roadmap:** `.agents/skills/sintesa-dev-roadmap/SKILL.md` (Roadmap Audit & Fase Pengembangan)
