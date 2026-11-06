// src/app/(public)/karir/components/AlumniSmartBridgeBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Target, GraduationCap, Bookmark, Sparkles, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { Alumni } from '@/types/ecosystem.types';

interface AlumniSmartBridgeBarProps {
  alumniProfile: Alumni;
  recommendedCount: number;
  bookmarkedCount: number;
  smartFeedMode: 'all' | 'for_you' | 'saved';
  onSelectFeedMode: (mode: 'all' | 'for_you' | 'saved') => void;
  onQuickFilterMyProgram?: (program: string) => void;
}

export default function AlumniSmartBridgeBar({
  alumniProfile,
  recommendedCount,
  bookmarkedCount,
  smartFeedMode,
  onSelectFeedMode,
  onQuickFilterMyProgram,
}: AlumniSmartBridgeBarProps) {
  const skillsCount = (alumniProfile.skills?.length || 0) + (alumniProfile.tools?.length || 0);

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 text-white border border-emerald-500/30 shadow-md relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-extrabold text-emerald-300">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Jembatan Karir Personal Alumni</span>
            </span>
            {alumniProfile.programTaken && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-slate-200 truncate max-w-xs">
                <GraduationCap className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{alumniProfile.programTaken}</span>
              </span>
            )}
            {alumniProfile.jobAlertEnabled !== false && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold text-indigo-200">
                <CheckCircle2 className="w-2.5 h-2.5 text-indigo-300" />
                <span>Job Alert Aktif</span>
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            Halo, {alumniProfile.name}! Kami menemukan{' '}
            <span className="text-emerald-400 underline decoration-emerald-400/50 underline-offset-4">
              {recommendedCount} lowongan aktif
            </span>{' '}
            yang cocok dengan kompetensi Anda.
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Sistem mencocokkan otomatis riwayat diklat
            {skillsCount > 0 ? ` serta ${skillsCount} keahlian teknis di portofolio Anda` : ' Anda'} terhadap seluruh lowongan mitra kawasan, korporasi nasional, dan jaringan kerja internasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectFeedMode(smartFeedMode === 'for_you' ? 'all' : 'for_you')}
            className={`h-9 px-3.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              smartFeedMode === 'for_you'
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>
              {smartFeedMode === 'for_you'
                ? 'Menampilkan Untuk Saya'
                : `Untuk Saya (${recommendedCount})`}
            </span>
          </button>

          {alumniProfile.programTaken && onQuickFilterMyProgram && (
            <button
              type="button"
              onClick={() => onQuickFilterMyProgram(alumniProfile.programTaken!)}
              className="h-9 px-3 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              <span>Sesuai Diklat Saya</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectFeedMode(smartFeedMode === 'saved' ? 'all' : 'saved')}
            className={`h-9 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              smartFeedMode === 'saved'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Tersimpan ({bookmarkedCount})</span>
          </button>

          <Link
            href="/profil"
            className="h-9 px-3 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 transition-all flex items-center gap-1.5"
            title="Atur keahlian, target wilayah & Job Alert di Profil"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Preferensi</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

