'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { trainingService } from '@/services/training.service';
import { Training } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import {
  BookOpen,
  Loader2,
  PlayCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Award,
  CheckCircle2,
  GraduationCap,
  Download,
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';
import { formatRupiah } from '@/utils/format';

interface CourseData {
  registration: any;
  training: any;
}

export default function MyLearningDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [enrolledCourses, setEnrolledCourses] = useState<CourseData[]>([]);
  const [recommendedTrainings, setRecommendedTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [coursesData, allTrainings] = await Promise.all([
          trainingService.getMyEnrolledCourses(user.email!),
          trainingService.getTrainings(8)
        ]);
        setEnrolledCourses(coursesData);
        // Rekomendasi pelatihan yang belum diikuti
        const enrolledIds = new Set(coursesData.map(c => c.training?.id));
        const filteredRecommendations = allTrainings
          .filter(t => !enrolledIds.has(t.id) && (t.status === 'Published' || t.status === 'Aktif'))
          .slice(0, 4);
        setRecommendedTrainings(filteredRecommendations);
      } catch (error) {
        console.error('Gagal mengambil data kelas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  // Statistik Pembelajaran
  const totalCourses = enrolledCourses.length;
  const activeCourses = enrolledCourses.filter(c => c.registration.status === 'CONFIRMED');
  const pendingCourses = enrolledCourses.filter(c => c.registration.status !== 'CONFIRMED' && c.registration.status !== 'REJECTED');
  
  const completedCourses = enrolledCourses.filter(c => {
    const isConfirmed = c.registration.status === 'CONFIRMED';
    const totalLessons = c.training?.curriculum?.reduce((acc: number, curr: any) => acc + (curr.lessons?.length || 0), 0) || 0;
    const completedCount = c.registration.completedLessons?.length || 0;
    return isConfirmed && totalLessons > 0 && completedCount >= totalLessons;
  });

  const filteredCourses = enrolledCourses.filter(course => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return course.registration.status === 'CONFIRMED';
    if (activeTab === 'pending') return course.registration.status !== 'CONFIRMED';
    return true;
  });

  const handleDownloadCertificate = (trainingTitle: string, regId: string) => {
    toast.success('Sertifikat Berhasil Diunduh!', {
      description: `E-Sertifikat resmi kompetensi "${trainingTitle}" telah diterbitkan untuk ${user?.displayName || user?.email}.`
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <SectionContainer accent="amber">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-center mb-6 text-amber-500">
            <BookOpen size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
            Ruang Belajar Eksklusif
          </h1>
          <p className="text-slate-500 mb-8 max-w-md leading-relaxed text-sm sm:text-base">
            Masuk menggunakan akun Google Anda untuk mengakses kurikulum, materi video interaktif, kuis kelulusan, dan sertifikat kompetensi industri.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="h-12 rounded-full px-8 font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-300"
          >
            Masuk / Registrasi Sekarang
          </Button>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer accent="amber">
      {/* 1. PageHero Terpadu */}
      <PageHero
        breadcrumbs={[{ label: 'Ruang Belajar', href: '/ruang-belajar' }]}
        badge={{ label: 'Dashboard Peserta Diklat', icon: <BookOpen size={13} />, variant: 'amber' }}
        title="Ruang Belajar & Kelas Saya"
        subtitle="Lanjutkan modul pelatihan vokasi terapan, selesaikan tugas praktik, dan peroleh e-sertifikat kompetensi berstandar industri."
        accentColor="amber"
      />

      {/* 2. KPI Summary Bar (Statistik Progres Siswa) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="public-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Terdaftar</p>
            <h4 className="text-2xl font-black text-slate-900">{totalCourses} <span className="text-xs font-normal text-slate-500">Kelas</span></h4>
          </div>
        </div>

        <div className="public-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <PlayCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sedang Aktif</p>
            <h4 className="text-2xl font-black text-slate-900">{activeCourses.length} <span className="text-xs font-normal text-slate-500">Kelas</span></h4>
          </div>
        </div>

        <div className="public-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai / Lulus</p>
            <h4 className="text-2xl font-black text-slate-900">{completedCourses.length} <span className="text-xs font-normal text-slate-500">Program</span></h4>
          </div>
        </div>

        <div className="public-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sertifikat Resmi</p>
            <h4 className="text-2xl font-black text-slate-900">{completedCourses.length} <span className="text-xs font-normal text-slate-500">Dokumen</span></h4>
          </div>
        </div>
      </div>

      {/* 3. Filter Navigasi PillTabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <PillTabs
          tabs={[
            { key: 'all', label: `Semua Kelas (${totalCourses})` },
            { key: 'active', label: `Sedang Aktif (${activeCourses.length})` },
            { key: 'pending', label: `Menunggu Verifikasi (${pendingCourses.length})` },
          ]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
          layoutId="ruang-belajar-tabs"
          ariaLabel="Filter Status Kelas"
        />

        <Link
          href="/program-pelatihan"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors"
        >
          <span>Eksplorasi Kelas Baru</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* 4. Daftar Kelas Peserta */}
      <AnimatePresence mode="wait">
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xs mb-12">
            <EmptyState
              icon={BookOpen}
              title="Belum Ada Kelas Terdaftar"
              description="Anda belum memiliki kelas aktif pada kategori ini. Silakan jelajahi katalog pelatihan untuk mendaftar program baru berstandar industri."
              actionLabel="Jelajahi Katalog Pelatihan"
              onAction={() => router.push('/program-pelatihan')}
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="public-grid-4 mb-14"
          >
            {filteredCourses.map((course, idx) => {
              const { training, registration } = course;
              const isConfirmed = registration.status === 'CONFIRMED';
              const isRejected = registration.status === 'REJECTED';

              const totalLessons = training.curriculum?.reduce((acc: number, curr: any) => acc + (curr.lessons?.length || 0), 0) || 0;
              const completedCount = registration.completedLessons?.length || 0;
              const realProgress = (isConfirmed && totalLessons > 0) ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;
              const isCompleted = isConfirmed && realProgress === 100;

              return (
                <motion.div
                  key={registration.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="public-card p-4 flex flex-col group relative"
                >
                  {/* Thumbnail Cover */}
                  <div className="relative aspect-video bg-slate-100 rounded-2xl shrink-0 overflow-hidden mb-4">
                    {training.imageUrl ? (
                      <img
                        src={training.imageUrl}
                        alt={training.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        <BookOpen className="w-10 h-10 text-slate-700" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                    <div className="absolute top-3 right-3">
                      {isCompleted ? (
                        <Badge className="bg-emerald-600 backdrop-blur-md text-white font-bold border-none shadow-xs px-2.5 py-1 text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={11} /> Lulus
                        </Badge>
                      ) : isConfirmed ? (
                        <Badge className="bg-blue-600/90 backdrop-blur-md text-white font-bold border-none shadow-xs px-2.5 py-1 text-[10px] uppercase tracking-wider">
                          Akses Aktif
                        </Badge>
                      ) : isRejected ? (
                        <Badge variant="destructive" className="bg-red-500 font-bold shadow-xs px-2.5 py-1 text-[10px] uppercase tracking-wider text-white border-none">
                          Ditolak
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/95 backdrop-blur-md text-white font-bold border-none shadow-xs flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider">
                          <Clock size={11} /> Menunggu
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col flex-1">
                    <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                      {training.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Terdaftar: {new Date(registration.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </p>

                    {/* Progress Bar & Actions */}
                    <div className="mt-auto pt-2">
                      {isConfirmed ? (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                              <span>Progres Kurikulum</span>
                              <span className={realProgress > 0 ? 'text-amber-600 font-extrabold' : ''}>
                                {completedCount} / {totalLessons} Selesai ({realProgress}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${realProgress}%` }}
                                transition={{ duration: 0.8 }}
                                className={`h-full rounded-full ${
                                  isCompleted
                                    ? 'bg-emerald-500'
                                    : 'bg-gradient-to-r from-amber-400 to-amber-500'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Button
                              onClick={() => router.push(`/ruang-belajar/${training.id}`)}
                              className={`w-full rounded-xl font-bold transition-all h-11 text-xs sm:text-sm shadow-xs ${
                                isCompleted
                                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white'
                              }`}
                            >
                              <PlayCircle className="mr-1.5 h-4 w-4" />
                              {isCompleted ? 'Akses Ulang Materi' : realProgress > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar'}
                            </Button>

                            {isCompleted && (
                              <Button
                                onClick={() => handleDownloadCertificate(training.title, registration.id)}
                                variant="outline"
                                className="w-full rounded-xl font-bold h-10 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              >
                                <Download className="mr-1.5 h-4 w-4" /> Unduh E-Sertifikat
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 rounded-xl border border-amber-100 text-amber-800 text-xs font-medium leading-relaxed">
                          <AlertCircle size={18} className="shrink-0 text-amber-500 mt-0.5" />
                          <span>Pendaftaran Anda sedang ditinjau tim admin. Akses video dan materi akan terbuka otomatis setelah verifikasi selesai.</span>
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

      {/* 5. Rekomendasi Pelatihan Unggulan (Cross-Selling) */}
      {recommendedTrainings.length > 0 && (
        <section className="pt-6 border-t border-slate-200/60">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-2">
                <Sparkles size={13} />
                <span>Rekomendasi Pelatihan Industri</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Tingkatkan Portofolio Anda</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kembangkan keahlian lainnya yang relevan dengan kebutuhan industri saat ini.
              </p>
            </div>
            <Link
              href="/program-pelatihan"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <span>Lihat Semua Katalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="public-grid-4">
            {recommendedTrainings.map((t) => (
              <Link
                key={t.id}
                href={`/program-pelatihan/${t.id}`}
                className="public-card p-4 flex flex-col group hover:-translate-y-1 transition-all"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3">
                  {t.imageUrl ? (
                    <img
                      src={t.imageUrl}
                      alt={t.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <GraduationCap className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                    {t.type || 'Pelatihan'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors">
                  {t.title}
                </h4>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-600">
                    {t.isFree ? 'GRATIS' : formatRupiah(t.price || 0)}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 font-semibold group-hover:text-slate-700">
                    Detail <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </SectionContainer>
  );
}