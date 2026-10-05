# 🗺️ Roadmap Pengembangan — Sistem Presensi Tekno Sign v2.0 → v3.0

> **Status:** Draft Resmi per Oktober 2026  
> **Target Completion:** Q2 2027  
> **Konteks:** Solo Technopark (UPTD KST), 50–200 pegawai BLUD

---

## 📐 Visi Produk

Mentransformasi **Tekno Sign** dari sistem absensi digital sederhana menjadi **platform manajemen kinerja terintegrasi ASN BLUD** yang:
- Bebas dari kecurangan presensi (zero-fraud)
- Menghasilkan laporan regulasi secara otomatis  
- Mengintegrasikan data kehadiran dengan penilaian kinerja SKP
- Beroperasi offline-first di kondisi jaringan tidak stabil

---

## 🗓️ Timeline Overview

```
Okt 2026   Nov 2026   Des 2026   Jan 2027   Feb 2027   Mar 2027
│──────────│──────────│──────────│──────────│──────────│─────────
│ Phase 1  │ Phase 2  │  Phase 3 (Minggu 1) │ Phase 4  │Phase 5 │
│ Security │ Quality  │  Features           │   AI     │ Scale  │
```

---

## Phase 1 — Security & Critical Bug Fix
### ⏱️ Estimasi: 2 Minggu (Minggu 1–2 Oktober 2026)

**Prioritas: WAJIB sebelum go-live production**

### Task P1.1: Implementasi Firestore Transactions
- **File target:** `src/actions/presensi/presensi.ts`
- **Masalah:** Race condition pada check-in/check-out (BUG-01, BUG-02)
- **Solusi:**
  ```typescript
  // Ganti read-check-write dengan atomic transaction
  await adminPresensiDb.runTransaction(async (t) => {
    const snap = await t.get(docRef);
    if (snap.exists && snap.data()?.checkIn) throw new Error("ALREADY_CHECKED_IN");
    t.set(docRef, newRecord, { merge: true });
  });
  ```
- **Effort:** 4 jam
- **Test:** Unit test dengan concurrent request simulation

### Task P1.2: Firebase Session Cookie yang Aman
- **File target:** `src/lib/presensi/session.ts`
- **Masalah:** Raw ID Token di cookie (BUG-03)
- **Solusi:**
  ```typescript
  // Ganti setSessionCookie menjadi:
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 hari
  });
  cookieStore.set(PRESENSI_COOKIE_NAME, sessionCookie, {
    httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 3600
  });
  ```
- **Effort:** 3 jam
- **Test:** Verifikasi token expiry behavior

### Task P1.3: Standardisasi Timezone WIB
- **File target:** `src/actions/presensi/presensi.ts`, `src/actions/presensi/statistik.ts`
- **Masalah:** Inkonsistensi UTC vs WIB (BUG-04)
- **Solusi:** Buat utility function terpusat:
  ```typescript
  // src/lib/presensi/utils.ts
  export function getWIBTime(date = new Date()) {
    return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  }
  export function getWIBHourMinute(isoString: string) {
    const d = new Date(isoString);
    const formatted = d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
    const [h, m] = formatted.split(':').map(Number);
    return { hour: h, minute: m };
  }
  ```
- **Effort:** 5 jam
- **Dependensi:** P1.3 harus selesai sebelum statistik dapat diandalkan

### Task P1.4: Hapus Password Default dari Source Code
- **File target:** `src/actions/presensi/auth.ts`, `.env.local`
- **Solusi:**
  ```bash
  # .env.local
  PRESENSI_DEFAULT_PASSWORD=StpUser2026!
  ```
  ```typescript
  // auth.ts
  const defaultPass = process.env.PRESENSI_DEFAULT_PASSWORD;
  if (found.passwordDefault === password || (defaultPass && password === defaultPass)) {
    isPasswordCorrect = true;
  }
  ```
- **Effort:** 1 jam

### Task P1.5: Tambah `requireAuth()` ke `getLKHByDate`
- **File target:** `src/actions/presensi/lkh.ts`
- **Effort:** 30 menit

---

## Phase 2 — Data Quality & Validation
### ⏱️ Estimasi: 2 Minggu (Minggu 3–4 Oktober 2026)

### Task P2.1: Fix `approveIzin` — Filter Hari Kerja
- **File target:** `src/actions/presensi/izin.ts`
- **Masalah:** Presensi dibuat untuk Sabtu-Minggu (BUG-05)
- **Solusi:**
  ```typescript
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Skip Sabtu (6) dan Minggu (0)
      // ... buat presensi record
    }
    current.setDate(current.getDate() + 1);
  }
  ```
