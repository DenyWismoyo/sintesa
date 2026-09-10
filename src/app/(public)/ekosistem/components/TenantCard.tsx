'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Building2, Cpu, TrendingUp, User, ArrowUpRight } from 'lucide-react';
import { Tenant } from '@/types';
import OptimizedImage from '@/components/ui/OptimizedImage';

export const getSegmentTheme = (segment?: string) => {
  switch (segment) {
    case 'StartUp':
      return {
        text: 'text-indigo-500',
        hoverText: 'group-hover:text-indigo-600',
        bgHover: 'group-hover:bg-indigo-600',
        glow: 'via-indigo-500',
        borderHover: 'hover:border-indigo-300',
        shadowHover: 'hover:shadow-indigo-500/10',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        iconColor: 'text-indigo-300',
        coverGradient: 'from-indigo-100 to-transparent'
      };
    case 'UMKM':
      return {
        text: 'text-amber-500',
        hoverText: 'group-hover:text-amber-600',
        bgHover: 'group-hover:bg-amber-600',
        glow: 'via-amber-500',
        borderHover: 'hover:border-amber-300',
        shadowHover: 'hover:shadow-amber-500/10',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        iconColor: 'text-amber-300',
        coverGradient: 'from-amber-100 to-transparent'
      };
    case 'Koperasi':
      return {
        text: 'text-emerald-500',
        hoverText: 'group-hover:text-emerald-600',
        bgHover: 'group-hover:bg-emerald-600',
        glow: 'via-emerald-500',
        borderHover: 'hover:border-emerald-300',
        shadowHover: 'hover:shadow-emerald-500/10',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-300',
        coverGradient: 'from-emerald-100 to-transparent'
      };
    case 'Kampus':
      return {
        text: 'text-blue-500',
        hoverText: 'group-hover:text-blue-600',
        bgHover: 'group-hover:bg-blue-600',
        glow: 'via-blue-500',
        borderHover: 'hover:border-blue-300',
        shadowHover: 'hover:shadow-blue-500/10',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        iconColor: 'text-blue-300',
        coverGradient: 'from-blue-100 to-transparent'
      };
    case 'Industri':
      return {
        text: 'text-purple-500',
        hoverText: 'group-hover:text-purple-600',
        bgHover: 'group-hover:bg-purple-600',
        glow: 'via-purple-500',
        borderHover: 'hover:border-purple-300',
        shadowHover: 'hover:shadow-purple-500/10',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        iconColor: 'text-purple-300',
        coverGradient: 'from-purple-100 to-transparent'
      };
    default:
      return {
        text: 'text-indigo-500',
        hoverText: 'group-hover:text-indigo-600',
        bgHover: 'group-hover:bg-indigo-600',
        glow: 'via-indigo-500',
        borderHover: 'hover:border-indigo-300',
        shadowHover: 'hover:shadow-indigo-500/10',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        iconColor: 'text-indigo-300',
        coverGradient: 'from-indigo-100 to-transparent'
      };
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

interface TenantCardProps {
  tenant: Tenant;
}

export default function TenantCard({ tenant }: TenantCardProps) {
  const theme = getSegmentTheme(tenant.segment);

  return (
    <motion.div variants={itemVariants} layoutId={`card-${tenant.id}`}>
      <Link href={`/ekosistem/${tenant.id}`} className="block group h-full">
        <div className={`public-card public-card-hover h-full p-6 lg:p-8 hover:shadow-xl ${theme.shadowHover} transition-all duration-500 flex flex-col relative overflow-hidden`}>
          
          {/* Subtle Top Glow Border */}
          <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent ${theme.glow} to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 z-20`} />
          
          {/* Cover Header */}
          <div className="absolute top-0 left-0 w-full h-40 z-0 overflow-hidden bg-slate-50">
            <OptimizedImage 
              src={tenant.coverImageUrl} 
              alt={`${tenant.name} cover`} 
              className="w-full h-full object-cover opacity-[0.15] group-hover:opacity-[0.85] transition-all duration-700 group-hover:scale-105"
              defaultIcon={<div className={`w-full h-full bg-gradient-to-b ${theme.coverGradient} opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />}
            />
            <div className={`absolute inset-0 bg-gradient-to-b ${theme.coverGradient} opacity-60 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
          </div>

          {/* Logo & Badges */}
          <div className="flex items-start gap-4 mb-6 relative z-10">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-md p-3">
              <OptimizedImage 
                src={tenant.logoUrl} 
                alt={tenant.name} 
                className="w-full h-full object-contain"
                defaultIcon={<Building2 className={`w-10 h-10 lg:w-12 lg:h-12 ${theme.iconColor}`} />}
              />
            </div>
            
            <div className="flex flex-col items-start gap-2 pt-1 overflow-hidden">
              <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-xs ${theme.badge}`}>
                {tenant.segment || 'StartUp'}
              </span>
              {tenant.segment === 'UMKM' && tenant.smeReadinessLevel ? (
                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider border shadow-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] ${
                  tenant.smeReadinessLevel.includes('Export') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  tenant.smeReadinessLevel.includes('Retail') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {tenant.smeReadinessLevel}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider border border-slate-200/60 text-slate-500 bg-white/80 shadow-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                  {tenant.pipelineStage || 'Pra-Inkubasi'}
                </span>
              )}
            </div>
          </div>

          {/* Content Info */}
          <div className="flex-1 relative z-10 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text} flex items-center gap-1`}>
                <Cpu size={12} /> {tenant.sector || 'Teknologi Umum'}
              </span>
              <div className="flex items-center">
                {tenant.status === 'Aktif' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-600 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-xs">
                    Alumni
                  </span>
                )}
              </div>
            </div>
            
            <h3 className={`text-xl sm:text-2xl font-black text-slate-900 mb-2 sm:mb-3 ${theme.hoverText} transition-colors leading-tight tracking-tight`}>
              {tenant.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium mb-4">
              {tenant.elevatorPitch || "Inovator Ekosistem Technopark"}
            </p>
          </div>

          {/* Card Footer */}
          <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between relative z-10 gap-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <TrendingUp size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stage:</span>
                <span className="text-xs font-black text-slate-700 truncate">{tenant.fundingStage || 'Bootstrapped'}</span>
              </div>
              
              {tenant.isRaising ? (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" /> Sedang Fundraising
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 truncate">
                  <User size={12} className="text-slate-400 shrink-0"/> 
                  <span className="truncate">{tenant.ownerName || 'Tim Founder'}</span>
                </div>
              )}
            </div>

            <div className={`w-10 h-10 shrink-0 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 ${theme.bgHover} group-hover:border-transparent group-hover:text-white transition-all duration-300 transform group-hover:rotate-45 shadow-xs group-hover:shadow-md`}>
              <ArrowUpRight size={18} />
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
