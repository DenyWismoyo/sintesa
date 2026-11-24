---
title: Panduan Penggunaan Role Admin Tenant & Operator Tenant (Inkubasi, Kurasi AI, Krenova & Kemitraan)
roles: admin_tenant, operator_tenant
system: SINTESA — Solo Technopark
---

# 🚀 PANDUAN PENGGUNAAN: ADMIN & OPERATOR EKOSISTEM TENANT
**Role Terkait:** `admin_tenant` (Admin Ekosistem Tenant) & `operator_tenant` (Operator Tenant)

---

## 1. Perbedaan Hak Akses `admin_tenant` vs `operator_tenant`

| Modul / Kewenangan | `admin_tenant` | `operator_tenant` |
|---|:---:|:---:|
| Inkubasi Tenant (`/tenant` — Direktori, Kanban, Matching, Helpdesk) | ✅ Penuh (+ Approve) | ✅ Operasional Harian |
| **Approve Tenant Baru & Publish Produk UKM ke E-Katalog** | ✅ **Ya** | ❌ |
| **Studio Kurasi & Asesmen AI (`/manajemen-kurasi` & `/[id]`)** | ✅ **Ya** | ❌ |
| **Kemitraan & MoU (`/manajemen-kemitraan`)** | ✅ **Ya** | ❌ |
| **Manajemen KRENOVA (`/manajemen-krenova`)** | ✅ **Ya** | ❌ |
| Manajemen Event (`/manajemen-event`) | ✅ | ✅ |
| Artikel, FAQ, Moderasi Forum & Survei IKM | ✅ | ❌ |

---

## 2. Manajemen Inkubasi Tenant (`/tenant`) — 7 Sub-Tab

1. **Direktori Startup (`direktori`):** Daftar seluruh tenant aktif (baca cepat via 1-Read Cache `cache_tenants/master`). Klik detail tenant untuk melihat laporan traksi omzet, anggota tim, VDR (*Virtual Data Room*), dan jalankan **AI Tenant Health Score** (`/api/ai/tenant-health`).
2. **Validasi Pendaftar (`validasi`):** Antrean calon tenant berstatus `Menunggu Review`. Tinjau profil usaha & pitch deck; klik **Setujui** untuk mengaktifkan akun portal `/tenant/*` secara otomatis (Cloud Function `tenantAuth.ts`).
3. **Kanban Inkubasi (`kanban`):** Papan progres tahap inkubasi (*Pra-Inkubasi → Inkubasi Awal → Akselerasi → Graduasi/Alumni Tenant*).
4. **Business Matching (`matching`):** Menghubungkan startup binaan dengan mitra industri, investor, atau kebutuhan proyek.
5. **Kurasi Produk UKM (`kurasi`):** Meninjau produk yang diunggah tenant dari `/tenant/products` sebelum disinkronkan ke etalase publik `/e-katalog`.
6. **Tagihan Tenant (`tagihan`):** Memantau status tagihan sewa ruang/layanan tenant lewat `DivisionInvoiceTracker`.
7. **Helpdesk Keluhan (`helpdesk`):** Menjawab dan menyelesaikan tiket bantuan yang dikirim tenant dari `/tenant/tickets`.

---

## 3. Studio Kurasi & Asesmen AI Universal (`/manajemen-kurasi`)

Fitur unggulan terbaru SINTESA untuk seleksi **Startup Tenant, Produk E-Katalog, maupun Peserta/Alumni**:
1. **Antrean & Workbench (`antrean`):** Buka *Curator Workbench* dual-tab untuk membandingkan jawaban pendaftar dengan skor & rekomendasi otomatis dari **Multi-Agent AI (`/api/curation-ai`)**, lalu berikan keputusan akhir kurator.
2. **Studio Template AI (`template` → `/manajemen-kurasi/[id]`):** Rancang instrumen formulir asesmen, bobot kriteria penilaian, dan *system prompt* AI pada kanvas full-page studio.
3. **Kurasi Produk E-Katalog (`produk`):** Kurasi cepat produk UMKM/startup untuk kelayakan tayang di `/e-katalog`.
4. **Distribusi Token Batch (`token`):** Terbitkan dan bagikan token batch asesmen untuk event seleksi massal melalui portal publik `/curation`.

---

## 4. Manajemen Kemitraan MoU, KRENOVA, Event & IKM

- **Kemitraan & MoU (`/manajemen-kemitraan`):**
  - Kelola 4 tab: `Daftar Dokumen MoU`, `Pipeline Calon Mitra`, `Kurasi Open Project`, dan `Pembiayaan & Bank`.
  - Gunakan **AI Partnership Match** (`/api/ai/partnership-match`) untuk mencocokkan mitra potensial.
  - Klik **Cetak MoU / PKS & Lembar Disposisi** (`partnershipMouPdf.ts`) untuk menghasilkan dokumen hukum siap tanda tangan.
- **Manajemen KRENOVA (`/manajemen-krenova`):** Kelola pendaftar inovasi masyarakat Kota Surakarta, kategori lomba, penilaian juri, dan publikasi pemenang.
- **Manajemen Event (`/manajemen-event`):** Buat jadwal seminar/workshop/pameran kawasan, pantau daftar peserta (`ModalPesertaEvent`), dan kelola publikasi halaman `/event`.
- **Survei IKM (`/manajemen-ikm`):** Analisis skor kepuasan masyarakat & unduh laporan IKM standar PermenPAN-RB No. 14/2017.
