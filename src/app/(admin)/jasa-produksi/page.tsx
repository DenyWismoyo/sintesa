// Lokasi file: src/app/(admin)/jasa-produksi/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useProduction } from '@/hooks/useProduction';
import {
  ProductionOrder,
  ProductionStatus,
  ProductionCategory,
  PRODUCTION_STATUS_LABELS,
  PRODUCTION_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS
} from '@/types/production.types';
import { AdminPageHeader } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Hammer,
  Plus,
  Search,
  Filter,
  Wrench,
  Truck,
  ReceiptText,
  Printer,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  Calendar,
  ExternalLink,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
  Loader2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/utils/format';
import { buildWorkOrderPdf } from '@/lib/pdf/workOrderPdf';
import { buildDeliveryOrderPdf } from '@/lib/pdf/deliveryOrderPdf';
import { productionService } from '@/services/production.service';

// Import Modals
import ModalFormProductionOrder from './components/ModalFormProductionOrder';
import ModalProgressLog from './components/ModalProgressLog';
import ModalDeliveryOrder from './components/ModalDeliveryOrder';
import ModalInvoiceProduction from './components/ModalInvoiceProduction';

type FilterTab = 'ALL' | 'DRAFT_ESTIMATION' | 'WAITING_DP' | 'IN_PRODUCTION' | 'QC' | 'DELIVERY' | 'COMPLETED';

