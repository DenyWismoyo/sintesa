// Lokasi file: src/components/common/MobileStickyBottomBar.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface MobileStickyBottomBarProps {
  title: string;
  priceDisplay?: string;
  imageUrl?: string;
  badgeText?: string;
  ctaText: string;
  onCtaClick: () => void;
  accent?: 'emerald' | 'sky' | 'amber' | 'indigo';
  disabled?: boolean;
}

export function MobileStickyBottomBar({
  title,
  priceDisplay,
  imageUrl,
  badgeText,
  ctaText,
  onCtaClick,
  accent = 'emerald',
  disabled = false
}: MobileStickyBottomBarProps) {
  const accentClasses = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
    sky: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
  }[accent];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2.5 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3 safe-area-pb">
      {/* Sisi Kiri: Thumbnail 16:9 & Info Ringkas */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {imageUrl && (
          <div className="relative w-12 aspect-video rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
            {title}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            {badgeText && (
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {badgeText}
              </span>
            )}
            {badgeText && priceDisplay && <span className="text-slate-300">•</span>}
            {priceDisplay && (
              <span className="text-xs font-black text-slate-900 truncate">
                {priceDisplay}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Tombol CTA Primer */}
      <button
        onClick={onCtaClick}
        disabled={disabled}
        className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all ${accentClasses} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span>{ctaText}</span>
        <ArrowRight size={13} />
      </button>
    </div>
  );
}
