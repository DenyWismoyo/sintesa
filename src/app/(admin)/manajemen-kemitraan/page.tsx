// src/app/(admin)/manajemen-kemitraan/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminResponsiveView,
  AdminFormDrawer,
  AdminStatGrid,
  AdminMobileCard,
  AdminStatusBadge,
} from '@/components/admin';
import { useAdminTab } from '@/hooks/useAdminTab';
import { usePartnershipInquiries, usePartnerMutations } from '@/hooks/usePartners';
import { useAllMouContracts, useMouContractMutations } from '@/hooks/useMouContracts';
import {
  MouContract,
  MouContractType,
  PartnershipInquiry,
} from '@/types/partnership.types';
import { formatRupiah } from '@/utils/format';
import {
  Handshake,
  FileText,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Mail,
  Sparkles,
  TrendingUp,
  Printer,
  Briefcase,
  Landmark,
} from 'lucide-react';
import ModalPrintMou from './components/ModalPrintMou';
import ModalAiMatch from './components/ModalAiMatch';
import TabOpenProjectAdmin from './components/TabOpenProjectAdmin';
import TabFinancingAdmin from './components/TabFinancingAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const KEMITRAAN_TABS = [
  'MOU_LIST',
  'INQUIRIES_PIPELINE',
  'OPEN_PROJECTS',
  'FINANCING_SCHEMES',
] as const;
type TabView = (typeof KEMITRAAN_TABS)[number];

