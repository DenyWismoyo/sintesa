"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  rightElement?: React.ReactNode;
}

export default function MobilePageHeader({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Beranda",
  rightElement,
}: MobilePageHeaderProps) {
  const handleBackClick = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  return (
    <div className="md:hidden px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-100/90 flex items-center justify-between gap-3 -mx-0 sm:mx-0 sm:rounded-2xl transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={backHref}
          onClick={handleBackClick}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 transition-all active:scale-90"
          title={`Kembali ke ${backLabel}`}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightElement && <div className="shrink-0 flex items-center gap-1.5">{rightElement}</div>}
    </div>
  );
}
