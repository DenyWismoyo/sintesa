// src/app/(admin)/service-desk/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { AdminPageHeader, AdminResponsiveView, AdminFormDrawer } from '@/components/admin';
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
  Printer,
} from 'lucide-react';
import ModalPrintServiceDesk from './components/ModalPrintServiceDesk';
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

  // Print Document Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<WorkOrder | null>(null);
  const [printMode, setPrintMode] = useState<'SPK' | 'BAST'>('SPK');

  const handleOpenPrint = (order: WorkOrder, mode: 'SPK' | 'BAST') => {
    setPrintOrder(order);
    setPrintMode(mode);
    setIsPrintOpen(true);
  };

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
    <div className="space-y-5 pb-20">
      <AdminPageHeader
        title="Service Desk & SPK Pemeliharaan"
        description="Pusat triase aduan kerusakan aset fisik, penerbitan Surat Perintah Kerja (SPK), dan Berita Acara Serah Terima (BAST)."
      />

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-blue-50/60 to-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Total SPK</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mt-0.5">{metrics.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-amber-50/60 to-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Antrean Teknisi</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mt-0.5">{metrics.openCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-indigo-50/60 to-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Pengerjaan</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mt-0.5">{metrics.inProgressCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-emerald-50/60 to-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Selesai BAST</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mt-0.5">{metrics.resolvedCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as FilterTab[]).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="font-bold text-xs h-8 px-3"
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
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold text-xs h-8.5 px-3.5 shadow-xs shrink-0"
        >
          <Plus size={15} />
          Terbitkan SPK Manual
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
        <Input
          placeholder="Cari nomor SPK, judul kerusakan, nama fasilitas, atau teknisi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9 text-xs sm:text-sm bg-white border-slate-200/90 rounded-xl"
        />
      </div>

      {/* RESPONSIVE TABLE & CARD LIST */}
      <AdminResponsiveView<WorkOrder>
        items={filteredOrders}
        isLoading={isLoading}
        emptyTitle="Tidak Ada Tiket Work Order"
        emptyMessage="Belum ada tiket SPK yang sesuai dengan filter atau kriteria pencarian."
        renderDesktopTable={(items) => (
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs">
              <tr>
                <th className="py-3 px-4">No. SPK & Keluhan</th>
                <th className="py-3 px-4">Aset & Lokasi</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4">Prioritas</th>
                <th className="py-3 px-4">Teknisi Bertugas</th>
                <th className="py-3 px-4">Status SPK</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-mono text-xs text-blue-600 font-bold">{wo.spkNumber}</p>
                    <p className="font-semibold text-slate-800 line-clamp-1">{wo.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{wo.issueDescription}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800 text-xs">{wo.assetName}</p>
                    <span className="text-[11px] text-slate-400">{wo.location}</span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <Badge variant="outline" className="font-bold text-[10px] px-1.5 py-0.5">
                      {wo.source}
                    </Badge>
                    <span className="block text-[11px] text-slate-400 mt-0.5">Oleh: {wo.reporterName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={`text-[10px] font-bold px-2 py-0.5 ${
                        wo.priority === 'DARURAT'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : wo.priority === 'TINGGI'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {wo.priority}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {wo.technicianName ? (
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                          <UserCheck size={13} className="text-blue-600" />
                          {wo.technicianName}
                        </p>
                        <p className="text-slate-400 font-mono text-[10px]">{wo.technicianPhone}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Belum ditugaskan</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={`text-[10px] font-bold px-2 py-0.5 ${
                        wo.status === 'RESOLVED' || wo.status === 'CLOSED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : wo.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {wo.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPrint(wo, wo.status === 'RESOLVED' || wo.status === 'CLOSED' ? 'BAST' : 'SPK')}
                        title={wo.status === 'RESOLVED' || wo.status === 'CLOSED' ? 'Cetak BAST Resmi' : 'Cetak SPK Kerja'}
                        className="h-7 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 px-2 gap-1"
                      >
                        <Printer size={12} className="text-slate-500" />
                        <span>{wo.status === 'RESOLVED' || wo.status === 'CLOSED' ? 'BAST' : 'SPK'}</span>
                      </Button>
                      {wo.status !== 'RESOLVED' && wo.status !== 'CLOSED' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssign(wo)}
                            className="h-7 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 px-2.5"
                          >
                            Tugaskan
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenResolve(wo)}
                            className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                          >
                            BAST
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
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        renderMobileCard={(wo) => (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-mono text-xs font-bold text-blue-600">{wo.spkNumber}</span>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{wo.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{wo.assetName} • {wo.location}</p>
              </div>
              <Badge
                className={`text-[9px] font-bold px-1.5 py-0.5 shrink-0 ${
                  wo.status === 'RESOLVED' || wo.status === 'CLOSED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : wo.status === 'IN_PROGRESS'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {wo.status}
              </Badge>
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Prioritas:</span>
                <span className="font-bold text-slate-700">{wo.priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Teknisi:</span>
                <span className="font-semibold text-slate-800">{wo.technicianName || 'Belum Ditugaskan'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pelapor:</span>
                <span className="text-slate-600">{wo.reporterName}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenPrint(wo, wo.status === 'RESOLVED' || wo.status === 'CLOSED' ? 'BAST' : 'SPK')}
                className="h-7 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 px-2.5 gap-1"
              >
                <Printer size={12} className="text-slate-500" />
                <span>{wo.status === 'RESOLVED' || wo.status === 'CLOSED' ? 'BAST' : 'SPK'}</span>
              </Button>
              {wo.status !== 'RESOLVED' && wo.status !== 'CLOSED' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAssign(wo)}
                    className="h-7 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 px-3"
                  >
                    Tugaskan
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleOpenResolve(wo)}
                    className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3"
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
                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        )}
      />

      {/* DRAWER / MODAL TERBITKAN SPK MANUAL */}
      <AdminFormDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Terbitkan Work Order / SPK Baru"
        subtitle="Catat keluhan kerusakan fasilitas atau pemeliharaan preventif kawasan."
        maxWidth="lg"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="h-8.5 text-xs font-semibold">
              Batal
            </Button>
            <Button type="submit" form="form-create-spk" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8.5 text-xs">
              Terbitkan SPK
            </Button>
          </>
        }
      >
        <form id="form-create-spk" onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Judul Kerusakan / Pekerjaan *</label>
            <Input
              value={createForm.title || ''}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Contoh: Perbaikan AC Sentral Gedung Inkubator"
              className="h-9 text-xs sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Nama Fasilitas / Aset *</label>
              <Input
                value={createForm.assetName || ''}
                onChange={(e) => setCreateForm((p) => ({ ...p, assetName: e.target.value }))}
                placeholder="Contoh: AC Daikin 5 PK"
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Prioritas *</label>
              <select
                value={createForm.priority || 'SEDANG'}
                onChange={(e) => setCreateForm((p) => ({ ...p, priority: e.target.value as any }))}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm"
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
              className="w-full h-20 p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-blue-500"
              placeholder="Jelaskan kondisi dan kronologi kerusakan..."
              required
            />
          </div>
        </form>
      </AdminFormDrawer>

      {/* DRAWER / MODAL TUGASKAN TEKNISI */}
      <AdminFormDrawer
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Tugaskan Teknisi Pelaksana"
        subtitle={`SPK: ${selectedOrder?.spkNumber || '-'}`}
        maxWidth="md"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignOpen(false)} className="h-8.5 text-xs font-semibold">
              Batal
            </Button>
            <Button type="submit" form="form-assign-spk" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8.5 text-xs">
              Simpan Penugasan
            </Button>
          </>
        }
      >
        <form id="form-assign-spk" onSubmit={handleAssignSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Nama Teknisi / Tim *</label>
            <Input
              value={assignForm.technicianName}
              onChange={(e) => setAssignForm((p) => ({ ...p, technicianName: e.target.value }))}
              placeholder="Contoh: Budi Santoso (Divisi Mekanikal)"
              className="h-9 text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Nomor Kontak Teknisi</label>
            <Input
              value={assignForm.technicianPhone}
              onChange={(e) => setAssignForm((p) => ({ ...p, technicianPhone: e.target.value }))}
              placeholder="Contoh: 081234567890"
              className="h-9 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Target Tanggal Selesai</label>
            <Input
              type="date"
              value={assignForm.targetCompletionDate}
              onChange={(e) => setAssignForm((p) => ({ ...p, targetCompletionDate: e.target.value }))}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
        </form>
      </AdminFormDrawer>

      {/* DRAWER / MODAL SELESAI (BAST) */}
      <AdminFormDrawer
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        title="Verifikasi Penyelesaian & BAST"
        subtitle={`Tutup pekerjaan untuk SPK: ${selectedOrder?.spkNumber || '-'}`}
        maxWidth="md"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsResolveOpen(false)} className="h-8.5 text-xs font-semibold">
              Batal
            </Button>
            <Button type="submit" form="form-resolve-spk" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8.5 text-xs">
              Sahkan BAST & Selesai
            </Button>
          </>
        }
      >
        <form id="form-resolve-spk" onSubmit={handleResolveSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Laporan Hasil Pengerjaan *</label>
            <textarea
              value={resolveForm.completionNotes}
              onChange={(e) => setResolveForm((p) => ({ ...p, completionNotes: e.target.value }))}
              className="w-full h-20 p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-blue-500"
              placeholder="Jelaskan tindakan perbaikan dan penggantian suku cadang yang telah selesai..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Biaya Riil / Suku Cadang (Rp)</label>
              <Input
                type="number"
                value={resolveForm.actualCost}
                onChange={(e) => setResolveForm((p) => ({ ...p, actualCost: Number(e.target.value) }))}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal BAST</label>
              <Input
                type="date"
                value={resolveForm.bastSignedDate}
                onChange={(e) => setResolveForm((p) => ({ ...p, bastSignedDate: e.target.value }))}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
          </div>
        </form>
      </AdminFormDrawer>

      {/* MODAL PRINT SPK / BAST */}
      <ModalPrintServiceDesk
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        order={printOrder}
        mode={printMode}
      />
    </div>
  );
}

