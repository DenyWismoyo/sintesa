// src/app/(admin)/manajemen-ikm/components/ModalPrintIkmReport.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { IkmStats } from '@/types/ikm.types';
import { buildIkmOfficialReportPdf } from '@/lib/pdf/ikmReportPdf';
import { loadStpLogo } from '@/lib/pdf/stpDocumentKit';
import { stpEmployeeService, StpEmployeeSigner } from '@/services/stpEmployee.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Printer, Award, Building2, UserCheck, Calendar, FileText, Loader2, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: IkmStats | null;
}

export default function ModalPrintIkmReport({ isOpen, onClose, stats }: Props) {
  const [employees, setEmployees] = useState<StpEmployeeSigner[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form State
  const [periodLabel, setPeriodLabel] = useState(`Tahun ${new Date().getFullYear()}`);
  const [headName, setHeadName] = useState('Kepala UPTD Kawasan Sains & Teknologi Solo Technopark');
  const [headRole, setHeadRole] = useState('Pembina Pelayanan Publik BLUD');
  const [headNip, setHeadNip] = useState('');

  const [evaluatorName, setEvaluatorName] = useState('Tim Penjamin Mutu Pelayanan');
  const [evaluatorRole, setEvaluatorRole] = useState('Ketua Tim Evaluasi IKM');

  const [city, setCity] = useState('Surakarta');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().slice(0, 10));
  const [analysisNotes, setAnalysisNotes] = useState(
    'Nilai Indeks Kepuasan Masyarakat berada dalam rentang mutu prima dengan respon tertinggi pada fasilitas dan keramahan petugas.'
  );
  const [actionPlan, setActionPlan] = useState(
    'Peningkatan kecepatan tindak lanjut aduan teknis pada service desk dan digitalisasi tanda terima kas.'
  );

  useEffect(() => {
    if (isOpen) {
      setIsLoadingEmployees(true);
      stpEmployeeService
        .getEmployees()
        .then((list) => {
          setEmployees(list);
          const head = list.find((e) => (e.rankLevel || 99) <= 2) || list[0];
          if (head) {
            setHeadName(head.nama);
            setHeadRole(head.jabatan);
            if (head.nip) setHeadNip(head.nip);
          }
        })
        .finally(() => setIsLoadingEmployees(false));
    }
  }, [isOpen]);

  const handleSelectOfficial = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setHeadName(emp.nama);
      setHeadRole(emp.jabatan);
      if (emp.nip) setHeadNip(emp.nip);
    }
  };

  const handleDownload = async () => {
    if (!stats) return;
    setIsGeneratingPdf(true);
    try {
      const logoBase64 = await loadStpLogo();
      const signers = {
        headName,
        headRole,
        headNip,
        evaluatorName,
        evaluatorRole,
        city,
        signatureDate,
        periodLabel,
        analysisNotes,
        actionPlan,
      };

      const pdf = buildIkmOfficialReportPdf({ stats, logoBase64, signers });
      const fileName = `Laporan_Resmi_IKM_${periodLabel.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      toast.success('Laporan Resmi IKM Berhasil Diterbitkan!', {
        description: `Tersimpan sebagai ${fileName}`,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mencetak laporan: ' + (err.message || 'Error'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen || !stats) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                Cetak Laporan Resmi IKM (PermenPAN-RB No. 14/2017)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Ekspor hasil evaluasi 9 unsur mutu pelayanan ke format dokumen akreditasi resmi Pemda & KemenPAN-RB.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-xs">
          {/* Ringkasan Skor Terkini */}
          <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                Indeks Kepuasan Masyarakat (IKM)
              </p>
              <p className="text-lg font-black text-slate-900">
                {stats.convertedScore.toFixed(2)}{' '}
                <span className="text-xs font-bold text-emerald-600">({stats.gradeLabel})</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Total Responden Terverifikasi</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {stats.totalRespondents} Orang
              </span>
            </div>
          </div>

          {/* Form Periode & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <Label className="text-[11px] font-bold text-slate-700">Periode Survei / Tahun</Label>
              <Input
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="Contoh: Triwulan IV 2026"
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] font-bold text-slate-700">Kota Pengesahan</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] font-bold text-slate-700">Tanggal Laporan</Label>
              <Input
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          {/* Pengesahan Pimpinan UPTD */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Building2 size={14} className="text-sky-600" />
                Pejabat Pembina Pelayanan Publik (Pimpinan UPTD)
              </span>
              <select
                onChange={(e) => handleSelectOfficial(e.target.value)}
                className="text-[11px] h-7 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="">-- Pilih dari Pegawai STP --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} ({emp.jabatan})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Nama Lengkap</Label>
                <Input
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Jabatan Dinas</Label>
                <Input
                  value={headRole}
                  onChange={(e) => setHeadRole(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">NIP Pejabat</Label>
                <Input
                  value={headNip}
                  onChange={(e) => setHeadNip(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Tim Evaluasi & Pengendali Mutu */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <UserCheck size={14} className="text-emerald-600" />
              Penyusun / Tim Pengendali Mutu Pelayanan
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Nama Tim / Ketua</Label>
                <Input
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Kedudukan Tim</Label>
                <Input
                  value={evaluatorRole}
                  onChange={(e) => setEvaluatorRole(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Analisis & Rencana Tindak Lanjut */}
          <div>
            <Label className="text-[11px] font-bold text-slate-700">Catatan Analisis Kekuatan & Kelemahan</Label>
            <textarea
              rows={2}
              value={analysisNotes}
              onChange={(e) => setAnalysisNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <Label className="text-[11px] font-bold text-slate-700">Rencana Tindak Lanjut Prioritas (Action Plan)</Label>
            <textarea
              rows={2}
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={isGeneratingPdf}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold h-8 text-xs gap-1.5 shadow-xs"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Menyusun Laporan PDF...</span>
              </>
            ) : (
              <>
                <Printer size={13} />
                <span>Cetak Laporan PermenPAN-RB (PDF)</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

