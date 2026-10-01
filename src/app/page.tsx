'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Building2, 
  GraduationCap, 
  Briefcase, 
  Users, 
  Radio,
  ArrowRight,
  LogIn,
  Sparkles,
  PlayCircle,
  User, 
  LogOut,
  Store,
  Building,
  BookOpen,
  Lightbulb,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext'; 
import { auth } from '@/lib/firebase'; 
import { signOut } from 'firebase/auth'; 
import { usePublicStats } from '@/hooks/usePublicStats'; 

// Data untuk Section Pentahelix
const PENTAHELIX_DATA = [
  {
    id: 'pemerintah',
    title: 'Pemerintah',
    icon: <Building2 className="w-6 h-6" />,
    desc: 'Regulasi, dukungan kebijakan, dan layanan perizinan terpadu.',
    color: 'from-sky-400 to-blue-500',
    bg: 'bg-sky-50'
  },
  {
    id: 'akademisi',
    title: 'Akademisi',
    icon: <GraduationCap className="w-6 h-6" />,
    desc: 'Pusat riset, inovasi teknologi, dan pengembangan SDM unggul.',
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50'
  },
  {
    id: 'industri',
    title: 'Industri',
    icon: <Briefcase className="w-6 h-6" />,
    desc: 'Komersialisasi produk, investasi, dan penciptaan lapangan kerja.',
    color: 'from-cyan-400 to-teal-500',
    bg: 'bg-cyan-50'
  },
  {
    id: 'komunitas',
    title: 'Komunitas',
    icon: <Users className="w-6 h-6" />,
    desc: 'Jejaring kolaborasi, ruang kreatif, dan pemberdayaan masyarakat.',
    color: 'from-sky-300 to-blue-400',
    bg: 'bg-sky-50'
  },
  {
    id: 'media',
    title: 'Media',
    icon: <Radio className="w-6 h-6" />,
    desc: 'Publikasi, literasi digital, dan penyebaran informasi positif.',
    color: 'from-blue-300 to-sky-500',
    bg: 'bg-blue-50'
  }
];

// Data untuk Pilar Layanan Utama
const LAYANAN_UTAMA = [
  {
    id: 'inkubasi',
    title: 'Inkubator Bisnis & Teknologi',
    icon: <Lightbulb className="w-8 h-8 text-amber-500" />,
    desc: 'Program pendampingan komprehensif bagi startup dan wirausaha baru untuk mengakselerasi pertumbuhan bisnis berbasis inovasi dan teknologi.'
  },
  {
    id: 'pelatihan',
    title: 'Pelatihan Vokasi Terapan',
    icon: <BookOpen className="w-8 h-8 text-blue-500" />,
    desc: 'Pusat peningkatan kapasitas SDM dengan program pelatihan siap kerja (IT, Manufaktur, Mekanik, dll) yang dilengkapi sertifikasi standar industri.'
  },
  {
    id: 'fasilitas',
    title: 'Kawasan & Fasilitas Modern',
    icon: <Building className="w-8 h-8 text-cyan-500" />,
    desc: 'Akses infrastruktur terpadu mulai dari Co-working Space, Ruang Meeting, Auditorium, hingga Maker Space dan Laboratorium Riset.'
  },
  {
    id: 'katalog',
    title: 'E-Katalog Produk Inovasi',
    icon: <Store className="w-8 h-8 text-sky-500" />,
    desc: 'Etalase digital yang memamerkan produk dan layanan unggulan karya tenant, alumni, dan inovator lokal Solo Technopark.'
  }
];

