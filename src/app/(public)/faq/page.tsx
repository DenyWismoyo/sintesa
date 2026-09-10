'use client';

import React, { useState, useMemo } from 'react';
import { useFaqs } from '@/hooks/useFaqs';
import { ChevronDown, Loader2, HelpCircle, ThumbsUp, ThumbsDown, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';

export default function FAQPage() {
  const { faqs, loading, error } = useFaqs();
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [votedItems, setVotedItems] = useState<Record<string, 'up' | 'down'>>({});

  // Filter Publik
  const publicFaqs = useMemo(() => {
    return faqs.filter(faq => faq.targetAudience === 'ALL' || faq.targetAudience === 'PUBLIC');
  }, [faqs]);

  // Kategori Dinamis
  const dynamicCategories = useMemo<string[]>(() => {
    const cats = new Set<string>();
    publicFaqs.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    return ['Semua', ...Array.from(cats)];
  }, [publicFaqs]);

  // Urutkan & Filter berdasarkan Pencarian
  const filteredAndSortedFaqs = useMemo(() => {
    let filtered = publicFaqs;
    
    if (activeCategory !== 'Semua') {
      filtered = filtered.filter(f => f.category === activeCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
      
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [publicFaqs, activeCategory, searchTerm]);

  const handleVote = (faqId: string, type: 'up' | 'down') => {
    if (votedItems[faqId]) return; 
    setVotedItems(prev => ({ ...prev, [faqId]: type }));
  };

  if (error) {
    return (
      <SectionContainer accent="sky">
        <div className="text-center text-rose-500 py-16 public-card max-w-2xl mx-auto">
          Gagal memuat pusat bantuan: {error}
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer accent="sky">
      {/* Header Reusable PageHero */}
      <PageHero 
        breadcrumbs={[{ label: 'Pusat Bantuan', href: '/faq' }]}
        badge={{ label: 'Knowledge Base & Edukasi', icon: <HelpCircle size={13} />, variant: 'sky' }}
        title="Pusat Bantuan & FAQ"
        subtitle="Temukan jawaban cepat untuk pertanyaan umum seputar layanan, peminjaman aset, pelatihan vokasi, dan program inkubasi Solo Technopark."
        accentColor="sky"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari pertanyaan atau kata kunci..."
        isLoadingSearch={loading}
      />

      {/* Filter Kategori Animatif Menggunakan PillTabs */}
      <div className="mb-8">
        <PillTabs
          tabs={dynamicCategories.map(cat => ({ key: cat, label: cat }))}
          active={activeCategory}
          onChange={(cat) => setActiveCategory(cat)}
          layoutId="activeCategoryFAQ"
          ariaLabel="Filter Kategori FAQ"
        />
      </div>

      {/* Accordion Area */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <Loader2 size={36} className="animate-spin mb-3 text-sky-500" />
             <p className="font-medium text-xs sm:text-sm">Menyiapkan pangkalan pengetahuan...</p>
          </div>
        ) : filteredAndSortedFaqs.length === 0 ? (
          <EmptyState 
            icon={HelpCircle}
            title="Pertanyaan Tidak Ditemukan"
            description="Kami belum memiliki artikel yang sesuai dengan pencarian atau filter kategori Anda saat ini."
            actionLabel="Reset Pencarian"
            onAction={() => { setSearchTerm(''); setActiveCategory('Semua'); }}
          />
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            <AnimatePresence>
              {filteredAndSortedFaqs.map(faq => {
                const isOpen = openItem === faq.id;
                return (
                  <motion.div 
                    key={faq.id} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="public-accordion-card"
                  >
                    <button 
                      className={`public-accordion-trigger ${isOpen ? 'text-sky-600' : ''}`}
                      onClick={() => setOpenItem(isOpen ? null : faq.id!)}
                    >
                      <div className="flex items-center gap-3 pr-4">
                        {faq.isPinned && (
                          <span title="Disematkan di Beranda" className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 shrink-0">
                            <Pin size={15} className="text-amber-500 fill-amber-500" />
                          </span>
                        )}
                        <span className="leading-snug">{faq.question}</span>
                      </div>
                      <motion.div 
                        animate={{ rotate: isOpen ? 180 : 0 }} 
                        transition={{ duration: 0.25 }} 
                        className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                      >
                        <ChevronDown size={16} />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="public-accordion-content"
                        >
                          <div className="w-full h-px bg-slate-100 mb-4" />
                          
                          <div 
                            className="leading-relaxed prose prose-sm max-w-none prose-a:text-sky-600 hover:prose-a:text-sky-700"
                            dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\n/g, '<br/>') }}
                          />
                          
                          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                             <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-widest">
                               {faq.category}
                             </span>

                             <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-400 font-semibold text-[11px]">Bermanfaat?</span>
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => handleVote(faq.id!, 'up')}
                                    disabled={!!votedItems[faq.id!]}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${votedItems[faq.id!] === 'up' ? 'bg-emerald-100 text-emerald-700 shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50'}`}
                                  >
                                    <ThumbsUp size={13} className={votedItems[faq.id!] === 'up' ? 'fill-emerald-600' : ''} />
                                  </button>
                                  <button 
                                    onClick={() => handleVote(faq.id!, 'down')}
                                    disabled={!!votedItems[faq.id!]}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${votedItems[faq.id!] === 'down' ? 'bg-rose-100 text-rose-700 shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50'}`}
                                  >
                                    <ThumbsDown size={13} className={votedItems[faq.id!] === 'down' ? 'fill-rose-600' : ''} />
                                  </button>
                                </div>
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}