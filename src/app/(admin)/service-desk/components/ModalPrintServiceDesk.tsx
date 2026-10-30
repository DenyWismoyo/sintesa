// src/app/(admin)/service-desk/components/ModalPrintServiceDesk.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { WorkOrder } from '@/types/serviceDesk.types';
import { buildMaintenanceSpkPdf, buildMaintenanceBastPdf } from '@/lib/pdf/serviceDeskPdf';
import { loadStpLogo } from '@/lib/pdf/stpDocumentKit';
import { stpEmployeeService, StpEmployeeSigner } from '@/services/stpEmployee.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Printer, UserCheck, ShieldCheck, Wrench, Building2, Calendar, FileText, Loader2, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: WorkOrder | null;
  mode?: 'SPK' | 'BAST';
}

export default function ModalPrintServiceDesk({ isOpen, onClose, order, mode = 'SPK' }: Props) {
  const [employees, setEmployees] = useState<StpEmployeeSigner[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form State
  const [docMode, setDocMode] = useState<'SPK' | 'BAST'>(mode);
  const [selectedIssuerId, setSelectedIssuerId] = useState('');
  const [issuerName, setIssuerName] = useState('');
  const [issuerRole, setIssuerRole] = useState('Penanggung Jawab Sarana & Fasilitas STP');
  const [issuerNip, setIssuerNip] = useState('');

  const [selectedTechId, setSelectedTechId] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [technicianRole, setTechnicianRole] = useState('Teknisi Pemeliharaan Lapangan');
  const [technicianPhone, setTechnicianPhone] = useState('');

  const [reporterName, setReporterName] = useState('');
  const [reporterRole, setReporterRole] = useState('Perwakilan Pemohon / Ruangan');

  const [city, setCity] = useState('Surakarta');
  const [signatureDate, setSignatureDate] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    setDocMode(mode);
  }, [mode]);

  useEffect(() => {
    if (isOpen && order) {
      const defaults = stpEmployeeService.getDefaultSigners();
      setIssuerName(defaults.issuerName || 'Pengelola Sarpras STP');
      setIssuerRole(defaults.issuerRole || 'Kasubag Tata Usaha & Sarpras');
      setIssuerNip(defaults.issuerNip || '');

      setTechnicianName(order.technicianName || defaults.technicianName || 'Tim Teknisi STP');
      setTechnicianRole(defaults.technicianRole || 'Teknisi Pemeliharaan');
      setTechnicianPhone(order.technicianPhone || '(0271) 666628');

      setReporterName(order.reporterName || 'Staf / Pengguna Ruangan');
      setCity(defaults.city || 'Surakarta');
      setSignatureDate(new Date().toISOString().slice(0, 10));
      setCustomNotes(order.completionNotes || '');

      setIsLoadingEmployees(true);
      stpEmployeeService
        .getEmployees()
        .then((list) => {
          setEmployees(list);
          const matchTech = list.find(
            (e) => e.nama.toLowerCase() === (order.technicianName || '').toLowerCase()
          );
          if (matchTech) setSelectedTechId(matchTech.id);

          const matchIssuer = list.find(
            (e) => e.jabatan.toLowerCase().includes('sarana') || e.jabatan.toLowerCase().includes('kepala')
          );
          if (matchIssuer) setSelectedIssuerId(matchIssuer.id);
        })
        .finally(() => setIsLoadingEmployees(false));
    }
  }, [isOpen, order]);

  const handleSelectIssuer = (empId: string) => {
    setSelectedIssuerId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setIssuerName(emp.nama);
      if (emp.jabatan) setIssuerRole(emp.jabatan);
      if (emp.nip) setIssuerNip(emp.nip);
    }
  };

  const handleSelectTech = (empId: string) => {
    setSelectedTechId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setTechnicianName(emp.nama);
      if (emp.jabatan) setTechnicianRole(emp.jabatan);
    }
  };

  const handleDownload = async () => {
    if (!order) return;
    setIsGeneratingPdf(true);
    try {
      const logoBase64 = await loadStpLogo();
      const signers = {
        issuerName,
        issuerRole,
        issuerNip,
        technicianName,
        technicianRole,
        technicianPhone,
        reporterName,
        reporterRole,
        city,
        signatureDate,
      };

      const pdf =
        docMode === 'SPK'
          ? buildMaintenanceSpkPdf({ order, logoBase64, signers, customNotes })
          : buildMaintenanceBastPdf({ order, logoBase64, signers, customNotes });

      const fileName = `${docMode}_${order.spkNumber || order.id || 'SD'}.pdf`;
      pdf.save(fileName);
      toast.success(`Dokumen ${docMode} Berhasil Diterbitkan!`, {
        description: `Tersimpan sebagai ${fileName}`,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal membuat dokumen PDF: ' + (err.message || 'Error'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Printer size={18} />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                Cetak Dokumen Resmi Service Desk
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Sesuaikan format dan pejabat penandatangan sebelum mencetak berkas resmi UPTD KST Solo Technopark.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Pilihan Format Dokumen: SPK vs BAST */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setDocMode('SPK')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              docMode === 'SPK'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench size={13} /> Surat Perintah Kerja (SPK)
          </button>
          <button
            type="button"
            onClick={() => setDocMode('BAST')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              docMode === 'BAST'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={13} /> Berita Acara Serah Terima (BAST)
          </button>
        </div>

        <div className="space-y-4 pt-1 text-xs">
          {/* Ringkasan Data Order */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-mono text-blue-600 font-bold">{order.spkNumber}</span>
              <span className="font-bold text-slate-700">{order.priority}</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{order.title}</p>
            <p className="text-slate-500 text-[11px]">
              Aset: {order.assetName} • Lokasi: {order.location}
            </p>
          </div>

          {/* Section: Pejabat Pemberi Tugas (Pihak 1) */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Building2 size={14} className="text-blue-600" />
                Pejabat Pemberi Tugas / Pengelola Fasilitas
              </span>
              <select
                value={selectedIssuerId}
                onChange={(e) => handleSelectIssuer(e.target.value)}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Nama Pejabat</Label>
                <Input
                  value={issuerName}
                  onChange={(e) => setIssuerName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Jabatan Resmi</Label>
                <Input
                  value={issuerRole}
                  onChange={(e) => setIssuerRole(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">NIP / NIK (Opsional)</Label>
                <Input
                  value={issuerNip}
                  onChange={(e) => setIssuerNip(e.target.value)}
                  className="h-8 text-xs mt-1"
                  placeholder="Contoh: 19850215 201001 1 012"
                />
              </div>
            </div>
          </div>

          {/* Section: Teknisi Pelaksana (Pihak 2) */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <UserCheck size={14} className="text-emerald-600" />
                Teknisi Pelaksana Pekerjaan
              </span>
              <select
                value={selectedTechId}
                onChange={(e) => handleSelectTech(e.target.value)}
                className="text-[11px] h-7 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="">-- Pilih dari Teknisi STP --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Nama Teknisi</Label>
                <Input
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">Jabatan / Spesialisasi</Label>
                <Input
                  value={technicianRole}
                  onChange={(e) => setTechnicianRole(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-slate-700">No. Kontak / WA</Label>
                <Input
                  value={technicianPhone}
                  onChange={(e) => setTechnicianPhone(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Jika Mode BAST: Tambah Form Pihak Penerima Hasil */}
          {docMode === 'BAST' && (
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <ShieldCheck size={14} className="text-indigo-600" />
                Pihak Penerima Fasilitas (Pengguna / Pelapor)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">Nama Penerima</Label>
                  <Input
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">Jabatan / Instansi</Label>
                  <Input
                    value={reporterRole}
                    onChange={(e) => setReporterRole(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tempat, Tanggal, & Catatan */}
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
              <Label className="text-[11px] font-bold text-slate-700">Tanggal Dokumen</Label>
              <Input
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-bold text-slate-700">Catatan Khusus / Hasil Uji (Opsional)</Label>
            <Input
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Contoh: AC telah dibersihkan dan suhu stabil di 20°C."
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs gap-1.5 shadow-xs"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Memproses Dokumen...</span>
              </>
            ) : (
              <>
                <Printer size={13} />
                <span>Cetak & Unduh Dokumen {docMode}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

