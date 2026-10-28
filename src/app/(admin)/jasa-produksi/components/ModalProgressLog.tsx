// Lokasi file: src/app/(admin)/jasa-produksi/components/ModalProgressLog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ProductionOrder, WorkProgressLog } from '@/types/production.types';
import { productionService } from '@/services/production.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wrench, Calendar, CheckCircle2, AlertTriangle, User, History } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder | null;
  onSuccess?: () => void;
  currentUserName?: string;
}

export default function ModalProgressLog({
  isOpen,
  onClose,
  order,
  onSuccess,
  currentUserName = 'Teknisi Manufaktur STP'
}: Props) {
  const [percentage, setPercentage] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [author, setAuthor] = useState<string>(currentUserName);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (order) {
      setPercentage(order.productionProgress || 0);
      setDate(new Date().toISOString().split('T')[0]);
      setAuthor(currentUserName || order.assignedTechnician || 'Teknisi Bengkel STP');
      setNote('');
    }
  }, [order, currentUserName, isOpen]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order.id) return;
    if (!note.trim()) {
      toast.error('Harap isi catatan progres / aktivitas pengerjaan');
      return;
    }

    try {
      setIsSubmitting(true);
      const logData: Omit<WorkProgressLog, 'id'> = {
        date,
        percentage,
        note: note.trim(),
        author: author.trim() || 'Teknisi STP',
        createdAt: Date.now()
      };

      await productionService.addProgressLog(order.id, logData, percentage);
      toast.success(`Progres berhasil diperbarui ke ${percentage}%`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Gagal memperbarui progres:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan log progres.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logs = [...(order.workNotes || [])].reverse();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-slate-200">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <Wrench className="w-4 h-4" />
            <span>Manajemen Pengerjaan Bengkel</span>
          </div>
          <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
            <span>Log Progres Produksi</span>
            <span className="text-xs font-mono font-normal bg-indigo-500/20 text-indigo-200 px-2.5 py-1 rounded border border-indigo-400/30">
              {order.orderNumber}
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-sm">
            {order.projectTitle} • Pemesan: <span className="font-medium text-white">{order.clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Form Input Progres Baru */}
          <form id="progress-form" onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Catat Kemajuan Baru
            </h4>

            {/* Slider & Input Persentase */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-700">Persentase Selesai</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={percentage}
                    onChange={(e) => setPercentage(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-20 text-right font-bold text-indigo-700 h-8 text-sm"
                  />
                  <span className="text-sm font-bold text-slate-600">%</span>
                </div>
              </div>
              <input
                type="range"
                value={percentage}
                min={0}
                max={100}
                step={5}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 my-2"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0% Persiapan</span>
                <span>50% Machining/Fabrikasi</span>
                <span>100% Siap QC</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Teknisi / Operator
                </Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Nama teknisi bengkel"
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">
                Catatan Aktivitas / Kendala Lapangan
              </Label>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Selesai proses roughing milling CNC 4-axis, toleransi aman. Lanjut finishing permukaan besok..."
                className="text-xs resize-none"
                required
              />
            </div>

            {percentage === 100 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Progres 100%:</strong> Status pesanan akan otomatis dialihkan ke tahap <strong>Uji Mutu (Quality Control)</strong>.
                </span>
              </div>
            )}
          </form>

          {/* Riwayat Timeline Log Pengerjaan */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Riwayat Pengerjaan ({logs.length})
            </h4>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                Belum ada catatan progres yang disimpan.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-indigo-200 space-y-4 my-2">
                {logs.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Bullet Marker */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 group-hover:scale-125 transition-transform" />
                    
                    <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow transition-shadow">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {log.percentage}%
                          </span>
                          <span className="text-xs font-medium text-slate-700">{log.author}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{log.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{log.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <Button
            type="submit"
            form="progress-form"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Simpan Progres
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
