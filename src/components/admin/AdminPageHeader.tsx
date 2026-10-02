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
    <div className={`space-y-4 mb-6 ${className}`}>
      {/* 1. BREADCRUMBS (JIKA ADA) */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              {title}
            </h1>
            {badge && (
              typeof badge === 'string' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {badge}
                </span>
              ) : (
                badge
              )
            )}
          </div>
          {displaySubtitle && (
            <div className="text-xs sm:text-sm text-slate-500 font-medium">
              {displaySubtitle}
            </div>
          )}
        </div>

        {/* ACTIONS BUTTONS */}
        {actions && (
          <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* 3. OPTIONAL TABS / SUBHEADER */}
      {children && (
        <div className="pt-1">
          {children}
        </div>
      )}
    </div>
  );
}
