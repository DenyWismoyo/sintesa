---
name: sintesa-admin-ui
description: Standarisasi arsitektur UI halaman Admin Sintesa/Teknopark (PC, Tablet, Smartphone). Gunakan skill ini SEBELUM membuat atau merefaktor halaman di src/app/(admin)/. Berisi panduan penggunaan 14 Shared Admin Components (Gen-1: AdminPageHeader, AdminStatGrid, AdminFilterBar, AdminResponsiveView, AdminMobileCard, AdminStatusBadge, AdminFormDrawer; Gen-2: AdminCommandPalette, AdminConfirmDialog, AdminBulkActionBar, AdminPagination, AdminRowActions, AdminSectionCard, AdminEmptyState), sinkronisasi pintasan Sub-Tab Sidebar via useAdminTab (?tab=...), dan aturan responsivitas 3 perangkat.
---

# Standar Arsitektur UI Admin Sintesa / Teknopark (`src/app/(admin)/`)

Seluruh halaman di dalam grup rute `src/app/(admin)/` **WAJIB** menggunakan komponen standar dari `src/components/admin/` dan sistem sinkronisasi sub-tab URL (`useAdminTab`) agar seragam dan kompatibel 100% di **PC (`>=1024px`)**, **Tablet (`768px–1023px`)**, dan **Smartphone (`<768px`)**.

---

## 1. Struktur Anatomi Halaman Admin Standar

Setiap halaman admin (`page.tsx`) wajib mengikuti urutan vertikal berikut:
1. **`AdminPageHeader`**: Judul, *breadcrumb*, *badge*, tombol aksi utama (`actions`), dan konfigurasi `tabs` (otomatis terhubung ke pintasan Sidebar).
2. **`AdminStatGrid` / `AdminStatCard`**: Baris ringkasan KPI (`grid-cols-2 lg:grid-cols-4`).
3. **`AdminFilterBar`**: Input pencarian dan *dropdown filter* (otomatis menjadi *collapsible filter panel* di Smartphone).
4. **`AdminResponsiveView` + `AdminMobileCard`**: Kontainer data adaptif 3-perangkat (Tabel penuh di PC `lg:`, Grid 2 kolom di Tablet `md:`, dan Kartu 1 kolom di Smartphone `<md:`).
5. **`AdminFormDrawer`**: Drawer/Modal formulir atau *Full-Page Workspace* (`asPage={true}`).

---

## 2. Sistem Pintasan Sub-Tab Sidebar & Hook `useAdminTab`

Untuk halaman admin yang memiliki lebih dari 1 tab internal:
- **Jangan** membuat deretan tombol tab manual yang memakan ruang vertikal di halaman.
- Gunakan hook `useAdminTab` dari `src/hooks/useAdminTab.ts`:
  ```tsx
  import { useAdminTab } from '@/hooks/useAdminTab';

  const VALID_TABS = ['daftar', 'tagihan', 'pengaturan'] as const;
  type MyTab = (typeof VALID_TABS)[number];

  const [activeTab, setActiveTab] = useAdminTab<MyTab>('daftar', VALID_TABS);
  ```
- Daftarkan `subTabs` pada `MENU_GROUPS` di `src/app/(admin)/layout.tsx` dengan `id` yang sama persis.
- Oper daftar tab ke `AdminPageHeader`:
  ```tsx
  <AdminPageHeader
    title="Manajemen Katalog"
    tabs={[
      { id: 'daftar', label: 'Daftar Produk' },
      { id: 'tagihan', label: 'Tagihan & Order', badge: pendingCount },
      { id: 'pengaturan', label: 'Pengaturan' },
    ]}
    activeTab={activeTab}
    onTabChange={setActiveTab}
  />
  ```
  - Di **PC & Tablet (`>= md:`)**, navigasi sub-tab tampil sebagai *Accordion Sub-Menu* di Sidebar kiri serta *quick selector* di *breadcrumb*, sehingga area kerja utama tetap lega.
  - Di **Smartphone (`< md:`)**, `AdminPageHeader` otomatis menampilkan *Horizontal Pill Scroller* yang nyaman untuk layar sentuh.

---

## 3. Aturan Kompatibilitas 3 Perangkat (PC, Tablet, Smartphone)

