// src/components/career/CareerExclusiveGate.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  UserCheck,
  Building2,
  ExternalLink,
  HelpCircle,
  Home,
  Briefcase,
  Layers,
  Award,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_LABELS, APP_ROLES } from '@/config/roles';

interface CareerExclusiveGateProps {
  jobTitle?: string;
  companyName?: string;
}

export default function CareerExclusiveGate({ jobTitle, companyName }: CareerExclusiveGateProps) {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const isRoleUserBiasa = Boolean(user && role && role !== APP_ROLES.ALUMNI);

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 sm:px-6">
      {/* Container Utama dengan Efek Ambient & Glassmorphism Premium */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-white via-slate-50/60 to-emerald-50/30 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Glow Ambient Lights */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Header Kunci & Badge */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-8">
          <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-xl shadow-emerald-600/25 mb-5 ring-4 ring-emerald-100">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse stroke-[2.2]" />
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-[10px] shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fitur Eksklusif Talenta & Alumni STP</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Akses Eksklusif Bursa Karir & Penyaluran Kerja
          </h1>

          {jobTitle ? (
            <p className="mt-3 text-sm sm:text-base font-semibold text-slate-700 bg-white/80 border border-slate-200/80 px-4 py-2 rounded-xl">
              Lowongan posisi <span className="text-emerald-700 font-bold">{jobTitle}</span>
              {companyName ? ` di ${companyName}` : ''} dilindungi hak akses khusus alumni.
            </p>
          ) : (
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Database lowongan kerja industri pilihan dan algoritma pencocokan kompetensi 
              <span className="font-bold text-slate-900"> AI Career Match</span> dirancang khusus sebagai nilai tambah bagi 
              <span className="font-bold text-emerald-700"> Alumni Pelatihan Solo Technopark</span> serta tim manajemen/administrator kawasan.
            </p>
          )}
        </div>

        {/* 3 Kartu Nilai Unggulan (Why It Has Value) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
              Kurasi Industri Spesifik
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ratusan lowongan fisik & digital (Underwater Welding, Welder 6G, CNC 5-Axis, AI, Cyber Security) yang terverifikasi resmi.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
              AI Match Silabus Vokasi
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pencocokan presisi antara silabus pelatihan yang telah ditempuh alumni dengan kriteria spesifik yang dicari perusahaan mitra.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
              Jalur Prioritas Rekrutmen
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Perusahaan mitra kawasan, BUMN, dan korporasi internasional memprioritaskan sertifikasi kompetensi alumni binaan STP.
            </p>
          </div>
        </div>

        {/* Panel Interaktif Berdasarkan Status Pengguna */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Memverifikasi hak akses pengguna...</p>
            </div>
          ) : isRoleUserBiasa ? (
            /* Kasus A: User Sudah Login tetapi bukan Alumni & bukan Admin */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-start gap-3.5 max-w-lg">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-amber-800">
                    Akun Terdaftar: {ROLE_LABELS[role || ''] || 'Pengguna Umum'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Halo <span className="font-semibold text-slate-900">{user?.displayName || user?.email}</span>, akun Anda saat ini belum memiliki status terverifikasi sebagai Alumni Pelatihan Solo Technopark.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Jika Anda sudah pernah menyelesaikan pelatihan di STP, silakan ajukan verifikasi data alumni.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
                <Link
                  href="/program-pelatihan"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Daftar Pelatihan STP</span>
                </Link>

                <a
                  href="https://wa.me/6281226065555?text=Halo%20Admin%20Solo%20Technopark,%20saya%20ingin%20verifikasi%20status%20alumni%20untuk%20akses%20Bursa%20Karir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>Klaim Status Alumni</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>

                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Beranda</span>
                </button>
              </div>
            </div>
          ) : (
            /* Kasus B: User Belum Login Sama Sekali */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-start gap-3.5 max-w-md">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    Sudah Menjadi Alumni Pelatihan STP?
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Silakan masuk menggunakan akun alumni atau kredensial staf administrator untuk membuka katalog lengkap dan fitur lamaran.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
                <Link
                  href="/login?redirect=/karir"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Masuk Akun Alumni / Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/program-pelatihan"
                  className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Daftar Pelatihan STP</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Catatan Hak Istimewa */}
        <div className="mt-6 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Kawasan Sains dan Teknologi — Solo Technopark</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Eksklusivitas penempatan karir mitra industri terverifikasi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
