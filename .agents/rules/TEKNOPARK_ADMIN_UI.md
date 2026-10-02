# 🏛️ Standar Baku Antarmuka Admin Suite (Teknopark/Sintesa)

> Aturan ini mengikat seluruh pengembangan halaman di `src/app/(admin)/*` dan komponen di `src/components/admin/`.

---

## 🎯 Filosofi Desain: Desktop Match & Mobile-First Operation

Admin operasional Teknopark (kasir billing, pengelola aset, penanggung jawab booking fasilitas, kurator tenant, dan admin pelatihan) sering beroperasi langsung di lapangan menggunakan smartphone atau tablet. Karena itu, antarmuka admin **WAJIB** memenuhi dua kriteria utama:
1. **Desktop Match**: Tampilan di desktop (layar lebar ≥ 1024px) harus memanfaatkan lebar layar secara optimal dengan tabel data terstruktur, filter multi-kriteria, metrik analitik, dan pintasan aksi yang lengkap.
2. **Mobile Ergonomic**: Tampilan di smartphone (layar kecil < 1024px) dilarang keras menuntut scroll horizontal tabel (`overflow-x-auto`) yang memotong teks. Data harus otomatis bertransformasi menjadi **Card List View** yang ringkas, dengan tombol aksi minimal ukuran 44x44px untuk kenyamanan tap jempol.

---

## 📐 4 Komponen Baku Admin Suite

Setiap halaman modul admin **WAJIB** mengadopsi pola 4 komponen terpusat di `src/components/admin/`:

### 1. `AdminPageHeader`
Header halaman terpadu yang memuat:
- Judul modul (`title`) & deskripsi singkat (`subtitle`).
- Badge status peran atau total data (`badge`).
- Tombol aksi primer (seperti `+ Tambah Data` atau `Ekspor Excel`).
- **Aturan Responsif**: Pada mobile (< 768px), tombol aksi primer otomatis beradaptasi menjadi full-width di bawah judul atau sticky bar yang mudah diakses.

### 2. `AdminFilterBar`
Toolbar pencarian dan penyaringan data:
- Input pencarian teks real-time dengan icon search dan tombol clear.
- Segmented pills untuk filter status atau kategori utama.
- Tombol "Filter Lanjutan" yang di desktop membuka popover/dropdown, dan di mobile membuka **Bottom Sheet Filter**.

### 3. `AdminResponsiveView` (Hybrid Table / Card List)
Kontainer data dinamis:
- Menerima `renderDesktopTable` dan `renderMobileCard`.
- **Breakpoint lg (≥ 1024px)**: Menampilkan tabel `<table>` dengan header kolom lengkap, zebra/hover rows, dan pagination.
- **Breakpoint mobile (< 1024px)**: Otomatis merender daftar kartu (`space-y-3` atau `grid-cols-1 sm:grid-cols-2`) dengan informasi terpenting di baris atas, badge status di kanan atas, dan tombol aksi terintegrasi di bagian bawah kartu.

### 4. `AdminFormDrawer`
Modal formulir penambahan / pengeditan data:
- **Desktop**: Dialog modal terpusat (`max-w-2xl` s/d `max-w-4xl`) dengan backdrop blur.
- **Mobile**: Menjadi **Bottom Sheet Full Height** yang meluncur dari bawah, dengan header sticky dan tombol simpan / batal sticky di bagian bawah (`sticky bottom-0 pb-safe`).

---

## 🎨 Palet Warna Status Baku (Konsisten Antar-Modul)

Gunakan utility classes Tailwind berikut untuk seluruh status di admin:

| Status | Tipe Data | Class Tailwind |
| :--- | :--- | :--- |
| **Sukses / Lunas / Approved** | PAID, APPROVED, COMPLETED, ACTIVE | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| **Menunggu / Pending / Review** | PENDING, VERIFYING, DRAFT, REQUESTED | `bg-amber-50 text-amber-700 border-amber-200` |
| **Dibatalkan / Ditolak / Overdue** | REJECTED, OVERDUE, CANCELLED, SUSPENDED | `bg-red-50 text-red-700 border-red-200` |
| **Cicilan / Sebagian / Proses** | PARTIAL, IN_PROGRESS, ONGOING | `bg-blue-50 text-blue-700 border-blue-200` |
| **Netral / Arsip / Nonaktif** | ARCHIVED, INACTIVE, GENERAL | `bg-slate-100 text-slate-700 border-slate-200` |

---

## 🚫 Larangan Keras (Antipatterns)

1. ❌ **Dilarang** menyajikan tabel data penting hanya dengan `overflow-x-auto` tanpa alternatif kartu di mobile.
2. ❌ **Dilarang** menempatkan tombol aksi (Edit, Hapus, Detail) dengan ukuran lebih kecil dari 36x36px di tampilan mobile.
3. ❌ **Dilarang** menggunakan dialog modal fixed width yang terpotong di layar smartphone atau menutupi tombol submit saat keyboard virtual terbuka.
4. ❌ **Dilarang** menggunakan padding container berlebihan di mobile (gunakan `p-4` di mobile dan `p-6 md:p-8` di desktop).
