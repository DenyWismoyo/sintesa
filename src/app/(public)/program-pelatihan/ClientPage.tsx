// Lokasi file: src/app/(public)/program-pelatihan/ClientPage.tsx

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useTraining } from '@/hooks/useTraining';
import { usePublicQuerySync } from '@/hooks/usePublicQuerySync';
import { motion, Variants, AnimatePresence } from 'framer-motion';

import { 
  SlidersHorizontal, GraduationCap, MessageSquareQuote, Sparkles, ArrowRight
} from 'lucide-react';
import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';
import BorderlessSelect from '@/components/ui/BorderlessSelect';
import { PublicPagination } from '@/components/public';
import TrainingCard from './components/TrainingCard';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 320, damping: 26 }
  }
};

// Skeleton Loading yang Elegan & Borderless sesuai standar sintesa-public-ui
const TrainingSkeleton = () => (
  <div className="public-card p-5 flex flex-col h-full">
    <div className="public-shimmer h-52 sm:h-56 w-full rounded-2xl mb-4" />
    <div className="public-shimmer h-6 w-3/4 rounded-lg mb-2" />
    <div className="public-shimmer h-4 w-full rounded-lg mb-2" />
    <div className="public-shimmer h-4 w-4/5 rounded-lg mb-4" />
    <div className="public-shimmer h-4 w-1/2 rounded-lg mb-4 mt-auto" />
    <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-end">
      <div className="public-shimmer h-6 w-1/3 rounded-lg" />
      <div className="public-shimmer h-10 w-10 rounded-full" />
    </div>
  </div>
);

