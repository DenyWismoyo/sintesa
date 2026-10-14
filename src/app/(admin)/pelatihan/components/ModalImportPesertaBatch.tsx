'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { TrainingBatch } from '@/types';
import { toast } from 'sonner';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModalImportPesertaBatchProps {
  isOpen: boolean;
  onClose: () => void;
  batches: TrainingBatch[];
  selectedBatchId?: string;
  onImport: (batchId: string, batchNumber: number, participants: any[]) => Promise<any>;
}

export default function ModalImportPesertaBatch({
  isOpen,
  onClose,
  batches,
  selectedBatchId: initialBatchId,
  onImport,
}: ModalImportPesertaBatchProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || batches[0]?.id || ''
  );
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        nama_lengkap: 'Budi Santoso',
        nik: '3372011204990001',
        email: 'budi.santoso@email.com',
        nomor_whatsapp: '081234567890',
        asal_instansi: 'SMK Negeri 2 Surakarta',
        jalur_pendanaan: 'BEASISWA_PEMKOT',
        catatan: 'Program Vokasi Industri Manufaktur',
      },
      {
        nama_lengkap: 'Siti Rahmawati',
        nik: '3372025608010002',
        email: 'siti.rahmawati@email.com',
        nomor_whatsapp: '085712345678',
        asal_instansi: 'Dinas Tenaga Kerja Kota Surakarta',
        jalur_pendanaan: 'PARTNER_DINAS',
        catatan: 'Rombongan Pelatihan Kerja 2026',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Peserta_STP');
    XLSX.writeFile(wb, 'template-import-peserta-batch-stp.xlsx');
    toast.success('Template Excel berhasil diunduh');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          toast.error('File Excel kosong atau format tidak sesuai');
          setParsedData([]);
          return;
        }

        // Normalisasi data
        const normalized = rawJson.map((row) => {
          const name = row.nama_lengkap || row.nama || row.Name || row.name || '';
          const nik = String(row.nik || row.NIK || '').trim();
          const email = (row.email || row.Email || row.email_address || '').toLowerCase().trim();
          const phone = String(row.nomor_whatsapp || row.no_wa || row.phone || row.telepon || '').trim();
          const origin = row.asal_instansi || row.instansi || row.sekolah || 'Solo Technopark';
          const scheme = row.jalur_pendanaan || 'PARTNER_DINAS';

          return {
            name,
            nik,
            email,
            phone,
            origin,
            registrationSource: scheme,
            customData: {
              nik,
              catatan: row.catatan || '',
            },
          };
        }).filter((item) => item.name && (item.email || item.phone));

        setParsedData(normalized);
        toast.success(`Berhasil membaca ${normalized.length} calon peserta dari Excel`);
      } catch (err: any) {
        console.error('Error parsing excel:', err);
        toast.error('Gagal memproses file Excel', { description: err.message });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (!currentBatch) {
      toast.error('Silakan pilih batch pelatihan terlebih dahulu');
      return;
    }
    if (parsedData.length === 0) {
      toast.error('Belum ada data peserta yang siap diimpor');
      return;
    }

    setIsSubmitting(true);
    try {
      await onImport(currentBatch.id, currentBatch.batchNumber, parsedData);
      onClose();
    } catch (err) {
      // Error ditangani oleh mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Bulk Import Peserta Batch (Excel)</h2>
              <p className="text-xs text-slate-400">
                Pendaftaran rombongan dinas, SMK mitra, CSR, atau rekap peserta offline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Pilih Batch Target */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Batch Pelatihan Target:
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch {b.batchNumber} ({b.year}) — {b.title} [Sisa Kuota: {Math.max(0, b.quota - b.registeredCount)}]
                </option>
              ))}
            </select>
          </div>

          {/* Unduh Template & Upload Area */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <p className="font-bold text-slate-800">Format Spreadsheet Resmi STP</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pastikan nama kolom sesuai template: nama_lengkap, nik, email, nomor_whatsapp, asal_instansi.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="rounded-xl border-slate-300 shrink-0 text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Unduh Template .xlsx</span>
            </Button>
          </div>

          {/* Dropzone File */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white hover:bg-blue-50/20"
            >
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                {fileName ? fileName : 'Klik untuk memilih file spreadsheet (.xlsx / .csv)'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Maksimal 200 baris peserta per import</p>
            </div>
          </div>

          {/* Preview Tabel Peserta */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  Preview Calon Peserta ({parsedData.length} orang)
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Siap Diimpor</Badge>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100/90 text-slate-600 sticky top-0 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Nama</th>
                      <th className="p-2.5">NIK</th>
                      <th className="p-2.5">Email / No WA</th>
                      <th className="p-2.5">Instansi Asal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-2 font-semibold text-slate-800">{row.name}</td>
                        <td className="p-2 font-mono text-[11px] text-slate-600">{row.nik || '-'}</td>
                        <td className="p-2 text-slate-500">
                          <div>{row.email}</div>
                          <div className="text-[10px] text-slate-400">{row.phone}</div>
                        </td>
                        <td className="p-2 text-slate-600 truncate max-w-[140px]">{row.origin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 15 && (
                <p className="text-[10px] text-slate-400 text-right">
                  Menampilkan 15 dari {parsedData.length} data peserta
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl text-xs">
            Batal
          </Button>
          <Button
            type="button"
            disabled={parsedData.length === 0 || isSubmitting || isProcessing}
            onClick={handleSubmit}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses Ingestion...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Import {parsedData.length} Peserta ke Batch</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
