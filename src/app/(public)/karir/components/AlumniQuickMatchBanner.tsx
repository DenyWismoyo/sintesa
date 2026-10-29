// src/app/(public)/karir/components/AlumniQuickMatchBanner.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Database,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AlumniQuickMatchBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-5 sm:p-8 shadow-xl border border-emerald-800/40">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bursa Eksklusif Alumni STP & Jejaring RSKB Surakarta</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-medium">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Kurasi Mitra Resmi & Sinkronisasi Otomatis Mingguan</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
            Jembatan Karir Resmi Antara <span className="text-emerald-300">Alumni Terverifikasi</span> & <span className="text-teal-300">Mitra Industri Kawasan</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Pastikan status <strong className="text-emerald-300">Open to Work</strong> dan portofolio proyek pada profil alumni Anda aktif agar Mitra Industri Resmi serta Startup Tenant Solo Technopark dapat mengirimkan undangan wawancara langsung.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Prioritas Rekrutmen Alumni STP & RSKB Kota Surakarta
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Evaluasi Kecocokan Skill Berbasis Clario AI
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
          <Link href="/alumni-portal" className="w-full">
            <Button className="w-full h-11 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Buka Forum Eksklusif Alumni & RSKB</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          <Link href="/profil" className="w-full">
            <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Perbarui Portofolio & Status Open to Work</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          <Link href="/program-pelatihan" className="w-full">
            <Button
              variant="outline"
              className="w-full h-11 bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Tingkatkan Skill di Katalog Diklat</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
