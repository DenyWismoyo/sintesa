// Lokasi file: src/app/(public)/program-pelatihan/ClientPage.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/useSearch';
import { motion, Variants } from 'framer-motion';

import { 
  PlayCircle, Sparkles, ArrowRight, UserCircle2, SlidersHorizontal, Users,
  Clock, Award, GraduationCap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';
import { formatRupiah } from '@/utils/format';

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

export default function ProgramPelatihanPublik() {
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');

  const { results: rawTrainings, loading } = useSearch<any>({
    collection: 'trainings', 
    query: searchTerm, 
    queryBy: 'title,description,category,instructorNames',
    perPage: 100 
  });

  const activeTrainings = useMemo(() => {
    return rawTrainings.filter((training) => {
      const isStatusValid = training.status === 'Published' || training.status === 'Aktif';
      if (!isStatusValid) return false;

      if (selectedType !== 'all' && training.type !== selectedType) return false;

      if (priceFilter === 'free' && training.isFree !== true) return false;
      if (priceFilter === 'paid' && training.isFree === true) return false;

      if (selectedCategory !== 'Semua Kategori' && training.category !== selectedCategory) return false;

      return true;
    });
  }, [rawTrainings, selectedType, priceFilter, selectedCategory]);

  const DIKLAT_CATEGORIES = [
    'Semua Kategori',
    'Mekanik Manufaktur',
    'Desain Manufaktur',
    'Welding Manufaktur',
    'Welding Under Water',
    'Welding Inspektor',
    'Oil and Gas',
    'Inkubator Bisnis',
    'IT & Digital',
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
      <div className="public-filter-bar mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 pl-1 shrink-0">
            <SlidersHorizontal size={14} /> Filter:
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="public-select"
          >
            <option value="all">Semua Tipe</option>
            <option value="Video Course">Video Course</option>
            <option value="Online Live">Online Live</option>
            <option value="Offline">Offline / Tatap Muka</option>
          </select>

          <div className="w-px h-5 bg-slate-100 mx-0.5 shrink-0 hidden sm:block" />

          <div className="flex bg-slate-50 rounded-full p-0.5 shrink-0">
            {(['all', 'free', 'paid'] as const).map((price) => (
              <button
                key={price}
                type="button"
                onClick={() => setPriceFilter(price)}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${
                  priceFilter === price 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {price === 'all' ? 'Semua Biaya' : price === 'free' ? 'Gratis' : 'Berbayar'}
              </button>
            ))}
          </div>
        </div>

        {(selectedType !== 'all' || priceFilter !== 'all' || selectedCategory !== 'Semua Kategori') && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Semua Kategori');
              setSelectedType('all');
              setPriceFilter('all');
            }}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 px-3 py-1.5 rounded-full hover:bg-amber-50 transition-colors shrink-0 self-end sm:self-auto cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Filter Kategori Diklat Horizontal Menggunakan PillTabs */}
      <div className="mb-6">
        <PillTabs
          tabs={DIKLAT_CATEGORIES.map(cat => ({ key: cat, label: cat }))}
          active={selectedCategory}
          onChange={(cat) => setSelectedCategory(cat)}
          layoutId="diklat-pill-tabs"
          ariaLabel="Kategori Diklat"
        />
      </div>

      <div className="w-full min-h-[50vh]">
        {loading ? (
          <div className="public-grid-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="public-card p-5 flex flex-col sm:flex-row gap-5 lg:gap-8">
                <div className="public-shimmer w-full sm:w-[220px] md:w-[260px] aspect-[2/3] rounded-2xl shrink-0" />
                <div className="flex flex-col flex-1 py-2 w-full">
                  <div className="public-shimmer h-5 w-28 mb-4 rounded-md" />
                  <div className="public-shimmer h-7 w-3/4 mb-4 rounded-lg" />
                  <div className="public-shimmer h-4 w-full mb-2 rounded" />
                  <div className="public-shimmer h-4 w-5/6 mb-6 rounded" />
                  <div className="mt-auto pt-4 flex justify-between items-end">
                    <div className="public-shimmer h-8 w-32 rounded-lg" />
                    <div className="public-shimmer h-10 w-28 rounded-full" />
                  </div>
                </div>
              </div>
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
            className="public-grid-2" 
            variants={staggerContainer} 
            initial="hidden" 
            animate="visible"
          >
            {activeTrainings.map((training: any) => {
              const isFull = training.quota && training.registeredCount >= training.quota;
              
              return (
                <motion.div 
                  key={training.id} 
                  variants={fadeUpVariants} 
                  className="public-card public-card-hover group w-full p-4 lg:p-6 cursor-pointer flex flex-col sm:flex-row gap-5 lg:gap-8 relative hover:z-30" 
                  onClick={() => router.push(`/program-pelatihan/${training.id}`)}
                >
                  <div className="relative w-full max-w-[300px] mx-auto sm:mx-0 sm:w-[220px] md:w-[260px] lg:w-[280px] aspect-[2/3] bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-xs group-hover:shadow-md transition-all duration-500 z-10">
                    {training.imageUrl ? (
                      <img src={training.imageUrl} alt={training.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 group-hover:scale-105 transition-transform duration-700">
                        <PlayCircle className="w-16 h-16 text-slate-300" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent opacity-80" />
                    
                    <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-2">
                       <Badge className="font-bold text-[10px] lg:text-xs px-2.5 py-1 border-none backdrop-blur-md bg-white/95 text-slate-800 shadow-xs w-max">
                          {training.type}
                       </Badge>
                       {isFull && (
                         <Badge variant="destructive" className="font-bold text-[10px] lg:text-xs uppercase shadow-xs bg-red-500 border-none px-2.5 py-0.5 w-max">Penuh</Badge>
                       )}
                    </div>

                    <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider flex-wrap">
                        <span className="flex items-center gap-1"><Sparkles size={13} className="text-amber-400"/> Level {training.level}</span>
                        
                        {training.durationDisplay && (
                          <span className="flex items-center gap-1 ml-1 text-slate-200">
                            <Clock size={11} className="text-slate-400"/> {training.durationDisplay}
                          </span>
                        )}
                        {training.certificationType && (
                          <span className="flex items-center gap-1 ml-1 text-emerald-300">
                            <Award size={11} className="text-emerald-400"/> {training.certificationType.replace('Sertifikat ', '')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col flex-1 py-1 lg:py-2 md:pr-2">
                    <div className="mb-2.5">
                       <span className="text-[10px] lg:text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md w-max uppercase tracking-wider">{training.category}</span>
                    </div>
                    
                    <h3 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 mb-2 group-hover:text-amber-600 transition-colors leading-snug line-clamp-2">
                      {training.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 font-normal line-clamp-2 lg:line-clamp-3 leading-relaxed mb-6">
                      {training.description || 'Pelatihan ini dirancang untuk memberikan keterampilan praktis dan aplikatif kepada para peserta sesuai dengan kebutuhan industri saat ini.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto mb-6">
                       <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                           <UserCircle2 size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                         </div>
                         <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Instruktur</p>
                           <p className="text-xs lg:text-sm text-slate-700 font-bold truncate max-w-[150px] lg:max-w-[180px]">
                             {training.instructors?.map((i: any) => i.name).join(', ') || 'Tim Mentor KST'}
                           </p>
                         </div>
                       </div>

                       <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                           <Users size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                         </div>
                         <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Peserta</p>
                           <p className="text-xs lg:text-sm text-slate-700 font-bold">
                             {training.registeredCount || 0} Terdaftar
                           </p>
                         </div>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto">
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Biaya Investasi</p>
                         {training.isFree ? (
                           <p className="text-xl lg:text-2xl font-black text-emerald-600 leading-none tracking-tight">Gratis</p>
                         ) : (
                           <p className="text-xl lg:text-2xl font-black text-slate-900 leading-none tracking-tight">{formatRupiah(training.price)}</p>
                         )}
                       </div>
                       
                       <div className={`rounded-full px-5 py-2.5 w-full sm:w-auto flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs transition-all ${isFull ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 group-hover:bg-amber-500 text-white group-hover:shadow-md'}`}>
                         Lihat Detail <ArrowRight size={16} className={`ml-2 ${isFull ? '' : 'group-hover:translate-x-1 transition-transform'}`} />
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </SectionContainer>
  );
}