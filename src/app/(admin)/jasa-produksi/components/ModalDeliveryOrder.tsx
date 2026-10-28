// Lokasi file: src/app/(admin)/jasa-produksi/components/ModalDeliveryOrder.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ProductionOrder, DeliveryOrderInfo } from '@/types/production.types';
import { productionService } from '@/services/production.service';
import { buildDeliveryOrderPdf } from '@/lib/pdf/deliveryOrderPdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Calendar, User, Phone, FileText, CheckCircle2, Loader2, Printer, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder | null;
  onSuccess?: () => void;
}

export default function ModalDeliveryOrder({
  isOpen,
  onClose,
  order,
  onSuccess
}: Props) {
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [driverOrExpedition, setDriverOrExpedition] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (order) {
      if (order.deliveryOrder) {
        setDeliveryDate(order.deliveryOrder.deliveryDate || new Date().toISOString().split('T')[0]);
        setDriverOrExpedition(order.deliveryOrder.driverOrExpedition || '');
        setVehicleNumber(order.deliveryOrder.vehicleNumber || '');
        setRecipientName(order.deliveryOrder.recipientName || order.clientPic || order.clientName);
        setRecipientPhone(order.deliveryOrder.recipientPhone || order.clientPhone || '');
        setDeliveryNotes(order.deliveryOrder.deliveryNotes || '');
      } else {
        setDeliveryDate(new Date().toISOString().split('T')[0]);
        setDriverOrExpedition('Kurir Internal STP');
        setVehicleNumber('AD 1234 XX');
        setRecipientName(order.clientPic || order.clientName || '');
        setRecipientPhone(order.clientPhone || '');
        setDeliveryNotes('Barang telah diperiksa QC, dipacking rapi dalam kondisi baik.');
      }
    }
  }, [order, isOpen]);

  if (!order) return null;

  const isAlreadyIssued = Boolean(order.deliveryOrder?.deliveryOrderNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order.id) return;

    if (!recipientName.trim()) {
      toast.error('Nama penerima / penanggung jawab wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const deliveryPayload: DeliveryOrderInfo = {
        deliveryOrderNumber: order.deliveryOrder?.deliveryOrderNumber || '', // Will be generated if empty
        deliveryDate,
        driverOrExpedition: driverOrExpedition.trim(),
        vehicleNumber: vehicleNumber.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        deliveryNotes: deliveryNotes.trim(),
        createdAt: Date.now()
      };

      const issuedDoNumber = await productionService.issueDeliveryOrder(order.id, deliveryPayload);
      toast.success(`Surat Jalan ${issuedDoNumber} berhasil diterbitkan!`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Gagal menerbitkan Surat Jalan:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memproses Surat Jalan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const activeDeliveryInfo: DeliveryOrderInfo = order.deliveryOrder || {
        deliveryOrderNumber: `SJ/PROD/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/0001`,
        deliveryDate,
        driverOrExpedition,
        vehicleNumber,
        recipientName,
        recipientPhone,
        deliveryNotes
      };

      const pdfDoc = buildDeliveryOrderPdf({ 
        order: { 
          ...order, 
          deliveryOrder: activeDeliveryInfo 
        } 
      });
      pdfDoc.save(`Surat_Jalan_${activeDeliveryInfo.deliveryOrderNumber.replace(/\//g, '_')}.pdf`);
      toast.success('Dokumen Surat Jalan PDF resmi berhasil diunduh.');
    } catch (error: any) {
      console.error('Gagal download PDF Surat Jalan:', error);
      toast.error('Gagal membuat dokumen PDF: ' + error.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-slate-200">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-teal-900 to-emerald-950 text-white">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <Truck className="w-4 h-4" />
            <span>Logistik & Serah Terima Barang</span>
          </div>
          <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
            <span>Surat Jalan Pengiriman (DO)</span>
            {isAlreadyIssued && (
              <span className="text-xs font-mono font-normal bg-teal-500/20 text-teal-200 px-2.5 py-1 rounded border border-teal-400/30">
                {order.deliveryOrder?.deliveryOrderNumber}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-teal-100 text-sm">
            {order.projectTitle} • SPK: <span className="font-mono text-white">{order.orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isAlreadyIssued && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-800">Surat Jalan Resmi Telah Diterbitkan</p>
                  <p className="text-emerald-700 mt-0.5">
                    No: <span className="font-mono font-medium">{order.deliveryOrder?.deliveryOrderNumber}</span> | Tanggal:{' '}
                    {order.deliveryOrder?.deliveryDate}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handlePrintPdf}
                disabled={isGeneratingPdf}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shrink-0"
              >
                {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                Cetak PDF
              </Button>
            </div>
          )}

          <form id="delivery-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal Pengiriman
                </Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" /> Ekspedisi / Kurir Pengantar
                </Label>
                <Input
                  value={driverOrExpedition}
                  onChange={(e) => setDriverOrExpedition(e.target.value)}
                  placeholder="Contoh: Kurir Internal / JNE Cargo / Wahana"
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
                  Nomor Plat Kendaraan / No Resi
                </Label>
                <Input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Contoh: AD 9876 XX / Resi: JNE12345"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Nama Penerima di Tujuan
                </Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama PIC penerima barang"
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Nomor Telepon / HP Penerima
              </Label>
              <Input
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="0812xxxx"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
                Catatan Kondisi Barang / Pengepakan
              </Label>
              <Textarea
                rows={3}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Contoh: Barang dikemas dalam 2 box kayu dengan proteksi bubble wrap. Dilengkapi sertifikat QC dan toleransi dimensi."
                className="text-xs resize-none"
              />
            </div>

            {/* Ringkasan Item yang akan dikirim */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                Part / Komponen yang Diserahterimakan ({order.items.length} item)
              </span>
              <div className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      {idx + 1}. {item.partName} <span className="text-slate-500 font-normal">({item.material})</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Tutup
          </Button>

          <div className="flex items-center gap-2">
            {isAlreadyIssued && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrintPdf}
                disabled={isGeneratingPdf}
                className="text-xs gap-1.5 border-teal-300 text-teal-800 hover:bg-teal-50"
              >
                {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                Unduh PDF
              </Button>
            )}

            <Button
              type="submit"
              form="delivery-form"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5" />
                  {isAlreadyIssued ? 'Perbarui Surat Jalan' : 'Terbitkan Surat Jalan'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
