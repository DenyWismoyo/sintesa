// src/app/(public)/karir/components/JobFilterToolbar.tsx
'use client';

import React from 'react';
import {
  RotateCcw,
  GraduationCap,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobFilterToolbarProps {
  workType: string;
  setWorkType: (val: string) => void;
  workSetup: string;
  setWorkSetup: (val: string) => void;
  experienceLevel: string;
  setExperienceLevel: (val: string) => void;
  trainingProgram: string;
  setTrainingProgram: (val: string) => void;
  isStpPartnerOnly: boolean;
  setIsStpPartnerOnly: (val: boolean) => void;
  sourceFilter?: string;
  setSourceFilter?: (val: string) => void;
  locationRegion: string;
  setLocationRegion: (val: string) => void;
  freshness: string;
  setFreshness: (val: string) => void;
  sort: string;
  setSort: (val: string) => void;
  totalFound: number;
  isLoading?: boolean;
  onReset: () => void;
}

const TRAINING_PROGRAM_OPTIONS = [
  { value: '', label: 'Semua Program Pelatihan STP' },
  { value: 'Fullstack Web', label: 'Pelatihan Fullstack Web Development' },
  { value: 'Quality Assurance', label: 'Bootcamp Software Quality Assurance' },
  { value: 'Artificial Intelligence', label: 'Pelatihan AI & Machine Learning' },
  { value: 'CNC', label: 'Pelatihan Pemrograman & Mesin CNC' },
  { value: 'Cyber Security', label: 'Pelatihan Cyber Security Defense' },
  { value: 'Game', label: 'Bootcamp Pengembangan Game & Animasi 3D' },
  { value: 'Welding', label: 'Pelatihan Juru Las (Welder)' },
  { value: 'IoT', label: 'Pelatihan IoT & Smart Embedded Systems' },
  { value: 'Digital Marketing', label: 'Pelatihan Digital Marketing & E-Commerce' },
];

export default function JobFilterToolbar({
  workType,
  setWorkType,
  workSetup,
  setWorkSetup,
  experienceLevel,
  setExperienceLevel,
  trainingProgram,
  setTrainingProgram,
  isStpPartnerOnly,
  setIsStpPartnerOnly,
  sourceFilter,
  setSourceFilter,
  locationRegion,
  setLocationRegion,
  freshness,
  setFreshness,
  sort,
  setSort,
  totalFound,
  isLoading,
  onReset,
}: JobFilterToolbarProps) {
  const hasActiveFilter =
    workType !== 'all' ||
    workSetup !== 'all' ||
    experienceLevel !== 'all' ||
    Boolean(trainingProgram) ||
    isStpPartnerOnly ||
    (Boolean(sourceFilter) && sourceFilter !== 'all') ||
    locationRegion !== 'all' ||
    freshness !== 'all' ||
    sort !== 'newest';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      {/* ─── Baris Atas: Program Pelatihan Khusus Alumni STP ─── */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-emerald-950 block leading-tight">
              Kanal Karir Khusus Alumni Pelatihan Solo Technopark
            </span>
            <span className="text-[11px] text-emerald-800 leading-tight block">
              Saring lowongan yang kurikulumnya selaras dengan sertifikasi & diklat Anda:
            </span>
          </div>
        </div>

        <div className="w-full sm:w-auto min-w-[260px]">
          <select
            value={trainingProgram}
            onChange={(e) => setTrainingProgram(e.target.value)}
            className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-emerald-300 bg-white text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {TRAINING_PROGRAM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Grid Filter Utama yang Lebih Mantap ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Filter Wilayah / Regional */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span>Wilayah</span>
          </label>
          <select
            value={locationRegion}
            onChange={(e) => setLocationRegion(e.target.value)}
            className="w-full h-8.5 px-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Wilayah</option>
            <option value="solo_raya">Solo Raya & Sekitarnya</option>
            <option value="jabodetabek">Jabodetabek & Banten</option>
            <option value="jawa">Pulau Jawa</option>
            <option value="luar_jawa">Luar Jawa (Nasional)</option>
            <option value="luar_negeri">Global / Luar Negeri</option>
          </select>
        </div>

        {/* Filter Freshness / Periode Kumulatif */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Calendar className="w-3 h-3 text-emerald-600" />
            <span>Periode Data</span>
          </label>
          <select
            value={freshness}
            onChange={(e) => setFreshness(e.target.value)}
            className="w-full h-8.5 px-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Riwayat (Bank Data)</option>
            <option value="week">Baru Minggu Ini</option>
            <option value="month">30 Hari Terakhir</option>
          </select>
        </div>

        {/* Tipe Pekerjaan */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Tipe Kerja
          </label>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            className="w-full h-8.5 px-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Tipe</option>
            <option value="Full-time">Full-time</option>
            <option value="Internship / Magang">Magang / Internship</option>
            <option value="Contract">Kontrak</option>
            <option value="Freelance / Project">Freelance / Proyek</option>
            <option value="Part-time">Part-time</option>
          </select>
        </div>

        {/* Penataan Kerja (Work Setup) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Penataan Kerja
          </label>
          <select
            value={workSetup}
            onChange={(e) => setWorkSetup(e.target.value)}
            className="w-full h-8.5 px-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Model</option>
            <option value="On-site (Solo Technopark)">On-site di STP</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote / WFH">Remote / WFH</option>
            <option value="On-site">On-site Umum</option>
          </select>
        </div>

        {/* Pengalaman */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Pengalaman
          </label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full h-8.5 px-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Level</option>
            <option value="Fresh Graduate / Alumni Pelatihan">Fresh Graduate / Alumni</option>
            <option value="Junior (0-2 Tahun)">Junior (0-2 Thn)</option>
            <option value="Mid-Level (2-4 Tahun)">Mid-Level</option>
            <option value="Senior (4+ Tahun)">Senior</option>
          </select>
        </div>

        {/* Urutan Sort & Reset Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Urutkan
          </label>
          <div className="flex gap-1.5">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="flex-1 h-8.5 px-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="newest">Terbaru</option>
              <option value="salary_high">Gaji Tertinggi</option>
            </select>
            {hasActiveFilter && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReset}
                className="h-8.5 px-2 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Status Info Baris ─── */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Memuat lowongan pekerjaan aktif...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-900 bg-emerald-50 border border-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-md text-[11px]">
                {totalFound} lowongan
              </span>
              <span className="text-slate-400 hidden sm:inline">• Arsip kumulatif tersimpan aman</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {locationRegion !== 'all' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <MapPin className="w-3 h-3 text-emerald-600" />
              Wilayah terpilih
            </span>
          )}
          {trainingProgram && (
            <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Diklat: {trainingProgram}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
