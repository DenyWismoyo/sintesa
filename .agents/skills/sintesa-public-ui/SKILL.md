---
name: sintesa-public-ui
description: >
  Standarisasi UI halaman publik Sintesa/Teknopark. Gunakan skill ini SEBELUM
  membuat atau merefaktor halaman di src/app/(public)/. Berisi checklist anti-duplikasi,
  standar lebar layar (container), sistem grid terpadu, anatomi card, class utilities globals.css,
  dan komponen reusable yang wajib digunakan. Seluruh styling yang dipakai ≥2 tempat
  WAJIB didefinisikan di globals.css, bukan sebagai inline Tailwind class di JSX.
---

# 🎨 Skill: Sintesa Public UI Standarisasi

## ⚡ Quick Checklist (Baca Sebelum Edit Halaman Publik)

- [ ] Wrapper halaman gunakan `<SectionContainer accent="..." width="...">` (bukan inline `bg-[#FAFAFA] font-sans selection:*`)
- [ ] Lebar kontainer gunakan prop `width` pada `SectionContainer` (`'default'`, `'wide'`, atau `'narrow'`)
- [ ] Grid item gunakan class grid terpadu: `.public-grid-4`, `.public-grid-3`, atau `.public-grid-2` (bukan inline `grid grid-cols-1 ...`)
- [ ] Kartu item ikuti **Anatomi Card Standar**: `.public-card`, `.public-card-media`, `.public-card-scrim`, `.public-card-body`, `.public-card-title`, `.public-card-footer`, `.public-card-action-btn`
- [ ] Background texture & ambient glow sudah otomatis disediakan oleh `SectionContainer` (DILARANG inline JSX)
- [ ] Tab pills gunakan komponen `<PillTabs>` dari `src/components/ui/PillTabs.tsx`
- [ ] Filter toolbar gunakan class `.public-filter-bar` dan dropdown select gunakan `.public-select`
- [ ] `PageHero` digunakan untuk SEMUA hero section (tidak boleh custom per halaman)
- [ ] `formatRupiah` diimpor dari `@/utils/format`, JANGAN definisikan ulang di komponen

---

## 📦 Komponen Reusable Wajib

| Komponen | Lokasi | Kapan Digunakan |
|----------|--------|-----------------|
| `SectionContainer` | `src/components/ui/SectionContainer.tsx` | Content wrapper per halaman (mendukung `accent` & `width`) |
| `PageHero` | `src/components/ui/PageHero.tsx` | Semua halaman publik — title, breadcrumb, search |
| `PillTabs` | `src/components/ui/PillTabs.tsx` | Filter tab animatif (Daftar/Kalender, segmen, kategori) |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | State kosong dengan CTA |
| `StatusBadge` | `src/components/ui/StatusBadge.tsx` | Badge status terstandarisasi |
| `OptimizedImage` | `src/components/ui/OptimizedImage.tsx` | Render gambar WebP otomatis dari Firebase Storage |

---

## 📐 Standar Lebar Layar & Grid (globals.css)

### 1. Lebar Kontainer (Containers)
```css
.public-container        /* max-width: 1600px (Default untuk katalog, fasilitas, event) */
.public-container-wide   /* max-width: 1920px (Untuk direktori ekosistem & layout ultra-wide) */
.public-container-narrow /* max-width: 1200px (Untuk halaman detail, form wizard, artikel) */
```

### 2. Sistem Grid Responsif Terpadu
Gunakan class ini secara seragam untuk menggantikan deklarasi grid inline:
```html
<!-- Grid 4 Kolom: Katalog, Event, Direktori Tenant -->
<div class="public-grid-4">...</div>
<!-- Responsive: 1 col (mobile) -> 2 cols (sm) -> 3 cols (lg) -> 4 cols (xl) -->

<!-- Grid 3 Kolom: Fasilitas Ruangan, Fasilitas Gedung -->
<div class="public-grid-3">...</div>
<!-- Responsive: 1 col (mobile) -> 2 cols (md) -> 3 cols (lg) -->

<!-- Grid 2 Kolom: Program Pelatihan / Diklat Horizontal -->
<div class="public-grid-2">...</div>
<!-- Responsive: 1 col (mobile) -> 2 cols (xl) -->
```

