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
  ArrowUpRight,
  LogIn,
  Sparkles,
  User,
  LogOut,
  Store,
  Building,
  BookOpen,
  Lightbulb,
  Calendar,
  Share2,
  MapPin,
  Clock,
  ChevronRight,
  CheckCircle2,
  Newspaper,
  Compass,
  ShoppingBag,
  Ticket
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { usePublicStats } from '@/hooks/usePublicStats';
import { useTraining } from '@/hooks/useTraining';
import { useEvents } from '@/hooks/useEvents';
import { useArticles } from '@/hooks/useArticles';
import { formatRupiah } from '@/utils/format';
import { toast } from 'sonner';

// Data untuk Section Pentahelix
const PENTAHELIX_DATA = [
  {
    id: 'pemerintah',
    title: 'Pemerintah',
    icon: <Building2 className="w-5 h-5" />,
    desc: 'Regulasi, dukungan kebijakan, dan layanan perizinan terpadu.',
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 text-sky-700'
  },
  {
    id: 'akademisi',
    title: 'Akademisi',
    icon: <GraduationCap className="w-5 h-5" />,
    desc: 'Pusat riset terapan, inovasi iptek, dan pengembangan SDM unggul.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 text-blue-700'
  },
  {
    id: 'industri',
    title: 'Industri',
    icon: <Briefcase className="w-5 h-5" />,
    desc: 'Komersialisasi produk, investasi modal, dan penyerapan tenaga kerja.',
    color: 'from-cyan-500 to-teal-600',
    bg: 'bg-cyan-50 text-cyan-700'
  },
  {
    id: 'komunitas',
    title: 'Komunitas',
    icon: <Users className="w-5 h-5" />,
    desc: 'Jejaring kolaboratif, ruang kreatif, dan pemberdayaan masyarakat.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 text-amber-700'
  },
  {
    id: 'media',
    title: 'Media',
    icon: <Radio className="w-5 h-5" />,
    desc: 'Publikasi nasional, literasi digital, dan diseminasi prestasi inovasi.',
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50 text-purple-700'
  }
];

// Data untuk 4 Pilar Layanan Unggulan
const LAYANAN_UTAMA = [
  {
    id: 'katalog',
    title: 'E-Katalog Produk Inovasi',
    href: '/e-katalog',
    icon: <Store className="w-7 h-7 text-emerald-600" />,
    color: 'hover:border-emerald-300 hover:shadow-emerald-500/10',
    badge: 'Komersial',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Etalase terpadu produk karya tenant, startup binaan, dan mitra teknologi Solo Technopark dengan integrasi billing resmi.'
  },
  {
    id: 'pelatihan',
    title: 'Pelatihan Vokasi Siap Kerja',
    href: '/program-pelatihan',
    icon: <BookOpen className="w-7 h-7 text-amber-600" />,
    color: 'hover:border-amber-300 hover:shadow-amber-500/10',
    badge: 'Vokasi Industri',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Pusat sertifikasi keterampilan praktis berstandar industri dengan mentor berpengalaman dan fasilitas lab modern.'
  },
  {
    id: 'fasilitas',
    title: 'Sewa Fasilitas & Ruangan',
    href: '/fasilitas',
    icon: <Building className="w-7 h-7 text-sky-600" />,
    color: 'hover:border-sky-300 hover:shadow-sky-500/10',
    badge: 'Infrastruktur',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    desc: 'Auditorium, ruang rapat, workshop manufaktur, dan co-working space siap pakai dengan sistem jadwal anti-bentrok.'
  },
  {
    id: 'inkubasi',
    title: 'Inkubasi Startup & Tenant',
    href: '/ekosistem',
    icon: <Lightbulb className="w-7 h-7 text-indigo-600" />,
    color: 'hover:border-indigo-300 hover:shadow-indigo-500/10',
    badge: 'Akselerasi Bisnis',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Pendampingan komprehensif dari ide awal, legalitas, mentoring bisnis, kurasi AI Krenova, hingga akses pendanaan investor.'
  }
];

