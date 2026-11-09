"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

export interface AdminPageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  description?: string | React.ReactNode;
  badge?: string | React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: AdminBreadcrumbItem[];
  tabs?: AdminTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: any) => void;
  showTabsOnDesktop?: boolean;
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
  tabs,
  activeTab,
  onTabChange,
  showTabsOnDesktop = false,
  children,
  className = '',
}: AdminPageHeaderProps) {
  const displaySubtitle = subtitle || description;
  const activeTabItem = tabs?.find((t) => t.id === activeTab);

  return (
    <div className={`space-y-2.5 mb-4 sm:mb-5 ${className}`}>
      {/* 1. BREADCRUMBS + INDIKATOR TAB AKTIF */}
      {(breadcrumbs && breadcrumbs.length > 0) || activeTabItem ? (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center flex-wrap gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-400"
        >
          <Link href="/dashboard" className="hover:text-slate-700 transition-colors">
            Admin
          </Link>
          {breadcrumbs?.map((crumb, idx) => (
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
          {activeTabItem && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              {tabs && tabs.length > 1 && onTabChange ? (
                <select
                  aria-label="Pilih Sub-Menu Tab"
                  value={activeTab}
                  onChange={(e) => onTabChange(e.target.value)}
                  className="text-blue-700 font-bold bg-blue-50/90 hover:bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200/80 text-[11px] sm:text-xs cursor-pointer outline-none transition-colors"
                >
                  {tabs.map((t) => (
                    <option key={t.id} value={t.id} className="text-slate-800 bg-white font-semibold">
                      {t.label}
                      {t.badge !== undefined && Number(t.badge) > 0 ? ` (${t.badge})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-blue-600 font-bold bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                  {activeTabItem.label}
                </span>
              )}
            </>
          )}
        </nav>
      ) : null}

      {/* 2. TITLE BAR & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {title}
            </h1>
            {badge &&
              (typeof badge === 'string' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                  {badge}
                </span>
              ) : (
                badge
              ))}
          </div>
          {displaySubtitle && (
            <div className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-3xl">
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

      {/* 3. STANDARDIZED COMPACT TABS (Tampil di Mobile <md:, di Desktop diwakili Pintasan Sidebar) */}
      {tabs && tabs.length > 1 && onTabChange && (
        <div className={`pt-1 ${showTabsOnDesktop ? '' : 'md:hidden'}`}>
          <div className="inline-flex items-center bg-slate-100/90 border border-slate-200/70 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer select-none ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                  }`}
                >
                  {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && Number(tab.badge) > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black leading-tight ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. OPTIONAL LEGACY CHILDREN / SUBHEADER */}
      {children && <div className="pt-0.5">{children}</div>}
    </div>
  );
}
