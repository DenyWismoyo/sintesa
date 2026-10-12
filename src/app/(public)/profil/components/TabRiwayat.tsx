// Lokasi file: src/app/(public)/profil/components/TabRiwayat.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight,
  GraduationCap,
  Building2,
  ShoppingBag,
  Mail,
  Receipt,
  Sparkles,
  ExternalLink,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { bookingService } from '@/services/booking.service';
import { trainingService } from '@/services/training.service';
import { billingService } from '@/services/billing.service';
import { emailService, EmailQueueItem } from '@/services/email.service';
import { formatRupiah } from '@/utils/format';

interface TabRiwayatProps {
  userEmail: string;
  userName?: string;
}

type ActivityFilter = 'all' | 'trainings' | 'bookings' | 'orders' | 'emails';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } }
};

export default function TabRiwayat({ userEmail }: TabRiwayatProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');
  const [loading, setLoading] = useState(true);

  // Data State
  const [bookings, setBookings] = useState<any[]>([]);
  const [courses, setCourses] = useState<{ registration: any; training: any }[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailQueueItem[]>([]);

  useEffect(() => {
    if (!userEmail) return;

    const fetchAllUserHistory = async () => {
      setLoading(true);
      try {
        const [bookingsRes, coursesRes, invoicesRes, emailLogsRes] = await Promise.allSettled([
          bookingService.trackBookingsByEmail(userEmail),
          trainingService.getMyEnrolledCourses(userEmail),
          billingService.getMyInvoices(userEmail),
          emailService.getUserEmailLogs(userEmail, 20),
        ]);

        if (bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value)) {
          setBookings(bookingsRes.value);
        }
        if (coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value)) {
          setCourses(coursesRes.value);
        }
        if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value)) {
          setInvoices(invoicesRes.value);
        }
        if (emailLogsRes.status === 'fulfilled' && Array.isArray(emailLogsRes.value)) {
          setEmailLogs(emailLogsRes.value);
        }
      } catch (err) {
        console.error('Gagal mengambil riwayat pengguna:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUserHistory();
  }, [userEmail]);

  // Gabungkan seluruh aktivitas ke timeline seragam
  const allActivities = React.useMemo(() => {
    const list: any[] = [];

    // 1. Pelatihan
    courses.forEach(c => {
      list.push({
        id: `course-${c.registration?.id || Math.random()}`,
        type: 'trainings',
        typeName: 'Pelatihan & Diklat',
        title: c.training?.title || 'Program Pelatihan',
        subtitle: `Level: ${c.training?.level || 'Industri'} • ${c.training?.type || 'Kompetensi'}`,
        status: c.registration?.status || 'AKTIF',
        statusType: 'success',
        timestamp: c.registration?.enrolledAt || c.registration?.createdAt || 0,
        dateFormatted: c.registration?.enrolledAt ? new Date(c.registration.enrolledAt).toLocaleDateString('id-ID') : 'Terdaftar',
        actionLabel: 'Buka Ruang Belajar',
        actionUrl: '/ruang-belajar',
      });
    });

    // 2. Peminjaman Fasilitas
    bookings.forEach(b => {
      list.push({
        id: `booking-${b.id}`,
        type: 'bookings',
        typeName: 'Sewa Fasilitas',
        title: b.assetName || 'Fasilitas Kawasan',
        subtitle: `Waktu: ${b.startDate} (${b.startTime || 'Sesi'} - ${b.endTime || 'Selesai'})`,
        status: b.status === 'approved' ? 'DISETUJUI' : b.status === 'completed' ? 'SELESAI' : b.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU REVIEW',
        statusType: b.status === 'approved' || b.status === 'completed' ? 'success' : b.status === 'rejected' ? 'danger' : 'warning',
        timestamp: b.createdAt || 0,
        dateFormatted: b.startDate || 'Tanggal Sewa',
        actionLabel: 'Lihat Fasilitas',
        actionUrl: '/fasilitas',
      });
    });

    // 3. Transaksi Tagihan / E-Katalog
    invoices.forEach(inv => {
      list.push({
        id: `invoice-${inv.id}`,
        type: 'orders',
        typeName: 'Transaksi Layanan',
        title: inv.invoiceNumber || 'Invoice Layanan',
        subtitle: `Total: ${formatRupiah(inv.totalAmount || 0)} • ${inv.items?.length || 1} Layanan`,
        status: inv.status === 'PAID' ? 'LUNAS' : inv.status === 'PENDING' ? 'MENUNGGU BAYAR' : inv.status,
        statusType: inv.status === 'PAID' ? 'success' : 'warning',
        timestamp: inv.createdAt || 0,
        dateFormatted: inv.dueDate ? `Jatuh Tempo: ${inv.dueDate}` : 'Tagihan',
        actionLabel: 'Detail Tagihan',
        actionUrl: '/profil',
      });
    });

    // 4. Notifikasi Email Resmi
    emailLogs.forEach(mail => {
      list.push({
        id: `email-${mail.id}`,
        type: 'emails',
        typeName: 'Email No-Reply',
        title: mail.subject || 'Pemberitahuan Sistem STP',
        subtitle: `Status Pengiriman: ${mail.status === 'SENT' ? 'Terkirim ke Inbox' : mail.status}`,
        status: mail.status === 'SENT' ? 'TERKIRIM' : 'PROSES',
        statusType: mail.status === 'SENT' ? 'success' : 'warning',
        timestamp: mail.createdAt || 0,
        dateFormatted: mail.createdAt ? new Date(mail.createdAt).toLocaleDateString('id-ID') : 'Terkirim',
        actionLabel: 'Sistem Otomatis',
        actionUrl: undefined,
      });
    });

    // Urutkan dari aktivitas terbaru
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [courses, bookings, invoices, emailLogs]);

  // Filter list
  const filteredActivities = React.useMemo(() => {
    if (activeFilter === 'all') return allActivities;
    return allActivities.filter(a => a.type === activeFilter);
  }, [allActivities, activeFilter]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-amber-500 h-10 w-10" />
        <p className="text-xs font-semibold text-slate-400">Memuat riwayat aktivitas Anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER & KPI SUMMARY STATS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock size={22} className="text-amber-500" /> Riwayat Aktivitas Pengguna
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Catatan komprehensif seluruh pendaftaran diklat, peminjaman ruangan, transaksi layanan, dan surat konfirmasi Anda.
            </p>
          </div>
        </div>

        {/* 3 KOTAK SUMMARY */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pelatihan</span>
            <span className="text-xl font-black text-amber-900">{courses.length}</span>
            <span className="text-[10px] text-amber-600 font-semibold block">Kelas Terdaftar</span>
          </div>
          <div className="bg-sky-50/60 border border-sky-200/70 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">Fasilitas</span>
            <span className="text-xl font-black text-sky-900">{bookings.length}</span>
            <span className="text-[10px] text-sky-600 font-semibold block">Pengajuan Sewa</span>
          </div>
          <div className="bg-indigo-50/60 border border-indigo-200/70 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Transaksi</span>
            <span className="text-xl font-black text-indigo-900">{invoices.length}</span>
            <span className="text-[10px] text-indigo-600 font-semibold block">Invoice Terbit</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Notifikasi</span>
            <span className="text-xl font-black text-emerald-900">{emailLogs.length}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block">Email Terkirim</span>
          </div>
        </div>

        {/* 2. FILTER TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({allActivities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('trainings')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'trainings'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap size={13} />
            <span>Pelatihan ({courses.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('bookings')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'bookings'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 size={13} />
            <span>Sewa Fasilitas ({bookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('orders')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'orders'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Receipt size={13} />
            <span>Tagihan ({invoices.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('emails')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'emails'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Mail size={13} />
            <span>Email Masuk ({emailLogs.length})</span>
          </button>
        </div>
      </div>

      {/* 3. LIST CARD AKTIVITAS */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs border border-slate-100 text-slate-300">
            <Clock size={28} />
          </div>
          <h4 className="text-base font-bold text-slate-800">Belum Ada Catatan Riwayat</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Aktivitas pendaftaran kursus, peminjaman ruangan, dan transaksi yang Anda lakukan akan otomatis tercatat rapi di sini.
          </p>
        </div>
      ) : (
        <motion.div 
          className="space-y-3.5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredActivities.map((item) => {
            // Ikon dan warna berdasarkan tipe
            const isTraining = item.type === 'trainings';
            const isBooking = item.type === 'bookings';
            const isOrder = item.type === 'orders';
            const isEmail = item.type === 'emails';

            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Info Utama */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isTraining ? 'bg-amber-50 text-amber-600 border border-amber-200/60' :
                    isBooking ? 'bg-sky-50 text-sky-600 border border-sky-200/60' :
                    isOrder ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/60' :
                    'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                  }`}>
                    {isTraining && <GraduationCap size={20} />}
                    {isBooking && <Building2 size={20} />}
                    {isOrder && <ShoppingBag size={20} />}
                    {isEmail && <Mail size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isTraining ? 'bg-amber-100/70 text-amber-800' :
                        isBooking ? 'bg-sky-100/70 text-sky-800' :
                        isOrder ? 'bg-indigo-100/70 text-indigo-800' :
                        'bg-emerald-100/70 text-emerald-800'
                      }`}>
                        {item.typeName}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        • {item.dateFormatted}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {/* Status & Tombol Aksi */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 ${
                    item.statusType === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' :
                    item.statusType === 'danger' ? 'bg-rose-50 text-rose-700 border border-rose-200/70' :
                    'bg-amber-50 text-amber-700 border border-amber-200/70'
                  }`}>
                    {item.statusType === 'success' && <CheckCircle2 size={12} />}
                    {item.statusType === 'danger' && <XCircle size={12} />}
                    {item.statusType === 'warning' && <Clock size={12} />}
                    <span>{item.status}</span>
                  </span>

                  {item.actionUrl ? (
                    <Link
                      href={item.actionUrl}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 transition-all"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Tercatat di Sistem
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

    </div>
  );
}