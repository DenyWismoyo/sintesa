'use client';

import React, { useState, useEffect } from 'react';
import { useBooking } from '@/hooks/useBooking';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function TabRiwayat({ userEmail }: { userEmail: string }) {
  const { trackBooking } = useBooking('public');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userEmail) return;
      const res = await trackBooking(userEmail) as any;
      if (res.success && res.data) setHistory(res.data);
      setLoading(false);
    };
    fetchHistory();
  }, [userEmail, trackBooking]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-amber-500 h-10 w-10" /></div>;

  if (history.length === 0) {
    return (
      <div className="text-center py-20 px-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
          <CalendarIcon className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">Belum Ada Aktivitas</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Anda belum pernah mengajukan peminjaman fasilitas atau mendaftar pelatihan.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Layanan</h3>
        <p className="text-sm text-slate-500 font-medium mt-1">Daftar peminjaman dan pendaftaran pelatihan yang pernah Anda lakukan.</p>
      </div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-5" variants={containerVariants} initial="hidden" animate="visible">
        {history.map((item: any) => (
          <motion.div key={item.id} variants={itemVariants} className="group bg-white p-6 rounded-[1.5rem] border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_30px_-10px_rgba(245,158,11,0.15)] hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col h-full">
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="pr-4">
                <h4 className="font-black text-slate-900 group-hover:text-amber-600 transition-colors text-lg line-clamp-1">{item.assetName}</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.agency}</p>
              </div>
              
              <div className="shrink-0">
                {item.status === 'approved' && <span className="bg-blue-50 text-blue-700 border border-blue-200/50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm"><Clock size={12}/> Menunggu</span>}
                {item.status === 'completed' && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm"><CheckCircle2 size={12}/> Selesai</span>}
                {item.status === 'pending' && <span className="bg-amber-50 text-amber-700 border border-amber-200/50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm"><Loader2 size={12} className="animate-spin"/> Di-review</span>}
                {item.status === 'rejected' && <span className="bg-red-50 text-red-700 border border-red-200/50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm"><XCircle size={12}/> Ditolak</span>}
              </div>
            </div>

            <div className="mt-auto bg-slate-50/80 p-4 rounded-xl border border-slate-100/80 text-xs space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-slate-500"><CalendarIcon size={14}/> Tanggal Pelaksanaan</span> 
                <strong className="text-slate-800 font-bold">{item.startDate}</strong>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                <span className="flex items-center gap-1.5 font-semibold text-slate-500"><Clock size={14}/> Estimasi Waktu</span> 
                <strong className="text-slate-800 font-bold bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">{item.startTime} - {item.endTime}</strong>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}