"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  description?: string | React.ReactNode;
  badge?: string | React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: AdminBreadcrumbItem[];
  children?: React.ReactNode;
  className?: string;
}

export default function AdminPageHeader({
  title,
  subtitle,
  description,
  badge,
  actions,
  breadcrumbs,
  children,
  className = ''
}: AdminPageHeaderProps) {
  const displaySubtitle = subtitle || description;
  return (
    <div className={`space-y-3 mb-5 sm:mb-6 ${className}`}>
      {/* 1. BREADCRUMBS (JIKA ADA) */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-700 transition-colors">
            Admin
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-slate-700 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-600 font-bold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* 2. TITLE BAR & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {title}
            </h1>
            {badge && (
              typeof badge === 'string' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                  {badge}
                </span>
              ) : (
                badge
              )
            )}
          </div>
          {displaySubtitle && (
            <div className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
              {displaySubtitle}
            </div>
          )}
        </div>

        {/* ACTIONS BUTTONS */}
        {actions && (
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto shrink-0 justify-start sm:justify-end">
            {actions}
          </div>
        )}
      </div>

      {/* 3. OPTIONAL TABS / SUBHEADER */}
      {children && (
        <div className="pt-0.5">
          {children}
        </div>
      )}
    </div>
  );
}
