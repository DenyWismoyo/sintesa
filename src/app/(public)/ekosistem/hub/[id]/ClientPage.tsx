'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Clock, User, Landmark, Briefcase, GraduationCap, Building2, CheckCircle2 } from 'lucide-react';
import { useHubThreadDetail } from '@/hooks/useHub';

const getRoleConfig = (role: string) => {
  switch (role) {
    case 'investor': return { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Investor / VC' };
    case 'kampus': return { icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Perguruan Tinggi' };
    case 'industri': return { icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Mitra Industri' };
    case 'tenant': return { icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Startup / UMKM' };
    default: return { icon: User, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Sistem Admin' };
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
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center w-full"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;
  }

  if (!thread) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center w-full bg-[#F8FAFC]">
        <h2 className="text-2xl font-black text-slate-800">Thread Tidak Ditemukan</h2>
        <button onClick={() => router.back()} className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-bold">Kembali</button>
      </div>
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
        authorId: 'user_dummy_123', // TODO: Auth ID
        authorName: 'Pengguna Ekosistem', // TODO: Auth Name
        authorRole: 'tenant', // TODO: Auth Role
        content: replyContent,
        isAccepted: false
      });
      setReplyContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen font-sans pb-32">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          {/* MENGUBAH JADI ROUTER.BACK AGAR KETIKA KEMBALI TAB "BURSA KOLABORASI" TETAP AKTIF */}
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> Kembali ke Hub
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Thread Original Poster (OP) Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-16 h-16 rounded-[1.2rem] ${roleConf.bg} ${roleConf.border} border flex items-center justify-center shrink-0`}>
              <AuthorIcon size={28} className={roleConf.color} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">{thread.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="font-bold text-slate-700">{thread.authorName}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${roleConf.bg} ${roleConf.color}`}>{roleConf.label}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-slate-500 flex items-center gap-1"><Clock size={12}/> {formatTimeAgo(thread.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed whitespace-pre-wrap mb-8">
            {thread.description}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6">
            {thread.tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-xl text-xs font-bold">#{tag}</span>
            ))}
            {thread.budgetOrTicketSize && (
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 ml-auto">
                <Landmark size={14}/> {thread.budgetOrTicketSize}
              </span>
            )}
          </div>
        </motion.div>

        {/* Responses Section */}
        <div className="space-y-6 mb-10">
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            Balasan & Solusi <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{responses.length}</span>
          </h3>
          
          <AnimatePresence>
            {responses.map((reply, index) => {
              const rConf = getRoleConfig(reply.authorRole);
              const RIcon = rConf.icon;
              return (
                <motion.div key={reply.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className={`bg-white rounded-3xl p-6 border ${reply.isAccepted ? 'border-emerald-200 shadow-[0_4px_20px_rgba(16,185,129,0.1)]' : 'border-slate-200 shadow-sm'}`}>
                  {reply.isAccepted && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-4 bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100">
                      <CheckCircle2 size={12} /> Solusi Terpilih
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${rConf.bg} flex items-center justify-center shrink-0`}>
                      <RIcon size={16} className={rConf.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm">{reply.authorName}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${rConf.bg} ${rConf.color}`}>{rConf.label}</span>
                        <span className="text-xs text-slate-400 ml-auto">{formatTimeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Reply Form */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
          <form onSubmit={handleReplySubmit}>
            <textarea 
              rows={3} 
              placeholder="Tawarkan solusi atau diskusikan kebutuhan ini..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none mb-4"
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting || !replyContent.trim()}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Mengirim...' : <><Send size={16} /> Balas Thread</>}
              </button>
            </div>
          </form>
        </motion.div>

      </main>
    </div>
  );
}