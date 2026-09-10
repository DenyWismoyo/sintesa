# Rules untuk Proyek Teknopark/Sintesa

## ARSITEKTUR & STRUKTUR

### R-001: Ikuti Pola Service → Hook → Component
Jangan pernah menulis query Firestore langsung di dalam React component.
Selalu gunakan service layer (`src/services/`) dan hooks (`src/hooks/`).
Service → di-call dari Hook (TanStack Query) → Hook di-consume di Component.

### R-002: Gunakan Schema Zod untuk Semua Entity Baru
Setiap entity data baru HARUS punya Zod schema di `src/types/index.ts`.
Gunakan `z.infer<typeof MySchema>` sebagai TypeScript type. Jangan buat
plain `interface` untuk entity Firestore.

### R-003: Operasi Multi-Dokumen WAJIB Gunakan Batch Write
Jika sebuah operasi menyentuh lebih dari 1 dokumen Firestore (misal: update
invoice + update saldo akun + buat jurnal), HARUS menggunakan `writeBatch`
untuk atomicity. Jangan lakukan update terpisah yang bisa partial-fail.

### R-004: Jangan Baca Koleksi `tenants` Langsung untuk List UI
Untuk menampilkan daftar tenant di UI, SELALU gunakan cache:
`artifacts/{appId}/public/data/cache_tenants` dokumen `master`.
Koleksi `tenants` hanya dibaca untuk detail individual atau operasi admin.

### R-005: Pemisahan Path Firestore — Root vs Artifact
Data master/global (tenants, assets, users, trainings, catalogs, alumni) 
BERADA di root collection. Data transaksional (invoices, bookings, expenses, 
accounts, journals, budgets, orders) BERADA di `artifacts/{appId}/public/data/`.
Jangan mencampur keduanya.

---

## KEAMANAN (SECURITY)

### R-006: Cloud Functions WAJIB Validasi Autentikasi & Otorisasi
Setiap Cloud Function yang bisa dipanggil dari client (`onCall`) WAJIB:
1. Cek `request.auth` (autentikasi)
2. Cek role dari `request.auth.token.role` (otorisasi via Custom Claims)
3. JANGAN membaca koleksi `users` hanya untuk mendapatkan role — gunakan custom claims.

### R-007: Jangan Percaya Input Client untuk Path Firestore
Jangan gunakan data dari `request.data` secara langsung sebagai bagian dari
Firestore path tanpa validasi/sanitasi. Selalu validasi `appId` dan parameter
lainnya dari server side.

### R-008: Role Baru Harus Update roles.ts (Single Source of Truth)
Menambahkan role baru WAJIB update `src/config/roles.ts` (semua bagian: APP_ROLES, 
ROLE_LABELS, ROLE_ACCESS_MAP, ACTION_PERMISSIONS). Edge Proxy di `src/proxy.ts`
(konvensi resmi Next.js 16) secara otomatis membaca `hasAccess` dari `roles.ts` sehingga dilarang menduplikasi kamus rute di berkas lain.

### R-009: Semua Cache Rebuild Functions WAJIB Validasi Role Admin
Setiap Cloud Function yang men-trigger rebuild cache HARUS memvalidasi bahwa
pemanggil memiliki role `admin` atau `super_admin` sebelum mengeksekusi.

---

## DATA & KONSISTENSI

### R-010: Gunakan `serverTimestamp()` di Cloud Functions
Di Cloud Functions (server-side), gunakan `admin.firestore.FieldValue.serverTimestamp()`
bukan `Date.now()` untuk field `createdAt` dan `updatedAt`. `Date.now()` 
boleh digunakan di client-side service.

### R-011: Validasi Balance Jurnal sebelum Commit
Setiap pembuatan entri jurnal (journal entries) WAJIB memvalidasi bahwa total
DEBIT === total KREDIT sebelum di-commit ke Firestore. Gunakan fungsi
`financeService.addAutoJournal()` yang sudah memiliki validasi ini.

