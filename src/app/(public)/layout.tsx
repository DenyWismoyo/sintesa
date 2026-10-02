// Lokasi file: src/app/(public)/layout.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ArrowUpRight, LogOut, User, ShieldCheck, Building2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

// --- IMPORT KONFIGURASI ROLE ---
import { isInternalStaff, APP_ROLES } from '@/config/roles';
import { AffiliateTracker } from '@/components/common/AffiliateTracker';
import { FloatingAIButton } from '@/components/common/FloatingAIButton';
import { Suspense } from 'react';

const NAV_MENUS = [
  //{ name: 'Beranda', path: '/portal' },
  //{ name: 'AI Explorer', path: '/explore' }, 
  { name: 'Katalog', path: '/e-katalog' },
  { name: 'Fasilitas', path: '/fasilitas' },
  { name: 'Pelatihan', path: '/program-pelatihan' },
  { name: 'Ekosistem', path: '/ekosistem' },
  { name: 'Artikel', path: '/artikel' },
  { name: 'Event', path: '/event' },
  { name: 'Ruang Belajar', path: '/ruang-belajar' }, 
  { name: 'Tentang', path: '/tentang' },
  { name: 'FAQ', path: '/faq' },
];

// --- VARIANT ANIMASI FUTURISTIK ---
const menuOverlay: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 1.05, transition: { duration: 0.4 } }
};

