"use client";

import React from 'react';

export type AdminBadgeVariant =
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'teal'
  | 'slate';

export interface AdminStatusBadgeProps {
  status: string;
  label?: string;
  variant?: AdminBadgeVariant;
  pulse?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<AdminBadgeVariant, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/90',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/90',
  blue: 'bg-blue-50 text-blue-700 border-blue-200/90',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/90',
  teal: 'bg-teal-50 text-teal-700 border-teal-200/90',
  slate: 'bg-slate-100 text-slate-600 border-slate-200/90',
};

const DOT_CLASSES: Record<AdminBadgeVariant, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
  slate: 'bg-slate-400',
};

const STATUS_MAP: Record<string, { label: string; variant: AdminBadgeVariant }> = {
  // Hijau / Sukses / Aktif
  PAID: { label: 'Lunas', variant: 'emerald' },
  LUNAS: { label: 'Lunas', variant: 'emerald' },
  CLEARED: { label: 'Cleared', variant: 'emerald' },
  TRANSFERRED: { label: 'Ditransfer', variant: 'emerald' },
  APPROVED: { label: 'Disetujui', variant: 'emerald' },
  ACTIVE: { label: 'Aktif', variant: 'emerald' },
  AKTIF: { label: 'Aktif', variant: 'emerald' },
  PUBLISHED: { label: 'Tayang', variant: 'emerald' },
  COMPLETED: { label: 'Selesai', variant: 'emerald' },
  RESOLVED: { label: 'Selesai BAST', variant: 'emerald' },
  DELIVERED: { label: 'Terkirim', variant: 'emerald' },
  TERSEDIA: { label: 'Tersedia', variant: 'emerald' },
  BAIK: { label: 'Baik', variant: 'emerald' },

  // Kuning / Menunggu / Proses
  PENDING: { label: 'Menunggu', variant: 'amber' },
  PENDING_PAYMENT: { label: 'Menunggu Bayar', variant: 'amber' },
  PENDING_APPROVAL: { label: 'Menunggu Persetujuan', variant: 'amber' },
  APPROVED_WAITING_DP: { label: 'Menunggu DP', variant: 'amber' },
  WAITING_DP: { label: 'Menunggu DP', variant: 'amber' },
  WAITING_PARTS: { label: 'Tunggu Suku Cadang', variant: 'amber' },
  REVIEW_LEGAL: { label: 'Review Legal', variant: 'amber' },
  PARTIAL: { label: 'Cicilan / Termin', variant: 'amber' },
  PEMELIHARAAN: { label: 'Pemeliharaan', variant: 'amber' },
  'MENUNGGU REVIEW': { label: 'Menunggu Review', variant: 'amber' },
  OPEN: { label: 'Menunggu Teknisi', variant: 'amber' },
  TINGGI: { label: 'Prioritas Tinggi', variant: 'amber' },

  // Biru / Indigo / Pengerjaan
  IN_PROGRESS: { label: 'Dikerjakan', variant: 'blue' },
  IN_PRODUCTION: { label: 'Produksi Bengkel', variant: 'indigo' },
  ASSIGNED: { label: 'Ditugaskan', variant: 'blue' },
  REQUESTED: { label: 'Diajukan', variant: 'blue' },
  QUALITY_CONTROL: { label: 'Uji Mutu (QC)', variant: 'teal' },
  READY_FOR_DELIVERY: { label: 'Siap Kirim', variant: 'teal' },
  ALUMNI: { label: 'Alumni', variant: 'purple' },

  // Merah / Ditolak / Darurat
  OVERDUE: { label: 'Jatuh Tempo', variant: 'rose' },
  CANCELLED: { label: 'Dibatalkan', variant: 'rose' },
  REJECTED: { label: 'Ditolak', variant: 'rose' },
  FAILED: { label: 'Gagal', variant: 'rose' },
  RUSAK: { label: 'Rusak', variant: 'rose' },
  DARURAT: { label: 'Darurat', variant: 'rose' },

  // Abu-abu / Draf / Tutup
  DRAFT: { label: 'Draf', variant: 'slate' },
  ESTIMATION: { label: 'Estimasi', variant: 'slate' },
  VALIDATION: { label: 'Validasi', variant: 'slate' },
  CLOSED: { label: 'Ditutup', variant: 'slate' },
  SUSPENDED: { label: 'Ditangguhkan', variant: 'slate' },
  HIDDEN: { label: 'Disembunyikan', variant: 'slate' },
  SEDANG: { label: 'Sedang', variant: 'slate' },
  RENDAH: { label: 'Rendah', variant: 'slate' },
};

export default function AdminStatusBadge({
  status,
  label,
  variant,
  pulse = false,
  className = '',
}: AdminStatusBadgeProps) {
  const normalizedKey = (status || '').toUpperCase().trim();
  const mapped = STATUS_MAP[normalizedKey];

  const finalVariant: AdminBadgeVariant = variant || mapped?.variant || 'slate';
  const finalLabel = label || mapped?.label || status || '-';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap ${VARIANT_CLASSES[finalVariant]} ${className}`}
    >
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${DOT_CLASSES[finalVariant]}`} />
      )}
      <span>{finalLabel}</span>
    </span>
  );
}

