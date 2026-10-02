"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
  Newspaper,
  Share2
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
      { name: 'Program Afiliasi', href: '/afiliasi', icon: Share2 },
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
  const router = useRouter();
  const { role, loading } = useAuth(); // AMBIL DATA ROLE USER
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fungsi untuk mengecek apakah menu sedang aktif
  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  const currentMenu = MENU_GROUPS.flatMap(g => g.items).find(item => isActive(item.href));

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem admin?")) {
      try {
        await signOut(auth);
        router.push('/login');
      } catch (err) {
        console.error("Gagal logout:", err);
      }
    }
  };

  // Komponen Navigasi Render (Memfilter menu berdasarkan Hak Akses)
  // Komponen Navigasi Render (Memfilter menu berdasarkan Hak Akses)
  const NavigationItems = ({ isMobile = false }: { isMobile?: boolean }) => {
    return (
      <div className={`flex flex-col ${isMobile ? 'gap-2.5 p-3' : 'gap-2.5 p-3 w-full'}`}>
        {MENU_GROUPS.map((group) => {
          // FILTER: Hanya ambil item menu yang diizinkan untuk Role saat ini
          const allowedItems = group.items.filter(item => hasAccess(role, item.href));
          
          if (allowedItems.length === 0) return null;

          return (
            <div key={group.group} className="flex flex-col gap-0.5">
              <span className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                {group.group}
              </span>
              {allowedItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                    className={`group relative flex items-center rounded-lg transition-all duration-150
                      px-2.5 py-1.5 gap-2.5 text-xs font-medium
                      ${active 
                        ? 'bg-blue-50/90 text-blue-700 font-semibold shadow-2xs' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    <span className="truncate">
                      {item.name}
                    </span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
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
         <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border-4 border-white shadow-sm">
            <ShieldAlert className="w-8 h-8" />
         </div>
         <h2 className="text-2xl font-black text-slate-800 tracking-tight">Akses Terlarang</h2>
         <p className="text-slate-500 mt-2 text-xs sm:text-sm font-medium max-w-md mx-auto">
           Akun Anda dengan hak akses <b className="text-blue-600">{role ? ROLE_LABELS[role] || role : 'Pengguna Umum'}</b> tidak memiliki kewenangan untuk mengakses menu <span className="font-mono text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">{pathname}</span>.
         </p>
         <Link href={isInternalStaff(role) ? "/dashboard" : "/"} className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
            {isInternalStaff(role) ? "Kembali ke Dashboard" : "Kembali ke Beranda"}
         </Link>
      </div>
    );
  }

  // 4. RENDER LAYOUT ADMIN (Sidebar Ramping Modern & Mobile Drawer Compact)
  return (
    <div className="flex h-screen w-full bg-slate-50/70 overflow-hidden text-slate-900 font-sans">
      
      {/* 1. SIDEBAR DESKTOP MINIMALIS ELEGAN */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 bg-white border-r border-slate-200/80 shrink-0 z-30 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group" title="KST Solo Technopark">
             <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
               <Image src="/icon-192x192.png" alt="Solo Technopark" width={28} height={28} className="object-contain" priority />
             </div>
             <div className="flex flex-col">
               <span className="font-black text-xs text-slate-900 leading-tight tracking-tight">Solo Technopark</span>
               <span className="text-[10px] text-slate-400 font-semibold tracking-wide">Admin Workspace</span>
             </div>
          </Link>
        </div>

        {/* Navigation Items with subtle scroll */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-1">
          <NavigationItems />
        </nav>

        {/* Footer User & Actions Card */}
        <div className="p-2.5 border-t border-slate-150 bg-slate-50/60 shrink-0">
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
              <Link 
                href="/" 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Beranda Utama"
              >
                <Home className="w-3.5 h-3.5" />
              </Link>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. AREA UTAMA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Mobile Top Header */}
        <header className="md:hidden h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-3.5 z-20 shrink-0 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
             <Link href="/" title="Beranda Katalog STP" className="shrink-0">
               <Image src="/icon-192x192.png" alt="Solo Technopark" width={28} height={28} className="w-7 h-7 object-contain rounded-md" priority />
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
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors active:scale-95"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-slate-50/50">
          <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
             {children}
          </div>
        </main>
      </div>

      {/* 3. MOBILE DRAWER MINIMALIS */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Body - compact width 270px */}
          <div className="relative flex-1 flex flex-col max-w-[270px] w-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <Image src="/icon-192x192.png" alt="Solo Technopark" width={24} height={24} className="w-6 h-6 object-contain" />
                <span className="font-bold text-slate-800 text-xs">Navigasi Admin</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Menu List */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <NavigationItems isMobile={true} />
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
                 <Link 
                   href="/" 
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                   title="Beranda"
                 >
                   <Home className="w-3.5 h-3.5" />
                 </Link>
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

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}