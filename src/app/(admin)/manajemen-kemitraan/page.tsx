// src/app/(admin)/manajemen-kemitraan/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { AdminPageHeader } from '@/components/admin';
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
} from 'lucide-react';
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
    <div className="space-y-6 pb-20">
      <AdminPageHeader
        title="Manajemen Kemitraan & MoU/PKS"
        description="Kelola siklus hidup kerjasama kelembagaan, penelaahan hukum, monitoring masa berlaku, dan realisasi komitmen mitra industri & kampus."
      />

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <Handshake size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">MoU & PKS Aktif</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalActiveMou} Dokumen</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Komitmen Investasi / Kerjasama</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{formatRupiah(metrics.totalCommitment)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Segera Berakhir (&lt;60 Hari)</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{metrics.expiringSoon} Dokumen</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inquiry Masuk Baru</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{metrics.pendingInquiries} Calon Mitra</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'MOU_LIST' ? 'default' : 'outline'}
            onClick={() => setActiveTab('MOU_LIST')}
            className="gap-2 font-bold"
          >
            <FileText size={16} />
            Daftar MoU & PKS ({mouList.length})
          </Button>
          <Button
            variant={activeTab === 'INQUIRIES_PIPELINE' ? 'default' : 'outline'}
            onClick={() => setActiveTab('INQUIRIES_PIPELINE')}
            className="gap-2 font-bold"
          >
            <Mail size={16} />
            Pipeline Calon Mitra ({inquiries.length})
          </Button>
        </div>

        {activeTab === 'MOU_LIST' && (
          <Button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-md shadow-blue-200">
            <Plus size={16} />
            Tambah MoU / PKS Baru
          </Button>
        )}
      </div>

      {/* TAB CONTENT: DAFTAR MOU & PKS */}
      {activeTab === 'MOU_LIST' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <Input
                placeholder="Cari nomor dokumen, judul, atau nama mitra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
            >
              <option value="ALL">Semua Jenis Dokumen</option>
              <option value="MOU">MoU (Nota Kesepahaman)</option>
              <option value="PKS">PKS (Perjanjian Kerjasama)</option>
              <option value="NDA">NDA (Non-Disclosure)</option>
              <option value="KONTRAK">Kontrak Layanan</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-4">Nomor & Judul MoU</th>
                    <th className="py-3 px-4">Nama Mitra</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Masa Berlaku</th>
                    <th className="py-3 px-4">Komitmen (Rp)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMouList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Belum ada dokumen MoU / PKS yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredMouList.map((mou) => {
                      const isExpiring = (() => {
                        const endMs = new Date(mou.endDate).getTime();
                        const diffDays = Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24));
                        return diffDays > 0 && diffDays <= 60;
                      })();

                      return (
                        <tr key={mou.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-mono text-xs text-blue-600 font-bold">{mou.contractNumber}</p>
                            <p className="font-bold text-slate-800 line-clamp-1">{mou.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{mou.scope}</p>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {mou.partnerName}
                            <span className="block text-[11px] text-slate-400">{mou.agencyType}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="font-bold bg-slate-50">
                              {mou.contractType}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            <div>{mou.startDate} s/d {mou.endDate}</div>
                            {isExpiring && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-bold mt-0.5">
                                <AlertTriangle size={12} /> Segera berakhir
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            {formatRupiah(mou.commitmentBudget || 0)}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              className={
                                mou.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : mou.status === 'REVIEW_LEGAL'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }
                            >
                              {mou.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditModal(mou)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                              >
                                <Edit size={15} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteMou(mou.id!)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PIPELINE CALON MITRA */}
      {activeTab === 'INQUIRIES_PIPELINE' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">Instansi Calon Mitra</th>
                  <th className="py-3 px-4">Jenis Minat</th>
                  <th className="py-3 px-4">PIC & Kontak</th>
                  <th className="py-3 px-4">Pokok Usulan</th>
                  <th className="py-3 px-4">Status Pipeline</th>
                  <th className="py-3 px-4 text-right">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Belum ada permohonan kemitraan masuk.
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{inq.agencyName}</p>
                        <p className="text-xs text-slate-400">{inq.agencyType}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="font-medium text-xs">
                          {inq.partnershipType}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-bold text-slate-800">{inq.picName}</p>
                        <p className="text-slate-500">{inq.picEmail}</p>
                        <p className="text-slate-500 font-mono">{inq.picPhone}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        <p className="font-bold text-slate-800 line-clamp-1">{inq.subject}</p>
                        <p className="line-clamp-2 mt-0.5">{inq.proposalSummary}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          className={
                            inq.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : inq.status === 'CONTACTED'
                              ? 'bg-blue-100 text-blue-800'
                              : inq.status === 'MOU_DRAFTED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }
                        >
                          {inq.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={inq.status}
                          onChange={(e) =>
                            updateInquiryStatusMutation.mutateAsync({
                              id: inq.id!,
                              status: e.target.value as any,
                            })
                          }
                          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white font-medium"
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

      {/* MODAL BUAT / EDIT MOU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-800 mb-1">
              {editingMou ? 'Edit Dokumen Kerjasama MoU/PKS' : 'Daftarkan Dokumen MoU/PKS Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Arsipkan dokumen legal, nomor registrasi, ruang lingkup, dan komitmen anggaran kerjasama.
            </p>

            <form onSubmit={handleSaveMou} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nomor Dokumen *</label>
                  <Input
                    value={formData.contractNumber || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, contractNumber: e.target.value }))}
                    placeholder="Contoh: MOU/STP/2026/088"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Jenis Dokumen *</label>
                  <select
                    value={formData.contractType || 'MOU'}
                    onChange={(e) => setFormData((p) => ({ ...p, contractType: e.target.value as MouContractType }))}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm"
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
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nama Mitra *</label>
                  <Input
                    value={formData.partnerName || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, partnerName: e.target.value }))}
                    placeholder="Contoh: PT Industri Presisi Nusantara"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Jenis Instansi</label>
                  <Input
                    value={formData.agencyType || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, agencyType: e.target.value }))}
                    placeholder="Contoh: Perusahaan Swasta / BUMN / Kampus"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">PIC Mitra *</label>
                  <Input
                    value={formData.picPartnerName || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, picPartnerName: e.target.value }))}
                    placeholder="Nama PIC Mitra"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Kontak PIC Mitra *</label>
                  <Input
                    value={formData.picPartnerContact || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, picPartnerContact: e.target.value }))}
                    placeholder="Email / No HP PIC"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Ruang Lingkup Kerjasama *</label>
                <textarea
                  value={formData.scope || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, scope: e.target.value }))}
                  className="w-full h-20 p-2.5 bg-white border border-slate-200 rounded-md text-sm"
                  placeholder="Deskripsikan ruang lingkup dan poin-poin kesepakatan kerjasama..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Mulai *</label>
                  <Input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Berakhir *</label>
                  <Input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Komitmen Anggaran (Rp)</label>
                  <Input
                    type="number"
                    value={formData.commitmentBudget || 0}
                    onChange={(e) => setFormData((p) => ({ ...p, commitmentBudget: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Simpan Dokumen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

