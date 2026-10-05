// src/components/presensi/TechnoSignLogo.tsx
import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TechnoSignLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "icon-only" | "full";
  className?: string;
  withGlow?: boolean;
}

const sizeConfig = {
  xs: { box: "w-6 h-6", imgSize: 24, text: "text-xs", sub: "text-[9px]" },
  sm: { box: "w-8 h-8", imgSize: 32, text: "text-sm", sub: "text-[10px]" },
  md: { box: "w-10 h-10", imgSize: 40, text: "text-base", sub: "text-[11px]" },
  lg: { box: "w-12 h-12", imgSize: 48, text: "text-lg", sub: "text-xs" },
  xl: { box: "w-16 h-16", imgSize: 64, text: "text-xl", sub: "text-xs" },
  "2xl": { box: "w-20 h-20", imgSize: 80, text: "text-2xl", sub: "text-sm" },
};

export default function TechnoSignLogo({
  size = "md",
  variant = "full",
  className,
  withGlow = true,
}: TechnoSignLogoProps) {
  const cfg = sizeConfig[size] || sizeConfig.md;

  const iconElement = (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-emerald-500/20 bg-slate-950",
        cfg.box,
        withGlow && "shadow-md shadow-emerald-500/15 ring-1 ring-emerald-500/20",
        className
      )}
    >
      <Image
        src="/icons/presensi/icon-192x192.png"
        alt="Techno Sign Official Logo"
        width={cfg.imgSize}
        height={cfg.imgSize}
        className="object-cover w-full h-full transform transition-transform hover:scale-105 duration-200"
        priority
      />
    </div>
  );

  if (variant === "icon-only") {
    return iconElement;
  }

  return (
    <div className="flex items-center gap-3">
      {iconElement}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-extrabold tracking-tight text-slate-900 block leading-tight",
              cfg.text
            )}
          >
            Techno <span className="text-emerald-600">Sign</span>
          </span>
          <span className="inline-block px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800 text-[9px] font-bold tracking-wider uppercase">
            BLUD
          </span>
        </div>
        <p className={cn("text-slate-500 font-medium leading-tight", cfg.sub)}>
          Solo Technopark
        </p>
      </div>
    </div>
  );
}
