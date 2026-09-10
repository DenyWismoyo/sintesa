'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity, ArrowRight, BookOpen, Clock, Target, 
  Sparkles, ShieldCheck, CheckCircle2, AlertCircle, TrendingUp, Package, Users
} from 'lucide-react';
import { useTenants } from '@/hooks/useTenants';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

export default function TenantDashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const { useTenantProfile } = useTenants();
  const { data: tenantProfile, isLoading } = useTenantProfile(userId);

  if (isLoading || !tenantProfile) return null;

  const isPreIncubation = tenantProfile.status === 'Menunggu Review';

  // =========================================================
  // VIEW 1: RUANG TUNGGU (PRE-INCUBATION / MENUNGGU REVIEW)
  // =========================================================
  if (isPreIncubation) {
    const aiData = tenantProfile.aiCurationData;

    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-500">
        
        {/* Banner Status */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-amber-200/50 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-white/30 shadow-sm">
                <Clock size={14} /> Tahap Seleksi
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-2">Pengajuan Anda Sedang Ditinjau</h1>
              <p className="text-amber-50 font-medium max-w-xl text-base md:text-lg">
                Terima kasih telah bergabung. Tim kurator KST Solo Technopark sedang meninjau profil dan hasil asesmen bisnis Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Status Tracker */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-sky-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <h3 className="text-sm font-black text-sky-600 uppercase tracking-widest mb-8 border-b border-sky-100/50 pb-4">Progres Pendaftaran</h3>
          <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-0">
            {/* Garis Latar (Desktop) */}
            <div className="hidden md:block absolute top-5 left-10 right-10 h-1.5 bg-sky-50 rounded-full z-0"></div>
            
            {[
              { title: 'Registrasi Akun', desc: 'Selesai', status: 'done' },
              { title: 'Self-Assessment', desc: 'Data tersimpan', status: 'done' },
              { title: 'Review Kurator', desc: 'Sedang diproses', status: 'active' },
              { title: 'Hasil Keputusan', desc: 'Menunggu', status: 'pending' }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-3 group">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 transition-all shadow-sm ${
                    step.status === 'done' ? 'bg-sky-500 border-sky-100 text-white' :
                    step.status === 'active' ? 'bg-amber-400 border-amber-100 text-white shadow-lg shadow-amber-200 animate-pulse' :
                    'bg-white border-slate-100 text-slate-300'
                 }`}>
                   {step.status === 'done' ? <CheckCircle2 size={20} /> : <span className="font-bold text-base">{idx + 1}</span>}
                 </div>
                 <div className="md:text-center">
                   <p className={`font-bold text-sm md:text-base ${step.status === 'pending' ? 'text-slate-400' : 'text-blue-950'}`}>{step.title}</p>
                   <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider mt-0.5">{step.desc}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hasil Kurasi AI (Jika Ada) */}
        {aiData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden md:col-span-1 shadow-lg shadow-sky-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <p className="text-sky-100 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"><ShieldCheck size={14}/> Curation Score</p>
              <div className="flex items-end gap-2 mb-4">
                 <span className="text-7xl font-black leading-none tracking-tighter">{aiData.totalScore || 0}</span>
                 <span className="text-sky-200 font-medium pb-2 text-lg">/ 100</span>
              </div>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 shadow-sm">
                {aiData.readinessLevel || 'TBA'}
              </span>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-sky-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col h-full justify-center">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-sky-100 text-sky-600 rounded-xl"><Sparkles size={20}/></div>
                   <div>
                     <h3 className="font-black text-blue-950 text-lg">Insight & Rekomendasi AI</h3>
                     <p className="text-xs text-slate-500">Berdasarkan profil bisnis Anda.</p>
                   </div>
                 </div>
                 
                 {aiData.recommendations ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-5 rounded-2xl border border-sky-100/50">
                       <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Target size={12}/> Target Pasar</p>
                       <p className="text-xs font-bold text-slate-700 leading-relaxed">{aiData.recommendations.targetMarket}</p>
                     </div>
                     <div className="bg-slate-50 p-5 rounded-2xl border border-sky-100/50">
                       <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Package size={12}/> Distribusi & Harga</p>
                       <p className="text-xs font-bold text-slate-700 leading-relaxed">{aiData.recommendations.distributionChannel} {aiData.recommendations.idealPrice}</p>
                     </div>
                   </div>
                 ) : (
                   <p className="text-sm font-medium text-slate-500 italic">Rekomendasi detail belum tersedia.</p>
                 )}
              </div>
            </div>
            
          </div>
        )}

        <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-sky-600 border border-sky-100"><AlertCircle size={28}/></div>
              <div>
                <h3 className="font-black text-blue-950 text-base">Sambil Menunggu, Lengkapi Profil Anda!</h3>
                <p className="text-sm text-slate-600 font-medium mt-1 max-w-lg leading-relaxed">Profil publik yang lengkap (Logo, Visi, Sosial Media) akan meningkatkan penilaian kurator terhadap keseriusan bisnis Anda.</p>
              </div>
           </div>
           <Link href="/tenant/profile" className="w-full md:w-auto shrink-0 px-8 py-4 bg-white text-blue-700 font-black text-sm border border-sky-200 rounded-full hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-600 hover:text-white hover:border-transparent transition-all shadow-sm hover:shadow-lg hover:shadow-sky-500/30 text-center">
              Lengkapi Profil Publik
           </Link>
        </div>

      </div>
    );
  }

  // =========================================================
  // VIEW 2: DASBOR OPERASIONAL (TENANT AKTIF)
  // =========================================================
  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* Header Interaktif */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-blue-950 tracking-tight">Selamat Datang, {tenantProfile.name}</h1>
          <p className="text-base text-slate-500 mt-2">Ini adalah pusat kendali operasional dan inkubasi startup Anda.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/s/${tenantProfile.id}`} target="_blank" className="px-6 py-3 bg-white border border-sky-100 text-blue-700 text-sm font-bold rounded-full hover:bg-sky-50 transition-colors shadow-sm flex items-center gap-2">
            Lihat Profil Publik <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Mentoring Alert */}
        <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-sky-200/50 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-[10px] font-black uppercase tracking-widest mb-6">
                <Clock size={14} className="animate-pulse" /> Sesi Terdekat
              </div>
              <h2 className="text-3xl font-black leading-tight mb-3">Belum ada jadwal Mentoring minggu ini.</h2>
              <p className="text-sky-100 text-base font-medium max-w-md">Buka Ruang Inkubasi untuk melihat pesan dari mentor atau jadwalkan sesi baru.</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-12 h-12 rounded-full bg-blue-800 border-2 border-blue-500 flex items-center justify-center shadow-md"><Users size={18}/></div>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border-2 border-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md">+</div>
              </div>
              <Link href="/tenant/incubation" className="px-6 py-3 bg-white text-blue-700 font-bold text-sm rounded-full hover:bg-sky-50 transition-colors shadow-md w-full sm:w-auto text-center">
                Buka Inkubasi
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2: Health Score / KPI */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-sky-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity size={14}/> Health Score Rapor</p>
            <h3 className={`text-3xl font-black mt-2 ${
                tenantProfile.currentHealthScore === 'Healthy' ? 'text-emerald-500' :
                tenantProfile.currentHealthScore === 'Warning' ? 'text-amber-500' :
                tenantProfile.currentHealthScore === 'Critical' ? 'text-red-500' : 'text-blue-950'
            }`}>
              {tenantProfile.currentHealthScore || 'Unknown'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">Berdasarkan evaluasi bulan lalu.</p>
          </div>
          <div className="mt-6">
             <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                <div className={`h-full rounded-full transition-all ${tenantProfile.currentHealthScore === 'Healthy' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 w-[85%]' : 'bg-slate-300 w-[20%]'}`}></div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase text-right tracking-widest">Kinerja</p>
          </div>
        </div>

        {/* Card 3: Traction & Portofolio */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-sky-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between group hover:border-sky-300 transition-colors">
          <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950 mb-2">Traction & Milestone</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Perbarui catatan rilis produk dan pertumbuhan user Anda di sini.</p>
          </div>
          <Link href="/tenant/traction" className="mt-6 flex items-center justify-between text-sm font-bold text-sky-600 hover:text-blue-700 bg-sky-50 hover:bg-sky-100 px-4 py-3 rounded-full transition-colors">
            Kelola Milestone <ArrowRight size={16} />
          </Link>
        </div>

      </div>

    </div>
  );
}