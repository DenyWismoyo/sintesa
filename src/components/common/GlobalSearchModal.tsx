// Lokasi file: src/components/common/GlobalSearchModal.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  ShoppingBag, 
  Building2, 
  GraduationCap, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  TrendingUp,
  Tag,
  CornerDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { catalogService } from '@/services/catalog.service';
import { assetService } from '@/services/asset.service';
import { trainingService } from '@/services/training.service';
import { formatRupiah } from '@/utils/format';

export type SearchCategoryFilter = 'all' | 'catalog' | 'asset' | 'training';

export interface SearchResultItem {
  id: string;
  title: string;
  category: string;
  type: 'catalog' | 'asset' | 'training';
  typeName: string;
  price?: number;
  image?: string;
  url: string;
  snippet?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchCategoryFilter>('all');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch data dari Master Cache (Functions) saat modal pertama kali dibuka
  useEffect(() => {
    if (!isOpen) return;

    // Auto focus ke input dengan delay aman
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const loadAllCachedData = async () => {
      if (items.length > 0) return;

      setLoading(true);
      try {
        const [catalogs, assets, trainings] = await Promise.allSettled([
          catalogService.getAllCatalogsCached(),
          assetService.getAssetCache(),
          trainingService.getTrainings(60)
        ]);

        const combined: SearchResultItem[] = [];

        // 1. Data Katalog (DIUBAH DARI 'Katalog Inovasi' MENJADI 'Katalog' SESUAI REQUEST)
        if (catalogs.status === 'fulfilled' && Array.isArray(catalogs.value)) {
          catalogs.value.forEach((c: any) => {
            if (c.isPublished !== false) {
              const cover = Array.isArray(c.images) && c.images.length > 0 
                ? c.images[0] 
                : c.coverImage;
              combined.push({
                id: c.id,
                title: c.name || 'Produk Katalog',
                category: c.category || 'Katalog',
                type: 'catalog',
                typeName: 'Katalog', // Sesuai permintaan user: Katalog Inovasi -> Katalog
                price: typeof c.price === 'number' ? c.price : undefined,
                image: cover,
                url: `/e-katalog/${c.id}`,
                snippet: c.shortDescription || c.description?.slice(0, 85)
              });
            }
          });
        }

        // 2. Data Sewa Ruangan / Fasilitas Aset
        if (assets.status === 'fulfilled' && Array.isArray(assets.value)) {
          assets.value.forEach((a: any) => {
            const cover = Array.isArray(a.images) && a.images.length > 0 
              ? a.images[0] 
              : a.coverImage;
            combined.push({
              id: a.id,
              title: a.name || 'Fasilitas Kawasan',
              category: a.category || 'Ruangan & Gedung',
              type: 'asset',
              typeName: 'Sewa Ruangan',
              price: typeof a.price === 'number' ? a.price : typeof a.rentalPrice === 'number' ? a.rentalPrice : undefined,
              image: cover,
              url: `/fasilitas/${a.id}`,
              snippet: a.location ? `Lokasi: ${a.location}` : a.description?.slice(0, 85)
            });
          });
        }

        // 3. Data Pelatihan Diklat
        if (trainings.status === 'fulfilled' && Array.isArray(trainings.value)) {
          trainings.value.forEach((t: any) => {
            combined.push({
              id: t.id,
              title: t.title || 'Program Pelatihan',
              category: t.category || 'Pelatihan Vokasi',
              type: 'training',
              typeName: 'Pelatihan',
              price: typeof t.price === 'number' ? t.price : 0,
              image: t.coverImage,
              url: `/program-pelatihan/${t.id}`,
              snippet: t.type ? `Format: ${t.type}` : t.description?.slice(0, 85)
            });
          });
        }

        setItems(combined);
      } catch (err) {
        console.error("Gagal memuat master cache untuk pencarian:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllCachedData();
  }, [isOpen]);

  // Filter hasil berdasarkan query dan kategori
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
      const matchFilter = activeFilter === 'all' || item.type === activeFilter;
      if (!matchFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.snippet && item.snippet.toLowerCase().includes(q))
      );
    });
  }, [items, query, activeFilter]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeFilter]);

  // Keyboard navigation (Escape, ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
      } else if (e.key === 'Enter') {
        if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
          e.preventDefault();
          const target = filteredResults[selectedIndex];
          onClose();
          router.push(target.url);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, router, onClose]);

  // Lock scroll background
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSelectItem = (url: string) => {
    onClose();
    router.push(url);
  };

  const getBadgeStyle = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'catalog':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'asset':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20';
      case 'training':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
    }
  };

  const getTypeIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'catalog':
        return <ShoppingBag size={12} className="text-emerald-600" />;
      case 'asset':
        return <Building2 size={12} className="text-sky-600" />;
      case 'training':
        return <GraduationCap size={12} className="text-amber-600" />;
      default:
        return <Tag size={12} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center p-3 sm:p-5 pt-8 sm:pt-14 md:pt-16">
          {/* Backdrop Blur Ultra Halus */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xl"
          />

          {/* Modal Container Elegan & Melengkung Mewah */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_30px_90px_-20px_rgba(15,23,42,0.3)] border border-slate-200/80 flex flex-col overflow-hidden max-h-[88vh] z-10"
          >
            {/* Ambient Accent Light Inside Modal */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-blue-100/50 rounded-full blur-[80px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-100/40 rounded-full blur-[80px] pointer-events-none -z-10" />

            {/* Search Input Bar Super Elegan */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100/80 bg-white/70">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Search size={18} strokeWidth={2.4} />
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk katalog, sewa ruangan, atau pelatihan..."
                className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X size={15} />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200/80 rounded-full transition-all shrink-0 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Quick Filter Tabs Horizontal Modern */}
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50/60 border-b border-slate-100/80 overflow-x-auto no-scrollbar">
              {[
                { key: 'all', label: 'Semua' },
                { key: 'catalog', label: '🛍️ Katalog', count: items.filter(i => i.type === 'catalog').length },
                { key: 'asset', label: '🏢 Sewa Ruangan', count: items.filter(i => i.type === 'asset').length },
                { key: 'training', label: '🎓 Pelatihan', count: items.filter(i => i.type === 'training').length },
              ].map((tab) => {
                const isActive = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key as SearchCategoryFilter)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white/80 border border-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Result List Area with Custom Scrollbar */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <Loader2 size={26} className="animate-spin text-blue-600" />
                  <p className="text-xs font-bold text-slate-500">Memuat master cache seluruh layanan...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                    <Search size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Layanan tidak ditemukan</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Tidak ditemukan data untuk kata kunci &ldquo;{query}&rdquo;. Coba gunakan istilah lain atau pilih kategori di atas.
                  </p>
                </div>
              ) : (
                <>
                  {!query && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">
                      <TrendingUp size={12} className="text-blue-600" />
                      <span>Rekomendasi Layanan Kawasan</span>
                    </div>
                  )}

                  {filteredResults.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelectItem(item.url)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`group flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/90 border border-blue-200/90 shadow-2xs'
                            : 'hover:bg-slate-50/80 border border-transparent'
                        }`}
                      >
                        {/* Thumbnail dengan Aspect Ratio Rapi */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 relative flex items-center justify-center">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="56px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-slate-400">
                              {getTypeIcon(item.type)}
                            </div>
                          )}
                        </div>

                        {/* Text Detail */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getBadgeStyle(item.type)}`}>
                              {getTypeIcon(item.type)}
                              <span>{item.typeName}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 truncate">
                              {item.category}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h4>

                          {item.snippet && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {item.snippet}
                            </p>
                          )}
                        </div>

                        {/* Price & Action */}
                        <div className="flex flex-col items-end shrink-0 pl-2">
                          {item.price !== undefined ? (
                            <span className={`text-xs font-black ${item.price === 0 ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
                              {item.price === 0 ? 'Gratis' : formatRupiah(item.price)}
                            </span>
                          ) : null}
                          <div className={`mt-1 flex items-center gap-1 text-[11px] font-bold transition-all ${
                            isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                          }`}>
                            <span className="hidden sm:inline">Buka</span>
                            <ArrowRight size={13} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer Shortcut Info */}
            <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" />
                <span>Terhubung Master Cache Kawasan</span>
              </span>
              <div className="hidden sm:flex items-center gap-3">
                <span>Gunakan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700">↓</kbd> navigasi</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 flex items-center gap-0.5"><CornerDownLeft size={10} /> Enter</kbd> pilih</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
