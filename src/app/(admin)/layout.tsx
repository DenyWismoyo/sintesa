"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import {
  APP_ROLES,
  canPerformAction,
  hasAccess,
  isInternalStaff,
  PERMISSIONS,
  ROLE_LABELS,
} from '@/config/roles';
import NotificationBellDropdown from '@/components/common/NotificationBellDropdown';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  ShoppingBag,
  Receipt,
  Rocket,
  GraduationCap,
  Ticket,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Settings,
  ShieldAlert,
  Video,
  Home,
  Newspaper,
  Share2,
  Briefcase,
  ClockCheck,
  Hammer,
  Crown,
  Wrench,
  Handshake,
  Award,
  MessageSquareQuote,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import AdminCommandPalette from '@/components/admin/AdminCommandPalette';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';

export interface AdminSubTabConfig {
  id: string;
  label: string;
  permission?: string;
  hideForRoles?: string[];
}

export interface AdminMenuItemConfig {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subTabs?: AdminSubTabConfig[];
}

export interface AdminMenuGroupConfig {
  group: string;
  items: AdminMenuItemConfig[];
}

// --- KONFIGURASI MENU & PINTASAN SUB-TAB SIDEBAR ---
const MENU_GROUPS: AdminMenuGroupConfig[] = [
  {
    group: 'Utama',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Executive Command', href: '/eksekutif', icon: Crown },
    ],
  },
  {
    group: 'Kepegawaian',
    items: [
      { name: 'Presensi Pegawai STP', href: '/presensi', icon: ClockCheck },
    ],
  },
  {
    group: 'Operasional',
    items: [
      {
        name: 'Manajemen Aset',
        href: '/aset',
        icon: Building2,
        subTabs: [
          { id: 'Daftar Aset', label: 'Database Aset' },
          { id: 'Laporan Publik', label: 'Laporan Kerusakan' },
        ],
      },
      {
        name: 'Booking & Jadwal',
        href: '/booking',
        icon: CalendarDays,
        subTabs: [
          { id: 'Antrean', label: 'Antrean Persetujuan' },
          { id: 'Kalender', label: 'Kalender Master' },
          { id: 'Ruangan', label: 'Manajemen Ruangan' },
          { id: 'Fasilitas Teknis', label: 'Fasilitas Teknis' },
          { id: 'Kemitraan', label: 'Kemitraan B2B & RFP' },
        ],
      },
      {
        name: 'Jasa Produksi',
        href: '/jasa-produksi',
        icon: Hammer,
        subTabs: [
          { id: 'ALL', label: 'Semua Pesanan SPK' },
          { id: 'DRAFT_ESTIMATION', label: 'Draf & Estimasi' },
          { id: 'WAITING_DP', label: 'Menunggu DP' },
          { id: 'IN_PRODUCTION', label: 'Pengerjaan Bengkel' },
          { id: 'QC', label: 'Uji Mutu (QC)' },
          { id: 'DELIVERY', label: 'Siap Kirim & BAST' },
          { id: 'COMPLETED', label: 'Selesai Lunas' },
          { id: 'INVOICES', label: 'Monitoring Tagihan' },
        ],
      },
      {
        name: 'Service Desk & SPK',
        href: '/service-desk',
        icon: Wrench,
        subTabs: [
          { id: 'ALL', label: 'Semua Tiket' },
          { id: 'OPEN', label: 'Menunggu Teknisi' },
          { id: 'IN_PROGRESS', label: 'Dalam Pengerjaan' },
          { id: 'RESOLVED', label: 'Selesai & BAST' },
        ],
      },
    ],
  },
  {
    group: 'Komersial',
    items: [
      {
        name: 'Katalog Produk',
        href: '/katalog',
        icon: ShoppingBag,
        subTabs: [
          { id: 'daftar', label: 'Daftar Produk' },
          { id: 'tagihan', label: 'Tagihan & Order' },
          { id: 'pengaturan', label: 'Pengaturan Katalog' },
        ],
      },
      {
        name: 'Billing & Invoice',
        href: '/billing',
        icon: Receipt,
        subTabs: [
          {
            id: 'DASHBOARD',
            label: 'Dasbor Keuangan',
            hideForRoles: [APP_ROLES.KASIR, APP_ROLES.KASIR_PENGELUARAN],
          },
          {
            id: 'INCOME',
            label: 'Tagihan & Pendapatan',
            hideForRoles: [APP_ROLES.KASIR_PENGELUARAN],
          },
          {
            id: 'KONFIRMASI',
            label: 'Verifikasi Bayar',
            hideForRoles: [APP_ROLES.KASIR_PENGELUARAN],
          },
          {
            id: 'EXPENSE',
            label: 'Pengeluaran (AP)',
            hideForRoles: [APP_ROLES.KASIR],
          },
          {
            id: 'AGING_PIUTANG',
            label: 'Umur Piutang',
            hideForRoles: [APP_ROLES.KASIR_PENGELUARAN],
          },
          {
            id: 'PROFIT_CENTER',
            label: 'Laba/Rugi Divisi',
            hideForRoles: [APP_ROLES.KASIR, APP_ROLES.KASIR_PENGELUARAN],
          },
          {
            id: 'CASH_FLOW',
            label: 'Arus Kas',
            hideForRoles: [APP_ROLES.KASIR, APP_ROLES.KASIR_PENGELUARAN],
          },
          {
            id: 'CASH',
            label: 'Kas & Bank',
            hideForRoles: [APP_ROLES.KASIR, APP_ROLES.KASIR_PENGELUARAN],
          },
          {
            id: 'REKAP_ALOKASI',
            label: 'Rekap Alokasi BAS',
            hideForRoles: [APP_ROLES.KASIR, APP_ROLES.KASIR_PENGELUARAN],
          },
          {
            id: 'REPORT',
            label: 'Buku Besar',
            hideForRoles: [APP_ROLES.KASIR, APP_ROLES.KASIR_PENGELUARAN],
          },
          {
            id: 'EXPORT',
            label: 'Pusat Ekspor',
            hideForRoles: [APP_ROLES.KASIR, APP_ROLES.KASIR_PENGELUARAN],
          },
        ],
      },
      {
        name: 'Kemitraan & MoU',
        href: '/manajemen-kemitraan',
        icon: Handshake,
        subTabs: [
          { id: 'MOU_LIST', label: 'Daftar Dokumen MoU' },
          { id: 'INQUIRIES_PIPELINE', label: 'Pipeline Calon Mitra' },
          { id: 'OPEN_PROJECTS', label: 'Kurasi Open Project' },
          { id: 'FINANCING_SCHEMES', label: 'Pembiayaan & Bank' },
        ],
      },
      {
        name: 'Program Afiliasi',
        href: '/afiliasi',
        icon: Share2,
        subTabs: [
          { id: 'verifikasi', label: 'Antrean Verifikasi' },
          { id: 'direktori', label: 'Direktori Mitra' },
          { id: 'komisi', label: 'Buku Besar Komisi' },
          { id: 'pencairan', label: 'Pencairan Dana' },
          { id: 'pengaturan', label: 'Pengaturan Komisi' },
        ],
      },
    ],
  },
  {
    group: 'Ekosistem',
    items: [
      {
        name: 'Inkubasi Tenant',
        href: '/tenant',
        icon: Rocket,
        subTabs: [
          { id: 'direktori', label: 'Direktori Startup' },
          { id: 'validasi', label: 'Validasi Pendaftar' },
          { id: 'kanban', label: 'Kanban Inkubasi' },
          { id: 'matching', label: 'Business Matching' },
          { id: 'kurasi', label: 'Kurasi Produk UKM' },
          { id: 'tagihan', label: 'Tagihan Tenant' },
          { id: 'helpdesk', label: 'Helpdesk Keluhan' },
        ],
      },
      {
        name: 'Kurasi & Asesmen AI',
        href: '/manajemen-kurasi',
        icon: Sparkles,
        subTabs: [
          { id: 'antrean', label: 'Antrean & Workbench' },
          { id: 'template', label: 'Studio Template AI' },
          { id: 'produk', label: 'Kurasi Produk E-Katalog' },
          { id: 'token', label: 'Distribusi Token Batch' },
        ],
      },
      {
        name: 'Pelatihan',
        href: '/pelatihan',
        icon: GraduationCap,
        subTabs: [
          { id: 'lms', label: 'Manajemen LMS', permission: PERMISSIONS.MANAGE_LMS },
          { id: 'alumni', label: 'Database Alumni', permission: PERMISSIONS.MANAGE_ALUMNI },
          { id: 'talent', label: 'Direktori Talent', permission: PERMISSIONS.MANAGE_TALENT },
          { id: 'tagihan', label: 'Tagihan Diklat', permission: PERMISSIONS.MANAGE_LMS },
        ],
      },
      {
        name: 'Review Pelatihan',
        href: '/manajemen-review-pelatihan',
        icon: MessageSquareQuote,
        subTabs: [
          { id: 'programs', label: 'Program & Kriteria' },
          { id: 'reviews', label: 'Kotak Masuk Ulasan' },
        ],
      },
      {
        name: 'Bursa Karir',
        href: '/manajemen-karir',
        icon: Briefcase,
        subTabs: [
          { id: 'LIST', label: 'Master Lowongan' },
          { id: 'APPLICATIONS', label: 'Pelamar & Seleksi' },
          { id: 'MITRA', label: 'Mitra & Antrean Loker' },
          { id: 'FORUM', label: 'Moderasi Forum' },
          { id: 'SYNC', label: 'Kontrol Agregator API' },
          { id: 'TALENT', label: 'Penyaluran Alumni' },
          { id: 'TRACER', label: 'Tracer Study Alumni' },
        ],
      },
      { name: 'Manajemen Event', href: '/manajemen-event', icon: Ticket },
      { name: 'Artikel & Warta', href: '/manajemen-artikel', icon: Newspaper },
      { name: 'Manajemen KRENOVA', href: '/manajemen-krenova', icon: Video },
      { name: 'Survei IKM', href: '/manajemen-ikm', icon: Award },
    ],
  },
  {
    group: 'Sistem',
    items: [
      { name: 'Pusat Bantuan', href: '/manajemen-faq', icon: HelpCircle },
      {
        name: 'Pengaturan Sistem',
        href: '/pengaturan',
        icon: Settings,
        subTabs: [
          {
            id: 'Profil',
            label: 'Profil Instansi',
            permission: PERMISSIONS.EDIT_INSTITUTION_PROFILE,
          },
          {
            id: 'Keuangan',
            label: 'Billing & Keuangan',
            permission: PERMISSIONS.MANAGE_FINANCE_BAS,
          },
          {
            id: 'Sistem',
            label: 'Konfigurasi Sistem',
            permission: PERMISSIONS.EDIT_INSTITUTION_PROFILE,
          },
          {
            id: 'Notifikasi',
            label: 'Notifikasi Email',
            permission: PERMISSIONS.EDIT_INSTITUTION_PROFILE,
          },
          {
            id: 'Keamanan',
            label: 'Keamanan (RBAC)',
            permission: PERMISSIONS.MANAGE_ROLES_USERS,
          },
        ],
      },
    ],
  },
];