- **Effort:** 2 jam

### Task P2.2: Fix `approveIzin` — Sync ke Dev Store
- **File target:** `src/actions/presensi/izin.ts`
- **Masalah:** Dev mode tidak membuat presensi records saat izin disetujui (BUG-06)
- **Effort:** 2 jam

### Task P2.3: Zod Schema untuk Semua Input Modul
- **File target:** `src/lib/presensi/validations.ts`
- **Masalah:** Tidak ada Zod di izin, lembur, LKH (TD-03)
- **Solusi:** Tambahkan schema:
  ```typescript
  export const PengajuanIzinSchema = z.object({
    userId: z.string().min(1),
    jenis: z.enum(["Cuti Tahunan", "Izin Alasan Penting", "Sakit", "Dinas Luar"]),
    tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    alasan: z.string().min(10, "Alasan minimal 10 karakter"),
    atasanId: z.string().min(1),
  });
  
  export const RevisiPresensiSchema = z.object({
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    jenisRevisi: z.enum(["koreksi_jam_masuk", "koreksi_jam_pulang", "koreksi_status", "presensi_susulan"]),
    statusSemula: z.string(),
    statusDiajukan: z.string(),
    alasan: z.string().min(10),
  }).refine(data => data.statusSemula !== data.statusDiajukan, {
    message: "Status yang diajukan tidak boleh sama dengan status semula",
  });
  ```
- **Effort:** 4 jam

### Task P2.4: Batasi Waktu Pengajuan Revisi (UX-02)
- **File target:** `src/actions/presensi/revisi.ts`
- **Solusi:**
  ```typescript
  // Maks H+14 dari tanggal presensi
  const daysDiff = Math.floor((Date.now() - new Date(payload.tanggal).getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 14) {
    return { success: false, message: "Pengajuan revisi hanya dapat dilakukan maksimal 14 hari setelah tanggal presensi." };
  }
  ```
- **Effort:** 1 jam

### Task P2.5: Konsolidasikan Dev Store ke `seedData.ts`
- **File target:** `src/data/presensi/seedData.ts`, `src/actions/presensi/izin.ts`, `src/actions/presensi/lembur.ts`
- **Masalah:** Dev store tersebar di 3 file (TD-01)
- **Effort:** 3 jam

### Task P2.6: Dokumentasikan Firestore Composite Indexes
- **File target:** `firestore.indexes.json`
- **Indexes yang dibutuhkan:**
  ```json
  {
    "indexes": [
      { "collectionGroup": "presensi", "fields": [{"fieldPath": "orgId"}, {"fieldPath": "tanggal"}] },
      { "collectionGroup": "presensi", "fields": [{"fieldPath": "userId"}, {"fieldPath": "tanggal"}] },
      { "collectionGroup": "lkh", "fields": [{"fieldPath": "orgId"}, {"fieldPath": "status"}] },
      { "collectionGroup": "revisi_presensi", "fields": [{"fieldPath": "orgId"}, {"fieldPath": "status"}, {"fieldPath": "createdAt"}] }
    ]
  }
  ```
- **Effort:** 2 jam

---

## Phase 3 — Feature Enhancement
### ⏱️ Estimasi: 4 Minggu (November – Desember 2026)

### Task P3.1: Kalender Hari Libur Nasional
- **Masalah:** `isHariLibur` selalu `false` (TD-07)
- **Pendekatan:** Integrasi API kalender RI atau simpan data di Firestore
- **Skema Firestore:**
  ```
  hariLibur/{tahun-bulan-tanggal}
  ├── tanggal: "2026-12-25"
  ├── keterangan: "Hari Natal"
  ├── jenis: "nasional" | "cuti_bersama" | "lokal"
  └── orgId: "solotechnopark"
  ```
- **File target:** 
  - `src/data/presensi/masterHariLibur.ts` — data statis 2026-2027
  - `src/actions/presensi/hariLibur.ts` — CRUD hari libur
  - Integrasi ke `getKehadiranStatusHariIni()`
- **Effort:** 8 jam

### Task P3.2: Halaman "Permohonanku" untuk Pegawai (UX-03)
- **File target:** `src/app/(presensi)/presensi/revisi/page.tsx` (baru)
- **Fitur:**
  - Daftar semua permohonan revisi yang pernah diajukan user
  - Status badge: Menunggu / Disetujui / Ditolak
  - Detail alasan jika ditolak
  - Tombol ajukan revisi baru
- **Effort:** 8 jam