> [!IMPORTANT]
> **Aturan Anti-Overflow Kartu Publik**:
> Dilarang keras menggunakan layout horizontal berdampingan (`sm:flex-row` dengan media lebar statis seperti `aspect-[2/3]` 220px-280px) pada daftar item dalam grid. Format tersebut terbukti menyebabkan teks dan tombol terlempar keluar dari kartu pada viewport 640px–1024px.
> Seluruh kartu daftar publik WAJIB menggunakan **Anatomi Kartu Vertikal** (Media di atas dengan `h-52 sm:h-56`, Body di tengah, Footer di bawah).

---

## 🗂️ Anatomi Kartu Publik Standar (Card Anatomy)

Semua kartu item di halaman publik (`RoomCard`, `ProductCard`, `TenantCard`, event, pelatihan) wajib mengikuti struktur anatomi terpadu berikut:

```html
<div class="public-card public-card-hover group flex flex-col overflow-hidden relative">
  
  <!-- 1. Header Media & Scrim -->
  <div class="public-card-media">
    <OptimizedImage src="..." alt="..." className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
    <div class="public-card-scrim" />
    
    <!-- Floating Badges -->
    <div class="public-card-badge-top-left">...</div>
    <div class="public-card-badge-top-right">...</div>
    <div class="public-card-badge-bottom-left">...</div>
  </div>

  <!-- 2. Konten Kartu -->
  <div class="public-card-body">
    <span class="public-card-tag">Kategori / Segmen</span>
    <h3 class="public-card-title group-hover:text-{accent}-600">Judul Item</h3>
    <p class="public-card-desc">Deskripsi singkat...</p>

    <!-- Metadata Baris (Lokasi, Waktu, Instruktur) -->
    <div class="public-card-meta">
      <Icon size={14} className="text-{accent}-500" />
      <span>Info metadata</span>
    </div>

    <!-- 3. Footer Kartu -->
    <div class="public-card-footer">
      <div>
        <span class="public-card-price-label">Tarif Sewa / Mulai dari</span>
        <p class="public-card-price text-slate-900">
          Rp 1.000.000 <span class="text-xs text-slate-400 font-bold">/hari</span>
        </p>
      </div>

      <!-- Action Button (Circular / Pill Micro-Interaction) -->
      <button type="button" class="public-card-action-btn">
        <ArrowRight size={17} />
      </button>
    </div>
  </div>

</div>
```

---

## 🎛️ Filter Bar & Kontrol Form

```html
<!-- Toolbar Filter Borderless -->
<div class="public-filter-bar">
  <!-- Search Input -->
  <div class="public-search-bar max-w-md">
    <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
    <input type="text" placeholder="Cari..." className="public-search-input" />
  </div>

  <!-- Dropdown Select Minimalis -->
  <select class="public-select">
    <option value="all">Semua Opsi</option>
  </select>

  <!-- Pill Tabs -->
  <PillTabs tabs={...} active={...} onChange={...} />
</div>
```

---

## 🔑 Palet Aksen Per Modul

| Modul | Path | Aksen | Class Glow | Accent Prop |
|-------|------|-------|-----------|------------|
| E-Katalog | `/e-katalog` | Emerald | `public-glow-emerald` | `accentColor="emerald"` |
| Fasilitas | `/fasilitas` | Sky | `public-glow-sky` | `accentColor="sky"` |
| Pelatihan | `/program-pelatihan` | Amber | `public-glow-amber` | `accentColor="amber"` |
| Ekosistem | `/ekosistem` | Indigo | `public-glow-indigo` | `accentColor="indigo"` |
| Event | `/event` | Violet | `public-glow-violet` | `accentColor="violet"` |
| FAQ | `/faq` | Slate | `public-glow-slate` | `accentColor="blue"` |

---

## 🚫 Anti-Pattern (Dilarang)

```tsx
// ❌ SALAH: Menulis grid responsive panjang berulang-ulang
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">

// ✅ BENAR: Gunakan class grid standar
<div className="public-grid-4">
```

```tsx
// ❌ SALAH: Hardcoded border keras pada kartu
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

// ✅ BENAR: Gunakan class anatomi kartu borderless
<div className="public-card public-card-hover">
  <div className="public-card-body">...</div>
</div>
```

```tsx
// ❌ SALAH: Inline dot-grid & ambient glow
<div className="absolute inset-0 z-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(...)' }} />

// ✅ BENAR: Gunakan SectionContainer
<SectionContainer accent="emerald" width="default">
  ...
</SectionContainer>
```

---

## 📱 Standar Navigasi & Mobile Bottom Dock (globals.css)

Navigasi publik menggunakan sistem floating glassmorphic borderless yang adaptif di desktop dan mobile:

### 1. Desktop Navbar
```html
<header class="public-navbar <!-- jika scroll > 20px: public-navbar-scrolled -->">
  <div class="public-container-wide flex items-center justify-between">
    <!-- Brand Logo -->
    <Link href="/" class="flex items-center gap-2.5">...</Link>

    <!-- Nav Links (Pill Glass) -->
    <nav class="hidden lg:flex items-center gap-1 bg-slate-100/60 p-1.5 rounded-full">
      <Link href="/e-katalog" class="public-nav-link public-nav-link-active">Katalog</Link>
      <Link href="/fasilitas" class="public-nav-link">Fasilitas</Link>
    </nav>
  </div>
</header>
```

### 2. Mobile Floating Bottom Dock (`<MobileBottomNav />`)
Setiap halaman publik harus menyisakan padding bawah pada `<main class="pb-28 lg:pb-12">` agar konten tidak tertutup oleh bottom nav:
```html
<div class="public-bottom-nav lg:hidden">
  <div class="public-bottom-nav-bar">
    <Link href="/" class="public-bottom-nav-item public-bottom-nav-item-active">
      <Home size={20} />
      <span class="text-[10px] font-bold">Beranda</span>
    </Link>
    <button type="button" onClick={openDrawer} class="public-bottom-nav-item">
      <Menu size={20} />
      <span class="text-[10px] font-bold">Menu</span>
    </button>
  </div>
</div>
```

### 3. Kebijakan Penempatan Footer
- **Halaman Menu Publik (`(public)/`)**: **TIDAK** merender footer statis agar tampilan tetap minimalis, bersih, dan berfokus pada konten selayaknya aplikasi modern (SPA/PWA), serta mencegah benturan visual dengan dock navigasi seluler.
- **Landing Page Utama (`src/app/page.tsx`)**: Merender footer komprehensif SINTESA dengan logo, hak cipta, dan tautan resmi (Bantuan & FAQ, Self Assessment Tenant, Peta Kawasan, E-Katalog).

---

## 🪗 Standar Kartu Accordion (FAQ, Kurikulum, Collapsibles)

Untuk FAQ, silabus/kurikulum, dan daftar rincian expandable, dilarang menggunakan border keras per baris. Gunakan sistem `.public-accordion-*`:

```html
<div class="space-y-3">
  <div class="public-accordion-card">
    <button type="button" onClick={toggle} class="public-accordion-trigger">
      <span>Pertanyaan atau Topik</span>
      <ChevronDown size={18} class="transition-transform duration-300" />
    </button>
    <!-- AnimatePresence / collapsible content -->
    <div class="public-accordion-content">
      Jawaban atau rincian konten penjelasan...
    </div>
  </div>
</div>
```

---

## 📄 Standar Halaman Detail & Konfirmasi (Form / Lookup)

Untuk halaman utilitas terarah seperti Konfirmasi Pembayaran (`/bukti-bayar`) dan Lapor Kerusakan Aset (`/lapor-aset/[id]`):
- Gunakan prop `width="narrow"` pada `<SectionContainer width="narrow" accent="...">` (maksimal 1200px, terpusat elegan).
- Bungkus form dan lookup card dalam `.public-card` tanpa `border border-slate-200`.
- Input teks menggunakan `bg-slate-50 border-0 rounded-xl shadow-inner focus:bg-white focus:ring-2`.
- Validasi & utilitas mata uang wajib mengimpor `formatRupiah` dari `@/utils/format`.
- Tombol aksi utama menggunakan bayangan warna aksen modul: `shadow-lg shadow-{accent}-200`.

---

## 📐 Template Halaman Publik Baru

```tsx
// src/app/(public)/nama-halaman/page.tsx
'use client';

import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';

export default function NamaHalamanPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('semua');

  return (
    <SectionContainer accent="sky" width="default">
      <PageHero
        breadcrumbs={[{ label: 'Nama Halaman', href: '/nama-halaman' }]}
        badge={{ label: 'Label Badge', variant: 'sky' }}
        title="Judul Halaman"
        subtitle="Deskripsi singkat halaman ini."
        accentColor="sky"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari..."
      />

      <div className="public-filter-bar mb-6">
        <PillTabs
          tabs={['semua', 'kategori1', 'kategori2']}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="pt-2 min-h-[50vh]">
        <div className="public-grid-3">
          {/* List Kartu Mengikuti Anatomi public-card-* */}
        </div>
      </div>
    </SectionContainer>
  );
}
```
