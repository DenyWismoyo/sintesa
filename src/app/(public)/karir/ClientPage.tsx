// src/app/(public)/karir/ClientPage.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Briefcase,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SectionContainer } from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs, { PillTabItem } from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { useJobs } from '@/hooks/useJobs';
import { useTraining } from '@/hooks/useTraining';
import { JobListing } from '@/types/job.types';

import JobCard from './components/JobCard';
import JobFilterToolbar from './components/JobFilterToolbar';
import AlumniQuickMatchBanner from './components/AlumniQuickMatchBanner';
import CareerExclusiveGate from '@/components/career/CareerExclusiveGate';
import { useAuth } from '@/lib/AuthContext';
import { canAccessCareer } from '@/config/roles';

const CATEGORY_TABS: PillTabItem[] = [
  { key: 'all', label: 'Semua Bidang' },
  { key: 'IT & Rekayasa Perangkat Lunak', label: 'IT & Software Dev' },
  { key: 'Kecerdasan Buatan & Sains Data', label: 'AI & Data Science' },
  { key: 'Manufaktur Presisi & Mekatronika', label: 'Manufaktur & CNC' },
  { key: 'Keamanan Siber (Cyber Security)', label: 'Cyber Security' },
  { key: 'Multimedia, Game & Animasi 3D', label: 'Multimedia & Game' },
  { key: 'Pemasaran & Bisnis Digital', label: 'Bisnis & E-Commerce' },
];