### R-012: `syncBackToOrigin` Hanya Dipanggil saat Invoice PAID
Fungsi `billingService.syncBackToOrigin(invoice)` hanya boleh dipanggil
setelah memverifikasi bahwa `invoice.status === 'PAID'`. Jangan panggil
saat status `PARTIAL` atau `PENDING`.

### R-013: Enum Harus Konsisten antar Schema Terkait
Saat menambah nilai baru pada enum di satu schema (misal FundingRound.roundName),
periksa apakah ada schema lain yang terkait (misal Tenant.fundingStage) yang
juga perlu diperbarui. Enum yang berhubungan harus selalu sinkron.

---

## PERFORMA

### R-014: Hindari `staleTime: 0` di TanStack Query
Jangan set `staleTime: 0` kecuali ada kebutuhan realtime yang sangat spesifik.
Default minimum yang aman: `staleTime: 1000 * 60` (1 menit). Untuk data yang
jarang berubah, gunakan `staleTime: 1000 * 60 * 30` (30 menit).

### R-015: Query dengan Filter Compound Butuh Composite Index
Query Firestore yang menggunakan lebih dari satu `.where()` pada field berbeda,
atau kombinasi `.where()` + `.orderBy()` pada field berbeda, MEMERLUKAN
Composite Index. Dokumentasikan semua composite index yang dibuat di `firestore.indexes.json`.

### R-016: Limit Default Query Harus Wajar
Hindari default limit yang terlalu besar (> 200 rows) tanpa kebutuhan yang jelas.
Gunakan pagination (`getPaginatedX`) untuk daftar data besar.

---

## CODING STYLE

### R-017: Utility Functions di `utils/`, Bukan di `types/`
Fungsi pembantu seperti `formatRupiah`, `formatDate`, dll. harus berada di
`src/utils/format.ts` atau `src/utils/`, BUKAN di `src/types/index.ts`.

### R-018: `getAppId()` Hanya dari Satu Sumber
Selalu impor `getAppId()` dari utility terpusat (idealnya `src/lib/appId.ts`),
jangan duplikasi fungsi ini di setiap service file. Saat ini masih tersebar —
konsolidasikan ke satu lokasi.

### R-019: Dead Code Harus Dihapus
Jangan biarkan fungsi yang dinonaktifkan (seperti `generateInvoiceOnBookingApproval`
yang berisi `return null`) tetap di-export dan di-deploy. Hapus dari index.ts
dan hapus file jika sudah tidak diperlukan.

### R-020: Tambahkan Error Boundary di Route Utama
Setiap route group yang besar (`(admin)`, `(public)`, `tenant`) harus memiliki
`error.tsx` yang menangkap error dengan graceful fallback UI.

### R-021: Utilitas Format Terpusat di `src/utils/`
DILARANG menaruh implementasi logika formatting di `src/types/`. Gunakan `src/utils/format.ts`.

### R-022: Konfigurasi Bucket Firebase Storage
Bucket utama sistem adalah `gs://sintesa` yang didefinisikan di `.env.local` (`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`).
Gunakan `storage` singleton dari `@/lib/firebase` atau `storageService` dari `@/services/storage.service.ts`.

### R-023: Standar Penanganan Firebase Storage
1. **Sanitasi Nama:** Setiap file yang diunggah ke Firebase Storage WAJIB dibersihkan dari karakter ilegal menggunakan `sanitizeFileName()` atau regex `replace(/[^a-zA-Z0-9.]/g, '_')`.
2. **Kompresi Gambar:** Semua upload gambar dari browser HARUS melalui kompresi klien (`compressImage` / `storageService.uploadImage`) sebelum diunggah ke cloud (maksimal 1200px dan 1MB).
3. **Pembersihan File:** Saat menghapus entitas dokumen Firestore yang memiliki file di Storage, wajib menghapus file fisiknya menggunakan `storageService.deleteFile` untuk mencegah kebocoran penyimpanan (storage leak).
4. **Security Rules:** Semua folder Storage wajib dilindungi oleh `storage.rules` dengan validasi ukuran dan tipe konten (MIME).

