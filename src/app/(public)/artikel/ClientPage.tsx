'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useArticles } from '@/hooks/useArticles';
import { ArticleCategory } from '@/types';
import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import { 
  Newspaper, Clock, Calendar, ArrowRight, Eye, 
  Sparkles, GraduationCap, Store, Building2, MessageCircle, 
  Tag, Image as ImageIcon, BookOpen
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'Semua',
  'Panduan Pelatihan',
  'Berita & Event',
  'Inovasi & Teknologi',
  'Fasilitas & Bisnis',
  'Profil Tenant'
];

export default function ArtikelListClient() {
  const { articles, loading } = useArticles({ publishedOnly: true });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Filter artikel
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (art.tags && art.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchCategory = selectedCategory === 'Semua' || art.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [articles, searchTerm, selectedCategory]);

  const renderCtaBadge = (type?: string) => {
    switch(type) {
      case 'TRAINING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
            <GraduationCap size={11} className="text-amber-600" /> Info Pelatihan
          </span>
        );
      case 'CATALOG':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            <Store size={11} className="text-emerald-600" /> Katalog Layanan
          </span>
        );
      case 'FACILITY':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
            <Building2 size={11} className="text-blue-600" /> Info Fasilitas
          </span>
        );
      case 'WHATSAPP':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-[#25D366]/15 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            <MessageCircle size={11} className="text-[#1EBE5D]" /> Konsultasi CS
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <SectionContainer accent="amber" containerClassName="!px-3 sm:!px-6 md:!px-8">
      {/* Header Reusable PageHero */}
      <PageHero 
        breadcrumbs={[{ label: 'Artikel & Warta', href: '/artikel' }]}
        badge={{ label: 'Warta & Edukasi STP', icon: <Newspaper size={13} />, variant: 'amber' }}
        title="Warta, Berita & Panduan Edukasi"
        subtitle="Pelajari kurikulum program pelatihan, panduan fasilitas teknologi, dan kabar inovasi kawasan terkini sebelum Anda bergabung atau melakukan reservasi."
        accentColor="amber"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari berita, ulasan program, atau topik panduan..."
        isLoadingSearch={loading}
      />

      {/* Filter Kategori Animatif (Pills) Standar */}
      <div className="mb-8">
        <PillTabs
          tabs={CATEGORIES.map(cat => ({ key: cat, label: cat }))}
          active={selectedCategory}
          onChange={(cat) => setSelectedCategory(cat)}
          layoutId="artikel-pill-tab"
          ariaLabel="Filter Kategori Artikel"
        />
      </div>

      {/* Grid Konten Artikel */}
      <div className="min-h-[50vh]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-2xl sm:rounded-3xl p-4 border border-slate-200/80 space-y-3 animate-pulse">
                <div className="w-full h-44 sm:h-48 bg-slate-200 rounded-xl sm:rounded-2xl" />
                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
                <div className="h-4 w-full bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-md mx-auto my-8">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-black text-slate-800 mb-1">Belum Ada Artikel Ditemukan</h3>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              {searchTerm ? `Tidak ditemukan artikel untuk kata kunci "${searchTerm}". Silakan coba kata kunci lain.` : 'Nantikan kabar dan panduan edukasi terbaru dari tim humas Solo Technopark.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence>
              {filteredArticles.map(article => {
                const hasCta = article.cta && article.cta.type !== 'NONE';
                const formattedDate = article.publishedAt 
                  ? new Date(article.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : (article.createdAt ? new Date(article.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

                return (
                  <motion.article 
                    key={article.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group relative"
                  >
                    {/* Media Cover Image */}
                    <Link href={`/artikel/${article.id}`} className="block w-full h-44 sm:h-48 bg-slate-100 relative overflow-hidden shrink-0">
                      {article.coverImageUrl ? (
                        <img 
                          src={article.coverImageUrl} 
                          alt={article.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                          <ImageIcon size={36} className="opacity-40 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Solo Technopark</span>
                        </div>
                      )}

                      {/* Badges Top Left & Right */}
                      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                        <Badge className="bg-white/95 text-slate-800 text-[10px] font-black uppercase tracking-wider backdrop-blur-md border-0 shadow-xs">
                          {article.category}
                        </Badge>
                      </div>

                      <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[10px] font-semibold flex items-center gap-1">
                        <Clock size={11} /> {article.readTimeMins} mnt baca
                      </div>
                    </Link>

                    {/* Article Body */}
                    <div className="p-4 sm:p-6 flex flex-col flex-1 bg-white">
                      
                      {/* Meta Top: Tanggal & Penulis */}
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mb-2">
                        {formattedDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" /> {formattedDate}
                          </span>
                        )}
                        <span>•</span>
                        <span className="truncate max-w-[130px]">{article.authorName}</span>
                      </div>

                      {/* Judul Artikel */}
                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug mb-2 group-hover:text-amber-600 transition-colors">
                        <Link href={`/artikel/${article.id}`}>
                          {article.title}
                        </Link>
                      </h3>

                      {/* Excerpt Cuplikan */}
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mb-4 line-clamp-3 flex-1">
                        {article.excerpt}
                      </p>

                      {/* Smart CTA Preview Badge (Jika artikel memiliki CTA) */}
                      {hasCta && (
                        <div className="mb-4">
                          {renderCtaBadge(article.cta?.type)}
                        </div>
                      )}

                      {/* Footer Link: Baca Selengkapnya */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <Link 
                          href={`/artikel/${article.id}`} 
                          className="inline-flex items-center text-xs font-bold text-amber-600 group-hover:text-amber-700 group-hover:translate-x-1 transition-all"
                        >
                          Baca Ulasan Lengkap <ArrowRight size={13} className="ml-1.5" />
                        </Link>

                        {article.viewCount !== undefined && article.viewCount > 0 && (
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Eye size={12} /> {article.viewCount}
                          </span>
                        )}
                      </div>

                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </SectionContainer>
  );
}
