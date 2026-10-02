'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAffiliateProfile } from '@/hooks/useAffiliate';
import { trainingService } from '@/services/training.service';
import { billingService } from '@/services/billing.service';
import { bookingService } from '@/services/booking.service';
import { useTraining } from '@/hooks/useTraining';
import { useEvents } from '@/hooks/useEvents';
import { Invoice, Booking, Training } from '@/types';
import { formatRupiah } from '@/utils/format';
import { toast } from 'sonner';

import {
  GraduationCap,
  Receipt,
  Share2,
  Calendar,
  Building2,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShoppingBag,
  Bot,
  HelpCircle,
  ShieldCheck,
  User,
  LogIn,
  ChevronRight,
  TrendingUp,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionContainer from '@/components/ui/SectionContainer';

export default function PortalDashboardPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { profile: affiliate } = useAffiliateProfile(user?.uid);
  const isApprovedAffiliate = affiliate?.status === 'APPROVED';

  const [enrolledCourses, setEnrolledCourses] = useState<{ registration: any; training: any }[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);

  const { trainings: allTrainings } = useTraining();
  const { events: allEvents } = useEvents();

  useEffect(() => {
    if (!user?.email) {
      setLoadingData(false);
      return;
    }

    const loadUserData = async () => {
      setLoadingData(true);
      try {
        const [coursesData, invoicesData, bookingsData] = await Promise.all([
          trainingService.getMyEnrolledCourses(user.email!),
          billingService.getMyInvoices(user.email!),
          bookingService.trackBookingsByEmail(user.email!)
        ]);

        setEnrolledCourses(coursesData);
        setInvoices(invoicesData);
        setBookings(bookingsData);
      } catch (err) {
        console.error('Gagal memuat data portal:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadUserData();
  }, [user]);

  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING');
  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'approved');

  const handleCopyReferral = () => {
    if (!affiliate?.referralCode) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sintesa.solotechnopark.id';
    const link = `${origin}/?ref=${affiliate.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedRef(true);
    toast.success('Link Referral Berhasil Disalin!', {
      description: `Tautan: ${link}`
    });
    setTimeout(() => setCopiedRef(false), 2500);
  };

  // State: Jika belum login
  if (!authLoading && !user) {
    return (
      <SectionContainer accent="slate" width="narrow">
        <div className="py-12 sm:py-16 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-sm">
            <User size={36} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Portal Personal Pengguna
          </h1>
          <p className="text-base text-slate-500 mb-8 leading-relaxed">
            Masuk ke akun Anda untuk mengakses dasbor terpadu: pantau progres kursus pelatihan, tagihan aktif, jadwal peminjaman ruangan, dan dompet komisi mitra afiliasi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={18} /> Masuk ke Akun Anda
            </Link>
            <Link
              href="/program-pelatihan"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              Jelajahi Program <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </SectionContainer>
    );
  }

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const recommendedTrainings = allTrainings.slice(0, 2);
  const upcomingEvents = (allEvents || []).slice(0, 2);

  return (
    <SectionContainer accent="sky" width="default">
      <div className="py-6 sm:py-8 space-y-8">
        
        {/* --- 1. HERO GREETING HEADER --- */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/70 rounded-full blur-3xl -z-10 pointer-events-none -translate-y-1/2 translate-x-1/3" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                  <Sparkles size={12} /> Dasbor Personal
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">{todayStr}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Selamat Datang, {user?.displayName || user?.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                Pantau seluruh aktivitas pembelajaran, transaksi layanan, agenda, dan ekosistem inovasi Anda di Solo Technopark.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/profil"
                className="px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all shadow-2xs"
              >
                <User size={15} className="text-slate-500" />
                <span>Pengaturan Akun</span>
              </Link>
              <Link
                href="/ruang-belajar"
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20"
              >
                <BookOpen size={15} />
                <span>Ruang Belajar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* --- 2. KPI METRICS CARDS (4 KOLOM) --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Kursus Saya */}
          <Link
            href="/ruang-belajar"
            className="public-card p-5 hover:border-amber-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <GraduationCap size={20} />
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kursus Aktif</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {enrolledCourses.length} <span className="text-xs font-medium text-slate-500">Kelas</span>
              </h3>
            </div>
          </Link>

          {/* Card 2: Tagihan Menunggu */}
          <Link
            href="/profil"
            className="public-card p-5 hover:border-red-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Receipt size={20} />
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tagihan Menunggu</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {pendingInvoices.length} <span className="text-xs font-medium text-slate-500">Invoice</span>
              </h3>
            </div>
          </Link>

          {/* Card 3: Mitra Afiliasi */}
          <Link
            href="/profil"
            className="public-card p-5 hover:border-violet-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Share2 size={20} />
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saldo Mitra</p>
              <h3 className="text-lg font-black text-slate-900 mt-0.5 truncate">
                {isApprovedAffiliate ? formatRupiah(affiliate?.availableBalance || 0) : 'Belum Terdaftar'}
              </h3>
            </div>
          </Link>

          {/* Card 4: Sewa Fasilitas */}
          <Link
            href="/fasilitas"
            className="public-card p-5 hover:border-sky-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Building2 size={20} />
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jadwal Sewa</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {activeBookings.length} <span className="text-xs font-medium text-slate-500">Aktif</span>
              </h3>
            </div>
          </Link>
        </div>

        {/* --- 3. DUAL COLUMN CONTENT AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI (2/3): KURSUS AKTIF & TAGIHAN PENDING */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tagihan Pending Banner (Jika Ada) */}
            {pendingInvoices.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-amber-900">Menunggu Pembayaran</h4>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Anda memiliki {pendingInvoices.length} tagihan yang belum diselesaikan. Segera konfirmasi agar akses layanan Anda aktif.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/profil"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-all shadow-sm"
                  >
                    Bayar Sekarang
                  </Link>
                </div>
              </div>
            )}

            {/* List Kursus Aktif */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600" /> Kelas & Kursus Saya
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Lanjutkan materi pembelajaran yang telah Anda daftarkan</p>
                </div>
                <Link
                  href="/ruang-belajar"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Lihat Semua <ChevronRight size={14} />
                </Link>
              </div>

              {loadingData ? (
                <div className="space-y-3">
                  {[1, 2].map(n => (
                    <div key={n} className="public-shimmer h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <GraduationCap size={36} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Belum Ada Kelas yang Diikuti</p>
                  <p className="text-xs text-slate-400 mt-0.5 mb-4">Daftar program pelatihan industri untuk meningkatkan kompetensi Anda</p>
                  <Link
                    href="/program-pelatihan"
                    className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all"
                  >
                    Jelajahi Pelatihan <ArrowRight size={13} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {enrolledCourses.slice(0, 3).map(({ registration, training }) => {
                    const totalLessons = training?.curriculum?.reduce((acc: number, curr: any) => acc + (curr.lessons?.length || 0), 0) || 0;
                    const completed = Array.isArray(registration.completedLessons) ? registration.completedLessons.length : 0;
                    const percent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

                    return (
                      <div
                        key={registration.id}
                        className="p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                              {training?.type || 'Pelatihan'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">• {completed}/{totalLessons} Materi</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 truncate">
                            {training?.title || 'Program Pelatihan'}
                          </h4>

                          {/* Mini Progress Bar */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-xs">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        <Link
                          href={`/ruang-belajar`}
                          className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all"
                        >
                          Lanjutkan <ArrowRight size={13} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Peminjaman Fasilitas Aktif */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 size={18} className="text-sky-600" /> Peminjaman Fasilitas & Ruangan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Jadwal sewa ruangan atau sarana yang sedang diproses</p>
                </div>
                <Link
                  href="/fasilitas"
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  Sewa Baru <ChevronRight size={14} />
                </Link>
              </div>

              {activeBookings.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">Tidak ada permohonan sewa aktif saat ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBookings.map(b => (
                    <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            b.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {b.status === 'approved' ? 'Disetujui' : 'Menunggu Review'}
                          </span>
                          <span className="text-xs text-slate-400">• {b.startDate}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">{b.assetName}</h4>
                      </div>
                      <Link
                        href="/fasilitas"
                        className="text-xs font-bold text-sky-600 hover:underline shrink-0"
                      >
                        Detail Jadwal
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* KOLOM KANAN (1/3): WIDGET AFILIASI & PINTASAN CEPAT */}
          <div className="space-y-6">
            
            {/* Widget Afiliasi */}
            {isApprovedAffiliate ? (
              <div className="bg-gradient-to-br from-violet-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-violet-400/10 rounded-full blur-2xl" />
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-[10px] font-black tracking-widest uppercase bg-white/10 px-2.5 py-1 rounded-md text-violet-200 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-violet-300" /> Mitra Resmi
                  </span>
                  <Link href="/profil" className="text-xs font-bold text-violet-300 hover:text-white flex items-center gap-1">
                    Detail <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="mb-5 relative z-10">
                  <p className="text-xs text-violet-300 font-medium">Saldo Komisi Siap Cair</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {formatRupiah(affiliate?.availableBalance || 0)}
                  </h3>
                  <p className="text-[11px] text-violet-300/80 mt-1">
                    Total Komisi Didapat: <span className="font-bold text-white">{formatRupiah(affiliate?.totalEarnings || 0)}</span>
                  </p>
                </div>

                {/* Referral Link Box */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-violet-200 uppercase tracking-wider">Kode Referral</span>
                    <span className="text-xs font-black text-white bg-violet-500/30 px-2 py-0.5 rounded">{affiliate?.referralCode}</span>
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="w-full py-2 px-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {copiedRef ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedRef ? 'Tautan Disalin!' : 'Salin Tautan Referral'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/80 rounded-3xl p-6 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold mb-3">
                  <Share2 size={20} />
                </div>
                <h4 className="text-base font-black text-violet-950">Dapatkan Komisi 5%</h4>
                <p className="text-xs text-violet-700 mt-1 leading-relaxed mb-4">
                  Bergabunglah sebagai Mitra Afiliasi Solo Technopark. Bagikan link pelatihan atau katalog dan dapatkan bagi hasil untuk setiap transaksi.
                </p>
                <Link
                  href="/profil"
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  Daftar Program Mitra <ArrowRight size={13} />
                </Link>
              </div>
            )}

            {/* Quick Actions Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" /> Pintasan Layanan
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/e-katalog"
                  className="p-3 rounded-2xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold flex flex-col gap-1 transition-all"
                >
                  <ShoppingBag size={18} className="text-emerald-600" />
                  <span>E-Katalog</span>
                </Link>

                <Link
                  href="/fasilitas"
                  className="p-3 rounded-2xl bg-sky-50/60 hover:bg-sky-50 border border-sky-100 text-sky-800 text-xs font-bold flex flex-col gap-1 transition-all"
                >
                  <Building2 size={18} className="text-sky-600" />
                  <span>Sewa Ruang</span>
                </Link>

                <Link
                  href="/explore"
                  className="p-3 rounded-2xl bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-bold flex flex-col gap-1 transition-all"
                >
                  <Bot size={18} className="text-indigo-600" />
                  <span>AI Krenova</span>
                </Link>

                <Link
                  href="/faq"
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex flex-col gap-1 transition-all"
                >
                  <HelpCircle size={18} className="text-slate-500" />
                  <span>Bantuan</span>
                </Link>
              </div>
            </div>

            {/* Rekomendasi Pelatihan Unggulan */}
            {recommendedTrainings.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pelatihan Populer</h4>
                  <Link href="/program-pelatihan" className="text-xs font-bold text-amber-600 hover:underline">
                    Semua
                  </Link>
                </div>

                <div className="space-y-3">
                  {recommendedTrainings.map(t => (
                    <Link
                      key={t.id}
                      href={`/program-pelatihan/${t.id}`}
                      className="block p-3 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
                    >
                      <h5 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 line-clamp-1">
                        {t.title}
                      </h5>
                      <p className="text-[11px] font-black text-amber-600 mt-1">
                        {t.isFree ? 'Gratis' : formatRupiah(t.price || 0)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </SectionContainer>
  );
}