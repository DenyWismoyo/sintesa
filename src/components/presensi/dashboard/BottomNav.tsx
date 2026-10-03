// src/components/presensi/dashboard/BottomNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import { usePendingLKHList } from "@/hooks/presensi/useLKH";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClockCheck,
  FileSpreadsheet,
  User,
  ShieldCheck,
  Calendar,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = usePresensiAuth();

  const isAtasanOrAdmin = user?.role === "atasan" || user?.role === "admin";
  const { data: pendingList = [] } = usePendingLKHList(isAtasanOrAdmin ? user?.orgId : undefined);
  const pendingCount = isAtasanOrAdmin ? pendingList.length : 0;

  const navItems = [
    {
      name: "Beranda",
      href: "/presensi",
      icon: LayoutDashboard,
    },
    {
      name: "LKH",
      href: "/presensi/laporan",
      icon: FileSpreadsheet,
    },
    {
      name: "Presensi",
      href: "/presensi/scan",
      icon: ClockCheck,
      isSpecial: true,
    },
    isAtasanOrAdmin
      ? {
          name: "Approval",
          href: "/presensi/approval",
          icon: ShieldCheck,
          badgeCount: pendingCount,
        }
      : {
          name: "Kalender",
          href: "/presensi/kalender",
          icon: Calendar,
        },
    {
      name: "Profil",
      href: "/presensi/profil",
      icon: User,
    },
  ];

  const handleNavClick = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none p-3 pb-safe">
      <nav
        aria-label="Navigasi Bawah Ponsel"
        className="pointer-events-auto max-w-md mx-auto h-16 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-300/40 rounded-2xl px-3 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className="flex flex-col items-center -mt-6 group"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white",
                    isActive
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-600/40 ring-4 ring-emerald-500/20"
                      : "bg-gradient-to-tr from-emerald-600 to-teal-700 text-white shadow-emerald-900/25 hover:from-emerald-700 hover:to-teal-800"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <span
                  className={cn(
                    "text-[10px] font-bold mt-1 tracking-tight",
                    isActive ? "text-emerald-700" : "text-slate-700"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1 transition-colors relative",
                isActive
                  ? "text-emerald-600 font-semibold"
                  : "text-slate-400 hover:text-slate-700"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive && "scale-110 text-emerald-600"
                  )}
                />
                {Boolean(item.badgeCount && item.badgeCount > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white animate-pulse">
                    {item.badgeCount! > 9 ? "9+" : item.badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[62px]">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
