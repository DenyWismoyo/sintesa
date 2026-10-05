// src/components/presensi/dashboard/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClockCheck,
  FileSpreadsheet,
  Users,
  Building2,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  Calendar,
  Sparkles,
  MapPin,
  ExternalLink,
  Timer,
  RotateCcw,
} from "lucide-react";
import TechnoSignLogo from "@/components/presensi/TechnoSignLogo";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = usePresensiAuth();

  const navigation = [
    {
      name: "Dashboard Utama",
      href: "/presensi",
      icon: LayoutDashboard,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Presensi Swafoto",
      href: "/presensi/scan",
      icon: ClockCheck,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Laporan Kinerja (LKH)",
      href: "/presensi/laporan",
      icon: FileSpreadsheet,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Pengajuan Cuti / Izin",
      href: "/presensi/izin",
      icon: ShieldCheck,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Pengajuan Lembur",
      href: "/presensi/lembur",
      icon: Timer,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Permohonan Revisi",
      href: "/presensi/revisi",
      icon: RotateCcw,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Kalender Kerja",
      href: "/presensi/kalender",
      icon: Calendar,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Approval Atasan",
      href: "/presensi/approval",
      icon: ShieldCheck,
      roles: ["admin", "atasan"],
    },
    {
      name: "Rekap & Statistik",
      href: "/presensi/statistik",
      icon: BarChart3,
      roles: ["admin", "atasan"],
    },
    {
      name: "Data Pegawai STP",
      href: "/presensi/pegawai",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Pengaturan Kantor",
      href: "/presensi/pengaturan",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const filteredNav = navigation.filter((item) =>
    user ? item.roles.includes(user.role) : true
  );

  return (
    <aside className="hidden md:flex w-64 flex-col shrink-0 bg-white/95 border-r border-slate-200/90 min-h-screen sticky top-0 backdrop-blur-md shadow-xs">
      {/* Branding */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/presensi" className="group">
          <TechnoSignLogo size="md" variant="full" />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama
        </div>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                isActive
                  ? "bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Geofence & Office Badge */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zona Presensi</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-300/50 px-2 py-0.5 rounded-full">
            Radius 150m
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          UPTD KST Solo Technopark (Pukul 08:00 - 16:00 WIB)
        </p>

        {user?.canAccessCatalogAdmin && (
          <Link
            href="/dashboard"
            className="flex items-center justify-between p-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 text-[11px] font-semibold transition-colors mt-2"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Portal Sintesa</span>
            </span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </Link>
        )}

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-emerald-700 pt-1"
        >
          <span>Katalog Utama</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
}
