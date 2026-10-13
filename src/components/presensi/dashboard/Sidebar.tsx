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
  Network,
  ShoppingBag,
  GraduationCap,
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
      roles: ["admin", "pegawai"],
    },
    {
      name: "Presensi Swafoto",
      href: "/presensi/scan",
      icon: ClockCheck,
      roles: ["admin", "pegawai"],
    },
    {
      name: "Laporan Kinerja (LKH)",
      href: "/presensi/laporan",
      icon: FileSpreadsheet,
      roles: ["admin", "pegawai"],
    },
    {
      name: "Pengajuan Cuti / Izin",
      href: "/presensi/izin",
      icon: ShieldCheck,
      roles: ["admin", "pegawai"],
    },
    {
      name: "Pengajuan Lembur",
      href: "/presensi/lembur",
      icon: Timer,
      roles: ["admin", "pegawai"],
    },
    {
      name: "Permohonan Revisi",
      href: "/presensi/revisi",
      icon: RotateCcw,
      roles: ["admin", "pegawai"],
    },
    {
      name: "Kalender Kerja",
      href: "/presensi/kalender",
      icon: Calendar,
      roles: ["admin", "pegawai"],
    },
    {
      name: "Approval Atasan",
      href: "/presensi/approval",
      icon: ShieldCheck,
      maxRankLevel: 4, // Pimpinan, Pejabat Teknis, Manager, Kepala Divisi
    },
    {
      name: "Rekap & Statistik",
      href: "/presensi/statistik",
      icon: BarChart3,
      maxRankLevel: 4,
    },
    {
      name: "Data Pegawai STP",
      href: "/presensi/pegawai",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Hierarki Jabatan",
      href: "/presensi/jabatan",
      icon: Network,
      roles: ["admin"],
    },
    {
      name: "Pengaturan Kantor",
      href: "/presensi/pengaturan",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const filteredNav = navigation.filter((item: any) => {
    if (!user) return true;
    if (user.role === "admin") return true;
    if (item.roles && !item.roles.includes(user.role)) return false;
    if (item.maxRankLevel !== undefined && (user.rankLevel ?? 9) > item.maxRankLevel) return false;
    return true;
  });

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

      {/* Pintasan Portal & Layanan Kawasan STP */}
      <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekosistem Kawasan</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-300/50 px-2 py-0.5 rounded-full">
            KST Solo
          </span>
        </div>

        {/* Bypass Admin Portal Sintesa (jika user memiliki akses admin/staf katalog) */}
        {user?.canAccessCatalogAdmin && (
          <Link
            href="/dashboard"
            className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/15 border border-blue-200/70 text-blue-900 text-xs font-bold transition-all shadow-2xs group"
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Admin Portal Sintesa</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Menu Bypass ke Katalog & Fasilitas STP bagi Seluruh Pegawai */}
        <div className="pt-1.5 border-t border-slate-200/60 space-y-1 text-[11px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            Pintasan Layanan STP
          </span>
          <Link
            href="/"
            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors font-medium"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span>Katalog & Layanan</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
          <Link
            href="/fasilitas"
            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors font-medium"
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Sewa Aset & Fasilitas</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
          <Link
            href="/lms"
            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors font-medium"
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Pelatihan & LMS</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
