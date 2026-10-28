// Lokasi file: src/app/(admin)/jasa-produksi/components/ModalInvoiceProduction.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ProductionOrder } from '@/types/production.types';
import { Invoice, InvoiceItem } from '@/types/finance.types';
import { billingService } from '@/services/billing.service';
import { productionService } from '@/services/production.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ReceiptText, Calendar, DollarSign, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder | null;
  onSuccess?: () => void;
  currentUserName?: string;
}

export default function ModalInvoiceProduction({
  isOpen,
  onClose,
  order,
  onSuccess,
  currentUserName = 'Petugas Loket BLUD'
}: Props) {
  const [invoiceType, setInvoiceType] = useState<'DP' | 'FULL'>('DP');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (order) {
      // Default: Jika pesanan sudah bayar DP, arahkan otomatis ke Pelunasan
      if (order.paymentStatus === 'DP_PAID') {
        setInvoiceType('FULL');
      } else {
        setInvoiceType(order.dpPercentage > 0 ? 'DP' : 'FULL');
      }

      // Default due date: 7 hari ke depan
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().split('T')[0]);

      setNotes(`Tagihan layanan jasa manufaktur & fabrikasi SPK ${order.orderNumber} - ${order.projectTitle}`);
    }
  }, [order, isOpen]);

  if (!order) return null;

  // Hitung Nilai Tagihan
  const totalOrderAmount = order.totalCost || 0;
  const dpPercentage = order.dpPercentage || 30;
  const dpAmount = Math.round((totalOrderAmount * dpPercentage) / 100);
  const remainingAmount = order.paymentStatus === 'DP_PAID' ? Math.max(0, totalOrderAmount - dpAmount) : totalOrderAmount;

  const billAmount = invoiceType === 'DP' ? dpAmount : (order.paymentStatus === 'DP_PAID' ? remainingAmount : totalOrderAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order.id) return;

    if (billAmount <= 0) {
      toast.error('Nilai tagihan tidak valid (Rp 0). Harap periksa rincian biaya pesanan.');
      return;
    }

    try {
      setIsSubmitting(true);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randNum = Math.floor(1000 + Math.random() * 9000);
      
      const invPrefix = invoiceType === 'DP' ? 'INV/PROD/DP' : 'INV/PROD/LUNAS';
      const invoiceNumber = `${invPrefix}/${dateStr}/${randNum}`;

      const itemDesc = invoiceType === 'DP' 
        ? `Uang Muka (DP ${dpPercentage}%) - ${order.projectTitle}`
        : (order.paymentStatus === 'DP_PAID' 
            ? `Pelunasan Akhir (Sisa ${100 - dpPercentage}%) - ${order.projectTitle}` 
            : `Pembayaran Penuh (100%) - ${order.projectTitle}`);

      const invoiceItem: InvoiceItem = {
        id: `PROD-${Date.now()}`,
        referenceId: order.id,
        referenceType: 'PRODUCTION',
        description: itemDesc,
        subDescription: `Nomor SPK: ${order.orderNumber} | Kategori: ${order.category}`,
        unit: 'Paket Pekerjaan',
        quantity: 1,
        unitPrice: billAmount,
        total: billAmount
      };

      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber,
        customerName: order.clientName,
        customerType: order.clientType === 'Internal_STP' ? 'Tenant' : 'Umum',
        customerEmail: order.clientEmail || '',
        customerPhone: order.clientPhone || '',
        items: [invoiceItem],
        subTotal: billAmount,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: billAmount,
        paidAmount: 0,
        remainingAmount: billAmount,
        term: invoiceType === 'DP' ? 'DOWN_PAYMENT' : 'FULL_PAYMENT',
        date: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        status: 'PENDING',
        issuerName: currentUserName,
        issuerRole: 'Petugas Jasa Produksi',
        issuerNIP: '-',
        notes: notes.trim(),
        history: []
      };

      const newInvId = await billingService.createInvoice(invoiceData);

      // Sinkronkan ID invoice ke record pesanan produksi
      if (invoiceType === 'DP') {
        await productionService.updateProductionOrder(order.id, {
          dpInvoiceId: newInvId,
          status: order.status === 'DRAFT' || order.status === 'ESTIMATION' ? 'APPROVED_WAITING_DP' : order.status
        });
      } else {
        await productionService.updateProductionOrder(order.id, {
          finalInvoiceId: newInvId
        });
      }

      toast.success(`Tagihan ${invoiceNumber} senilai ${formatRupiah(billAmount)} berhasil diterbitkan!`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Gagal menerbitkan invoice:', error);
      toast.error(error.message || 'Gagal menerbitkan tagihan keuangan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden shadow-2xl border-slate-200">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <ReceiptText className="w-4 h-4" />
            <span>Integrasi Billing & Keuangan BLUD</span>
          </div>
          <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
            <span>Terbitkan Tagihan (Invoice)</span>
            <span className="text-xs font-mono font-normal bg-blue-500/20 text-blue-200 px-2.5 py-1 rounded border border-blue-400/30">
              {order.orderNumber}
            </span>
          </DialogTitle>
          <DialogDescription className="text-blue-100 text-sm">
            Klien: <span className="font-semibold text-white">{order.clientName}</span> ({order.clientType})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Opsi Jenis Tagihan */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700">Pilih Termin Tagihan</Label>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  invoiceType === 'DP'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setInvoiceType('DP')}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${invoiceType === 'DP' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                  {invoiceType === 'DP' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">
                    Uang Muka (DP {dpPercentage}%)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Syarat mulai produksi</p>
                  <p className="text-xs font-bold text-indigo-700 mt-1 font-mono">
                    {formatRupiah(dpAmount)}
                  </p>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  invoiceType === 'FULL'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setInvoiceType('FULL')}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${invoiceType === 'FULL' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                  {invoiceType === 'FULL' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">
                    {order.paymentStatus === 'DP_PAID' ? 'Pelunasan Akhir' : 'Lunas Penuh (100%)'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {order.paymentStatus === 'DP_PAID' ? `Sisa ${100 - dpPercentage}% biaya` : 'Tanpa termin DP'}
                  </p>
                  <p className="text-xs font-bold text-indigo-700 mt-1 font-mono">
                    {formatRupiah(order.paymentStatus === 'DP_PAID' ? remainingAmount : totalOrderAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kotak Rincian Pembayaran */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Estimasi Biaya Pekerjaan:</span>
              <span className="font-bold text-slate-900 font-mono">{formatRupiah(totalOrderAmount)}</span>
            </div>
            {order.paymentStatus === 'DP_PAID' && (
              <div className="flex justify-between text-emerald-600">
                <span>DP yang telah dibayar:</span>
                <span className="font-bold font-mono">-{formatRupiah(dpAmount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-800">Nominal Invoice yang Diterbitkan:</span>
              <span className="text-base font-extrabold text-blue-700 font-mono">
                {formatRupiah(billAmount)}
              </span>
            </div>
          </div>

          {/* Jatuh Tempo */}
          <div>
            <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal Jatuh Tempo Pembayaran
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          {/* Catatan / Keterangan Tagihan */}
          <div>
            <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
              Catatan Tagihan untuk Klien
            </Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
              placeholder="Keterangan transfer atau instruksi pembayaran..."
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Invoice ini akan langsung tercatat di <strong>Buku Kas & Billing Keuangan</strong> dan otomatis tercatat di Jurnal Pembukuan saat dibayar.
            </span>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || billAmount <= 0}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menerbitkan...
                </>
              ) : (
                <>
                  <ReceiptText className="w-3.5 h-3.5" />
                  Terbitkan Tagihan Sekarang
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
