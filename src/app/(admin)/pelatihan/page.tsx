'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  Users,
  BookOpen,
  Tag,
  GraduationCap,
  Briefcase,
  Layers,
  Receipt,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatGrid,
  AdminFilterBar,
  AdminResponsiveView,
  AdminMobileCard,
} from '@/components/admin';
import { useTraining } from '@/hooks/useTraining';
import { useAlumni } from '@/hooks/useAlumni';
import { useAdminTab } from '@/hooks/useAdminTab';
import { canPerformAction, PERMISSIONS } from '@/config/roles';
import { toast } from 'sonner';

import AlumniTab from './components/AlumniTab';
import TalentPoolTab from './components/TalentPoolTab';
import DivisionInvoiceTracker from '@/components/finance/DivisionInvoiceTracker';

const PELATIHAN_TABS = ['lms', 'alumni', 'talent', 'tagihan'] as const;
type PelatihanTab = (typeof PELATIHAN_TABS)[number];

export default function AdminPelatihanPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const canManageLMS = canPerformAction(role, PERMISSIONS.MANAGE_LMS);
  const canManageAlumni = canPerformAction(role, PERMISSIONS.MANAGE_ALUMNI);
  const canManageTalent = canPerformAction(role, PERMISSIONS.MANAGE_TALENT);

  const [activeView, setActiveView] = useAdminTab<PelatihanTab>('lms', PELATIHAN_TABS);

  const { trainings, loading, fetchNextPage, hasNextPage, deleteTraining } = useTraining();
  const { allAlumnis } = useAlumni();

  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (role === 'public' || role === 'tenant') {
        router.replace('/lms/dashboard');
      }
    }
  }, [user, role, authLoading, router]);

  if (authLoading || !user || role === 'public' || role === 'tenant') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filteredTrainings = trainings.filter((t) => {
    const title = t.title || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    if (!canManageLMS) return toast.error('Akses Ditolak');
    if (confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
      const res = await deleteTraining(id);
      if (res.success) toast.success('Program Pelatihan Berhasil Dihapus');
      else toast.error('Gagal Menghapus', { description: res.error });
    }
  };

  const totalClasses = trainings.length;
  const activeParticipants = trainings.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const onlineClasses = trainings.filter(
    (t) => t.type?.includes('Online') || t.type?.includes('Video')
  ).length;
  const totalAlumniCount = allAlumnis.length;
  const claimedAlumniCount = allAlumnis.filter((a) => a.status === 'CLAIMED').length;
  const talentPoolCount = allAlumnis.filter(
    (a) => a.status === 'CLAIMED' || a.isLookingForJob
  ).length;

  const availableTabs = [
    ...(canManageLMS
      ? [
          {
            id: 'lms',
            label: 'Manajemen LMS',
            icon: <BookOpen size={14} />,
            badge: totalClasses,
          },
        ]
      : []),
    ...(canManageAlumni
      ? [
          {
            id: 'alumni',
            label: 'Database Master Alumni',
            icon: <GraduationCap size={14} />,
            badge: totalAlumniCount,
          },
        ]
      : []),
    ...(canManageTalent
      ? [
          {
            id: 'talent',
            label: 'Direktori Talent & Karir',
            icon: <Briefcase size={14} />,
            badge: talentPoolCount > 0 ? talentPoolCount : undefined,
          },
        ]
      : []),
    ...(canManageLMS
      ? [
          {
            id: 'tagihan',
            label: 'Tagihan Diklat',
            icon: <Receipt size={14} />,
          },
        ]
      : []),
  ];

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300">
      {/* 1. ADMIN PAGE HEADER */}
      <AdminPageHeader
        title="Pusat Pembelajaran, LMS & Master Alumni"
        subtitle="Manajemen program diklat, kelas digital, yudisium peserta, database master alumni, serta integrasi ekosistem karir publik."
        badge={`${totalClasses} Kelas • ${totalAlumniCount} Alumni`}
        breadcrumbs={[{ label: 'Pelatihan & LMS' }]}
        tabs={availableTabs}
        activeTab={activeView}
        onTabChange={(id) => setActiveView(id as PelatihanTab)}
        showTabsOnDesktop={true}
        actions={
          <div className="flex items-center flex-wrap gap-2">
            {canManageAlumni && activeView !== 'alumni' && (
              <button
                type="button"
                onClick={() => setActiveView('alumni')}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <GraduationCap size={15} />
                <span>Daftar Alumni ({totalAlumniCount})</span>
              </button>
            )}
            {activeView === 'alumni' || activeView === 'talent' ? (
              <>
                <Link
                  href="/verifikasi-sertifikat"
                  target="_blank"
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Cek Sertifikat Publik</span>
                  <ExternalLink size={12} className="text-slate-400" />
                </Link>
                <Link
                  href="/alumni-portal"
                  target="_blank"
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Users size={14} className="text-blue-600" />
                  <span>Forum Alumni Publik</span>
                  <ExternalLink size={12} className="text-slate-400" />
                </Link>
              </>
            ) : null}
            {canManageLMS && activeView === 'lms' && (
              <button
                type="button"
                onClick={() => router.push('/pelatihan/builder')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs shadow-blue-200 transition-all shrink-0 cursor-pointer"
              >
                <Plus size={15} /> Buat Kelas Baru
              </button>
            )}
          </div>
        }
      />

      {/* METRIC CARDS BANNER (Tampil pada Tab LMS) */}
      {activeView === 'lms' && canManageLMS && (
        <AdminStatGrid
          columns={4}
          items={[
            {
              label: 'Total Kelas LMS',
              value: totalClasses,
              icon: <BookOpen size={18} strokeWidth={2.5} />,
              color: 'blue',
              subtext: 'Program pelatihan aktif & arsip',
            },
            {
              label: 'Total Peserta Aktif',
              value: activeParticipants,
              icon: <Users size={18} strokeWidth={2.5} />,
              color: 'emerald',
              subtext: 'Akumulasi peserta terdaftar',
            },
            {
              label: 'Database Master Alumni',
              value: totalAlumniCount,
              icon: <GraduationCap size={18} strokeWidth={2.5} />,
              color: 'amber',
              subtext: `${claimedAlumniCount} Akun Diklaim • Klik buka`,
              onClick: canManageAlumni ? () => setActiveView('alumni') : undefined,
            },
            {
              label: 'Kelas Digital / Online',
              value: onlineClasses,
              icon: <Tag size={18} strokeWidth={2.5} />,
              color: 'indigo',
              subtext: 'Kursus video & online mandiri',
            },
          ]}
        />
      )}

      {activeView === 'lms' && canManageLMS && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* SEARCH TOOLBAR */}
          <AdminFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Cari judul kelas pelatihan..."
            hasActiveFilters={Boolean(searchTerm)}
            onReset={() => setSearchTerm('')}
            actions={
              <span className="text-xs font-medium text-slate-500 hidden sm:inline-block px-2">
                Total: <strong className="text-slate-800">{filteredTrainings.length}</strong> kelas
                ditemukan
              </span>
            }
          />

          {/* TABLE & RESPONSIVE CARD DATA */}
          <AdminResponsiveView
            items={filteredTrainings}
            isLoading={loading && trainings.length === 0}
            emptyTitle="Tidak ada kelas pelatihan ditemukan"
            emptyMessage="Belum ada program pelatihan yang sesuai dengan kata kunci pencarian Anda."
            renderDesktopTable={(items) => (
              <div>
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-150 font-bold tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 w-[38%]">Detail Kelas</th>
                      <th className="px-5 py-3.5 w-[20%]">Harga & Tipe</th>
                      <th className="px-5 py-3.5 w-[16%]">Peserta</th>
                      <th className="px-5 py-3.5 w-[14%]">Status</th>
                      <th className="px-5 py-3.5 w-[12%] text-right pr-6">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => router.push(`/pelatihan/${t.id}/peserta`)}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 line-clamp-1 transition-colors">
                            {t.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                            <Calendar size={12} />{' '}
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              {t.date
                                ? new Date(t.date).toLocaleDateString('id-ID')
                                : 'Video Course'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase ${
                              t.type === 'Offline'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {t.type || 'Offline'}
                          </span>
                          <p className="text-xs font-black text-slate-800 mt-1">
                            {t.isFree
                              ? 'GRATIS'
                              : new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                }).format(t.price || 0)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-700">
                                {t.registeredCount || 0}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                / {t.quota === 0 ? '∞' : t.quota}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-emerald-500"
                                style={{
                                  width: `${
                                    t.quota === 0
                                      ? 100
                                      : Math.min(
                                          ((t.registeredCount || 0) / (t.quota || 1)) * 100,
                                          100
                                        )
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase bg-emerald-50 text-emerald-700 border-emerald-200">
                            {t.status}
                          </span>
                        </td>
                        <td
                          className="px-5 py-3.5 text-right pr-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => router.push(`/pelatihan/${t.id}/peserta?view=batches`)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 bg-white border border-slate-200 rounded-lg shadow-2xs"
                              title="Kelola 4 Batch"
                            >
                              <Layers size={14} />
                            </button>
                            <button
                              onClick={() => router.push(`/pelatihan/${t.id}/peserta`)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-200 rounded-lg shadow-2xs"
                              title="Lihat Peserta & Yudisium Alumni"
                            >
                              <Users size={14} />
                            </button>
                            <button
                              onClick={() => router.push(`/pelatihan/builder?id=${t.id}`)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 bg-white border border-slate-200 rounded-lg shadow-2xs"
                              title="Edit Kelas"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => t.id && handleDelete(t.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 bg-white border border-slate-200 rounded-lg shadow-2xs"
                              title="Hapus Kelas"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasNextPage && (
                  <div className="px-5 py-3.5 border-t border-slate-200/80 flex justify-center bg-slate-50/70">
                    <button
                      onClick={() => fetchNextPage()}
                      className="px-5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                      Muat Lebih Banyak
                    </button>
                  </div>
                )}
              </div>
            )}
            renderMobileCard={(t) => (
              <AdminMobileCard
                title={t.title}
                subtitle={`${t.type || 'Offline'} • ${
                  t.date ? new Date(t.date).toLocaleDateString('id-ID') : 'Video Course'
                }`}
                badge={
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase bg-emerald-50 text-emerald-700 border-emerald-200">
                    {t.status}
                  </span>
                }
                fields={[
                  {
                    label: 'Biaya',
                    value: t.isFree
                      ? 'GRATIS'
                      : new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(t.price || 0),
                  },
                  {
                    label: 'Peserta',
                    value: `${t.registeredCount || 0} / ${t.quota === 0 ? '∞' : t.quota}`,
                  },
                ]}
                footer={
                  <div className="flex items-center justify-end gap-1.5 w-full">
                    <button
                      onClick={() => router.push(`/pelatihan/${t.id}/peserta?view=batches`)}
                      className="px-2.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-1"
                    >
                      <Layers size={13} /> Batch
                    </button>
                    <button
                      onClick={() => router.push(`/pelatihan/${t.id}/peserta`)}
                      className="px-2.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1"
                    >
                      <Users size={13} /> Peserta
                    </button>
                    <button
                      onClick={() => router.push(`/pelatihan/builder?id=${t.id}`)}
                      className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => t.id && handleDelete(t.id)}
                      className="p-1.5 text-red-600 bg-white border border-red-200 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                }
              />
            )}
          />
        </div>
      )}

      {activeView === 'alumni' && canManageAlumni && <AlumniTab />}
      {activeView === 'talent' && canManageTalent && <TalentPoolTab />}
      {activeView === 'tagihan' && canManageLMS && (
        <DivisionInvoiceTracker
          division="DIKLAT_PELATIHAN"
          title="Pantauan Tagihan Peserta Pelatihan & Diklat"
          subtitle="Pantau pelunasan biaya pendaftaran pelatihan berbayar, cetak invoice PDF, dan kwitansi peserta."
        />
      )}
    </div>
  );
}
