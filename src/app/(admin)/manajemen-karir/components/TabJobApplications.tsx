// src/app/(admin)/manajemen-karir/components/TabJobApplications.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ExternalLink,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  RotateCw,
  Building2,
  Briefcase,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { jobApplicationService } from '@/services/jobApplication.service';
import { JobApplication, JobApplicationStatus, JOB_APPLICATION_STATUS_LABELS } from '@/types/alumniForum.types';
import { toast } from 'sonner';

export default function TabJobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const data = await jobApplicationService.getAllApplications(300);
      setApplications(data);
    } catch (err: any) {
      console.warn('[TabJobApplications] Error fetching applications:', err);
      toast.error('Gagal memuat berkas lamaran masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (app: JobApplication, newStatus: JobApplicationStatus) => {
    if (!app.id) return;
    setUpdatingId(app.id);
    try {
      const success = await jobApplicationService.updateApplicationStatus({
        id: app.id,
        applicantUid: app.applicantUid,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        status: newStatus,
      });

      if (success) {
        toast.success(`Status pelamar ${app.applicantName} diperbarui ke ${JOB_APPLICATION_STATUS_LABELS[newStatus]}`);
        setApplications((prev) =>
          prev.map((item) => (item.id === app.id ? { ...item, status: newStatus } : item))
        );
      } else {
        toast.error('Gagal memperbarui status seleksi.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    const matchSearch =
      !search.trim() ||
      app.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      app.applicantEmail.toLowerCase().includes(search.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      app.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (app.programTaken && app.programTaken.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: JobApplicationStatus) => {
    switch (status) {
      case 'APPLIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Lamaran Masuk</span>
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Ditinjau Rekruter</span>
          </span>
        );
      case 'INTERVIEWING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Wawancara</span>
          </span>
        );
      case 'HIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Diterima Bekerja</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Belum Sesuai</span>
          </span>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Baris Filter & Search ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pelamar, posisi, atau kejuruan diklat..."
            className="pl-9 h-10 text-xs rounded-xl border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:bg-white"
          >
            <option value="ALL">Semua Status ({applications.length})</option>
            <option value="APPLIED">Lamaran Masuk</option>
            <option value="REVIEWED">Ditinjau</option>
            <option value="INTERVIEWING">Wawancara</option>
            <option value="HIRED">Diterima (HIRED)</option>
            <option value="REJECTED">Belum Sesuai</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchApplications}
            disabled={isLoading}
            className="h-10 px-3 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-1.5"
            title="Muat ulang data pelamar"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-xs">Segarkan</span>
          </Button>
        </div>
      </div>

      {/* ─── Tabel Daftar Pelamar Masuk ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-medium">Memuat berkas pelamar masuk...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Berkas Pelamar</h4>
            <p className="max-w-xs mx-auto text-slate-400">
              Belum ada berkas lamaran yang diajukan atau kriteria pencarian tidak ditemukan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Kandidat Pelamar</th>
                  <th className="py-3 px-4">Lowongan & Perusahaan</th>
                  <th className="py-3 px-4">Asal Diklat STP</th>
                  <th className="py-3 px-4">Berkas & Kontak</th>
                  <th className="py-3 px-4">Tahapan Seleksi</th>
                  <th className="py-3 px-4 text-right">Aksi HR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((app) => (
                  <tr key={app.id || app.jobId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {app.applicantName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {app.applicantEmail}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(app.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-bold text-slate-900 leading-snug">
                        {app.jobTitle}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{app.companyName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 min-w-[180px]">
                      {app.programTaken ? (
                        <div className="inline-flex items-center gap-1.5 p-1.5 px-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-semibold max-w-[220px]">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate">{app.programTaken}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Umum / Reguler</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 min-w-[160px] space-y-1">
                      {app.applicantPhone && (
                        <a
                          href={`https://wa.me/${app.applicantPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline block"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{app.applicantPhone}</span>
                        </a>
                      )}
                      {app.portfolioUrl && (
                        <a
                          href={app.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline block truncate max-w-[150px]"
                        >
                          <ExternalLink className="w-3 h-3 text-indigo-600" />
                          <span>Lihat CV / Portofolio</span>
                        </a>
                      )}
                    </td>

                    <td className="py-3.5 px-4 min-w-[130px]">
                      {getStatusBadge(app.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={app.status}
                        disabled={updatingId === app.id}
                        onChange={(e) =>
                          handleUpdateStatus(app, e.target.value as JobApplicationStatus)
                        }
                        className="h-8 px-2 text-[11px] font-bold rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="APPLIED">Lamaran Masuk</option>
                        <option value="REVIEWED">Ditinjau HRD</option>
                        <option value="INTERVIEWING">Wawancara</option>
                        <option value="HIRED">Diterima (HIRED)</option>
                        <option value="REJECTED">Belum Sesuai</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

