'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Calendar, Loader2, LayoutGrid, Users, BookOpen, Tag, Info, GraduationCap, Briefcase } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';
import { useTraining } from '@/hooks/useTraining';
import { canPerformAction, PERMISSIONS } from '@/config/roles';
import { toast } from 'sonner';

import AlumniTab from './components/AlumniTab';
import TalentPoolTab from './components/TalentPoolTab';

export default function AdminPelatihanPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const canManageLMS = canPerformAction(role, PERMISSIONS.MANAGE_LMS);
  const canManageAlumni = canPerformAction(role, PERMISSIONS.MANAGE_ALUMNI);
  const canManageTalent = canPerformAction(role, PERMISSIONS.MANAGE_TALENT);

  const [activeView, setActiveView] = useState<'lms' | 'alumni' | 'talent'>('lms');

  const { trainings, loading, fetchNextPage, hasNextPage, deleteTraining } = useTraining();
  
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (role === 'public' || role === 'tenant') {
        router.replace('/lms/dashboard');
      }
    }
  }, [user, role, authLoading, router]);

  if (authLoading || !user || role === 'public' || role === 'tenant') {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  const filteredTrainings = trainings.filter((t) => {
    const title = t.title || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    if (!canManageLMS) return toast.error("Akses Ditolak");
    if (confirm("Apakah Anda yakin ingin menghapus kelas ini?")) {
      const res = await deleteTraining(id);
      if (res.success) toast.success("Program Pelatihan Berhasil Dihapus");
      else toast.error("Gagal Menghapus", { description: res.error });
    }
  };

  const totalClasses = trainings.length;
  const activeParticipants = trainings.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const onlineClasses = trainings.filter(t => t.type?.includes('Online') || t.type?.includes('Video')).length;

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* 1. ADMIN PAGE HEADER */}
      <AdminPageHeader
        title="Pusat Pembelajaran & LMS"
        subtitle="Manajemen program diklat, kelas digital, peserta kursus, dan database master alumni."
        badge={`${totalClasses} Program Terdaftar`}
        breadcrumbs={[{ label: 'Pelatihan & LMS' }]}
        actions={
          canManageLMS && activeView === 'lms' ? (
            <button 
              onClick={() => router.push('/pelatihan/builder')} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs shadow-blue-200 transition-all shrink-0"
            >
              <Plus size={16} /> Buat Kelas Baru
            </button>
          ) : undefined
        }
      />

      {/* METRIC CARDS BANNER */}
      {activeView === 'lms' && canManageLMS && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5 shadow-xs">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><BookOpen size={18} strokeWidth={2.5}/></div>
            <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kelas</span><h3 className="text-xl sm:text-2xl font-black text-slate-800">{totalClasses}</h3></div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5 shadow-xs">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><Users size={18} strokeWidth={2.5}/></div>
            <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Peserta</span><h3 className="text-xl sm:text-2xl font-black text-slate-800">{activeParticipants}</h3></div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5 shadow-xs">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600"><Tag size={18} strokeWidth={2.5}/></div>
            <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelas Digital</span><h3 className="text-xl sm:text-2xl font-black text-slate-800">{onlineClasses}</h3></div>
          </div>
        </div>
      )}

      <div className="flex p-1.5 bg-slate-100/80 backdrop-blur rounded-2xl w-max shadow-inner border border-slate-200 overflow-x-auto max-w-full custom-scrollbar">
        {canManageLMS && (
          <button onClick={() => setActiveView('lms')} className={`shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'lms' ? 'bg-white text-blue-700 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}><BookOpen size={16} /> Manajemen LMS</button>
        )}
        {canManageAlumni && (
          <button onClick={() => setActiveView('alumni')} className={`shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'alumni' ? 'bg-white text-emerald-700 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}><GraduationCap size={18} /> Database Master Alumni</button>
        )}
        {canManageTalent && (
          <button onClick={() => setActiveView('talent')} className={`shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'talent' ? 'bg-slate-800 text-white shadow border border-slate-700' : 'text-slate-500 hover:text-slate-700'}`}><Briefcase size={16} /> Direktori Talent & Karir</button>
        )}
      </div>

      {activeView === 'lms' && canManageLMS && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Info size={20} /></div>
              <p className="text-sm font-medium leading-relaxed">Kelola program pelatihan di sini. Semua perubahan akan langsung tayang ke publik secara otomatis.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center">
            <div className="relative w-full md:w-96"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input placeholder="Cari judul kelas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold tracking-wider">
                  <tr><th className="px-6 py-4 w-[350px]">Detail Kelas</th><th className="px-6 py-4">Harga & Tipe</th><th className="px-6 py-4">Peserta</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && trainings.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                  ) : filteredTrainings.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center"><LayoutGrid className="h-12 w-12 text-slate-300 mx-auto" /></td></tr>
                  ) : (
                    filteredTrainings.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => router.push(`/pelatihan/${t.id}/peserta`)}>
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-800 text-base group-hover:text-blue-600 line-clamp-2">{t.title}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-slate-400"><Calendar size={12}/> <span className="text-[10px] font-bold uppercase tracking-widest">{t.date ? new Date(t.date).toLocaleDateString('id-ID') : 'Video Course'}</span></div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase ${t.type === 'Offline' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>{t.type || 'Offline'}</span>
                          <p className="text-sm font-black text-slate-800 mt-1">{t.isFree ? 'GRATIS' : new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', minimumFractionDigits: 0}).format(t.price || 0)}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2 w-full max-w-[120px]">
                            <div className="flex justify-between items-center"><span className="text-xs font-black text-slate-700">{t.registeredCount || 0}</span><span className="text-[10px] font-bold text-slate-400">/ {t.quota === 0 ? '∞' : t.quota}</span></div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${t.quota === 0 ? 100 : Math.min(((t.registeredCount || 0) / (t.quota || 1)) * 100, 100)}%` }}/></div>
                          </div>
                        </td>
                        <td className="px-6 py-5"><span className="text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase bg-emerald-50 text-emerald-700">{t.status}</span></td>
                        <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => router.push(`/pelatihan/${t.id}/peserta`)} className="p-2 text-slate-500 hover:text-blue-600 bg-white border border-slate-200 rounded-xl"><Users size={16} /></button>
                            <button onClick={() => router.push(`/pelatihan/builder?id=${t.id}`)} className="p-2 text-slate-500 hover:text-amber-600 bg-white border border-slate-200 rounded-xl"><Edit size={16} /></button>
                            <button onClick={() => t.id && handleDelete(t.id)} className="p-2 text-slate-500 hover:text-red-600 bg-white border border-slate-200 rounded-xl"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {hasNextPage && <div className="px-6 py-4 border-t border-slate-200 flex justify-center"><button onClick={() => fetchNextPage()} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm">Muat Lebih Banyak</button></div>}
          </div>
        </div>
      )}

      {activeView === 'alumni' && canManageAlumni && <AlumniTab />}
      {activeView === 'talent' && canManageTalent && <TalentPoolTab />}
    </div>
  );
}