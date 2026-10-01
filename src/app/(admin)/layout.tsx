"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { hasAccess, isInternalStaff, ROLE_LABELS } from '@/config/roles';
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
  Hexagon,
  Settings,
  ShieldAlert,
  Video,
  Home,
  Newspaper
} from 'lucide-react';

// --- KONFIGURASI MENU ---
const MENU_GROUPS = [
  {
    group: 'Utama',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    group: 'Operasional',
    items: [
      { name: 'Manajemen Aset', href: '/aset', icon: Building2 },
      { name: 'Booking & Jadwal', href: '/booking', icon: CalendarDays },
    ]
  },
  {
    group: 'Komersial',
    items: [
      { name: 'Katalog Produk', href: '/katalog', icon: ShoppingBag },
      { name: 'Billing & Invoice', href: '/billing', icon: Receipt },
    ]
  },
  {
    group: 'Ekosistem',
    items: [
      { name: 'Inkubasi Tenant', href: '/tenant', icon: Rocket },
      { name: 'Pelatihan', href: '/pelatihan', icon: GraduationCap },
      { name: 'Manajemen Event', href: '/manajemen-event', icon: Ticket },
      { name: 'Artikel & Warta', href: '/manajemen-artikel', icon: Newspaper },
      { name: 'Manajemen KRENOVA', href: '/manajemen-krenova', icon: Video },
    ]
  },
  {
    group: 'Sistem',
    items: [
      { name: 'Pusat Bantuan', href: '/manajemen-faq', icon: HelpCircle },
      { name: 'Pengaturan Sistem', href: '/pengaturan', icon: Settings },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, loading } = useAuth(); // AMBIL DATA ROLE USER
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fungsi untuk mengecek apakah menu sedang aktif
  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  // Komponen Navigasi Render (Memfilter menu berdasarkan Hak Akses)
  const NavigationItems = ({ isMobile = false }: { isMobile?: boolean }) => {
    return (
      <div className={`flex flex-col ${isMobile ? 'gap-4 p-4' : 'gap-2 items-center w-full'}`}>
        {MENU_GROUPS.map((group, groupIndex) => {
          
          // FILTER: Hanya ambil item menu yang diizinkan untuk Role saat ini
          const allowedItems = group.items.filter(item => hasAccess(role, item.href));
          
          // Jika tidak ada item di grup ini yang boleh diakses, sembunyikan grupnya
          if (allowedItems.length === 0) return null;

          return (
            <React.Fragment key={group.group}>
              {allowedItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                    className={`group relative flex items-center rounded-xl transition-all duration-200
                      ${isMobile ? 'px-4 py-3 w-full gap-4' : 'justify-center w-11 h-11'} 
                      ${active 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    {active && !isMobile && (
                      <span className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full" />
                    )}

                    <item.icon className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} ${active && !isMobile && 'animate-in zoom-in duration-300'}`} />
                    
                    {isMobile && (
                      <span className={`font-medium ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                        {item.name}
                      </span>
                    )}

                    {!isMobile && (
                      <div className="absolute left-14 hidden group-hover:flex items-center z-50 animate-in slide-in-from-left-2 duration-200">
                        <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-slate-800" />
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 rounded-md shadow-lg whitespace-nowrap">
                          {item.name}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
              
              {groupIndex < MENU_GROUPS.length - 1 && (
                <hr className={`${isMobile ? 'border-slate-100 my-1' : 'w-6 border-slate-200 my-1'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // --- LOGIKA PROTEKSI SIDEBAR & LAYOUT (DISEMPURNAKAN) ---
  const isLmsRoute = pathname.startsWith('/lms');
  
  // Daftar URL publik yang BEBAS diakses siapa saja (tanpa butuh akses menu admin)
  // Sesuaikan array ini jika Anda punya halaman login/landing page di root ('/')
  const isPublicRoute = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');

  if (loading) {
    return <div className="min-h-screen bg-slate-50"></div>; 
  }

  // 1. BYPASS UNTUK RUTE PUBLIK/LMS (Layout dibiarkan full-width, boleh diakses)
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
  // hasAccess() akan membaca konfigurasi dari roles.ts.
  // Jika Role = 'public' dan URL = '/billing', fungsi ini pasti mereturn FALSE.
  const isPathAllowed = hasAccess(role, pathname);

  // 3. BLOKIR MUTLAK: Jika rute tidak diizinkan!
  // Kita JANGAN MERENDER {children} sama sekali. Hentikan di sini.
  if (!isPathAllowed) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
         <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm">
            <ShieldAlert className="w-10 h-10" />
         </div>
         <h2 className="text-3xl font-black text-slate-800 tracking-tight">Akses Terlarang</h2>
         <p className="text-slate-500 mt-3 font-medium max-w-md mx-auto">
           Akun Anda dengan hak akses <b className="text-blue-600">{role ? ROLE_LABELS[role] || role : 'Pengguna Umum'}</b> tidak memiliki kewenangan untuk mengakses menu <span className="font-mono text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">{pathname}</span>.
         </p>
         <Link href={isInternalStaff(role) ? "/dashboard" : "/"} className="mt-8 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
            {isInternalStaff(role) ? "Kembali ke Dashboard" : "Kembali ke Beranda"}
         </Link>
      </div>
    );
  }

  // 4. RENDER LAYOUT ADMIN (Hanya untuk rute yang diizinkan dan memiliki Sidebar)
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      
      {/* 1. SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-20 bg-white border-r border-slate-200 relative z-50 flex-shrink-0">
        <div className="h-16 flex items-center justify-center border-b border-slate-100">
          <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center p-0.5 hover:scale-105 transition-transform" title="Beranda Katalog STP">
             <Image src="/icon-192x192.png" alt="Solo Technopark" width={40} height={40} className="w-full h-full object-contain rounded-xl shadow-xs" priority />
          </Link>
        </div>

        <nav className="flex-1 py-4 overflow-visible">
          <NavigationItems />
        </nav>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-4 items-center">
          {/* TOMBOL HOME (TAMBAHAN BARU) */}
          <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors group relative">
            <Home className="w-5 h-5" />
            <div className="absolute left-14 hidden group-hover:flex items-center z-50 animate-in slide-in-from-left-2 duration-200">
              <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-slate-800" />
              <span className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 rounded-md shadow-lg whitespace-nowrap">
                Beranda Utama
              </span>
            </div>
          </Link>

          <button className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold hover:bg-slate-200 transition-colors relative group" title="Profil">
            {role?.substring(0, 2).toUpperCase()}
            {/* Tooltip Role Indicator */}
            <div className="absolute left-14 hidden group-hover:flex items-center z-50 animate-in slide-in-from-left-2 duration-200">
              <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-blue-600" />
              <span className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md shadow-lg whitespace-nowrap">
                {ROLE_LABELS[role || '']}
              </span>
            </div>
          </button>
          
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors group relative">
            <LogOut className="w-5 h-5" />
            <div className="absolute left-14 hidden group-hover:flex items-center z-50 animate-in slide-in-from-left-2 duration-200">
              <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-red-600" />
              <span className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md shadow-lg whitespace-nowrap">
                Keluar
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* 2. AREA UTAMA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
             <Link href="/" title="Beranda Katalog STP">
               <Image src="/icon-192x192.png" alt="Solo Technopark" width={32} height={32} className="w-8 h-8 object-contain rounded-lg shadow-xs" priority />
             </Link>
             <div className="flex flex-col">
               <span className="font-bold text-slate-800 leading-tight">Admin Panel</span>
               <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{ROLE_LABELS[role || '']}</span>
             </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto relative scroll-smooth">
          <div className="min-h-full p-6 md:p-8">
             {/* Karena pengecekan di tahap atas sudah selesai, komponen halaman langsung diload di sini secara aman */}
             {children}
          </div>
        </main>
      </div>

      {/* 3. SIDEBAR MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4">
              <span className="font-bold text-slate-800">Menu Navigasi</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <NavigationItems isMobile={true} />
            </div>

            {/* AREA FOOTER MOBILE DENGAN TOMBOL HOME BARU */}
            <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
               <Link href="/" className="flex items-center gap-3 w-full px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  <Home className="w-5 h-5" />
                  Kembali ke Beranda
               </Link>
               <button className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
                  <LogOut className="w-5 h-5" />
                  Keluar dari Sistem
               </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}