### Task P3.3: Notifikasi FCM untuk Revisi Presensi (UX-01)
- **File target:** `src/actions/presensi/revisi.ts`
- **Masalah:** Tidak ada notifikasi saat revisi disetujui/ditolak
- **Solusi:** Tambahkan `sendPushNotification()` di `approveRevisiPresensiAction` dan `rejectRevisiPresensiAction`
  ```typescript
  await sendPushNotification({
    userId: revisi.userId,
    title: "Revisi Presensi Disetujui ✅",
    body: `Permohonan revisi tanggal ${revisi.tanggal} telah disetujui oleh ${sessionUser.nama}.`,
  });
  ```
- **Effort:** 2 jam

### Task P3.4: Export Excel/CSV Rekap Bulanan (UX-04)
- **File target:** `src/lib/presensi/excelExport.ts` (baru)
- **Library:** `xlsx` atau `exceljs`
- **Fitur:**
  - Export rekap per bulan ke format `.xlsx`
  - Kolom: NIP, Nama, Jabatan, Total Hadir, Terlambat, Izin, Cuti, Sakit, Alpa, % Kehadiran, Predikat
  - Header instansi otomatis dari konfigurasi org
- **Effort:** 8 jam

### Task P3.5: Dashboard Real-time Status Hari Ini (UX-05)
- **File target:** `src/app/(presensi)/presensi/dashboard-today/page.tsx` (baru)
- **Fitur:**
  - Grid pegawai dengan status badge warna: Hadir, Terlambat, Belum Absen, Izin
  - Auto-refresh setiap 2 menit
  - Filter per kantor/divisi
  - Counter ringkasan di header
- **Effort:** 12 jam

### Task P3.6: Lembur — Arsip Pengajuan yang Ditolak (BUG-07 Fix)
- **File target:** `src/actions/presensi/lembur.ts`
- **Solusi:** Ganti doc ID dari `{userId}_{tanggal}` menjadi `{userId}_{tanggal}_{timestamp}` untuk pengajuan ulang
- **Effort:** 3 jam

### Task P3.7: Laporan Berita Acara — Include Revisi Annotation
- **File target:** `src/lib/presensi/beritaAcaraPdf.ts`
- **Fitur:** Tandai baris presensi yang sudah direvisi dengan simbol khusus dan keterangan "Direvisi: {alasan}"
- **Effort:** 4 jam

---

## Phase 4 — AI & Smart Analytics
### ⏱️ Estimasi: 4 Minggu (Januari 2027)

### Task P4.1: AI Anomaly Detection pada Pola Presensi
- **Model:** `clario/deepseek-v4-pro-0813` via `src/lib/clario.ts`
- **Fitur:**
  - Deteksi pegawai dengan pola mencurigakan: selalu check-in tepat jam, koordinat tidak pernah berubah
  - Scoring risiko kecurangan per pegawai (0-100)
  - Alert otomatis ke admin jika skor > 80
- **File target:** `src/lib/presensi/ai/anomalyDetection.ts` (baru)
- **Effort:** 16 jam

### Task P4.2: Smart Rekap Narasi Otomatis
- **Model:** `clario/glm-5.3-flash`
- **Fitur:** Generate narasi ringkasan kinerja kehadiran bulanan per pegawai dalam format bahasa formal ASN
- **Output:** Tambahkan ke Berita Acara PDF sebagai "Catatan Evaluasi Kinerja"
- **Effort:** 8 jam

### Task P4.3: Prediksi Risiko Alpa Minggu Depan
- **Model:** `clario/deepseek-v4-flash`
- **Input:** Riwayat 3 bulan presensi pegawai
- **Output:** Probabilitas alpa di minggu mendatang, beserta faktor penyebab
- **File target:** `src/app/(presensi)/presensi/statistik/` (tambah tab prediksi)
- **Effort:** 12 jam

### Task P4.4: OCR Surat Keterangan Dokter / Izin
- **Model:** `clario/qwen3-vl-235b-a22b-instruct`
- **Fitur:** Upload foto surat keterangan dokter saat pengajuan izin sakit, AI mengekstrak nama dokter, tanggal, dan durasi istirahat otomatis
- **File target:** `src/app/(presensi)/presensi/izin/` (tambah OCR scanning)
- **Effort:** 10 jam

---

## Phase 5 — Scale & Governance
### ⏱️ Estimasi: 4 Minggu (Februari – Maret 2027)

### Task P5.1: Multi-Instansi / Multi-Org Support
- **Konteks:** Ekspansi ke OPD/Dinas lain di Kota Solo
- **Perubahan arsitektur:**
  - Tenant isolation via Firestore rules berbasis `orgId`
  - Super-admin dashboard lintas org
  - Per-org konfigurasi: logo, jam kerja, geofence
- **Effort:** 40 jam

