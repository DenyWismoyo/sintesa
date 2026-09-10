'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Users, Building2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

import PillTabs from '@/components/ui/PillTabs';

export type EkosistemView = 'DIRECTORY' | 'HUB';

interface EkosistemHeroProps {
  activeView: EkosistemView;
  onViewChange: (view: EkosistemView) => void;
}

export default function EkosistemHero({ activeView, onViewChange }: EkosistemHeroProps) {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 pb-6 relative overflow-hidden">
      <div className="max-w-[1920px] mx-auto space-y-4 sm:space-y-5">
        {/* Top Breadcrumb & Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Link href="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
              <Home size={13} className="text-slate-400" />
              <span>Beranda</span>
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-900 font-bold">Ekosistem</span>
          </nav>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full shadow-xs">
            <Users size={13} className="text-indigo-500" />
            Ekosistem Terpadu Pentahelix
          </span>
        </div>

        {/* Title & Description */}
        <div className="max-w-4xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight public-title-indigo">
            KST Smart Hub & Ekosistem
          </h1>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
            Platform kolaborasi pentahelix. Temukan startup binaan potensial, jalin kemitraan industri strategis, atau sampaikan tawaran riset kampus dalam satu jejaring inovatif.
          </p>
        </div>

        {/* View Switcher Tabs using PillTabs */}
        <div className="pt-2">
          <PillTabs
            tabs={[
              { key: 'DIRECTORY', label: 'Direktori Profil', icon: <Building2 size={16} /> },
              { key: 'HUB', label: 'Bursa Kolaborasi', icon: <MessageSquare size={16} /> },
            ]}
            active={activeView}
            onChange={(v) => onViewChange(v as EkosistemView)}
            layoutId="ekosistemViewIndicator"
          />
        </div>
      </div>
    </div>
  );
}