export default function SmartHubLanding() {
  const { user, loading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading } = usePublicStats();

  const { trainings = [], loading: loadingTrainings } = useTraining();
  const { events = [], loading: loadingEvents } = useEvents();
  const { articles = [], loading: loadingArticles } = useArticles({ publishedOnly: true, maxLimit: 3 });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = 'userRole=; path=/; max-age=0;';
      toast.success('Berhasil Keluar', { description: 'Sesi Anda telah berakhir.' });
    } catch (error) {
      console.error('Gagal logout:', error);
    }
  };

  // Ambil 3 Pelatihan Terpopuler/Terbaru
  const featuredTrainings = trainings.slice(0, 3);
  // Ambil 2 Event Terdekat
  const upcomingEvents = events.slice(0, 2);
  // Ambil 3 Artikel Terkini
  const latestArticles = articles.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans overflow-x-hidden flex flex-col relative text-slate-800">
      
      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[65vw] h-[65vw] bg-sky-100/50 rounded-full blur-[130px] pointer-events-none mix-blend-multiply" />
      <div className="absolute top-[25%] right-[-10%] w-[50vw] h-[50vw] bg-amber-50/60 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[60vw] h-[60vw] bg-violet-100/40 rounded-full blur-[140px] pointer-events-none mix-blend-multiply" />

      {/* --- TOP NAVBAR --- */}
      <header className="relative z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="h-10 relative flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Solo Technopark" 
                width={80} 
                height={42} 
                className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" 
                priority
              />
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900 leading-none">SOLO TECHNOPARK</span>
                <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200/60 px-1.5 py-0.2 rounded">KST</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">solotechnopark.id</p>
            </div>
          </Link>

          {/* Quick Menu Navigasi Desktop */}
          <nav className="hidden xl:flex items-center gap-6 text-xs font-bold text-slate-600">
            <Link href="/e-katalog" className="hover:text-emerald-600 transition-colors">Katalog</Link>
            <Link href="/fasilitas" className="hover:text-sky-600 transition-colors">Fasilitas</Link>
            <Link href="/program-pelatihan" className="hover:text-amber-600 transition-colors">Pelatihan</Link>
            <Link href="/ekosistem" className="hover:text-indigo-600 transition-colors">Ekosistem</Link>
            <Link href="/event" className="hover:text-violet-600 transition-colors">Event</Link>
            <Link href="/artikel" className="hover:text-blue-600 transition-colors">Artikel</Link>
            <Link href="/faq" className="hover:text-slate-900 transition-colors">Bantuan</Link>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-2.5">
            {authLoading ? (
              <div className="w-28 h-9 bg-slate-100 animate-pulse rounded-full" />
            ) : user ? (
              <>
                <Link 
                  href="/portal" 
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 text-xs font-bold rounded-full transition-all shadow-2xs"
                >
                  <Sparkles size={14} className="text-blue-600" />
                  <span>Portal Saya</span>
                </Link>
                <Link 
                  href="/profil" 
                  className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all shadow-2xs"
                >
                  <User size={14} />
                  <span className="hidden sm:inline">Profil</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-all shadow-2xs"
                  title="Keluar"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full transition-all shadow-sm hover:-translate-y-0.5"
              >
                <LogIn size={15} />
                <span>Masuk Portal</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* --- HERO SECTION UTAMA --- */}
      <section className="relative z-10 w-full max-w-[1920px] mx-auto px-6 lg:px-12 pt-14 pb-20 lg:pt-20 lg:pb-24 flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 shadow-2xs text-xs font-bold tracking-widest uppercase text-blue-800 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Kawasan Sains & Teknologi Terpadu Surakarta</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.12] max-w-5xl mb-6"
        >
          Pusat Inovasi, Vokasi Industri & Akselerasi{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
            Ekosistem Digital
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-500 mb-10 max-w-3xl font-medium leading-relaxed"
        >
          Menghubungkan talenta terampil bersertifikasi industri, startup inovatif, fasilitas laboratorium modern, serta katalog produk komersial terdepan untuk kemandirian teknologi nasional.
        </motion.p>

        {/* Action CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none"
        >
          <Link
            href="/program-pelatihan"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <BookOpen size={17} />
            <span>Daftar Pelatihan Vokasi</span>
            <ArrowRight size={15} />
          </Link>

          <Link
            href="/e-katalog"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <ShoppingBag size={17} />
            <span>Jelajahi E-Katalog</span>
          </Link>

          <Link
            href="/fasilitas"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <Building2 size={17} className="text-sky-600" />
            <span>Sewa Ruang & Fasilitas</span>
          </Link>
        </motion.div>

        {/* --- STATS COUNTER BAR (4 METRICS) --- */}
        <div className="w-full max-w-5xl mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6 bg-white/90 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 shadow-xs">
          <div className="text-center p-3">
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {statsLoading ? '...' : (stats?.tenants || 24)}+
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Tenant & Startup</p>
          </div>

          <div className="text-center p-3 border-l border-slate-100">
            <p className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight">
              {statsLoading ? '...' : (stats?.alumnis ? stats.alumnis.toLocaleString('id-ID') : '5.200+')}+
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Alumni Tersertifikasi</p>
          </div>

          <div className="text-center p-3 border-t md:border-t-0 md:border-l border-slate-100">
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">
              {statsLoading ? '...' : (stats?.catalogs || 65)}+
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Produk di Katalog</p>
          </div>

          <div className="text-center p-3 border-t md:border-t-0 md:border-l border-slate-100">
            <p className="text-3xl sm:text-4xl font-black text-sky-600 tracking-tight">
              {statsLoading ? '...' : (stats?.rooms || 18)}+
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Fasilitas & Lab</p>
          </div>
        </div>

      </section>

      {/* --- SECTION 1: PELATIHAN UNGGULAN (FEATURED TRAININGS) --- */}
      <section className="relative z-10 w-full max-w-[1920px] mx-auto px-6 lg:px-12 py-16 border-t border-slate-200/70">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold tracking-wider uppercase mb-2 border border-amber-200/60">
              <Sparkles size={12} /> Program Pilihan
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pelatihan Vokasi Unggulan
            </h2>
            <p className="text-sm text-slate-500 mt-1">Kurikulum terstruktur sesuai standar kebutuhan industri manufaktur & teknologi</p>
          </div>

          <Link
            href="/program-pelatihan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors"
          >
            <span>Lihat Semua Pelatihan</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        {/* Grid 3 Kolom Mengikuti Standar Anti-Overflow Kartu Publik */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingTrainings ? (
            [1, 2, 3].map(n => (
              <div key={n} className="public-card p-4 space-y-4">
                <div className="public-shimmer h-48 w-full rounded-2xl" />
                <div className="public-shimmer h-5 w-3/4 rounded-lg" />
                <div className="public-shimmer h-4 w-1/2 rounded-lg" />
              </div>
            ))
          ) : featuredTrainings.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm font-medium">
              Belum ada data pelatihan unggulan yang dipublikasikan.
            </div>
          ) : (
            featuredTrainings.map(t => (
              <div
                key={t.id}
                className="public-card public-card-hover group flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Media Header */}
                  <div className="public-card-media relative h-52 bg-slate-100 overflow-hidden">
                    {t.imageUrl ? (
                      <img
                        src={t.imageUrl}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-xs">
                        Solo Technopark
                      </div>
                    )}
                    <div className="public-card-scrim" />

                    <div className="public-card-badge-top-left">
                      <span className="text-[10px] font-black bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-slate-800 uppercase tracking-wider shadow-2xs">
                        {t.type || 'Offline'}
                      </span>
                    </div>

                    <div className="public-card-badge-bottom-left">
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded shadow-xs">
                        Kuota: {t.registeredCount || 0}/{t.quota || '∞'}
                      </span>
                    </div>
                  </div>

                  {/* Body Konten */}
                  <div className="public-card-body p-5">
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">{t.category || 'Vokasi'}</span>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 mt-1">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {t.description || 'Program intensif dengan bimbingan instruktur profesional berstandar industri.'}
                    </p>
                  </div>
                </div>

                {/* Footer Harga & CTA */}
                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biaya</span>
                    <p className="text-base font-black text-slate-900">
                      {t.isFree ? (
                        <span className="text-emerald-600">Gratis</span>
                      ) : (
                        formatRupiah(t.price || 0)
                      )}
                    </p>
                  </div>

                  <Link
                    href={`/program-pelatihan/${t.id}`}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>Detail</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* --- SECTION 2: 4 PILAR LAYANAN UTAMA KAWASAN --- */}
      <section className="relative z-10 w-full max-w-[1920px] mx-auto px-6 lg:px-12 py-16 bg-white border-y border-slate-200/70">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wider uppercase mb-2 border border-blue-200/60">
            Layanan Terintegrasi
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ekosistem Komprehensif Satu Atap
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Infrastruktur, teknologi, dan pendampingan terpadu untuk mendorong percepatan hilirisasi riset dan bisnis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {LAYANAN_UTAMA.map(l => (
            <Link
              key={l.id}
              href={l.href}
              className={`p-6 rounded-3xl bg-slate-50/60 hover:bg-white border border-slate-200/80 transition-all duration-300 flex flex-col justify-between group shadow-2xs ${l.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 bg-white rounded-2xl shadow-2xs border border-slate-200/60">
                    {l.icon}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider ${l.badgeBg}`}>
                    {l.badge}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                  {l.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {l.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors gap-1.5">
                <span>Akses Layanan</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- SECTION 3: AGENDA EVENT & ACARA TERDEKAT --- */}
      {upcomingEvents.length > 0 && (
        <section className="relative z-10 w-full max-w-[1920px] mx-auto px-6 lg:px-12 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-violet-50 text-violet-700 text-[11px] font-bold tracking-wider uppercase mb-2 border border-violet-200/60">
                <Calendar size={12} /> Agenda & Seminar
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Event Mendatang di Kawasan
              </h2>
              <p className="text-sm text-slate-500 mt-1">Ikuti seminar teknologi, workshop wirausaha, dan pameran inovasi terbaru</p>
            </div>

            <Link
              href="/event"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
            >
              <span>Lihat Semua Agenda</span>
              <ChevronRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingEvents.map(ev => (
              <div
                key={ev.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row gap-6 items-start group hover:border-violet-300 transition-all"
              >
                {ev.imageUrl && (
                  <div className="w-full sm:w-48 h-36 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
                    <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between h-full space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200/60 uppercase">
                        {ev.type || 'Event'}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {ev.date}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-violet-700 transition-colors">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {ev.description || 'Hadiri agenda inspiratif ini bersama praktisi dan inovator industri.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <MapPin size={12} className="text-violet-500" /> {ev.location || 'Solo Technopark'}
                    </span>
                    <Link
                      href={`/event`}
                      className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
                    >
                      Daftar <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- SECTION 4: BANNER AJAKAN MITRA AFILIASI --- */}
      <section className="relative z-10 w-full max-w-[1920px] mx-auto px-6 lg:px-12 py-10">
        <div className="bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-xl border border-violet-900/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 text-violet-300 text-[11px] font-bold tracking-wider uppercase border border-white/15">
                <Share2 size={13} /> Peluang Kolaborasi
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Raih Penghasilan Tambahan Sebagai <span className="text-violet-400">Mitra Afiliasi Resmi</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Dapatkan komisi bagi hasil 5% untuk setiap pendaftaran pelatihan vokasi, penyewaan fasilitas ruangan, dan pemesanan produk katalog yang Anda referensikan. Transparan, tercatat otomatis, dan langsung cair ke rekening bank Anda.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Link
                href="/profil"
                className="px-7 py-3.5 rounded-full bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all text-center flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                <span>Daftar Jadi Mitra Sekarang</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/program-pelatihan"
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm transition-all text-center"
              >
                Lihat Katalog Program
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 5: WARTA & ARTIKEL TERBARU --- */}
      {latestArticles.length > 0 && (
        <section className="relative z-10 w-full max-w-[1920px] mx-auto px-6 lg:px-12 py-16 border-t border-slate-200/70">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wider uppercase mb-2 border border-blue-200/60">
                <Newspaper size={12} /> Publikasi & Kabar
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Warta & Artikel Inovasi Terkini
              </h2>
              <p className="text-sm text-slate-500 mt-1">Ikuti liputan perkembangan ekosistem riset terapan dan teknologi lokal</p>
            </div>

            <Link
              href="/artikel"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>Semua Artikel</span>
              <ChevronRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestArticles.map(art => (
              <Link
                key={art.id}
                href={`/artikel/${art.slug || art.id}`}
                className="public-card public-card-hover group flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                    {art.coverImageUrl ? (
                      <img src={art.coverImageUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-100">
                        Warta Solo Technopark
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">{art.category || 'Berita'}</span>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mt-1">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {art.excerpt || art.content?.slice(0, 100) || 'Baca selengkapnya mengenai liputan inovasi ini...'}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 mt-3">
                  <span>{new Date(art.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Baca <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* --- SECTION 6: TEASER PETA KAWASAN & PENTAHELIX --- */}
      <section className="relative z-10 w-full max-w-[1920px] mx-auto px-6 lg:px-12 py-16 bg-white border-t border-slate-200/70">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* Teaser Peta Kawasan */}
          <div className="p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Compass size={24} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Eksplorasi Denah & Fasilitas Kawasan
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Jelajahi peta interaktif kawasan Solo Technopark seluas puluhan hektare: temukan titik gedung pertemuan, workshop permesinan manufaktur, laboratorium AI & IoT, auditorium, serta co-working hub secara visual.
            </p>
            <Link
              href="/peta-kawasan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <span>Buka Peta Interaktif</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Pentahelix Collaboration Card */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Model Kolaborasi</span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Sinergi Ekosistem Pentahelix
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Pertumbuhan kawasan diperkuat integrasi 5 aktor pembangunan: regulasi pemerintah, riset akademisi, hilirisasi industri, kreativitas komunitas, dan amplifikasi media publikasi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {PENTAHELIX_DATA.slice(0, 4).map(p => (
                <div key={p.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${p.bg}`}>
                    {p.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* --- FOOTER TERPADU --- */}
      <footer className="relative z-10 w-full bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Solo Technopark" width={70} height={36} className="h-9 w-auto brightness-0 invert" />
              <div className="h-5 w-px bg-slate-700" />
              <span className="text-sm font-black tracking-wider text-slate-200">SOLO TECHNOPARK</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Kawasan Sains dan Teknologi (KST) terpadu di Kota Surakarta yang memadukan unsur iptek, vokasi industri, serta inkubasi bisnis rintisan.
            </p>
            <p className="text-xs text-slate-500">
              Jl. Ki Hajar Dewantara No. 19, Jebres, Kec. Jebres, Kota Surakarta, Jawa Tengah 57126
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Navigasi Utama</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/program-pelatihan" className="hover:text-white transition-colors">Program Pelatihan</Link></li>
              <li><Link href="/e-katalog" className="hover:text-white transition-colors">E-Katalog Produk</Link></li>
              <li><Link href="/fasilitas" className="hover:text-white transition-colors">Sewa Fasilitas</Link></li>
              <li><Link href="/ekosistem" className="hover:text-white transition-colors">Direktori Tenant</Link></li>
              <li><Link href="/event" className="hover:text-white transition-colors">Agenda Event</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Program & Bantuan</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/profil" className="hover:text-white transition-colors">Program Kemitraan Afiliasi</Link></li>
              <li><Link href="/portal" className="hover:text-white transition-colors">Portal Pengguna</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Asisten AI Krenova</Link></li>
              <li><Link href="/peta-kawasan" className="hover:text-white transition-colors">Peta Kawasan</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">Pusat Bantuan / FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Kawasan Sains & Teknologi Solo Technopark. Hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:underline">Bantuan</Link>
            <Link href="/profil" className="hover:underline">Mitra Afiliasi</Link>
            <Link href="/peta-kawasan" className="hover:underline">Lokasi Kawasan</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}