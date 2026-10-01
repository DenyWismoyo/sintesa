// Lokasi file: src/components/admin/ArticleImagePickerModal.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { useTraining } from '@/hooks/useTraining';
import { useCatalog } from '@/hooks/useCatalog';
import { useAssets } from '@/hooks/useAssets';
import { 
  X, Search, GraduationCap, Store, Building2, 
  Check, Image as ImageIcon, ExternalLink, Sparkles 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface SelectedMasterImage {
  url: string;
  sourceType: 'TRAINING' | 'CATALOG' | 'FACILITY';
  sourceId: string;
  sourceTitle: string;
  suggestedDescription?: string;
  targetUrl?: string;
  targetBadge?: string;
}

interface ArticleImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (selected: SelectedMasterImage) => void;
}

export default function ArticleImagePickerModal({
  isOpen,
  onClose,
  onSelectImage,
}: ArticleImagePickerModalProps) {
  const [activeTab, setActiveTab] = useState<'TRAINING' | 'CATALOG' | 'FACILITY'>('TRAINING');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data dari hooks
  const { trainings = [], loading: loadingTraining } = useTraining();
  const { products = [], loading: loadingCatalog } = useCatalog();
  const { assets = [], loading: loadingAssets } = useAssets();

  // Ekstrak list gambar dari Pelatihan
  const trainingItems = useMemo(() => {
    return trainings
      .filter(t => Boolean(t.imageUrl))
      .map(t => ({
        id: t.id || '',
        title: t.title,
        category: t.category || 'Pelatihan',
        imageUrl: t.imageUrl as string,
        priceDisplay: t.isFree ? 'Gratis' : `Rp ${t.price.toLocaleString('id-ID')}`,
        targetUrl: `/program-pelatihan/${t.slug || t.id}`,
        targetBadge: t.level || 'Resmi',
        description: t.description?.substring(0, 120),
      }));
  }, [trainings]);

  // Ekstrak list gambar dari Katalog
  const catalogItems = useMemo(() => {
    return products
      .filter(p => Boolean(p.coverImage || (p.images && p.images.length > 0)))
      .map(p => ({
        id: p.id || '',
        title: p.name,
        category: p.category || 'Katalog',
        imageUrl: (p.coverImage || (p.images && p.images[0])) as string,
        priceDisplay: p.price ? `Rp ${p.price.toLocaleString('id-ID')}` : 'Hubungi Kami',
        targetUrl: `/e-katalog/${p.id}`,
        targetBadge: p.ownerType === 'TENANT' ? 'Tenant STP' : 'Internal STP',
        description: p.shortDescription || p.description?.substring(0, 120),
      }));
  }, [products]);

  // Ekstrak list gambar dari Fasilitas (Assets)
  const assetItems = useMemo(() => {
    return assets
      .filter(a => Boolean(a.imageUrl || (a.galleryUrls && a.galleryUrls.length > 0)))
      .map(a => ({
        id: a.id || '',
        title: a.name,
        category: a.category || 'Fasilitas',
        imageUrl: (a.imageUrl || (a.galleryUrls && a.galleryUrls[0])) as string,
        priceDisplay: a.isRentable && a.priceValue ? `Rp ${a.priceValue.toLocaleString('id-ID')}` : 'Tersedia',
        targetUrl: `/fasilitas`,
        targetBadge: a.condition || 'Tersedia',
        description: a.description || `${a.location || 'Kawasan STP'} • Kapasitas: ${a.capacity || '-'} orang`,
      }));
  }, [assets]);

  // Filter items berdasarkan tab aktif dan search query
  const currentItems = useMemo(() => {
    let list: Array<{
      id: string;
      title: string;
      category: string;
      imageUrl: string;
      priceDisplay: string;
      targetUrl: string;
      targetBadge: string;
      description?: string;
    }> = [];

    if (activeTab === 'TRAINING') list = trainingItems;
    if (activeTab === 'CATALOG') list = catalogItems;
    if (activeTab === 'FACILITY') list = assetItems;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q)
    );
  }, [activeTab, trainingItems, catalogItems, assetItems, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full mb-1">
              <Sparkles size={12} className="text-amber-600" />
              Integrasi Gambar Master Data
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Pilih Gambar dari Pelatihan, Katalog, atau Fasilitas
            </h3>
            <p className="text-xs text-slate-500">
              Pilih gambar yang sudah ada di sistem agar konten artikel serasi dan relevan.
            </p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Tutup"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector & Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('TRAINING')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'TRAINING' 
                    ? 'bg-white text-amber-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap size={15} />
                <span>Pelatihan ({trainingItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CATALOG')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'CATALOG' 
                    ? 'bg-white text-emerald-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store size={15} />
                <span>Katalog ({catalogItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('FACILITY')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'FACILITY' 
                    ? 'bg-white text-blue-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 size={15} />
                <span>Fasilitas ({assetItems.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder={`Cari nama ${activeTab === 'TRAINING' ? 'pelatihan' : activeTab === 'CATALOG' ? 'katalog' : 'fasilitas'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-400 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Grid Gambar */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[300px]">
          {(loadingTraining || loadingCatalog || loadingAssets) ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Memuat pustaka gambar...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ImageIcon size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Tidak ada gambar ditemukan</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba gunakan kata kunci pencarian yang berbeda atau pilih tab sumber data lainnya.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currentItems.map((item) => (
                <div 
                  key={item.id}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 hover:border-amber-400 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200"
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-video bg-slate-100 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <Badge className="text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 border-none shadow-xs">
                        {item.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Info Ringkas */}
                  <div className="p-3.5 flex flex-col flex-1">
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1 mb-1 group-hover:text-amber-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {item.description || item.priceDisplay}
                    </p>

                    <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-700">
                        {item.priceDisplay}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          onSelectImage({
                            url: item.imageUrl,
                            sourceType: activeTab,
                            sourceId: item.id,
                            sourceTitle: item.title,
                            suggestedDescription: item.description,
                            targetUrl: item.targetUrl,
                            targetBadge: item.targetBadge,
                          });
                          onClose();
                        }}
                        className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-1 shadow-xs"
                      >
                        <Check size={13} />
                        Pilih Gambar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {currentItems.length} item dengan gambar</span>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl text-xs font-semibold"
          >
            Batal
          </Button>
        </div>

      </div>
    </div>
  );
}