const staggerItems: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const { user, role, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setIsMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Hapus cookie middleware saat logout
      document.cookie = "userRole=; path=/; max-age=0;";
      toast.success("Berhasil Keluar", { description: "Sesi Anda telah diakhiri." });
      router.push('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      toast.error("Gagal Logout", { description: "Terjadi kesalahan saat mengakhiri sesi." });
    }
  };

  // --- LOGIKA SMART TOMBOL AUTHENTIKASI ---
  const renderAuthButton = (isMobile: boolean = false) => {
    if (loading) return <div className={`bg-slate-100 animate-pulse rounded-full ${isMobile ? 'h-12 w-full mt-6' : 'w-28 h-9'}`}></div>;

    // 1. Jika belum login sama sekali
    if (!user) {
      return (
        <Link 
          href="/login" 
          onClick={() => setIsMobileMenuOpen(false)} 
          className={`${isMobile ? 'mt-6 w-full h-12 text-sm' : 'px-5 py-2 h-9 text-xs xl:text-sm'} bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-full font-bold shadow-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5`}
        >
          Masuk Portal <ArrowUpRight size={isMobile ? 16 : 14} className="opacity-70" />
        </Link>
      );
    }

    // 2. Jika user adalah Staff Internal (Admin, Kasir, dll)
    if (isInternalStaff(role)) {
      return (
        <Link 
          href="/dashboard" 
          onClick={() => setIsMobileMenuOpen(false)} 
          className={`${isMobile ? 'mt-6 w-full h-12 text-sm' : 'px-4 py-2 h-9 text-xs xl:text-sm'} bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white rounded-full font-bold shadow-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5`}
        >
          <ShieldCheck size={16} /> Dashboard Admin
        </Link>
      );
    }

    // 3. Jika user adalah Tenant
    if (role === APP_ROLES.TENANT) {
      return (
        <Link 
          href="/tenant/dashboard" 
          onClick={() => setIsMobileMenuOpen(false)} 
          className={`${isMobile ? 'mt-6 w-full h-12 text-sm' : 'px-4 py-2 h-9 text-xs xl:text-sm'} bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white rounded-full font-bold shadow-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5`}
        >
          <Building2 size={16} /> Dashboard Tenant
        </Link>
      );
    }

    // 4. Jika user adalah Pengguna Publik Biasa
    return (
      <div className={`flex ${isMobile ? 'flex-col gap-2.5 w-full mt-6' : 'items-center gap-2'}`}>
        <Link 
          href="/portal" 
          onClick={() => setIsMobileMenuOpen(false)} 
          className={`${isMobile ? 'w-full h-12 text-sm bg-blue-50 text-blue-700 border-blue-200' : 'px-4 py-2 h-9 text-xs xl:text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200/80 shadow-2xs'} border rounded-full font-bold transition-all flex items-center justify-center gap-1.5`}
        >
          <Sparkles size={14} className="text-blue-600" /> Portal Saya
        </Link>
        <Link 
          href="/profil" 
          onClick={() => setIsMobileMenuOpen(false)} 
          className={`${isMobile ? 'w-full h-12 text-sm bg-slate-50 border-slate-200 text-slate-700' : 'px-4 py-2 h-9 text-xs xl:text-sm bg-white/80 border-slate-200/60 text-slate-700 hover:bg-slate-50 shadow-sm'} border rounded-full font-bold transition-all flex items-center justify-center gap-1.5`}
        >
          <User size={15} /> Profil
        </Link>
        <button 
          onClick={handleLogout} 
          className={`${isMobile ? 'w-full h-12 text-sm bg-rose-50 text-rose-600 border-rose-100' : 'p-2 h-9 w-9 bg-white border-slate-200/60 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 shadow-sm'} border rounded-full font-bold transition-all flex items-center justify-center gap-2`}
          title="Keluar"
        >
          <LogOut size={16} /> {isMobile ? "Keluar Akun" : ""}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- HEADER DESKTOP --- */}
      <header className={`public-navbar ${scrolled ? 'public-navbar-scrolled' : ''}`}>
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 h-12 flex items-center justify-between gap-6 lg:gap-8">
          
          {/* LOGO RESMI SOLO TECHNOPARK */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="h-8 flex items-center justify-center shrink-0 relative">
              <Image 
                src="/logo.png" 
                alt="Solo Technopark" 
                width={72} 
                height={38} 
                className="h-8 w-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                priority 
              />
            </div>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight leading-none text-slate-900 group-hover:text-red-600 transition-colors">KATALOG</h1>
                <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-1.5 py-0.5 rounded">STP</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5 text-slate-400">solotechnopark.id</p>
            </div>
          </Link>

          {/* NAVIGASI DESKTOP */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-1.5">
            {NAV_MENUS.map((menu) => {
              const isActive = pathname === menu.path || (menu.path !== '/' && pathname?.startsWith(menu.path));
              
              return (
                <Link 
                  key={menu.path} 
                  href={menu.path} 
                  className={`public-nav-link ${isActive ? 'public-nav-link-active' : ''}`}
                >
                  <span>{menu.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* AUTH WIDGET */}
          <div className="hidden lg:flex items-center justify-end shrink-0 min-w-[160px]">
            {renderAuthButton(false)}
          </div>

          {/* MOBILE HAMBURGER */}
          <button 
            type="button"
            aria-label="Buka Menu"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-xs text-slate-700 z-50 shrink-0 hover:bg-slate-50 transition-colors" 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={18} />
          </button>
        </div>
      </header>
      {/* --- MENU MOBILE FULLSCREEN --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            variants={menuOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-3xl overflow-y-auto overflow-x-hidden"
          >
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-300/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-300/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="min-h-screen flex flex-col px-6 py-8 md:px-12 md:py-10 relative z-10 w-full max-w-2xl mx-auto">
              
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="h-10 flex items-center justify-center relative">
                     <Image 
                       src="/logo.png" 
                       alt="Solo Technopark" 
                       width={80} 
                       height={44} 
                       className="h-9 w-auto object-contain drop-shadow-sm" 
                       priority 
                     />
                   </div>
                   <div className="h-6 w-px bg-slate-200" />
                   <div>
                     <div className="flex items-center gap-1.5">
                       <h1 className="text-lg font-black tracking-tight leading-none text-slate-900">KATALOG</h1>
                       <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded">STP</span>
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">solotechnopark.id</p>
                   </div>
                 </div>
                 
                 <button 
                   onClick={() => setIsMobileMenuOpen(false)} 
                   className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                 >
                   <X size={20} />
                 </button>
              </div>

              <motion.nav variants={staggerItems} initial="hidden" animate="visible" exit="hidden" className="flex flex-col gap-1.5 flex-1 justify-center">
                {NAV_MENUS.map((menu, idx) => {
                  const isActive = pathname === menu.path || (menu.path !== '/' && pathname?.startsWith(menu.path));
                  
                  return (
                    <motion.div key={menu.path} variants={slideUp}>
                      <Link 
                        href={menu.path} 
                        className={`group flex items-center justify-between w-full py-2.5 px-4 rounded-xl transition-all duration-300 ${isActive ? 'bg-slate-50 border border-slate-100' : 'hover:bg-slate-50/50 hover:translate-x-2'}`}
                      >
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] md:text-xs font-bold font-mono text-slate-300 w-5">0{idx + 1}</span>
                           <span className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">
                             {menu.name}
                           </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>

              <motion.div variants={slideUp} className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Akses Pengguna</p>
                {renderAuthButton(true)}
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT AREA DENGAN PADDING ERGONOMIS MOBILE TANPA OVERLAP DENGAN FIXED NAVBAR --- */}
      <main className="flex-1 w-full flex flex-col relative z-10 pt-[5.25rem] sm:pt-24 pb-8 sm:pb-12">
        <Suspense fallback={null}><AffiliateTracker /></Suspense>
        {children}
      </main>

      {/* Floating Krenova AI Assistant Button */}
      <FloatingAIButton />

    </div>
  );
}