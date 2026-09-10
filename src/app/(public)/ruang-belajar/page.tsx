'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { trainingService } from '@/services/training.service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { BookOpen, Loader2, PlayCircle, Clock, AlertCircle, LayoutGrid, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/ui/PageHero';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

interface CourseData {
  registration: any;
  training: any;
}

export default function MyLearningDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [enrolledCourses, setEnrolledCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const fetchMyCourses = async () => {
      setLoading(true);
      try {
        // Optimalisasi R-029: 1 Single collectionGroup Query via trainingService (0 N+1 loop)
        const coursesData = await trainingService.getMyEnrolledCourses(user.email!);
        setEnrolledCourses(coursesData);
      } catch (error) {
        console.error("Gagal mengambil data kelas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [user, authLoading]);

  const filteredCourses = enrolledCourses.filter(course => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return course.registration.status === 'CONFIRMED';
    if (activeTab === 'pending') return course.registration.status !== 'CONFIRMED';
    return true;
  });

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
           <BookOpen size={40} className="text-slate-300" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Ruang Belajar Eksklusif</h1>
        <p className="text-slate-500 mb-8 max-w-sm leading-relaxed text-sm">Masuk menggunakan akun Google Anda untuk melanjutkan sesi pembelajaran dan melihat progres.</p>
        <Button onClick={() => router.push('/login')} className="h-12 rounded-full px-10 font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200">
          Masuk / Registrasi
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 font-sans selection:bg-amber-100 selection:text-amber-900">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6">
        
        {/* PageHero Terpadu */}
        <PageHero 
          breadcrumbs={[{ label: 'Ruang Belajar', href: '/ruang-belajar' }]}
          badge={{ label: 'Dashboard Peserta Diklat', icon: <BookOpen size={13} />, variant: 'amber' }}
          title="Ruang Belajar & Kelas Saya"
          subtitle="Lanjutkan progres belajar Anda, tonton video materi, dan pantau sertifikat kompetensi yang telah diraih."
          accentColor="amber"
          actions={
            <div className="flex bg-white p-1 rounded-2xl shrink-0 border border-slate-200/80 shadow-xs overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'Semua Kelas' },
                { id: 'active', label: 'Sedang Aktif' },
                { id: 'pending', label: 'Menunggu' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-amber-50 text-amber-800 shadow-xs border border-amber-100' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          }
        />

        {/* DAFTAR KELAS */}
        <AnimatePresence mode="wait">
          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xs">
              <EmptyState 
                icon={BookOpen}
                title="Belum Ada Kelas Terdaftar"
                description="Anda belum memiliki kelas aktif pada kategori ini. Silakan jelajahi katalog pelatihan untuk mendaftar program baru."
                actionLabel="Jelajahi Pelatihan"
                onAction={() => router.push('/program-pelatihan')}
              />
            </div>
          ) : (
            // LAYOUT UPDATE: Menambahkan 2xl:grid-cols-4 agar proporsional pada layar sangat lebar
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 xl:gap-8"
            >
              {filteredCourses.map((course, idx) => {
                const { training, registration } = course;
                const isConfirmed = registration.status === 'CONFIRMED';
                const isRejected = registration.status === 'REJECTED';
                
                const totalLessons = training.curriculum?.reduce((acc: number, curr: any) => acc + (curr.lessons?.length || 0), 0) || 0;
                const completedCount = registration.completedLessons?.length || 0;
                const realProgress = (isConfirmed && totalLessons > 0) ? Math.round((completedCount / totalLessons) * 100) : 0; 

                return (
                  <motion.div 
                    key={registration.id} 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className="bg-white w-full h-full rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col group p-3 relative hover:-translate-y-1"
                  >
                    <div className="relative aspect-video xl:h-52 bg-slate-100 rounded-[1.5rem] shrink-0 overflow-hidden mb-2">
                      {training.imageUrl ? (
                        <img src={training.imageUrl} alt={training.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900"><BookOpen className="w-12 h-12 text-slate-700" /></div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      
                      <div className="absolute top-4 right-4">
                        {isConfirmed ? (
                          <Badge className="bg-emerald-500/90 backdrop-blur-md text-white font-bold border-none shadow-sm px-3 py-1.5 text-[10px] uppercase tracking-wider">Akses Aktif</Badge>
                        ) : isRejected ? (
                          <Badge variant="destructive" className="bg-red-500 font-bold shadow-sm px-3 py-1.5 text-[10px] uppercase tracking-wider text-white border-none">Ditolak</Badge>
                        ) : (
                          <Badge className="bg-amber-500/90 backdrop-blur-md text-white font-bold border-none shadow-sm flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider"><Clock size={12}/> Menunggu</Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1 bg-white">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                        {training.title}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 mb-8">
                        Terdaftar: {new Date(registration.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                      </p>

                      <div className="mt-auto">
                        {isConfirmed ? (
                          <div className="space-y-5">
                            <div>
                              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                <span>Progres Belajar</span>
                                <span className={realProgress > 0 ? "text-emerald-500" : ""}>{realProgress}%</span>
                              </div>
                              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }} animate={{ width: `${realProgress}%` }} transition={{ duration: 1, delay: 0.5 }}
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                                ></motion.div>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => router.push(`/ruang-belajar/${training.id}`)} 
                              className={`w-full rounded-2xl font-bold transition-all h-14 text-base shadow-sm ${realProgress > 0 ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                            >
                              <PlayCircle className="mr-2 h-5 w-5" /> {realProgress > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar'}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-amber-700 text-xs xl:text-sm font-medium leading-relaxed">
                            <AlertCircle size={20} className="shrink-0 text-amber-500"/> 
                            Pendaftaran sedang ditinjau. Anda akan mendapatkan akses setelah pembayaran/persyaratan divalidasi.
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}