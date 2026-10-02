'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { getThumbnailUrl } from '@/lib/imageUtils';

export interface MobileImageGalleryProps {
  images: string[];
  title: string;
  onOpenLightbox?: (index: number) => void;
  className?: string;
}

export default function MobileImageGallery({
  images,
  title,
  onOpenLightbox,
  className = ''
}: MobileImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const total = images.length;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  // Keyboard navigation jika sedang fokus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
  };

  const handleError = (idx: number) => {
    setImgErrors(prev => ({ ...prev, [idx]: true }));
  };

  if (!images || images.length === 0) {
    return (
      <div className={`w-full aspect-video rounded-[1.75rem] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-slate-300 ${className}`}>
        <ImageIcon size={48} className="mb-2 opacity-30 text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Tanpa Media Visual</span>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} onKeyDown={handleKeyDown} tabIndex={0}>
      
      {/* --- 1. TAMPILAN MOBILE & TABLET (SWIPEABLE SLIDER / CAROUSEL - YouTube 16:9) --- */}
      <div className="block lg:hidden relative w-full aspect-video rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden bg-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] group">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full relative cursor-pointer"
            onClick={() => onOpenLightbox && onOpenLightbox(currentIndex)}
          >
            {!imgErrors[currentIndex] ? (
              <Image
                src={images[currentIndex]}
                alt={`${title} - Foto ${currentIndex + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 50vw"
                className="object-cover"
                priority={currentIndex === 0}
                onError={() => handleError(currentIndex)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                <ImageIcon size={40} className="opacity-40" />
                <span className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-60">Gagal Memuat</span>
              </div>
            )}
            
            {/* Scrim halus di bagian bawah gambar */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/40 via-slate-950/10 to-transparent pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Floating Counter Badge & Zoom Icon */}
        <div className="absolute bottom-3.5 right-3.5 z-20 flex items-center gap-2">
          {total > 1 && (
            <div className="bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 tracking-wider">
              <span>{currentIndex + 1}</span>
              <span className="text-slate-400 font-normal">/</span>
              <span className="text-slate-500">{total}</span>
            </div>
          )}
          {onOpenLightbox && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(currentIndex);
              }}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-slate-700 flex items-center justify-center shadow-sm hover:bg-white active:scale-95 transition-all"
              title="Perbesar Layar Penuh"
              aria-label="Perbesar Layar Penuh"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>

        {/* Panah Navigasi Sentuh Kiri / Kanan (Hanya jika foto > 1) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-slate-800 flex items-center justify-center shadow-md active:scale-90 transition-all opacity-80 hover:opacity-100"
              aria-label="Foto Sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-slate-800 flex items-center justify-center shadow-md active:scale-90 transition-all opacity-80 hover:opacity-100"
              aria-label="Foto Selanjutnya"
            >
              <ChevronRight size={18} />
            </button>

            {/* Pagination Dots di Bawah Tengah */}
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {images.slice(0, 7).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx 
                      ? 'w-5 bg-white shadow-xs' 
                      : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Ke foto ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* --- 2. TAMPILAN DESKTOP (AIRBNB CLEAN SPLIT GRID) --- */}
      <div className="hidden lg:block w-full h-[52vh] max-h-[540px] min-h-[420px] rounded-[2rem] overflow-hidden relative group bg-slate-100 shadow-[0_8px_30px_-6px_rgba(15,23,42,0.06)]">
        <div className="w-full h-full flex gap-3">
          
          {/* Gambar Utama (Kiri - 55%) */}
          <div 
            className="w-[55%] h-full cursor-zoom-in relative overflow-hidden group/main"
            onClick={() => onOpenLightbox && onOpenLightbox(0)}
          >
            {!imgErrors[0] ? (
              <Image
                src={images[0]}
                alt={title}
                fill
                sizes="(max-width: 1280px) 60vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover/main:scale-105"
                priority
                onError={() => handleError(0)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                <ImageIcon size={48} className="opacity-40" />
                <span className="text-xs uppercase font-bold tracking-widest mt-2">Gambar Tidak Tersedia</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/main:opacity-100 transition-opacity" />
          </div>

          {/* Grid Gambar Kecil (Kanan - 45%) */}
          <div className="w-[45%] h-full grid grid-cols-2 grid-rows-2 gap-3">
            {images.slice(1, 5).map((img, idx) => {
              const actualIdx = idx + 1;
              return (
                <div 
                  key={actualIdx} 
                  className="w-full h-full relative cursor-zoom-in overflow-hidden group/item bg-slate-100"
                  onClick={() => onOpenLightbox && onOpenLightbox(actualIdx)}
                >
                  {!imgErrors[actualIdx] ? (
                    <Image
                      src={getThumbnailUrl(img)}
                      alt={`${title} - Thumbnail ${actualIdx}`}
                      fill
                      sizes="25vw"
                      className="object-cover transition-transform duration-700 group-hover/item:scale-105"
                      onError={() => handleError(actualIdx)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={24} className="opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover/item:bg-black/15 transition-colors" />

                  {/* Overlay "+X Foto Lainnya" pada slot ke-4 jika foto > 5 */}
                  {idx === 3 && total > 5 && (
                    <div className="absolute inset-0 bg-slate-950/60 hover:bg-slate-950/70 transition-colors flex items-center justify-center backdrop-blur-xs">
                      <span className="text-white font-black text-base flex items-center gap-2">
                        <ImageIcon size={18} /> +{total - 5} Foto
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Placeholder jika foto kurang dari 5 */}
            {Array.from({ length: Math.max(0, 4 - (total - 1)) }).map((_, i) => (
              <div key={`empty-${i}`} className="w-full h-full bg-slate-50/80 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-200" />
              </div>
            ))}
          </div>

        </div>

        {/* Tombol Lihat Semua Foto di Pojok Kanan Bawah */}
        {total > 1 && onOpenLightbox && (
          <button 
            type="button"
            onClick={() => onOpenLightbox(0)}
            className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-md border-0 font-bold shadow-lg hover:bg-white text-slate-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <ImageIcon className="w-4 h-4 text-slate-600" /> 
            <span>Tampilkan semua ({total} foto)</span>
          </button>
        )}

      </div>

    </div>
  );
}
