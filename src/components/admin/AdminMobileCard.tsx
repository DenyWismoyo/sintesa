"use client";

import React from 'react';

export interface AdminCardField {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

export interface AdminMobileCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  code?: React.ReactNode;
  badge?: React.ReactNode;
  media?: React.ReactNode;
  fields?: AdminCardField[];
  children?: React.ReactNode;
  footerLeft?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Komponen kartu standar untuk tampilan Mobile (< 768px) dan Tablet (768px - 1023px)
 * di dalam AdminResponsiveView.
 */
export default function AdminMobileCard({
  title,
  subtitle,
  code,
  badge,
  media,
  fields,
  children,
  footerLeft,
  actions,
  footer,
  onClick,
  className = '',
}: AdminMobileCardProps) {
  const resolvedActions = actions ?? footer;
  return (
    <div
      onClick={onClick}
      className={`flex flex-col justify-between h-full space-y-3 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* 1. HEADER: KODE / MEDIA & BADGE STATUS */}
      <div className="space-y-2">
        {(code || badge) && (
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-mono font-bold text-blue-600 truncate">
              {code}
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
        )}

        <div className="flex items-start gap-3">
          {media && <div className="shrink-0">{media}</div>}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. BODY: METADATA GRID ATAU CUSTOM CHILDREN */}
      {fields && fields.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-xs">
          {fields.map((f, idx) => (
            <div
              key={idx}
              className={`min-w-0 ${f.fullWidth ? 'col-span-2' : 'col-span-1'}`}
            >
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {f.label}
              </span>
              <div className="font-semibold text-slate-700 mt-0.5 truncate">
                {f.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {children && <div className="text-xs text-slate-600">{children}</div>}

      {/* 3. FOOTER: HARGA/INFO & TOMBOL AKSI */}
      {(footerLeft || resolvedActions) && (
        <div
          className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {footerLeft ? (
            <div className="text-xs font-bold text-slate-800">{footerLeft}</div>
          ) : (
            <span />
          )}
          {resolvedActions && (
            <div className="flex items-center flex-wrap justify-end gap-1.5 ml-auto w-full sm:w-auto">
              {resolvedActions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