| Perangkat | Breakpoint | Aturan Tampilan Data |
|---|---|---|
| **Smartphone** | `< 768px` (`< md:`) | **Dilarang merender `<table>` horizontal scroll**. Wajib menggunakan `AdminResponsiveView` + `AdminMobileCard` (1 kolom). |
| **Tablet** | `768px – 1023px` (`md:` ke `lg:`) | `AdminResponsiveView` merender `AdminMobileCard` dalam **Grid 2 Kolom (`md:grid-cols-2`)**. Panel split-view wajib menggunakan `AdminFormDrawer` (`xl:hidden`). |
| **PC / Desktop** | `>= 1024px` (`lg:` & `xl:`) | `AdminResponsiveView` merender tabel penuh (`renderDesktopTable`) dengan aksi baris cepat. |

---

## 4. Checklist Anti-Duplikasi (Wajib Dicek Sebelum Commit)

- [ ] Tidak ada deklarasi `function StatCard` lokal di dalam `page.tsx` — gunakan `AdminStatGrid` / `AdminStatCard`.
- [ ] Tidak ada modal manual `<div className="fixed inset-0 z-50 ...">` — gunakan `AdminFormDrawer` atau `AdminConfirmDialog`.
- [ ] Tidak ada class warna dinamis Tailwind seperti ``bg-${color}-50`` — gunakan prop `color` / `variant` pada `AdminStatCard` atau `AdminStatusBadge`.
- [ ] Semua tabel utama dibungkus dengan `AdminResponsiveView` dan memiliki `renderMobileCard` menggunakan `AdminMobileCard`.
- [ ] Jangan gunakan `window.confirm()` atau `alert()` native browser — gunakan `AdminConfirmDialog`.
- [ ] Gunakan `AdminPagination` untuk navigasi halaman & limit baris data.
- [ ] Gunakan `AdminBulkActionBar` untuk aksi massal saat baris dicentang.
- [ ] Gunakan `AdminRowActions` untuk kelompok tombol aksi baris tabel dan mobile card.
- [ ] Gunakan `AdminEmptyState` untuk tampilan data kosong atau hasil filter nihil.
- [ ] Gunakan `AdminSectionCard` untuk kartu pengaturan dan formulir.

---

## 5. Pustaka 14 Shared Admin Components (`src/components/admin/`)

### Generasi Ke-1 (Fondasi Responsif 3 Perangkat)
1. **`AdminPageHeader`**: Header halaman, breadcrumb, badge, actions, dan tabs responsif.
2. **`AdminStatGrid` / `AdminStatCard`**: Baris metrik analitik dengan varian warna semantik.
3. **`AdminFilterBar`**: Bar pencarian, dropdown filter, dan quick toggles (collapsible di mobile).
4. **`AdminResponsiveView`**: Container adaptif (Tabel PC, Grid 2 kolom Tablet, Kartu 1 kolom Smartphone).
5. **`AdminMobileCard`**: Kartu representasi data untuk Tablet dan Smartphone.
6. **`AdminStatusBadge`**: Badge status terpadu dengan varian warna standar.
7. **`AdminFormDrawer`**: Drawer/Modal formulir dengan animasi slide dan dukungan mode halaman penuh (`asPage`).

### Generasi Ke-2 (Wayfinding, Dialog & Ergonomi Enterprise)
8. **`AdminCommandPalette`**: Pencarian global `Ctrl+K` untuk 20 menu, 64 sub-tab, dan aksi cepat dengan navigasi keyboard.
9. **`AdminConfirmDialog`**: Dialog konfirmasi modern pengganti `window.confirm()` (`danger`, `warning`, `info`, `success`) dengan indikator loading.
10. **`AdminBulkActionBar`**: Bar mengambang (*floating dock*) saat baris data dicentang untuk aksi massal.
11. **`AdminPagination`**: Paginasi standar nomor halaman (`1, 2, 3...`) dan pilihan limit baris data (10/25/50/100).
12. **`AdminRowActions`**: Kelompok tombol aksi baris tabel & mobile card (`View`, `Edit`, `Delete`, `Print`, `Share`, `Custom`).
13. **`AdminSectionCard`**: Kontainer kartu formulir bertahap & pengaturan dengan header rapi dan slot footer.
14. **`AdminEmptyState`**: Tampilan data kosong atau hasil pencarian nihil dengan tombol reset filter atau tambah data baru.


