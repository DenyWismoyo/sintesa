"use client";

import React, { useEffect } from 'react';
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';

export type AdminConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: AdminConfirmVariant;
  isLoading?: boolean;
}

export default function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}: AdminConfirmDialogProps) {
  // ESC shortcut to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const config = {
    danger: {
      iconBg: 'bg-red-100 text-red-600',
      icon: Trash2,
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm shadow-red-200',
      defaultConfirm: 'Hapus Data',
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-600',
      icon: AlertTriangle,
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 shadow-sm shadow-amber-200',
      defaultConfirm: 'Lanjutkan',
    },
    info: {
      iconBg: 'bg-blue-100 text-blue-600',
      icon: Info,
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm shadow-blue-200',
      defaultConfirm: 'Konfirmasi',
    },
    success: {
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: CheckCircle2,
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-sm shadow-emerald-200',
      defaultConfirm: 'Selesai',
    },
  }[variant];

  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => !isLoading && onClose()}
      />

      {/* Dialog Body */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 animate-in zoom-in-95 duration-150 p-5 sm:p-6">
        {/* Close Button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-4">
          {/* Variant Icon */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {title}
            </h3>
            <div className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              {description}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onConfirm()}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-98 ${config.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText || config.defaultConfirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

