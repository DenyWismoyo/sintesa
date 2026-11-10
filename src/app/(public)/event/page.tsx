'use client';

import React, { useMemo, useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { Calendar, MapPin, ArrowRight, Sparkles, Loader2, Users, Monitor, Ticket, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';

import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { PublicFeaturedBanner, PublicPagination } from '@/components/public';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 24 } }
};

export default function EventPage() {
  const { events, loading, error } = useEvents();
  const [activeCategory, setActiveCategory] = useState('Semua Kategori');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Publik
  const publicEvents = useMemo(() => {
    return events.filter(e => e.isPublished === true);
  }, [events]);

  // Kategori Dinamis
  const dynamicCategories = useMemo(() => {
    const cats = new Set(publicEvents.map(e => e.type).filter(Boolean));
    return ['Semua Kategori', ...Array.from(cats)];
  }, [publicEvents]);

  // Filter berdasarkan Kategori & Pencarian
  const filteredEvents = useMemo(() => {
    return publicEvents.filter(e => {
      const matchCategory = activeCategory === 'Semua Kategori' || e.type === activeCategory;
      const matchSearch = e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [publicEvents, activeCategory, searchTerm]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // Hero Event (1 Teratas)
  const heroEvent = useMemo(() => {
    return publicEvents.find(e => e.status === 'Ongoing' || e.status === 'Upcoming') || publicEvents[0];
  }, [publicEvents]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Ongoing': return <StatusBadge status="LIVE NOW" variant="danger" pulse={true} size="sm" />;
      case 'Upcoming': return <StatusBadge status="SEGERA HADIR" variant="warning" size="sm" />;
      case 'Completed': return <StatusBadge status="SELESAI" variant="default" size="sm" />;
      default: return null;
    }
  };

  const getPriceDisplay = (event: any) => {
    if (event.ticketingTiers && event.ticketingTiers.length > 0) {
      const prices = event.ticketingTiers.map((t: any) => t.price);
      const minPrice = Math.min(...prices);
      if (minPrice === 0) return <StatusBadge status="Mulai dari GRATIS" variant="success" size="sm" icon={<Ticket size={11}/>} />;
      return <StatusBadge status={`Mulai Rp ${minPrice.toLocaleString('id-ID')}`} variant="info" size="sm" icon={<Ticket size={11}/>} />;
    }
    return <StatusBadge status={event.isFree ? 'GRATIS' : 'BERBAYAR'} variant={event.isFree ? 'success' : 'amber'} size="sm" />;
  };

  if (error) {
    return (
      <SectionContainer accent="violet">
        <div className="text-center text-rose-600 py-16 bg-rose-50 rounded-2xl max-w-2xl mx-auto font-medium">
          Gagal memuat event: {error}
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer accent="violet">
      {/* PageHero Terpadu */}
      <PageHero 
        breadcrumbs={[{ label: 'Event', href: '/event' }]}
        badge={{ label: 'Agenda & Acara Publik', icon: <CalendarDays size={13} />, variant: 'purple' }}
        title="Agenda & Acara Teknologi"
        subtitle="Ikuti berbagai seminar, lokakarya, dan pameran teknologi terbaru yang diselenggarakan di ekosistem Solo Technopark."
        accentColor="violet"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama acara atau topik..."
        isLoadingSearch={loading}
      />

      {/* Filter Kategori Diklat Menggunakan PillTabs */}
      <div className="mb-6">
        <PillTabs
          tabs={dynamicCategories.map(cat => ({ key: cat, label: cat }))}
          active={activeCategory}
          onChange={(cat) => setActiveCategory(cat)}
          layoutId="activeCategoryEvent"
          ariaLabel="Filter Kategori Event"
        />
      </div>

      <div className="w-full min-h-[50vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400">
             <Loader2 size={36} className="animate-spin mb-3 text-indigo-500" />
             <p className="font-medium text-xs sm:text-sm">Menyiapkan kalender acara interaktif...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState 
            icon={CalendarDays}
            title="Acara Tidak Ditemukan"
            description="Tidak ada acara yang dijadwalkan untuk kategori atau kata kunci pencarian tersebut saat ini."
            actionLabel="Reset Pencarian"
            onAction={() => { setSearchTerm(''); setActiveCategory('Semua Kategori'); }}
          />
        ) : (
          <>
            {/* HERO EVENT SPOTLIGHT DENGAN PUBLIC FEATURED BANNER */}
            {heroEvent && searchTerm === '' && activeCategory === 'Semua Kategori' && (
              <PublicFeaturedBanner
                tag="Sorotan Acara"
                badge={
                  heroEvent.status === 'Ongoing' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 backdrop-blur-md text-rose-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/30">
                      <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" /> Live Now
                    </span>
                  ) : undefined
                }
                title={heroEvent.title}
                description={
                  heroEvent.description
                    ? heroEvent.description.replace(/<[^>]*>?/gm, '')
                    : 'Bergabunglah dengan rangkaian acara eksklusif KST untuk membentuk masa depan teknologi dan inovasi.'
                }
                imageUrl={heroEvent.imageUrl}
                accent="violet"
                metadata={[
                  {
                    icon: <Calendar size={14} className="text-violet-300" />,
                    label: heroEvent.date,
                  },
                  {
                    icon: heroEvent.isOnline ? (
                      <Monitor size={14} className="text-emerald-300" />
                    ) : (
                      <MapPin size={14} className="text-amber-300" />
                    ),
                    label: heroEvent.isOnline ? 'Virtual (Online)' : heroEvent.location || 'Kawasan STP',
                  },
                ]}
                actionLabel={
                  heroEvent.status !== 'Completed'
                    ? heroEvent.registrationType === 'EXTERNAL'
                      ? 'Daftar di Platform Luar'
                      : 'Daftar Sekarang'
                    : 'Lihat Dokumentasi Acara'
                }
                actionHref={`/event/${heroEvent.id}`}
              />
            )}

            {/* EVENTS GRID */}
            <motion.div className="public-grid-4" variants={containerVariants} initial="hidden" animate="visible">
              <AnimatePresence>
                {paginatedEvents.map((event) => (
                  <motion.div 
                    key={event.id} 
                    variants={itemVariants} 
                    layoutId={`event-${event.id}`} 
                    className="public-card public-card-hover group flex flex-col overflow-hidden relative"
                  >
                     <div className="public-card-media aspect-video">
                        {event.imageUrl ? (
                          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 group-hover:scale-105 transition-transform duration-700" />
                        )}
                        <div className="public-card-scrim" />
                        
                        {/* Floating Badges */}
                        <div className="public-card-badge-top-left flex flex-col gap-1.5">
                          {getStatusBadge(event.status || 'Draft')}
                        </div>
                        
                        <div className="public-card-badge-top-right bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-xs">
                          {event.type}
                        </div>
                     </div>
                     
                     <div className="public-card-body">
                        <div className="flex items-center justify-between mb-3">
                           {getPriceDisplay(event)}
                           {event.speakers && event.speakers.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                <Users size={11} /> {event.speakers.length} Pembicara
                              </div>
                           )}
                        </div>
                        
                        <h3 className="public-card-title group-hover:text-indigo-600 mb-2">{event.title}</h3>
                        
                        <div className="space-y-1.5 pt-2 mb-4">
                          <div className="public-card-meta">
                            <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Calendar size={11} /></div>
                            <span className="truncate">{event.date} • {event.time}</span>
                          </div>
                          <div className="public-card-meta">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${event.isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {event.isOnline ? <Monitor size={11}/> : <MapPin size={11} />}
                            </div>
                            <span className="truncate">{event.isOnline ? 'Platform Virtual' : event.location}</span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="public-card-footer">
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                            Lihat Detail Event &rarr;
                          </span>
                        </div>
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Standar Pagination Publik Terpadu */}
            <PublicPagination
              currentPage={currentPage}
              totalItems={filteredEvents.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              mode="hybrid"
            />
          </>
        )}
      </div>
    </SectionContainer>
  );
}