### R-024: Codebase Khusus Cloud Functions ("sintesa")
Konfigurasi `functions` di `firebase.json` WAJIB menggunakan `"codebase": "sintesa"`, BUKAN `"codebase": "default"`. Hal ini mencegah tabrakan, overwriting, atau penghapusan fungsi lain yang hidup di project Firebase `teknopark-surakarta`. Perintah deploy wajib menggunakan `firebase deploy --only functions:sintesa`.

### R-025: Standardisasi Region "asia-southeast2" (Jakarta)
1. **Cloud Functions Backend:** Wajib mendefinisikan `setGlobalOptions({ region: "asia-southeast2", maxInstances: 10 })` di `functions/src/index.ts`.
2. **Frontend Client:** Inisialisasi Firebase Functions di client WAJIB mengarah ke region `"asia-southeast2"`. Selalu impor singleton `functions` dari `@/lib/firebase` dan JANGAN memanggil `getFunctions()` secara mandiri tanpa argumen region agar tidak terjadi error 404 NOT_FOUND.

### R-026: Wajib Gunakan Cloud Functions v2 (2nd Gen)
DILARANG menggunakan Cloud Functions v1 (`firebase-functions/v1` atau sintaks lama `functions.https.onCall`).
Semua fungsi callable dan trigger Firestore/Storage WAJIB menggunakan modul v2:
- `firebase-functions/v2/https` (`onCall`)
- `firebase-functions/v2/firestore` (`onDocumentCreated`, `onDocumentWritten`, dll.)
- `firebase-functions/v2/storage` (`onObjectFinalized`, `onObjectDeleted`)
- Konfigurasi terpusat wajib didefinisikan via `setGlobalOptions()` di `functions/src/index.ts`.

### R-027: Prosedur Migrasi Codebase & Pencegahan Duplikasi Trigger
Saat memindahkan fungsi dari satu codebase (misal: `default`) ke codebase terisolasi (`sintesa`):
1. Cek daftar fungsi aktif via `firebase functions:list`.
2. Hapus fungsi lama di codebase asal yang duplikat/usang sebelum atau sesudah deploy untuk mencegah trigger ganda pada event Firestore.
3. Deploy selalu spesifik per codebase: `firebase deploy --only functions:<codebase_name>`.

### R-028: Dilarang Full Collection Scan untuk Pencarian Dokumen Tunggal
DILARANG menggunakan `getDocs(collection)` lalu melakukan `array.find()` di client side untuk mencari entitas berdasarkan nomor unik (seperti `invoiceNumber`, `ticketCode`, `registrationId`).
Wajib menggunakan query Firestore terarah: `query(collectionRef, where('uniqueField', '==', searchValue), limit(1))`.

### R-029: Dilarang Melakukan N+1 Query Loop pada Subkoleksi di Client Side
DILARANG mengambil dokumen koleksi induk lalu melakukan `map()` async untuk men-query subkoleksi masing-masing induk di browser (contoh: mengambil seluruh pelatihan lalu meloop query registrasi masing-masing).
Gunakan `collectionGroup()` dengan filter spesifik (misal: `where('email', '==', user.email)`) atau denormalisasi atribut induk pada dokumen subkoleksi.

### R-030: Standar Gambar Responsif Menggunakan OptimizedImage
Semua card dan list yang menampilkan gambar dari Firebase Storage WAJIB menggunakan komponen `@/components/ui/OptimizedImage`. Komponen ini otomatis meminta thumbnail `.webp` yang digenerate oleh Cloud Functions trigger `storageAutomation` untuk mempercepat LCP (Largest Contentful Paint) dan menghemat bandwidth.

### R-031: Standar Navigasi Ponsel yang Stabil (Eliminasi Floating Dock Glitch)
DILARANG menggunakan dock floating pill mengambang yang rawan bertabrakan posisi (`fixed` collision) dengan safe area atau elemen header ponsel. Navigasi seluler WAJIB berpusat pada Header Atas dengan Hamburger Drawer Menu yang bersih, responsif, dan bebas overlap.

