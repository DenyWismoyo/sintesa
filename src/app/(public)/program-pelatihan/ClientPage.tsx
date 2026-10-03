// Lokasi file: src/app/(public)/program-pelatihan/ClientPage.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { useTraining } from '@/hooks/useTraining';
import { motion, Variants, AnimatePresence } from 'framer-motion';

import { 
  SlidersHorizontal, GraduationCap 
} from 'lucide-react';
import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';
import BorderlessSelect from '@/components/ui/BorderlessSelect';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');

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
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama kelas atau topik pelatihan..."
        isLoadingSearch={loading}
      />

      {/* Filter Bar Minimalist Borderless */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 pl-0.5 shrink-0 hidden sm:flex">
            <SlidersHorizontal size={14} /> Filter:
          </div>
          
          <BorderlessSelect
            value={selectedType}
            onChange={setSelectedType}
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
                onClick={() => setPriceFilter(price)}
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

          {(selectedType !== 'all' || priceFilter !== 'all' || selectedCategory !== 'Semua Kategori') && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Semua Kategori');
                setSelectedType('all');
                setPriceFilter('all');
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
          onChange={(cat) => setSelectedCategory(cat)}
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
          <motion.div 
            className="public-grid-4" 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
          >
            <AnimatePresence>
              {activeTrainings.map((training: any) => (
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
        )}
      </div>
    </SectionContainer>
  );
}