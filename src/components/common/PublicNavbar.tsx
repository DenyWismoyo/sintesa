// Lokasi file: src/components/common/PublicNavbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
  Search
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { isInternalStaff, APP_ROLES } from '@/config/roles';
import GlobalSearchModal from './GlobalSearchModal';

export interface NavMenu {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: string;
}

export const PUBLIC_NAV_MENUS: NavMenu[] = [
  { name: 'Katalog', path: '/e-katalog', icon: ShoppingBag },
  { name: 'Fasilitas', path: '/fasilitas', icon: Building2 },
  { name: 'Pelatihan', path: '/program-pelatihan', icon: GraduationCap },
  { name: 'Ekosistem', path: '/ekosistem', icon: Users },
  { name: 'Artikel', path: '/artikel', icon: Newspaper },
  { name: 'Event', path: '/event', icon: CalendarDays },
  { name: 'Ruang Belajar', path: '/ruang-belajar', icon: BookOpen },
  { name: 'Tentang', path: '/tentang', icon: Info },
  { name: 'FAQ', path: '/faq', icon: HelpCircle },
];

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
        <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* SISI KIRI: HANYA LOGO RESMI (TULISAN TEKS DIHILANGKAN SESUAI INSTRUKSI) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

            {/* SEARCH TRIGGER DI HEADER (MOBILE & TABLET / DESKTOP RINGKAS) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 h-9 px-3 sm:px-3.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/60 text-slate-400 hover:text-slate-600 text-xs font-medium transition-all w-36 sm:w-56 md:w-64 cursor-pointer"
            >
              <Search size={14} className="text-slate-500 shrink-0" />
              <span className="truncate text-slate-500 text-[11px] sm:text-xs">
                Cari layanan kawasan...
              </span>
              <kbd className="ml-auto hidden md:inline-block px-1.5 py-0.2 text-[9px] font-bold bg-white text-slate-400 rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* SISI TENGAH: NAVIGASI DESKTOP */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-1.5 max-w-3xl">
            {PUBLIC_NAV_MENUS.map((menu) => {
              const isActive =
                pathname === menu.path || (menu.path !== '/' && pathname?.startsWith(menu.path));
              return (
                <Link
                  key={menu.path}
                  href={menu.path}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                    isActive
                      ? 'text-blue-700 bg-blue-50/90 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {menu.name}
                </Link>
              );
            })}
          </nav>

          {/* SISI KANAN: AUTH WIDGET DESKTOP */}
          <div className="hidden lg:flex items-center justify-end shrink-0 min-w-[130px]">
            {renderDesktopAuth()}
          </div>

          {/* TOMBOL HAMBURGER MOBILE (MINIMALIS & ELEGAN) */}
          <button
            type="button"
            aria-label="Buka Navigasi"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100/80 hover:bg-slate-200/80 active:scale-95 text-slate-700 transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <Menu size={18} strokeWidth={2.2} />
          </button>
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
                  className="flex flex-col gap-1"
                >
                  {PUBLIC_NAV_MENUS.map((menu, idx) => {
                    const isActive =
                      pathname === menu.path ||
                      (menu.path !== '/' && pathname?.startsWith(menu.path));
                    const IconComponent = menu.icon;

                    return (
                      <motion.div key={menu.path} variants={navItemVariants}>
                        <Link
                          href={menu.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between w-full py-2.5 px-3.5 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50/90 text-blue-700 font-extrabold border border-blue-200/60 shadow-2xs'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                              }`}
                            >
                              <IconComponent size={16} strokeWidth={2} />
                            </div>
                            <span className="text-sm font-semibold tracking-tight">
                              {menu.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-medium text-slate-300">
                              0{idx + 1}
                            </span>
                            <ChevronRight
                              size={15}
                              className={`transition-transform ${
                                isActive ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                              }`}
                            />
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
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
