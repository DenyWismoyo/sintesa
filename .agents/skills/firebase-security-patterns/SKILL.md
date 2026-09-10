---
name: firebase-security-patterns
description: >
  Panduan pola keamanan Firebase untuk proyek Teknopark/Sintesa.
  Gunakan skill ini saat menambahkan Cloud Functions baru, memperbaiki
  sistem auth, atau melakukan security review. Mencakup: autentikasi
  custom claims, validasi role di Cloud Functions, middleware patterns,
  dan Firestore Security Rules best practices.
---

# 🔒 Skill: Firebase Security Patterns — Teknopark

## 🎯 Prinsip Utama

> **Never trust client-supplied data.** Setiap mutasi data yang sensitif HARUS 
> divalidasi di server (Cloud Functions atau Firestore Security Rules).

## 1. Custom Claims — Cara yang Benar

### Setup (sudah ada di `customClaims.ts`)
Custom claims di-set otomatis saat field `role` di koleksi `users/{uid}` berubah.

### Membaca Custom Claims di Cloud Functions

```typescript
export const mySecureFunction = onCall(async (request) => {
  // ✅ POLA BENAR — baca dari JWT, TIDAK perlu Firestore round-trip
  const role = request.auth?.token?.role;
  const uid = request.auth?.uid;
  
  if (!uid) throw new HttpsError('unauthenticated', 'Harus login.');
  if (!['admin', 'super_admin'].includes(role)) {
    throw new HttpsError('permission-denied', 'Akses ditolak.');
  }
  
  // ... logic ...
});
```

```typescript
// ❌ POLA SALAH — buang 1 Firestore read per panggilan
const userDoc = await db.collection('users').doc(request.auth.uid).get();
const role = userDoc.data()?.role;
```

### Membaca Custom Claims di Client

```typescript
// Setelah login, paksa refresh token agar custom claims ter-update:
await user.getIdToken(true); // force refresh
const idTokenResult = await user.getIdTokenResult();
const role = idTokenResult.claims.role;
```

**Penting:** Custom claims baru aktif setelah token di-refresh atau session baru dibuka. Gunakan `user.getIdToken(true)` setelah mengubah role.

## 2. Middleware Pattern — Next.js Edge Runtime

### Masalah Saat Ini
Middleware menggunakan cookie `userRole` yang tidak terverifikasi. Ini adalah **security vulnerability** karena cookie dapat dimanipulasi.

### Pola yang Lebih Aman (Rekomendasi)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Opsi 1: Gunakan session cookie yang di-manage oleh server
  // Opsi 2: Verifikasi Firebase ID Token (butuh library seperti firebase-admin di Edge)
  // Opsi 3: Defense-in-depth — middleware sebagai "convenience layer",
  //          BUKAN satu-satunya proteksi. Layout guard + Cloud Function guard TETAP ada.
  
  // IMPLEMENTASI SAAT INI: Cookie-based (acceptable jika layout & CF guards aktif)
  const sessionToken = request.cookies.get('__session')?.value;
  if (!sessionToken) return NextResponse.redirect(new URL('/login', request.url));
  // ...
}
```

### Defense-in-Depth Strategy
Sistem HARUS punya SEMUA 3 layer ini:

| Layer | Lokasi | Proteksi |
|-------|--------|----------|
| L1: Route Block | `middleware.ts` | Mencegah load halaman |
| L2: UI Block | `layout.tsx` + `hasAccess()` | Mencegah render content |
| L3: Data Block | Cloud Functions + Firestore Rules | Mencegah akses data |

**Jika L1 bisa di-bypass (manipulasi cookie), L2 dan L3 harus tetap bekerja.**

## 3. Cloud Function Security Checklist

Setiap Cloud Function baru HARUS:

```typescript
export const myFunction = onCall(async (request) => {
  // ✅ 1. Cek autentikasi
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login diperlukan.');
  }
  
  // ✅ 2. Cek otorisasi (gunakan custom claims!)
  const role = request.auth.token?.role;
  const allowedRoles = ['admin', 'super_admin', 'kasir'];
  if (!allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Hak akses tidak cukup.');
  }
  
  // ✅ 3. Validasi input
  const { invoiceId, amount } = request.data;
  if (!invoiceId || typeof amount !== 'number' || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Data tidak valid.');
  }
  
  // ✅ 4. Baca data yang diperlukan (bukan dari input user)
  const invoiceSnap = await db.doc(`artifacts/${appId}/public/data/invoices/${invoiceId}`).get();
  if (!invoiceSnap.exists) {
    throw new HttpsError('not-found', 'Invoice tidak ditemukan.');
  }
  
  // ✅ 5. Business logic...
  
  // ✅ 6. Return response yang minimal (jangan expose data sensitif)
  return { success: true, invoiceId };
});
```

## 4. Role Hierarchy di Sistem Ini

```
super_admin
├── admin
│   ├── admin_keuangan
│   │   ├── kasir             (create invoice only)
│   │   └── kasir_pengeluaran (create expense only)
│   ├── admin_aset
│   │   └── operator_aset
│   ├── admin_tenant
│   │   └── operator_tenant
│   └── admin_pelatihan
│       └── operator_pelatihan
│
└── External Roles (akses terbatas)
    ├── tenant   → /tenant portal only
    ├── alumni   → /lms only
    ├── investor → /ekosistem only
    ├── kampus   → /ekosistem only
    ├── industri → /ekosistem only
    └── public   → read-only public pages + instruktur pelatihan
