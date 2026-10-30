// src/app/(admin)/manajemen-kemitraan/components/ModalPrintMou.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MouContract } from '@/types/partnership.types';
import { buildPartnershipMouPdf, buildPartnershipDispositionPdf } from '@/lib/pdf/partnershipMouPdf';
import { loadStpLogo } from '@/lib/pdf/stpDocumentKit';
import { stpEmployeeService, StpEmployeeSigner } from '@/services/stpEmployee.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Printer, Handshake, Building2, UserCheck, Calendar, FileText, Loader2, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contract: MouContract | null;
  mode?: 'MOU' | 'DISPOSISI';
}

export default function ModalPrintMou({ isOpen, onClose, contract, mode = 'MOU' }: Props) {
  const [employees, setEmployees] = useState<StpEmployeeSigner[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [docMode, setDocMode] = useState<'MOU' | 'DISPOSISI'>(mode);

  // Signers state
  const [firstPartyName, setFirstPartyName] = useState('Kepala UPTD Kawasan Sains & Teknologi Solo Technopark');
  const [firstPartyRole, setFirstPartyRole] = useState('Kepala UPTD KST Solo Technopark');
  const [firstPartyNip, setFirstPartyNip] = useState('');

  const [secondPartyName, setSecondPartyName] = useState('');
  const [secondPartyRole, setSecondPartyRole] = useState('Pimpinan Berwenang');
  const [secondPartyOrg, setSecondPartyOrg] = useState('');
  const [secondPartyAddress, setSecondPartyAddress] = useState('');

  const [city, setCity] = useState('Surakarta');
  const [signatureDate, setSignatureDate] = useState('');
  const [customScope, setCustomScope] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    setDocMode(mode);
  }, [mode]);

  useEffect(() => {
    if (isOpen && contract) {
      setSecondPartyOrg(contract.partnerName || '');
      setSecondPartyName(contract.picPartnerName || 'Direktur Utama Mitra');
      setSecondPartyRole('Direktur / Pimpinan Mitra');
      setSecondPartyAddress('Kantor Pusat Mitra');
      setCity('Surakarta');
      setSignatureDate(contract.startDate || new Date().toISOString().slice(0, 10));
      setCustomScope(contract.scope || '');
      setCustomNotes(contract.notes || '');

      setIsLoadingEmployees(true);
      stpEmployeeService
        .getEmployees()
        .then((list) => {
          setEmployees(list);
          const head = list.find((e) => (e.rankLevel || 99) <= 2) || list[0];
          if (head) {
            setFirstPartyName(head.nama);
            setFirstPartyRole(head.jabatan);
            if (head.nip) setFirstPartyNip(head.nip);
          }
        })
        .finally(() => setIsLoadingEmployees(false));
    }
  }, [isOpen, contract]);

  const handleSelectOfficial = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFirstPartyName(emp.nama);
      setFirstPartyRole(emp.jabatan);
      if (emp.nip) setFirstPartyNip(emp.nip);
    }
  };

  const handleDownload = async () => {
    if (!contract) return;
    setIsGeneratingPdf(true);
    try {
      const logoBase64 = await loadStpLogo();
      const signers = {
        firstPartyName,
        firstPartyRole,
        firstPartyNip,
        secondPartyName,
        secondPartyRole,
        secondPartyOrg,
        secondPartyAddress,
        city,
        signatureDate,
      };

      const pdf =
        docMode === 'MOU'
          ? buildPartnershipMouPdf({ contract, logoBase64, signers, customScope, customNotes })
          : buildPartnershipDispositionPdf({ contract, logoBase64, signers, customNotes });

      const fileName = `${docMode}_${contract.contractNumber || contract.partnerName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      toast.success(`Dokumen ${docMode} Berhasil Diterbitkan!`, {
        description: `Tersimpan sebagai ${fileName}`,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal membuat dokumen: ' + (err.message || 'Error'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen || !contract) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Handshake size={18} />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                Penerbitan Dokumen Resmi Kemitraan B2B
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Kustomisasi draf MoU / PKS atau Lembar Disposisi sebelum diunduh dan dicetak secara resmi.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Pilihan Mode Dokumen */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setDocMode('MOU')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              docMode === 'MOU'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={13} /> Draf Nota Kesepahaman (MoU / PKS)
          </button>
          <button
            type="button"
            onClick={() => setDocMode('DISPOSISI')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              docMode === 'DISPOSISI'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={13} /> Lembar Disposisi & Telaah Kelayakan
          </button>
        </div>

        <div className="space-y-4 pt-1 text-xs">
          {/* Ringkasan Mitra */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-mono text-indigo-700 font-bold">{contract.contractNumber}</span>
              <span className="font-bold text-slate-700">{contract.agencyType || contract.contractType}</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{contract.partnerName}</p>
            <p className="text-slate-500 text-[11px]">
              PIC: {contract.picPartnerName} ({contract.picPartnerContact}) • Periode:{' '}
              {contract.startDate} s.d. {contract.endDate}
            </p>
          </div>

          {/* Section: Pihak Pertama (STP) */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Building2 size={14} className="text-indigo-600" />
                PIHAK PERTAMA (UPTD KST Solo Technopark)
              </span>
              <select
                onChange={(e) => handleSelectOfficial(e.target.value)}
                className="text-[11px] h-7 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="">-- Pilih Pejabat Penandatangan --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} ({emp.jabatan})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Nama Pejabat</Label>
                <Input
                  value={firstPartyName}
                  onChange={(e) => setFirstPartyName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Jabatan Resmi</Label>
                <Input
                  value={firstPartyRole}
                  onChange={(e) => setFirstPartyRole(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">NIP Pejabat</Label>
                <Input
                  value={firstPartyNip}
                  onChange={(e) => setFirstPartyNip(e.target.value)}
                  className="h-8 text-xs mt-1"
                  placeholder="Contoh: 19800512 200801 1 008"
                />
              </div>
            </div>
          </div>

          {/* Section: Pihak Kedua (Mitra) */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <UserCheck size={14} className="text-emerald-600" />
              PIHAK KEDUA (Calon Mitra Kerjasama)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Nama Lembaga / Perusahaan</Label>
                <Input
                  value={secondPartyOrg}
                  onChange={(e) => setSecondPartyOrg(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Nama Lengkap Pimpinan Mitra</Label>
                <Input
                  value={secondPartyName}
                  onChange={(e) => setSecondPartyName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Jabatan Pimpinan Mitra</Label>
                <Input
                  value={secondPartyRole}
                  onChange={(e) => setSecondPartyRole(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Domisili Kantor Mitra</Label>
                <Input
                  value={secondPartyAddress}
                  onChange={(e) => setSecondPartyAddress(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Ruang Lingkup & Klausul Tambahan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-bold text-slate-700">Kota Penandatanganan</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] font-bold text-slate-700">Tanggal Penandatanganan</Label>
              <Input
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-bold text-slate-700">Fokus Ruang Lingkup Kerjasama</Label>
            <Input
              value={customScope}
              onChange={(e) => setCustomScope(e.target.value)}
              placeholder="Contoh: Penyelenggaraan Pelatihan Vokasi Manufaktur CNC & Rekrutmen Lulusan"
              className="h-8 text-xs mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px] font-bold text-slate-700">Catatan Khusus / Pasal Addendum</Label>
            <Input
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Contoh: Fasilitas pameran disubsidi skema CSR kemitraan."
              className="h-8 text-xs mt-1"
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-xs gap-1.5 shadow-xs"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Membuat Dokumen...</span>
              </>
            ) : (
              <>
                <Printer size={13} />
                <span>Unduh Dokumen {docMode} (PDF)</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

