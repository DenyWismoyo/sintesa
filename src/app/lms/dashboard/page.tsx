'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Training } from '@/types';

import { Loader2, LogOut, Users, LayoutList, PenTool, ClipboardCheck, PlayCircle, KeyRound, ArrowRight } from 'lucide-react';

export default function InstructorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [myClasses, setMyClasses] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/lms');
      return;
    }

    const fetchInstructorClasses = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'trainings'), 
          where('authorizedInstructorIds', 'array-contains', user.uid)
        );
        const snap = await getDocs(q);
        
        const classesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Training));
        setMyClasses(classesData);
      } catch (error) {
        console.error("Gagal mengambil kelas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorClasses();
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 animate-in fade-in duration-300">
      
      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <KeyRound size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Instructor Space</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">KST Solo Technopark</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-black text-slate-800">{user?.displayName}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 w-10 border border-slate-200 hover:border-red-200 transition-all shadow-sm">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        
        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Kelas Bimbingan Anda</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Kelola kurikulum dan nilai tugas dari peserta pada kelas yang Anda ampu.</p>
          </div>
          <button onClick={() => router.push('/lms')} className="shrink-0 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all">
            + Klaim Kelas Baru
          </button>
        </div>

        {myClasses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100 text-slate-400">
               <PenTool size={32} />
             </div>
             <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Belum Ada Kelas Terhubung</h3>
             <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 font-medium leading-relaxed">Anda belum ditugaskan ke kelas manapun. Klik tombol Klaim di atas dan masukkan Kode Akses dari Admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClasses.map((training) => (
              <div key={training.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:border-blue-200 transition-all">
                
                {/* CARD IMAGE */}
                <div className="relative h-48 bg-slate-900 shrink-0 overflow-hidden">
                  {training.imageUrl ? (
                    <img src={training.imageUrl} alt={training.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"><PlayCircle className="w-12 h-12 text-slate-600" /></div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">{training.category}</span>
                  </div>
                </div>

                {/* CARD CONTENT */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-black text-slate-800 mb-4 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{training.title}</h3>
                  
                  <div className="flex gap-4 text-xs font-bold text-slate-500 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5"><LayoutList size={16} className="text-blue-500"/> {training.curriculum?.length || 0} Bab</div>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <div className="flex items-center gap-1.5"><Users size={16} className="text-emerald-500"/> {training.registeredCount || 0} Peserta</div>
                  </div>

                  {/* TOMBOL AKSI INSTRUKTUR */}
                  <div className="mt-auto flex flex-col gap-3">
                    <button 
                      onClick={() => router.push(`/pelatihan/builder?id=${training.id}`)} 
                      className="w-full h-11 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold border border-slate-200 hover:border-blue-200 transition-colors shadow-sm flex items-center justify-center text-sm"
                    >
                      <PenTool className="mr-2 h-4 w-4" /> Susun Kurikulum & FAQ
                    </button>
                    <button 
                      onClick={() => router.push(`/pelatihan/${training.id}/peserta`)} 
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-md shadow-blue-200 flex items-center justify-center text-sm"
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" /> Evaluasi Tugas <ArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}