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
    <div className={`w-full select-none ${className}`} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* --- 1. MAIN HERO VIEWER (STANDAR 16:9 DI DESKTOP MAUPUN HP) --- */}
      <div className="relative -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full aspect-video rounded-none sm:rounded-3xl overflow-hidden bg-slate-100 border-0 sm:border sm:border-slate-200/80 shadow-none sm:shadow-sm group">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full relative cursor-zoom-in"
            onClick={() => onOpenLightbox && onOpenLightbox(currentIndex)}
          >
            {!imgErrors[currentIndex] ? (
              <Image
                src={images[currentIndex]}
                alt={`${title} - Foto ${currentIndex + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
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
            
            {/* Subtle Gradient Scrim at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Floating Controls: Counter & Fullscreen Zoom Button */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex items-center gap-2">
          {total > 1 && (
            <div className="bg-slate-950/70 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 tracking-wider border border-white/10">
              <span>{currentIndex + 1}</span>
              <span className="text-white/40 font-normal">/</span>
              <span>{total}</span>
            </div>
          )}
          {onOpenLightbox && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(currentIndex);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/70 backdrop-blur-md text-white flex items-center justify-center shadow-sm hover:bg-slate-900 border border-white/10 active:scale-95 transition-all"
              title="Perbesar Layar Penuh"
              aria-label="Perbesar Layar Penuh"
            >
              <Maximize2 size={15} />
            </button>
          )}
        </div>

        {/* Panah Navigasi Kiri & Kanan (Hanya jika total foto > 1) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md active:scale-90 transition-all opacity-80 group-hover:opacity-100"
              aria-label="Foto Sebelumnya"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md active:scale-90 transition-all opacity-80 group-hover:opacity-100"
              aria-label="Foto Selanjutnya"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* --- 2. THUMBNAIL CAROUSEL STRIP (RASIO 16:9 KONSISTEN) --- */}
      {total > 1 && (
        <div className="mt-3 sm:mt-4 flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-20 sm:w-28 md:w-32 aspect-video rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                currentIndex === idx
                  ? 'border-sky-600 ring-2 ring-sky-500/25 scale-102 sm:scale-105 shadow-sm'
                  : 'border-slate-200/90 opacity-60 hover:opacity-100 hover:border-slate-300'
              }`}
              aria-label={`Pilih foto ${idx + 1}`}
            >
              <Image
                src={getThumbnailUrl(img)}
                alt={`${title} - Thumbnail ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 80px, 128px"
                className="object-cover"
              />
            </button>
          ))}

          {/* Quick Lightbox Action Button */}
          {onOpenLightbox && (
            <button
              type="button"
              onClick={() => onOpenLightbox(0)}
              className="h-11 sm:h-14 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold shrink-0 flex items-center gap-2 transition-all"
            >
              <ImageIcon size={16} className="text-slate-500" />
              <span>Semua ({total})</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
