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
            {/* HERO EVENT SECTION */}
            {heroEvent && searchTerm === '' && activeCategory === 'Semua Kategori' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="-mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full bg-slate-900 rounded-none sm:rounded-[2rem] p-5 sm:p-8 md:p-12 mb-8 sm:mb-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group shadow-none sm:shadow-xl">
                 {heroEvent.imageUrl && (
                   <img src={heroEvent.imageUrl} alt={heroEvent.title} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 group-hover:opacity-40 transition-all duration-700 ease-out mix-blend-overlay" />
                 )}
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                 
                 <div className="relative z-10 max-w-2xl">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md text-indigo-200 rounded-full text-[10px] font-black uppercase tracking-widest">Sorotan Acara</span>
                      {heroEvent.status === 'Ongoing' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 backdrop-blur-md text-rose-300 rounded-full text-[10px] font-black uppercase tracking-widest"><span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" /> Live Now</span>}
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tight">{heroEvent.title}</h2>
                    
                    <p className="text-slate-300 mb-6 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-3 font-normal">
                      {heroEvent.description ? heroEvent.description.replace(/<[^>]*>?/gm, '') : 'Bergabunglah dengan rangkaian acara eksklusif KST untuk membentuk masa depan teknologi dan inovasi.'}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mb-8">
                       <div className="flex items-center gap-2 text-slate-200 text-xs sm:text-sm font-semibold bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
                         <Calendar size={15} className="text-indigo-300" /> {heroEvent.date}
                       </div>
                       <div className="flex items-center gap-2 text-slate-200 text-xs sm:text-sm font-semibold bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
                         {heroEvent.isOnline ? <Monitor size={15} className="text-emerald-300" /> : <MapPin size={15} className="text-amber-300" />} 
                         {heroEvent.isOnline ? 'Virtual (Online)' : heroEvent.location}
                       </div>
                    </div>
                    
                    {heroEvent.status !== 'Completed' ? (
                      <Link 
                        href={`/event/${heroEvent.id}`} 
                        className="px-6 py-3 bg-white text-slate-900 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-md inline-flex items-center gap-2 hover:scale-105 active:scale-95"
                      >
                        {heroEvent.registrationType === 'EXTERNAL' ? 'Daftar di Platform Luar' : 'Daftar Sekarang'} <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <Link 
                        href={`/event/${heroEvent.id}`} 
                        className="px-6 py-3 bg-slate-800 text-white rounded-full text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-slate-700 transition-all inline-flex items-center gap-2"
                      >
                        Lihat Dokumentasi Acara <ArrowRight size={16} />
                      </Link>
                    )}
                 </div>

                 {!heroEvent.imageUrl && (
                   <div className="relative z-10 w-full md:w-72 aspect-[4/3] bg-white/10 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center">
                      <Sparkles size={48} className="mx-auto mb-3 text-white/40" />
                      <p className="font-black text-xl text-white text-center px-4 leading-tight">{heroEvent.type}</p>
                   </div>
                 )}
              </motion.div>
            )}

            {/* EVENTS GRID */}
            <motion.div className="public-grid-4" variants={containerVariants} initial="hidden" animate="visible">
              <AnimatePresence>
                {filteredEvents.map((event) => (
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

                        {/* Card Footer with Action Button */}
                        <div className="public-card-footer">
                          <span className="text-xs font-semibold text-slate-400">Selengkapnya</span>
                          <Link 
                            href={`/event/${event.id}`}
                            className="public-card-action-btn"
                          >
                            <ArrowRight size={17} />
                          </Link>
                        </div>
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </SectionContainer>
  );
}