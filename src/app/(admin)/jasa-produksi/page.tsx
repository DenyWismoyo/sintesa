// Lokasi file: src/app/(admin)/jasa-produksi/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useProduction } from '@/hooks/useProduction';
import { useAdminTab } from '@/hooks/useAdminTab';
import {
  ProductionOrder,
  ProductionStatus,
  ProductionCategory,
  PRODUCTION_STATUS_LABELS,
  PRODUCTION_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS
} from '@/types/production.types';
import {
  AdminPageHeader,
  AdminStatGrid,
  AdminFilterBar,
  AdminResponsiveView,
  AdminMobileCard,
  AdminFormDrawer,
  AdminConfirmDialog,
} from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DialogPageModeProvider } from '@/components/ui/dialog';
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
import { loadStpLogo } from '@/lib/pdf/stpDocumentKit';
import { productionService } from '@/services/production.service';

// Import Modals
import ModalFormProductionOrder from './components/ModalFormProductionOrder';
import ModalProgressLog from './components/ModalProgressLog';
import ModalDeliveryOrder from './components/ModalDeliveryOrder';
import ModalInvoiceProduction from './components/ModalInvoiceProduction';
import ModalPrintSpk from './components/ModalPrintSpk';
import DivisionInvoiceTracker from '@/components/finance/DivisionInvoiceTracker';

const PRODUCTION_TABS = ['ALL', 'DRAFT_ESTIMATION', 'WAITING_DP', 'IN_PRODUCTION', 'QC', 'DELIVERY', 'COMPLETED', 'INVOICES'] as const;
type FilterTab = (typeof PRODUCTION_TABS)[number];