### Task P5.2: Offline-First PWA
- **Konteks:** Kondisi jaringan tidak stabil di lapangan (dinas luar)
- **Teknologi:** Service Worker + IndexedDB
- **Fitur:**
  - Check-in/check-out tersimpan lokal saat offline
  - Sync otomatis saat jaringan kembali
  - Status indicator online/offline
- **File target:** `src/lib/presensi/offline/` (sudah ada direktori)
- **Effort:** 24 jam

### Task P5.3: Integrasi SIASN / BKN
- **Konteks:** Sinkronisasi data pegawai dengan database BKN untuk ASN
- **Fitur:**
  - Import data pegawai dari API SIASN
  - Validasi NIP pegawai secara real-time
  - Export data presensi ke format yang kompatibel dengan e-Kinerja BKN
- **Effort:** 32 jam

### Task P5.4: Unit Testing Suite Lengkap
- **Framework:** Vitest (sudah digunakan di proyek utama)
- **Coverage target:** > 80% untuk semua server actions
- **Test priority:**
  1. `checkIn` / `checkOut` (anti-fraud logic)
  2. `calculateRekapStatistik` (financial impact)
  3. `approveRevisiPresensiAction` (data mutation)
  4. `verifyGeofenceServerSide` (security critical)
- **File target:** `src/__tests__/presensi/`
- **Effort:** 24 jam

### Task P5.5: Monitoring & Alerting Produksi
- **Integrasi:** `src/lib/logger.ts` (sudah ada)
- **Fitur:**
  - Alert ke admin saat tingkat error Firestore > 5% dalam 1 jam
  - Dashboard monitoring: response time, error rate, check-in volume
  - Laporan harian otomatis ke email admin
- **Effort:** 12 jam

---

## 📊 Sprint Planning Summary

| Sprint | Fase | Tasks | Estimasi |
|--------|------|-------|----------|
| Sprint 1 (Okt W1-W2) | Phase 1 | P1.1–P1.5 | 13.5 jam |
| Sprint 2 (Okt W3-W4) | Phase 2 | P2.1–P2.6 | 14 jam |
| Sprint 3 (Nov W1-W2) | Phase 3 (a) | P3.1–P3.4 | 26 jam |
| Sprint 4 (Nov W3-W4) | Phase 3 (b) | P3.5–P3.7 | 19 jam |
| Sprint 5 (Des W1-W2) | Phase 3 (c) + Bug Fix | P3 remaining | 20 jam |
| Sprint 6 (Jan W1-W2) | Phase 4 (a) | P4.1–P4.2 | 24 jam |
| Sprint 7 (Jan W3-W4) | Phase 4 (b) | P4.3–P4.4 | 22 jam |
| Sprint 8 (Feb W1-W2) | Phase 5 (a) | P5.1–P5.2 | 64 jam |
| Sprint 9 (Feb W3-W4) | Phase 5 (b) | P5.3–P5.5 | 68 jam |
| Sprint 10 (Mar) | QA, UAT, Go-Live | Testing + Deploy | — |

**Total Estimasi Development:** ~270 jam

---

## 🏁 Definition of Done per Phase

### Phase 1 ✅
- [ ] Zero race condition pada check-in/check-out (uji concurrent request)
- [ ] Session cookie menggunakan Firebase Session Cookie, bukan ID Token
- [ ] Semua kalkulasi waktu menggunakan timezone `Asia/Jakarta`
- [ ] Password default tersimpan di env, bukan hardcoded

### Phase 2 ✅
- [ ] Izin yang disetujui tidak membuat presensi di hari Sabtu/Minggu
- [ ] Semua input form divalidasi dengan Zod schema
- [ ] Pengajuan revisi ditolak otomatis jika > H+14
- [ ] Semua dev store terkonsolidasi di `seedData.ts`

### Phase 3 ✅
- [ ] Kalender hari libur berfungsi dan terintegrasi ke kalkulasi alpa
- [ ] Pegawai bisa melihat status revisinya sendiri
- [ ] Notifikasi FCM dikirim untuk semua approval/rejection
- [ ] Export Excel berfungsi dengan format yang sesuai

### Phase 4 ✅
- [ ] AI anomaly detection aktif dan menghasilkan alert yang actionable
- [ ] Narasi evaluasi kinerja dalam Bahasa Indonesia formal

### Phase 5 ✅
- [ ] Multi-org support dengan isolasi data yang ketat
- [ ] PWA offline-first dengan sync otomatis
- [ ] Test coverage > 80% pada semua server actions kritikal

---

*Roadmap ini akan direvisi setiap sprint berdasarkan feedback pengguna dan prioritas bisnis.*
