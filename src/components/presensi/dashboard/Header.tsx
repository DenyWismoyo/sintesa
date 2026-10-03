// src/components/presensi/dashboard/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { UserRole } from "@/types/presensi";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  Menu,
  X,
  LayoutDashboard,
  ClockCheck,
  FileSpreadsheet,
  Settings,
  User,
  Users,
  BarChart3,
  ChevronRight,
  ExternalLink,
  Bell,
  BellRing,
} from "lucide-react";
import {
  requestNotificationPermission,
  showPresensiNotification,
  checkAndTriggerPresensiReminder,
} from "@/lib/presensi/notifications";
import { usePresensiHarian } from "@/hooks/presensi/usePresensi";

function getRoleLabel(role?: UserRole): string {
  switch (role) {
    case "admin":
      return "Admin BLUD";
    case "atasan":
      return "Pejabat / Atasan";
    case "pegawai":
    default:
      return "Pegawai";
  }
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = usePresensiAuth();
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], []);
  const { data: presensiToday } = usePresensiHarian(user?.id, todayStr);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Pemicu otomatis pengingat jam masuk / pulang
  useEffect(() => {
    if (presensiToday !== undefined && notifPermission === "granted") {
      checkAndTriggerPresensiReminder({
        hasCheckedIn: Boolean(presensiToday?.checkIn),
        hasCheckedOut: Boolean(presensiToday?.checkOut),
      });
    }
  }, [presensiToday, notifPermission]);

  const handleToggleNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Peramban Anda tidak mendukung Web Notifications.");
      return;
    }

    if (notifPermission === "granted") {
      showPresensiNotification({
        title: "🔔 Pengingat Presensi Aktif",
        body: "Pengingat otomatis jam masuk (07.15 WIB) dan jam pulang (16.00 WIB) aktif untuk Solo Technopark.",
      });
      return;
    }

    const result = await requestNotificationPermission();
    setNotifPermission(result);

    if (result === "granted") {
      showPresensiNotification({
        title: "✅ Notifikasi Diaktifkan",
        body: "Terima kasih! Anda akan menerima pengingat jam kerja & tugas Techno Sign.",
      });
    }
  };

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      setCurrentDateTime(now.toLocaleDateString("id-ID", options) + " WIB");
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/presensi/login");
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  const fullNavigation = [
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
    {
      name: "Profil Pegawai",
      href: "/presensi/profil",
      icon: User,
      roles: ["admin", "atasan", "pegawai"],
    },
  ];

  const filteredNav = fullNavigation.filter((item) =>
    user ? item.roles.includes(user.role) : true
  );

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        {/* Left: Hamburger (Mobile) + Brand Logo + Desktop Clock */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand Logo */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-900 leading-none block">
                Techno Sign
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-none block mt-0.5">
                Solo Technopark
              </span>
            </div>
          </div>

          {/* Desktop Clock */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="tracking-tight text-slate-800">
              {currentDateTime || "Memuat Waktu..."}
            </span>
          </div>
        </div>

        {/* Right: User Profile + Role Badge + Notifikasi + Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{getRoleLabel(user?.role)}</span>
          </div>

          {/* Pengingat Presensi Web Push Notification */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleNotification}
            className={cn(
              "h-9 w-9 p-0 rounded-xl transition-all cursor-pointer relative",
              notifPermission === "granted"
                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            )}
            title={
              notifPermission === "granted"
                ? "Pengingat Presensi Aktif (Klik untuk uji notifikasi)"
                : "Aktifkan Pengingat Presensi Otomatis"
            }
          >
            {notifPermission === "granted" ? (
              <>
                <BellRing className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              </>
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </Button>

          {/* User Profile Card */}
          <Link
            href="/presensi/profil"
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 hover:opacity-80 transition-opacity"
          >
            <Avatar
              fallback={user?.nama ? user.nama.substring(0, 2).toUpperCase() : "ST"}
              size="md"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[160px]">
                {user?.nama || "Pegawai"}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[160px]">
                {user?.jabatan || "Solo Technopark"}
              </div>
            </div>
          </Link>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-9 w-9 p-0 rounded-xl transition-colors cursor-pointer"
            title="Keluar Sesi"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-white text-slate-900 h-full flex flex-col z-10 shadow-2xl border-r border-slate-200 animate-in slide-in-from-left duration-200">
            {/* Header Drawer */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block leading-tight">Techno Sign</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Solo Technopark</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Card in Drawer */}
            <div className="p-3.5 m-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-xs font-bold text-slate-900 truncate">{user?.nama || "Pegawai"}</div>
              <div className="text-[10px] text-slate-500">ID: {user?.nip || "-"}</div>
              <div className="text-[10px] text-emerald-700 font-medium truncate">{user?.jabatan}</div>
              <div className="pt-1.5 flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[9px] px-2 py-0.5">
                  {getRoleLabel(user?.role)}
                </Badge>
              </div>
            </div>

            {/* Full Menu Links */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Daftar Menu
              </div>

              {filteredNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />}
                  </Link>
                );
              })}
            </div>

            {/* Bottom Action */}
            <div className="p-3 border-t border-slate-100 flex flex-col gap-2">
              {user?.canAccessCatalogAdmin && (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Portal Admin Sintesa</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600 ml-auto" />
                </Link>
              )}
              <Link
                href="/"
                className="flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 p-2 rounded-xl bg-slate-50 font-medium"
              >
                <span>Buka Katalog Utama</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-10 px-3 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar Sesi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
