// Lokasi file: src/components/common/PublicNavbar.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  ArrowUpRight,
  LogOut,
  User,
  ShieldCheck,
  Building2,
  Sparkles,
  ShoppingBag,
  GraduationCap,
  Users,
  Newspaper,
  CalendarDays,
  BookOpen,
  Info,
  HelpCircle,
  ChevronRight,
  Search,
  Briefcase,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { isInternalStaff, APP_ROLES, canAccessCareer } from '@/config/roles';
import GlobalSearchModal from './GlobalSearchModal';

export interface NavMenu {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: string;
  description?: string;
  isExclusive?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavMenu[];
}

export const PUBLIC_NAV_GROUPS: NavGroup[] = [
  {
    id: 'layanan',
    label: 'Layanan',
    items: [
      {
        name: 'Katalog Produk',
        path: '/e-katalog',
        description: 'Produk inovasi & hasil riset tenant kawasan',
        icon: ShoppingBag,
      },
      {
        name: 'Fasilitas Kawasan',
        path: '/fasilitas',
        description: 'Sewa coworking space, lab riset & ruang acara',
        icon: Building2,
      },
    ],
  },
  {
    id: 'pelatihan',
    label: 'Pelatihan & Karir',
    items: [
      {
        name: 'Program Pelatihan',
        path: '/program-pelatihan',
        description: 'Akademi vokasi industri manufaktur & teknologi digital',
        icon: GraduationCap,
      },
      {
        name: 'Ruang Belajar',
        path: '/ruang-belajar',
        description: 'Akses modul materi & pembelajaran digital',
        icon: BookOpen,
      },
      {
        name: 'Bursa Karir',
        path: '/karir',
        description: 'Penyaluran kerja mitra industri pilihan',
        icon: Briefcase,
        badge: 'Eksklusif',
        isExclusive: true,
      },
    ],
  },
  {
    id: 'ekosistem',
    label: 'Ekosistem',
    items: [
      {
        name: 'Jejaring Ekosistem',
        path: '/ekosistem',
        description: 'Sinergi startup, kampus mitra & investor',
        icon: Users,
      },
      {
        name: 'Agenda Event',
        path: '/event',
        description: 'Workshop, pameran inovasi & kompetisi teknologi',
        icon: CalendarDays,
      },
      {
        name: 'Artikel & Warta',
        path: '/artikel',
        description: 'Publikasi sains terapan & kabar terkini kawasan',
        icon: Newspaper,
      },
    ],
  },
  {
    id: 'tentang',
    label: 'Tentang',
    items: [
      {
        name: 'Profil Kawasan',
        path: '/tentang',
        description: 'Visi, misi, sejarah, & fasilitas Solo Technopark',
        icon: Info,
      },
      {
        name: 'Pusat Bantuan / FAQ',
        path: '/faq',
        description: 'Informasi operasional & panduan layanan',
        icon: HelpCircle,
      },
    ],
  },
];

// Flat menus untuk kompatibilitas pencarian atau komponen lain
export const PUBLIC_NAV_MENUS: NavMenu[] = PUBLIC_NAV_GROUPS.flatMap((g) => g.items);

const menuOverlayVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: -8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.98, y: -8, transition: { duration: 0.2 } }
};

const navListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.05 } }
};

const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } }
};

