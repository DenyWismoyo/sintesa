'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { 
  Building2, User, Landmark, GraduationCap, Briefcase, 
  Clock, MessageSquare, ChevronRight 
} from 'lucide-react';
import { HubThread } from '@/types';

export const getRoleConfig = (role: string) => {
  switch (role) {
    case 'investor':
      return { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Investor / VC' };
    case 'kampus':
      return { icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Perguruan Tinggi' };
    case 'industri':
      return { icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Mitra Industri' };
    case 'tenant':
      return { icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Startup / UMKM' };
    default:
      return { icon: User, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Sistem Admin' };
  }
};

export const getTypeConfig = (type: string) => {
  switch (type) {
    case 'PROBLEM_STATEMENT':
      return { label: 'Mencari Solusi', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'LOOKING_FOR_FUNDING':
      return { label: 'Mencari Pendanaan', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'RESEARCH_OFFER':
      return { label: 'Tawaran Riset', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'PARTNERSHIP':
      return { label: 'Peluang Kemitraan', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'PRODUCT_TESTING':
      return { label: 'Product Testing', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    default:
      return { label: 'Diskusi Umum', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

export const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `Baru saja`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return `${months} bln lalu`;
};

const fadeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
};

interface HubThreadCardProps {
  thread: HubThread;
}

export default function HubThreadCard({ thread }: HubThreadCardProps) {
  const roleConf = getRoleConfig(thread.authorRole);
  const typeConf = getTypeConfig(thread.type);
  const Icon = roleConf.icon;

  return (
    <motion.div variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
      <Link
        href={`/ekosistem/hub/${thread.id}`}
        className="block bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-300 group cursor-pointer"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-4 sm:gap-6">
          {/* Avatar / Badge Kiri */}
          <div className="shrink-0 flex items-center md:items-start gap-3.5">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${roleConf.bg} ${roleConf.border} border flex items-center justify-center shrink-0 shadow-xs`}
            >
              {thread.authorLogoUrl ? (
                <img src={thread.authorLogoUrl} alt={thread.authorName} className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl" />
              ) : (
                <Icon size={22} className={roleConf.color} />
              )}
            </div>
            <div className="md:hidden">
              <h4 className="font-bold text-slate-900 leading-tight text-sm">{thread.authorName}</h4>
              <p className="text-xs font-semibold text-slate-500">{roleConf.label}</p>
            </div>
          </div>

          {/* Main Content Thread */}
          <div className="flex-1 min-w-0">
            <div className="hidden md:flex items-center gap-2 mb-2">
              <span className="font-bold text-slate-900 text-sm">{thread.authorName}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${roleConf.bg} ${roleConf.color}`}>
                {roleConf.label}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight leading-snug mb-2 sm:mb-2.5">
                  {thread.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed font-normal line-clamp-2 mb-4">
                  {thread.description}
                </p>
              </div>
              <div className="shrink-0 hidden lg:block">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs ${typeConf.bg}`}>
                  {typeConf.label}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="lg:hidden shrink-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeConf.bg}`}>
                  {typeConf.label}
                </span>
              </div>
              {thread.tags?.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="bg-slate-50 border border-slate-200/80 text-slate-600 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold">
                  #{tag}
                </span>
              ))}
              {thread.budgetOrTicketSize && (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Landmark size={12} /> {thread.budgetOrTicketSize}
                </span>
              )}
            </div>

            {/* Thread Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" />
                  {formatTimeAgo(thread.createdAt)}
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={14} className={thread.responsesCount > 0 ? 'text-indigo-500' : 'text-slate-400'} />
                  <span className={thread.responsesCount > 0 ? 'text-indigo-600 font-bold' : ''}>
                    {thread.responsesCount} Balasan
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                <span>Detail</span>
                <ChevronRight size={15} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
