'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { APP_ROLES, ROLE_LABELS, isInternalStaff } from '@/config/roles';
import {
  ShieldAlert,
  Crown,
  Building2,
  ClockCheck,
  Rocket,
  Handshake,
  GraduationCap,
  Briefcase,
  ShoppingBag,
  Ticket,
  Receipt,
  Hammer,
  Wrench,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  badge?: string;
  external?: boolean;
}

export default function ProfileRoleQuickAccess() {
  const { role, user, tenantId, partnerId, alumniId } = useAuth();

  // Role visual configuration
  const getRoleConfig = () => {
    switch (role) {
      case APP_ROLES.SUPER_ADMIN:
        return {
          title: 'Super Administrator',
          subtitle: 'Akses penuh ke seluruh konsol manajemen, otorisasi sistem, & finansial BLUD Solo Technopark.',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          gradient: 'from-rose-500/10 via-red-500/5 to-slate-900/5',
          icon: Crown,
          iconColor: 'text-rose-600',
        };
      case APP_ROLES.ADMIN:
      case APP_ROLES.ADMIN_ASET:
      case APP_ROLES.ADMIN_KEUANGAN:
      case APP_ROLES.ADMIN_PELATIHAN:
      case APP_ROLES.ADMIN_PRODUKSI:
      case APP_ROLES.ADMIN_TENANT:
      case APP_ROLES.KASIR:
      case APP_ROLES.KASIR_PENGELUARAN:
      case APP_ROLES.DIREKTUR:
        return {
          title: ROLE_LABELS[role] || 'Staf Administrator Kawasan',
          subtitle: 'Akun staf operasional terverifikasi dengan kewenangan modul internal Solo Technopark.',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          gradient: 'from-indigo-500/10 via-blue-500/5 to-slate-900/5',
          icon: ShieldAlert,
          iconColor: 'text-indigo-600',
        };
      case APP_ROLES.PEGAWAI:
        return {
          title: 'Pegawai Solo Technopark',
          subtitle: 'Akses terverifikasi sistem presensi geo-tagging, lembur, dan pelaporan kinerja LKH Techno Sign.',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
          gradient: 'from-sky-500/10 via-indigo-500/5 to-slate-900/5',
          icon: ClockCheck,
          iconColor: 'text-sky-600',
        };
      case APP_ROLES.TENANT:
        return {
          title: 'Tenant / Startup Binaan',
          subtitle: 'Pelaku usaha & startup binaan inkubator bisnis Solo Technopark.',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          gradient: 'from-amber-500/10 via-orange-500/5 to-slate-900/5',
          icon: Rocket,
          iconColor: 'text-amber-600',
        };
      case APP_ROLES.INDUSTRI:
        return {
          title: 'Mitra Industri / Korporasi',
          subtitle: 'Perusahaan mitra resmi penyerapan tenaga kerja, riset bersama, & penyedia proyek vokasi.',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          gradient: 'from-emerald-500/10 via-teal-500/5 to-slate-900/5',
          icon: Handshake,
          iconColor: 'text-emerald-600',
        };
      case APP_ROLES.ALUMNI:
        return {
          title: 'Alumni Vokasi Terverifikasi',
          subtitle: 'Lulusan program pelatihan Solo Technopark dengan akses bursa karir eksklusif.',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          gradient: 'from-emerald-500/10 via-teal-500/5 to-slate-900/5',
          icon: GraduationCap,
          iconColor: 'text-emerald-600',
        };
      case APP_ROLES.INVESTOR:
        return {
          title: 'Mitra Investor / Venture Capital',
          subtitle: 'Akses kurasi Deal Room, profil keuangan startup inkubator, & proposal business matching.',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          gradient: 'from-purple-500/10 via-indigo-500/5 to-slate-900/5',
          icon: Sparkles,
          iconColor: 'text-purple-600',
        };
      default:
        return {
          title: 'Pengguna Umum / Mitra Kawasan',
          subtitle: 'Akses penuh ke pemesanan fasilitas, pendaftaran diklat vokasi, dan e-katalog kawasan.',
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
          gradient: 'from-slate-500/5 to-slate-900/5',
          icon: Building2,
          iconColor: 'text-slate-600',
        };
    }
  };

  // Quick action links based on user role
  const getQuickActions = (): QuickAction[] => {
    // 1. Staf Internal & Administrator
    if (isInternalStaff(role)) {
      const actions: QuickAction[] = [
        {
          label: 'Dasbor Admin Utama',
          description: 'Pusat ringkasan KPI, statistik keuangan & layanan',
          href: '/dashboard',
          icon: Crown,
          color: 'bg-indigo-600 text-white',
          badge: 'Console',
        },
        {
          label: 'Executive Command',
          description: 'Business Intelligence & analitik eksekutif kawasan',
          href: '/eksekutif',
          icon: Sparkles,
          color: 'bg-slate-900 text-white',
        },
        {
          label: 'Presensi Pegawai STP',
          description: 'Akses portal check-in presensi & laporan harian LKH',
          href: '/presensi',
          icon: ClockCheck,
          color: 'bg-sky-600 text-white',
          badge: 'Techno Sign',
        },
        {
          label: 'Manajemen Aset & Sewa',
          description: 'Kelola ruangan, fasilitas, dan jadwal booking',
          href: '/aset',
          icon: Building2,
          color: 'bg-blue-600 text-white',
        },
        {
          label: 'Billing & Invoice Keuangan',
          description: 'Pembuatan tagihan, kasir POS, dan pelaporan BLUD',
          href: '/billing',
          icon: Receipt,
          color: 'bg-emerald-600 text-white',
        },
        {
          label: 'Service Desk & SPK',
          description: 'Tiket perbaikan fasilitas & SPK teknisi kawasan',
          href: '/service-desk',
          icon: Wrench,
          color: 'bg-amber-600 text-white',
        },
        {
          label: 'Layanan Jasa Produksi',
          description: 'Manajemen order bengkel manufaktur & BAST',
          href: '/jasa-produksi',
          icon: Hammer,
          color: 'bg-orange-600 text-white',
        },
      ];
      return actions;
    }

    // 2. Pegawai Khusus Presensi
    if (role === APP_ROLES.PEGAWAI) {
      return [
        {
          label: 'Portal Presensi Techno Sign',
          description: 'Check-in masuk/pulang, rekap presensi, & lembur',
          href: '/presensi',
          icon: ClockCheck,
          color: 'bg-sky-600 text-white',
          badge: 'Aktif Hari Ini',
        },
        {
          label: 'Bursa Karir & Peluang',
          description: 'Info lowongan kerja mitra dan penyerapan talenta',
          href: '/karir',
          icon: Briefcase,
          color: 'bg-emerald-600 text-white',
        },
      ];
    }

    // 3. Tenant Startup
    if (role === APP_ROLES.TENANT) {
      return [
        {
          label: 'Dasbor Inkubasi Tenant',
          description: 'Kelola milestones, kurasi produk UKM, dan bimbingan mentor',
          href: '/tenant',
          icon: Rocket,
          color: 'bg-amber-600 text-white',
          badge: 'Inkubator',
        },
        {
          label: 'Smart Hub Kolaborasi',
          description: 'Jejaring ekosistem startup, investor, dan kampus',
          href: '/ekosistem',
          icon: Sparkles,
          color: 'bg-violet-600 text-white',
        },
        {
          label: 'Pesan Ruang & Fasilitas',
          description: 'Reservasi ruang meeting dan coworking kawasan',
          href: '/fasilitas',
          icon: Building2,
          color: 'bg-sky-600 text-white',
        },
      ];
    }

    // 4. Mitra Industri / Korporasi
    if (role === APP_ROLES.INDUSTRI) {
      return [
        {
          label: 'Pusat Kemitraan & MoU',
          description: 'Kelola perjanjian kerja sama dan pipeline proyek industri',
          href: '/kemitraan',
          icon: Handshake,
          color: 'bg-emerald-600 text-white',
          badge: 'Mitra Resmi',
        },
        {
          label: 'Bursa Karir & Pasang Loker',
          description: 'Publikasikan lowongan kerja dan rekrut talenta terbaik STP',
          href: '/karir',
          icon: Briefcase,
          color: 'bg-teal-600 text-white',
        },
        {
          label: 'Forum Jembatan Industri',
          description: 'Diskusi langsung dengan alumni dan pimpinan diklat',
          href: '/alumni-portal',
          icon: GraduationCap,
          color: 'bg-blue-600 text-white',
        },
      ];
    }

    // 5. Alumni Vokasi
    if (role === APP_ROLES.ALUMNI) {
      return [
        {
          label: 'Bursa Karir & Smart Match',
          description: 'Rekomendasi lowongan kerja selaras sertifikasi kejuruan',
          href: '/karir',
          icon: Briefcase,
          color: 'bg-emerald-600 text-white',
          badge: 'Eksklusif',
        },
        {
          label: 'Forum Eksklusif Alumni',
          description: 'Loker referral, bedah CV, dan proyek mikro industri',
          href: '/alumni-portal',
          icon: GraduationCap,
          color: 'bg-teal-600 text-white',
        },
        {
          label: 'Ruang Belajar Digital',
          description: 'Akses modul materi dan rekaman pembelajaran diklat',
          href: '/ruang-belajar',
          icon: BookOpen,
          color: 'bg-indigo-600 text-white',
        },
      ];
    }

    // 6. Mitra Investor
    if (role === APP_ROLES.INVESTOR) {
      return [
        {
          label: 'Deal Room Investor',
          description: 'Kurasi startup binaan dan data performa finansial',
          href: '/investor-room',
          icon: Sparkles,
          color: 'bg-purple-600 text-white',
          badge: 'Privat',
        },
        {
          label: 'Direktori Ekosistem',
          description: 'Jejaring startup, riset kampus, dan fasilitas riset',
          href: '/ekosistem',
          icon: Building2,
          color: 'bg-slate-900 text-white',
        },
      ];
    }

    // 7. Pengguna Umum / Publik
    return [
      {
        label: 'Katalog Program Pelatihan',
        description: 'Daftar kursus, diklat bersertifikasi, & bootcamp vokasi',
        href: '/program-pelatihan',
        icon: GraduationCap,
        color: 'bg-amber-600 text-white',
      },
      {
        label: 'Sewa Ruangan & Fasilitas',
        description: 'Auditorium, ruang rapat, laboratorium modern, & coworking',
        href: '/fasilitas',
        icon: Building2,
        color: 'bg-sky-600 text-white',
      },
      {
        label: 'E-Katalog Produk & Inovasi',
        description: 'Peralatan teknis, produk tenant startup, dan jasa kawasan',
        href: '/e-katalog',
        icon: ShoppingBag,
        color: 'bg-emerald-600 text-white',
      },
      {
        label: 'Agenda Acara & Seminar',
        description: 'Ikuti workshop teknologi, lokakarya, dan konferensi',
        href: '/event',
        icon: Ticket,
        color: 'bg-violet-600 text-white',
      },
    ];
  };

  const config = getRoleConfig();
  const actions = getQuickActions();
  const RoleIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Banner Identitas Peran */}
      <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-br ${config.gradient} border border-slate-200/80 shadow-xs relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
              <RoleIcon className={config.iconColor} size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${config.badgeBg}`}>
                  {config.title}
                </span>
                {user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 size={12} /> Email Terverifikasi
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ruang Kerja & Menu Terintegrasi
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-medium leading-relaxed">
                {config.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Pintasan Menu Sesuai Role */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span>Pintasan Cepat Sesuai Hak Akses Anda</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">
            {actions.length} Akses Tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.href}
                href={act.href}
                className="group p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${act.color} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                      <Icon size={18} />
                    </div>
                    {act.badge && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {act.label}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                    {act.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                  <span>Buka Menu</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

