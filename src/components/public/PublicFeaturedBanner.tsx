'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export type BannerAccent = 'emerald' | 'sky' | 'amber' | 'indigo' | 'violet' | 'slate';

export interface BannerMetaItem {
  icon?: React.ReactNode;
  label: string;
}

export interface PublicFeaturedBannerProps {
  tag?: string;
  badge?: React.ReactNode;
  title: string;
  description: string;
  imageUrl?: string;
  metadata?: BannerMetaItem[];
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  actionIcon?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  accent?: BannerAccent;
  className?: string;
}

const GLOW_ACCENTS: Record<BannerAccent, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  sky: 'bg-sky-500/20 text-sky-400',
  amber: 'bg-amber-500/20 text-amber-400',
  indigo: 'bg-indigo-500/20 text-indigo-400',
  violet: 'bg-violet-500/20 text-violet-400',
  slate: 'bg-slate-500/20 text-slate-400',
};

const BUTTON_ACCENTS: Record<BannerAccent, string> = {
  emerald: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
  sky: 'bg-sky-500 hover:bg-sky-400 text-slate-950',
  amber: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
  indigo: 'bg-indigo-500 hover:bg-indigo-400 text-white',
  violet: 'bg-violet-500 hover:bg-violet-400 text-white',
  slate: 'bg-white hover:bg-slate-100 text-slate-900',
};

export function PublicFeaturedBanner({
  tag = 'Sorotan Unggulan',
  badge,
  title,
  description,
  imageUrl,
  metadata = [],
  actionLabel,
  actionHref,
  onActionClick,
  actionIcon,
  secondaryAction,
  accent = 'indigo',
  className = '',
}: PublicFeaturedBannerProps) {
  const glowClass = GLOW_ACCENTS[accent] || GLOW_ACCENTS.indigo;
  const buttonClass = BUTTON_ACCENTS[accent] || BUTTON_ACCENTS.indigo;

  const renderActionButton = () => {
    if (!actionLabel) return null;

    const content = (
      <>
        <span>{actionLabel}</span>
        {actionIcon || <ArrowRight size={15} />}
      </>
    );

    const btnClass = `inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer ${buttonClass}`;

    if (actionHref) {
      return (
        <Link href={actionHref} className={btnClass}>
          {content}
        </Link>
      );
    }

    return (
      <button type="button" onClick={onActionClick} className={btnClass}>
        {content}
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`-mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full bg-slate-900 rounded-none sm:rounded-[2rem] p-5 sm:p-8 md:p-10 mb-8 sm:mb-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 group shadow-none sm:shadow-xl ${className}`}
    >
      {/* Background Image Scrim Effect */}
      {imageUrl && (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover opacity-25 group-hover:scale-105 group-hover:opacity-30 transition-all duration-700 ease-out mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        </div>
      )}

      {/* Ambient Radial Glow */}
      <div
        className={`absolute top-0 right-0 w-[450px] h-[450px] blur-[110px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none opacity-60 ${glowClass}`}
      />

      {/* Konten Teks */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md text-white/90 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-xs">
            <Sparkles size={11} className="text-amber-400" />
            <span>{tag}</span>
          </span>
          {badge}
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3.5 leading-tight tracking-tight">
          {title}
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-3 font-normal mb-6">
          {description}
        </p>

        {/* Metadata Pills */}
        {metadata.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            {metadata.map((item, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 text-slate-200 text-xs font-semibold bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10"
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {renderActionButton()}
          {secondaryAction}
        </div>
      </div>

      {/* Sisi Kanan: Visual Graphic Jika Tanpa Background Image */}
      {!imageUrl && (
        <div className="relative z-10 w-full md:w-64 aspect-[4/3] bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center p-6 text-center shrink-0">
          <Sparkles size={40} className="mb-3 text-white/30" />
          <p className="font-black text-sm uppercase tracking-wider text-white/80 leading-snug">
            {tag}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default PublicFeaturedBanner;

