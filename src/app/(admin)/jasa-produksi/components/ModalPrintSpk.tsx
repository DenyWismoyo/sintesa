// Lokasi file: src/app/(admin)/jasa-produksi/components/ModalPrintSpk.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ProductionOrder } from '@/types/production.types';
import { buildWorkOrderPdf } from '@/lib/pdf/workOrderPdf';
import { loadStpLogo } from '@/lib/pdf/stpDocumentKit';
import { stpEmployeeService, StpEmployeeSigner } from '@/services/stpEmployee.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Printer, UserCheck, ShieldCheck, Wrench, Building2, Calendar, MapPin, Loader2, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder | null;
}

export default function ModalPrintSpk({ isOpen, onClose, order }: Props) {
  const [employees, setEmployees] = useState<StpEmployeeSigner[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // State Form Kustomisasi Penandatangan
  const [selectedIssuerEmpId, setSelectedIssuerEmpId] = useState<string>('');
  const [issuerName, setIssuerName] = useState('');
  const [issuerRole, setIssuerRole] = useState('Kepala Divisi Layanan Manufaktur & Jasa Produksi');
  const [issuerNip, setIssuerNip] = useState('');

  const [selectedTechEmpId, setSelectedTechEmpId] = useState<string>('');
  const [technicianName, setTechnicianName] = useState('');
  const [technicianRole, setTechnicianRole] = useState('Penanggung Jawab Teknis Workshop STP');

  const [clientPic, setClientPic] = useState('');
  const [clientRole, setClientRole] = useState('Pemesan / Klien');

  const [city, setCity] = useState('Surakarta');
  const [signatureDate, setSignatureDate] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  // Inisialisasi Data saat Modal Dibuka
  useEffect(() => {
    if (isOpen && order) {
      // 1. Muat default signers yang tersimpan
      const defaults = stpEmployeeService.getDefaultSigners();
      setIssuerName(defaults.issuerName);
      setIssuerRole(defaults.issuerRole);
      setIssuerNip(defaults.issuerNip);
      setTechnicianName(order.assignedTechnician || defaults.technicianName);
      setTechnicianRole(defaults.technicianRole);
      setClientPic(order.clientPic || order.clientName || '');
      setCity(defaults.city || 'Surakarta');
      setSignatureDate(new Date().toISOString().slice(0, 10));

      // 2. Ambil data pegawai dari presensi STP
      setIsLoadingEmployees(true);
      stpEmployeeService
        .getEmployees()
        .then((list) => {
          setEmployees(list);
          // Auto-select jika ada yang cocok dengan issuerName
          const matchIssuer = list.find((e) => e.nama.toLowerCase() === defaults.issuerName.toLowerCase());
          if (matchIssuer) setSelectedIssuerEmpId(matchIssuer.id);

          const matchTech = list.find((e) => e.nama.toLowerCase() === (order.assignedTechnician || defaults.technicianName).toLowerCase());
          if (matchTech) setSelectedTechEmpId(matchTech.id);
        })
        .finally(() => setIsLoadingEmployees(false));
    }
  }, [isOpen, order]);

  // Handler Pilih Pegawai untuk Pejabat Penerbit
  const handleSelectIssuerEmployee = (empId: string) => {
    setSelectedIssuerEmpId(empId);
    if (!empId) return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setIssuerName(emp.nama);
      if (emp.jabatan) setIssuerRole(emp.jabatan);
      if (emp.nip) setIssuerNip(emp.nip);
    }
  };

  // Handler Pilih Pegawai untuk Teknisi Pelaksana
  const handleSelectTechEmployee = (empId: string) => {
    setSelectedTechEmpId(empId);
    if (!empId) return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setTechnicianName(emp.nama);
      if (emp.jabatan) setTechnicianRole(emp.jabatan);
    }
  };

  // Handler Cetak PDF
  const handleDownloadPdf = async () => {
    if (!order) return;
    try {
      setIsGeneratingPdf(true);
      toast.info(`Mempersiapkan dokumen SPK ${order.orderNumber}...`);

      // 1. Simpan default jika dicentang
      if (saveAsDefault) {
        stpEmployeeService.saveDefaultSigners({
          issuerName,
          issuerRole,
          issuerNip,
          technicianName,
          technicianRole,
          city
        });
      }

      // 2. Muat logo resmi Solo Technopark
      const logo = await loadStpLogo();

      // 3. Bangun dokumen PDF dengan data penandatangan kustom
      const pdfDoc = buildWorkOrderPdf({
        order,
        logoBase64: logo,
        signers: {
          issuerSigner: {
            name: issuerName,
            role: issuerRole,
            nip: issuerNip || undefined
          },
          technicianSigner: {
            name: technicianName,
            role: technicianRole
          },
          clientSigner: {
            name: clientPic,
            role: clientRole,
            sub: order.clientName
          },
          city,
          signatureDate
        }
      });

      pdfDoc.save(`SPK_${order.orderNumber.replace(/\//g, '_')}.pdf`);
      toast.success('Dokumen SPK resmi dengan penandatangan kustom berhasil diunduh!');
      onClose();
    } catch (err: any) {
      console.error('Gagal membuat PDF SPK:', err);
      toast.error('Gagal membuat PDF SPK: ' + (err.message || err));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isGeneratingPdf && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border-slate-200">
        {/* Header Modal */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <Printer className="w-4 h-4" />
            <span>Kustomisasi Penandatangan Dokumen SPK</span>
          </div>
          <DialogTitle className="text-xl font-black tracking-tight text-white flex items-center justify-between">
            <span>Cetak SPK Resmi Manufaktur</span>
            <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-md text-indigo-200 border border-white/10">
              {order.orderNumber}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            Pilih pejabat dan teknisi dari database pegawai presensi STP atau ketik manual nama & jabatan penandatangan.
          </DialogDescription>
        </DialogHeader>

        {/* Isi Form */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 max-h-[calc(92vh-150px)]">
          {/* 1. SEKSI PEJABAT PENERBIT STP */}
          <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Pihak 1: Pejabat Penerbit SPK (Solo Technopark)</span>
              </div>
              <span className="text-[10px] text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
                Dilengkapi Stempel Dinas
              </span>
            </div>

            {/* Dropdown Pegawai Presensi STP */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                <span>Pilih Cepat dari Pegawai Presensi STP:</span>
                {isLoadingEmployees && <span className="text-slate-400 font-normal">Memuat pegawai...</span>}
              </Label>
              <select
                value={selectedIssuerEmpId}
                onChange={(e) => handleSelectIssuerEmployee(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Pilih dari database pegawai presensi STP --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} - {emp.jabatan} ({emp.departmentName})
                  </option>
                ))}
              </select>
            </div>

            {/* Input Manual Pejabat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Nama Lengkap & Gelar Pejabat</Label>
                <Input
                  value={issuerName}
                  onChange={(e) => setIssuerName(e.target.value)}
                  placeholder="Contoh: Agus Jatmiko, S.Kom"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">NIP / NIK Pejabat (Opsional)</Label>
                <Input
                  value={issuerNip}
                  onChange={(e) => setIssuerNip(e.target.value)}
                  placeholder="Contoh: 19850715 201001 1 012"
                  className="h-8 text-xs bg-white font-mono"
                />
              </div>
              <div className="col-span-full space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Jabatan Kedinasan</Label>
                <Input
                  value={issuerRole}
                  onChange={(e) => setIssuerRole(e.target.value)}
                  placeholder="Contoh: Kepala Divisi Layanan Manufaktur & Jasa Produksi"
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. SEKSI PELAKSANA TEKNIS WORKSHOP */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <Wrench className="w-4 h-4 text-slate-700" />
              <span>Pihak 2: Pelaksana Teknis / Penanggung Jawab Workshop</span>
            </div>

            {/* Dropdown Pegawai Teknisi */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-700">Pilih dari Teknisi Presensi STP:</Label>
              <select
                value={selectedTechEmpId}
                onChange={(e) => handleSelectTechEmployee(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-medium"
              >
                <option value="">-- Pilih dari database teknisi presensi STP --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} - {emp.jabatan}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Nama Teknisi / Machinist</Label>
                <Input
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="Contoh: Agus Santoso, S.T."
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Peran / Jabatan Teknis</Label>
                <Input
                  value={technicianRole}
                  onChange={(e) => setTechnicianRole(e.target.value)}
                  placeholder="Contoh: Penanggung Jawab Teknis Workshop STP"
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. SEKSI PEMESAN & PARAMETER TANGGAL */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <Building2 className="w-4 h-4 text-slate-700" />
              <span>Pihak 3: Pemesan & Tempat / Tanggal Tanda Tangan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Nama PIC Pemesan</Label>
                <Input
                  value={clientPic}
                  onChange={(e) => setClientPic(e.target.value)}
                  placeholder="Nama Penandatangan Pihak Pemesan"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Keterangan Jabatan Pemesan</Label>
                <Input
                  value={clientRole}
                  onChange={(e) => setClientRole(e.target.value)}
                  placeholder="Contoh: Direktur Operasional / Pemesan"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Kota Penerbitan
                </Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Surakarta"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Tanggal Tanda Tangan
                </Label>
                <Input
                  type="date"
                  value={signatureDate}
                  onChange={(e) => setSignatureDate(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Opsi Simpan sebagai Default */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="saveDefaultCheck"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="saveDefaultCheck" className="text-xs text-slate-600 cursor-pointer select-none">
              Simpan pejabat & teknisi ini sebagai penandatangan default untuk pesanan berikutnya
            </label>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <DialogFooter className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isGeneratingPdf}
            className="text-xs"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || !issuerName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 shadow-sm px-4"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyusun Dokumen PDF...</span>
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5" />
                <span>Unduh Dokumen SPK (PDF)</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
