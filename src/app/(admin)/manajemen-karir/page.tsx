// src/app/(admin)/manajemen-karir/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Plus,
  RotateCw,
  Search,
  Building2,
  MapPin,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Database,
  Users,
  GraduationCap,
  Calendar,
  AlertCircle,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useJobs } from '@/hooks/useJobs';
import { JobListing } from '@/types/job.types';
import { formatSalary } from '@/utils/format';
import { useAuth } from '@/lib/AuthContext';
import { canPerformAction, PERMISSIONS } from '@/config/roles';

import ModalJobForm from './components/ModalJobForm';
import ModalExportPartnership from './components/ModalExportPartnership';

export default function AdminManajemenKarirPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const canManageCareer = canPerformAction(role, PERMISSIONS.MANAGE_CAREER);

  const [activeTab, setActiveTab] = useState<'LIST' | 'SYNC' | 'TALENT'>('LIST');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [partnerFilter, setPartnerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // State Pagination & Seleksi Baris untuk Ekspor Kemitraan
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJobToEdit, setSelectedJobToEdit] = useState<JobListing | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Ambil seluruh bank data lowongan (termasuk yang non-aktif) untuk panel admin
  const { data, isLoading, refetch } = useJobs({
    includeInactive: true,
  });
  const jobs = data?.jobs || [];
  const total = data?.total || 0;

  // Saring lowongan di client
  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        !searchFilter.trim() ||
        job.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        job.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
        job.location.toLowerCase().includes(searchFilter.toLowerCase());

      const matchCategory =
        categoryFilter === 'ALL' || job.category === categoryFilter;

      const matchPartner =
        partnerFilter === 'ALL'
          ? true
          : partnerFilter === 'STP'
          ? job.isStpPartner
          : !job.isStpPartner;

      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? job.isActive
          : !job.isActive;

      return matchSearch && matchCategory && matchPartner && matchStatus;
    });
  }, [jobs, searchFilter, categoryFilter, partnerFilter, statusFilter]);

  // Reset halaman ke 1 saat filter pencarian atau pageSize berubah
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, categoryFilter, partnerFilter, statusFilter, pageSize]);

  // Kalkulasi Pagination
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  // Logika Seleksi Baris untuk Ekspor Kemitraan
  const isAllCurrentPageSelected =
    paginatedJobs.length > 0 &&
    paginatedJobs.every((j) => selectedJobIds.includes(j.id));

  const handleToggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedJobs.map((j) => j.id));
      setSelectedJobIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const next = new Set(selectedJobIds);
      paginatedJobs.forEach((j) => next.add(j.id));
      setSelectedJobIds(Array.from(next));
    }
  };

  const handleToggleSelectJob = (id: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedJobIds([]);
  };

  // Metrik ringkasan
  const stpPartnerCount = jobs.filter((j) => j.isStpPartner).length;
  const realtimeCount = jobs.filter((j) => !j.isStpPartner).length;
  const activeCount = jobs.filter((j) => j.isActive).length;

  const handleOpenAdd = () => {
    setSelectedJobToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (job: JobListing) => {
    setSelectedJobToEdit(job);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (job: JobListing) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, isActive: !job.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengubah status');
      }
      toast.success(
        `Lowongan "${job.title}" kini ${!job.isActive ? 'ditayangkan aktif' : 'dinonaktifkan'}.`
      );
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memperbarui status.');
    }
  };

  const handleDeleteJob = async (job: JobListing) => {
    if (!window.confirm(`Yakin ingin menghapus lowongan "${job.title}" di ${job.company}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/jobs?id=${encodeURIComponent(job.id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus lowongan');
      }
      toast.success('Lowongan berhasil dihapus dari bank data.');
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    toast.info('Memulai sinkronisasi lowongan dari RapidAPI JSearch & Aggregator...');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success(json.message || 'Sinkronisasi lowongan berhasil diperbarui!');
      } else {
        toast.warning(json.message || 'Sinkronisasi selesai diproses.');
      }
    } catch (err: any) {
      toast.warning('Sinkronisasi telah dikirim ke server. Memperbarui tampilan...');
    } finally {
      await refetch();
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300">
      {/* ─── 1. Admin Page Header ─── */}
      <AdminPageHeader
        title="Manajemen Bursa Karir & Lowongan Mitra"
        subtitle="Pusat kelola lowongan pekerjaan mitra kawasan Solo Technopark, sinkronisasi agregator API, dan integrasi penyerapan alumni."
        badge={`${total} Lowongan Terdaftar`}
        breadcrumbs={[{ label: 'Ekosistem' }, { label: 'Bursa Karir' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              className="rounded-xl h-10 px-3.5 text-xs font-bold border-emerald-200 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/70 gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor Kemitraan</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSyncing}
              onClick={handleTriggerSync}
              className="rounded-xl h-10 px-3.5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan API'}</span>
            </Button>

            {canManageCareer && (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAdd}
                className="rounded-xl h-10 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-200"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Lowongan Mitra</span>
              </Button>
            )}
          </div>
        }
      >
        {/* Navigasi Pill Tabs Admin */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl overflow-x-auto w-full xl:w-auto hide-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'LIST'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Master Lowongan ({total})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SYNC')}
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'SYNC'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Kontrol Agregator & API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TALENT')}
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'TALENT'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Penyaluran Alumni STP</span>
          </button>
        </div>
      </AdminPageHeader>

      {/* ─── 2. Metric Cards Banner ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Briefcase className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Lowongan Tersimpan
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">{total}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Mitra Kawasan STP
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">{stpPartnerCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
            <Database className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Realtime Agregator API
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">{realtimeCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tayang Aktif di Bursa
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">{activeCount}</h3>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: MASTER DAFTAR LOWONGAN ─── */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          {/* Toolbar Saring Data */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari posisi pekerjaan, nama industri, atau lokasi..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className="h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">Semua Sumber</option>
                <option value="STP">Hanya Mitra STP</option>
                <option value="EXTERNAL">Agregator API</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Tayang Aktif</option>
                <option value="INACTIVE">Nonaktif / Ditutup</option>
              </select>

              <Link
                href="/karir"
                target="_blank"
                className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
              >
                <span>Lihat Bursa Publik</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Bar Indikator Seleksi Baris untuk Ekspor Kemitraan */}
          {selectedJobIds.length > 0 && (
            <div className="p-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs block">
                    {selectedJobIds.length} Lowongan Terpilih
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Siap diekspor untuk bahan presentasi & negosiasi kemitraan industri STP
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsExportModalOpen(true)}
                  className="h-8 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor {selectedJobIds.length} Terpilih</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Batal Pilih
                </Button>
              </div>
            </div>
          )}

          {/* Tabel Lowongan Kerja */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAllCurrentPage}
                        title={
                          isAllCurrentPageSelected
                            ? 'Batal pilih semua di halaman ini'
                            : 'Pilih semua di halaman ini'
                        }
                        className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {isAllCurrentPageSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Lowongan & Perusahaan</th>
                    <th className="py-3.5 px-4">Kategori & Model</th>
                    <th className="py-3.5 px-4">Rentang Gaji</th>
                    <th className="py-3.5 px-4">Sumber Data</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          <span>Memuat daftar lowongan pekerjaan...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">Tidak ada lowongan yang sesuai</p>
                        <p className="text-[11px] text-slate-400">Coba sesuaikan kata kunci atau filter pencarian.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedJobs.map((job) => {
                      const isSelected = selectedJobIds.includes(job.id);
                      return (
                        <tr
                          key={job.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-emerald-50/50 hover:bg-emerald-50/80' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectJob(job.id)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 line-clamp-1 max-w-xs sm:max-w-sm">
                              {job.title}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{job.company}</span>
                              <span>•</span>
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[120px]">{job.location}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 border-slate-200 mb-1">
                              {job.category}
                            </Badge>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {job.workType} ({job.workSetup.includes('Solo') ? 'STP' : job.workSetup})
                            </div>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {job.salary.isDisclosed && (job.salary.min || job.salary.max) ? (
                              <span className="text-emerald-700 font-bold">
                                {job.salary.min ? formatSalary(job.salary.min, 'IDR') : 'N/A'} -{' '}
                                {job.salary.max ? formatSalary(job.salary.max, 'IDR') : 'N/A'}
                              </span>
                            ) : (
                              <span className="text-slate-400">Kompetitif</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {job.isStpPartner ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Mitra Kawasan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                API Realtime
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(job)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                job.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {job.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>{job.isActive ? 'Tayang Aktif' : 'Nonaktif'}</span>
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/karir/${job.id}`}
                                target="_blank"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                                title="Buka pratinjau publik"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(job)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                                title="Edit lowongan"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteJob(job)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                title="Hapus lowongan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── Kontrol Pagination Admin ─── */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <span>
                  Menampilkan{' '}
                  <span className="font-bold text-slate-900">
                    {filteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, filteredJobs.length)}
                  </span>{' '}
                  dari <span className="font-bold text-slate-900">{filteredJobs.length}</span> lowongan
                </span>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Baris:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-7 px-2 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                    title="Halaman Pertama"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        // Tampilkan window 5 halaman di sekitar currentPage
                        return (
                          p === 1 ||
                          p === totalPages ||
                          (p >= currentPage - 2 && p <= currentPage + 2)
                        );
                      })
                      .map((pageNum, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={pageNum}>
                            {prev && pageNum - prev > 1 && (
                              <span className="px-1 text-slate-300">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                currentPage === pageNum
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                    title="Halaman Terakhir"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: KONTROL AGREGATOR & API SYNC ─── */}
      {activeTab === 'SYNC' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Koneksi Provider Aktif</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Agregator Karir & JSearch RapidAPI Gateway
                </h3>
                <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                  Data lowongan ditarik secara berkala dan diakumulasikan ke dalam Cloud Firestore tanpa menghapus arsip sebelumnya.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl h-11 px-5 gap-2 shadow-md shadow-emerald-200 shrink-0"
              >
                <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Memproses Sinkronisasi...' : 'Sinkronkan Ulang Sekarang'}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jadwal Otomatis
                </span>
                <span className="text-sm font-extrabold text-slate-800">Setiap 7 Hari Sekali</span>
                <p className="text-[11px] text-slate-500">Otomatis saat masa interval mingguan terpenuhi.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penyimpanan Master
                </span>
                <span className="text-sm font-extrabold text-slate-800">Cloud Firestore (jobs)</span>
                <p className="text-[11px] text-slate-500">Master Cache 1-Read artifacts diaktifkan.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penyelarasan Diklat
                </span>
                <span className="text-sm font-extrabold text-emerald-700">9 Program Sertifikasi STP</span>
                <p className="text-[11px] text-slate-500">Auto-tagging kurikulum IT, CNC, AI, Welder.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: PENYALURAN TALENTA ALUMNI ─── */}
      {activeTab === 'TALENT' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Penyaluran Talenta Alumni Solo Technopark</h3>
              <p className="text-xs text-slate-500">
                Pintu integrasi langsung menghubungkan alumni pelatihan (Talent Pool) dengan lowongan industri mitra yang aktif.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/pelatihan')}
              className="rounded-xl text-xs font-bold gap-1.5 border-slate-200 text-slate-700"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka Talent Pool Master</span>
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-slate-50 border border-emerald-200/60 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-950 block">
                Sistem AI Matcher & Penyaluran Otomatis Siap Digunakan
              </span>
              <p className="text-xs text-emerald-800 leading-relaxed max-w-xl">
                Alumni dapat menguji kecocokan resume & sertifikasi mereka dengan algoritma Clario AI langsung pada setiap detail kartu lowongan.
              </p>
            </div>
            <Link
              href="/karir"
              target="_blank"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-xs"
            >
              Eksplorasi Bursa Publik
            </Link>
          </div>
        </div>
      )}

      {/* ─── Modal Form Tambah / Edit Lowongan ─── */}
      <ModalJobForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
        initialJob={selectedJobToEdit}
      />

      {/* ─── Modal Ekspor Data Kemitraan & Penyaluran Alumni ─── */}
      <ModalExportPartnership
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allJobs={jobs}
        currentFilteredJobs={filteredJobs}
        selectedJobIds={selectedJobIds}
      />
    </div>
  );
}
