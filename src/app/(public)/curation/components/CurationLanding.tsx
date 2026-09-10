'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, History, Clock, Activity, ChevronRight } from 'lucide-react';

interface Props {
  onStart: () => void;
  onLoadHistory: (historyItem: any) => void;
}

export default function CurationLanding({ onStart, onLoadHistory }: Props) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('curation_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Gagal memuat riwayat", e);
    }
  }, []);

  return (
    <div className="w-full min-h-[calc(100vh-5.5rem)] flex items-center relative overflow-hidden bg-slate-50">
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-200/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container - Full Width */}
      <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-16 xl:px-24 py-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-20 relative z-10">
        
        {/* KIRI: Hero Section (60%) */}
        <div className="w-full lg:w-3/5 text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="w-20 h-20 lg:mx-0 mx-auto mb-8 relative group">
             <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
             <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl shadow-xl flex items-center justify-center border-4 border-white relative z-10">
                <ShieldCheck size={36} className="text-white" />
             </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Smart Curation<br/>
            <span className="text-indigo-600">&amp; Readiness System</span>
          </h1>
          <p className="text-base lg:text-lg text-slate-500 mb-10 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
            Sistem asesmen mendalam yang didukung oleh AI untuk mengukur kelayakan UMKM, Bisnis Jasa, dan Startup Teknologi Anda menuju pendanaan & ekspansi pasar skala nasional.
          </p>
          <button onClick={onStart} className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white font-bold rounded-full hover:bg-indigo-600 transition-all duration-300 shadow-xl hover:shadow-indigo-600/30 text-lg flex items-center justify-center lg:justify-start gap-3 mx-auto lg:mx-0 group">
            Mulai Smart Assessment <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* KANAN: History Panel (40%) - Glassmorphism */}
        {history.length > 0 && (
          <div className="w-full lg:w-2/5 animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
            <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/80 p-8 lg:p-10 w-full max-w-md mx-auto lg:mx-0 lg:ml-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-200/60 pb-4 relative z-10">
                <History size={18} className="text-indigo-600"/> Riwayat Kurasi Anda
              </h3>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {history.map((item, idx) => (
                  <div 
                    key={idx} 
                    // Menambahkan safe guard agar tidak error jika props tidak dikirim
                    onClick={() => onLoadHistory ? onLoadHistory(item) : console.warn('Fungsi onLoadHistory tidak ditemukan')} 
                    className="p-5 rounded-2xl bg-white/80 border border-slate-100 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/80 cursor-pointer transition-all duration-300 group hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-md">{item.trackType}</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> {new Date(item.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-700 transition-colors truncate mb-3">{item.namaUsaha}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <Activity size={14} className="text-emerald-500"/>
                        <p className="text-xs font-bold text-slate-600">Skor: {item.score}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600"/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}