export default function ProgramPelatihanPublik() {
  const { getQuery, getQueryNumber, updateQuery } = usePublicQuerySync();

  const [searchTerm, setSearchTerm] = useState(() => getQuery('q'));
  const [selectedType, setSelectedType] = useState<string>(() => getQuery('type', 'all'));
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>(() => (getQuery('price') as any) || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => getQuery('kategori', 'Semua Kategori'));
  const [currentPage, setCurrentPage] = useState(() => getQueryNumber('p', 1));
  const [pageSize, setPageSize] = useState(12);

  // Menggunakan Master Cache Pelatihan (1-Read Pattern dari cache_trainings/master)
  const { trainings: rawTrainings, loading } = useTraining();

  const activeTrainings = useMemo(() => {
    return rawTrainings.filter((training: any) => {
      const isStatusValid = training.status === 'Published' || training.status === 'Aktif' || training.isPublished === true;
      if (!isStatusValid) return false;

      if (selectedType !== 'all' && training.type !== selectedType) return false;

      const isFree = training.isFree === true || training.pricingType === 'GRATIS' || Number(training.price) === 0;
      if (priceFilter === 'free' && !isFree) return false;
      if (priceFilter === 'paid' && isFree) return false;

      if (selectedCategory !== 'Semua Kategori' && training.category !== selectedCategory) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const instructorsStr = Array.isArray(training.instructors) 
          ? training.instructors.map((i: any) => i.name).join(' ') 
          : (training.instructorName || '');
        const matchSearch = 
          (training.title || '').toLowerCase().includes(q) ||
          (training.shortDescription || '').toLowerCase().includes(q) ||
          (training.category || '').toLowerCase().includes(q) ||
          instructorsStr.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [rawTrainings, searchTerm, selectedType, priceFilter, selectedCategory]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
    updateQuery({ q: val, p: 1 });
  };

  const handleTypeChange = (val: string) => {
    setSelectedType(val);
    setCurrentPage(1);
    updateQuery({ type: val, p: 1 });
  };

  const handlePriceChange = (val: string) => {
    const p = val as 'all' | 'free' | 'paid';
    setPriceFilter(p);
    setCurrentPage(1);
    updateQuery({ price: p, p: 1 });
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setCurrentPage(1);
    updateQuery({ kategori: val, p: 1 });
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    updateQuery({ p });
  };

  const paginatedTrainings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeTrainings.slice(start, start + pageSize);
  }, [activeTrainings, currentPage, pageSize]);

  const DIKLAT_CATEGORIES = [
    'Semua Kategori',
    'Welding Manufaktur',
    'Oil and Gas',
    'Welding Under Water',
    'Mekanik Manufaktur',
    'Desain Manufaktur',
    'Welding Inspektor',
    'IT & Digital',
    'Inkubator Bisnis',
    'Umum'
  ];

  return (
    <SectionContainer accent="amber">
      {/* PageHero Terpadu */}
      <PageHero 
        breadcrumbs={[{ label: 'Pelatihan', href: '/program-pelatihan' }]}
        badge={{ label: 'Program Vokasi Terapan', icon: <GraduationCap size={13} />, variant: 'amber' }}
        title="Katalog Program Pelatihan & Diklat"
        subtitle="Tingkatkan keterampilan teknis dan manajerial dengan program sertifikasi berstandar industri nasional & internasional."
        accentColor="amber"
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Cari nama kelas atau topik pelatihan..."
        isLoadingSearch={loading}
      />

      {/* Banner CTA Review Program Pelatihan Publik */}
      <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-200/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
            <MessageSquareQuote size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Sparkles size={11} /> Suara Peserta & Transparansi Vokasi
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">• Tanpa Perlu Login</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
              Pernah Mengikuti Program Pelatihan di Solo Technopark?
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              Peserta, mentor, dan industri dapat memberikan evaluasi transparan (seperti program SMK Go Global Welder) untuk penyempurnaan fasilitas dan kurikulum.
            </p>
          </div>
        </div>
        <Link
          href="/review-pelatihan"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 transition-all hover:gap-2.5 shadow-sm"
        >
          <span>Lihat & Tulis Ulasan</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Filter Bar Minimalist Borderless */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 pl-0.5 shrink-0 hidden sm:flex">
            <SlidersHorizontal size={14} /> Filter:
          </div>
          
          <BorderlessSelect
            value={selectedType}
            onChange={handleTypeChange}
            options={[
              { value: 'all', label: 'Semua Tipe' },
              { value: 'Video Course', label: 'Video Course' },
              { value: 'Online Live', label: 'Online Live' },
              { value: 'Offline', label: 'Offline / Tatap Muka' },
            ]}
          />

          <div className="flex bg-slate-100/80 p-0.5 rounded-full shrink-0">
            {(['all', 'free', 'paid'] as const).map((price) => (
              <button
                key={price}
                type="button"
                onClick={() => handlePriceChange(price)}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold capitalize transition-all cursor-pointer ${
                  priceFilter === price 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {price === 'all' ? 'Semua Biaya' : price === 'free' ? 'Gratis' : 'Berbayar'}
              </button>
            ))}
          </div>

          {(selectedType !== 'all' || priceFilter !== 'all' || selectedCategory !== 'Semua Kategori' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                handleCategoryChange('Semua Kategori');
                handleTypeChange('all');
                handlePriceChange('all');
                handleSearchChange('');
              }}
              className="text-[11px] sm:text-xs font-bold text-amber-600 hover:text-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-50 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Filter Kategori Diklat Horizontal Menggunakan PillTabs Minimalis */}
      <div className="mb-4 sm:mb-6">
        <PillTabs
          tabs={DIKLAT_CATEGORIES.map(cat => ({ key: cat, label: cat }))}
          active={selectedCategory}
          onChange={handleCategoryChange}
          layoutId="diklat-pill-tabs"
          ariaLabel="Kategori Diklat"
        />
      </div>

      {/* Area Hasil Grid Responsif Terpadu (Menyesuaikan Lebar Layar seperti Katalog) */}
      <div className="w-full min-h-[50vh] pt-2">
        {loading && rawTrainings.length === 0 ? (
          <div className="public-grid-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <TrainingSkeleton key={n} />
            ))}
          </div>
        ) : activeTrainings.length === 0 ? (
          <EmptyState 
            icon={GraduationCap}
            title="Pelatihan Tidak Ditemukan"
            description="Tidak ada program pelatihan yang sesuai dengan kriteria filter atau pencarian Anda saat ini."
            actionLabel="Reset Semua Filter"
            onAction={() => {
              setSearchTerm('');
              setSelectedCategory('Semua Kategori');
              setSelectedType('all');
              setPriceFilter('all');
            }}
          />
        ) : (
          <>
            <motion.div 
              className="public-grid-4" 
              variants={containerVariants} 
              initial="hidden" 
              animate="visible"
            >
              <AnimatePresence>
                {paginatedTrainings.map((training: any) => (
                  <motion.div 
                    key={training.id} 
                    variants={itemVariants}
                    layout
                    className="h-full"
                  >
                    <TrainingCard training={training} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Standar Pagination Publik */}
            <PublicPagination
              currentPage={currentPage}
              totalItems={activeTrainings.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={setPageSize}
              mode="hybrid"
            />
          </>
        )}
      </div>
    </SectionContainer>
  );
}