export default function ManajemenKemitraanPage() {
  const [activeTab, setActiveTab] = useAdminTab<TabView>('MOU_LIST', KEMITRAAN_TABS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Data Queries
  const { data: mouList = [], isLoading: isLoadingMou } = useAllMouContracts();
  const { data: inquiries = [], isLoading: isLoadingInquiries } = usePartnershipInquiries();
  const { createMouMutation, updateMouMutation, deleteMouMutation } = useMouContractMutations();
  const { updateInquiryStatusMutation } = usePartnerMutations();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMou, setEditingMou] = useState<MouContract | null>(null);
  const [formData, setFormData] = useState<Partial<MouContract>>({
    contractType: 'MOU',
    status: 'ACTIVE',
    commitmentBudget: 0,
  });

  // Print Document Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printContract, setPrintContract] = useState<MouContract | null>(null);
  const [printMode, setPrintMode] = useState<'MOU' | 'DISPOSISI'>('MOU');

  // AI Match Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedInquiryForAi, setSelectedInquiryForAi] = useState<PartnershipInquiry | null>(null);

  const handleOpenAiMatch = (inq: PartnershipInquiry) => {
    setSelectedInquiryForAi(inq);
    setIsAiModalOpen(true);
  };

  const handleOpenPrint = (contract: MouContract, mode: 'MOU' | 'DISPOSISI') => {
    setPrintContract(contract);
    setPrintMode(mode);
    setIsPrintOpen(true);
  };

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalActiveMou = mouList.filter((m) => m.status === 'ACTIVE').length;
    const totalCommitment = mouList.reduce((acc, m) => acc + (m.commitmentBudget || 0), 0);
    const pendingInquiries = inquiries.filter((i) => i.status === 'PENDING').length;

    const now = Date.now();
    const expiringSoon = mouList.filter((m) => {
      if (m.status !== 'ACTIVE') return false;
      const endMs = new Date(m.endDate).getTime();
      const diffDays = Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 60;
    }).length;

    return { totalActiveMou, totalCommitment, pendingInquiries, expiringSoon };
  }, [mouList, inquiries]);

  // Filtered MoU List
  const filteredMouList = useMemo(() => {
    return mouList.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'ALL' || item.contractType === typeFilter;
      return matchSearch && matchType;
    });
  }, [mouList, searchTerm, typeFilter]);

  const handleOpenCreateModal = () => {
    setEditingMou(null);
    setFormData({
      contractNumber: `MOU/STP/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      contractType: 'MOU',
      partnerName: '',
      agencyType: 'Perusahaan Swasta / Multinasional',
      picPartnerName: '',
      picPartnerContact: '',
      picStpName: 'Divisi Kemitraan & Kerjasama STP',
      scope: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      commitmentBudget: 0,
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mou: MouContract) => {
    setEditingMou(mou);
    setFormData(mou);
    setIsModalOpen(true);
  };

  const handleSaveMou = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.partnerName || !formData.contractNumber) {
      toast.error('Lengkapi nomor, judul, dan nama mitra kerjasama.');
      return;
    }

    if (editingMou?.id) {
      await updateMouMutation.mutateAsync({ id: editingMou.id, data: formData });
    } else {
      await createMouMutation.mutateAsync(formData as any);
    }
    setIsModalOpen(false);
  };

  const handleDeleteMou = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus arsip MoU ini?')) {
      await deleteMouMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* 1. ADMIN PAGE HEADER */}
      <AdminPageHeader
        title="Manajemen Kemitraan & MoU"
        subtitle="Kelola siklus hidup kerjasama kelembagaan, penelaahan hukum, monitoring masa berlaku, dan realisasi komitmen mitra industri & kampus."
        badge={`${mouList.length} Dokumen`}
        breadcrumbs={[{ label: 'Komersial' }, { label: 'Kemitraan & MoU' }]}
        actions={
          <Button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold text-xs h-9 px-4 rounded-xl shadow-xs shrink-0"
          >
            <Plus size={15} />
            <span>Tambah Dokumen Baru</span>
          </Button>
        }
        tabs={[
          {
            id: 'MOU_LIST',
            label: 'Daftar Dokumen MoU',
            icon: <FileText size={14} />,
            badge: mouList.length,
          },
          {
            id: 'INQUIRIES_PIPELINE',
            label: 'Pipeline Calon Mitra',
            icon: <Mail size={14} />,
            badge: metrics.pendingInquiries,
          },
          {
            id: 'OPEN_PROJECTS',
            label: 'Kurasi Open Project',
            icon: <Briefcase size={14} />,
          },
          {
            id: 'FINANCING_SCHEMES',
            label: 'Pembiayaan & Bank',
            icon: <Landmark size={14} />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2. METRIC CARDS */}
      <AdminStatGrid
        items={[
          {
            title: 'MoU & PKS Aktif',
            value: metrics.totalActiveMou,
            suffix: 'Dokumen',
            icon: <Handshake className="w-5 h-5" />,
            color: 'blue',
          },
          {
            title: 'Komitmen Anggaran',
            value: formatRupiah(metrics.totalCommitment),
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'emerald',
          },
          {
            title: 'Segera Berakhir (<60 Hr)',
            value: metrics.expiringSoon,
            suffix: 'Kontrak',
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'amber',
          },
          {
            title: 'Inquiry Masuk',
            value: metrics.pendingInquiries,
            suffix: 'Menunggu',
            icon: <Clock className="w-5 h-5" />,
            color: 'purple',
          },
        ]}
      />

      {/* 3. TAB CONTENT: DAFTAR MOU & PKS */}
      {activeTab === 'MOU_LIST' && (
        <div className="space-y-4">
          <AdminFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Cari nomor dokumen, judul kerjasama, atau nama mitra..."
            totalHits={filteredMouList.length}
            totalLabel="dokumen"
            onReset={() => {
              setSearchTerm('');
              setTypeFilter('ALL');
            }}
            filters={[
              {
                key: 'type',
                label: 'Jenis Dokumen',
                value: typeFilter,
                onChange: setTypeFilter,
                options: [
                  { value: 'ALL', label: 'Semua Jenis Dokumen' },
                  { value: 'MOU', label: 'MoU (Nota Kesepahaman)' },
                  { value: 'PKS', label: 'PKS (Perjanjian Kerjasama)' },
                  { value: 'NDA', label: 'NDA (Non-Disclosure)' },
                  { value: 'KONTRAK', label: 'Kontrak Layanan' },
                ],
              },
            ]}
          />

          <AdminResponsiveView<MouContract>
            items={filteredMouList}
            isLoading={isLoadingMou}
            emptyTitle="Tidak Ada Dokumen Kerjasama"
            emptyMessage="Belum ada arsip MoU atau PKS yang sesuai dengan filter."
            renderDesktopTable={(items) => (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Nomor & Judul Dokumen</th>
                    <th className="py-3.5 px-4">Nama Mitra</th>
                    <th className="py-3.5 px-4">Jenis</th>
                    <th className="py-3.5 px-4">Masa Berlaku</th>
                    <th className="py-3.5 px-4">Komitmen (Rp)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((mou) => {
                    const isExpiring = (() => {
                      const endMs = new Date(mou.endDate).getTime();
                      const diffDays = Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24));
                      return diffDays > 0 && diffDays <= 60;
                    })();

                    return (
                      <tr key={mou.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-mono text-xs text-blue-600 font-bold">{mou.contractNumber}</p>
                          <p className="font-semibold text-slate-800 line-clamp-1">{mou.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{mou.scope}</p>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 text-xs">
                          {mou.partnerName}
                          <span className="block text-[11px] text-slate-400">{mou.agencyType}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="font-bold text-[10px] bg-slate-50 px-1.5 py-0.5">
                            {mou.contractType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          <div>
                            {mou.startDate} s/d {mou.endDate}
                          </div>
                          {isExpiring && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-0.5">
                              <AlertTriangle size={11} /> Segera berakhir
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">
                          {formatRupiah(mou.commitmentBudget || 0)}
                        </td>
                        <td className="py-3 px-4">
                          <AdminStatusBadge status={mou.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPrint(mou, 'MOU')}
                              title="Cetak Draf MoU Resmi"
                              className="h-7 text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 px-2 gap-1"
                            >
                              <Printer size={12} className="text-indigo-600" />
                              <span>MoU</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPrint(mou, 'DISPOSISI')}
                              title="Cetak Lembar Disposisi"
                              className="h-7 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 px-2 gap-1"
                            >
                              <FileText size={12} className="text-slate-500" />
                              <span>Disposisi</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditModal(mou)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteMou(mou.id!)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            renderMobileCard={(mou) => {
              const isExpiring = (() => {
                const endMs = new Date(mou.endDate).getTime();
                const diffDays = Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24));
                return diffDays > 0 && diffDays <= 60;
              })();

              return (
                <AdminMobileCard
                  code={mou.contractNumber}
                  badge={<AdminStatusBadge status={mou.status} />}
                  title={mou.title}
                  subtitle={`${mou.partnerName} • ${mou.agencyType}`}
                  fields={[
                    { label: 'Jenis Dokumen', value: mou.contractType },
                    {
                      label: 'Komitmen',
                      value: (
                        <span className="font-mono font-bold text-blue-700">
                          {formatRupiah(mou.commitmentBudget || 0)}
                        </span>
                      ),
                    },
                    {
                      label: 'Masa Berlaku',
                      value: `${mou.startDate} s/d ${mou.endDate}`,
                      fullWidth: true,
                    },
                  ]}
                  footerLeft={
                    isExpiring ? (
                      <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> &lt;60 hari
                      </span>
                    ) : undefined
                  }
                  actions={
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPrint(mou, 'MOU')}
                        className="h-7 text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 px-2.5 gap-1"
                      >
                        <Printer size={12} className="text-indigo-600" />
                        <span>MoU</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPrint(mou, 'DISPOSISI')}
                        className="h-7 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 px-2.5 gap-1"
                      >
                        <FileText size={12} className="text-slate-500" />
                        <span>Disposisi</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditModal(mou)}
                        className="h-7 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 px-2.5"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMou(mou.id!)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  }
                />
              );
            }}
          />
        </div>
      )}

      {/* TAB CONTENT: PIPELINE CALON MITRA */}
      {activeTab === 'INQUIRIES_PIPELINE' && (
        <AdminResponsiveView<PartnershipInquiry>
          items={inquiries}
          isLoading={isLoadingInquiries}
          emptyTitle="Belum Ada Permohonan Kemitraan"
          emptyMessage="Kotak masuk pengajuan kolaborasi dari mitra eksternal masih kosong."
          renderDesktopTable={(items) => (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Instansi Calon Mitra</th>
                  <th className="py-3.5 px-4">Jenis Minat</th>
                  <th className="py-3.5 px-4">PIC & Kontak</th>
                  <th className="py-3.5 px-4">Pokok Usulan</th>
                  <th className="py-3.5 px-4">Status Pipeline</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800 text-xs sm:text-sm">{inq.agencyName}</p>
                      <p className="text-[11px] text-slate-400">{inq.agencyType}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="font-medium text-[10px] px-1.5 py-0.5">
                        {inq.partnershipType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-bold text-slate-800 text-xs">{inq.picName}</p>
                      <p className="text-slate-500 text-[11px]">{inq.picEmail}</p>
                      <p className="text-slate-500 font-mono text-[10px]">{inq.picPhone}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                      <p className="font-bold text-slate-800 line-clamp-1">{inq.subject}</p>
                      <p className="line-clamp-2 mt-0.5 text-[11px] text-slate-400">
                        {inq.proposalSummary}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <AdminStatusBadge status={inq.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenAiMatch(inq)}
                          className="h-7 px-2 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 font-bold text-[10px] gap-1"
                        >
                          <Sparkles size={12} className="text-purple-600" />
                          <span>AI Sinergi</span>
                        </Button>
                        <select
                          value={inq.status}
                          onChange={(e) =>
                            updateInquiryStatusMutation.mutateAsync({
                              id: inq.id!,
                              status: e.target.value as any,
                            })
                          }
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium focus:outline-blue-500"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONTACTED">DIHUBUNGI</option>
                          <option value="MEETING_SCHEDULED">RAPAT TERJADWAL</option>
                          <option value="MOU_DRAFTED">DRAFT MOU</option>
                          <option value="CLOSED">SELESAI (CLOSED)</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          renderMobileCard={(inq) => (
            <AdminMobileCard
              code={inq.partnershipType}
              badge={<AdminStatusBadge status={inq.status} />}
              title={inq.agencyName}
              subtitle={`${inq.agencyType} • PIC: ${inq.picName}`}
              fields={[
                { label: 'Email PIC', value: inq.picEmail },
                { label: 'No. Telepon', value: inq.picPhone },
                { label: 'Pokok Usulan', value: inq.subject, fullWidth: true },
              ]}
              actions={
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAiMatch(inq)}
                    className="h-7 px-2.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold text-xs gap-1"
                  >
                    <Sparkles size={12} className="text-purple-600" />
                    <span>AI Sinergi</span>
                  </Button>
                  <select
                    value={inq.status}
                    onChange={(e) =>
                      updateInquiryStatusMutation.mutateAsync({
                        id: inq.id!,
                        status: e.target.value as any,
                      })
                    }
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-semibold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONTACTED">DIHUBUNGI</option>
                    <option value="MEETING_SCHEDULED">RAPAT TERJADWAL</option>
                    <option value="MOU_DRAFTED">DRAFT MOU</option>
                    <option value="CLOSED">SELESAI</option>
                  </select>
                </>
              }
            />
          )}
        />
      )}

      {/* TAB CONTENT: KURASI OPEN PROJECT */}
      {activeTab === 'OPEN_PROJECTS' && <TabOpenProjectAdmin />}

      {/* TAB CONTENT: SKEMA PEMBIAYAAN & PERBANKAN */}
      {activeTab === 'FINANCING_SCHEMES' && <TabFinancingAdmin />}

      {/* DRAWER / MODAL BUAT / EDIT MOU */}
      <AdminFormDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMou ? 'Edit Dokumen Kerjasama MoU/PKS' : 'Daftarkan Dokumen MoU/PKS Baru'}
        subtitle="Arsipkan dokumen legal, nomor registrasi, ruang lingkup, dan komitmen anggaran."
        maxWidth="2xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="h-8.5 text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="form-mou-pks"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8.5 text-xs"
            >
              Simpan Dokumen
            </Button>
          </>
        }
      >
        <form id="form-mou-pks" onSubmit={handleSaveMou} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Nomor Dokumen *</label>
              <Input
                value={formData.contractNumber || ''}
                onChange={(e) => setFormData((p) => ({ ...p, contractNumber: e.target.value }))}
                placeholder="Contoh: MOU/STP/2026/088"
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Jenis Dokumen *</label>
              <select
                value={formData.contractType || 'MOU'}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, contractType: e.target.value as MouContractType }))
                }
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm"
              >
                <option value="MOU">MoU (Nota Kesepahaman)</option>
                <option value="PKS">PKS (Perjanjian Kerja Sama)</option>
                <option value="NDA">NDA (Non-Disclosure Agreement)</option>
                <option value="KONTRAK">Kontrak Layanan / Komersial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Judul Kerjasama *</label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="Contoh: Kerjasama Pengembangan Akademi Kecerdasan Buatan & CNC Presisi"
              className="h-9 text-xs sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Nama Mitra *</label>
              <Input
                value={formData.partnerName || ''}
                onChange={(e) => setFormData((p) => ({ ...p, partnerName: e.target.value }))}
                placeholder="Contoh: PT Industri Presisi Nusantara"
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Jenis Instansi</label>
              <Input
                value={formData.agencyType || ''}
                onChange={(e) => setFormData((p) => ({ ...p, agencyType: e.target.value }))}
                placeholder="Contoh: Perusahaan Swasta / BUMN / Kampus"
                className="h-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">PIC Mitra *</label>
              <Input
                value={formData.picPartnerName || ''}
                onChange={(e) => setFormData((p) => ({ ...p, picPartnerName: e.target.value }))}
                placeholder="Nama PIC Mitra"
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Kontak PIC Mitra *</label>
              <Input
                value={formData.picPartnerContact || ''}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, picPartnerContact: e.target.value }))
                }
                placeholder="Email / No HP PIC"
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Ruang Lingkup Kerjasama *
            </label>
            <textarea
              value={formData.scope || ''}
              onChange={(e) => setFormData((p) => ({ ...p, scope: e.target.value }))}
              className="w-full h-20 p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-blue-500"
              placeholder="Deskripsikan ruang lingkup dan poin-poin kesepakatan kerjasama..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Mulai *</label>
              <Input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Tanggal Berakhir *
              </label>
              <Input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Komitmen Anggaran (Rp)
              </label>
              <Input
                type="number"
                value={formData.commitmentBudget || 0}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, commitmentBudget: Number(e.target.value) }))
                }
                className="h-9 text-xs sm:text-sm"
              />
            </div>
          </div>
        </form>
      </AdminFormDrawer>

      {/* MODAL PRINT MOU / DISPOSISI */}
      <ModalPrintMou
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        contract={printContract}
        mode={printMode}
      />

      {/* MODAL AI MATCHMAKING ANALYSIS */}
      <ModalAiMatch
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        inquiry={selectedInquiryForAi}
      />
    </div>
  );
}
