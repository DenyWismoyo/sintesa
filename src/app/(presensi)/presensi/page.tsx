"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { useRiwayatPresensi } from "@/hooks/presensi/usePresensi";
import { useLKHHarian } from "@/hooks/presensi/useLKH";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClockCheck,
  FileSpreadsheet,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  UserCheck2,
  Inbox,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

import QuickPresensiWidget from "@/components/presensi/dashboard/QuickPresensiWidget";
import MonthlyAttendanceCalendar from "@/components/presensi/dashboard/MonthlyAttendanceCalendar";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
};

export default function DashboardPage() {
  const { user } = usePresensiAuth();
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data: riwayatPresensi = [] } = useRiwayatPresensi(user?.id, 30);
  const { data: lkhToday } = useLKHHarian(user?.id, todayDateStr);

  const stats = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;

    riwayatPresensi.forEach((r) => {
      if (r.status === "hadir") hadir++;
      else if (r.status === "terlambat") terlambat++;
      else if (["izin", "sakit", "cuti"].includes(r.status)) izin++;
    });

    const totalHari = riwayatPresensi.length || 1;
    const rate = Math.round((hadir / totalHari) * 100);

    return {
      hadirHari: hadir,
      terlambatKali: terlambat,
      izinHari: izin,
      rate: Math.min(100, Math.max(0, rate)),
    };
  }, [riwayatPresensi]);

  const kegiatanList = lkhToday?.kegiatan || [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-6"
    >
      {/* ─── Hero Welcome Banner (Borderless di Mobile) ─── */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-none sm:rounded-3xl border-b sm:border border-emerald-800/40 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-none sm:shadow-md"
      >
        {/* Ambient glow */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          {/* Baris atas: label instansi */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-semibold mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {user?.instansi || "UPTD KST Solo Technopark"}
          </div>

          {/* Nama pegawai */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-1">
            Selamat Bertugas, <span className="text-emerald-300">{(user?.nama || "Pegawai").split(" ")[0]}</span>
          </h1>

          {/* Info jabatan */}
          <p className="hidden xs:block text-emerald-100/70 text-[11px] sm:text-xs leading-relaxed mb-4">
            {user?.jabatan || "Pegawai"} · NIP {user?.nip || "-"}
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-2 mt-3 sm:mt-0">
            <Link href="/presensi/scan" className="flex-1 sm:flex-initial">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 sm:px-5 shadow-sm rounded-xl">
                <ClockCheck className="w-4 h-4 mr-1.5" />
                Presensi Sekarang
              </Button>
            </Link>
            <Link href="/presensi/laporan" className="flex-1 sm:flex-initial">
              <Button
                variant="outline"
                className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-4 sm:px-5 rounded-xl"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Logbook Harian</span>
                <span className="sm:hidden">Logbook</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ─── Grid: Radar Presensi + Logbook ─── */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 items-start"
      >
        {/* Radar Presensi Real-Time */}
        <QuickPresensiWidget />

        {/* Card Logbook Hari Ini — borderless style */}
        <div className="card-base overflow-hidden">
          {/* Section header */}
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-slate-900 truncate">Logbook Kegiatan Hari Ini</span>
            </div>
            <Badge
              variant={
                lkhToday?.status === "approved"
                  ? "default"
                  : lkhToday?.status === "submitted"
                  ? "outline"
                  : "secondary"
              }
              className="text-[10px] px-2 py-0.5 shrink-0 capitalize"
            >
              {lkhToday?.status ?? "Kosong"}
            </Badge>
          </div>

          {/* Konten LKH */}
          <div className="p-4 sm:p-5 space-y-3">
            {kegiatanList.length === 0 ? (
              <div className="py-5 text-center text-slate-400 space-y-1.5">
                <Inbox className="w-7 h-7 mx-auto opacity-40" />
                <p className="text-[11px]">Belum ada kegiatan yang dicatat hari ini.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {kegiatanList.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{item.deskripsi}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.jamMulai} - {item.jamSelesai}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      +{item.totalPoin} Poin
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <Link href="/presensi/laporan" className="block w-full">
              <Button className="w-full text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl">
                {kegiatanList.length > 0 ? "Buka / Lanjutkan Logbook" : "+ Tambah Kegiatan Logbook"}
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ─── Statistik Kehadiran Bulanan (Panel Terpadu Borderless) ─── */}
      <motion.div variants={itemVariants}>
        <div className="card-base overflow-hidden">
          <div className="px-4 py-2.5 sm:px-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Statistik Kehadiran Bulan Ini</span>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              Rekap Resmi
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
            {/* Hadir Tepat Waktu */}
            <div className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium leading-tight">Hadir Tepat Waktu</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.hadirHari} <span className="text-xs font-normal text-slate-500">Hari</span></div>
              <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" /> Bulan Ini
              </div>
            </div>

            {/* Terlambat */}
            <div className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium leading-tight">Terlambat</span>
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.terlambatKali} <span className="text-xs font-normal text-slate-500">Kali</span></div>
              <div className="text-[10px] text-amber-600 font-medium">Evaluasi Disiplin</div>
            </div>

            {/* Izin / Cuti */}
            <div className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium leading-tight">Izin / Cuti</span>
                <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.izinHari} <span className="text-xs font-normal text-slate-500">Hari</span></div>
              <div className="text-[10px] text-blue-600 font-medium">Surat Resmi</div>
            </div>

            {/* Penilai Kinerja */}
            <div className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium leading-tight">Penilai Kinerja</span>
                <FileText className="w-4 h-4 text-teal-600 shrink-0" />
              </div>
              <div className="text-sm font-bold text-slate-900 truncate leading-tight pt-1">
                {user?.atasanNama || "Kepala Unit Kerja"}
              </div>
              <div className="text-[10px] text-teal-600 flex items-center gap-1 font-medium">
                <UserCheck2 className="w-3 h-3" /> Atasan Langsung
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Kalender Kehadiran Interaktif Bulanan Pegawai ─── */}
      <motion.div variants={itemVariants}>
        <MonthlyAttendanceCalendar />
      </motion.div>
    </motion.div>
  );
}
