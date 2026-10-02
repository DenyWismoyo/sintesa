'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Search, Compass, BookOpen, Building2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm relative overflow-hidden">
        {/* Glow Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Compass size={32} />
        </div>

        <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
          Galat 404
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-4 mb-2 tracking-tight">
          Halaman Tidak Ditemukan
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          Halaman atau tautan yang Anda cari mungkin telah dipindahkan, berganti nama, atau sudah tidak tersedia lagi di platform Solo Technopark.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full h-11 px-6 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2">
              <Home size={16} /> Ke Beranda Utama
            </Button>
          </Link>
          <Link href="/search" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full h-11 px-6 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
              <Search size={16} /> Cari di Portal
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tautan Populer:</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Link href="/program-pelatihan" className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 transition-colors">
              <BookOpen size={13} className="text-amber-500" /> Pelatihan
            </Link>
            <Link href="/fasilitas" className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 transition-colors">
              <Building2 size={13} className="text-sky-500" /> Fasilitas
            </Link>
            <Link href="/e-katalog" className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 transition-colors">
              <Store size={13} className="text-emerald-500" /> E-Katalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
