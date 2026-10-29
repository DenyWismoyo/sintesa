// Lokasi file: src/components/auth/AuthSplitShell.tsx
'use client';

import React, { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  UserCheck,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import AuthFormCard from './AuthFormCard';

const ROLE_JOURNEY = [
  {
    id: 'umum',
    icon: UserCheck,
    title: '1. Pengguna Umum & Peserta Diklat',
    desc: 'Daftar gratis via Email atau Google untuk pesan E-Katalog, booking ruangan, & daftar pelatihan.',
    accent: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    id: 'alumni',
    icon: GraduationCap,
    title: '2. Klaim Alumni Terverifikasi (STP & RSKB)',
    desc: 'Masukkan Kode Registrasi lulusan saat daftar atau di Profil Saya untuk membuka Bursa Karir & Forum.',
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    id: 'mitra',
    icon: Briefcase,
    title: '3. Mitra Industri & Tenant Startup',
    desc: 'Akses langsung Dashboard Mitra (/mitra) & Kolaborasi Talenta menggunakan akun resmi perusahaan.',
    accent: 'text-teal-600 bg-teal-50 border-teal-100',
  },
  {
    id: 'admin',
    icon: ShieldCheck,
    title: '4. Manajemen & Staf Internal Kawasan',
    desc: 'Otorisasi RBAC otomatis mengarahkan Administrator & Staf ke ruang kerja operasional.',
    accent: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
];

export default function AuthSplitShell({ defaultTab = 'login' }: { defaultTab?: 'login' | 'register' }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex relative overflow-hidden text-slate-800">
      {/* Ornamen Latar */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-sky-100/60 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-50/80 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[90rem] mx-auto flex flex-col lg:flex-row relative z-10 min-h-screen">
        {/* PANEL KIRI: IDENTITAS & PANDUAN ALUR PERAN */}
        <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-20 py-12">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-white/80 px-3.5 py-2 rounded-full border border-slate-200/70 shadow-2xs transition-all">
                <ArrowLeft size={14} />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>

            <div className="mb-5">
              <Image src="/logo.png" alt="Solo Technopark" width={175} height={95} className="h-13 w-auto object-contain" priority />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/70 text-[11px] font-bold tracking-widest uppercase text-red-700 mb-5">
              <Sparkles size={14} className="text-red-600" />
              <span>Satu Akun Terintegrasi • Single Sign-On</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-slate-900 leading-tight mb-4">
              Gerbang Layanan & Ekosistem{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-slate-800">
                Solo Technopark
              </span>
            </h1>

            <p className="text-sm xl:text-base text-slate-500 mb-7 max-w-xl leading-relaxed font-medium">
              Dirancang agar mudah dinavigasi mulai dari pendaftaran pengguna umum, klaim lulusan diklat & RSKB Kota Surakarta, hingga kolaborasi mitra industri.
            </p>

            <div className="space-y-3 max-w-xl">
              {ROLE_JOURNEY.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className="flex items-start gap-3.5 p-3.5 bg-white/80 backdrop-blur-sm border border-slate-200/70 rounded-2xl shadow-2xs"
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${step.accent}`}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{step.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* PANEL KANAN: KARTU FORM MASUK / DAFTAR */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-md lg:hidden mb-3">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="w-full max-w-md h-96 bg-white/90 rounded-[2.25rem] flex items-center justify-center shadow-xl">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
              </div>
            }
          >
            <AuthFormCard defaultTab={defaultTab} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

