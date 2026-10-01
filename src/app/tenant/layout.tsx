'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, UserCircle, Package, TrendingUp, 
  BookOpen, LifeBuoy, Receipt, LogOut, Menu, X, 
  ShieldCheck, Lock
} from 'lucide-react';

import { useTenants } from '@/hooks/useTenants'; 
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const MENU_ITEMS = [
  { name: 'Dashboard', path: '/tenant/dashboard', icon: LayoutDashboard },
  { name: 'Profil Publik', path: '/tenant/profile', icon: UserCircle },
  { name: 'Katalog Produk', path: '/tenant/products', icon: Package },
  { name: 'Traction & Tim', path: '/tenant/traction', icon: TrendingUp },
  { name: 'Ruang Inkubasi', path: '/tenant/incubation', icon: BookOpen },
  { name: 'Helpdesk', path: '/tenant/tickets', icon: LifeBuoy },
  { name: 'Keuangan & Tagihan', path: '/tenant/billing', icon: Receipt },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Pantau status login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else router.push('/login');
    });
    return () => unsubscribe();
  }, [router]);

  // Ambil profil tenant
  const { useTenantProfile } = useTenants();
  const { data: tenantProfile, isLoading } = useTenantProfile(userId);

  // --- LOGIC AKSES TERBATAS (PRA-INKUBASI) ---
  const isPreIncubation = tenantProfile?.status === 'Menunggu Review';
  
  // Menu yang diizinkan untuk Pra-Inkubasi
  const allowedPreIncubationPaths = ['/tenant/dashboard', '/tenant/profile'];

  // Filter menu sidebar
  const visibleMenuItems = MENU_ITEMS.filter(item => {
    if (isPreIncubation) {
      return allowedPreIncubationPaths.includes(item.path);
    }
    return true; // Tenant Aktif melihat semua menu
  });

  // Pengecekan Route saat ini
  const isRouteRestricted = isPreIncubation && !allowedPreIncubationPaths.includes(pathname);

  const handleLogout = async () => {
    await auth.signOut();
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  if (isLoading || !tenantProfile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans relative overflow-hidden">
      
      {/* Background Blobs for whole tenant area (Sangat Halus) */}
      <div className="fixed top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-sky-100/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-50/40 rounded-full blur-[120px] pointer-events-none mix-blend-multiply z-0" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.01] pointer-events-none z-0" />

      {/* --- SIDEBAR DEKTOP --- */}
      <aside className="hidden md:flex w-72 bg-white/80 backdrop-blur-2xl border-r border-slate-200/60 flex-col h-screen sticky top-0 shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 px-2 bg-white rounded-xl flex items-center justify-center shadow-xs border border-slate-200/80">
              <Image src="/logo.png" alt="Solo Technopark" width={70} height={38} className="h-8 w-auto object-contain" priority />
            </div>
            <div>
              <h2 className="font-black text-slate-900 tracking-tight leading-none text-base">KATALOG STP</h2>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Tenant Workspace</p>
            </div>
          </div>

          {/* Profil Singkat Sidebar - Desain Lebih Menyatu */}
          <div className="group flex items-center gap-4 px-2 mb-2 transition-all">
             <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-all">
               {tenantProfile.logoUrl ? <img src={tenantProfile.logoUrl} className="w-full h-full object-contain p-1.5" /> : <UserCircle className="text-slate-300 w-6 h-6" />}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">{tenantProfile.name}</p>
               {isPreIncubation ? (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 inline-block uppercase tracking-wider">Menunggu Review</span>
               ) : (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block uppercase tracking-wider flex items-center gap-1 w-max"><ShieldCheck size={10}/> Tenant Aktif</span>
               )}
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {isPreIncubation && (
             <p className="text-[10px] font-black text-slate-400 px-4 pb-2 uppercase tracking-widest border-b border-slate-100 mb-4 mt-2">Akses Terbatas</p>
          )}

          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group ${isActive ? 'text-blue-700 bg-gradient-to-r from-sky-50/80 to-transparent' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-500 rounded-r-full" />}
                <Icon size={18} className={`${isActive ? 'text-sky-500' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                {item.name}
              </Link>
            );
          })}

          {isPreIncubation && (
             <div className="px-5 py-5 mt-8 mx-2 bg-slate-50/80 border border-slate-100 rounded-[1.5rem] flex items-start gap-3 shadow-sm">
                <Lock size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">Menu operasional lainnya akan terbuka otomatis setelah status Anda disetujui.</p>
             </div>
          )}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-3.5 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100">
            <LogOut size={16} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10 custom-scrollbar">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
           <div className="flex items-center gap-3">
             <div className="h-8 px-1.5 bg-white rounded-lg flex items-center justify-center border border-slate-200">
               <Image src="/logo.png" alt="Solo Technopark" width={60} height={32} className="h-6 w-auto object-contain" priority />
             </div>
             <span className="font-black text-slate-900 tracking-tight">Katalog STP</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
             {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-20 bg-white/95 backdrop-blur-xl pt-20 px-6">
            <nav className="space-y-2">
               {visibleMenuItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold transition-all ${isActive ? 'bg-sky-50 text-blue-700 border border-sky-100' : 'text-slate-500 bg-slate-50 border border-transparent'}`}>
                      <Icon size={20} className={isActive ? 'text-sky-500' : 'text-slate-400'} />
                      {item.name}
                    </Link>
                  );
                })}
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-4 text-base font-bold text-red-600 bg-red-50 rounded-2xl transition-all mt-4 border border-red-100">
                  <LogOut size={20} /> Keluar Sistem
                </button>
            </nav>
          </div>
        )}

        {/* --- GUARD RENDERER --- */}
        <div className="flex-1 w-full max-w-[1920px] mx-auto p-4 md:p-8 lg:p-12">
          {isRouteRestricted ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
              <div className="relative mb-8">
                 <div className="absolute inset-0 bg-sky-200 rounded-full blur-2xl opacity-40"></div>
                 <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-xl relative z-10">
                    <Lock className="w-10 h-10 text-sky-400" />
                 </div>
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Akses Terkunci</h2>
              <p className="text-slate-500 max-w-md font-medium leading-relaxed mb-8">
                Maaf, menu <strong>{pathname}</strong> belum dapat diakses. Status pengajuan Anda saat ini masih dalam tahap "Menunggu Review" oleh kurator kami.
              </p>
              <Link href="/tenant/dashboard" className="px-8 py-4 bg-white border border-slate-200 text-blue-700 text-sm font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                Kembali ke Dashboard
              </Link>
            </div>
          ) : (
            // Render halaman yang diizinkan
            children 
          )}
        </div>
      </main>

    </div>
  );
}