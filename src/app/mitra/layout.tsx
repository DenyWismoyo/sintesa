// src/app/mitra/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { authService } from '@/services/auth.service';
import { hasAccess } from '@/config/roles';
import { useMyPartnerProfile } from '@/hooks/usePartners';

export default function MitraLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, partnerId, loading: authLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const canEnter = hasAccess(role, '/mitra');
  const { data: partnerProfile, isLoading: profileLoading } = useMyPartnerProfile(
    user?.uid,
    partnerId
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!canEnter) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-sm mb-4">
          <Lock className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Portal Khusus Mitra Resmi Industri</h2>
        <p className="text-xs text-slate-500 max-w-md mt-2 mb-6 leading-relaxed">
          Halaman ini diperuntukkan bagi Mitra Industri & Instansi Resmi yang telah terverifikasi oleh Solo Technopark. Ajukan kerjasama rekrutmen talenta melalui halaman Kemitraan.
        </p>
        <div className="flex gap-3">
          <Link
            href="/kemitraan"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            Ajukan Kemitraan Baru
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200/80 flex-col h-screen sticky top-0 shrink-0">
        <div className="p-7 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 px-2 bg-white rounded-xl flex items-center justify-center border border-slate-200">
              <Image
                src="/logo.png"
                alt="Solo Technopark"
                width={70}
                height={38}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="font-black text-slate-900 tracking-tight leading-none text-sm">
                PORTAL MITRA STP
              </h2>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                STP × RSKB Surakarta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">
                {partnerProfile?.companyName || user?.displayName || 'Mitra Industri STP'}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Mitra Terverifikasi
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <Link
            href="/mitra/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              pathname.startsWith('/mitra/dashboard')
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-600" />
            <span>Dashboard Rekrutmen & Talenta</span>
          </Link>
        </nav>

        <div className="p-5 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Portal Mitra</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
          <span className="font-black text-sm text-slate-900">Portal Mitra STP × RSKB</span>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg border border-slate-200 text-slate-600"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2">
            <Link
              href="/mitra/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold"
            >
              Dashboard Rekrutmen & Talenta
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold"
            >
              Keluar Portal Mitra
            </button>
          </div>
        )}

        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

