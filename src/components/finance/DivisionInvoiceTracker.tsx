// Lokasi file: src/components/finance/DivisionInvoiceTracker.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useBilling } from '@/hooks/useBilling';
import { Invoice, InvoiceDivision, inferInvoiceDivision, INVOICE_DIVISION_CONFIG } from '@/types';
import { formatRupiah } from '@/utils/format';
import { 
  Receipt, Clock, CheckCircle2, AlertCircle, Search, 
  ExternalLink, Copy, Eye, FileText, ChevronRight, Loader2, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ModalInvoiceDetail from '@/app/(admin)/billing/component/ModalInvoiceDetail';
import PrintKwitansiLayout, { downloadKwitansiPDF } from '@/app/(admin)/billing/component/PrintKwitansiLayout';
import Link from 'next/link';

interface Props {
  division: InvoiceDivision;
  title?: string;
  subtitle?: string;
  refFilter?: string;
  compact?: boolean;
}

export default function DivisionInvoiceTracker({
  division,
  title,
  subtitle,
  refFilter,
  compact = false
}: Props) {
  const { invoices, loading, refetch } = useBilling();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const divConfig = INVOICE_DIVISION_CONFIG[division];

  // Filter invoice sesuai divisi ini
  const divisionInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const invDiv = inv.division || inferInvoiceDivision(inv);
      if (invDiv !== division) return false;

      // Filter jika ada refFilter spesifik (misal nomor SPK)
      if (refFilter) {
        const matchRef = (inv.divisionRefNumber || '').toLowerCase().includes(refFilter.toLowerCase()) ||
                         inv.notes?.toLowerCase().includes(refFilter.toLowerCase()) ||
                         (inv.items && inv.items.some(i => (i.subDescription || '').toLowerCase().includes(refFilter.toLowerCase())));
        if (!matchRef) return false;
      }

      // Filter Status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'VERIFYING') {
          return inv.history?.some((h: any) => h.status === 'PENDING');
        }
        if (inv.status !== statusFilter) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNumber = (inv.invoiceNumber || '').toLowerCase().includes(q);
        const matchCustomer = (inv.customerName || '').toLowerCase().includes(q);
        const matchNotes = (inv.notes || '').toLowerCase().includes(q);
        const matchItem = inv.items && inv.items.some(it => (it.description || '').toLowerCase().includes(q));
        if (!matchNumber && !matchCustomer && !matchNotes && !matchItem) return false;
      }

      return true;
    });
  }, [invoices, division, refFilter, statusFilter, searchTerm]);

  // Statistik Ringkas Keuangan Divisi
  const stats = useMemo(() => {
    const allDivInvoices = invoices.filter(inv => (inv.division || inferInvoiceDivision(inv)) === division);
    const totalAmount = allDivInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const paidAmount = allDivInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const outstandingAmount = allDivInvoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
    const pendingProofCount = allDivInvoices.filter(inv => inv.history?.some((h: any) => h.status === 'PENDING')).length;

    return { totalAmount, paidAmount, outstandingAmount, pendingProofCount, totalCount: allDivInvoices.length };
  }, [invoices, division]);

  const handleOpenDetail = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsDetailOpen(true);
  };

  const handleCopyPaymentLink = (inv: Invoice) => {
    if (!inv.paymentUrl) {
      toast.info('Tautan pembayaran online belum dibuat.');
      return;
    }
    navigator.clipboard.writeText(inv.paymentUrl);
    toast.success('Tautan pembayaran berhasil disalin ke clipboard.');
  };

  const renderStatusBadge = (inv: Invoice) => {
    switch (inv.status) {
      case 'PAID':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3" /> Lunas</Badge>;
      case 'PARTIAL':
        const pct = Math.round(((inv.paidAmount || 0) / (inv.totalAmount || 1)) * 100);
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 hover:bg-blue-100"><Clock className="w-3 h-3" /> Cicilan / DP ({pct}%)</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 hover:bg-amber-100"><Clock className="w-3 h-3" /> Menunggu Bayar</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-50 text-red-700 border-red-200 gap-1 hover:bg-red-100"><AlertCircle className="w-3 h-3" /> Jatuh Tempo</Badge>;
      default:
        return <Badge variant="outline">{inv.status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Summary Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${divConfig.badgeClass}`}>
                {divConfig.label}
              </span>
              <h3 className="font-black text-slate-800 text-base">
                {title || `Monitoring Tagihan & Penagihan`}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle || `Pantau status pembayaran DP, pelunasan, kwitansi, dan piutang khusus layanan ${divConfig.shortLabel}.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="text-xs h-8 gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Segarkan'}
            </Button>
            <Link href="/billing">
              <Button size="sm" variant="default" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 gap-1.5">
                <span>Buka Billing Terpadu</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Kartu Mini Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Omzet Tagihan</p>
            <p className="text-base sm:text-lg font-black text-slate-800 mt-0.5">{formatRupiah(stats.totalAmount)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stats.totalCount} Dokumen Tagihan</p>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Kas Masuk (Terbayar)</p>
            <p className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">{formatRupiah(stats.paidAmount)}</p>
            <p className="text-[10px] text-emerald-600/80 mt-0.5">
              {stats.totalAmount > 0 ? `${Math.round((stats.paidAmount / stats.totalAmount) * 100)}% Realisasi` : '0%'}
            </p>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Piutang Belum Lunas</p>
            <p className="text-base sm:text-lg font-black text-amber-700 mt-0.5">{formatRupiah(stats.outstandingAmount)}</p>
            <p className="text-[10px] text-amber-600/80 mt-0.5">Menunggu Pembayaran</p>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Verifikasi Bukti</p>
            <p className="text-base sm:text-lg font-black text-indigo-700 mt-0.5">{stats.pendingProofCount} Berkas</p>
            <p className="text-[10px] text-indigo-600/80 mt-0.5">Bukti Transfer Masuk</p>
          </div>
        </div>
      </div>

      {/* 2. Toolbar Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Cari no invoice / pemesan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">Semua Status Tagihan</option>
            <option value="VERIFYING">Ada Bukti Transfer (Verifikasi)</option>
            <option value="PAID">Lunas (Paid)</option>
            <option value="PARTIAL">Cicilan / DP (Partial)</option>
            <option value="PENDING">Menunggu Bayar (Pending)</option>
            <option value="OVERDUE">Jatuh Tempo (Overdue)</option>
          </select>
        </div>
      </div>

      {/* 3. Daftar Tabel Tagihan Divisi */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {divisionInvoices.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-600">Tidak ada data tagihan yang sesuai kriteria.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Terbitkan invoice dari menu operasional untuk memulainya.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">No. Tagihan & Referensi</th>
                  <th className="px-4 py-3">Pemesan / Klien</th>
                  <th className="px-4 py-3">Rincian Layanan</th>
                  <th className="px-4 py-3 text-right">Total Tagihan</th>
                  <th className="px-4 py-3 text-right">Terbayar / Sisa</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {divisionInvoices.map((inv) => {
                  const hasPendingProof = inv.history?.some((h: any) => h.status === 'PENDING');
                  const firstItem = inv.items && inv.items.length > 0 ? inv.items[0] : null;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 align-top">
                        <div className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</div>
                        {inv.divisionRefNumber && (
                          <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                            Ref: {inv.divisionRefNumber}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">Tgl: {inv.date}</div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="font-semibold text-slate-800">{inv.customerName}</div>
                        <div className="text-[10px] text-slate-400">{inv.customerPhone || inv.customerEmail || '-'}</div>
                      </td>

                      <td className="px-4 py-3 align-top max-w-xs">
                        <div className="font-medium text-slate-700 truncate">{firstItem?.description || '-'}</div>
                        {firstItem?.subDescription && (
                          <div className="text-[10px] text-slate-400 truncate">{firstItem.subDescription}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top text-right font-bold text-slate-800">
                        {formatRupiah(inv.totalAmount)}
                      </td>

                      <td className="px-4 py-3 align-top text-right">
                        <div className="font-bold text-emerald-600">{formatRupiah(inv.paidAmount || 0)}</div>
                        {(inv.remainingAmount || 0) > 0 && (
                          <div className="text-[10px] font-semibold text-amber-600">
                            Sisa: {formatRupiah(inv.remainingAmount)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top text-center">
                        <div className="flex flex-col items-center gap-1">
                          {renderStatusBadge(inv)}
                          {hasPendingProof && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                              Bukti Masuk
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(inv)}
                            className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Lihat Detail Tagihan"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Detail</span>
                          </Button>

                          {inv.paymentUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPaymentLink(inv)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                              title="Salin Tautan Bayar"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal Detail Tagihan Terpadu */}
      {selectedInvoice && (
        <ModalInvoiceDetail
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onEdit={() => {}}
          onDelete={() => {}}
          onRecordPayment={() => {}}
          onAllocateBAS={() => {}}
        />
      )}
    </div>
  );
}