export default function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Shortcut Cmd+K / Ctrl+K untuk Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tutup menu saat route berpindah
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Lock scroll background saat overlay mobile terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // State untuk dropdown menu desktop
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter grup navigasi: item Karir hanya untuk Alumni dan seluruh Admin
  const filteredNavGroups = useMemo(() => {
    return PUBLIC_NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.path === '/karir') {
          return canAccessCareer(role);
        }
        return true;
      }),
    }));
  }, [role]);

  // Flat menu untuk mobile nav
  const flatNavMenus = useMemo(() => {
    return filteredNavGroups.flatMap((group) => group.items);
  }, [filteredNavGroups]);

  // Handler dropdown desktop dengan micro-delay agar kursor tidak mudah lepas
  const handleMouseEnter = (groupId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(groupId);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  // Tutup dropdown saat route berpindah
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  // Tutup dropdown saat tombol ESC ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = 'userRole=; path=/; max-age=0;';
      toast.success('Berhasil Keluar', { description: 'Sesi Anda telah diakhiri.' });
      router.push('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      toast.error('Gagal Logout', { description: 'Terjadi kesalahan saat mengakhiri sesi.' });
    }
  };

  // Render tombol autentikasi untuk Desktop
  const renderDesktopAuth = () => {
    if (loading) {
      return <div className="w-28 h-9 bg-slate-100 animate-pulse rounded-full" />;
    }

    if (!user) {
      return (
        <Link
          href="/login"
          className="px-4 py-2 h-9 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-all shadow-xs flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Masuk Portal</span>
          <ArrowUpRight size={14} className="opacity-70" />
        </Link>
      );
    }

    if (isInternalStaff(role)) {
      return (
        <Link
          href="/dashboard"
          className="px-4 py-2 h-9 text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white rounded-full transition-all shadow-xs flex items-center gap-1.5 hover:-translate-y-0.5"
        >
          <ShieldCheck size={15} />
          <span>Dashboard Admin</span>
        </Link>
      );
    }

    if (role === APP_ROLES.TENANT) {
      return (
        <Link
          href="/tenant/dashboard"
          className="px-4 py-2 h-9 text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white rounded-full transition-all shadow-xs flex items-center gap-1.5 hover:-translate-y-0.5"
        >
          <Building2 size={15} />
          <span>Dashboard Tenant</span>
        </Link>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Link
          href="/portal"
          className="px-3.5 py-1.5 h-9 text-xs font-bold bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 rounded-full transition-all flex items-center gap-1.5 shadow-2xs"
        >
          <Sparkles size={14} className="text-blue-600" />
          <span>Portal Saya</span>
        </Link>
        <Link
          href="/profil"
          className="px-3 py-1.5 h-9 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full transition-all flex items-center gap-1.5 shadow-2xs"
          title="Profil Saya"
        >
          <User size={14} />
          <span>Profil</span>
        </Link>
        <button
          onClick={handleLogout}
          className="p-2 h-9 w-9 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-full transition-all flex items-center justify-center shadow-2xs cursor-pointer"
          title="Keluar Akun"
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  };

  // Render autentikasi untuk Mobile Drawer
  const renderMobileAuth = () => {
    if (loading) {
      return <div className="h-12 w-full bg-slate-100 animate-pulse rounded-xl" />;
    }

    if (!user) {
      return (
        <Link
          href="/login"
          onClick={() => setIsMobileMenuOpen(false)}
          className="w-full h-12 text-sm font-bold bg-gradient-to-r from-slate-900 to-slate-800 active:from-slate-800 active:to-slate-700 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <span>Masuk Portal Layanan</span>
          <ArrowUpRight size={16} className="opacity-70" />
        </Link>
      );
    }

    const roleName = isInternalStaff(role)
      ? 'Staff Internal / Admin'
      : role === APP_ROLES.TENANT
      ? 'Tenant Startup'
      : 'Pengguna Publik';

    return (
      <div className="flex flex-col gap-2.5 w-full">
        {/* User Card Singkat */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
            <User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {user.displayName || user.email || 'Pengguna Terverifikasi'}
            </p>
            <p className="text-[10px] font-semibold text-slate-500">{roleName}</p>
          </div>
        </div>

        {/* Action Button sesuai role */}
        {isInternalStaff(role) ? (
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full h-11 text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-xl shadow-xs flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} />
            <span>Buka Dashboard Admin</span>
          </Link>
        ) : role === APP_ROLES.TENANT ? (
          <Link
            href="/tenant/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full h-11 text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-xl shadow-xs flex items-center justify-center gap-2"
          >
            <Building2 size={16} />
            <span>Buka Dashboard Tenant</span>
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/portal"
              onClick={() => setIsMobileMenuOpen(false)}
              className="h-11 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Portal Saya</span>
            </Link>
            <Link
              href="/profil"
              onClick={() => setIsMobileMenuOpen(false)}
              className="h-11 text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5"
            >
              <User size={14} />
              <span>Profil</span>
            </Link>
          </div>
        )}

        {/* Tombol Logout */}
        <button
          onClick={handleLogout}
          className="w-full h-10 text-xs font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Keluar Akun</span>
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Global Search Modal Spotlight */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* --- TOP FIXED NAVBAR (MINIMALIS & ELEGAN) --- */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] py-2'
            : 'bg-white/85 backdrop-blur-md border-b border-slate-200/60 py-2 sm:py-2.5'
        }`}
      >
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* SISI KIRI: HANYA LOGO RESMI SOLO TECHNOPARK (BERSIH TANPA TEKS) */}
          <Link href="/" className="flex items-center group shrink-0" title="Beranda Solo Technopark">
            <div className="h-8 sm:h-9 flex items-center justify-center relative">
              <Image
                src="/logo.png"
                alt="Solo Technopark"
                width={76}
                height={40}
                className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </Link>

          {/* SISI TENGAH: NAVIGASI DESKTOP MINIMALIS (4 KATEGORI DENGAN DROPDOWN ELEGAN) */}
          <nav 
            className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2 max-w-2xl"
            onMouseLeave={handleMouseLeave}
          >
            {filteredNavGroups.map((group) => {
              const isGroupActive = group.items.some(
                (item) => pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path))
              );
              const isOpen = openDropdown === group.id;

              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(group.id)}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                      isGroupActive || isOpen
                        ? 'text-blue-700 bg-blue-50/90 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                    aria-expanded={isOpen}
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-80 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.15)] p-2"
                      >
                        <div className="flex flex-col gap-1">
                          {group.items.map((item) => {
                            const isItemActive =
                              pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
                            const Icon = item.icon;

                            return (
                              <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setOpenDropdown(null)}
                                className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 ${
                                  isItemActive
                                    ? 'bg-blue-50/90 text-blue-700'
                                    : 'hover:bg-slate-100/80 text-slate-700'
                                }`}
                              >
                                <div
                                  className={`p-2 rounded-xl shrink-0 transition-colors ${
                                    isItemActive
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                                  }`}
                                >
                                  <Icon size={16} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-xs font-bold leading-tight ${
                                        isItemActive
                                          ? 'text-blue-700 font-extrabold'
                                          : 'text-slate-800 group-hover:text-blue-600'
                                      }`}
                                    >
                                      {item.name}
                                    </span>
                                    {item.badge && (
                                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-1 mt-0.5">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* SISI KANAN DESKTOP: SEARCH BAR + AUTH WIDGET */}
          <div className="hidden lg:flex items-center gap-3 shrink-0 min-w-[200px] justify-end">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 h-9 px-3.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/60 text-slate-400 hover:text-slate-600 text-xs font-medium transition-all w-44 xl:w-56 cursor-pointer"
            >
              <Search size={14} className="text-slate-500 shrink-0" />
              <span className="truncate text-slate-500 text-[11px] xl:text-xs">
                Cari layanan...
              </span>
              <kbd className="ml-auto hidden xl:inline-block px-1.5 py-0.2 text-[9px] font-bold bg-white text-slate-400 rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>

            {renderDesktopAuth()}
          </div>

          {/* SISI KANAN PONSEL / TABLET: TOMBOL SEARCH & HAMBURGER BERDAMPINGAN */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {/* Tombol Search di Ponsel (Sesuai instruksi: di bagian kanan dekat dengan menu hamburger) */}
            <button
              type="button"
              aria-label="Cari Layanan"
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100/90 hover:bg-slate-200/80 active:scale-95 text-slate-700 transition-all shadow-2xs shrink-0 cursor-pointer"
              title="Cari Layanan"
            >
              <Search size={17} strokeWidth={2.2} />
            </button>

            {/* Tombol Hamburger di Ponsel */}
            <button
              type="button"
              aria-label="Buka Navigasi"
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100/80 hover:bg-slate-200/80 active:scale-95 text-slate-700 transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <Menu size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {/* --- DRAWER HAMBURGER MOBILE FULLSCREEN (MINIMALIS & ELEGAN) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={menuOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex flex-col overflow-hidden"
          >
            {/* Latar Belakang Subtle Ambient Light */}
            <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] bg-blue-100/40 blur-[100px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] bg-indigo-100/30 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Header Drawer */}
            <div className="w-full max-w-xl mx-auto px-5 py-3.5 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Solo Technopark"
                  width={68}
                  height={34}
                  className="h-7 w-auto object-contain"
                  priority
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Search size={14} />
                  <span>Cari</span>
                </button>
                <button
                  type="button"
                  aria-label="Tutup Menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* Body Drawer: Navigasi List dengan Custom Scrollbar Minimalis */}
            <div className="flex-1 w-full max-w-xl mx-auto overflow-y-auto custom-scrollbar px-5 py-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Menu Utama
                </p>

                <motion.nav
                  variants={navListVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="flex flex-col gap-3.5"
                >
                  {filteredNavGroups.map((group) => (
                    <div key={group.id} className="flex flex-col gap-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 pb-0.5">
                        {group.label}
                      </p>
                      {group.items.map((menu) => {
                        const isActive =
                          pathname === menu.path ||
                          (menu.path !== '/' && pathname?.startsWith(menu.path));
                        const IconComponent = menu.icon;

                        return (
                          <motion.div key={menu.path} variants={navItemVariants}>
                            <Link
                              href={menu.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center justify-between w-full py-2 px-3 rounded-xl transition-all duration-200 ${
                                isActive
                                  ? 'bg-blue-50/90 text-blue-700 font-extrabold border border-blue-200/60 shadow-2xs'
                                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isActive
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                                  }`}
                                >
                                  <IconComponent size={15} strokeWidth={2} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-semibold tracking-tight">
                                    {menu.name}
                                  </span>
                                  {menu.badge && (
                                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {menu.badge}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <ChevronRight
                                size={15}
                                className={`transition-transform ${
                                  isActive ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                                }`}
                              />
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </motion.nav>
              </div>

              {/* Area Bawah: Akses Pengguna dengan Safe-Area Inset Bottom Padding yang Aman */}
              <div className="mt-6 pt-4 border-t border-slate-100 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1 text-center">
                  Akses Pengguna
                </p>
                {renderMobileAuth()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