### R-032: Wajib Pemisahan Komponen Modular (Dilarang Monolith > 250 Baris)
DILARANG membuat file halaman publik melebihi 250 baris yang mencampur logika header, filter, modal, dan render kartu. Setiap halaman publik WAJIB dipecah ke folder `components/` milik route tersebut:
1. `Hero` / `Header` komponen mandiri (dengan tipografi bebas wrap sempit).
2. `Filters` komponen mandiri (menyatukan search + kategori tanpa duplikasi tombol).
3. `Card` komponen mandiri (kartu item yang reusable).
4. `Modal` / `Drawer` komponen mandiri di file terpisah (DILARANG mendeklarasikan modal di dalam function body halaman utama karena memicu unmount & re-render bug).

### R-033: Standar Kesatuan Filter & Anti-Duplikasi
DILARANG menduplikasi tombol filter (misal: tombol modal drawer ditaruh berdampingan dengan deretan pill filter dan input search yang sama). Search dan pemilihan kategori HARUS menjadi satu kesatuan antarmuka `FilterBar` yang terpadu dan proporsional.

### R-034: Tipografi Bebas Jepit pada Header Halaman
Judul halaman publik (`h1`) WAJIB memiliki lebar kontainer bebas hambatan (full-width atau min-width leluasa). Kontrol view switcher, aksi tambahan, atau CTA HARUS ditempatkan di baris bawah judul atau menggunakan grid layout independen, BUKAN ditaruh sejajar yang menghimpit teks judul hingga patah per kata.

### R-035: AI Engine Resilience & Real Data Grounding
1. Seluruh pemanggilan AI WAJIB menggunakan gateway terpusat di `src/lib/clario.ts` dengan arsitektur Dual-Engine (Clario + Google Gemini `gemini-2.5-flash` failover).
2. DILARANG menggunakan mock/dummy data statis sebagai pengganti respon AI. Jika terjadi gangguan jaringan, sistem harus memanfaatkan failover aktif berkecepatan tinggi agar hasil inferensi nalar AI nyata selalu diperoleh.
3. Analisis dan audit bisnis tenant WAJIB mengekstrak data riil komprehensif dari Firestore (katalog produk, omzet aktual bulanan, KPI survival metrics, catatan monev, log konsultasi mentoring, progres kurikulum, dan self-assessment) serta menerapkan prompt berperspektif segmen (`StartUp` vs `UMKM`). Output analisis WAJIB mencakup Executive Synthesis, 5-Axis Radar Dimensions, Matriks SWOT Komprehensif, dan Tactical Action Roadmap (30/90/180 hari).

### R-036: Edge Proxy Session Verification & Anti-Cookie Spoofing
Edge Proxy di `src/proxy.ts` DILARANG hanya membaca plain cookie `userRole` tanpa verifikasi integritas token. Sistem harus memverifikasi session token JWT dari Firebase Auth (`__session` / ID Token) untuk memastikan peran pengguna tidak dimanipulasi secara lokal di browser client.

### R-037: Rate Limiting Wajib pada Public AI Routes
Setiap API route yang memanggil model AI Clario (`/api/ask-ai`, `/api/curation-ai`, dll.) WAJIB menerapkan fungsi `checkRateLimit` dari `@/lib/rateLimit`. Batas maksimum default adalah 10-15 request per menit per IP untuk mencegah abuse dan lonjakan tagihan API.

### R-038: Enkapsulasi Slot-Locking Booking Aset via runTransaction
Seluruh proses reservasi jadwal fasilitas/ruangan WAJIB dijalankan dalam Firestore `runTransaction` (baik melalui Cloud Function `submitBooking` atau service atomik) dengan pengecekan tumpang tindih waktu (date & time overlap) secara absolut sebelum dokumen baru ditulis.

### R-039: Standardisasi Gateway Clario AI (HTTPS & Fast Models)
Konfigurasi `src/lib/clario.ts` dan MCP server WAJIB menggunakan endpoint HTTPS resmi `https://clario.apicloud.my.id/v1`. Model default untuk chat dan sintesis teks cepat adalah `clario/qwen3.8-27b` dengan failover otomatis ke `clario/deepseek-v4-flash`.



