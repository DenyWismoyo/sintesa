// src/components/presensi/PegawaiPresensiHighlightBanner.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClockCheck,
  Camera,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import TechnoSignLogo from "./TechnoSignLogo";
import { usePresensiSession } from "@/hooks/usePresensiSession";

interface PegawaiPresensiHighlightBannerProps {
  variant?: "hero" | "compact" | "card";
  className?: string;
}

export default function PegawaiPresensiHighlightBanner({
  variant = "hero",
  className = "",
}: PegawaiPresensiHighlightBannerProps) {
  const { isPegawaiLoggedIn, pegawaiName, pegawaiRole, isLoading } = usePresensiSession();
  const [timeStr, setTimeStr] = useState("");
  const [greeting, setGreeting] = useState("Halo");

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 4 && hour < 11) setGreeting("Selamat Pagi");
      else if (hour >= 11 && hour < 15) setGreeting("Selamat Siang");
      else if (hour >= 15 && hour < 18) setGreeting("Selamat Sore");
      else setGreeting("Selamat Malam");

      setTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        }) + " WIB"
      );
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !isPegawaiLoggedIn) {
    return null;
  }

  const roleLabel =
    pegawaiRole === "admin"
      ? "Administrator Kawasan STP"
      : "Pegawai Resmi Solo Technopark";

  // Varian Compact (biasanya untuk disematkan di card / baris terpadu)
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <TechnoSignLogo size="sm" variant="icon-only" withGlow={false} className="border-white/20 bg-white/10" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-tight">{greeting}, {pegawaiName}!</span>
              <span className="text-[10px] bg-emerald-500/50 px-2 py-0.5 rounded-full font-bold">Techno Sign</span>
            </div>
            <p className="text-[11px] text-emerald-100 font-medium">Sesi presensi aktif • {timeStr}</p>
          </div>
        </div>
        <Link
          href="/presensi"
          className="w-full sm:w-auto px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5"
        >
          <ClockCheck size={15} />
          <span>Buka Presensi Pegawai</span>
          <ArrowRight size={14} />
        </Link>
      </motion.div>
    );
  }

  // Varian Hero (Unggulan untuk Halaman Utama / Main Landing Page)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-4xl mx-auto mb-10 sm:mb-12 relative group ${className}`}
    >
      {/* Background Glow Khas Emerald Techno Sign */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-emerald-600/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />

      <div className="relative rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-emerald-500/30 p-5 sm:p-7 shadow-xl shadow-emerald-500/10 overflow-hidden">
        {/* Ambient watermark pattern */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-emerald-50 rounded-full blur-2xl pointer-events-none -z-0" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 relative z-10">
          {/* Kolom Informasi Pegawai */}
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5">
            <div className="relative shrink-0">
              <TechnoSignLogo size="lg" variant="icon-only" withGlow className="shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-500/30" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Sesi Pegawai STP Terdeteksi</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {timeStr}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {greeting}, <span className="text-emerald-700">{pegawaiName || "Rekan Pegawai"}</span>! 👋
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Sesi <span className="font-bold text-slate-700">Techno Sign</span> Anda aktif. Akses pencatatan kehadiran & logbook kinerja harian UPTD Kawasan STP.
              </p>
            </div>
          </div>

          {/* Kolom Tombol Aksi Terhighlight */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
            {/* Tombol Utama: Masuk Menu Presensi */}
            <Link
              href="/presensi"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/40 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 text-center"
            >
              <ClockCheck size={18} className="text-white shrink-0" />
              <span>Masuk Menu Presensi</span>
              <ArrowRight size={16} className="shrink-0" />
            </Link>

            {/* Tombol Cepat: Swafoto / Scan Kehadiran */}
            <Link
              href="/presensi/scan"
              className="px-4 py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 text-center shadow-2xs"
              title="Buka Kamera Swafoto Presensi"
            >
              <Camera size={15} className="text-emerald-700 shrink-0" />
              <span>Scan Swafoto</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
