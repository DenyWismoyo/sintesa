// src/app/(public)/karir/components/MyApplicationsModal.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  X,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyJobApplications, useDeleteJobApplication } from '@/hooks/useJobApplications';
import { JOB_APPLICATION_STATUS_LABELS, JobApplicationStatus } from '@/types/alumniForum.types';

interface MyApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJob?: (jobId: string) => void;
}

export default function MyApplicationsModal({
  isOpen,
  onClose,
  onSelectJob,
}: MyApplicationsModalProps) {
  const { data: applications = [], isLoading } = useMyJobApplications();
  const deleteMutation = useDeleteJobApplication();

  if (!isOpen) return null;

  const handleDelete = (appId: string, jobId: string, jobTitle: string) => {
    deleteMutation.mutate({ appId, jobId, jobTitle });
  };

  const getStatusBadge = (status: JobApplicationStatus) => {
    switch (status) {
      case 'APPLIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Lamaran Terkirim</span>
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Ditinjau HRD</span>
          </span>
        );
      case 'INTERVIEWING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Tahap Wawancara</span>
          </span>
        );
      case 'HIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Diterima Bekerja</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Belum Sesuai</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Daftar Lamaran Kerja Saya
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Pantau status pengiriman berkas dan progres seleksi lowongan yang telah Anda lamar.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 ml-3"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Memuat daftar lamaran Anda...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800">
                  Belum Ada Lamaran yang Diajukan
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Ketika Anda menekan tombol <strong>"Lamar Sekarang"</strong> pada lowongan kerja, riwayat dan progres statusnya akan otomatis tercatat di sini.
                </p>
              </div>
              <Button
                onClick={onClose}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                Eksplorasi Lowongan Sekarang
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id || app.jobId}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(app.status)}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug truncate">
                      {app.jobTitle}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {app.companyName}
                      </span>
                      {app.statusNote && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 text-[11px] italic truncate max-w-xs">
                            {app.statusNote}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <Link href={`/karir/${app.jobId}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onClose();
                          if (onSelectJob) onSelectJob(app.jobId);
                        }}
                        className="h-8.5 px-3 text-xs font-bold border-slate-200 text-slate-700 hover:bg-white rounded-xl gap-1.5"
                      >
                        <span>Lihat Lowongan</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(app.id || app.jobId, app.jobId, app.jobTitle)}
                      className="h-8.5 w-8.5 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                      title="Hapus dari riwayat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total Lamaran:{' '}
            <strong className="text-slate-900">{applications.length} Posisi</strong>
          </span>

          <Button
            onClick={onClose}
            className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

