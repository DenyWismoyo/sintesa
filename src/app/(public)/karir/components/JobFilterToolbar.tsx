// src/app/(public)/karir/components/JobFilterToolbar.tsx
'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  GraduationCap,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  Briefcase,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrainingProgramSelector } from './TrainingProgramSelector';
import FilterDrawer, { FilterGroup } from '@/components/ui/FilterDrawer';

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
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  availableTrainings?: Array<{ id?: string; title?: string; category?: string }>;
}

const REGION_LABELS: Record<string, string> = {
  indonesia: '🇮🇩 Indonesia (Nasional)',
  solo_raya: 'Solo Raya & Kawasan STP',
  jabodetabek: 'Jabodetabek & Banten',
  jawa: 'Pulau Jawa',
  luar_jawa: 'Luar Jawa (Nasional)',
  asean: '🌏 ASEAN (Singapura, Malaysia, dll.)',
  east_asia: '🇯🇵/🇰🇷 Asia Timur (Jepang & Korea)',
  luar_negeri: '🌐 Luar Negeri / Global Remote',
};

const FRESHNESS_LABELS: Record<string, string> = {
  week: 'Baru Minggu Ini',
  month: '30 Hari Terakhir',
};

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
  searchQuery,
  setSearchQuery,
  availableTrainings,
}: JobFilterToolbarProps) {
  const activeFiltersCount = [
    workType !== 'all',
    workSetup !== 'all',
    experienceLevel !== 'all',
    Boolean(trainingProgram),
    isStpPartnerOnly,
    Boolean(sourceFilter && sourceFilter !== 'all'),
    locationRegion !== 'all',
    freshness !== 'all',
    sort !== 'newest',
    Boolean(searchQuery && searchQuery.trim()),
  ].filter(Boolean).length;

  const hasActiveFilter = activeFiltersCount > 0;

  // Filter groups untuk Mobile Bottom Sheet Drawer
  const filterGroups: FilterGroup[] = [
    {
      id: 'region',
      title: 'Wilayah & Penempatan',
      selectedValue: locationRegion,
      onChange: (val) => setLocationRegion(val),
      options: [
        { id: 'all', label: 'Semua Wilayah' },
        { id: 'indonesia', label: '🇮🇩 Indonesia (Nasional)' },
        { id: 'solo_raya', label: 'Solo Raya & STP' },
        { id: 'jabodetabek', label: 'Jabodetabek' },
        { id: 'jawa', label: 'Pulau Jawa' },
        { id: 'luar_jawa', label: 'Luar Jawa' },
        { id: 'asean', label: '🌏 ASEAN' },
        { id: 'east_asia', label: '🇯🇵/🇰🇷 Asia Timur' },
        { id: 'luar_negeri', label: '🌐 Global Remote' },
      ],
    },
    {
      id: 'workSetup',
      title: 'Model Kerja (Work Setup)',
      selectedValue: workSetup,
      onChange: (val) => setWorkSetup(val),
      options: [
        { id: 'all', label: 'Semua Model' },
        { id: 'Remote / WFH', label: '🌐 Remote / WFH' },
        { id: 'Hybrid', label: '🏢 Hybrid' },
        { id: 'On-site (Solo Technopark)', label: '📍 On-site STP' },
        { id: 'On-site', label: '🏙️ On-site Umum' },
      ],
    },
    {
      id: 'workType',
      title: 'Tipe Kontrak Kerja',
      selectedValue: workType,
      onChange: (val) => setWorkType(val),
      options: [
        { id: 'all', label: 'Semua Tipe' },
        { id: 'Full-time', label: 'Full-time' },
        { id: 'Internship / Magang', label: 'Magang / Internship' },
        { id: 'Contract', label: 'Kontrak' },
        { id: 'Freelance / Project', label: 'Freelance / Proyek' },
        { id: 'Part-time', label: 'Part-time' },
      ],
    },
    {
      id: 'experienceLevel',
      title: 'Tingkat Pengalaman',
      selectedValue: experienceLevel,
      onChange: (val) => setExperienceLevel(val),
      options: [
        { id: 'all', label: 'Semua Level' },
        { id: 'Fresh Graduate / Alumni Pelatihan', label: '🎓 Fresh Grad / Alumni' },
        { id: 'Junior (0-2 Tahun)', label: 'Junior (0-2 Thn)' },
        { id: 'Mid-Level (2-4 Tahun)', label: 'Mid-Level' },
        { id: 'Senior (4+ Tahun)', label: 'Senior (4+ Thn)' },
      ],
    },
    {
      id: 'freshness',
      title: 'Waktu Posting Lowongan',
      selectedValue: freshness,
      onChange: (val) => setFreshness(val),
      options: [
        { id: 'all', label: 'Semua Waktu' },
        { id: 'week', label: 'Baru Minggu Ini' },
        { id: 'month', label: '30 Hari Terakhir' },
      ],
    },
    {
      id: 'sort',
      title: 'Urutan Penampilan',
      selectedValue: sort,
      onChange: (val) => setSort(val),
      options: [
        { id: 'newest', label: 'Terbaru' },
        { id: 'salary_high', label: 'Gaji Tertinggi' },
      ],
    },
  ];

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

        <div className="w-full sm:w-[320px] md:w-[380px] shrink-0">
          <TrainingProgramSelector
            value={trainingProgram}
            onChange={setTrainingProgram}
            availableTrainings={availableTrainings}
          />
        </div>
      </div>

      {/* ─── Mobile Horizontal Quick Filters (Swipeable Chips Bar) ─── */}
      <div className="sm:hidden flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar -mx-1 px-1">
        <button
          type="button"
          onClick={() => {
            setLocationRegion('all');
            setWorkSetup('all');
          }}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            locationRegion === 'all' && workSetup === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
          }`}
        >
          Semua
        </button>

        <button
          type="button"
          onClick={() => setLocationRegion(locationRegion === 'indonesia' ? 'all' : 'indonesia')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
            locationRegion === 'indonesia'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/60'
          }`}
        >
          <span>🇮🇩 Indonesia</span>
        </button>

        <button
          type="button"
          onClick={() => setLocationRegion(locationRegion === 'asean' ? 'all' : 'asean')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
            locationRegion === 'asean'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-cyan-50 text-cyan-800 border border-cyan-200/80 hover:bg-cyan-100/60'
          }`}
        >
          <span>🌏 ASEAN</span>
        </button>

        <button
          type="button"
          onClick={() => setLocationRegion(locationRegion === 'east_asia' ? 'all' : 'east_asia')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
            locationRegion === 'east_asia'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100/60'
          }`}
        >
          <span>🇯🇵 Asia Timur</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkSetup(workSetup === 'Remote / WFH' ? 'all' : 'Remote / WFH')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
            workSetup === 'Remote / WFH'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200/80 hover:bg-indigo-100/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span>Remote</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setExperienceLevel(
              experienceLevel === 'Fresh Graduate / Alumni Pelatihan'
                ? 'all'
                : 'Fresh Graduate / Alumni Pelatihan'
            )
          }
          className={`h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
            experienceLevel === 'Fresh Graduate / Alumni Pelatihan'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-50 text-purple-800 border border-purple-200/80 hover:bg-purple-100/60'
          }`}
        >
          <span>🎓 Fresh Grad</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setWorkType(workType === 'Internship / Magang' ? 'all' : 'Internship / Magang')
          }
          className={`h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
            workType === 'Internship / Magang'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100/60'
          }`}
        >
          <span>💼 Magang</span>
        </button>

        <button
          type="button"
          onClick={() => setSort(sort === 'salary_high' ? 'newest' : 'salary_high')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
            sort === 'salary_high'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span>💰 Gaji Tertinggi</span>
        </button>
      </div>

      {/* ─── Trigger Mobile Bottom Sheet Drawer ─── */}
      <div className="sm:hidden flex items-center gap-2 pt-0.5">
        <FilterDrawer
          groups={filterGroups}
          activeCount={activeFiltersCount}
          onResetAll={onReset}
          triggerLabel="Filter Lengkap & Urutkan"
          className="w-full justify-between"
        />
      </div>

      {/* ─── Grid Filter Utama (Khusus Layar Desktop/Tablet sm:) ─── */}
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
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
            <option value="indonesia">🇮🇩 Indonesia (Nasional)</option>
            <option value="solo_raya">Solo Raya & Kawasan STP</option>
            <option value="jabodetabek">Jabodetabek & Banten</option>
            <option value="jawa">Pulau Jawa</option>
            <option value="luar_jawa">Luar Jawa (Nasional)</option>
            <option value="asean">🌏 ASEAN (Singapura, Malaysia, dll.)</option>
            <option value="east_asia">🇯🇵/🇰🇷 Asia Timur (Jepang & Korea)</option>
            <option value="luar_negeri">🌐 Luar Negeri / Global Remote</option>
          </select>
        </div>

        {/* Filter Freshness / Periode Kumulatif */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Calendar className="w-3 h-3 text-emerald-600" />
            <span>Waktu Posting</span>
          </label>
          <select
            value={freshness}
            onChange={(e) => setFreshness(e.target.value)}
            className="w-full h-8.5 px-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Waktu</option>
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

      {/* ─── Baris Chip Filter Aktif (Bisa Dihapus Satuan) ─── */}
      {hasActiveFilter && (
        <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Filter Aktif:</span>

          {searchQuery && searchQuery.trim() && setSearchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200">
              <span>Cari: "{searchQuery}"</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {locationRegion !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>{REGION_LABELS[locationRegion] || locationRegion}</span>
              <button
                type="button"
                onClick={() => setLocationRegion('all')}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Hapus filter wilayah"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {trainingProgram && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
              <GraduationCap className="w-3 h-3 text-amber-600" />
              <span>Diklat: {trainingProgram}</span>
              <button
                type="button"
                onClick={() => setTrainingProgram('')}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Hapus filter diklat"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {workType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200">
              <span>Tipe: {workType}</span>
              <button
                type="button"
                onClick={() => setWorkType('all')}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Hapus filter tipe kerja"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {workSetup !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 text-[11px] font-semibold border border-indigo-200">
              <span>Model: {workSetup}</span>
              <button
                type="button"
                onClick={() => setWorkSetup('all')}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Hapus filter model kerja"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {experienceLevel !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-semibold border border-purple-200">
              <span>Level: {experienceLevel}</span>
              <button
                type="button"
                onClick={() => setExperienceLevel('all')}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Hapus filter pengalaman"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {freshness !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-semibold border border-teal-200">
              <Calendar className="w-3 h-3 text-teal-600" />
              <span>{FRESHNESS_LABELS[freshness] || freshness}</span>
              <button
                type="button"
                onClick={() => setFreshness('all')}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Hapus filter periode"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {sort !== 'newest' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200">
              <span>Urutan: Gaji Tertinggi</span>
              <button
                type="button"
                onClick={() => setSort('newest')}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Reset urutan ke terbaru"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2 ml-1"
          >
            Bersihkan Semua
          </button>
        </div>
      )}

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
              <span className="text-slate-400 hidden sm:inline">• Lowongan terverifikasi aktif</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
