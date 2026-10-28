// src/app/(admin)/manajemen-karir/components/ModalExportPartnership.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckSquare,
  Square,
  Globe2,
  Building2,
  MapPin,
  GraduationCap,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { JobListing } from '@/types/job.types';
import {
  CAREER_EXPORT_COLUMNS,
  CareerExportOptions,
  ExportFormat,
  ExportScope,
  exportToCsv,
  exportToPdf,
  exportToXlsx,
  filterJobsForExport,
} from '@/services/careerExport.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allJobs: JobListing[];
  currentFilteredJobs: JobListing[];
  selectedJobIds: string[];
}

export default function ModalExportPartnership({
  isOpen,
  onClose,
  allJobs,
  currentFilteredJobs,
  selectedJobIds,
}: Props) {
  // State Cakupan Data
  const [scope, setScope] = useState<ExportScope>(() =>
    selectedJobIds.length > 0 ? 'SELECTED_ROWS' : 'CURRENT_FILTER'
  );

  // State Format Dokumen
  const [format, setFormat] = useState<ExportFormat>('XLSX');

  // State Pilihan Kolom
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() =>
    CAREER_EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key)
  );

  // State Kustomisasi Dokumen PDF Kemitraan
  const [documentTitle, setDocumentTitle] = useState(
    'LAPORAN PEMETAAN KEBUTUHAN INDUSTRI & PROSPEK KEMITRAAN PENYALURAN ALUMNI'
  );
  const [signerName, setSignerName] = useState('Tim Kemitraan Industri STP');
  const [signerRole, setSignerRole] = useState(
    'Divisi Kemitraan Industri & Penyaluran Talenta Solo Technopark'
  );
  const [signerNip, setSignerNip] = useState('');
  const [city, setCity] = useState('Surakarta');

  const [isExporting, setIsExporting] = useState(false);

  // Sinkronkan scope jika selectedJobIds berubah
  React.useEffect(() => {
    if (selectedJobIds.length > 0) {
      setScope('SELECTED_ROWS');
    } else if (scope === 'SELECTED_ROWS') {
      setScope('CURRENT_FILTER');
    }
  }, [selectedJobIds.length]);

  // Kalkulasi data yang akan diekspor secara realtime
  const previewJobs = useMemo(() => {
    const options: CareerExportOptions = {
      scope,
      format,
      selectedColumns,
    };
    return filterJobsForExport(allJobs, currentFilteredJobs, selectedJobIds, options);
  }, [allJobs, currentFilteredJobs, selectedJobIds, scope, format, selectedColumns]);

  // Toggle pilihan kolom
  const handleToggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(CAREER_EXPORT_COLUMNS.map((c) => c.key));
  };

  const handleResetDefaultColumns = () => {
    setSelectedColumns(
      CAREER_EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key)
    );
  };

  // Eksekusi Ekspor
  const handleExecuteExport = async () => {
    if (previewJobs.length === 0) {
      toast.error('Tidak ada data lowongan yang sesuai kriteria untuk diekspor.');
      return;
    }
    if (selectedColumns.length === 0) {
      toast.error('Pilih setidaknya satu kolom yang ingin disertakan.');
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'XLSX') {
        exportToXlsx(previewJobs, selectedColumns);
        toast.success(
          `Berhasil mengekspor ${previewJobs.length} lowongan ke format Microsoft Excel (.xlsx)!`
        );
      } else if (format === 'CSV') {
        exportToCsv(previewJobs, selectedColumns);
        toast.success(
          `Berhasil mengunduh ${previewJobs.length} lowongan ke spreadsheet CSV!`
        );
      } else if (format === 'PDF') {
        toast.info('Menyusun tata letak dokumen resmi kemitraan STP (PDF)...');
        await exportToPdf(previewJobs, selectedColumns, {
          title: documentTitle,
          signerName,
          signerRole,
          signerNip,
          city,
        });
        toast.success(
          `Dokumen resmi kemitraan berhasil digenerate (${previewJobs.length} lowongan)!`
        );
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900">
                Ekspor Data Peluang Kemitraan & Penyaluran Alumni
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Siapkan dokumen rekapitulasi kebutuhan industri untuk penjajakan MoU, magang, dan penyerapan alumni STP di dalam maupun luar negeri.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* ─── 1. Cakupan Data Lowongan ─── */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>1. Cakupan Data yang Ingin Diekspor</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {previewJobs.length} Lowongan Terpilih
              </span>
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('CURRENT_FILTER')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  scope === 'CURRENT_FILTER'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <Filter className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold">Sesuai Filter Aktif</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {currentFilteredJobs.length} lowongan hasil pencarian saat ini
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={selectedJobIds.length === 0}
                onClick={() => setScope('SELECTED_ROWS')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  selectedJobIds.length === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50'
                    : scope === 'SELECTED_ROWS'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold">Hanya Baris Tercentang</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {selectedJobIds.length > 0
                      ? `${selectedJobIds.length} lowongan yang Anda pilih dari tabel`
                      : 'Centang kotak di tabel untuk mengaktifkan'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('INTERNATIONAL')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  scope === 'INTERNATIONAL'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <Globe2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold">Peluang Luar Negeri (Global)</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Fokus peluang industri internasional / migran bersertifikasi
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('SOLO_RAYA')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  scope === 'SOLO_RAYA'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold">Solo Raya & Sekitarnya (Lokal)</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Industri mitra kawasan lokal Surakarta & sekitarnya
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ─── 2. Pilihan Format Ekspor ─── */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-800">
              2. Pilih Format Dokumen yang Diinginkan
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('XLSX')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  format === 'XLSX'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <span className="text-xs font-bold">Microsoft Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-500">Tabel Rapi & Auto-Column</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('PDF')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  format === 'PDF'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <FileText className="w-6 h-6 text-rose-600" />
                <span className="text-xs font-bold">Dokumen Resmi (.pdf)</span>
                <span className="text-[10px] text-slate-500">Kop STP & Siap Rapat</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('CSV')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  format === 'CSV'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <Download className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-bold">Spreadsheet CSV</span>
                <span className="text-[10px] text-slate-500">Encoding UTF-8 BOM</span>
              </button>
            </div>
          </div>

          {/* ─── 3. Kustomisasi Kolom yang Disertakan ─── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800">
                3. Kustomisasi Kolom Dokumen ({selectedColumns.length} Kolom Terpilih)
              </Label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  className="text-emerald-700 hover:underline font-bold"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleResetDefaultColumns}
                  className="text-slate-500 hover:underline"
                >
                  Reset Default
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 max-h-48 overflow-y-auto space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CAREER_EXPORT_COLUMNS.map((col) => {
                  const isChecked = selectedColumns.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      onClick={() => handleToggleColumn(col.key)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="truncate">{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── 4. Kustomisasi Khusus Dokumen PDF Kemitraan ─── */}
          {format === 'PDF' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border border-emerald-200/70 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">
                  Kustomisasi Kop & Lembar Penandatanganan Dokumen STP
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Judul Dokumen</Label>
                  <Input
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Nama Pejabat / Pengusul STP</Label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Contoh: Tim Kemitraan Industri STP"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Jabatan Penandatangan</Label>
                  <Input
                    value={signerRole}
                    onChange={(e) => setSignerRole(e.target.value)}
                    placeholder="Contoh: Divisi Kemitraan & Penyaluran Talenta"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">NIP / Identitas (Opsional)</Label>
                  <Input
                    value={signerNip}
                    onChange={(e) => setSignerNip(e.target.value)}
                    placeholder="Contoh: 19850101 201012 1 001"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Kota Dokumen</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-slate-500 text-left">
            Total <span className="font-bold text-slate-900">{previewJobs.length}</span> lowongan siap diekspor ke format <span className="font-bold text-emerald-700">{format}</span>.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isExporting}
              className="rounded-xl h-10 px-4 text-xs font-semibold"
            >
              Batal
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleExecuteExport}
              disabled={isExporting || previewJobs.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 px-5 text-xs gap-2 shadow-sm shadow-emerald-200"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Ekspor...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen {format}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
