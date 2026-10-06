// src/app/(public)/karir/components/AlumniQuickMatchBanner.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AlumniQuickMatchBanner() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/jobs/sync?force=true', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || 'Database lowongan berhasil disinkronkan!');
        // Refresh halaman agar data terbaru langsung tampil
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast.error(json.message || 'Gagal menyinkronkan database lowongan.');
      }
    } catch (err: any) {
      toast.error('Gagal menghubungi endpoint sinkronisasi: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

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
              <span>Penyaluran Kerja Terverifikasi Solo Technopark</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-medium">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Tersimpan di Cloud Firestore • Update Seminggu Sekali</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
            Jembatan Karir Resmi Antara <span className="text-emerald-300">Alumni Pelatihan</span> & <span className="text-teal-300">Mitra Industri Kawasan</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Seluruh data lowongan disimpan persisten di Cloud Firestore dan diperbarui otomatis setiap seminggu sekali dari agregator industri (RapidAPI JSearch) serta dikurasi khusus agar selaras dengan kompetensi silabus pelatihan Solo Technopark.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Prioritas Wawancara untuk Pemegang Sertifikat STP
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Evaluasi Kecocokan Skill Berbasis Clario AI
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
          <Button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan Database...' : 'Sinkronkan Database Sekarang'}</span>
          </Button>

          <Link href="/program-pelatihan" className="w-full">
            <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Ikuti Pelatihan Baru di STP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          <Link href="/ekosistem" className="w-full">
            <Button
              variant="outline"
              className="w-full h-11 bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl"
            >
              <Building2 className="w-4 h-4 mr-2" />
              <span>Lihat Mitra Industri Kawasan</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