function filterAllowedSubTabs(subTabs: AdminSubTabConfig[] | undefined, role: string | null): AdminSubTabConfig[] {
  if (!subTabs) return [];
  return subTabs.filter((sub) => {
    if (sub.hideForRoles && role && sub.hideForRoles.includes(role)) {
      return false;
    }
    if (sub.permission && !canPerformAction(role as any, sub.permission as any)) {
      return false;
    }
    return true;
  });
}

function SidebarNavContent({
  role,
  pathname,
  isMobile = false,
  isCollapsed = false,
  onCloseMobile,
}: {
  role: string | null;
  pathname: string;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onCloseMobile?: () => void;
}) {
  const searchParams = useSearchParams();
  const currentTabParam = searchParams.get('tab');

  // Menyimpan menu mana saja yang sedang di-expand manual oleh pengguna di sidebar
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && (pathname === href || pathname.startsWith(href + '/'))) return true;
    return false;
  };

  const toggleExpand = (href: string, currentOpen: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedMap((prev) => ({
      ...prev,
      [href]: !currentOpen,
    }));
  };

  return (
    <div className={`flex flex-col ${isCollapsed ? 'gap-2 p-2 items-center' : isMobile ? 'gap-2.5 p-3' : 'gap-2.5 p-3 w-full'}`}>
      {MENU_GROUPS.map((group) => {
        const allowedItems = group.items.filter((item) => hasAccess(role as any, item.href));
        if (allowedItems.length === 0) return null;

        return (
          <div key={group.group} className={`flex flex-col ${isCollapsed ? 'items-center w-full gap-1' : 'gap-0.5'}`}>
            {!isCollapsed ? (
              <span className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                {group.group}
              </span>
            ) : (
              <div className="w-8 h-px bg-slate-100 my-1" />
            )}
            {allowedItems.map((item) => {
              const active = isActive(item.href);
              const allowedSubTabs = filterAllowedSubTabs(item.subTabs, role);
              const hasSubTabs = allowedSubTabs.length > 0;
              // Otomatis terbuka jika menu sedang aktif, kecuali ditutup manual oleh user
              const isExpanded =
                expandedMap[item.href] !== undefined ? expandedMap[item.href] : active;

              const activeSubTabId = (() => {
                if (!active || !hasSubTabs) return null;
                if (currentTabParam) {
                  const found = allowedSubTabs.find(
                    (s) => s.id.toLowerCase() === currentTabParam.toLowerCase()
                  );
                  if (found) return found.id;
                }
                return allowedSubTabs[0]?.id || null;
              })();

              // Mode Mini-Rail Collapsed
              if (isCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={`${item.name}${hasSubTabs ? ` (${allowedSubTabs.length} sub-tab)` : ''}`}
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 group ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'text-white' : 'text-slate-500 group-hover:scale-110'}`} />
                    {hasSubTabs && !active && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500 ring-2 ring-white" />
                    )}
                  </Link>
                );
              }

              return (
                <div key={item.href} className="flex flex-col">
                  <div className="relative flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => isMobile && onCloseMobile?.()}
                      className={`group flex-1 flex items-center rounded-lg transition-all duration-150 px-2.5 py-1.5 gap-2.5 text-xs font-medium min-w-0 ${
                        active
                          ? 'bg-blue-50/90 text-blue-700 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      } ${hasSubTabs ? 'pr-12' : ''}`}
                    >
                      <item.icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>

                    {hasSubTabs && (
                      <div className="absolute right-1 flex items-center gap-1">
                        {!isExpanded && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full border border-slate-200/50">
                            {allowedSubTabs.length}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(item.href, isExpanded, e)}
                          title={isExpanded ? 'Sembunyikan Sub-Tab' : 'Tampilkan Pintasan Tab'}
                          className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                            active
                              ? 'text-blue-600 hover:bg-blue-100/80'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* PINTASAN SUB-TAB ACCORDION */}
                  {hasSubTabs && isExpanded && (
                    <div className="ml-4 pl-2.5 mt-0.5 mb-1 border-l-2 border-slate-100 flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-150">
                      {allowedSubTabs.map((sub) => {
                        const isSubActive = active && activeSubTabId === sub.id;
                        return (
                          <Link
                            key={sub.id}
                            href={`${item.href}?tab=${encodeURIComponent(sub.id)}`}
                            onClick={() => isMobile && onCloseMobile?.()}
                            className={`flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] transition-colors truncate ${
                              isSubActive
                                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                            {isSubActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1.5" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ActiveSubTabBadge({
  currentMenu,
  role,
}: {
  currentMenu?: AdminMenuItemConfig;
  role: string | null;
}) {
  const searchParams = useSearchParams();
  const currentTabParam = searchParams.get('tab');

  if (!currentMenu?.subTabs || currentMenu.subTabs.length === 0) return null;
  const allowed = filterAllowedSubTabs(currentMenu.subTabs, role);
  if (allowed.length === 0) return null;

  const activeSub =
    (currentTabParam &&
      allowed.find((s) => s.id.toLowerCase() === currentTabParam.toLowerCase())) ||
    allowed[0];

  if (!activeSub) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-semibold min-w-0">
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
      <span className="text-slate-700 font-bold truncate">{activeSub.label}</span>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Ambil preferensi sidebar collapsed dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed');
      if (saved === 'true') setIsSidebarCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+K / Cmd+K untuk Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && (pathname === href || pathname.startsWith(href + '/'))) return true;
    return false;
  };

  const currentMenu = MENU_GROUPS.flatMap((g) => g.items).find((item) => isActive(item.href));

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const performLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Gagal logout:', err);
    }
  };

  const isLmsRoute = pathname.startsWith('/lms');
  const isPublicRoute =
    pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');

  if (loading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  // 1. BYPASS UNTUK RUTE PUBLIK/LMS
  if (isLmsRoute || isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 w-full">
        <div className="w-full mx-auto max-w-[1600px] px-4 py-6 sm:px-6 md:px-8 lg:px-10">
          {children}
        </div>
      </div>
    );
  }

  // 2. CEK AKSES RUTE SAAT INI (Route Guard Inti)
  const isPathAllowed = hasAccess(role, pathname);

  // 3. BLOKIR MUTLAK JIKA RUTE TIDAK DIIZINKAN
  if (!isPathAllowed) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border-4 border-white shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Akses Terlarang</h2>
        <p className="text-slate-500 mt-2 text-xs sm:text-sm font-medium max-w-md mx-auto">
          Akun Anda dengan hak akses{' '}
          <b className="text-blue-600">{role ? ROLE_LABELS[role] || role : 'Pengguna Umum'}</b>{' '}
          tidak memiliki kewenangan untuk mengakses menu{' '}
          <span className="font-mono text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
            {pathname}
          </span>
          .
        </p>
        <Link
          href={isInternalStaff(role) ? '/dashboard' : '/'}
          className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
        >
          {isInternalStaff(role) ? 'Kembali ke Dashboard' : 'Kembali ke Beranda'}
        </Link>
      </div>
    );
  }

  // 4. RENDER LAYOUT ADMIN (Sidebar dengan Pintasan Sub-Tab & Mobile Drawer)
  return (
    <div className="flex h-screen w-full bg-slate-50/70 overflow-hidden text-slate-900 font-sans">
      {/* 1. SIDEBAR DESKTOP MINIMALIS ELEGAN */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/80 shrink-0 z-30 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)] transition-all duration-200 ${
          isSidebarCollapsed ? 'w-16' : 'w-56 lg:w-64'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-14 flex items-center border-b border-slate-100 shrink-0 ${
            isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
          }`}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 group min-w-0"
            title="KST Solo Technopark"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/icon-192x192.png"
                alt="Solo Technopark"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xs text-slate-900 leading-tight tracking-tight truncate">
                  Solo Technopark
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide truncate">
                  Admin Workspace
                </span>
              </div>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              title="Lipat Sidebar (Mode Mini-Rail)"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items with Sub-Tab Shortcuts */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-1">
          <Suspense fallback={<div className="p-4 text-xs text-slate-400">Memuat navigasi...</div>}>
            <SidebarNavContent
              role={role}
              pathname={pathname}
              isCollapsed={isSidebarCollapsed}
            />
          </Suspense>
        </nav>

        {/* Footer User & Actions Card */}
        <div className={`border-t border-slate-150 bg-slate-50/60 shrink-0 ${isSidebarCollapsed ? 'p-1.5' : 'p-2.5'}`}>
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                title="Buka Sidebar Penuh"
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
              <div
                className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 cursor-default"
                title={`${ROLE_LABELS[role || ''] || role} (Online)`}
              >
                {role?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Keluar dari Sistem"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {role?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                    {ROLE_LABELS[role || ''] || role || 'Administrator'}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold">Online</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {hasAccess(role, '/presensi') && (
                  <Link
                    href="/presensi"
                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center"
                    title="Presensi Pegawai STP (Techno Sign)"
                  >
                    <ClockCheck className="w-3.5 h-3.5" />
                  </Link>
                )}
                <Link
                  href="/"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Beranda Utama"
                >
                  <Home className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 2. AREA UTAMA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-3.5 z-20 shrink-0 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" title="Beranda Katalog STP" className="shrink-0">
              <Image
                src="/icon-192x192.png"
                alt="Solo Technopark"
                width={28}
                height={28}
                className="w-7 h-7 object-contain rounded-md"
                priority
              />
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 text-xs sm:text-sm leading-tight truncate">
                {currentMenu?.name || 'Admin Panel'}
              </span>
              <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">
                {ROLE_LABELS[role || ''] || role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors active:scale-95"
              aria-label="Cari Menu & Sub-Tab"
              title="Cari Menu & Sub-Tab (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>
            <NotificationBellDropdown align="right" />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors active:scale-95"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop Top Header */}
        <header className="hidden md:flex h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 items-center justify-between px-5 z-20 shrink-0 gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                title="Buka Sidebar Penuh"
                className="mr-1 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <span className="font-extrabold text-slate-800 text-sm leading-tight truncate">
              {currentMenu?.name || 'Dashboard'}
            </span>
            <Suspense fallback={null}>
              <ActiveSubTabBadge currentMenu={currentMenu} role={role} />
            </Suspense>
            <span className="ml-1 text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200/60 uppercase tracking-wider shrink-0">
              {ROLE_LABELS[role || ''] || role}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Command Palette Button */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors border border-slate-200/60 shadow-2xs cursor-pointer"
              title="Cari Menu & Pintasan (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xl:inline">Cari menu & sub-tab...</span>
              <span className="xl:hidden">Cari...</span>
              <kbd className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs text-slate-400">
                Ctrl K
              </kbd>
            </button>

            <NotificationBellDropdown align="right" />
            <div className="h-4 w-px bg-slate-200" />
            <Link
              href="/"
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Kunjungi Beranda Publik"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Portal Publik</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-slate-50/50">
          <div className="min-h-full w-full p-3.5 sm:p-5 md:p-6 lg:p-7 2xl:px-10 max-w-[1920px] mx-auto">
            <Suspense
              fallback={
                <div className="py-24 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-xs font-semibold">Memuat modul admin...</span>
                </div>
              }
            >
              {children}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Global Command Palette Modal */}
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        role={role}
        menuGroups={MENU_GROUPS}
      />

      {/* Global Logout Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={performLogout}
        title="Keluar dari Sistem Admin"
        description="Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem manajemen Solo Technopark?"
        confirmText="Ya, Keluar"
        variant="danger"
      />

      {/* 3. MOBILE DRAWER MINIMALIS */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Body */}
          <div className="relative flex-1 flex flex-col max-w-[285px] w-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <Image
                  src="/icon-192x192.png"
                  alt="Solo Technopark"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
                <span className="font-bold text-slate-800 text-xs">Navigasi Admin & Pintasan</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Suspense fallback={<div className="p-4 text-xs text-slate-400">Memuat...</div>}>
                <SidebarNavContent
                  role={role}
                  pathname={pathname}
                  isMobile={true}
                  onCloseMobile={() => setIsMobileMenuOpen(false)}
                />
              </Suspense>
            </div>

            {/* Compact Footer Profile & Action */}
            <div className="p-3 border-t border-slate-150 bg-slate-50/80 shrink-0 flex flex-col gap-2">
              <div className="flex items-center justify-between px-2 py-1.5 bg-white rounded-lg border border-slate-200/70">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {role?.substring(0, 2).toUpperCase() || 'AD'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                      {ROLE_LABELS[role || ''] || role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {hasAccess(role, '/presensi') && (
                    <Link
                      href="/presensi"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md"
                      title="Presensi Pegawai STP"
                    >
                      <ClockCheck className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                    title="Beranda"
                  >
                    <Home className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-2 w-full py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-bold text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar dari Sistem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
