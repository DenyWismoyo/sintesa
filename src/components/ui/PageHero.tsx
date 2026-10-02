'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, Search, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBadge, { BadgeVariant } from './StatusBadge';

export type HeroAccent = 'emerald' | 'sky' | 'blue' | 'amber' | 'indigo' | 'violet' | 'rose' | 'slate';

export interface PageHeroProps {
  badge?: {
    label: string;
    icon?: React.ReactNode;
    variant?: BadgeVariant;
  };
  breadcrumbs?: { label: string; href?: string }[];
  title: string;
  subtitle?: string;
  accentColor?: HeroAccent;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  isLoadingSearch?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const accentTitleClass: Record<HeroAccent, string> = {
  sky: 'public-title-sky',
  blue: 'public-title-sky',
  emerald: 'public-title-emerald',
  amber: 'public-title-amber',
  indigo: 'public-title-indigo',
  violet: 'public-title-violet',
  rose: 'public-title-violet',
  slate: 'public-title-slate',
};

const defaultBadgeVariants: Record<HeroAccent, BadgeVariant> = {
  sky: 'sky',
  blue: 'info',
  emerald: 'emerald',
  amber: 'amber',
  indigo: 'purple',
  violet: 'purple',
  rose: 'danger',
  slate: 'default',
};

export default function PageHero({
  badge,
  breadcrumbs = [],
  title,
  subtitle,
  accentColor = 'blue',
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  isLoadingSearch = false,
  actions,
  children,
  className = ''
}: PageHeroProps) {
  const titleClass = accentTitleClass[accentColor] || accentTitleClass.sky;
  const badgeVariant = defaultBadgeVariants[accentColor] || 'default';

  return (
    <div className={`relative w-full pt-1 sm:pt-2 pb-2 sm:pb-4 mb-3 sm:mb-6 ${className}`}>
      <div className="flex flex-col gap-4 sm:gap-5">
        
        {/* Top Meta Bar: Breadcrumbs & Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-semibold text-slate-500 overflow-x-auto py-0.5 no-scrollbar">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
              title="Beranda"
            >
              <Home size={13} className="text-slate-400" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>

            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight size={12} className="text-slate-300 shrink-0" />
                {crumb.href ? (
                  <Link 
                    href={crumb.href} 
                    className="text-slate-500 hover:text-slate-900 transition-colors shrink-0"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-bold shrink-0">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Optional Category / Section Badge */}
          {badge && (
            <StatusBadge 
              label={badge.label} 
              icon={badge.icon} 
              variant={badge.variant || badgeVariant} 
              size="sm"
            />
          )}
        </div>

        {/* Title, Subtitle & Interactive Search Area */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
          <div className="w-full lg:flex-1 min-w-0 max-w-4xl">
            <motion.h1 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${titleClass}`}
            >
              {title}
            </motion.h1>

            {subtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
                className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-3xl font-normal"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Search Input & Action Slots */}
          {(onSearchChange !== undefined || actions) && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
              {onSearchChange !== undefined && (
                <div className="public-search-bar w-full sm:w-72 md:w-80">
                  <Search size={16} className="absolute left-3.5 text-slate-400 shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="public-search-input"
                  />
                  {isLoadingSearch ? (
                    <Loader2 size={15} className="absolute right-3.5 text-slate-400 animate-spin" />
                  ) : searchValue ? (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                      title="Bersihkan pencarian"
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>
              )}

              {actions && (
                <div className="flex items-center gap-2 shrink-0">
                  {actions}
                </div>
              )}
            </div>
          )}
        </div>

        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}
