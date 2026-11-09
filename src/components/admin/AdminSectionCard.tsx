"use client";

import React from 'react';

export interface AdminSectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function AdminSectionCard({
  title,
  subtitle,
  icon: IconComponent,
  badge,
  action,
  footer,
  children,
  className = '',
  contentClassName = '',
}: AdminSectionCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col ${className}`}
    >
      {/* Header Kartu */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40">
        <div className="flex items-center gap-3 min-w-0">
          {IconComponent && (
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <IconComponent className="w-4 h-4" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight truncate">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>

      {/* Konten Kartu */}
      <div className={`p-5 sm:p-6 flex-1 ${contentClassName}`}>{children}</div>

      {/* Footer Kartu */}
      {footer && (
        <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          {footer}
        </div>
      )}
    </div>
  );
}

