'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Training } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { 
  ArrowLeft, Loader2, PlayCircle, FileText, CheckCircle2, ChevronDown, 
  Users, MapPin, Calendar, Clock, Lock, MonitorPlay, Award, 
  ChevronRight, Star, X, Play, ShieldCheck, Settings, Wrench, BookOpen, Target, Briefcase,
  Share2, Heart, Check, MessageCircle, Sparkles, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AffiliateShareButton } from '@/components/common/AffiliateShareButton';
import { SocialShareBar } from '@/components/common/SocialShareBar';
import { StickyActionBar } from '@/components/common/StickyActionBar';

// --- HELPER UNTUK MENGUBAH LINK VIDEO MENJADI EMBED ---
const getEmbedUrl = (url?: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) return url.replace(/\/view(.*)/, '/preview');
  if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
  return url;
};

// --- KOMPONEN LOKAL: ACCORDION KURIKULUM TIMELINE ELEGAN ---
const ModuleAccordion = ({ module, index, isOffline, isLast }: { module: any, index: number, isOffline: boolean, isLast: boolean }) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const totalDuration = module.lessons?.reduce((acc: number, curr: any) => acc + (curr.durationMins || 0), 0) || 0;

  return (
    <div className="relative pl-7 sm:pl-10 pb-5">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[13px] sm:left-[19px] top-9 bottom-0 w-px bg-slate-200"></div>
      )}
      
      {/* Timeline Node */}
      <div className={`absolute left-0 sm:left-1 top-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm ${isOpen ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
        <span className="text-xs font-bold">{index + 1}</span>
      </div>

      <div className={`border rounded-2xl overflow-hidden bg-white transition-all duration-300 ${isOpen ? 'border-amber-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-white transition-colors text-left group"
        >
          <div className="pr-3">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-amber-600 transition-colors leading-snug">{module.title}</h4>
            <div className="flex items-center gap-2.5 mt-1 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1"><BookOpen size={13} className="text-amber-500"/> {module.lessons?.length || 0} Materi</span>
              {totalDuration > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="flex items-center gap-1"><Clock size={13}/> {totalDuration} Menit</span>
                </>
              )}
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'bg-amber-50 text-amber-600 rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
            <ChevronDown size={18}/>
          </div>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 sm:p-5 pt-0 space-y-2 bg-white">
                <div className="w-full h-px bg-slate-100 mb-3"></div>
                {module.lessons?.map((lesson: any) => (
                  <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-50 rounded-xl group transition-all gap-3 border border-transparent hover:border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors ${isOffline ? 'bg-orange-50 text-orange-500' : (lesson.type === 'Video' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500')}`}>
                        {isOffline ? <Wrench size={16}/> : (lesson.type === 'Video' ? <PlayCircle size={16}/> : <FileText size={16}/>)}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors leading-snug">{lesson.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{isOffline ? 'Sesi Praktek / Tatap Muka' : (lesson.type === 'Video' ? 'Video Pembelajaran' : 'Materi Bacaan')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 pl-11 sm:pl-0">
                      {!lesson.isLocked ? (
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] uppercase font-bold cursor-pointer hover:bg-emerald-100 transition-colors rounded-full px-2.5 py-0.5">
                          <Play size={10} className="mr-1 fill-emerald-700"/> Preview
                        </Badge>
                      ) : (
                        <span title="Terkunci" className="flex items-center text-xs font-semibold text-slate-400 gap-1">
                          <Lock size={12} /> Terkunci
                        </span>
                      )}
                      {lesson.durationMins > 0 && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 py-0.5 px-2 rounded-md">{lesson.durationMins} mnt</span>}
                    </div>
                  </div>
                ))}
                {(!module.lessons || module.lessons.length === 0) && (
                  <div className="p-6 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    <BookOpen size={20} className="mb-1.5 opacity-50"/>
                    <span className="text-xs font-medium">Materi sedang disusun oleh instruktur.</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function DetailPelatihanPage({ initialTraining }: { initialTraining?: Training | null }) {
  const params = useParams();
  const router = useRouter();
  const trainingId = (params?.id as string) || '';

  const [training, setTraining] = useState<Training | null>(() => {
    if (initialTraining && (!trainingId || initialTraining.id === trainingId)) return initialTraining;
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialTraining && (!trainingId || initialTraining.id === trainingId)) return false;
    return true;
  });
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!trainingId) return;
    if (initialTraining && initialTraining.id === trainingId) {
      setTraining(initialTraining);
      setLoading(false);
      return;
    }

    const fetchTraining = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'trainings', trainingId));
        if (docSnap.exists()) {
          setTraining({ id: docSnap.id, ...docSnap.data() } as Training);
        }
      } catch (error) {
        console.error("Gagal memuat detail kelas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [trainingId, initialTraining]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs font-semibold text-slate-400">Memuat detail program pelatihan...</p>
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] text-slate-500 p-4">
        <MonitorPlay size={56} className="mb-4 text-slate-300"/>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Kelas Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">Program pelatihan yang Anda cari mungkin sudah selesai atau tautan tidak valid.</p>
        <Button onClick={() => router.push('/program-pelatihan')} className="rounded-full px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold">
          Kembali ke Katalog Pelatihan
        </Button>
      </div>
    );
  }

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const isFull = (training.registeredCount || 0) >= (training.quota || 0) && training.quota !== 0;

  let totalLessons = 0;
  let totalDuration = 0;
  training.curriculum?.forEach((mod: any) => {
    totalLessons += mod.lessons?.length || 0;
    mod.lessons?.forEach((les: any) => { totalDuration += (les.durationMins || 0); });
  });

  const whatsIncluded = [
    { icon: <MonitorPlay size={16}/>, text: training.type === 'Offline' ? 'Praktek Langsung (Hands-on)' : 'Akses Video Selamanya' },
    { icon: <Award size={16}/>, text: training.certificationType ? `Sertifikat ${training.certificationType}` : 'Sertifikat Kelulusan Resmi STP' },
    { icon: <Users size={16}/>, text: 'Komunitas Alumni & Diskusi Industri' },
    { icon: <Briefcase size={16}/>, text: 'Peluang Koneksi & Rekomendasi Karir' }
  ];

  if (training.type === 'Offline') {
    whatsIncluded.push({ icon: <Settings size={16}/>, text: 'Peralatan & Bahan Praktek di Lab STP' });
  }

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const cleanWhatsappNumber = training.contactWhatsapp ? training.contactWhatsapp.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';
  const waText = encodeURIComponent(`Halo admin Solo Technopark, saya tertarik dengan pelatihan *${training.title}*. Bisa dibantu informasi pendaftarannya?`);

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-32 font-sans relative selection:bg-amber-100 selection:text-amber-900">
      
      {/* --- HERO SECTION (Tema Terang Bersih & Elegan) --- */}
      <div className="relative pt-6 sm:pt-10 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-10 bg-gradient-to-b from-amber-50/50 via-white to-[#FAFAFA] border-b border-slate-100">
        <div className="w-full max-w-[1400px] mx-auto">
          
          {/* Top Breadcrumb Nav */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-500 mb-5">
            <div className="flex items-center gap-2">
              <Link href="/program-pelatihan" className="hover:text-amber-600 transition-colors flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
                <ArrowLeft size={13}/> Pelatihan
              </Link>
              <ChevronRight size={13} className="text-slate-400"/>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
                {training.category || 'Teknologi'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: training.title, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Tautan pelatihan berhasil disalin!');
                  }
                }}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:text-amber-600 transition-colors shadow-xs"
                title="Bagikan Program"
              >
                <Share2 size={14}/>
              </button>
            </div>
          </div>

          {/* Grid Layout: Hero Mobile/Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* Sisi Kiri: Deskripsi & Judul */}
            <div className="lg:col-span-7 xl:col-span-8">
              
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-amber-500 text-white border-0 font-bold text-[11px] px-2.5 py-0.5 rounded-md">
                  {training.type || 'Offline'}
                </Badge>
                {training.level && (
                  <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 font-bold text-[11px] px-2.5 py-0.5 rounded-md">
                    Level: {training.level}
                  </Badge>
                )}
                {training.certificationType && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-[11px] px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles size={11} className="text-emerald-600"/> Sertifikasi {training.certificationType}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                {training.title}
              </h1>

              <p className="text-slate-600 text-sm sm:text-base lg:text-lg mb-6 leading-relaxed font-normal">
                {training.description ? (training.description.length > 220 ? `${training.description.substring(0, 220)}...` : training.description) : 'Tingkatkan kompetensi Anda bersama para praktisi dan kurikulum industri resmi Solo Technopark.'}
              </p>

              {/* Mobile Media Cover (Tampil di Layar Ponsel & Tablet < lg) */}
              <div className="block lg:hidden mb-6">
                <div 
                  className={`w-full relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm group ${training.promoVideoUrl ? 'cursor-pointer' : ''}`}
                  onClick={() => training.promoVideoUrl && setIsVideoModalOpen(true)}
                >
                  {training.imageUrl ? (
                    <img src={training.imageUrl} alt={training.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-slate-400 bg-slate-50">
                      <MonitorPlay size={36} className="mb-2 opacity-50"/>
                      <span className="text-xs font-semibold">Solo Technopark Academy</span>
                    </div>
                  )}
                  
                  {training.promoVideoUrl && (
                    <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center transition-colors group-hover:bg-slate-950/40">
                      <div className="w-13 h-13 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 ml-0.5" fill="currentColor"/>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                      {training.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clean Meta Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Star size={18} className="fill-amber-500 text-amber-500"/>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Rating Kelas</span>
                    <span className="text-sm font-black text-slate-900">4.9 <span className="text-xs text-slate-400 font-semibold">(120+ ulasan)</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Users size={18}/>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Peserta</span>
                    <span className="text-sm font-black text-slate-900">{training.registeredCount || 0} Siswa</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Award size={18}/>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Kelulusan</span>
                    <span className="text-sm font-black text-slate-900">Sertifikat Resmi</span>
                  </div>
                </div>
              </div>

              {/* Social Share & Quick Quota Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <SocialShareBar 
                  title={training.title} 
                  description={training.description} 
                  compact={true}
                />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  <span className={`w-2 h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span>{isFull ? 'Kuota Penuh' : `Tersisa ${Math.max(0, (training.quota || 30) - (training.registeredCount || 0))} kursi lagi`}</span>
                </div>
              </div>

            </div>

            {/* Sisi Kanan: Ruang penampung kolom desktop */}
            <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
              {/* Ruang kosong untuk alignment hero desktop, floating card ada di body */}
            </div>

          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT & SIDEBAR CONTAINER --- */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mt-6 lg:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
          
          {/* KOLOM KIRI: KONTEN DETAIL */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Sticky Navigation PillTabs (Bersih & Borderless) */}
            <div className="sticky top-4 z-40 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs rounded-full p-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Tentang' },
                { id: 'skills', label: 'Kompetensi' },
                { id: 'curriculum', label: training.type === 'Offline' ? 'Silabus' : 'Kurikulum' },
                { id: 'mentor', label: 'Instruktur' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? 'bg-amber-500 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Section: Overview (Tentang Kelas) */}
            <section id="overview" className="bg-white p-5 sm:p-8 rounded-3xl shadow-xs border border-slate-200/70 scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 tracking-tight">Tentang Program Ini</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal whitespace-pre-wrap">
                  {training.description}
                </p>
              </div>

              {/* Syarat & Target Peserta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100/60">
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <Lock size={15} className="text-amber-500"/> Syarat Pendaftaran
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-700">
                    {training.prerequisites?.map((prq, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                        <span>{prq}</span>
                      </li>
                    ))}
                    {(!training.prerequisites || training.prerequisites.length === 0) && (
                      <li className="flex items-center gap-2 text-slate-600">
                        <Check size={14} className="text-emerald-500"/> Terbuka untuk Umum & Pemula
                      </li>
                    )}
                  </ul>
                </div>

                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <Target size={15} className="text-blue-500"/> Target Peserta
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-700">
                    {training.targetAudience?.map((aud, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        <span>{aud}</span>
                      </li>
                    ))}
                    {(!training.targetAudience || training.targetAudience.length === 0) && (
                      <li className="flex items-center gap-2 text-slate-600">
                        <Check size={14} className="text-emerald-500"/> Siapa saja yang ingin meningkatkan keahlian (upskilling & reskilling).
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            {/* Section: Skills (Tema Terang Bersih, Menggantikan Box Gelap) */}
            <section id="skills" className="scroll-mt-24">
              <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-xs border border-slate-200/70">
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-full mb-2">
                    <Sparkles size={12}/> Target Output
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Keahlian yang Anda Kuasai</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Kompetensi teknis dan praktis yang akan Anda peroleh setelah menyelesaikan kelas ini.</p>
                </div>
                
                {(!training.skillsGained || training.skillsGained.length === 0) ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-500 text-xs sm:text-sm font-medium">
                    Informasi keahlian spesifik sedang diperbarui oleh tim akademik STP.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {training.skillsGained.map((skill, idx) => (
                      <div key={idx} className="bg-slate-50/80 hover:bg-amber-50/40 transition-colors border border-slate-100 hover:border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Check size={12} />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">{skill}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Section: Curriculum / Silabus */}
            <section id="curriculum" className="scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2 px-1">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {training.type === 'Offline' ? 'Silabus Pembelajaran' : 'Kurikulum Kelas'}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">Materi disusun terstruktur dan sesuai kebutuhan dunia industri.</p>
                </div>
                <div className="text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 self-start sm:self-auto">
                  <BookOpen size={13} className="text-amber-500"/> {training.curriculum?.length || 0} Modul
                  <span className="w-1 h-1 rounded-full bg-slate-300 mx-0.5"></span>
                  {totalLessons} Materi
                </div>
              </div>
              
              <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-xs border border-slate-200/70">
                {training.curriculum?.map((module, index) => (
                  <ModuleAccordion 
                    key={module.id} 
                    module={module} 
                    index={index} 
                    isOffline={training.type === 'Offline'} 
                    isLast={index === (training.curriculum?.length || 0) - 1}
                  />
                ))}
                {(!training.curriculum || training.curriculum.length === 0) && (
                  <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 font-medium">
                    <BookOpen size={28} className="mx-auto mb-2 text-slate-300"/>
                    <p className="text-xs sm:text-sm">Kurikulum detail sedang dipersiapkan oleh tim akademik.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section: Mentors / Instruktur */}
            {training.instructors && training.instructors.length > 0 && (
              <section id="mentor" className="scroll-mt-24">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 tracking-tight px-1">Instruktur & Praktisi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {training.instructors.map(inst => (
                    <div key={inst.id} className="bg-white border border-slate-200/80 hover:border-amber-300 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-20 h-20 mb-4 rounded-full bg-slate-100 overflow-hidden shrink-0 border-3 border-amber-50 shadow-xs">
                        {inst.photoUrl ? (
                          <img src={inst.photoUrl} alt={inst.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50"><Users size={28}/></div>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-0.5">{inst.name}</h3>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold border-none uppercase tracking-wide text-[10px] mb-3">
                        {inst.title}
                      </Badge>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                        {inst.bio || 'Praktisi industri berpengalaman yang siap membimbing Anda dari pemahaman dasar hingga penguasaan standar operasional.'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section: Ulasan & Testimoni Alumni Terverifikasi */}
            <section id="reviews" className="scroll-mt-24">
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/70 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-full mb-2">
                      <Star size={12} className="fill-amber-500 text-amber-500"/> Alumni Stories
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Ulasan Alumni Terverifikasi</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Pengalaman nyata dari mereka yang telah lulus dan berkarya di industri.</p>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-3 sm:p-4 text-center shrink-0 border border-amber-200/60">
                    <span className="text-2xl sm:text-3xl font-black text-amber-700 leading-none">4.9</span>
                    <span className="text-xs text-amber-600 block font-bold mt-0.5">★★★★★</span>
                    <span className="text-[10px] text-amber-700/80 font-semibold block mt-0.5">98% Kepuasan</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      name: 'Rizky Pratama, S.T.',
                      role: 'Alumni 2024 · Automation Eng.',
                      comment: 'Materi sangat aplikatif dan fasilitas workshop CNC di STP langsung siap pakai untuk standar industri.',
                    },
                    {
                      name: 'Anisa Dwi Lestari',
                      role: 'Alumni 2025 · Frontend Dev',
                      comment: 'Instruktur sabar mendampingi praktek dari nol. Sertifikat kelulusannya sangat diakui saat melamar kerja.',
                    },
                    {
                      name: 'Bagus Wicaksono',
                      role: 'Alumni 2025 · Technopreneur',
                      comment: 'Dikenalkan ke ekosistem inkubasi bisnis Solo Technopark sehingga produk hasil karya bisa langsung dikomersialkan.',
                    }
                  ].map((rev, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-1 text-amber-500 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal italic">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60">
                        <p className="text-xs font-bold text-slate-900 leading-tight">{rev.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{rev.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
          </div>

          {/* KOLOM KANAN: DESKTOP FLOATING SIDEBAR (Tersembunyi di Mobile) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-20 z-30">
              
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
                
                {/* Desktop Video / Cover Area */}
                <div 
                  className={`w-full relative aspect-video bg-slate-100 group ${training.promoVideoUrl ? 'cursor-pointer' : ''}`}
                  onClick={() => training.promoVideoUrl && setIsVideoModalOpen(true)}
                >
                  {training.imageUrl ? (
                    <img src={training.imageUrl} alt="Poster Kelas" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-slate-400 bg-slate-50">
                      <MonitorPlay size={40} className="mb-2 opacity-50"/>
                      <span className="text-xs font-semibold">Solo Technopark</span>
                    </div>
                  )}
                  
                  {training.promoVideoUrl && (
                    <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center transition-colors group-hover:bg-slate-900/40">
                      <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play className="w-7 h-7 ml-0.5" fill="currentColor"/>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-white/90 backdrop-blur-md text-slate-800 border-none font-bold text-[10px] tracking-wider uppercase shadow-xs">
                      {training.type}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  {/* Pricing Block */}
                  <div className="mb-6">
                    {training.isFree ? (
                      <h2 className="text-3xl lg:text-4xl font-black text-emerald-600 tracking-tight">Gratis</h2>
                    ) : (
                      <div className="flex flex-col">
                        {training.discountPrice && training.discountPrice > training.price && (
                          <span className="text-xs text-slate-400 font-bold line-through mb-0.5 flex items-center gap-1.5">
                            {formatRupiah(training.discountPrice)}
                            <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-none px-1.5 py-0.2 text-[9px]">HEMAT</Badge>
                          </span>
                        )}
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{formatRupiah(training.price)}</h2>
                      </div>
                    )}
                  </div>

                  {/* Quota Progress Bar */}
                  <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Ketersediaan Kuota</span>
                      <span className={isFull ? 'text-red-600' : 'text-emerald-600'}>
                        {isFull ? 'Penuh' : `${Math.max(0, (training.quota || 30) - (training.registeredCount || 0))} Kursi Tersisa`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, Math.round(((training.registeredCount || 0) / (training.quota || 30)) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <Button 
                    onClick={() => router.push(`/program-pelatihan/${training.id}/daftar`)}
                    disabled={isFull}
                    className={`w-full h-12 rounded-full text-sm font-bold shadow-md transition-all duration-300 mb-2.5 flex items-center justify-center gap-2 ${
                      isFull 
                        ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' 
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    }`}
                  >
                    {isFull ? 'Kuota Penuh' : 'Daftar Kelas Sekarang'}
                  </Button>
                  
                  {/* WhatsApp CTA */}
                  {cleanWhatsappNumber && (
                    <a 
                      href={`https://wa.me/${cleanWhatsappNumber}?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 rounded-full text-sm font-bold shadow-sm transition-all duration-300 mb-2.5 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white"
                    >
                      <MessageCircle size={18}/>
                      Tanya via WhatsApp
                    </a>
                  )}

                  {/* Affiliate / Public Share CTA */}
                  <AffiliateShareButton
                    path={`/program-pelatihan/${training.id}`}
                    title={training.title}
                    description={training.description}
                    className="w-full h-12 mb-5"
                    variant="subtle"
                  />
                  
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-6 px-1">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500"/> Sertifikasi & Instruktur Resmi</span>
                  </div>

                  {/* What's included */}
                  <div className="space-y-4 border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Fasilitas yang didapatkan:</h4>
                    <ul className="space-y-3">
                      {whatsIncluded.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                          <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            {item.icon}
                          </span>
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Logistics Detail */}
                  <div className="mt-6 bg-slate-50/80 rounded-2xl p-4 space-y-3 border border-slate-100 text-xs">
                    {training.durationDisplay && (
                      <div className="flex items-start gap-2.5">
                        <Clock size={16} className="text-slate-400 shrink-0 mt-0.5"/> 
                        <div>
                          <span className="block text-slate-800 font-bold">Durasi: {training.durationDisplay}</span>
                          {training.scheduleDetails && <span className="text-slate-500 font-medium mt-0.5 block">{training.scheduleDetails}</span>}
                        </div>
                      </div>
                    )}
                    
                    {training.type !== 'Video Course' && (
                      <>
                        <div className="flex items-center gap-2.5">
                          <Calendar size={16} className="text-slate-400 shrink-0"/> 
                          <span className="text-slate-700 font-bold">{training.date ? new Date(training.date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Jadwal Reguler STP'}</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5"/> 
                          <span className="text-slate-700 font-medium leading-snug">{training.location || 'Solo Technopark, Surakarta'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Cross-Link Resmi ke E-Katalog */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Link
                      href={`/e-katalog/${training.id}`}
                      className="w-full h-11 rounded-2xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200 border border-slate-200/80 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xs"
                    >
                      <ShoppingBag size={15} className="text-amber-600" />
                      <span>Lihat Spesifikasi di E-Katalog STP</span>
                    </Link>
                  </div>

                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>

      {/* --- MOBILE STICKY BOTTOM DUAL-CTA (Tema Terang & Borderless) --- */}
      <div className="public-detail-bottom-bar lg:hidden">
        <div>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Biaya Pelatihan</p>
           {training.isFree ? (
             <p className="text-lg font-black text-emerald-600 leading-none">Gratis</p>
           ) : (
             <p className="text-lg font-black text-slate-900 leading-none">{formatRupiah(training.price)}</p>
           )}
        </div>
        
        <div className="flex items-center gap-2">
          <AffiliateShareButton
            path={`/program-pelatihan/${training.id}`}
            title={training.title}
            description={training.description}
            size="sm"
            variant="subtle"
          />
          {cleanWhatsappNumber && (
            <a 
              href={`https://wa.me/${cleanWhatsappNumber}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#25D366] text-white shadow-sm shrink-0"
              title="Hubungi Admin WhatsApp"
            >
              <MessageCircle size={18}/>
            </a>
          )}
          <Button 
            onClick={() => router.push(`/program-pelatihan/${training.id}/daftar`)}
            disabled={isFull}
            className={`h-11 px-5 rounded-full text-xs font-bold shadow-md border-0 ${
              isFull 
                ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' 
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {isFull ? 'Penuh' : 'Daftar Sekarang'}
          </Button>
        </div>
      </div>

      {/* --- VIDEO MODAL --- */}
      <AnimatePresence>
        {isVideoModalOpen && training.promoVideoUrl && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6"
          >
            <button 
              onClick={() => setIsVideoModalOpen(false)} 
              className="absolute top-5 right-5 sm:top-8 sm:right-8 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-2.5 rounded-full backdrop-blur-md transition-all z-50"
            >
              <X size={20}/>
            </button>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 15 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20 relative"
            >
               <iframe 
                 src={getEmbedUrl(training.promoVideoUrl) + '?autoplay=1'} 
                 className="absolute inset-0 w-full h-full border-none" 
                 allowFullScreen 
                 allow="autoplay; encrypted-media; picture-in-picture"
               ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STICKY ACTION BAR SAAT SCROLL (Desktop & Tablet) --- */}
      <StickyActionBar threshold={450}>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">{training.title}</h4>
            <p className="text-[11px] text-slate-500">
              {training.isFree ? 'Pelatihan Gratis' : formatRupiah(training.price)} · {isFull ? 'Kuota Penuh' : `${Math.max(0, (training.quota || 30) - (training.registeredCount || 0))} kursi tersisa`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AffiliateShareButton
            path={`/program-pelatihan/${training.id}`}
            title={training.title}
            description={training.description}
            size="sm"
            variant="subtle"
          />
          <Button 
            onClick={() => router.push(`/program-pelatihan/${training.id}/daftar`)}
            disabled={isFull}
            className={`h-10 px-5 rounded-full text-xs font-bold shadow-md border-0 ${
              isFull 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {isFull ? 'Penuh' : 'Daftar Sekarang'}
          </Button>
        </div>
      </StickyActionBar>

    </div>
  );
}