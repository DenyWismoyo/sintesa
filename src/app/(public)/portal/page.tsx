// Lokasi file: src/app/(public)/page.tsx

'use client';

import React from 'react';
import { MapPin, FileText, ArrowRight, Users, Sparkles, Zap, Rocket, ArrowUpRight, Compass } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Menambahkan strict typing 'Variants' dan menghilangkan 'filter' untuk memperbaiki error garis merah (TypeScript)
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

// Animasi khusus untuk gambar agar melayang (Floating effect) yang dioptimasi GPU
const floatingAnimation: Variants = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function LandingPage() {
  return (
    // Menghapus batasan height (lg:h-[...]) dan overflow-hidden agar halaman bisa di-scroll dengan normal
    <div className="w-full bg-[#FAFAFA] relative font-sans min-h-screen overflow-x-hidden pt-12 lg:pt-16 xl:pt-20 pb-24">
      
      {/* Background Pattern Elegan (Dot Matrix Minimalis) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" 
           style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Subtle Glow Backgrounds */}
      <div className="fixed top-0 left-[-10%] w-[600px] h-[600px] bg-indigo-100/60 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-pink-100/50 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Kontainer Utama w-full */}
      <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-12 2xl:px-20 relative z-10">
        
        {/* ================= SECTION 1: HERO & BENTO GRID ================= */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-16 xl:gap-24 w-full mb-20 lg:mb-32">
          
          {/* --- BAGIAN KIRI: HERO SECTION --- */}
          <motion.div 
            className="w-full lg:w-5/12 xl:w-[45%] flex flex-col items-start text-left mt-2 lg:mt-4" 
            variants={staggerContainer} initial="hidden" animate="visible"
          >
            <motion.div variants={fadeUpVariants} className="mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-[11px] xl:text-xs font-bold tracking-widest uppercase text-slate-600">
                <Sparkles size={14} className="text-indigo-500" />
                <span>Portal Terpadu KST</span>
              </div>
            </motion.div>
            
            <motion.h1 variants={fadeUpVariants} className="text-4xl lg:text-[2.75rem] xl:text-5xl 2xl:text-[3.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-5">
              Inovasi & Teknologi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-300% animate-gradient pb-1">
                Tanpa Batas
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUpVariants} className="text-sm lg:text-base xl:text-lg text-slate-500 max-w-lg leading-relaxed mb-8 font-medium">
              Platform ekosistem digital premium untuk penyewaan fasilitas, direktori startup, e-katalog layanan, hingga inkubasi bisnis di Solo Technopark.
            </motion.p>
            
            <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 h-12 text-sm shadow-[0_8px_20px_-8px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-0.5">
                <Link href="/fasilitas">
                  Sewa Fasilitas <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto rounded-full bg-white/80 backdrop-blur-md border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-8 h-12 text-sm transition-all hover:-translate-y-0.5 shadow-sm">
                <Link href="/explore">
                  <Zap className="mr-2 w-4 h-4 text-slate-400" /> Eksplorasi AI
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* --- BAGIAN KANAN: BENTO GRID MENU --- */}
          <motion.div 
            className="w-full lg:w-7/12 xl:w-[55%] grid grid-cols-1 sm:grid-cols-3 gap-4 xl:gap-5" 
            variants={staggerContainer} initial="hidden" animate="visible"
          >
            {/* Card 1: Sewa Ruangan */}
            <motion.div variants={fadeUpVariants} className="sm:col-span-2 group">
              <Link href="/fasilitas" className="block w-full h-[180px] xl:h-[220px] relative overflow-hidden rounded-[24px] bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-125" />
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <MapPin size={20} strokeWidth={2} />
                  </div>
                  <ArrowUpRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                <div className="mt-4 sm:mt-auto relative z-10">
                  <h3 className="text-lg xl:text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5 xl:mb-2">Sewa Fasilitas</h3>
                  <p className="text-slate-500 text-xs xl:text-sm font-medium xl:max-w-[85%]">Peminjaman auditorium luas & ruang rapat premium untuk kebutuhan instansi maupun pribadi.</p>
                </div>
              </Link>
            </motion.div>

            {/* Card 2: Ekosistem */}
            <motion.div variants={fadeUpVariants} className="sm:col-span-1 group">
              <Link href="/ekosistem" className="block w-full h-[180px] xl:h-[220px] relative overflow-hidden rounded-[24px] bg-slate-900 border border-slate-800 p-6 shadow-md hover:shadow-xl hover:shadow-slate-900/20 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:bg-white group-hover:text-slate-900 transition-colors duration-300">
                    <Rocket size={20} strokeWidth={2} />
                  </div>
                  <ArrowUpRight size={20} className="text-slate-500 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                <div className="relative z-10 mt-4 sm:mt-auto">
                  <h3 className="text-lg xl:text-xl font-extrabold text-white tracking-tight mb-1.5">Ekosistem</h3>
                  <p className="text-slate-400 text-xs font-medium line-clamp-2 xl:line-clamp-3">Portofolio startup & perusahaan inovasi.</p>
                </div>
              </Link>
            </motion.div>

            {/* Card 3: E-Katalog */}
            <motion.div variants={fadeUpVariants} className="sm:col-span-1 group">
              <Link href="/e-katalog" className="block w-full h-[180px] xl:h-[200px] relative overflow-hidden rounded-[24px] bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-150" />
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <FileText size={20} strokeWidth={2} />
                  </div>
                  <ArrowUpRight size={20} className="text-slate-300 group-hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                <div className="mt-4 sm:mt-auto">
                  <h3 className="text-lg xl:text-xl font-extrabold text-slate-900 tracking-tight mb-1.5">E-Katalog</h3>
                  <p className="text-slate-500 text-xs font-medium line-clamp-2">Layanan profesional & perlengkapan tenant.</p>
                </div>
              </Link>
            </motion.div>

            {/* Card 4: Pelatihan */}
            <motion.div variants={fadeUpVariants} className="sm:col-span-2 group">
              <Link href="/program-pelatihan" className="block w-full h-[180px] xl:h-[200px] relative overflow-hidden rounded-[24px] bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50/50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-125" />
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center text-orange-600 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                    <Users size={20} strokeWidth={2} />
                  </div>
                  <ArrowUpRight size={20} className="text-slate-300 group-hover:text-orange-600 transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                <div className="mt-4 sm:mt-auto relative z-10">
                  <h3 className="text-lg xl:text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5 xl:mb-2">Program Pelatihan</h3>
                  <p className="text-slate-500 text-xs xl:text-sm font-medium xl:max-w-[85%]">Tingkatkan skill Anda melalui kursus intensif bersertifikat yang diisi langsung oleh ahli di bidangnya.</p>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* ================= SECTION 2: SHOWCASE KAWASAN ================= */}
        {/* Menggunakan whileInView agar animasi jalan saat di-scroll ke area ini */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="w-full relative rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden"
        >
          {/* Background Gradient Kawasan */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-emerald-50/30 pointer-events-none" />
          
          <div className="relative z-10 p-8 lg:p-14 xl:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            
            {/* Teks Kawasan (Sebelah Kiri) */}
            <motion.div variants={fadeUpVariants} className="w-full lg:w-5/12 order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold tracking-widest uppercase mb-6">
                <Compass size={16} />
                <span>Eksplorasi Kawasan</span>
              </div>
              
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.2]">
                Pusat Integrasi <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">Teknologi & Bisnis</span>
              </h2>
              
              <p className="text-slate-500 text-base lg:text-lg leading-relaxed mb-8 max-w-lg">
                Jelajahi ekosistem ruang publik dan fasilitas premium yang dirancang secara strategis untuk mendukung kolaborasi inovator, industri, dan masyarakat di Solo Technopark.
              </p>
              
              <Button asChild size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-12 shadow-[0_8px_20px_-8px_rgba(16,185,129,0.4)] transition-all hover:-translate-y-0.5">
                <Link href="/peta-kawasan">
                  Lihat Peta Interaktif <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Gambar Kawasan (Sebelah Kanan - Melayang & Anti-Lag) */}
            <motion.div variants={fadeUpVariants} className="w-full lg:w-7/12 order-1 lg:order-2 flex justify-center items-center relative">
              
              {/* Efek Bayangan di bawah gambar yang bereaksi terhadap animasi melayang */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[60%] h-[30px] bg-black/10 blur-[20px] rounded-[100%] pointer-events-none" />
              
              {/* will-change-transform: Memberitahu browser untuk menyerahkan animasi ini ke GPU (Hardware Acceleration)
                 sehingga animasi melayang tidak membuat website patah-patah/lag.
              */}
              <motion.div 
                variants={floatingAnimation} 
                animate="animate" 
                className="relative w-full max-w-[800px] aspect-[4/3] lg:aspect-[16/10] will-change-transform drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
              >
                {/* Menggunakan next/image untuk ANTI-LAG:
                   - Tidak perlu memuat resolusi penuh jika di mobile (sizes).
                   - Otomatis kompresi gambar ke format modern (WebP/AVIF).
                   - Lazy load otomatis aktif karena berada di bawah hero fold.
                */}
                <Image 
                  src="/image/kawasan.png" 
                  alt="Kawasan Solo Technopark 3D" 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px"
                  className="object-contain"
                  quality={90}
                />
              </motion.div>
            </motion.div>

          </div>
        </motion.div>

      </div>
      
      {/* Custom CSS untuk Animasi Teks Gradien */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
        .bg-300\\% {
          background-size: 300% 300%;
        }
      `}} />
    </div>
  );
}