export default function JasaProduksiPage() {
  const { user } = useAuth();
  const { orders, loading, error, refetch, createOrder, updateOrder, deleteOrder } = useProduction();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useAdminTab<FilterTab>('ALL', PRODUCTION_TABS);

  // Modal Control States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);

  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedOrderForProgress, setSelectedOrderForProgress] = useState<ProductionOrder | null>(null);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<ProductionOrder | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<ProductionOrder | null>(null);

  const [isPrintSpkModalOpen, setIsPrintSpkModalOpen] = useState(false);
  const [selectedOrderForSpk, setSelectedOrderForSpk] = useState<ProductionOrder | null>(null);

  const [detailOrder, setDetailOrder] = useState<ProductionOrder | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ProductionOrder | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

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

  // Handler Cetak PDF SPK (Buka Modal Kustomisasi Penandatangan Pegawai STP)
  const handlePrintSpkPdf = (order: ProductionOrder) => {
    setSelectedOrderForSpk(order);
    setIsPrintSpkModalOpen(true);
  };

  // Handler Hapus Order
  const handleDeleteOrder = (order: ProductionOrder) => {
    if (!order.id) return;
    setOrderToDelete(order);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete?.id) return;
    setIsDeletingOrder(true);
    try {
      const res = await deleteOrder(orderToDelete.id);
      if (res.success) {
        toast.success('Pesanan produksi berhasil dihapus.');
        if (detailOrder?.id === orderToDelete.id) setDetailOrder(null);
        setOrderToDelete(null);
      } else {
        toast.error(res.error || 'Gagal menghapus pesanan.');
      }
    } finally {
      setIsDeletingOrder(false);
    }
  };

  return (
    <div className="space-y-6"><div className={(isFormModalOpen || isProgressModalOpen) ? 'hidden' : 'space-y-6'}>
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
        tabs={[
          { id: 'ALL', label: 'Semua Pesanan', badge: orders.length },
          { id: 'DRAFT_ESTIMATION', label: 'Draf & Review' },
          { id: 'WAITING_DP', label: 'Menunggu DP' },
          { id: 'IN_PRODUCTION', label: 'Pengerjaan Bengkel', badge: stats.inProductionCount || undefined },
          { id: 'QC', label: 'Uji Mutu (QC)' },
          { id: 'DELIVERY', label: 'Siap Kirim & DO', badge: stats.readyDeliveryCount || undefined },
          { id: 'COMPLETED', label: 'Selesai Lunas' },
          { id: 'INVOICES', label: '💳 Tagihan Divisi' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as FilterTab)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
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
      <AdminStatGrid
        columns={4}
        items={[
          {
            label: 'Total Pesanan',
            value: stats.totalCount,
            subtext: 'Semua kategori pengerjaan',
            icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'slate',
            onClick: () => setActiveTab('ALL'),
            active: activeTab === 'ALL',
          },
          {
            label: 'Sedang Dikerjakan',
            value: stats.inProductionCount,
            subtext: 'Aktif di bengkel / mesin',
            icon: <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'indigo',
            onClick: () => setActiveTab('IN_PRODUCTION'),
            active: activeTab === 'IN_PRODUCTION',
          },
          {
            label: 'QC & Siap Kirim',
            value: stats.readyDeliveryCount,
            subtext: 'Menunggu Surat Jalan',
            icon: <Truck className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'teal',
            onClick: () => setActiveTab('DELIVERY'),
            active: activeTab === 'DELIVERY',
          },
          {
            label: 'Estimasi Omzet Manufaktur',
            value: formatRupiah(stats.totalOmzet),
            subtext: 'Penerimaan Jasa BLUD',
            icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'emerald',
          },
        ]}
      />

      {/* 3. Filter Bar & Pencarian */}
      {activeTab !== 'INVOICES' && (
        <AdminFilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Cari berdasarkan judul proyek, no SPK, nama pemesan..."
          filters={[
            {
              id: 'category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { label: 'Semua Kategori Mesin', value: 'ALL' },
                ...Object.entries(PRODUCTION_CATEGORY_LABELS).map(([catKey, catLabel]) => ({
                  label: catLabel,
                  value: catKey,
                })),
              ],
            },
          ]}
          hasActiveFilters={Boolean(searchTerm || categoryFilter !== 'ALL' || activeTab !== 'ALL')}
          onReset={() => {
            setSearchTerm('');
            setCategoryFilter('ALL');
            setActiveTab('ALL');
          }}
        />
      )}

      {/* 4. Tabel / Daftar Pesanan ATAU Monitoring Tagihan Divisi */}
      {activeTab === 'INVOICES' ? (
        <DivisionInvoiceTracker
          division="JASA_PRODUKSI"
          title="Monitoring Tagihan & Penagihan Jasa Produksi"
          subtitle="Pantau pembayaran DP, pelunasan akhir, verifikasi bukti transfer, dan sisa piutang pesanan bengkel manufaktur secara mandiri."
        />
      ) : (
        <AdminResponsiveView<ProductionOrder>
          items={filteredOrders}
          isLoading={loading}
          emptyTitle="Tidak ada pesanan produksi ditemukan"
          emptyMessage={
            searchTerm || categoryFilter !== 'ALL' || activeTab !== 'ALL'
              ? 'Coba sesuaikan kata kunci atau bersihkan filter pencarian Anda.'
              : 'Mulai dengan membuat Surat Perintah Kerja (SPK) pengerjaan manufaktur baru.'
          }
          emptyAction={
            !(searchTerm || categoryFilter !== 'ALL' || activeTab !== 'ALL') ? (
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
            ) : undefined
          }
          renderDesktopTable={(items) => (
            <table className="w-full min-w-[760px] text-left text-xs">
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
                {items.map((order) => {
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
          )}
          renderMobileCard={(order) => {
            const statusMeta = PRODUCTION_STATUS_LABELS[order.status] || {
              label: order.status,
              color: 'bg-slate-100 text-slate-700 border-slate-200'
            };
            const paymentMeta = PAYMENT_STATUS_LABELS[order.paymentStatus] || {
              label: order.paymentStatus,
              color: 'bg-slate-100 text-slate-700 border-slate-200'
            };

            return (
              <AdminMobileCard
                title={order.projectTitle}
                subtitle={`${order.clientName} (${order.clientType}) • ${PRODUCTION_CATEGORY_LABELS[order.category] || order.category}`}
                badge={
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.color}`}>
                    {statusMeta.label}
                  </span>
                }
                fields={[
                  { label: 'No. SPK', value: <span className="font-mono text-indigo-700">{order.orderNumber}</span> },
                  { label: 'Nilai SPK', value: <span className="font-mono text-slate-900">{formatRupiah(order.totalCost)}</span> },
                  { label: 'Progres', value: `${order.productionProgress}% (${order.items.length} part)` },
                  { label: 'Target Selesai', value: order.targetDeliveryDate || '-' },
                ]}
                footer={
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${paymentMeta.color}`}>
                      {paymentMeta.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailOrder(order)}
                        className="h-7 text-[11px] font-bold px-2.5"
                      >
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrderForProgress(order);
                          setIsProgressModalOpen(true);
                        }}
                        className="h-7 text-[11px] font-bold text-indigo-600 border-indigo-200 px-2.5"
                      >
                        + Log
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintSpkPdf(order)}
                        className="h-7 text-[11px] font-bold px-2"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                }
              />
            );
          }}
        />
      )}

      {/* 5. Detail Drawer / Dialog Preview */}
      <AdminFormDrawer
        isOpen={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
        title={detailOrder?.projectTitle || 'Detail SPK Produksi'}
        subtitle={detailOrder ? `${detailOrder.orderNumber} • Klien: ${detailOrder.clientName} (${detailOrder.clientType})` : ''}
        maxWidth="xl"
      >
        {detailOrder && (
          <div className="space-y-6 text-xs">
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
        )}
      </AdminFormDrawer>

      {/* 6. Modals & Workspaces */}</div><DialogPageModeProvider backLabel="Kembali ke Daftar SPK" onClosePage={() => { setIsFormModalOpen(false); setEditingOrder(null); }} pageTitle={editingOrder ? `Edit SPK: ${editingOrder.orderNumber}` : 'Penerbitan SPK Jasa Produksi Baru'} badgeText="SPK Builder">
      {/* Modal Form SPK (Create / Edit) */}
      <ModalFormProductionOrder
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={handleSaveOrder}
        initialData={editingOrder}
      /></DialogPageModeProvider><DialogPageModeProvider backLabel="Kembali ke Daftar SPK" onClosePage={() => { setIsProgressModalOpen(false); setSelectedOrderForProgress(null); }} pageTitle={selectedOrderForProgress ? `Log Kemajuan Bengkel: ${selectedOrderForProgress.orderNumber}` : 'Log Kemajuan Bengkel'} badgeText="Workshop Log">

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
      /></DialogPageModeProvider>

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

      {/* Modal Cetak Dokumen SPK Resmi dengan Kustomisasi Penandatangan Pegawai STP */}
      <ModalPrintSpk
        isOpen={isPrintSpkModalOpen}
        onClose={() => {
          setIsPrintSpkModalOpen(false);
          setSelectedOrderForSpk(null);
        }}
        order={selectedOrderForSpk}
      />

      {/* Dialog Konfirmasi Hapus Order */}
      <AdminConfirmDialog
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        title="Hapus Pesanan Produksi?"
        description={`Apakah Anda yakin ingin menghapus pesanan "${orderToDelete?.projectTitle}" (${orderToDelete?.orderNumber})? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Pesanan"
        variant="danger"
        isLoading={isDeletingOrder}
        onConfirm={confirmDeleteOrder}
      />
    </div>
  );
}
