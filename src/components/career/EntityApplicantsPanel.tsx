// src/components/career/EntityApplicantsPanel.tsx
'use client';

import React, { useState } from 'react';
import {
  Users,
  ExternalLink,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  FileText,
  Phone,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEntityJobApplications, useForumMutations } from '@/hooks/useAlumniForum';
import {
  JobApplication,
  JobApplicationStatus,
  JOB_APPLICATION_STATUS_LABELS,
} from '@/types/alumniForum.types';
import { ALUMNI_ORIGIN_LABELS, AlumniOriginSource } from '@/types/ecosystem.types';
import { toast } from 'sonner';

interface EntityApplicantsPanelProps {
  partnerId?: string;
  tenantId?: string;
  accentColor?: 'emerald' | 'sky';
}

export default function EntityApplicantsPanel({
  partnerId,
  tenantId,
  accentColor = 'emerald',
}: EntityApplicantsPanelProps) {
  const { data: applications = [], isLoading } = useEntityJobApplications({
    partnerId: partnerId || null,
    tenantId: tenantId || null,
  });
  const { updateJobApplicationStatusMutation } = useForumMutations();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = applications.filter((app) =>
    statusFilter === 'ALL' ? true : app.status === statusFilter
  );

  const handleUpdateStatus = async (app: JobApplication, nextStatus: JobApplicationStatus) => {
    if (!app.id) return;
    if (
      nextStatus === 'HIRED' &&
      !window.confirm(
        `Konfirmasi penerimaan kerja ${app.applicantName} untuk posisi "${app.jobTitle}"? Status Tracer Study alumni di Solo Technopark akan otomatis diperbarui menjadi Diterima Bekerja (HIRED).`
      )
    ) {
      return;
    }

    const ok = await updateJobApplicationStatusMutation.mutateAsync({
      id: app.id,
      applicantUid: app.applicantUid,
      jobTitle: app.jobTitle,
      companyName: app.companyName,
      status: nextStatus,
    });

    if (ok) {
      toast.success(
        `Status lamaran ${app.applicantName} diperbarui ke "${JOB_APPLICATION_STATUS_LABELS[nextStatus]}".`
      );
    } else {
      toast.error('Gagal memperbarui status lamaran.');
    }
  };

  const getStatusBadgeStyle = (status: JobApplicationStatus) => {
    switch (status) {
      case 'HIRED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'INTERVIEWING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'REVIEWED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Pipeline Pelamar Masuk (Closed-Loop Tracker)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Lamaran 1-klik terverifikasi dari alumni STP & RSKB Kota Surakarta. Saat Anda klik{' '}
            <strong>Terima Kerja (HIRED)</strong>, data keterserapan kerja otomatis tercatat ke Tracer Study STP.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
        >
          <option value="ALL">Semua Tahapan ({applications.length})</option>
          <option value="APPLIED">Lamaran Baru</option>
          <option value="REVIEWED">Ditinjau HRD</option>
          <option value="INTERVIEWING">Tahap Wawancara</option>
          <option value="HIRED">Diterima Bekerja (HIRED)</option>
          <option value="REJECTED">Belum Sesuai</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-400 py-10 text-center">Memuat daftar pelamar terverifikasi...</p>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center space-y-2 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-700">Belum ada pelamar pada kategori tahapan ini</p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Alumni yang melamar melalui tombol 1-Klik di Bursa Karir maupun tautan lowongan di Forum Zona Industri akan otomatis muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((app) => {
            const originKey = (app.originSource || 'STP_VOKASI') as AlumniOriginSource;
            const isRskb = originKey === 'RSKB_SURAKARTA' || originKey === 'OPD_PEMKOT';

            return (
              <div
                key={app.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{app.applicantName}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isRskb
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isRskb ? 'RSKB Kota Surakarta' : ALUMNI_ORIGIN_LABELS[originKey] || 'STP Vokasi'}
                      </span>
                      {(app.forumReputationScore || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          <Award className="w-3 h-3 text-amber-600" />
                          +{app.forumReputationScore} Poin Forum
                        </span>
                      )}
                      {typeof app.aiMatchScore === 'number' && app.aiMatchScore > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          AI Match {app.aiMatchScore}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-700">
                      Melamar Posisi:{' '}
                      <span className={accentColor === 'sky' ? 'text-sky-700' : 'text-emerald-700'}>
                        {app.jobTitle}
                      </span>
                      {app.programTaken ? ` • Lulusan ${app.programTaken}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {app.applicantEmail}
                      </span>
                      {app.applicantPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {app.applicantPhone}
                        </span>
                      )}
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> CV / Sertifikat <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {app.portfolioUrl && (
                        <a
                          href={app.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-sky-700 hover:underline inline-flex items-center gap-1"
                        >
                          Portofolio <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <span
                    className={`self-start px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(
                      app.status
                    )}`}
                  >
                    {JOB_APPLICATION_STATUS_LABELS[app.status]}
                  </span>
                </div>

                {app.skills && app.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {app.skills.slice(0, 8).map((sk) => (
                      <Badge key={sk} variant="outline" className="text-[10px] font-medium bg-slate-50">
                        {sk}
                      </Badge>
                    ))}
                  </div>
                )}

                {app.coverNote && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    &ldquo;{app.coverNote}&rdquo;
                  </p>
                )}

                {/* Action Pipeline Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={updateJobApplicationStatusMutation.isPending || app.status === 'REVIEWED'}
                    onClick={() => handleUpdateStatus(app, 'REVIEWED')}
                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Ditinjau</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={updateJobApplicationStatusMutation.isPending || app.status === 'INTERVIEWING'}
                    onClick={() => handleUpdateStatus(app, 'INTERVIEWING')}
                    className="h-8 px-3 rounded-xl text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1"
                  >
                    <span>Tahap Wawancara</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={updateJobApplicationStatusMutation.isPending || app.status === 'HIRED'}
                    onClick={() => handleUpdateStatus(app, 'HIRED')}
                    className="h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terima Kerja (HIRED)</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={updateJobApplicationStatusMutation.isPending || app.status === 'REJECTED'}
                    onClick={() => handleUpdateStatus(app, 'REJECTED')}
                    className="h-8 px-2.5 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Belum Sesuai</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

