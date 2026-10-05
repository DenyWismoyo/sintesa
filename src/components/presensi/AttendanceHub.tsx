"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import TabAbsensi from "./TabAbsensi";
import TabLembur from "./TabLembur";
import TabIzin from "./TabIzin";
import TabRiwayat from "./TabRiwayat";
import { Fingerprint, Timer, FileText, History } from "lucide-react";

export default function AttendanceHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab") || "absensi";

  const tabs = [
    { id: "absensi", label: "Absensi", icon: Fingerprint },
    { id: "lembur", label: "Lembur", icon: Timer },
    { id: "izin", label: "Izin", icon: FileText },
    { id: "riwayat", label: "Riwayat", icon: History },
  ];

  const setTab = (id: string) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(8); } catch {}
    }
    router.push(`/presensi/scan?tab=${id}`);
  };

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [pullDistance, setPullDistance] = React.useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0) {
      const currentY = e.touches[0].clientY;
      const dist = currentY - startY;
      if (dist > 0 && dist < 100) {
        setPullDistance(dist);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(20);
      await queryClient.invalidateQueries();
      setTimeout(() => setIsRefreshing(false), 500);
    }
    setStartY(0);
    setPullDistance(0);
  };

  return (
    <div
      className="flex flex-col relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className="absolute w-full flex justify-center overflow-hidden transition-all duration-200 z-50"
        style={{ height: pullDistance > 0 ? `${pullDistance}px` : "0px" }}
      >
        <div className="mt-4 bg-white rounded-full p-2 shadow-md flex items-center justify-center">
          <Loader2
            className={`w-5 h-5 text-emerald-500 ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      </div>

      {/* Sticky Tab Bar — menggunakan public-pill-container dari globals.css */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100/80 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="public-pill-container w-full">
          {tabs.map((t) => {
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn("public-pill-btn flex-1 justify-center", isActive && "active")}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="presensi-tab-pill"
                    className="public-pill-active-bg"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <t.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 w-full max-w-2xl mx-auto pt-3 sm:pt-5">
        {currentTab === "absensi" && <TabAbsensi />}
        {currentTab === "lembur" && <TabLembur />}
        {currentTab === "izin" && <TabIzin />}
        {currentTab === "riwayat" && <TabRiwayat />}
      </div>
    </div>
  );
}
