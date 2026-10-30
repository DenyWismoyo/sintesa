"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';

export interface AdminFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  asPage?: boolean;
  backHref?: string;
  backLabel?: string;
  badgeText?: string;
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
};

export default function AdminFormDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '2xl',
  asPage = false,
  backHref,
  backLabel = 'Kembali ke Daftar',
  badgeText,
}: AdminFormDrawerProps) {
  useEffect(() => {
    if (asPage) {
      document.body.style.overflow = '';
      return;
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, asPage]);

  if (!isOpen) return null;

  if (asPage) {
    return (
      <div className="workspace-page-container animate-in fade-in duration-200">
        <div className="workspace-header flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs sm:text-sm font-bold transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{backLabel}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs sm:text-sm font-bold transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{backLabel}</span>
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  {title}
                </h1>
                {badgeText && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                    {badgeText}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {footer && (
            <div className="hidden sm:flex items-center gap-2.5">
              {footer}
            </div>
          )}
        </div>

        <div className="workspace-card">
          <div className="p-4 sm:p-6 lg:p-8 space-y-5 text-slate-700 font-sans">
            {children}
          </div>
          {footer && (
            <div className="workspace-footer-sticky flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* 1. BACKDROP OVERLAY */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. MODAL DIALOG (DESKTOP) / BORDERLESS BOTTOM SHEET (MOBILE) */}
      <div 
        className={`relative w-full ${MAX_WIDTH_CLASSES[maxWidth] || 'sm:max-w-2xl'} bg-white rounded-t-2xl sm:rounded-2xl border-x-0 sm:border border-slate-200/90 shadow-none sm:shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2 pb-0.5">
          <div className="w-9 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* HEADER BAR (STICKY) */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-normal truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="Tutup Form"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* BODY SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-4 text-slate-700 font-sans custom-scrollbar">
          {children}
        </div>

        {/* FOOTER ACTIONS (STICKY DI BAWAH) */}
        {footer && (
          <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
