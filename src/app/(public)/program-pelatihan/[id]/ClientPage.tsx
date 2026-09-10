'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Training } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { 
  ArrowLeft, Loader2, PlayCircle, FileText, CheckCircle2, ChevronDown, ChevronUp, 
  Users, MapPin, Calendar, Clock, Lock, Unlock, MonitorPlay, Infinity, Award, 
  ChevronRight, Star, X, Play, ShieldCheck, Settings, Wrench, BookOpen, Target, Briefcase,
  Share2, Heart, Check, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <div className="relative pl-8 md:pl-12 pb-6">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[15px] md:left-[23px] top-10 bottom-0 w-px bg-slate-200"></div>
      )}
      
      {/* Timeline Node */}
      <div className={`absolute left-0 md:left-2 top-4 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shrink-0 z-10 ${isOpen ? 'bg-amber-500' : 'bg-slate-300'}`}>
        <span className="text-white text-xs font-bold">{index + 1}</span>
      </div>

      <div className={`border rounded-[20px] overflow-hidden bg-white transition-all duration-300 ${isOpen ? 'border-amber-200 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]' : 'border-slate-100 shadow-sm hover:border-slate-300'}`}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-full flex items-center justify-between p-5 md:p-6 bg-white transition-colors text-left group"
        >
          <div>
            <h4 className="font-bold text-slate-900 text-base md:text-lg group-hover:text-amber-600 transition-colors">{module.title}</h4>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1"><BookOpen size={14}/> {module.lessons?.length || 0} Materi</span>
              {totalDuration > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="flex items-center gap-1"><Clock size={14}/> {totalDuration} Menit</span>
                </>
              )}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? 'bg-amber-50 text-amber-600 rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
            <ChevronDown size={20}/>
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
              <div className="p-4 md:p-6 pt-0 space-y-2 bg-white">
                <div className="w-full h-px bg-slate-100 mb-4"></div>
                {module.lessons?.map((lesson: any, lIndex: number) => (
                  <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 hover:bg-slate-50/80 rounded-2xl group transition-all gap-4 border border-transparent hover:border-slate-100">
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isOffline ? 'bg-orange-50 text-orange-500 group-hover:bg-orange-100' : (lesson.type === 'Video' ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-100' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100')}`}>
                        {isOffline ? <Wrench size={20}/> : (lesson.type === 'Video' ? <PlayCircle size={20}/> : <FileText size={20}/>)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors leading-snug">{lesson.title}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{isOffline ? 'Sesi Praktek / Tatap Muka' : (lesson.type === 'Video' ? 'Video Pembelajaran' : 'Materi Bacaan')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 pl-14 sm:pl-0">
                      {!lesson.isLocked ? (
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50 text-[10px] uppercase font-bold cursor-pointer hover:bg-emerald-100 transition-colors rounded-full px-3 py-1">
                          <Play size={12} className="mr-1.5 fill-emerald-700"/> Preview
                        </Badge>
                      ) : (
                        <span title="Terkunci" className="flex items-center text-xs font-bold text-slate-400 gap-1.5">
                          <Lock size={12} /> Terkunci
                        </span>
                      )}
                      {lesson.durationMins > 0 && <span className="text-xs font-bold text-slate-400 w-14 text-right bg-slate-50 py-1 px-2 rounded-md">{lesson.durationMins} mnt</span>}
                    </div>
                  </div>
                ))}
                {(!module.lessons || module.lessons.length === 0) && (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <BookOpen size={24} className="mb-2 opacity-50"/>
                    <span className="text-sm font-medium">Materi sedang disusun oleh instruktur.</span>
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

export default function DetailPelatihanPage() {
  const params = useParams();
  const router = useRouter();
  const trainingId = params?.id as string;

  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTraining = async () => {
      if (!trainingId) return;
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
  }, [trainingId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  if (!training) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-500"><MonitorPlay size={64} className="mb-4 text-slate-300"/><h2 className="text-2xl font-bold text-slate-800 mb-4">Kelas Tidak Ditemukan</h2><Button onClick={() => router.push('/program-pelatihan')} className="rounded-xl px-8 bg-amber-500 hover:bg-amber-600 text-white">Kembali ke Katalog</Button></div>;

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const isFull = (training.registeredCount || 0) >= (training.quota || 0) && training.quota !== 0;

  let totalLessons = 0;
  let totalDuration = 0;
  training.curriculum?.forEach((mod: any) => {
    totalLessons += mod.lessons?.length || 0;
    mod.lessons?.forEach((les: any) => { totalDuration += (les.durationMins || 0); });
  });
  const totalHours = Math.floor(totalDuration / 60);
  
  // Fitur Fasilitas/What's included (Dinamis berdasarkan tipe pelatihan)
  const whatsIncluded = [
    { icon: <MonitorPlay size={16}/>, text: training.type === 'Offline' ? 'Praktek Langsung (Hands-on)' : 'Akses Video Selamanya' },
    { icon: <Award size={16}/>, text: training.certificationType ? `Sertifikat ${training.certificationType}` : 'Sertifikat Kelulusan' },
    { icon: <Users size={16}/>, text: 'Komunitas Alumni & Diskusi' },
    { icon: <Briefcase size={16}/>, text: 'Peluang Koneksi Industri' }
  ];

  if (training.type === 'Offline') {
    whatsIncluded.push({ icon: <Settings size={16}/>, text: 'Peralatan & Bahan Praktek' });
  }

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-32 font-sans relative selection:bg-amber-100 selection:text-amber-900">
      
      {/* --- HERO SECTION --- */}
      <div className="relative pt-24 pb-40 lg:pb-56 px-4 sm:px-6 lg:px-10 overflow-hidden bg-slate-900">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          {training.imageUrl && (
            <img src={training.imageUrl} alt="Cover" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-amber-500/10 to-transparent blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-amber-500 mb-8 uppercase tracking-widest">
              <Link href="/program-pelatihan" className="hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10"><ArrowLeft size={14}/> Katalog</Link>
              <ChevronRight size={14} className="text-slate-600"/>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full">{training.category}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15] mb-6 tracking-tight drop-shadow-sm">
              {training.title}
            </h1>
            
            <p className="text-slate-300 text-lg lg:text-xl mb-10 leading-relaxed max-w-3xl font-medium">
              {training.description?.substring(0, 180)}...
            </p>
            
            {/* Glassmorphism Meta Bar */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 max-w-max">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rating Kelas</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-white">4.9</span>
                  <div className="flex items-center text-amber-400">
                    <Star fill="currentColor" size={14}/><Star fill="currentColor" size={14}/><Star fill="currentColor" size={14}/><Star fill="currentColor" size={14}/><Star fill="currentColor" size={14}/>
                  </div>
                  <span className="text-xs text-slate-400 ml-1 underline decoration-slate-600 decoration-dashed cursor-pointer">(120+)</span>
                </div>
              </div>
              
              <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
              
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tingkat Kelas</span>
                <span className="text-sm font-bold text-white flex items-center gap-2"><Target size={16} className="text-amber-400"/> {training.level}</span>
              </div>

              <div className="w-px h-10 bg-white/10 hidden sm:block"></div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Peserta Terdaftar</span>
                <span className="text-sm font-bold text-white flex items-center gap-2"><Users size={16} className="text-emerald-400"/> {training.registeredCount || 0} Siswa</span>
              </div>
            </div>

          </div>
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 relative h-0"></div>
        </div>
      </div>

      {/* --- MAIN CONTENT & SIDEBAR --- */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 -mt-16 lg:-mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
          
          {/* KIRI: KONTEN UTAMA */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Sticky Navigation Tabs */}
            <div className="sticky top-0 lg:top-4 z-40 bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm rounded-full p-1.5 flex items-center gap-1 overflow-x-auto custom-scrollbar mt-10 lg:mt-0">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'skills', label: 'Materi & Keahlian' },
                { id: 'curriculum', label: training.type === 'Offline' ? 'Silabus Praktek' : 'Kurikulum' },
                { id: 'mentor', label: 'Instruktur' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Section: Overview */}
            <section id="overview" className="bg-white p-6 md:p-10 rounded-[32px] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100 scroll-mt-24">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 tracking-tight">Tentang Program Ini</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                  {training.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 pt-10 border-t border-slate-100">
                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50">
                  <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2"><Lock size={18} className="text-amber-500"/> Syarat Pendaftaran</h3>
                  <ul className="space-y-3 text-sm font-medium text-slate-700">
                    {training.prerequisites?.map((prq, idx) => (
                      <li key={idx} className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div> {prq}</li>
                    ))}
                    {(!training.prerequisites || training.prerequisites.length === 0) && <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> Terbuka untuk Umum / Pemula</li>}
                  </ul>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2"><Target size={18} className="text-blue-500"/> Target Peserta</h3>
                  <ul className="space-y-3 text-sm font-medium text-slate-700">
                    {training.targetAudience?.map((aud, idx) => (
                      <li key={idx} className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div> {aud}</li>
                    ))}
                    {(!training.targetAudience || training.targetAudience.length === 0) && <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> Cocok untuk upskilling & reskilling.</li>}
                  </ul>
                </div>
              </div>
            </section>

            {/* Section: Skills */}
            <section id="skills" className="scroll-mt-24">
              <div className="bg-slate-900 p-8 md:p-10 rounded-[32px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <CheckCircle2 size={200} />
                </div>
                <div className="relative z-10">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Keahlian Spesifik</h2>
                  <p className="text-slate-400 mb-8 font-medium">Apa yang akan Anda kuasai setelah menyelesaikan kelas ini?</p>
                  
                  {(!training.skillsGained || training.skillsGained.length === 0) ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-400 text-sm font-medium">Informasi keahlian sedang diperbarui.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {training.skillsGained.map((skill, idx) => (
                        <div key={idx} className="bg-white/10 hover:bg-white/15 transition-colors border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                          <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check size={14} className="text-emerald-400" />
                          </div>
                          <span className="text-sm font-bold text-white leading-snug">{skill}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section: Curriculum */}
            <section id="curriculum" className="pt-4 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 px-2">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
                    {training.type === 'Offline' ? 'Silabus Pembelajaran' : 'Kurikulum Kelas'}
                  </h2>
                  <p className="text-sm font-medium text-slate-500">Materi disusun secara sistematis dan bertahap.</p>
                </div>
                <div className="text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm px-5 py-2.5 rounded-full inline-flex items-center gap-2">
                  <BookOpen size={14} className="text-amber-500"/> {training.curriculum?.length || 0} Modul Utama
                  <span className="w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
                  {totalLessons} Topik Detail
                </div>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100">
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
                  <div className="p-10 bg-slate-50 rounded-[24px] border border-dashed border-slate-200 text-center text-slate-500 font-medium">
                    <BookOpen size={32} className="mx-auto mb-4 text-slate-300"/>
                    <p>Kurikulum detail sedang dipersiapkan oleh tim akademik.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section: Mentors */}
            {training.instructors && training.instructors.length > 0 && (
              <section id="mentor" className="pt-4 scroll-mt-24">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 tracking-tight px-2">Belajar dari Ahlinya</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {training.instructors.map(inst => (
                    <div key={inst.id} className="group relative bg-white border border-slate-200 hover:border-amber-300 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 z-0"></div>
                      
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-24 h-24 mb-5 rounded-full bg-slate-100 overflow-hidden shrink-0 border-4 border-white shadow-md">
                          {inst.photoUrl ? (
                            <img src={inst.photoUrl} alt={inst.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50"><Users size={32}/></div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{inst.name}</h3>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold border-none uppercase tracking-wide text-[10px] mb-4">
                          {inst.title}
                        </Badge>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-4">
                          {inst.bio || 'Praktisi dan ahli di bidangnya dengan pengalaman industri bertahun-tahun yang siap membimbing Anda dari dasar hingga mahir.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
          </div>

          {/* KANAN: FLOATING SIDEBAR */}
          <div className="lg:col-span-5 xl:col-span-4 mt-8 lg:mt-0">
            <div className="sticky top-24 z-30">
              
              <div className="bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-200/60 overflow-hidden flex flex-col">
                
                {/* Video / Cover Image Area */}
                <div 
                  className={`w-full relative aspect-video bg-slate-900 group ${training.promoVideoUrl ? 'cursor-pointer' : ''}`}
                  onClick={() => training.promoVideoUrl && setIsVideoModalOpen(true)}
                >
                  {training.imageUrl ? (
                    <img src={training.imageUrl} alt="Poster Kelas" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90" />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-slate-600 bg-slate-800">
                      <MonitorPlay size={40} className="mb-2 opacity-50"/>
                    </div>
                  )}
                  
                  {training.promoVideoUrl && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center transition-colors group-hover:bg-slate-900/60">
                      <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                        <Play className="w-8 h-8 ml-1" fill="currentColor"/>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-bold text-[10px] tracking-wider uppercase">{training.type}</Badge>
                  </div>
                </div>

                <div className="p-8">
                  {/* Pricing Block */}
                  <div className="mb-8">
                    {training.isFree ? (
                      <h2 className="text-4xl lg:text-5xl font-black text-emerald-500 tracking-tight">Gratis</h2>
                    ) : (
                      <div className="flex flex-col">
                        {training.discountPrice && training.discountPrice > training.price && (
                          <span className="text-sm md:text-base text-slate-400 font-bold line-through mb-1 flex items-center gap-2">
                            {formatRupiah(training.discountPrice)}
                            <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-none px-2 py-0.5 text-[10px]">PROMO</Badge>
                          </span>
                        )}
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">{formatRupiah(training.price)}</h2>
                      </div>
                    )}
                  </div>

                  {/* Primary CTA */}
                  <Button 
                    onClick={() => router.push(`/program-pelatihan/${training.id}/daftar`)}
                    disabled={isFull}
                    className={`w-full h-14 rounded-full text-base font-bold shadow-lg transition-all duration-300 mb-3 flex items-center justify-center gap-2 ${isFull ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-slate-900 hover:bg-amber-500 hover:shadow-amber-500/25 text-white'}`}
                  >
                    {isFull ? 'Kuota Penuh' : 'Daftar Kelas Sekarang'}
                  </Button>
                  
                  {/* Secondary CTA: WhatsApp */}
                  {training.contactWhatsapp && (
                    <a 
                      href={`https://wa.me/${training.contactWhatsapp.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo admin, saya tertarik dengan pelatihan *${training.title}*. Bisa minta informasi lebih lanjut?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-[#25D366]/20 transition-all duration-300 mb-4 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white"
                    >
                      <MessageCircle size={20}/>
                      Tanya via WhatsApp
                    </a>
                  )}
                  
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-8">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={14}/> Garansi Aman</span>
                    <div className="flex gap-3">
                      <button className="hover:text-amber-500 transition-colors"><Share2 size={16}/></button>
                      <button className="hover:text-red-500 transition-colors"><Heart size={16}/></button>
                    </div>
                  </div>

                  {/* What's included */}
                  <div className="space-y-5 border-t border-slate-100 pt-8">
                    <h4 className="font-bold text-slate-900 text-sm">Fasilitas yang Anda dapatkan:</h4>
                    <ul className="space-y-4">
                      {whatsIncluded.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                          <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                            {item.icon}
                          </span>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Logistics Detail */}
                  <div className="mt-8 bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
                    {training.durationDisplay && (
                      <div className="flex items-start gap-3 text-sm">
                        <Clock size={18} className="text-slate-400 shrink-0 mt-0.5"/> 
                        <div>
                          <span className="block text-slate-800 font-bold">Durasi: {training.durationDisplay}</span>
                          {training.scheduleDetails && <span className="text-xs text-slate-500 font-medium mt-0.5 block">{training.scheduleDetails}</span>}
                        </div>
                      </div>
                    )}
                    
                    {training.type !== 'Video Course' && (
                      <>
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar size={18} className="text-slate-400 shrink-0"/> 
                          <span className="text-slate-700 font-bold">{training.date ? new Date(training.date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Tanggal Menyusul'}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <MapPin size={18} className="text-slate-400 shrink-0 mt-0.5"/> 
                          <span className="text-slate-700 font-medium leading-snug">{training.location || 'Lokasi Menyusul'}</span>
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>

      {/* --- MOBILE BOTTOM CTA --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 z-50 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between pb-safe">
        <div>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Total Harga</p>
           {training.isFree ? (
             <p className="text-xl font-black text-emerald-500 leading-none">Gratis</p>
           ) : (
             <p className="text-xl font-black text-slate-900 leading-none">{formatRupiah(training.price)}</p>
           )}
        </div>
        
        <div className="flex items-center gap-3">
          {training.contactWhatsapp && (
            <a 
              href={`https://wa.me/${training.contactWhatsapp.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo, saya tertarik dengan pelatihan *${training.title}*.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[#25D366] text-white shadow-lg shrink-0"
            >
              <MessageCircle size={20}/>
            </a>
          )}
          <Button 
            onClick={() => router.push(`/program-pelatihan/${training.id}/daftar`)}
            disabled={isFull}
            className={`h-12 px-6 sm:px-8 rounded-full font-bold shadow-lg ${isFull ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-slate-900 text-white'}`}
          >
            {isFull ? 'Penuh' : 'Daftar'}
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 sm:p-6"
          >
            <button 
              onClick={() => setIsVideoModalOpen(false)} 
              className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition-all z-50"
            >
              <X size={24}/>
            </button>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative"
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

    </div>
  );
}