"use client";

import React from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  Printer,
  Share2,
  MoreVertical,
  Loader2,
} from 'lucide-react';

export interface AdminCustomAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  disabled?: boolean;
}

export interface AdminRowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  customActions?: AdminCustomAction[];
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
  isLoading?: boolean;
  className?: string;
}

export default function AdminRowActions({
  onView,
  onEdit,
  onDelete,
  onPrint,
  onShare,
  customActions = [],
  viewTitle = 'Lihat Detail',
  editTitle = 'Edit Data',
  deleteTitle = 'Hapus Data',
  isLoading = false,
  className = '',
}: AdminRowActionsProps) {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-end p-1 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-end gap-1 ${className}`}>
      {/* Tombol View */}
      {onView && (
        <button
          type="button"
          onClick={onView}
          title={viewTitle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}

      {/* Tombol Edit */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title={editTitle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      {/* Tombol Print / PDF */}
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          title="Cetak Dokumen"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
        </button>
      )}

      {/* Tombol Share */}
      {onShare && (
        <button
          type="button"
          onClick={onShare}
          title="Bagikan Tautan"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}

      {/* Custom Actions */}
      {customActions.map((action, idx) => {
        const IconComponent = action.icon;
        const colorClass = {
          default: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
          danger: 'text-slate-500 hover:text-red-600 hover:bg-red-50',
          warning: 'text-slate-500 hover:text-amber-600 hover:bg-amber-50',
          success: 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50',
          info: 'text-slate-500 hover:text-blue-600 hover:bg-blue-50',
        }[action.variant || 'default'];

        return (
          <button
            key={`custom-${idx}`}
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
            title={action.label}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${colorClass}`}
          >
            <IconComponent className="w-4 h-4" />
          </button>
        );
      })}

      {/* Tombol Delete */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title={deleteTitle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