```

## 5. Panduan Firestore Security Rules (Rekomendasi)

```javascript
// firestore.rules (belum ada, perlu dibuat)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuth() { return request.auth != null; }
    function getRole() { return request.auth.token.role; }
    function isAdmin() { return getRole() in ['admin', 'super_admin']; }
    function isTenant() { return getRole() == 'tenant'; }
    function isOwnTenant(tenantId) {
      return request.auth.token.tenantId == tenantId;
    }
    
    // Root collections — proteksi penuh
    match /tenants/{tenantId} {
      allow read: if isAuth();  // semua user login bisa baca
      allow write: if isAdmin(); // hanya admin yang bisa tulis
      
      // Tenant HANYA bisa baca profil sendiri secara detail
      match /{subCollection}/{docId} {
        allow read: if isAuth() && (isAdmin() || isOwnTenant(tenantId));
        allow write: if isAdmin() || isOwnTenant(tenantId);
      }
    }
    
    match /assets/{assetId} {
      allow read: if true;  // publik boleh baca
      allow write: if isAdmin() || getRole() in ['admin_aset', 'operator_aset'];
    }
    
    // Artifact path — per-app isolation
    match /artifacts/{appId}/public/data/{collection}/{docId} {
      allow read: if isAuth();
      allow write: if isAdmin(); // ATAU via Cloud Function
    }
  }
}
```

> **Catatan:** Saat ini sistem BELUM memiliki Firestore Security Rules yang proper.
> Semua proteksi bergantung pada Cloud Functions dan client-side guards saja.
> **Ini adalah risiko keamanan kritis** — Firestore Security Rules harus segera dibuat!

## 6. Tenant Auth Flow

Saat tenant baru dibuat → trigger `onTenantCreated`:
1. Firebase Auth account dibuat dengan random password
2. User record dibuat di `users/{uid}` dengan `role: 'tenant'`, `tenantId: X`
3. Custom claims di-set otomatis via `customClaims` trigger
4. Tenant dokumen di-update dengan `authUid`

**Catatan:** Password awal di-generate random (`Sintesa@xxxx`). BELUM ada mekanisme email notifikasi ke tenant. Perlu Firebase Email Extension atau SMTP integration.

## 7. isInstructor — Optimisasi yang Perlu Dilakukan

**Saat ini:** Query ke koleksi `trainings` setiap login (lambat)

**Target:** Gunakan Custom Claims
```typescript
// Saat admin mengauthorize instruktur:
await admin.auth().setCustomUserClaims(uid, { 
  ...existingClaims, 
  isInstructor: true 
});

// Di AuthContext:
const isInstructor = idTokenResult.claims.isInstructor === true;
// TIDAK perlu query Firestore!
```