export default function KarirClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role, loading: authLoading } = useAuth();
  const hasCareerAccess = canAccessCareer(role);
  const jobsSectionRef = useRef<HTMLDivElement>(null);

  // Ambil data pelatihan STP terkini dari Firestore master cache
  const { trainings } = useTraining();

  // 1. Inisialisasi State Membaca Penuh Dari URL Search Parameters
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('kategori') || 'all');
  const [workType, setWorkType] = useState(() => searchParams.get('tipe') || 'all');
  const [workSetup, setWorkSetup] = useState(() => searchParams.get('setup') || 'all');
  const [experienceLevel, setExperienceLevel] = useState(() => searchParams.get('exp') || 'all');
  const [trainingProgram, setTrainingProgram] = useState(() => searchParams.get('program') || '');
  const [isStpPartnerOnly, setIsStpPartnerOnly] = useState(() => searchParams.get('partner') === 'true');
  const [sourceFilter, setSourceFilter] = useState(() => searchParams.get('source') || 'all');
  const [locationRegion, setLocationRegion] = useState(() => searchParams.get('wilayah') || 'all');
  const [freshness, setFreshness] = useState(() => searchParams.get('periode') || 'all');
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'newest');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(searchParams.get('p') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [pageSize, setPageSize] = useState(() => {
    const l = parseInt(searchParams.get('limit') || '9', 10);
    return [9, 18, 27].includes(l) ? l : 9;
  });

  // Query Filter Object
  const filterParams = useMemo(() => {
    return {
      query: searchQuery.trim() || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      workType: workType !== 'all' ? workType : undefined,
      workSetup: workSetup !== 'all' ? workSetup : undefined,
      experienceLevel: experienceLevel !== 'all' ? experienceLevel : undefined,
      trainingProgram: trainingProgram.trim() || undefined,
      isStpPartner: isStpPartnerOnly ? true : undefined,
      source: sourceFilter !== 'all' ? (sourceFilter as any) : undefined,
      locationRegion: locationRegion !== 'all' ? (locationRegion as any) : undefined,
      freshness: freshness !== 'all' ? (freshness as any) : undefined,
      sort: sort as any,
    };
  }, [
    searchQuery,
    selectedCategory,
    workType,
    workSetup,
    experienceLevel,
    trainingProgram,
    isStpPartnerOnly,
    sourceFilter,
    locationRegion,
    freshness,
    sort,
  ]);

  // 2. Reset Page ke 1 HANYA saat filter berubah (bukan saat first mount atau saat berpindah halaman)
  const isFirstMountRef = useRef(true);
  const prevFilterFingerprintRef = useRef<string>('');

  useEffect(() => {
    const currentFingerprint = JSON.stringify(filterParams) + pageSize;
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevFilterFingerprintRef.current = currentFingerprint;
      return;
    }
    if (prevFilterFingerprintRef.current !== currentFingerprint) {
      prevFilterFingerprintRef.current = currentFingerprint;
      setCurrentPage(1);
    }
  }, [filterParams, pageSize]);

  // 3. Sinkronisasi State Filter ke URL Browser (Shallow replace tanpa reload) & SessionStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategory && selectedCategory !== 'all') params.set('kategori', selectedCategory);
      if (workType && workType !== 'all') params.set('tipe', workType);
      if (workSetup && workSetup !== 'all') params.set('setup', workSetup);
      if (experienceLevel && experienceLevel !== 'all') params.set('exp', experienceLevel);
      if (trainingProgram.trim()) params.set('program', trainingProgram.trim());
      if (isStpPartnerOnly) params.set('partner', 'true');
      if (sourceFilter && sourceFilter !== 'all') params.set('source', sourceFilter);
      if (locationRegion && locationRegion !== 'all') params.set('wilayah', locationRegion);
      if (freshness && freshness !== 'all') params.set('periode', freshness);
      if (sort && sort !== 'newest') params.set('sort', sort);
      if (currentPage > 1) params.set('p', String(currentPage));
      if (pageSize !== 9) params.set('limit', String(pageSize));

      const qs = params.toString();
      const newUrl = qs ? `${pathname}?${qs}` : pathname;

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sintesa_karir_last_url', newUrl);
        window.history.replaceState(null, '', newUrl);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    selectedCategory,
    workType,
    workSetup,
    experienceLevel,
    trainingProgram,
    isStpPartnerOnly,
    sourceFilter,
    locationRegion,
    freshness,
    sort,
    currentPage,
    pageSize,
    pathname,
  ]);

  // 4. Listener Popstate (Ketika pengguna menekan tombol Back/Forward di browser)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const sp = new URLSearchParams(window.location.search);
      setSearchQuery(sp.get('q') || '');
      setSelectedCategory(sp.get('kategori') || 'all');
      setWorkType(sp.get('tipe') || 'all');
      setWorkSetup(sp.get('setup') || 'all');
      setExperienceLevel(sp.get('exp') || 'all');
      setTrainingProgram(sp.get('program') || '');
      setIsStpPartnerOnly(sp.get('partner') === 'true');
      setSourceFilter(sp.get('source') || 'all');
      setLocationRegion(sp.get('wilayah') || 'all');
      setFreshness(sp.get('periode') || 'all');
      setSort(sp.get('sort') || 'newest');
      const p = parseInt(sp.get('p') || '1', 10);
      setCurrentPage(isNaN(p) || p < 1 ? 1 : p);
      const l = parseInt(sp.get('limit') || '9', 10);
      setPageSize([9, 18, 27].includes(l) ? l : 9);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { data, isLoading } = useJobs(filterParams, { enabled: hasCareerAccess });
  const jobs = data?.jobs || [];
  const total = data?.total || 0;

  // Komputasi Pagination
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, jobs.length);
  const paginatedJobs = useMemo(() => {
    return jobs.slice(startIndex, endIndex);
  }, [jobs, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (jobsSectionRef.current) {
      jobsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper untuk membuat daftar nomor halaman bernomor (1, 2, ..., N)
  const paginationRange = useMemo(() => {
    const delta = 1;
    const range: (number | string)[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return Array.from(new Set(range));
  }, [currentPage, totalPages]);

  // 5. Scroll Restoration & Visual Focus ke kartu lowongan terakhir yang dibuka
  const hasRestoredScrollRef = useRef(false);
  useEffect(() => {
    if (isLoading || jobs.length === 0 || hasRestoredScrollRef.current) return;
    if (typeof window === 'undefined') return;

    const lastJobId = sessionStorage.getItem('sintesa_karir_last_viewed_id');
    if (lastJobId) {
      const targetElement = document.getElementById(`job-card-${lastJobId}`);
      if (targetElement) {
        hasRestoredScrollRef.current = true;
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetElement.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-2', 'shadow-lg');
          setTimeout(() => {
            targetElement.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-2', 'shadow-lg');
            sessionStorage.removeItem('sintesa_karir_last_viewed_id');
          }, 2000);
        }, 150);
      }
    }
  }, [isLoading, jobs]);

  // Direct Routing ke Client Page Detail dengan menyimpan ID lowongan
  const handleOpenDetail = (job: JobListing) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sintesa_karir_last_viewed_id', job.id);
    }
    router.push(`/karir/${job.id}`);
  };

  const handleOpenAiMatch = (job: JobListing) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sintesa_karir_last_viewed_id', job.id);
    }
    router.push(`/karir/${job.id}#ai-match`);
  };

  // Redirect otomatis jika URL memiliki query parameter `id` (legacy link)
  const initialJobId = searchParams.get('id');
  useEffect(() => {
    if (initialJobId) {
      router.replace(`/karir/${encodeURIComponent(initialJobId)}`);
    }
  }, [initialJobId, router]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setWorkType('all');
    setWorkSetup('all');
    setExperienceLevel('all');
    setTrainingProgram('');
    setIsStpPartnerOnly(false);
    setSourceFilter('all');
    setLocationRegion('all');
    setFreshness('all');
    setSort('newest');
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sintesa_karir_last_url', '/karir');
      window.history.replaceState(null, '', '/karir');
    }
  };

  // Gerbang Eksklusif: Hanya Alumni & Seluruh Admin yang bisa mengakses
  if (authLoading) {
    return (
      <SectionContainer accent="emerald" width="default">
        <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Memverifikasi hak akses pengguna...</p>
        </div>
      </SectionContainer>
    );
  }

  if (!hasCareerAccess) {
    return (
      <SectionContainer accent="emerald" width="default">
        <CareerExclusiveGate />
      </SectionContainer>
    );
  }

  return (
    <SectionContainer accent="emerald" width="default">
      {/* ─── Hero Section ─── */}
      <PageHero
        title="Bursa Karir & Talenta"
        subtitle="Peluang kerja, magang, dan penyaluran industri terkurasi khusus alumni pelatihan dan ekosistem inovasi Solo Technopark."
        accentColor="emerald"
        badge={{
          label: 'Talent & Career Hub STP',
          icon: <Briefcase className="w-3.5 h-3.5 text-emerald-600" />,
        }}
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Pelatihan', href: '/program-pelatihan' },
          { label: 'Karir & Alumni' },
        ]}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari posisi pekerjaan, perusahaan mitra, atau keahlian (React, CNC, AI)..."
        isLoadingSearch={isLoading}
      />

      <div className="space-y-6 pt-4 sm:pt-6">
        {/* ─── Banner Bank Data Kumulatif ─── */}
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Bank Data Karir Terakumulasi</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>{total} Lowongan Tersimpan & Terverifikasi</span>
                <span className="text-xs font-normal text-emerald-300/80 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                  Sinkronisasi Mingguan
                </span>
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Setiap pembaruan mingguan otomatis digabungkan ke dalam bank data tanpa menghapus riwayat sebelumnya. Peluang karir terdahulu tetap dapat diakses sebagai referensi dan peluang aktif.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] text-slate-300">Halaman Saat Ini</div>
                <div className="text-sm font-extrabold text-emerald-400">
                  {currentPage} / {totalPages}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Pill Tabs Kategori Bidang ─── */}
        <PillTabs
          tabs={CATEGORY_TABS}
          active={selectedCategory}
          onChange={setSelectedCategory}
        />

        {/* ─── Toolbar Filter & Relevansi Pelatihan ─── */}
        <JobFilterToolbar
          workType={workType}
          setWorkType={setWorkType}
          workSetup={workSetup}
          setWorkSetup={setWorkSetup}
          experienceLevel={experienceLevel}
          setExperienceLevel={setExperienceLevel}
          trainingProgram={trainingProgram}
          setTrainingProgram={setTrainingProgram}
          isStpPartnerOnly={isStpPartnerOnly}
          setIsStpPartnerOnly={setIsStpPartnerOnly}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          locationRegion={locationRegion}
          setLocationRegion={setLocationRegion}
          freshness={freshness}
          setFreshness={setFreshness}
          sort={sort}
          setSort={setSort}
          totalFound={total}
          isLoading={isLoading}
          onReset={handleResetFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          availableTrainings={trainings}
        />

        {/* ─── Anchor Target Scroll Pagination ─── */}
        <div ref={jobsSectionRef} className="scroll-mt-24" />

        {/* ─── Sub-Baris Info Hasil & Selector Limit ─── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 text-xs text-slate-500">
          <div>
            {!isLoading && total > 0 && (
              <p>
                Menampilkan{' '}
                <span className="font-bold text-slate-900">
                  {startIndex + 1} - {endIndex}
                </span>{' '}
                dari <span className="font-bold text-slate-900">{total}</span> lowongan
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Tampilkan per halaman:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              {[9, 18, 27].map((size) => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    pageSize === size
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Grid Lowongan Kerja ─── */}
        {isLoading ? (
          <div className="public-grid-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="public-card h-80 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between animate-pulse"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
                <div className="h-8 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Tidak Ada Lowongan yang Sesuai"
            description="Coba ubah kata kunci pencarian, sesuaikan filter wilayah/kategori, atau reset filter untuk melihat seluruh peluang karir."
            actionLabel="Reset Semua Filter"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="public-grid-3">
            {paginatedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={handleOpenDetail}
                onOpenAiMatch={handleOpenAiMatch}
                selectedProgramFilter={trainingProgram}
              />
            ))}
          </div>
        )}

        {/* ─── Pagination Controls Bernomor ─── */}
        {!isLoading && totalPages > 1 && (
          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80">
            <div className="text-xs text-slate-500 order-2 sm:order-1">
              Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari{' '}
              <span className="font-bold text-slate-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5 order-1 sm:order-2">
              {/* Tombol Sebelumnya */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 px-3 rounded-xl text-xs font-semibold gap-1.5 border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </Button>

              {/* Deretan Angka Nomor Halaman */}
              <div className="flex items-center gap-1">
                {paginationRange.map((pageItem, idx) => {
                  if (typeof pageItem === 'string') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-9 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = pageItem === currentPage;
                  return (
                    <button
                      key={pageItem}
                      type="button"
                      onClick={() => handlePageChange(pageItem)}
                      className={`min-w-[36px] h-9 px-2 text-xs font-bold rounded-xl transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {pageItem}
                    </button>
                  );
                })}
              </div>

              {/* Tombol Selanjutnya */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 px-3 rounded-xl text-xs font-semibold gap-1.5 border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Banner Penyaluran Kerja Alumni STP ─── */}
        <div className="pt-6 sm:pt-8">
          <AlumniQuickMatchBanner />
        </div>
      </div>
    </SectionContainer>
  );
}
