'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

export type PublicActionAccent = 'emerald' | 'sky' | 'amber' | 'indigo' | 'violet' | 'slate';

export interface PublicStickyBottomActionProps {
  title: string;
  priceDisplay?: React.ReactNode;
  subtitle?: string;
  imageUrl?: string;
  badgeText?: string;
  ctaText: string;
  onCtaClick: () => void;
  accent?: PublicActionAccent;
  isLoading?: boolean;
  disabled?: boolean;
  secondaryAction?: React.ReactNode;
  // Jika mobileOnly=true (default), hanya muncul di layar < 640px (sm:hidden)
  // Jika mobileOnly=false, muncul di semua layar saat scroll > threshold
  mobileOnly?: boolean;
  scrollThreshold?: number;
  className?: string;
}

const ACCENT_STYLES: Record<PublicActionAccent, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/25',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25',
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25',
  violet: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/25',
  slate: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/25',
};

export function PublicStickyBottomAction({
  title,
  priceDisplay,
  subtitle,
  imageUrl,
  badgeText,
  ctaText,
  onCtaClick,
  accent = 'emerald',
  isLoading = false,
  disabled = false,
  secondaryAction,
  mobileOnly = true,
  scrollThreshold = 250,
  className = '',
}: PublicStickyBottomActionProps) {
  const [isVisible, setIsVisible] = useState(mobileOnly);

  useEffect(() => {
    if (mobileOnly) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > scrollThreshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileOnly, scrollThreshold]);

  const buttonClass = ACCENT_STYLES[accent] || ACCENT_STYLES.emerald;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] py-2.5 px-4 sm:px-6 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] ${
            mobileOnly ? 'sm:hidden' : ''
          } ${className}`}
        >
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
            
            {/* Sisi Kiri: Thumbnail & Ringkasan Info / Harga */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {imageUrl && (
                <div className="relative w-12 sm:w-14 aspect-video rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 shadow-2xs">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight">
                  {title}
                </h4>
                
                <div className="flex items-center gap-1.5 mt-0.5">
                  {badgeText && (
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      {badgeText}
                    </span>
                  )}
                  {badgeText && (priceDisplay || subtitle) && (
                    <span className="text-slate-300">•</span>
                  )}
                  {priceDisplay ? (
                    <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {priceDisplay}
                    </div>
                  ) : subtitle ? (
                    <div className="text-[11px] text-slate-500 truncate">{subtitle}</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Secondary Action Slot & Primary CTA Button */}
            <div className="flex items-center gap-2 shrink-0">
              {secondaryAction}

              <button
                type="button"
                onClick={onCtaClick}
                disabled={disabled || isLoading}
                className={`inline-flex items-center justify-center gap-1.5 h-10 sm:h-11 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${buttonClass}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>{ctaText}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PublicStickyBottomAction;

