// src/app/mitra/dokumen/page.tsx
'use client';

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Calendar,
  Clock,
  Printer,
  Download,
  Building2,
  ExternalLink,
  Plus,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { useMyPartnerProfile } from '@/hooks/usePartners';
import { useAllMouContracts } from '@/hooks/useMouContracts';
import { formatTanggal, formatRupiah } from '@/utils/format';
import ModalPrintMou from '@/app/(admin)/manajemen-kemitraan/components/ModalPrintMou';
import { toast } from 'sonner';

export default function MitraDokumenPage() {
  const { user, partnerId } = useAuth();
  const { data: partnerProfile } = useMyPartnerProfile(user?.uid, partnerId);
  const { data: allMous = [], isLoading } = useAllMouContracts();

  // Filter MoU by partner name / ID
  const myMous = allMous.filter((m) => {
    if (partnerProfile?.id && m.partnerId === partnerProfile.id) return true;
    if (partnerProfile?.companyName && m.partnerName.toLowerCase().includes(partnerProfile.companyName.toLowerCase())) return true;
    return false;
  });

  const displayList = myMous.length > 0 ? myMous : allMous.slice(0, 2); // Fallback showcase jika belum ada data spesifik

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const [renewalNotes, setRenewalNotes] = useState('');

  const handlePrint = (contract: any) => {
    setSelectedContract(contract);
    setIsPrintOpen(true);
  };

  const handleSendRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Permohonan Perpanjangan Kerjasama Terkirim!', {
      description: 'Bagian Hukum & Kerjasama UPT Solo Technopark akan menyiapkan adendum dokumen.',
    });
    setIsRenewalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[11px] font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>Legalitas & Administrasi Perjanjian Kerjasama</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Dokumen Nota Kesepahaman (MoU) & PKS
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Arsip digital dokumen kesepakatan formal antara institusi Anda dengan UPT Solo Technopark. Pantau masa aktif perjanjian dan cetak salinan legal kapan pun dibutuhkan.
          </p>
        </div>
        <div>
          <Button
            type="button"
            onClick={() => setIsRenewalOpen(true)}
            className="h-11 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs gap-2 shrink-0 shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
            <span>Ajukan Perpanjangan MoU</span>
          </Button>
        </div>
      </div>

      {/* Dokumen Cards */}
      <div className="space-y-4">
        {displayList.map((doc) => {
          const isExpiring = doc.status === 'EXPIRING_SOON';
          return (
            <div
              key={doc.id}
              className="p-6 bg-white rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] font-bold bg-slate-50">
                    {doc.contractNumber}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-bold ${
                      doc.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : isExpiring
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {doc.status}
                  </Badge>
                  <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 text-[10px] font-bold">
                    {doc.contractType}
                  </Badge>
                </div>

                <h3 className="text-base font-black text-slate-900">{doc.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{doc.scope}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Masa Berlaku: {formatTanggal(doc.startDate)} s.d {formatTanggal(doc.endDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    PIC STP: {doc.picStpName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePrint(doc)}
                  className="rounded-xl text-xs font-bold border-slate-200 gap-1.5 hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Cetak Dokumen */}
      <ModalPrintMou
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        contract={selectedContract}
        mode="MOU"
      />

      {/* Modal Pengajuan Perpanjangan */}
      <Dialog open={isRenewalOpen} onOpenChange={setIsRenewalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-slate-200 bg-white">
          <div className="bg-slate-900 p-6 text-white">
            <DialogTitle className="text-lg font-black">Ajukan Perpanjangan MoU</DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Kirimkan permohonan perpanjangan masa berlaku perjanjian kerjasama.
            </p>
          </div>

          <form onSubmit={handleSendRenewal} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Durasi Perpanjangan yang Diusulkan</label>
              <select className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800">
                <option value="1">1 Tahun Kedepan</option>
                <option value="2">2 Tahun Kedepan</option>
                <option value="3">3 Tahun Kedepan</option>
                <option value="5">5 Tahun Kedepan (Kerjasama Strategis)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Catatan Tambahan / Ruang Lingkup Baru</label>
              <textarea
                rows={3}
                value={renewalNotes}
                onChange={(e) => setRenewalNotes(e.target.value)}
                placeholder="Misal: Penambahan kerjasama pembiayaan beasiswa batch baru dan pemanfaatan fasilitas lab CNC..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenewalOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Kirim Permohonan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

