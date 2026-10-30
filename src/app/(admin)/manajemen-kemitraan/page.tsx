// src/app/(admin)/manajemen-kemitraan/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { AdminPageHeader, AdminResponsiveView, AdminFormDrawer } from '@/components/admin';
import { usePartnershipInquiries, usePartnerMutations } from '@/hooks/usePartners';
import { useAllMouContracts, useMouContractMutations } from '@/hooks/useMouContracts';
import { MouContract, MouContractType, MouContractStatus, PartnershipInquiry } from '@/types/partnership.types';
import { formatRupiah } from '@/utils/format';
import {
  Handshake,
  FileText,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  Edit,
  Mail,
  Phone,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Printer,
} from 'lucide-react';
import ModalPrintMou from './components/ModalPrintMou';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type TabView = 'MOU_LIST' | 'INQUIRIES_PIPELINE';

export default function ManajemenKemitraanPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabView>('MOU_LIST');
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

    // Check expiring soon (< 60 days)
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
    <div className="space-y-5 pb-20">
      <AdminPageHeader
        title="Manajemen Kemitraan & MoU"
        description="Kelola siklus hidup kerjasama kelembagaan, penelaahan hukum, monitoring masa berlaku, dan realisasi komitmen mitra industri & kampus."
      />

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-blue-50/60 to-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Handshake className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">MoU & PKS Aktif</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mt-0.5">{metrics.totalActiveMou}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-emerald-50/60 to-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Komitmen Anggaran</p>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 mt-0.5 truncate">{formatRupiah(metrics.totalCommitment)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-amber-50/60 to-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Segera Berakhir</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mt-0.5">{metrics.expiringSoon}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-purple-50/60 to-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Inquiry Masuk</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mt-0.5">{metrics.pendingInquiries}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={activeTab === 'MOU_LIST' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('MOU_LIST')}
            className="gap-2 font-bold text-xs h-8 px-3 whitespace-nowrap"
          >
            <FileText size={14} />
            Daftar Dokumen ({mouList.length})
          </Button>
          <Button
            variant={activeTab === 'INQUIRIES_PIPELINE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('INQUIRIES_PIPELINE')}
            className="gap-2 font-bold text-xs h-8 px-3 whitespace-nowrap"
          >
            <Mail size={14} />
            Pipeline Calon Mitra ({inquiries.length})
          </Button>
        </div>

        {activeTab === 'MOU_LIST' && (
          <Button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold text-xs h-8.5 px-3.5 shadow-xs shrink-0">
            <Plus size={15} />
            Tambah Dokumen Baru
          </Button>
        )}
      </div>

      {/* TAB CONTENT: DAFTAR MOU & PKS */}
      {activeTab === 'MOU_LIST' && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
              <Input
                placeholder="Cari nomor dokumen, judul, atau nama mitra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm bg-white border-slate-200/90 rounded-xl"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-blue-500"
            >
              <option value="ALL">Semua Jenis Dokumen</option>
              <option value="MOU">MoU (Nota Kesepahaman)</option>
              <option value="PKS">PKS (Perjanjian Kerjasama)</option>
              <option value="NDA">NDA (Non-Disclosure)</option>
              <option value="KONTRAK">Kontrak Layanan</option>
            </select>
          </div>

          <AdminResponsiveView<MouContract>
            items={filteredMouList}
            isLoading={isLoadingMou}
            emptyTitle="Tidak Ada Dokumen Kerjasama"
            emptyMessage="Belum ada arsip MoU atau PKS yang sesuai dengan filter."
            renderDesktopTable={(items) => (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs">
                  <tr>
                    <th className="py-3 px-4">Nomor & Judul Dokumen</th>
                    <th className="py-3 px-4">Nama Mitra</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Masa Berlaku</th>
                    <th className="py-3 px-4">Komitmen (Rp)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
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
                          <div>{mou.startDate} s/d {mou.endDate}</div>
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
                          <Badge
                            className={`text-[10px] font-bold px-2 py-0.5 ${
                              mou.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : mou.status === 'REVIEW_LEGAL'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {mou.status}
                          </Badge>
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
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-blue-600">{mou.contractNumber}</span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{mou.title}</h4>
                      <p className="text-[11px] text-slate-500">{mou.partnerName} • {mou.agencyType}</p>
                    </div>
                    <Badge
                      className={`text-[9px] font-bold px-1.5 py-0.5 shrink-0 ${
                        mou.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : mou.status === 'REVIEW_LEGAL'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {mou.status}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Jenis:</span>
                      <span className="font-bold text-slate-700">{mou.contractType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Periode:</span>
                      <span className="font-medium text-slate-800">{mou.startDate} s/d {mou.endDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Komitmen:</span>
                      <span className="font-mono font-bold text-blue-700">{formatRupiah(mou.commitmentBudget || 0)}</span>
                    </div>
                    {isExpiring && (
                      <div className="pt-1 text-amber-600 font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> Masa berlaku akan segera berakhir (&lt;60 hari)
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
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
                      className="h-7 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 px-3"
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
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* TAB CONTENT: PIPELINE CALON MITRA */}
      {activeTab === 'INQUIRIES_PIPELINE' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs">
                <tr>
                  <th className="py-3 px-4">Instansi Calon Mitra</th>
                  <th className="py-3 px-4">Jenis Minat</th>
                  <th className="py-3 px-4">PIC & Kontak</th>
                  <th className="py-3 px-4">Pokok Usulan</th>
                  <th className="py-3 px-4">Status Pipeline</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Belum ada permohonan kemitraan masuk.
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inq) => (
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
                        <p className="line-clamp-2 mt-0.5 text-[11px] text-slate-400">{inq.proposalSummary}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] font-bold px-2 py-0.5 ${
                            inq.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : inq.status === 'CONTACTED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : inq.status === 'MOU_DRAFTED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {inq.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL BUAT / EDIT MOU */}
      <AdminFormDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMou ? 'Edit Dokumen Kerjasama MoU/PKS' : 'Daftarkan Dokumen MoU/PKS Baru'}
        subtitle="Arsipkan dokumen legal, nomor registrasi, ruang lingkup, dan komitmen anggaran."
        maxWidth="2xl"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="h-8.5 text-xs font-semibold">
              Batal
            </Button>
            <Button type="submit" form="form-mou-pks" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8.5 text-xs">
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
                onChange={(e) => setFormData((p) => ({ ...p, contractType: e.target.value as MouContractType }))}
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
                onChange={(e) => setFormData((p) => ({ ...p, picPartnerContact: e.target.value }))}
                placeholder="Email / No HP PIC"
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Ruang Lingkup Kerjasama *</label>
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
              <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Berakhir *</label>
              <Input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Komitmen Anggaran (Rp)</label>
              <Input
                type="number"
                value={formData.commitmentBudget || 0}
                onChange={(e) => setFormData((p) => ({ ...p, commitmentBudget: Number(e.target.value) }))}
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
    </div>
  );
}

