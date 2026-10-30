// src/app/(admin)/service-desk/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { AdminPageHeader } from '@/components/admin';
import { useAllWorkOrders, useWorkOrderMutations } from '@/hooks/useServiceDesk';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '@/types/serviceDesk.types';
import { formatRupiah } from '@/utils/format';
import {
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  UserCheck,
  FileCheck,
  Building2,
  Phone,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type FilterTab = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'RESOLVED' | 'CLOSED';

export default function ServiceDeskPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Data Queries
  const { data: workOrders = [], isLoading } = useAllWorkOrders();
  const {
    createWorkOrderMutation,
    assignTechnicianMutation,
    resolveWorkOrderMutation,
    deleteWorkOrderMutation,
  } = useWorkOrderMutations();

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<Partial<WorkOrder>>({
    title: '',
    assetName: '',
    location: 'Kawasan Solo Technopark',
    reporterName: 'Staf Operasional STP',
    issueDescription: '',
    priority: 'SEDANG',
    source: 'INTERNAL_STAFF',
  });

  const [assignForm, setAssignForm] = useState({
    technicianName: '',
    technicianPhone: '',
    priority: 'SEDANG' as WorkOrderPriority,
    targetCompletionDate: '',
  });

  const [resolveForm, setResolveForm] = useState({
    completionNotes: '',
    actualCost: 0,
    bastSignedDate: new Date().toISOString().split('T')[0],
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    const total = workOrders.length;
    const openCount = workOrders.filter((w) => w.status === 'OPEN' || w.status === 'ASSIGNED').length;
    const inProgressCount = workOrders.filter((w) => w.status === 'IN_PROGRESS' || w.status === 'WAITING_PARTS').length;
    const resolvedCount = workOrders.filter((w) => w.status === 'RESOLVED' || w.status === 'CLOSED').length;
    return { total, openCount, inProgressCount, resolvedCount };
  }, [workOrders]);

  // Filtered List
  const filteredOrders = useMemo(() => {
    return workOrders.filter((w) => {
      const matchSearch =
        w.spkNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.technicianName && w.technicianName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (activeTab === 'ALL') return matchSearch;
      if (activeTab === 'OPEN') return matchSearch && (w.status === 'OPEN' || w.status === 'ASSIGNED');
      if (activeTab === 'IN_PROGRESS') return matchSearch && w.status === 'IN_PROGRESS';
      if (activeTab === 'WAITING_PARTS') return matchSearch && w.status === 'WAITING_PARTS';
      if (activeTab === 'RESOLVED') return matchSearch && (w.status === 'RESOLVED' || w.status === 'CLOSED');
      return matchSearch;
    });
  }, [workOrders, searchTerm, activeTab]);

  const handleOpenAssign = (order: WorkOrder) => {
    setSelectedOrder(order);
    setAssignForm({
      technicianName: order.technicianName || '',
      technicianPhone: order.technicianPhone || '',
      priority: order.priority || 'SEDANG',
      targetCompletionDate: order.targetCompletionDate || '',
    });
    setIsAssignOpen(true);
  };

  const handleOpenResolve = (order: WorkOrder) => {
    setSelectedOrder(order);
    setResolveForm({
      completionNotes: order.completionNotes || '',
      actualCost: order.actualCost || 0,
      bastSignedDate: new Date().toISOString().split('T')[0],
    });
    setIsResolveOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.assetName || !createForm.issueDescription) {
      toast.error('Lengkapi judul, nama aset, dan deskripsi masalah.');
      return;
    }
    await createWorkOrderMutation.mutateAsync(createForm as any);
    setIsCreateOpen(false);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder?.id || !assignForm.technicianName) {
      toast.error('Nama teknisi wajib diisi.');
      return;
    }
    await assignTechnicianMutation.mutateAsync({
      id: selectedOrder.id,
      ...assignForm,
    });
    setIsAssignOpen(false);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder?.id || !resolveForm.completionNotes) {
      toast.error('Catatan penyelesaian pekerjaan wajib diisi.');
      return;
    }
    await resolveWorkOrderMutation.mutateAsync({
      id: selectedOrder.id,
      ...resolveForm,
    });
    setIsResolveOpen(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <AdminPageHeader
        title="Service Desk & SPK Pemeliharaan Kawasan"
        description="Pusat triase aduan kerusakan aset fisik, penerbitan Surat Perintah Kerja (SPK) teknisi, dan Berita Acara Serah Terima (BAST)."
      />

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <Layers size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Work Order</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{metrics.total} Tiket</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menunggu Penugasan</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{metrics.openCount} Tiket</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Wrench size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dalam Pengerjaan</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{metrics.inProgressCount} SPK</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selesai (BAST Terbit)</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{metrics.resolvedCount} Pekerjaan</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as FilterTab[]).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="font-bold text-xs"
            >
              {tab === 'ALL' && 'Semua Tiket'}
              {tab === 'OPEN' && 'Menunggu Teknisi'}
              {tab === 'IN_PROGRESS' && 'Dalam Pengerjaan'}
              {tab === 'RESOLVED' && 'Selesai & BAST'}
            </Button>
          ))}
        </div>

        <Button
          onClick={() => {
            setCreateForm({
              title: '',
              assetName: '',
              location: 'Kawasan Solo Technopark',
              reporterName: 'Staf Operasional STP',
              issueDescription: '',
              priority: 'SEDANG',
              source: 'INTERNAL_STAFF',
            });
            setIsCreateOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-md shadow-blue-200 text-xs"
        >
          <Plus size={16} />
          Terbitkan SPK Manual
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
        <Input
          placeholder="Cari nomor SPK, judul kerusakan, nama fasilitas, atau teknisi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* WORK ORDER TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">No. SPK & Keluhan</th>
                <th className="py-3 px-4">Aset & Lokasi</th>
                <th className="py-3 px-4">Sumber Laporan</th>
                <th className="py-3 px-4">Prioritas</th>
                <th className="py-3 px-4">Teknisi Bertugas</th>
                <th className="py-3 px-4">Status SPK</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ada data Work Order / SPK yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-xs text-blue-600 font-bold">{wo.spkNumber}</p>
                      <p className="font-bold text-slate-800 line-clamp-1">{wo.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{wo.issueDescription}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{wo.assetName}</p>
                      <span className="text-[11px] text-slate-400">{wo.location}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <Badge variant="outline" className="font-bold text-[10px]">
                        {wo.source}
                      </Badge>
                      <span className="block text-[11px] text-slate-400 mt-0.5">Oleh: {wo.reporterName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        className={
                          wo.priority === 'DARURAT'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : wo.priority === 'TINGGI'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }
                      >
                        {wo.priority}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {wo.technicianName ? (
                        <div>
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <UserCheck size={13} className="text-blue-600" />
                            {wo.technicianName}
                          </p>
                          <p className="text-slate-400 font-mono text-[11px]">{wo.technicianPhone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Belum ditugaskan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        className={
                          wo.status === 'RESOLVED' || wo.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : wo.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }
                      >
                        {wo.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {wo.status !== 'RESOLVED' && wo.status !== 'CLOSED' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAssign(wo)}
                              className="text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Tugaskan
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOpenResolve(wo)}
                              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              BAST Selesai
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm('Hapus tiket SPK ini?')) {
                              deleteWorkOrderMutation.mutateAsync(wo.id!);
                            }
                          }}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TERBITKAN SPK MANUAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 mb-1">Terbitkan Work Order / SPK Baru</h3>
            <p className="text-xs text-slate-500 mb-5">
              Catat keluhan kerusakan fasilitas atau pemeliharaan preventif kawasan.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Judul Kerusakan / Pekerjaan *</label>
                <Input
                  value={createForm.title || ''}
                  onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Contoh: Perbaikan AC Sentral Gedung Inkubator"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nama Fasilitas / Aset *</label>
                  <Input
                    value={createForm.assetName || ''}
                    onChange={(e) => setCreateForm((p) => ({ ...p, assetName: e.target.value }))}
                    placeholder="Contoh: AC Daikin 5 PK"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Prioritas *</label>
                  <select
                    value={createForm.priority || 'SEDANG'}
                    onChange={(e) => setCreateForm((p) => ({ ...p, priority: e.target.value as any }))}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm"
                  >
                    <option value="RENDAH">Rendah</option>
                    <option value="SEDANG">Sedang</option>
                    <option value="TINGGI">Tinggi</option>
                    <option value="DARURAT">Darurat (Emergency)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Deskripsi Kerusakan & Lokasi Detail *</label>
                <textarea
                  value={createForm.issueDescription || ''}
                  onChange={(e) => setCreateForm((p) => ({ ...p, issueDescription: e.target.value }))}
                  className="w-full h-24 p-2.5 bg-white border border-slate-200 rounded-md text-sm"
                  placeholder="Jelaskan kondisi dan kronologi kerusakan..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Terbitkan SPK
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TUGASKAN TEKNISI */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 mb-1">Tugaskan Teknisi Pelaksana</h3>
            <p className="text-xs text-slate-500 mb-4">
              SPK: <span className="font-mono font-bold text-blue-600">{selectedOrder?.spkNumber}</span>
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Teknisi / Tim *</label>
                <Input
                  value={assignForm.technicianName}
                  onChange={(e) => setAssignForm((p) => ({ ...p, technicianName: e.target.value }))}
                  placeholder="Contoh: Budi Santoso (Divisi Mekanikal)"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nomor Kontak Teknisi</label>
                <Input
                  value={assignForm.technicianPhone}
                  onChange={(e) => setAssignForm((p) => ({ ...p, technicianPhone: e.target.value }))}
                  placeholder="Contoh: 081234567890"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Target Tanggal Selesai</label>
                <Input
                  type="date"
                  value={assignForm.targetCompletionDate}
                  onChange={(e) => setAssignForm((p) => ({ ...p, targetCompletionDate: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Simpan Penugasan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SELESAI (BAST) */}
      {isResolveOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 mb-1">Verifikasi Penyelesaian & BAST</h3>
            <p className="text-xs text-slate-500 mb-4">
              Tutup pekerjaan untuk SPK: <span className="font-mono font-bold text-blue-600">{selectedOrder?.spkNumber}</span>
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Laporan Hasil Pengerjaan *</label>
                <textarea
                  value={resolveForm.completionNotes}
                  onChange={(e) => setResolveForm((p) => ({ ...p, completionNotes: e.target.value }))}
                  className="w-full h-24 p-2.5 bg-white border border-slate-200 rounded-md text-sm"
                  placeholder="Jelaskan tindakan perbaikan dan penggantian suku cadang yang telah selesai..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Biaya Riil / Suku Cadang (Rp)</label>
                  <Input
                    type="number"
                    value={resolveForm.actualCost}
                    onChange={(e) => setResolveForm((p) => ({ ...p, actualCost: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal BAST</label>
                  <Input
                    type="date"
                    value={resolveForm.bastSignedDate}
                    onChange={(e) => setResolveForm((p) => ({ ...p, bastSignedDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsResolveOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Sahkan BAST & Selesai
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