export default function JasaProduksiPage() {
  const { user } = useAuth();
  const { orders, loading, error, refetch, createOrder, updateOrder, deleteOrder } = useProduction();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  // Modal Control States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);

  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedOrderForProgress, setSelectedOrderForProgress] = useState<ProductionOrder | null>(null);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<ProductionOrder | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<ProductionOrder | null>(null);

  const [detailOrder, setDetailOrder] = useState<ProductionOrder | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Handler Muat Data Demo Manufaktur
  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      toast.info('Menyinkronkan paket data demo manufaktur ke database...');
      const count = await productionService.seedMockOrders();
      toast.success(`Berhasil memuat ${count} pesanan demo manufaktur ke Firestore!`);
      await refetch();
    } catch (err: any) {
      console.error('Gagal seed mock orders:', err);
      toast.error('Gagal memuat data demo: ' + (err.message || err));
    } finally {
      setIsSeeding(false);
    }
  };

  // Perhitungan Ringkasan / Stat Cards
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const inProductionCount = orders.filter((o) => o.status === 'IN_PRODUCTION').length;
    const readyDeliveryCount = orders.filter(
      (o) => o.status === 'QUALITY_CONTROL' || o.status === 'READY_FOR_DELIVERY'
    ).length;
    const totalOmzet = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);

    return { totalCount, inProductionCount, readyDeliveryCount, totalOmzet };
  }, [orders]);

  // Filter List Data
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Filter Tab
      if (activeTab === 'DRAFT_ESTIMATION') {
        if (!['DRAFT', 'ESTIMATION', 'VALIDATION'].includes(order.status)) return false;
      } else if (activeTab === 'WAITING_DP') {
        if (order.status !== 'APPROVED_WAITING_DP') return false;
      } else if (activeTab === 'IN_PRODUCTION') {
        if (order.status !== 'IN_PRODUCTION') return false;
      } else if (activeTab === 'QC') {
        if (order.status !== 'QUALITY_CONTROL') return false;
      } else if (activeTab === 'DELIVERY') {
        if (!['READY_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) return false;
      } else if (activeTab === 'COMPLETED') {
        if (order.status !== 'COMPLETED') return false;
      }

      // 2. Filter Kategori Mesin
      if (categoryFilter !== 'ALL' && order.category !== categoryFilter) {
        return false;
      }

      // 3. Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = order.projectTitle?.toLowerCase().includes(query);
        const matchNumber = order.orderNumber?.toLowerCase().includes(query);
        const matchClient = order.clientName?.toLowerCase().includes(query);
        if (!matchTitle && !matchNumber && !matchClient) return false;
      }

      return true;
    });
  }, [orders, activeTab, categoryFilter, searchTerm]);

  // Handler Buat / Edit Order
  const handleSaveOrder = async (orderData: Omit<ProductionOrder, 'id'>) => {
    if (editingOrder?.id) {
      const res = await updateOrder(editingOrder.id, orderData);
      if (res.success) {
        toast.success('Pesanan produksi berhasil diperbarui.');
        setEditingOrder(null);
        return true;
      } else {
        toast.error(res.error || 'Gagal memperbarui pesanan.');
        return false;
      }
    } else {
      const res = await createOrder(orderData);
      if (res.success) {
        toast.success('Surat Perintah Kerja (SPK) berhasil dibuat!');
        return true;
      } else {
        toast.error(res.error || 'Gagal membuat pesanan produksi.');
        return false;
      }
    }
  };

  // Handler Cetak PDF SPK
  const handlePrintSpkPdf = async (order: ProductionOrder) => {
    try {
      toast.info(`Mempersiapkan dokumen SPK resmi ${order.orderNumber}...`);
      const pdfDoc = buildWorkOrderPdf({ order });
      pdfDoc.save(`SPK_${order.orderNumber.replace(/\//g, '_')}.pdf`);
      toast.success('Dokumen SPK resmi berhasil diunduh.');
    } catch (err: any) {
      console.error('Gagal cetak SPK:', err);
      toast.error('Gagal membuat PDF SPK: ' + err.message);
    }
  };

  // Handler Hapus Order
  const handleDeleteOrder = async (order: ProductionOrder) => {
    if (!order.id) return;
    const confirm = window.confirm(`Apakah Anda yakin ingin menghapus pesanan "${order.projectTitle}" (${order.orderNumber})?`);
    if (!confirm) return;

    const res = await deleteOrder(order.id);
    if (res.success) {
      toast.success('Pesanan produksi berhasil dihapus.');
      if (detailOrder?.id === order.id) setDetailOrder(null);
    } else {
      toast.error(res.error || 'Gagal menghapus pesanan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman */}
      <AdminPageHeader
        title="Jasa Produksi & Manufaktur STP"
        subtitle="Kelola pesanan permesinan, fabrikasi, surat jalan resmi, log kemajuan bengkel, dan integrasi penagihan BLUD."
        breadcrumbs={[{ label: 'Operasional' }, { label: 'Jasa Produksi' }]}
        badge={
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1.5 py-1">
            <Hammer className="w-3.5 h-3.5" />
            <span>{orders.length} Total SPK</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDemoData}
              disabled={isSeeding || loading}
              className="text-xs text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 gap-1.5"
            >
              {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isSeeding ? 'Menyinkronkan...' : 'Muat Data Demo'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="text-xs text-slate-600 gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Segarkan'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingOrder(null);
                setIsFormModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat SPK Produksi</span>
            </Button>
          </div>
        }
      />

      {/* 2. Stat Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Pesanan</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Semua kategori pengerjaan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-indigo-600">Sedang Dikerjakan</p>
              <p className="text-2xl font-bold text-indigo-900 mt-1">{stats.inProductionCount}</p>
              <p className="text-[11px] text-indigo-500 mt-0.5">Aktif di bengkel / mesin</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-100 shadow-sm bg-gradient-to-br from-teal-50/50 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-teal-600">QC & Siap Kirim</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">{stats.readyDeliveryCount}</p>
              <p className="text-[11px] text-teal-500 mt-0.5">Menunggu Surat Jalan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600">Estimasi Omzet Manufaktur</p>
              <p className="text-lg font-extrabold text-emerald-900 mt-1 font-mono">
                {formatRupiah(stats.totalOmzet)}
              </p>
              <p className="text-[11px] text-emerald-500 mt-0.5">Penerimaan Jasa BLUD</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filter Bar & Pencarian */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        {/* Tab Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'Semua Pesanan' },
            { id: 'DRAFT_ESTIMATION', label: 'Draf & Review' },
            { id: 'WAITING_DP', label: 'Menunggu DP' },
            { id: 'IN_PRODUCTION', label: 'Pengerjaan Bengkel' },
            { id: 'QC', label: 'Uji Mutu (QC)' },
            { id: 'DELIVERY', label: 'Siap Kirim & Terkirim' },
            { id: 'COMPLETED', label: 'Selesai Lunas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input Pencarian & Dropdown Kategori */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari berdasarkan judul proyek, no SPK, nama pemesan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              <option value="ALL">Semua Kategori Mesin</option>
              {Object.entries(PRODUCTION_CATEGORY_LABELS).map(([catKey, catLabel]) => (
                <option key={catKey} value={catKey}>
                  {catLabel}
                </option>
              ))}
            </select>

            {(searchTerm || categoryFilter !== 'ALL' || activeTab !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('ALL');
                  setActiveTab('ALL');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 h-9 shrink-0"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabel / Daftar Pesanan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Memuat data pesanan jasa produksi...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Hammer className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada pesanan produksi ditemukan</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || categoryFilter !== 'ALL' || activeTab !== 'ALL'
                ? 'Coba sesuaikan kata kunci atau bersihkan filter pencarian Anda.'
                : 'Mulai dengan membuat Surat Perintah Kerja (SPK) pengerjaan manufaktur baru.'}
            </p>
            {!(searchTerm || categoryFilter !== 'ALL' || activeTab !== 'ALL') && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingOrder(null);
                    setIsFormModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat SPK Produksi Pertama
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSeedDemoData}
                  disabled={isSeeding || loading}
                  className="text-xs text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 gap-1.5"
                >
                  {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isSeeding ? 'Menyinkronkan...' : 'Muat Data Demo Manufaktur'}</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-4">No. SPK & Kategori</th>
                  <th className="p-4">Proyek & Pemesan</th>
                  <th className="p-4">Kemajuan Bengkel</th>
                  <th className="p-4">Status Produksi</th>
                  <th className="p-4">Nilai & Termin</th>
                  <th className="p-4">Target Selesai</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((order) => {
                  const statusMeta = PRODUCTION_STATUS_LABELS[order.status] || {
                    label: order.status,
                    color: 'bg-slate-100 text-slate-700 border-slate-200'
                  };
                  const paymentMeta = PAYMENT_STATUS_LABELS[order.paymentStatus] || {
                    label: order.paymentStatus,
                    color: 'bg-slate-100 text-slate-700 border-slate-200'
                  };

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setDetailOrder(order)}
                    >
                      {/* 1. SPK & Kategori */}
                      <td className="p-4 align-top" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-indigo-700 block text-xs">
                            {order.orderNumber}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {PRODUCTION_CATEGORY_LABELS[order.category] || order.category}
                          </span>
                        </div>
                      </td>

                      {/* 2. Proyek & Pemesan */}
                      <td className="p-4 align-top max-w-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 line-clamp-1">{order.projectTitle}</p>
                          <p className="text-slate-500 text-[11px] flex items-center gap-1">
                            <span>{order.clientName}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-medium text-slate-600">{order.clientType}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {order.items.length} macam part komponen
                          </p>
                        </div>
                      </td>

                      {/* 3. Kemajuan Bengkel */}
                      <td className="p-4 align-top min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700">{order.productionProgress}%</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrderForProgress(order);
                                setIsProgressModalOpen(true);
                              }}
                              className="h-5 px-1.5 text-[10px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                            >
                              + Log
                            </Button>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                order.productionProgress === 100
                                  ? 'bg-emerald-500'
                                  : order.productionProgress > 50
                                  ? 'bg-indigo-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${order.productionProgress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {order.workNotes?.length
                              ? order.workNotes[order.workNotes.length - 1].note
                              : 'Belum ada log kerja'}
                          </p>
                        </div>
                      </td>

                      {/* 4. Status Produksi */}
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusMeta.color}`}
                          >
                            {statusMeta.label}
                          </span>
                          {order.deliveryOrder?.deliveryOrderNumber && (
                            <span className="text-[10px] text-teal-700 font-mono flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {order.deliveryOrder.deliveryOrderNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Nilai & Status Pembayaran */}
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <span className="font-bold font-mono text-slate-900 block">
                            {formatRupiah(order.totalCost)}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${paymentMeta.color}`}
                          >
                            {paymentMeta.label}
                          </span>
                        </div>
                      </td>

                      {/* 6. Target Selesai */}
                      <td className="p-4 align-top text-slate-600">
                        <div className="space-y-0.5 text-[11px]">
                          <span className="flex items-center gap-1 text-slate-700">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {order.targetDeliveryDate || '-'}
                          </span>
                          <span className="text-slate-400 text-[10px] block">
                            Durasi: {order.estimatedDurationDays} hari
                          </span>
                        </div>
                      </td>

                      {/* 7. Dropdown Menu Aksi */}
                      <td className="p-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuLabel>Aksi Pesanan</DropdownMenuLabel>
                            
                            <DropdownMenuItem
                              onClick={() => handlePrintSpkPdf(order)}
                              className="gap-2 cursor-pointer text-indigo-700 font-medium"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Cetak SPK PDF Resmi
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrderForDelivery(order);
                                setIsDeliveryModalOpen(true);
                              }}
                              className="gap-2 cursor-pointer text-teal-700 font-medium"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              {order.deliveryOrder?.deliveryOrderNumber ? 'Surat Jalan (DO)' : 'Terbitkan Surat Jalan'}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrderForInvoice(order);
                                setIsInvoiceModalOpen(true);
                              }}
                              className="gap-2 cursor-pointer text-blue-700 font-medium"
                            >
                              <ReceiptText className="w-3.5 h-3.5" />
                              Terbitkan Tagihan
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrderForProgress(order);
                                setIsProgressModalOpen(true);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Wrench className="w-3.5 h-3.5 text-slate-500" />
                              Update Progres Bengkel
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => {
                                setEditingOrder(order);
                                setIsFormModalOpen(true);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-500" />
                              Edit Rincian Pesanan
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order)}
                              className="gap-2 cursor-pointer text-rose-600 focus:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus Pesanan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Detail Drawer / Dialog Preview */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30">
                  {detailOrder.orderNumber}
                </span>
                <h3 className="text-lg font-bold mt-1 text-white">{detailOrder.projectTitle}</h3>
                <p className="text-xs text-slate-300">
                  Klien: <span className="text-white font-medium">{detailOrder.clientName}</span> ({detailOrder.clientType})
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePrintSpkPdf(detailOrder)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] gap-1.5 h-8"
                >
                  <Printer className="w-3.5 h-3.5" />
                  PDF SPK
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedOrderForDelivery(detailOrder);
                    setIsDeliveryModalOpen(true);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] gap-1.5 h-8"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Surat Jalan
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedOrderForInvoice(detailOrder);
                    setIsInvoiceModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] gap-1.5 h-8"
                >
                  <ReceiptText className="w-3.5 h-3.5" />
                  Invoice
                </Button>
              </div>

              {/* Status & Bengkel */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status Pengerjaan:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-semibold border ${
                      PRODUCTION_STATUS_LABELS[detailOrder.status]?.color
                    }`}
                  >
                    {PRODUCTION_STATUS_LABELS[detailOrder.status]?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kemajuan Produksi:</span>
                  <span className="font-bold text-indigo-700 font-mono">{detailOrder.productionProgress}% Selesai</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Lokasi Workshop:</span>
                  <span className="font-medium text-slate-800">{detailOrder.workshopLocation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Teknisi Penanggung Jawab:</span>
                  <span className="font-medium text-slate-800">{detailOrder.assignedTechnician}</span>
                </div>
              </div>

              {/* Daftar Part / Item */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Daftar Part ({detailOrder.items.length})</span>
                  <span className="text-indigo-700 font-mono">{formatRupiah(detailOrder.totalCost)}</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                  {detailOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-900">
                          {idx + 1}. {item.partName}
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatRupiah(item.totalPrice)}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Material: <span className="text-slate-700 font-medium">{item.material}</span> | Dimensi:{' '}
                        {item.dimensions || '-'} | Qty: {item.quantity} {item.unit}
                      </p>
                      {item.notes && <p className="text-slate-400 text-[10px] italic">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Riwayat Log Pengerjaan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800">Catatan Pengerjaan Lapangan</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrderForProgress(detailOrder);
                      setIsProgressModalOpen(true);
                    }}
                    className="h-6 text-[10px] text-indigo-700 gap-1"
                  >
                    <Plus className="w-3 h-3" /> Catat Progres
                  </Button>
                </div>

                {(!detailOrder.workNotes || detailOrder.workNotes.length === 0) ? (
                  <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada riwayat aktivitas yang dicatat.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {[...detailOrder.workNotes].reverse().map((log) => (
                      <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] border border-indigo-100">
                            {log.percentage}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.date}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{log.note}</p>
                        <p className="text-[10px] text-slate-400 text-right">Oleh: {log.author}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lampiran Gambar Kerja / CAD */}
              {detailOrder.blueprintFiles && detailOrder.blueprintFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800">Lampiran CAD / Blueprint ({detailOrder.blueprintFiles.length})</h4>
                  <div className="space-y-1.5">
                    {detailOrder.blueprintFiles.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between text-indigo-900 transition-colors"
                      >
                        <span className="font-medium truncate max-w-xs">{file.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Modals */}
      {/* Modal Form SPK (Create / Edit) */}
      <ModalFormProductionOrder
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={handleSaveOrder}
        initialData={editingOrder}
      />

      {/* Modal Progres Bengkel */}
      <ModalProgressLog
        isOpen={isProgressModalOpen}
        onClose={() => {
          setIsProgressModalOpen(false);
          setSelectedOrderForProgress(null);
        }}
        order={selectedOrderForProgress}
        onSuccess={() => refetch()}
        currentUserName={user?.displayName || user?.email || 'Teknisi STP'}
      />

      {/* Modal Surat Jalan (Delivery Order) */}
      <ModalDeliveryOrder
        isOpen={isDeliveryModalOpen}
        onClose={() => {
          setIsDeliveryModalOpen(false);
          setSelectedOrderForDelivery(null);
        }}
        order={selectedOrderForDelivery}
        onSuccess={() => refetch()}
      />

      {/* Modal Terbitkan Tagihan (Invoice) */}
      <ModalInvoiceProduction
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedOrderForInvoice(null);
        }}
        order={selectedOrderForInvoice}
        onSuccess={() => refetch()}
        currentUserName={user?.displayName || user?.email || 'Petugas Jasa Produksi'}
      />
    </div>
  );
}
