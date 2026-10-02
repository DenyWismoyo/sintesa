// Lokasi file: src/components/common/GlobalSearchModal.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
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
  Tag
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

    // Auto focus ke input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const loadAllCachedData = async () => {
      // Jika sudah ada data, tidak perlu re-fetch
      if (items.length > 0) return;

      setLoading(true);
      try {
        const [catalogs, assets, trainings] = await Promise.allSettled([
          catalogService.getAllCatalogsCached(),
          assetService.getAssetCache(),
          trainingService.getTrainings(60)
        ]);

        const combined: SearchResultItem[] = [];

        // 1. Proses Data Katalog
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
                typeName: 'Katalog Inovasi',
                price: typeof c.price === 'number' ? c.price : undefined,
                image: cover,
                url: `/e-katalog/${c.id}`,
                snippet: c.shortDescription || c.description?.slice(0, 90)
              });
            }
          });
        }

        // 2. Proses Data Sewa Ruangan / Fasilitas Aset
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
              snippet: a.location ? `Lokasi: ${a.location}` : a.description?.slice(0, 90)
            });
          });
        }

        // 3. Proses Data Pelatihan Diklat
        if (trainings.status === 'fulfilled' && Array.isArray(trainings.value)) {
          trainings.value.forEach((t: any) => {
            combined.push({
              id: t.id,
              title: t.title || 'Program Pelatihan',
              category: t.category || 'Pelatihan Vokasi',
              type: 'training',
              typeName: 'Program Pelatihan',
              price: typeof t.price === 'number' ? t.price : 0,
              image: t.coverImage,
              url: `/program-pelatihan/${t.id}`,
              snippet: t.type ? `Format: ${t.type}` : t.description?.slice(0, 90)
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
      if (!q) return true; // Tampilkan rekomendasi jika query masih kosong
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.snippet && item.snippet.toLowerCase().includes(q))
      );
    });
  }, [items, query, activeFilter]);

  // Reset selectedIndex saat hasil berubah
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'asset':
        return 'bg-sky-50 text-sky-700 border-sky-200/80';
      case 'training':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'catalog':
        return <ShoppingBag size={13} className="text-emerald-600" />;
      case 'asset':
        return <Building2 size={13} className="text-sky-600" />;
      case 'training':
        return <GraduationCap size={13} className="text-amber-600" />;
      default:
        return <Tag size={13} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center p-3 sm:p-4 md:p-6 pt-12 sm:pt-16 md:pt-20">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[85vh] z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 bg-white">
              <Search size={20} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk katalog, sewa ruangan, atau pelatihan..."
                className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
              >
                Tutup
              </button>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
                Sumber:
              </span>
              {[
                { key: 'all', label: 'Semua Layanan' },
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
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Result List Area with Custom Scrollbar */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 divide-y divide-slate-50">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2.5">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Mengambil data dari cache kawasan...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Search size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Tidak ada hasil ditemukan</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Tidak ditemukan produk, ruangan, atau pelatihan untuk kata kunci &ldquo;{query}&rdquo;. Silakan coba istilah lain.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {!query && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-2">
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
                        className={`group flex items-center gap-3 p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 border border-blue-200/80 shadow-2xs'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 relative flex items-center justify-center">
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
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${getBadgeStyle(item.type)}`}>
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
                            <span className="text-xs font-black text-slate-900">
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
                </div>
              )}
            </div>

            {/* Footer Shortcut Info */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" />
                <span>Terhubung langsung ke Master Cache Kawasan</span>
              </span>
              <div className="hidden sm:flex items-center gap-3">
                <span>Gunakan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700">↓</kbd> navigasi</span>
                <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700">Enter</kbd> pilih</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
