'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Clock,
  User,
  Landmark,
  Briefcase,
  GraduationCap,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useHubThreadDetail } from '@/hooks/useHub';
import SectionContainer from '@/components/ui/SectionContainer';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

const getRoleConfig = (role: string) => {
  switch (role) {
    case 'investor':
      return {
        icon: Landmark,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        label: 'Investor / VC',
      };
    case 'kampus':
      return {
        icon: GraduationCap,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        label: 'Perguruan Tinggi',
      };
    case 'industri':
      return {
        icon: Briefcase,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        label: 'Mitra Industri',
      };
    case 'tenant':
      return {
        icon: Building2,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        label: 'Startup / UMKM',
      };
    default:
      return {
        icon: User,
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        label: 'Sistem Admin',
      };
  }
};

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `Baru saja`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
};

export default function ClientThreadPage({ threadId }: { threadId: string }) {
  const router = useRouter();
  const { thread, responses, loading, addResponse } = useHubThreadDetail(threadId);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <SectionContainer accent="indigo" width="narrow">
        <div className="min-h-[50vh] flex items-center justify-center w-full">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </SectionContainer>
    );
  }

  if (!thread) {
    return (
      <SectionContainer accent="indigo" width="narrow">
        <div className="min-h-[50vh] flex flex-col items-center justify-center w-full text-center py-16">
          <h2 className="text-2xl font-black text-slate-800">Thread Tidak Ditemukan</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-bold shadow-sm"
          >
            Kembali
          </button>
        </div>
      </SectionContainer>
    );
  }

  const roleConf = getRoleConfig(thread.authorRole);
  const AuthorIcon = roleConf.icon;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await addResponse.mutateAsync({
        authorId: 'user_dummy_123',
        authorName: 'Pengguna Ekosistem',
        authorRole: 'tenant',
        content: replyContent,
        isAccepted: false,
      });
      setReplyContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SectionContainer accent="indigo" width="narrow" className="pb-24 sm:pb-16">
      <div className="py-4 sm:py-6 space-y-6">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <Breadcrumbs
            items={[
              { label: 'Ekosistem', href: '/ekosistem' },
              { label: 'Bursa Kolaborasi', href: '/ekosistem?tab=hub' },
              { label: thread.title, active: true },
            ]}
          />
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-100 self-start sm:self-auto"
          >
            <ArrowLeft size={13} /> Kembali
          </button>
        </div>

        {/* Thread Original Poster (OP) Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="public-card p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl ${roleConf.bg} ${roleConf.border} border flex items-center justify-center shrink-0 shadow-2xs`}
            >
              <AuthorIcon size={26} className={roleConf.color} />
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {thread.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">{thread.authorName}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${roleConf.bg} ${roleConf.color}`}
                >
                  {roleConf.label}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> {formatTimeAgo(thread.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
            {thread.description}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            {thread.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-slate-50 border border-slate-200/80 text-slate-500 px-2.5 py-1 rounded-lg text-xs font-bold"
              >
                #{tag}
              </span>
            ))}
            {thread.budgetOrTicketSize && (
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 ml-auto">
                <Landmark size={14} /> {thread.budgetOrTicketSize}
              </span>
            )}
          </div>
        </motion.div>

        {/* Responses Section */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            Balasan & Solusi{' '}
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {responses.length}
            </span>
          </h3>

          <AnimatePresence>
            {responses.map((reply, index) => {
              const rConf = getRoleConfig(reply.authorRole);
              const RIcon = rConf.icon;
              return (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`public-card p-5 ${
                    reply.isAccepted ? 'border-emerald-300 ring-2 ring-emerald-100' : ''
                  }`}
                >
                  {reply.isAccepted && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-3 bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100">
                      <CheckCircle2 size={12} /> Solusi Terpilih
                    </div>
                  )}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl ${rConf.bg} flex items-center justify-center shrink-0`}
                    >
                      <RIcon size={16} className={rConf.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {reply.authorName}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${rConf.bg} ${rConf.color}`}
                        >
                          {rConf.label}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-auto">
                          {formatTimeAgo(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Reply Form */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="public-card p-5 sm:p-6">
          <form onSubmit={handleReplySubmit} className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Tawarkan Solusi atau Respon Anda
            </label>
            <textarea
              rows={3}
              placeholder="Tawarkan solusi, pengalaman, atau diskusikan kebutuhan kolaborasi ini..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !replyContent.trim()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  'Mengirim...'
                ) : (
                  <>
                    <Send size={14} /> Balas Thread
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </SectionContainer>
  );
}
