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
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatGrid,
  AdminFilterBar,
  AdminResponsiveView,
  AdminMobileCard,
} from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useJobs } from '@/hooks/useJobs';
import { useAdminTab } from '@/hooks/useAdminTab';
import { JobListing } from '@/types/job.types';
import { formatSalary } from '@/utils/format';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { canPerformAction, PERMISSIONS } from '@/config/roles';
import { usePartnershipInquiries } from '@/hooks/usePartners';

import ModalJobForm from './components/ModalJobForm';
import ModalExportPartnership from './components/ModalExportPartnership';
import TabPartnerOnboarding from './components/TabPartnerOnboarding';
import TabForumModerationAnalytics from './components/TabForumModerationAnalytics';
import TabTracerStudyAnalytics from './components/TabTracerStudyAnalytics';
import TabJobApplications from './components/TabJobApplications';
import TabSmartTalentMatchmaking from './components/TabSmartTalentMatchmaking';

const KARIR_TABS = ['LIST', 'APPLICATIONS', 'MITRA', 'FORUM', 'SYNC', 'TALENT', 'TRACER'] as const;
type KarirTab = (typeof KARIR_TABS)[number];

export default function AdminManajemenKarirPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const canManageCareer = canPerformAction(role, PERMISSIONS.MANAGE_CAREER);

  const [activeTab, setActiveTab] = useAdminTab<KarirTab>('LIST', KARIR_TABS);
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
          : statusFilter === 'PENDING_APPROVAL'
          ? job.approvalStatus === 'PENDING_APPROVAL'
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
  const pendingApprovalJobs = jobs.filter((j) => j.approvalStatus === 'PENDING_APPROVAL');
  const { data: allInquiries = [] } = usePartnershipInquiries(canManageCareer);
  const unconvertedLeadsCount = allInquiries.filter((i) => !i.convertedPartnerId).length;
  const mitraBadgeCount = pendingApprovalJobs.length + unconvertedLeadsCount;

  // Metrik Distribusi Wilayah (Target: 60% Indonesia / 40% Luar Negeri & Regional)
  const regionalMetrics = React.useMemo(() => {
    let indo = 0;
    let asean = 0;
    let eastAsia = 0;
    let globalRemote = 0;
    jobs.forEach((j) => {
      const reg = j.region || 'indonesia';
      if (reg === 'indonesia') indo++;
      else if (reg === 'asean') asean++;
      else if (reg === 'east_asia') eastAsia++;
      else globalRemote++;
    });
    const totalCount = jobs.length || 1;
    const indoPct = Math.round((indo / totalCount) * 100);
    return {
      indo,
      indoPct,
      asean,
      aseanPct: Math.round((asean / totalCount) * 100),
      eastAsia,
      eastAsiaPct: Math.round((eastAsia / totalCount) * 100),
      globalRemote,
      globalRemotePct: Math.round((globalRemote / totalCount) * 100),
      overseas: asean + eastAsia + globalRemote,
      overseasPct: 100 - indoPct,
    };
  }, [jobs]);

  const getAdminHeaders = async () => {
    const idToken = await auth.currentUser?.getIdToken().catch(() => null);
    return {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    };
  };

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
      const nextActive = !job.isActive;
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: await getAdminHeaders(),
        body: JSON.stringify({
          id: job.id,
          isActive: nextActive,
          ...(nextActive ? { approvalStatus: 'APPROVED' } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengubah status');
      }
      toast.success(
        `Lowongan "${job.title}" kini ${nextActive ? 'disetujui & ditayangkan aktif' : 'dinonaktifkan'}.`
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
        headers: await getAdminHeaders(),
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

  const handleTriggerSync = async (typeOrEvent?: 'daily' | 'weekly' | React.MouseEvent) => {
    const type = typeOrEvent === 'daily' ? 'daily' : 'weekly';
    setIsSyncing(true);
    const actionName = type === 'daily' ? 'sync_daily' : 'sync_weekly';
    toast.info(
      type === 'daily'
        ? 'Memulai sinkronisasi harian (ATS Publik & Open API 100% Bebas Kuota)...'
        : 'Memulai deep-sync mingguan (ATS + Open API + Audit TTL)...'
    );
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: await getAdminHeaders(),
        body: JSON.stringify({ action: actionName }),
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
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300"><div className={isModalOpen ? 'hidden' : 'space-y-6'}>
      {/* ─── 1. Admin Page Header ─── */}
      <AdminPageHeader
        title="Manajemen Bursa Karir & Lowongan Mitra"
        subtitle="Pusat kelola lowongan pekerjaan mitra kawasan Solo Technopark, sinkronisasi agregator API, dan integrasi penyerapan alumni."
        badge={`${total} Lowongan Terdaftar`}
        breadcrumbs={[{ label: 'Ekosistem' }, { label: 'Bursa Karir' }]}
        tabs={[
          { id: 'LIST', label: 'Master Lowongan', icon: <Briefcase className="w-3.5 h-3.5" />, badge: total },
          { id: 'APPLICATIONS', label: 'Pelamar & Rekomendasi', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'MITRA', label: 'Mitra & Antrean Loker', icon: <Building2 className="w-3.5 h-3.5" />, badge: mitraBadgeCount || undefined },
          { id: 'FORUM', label: 'Moderasi Forum & Analitik', icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { id: 'SYNC', label: 'Kontrol Agregator & API', icon: <Database className="w-3.5 h-3.5" /> },
          { id: 'TALENT', label: 'Penyaluran Alumni STP', icon: <GraduationCap className="w-3.5 h-3.5" /> },
          { id: 'TRACER', label: 'Tracer Study & Serapan', icon: <TrendingUp className="w-3.5 h-3.5" /> },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as KarirTab)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              className="rounded-xl h-9 px-3.5 text-xs font-bold border-emerald-200 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/70 gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor Kemitraan</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSyncing}
              onClick={() => handleTriggerSync('weekly')}
              className="rounded-xl h-9 px-3.5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan API'}</span>
            </Button>

            {canManageCareer && (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAdd}
                className="rounded-xl h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-200"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Lowongan Mitra</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ─── 2. Metric Cards Banner ─── */}
      <AdminStatGrid
        columns={4}
        items={[
          {
            label: 'Total Lowongan Tersimpan',
            value: total,
            icon: <Briefcase className="w-5 h-5 stroke-[2.5]" />,
            color: 'emerald',
            onClick: () => setActiveTab('LIST'),
            active: activeTab === 'LIST',
          },
          {
            label: 'Mitra Kawasan STP',
            value: stpPartnerCount,
            icon: <ShieldCheck className="w-5 h-5 stroke-[2.5]" />,
            color: 'teal',
            onClick: () => setActiveTab('MITRA'),
            active: activeTab === 'MITRA',
          },
          {
            label: 'Realtime Agregator API',
            value: realtimeCount,
            icon: <Database className="w-5 h-5 stroke-[2.5]" />,
            color: 'sky',
            onClick: () => setActiveTab('SYNC'),
            active: activeTab === 'SYNC',
          },
          {
            label: 'Tayang Aktif di Bursa',
            value: activeCount,
            icon: <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />,
            color: 'blue',
          },
        ]}
      />

      {/* ─── TAB 1: MASTER DAFTAR LOWONGAN ─── */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          {/* Toolbar Saring Data */}
          <AdminFilterBar
            searchValue={searchFilter}
            onSearchChange={setSearchFilter}
            searchPlaceholder="Cari posisi pekerjaan, nama industri, atau lokasi..."
            filters={[
              {
                id: 'partner',
                value: partnerFilter,
                onChange: setPartnerFilter,
                options: [
                  { label: 'Semua Sumber', value: 'ALL' },
                  { label: 'Hanya Mitra STP', value: 'STP' },
                  { label: 'Agregator API', value: 'EXTERNAL' },
                ],
              },
              {
                id: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: 'Semua Status', value: 'ALL' },
                  { label: 'Tayang Aktif', value: 'ACTIVE' },
                  { label: `Menunggu Kurasi Mitra (${pendingApprovalJobs.length})`, value: 'PENDING_APPROVAL' },
                  { label: 'Nonaktif / Ditutup', value: 'INACTIVE' },
                ],
              },
            ]}
            hasActiveFilters={Boolean(searchFilter || partnerFilter !== 'ALL' || statusFilter !== 'ALL')}
            onReset={() => {
              setSearchFilter('');
              setPartnerFilter('ALL');
              setStatusFilter('ALL');
            }}
            actions={
              <Link
                href="/karir"
                target="_blank"
                className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
              >
                <span>Lihat Bursa Publik</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            }
          />

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

          {/* Tabel & Mobile Cards Lowongan Kerja */}
          <div className="space-y-3">
            <AdminResponsiveView<JobListing>
              items={paginatedJobs}
              isLoading={isLoading}
              emptyTitle="Tidak ada lowongan yang sesuai"
              emptyMessage="Coba sesuaikan kata kunci atau filter pencarian."
              renderDesktopTable={(items) => (
                <table className="w-full min-w-[760px] text-left text-xs border-collapse">
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
                    {items.map((job) => {
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
                                {job.salary.min
                                  ? formatSalary(job.salary.min, job.salary.currency || 'IDR')
                                  : 'N/A'}{' '}
                                -{' '}
                                {job.salary.max
                                  ? formatSalary(job.salary.max, job.salary.currency || 'IDR')
                                  : 'N/A'}
                                {job.salary.period === 'Tahun' ? ' /thn' : ''}
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
                            {job.approvalStatus === 'PENDING_APPROVAL' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(job)}
                                title="Klik untuk langsung menyetujui & menayangkan"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-emerald-100 hover:text-emerald-800 transition-all"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Setujui Draft</span>
                              </button>
                            ) : (
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
                            )}
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
                    })}
                  </tbody>
                </table>
              )}
              renderMobileCard={(job) => {
                const isSelected = selectedJobIds.includes(job.id);
                return (
                  <AdminMobileCard
                    title={job.title}
                    subtitle={`${job.company} • ${job.location}`}
                    badge={
                      job.approvalStatus === 'PENDING_APPROVAL' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(job)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300"
                        >
                          <Clock className="w-3 h-3" /> Setujui Draft
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(job)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {job.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{job.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      )
                    }
                    fields={[
                      {
                        label: 'Kategori & Model',
                        value: `${job.category} • ${job.workType}`,
                      },
                      {
                        label: 'Rentang Gaji',
                        value:
                          job.salary.isDisclosed && (job.salary.min || job.salary.max)
                            ? `${job.salary.min ? formatSalary(job.salary.min, job.salary.currency || 'IDR') : 'N/A'} - ${job.salary.max ? formatSalary(job.salary.max, job.salary.currency || 'IDR') : 'N/A'}`
                            : 'Kompetitif',
                      },
                      {
                        label: 'Sumber',
                        value: job.isStpPartner ? 'Mitra Kawasan STP' : 'API Realtime',
                      },
                    ]}
                    footer={
                      <div className="flex items-center justify-between w-full gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectJob(job.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                          <span>Pilih Ekspor</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/karir/${job.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-600 bg-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(job)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 bg-white"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    }
                  />
                );
              }}
            />

            {/* ─── Kontrol Pagination Admin ─── */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
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

      {/* ─── TAB PELAMAR & REKOMENDASI KARIR STP (CLOSED-LOOP PIPELINE) ─── */}
      {activeTab === 'APPLICATIONS' && <TabJobApplications />}

      {/* ─── TAB 2: KONTROL AGREGATOR & MULTI-TIER SYNC (ZERO COST) ─── */}
      {activeTab === 'SYNC' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Arsitektur Akuisisi Multi-Tier (100% Zero-Cost Quota)</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Gateway Sinkronisasi ATS Publik & Multi-Provider Karir
                </h3>
                <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                  Menghimpun lowongan kerja tangan pertama dari 11 endpoint ATS korporasi dan Open API tanpa biaya kredit API. Data dinormalisasi, disanitasi dari PII (UU PDP No. 27/2022), dan disimpan ke Master Cache.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleTriggerSync('daily')}
                  disabled={isSyncing}
                  className="rounded-2xl h-11 px-4 text-xs font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50 gap-2 shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Sync Harian (ATS & Open API)</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => handleTriggerSync('weekly')}
                  disabled={isSyncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl h-11 px-5 gap-2 shadow-md shadow-emerald-200"
                >
                  <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Memproses Sinkronisasi...' : 'Deep-Sync Mingguan & TTL'}</span>
                </Button>
              </div>
            </div>

            {/* Metrik Inti Sistem */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jadwal Cloud Functions
                </span>
                <span className="text-sm font-extrabold text-slate-800">Harian (04:00) & Senin (03:00)</span>
                <p className="text-[11px] text-slate-500">Scheduler v2 otomatis berjalan di region Jakarta.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Biaya Kuota / Kredit
                </span>
                <span className="text-sm font-extrabold text-emerald-700">Rp 0 (100% Free Quota)</span>
                <p className="text-[11px] text-slate-500">ATS Publik + Keyless Open API + JSearch Micro.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penyimpanan Master
                </span>
                <span className="text-sm font-extrabold text-slate-800">Chunked Master Cache</span>
                <p className="text-[11px] text-slate-500">Hanya memakan 1-2 Read Firestore untuk ribuan pelamar.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Proteksi Data & TTL
                </span>
                <span className="text-sm font-extrabold text-blue-700">UU PDP & 30 Hari TTL</span>
                <p className="text-[11px] text-slate-500">PII recruiter dibuang otomatis, expired diarsipkan.</p>
              </div>
            </div>

            {/* ─── Kartu Pemantauan Rasio Wilayah (Target 60:40) ─── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-slate-50 border border-emerald-200/90 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Komposisi Geografis Lowongan Kerja
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                      Target 60% ID / 40% Global
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Sistem memprioritaskan penyerapan tenaga kerja nasional di Indonesia (≥ 60%), diperkaya peluang regional ASEAN & Asia Timur (≤ 40%).
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-800 block">
                      {regionalMetrics.indo} Loker ({regionalMetrics.indoPct}%)
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      🇮🇩 Indonesia
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-300" />
                  <div className="text-left">
                    <span className="text-xs font-black text-blue-800 block">
                      {regionalMetrics.overseas} Loker ({regionalMetrics.overseasPct}%)
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      🌏 Luar Negeri & Global
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar Seimbang */}
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${regionalMetrics.indoPct}%` }}
                  title={`Indonesia: ${regionalMetrics.indoPct}% (${regionalMetrics.indo} lowongan)`}
                />
                <div
                  className="h-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${regionalMetrics.aseanPct}%` }}
                  title={`ASEAN: ${regionalMetrics.aseanPct}% (${regionalMetrics.asean} lowongan)`}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${regionalMetrics.eastAsiaPct}%` }}
                  title={`Asia Timur: ${regionalMetrics.eastAsiaPct}% (${regionalMetrics.eastAsia} lowongan)`}
                />
                <div
                  className="h-full bg-slate-400 transition-all duration-500"
                  style={{ width: `${regionalMetrics.globalRemotePct}%` }}
                  title={`Global Remote: ${regionalMetrics.globalRemotePct}% (${regionalMetrics.globalRemote} lowongan)`}
                />
              </div>

              {/* Rincian Sub-Cluster */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-700 block">🇮🇩 Indonesia (Nasional)</span>
                  <span className="font-extrabold text-sm text-slate-800">{regionalMetrics.indo}</span>
                  <span className="text-[10px] text-slate-400 ml-1 font-semibold">({regionalMetrics.indoPct}%)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-cyan-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-cyan-700 block">🌏 ASEAN (SG, MY, TH)</span>
                  <span className="font-extrabold text-sm text-slate-800">{regionalMetrics.asean}</span>
                  <span className="text-[10px] text-slate-400 ml-1 font-semibold">({regionalMetrics.aseanPct}%)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-rose-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-rose-700 block">🇯🇵/🇰🇷 Asia Timur (JP & KR)</span>
                  <span className="font-extrabold text-sm text-slate-800">{regionalMetrics.eastAsia}</span>
                  <span className="text-[10px] text-slate-400 ml-1 font-semibold">({regionalMetrics.eastAsiaPct}%)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-600 block">🌐 Global Remote / WFH</span>
                  <span className="font-extrabold text-sm text-slate-800">{regionalMetrics.globalRemote}</span>
                  <span className="text-[10px] text-slate-400 ml-1 font-semibold">({regionalMetrics.globalRemotePct}%)</span>
                </div>
              </div>
            </div>

            {/* Matriks Konektor Live ATS & Open Provider */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status Konektor Sumber Data Aktif
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Greenhouse Public ATS</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif (0 Kuota)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Traveloka, GoTo, Tokopedia, Ruangguru, Kredivo, Xendit, Bukalapak, Amar Bank, OY!
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Lever Public ATS</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif (0 Kuota)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    eFishery, Kargo Tech, Pluang, Ajaib, Sirclo, Shipper, Flip, KitaLulus, Canva
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Ashby Public ATS</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif (0 Kuota)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Deel, Linear, Postman, Cursor (Mendukung rentang gaji transparan)
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Keyless Open APIs</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      Aktif (0 Kuota)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Remotive (Tech), Himalayas (Salary Tag), Jobicy (Remote), Arbeitnow (Relokasi/Visa)
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Universal JSON-LD Parser</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Siap Crawl
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Mengekstrak skema Schema.org JobPosting dari halaman karir BUMN dan manufaktur
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Google Jobs Micro-Batch</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      Hemat Kuota
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    JSearch RapidAPI dibatasi hanya 3 query lokal prioritas (Solo, Manufaktur Jateng, IT)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB MITRA & ONBOARDING REKRUTMEN ─── */}
      {activeTab === 'MITRA' && (
        <TabPartnerOnboarding
          pendingJobs={pendingApprovalJobs}
          onRefreshJobs={() => refetch()}
        />
      )}

      {/* ─── TAB MODERASI FORUM & ANALITIK EKSEKUTIF ─── */}
      {activeTab === 'FORUM' && (
        <TabForumModerationAnalytics
          activeJobsCount={activeCount}
          onRefreshJobs={() => refetch()}
        />
      )}

      {/* ─── TAB 3: PENYALURAN TALENTA ALUMNI ─── */}
      {activeTab === 'TALENT' && (
        <TabSmartTalentMatchmaking
          activeJobs={jobs.filter((j) => j.isActive)}
        />
      )}

      {/* ─── TAB TRACER STUDY & ANALITIK SERAPAN KERJA ─── */}
      {activeTab === 'TRACER' && (
        <TabTracerStudyAnalytics />
      )}

      {/* ─── Workspace Form Tambah / Edit Lowongan ─── */}</div>
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