export default function SmartHubLanding() {

  const { user, loading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading } = usePublicStats();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = "userRole=; path=/; max-age=0;"; 
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // Kalkulasi untuk Diagram Alumni dengan cast 'any' untuk mengabaikan linter error
  const alumniCharts: any = stats?.alumniCharts || {};
  
  const alumniByYear: any[] = alumniCharts.byYear || [];
  const maxYearCount = Math.max(...alumniByYear.map((d: any) => d.count), 1); 
  
  const alumniByStatus: any[] = alumniCharts.byStatus || [];
  const totalStatusCount = alumniByStatus.reduce((acc: number, curr: any) => acc + curr.count, 0) || 1;

  // Data Baru: Program Diminati
  const alumniByProgram: any[] = alumniCharts.byProgram || [];
  const maxProgramCount = Math.max(...alumniByProgram.map((d: any) => d.count), 1);

  // Warna dinamis untuk status pekerjaan
  const getStatusColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-sky-400', 'bg-cyan-500', 'bg-indigo-400', 'bg-slate-300'];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-hidden flex flex-col relative text-slate-800">
      
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-sky-100/60 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-50/80 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />

      {/* Top Navbar Minimalis */}
      <nav className="relative z-20 w-full px-6 lg:px-12 py-6 flex items-center justify-between max-w-[1920px] mx-auto">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="h-9 relative flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Solo Technopark" 
              width={76} 
              height={40} 
              className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" 
              priority
            />
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none group-hover:text-red-600 transition-colors">KATALOG</h1>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded">STP</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">solotechnopark.id</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          {authLoading ? (
            <div className="w-32 h-10 bg-sky-100/50 animate-pulse rounded-full"></div>
          ) : user ? (
            <>
              <Link 
                href="/profil" 
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 text-sm font-bold rounded-full transition-all shadow-sm"
              >
                <User size={16} />
                <span className="hidden sm:inline">Profil Saya</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full transition-all shadow-sm"
                title="Keluar"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-sky-100 hover:border-sky-300 hover:bg-sky-50 text-blue-800 text-sm font-bold rounded-full transition-all shadow-sm hover:shadow-md"
            >
              <LogIn size={16} className="text-sky-600" />
              <span>Masuk Sistem</span>
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col justify-center relative z-10 w-full max-w-[90rem] mx-auto px-6 lg:px-12 py-12">
        
        {/* HERO SECTION */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/60 shadow-xs text-xs font-bold tracking-widest uppercase text-emerald-800 mb-8"
          >
            <Sparkles size={16} className="text-emerald-600" />
            <span>Katalog Resmi Kawasan • solotechnopark.id</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-blue-950 leading-[1.1] mb-6"
          >
            Katalog Layanan, Fasilitas & Pelatihan <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600">
              Solo Technopark
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-slate-500 mb-10 max-w-2xl font-medium"
          >
            Gerbang dan jembatan katalog terpadu untuk mengeksplorasi program pelatihan vokasi industri, penyewaan fasilitas & gedung pertemuan, layanan teknologi, serta produk inovasi tenant Solo Technopark.
          </motion.p>
        </div>

        {/* SECTION: TENTANG KAMI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-5xl mx-auto mb-20 bg-gradient-to-br from-blue-900 to-sky-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-sky-300 font-bold tracking-widest text-sm uppercase mb-3">Tentang Kawasan</h3>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">Membangun Ekosistem Inovasi & Berdaya Saing</h2>
              <p className="text-sky-100 leading-relaxed mb-6">
                Solo Technopark (STP) merupakan pusat inovasi dan vokasi yang memadukan unsur pengembangan IPTEK, kebutuhan pasar, industri, dan bisnis. Kami berkomitmen untuk meningkatkan kualitas sumber daya manusia dan memfasilitasi pertumbuhan teknologi yang relevan dengan tantangan masa depan.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">✓</div>
                  Pusat Vokasi
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">✓</div>
                  Inkubator Bisnis
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">✓</div>
                  Layanan Publik
                </div>
              </div>
            </div>
            
            <div className="relative h-[250px] md:h-[350px] w-full group">
               <Image 
                 src="/image/kawasan.png" 
                 alt="Peta Kawasan Terpadu Solo Technopark" 
                 fill 
                 className="object-contain transition-transform duration-700 group-hover:scale-105 drop-shadow-2xl"
               />
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-11/12 text-center text-sm font-semibold text-sky-100 bg-blue-950/60 p-3 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                 Kawasan Terpadu Solo Technopark
               </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION: STATISTIK EKOSISTEM REALTIME */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 py-6 mb-8 border-y border-sky-100 bg-sky-50/30 rounded-3xl overflow-hidden max-w-6xl mx-auto"
        >
          {statsLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`text-center p-6 ${i !== 0 && i !== 3 ? 'border-l border-sky-100/30' : ''} ${i > 0 ? 'lg:border-l lg:border-sky-100/50' : ''}`}>
                  <div className="h-10 w-20 bg-sky-200/50 animate-pulse rounded mx-auto mb-2"></div>
                  <div className="h-4 w-24 bg-sky-100 animate-pulse rounded mx-auto"></div>
                </div>
             ))
          ) : (
            <>
              <Link href="/ekosistem" className="group text-center p-6 transition-all duration-300 hover:bg-white/60">
                <h4 className="text-3xl md:text-4xl font-black text-blue-600 mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stats?.tenants || 0}<span className="text-xl opacity-70 group-hover:opacity-100">+</span>
                </h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-blue-600 transition-colors">Startup Binaan</p>
              </Link>
              
              <Link href="/ekosistem" className="group text-center p-6 border-l border-sky-100/50 transition-all duration-300 hover:bg-white/60">
                <h4 className="text-3xl md:text-4xl font-black text-sky-500 mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stats?.alumnis || 0}<span className="text-xl opacity-70 group-hover:opacity-100">+</span>
                </h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-sky-500 transition-colors">Alumni Pelatihan</p>
              </Link>
              
              <Link href="/program-pelatihan" className="group text-center p-6 border-t md:border-t-0 md:border-l border-sky-100/50 transition-all duration-300 hover:bg-white/60">
                <h4 className="text-3xl md:text-4xl font-black text-cyan-600 mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stats?.trainingParticipants || 0}<span className="text-xl opacity-70 group-hover:opacity-100">+</span>
                </h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-cyan-600 transition-colors">Peserta Pelatihan</p>
              </Link>
              
              <Link href="/event" className="group text-center p-6 border-t lg:border-t-0 lg:border-l border-sky-100/50 transition-all duration-300 hover:bg-white/60">
                <h4 className="text-3xl md:text-4xl font-black text-blue-500 mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stats?.events || 0}<span className="text-xl opacity-70 group-hover:opacity-100">+</span>
                </h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-blue-500 transition-colors">Event Digelar</p>
              </Link>
              
              <Link href="/e-katalog" className="group text-center p-6 border-t lg:border-t-0 md:border-l border-sky-100/50 transition-all duration-300 hover:bg-white/60">
                <h4 className="text-3xl md:text-4xl font-black text-indigo-500 mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stats?.catalogs || 0}<span className="text-xl opacity-70 group-hover:opacity-100">+</span>
                </h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-indigo-500 transition-colors">Produk Inovasi</p>
              </Link>
              
              <Link href="/fasilitas" className="group text-center p-6 border-t lg:border-t-0 border-l border-sky-100/50 transition-all duration-300 hover:bg-white/60">
                <h4 className="text-3xl md:text-4xl font-black text-teal-500 mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stats?.rooms || 0}
                </h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-teal-500 transition-colors">Fasilitas Ruang</p>
              </Link>
            </>
          )}
        </motion.div>

        {/* SECTION: DIAGRAM SERAPAN ALUMNI & TRACER STUDY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[90rem] mx-auto mb-24 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {/* Kartu 1: Tren Kelulusan Tahunan */}
          <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-bold text-blue-950 text-lg">Pertumbuhan Alumni</h3>
                <p className="text-xs text-slate-500">Jumlah lulusan pelatihan per tahun</p>
              </div>
            </div>

            {statsLoading ? (
               <div className="flex-1 flex items-end gap-3 h-48 animate-pulse">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="flex-1 bg-sky-100 rounded-t-md" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                 ))}
               </div>
            ) : alumniByYear.length > 0 ? (
               <div className="flex-1 flex flex-col justify-end min-h-[220px]">
                 <div className="flex items-end justify-between gap-2 md:gap-4 h-full pt-4">
                   {alumniByYear.map((item: any, index: number) => {
                     // Hitung tinggi bar dalam persentase
                     const heightPct = Math.max((item.count / maxYearCount) * 100, 5); 
                     
                     return (
                       <div key={index} className="flex-1 flex flex-col items-center group">
                         {/* Tooltip Hover */}
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-blue-600 mb-2">
                           {item.count}
                         </div>
                         {/* Bar */}
                         <div className="w-full relative flex justify-center items-end h-40 bg-slate-50 rounded-t-lg overflow-hidden">
                           <motion.div 
                             initial={{ height: 0 }}
                             whileInView={{ height: `${heightPct}%` }}
                             viewport={{ once: true }}
                             transition={{ duration: 0.8, delay: index * 0.1 }}
                             className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-sky-400 rounded-t-sm group-hover:brightness-110 transition-all"
                           />
                         </div>
                         {/* Label Tahun */}
                         <span className="text-xs font-medium text-slate-500 mt-3">{item.year}</span>
                       </div>
                     )
                   })}
                 </div>
               </div>
            ) : (
               <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Data tahunan belum tersedia</div>
            )}
          </div>

          {/* Kartu 2: Distribusi Status Pekerjaan */}
          <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                <PieChart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-blue-950 text-lg">Tracer Study Alumni</h3>
                <p className="text-xs text-slate-500">Distribusi status lulusan di industri</p>
              </div>
            </div>

            {statsLoading ? (
               <div className="space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="w-full h-8 bg-sky-50 animate-pulse rounded-md"></div>
                 ))}
               </div>
            ) : alumniByStatus.length > 0 ? (
               <div className="flex-1 flex flex-col gap-5 justify-center">
                 {alumniByStatus.slice(0, 5).map((item: any, index: number) => { // Tampilkan top 5 status
                   const percentage = ((item.count / totalStatusCount) * 100).toFixed(1);
                   const barColor = getStatusColor(index);
                   
                   return (
                     <div key={index} className="w-full">
                       <div className="flex justify-between items-end mb-1.5">
                         <span className="text-sm font-semibold text-slate-700 truncate mr-2" title={item.status}>{item.status}</span>
                         <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{item.count} Orang <span className="text-slate-300 ml-1">({percentage}%)</span></span>
                       </div>
                       <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: `${percentage}%` }}
                           viewport={{ once: true }}
                           transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                           className={`h-full ${barColor} rounded-full`}
                         />
                       </div>
                     </div>
                   )
                 })}
               </div>
            ) : (
               <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Data tracer study belum tersedia</div>
            )}
          </div>

          {/* Kartu 3: Distribusi Program Pelatihan Diminati */}
          <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-sm flex flex-col md:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-bold text-blue-950 text-lg">Program Diminati</h3>
                <p className="text-xs text-slate-500">Sebaran alumni per program pelatihan</p>
              </div>
            </div>

            {statsLoading ? (
               <div className="space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="w-full h-8 bg-sky-50 animate-pulse rounded-md"></div>
                 ))}
               </div>
            ) : alumniByProgram.length > 0 ? (
               <div className="flex-1 flex flex-col gap-5 justify-center">
                 {alumniByProgram.map((item: any, index: number) => { // Tampilkan top 5 program
                   const percentage = ((item.count / maxProgramCount) * 100).toFixed(1);
                   
                   return (
                     <div key={index} className="w-full group">
                       <div className="flex justify-between items-end mb-1.5">
                         <span className="text-sm font-semibold text-slate-700 truncate mr-2 transition-colors group-hover:text-cyan-600" title={item.program}>{item.program}</span>
                         <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{item.count} Orang</span>
                       </div>
                       <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: `${percentage}%` }}
                           viewport={{ once: true }}
                           transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                           className={`h-full bg-cyan-400 rounded-full`}
                         />
                       </div>
                     </div>
                   )
                 })}
               </div>
            ) : (
               <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Data program belum tersedia</div>
            )}
          </div>
        </motion.div>

        {/* SECTION: EKOSISTEM PENTAHELIX */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-5xl mx-auto mb-24"
        >
          <div className="text-center mb-10">
            <h3 className="text-sm font-bold text-sky-600 uppercase tracking-widest mb-2">Didukung Penuh Oleh</h3>
            <h2 className="text-2xl font-black text-blue-950">Ekosistem Pentahelix</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6 items-stretch">
            {PENTAHELIX_DATA.map((item) => (
              <div 
                key={item.id}
                className="relative p-5 rounded-3xl border bg-white border-sky-100 hover:border-sky-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${item.bg} text-sky-600`}>
                  {item.icon}
                </div>
                <h4 className="font-bold text-blue-950 mb-2">{item.title}</h4>
                <div className="mt-auto pt-3 border-t border-sky-50">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SECTION: PILAR LAYANAN */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-6xl mx-auto bg-white border border-sky-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-sm font-bold text-sky-600 uppercase tracking-widest mb-2">Fasilitas & Program</h3>
            <h2 className="text-2xl md:text-3xl font-black text-blue-950 mb-4">Layanan Unggulan Solo Technopark</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Kami menyediakan infrastruktur yang komprehensif untuk mengakselerasi ide, keterampilan, dan bisnis Anda menuju standar industri global.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {LAYANAN_UTAMA.map((layanan) => (
              <div key={layanan.id} className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-sky-50/50 transition-colors border border-transparent hover:border-sky-100">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-sky-50 flex items-center justify-center mb-6 transition-transform hover:scale-110 duration-300">
                  {layanan.icon}
                </div>
                <h4 className="text-lg font-bold text-blue-950 mb-3">{layanan.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {layanan.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CALL TO ACTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/e-katalog" className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-full overflow-hidden shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 w-full sm:w-auto">
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out" />
            <span className="relative flex items-center gap-2">
              Jelajahi Portal Publik <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          
          <Link href="/about" className="group inline-flex items-center justify-center px-8 py-4 bg-white border border-sky-200 text-blue-800 hover:bg-sky-50 font-bold rounded-full transition-colors shadow-sm w-full sm:w-auto gap-2">
            <PlayCircle size={18} className="text-sky-500 group-hover:text-blue-600 transition-colors" />
            Tonton Video Profil
          </Link>
        </motion.div>

      </main>

      {/* Footer Resmi Katalog Solo Technopark */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white/80 backdrop-blur-xl mt-24">
        <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5 group cursor-default">
            <div className="h-9 flex items-center justify-center shrink-0">
              <Image 
                src="/logo.png" 
                alt="Solo Technopark" 
                width={72} 
                height={38} 
                className="h-8 w-auto object-contain drop-shadow-xs" 
              />
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <p className="text-sm font-black text-slate-800 tracking-tight">Katalog Solo Technopark</p>
              <p className="text-xs font-medium text-slate-400">&copy; {new Date().getFullYear()} Solo Technopark. Bagian dari ekosistem <a href="https://solotechnopark.id" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline font-semibold">solotechnopark.id</a></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-bold text-slate-500">
            <Link href="/faq" className="hover:text-blue-600 transition-colors">Bantuan & FAQ</Link>
            <Link href="/curation" className="hover:text-blue-600 transition-colors">Akses Self Assessment Tenant</Link>
            <Link href="/peta-kawasan" className="hover:text-blue-600 transition-colors">Peta Kawasan</Link>
            <Link href="/e-katalog" className="hover:text-blue-600 transition-colors">E-Katalog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}